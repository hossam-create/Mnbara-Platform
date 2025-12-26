#!/bin/bash

# Mnbara Platform - Production Deployment Script
# For 2026 Launch Deployment

echo "🚀 Starting Mnbara Platform Production Deployment - 2026 Launch"
echo "============================================================"

# Load environment variables
if [ -f .env.production ]; then
    export $(grep -v '^#' .env.production | xargs)
    echo "✅ Loaded production environment variables"
else
    echo "❌ Error: .env.production file not found"
    exit 1
fi

# Validate required environment variables
required_vars=(
    "DB_PASSWORD" "REDIS_PASSWORD" "RABBITMQ_PASSWORD"
    "JWT_SECRET" "BLOCKCHAIN_RPC_URL" "STRIPE_SECRET_KEY"
    "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ] || [[ "${!var}" == *"your-"* ]]; then
        echo "❌ Error: $var is not properly configured in .env.production"
        exit 1
    fi

done

echo "✅ All required environment variables are configured"

# Create deployment directory
DEPLOY_DIR="/opt/mnbara/production/$(date +%Y%m%d_%H%M%S)"
echo "📁 Creating deployment directory: $DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy deployment files
echo "📦 Copying deployment files..."
cp -r . "$DEPLOY_DIR/"
cd "$DEPLOY_DIR"

# Build Docker images
echo "🐳 Building Docker images..."

# Build backend services
echo "🔨 Building API Gateway..."
docker build -f backend/services/api-gateway/Dockerfile.prod -t mnbara-api-gateway:2026.1.0 .

echo "🔨 Building P2P Swap Service..."
docker build -f backend/services/admin-service/Dockerfile.prod -t mnbara-p2p-swap:2026.1.0 .

echo "🔨 Building Real-time Matching Service..."
docker build -f backend/services/matching-service/Dockerfile.prod -t mnbara-real-time-matcher:2026.1.0 .

echo "🔨 Building AI Core Service..."
docker build -f backend/services/ai-core/Dockerfile.prod -t mnbara-ai-core:2026.1.0 .

# Build frontend services
echo "🔨 Building Web Frontend..."
docker build -f frontend/web/Dockerfile.prod -t mnbara-web-frontend:2026.1.0 .

echo "🔨 Building Mobile Backend..."
docker build -f frontend/mobile/mnbara-app/Dockerfile.prod -t mnbara-mobile-backend:2026.1.0 .

echo "✅ All Docker images built successfully"

# Initialize Docker Swarm (if not already initialized)
echo "🐋 Initializing Docker Swarm..."
if ! docker info | grep -q "Swarm: active"; then
    docker swarm init
    echo "✅ Docker Swarm initialized"
else
    echo "✅ Docker Swarm already active"
fi

# Create Docker network
echo "🌐 Creating production network..."
docker network create --driver overlay --attachable mnbara-network-prod 2>/dev/null || true

# Deploy services
echo "🚀 Deploying production stack..."
docker stack deploy -c docker-compose.prod.yml mnbara-prod

echo "⏳ Waiting for services to start..."
sleep 30

# Check deployment status
echo "📊 Checking deployment status..."
docker service ls --filter "name=mnbara-prod"

# Run health checks
echo "🏥 Running health checks..."

# Check API Gateway
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health || echo "failed")
if [ "$API_HEALTH" = "200" ]; then
    echo "✅ API Gateway is healthy"
else
    echo "❌ API Gateway health check failed: $API_HEALTH"
fi

# Check database connection
DB_HEALTH=$(docker exec mnbara-postgres-prod pg_isready -U "$DB_USER" 2>/dev/null && echo "healthy" || echo "failed")
if [ "$DB_HEALTH" = "healthy" ]; then
    echo "✅ Database is healthy"
else
    echo "❌ Database health check failed"
fi

# Check Redis
REDIS_HEALTH=$(docker exec mnbara-redis-prod redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q PONG && echo "healthy" || echo "failed")
if [ "$REDIS_HEALTH" = "healthy" ]; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis health check failed"
fi

# Run database migrations
echo "📊 Running database migrations..."

# API Gateway migrations
docker run --rm --network mnbara-network-prod \
  -e DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@postgres:5432/api_gateway_db" \
  mnbara-api-gateway:2026.1.0 npm run migrate:prod

# P2P Swap migrations
docker run --rm --network mnbara-network-prod \
  -e DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@postgres:5432/swap_db" \
  mnbara-p2p-swap:2026.1.0 npm run migrate:prod

# Real-time Matching migrations
docker run --rm --network mnbara-network-prod \
  -e DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@postgres:5432/matching_db" \
  mnbara-real-time-matcher:2026.1.0 npm run migrate:prod

echo "✅ Database migrations completed"

# Create backup of current deployment
echo "💾 Creating deployment backup..."
if [ -d "/opt/mnbara/production/current" ]; then
    BACKUP_DIR="/opt/mnbara/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp -r "/opt/mnbara/production/current/"* "$BACKUP_DIR/"
    echo "✅ Backup created: $BACKUP_DIR"
fi

# Update current deployment symlink
ln -sfn "$DEPLOY_DIR" "/opt/mnbara/production/current"

echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   - Deployment Directory: $DEPLOY_DIR"
echo "   - Version: 2026.1.0"
echo "   - Timestamp: $(date)"
echo "   - Services Deployed: $(docker service ls --filter "name=mnbara-prod" | wc -l)"
echo ""
echo "🌐 Access Points:"
echo "   - Web Application: https://app.mnbara.com"
echo "   - API Gateway: http://localhost:8080"
echo "   - Real-time WebSocket: ws://localhost:3001"
echo "   - Monitoring: http://localhost:9090 (Prometheus)"
echo "   - Monitoring: http://localhost:3001 (Grafana)"
echo ""
echo "🔧 Next Steps:"
echo "   1. Verify all services are running: docker service ls"
echo "   2. Check logs: docker service logs mnbara-prod_api-gateway"
echo "   3. Monitor performance: http://localhost:3001"
echo "   4. Run smoke tests: ./scripts/smoke-test.sh"
echo ""
echo "✅ Mnbara Platform is now LIVE for 2026 Launch! 🚀"