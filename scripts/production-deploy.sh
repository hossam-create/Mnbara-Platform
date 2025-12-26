#!/bin/bash

# ============================================
# Production Deployment Script
# Deploy Mnbara Platform to Production Server
# ============================================

set -e  # Exit on any error

echo "🚀 Mnbara Platform - Production Deployment"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=${DOMAIN:-"mnbara.com"}
ADMIN_SUBDOMAIN=${ADMIN_SUBDOMAIN:-"admin"}
CONTROL_SUBDOMAIN=${CONTROL_SUBDOMAIN:-"control"}
DB_NAME=${DB_NAME:-"mnbara_platform"}
DB_USER=${DB_USER:-"mnbara_user"}

echo -e "${BLUE}Deployment Configuration:${NC}"
echo "Domain: $DOMAIN"
echo "Admin Dashboard: https://$ADMIN_SUBDOMAIN.$DOMAIN"
echo "System Control: https://$CONTROL_SUBDOMAIN.$DOMAIN"
echo "Database: $DB_NAME"
echo ""

# Step 1: System Requirements Check
echo -e "${BLUE}Step 1: Checking system requirements...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

# Check PostgreSQL client
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL client is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All system requirements met${NC}"

# Step 2: Environment Setup
echo -e "${BLUE}Step 2: Setting up environment...${NC}"

# Create production environment file if it doesn't exist
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}Creating .env.production file...${NC}"
    cat > .env.production << EOF
# Production Environment Configuration
NODE_ENV=production
DOMAIN=$DOMAIN

# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)@localhost:5432/$DB_NAME
POSTGRES_DB=$DB_NAME
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# JWT Secrets
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
ADMIN_JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
SYSTEM_JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

# MFA Configuration
MFA_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
MFA_ISSUER=Mnbara Platform

# Session Configuration
ADMIN_SESSION_TIMEOUT=7200
SYSTEM_SESSION_TIMEOUT=3600
SYSTEM_MFA_TIMEOUT=300

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# SSL Configuration
SSL_CERT_PATH=/etc/ssl/certs/$DOMAIN.crt
SSL_KEY_PATH=/etc/ssl/private/$DOMAIN.key

# Monitoring
GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
PROMETHEUS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Backup Configuration
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=mnbara-backups
EOF
    echo -e "${GREEN}✅ Environment file created${NC}"
else
    echo -e "${GREEN}✅ Environment file exists${NC}"
fi

# Step 3: SSL Certificates
echo -e "${BLUE}Step 3: Setting up SSL certificates...${NC}"

if [ ! -f "/etc/ssl/certs/$DOMAIN.crt" ]; then
    echo -e "${YELLOW}Setting up SSL certificates with Let's Encrypt...${NC}"
    
    # Install certbot if not present
    if ! command -v certbot &> /dev/null; then
        echo "Installing certbot..."
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
    fi
    
    # Get certificates
    sudo certbot certonly --nginx \
        -d $ADMIN_SUBDOMAIN.$DOMAIN \
        -d $CONTROL_SUBDOMAIN.$DOMAIN \
        --non-interactive \
        --agree-tos \
        --email admin@$DOMAIN
    
    echo -e "${GREEN}✅ SSL certificates configured${NC}"
else
    echo -e "${GREEN}✅ SSL certificates already exist${NC}"
fi

# Step 4: Database Setup
echo -e "${BLUE}Step 4: Setting up production database...${NC}"

# Start PostgreSQL container
docker-compose -f docker-compose.prod.yml up -d postgres

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Create database and user
source .env.production
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE $POSTGRES_DB;" || true
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -c "CREATE USER $POSTGRES_USER WITH PASSWORD '$POSTGRES_PASSWORD';" || true
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;" || true

# Run database migrations
echo "Running database migrations..."
cd backend/services/auth-service && npm run migrate:prod && cd ../../..
cd backend/services/listing-service && npm run migrate:prod && cd ../../..
cd backend/services/payment-service && npm run migrate:prod && cd ../../..
cd backend/services/order-service && npm run migrate:prod && cd ../../..

echo -e "${GREEN}✅ Database setup complete${NC}"

# Step 5: Build Applications
echo -e "${BLUE}Step 5: Building applications...${NC}"

# Build backend services
echo "Building backend services..."
cd backend/services/auth-service && npm ci --production && npm run build && cd ../../..
cd backend/services/listing-service && npm ci --production && npm run build && cd ../../..
cd backend/services/payment-service && npm ci --production && npm run build && cd ../../..
cd backend/services/order-service && npm ci --production && npm run build && cd ../../..

# Build frontend applications
echo "Building frontend applications..."
cd frontend/web-app && npm ci --production && npm run build && cd ../..
cd frontend/admin-dashboard && npm ci --production && npm run build && cd ../..
cd frontend/system-control-dashboard && npm ci --production && npm run build && cd ../..

echo -e "${GREEN}✅ Applications built successfully${NC}"

# Step 6: Deploy with Docker
echo -e "${BLUE}Step 6: Deploying with Docker...${NC}"

# Stop any existing containers
docker-compose -f docker-compose.prod.yml down

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 30

echo -e "${GREEN}✅ Services deployed successfully${NC}"

# Step 7: Setup Owner Accounts
echo -e "${BLUE}Step 7: Setting up owner accounts...${NC}"

# Run owner setup script
PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -p 5432 -U $POSTGRES_USER -d $POSTGRES_DB -f scripts/setup-owner-accounts.sql

echo -e "${GREEN}✅ Owner accounts created${NC}"

# Step 8: Configure Nginx
echo -e "${BLUE}Step 8: Configuring Nginx...${NC}"

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/mnbara << EOF
# Admin Dashboard
server {
    listen 443 ssl http2;
    server_name $ADMIN_SUBDOMAIN.$DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$ADMIN_SUBDOMAIN.$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$ADMIN_SUBDOMAIN.$DOMAIN/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# System Control Dashboard
server {
    listen 443 ssl http2;
    server_name $CONTROL_SUBDOMAIN.$DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$CONTROL_SUBDOMAIN.$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$CONTROL_SUBDOMAIN.$DOMAIN/privkey.pem;
    
    # Enhanced security for system control
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";
    
    # IP whitelist for system control (uncomment and configure as needed)
    # allow 192.168.1.0/24;
    # allow 10.0.0.0/8;
    # deny all;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name $ADMIN_SUBDOMAIN.$DOMAIN $CONTROL_SUBDOMAIN.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/mnbara /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo -e "${GREEN}✅ Nginx configured${NC}"

# Step 9: Setup Monitoring
echo -e "${BLUE}Step 9: Setting up monitoring...${NC}"

# Start monitoring services
docker-compose -f docker-compose.prod.yml up -d prometheus grafana

echo -e "${GREEN}✅ Monitoring services started${NC}"

# Step 10: Setup Backups
echo -e "${BLUE}Step 10: Setting up automated backups...${NC}"

# Create backup script
sudo tee /usr/local/bin/mnbara-backup.sh << EOF
#!/bin/bash
BACKUP_DIR="/var/backups/mnbara"
DATE=\$(date +%Y%m%d_%H%M%S)
mkdir -p \$BACKUP_DIR

# Database backup
PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h localhost -U $POSTGRES_USER $POSTGRES_DB > \$BACKUP_DIR/db_backup_\$DATE.sql

# Compress backup
gzip \$BACKUP_DIR/db_backup_\$DATE.sql

# Remove backups older than 30 days
find \$BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: \$BACKUP_DIR/db_backup_\$DATE.sql.gz"
EOF

sudo chmod +x /usr/local/bin/mnbara-backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/mnbara-backup.sh") | crontab -

echo -e "${GREEN}✅ Automated backups configured${NC}"

# Step 11: Final Health Check
echo -e "${BLUE}Step 11: Running health checks...${NC}"

# Check if services are running
sleep 10

# Check admin dashboard
if curl -f -s https://$ADMIN_SUBDOMAIN.$DOMAIN > /dev/null; then
    echo -e "${GREEN}✅ Admin Dashboard is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Admin Dashboard health check failed${NC}"
fi

# Check system control dashboard
if curl -f -s https://$CONTROL_SUBDOMAIN.$DOMAIN > /dev/null; then
    echo -e "${GREEN}✅ System Control Dashboard is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  System Control Dashboard health check failed${NC}"
fi

# Check database
if PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -p 5432 -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database is accessible${NC}"
else
    echo -e "${RED}❌ Database health check failed${NC}"
fi

echo ""
echo "============================================"
echo -e "${GREEN}🎉 PRODUCTION DEPLOYMENT COMPLETE!${NC}"
echo "============================================"
echo ""
echo -e "${YELLOW}📊 Admin Dashboard:${NC}"
echo "URL: https://$ADMIN_SUBDOMAIN.$DOMAIN"
echo "Email: owner@mnbarh.com"
echo "Password: MnbaraOwner2026!"
echo ""
echo -e "${YELLOW}🚀 System Control Dashboard:${NC}"
echo "URL: https://$CONTROL_SUBDOMAIN.$DOMAIN"
echo "Email: owner@mnbarh.com"
echo "Password: SystemControl2026!"
echo "MFA: Required (scan QR code on first login)"
echo ""
echo -e "${BLUE}🔐 Important Security Notes:${NC}"
echo "1. Change default passwords immediately after first login"
echo "2. Configure IP whitelist for System Control Dashboard"
echo "3. Setup MFA for System Control Dashboard"
echo "4. Review and update firewall rules"
echo "5. Monitor logs regularly"
echo ""
echo -e "${BLUE}📊 Monitoring:${NC}"
echo "Grafana: https://monitoring.$DOMAIN"
echo "Prometheus: https://metrics.$DOMAIN"
echo ""
echo -e "${BLUE}💾 Backups:${NC}"
echo "Automated daily backups at 2 AM"
echo "Backup location: /var/backups/mnbara"
echo "Retention: 30 days"
echo ""
echo -e "${GREEN}Platform is now live and ready for use! 🚀${NC}"
echo "============================================"