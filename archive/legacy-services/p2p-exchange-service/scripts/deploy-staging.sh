#!/bin/bash

# P2P Exchange Service - Staging Deployment Script
# This script deploys the p2p-exchange-service to staging environment

set -e  # Exit on error

echo "=========================================="
echo "P2P Exchange Service - Staging Deployment"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="p2p-exchange-service"
STAGING_ENV="staging"
DOCKER_IMAGE="mnbarh/${SERVICE_NAME}:staging"
CONTAINER_NAME="${SERVICE_NAME}-staging"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check .env.staging file
    if [ ! -f ".env.staging" ]; then
        log_error ".env.staging file not found"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

build_docker_image() {
    log_info "Building Docker image..."
    docker build -t ${DOCKER_IMAGE} .
    log_info "Docker image built successfully"
}

stop_existing_container() {
    log_info "Stopping existing container (if any)..."
    docker stop ${CONTAINER_NAME} 2>/dev/null || true
    docker rm ${CONTAINER_NAME} 2>/dev/null || true
    log_info "Existing container stopped"
}

run_database_migrations() {
    log_info "Running database migrations..."
    
    # Load environment variables
    export $(cat .env.staging | grep -v '^#' | xargs)
    
    # Run migrations
    npm run prisma:deploy
    
    log_info "Database migrations completed"
}

seed_database() {
    log_info "Seeding database..."
    
    # Load environment variables
    export $(cat .env.staging | grep -v '^#' | xargs)
    
    # Run seed
    npm run prisma:seed
    
    log_info "Database seeded successfully"
}

start_service() {
    log_info "Starting service..."
    
    docker run -d \
        --name ${CONTAINER_NAME} \
        --env-file .env.staging \
        -p 3005:3005 \
        --network mnbarh-network \
        --restart unless-stopped \
        ${DOCKER_IMAGE}
    
    log_info "Service started"
}

wait_for_health() {
    log_info "Waiting for service to be healthy..."
    
    MAX_ATTEMPTS=30
    ATTEMPT=0
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        if curl -f http://localhost:3005/health &> /dev/null; then
            log_info "Service is healthy!"
            return 0
        fi
        
        ATTEMPT=$((ATTEMPT + 1))
        echo -n "."
        sleep 2
    done
    
    log_error "Service failed to become healthy"
    return 1
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check health endpoint
    HEALTH_RESPONSE=$(curl -s http://localhost:3005/health)
    echo "Health check response: ${HEALTH_RESPONSE}"
    
    # Check metrics endpoint
    if curl -f http://localhost:3005/metrics &> /dev/null; then
        log_info "Metrics endpoint is accessible"
    else
        log_warn "Metrics endpoint is not accessible"
    fi
    
    # Check logs
    log_info "Recent logs:"
    docker logs --tail 20 ${CONTAINER_NAME}
    
    log_info "Deployment verification completed"
}

run_smoke_tests() {
    log_info "Running smoke tests..."
    
    # Test 1: Health check
    if curl -f http://localhost:3005/health &> /dev/null; then
        log_info "✓ Health check passed"
    else
        log_error "✗ Health check failed"
        return 1
    fi
    
    # Test 2: Metrics endpoint
    if curl -f http://localhost:3005/metrics &> /dev/null; then
        log_info "✓ Metrics endpoint passed"
    else
        log_error "✗ Metrics endpoint failed"
        return 1
    fi
    
    # Test 3: API endpoint (requires auth)
    # This is a basic connectivity test
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3005/api/v1/exchange/marketplace)
    if [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 200 ]; then
        log_info "✓ API endpoint accessible (HTTP $HTTP_CODE)"
    else
        log_error "✗ API endpoint failed (HTTP $HTTP_CODE)"
        return 1
    fi
    
    log_info "All smoke tests passed!"
}

rollback() {
    log_error "Deployment failed. Rolling back..."
    
    # Stop new container
    docker stop ${CONTAINER_NAME} 2>/dev/null || true
    docker rm ${CONTAINER_NAME} 2>/dev/null || true
    
    # Restore previous version (if exists)
    if docker ps -a | grep -q "${CONTAINER_NAME}-backup"; then
        log_info "Restoring previous version..."
        docker rename ${CONTAINER_NAME}-backup ${CONTAINER_NAME}
        docker start ${CONTAINER_NAME}
    fi
    
    log_error "Rollback completed"
    exit 1
}

# Main deployment flow
main() {
    echo ""
    log_info "Starting deployment process..."
    echo ""
    
    # Backup current container (if exists)
    if docker ps -a | grep -q ${CONTAINER_NAME}; then
        log_info "Backing up current container..."
        docker rename ${CONTAINER_NAME} ${CONTAINER_NAME}-backup 2>/dev/null || true
    fi
    
    # Run deployment steps
    check_prerequisites || rollback
    build_docker_image || rollback
    run_database_migrations || rollback
    seed_database || rollback
    start_service || rollback
    wait_for_health || rollback
    verify_deployment || rollback
    run_smoke_tests || rollback
    
    # Remove backup if deployment successful
    docker rm ${CONTAINER_NAME}-backup 2>/dev/null || true
    
    echo ""
    log_info "=========================================="
    log_info "Deployment completed successfully!"
    log_info "=========================================="
    echo ""
    log_info "Service URL: http://localhost:3005"
    log_info "Health Check: http://localhost:3005/health"
    log_info "Metrics: http://localhost:3005/metrics"
    echo ""
    log_info "Next steps:"
    log_info "1. Monitor logs: docker logs -f ${CONTAINER_NAME}"
    log_info "2. Check metrics in Grafana"
    log_info "3. Run integration tests"
    log_info "4. Invite pilot users"
    echo ""
}

# Run main function
main
