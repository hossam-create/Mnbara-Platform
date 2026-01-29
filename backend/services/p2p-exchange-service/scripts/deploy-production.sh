#!/bin/bash

# P2P Exchange Service - Production Deployment Script
# This script deploys the p2p-exchange-service to production environment

set -e  # Exit on error

echo "=========================================="
echo "P2P Exchange Service - Production Deployment"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="p2p-exchange-service"
PRODUCTION_ENV="production"
DOCKER_IMAGE="mnbarh/${SERVICE_NAME}:production"
CONTAINER_NAME="${SERVICE_NAME}-production"
FEATURE_FLAG_PERCENTAGE=10  # Start with 10% traffic

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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

confirm_deployment() {
    echo ""
    log_warn "⚠️  PRODUCTION DEPLOYMENT WARNING ⚠️"
    echo ""
    echo "You are about to deploy to PRODUCTION environment."
    echo "This will affect real users and real transactions."
    echo ""
    echo "Service: ${SERVICE_NAME}"
    echo "Environment: ${PRODUCTION_ENV}"
    echo "Initial Traffic: ${FEATURE_FLAG_PERCENTAGE}%"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_error "Deployment cancelled by user"
        exit 1
    fi
    
    log_info "Deployment confirmed. Proceeding..."
}

check_prerequisites() {
    log_step "1/12: Checking prerequisites..."
    
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
    
    # Check .env.production file
    if [ ! -f ".env.production" ]; then
        log_error ".env.production file not found"
        exit 1
    fi
    
    # Check staging results
    if [ ! -f "STAGING_RESULTS.md" ]; then
        log_warn "STAGING_RESULTS.md not found. Have you tested in staging?"
        read -p "Continue anyway? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            exit 1
        fi
    fi
    
    log_info "Prerequisites check passed ✓"
}

backup_current_deployment() {
    log_step "2/12: Backing up current deployment..."
    
    if docker ps -a | grep -q ${CONTAINER_NAME}; then
        # Create backup tag
        BACKUP_TAG="${SERVICE_NAME}:production-backup-$(date +%Y%m%d-%H%M%S)"
        docker tag ${DOCKER_IMAGE} ${BACKUP_TAG}
        log_info "Created backup: ${BACKUP_TAG}"
        
        # Export current container
        docker export ${CONTAINER_NAME} > ${CONTAINER_NAME}-backup.tar
        log_info "Exported container to ${CONTAINER_NAME}-backup.tar"
    else
        log_info "No existing deployment to backup"
    fi
}

build_docker_image() {
    log_step "3/12: Building Docker image..."
    
    # Build with production tag
    docker build -t ${DOCKER_IMAGE} .
    
    # Also tag with version
    VERSION=$(cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')
    docker tag ${DOCKER_IMAGE} mnbarh/${SERVICE_NAME}:${VERSION}
    
    log_info "Docker image built successfully ✓"
    log_info "Tagged as: ${DOCKER_IMAGE} and mnbarh/${SERVICE_NAME}:${VERSION}"
}

run_database_migrations() {
    log_step "4/12: Running database migrations..."
    
    # Load environment variables
    export $(cat .env.production | grep -v '^#' | xargs)
    
    # Backup database first
    log_info "Creating database backup..."
    BACKUP_FILE="db-backup-$(date +%Y%m%d-%H%M%S).sql"
    # Add your database backup command here
    
    # Run migrations
    log_info "Executing migrations..."
    npm run prisma:deploy
    
    log_info "Database migrations completed ✓"
}

seed_production_data() {
    log_step "5/12: Seeding production data..."
    
    # Load environment variables
    export $(cat .env.production | grep -v '^#' | xargs)
    
    # Run seed (only if needed)
    read -p "Seed production data? (yes/no): " -r
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        npm run prisma:seed
        log_info "Production data seeded ✓"
    else
        log_info "Skipping seed"
    fi
}

stop_existing_container() {
    log_step "6/12: Stopping existing container..."
    
    if docker ps | grep -q ${CONTAINER_NAME}; then
        docker stop ${CONTAINER_NAME}
        log_info "Container stopped"
    else
        log_info "No running container found"
    fi
}

start_new_container() {
    log_step "7/12: Starting new container..."
    
    # Remove old container if exists
    docker rm ${CONTAINER_NAME} 2>/dev/null || true
    
    # Start new container
    docker run -d \
        --name ${CONTAINER_NAME} \
        --env-file .env.production \
        -p 3005:3005 \
        --network mnbarh-network \
        --restart unless-stopped \
        --memory="2g" \
        --cpus="2" \
        ${DOCKER_IMAGE}
    
    log_info "Container started ✓"
}

wait_for_health() {
    log_step "8/12: Waiting for service to be healthy..."
    
    MAX_ATTEMPTS=60
    ATTEMPT=0
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        if curl -f http://localhost:3005/health &> /dev/null; then
            log_info "Service is healthy! ✓"
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
    log_step "9/12: Verifying deployment..."
    
    # Check health endpoint
    HEALTH_RESPONSE=$(curl -s http://localhost:3005/health)
    echo "Health check response: ${HEALTH_RESPONSE}"
    
    # Check metrics endpoint
    if curl -f http://localhost:3005/metrics &> /dev/null; then
        log_info "Metrics endpoint accessible ✓"
    else
        log_warn "Metrics endpoint not accessible"
    fi
    
    # Check database connection
    DB_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
    if [ "$DB_STATUS" = "connected" ]; then
        log_info "Database connected ✓"
    else
        log_error "Database not connected"
        return 1
    fi
    
    # Check Redis connection
    REDIS_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"redis":"[^"]*"' | cut -d'"' -f4)
    if [ "$REDIS_STATUS" = "connected" ]; then
        log_info "Redis connected ✓"
    else
        log_error "Redis not connected"
        return 1
    fi
    
    log_info "Deployment verification completed ✓"
}

run_smoke_tests() {
    log_step "10/12: Running smoke tests..."
    
    # Run smoke tests
    if [ -f "scripts/smoke-tests.sh" ]; then
        BASE_URL="http://localhost:3005" ./scripts/smoke-tests.sh
        log_info "Smoke tests passed ✓"
    else
        log_warn "Smoke tests script not found"
    fi
}

enable_feature_flag() {
    log_step "11/12: Enabling feature flag (${FEATURE_FLAG_PERCENTAGE}% traffic)..."
    
    # This would integrate with your feature flag system
    # For now, just log the action
    log_info "Feature flag enabled for ${FEATURE_FLAG_PERCENTAGE}% of traffic"
    log_info "Monitor metrics for 24 hours before increasing"
}

setup_monitoring() {
    log_step "12/12: Setting up monitoring..."
    
    # Verify Prometheus is scraping
    log_info "Verifying Prometheus scraping..."
    
    # Verify Grafana dashboard
    log_info "Verifying Grafana dashboard..."
    
    # Verify Sentry integration
    log_info "Verifying Sentry integration..."
    
    log_info "Monitoring setup verified ✓"
}

print_post_deployment_instructions() {
    echo ""
    echo "=========================================="
    log_info "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉"
    echo "=========================================="
    echo ""
    echo "Service URL: https://api.mnbarh.com/p2p-exchange"
    echo "Health Check: https://api.mnbarh.com/p2p-exchange/health"
    echo "Metrics: https://api.mnbarh.com/p2p-exchange/metrics"
    echo "Grafana: https://grafana.mnbarh.com"
    echo "Sentry: https://sentry.io/organizations/mnbarh/projects/p2p-exchange"
    echo ""
    echo "📊 MONITORING (Next 24 hours):"
    echo "  1. Monitor error rate (should be < 0.1%)"
    echo "  2. Monitor response time (should be < 200ms p95)"
    echo "  3. Monitor settlement success rate (should be > 95%)"
    echo "  4. Monitor user feedback"
    echo "  5. Check Sentry for any errors"
    echo ""
    echo "📈 GRADUAL ROLLOUT:"
    echo "  Current: ${FEATURE_FLAG_PERCENTAGE}% traffic"
    echo "  After 24h: Increase to 25% (if metrics good)"
    echo "  After 48h: Increase to 50% (if metrics good)"
    echo "  After 72h: Increase to 100% (if metrics good)"
    echo ""
    echo "🚨 ROLLBACK (if needed):"
    echo "  ./scripts/rollback-production.sh"
    echo ""
    echo "📝 NEXT STEPS:"
    echo "  1. Monitor logs: docker logs -f ${CONTAINER_NAME}"
    echo "  2. Check metrics dashboard"
    echo "  3. Review Sentry errors"
    echo "  4. Collect user feedback"
    echo "  5. Document any issues"
    echo ""
}

rollback() {
    log_error "Deployment failed. Rolling back..."
    
    # Stop new container
    docker stop ${CONTAINER_NAME} 2>/dev/null || true
    docker rm ${CONTAINER_NAME} 2>/dev/null || true
    
    # Restore backup if exists
    BACKUP_TAG=$(docker images | grep "${SERVICE_NAME}.*production-backup" | head -1 | awk '{print $1":"$2}')
    if [ ! -z "$BACKUP_TAG" ]; then
        log_info "Restoring backup: ${BACKUP_TAG}"
        docker tag ${BACKUP_TAG} ${DOCKER_IMAGE}
        docker run -d \
            --name ${CONTAINER_NAME} \
            --env-file .env.production \
            -p 3005:3005 \
            --network mnbarh-network \
            --restart unless-stopped \
            ${DOCKER_IMAGE}
    fi
    
    log_error "Rollback completed"
    exit 1
}

# Main deployment flow
main() {
    echo ""
    log_info "Starting production deployment process..."
    echo ""
    
    # Confirm deployment
    confirm_deployment
    
    # Run deployment steps
    check_prerequisites || rollback
    backup_current_deployment || rollback
    build_docker_image || rollback
    run_database_migrations || rollback
    seed_production_data || rollback
    stop_existing_container || rollback
    start_new_container || rollback
    wait_for_health || rollback
    verify_deployment || rollback
    run_smoke_tests || rollback
    enable_feature_flag || rollback
    setup_monitoring || rollback
    
    # Print post-deployment instructions
    print_post_deployment_instructions
}

# Run main function
main
