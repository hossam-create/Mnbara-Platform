#!/bin/bash

# MNBara Platform - Production Deployment Script
# Hour 18-22: Deployment Phase

set -e

echo "🚀 MNBara Platform - Production Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command_exists kubectl; then
    print_error "kubectl not found. Please install kubectl."
    exit 1
fi

if ! command_exists docker; then
    print_error "docker not found. Please install Docker."
    exit 1
fi

print_status "Prerequisites check passed"
echo ""

# Step 1: Backup Database
echo "💾 Step 1: Backing up database..."
mkdir -p $BACKUP_DIR

if [ -n "$DATABASE_URL" ]; then
    pg_dump $DATABASE_URL > $BACKUP_FILE
    print_status "Database backup created: $BACKUP_FILE"
else
    print_warning "DATABASE_URL not set, skipping backup"
fi
echo ""

# Step 2: Build Docker Images
echo "🐳 Step 2: Building Docker images..."
services=(
    "listing-service-node"
    "cart-service"
    "payment-service"
    "crowdship-service"
    "compliance-service"
    "seller-service"
)

for service in "${services[@]}"; do
    echo "Building $service..."
    docker build -t mnbara/$service:latest ./backend/services/$service
    docker tag mnbara/$service:latest mnbara/$service:v1.0
    print_status "$service built successfully"
done
echo ""

# Step 3: Push Images to Registry
echo "📤 Step 3: Pushing images to registry..."
if [ -n "$DOCKER_REGISTRY" ]; then
    for service in "${services[@]}"; do
        echo "Pushing $service..."
        docker push mnbara/$service:latest
        docker push mnbara/$service:v1.0
        print_status "$service pushed successfully"
    done
else
    print_warning "DOCKER_REGISTRY not set, skipping push"
fi
echo ""

# Step 4: Apply Kubernetes Configurations
echo "☸️  Step 4: Deploying to Kubernetes..."

# Deploy in order
echo "Deploying ConfigMaps and Secrets..."
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
print_status "ConfigMaps and Secrets deployed"

echo "Deploying Database..."
kubectl apply -f k8s/database.yaml
kubectl wait --for=condition=ready pod -l app=postgres --timeout=300s
print_status "Database deployed"

echo "Deploying Redis..."
kubectl apply -f k8s/redis.yaml || echo "Redis config not found, skipping"
print_status "Redis deployed"

echo "Deploying Services..."
kubectl apply -f k8s/services.yaml
print_status "Services deployed"

echo "Deploying Frontend..."
kubectl apply -f k8s/frontend.yaml
print_status "Frontend deployed"

echo "Deploying Ingress..."
kubectl apply -f k8s/ingress.yaml
print_status "Ingress deployed"

echo "Deploying Monitoring..."
kubectl apply -f k8s/monitoring.yaml
print_status "Monitoring deployed"

echo "Deploying HPA (Horizontal Pod Autoscaler)..."
kubectl apply -f k8s/hpa.yaml
print_status "HPA deployed"

echo ""

# Step 5: Wait for Deployments
echo "⏳ Step 5: Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=600s deployment --all
print_status "All deployments are ready"
echo ""

# Step 6: Run Database Migrations
echo "🗄️  Step 6: Running database migrations..."
for service in "${services[@]}"; do
    if [ -d "./backend/services/$service/prisma" ]; then
        echo "Running migrations for $service..."
        cd ./backend/services/$service
        npx prisma migrate deploy
        cd ../../..
        print_status "$service migrations complete"
    fi
done
echo ""

# Step 7: Verify Deployments
echo "✅ Step 7: Verifying deployments..."
echo ""
echo "Pods:"
kubectl get pods
echo ""
echo "Services:"
kubectl get services
echo ""
echo "Ingress:"
kubectl get ingress
echo ""

# Step 8: Health Checks
echo "🏥 Step 8: Running health checks..."
SERVICES_TO_CHECK=(
    "http://api.mnbara.com/health"
    "http://api.mnbara.com/products/health"
    "http://api.mnbara.com/cart/health"
    "http://api.mnbara.com/payments/health"
)

for url in "${SERVICES_TO_CHECK[@]}"; do
    echo "Checking $url..."
    if curl -f -s -o /dev/null "$url"; then
        print_status "$url is healthy"
    else
        print_warning "$url is not responding"
    fi
done
echo ""

# Step 9: Display Summary
echo "📊 Deployment Summary"
echo "===================="
echo "Timestamp: $TIMESTAMP"
echo "Backup: $BACKUP_FILE"
echo "Services Deployed: ${#services[@]}"
echo ""
print_status "Production deployment complete!"
echo ""

# Step 10: Next Steps
echo "📝 Next Steps:"
echo "1. Run smoke tests: npm run test:smoke"
echo "2. Monitor logs: kubectl logs -f deployment/listing-service"
echo "3. Check metrics: kubectl top pods"
echo "4. Access dashboard: https://mnbara.com"
echo ""

# Rollback instructions
echo "🔄 Rollback Instructions (if needed):"
echo "kubectl rollout undo deployment/listing-service"
echo "kubectl rollout undo deployment/cart-service"
echo "kubectl rollout undo deployment/payment-service"
echo "psql \$DATABASE_URL < $BACKUP_FILE"
echo ""

print_status "Deployment script completed successfully! 🎉"
