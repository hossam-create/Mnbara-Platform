#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

IMAGE_TAG=${1:-latest}
APP_DIR="/opt/mnbara"
BACKUP_DIR="/opt/mnbara/backups"

echo -e "${GREEN}🚀 Starting deployment to AWS...${NC}"
echo "Image Tag: $IMAGE_TAG"

# Function to log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Step 1: Backup current deployment
log "📦 Creating backup of current deployment..."
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR
docker-compose -f $APP_DIR/docker-compose.prod.yml ps -q > $BACKUP_DIR/$BACKUP_NAME-containers.txt
cp $APP_DIR/.env $BACKUP_DIR/$BACKUP_NAME.env

# Step 2: Pull latest code
log "📥 Pulling latest code from repository..."
cd $APP_DIR
git fetch origin
git checkout main
git pull origin main

# Step 3: Update environment variables
log "🔧 Updating environment variables..."
# Environment variables are managed separately and not in git

# Step 4: Pull Docker images
log "🐳 Pulling Docker images..."
export IMAGE_TAG=$IMAGE_TAG
docker-compose -f docker-compose.prod.yml pull

# Step 5: Run database migrations
log "🗄️  Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm \
    -e DATABASE_URL=$DATABASE_URL \
    auction-service npx prisma migrate deploy

docker-compose -f docker-compose.prod.yml run --rm \
    -e DATABASE_URL=$DATABASE_URL \
    listing-service npx prisma migrate deploy

docker-compose -f docker-compose.prod.yml run --rm \
    -e DATABASE_URL=$DATABASE_URL \
    internal-ledger-service npx prisma migrate deploy

# Step 6: Deploy with zero-downtime
log "🔄 Deploying services with zero-downtime..."

# Start new containers
docker-compose -f docker-compose.prod.yml up -d --no-deps --build

# Wait for health checks
log "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
for service in auction-service listing-service internal-ledger-service; do
    log "Checking health of $service..."
    if ! docker-compose -f docker-compose.prod.yml exec -T $service curl -f http://localhost/health > /dev/null 2>&1; then
        error "$service health check failed!"
        warning "Rolling back deployment..."
        bash $APP_DIR/scripts/rollback.sh
        exit 1
    fi
    log "✅ $service is healthy"
done

# Step 7: Remove old containers
log "🧹 Cleaning up old containers..."
docker system prune -f

# Step 8: Update Nginx configuration (if needed)
log "🌐 Updating Nginx configuration..."
sudo nginx -t && sudo systemctl reload nginx

# Step 9: Final health check
log "🏥 Running final health checks..."
bash $APP_DIR/scripts/health-check.sh

log "${GREEN}✅ Deployment completed successfully!${NC}"
log "Backup saved to: $BACKUP_DIR/$BACKUP_NAME"

# Send notification
if [ -n "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ Deployment successful: $IMAGE_TAG\"}" \
        $SLACK_WEBHOOK
fi
