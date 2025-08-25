# Hetzner AX102 Server Setup Guide
# REA INVEST Real Estate Management System

## Server Specifications
- **CPU**: AMD Ryzen™ 9 7950X3D (16 cores/32 threads)
- **RAM**: 128 GB DDR5 ECC (scalable to 192GB)
- **Storage**: 2 x 1.92 TB NVMe SSD RAID 1
- **Network**: 1 Gbit/s unlimited bandwidth
- **Cost**: €104/month + €39 setup

## Recommended OS: Ubuntu 22.04 LTS

## Initial Server Setup

### 1. Connect to Server
```bash
ssh root@your-server-ip
```

### 2. Update System
```bash
apt update && apt upgrade -y
```

### 3. Install Docker & Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Enable Docker service
systemctl enable docker
systemctl start docker
```

### 4. Setup Firewall
```bash
ufw enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw status
```

### 5. Create Application User
```bash
adduser rea-invest
usermod -aG docker rea-invest
mkdir -p /home/rea-invest/app
chown -R rea-invest:rea-invest /home/rea-invest/app
```

### 6. Clone Repository
```bash
su - rea-invest
cd /home/rea-invest/app
git clone https://github.com/nurlan135/rea-backend-frontend.git .
```

### 7. Configure Environment
```bash
# Copy production environment file
cp .env.production .env

# Edit with your values
nano .env

# Update domain in nginx config
sed -i 's/your-domain.com/yourdomain.com/g' nginx/conf.d/default.conf
```

### 8. Build and Deploy
```bash
# Build production images
docker compose -f docker-compose.production.yml build

# Start services
docker compose -f docker-compose.production.yml up -d

# Check logs
docker compose logs -f
```

### 9. SSL Certificate Setup
```bash
# Generate SSL certificates
docker compose -f docker-compose.production.yml run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  --email admin@yourdomain.com \
  --agree-tos --no-eff-email \
  -d yourdomain.com -d www.yourdomain.com

# Setup auto-renewal
echo "0 12 * * * /usr/local/bin/docker-compose -f /home/rea-invest/app/docker-compose.production.yml run --rm certbot renew" | crontab -
```

## Performance Optimizations for AX102

### Database Configuration (PostgreSQL)
```bash
# Optimize for 128GB RAM
# Add to docker-compose.production.yml postgres environment:
- POSTGRES_SHARED_BUFFERS=32GB
- POSTGRES_EFFECTIVE_CACHE_SIZE=96GB
- POSTGRES_MAINTENANCE_WORK_MEM=2GB
- POSTGRES_CHECKPOINT_COMPLETION_TARGET=0.9
- POSTGRES_WAL_BUFFERS=16MB
- POSTGRES_DEFAULT_STATISTICS_TARGET=100
- POSTGRES_RANDOM_PAGE_COST=1.1
- POSTGRES_EFFECTIVE_IO_CONCURRENCY=200
```

### Redis Configuration
```bash
# Optimize for large datasets
- REDIS_MAXMEMORY=16GB
- REDIS_MAXMEMORY_POLICY=allkeys-lru
```

## Monitoring Setup

### Resource Usage Expectations
- **CPU**: 10-20% normal, 40-60% under load
- **RAM**: 20-40GB used (DB cache + Redis + Apps)
- **Disk**: <10% usage, high IOPS for DB
- **Network**: <100Mbps normal traffic

### Grafana Dashboards
- System metrics (CPU, RAM, Disk, Network)
- Application metrics (API response times, user sessions)
- Database performance (query times, connections)
- Real estate specific metrics (property views, searches)

## Backup Strategy

### Automated Backups
```bash
# Database backup (daily)
0 2 * * * docker exec rea_postgres pg_dump -U admin rea_invest_prod > /backups/db-$(date +\%Y\%m\%d).sql

# File backup to Hetzner Storage Box
0 3 * * * rsync -av /home/rea-invest/app/uploads/ user@user.your-storagebox.de:backups/uploads/
```

## Expected Performance

### With AX102 Specifications:
- **Concurrent Users**: 500-1000 simultaneous
- **Property Listings**: 100,000+ properties
- **API Response Time**: <100ms average
- **Database Queries**: <10ms for simple, <100ms for complex
- **File Uploads**: 50MB max, <5 seconds upload time
- **Search Performance**: <200ms for full-text property search

## Security Hardening

### Additional Security
```bash
# Disable root SSH login
echo "PermitRootLogin no" >> /etc/ssh/sshd_config
systemctl restart ssh

# Setup fail2ban
apt install fail2ban -y
systemctl enable fail2ban

# Regular security updates
echo "0 4 * * 0 apt update && apt upgrade -y" | crontab -
```

## Domain Configuration

### DNS Records
```
Type    Name    Value               TTL
A       @       your-server-ip      300
A       www     your-server-ip      300
A       admin   your-server-ip      300
CNAME   api     your-domain.com     300
```

## Post-Deployment Checklist

- [ ] SSL certificates working (https://yourdomain.com)
- [ ] API endpoints responding (https://yourdomain.com/api/health)
- [ ] Database connected and seeded
- [ ] Redis cache working
- [ ] File uploads functional
- [ ] Monitoring dashboards accessible
- [ ] Backup scripts running
- [ ] Performance benchmarks met
- [ ] Security audit passed

## Maintenance Commands

```bash
# Check service status
docker compose ps

# View logs
docker compose logs -f [service-name]

# Update application
git pull
docker compose build
docker compose up -d

# Database backup
docker exec rea_postgres pg_dump -U admin rea_invest_prod > backup.sql

# Monitor resources
htop
df -h
free -h
```