#!/bin/bash
# Native Hetzner Deployment Script
# REA INVEST Real Estate Management System
# No Docker - Pure Ubuntu deployment

set -e

echo "🚀 REA INVEST Native Hetzner Deployment Starting..."

# Update system
echo "📦 Updating system..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
echo "🔧 Installing essential packages..."
sudo apt install -y curl wget unzip git build-essential

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version

# Install PostgreSQL
echo "🗄️ Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Setup PostgreSQL database
echo "🔧 Setting up PostgreSQL database..."
sudo -u postgres psql << EOF
CREATE DATABASE rea_invest_prod;
CREATE USER admin WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE rea_invest_prod TO admin;
ALTER USER admin CREATEDB;
\q
EOF

# Install Redis
echo "⚡ Installing Redis..."
sudo apt install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis

# Configure Redis
sudo sed -i 's/# requirepass foobared/requirepass your_redis_password/' /etc/redis/redis.conf
sudo systemctl restart redis

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Install PM2 (Process manager)
echo "⚙️ Installing PM2..."
sudo npm install -g pm2

# Create application user
echo "👤 Creating application user..."
sudo adduser --system --group --home /home/rea-invest rea-invest
sudo mkdir -p /home/rea-invest/app
sudo chown -R rea-invest:rea-invest /home/rea-invest

# Setup firewall
echo "🔥 Setting up firewall..."
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Clone repository
echo "📥 Cloning repository..."
sudo -u rea-invest git clone https://github.com/nurlan135/rea-backend-frontend.git /home/rea-invest/app
cd /home/rea-invest/app

# Install dependencies
echo "📦 Installing backend dependencies..."
cd /home/rea-invest/app/backend
sudo -u rea-invest npm install --production

echo "📦 Installing frontend dependencies..."
cd /home/rea-invest/app/frontend
sudo -u rea-invest npm install --production

# Build frontend
echo "🏗️ Building frontend..."
sudo -u rea-invest npm run build

# Create environment file
echo "⚙️ Creating environment configuration..."
sudo -u rea-invest tee /home/rea-invest/app/backend/.env << EOF
NODE_ENV=production
PORT=8000

# Database
DATABASE_URL=postgresql://admin:your_secure_password_here@localhost:5432/rea_invest_prod
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rea_invest_prod
DB_USER=admin
DB_PASSWORD=your_secure_password_here

# Redis
REDIS_URL=redis://:your_redis_password@localhost:6379

# JWT
JWT_SECRET=your_extremely_secure_jwt_secret_key_256_bit_minimum
JWT_EXPIRES_IN=7d

# File uploads (local storage)
UPLOAD_BASE_DIR=/home/rea-invest/app/uploads
UPLOAD_MAX_SIZE=52428800

# CORS
CORS_ORIGIN=https://your-domain.com
EOF

# Create uploads directory
echo "📁 Creating uploads directory..."
sudo mkdir -p /home/rea-invest/app/uploads
sudo chown -R rea-invest:rea-invest /home/rea-invest/app/uploads

# Run database migrations
echo "🗄️ Running database migrations..."
cd /home/rea-invest/app/backend
sudo -u rea-invest npm run migrate
sudo -u rea-invest npm run seed

# Create PM2 ecosystem file
echo "⚙️ Creating PM2 configuration..."
sudo -u rea-invest tee /home/rea-invest/app/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'rea-backend',
      script: './backend/index.js',
      cwd: '/home/rea-invest/app',
      user: 'rea-invest',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 8000
      },
      error_file: '/home/rea-invest/app/logs/backend-error.log',
      out_file: '/home/rea-invest/app/logs/backend-out.log',
      log_file: '/home/rea-invest/app/logs/backend.log'
    },
    {
      name: 'rea-frontend',
      script: './frontend/server.js',
      cwd: '/home/rea-invest/app',
      user: 'rea-invest',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/home/rea-invest/app/logs/frontend-error.log',
      out_file: '/home/rea-invest/app/logs/frontend-out.log',
      log_file: '/home/rea-invest/app/logs/frontend.log'
    }
  ]
};
EOF

# Create logs directory
sudo mkdir -p /home/rea-invest/app/logs
sudo chown -R rea-invest:rea-invest /home/rea-invest/app/logs

# Start applications with PM2
echo "🚀 Starting applications..."
cd /home/rea-invest/app
sudo -u rea-invest pm2 start ecosystem.config.js

# Configure PM2 to start on boot
echo "⚙️ Configuring PM2 startup..."
pm2 startup systemd -u rea-invest --hp /home/rea-invest
sudo -u rea-invest pm2 save

# Configure Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/rea-invest << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Static files (uploads)
    location /uploads/ {
        alias /home/rea-invest/app/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # API Backend
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Frontend Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/rea-invest /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Install SSL certificate (Let's Encrypt)
echo "🔒 Installing SSL certificate..."
sudo apt install -y certbot python3-certbot-nginx
# Note: Replace your-domain.com with actual domain
# sudo certbot --nginx -d your-domain.com -d www.your-domain.com --non-interactive --agree-tos -m admin@your-domain.com

# Setup automatic backups
echo "💾 Setting up automatic backups..."
sudo -u rea-invest mkdir -p /home/rea-invest/backups

# Create backup script
sudo -u rea-invest tee /home/rea-invest/backup.sh << EOF
#!/bin/bash
# REA INVEST Backup Script
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/rea-invest/backups"

# Database backup
pg_dump -h localhost -U admin rea_invest_prod > "\$BACKUP_DIR/db_backup_\$DATE.sql"

# Files backup
tar -czf "\$BACKUP_DIR/files_backup_\$DATE.tar.gz" /home/rea-invest/app/uploads

# Keep only last 7 days of backups
find "\$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "\$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: \$DATE"
EOF

sudo chmod +x /home/rea-invest/backup.sh

# Add to crontab
echo "⏰ Setting up automatic backup schedule..."
(sudo -u rea-invest crontab -l 2>/dev/null || true; echo "0 2 * * * /home/rea-invest/backup.sh") | sudo -u rea-invest crontab -

echo "✅ REA INVEST Native Deployment Complete!"
echo ""
echo "🎉 Your application is now running:"
echo "   Frontend: http://your-server-ip"
echo "   API: http://your-server-ip/api"
echo ""
echo "📊 Monitor with:"
echo "   sudo -u rea-invest pm2 status"
echo "   sudo -u rea-invest pm2 logs"
echo ""
echo "🔧 Next steps:"
echo "   1. Replace 'your-domain.com' with your actual domain"
echo "   2. Update passwords in .env file"
echo "   3. Run SSL certificate setup"
echo "   4. Test file uploads"
echo ""
echo "🏠 Login credentials:"
echo "   Email: admin@rea-invest.com"
echo "   Password: password123"