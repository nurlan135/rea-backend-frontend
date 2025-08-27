#!/bin/bash

# REA INVEST Automated Backup Script
# This script creates comprehensive backups of the application

set -e

# Configuration
BACKUP_DIR="/backups/rea-invest"
RETENTION_DAYS=30
REMOTE_BACKUP_ENABLED=false
REMOTE_BACKUP_PATH=""
S3_BUCKET=""
COMPRESSION_LEVEL=6

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$BACKUP_LOG"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$BACKUP_LOG"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$BACKUP_LOG"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$BACKUP_LOG"
}

# Create backup directory structure
create_backup_structure() {
    local backup_path=$1
    
    mkdir -p "$backup_path"/{database,files,config,logs,code}
    log "Backup directory structure created: $backup_path"
}

# Backup database
backup_database() {
    local backup_path=$1
    
    info "Starting database backup..."
    
    # Check if database container is running
    if ! docker-compose ps | grep -q postgres; then
        warn "PostgreSQL container is not running. Starting it..."
        docker-compose up -d postgres
        sleep 10
    fi
    
    # Create database dump
    docker-compose exec -T postgres pg_dump \
        -U postgres \
        -h localhost \
        -p 5432 \
        --verbose \
        --clean \
        --no-owner \
        --no-privileges \
        rea_invest_prod > "$backup_path/database/database_full.sql"
    
    # Create schema-only backup
    docker-compose exec -T postgres pg_dump \
        -U postgres \
        -h localhost \
        -p 5432 \
        --schema-only \
        --verbose \
        rea_invest_prod > "$backup_path/database/schema_only.sql"
    
    # Create data-only backup
    docker-compose exec -T postgres pg_dump \
        -U postgres \
        -h localhost \
        -p 5432 \
        --data-only \
        --verbose \
        rea_invest_prod > "$backup_path/database/data_only.sql"
    
    # Backup database statistics
    docker-compose exec -T postgres psql -U postgres -d rea_invest_prod -c "
        SELECT 
            schemaname,
            tablename,
            attname,
            n_distinct,
            correlation
        FROM pg_stats 
        WHERE schemaname = 'public'
        ORDER BY tablename, attname;
    " > "$backup_path/database/table_stats.sql"
    
    log "Database backup completed"
}

# Backup files
backup_files() {
    local backup_path=$1
    
    info "Starting file backup..."
    
    # Backup uploads directory
    if [[ -d "./backend/uploads" ]]; then
        cp -r ./backend/uploads "$backup_path/files/"
        log "Uploaded files backed up"
    fi
    
    # Backup SSL certificates
    if [[ -d "./nginx/ssl" ]]; then
        cp -r ./nginx/ssl "$backup_path/files/"
        log "SSL certificates backed up"
    fi
    
    # Backup static assets
    if [[ -d "./frontend/public" ]]; then
        cp -r ./frontend/public "$backup_path/files/frontend_public"
        log "Frontend static files backed up"
    fi
    
    # Backup generated files
    if [[ -d "./frontend/.next" ]]; then
        cp -r ./frontend/.next "$backup_path/files/frontend_build"
        log "Frontend build files backed up"
    fi
    
    log "File backup completed"
}

# Backup configuration
backup_configuration() {
    local backup_path=$1
    
    info "Starting configuration backup..."
    
    # Backup environment files (excluding sensitive data)
    find . -name ".env*" -type f -exec sh -c '
        file="$1"
        basename=$(basename "$file")
        # Remove sensitive values but keep structure
        sed "s/=.*/=***REDACTED***/" "$file" > "'"$backup_path"'/config/'"$basename"'.template"
    ' _ {} \;
    
    # Backup Docker configurations
    cp docker-compose*.yml "$backup_path/config/" 2>/dev/null || true
    cp */Dockerfile "$backup_path/config/" 2>/dev/null || true
    
    # Backup Nginx configuration
    if [[ -f "./nginx/nginx.conf" ]]; then
        cp ./nginx/nginx.conf "$backup_path/config/"
    fi
    
    # Backup Kubernetes configurations
    if [[ -d "./kubernetes" ]]; then
        cp -r ./kubernetes "$backup_path/config/"
    fi
    
    # Backup monitoring configurations
    if [[ -d "./monitoring" ]]; then
        cp -r ./monitoring "$backup_path/config/"
    fi
    
    log "Configuration backup completed"
}

# Backup logs
backup_logs() {
    local backup_path=$1
    
    info "Starting log backup..."
    
    # Application logs
    if [[ -d "./backend/logs" ]]; then
        cp -r ./backend/logs "$backup_path/logs/backend"
    fi
    
    # Nginx logs
    if [[ -d "./nginx/logs" ]]; then
        cp -r ./nginx/logs "$backup_path/logs/nginx"
    fi
    
    # Docker logs
    mkdir -p "$backup_path/logs/docker"
    docker-compose logs --no-color > "$backup_path/logs/docker/docker-compose.log" 2>/dev/null || true
    
    # System logs (last 1000 lines)
    if [[ -f "/var/log/syslog" ]]; then
        tail -1000 /var/log/syslog > "$backup_path/logs/system.log" 2>/dev/null || true
    fi
    
    log "Log backup completed"
}

# Backup source code
backup_code() {
    local backup_path=$1
    
    info "Starting source code backup..."
    
    # Create git bundle (includes all history)
    if [[ -d ".git" ]]; then
        git bundle create "$backup_path/code/repository.bundle" --all
        
        # Save current git status
        git status > "$backup_path/code/git_status.txt"
        git log --oneline -n 50 > "$backup_path/code/recent_commits.txt"
        git remote -v > "$backup_path/code/remotes.txt"
        
        log "Git repository backed up"
    fi
    
    # Backup package files
    find . -name "package*.json" -type f -exec cp {} "$backup_path/code/" \;
    
    # Backup lock files
    find . -name "*lock*" -type f -exec cp {} "$backup_path/code/" \; 2>/dev/null || true
    
    log "Source code backup completed"
}

# Create backup manifest
create_manifest() {
    local backup_path=$1
    local backup_name=$2
    
    info "Creating backup manifest..."
    
    cat > "$backup_path/MANIFEST.txt" << EOF
REA INVEST Backup Manifest
========================

Backup Name: $backup_name
Created: $(date)
Created By: $(whoami)@$(hostname)
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "N/A")
Git Branch: $(git branch --show-current 2>/dev/null || echo "N/A")

System Information:
- OS: $(uname -a)
- Docker Version: $(docker --version)
- Docker Compose Version: $(docker-compose --version)

Backup Contents:
- Database: Full dump, schema, data, statistics
- Files: Uploads, SSL certificates, static assets
- Configuration: Environment templates, Docker configs
- Logs: Application, system, Docker logs
- Code: Git bundle, package files

Directory Structure:
$(find "$backup_path" -type f | head -20)

Backup Size: $(du -sh "$backup_path" | cut -f1)
File Count: $(find "$backup_path" -type f | wc -l)

Notes:
- Sensitive data has been redacted from environment files
- Database passwords and secrets are not included
- SSL private keys are included (handle with care)
EOF
    
    log "Backup manifest created"
}

# Compress backup
compress_backup() {
    local backup_path=$1
    local backup_name=$2
    
    info "Compressing backup..."
    
    cd "$(dirname "$backup_path")"
    tar -cf - "$backup_name" | gzip -"$COMPRESSION_LEVEL" > "${backup_name}.tar.gz"
    
    # Verify compression
    if [[ -f "${backup_name}.tar.gz" ]]; then
        local original_size=$(du -sb "$backup_name" | cut -f1)
        local compressed_size=$(du -sb "${backup_name}.tar.gz" | cut -f1)
        local compression_ratio=$(echo "scale=1; $compressed_size * 100 / $original_size" | bc)
        
        log "Backup compressed: $compression_ratio% of original size"
        
        # Remove uncompressed backup
        rm -rf "$backup_name"
        
        echo "${backup_name}.tar.gz"
    else
        error "Backup compression failed"
    fi
}

# Upload to remote storage
upload_to_remote() {
    local backup_file=$1
    
    if [[ "$REMOTE_BACKUP_ENABLED" != "true" ]]; then
        return 0
    fi
    
    info "Uploading backup to remote storage..."
    
    # S3 Upload
    if [[ -n "$S3_BUCKET" ]]; then
        if command -v aws &> /dev/null; then
            aws s3 cp "$backup_file" "s3://$S3_BUCKET/backups/$(basename "$backup_file")"
            log "Backup uploaded to S3: s3://$S3_BUCKET/backups/$(basename "$backup_file")"
        else
            warn "AWS CLI not found. Skipping S3 upload."
        fi
    fi
    
    # SFTP/SCP Upload
    if [[ -n "$REMOTE_BACKUP_PATH" ]]; then
        if command -v scp &> /dev/null; then
            scp "$backup_file" "$REMOTE_BACKUP_PATH"
            log "Backup uploaded via SCP: $REMOTE_BACKUP_PATH"
        else
            warn "SCP not found. Skipping remote upload."
        fi
    fi
}

# Clean old backups
cleanup_old_backups() {
    info "Cleaning up old backups..."
    
    find "$BACKUP_DIR" -name "rea_invest_backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    local remaining_count=$(find "$BACKUP_DIR" -name "rea_invest_backup_*.tar.gz" | wc -l)
    log "Cleanup completed. Remaining backups: $remaining_count"
}

# Verify backup integrity
verify_backup() {
    local backup_file=$1
    
    info "Verifying backup integrity..."
    
    # Test gzip integrity
    if gzip -t "$backup_file"; then
        log "Backup file integrity verified"
    else
        error "Backup file is corrupted"
    fi
    
    # Test tar content
    if tar -tzf "$backup_file" >/dev/null; then
        log "Backup archive structure verified"
    else
        error "Backup archive is corrupted"
    fi
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    # Email notification (if configured)
    if command -v mail &> /dev/null && [[ -n "$NOTIFICATION_EMAIL" ]]; then
        echo "$message" | mail -s "REA INVEST Backup $status" "$NOTIFICATION_EMAIL"
    fi
    
    # Slack notification (if configured)
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data '{"text":"REA INVEST Backup '"$status"': '"$message"'"}' \
            "$SLACK_WEBHOOK" >/dev/null 2>&1 || true
    fi
}

# Main backup function
create_backup() {
    local backup_timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_name="rea_invest_backup_$backup_timestamp"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    # Create backup log
    BACKUP_LOG="$BACKUP_DIR/backup_${backup_timestamp}.log"
    mkdir -p "$BACKUP_DIR"
    
    log "Starting REA INVEST backup: $backup_name"
    
    # Create backup structure
    create_backup_structure "$backup_path"
    
    # Perform backups
    backup_database "$backup_path"
    backup_files "$backup_path"
    backup_configuration "$backup_path"
    backup_logs "$backup_path"
    backup_code "$backup_path"
    
    # Create manifest
    create_manifest "$backup_path" "$backup_name"
    
    # Compress backup
    local backup_file=$(compress_backup "$backup_path" "$backup_name")
    local full_backup_path="$BACKUP_DIR/$backup_file"
    
    # Verify backup
    verify_backup "$full_backup_path"
    
    # Upload to remote storage
    upload_to_remote "$full_backup_path"
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Success notification
    local backup_size=$(du -sh "$full_backup_path" | cut -f1)
    local success_message="Backup completed successfully. Size: $backup_size, Location: $full_backup_path"
    
    log "$success_message"
    send_notification "SUCCESS" "$success_message"
    
    echo "$full_backup_path"
}

# Restore from backup
restore_backup() {
    local backup_file=$1
    
    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
    fi
    
    log "Starting restore from backup: $backup_file"
    
    # Verify backup integrity
    verify_backup "$backup_file"
    
    # Extract backup
    local restore_dir="/tmp/rea_invest_restore_$(date +%s)"
    mkdir -p "$restore_dir"
    tar -xzf "$backup_file" -C "$restore_dir"
    
    # Find extracted directory
    local backup_content_dir=$(find "$restore_dir" -maxdepth 1 -type d -name "rea_invest_backup_*" | head -1)
    
    if [[ -z "$backup_content_dir" ]]; then
        error "Could not find backup content in extracted archive"
    fi
    
    # Restore database
    if [[ -f "$backup_content_dir/database/database_full.sql" ]]; then
        warn "Restoring database will overwrite existing data!"
        read -p "Are you sure you want to continue? (yes/no): " confirm
        if [[ "$confirm" == "yes" ]]; then
            info "Restoring database..."
            
            # Stop application
            docker-compose down
            
            # Start only database
            docker-compose up -d postgres
            sleep 10
            
            # Drop and recreate database
            docker-compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS rea_invest_prod;"
            docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE rea_invest_prod;"
            
            # Restore database
            cat "$backup_content_dir/database/database_full.sql" | docker-compose exec -T postgres psql -U postgres rea_invest_prod
            
            log "Database restored successfully"
        else
            info "Database restore skipped"
        fi
    fi
    
    # Restore files
    if [[ -d "$backup_content_dir/files/uploads" ]]; then
        info "Restoring uploaded files..."
        rm -rf ./backend/uploads
        cp -r "$backup_content_dir/files/uploads" ./backend/
        log "Uploaded files restored"
    fi
    
    # Cleanup
    rm -rf "$restore_dir"
    
    log "Restore completed successfully"
}

# List available backups
list_backups() {
    log "Available backups:"
    
    if [[ -d "$BACKUP_DIR" ]]; then
        find "$BACKUP_DIR" -name "rea_invest_backup_*.tar.gz" -printf "%T@ %Tc %p\n" | sort -n | while read timestamp date time timezone file; do
            local size=$(du -sh "$file" | cut -f1)
            echo "  $(basename "$file") - $date $time ($size)"
        done
    else
        info "No backup directory found"
    fi
}

# Show usage
usage() {
    echo "REA INVEST Backup Management Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  backup                 Create a new backup"
    echo "  restore FILE           Restore from backup file"
    echo "  list                   List available backups"
    echo "  cleanup                Clean old backups"
    echo "  verify FILE            Verify backup integrity"
    echo ""
    echo "Options:"
    echo "  --retention-days N     Keep backups for N days (default: 30)"
    echo "  --compression-level N  Compression level 1-9 (default: 6)"
    echo "  --remote-backup        Enable remote backup upload"
    echo ""
    echo "Examples:"
    echo "  $0 backup"
    echo "  $0 restore /backups/rea-invest/rea_invest_backup_20240101_120000.tar.gz"
    echo "  $0 list"
    echo "  $0 cleanup"
}

# Main execution
main() {
    local command=${1:-backup}
    
    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --retention-days)
                RETENTION_DAYS="$2"
                shift 2
                ;;
            --compression-level)
                COMPRESSION_LEVEL="$2"
                shift 2
                ;;
            --remote-backup)
                REMOTE_BACKUP_ENABLED=true
                shift
                ;;
            --help|-h)
                usage
                exit 0
                ;;
            *)
                break
                ;;
        esac
    done
    
    case "$command" in
        "backup")
            create_backup
            ;;
        "restore")
            if [[ -z "$2" ]]; then
                error "Backup file path required for restore"
            fi
            restore_backup "$2"
            ;;
        "list")
            list_backups
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        "verify")
            if [[ -z "$2" ]]; then
                error "Backup file path required for verification"
            fi
            verify_backup "$2"
            ;;
        *)
            error "Invalid command: $command"
            usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"