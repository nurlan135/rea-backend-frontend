# REA INVEST Deployment Guide

## Overview

This guide covers the deployment of the REA INVEST property management system using Docker, Docker Compose, and Kubernetes. The system supports multiple deployment strategies for different environments and scales.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Production Setup](#production-setup)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Backup and Recovery](#backup-and-recovery)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

**Minimum Requirements:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 50GB
- OS: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+

**Recommended for Production:**
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 100GB+ SSD
- Load Balancer
- SSL Certificate

### Software Dependencies

```bash
# Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Git
sudo apt update
sudo apt install git -y

# Node.js (for development)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Environment Configuration

### 1. Clone Repository

```bash
git clone https://github.com/your-org/rea-invest.git
cd rea-invest
```

### 2. Environment Files

Create environment-specific configuration files:

```bash
# Copy example environment file
cp .env.production .env

# Edit environment variables
nano .env
```

**Key Environment Variables:**

```bash
# Database
DB_HOST=postgres
DB_PASSWORD=your_secure_password_here
DB_NAME=rea_invest_prod

# JWT Security
JWT_SECRET=your_super_secure_jwt_secret

# Redis Cache
REDIS_PASSWORD=your_redis_password_here

# Frontend
NEXT_PUBLIC_API_URL=https://api.rea-invest.com
NEXTAUTH_SECRET=your_nextauth_secret

# Monitoring
GRAFANA_PASSWORD=your_grafana_password_here
```

### 3. SSL Certificates

For production, place SSL certificates in the `nginx/ssl/` directory:

```bash
mkdir -p nginx/ssl
# Copy your certificates
cp your-cert.crt nginx/ssl/rea-invest.com.crt
cp your-key.key nginx/ssl/rea-invest.com.key
```

## Docker Deployment

### Development Environment

```bash
# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Environment

```bash
# Build and start production environment
docker-compose --env-file .env.production up -d --build

# Run database migrations
docker-compose exec backend npm run migrate

# Run database seeds (optional)
docker-compose exec backend npm run seed

# Check service health
docker-compose ps
```

### Using Deployment Script

The included deployment script automates the deployment process:

```bash
# Make script executable
chmod +x deploy.sh

# Deploy to staging
./deploy.sh staging deploy

# Deploy to production
./deploy.sh production deploy

# Create backup
./deploy.sh production backup

# Rollback deployment
./deploy.sh production rollback
```

## Kubernetes Deployment

### 1. Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### 2. Cluster Setup

```bash
# Create namespace
kubectl apply -f kubernetes/namespace.yaml

# Deploy PostgreSQL
kubectl apply -f kubernetes/postgres-deployment.yaml

# Deploy Redis
kubectl apply -f kubernetes/redis-deployment.yaml

# Deploy Backend API
kubectl apply -f kubernetes/backend-deployment.yaml

# Deploy Frontend
kubectl apply -f kubernetes/frontend-deployment.yaml

# Deploy Ingress
kubectl apply -f kubernetes/ingress.yaml
```

### 3. Monitoring Stack

```bash
# Deploy Prometheus
kubectl apply -f kubernetes/monitoring/prometheus-deployment.yaml

# Deploy Grafana
kubectl apply -f kubernetes/monitoring/grafana-deployment.yaml

# Deploy Loki (Optional)
kubectl apply -f kubernetes/monitoring/loki-deployment.yaml
```

### 4. Verify Deployment

```bash
# Check pods
kubectl get pods -n rea-invest

# Check services
kubectl get services -n rea-invest

# Check ingress
kubectl get ingress -n rea-invest

# View logs
kubectl logs -f deployment/backend -n rea-invest
```

## Production Setup

### 1. Domain Configuration

Configure DNS records:

```
# A Records
rea-invest.com          -> Your_Server_IP
www.rea-invest.com      -> Your_Server_IP
api.rea-invest.com      -> Your_Server_IP
monitoring.rea-invest.com -> Your_Server_IP
```

### 2. SSL Certificates

#### Using Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificates
sudo certbot --nginx -d rea-invest.com -d www.rea-invest.com
sudo certbot --nginx -d api.rea-invest.com
sudo certbot --nginx -d monitoring.rea-invest.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Firewall Configuration

```bash
# Configure UFW
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable
```

### 4. System Optimization

```bash
# Increase file limits
echo "* soft nofile 65535" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65535" | sudo tee -a /etc/security/limits.conf

# Optimize network settings
echo "net.core.somaxconn = 65535" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65535" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## Monitoring and Logging

### Access Monitoring Dashboard

1. **Grafana**: `https://monitoring.rea-invest.com`
   - Default credentials: admin / (password from env)
   - Import dashboards from `monitoring/grafana/dashboards/`

2. **Prometheus**: Internal access only
   - Available at `http://prometheus:9090` within the network

### Log Management

```bash
# View application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# View Nginx logs
docker-compose logs -f nginx

# View database logs
docker-compose logs -f postgres

# Export logs for analysis
docker-compose logs --no-color backend > backend.log
```

### Alerting Setup

Configure alerts in Prometheus for:
- High CPU/Memory usage
- Database connection failures
- API response time issues
- Disk space warnings
- SSL certificate expiration

## Backup and Recovery

### Automated Backups

The deployment script includes automated backup functionality:

```bash
# Manual backup
./deploy.sh production backup

# Automated daily backups (crontab)
0 2 * * * /path/to/rea-invest/deploy.sh production backup
```

### Database Backups

```bash
# Manual database backup
docker-compose exec postgres pg_dump -U postgres rea_invest_prod > backup.sql

# Restore from backup
cat backup.sql | docker-compose exec -T postgres psql -U postgres rea_invest_prod
```

### File Backups

```bash
# Backup uploaded files
tar -czf uploads-backup.tar.gz backend/uploads/

# Restore uploads
tar -xzf uploads-backup.tar.gz
```

### Disaster Recovery

1. **Complete System Restore**:
   ```bash
   # Restore from latest backup
   ./deploy.sh production rollback
   ```

2. **Database Recovery**:
   ```bash
   # Stop services
   docker-compose down
   
   # Restore database
   cat latest-backup.sql | docker-compose exec -T postgres psql -U postgres rea_invest_prod
   
   # Start services
   docker-compose up -d
   ```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues

```bash
# Check database status
docker-compose exec postgres pg_isready -U postgres

# View database logs
docker-compose logs postgres

# Reset database connection
docker-compose restart postgres backend
```

#### 2. High Memory Usage

```bash
# Check container resource usage
docker stats

# Restart high-memory containers
docker-compose restart backend frontend

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL
```

#### 3. SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in nginx/ssl/rea-invest.com.crt -text -noout

# Renew Let's Encrypt certificates
sudo certbot renew

# Reload Nginx configuration
docker-compose exec nginx nginx -s reload
```

#### 4. Application Errors

```bash
# Check application health
curl -f http://localhost:8000/health
curl -f http://localhost:3000/api/health

# View detailed logs
docker-compose logs -f --tail=100 backend

# Restart services
docker-compose restart backend frontend
```

### Performance Tuning

#### 1. Database Optimization

```bash
# Run database analysis
docker-compose exec backend npm run analyze-tables

# Update statistics
docker-compose exec postgres psql -U postgres -d rea_invest_prod -c "ANALYZE;"

# Vacuum database
docker-compose exec postgres psql -U postgres -d rea_invest_prod -c "VACUUM ANALYZE;"
```

#### 2. Cache Optimization

```bash
# Check cache statistics
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/cache/stats

# Clear cache if needed
curl -X DELETE -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/cache
```

#### 3. Resource Monitoring

Monitor these metrics regularly:
- CPU usage < 70%
- Memory usage < 80%
- Disk usage < 85%
- Database connections < 80% of max
- Response times < 500ms

### Health Checks

```bash
# Comprehensive health check
./deploy.sh production health

# Individual service checks
curl -f http://localhost:8000/health      # Backend
curl -f http://localhost:3000/api/health  # Frontend
curl -f http://localhost/health           # Nginx
```

## Security Best Practices

1. **Regular Updates**:
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade
   
   # Update Docker images
   docker-compose pull
   docker-compose up -d
   ```

2. **Security Scanning**:
   ```bash
   # Scan Docker images for vulnerabilities
   docker scan rea-invest/backend:latest
   docker scan rea-invest/frontend:latest
   ```

3. **Access Control**:
   - Use strong passwords for all services
   - Implement IP whitelisting for admin access
   - Regular security audits
   - Monitor access logs

4. **Data Protection**:
   - Encrypt sensitive data at rest
   - Use HTTPS for all communications
   - Regular backup testing
   - Implement data retention policies

## Scaling Considerations

### Horizontal Scaling

```bash
# Scale backend services
docker-compose up -d --scale backend=3

# Scale with Kubernetes
kubectl scale deployment backend --replicas=5 -n rea-invest
```

### Load Balancing

Configure Nginx upstream for multiple backend instances:

```nginx
upstream backend {
    server backend-1:8000;
    server backend-2:8000;
    server backend-3:8000;
}
```

### Database Scaling

Consider these options for database scaling:
- Read replicas for read-heavy workloads
- Connection pooling (PgBouncer)
- Database sharding for very large datasets
- Cloud database services (AWS RDS, Google Cloud SQL)

## Support and Maintenance

### Regular Maintenance Tasks

1. **Daily**:
   - Check system health
   - Monitor error logs
   - Verify backup completion

2. **Weekly**:
   - Review performance metrics
   - Update security patches
   - Test backup restoration

3. **Monthly**:
   - Security audit
   - Database optimization
   - Capacity planning review

### Getting Support

- **Documentation**: Check this guide and API documentation
- **Logs**: Always include relevant logs when reporting issues
- **System Info**: Provide system specifications and Docker versions
- **Error Details**: Include full error messages and stack traces

For additional support, contact the development team or create an issue in the project repository.