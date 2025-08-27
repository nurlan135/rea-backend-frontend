#!/bin/bash

# REA INVEST Deployment Script
# This script handles the deployment process for the REA INVEST application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="rea-invest"
DEPLOYMENT_ENV=${1:-staging}
DOCKER_COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR="/backups/rea-invest"
LOG_FILE="/var/log/rea-invest-deploy.log"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if user is in docker group
    if ! groups $USER | grep -q docker; then
        error "User $USER is not in the docker group. Please add user to docker group and re-login."
    fi
    
    # Check if environment file exists
    if [[ ! -f ".env.${DEPLOYMENT_ENV}" ]]; then
        error "Environment file .env.${DEPLOYMENT_ENV} not found"
    fi
    
    log "Prerequisites check passed"
}

# Create backup
create_backup() {
    log "Creating backup..."
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Backup timestamp
    BACKUP_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_PATH="$BACKUP_DIR/backup_$BACKUP_TIMESTAMP"
    
    mkdir -p "$BACKUP_PATH"
    
    # Backup database
    if docker-compose ps | grep -q postgres; then
        info "Backing up database..."
        docker-compose exec -T postgres pg_dump -U postgres rea_invest_prod > "$BACKUP_PATH/database.sql"
    fi
    
    # Backup uploads
    if [[ -d "./backend/uploads" ]]; then
        info "Backing up uploads..."
        cp -r ./backend/uploads "$BACKUP_PATH/"
    fi
    
    # Backup configuration
    info "Backing up configuration..."
    cp .env.${DEPLOYMENT_ENV} "$BACKUP_PATH/env_backup"
    
    # Compress backup
    tar -czf "$BACKUP_PATH.tar.gz" -C "$BACKUP_DIR" "backup_$BACKUP_TIMESTAMP"
    rm -rf "$BACKUP_PATH"
    
    log "Backup created at $BACKUP_PATH.tar.gz"
}

# Pull latest code
pull_latest_code() {
    log "Pulling latest code from repository..."
    
    # Stash any local changes
    if git status --porcelain | grep -q .; then
        warn "Local changes detected. Stashing them..."
        git stash
    fi
    
    # Pull latest changes
    git pull origin main
    
    log "Code updated successfully"
}

# Build and deploy
deploy_application() {
    log "Starting deployment for $DEPLOYMENT_ENV environment..."
    
    # Copy environment file
    cp ".env.${DEPLOYMENT_ENV}" .env
    
    # Pull latest images
    info "Pulling latest Docker images..."
    docker-compose pull
    
    # Build custom images
    info "Building application images..."
    docker-compose build --no-cache
    
    # Run database migrations
    info "Running database migrations..."
    docker-compose run --rm backend npm run migrate
    
    # Start services
    info "Starting services..."
    docker-compose up -d
    
    # Wait for services to be ready
    info "Waiting for services to be ready..."
    sleep 30
    
    # Health check
    health_check
    
    log "Deployment completed successfully"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    # Check backend health
    info "Checking backend health..."
    for i in {1..30}; do
        if curl -f http://localhost:8000/health > /dev/null 2>&1; then
            log "Backend is healthy"
            break
        fi
        if [[ $i -eq 30 ]]; then
            error "Backend health check failed after 30 attempts"
        fi
        sleep 2
    done
    
    # Check frontend health
    info "Checking frontend health..."
    for i in {1..30}; do
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            log "Frontend is healthy"
            break
        fi
        if [[ $i -eq 30 ]]; then
            error "Frontend health check failed after 30 attempts"
        fi
        sleep 2
    done
    
    # Check database connection
    info "Checking database connection..."
    if docker-compose exec -T backend node -e "require('./database.js').raw('SELECT 1').then(() => console.log('DB OK')).catch(() => process.exit(1))" > /dev/null 2>&1; then
        log "Database connection is healthy"
    else
        error "Database connection check failed"
    fi
    
    log "All health checks passed"
}

# Rollback function
rollback() {
    warn "Starting rollback process..."
    
    # Find latest backup
    LATEST_BACKUP=$(ls -t $BACKUP_DIR/backup_*.tar.gz 2>/dev/null | head -n1)
    
    if [[ -z "$LATEST_BACKUP" ]]; then
        error "No backup found for rollback"
    fi
    
    log "Rolling back to backup: $LATEST_BACKUP"
    
    # Stop current services
    docker-compose down
    
    # Extract backup
    BACKUP_EXTRACT_DIR="/tmp/rea_invest_rollback_$(date +%s)"
    mkdir -p "$BACKUP_EXTRACT_DIR"
    tar -xzf "$LATEST_BACKUP" -C "$BACKUP_EXTRACT_DIR"
    
    # Restore database
    if [[ -f "$BACKUP_EXTRACT_DIR"/*/database.sql ]]; then
        info "Restoring database..."
        docker-compose up -d postgres
        sleep 10
        docker-compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS rea_invest_prod;"
        docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE rea_invest_prod;"
        cat "$BACKUP_EXTRACT_DIR"/*/database.sql | docker-compose exec -T postgres psql -U postgres rea_invest_prod
    fi
    
    # Restore uploads
    if [[ -d "$BACKUP_EXTRACT_DIR"/*/uploads ]]; then
        info "Restoring uploads..."
        rm -rf ./backend/uploads
        cp -r "$BACKUP_EXTRACT_DIR"/*/uploads ./backend/
    fi
    
    # Start services
    docker-compose up -d
    
    # Cleanup
    rm -rf "$BACKUP_EXTRACT_DIR"
    
    log "Rollback completed"
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Keep only last 7 backups
    find "$BACKUP_DIR" -name "backup_*.tar.gz" -type f -mtime +7 -delete
    
    log "Backup cleanup completed"
}

# Display usage
usage() {
    echo "Usage: $0 [ENVIRONMENT] [COMMAND]"
    echo ""
    echo "ENVIRONMENT:"
    echo "  staging      Deploy to staging environment (default)"
    echo "  production   Deploy to production environment"
    echo ""
    echo "COMMAND:"
    echo "  deploy       Deploy application (default)"
    echo "  rollback     Rollback to previous backup"
    echo "  backup       Create backup only"
    echo "  health       Run health check only"
    echo ""
    echo "Examples:"
    echo "  $0                          # Deploy to staging"
    echo "  $0 production deploy        # Deploy to production"
    echo "  $0 production rollback      # Rollback production"
    echo "  $0 staging backup           # Create staging backup"
}

# Main execution
main() {
    local command=${2:-deploy}
    
    # Show usage if help requested
    if [[ "$1" == "--help" || "$1" == "-h" ]]; then
        usage
        exit 0
    fi
    
    # Validate environment
    if [[ "$DEPLOYMENT_ENV" != "staging" && "$DEPLOYMENT_ENV" != "production" ]]; then
        error "Invalid environment: $DEPLOYMENT_ENV. Use 'staging' or 'production'"
    fi
    
    log "Starting REA INVEST deployment script"
    log "Environment: $DEPLOYMENT_ENV"
    log "Command: $command"
    
    # Safety check for production
    if [[ "$DEPLOYMENT_ENV" == "production" ]]; then
        echo -e "${YELLOW}WARNING: You are about to deploy to PRODUCTION environment!${NC}"
        echo -e "${YELLOW}This action will affect the live system.${NC}"
        read -p "Are you sure you want to continue? (yes/no): " confirm
        if [[ "$confirm" != "yes" ]]; then
            error "Production deployment cancelled by user"
        fi
    fi
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Check prerequisites
    check_root
    check_prerequisites
    
    # Execute command
    case "$command" in
        "deploy")
            pull_latest_code
            create_backup
            deploy_application
            cleanup_backups
            ;;
        "rollback")
            rollback
            ;;
        "backup")
            create_backup
            ;;
        "health")
            health_check
            ;;
        *)
            error "Invalid command: $command"
            usage
            exit 1
            ;;
    esac
    
    log "REA INVEST deployment script completed successfully"
}

# Trap signals for cleanup
trap 'error "Deployment interrupted by signal"' INT TERM

# Run main function
main "$@"