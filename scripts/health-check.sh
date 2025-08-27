#!/bin/bash

# REA INVEST Health Check Script
# Comprehensive system health monitoring and diagnostics

set -e

# Configuration
HEALTH_LOG="/var/log/rea-invest-health.log"
ALERT_THRESHOLDS=(
    "CPU_THRESHOLD=80"
    "MEMORY_THRESHOLD=85"
    "DISK_THRESHOLD=90"
    "RESPONSE_TIME_THRESHOLD=2000"
    "ERROR_RATE_THRESHOLD=5"
)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Icons
CHECK="✓"
WARN="⚠"
ERROR="✗"
INFO="ℹ"

# Status tracking
OVERALL_STATUS="HEALTHY"
ISSUES_FOUND=0
WARNINGS_FOUND=0

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$HEALTH_LOG"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] $ERROR $1${NC}" | tee -a "$HEALTH_LOG"
    OVERALL_STATUS="CRITICAL"
    ((ISSUES_FOUND++))
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] $WARN $1${NC}" | tee -a "$HEALTH_LOG"
    if [[ "$OVERALL_STATUS" == "HEALTHY" ]]; then
        OVERALL_STATUS="WARNING"
    fi
    ((WARNINGS_FOUND++))
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $INFO $1${NC}" | tee -a "$HEALTH_LOG"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $CHECK $1${NC}" | tee -a "$HEALTH_LOG"
}

# Load thresholds
load_thresholds() {
    for threshold in "${ALERT_THRESHOLDS[@]}"; do
        export "$threshold"
    done
}

# System resource checks
check_system_resources() {
    info "Checking system resources..."
    
    # CPU Usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 | cut -d',' -f1)
    cpu_usage=${cpu_usage%.*}  # Remove decimal part
    
    if [[ $cpu_usage -gt $CPU_THRESHOLD ]]; then
        error "High CPU usage: ${cpu_usage}% (threshold: ${CPU_THRESHOLD}%)"
    elif [[ $cpu_usage -gt $((CPU_THRESHOLD - 10)) ]]; then
        warn "Elevated CPU usage: ${cpu_usage}%"
    else
        success "CPU usage: ${cpu_usage}%"
    fi
    
    # Memory Usage
    local memory_info=$(free | grep Mem)
    local total_mem=$(echo $memory_info | awk '{print $2}')
    local used_mem=$(echo $memory_info | awk '{print $3}')
    local memory_usage=$((used_mem * 100 / total_mem))
    
    if [[ $memory_usage -gt $MEMORY_THRESHOLD ]]; then
        error "High memory usage: ${memory_usage}% (threshold: ${MEMORY_THRESHOLD}%)"
    elif [[ $memory_usage -gt $((MEMORY_THRESHOLD - 10)) ]]; then
        warn "Elevated memory usage: ${memory_usage}%"
    else
        success "Memory usage: ${memory_usage}%"
    fi
    
    # Disk Usage
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | cut -d'%' -f1)
    
    if [[ $disk_usage -gt $DISK_THRESHOLD ]]; then
        error "High disk usage: ${disk_usage}% (threshold: ${DISK_THRESHOLD}%)"
    elif [[ $disk_usage -gt $((DISK_THRESHOLD - 10)) ]]; then
        warn "Elevated disk usage: ${disk_usage}%"
    else
        success "Disk usage: ${disk_usage}%"
    fi
    
    # Load Average
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | cut -d',' -f1 | xargs)
    local cpu_cores=$(nproc)
    local load_percentage=$(echo "scale=0; $load_avg * 100 / $cpu_cores" | bc 2>/dev/null || echo "0")
    
    if [[ $load_percentage -gt 100 ]]; then
        error "High system load: ${load_avg} (cores: ${cpu_cores})"
    elif [[ $load_percentage -gt 80 ]]; then
        warn "Elevated system load: ${load_avg}"
    else
        success "System load: ${load_avg}"
    fi
}

# Docker health checks
check_docker_services() {
    info "Checking Docker services..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed or not in PATH"
        return 1
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running"
        return 1
    fi
    
    success "Docker daemon is running"
    
    # Check Docker Compose services
    if [[ -f "docker-compose.yml" ]]; then
        local services=($(docker-compose config --services))
        
        for service in "${services[@]}"; do
            local status=$(docker-compose ps -q "$service" | xargs docker inspect --format='{{.State.Status}}' 2>/dev/null || echo "not_found")
            
            case $status in
                "running")
                    success "Service $service is running"
                    ;;
                "exited")
                    error "Service $service has exited"
                    ;;
                "not_found")
                    error "Service $service not found"
                    ;;
                *)
                    warn "Service $service status: $status"
                    ;;
            esac
        done
    fi
    
    # Check Docker resource usage
    local docker_stats=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}")
    if [[ -n "$docker_stats" ]]; then
        info "Docker container resource usage:"
        echo "$docker_stats" | tee -a "$HEALTH_LOG"
    fi
}

# Database health checks
check_database() {
    info "Checking database health..."
    
    if ! docker-compose ps | grep -q postgres; then
        error "PostgreSQL container is not running"
        return 1
    fi
    
    # Check database connectivity
    if docker-compose exec -T postgres pg_isready -U postgres &> /dev/null; then
        success "Database is accepting connections"
    else
        error "Database is not accepting connections"
        return 1
    fi
    
    # Check database size
    local db_size=$(docker-compose exec -T postgres psql -U postgres -d rea_invest_prod -t -c "
        SELECT pg_size_pretty(pg_database_size('rea_invest_prod'));
    " 2>/dev/null | xargs || echo "unknown")
    
    info "Database size: $db_size"
    
    # Check active connections
    local active_connections=$(docker-compose exec -T postgres psql -U postgres -d rea_invest_prod -t -c "
        SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
    " 2>/dev/null | xargs || echo "unknown")
    
    info "Active database connections: $active_connections"
    
    # Check for long-running queries
    local long_queries=$(docker-compose exec -T postgres psql -U postgres -d rea_invest_prod -t -c "
        SELECT count(*) FROM pg_stat_activity 
        WHERE state = 'active' AND query_start < now() - interval '5 minutes';
    " 2>/dev/null | xargs || echo "0")
    
    if [[ $long_queries -gt 0 ]]; then
        warn "Found $long_queries long-running queries (>5 minutes)"
    else
        success "No long-running queries detected"
    fi
    
    # Check database locks
    local locks=$(docker-compose exec -T postgres psql -U postgres -d rea_invest_prod -t -c "
        SELECT count(*) FROM pg_locks WHERE NOT granted;
    " 2>/dev/null | xargs || echo "0")
    
    if [[ $locks -gt 0 ]]; then
        warn "Found $locks blocked queries"
    else
        success "No database locks detected"
    fi
}

# Redis health checks
check_redis() {
    info "Checking Redis health..."
    
    if ! docker-compose ps | grep -q redis; then
        warn "Redis container is not running"
        return 0  # Redis is optional
    fi
    
    # Check Redis connectivity
    if docker-compose exec -T redis redis-cli ping | grep -q PONG; then
        success "Redis is responding"
    else
        warn "Redis is not responding"
        return 0
    fi
    
    # Check Redis memory usage
    local redis_memory=$(docker-compose exec -T redis redis-cli info memory | grep used_memory_human | cut -d':' -f2 | tr -d '\r')
    info "Redis memory usage: $redis_memory"
    
    # Check Redis connected clients
    local redis_clients=$(docker-compose exec -T redis redis-cli info clients | grep connected_clients | cut -d':' -f2 | tr -d '\r')
    info "Redis connected clients: $redis_clients"
    
    # Check Redis keyspace
    local redis_keys=$(docker-compose exec -T redis redis-cli dbsize 2>/dev/null || echo "0")
    info "Redis keys count: $redis_keys"
}

# Application health checks
check_application_health() {
    info "Checking application health..."
    
    # Backend health check
    local backend_response=$(curl -s -w "%{http_code}" -o /tmp/backend_health http://localhost:8000/health || echo "000")
    
    if [[ "$backend_response" == "200" ]]; then
        success "Backend API is healthy"
        
        # Check response time
        local response_time=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:8000/health | cut -d'.' -f1)
        response_time=$((response_time * 1000))  # Convert to milliseconds
        
        if [[ $response_time -gt $RESPONSE_TIME_THRESHOLD ]]; then
            warn "Backend response time is slow: ${response_time}ms"
        else
            success "Backend response time: ${response_time}ms"
        fi
    else
        error "Backend API health check failed (HTTP: $backend_response)"
    fi
    
    # Frontend health check
    local frontend_response=$(curl -s -w "%{http_code}" -o /tmp/frontend_health http://localhost:3000 || echo "000")
    
    if [[ "$frontend_response" == "200" ]]; then
        success "Frontend is responding"
    else
        error "Frontend health check failed (HTTP: $frontend_response)"
    fi
    
    # Database API health check
    local db_api_response=$(curl -s -w "%{http_code}" -o /tmp/db_health http://localhost:8000/api/database/health || echo "000")
    
    if [[ "$db_api_response" == "200" ]]; then
        success "Database API is healthy"
        
        # Parse database health details
        local db_health=$(cat /tmp/db_health 2>/dev/null | jq -r '.data.status' 2>/dev/null || echo "unknown")
        info "Database status: $db_health"
    else
        warn "Database API health check failed (HTTP: $db_api_response)"
    fi
}

# Network connectivity checks
check_network() {
    info "Checking network connectivity..."
    
    # Check internet connectivity
    if ping -c 1 8.8.8.8 &> /dev/null; then
        success "Internet connectivity is working"
    else
        warn "No internet connectivity"
    fi
    
    # Check DNS resolution
    if nslookup google.com &> /dev/null; then
        success "DNS resolution is working"
    else
        warn "DNS resolution issues detected"
    fi
    
    # Check internal network connectivity
    local services=("backend:8000" "frontend:3000" "postgres:5432")
    
    for service in "${services[@]}"; do
        local host=$(echo $service | cut -d':' -f1)
        local port=$(echo $service | cut -d':' -f2)
        
        if docker-compose exec -T backend nc -z "$host" "$port" &> /dev/null; then
            success "Internal connectivity to $service is working"
        else
            error "Cannot connect to $service"
        fi
    done
}

# Log analysis
check_error_logs() {
    info "Analyzing error logs..."
    
    # Backend error logs
    if [[ -d "./backend/logs" ]]; then
        local recent_errors=$(find ./backend/logs -name "*.log" -mtime -1 -exec grep -i error {} \; 2>/dev/null | wc -l)
        
        if [[ $recent_errors -gt 10 ]]; then
            warn "High number of backend errors in last 24h: $recent_errors"
        else
            success "Backend error rate is normal: $recent_errors errors/24h"
        fi
    fi
    
    # Docker logs error analysis
    local docker_errors=$(docker-compose logs --since=24h 2>&1 | grep -i error | wc -l)
    
    if [[ $docker_errors -gt 5 ]]; then
        warn "Docker errors in last 24h: $docker_errors"
    else
        success "Docker error rate is normal: $docker_errors errors/24h"
    fi
    
    # System log errors
    if [[ -f "/var/log/syslog" ]]; then
        local system_errors=$(grep -i error /var/log/syslog | grep "$(date +'%b %d')" | wc -l)
        
        if [[ $system_errors -gt 10 ]]; then
            warn "System errors today: $system_errors"
        else
            success "System error rate is normal: $system_errors errors today"
        fi
    fi
}

# Security checks
check_security() {
    info "Performing security checks..."
    
    # Check for exposed passwords in environment files
    local exposed_passwords=0
    for env_file in $(find . -name ".env*" -type f); do
        if grep -q "password.*=" "$env_file" && ! grep -q "password.*\*\*\*" "$env_file"; then
            ((exposed_passwords++))
        fi
    done
    
    if [[ $exposed_passwords -gt 0 ]]; then
        warn "Found $exposed_passwords environment files with potential password exposure"
    else
        success "No exposed passwords found in environment files"
    fi
    
    # Check SSL certificates
    if [[ -d "./nginx/ssl" ]]; then
        for cert_file in ./nginx/ssl/*.crt; do
            if [[ -f "$cert_file" ]]; then
                local cert_expiry=$(openssl x509 -enddate -noout -in "$cert_file" 2>/dev/null | cut -d'=' -f2 || echo "unknown")
                local expiry_timestamp=$(date -d "$cert_expiry" +%s 2>/dev/null || echo "0")
                local current_timestamp=$(date +%s)
                local days_until_expiry=$(((expiry_timestamp - current_timestamp) / 86400))
                
                if [[ $days_until_expiry -lt 30 && $days_until_expiry -gt 0 ]]; then
                    warn "SSL certificate expires in $days_until_expiry days: $(basename "$cert_file")"
                elif [[ $days_until_expiry -le 0 ]]; then
                    error "SSL certificate has expired: $(basename "$cert_file")"
                else
                    success "SSL certificate is valid: $(basename "$cert_file") (expires in $days_until_expiry days)"
                fi
            fi
        done
    fi
    
    # Check file permissions
    local sensitive_files=(".env" "backend/.env" "docker-compose.yml")
    for file in "${sensitive_files[@]}"; do
        if [[ -f "$file" ]]; then
            local perms=$(stat -c "%a" "$file" 2>/dev/null || echo "000")
            if [[ "$perms" == "600" || "$perms" == "644" ]]; then
                success "File permissions OK: $file ($perms)"
            else
                warn "Insecure file permissions: $file ($perms)"
            fi
        fi
    done
}

# Performance benchmarks
run_performance_tests() {
    info "Running performance benchmarks..."
    
    # API response time test
    local api_tests=("/api/auth/me" "/health" "/api/properties?limit=1")
    
    for endpoint in "${api_tests[@]}"; do
        local response_time=$(curl -s -w "%{time_total}" -o /dev/null "http://localhost:8000$endpoint" 2>/dev/null || echo "999")
        local response_ms=$(echo "$response_time * 1000" | bc | cut -d'.' -f1)
        
        if [[ $response_ms -gt 1000 ]]; then
            warn "Slow API response: $endpoint (${response_ms}ms)"
        else
            success "API response time OK: $endpoint (${response_ms}ms)"
        fi
    done
    
    # Database query performance test
    local query_time=$(docker-compose exec -T postgres psql -U postgres -d rea_invest_prod -c "\timing on" -c "SELECT COUNT(*) FROM properties;" 2>/dev/null | grep "Time:" | awk '{print $2}' | cut -d'.' -f1 || echo "999")
    
    if [[ $query_time -gt 100 ]]; then
        warn "Slow database query performance: ${query_time}ms"
    else
        success "Database query performance OK: ${query_time}ms"
    fi
}

# Generate health report
generate_report() {
    local report_file="/tmp/rea_invest_health_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
REA INVEST System Health Report
==============================

Generated: $(date)
Overall Status: $OVERALL_STATUS
Issues Found: $ISSUES_FOUND
Warnings: $WARNINGS_FOUND

System Information:
- Hostname: $(hostname)
- Uptime: $(uptime -p)
- Load Average: $(uptime | awk -F'load average:' '{print $2}')
- Memory: $(free -h | grep Mem | awk '{print $3"/"$2}')
- Disk Space: $(df -h / | awk 'NR==2 {print $3"/"$2" ("$5" used)"}')

Docker Services:
$(docker-compose ps 2>/dev/null || echo "Docker Compose not available")

Recent Log Entries:
$(tail -20 "$HEALTH_LOG" 2>/dev/null || echo "No health log found")

Recommendations:
EOF

    # Add recommendations based on issues found
    if [[ $ISSUES_FOUND -gt 0 ]]; then
        echo "- CRITICAL: $ISSUES_FOUND critical issues require immediate attention" >> "$report_file"
    fi
    
    if [[ $WARNINGS_FOUND -gt 0 ]]; then
        echo "- WARNING: $WARNINGS_FOUND warnings should be investigated" >> "$report_file"
    fi
    
    if [[ $ISSUES_FOUND -eq 0 && $WARNINGS_FOUND -eq 0 ]]; then
        echo "- System is operating normally" >> "$report_file"
    fi
    
    echo "- Schedule regular health checks using this script" >> "$report_file"
    echo "- Monitor system resources and set up alerts" >> "$report_file"
    echo "- Keep system and dependencies updated" >> "$report_file"
    
    info "Health report generated: $report_file"
    echo "$report_file"
}

# Send alerts
send_alerts() {
    if [[ $ISSUES_FOUND -gt 0 ]]; then
        local alert_message="REA INVEST CRITICAL ALERT: $ISSUES_FOUND critical issues detected. Check system immediately!"
        
        # Email alert (if configured)
        if command -v mail &> /dev/null && [[ -n "$ALERT_EMAIL" ]]; then
            echo "$alert_message" | mail -s "REA INVEST Critical Alert" "$ALERT_EMAIL"
        fi
        
        # Slack alert (if configured)
        if [[ -n "$SLACK_WEBHOOK" ]]; then
            curl -X POST -H 'Content-type: application/json' \
                --data '{"text":"🚨 '"$alert_message"'"}' \
                "$SLACK_WEBHOOK" >/dev/null 2>&1 || true
        fi
        
        # SMS alert (if configured)
        if [[ -n "$SMS_WEBHOOK" ]]; then
            curl -X POST -H 'Content-type: application/json' \
                --data '{"message":"'"$alert_message"'"}' \
                "$SMS_WEBHOOK" >/dev/null 2>&1 || true
        fi
    fi
}

# Main health check function
run_health_check() {
    info "Starting REA INVEST health check..."
    
    # Create log directory
    mkdir -p "$(dirname "$HEALTH_LOG")"
    
    # Load configuration
    load_thresholds
    
    # Run all checks
    check_system_resources
    check_docker_services
    check_database
    check_redis
    check_application_health
    check_network
    check_error_logs
    check_security
    run_performance_tests
    
    # Generate report and send alerts
    local report_file=$(generate_report)
    send_alerts
    
    # Summary
    echo ""
    log "Health check completed!"
    info "Overall Status: $OVERALL_STATUS"
    info "Issues Found: $ISSUES_FOUND"
    info "Warnings: $WARNINGS_FOUND"
    info "Report: $report_file"
    
    # Exit with appropriate code
    if [[ $ISSUES_FOUND -gt 0 ]]; then
        exit 2  # Critical issues
    elif [[ $WARNINGS_FOUND -gt 0 ]]; then
        exit 1  # Warnings
    else
        exit 0  # All good
    fi
}

# Show usage
usage() {
    echo "REA INVEST Health Check Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --cpu-threshold N        CPU usage alert threshold (default: 80%)"
    echo "  --memory-threshold N     Memory usage alert threshold (default: 85%)"
    echo "  --disk-threshold N       Disk usage alert threshold (default: 90%)"
    echo "  --response-threshold N   API response time threshold in ms (default: 2000)"
    echo "  --quiet                  Suppress non-critical output"
    echo "  --report-only           Generate report without running checks"
    echo ""
    echo "Environment Variables:"
    echo "  ALERT_EMAIL             Email address for critical alerts"
    echo "  SLACK_WEBHOOK          Slack webhook URL for notifications"
    echo "  SMS_WEBHOOK            SMS webhook URL for critical alerts"
    echo ""
    echo "Exit Codes:"
    echo "  0 - All checks passed"
    echo "  1 - Warnings found"
    echo "  2 - Critical issues found"
}

# Parse command line options
while [[ $# -gt 0 ]]; do
    case $1 in
        --cpu-threshold)
            CPU_THRESHOLD="$2"
            shift 2
            ;;
        --memory-threshold)
            MEMORY_THRESHOLD="$2"
            shift 2
            ;;
        --disk-threshold)
            DISK_THRESHOLD="$2"
            shift 2
            ;;
        --response-threshold)
            RESPONSE_TIME_THRESHOLD="$2"
            shift 2
            ;;
        --quiet)
            exec > /dev/null
            shift
            ;;
        --report-only)
            generate_report
            exit 0
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Run health check
run_health_check