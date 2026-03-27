#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

APP_DIR="/opt/mnbara"
BACKUP_DIR="/opt/mnbara/backups"

echo -e "${YELLOW}⚠️  Starting rollback procedure...${NC}"

# Find latest backup
LATEST_BACKUP=$(ls -t $BACKUP_DIR/*.env | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo -e "${RED}❌ No backup found!${NC}"
    exit 1
fi

BACKUP_NAME=$(basename $LATEST_BACKUP .env)
echo "Rolling back to: $BACKUP_NAME"

# Step 1: Stop current containers
echo "🛑 Stopping current containers..."
cd $APP_DIR
docker-compose -f docker-compose.prod.yml down

# Step 2: Restore environment
echo "🔄 Restoring environment..."
cp $BACKUP_DIR/$BACKUP_NAME.env $APP_DIR/.env

# Step 3: Restore containers
echo "🐳 Restoring containers..."
if [ -f "$BACKUP_DIR/$BACKUP_NAME-containers.txt" ]; then
    while read container_id; do
        docker start $container_id || true
    done < $BACKUP_DIR/$BACKUP_NAME-containers.txt
fi

# Step 4: Start services
echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Step 5: Wait and check health
echo "⏳ Waiting for services..."
sleep 15

bash $APP_DIR/scripts/health-check.sh

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Rollback completed successfully!${NC}"
    
    # Send notification
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"⚠️ Rollback completed: $BACKUP_NAME\"}" \
            $SLACK_WEBHOOK
    fi
else
    echo -e "${RED}❌ Rollback failed! Manual intervention required.${NC}"
    exit 1
fi
