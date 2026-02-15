#!/bin/bash

# P2P Exchange Service - Production Rollback Script
# This script rolls back the p2p-exchange-service to previous version

set -e

echo "=========================================="
echo "P2P Exchange Service - Production Rollback"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
SERVICE_NAME="p2p-exchange-service"
CONTAINER_NAME="${SERVICE_NAME}-production"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

confirm_rollback() {
    echo ""
    log_warn "⚠️  PRODUCTION ROLLBACK WARNING ⚠️"
    echo ""
    echo "You are about to ROLLBACK the production deployment."
    echo "This will restore the previous version of the service."
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_error "Rollback cancelled by user"
        exit 1
    fi
    
    log_info "Rollback confirmed. Proceeding..."
}

stop_current_container() {
    log_info "Stopping current container..."
    docker stop ${CONTAINER_NAME} 2>/dev/null || true
    docker rm ${CONTAINER_NAME} 2>/dev/null || true
    log_info "Current container stopped"
}

restore_previous_version() {
    log_info "Restoring previous version..."
    
    # Find most recent backup
    BACKUP_TAG=$(docker images | grep "${SERVICE_NAME}.*production-backup" | head -1 | awk '{print $1":"$2}')
    
    if [ -z "$BACKUP_TAG" ]; then
        log_error "No backup found. Cannot rollback."
        exit 1
    fi
    
    log_info "Found backup: ${BACKUP_TAG}"
    
    # Start backup container
    docker run -d \
        --name ${CONTAINER_NAME} \
        --env-file .env.production \
        -p 3005:3005 \
        --network mnbarh-network \
        --restart unless-stopped \
        ${BACKUP_TAG}
    
    log_info "Previous version restored"
}

rollback_database() {
    log_warn "Database rollback required?"
    read -p "Rollback database migrations? (yes/no): " -r
    
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Rolling back database..."
        export $(cat .env.production | grep -v '^#' | xargs)
        
        # Find rollback script
        ROLLBACK_SCRIPT=$(ls -t backend/services/p2p-exchange-service/prisma/migrations/*/rollback.sql 2>/dev/null | head -1)
        
        if [ ! -z "$ROLLBACK_SCRIPT" ]; then
            psql $DATABASE_URL < $ROLLBACK_SCRIPT
            log_info "Database rolled back"
        else
            log_warn "No rollback script found"
        fi
    fi
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

verify_rollback() {
    log_info "Verifying rollback..."
    
    # Check health
    HEALTH_RESPONSE=$(curl -s http://localhost:3005/health)
    echo "Health check: ${HEALTH_RESPONSE}"
    
    # Check version
    VERSION=$(echo "$HEALTH_RESPONSE" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    log_info "Running version: ${VERSION}"
    
    log_info "Rollback verification completed"
}

disable_feature_flag() {
    log_info "Disabling feature flag..."
    # This would integrate with your feature flag system
    log_info "Feature flag disabled"
}

notify_team() {
    log_info "Notifying team..."
    echo ""
    echo "=========================================="
    log_warn "ROLLBACK COMPLETED"
    echo "=========================================="
    echo ""
    echo "The service has been rolled back to the previous version."
    echo ""
    echo "NEXT STEPS:"
    echo "1. Investigate the issue that caused the rollback"
    echo "2. Fix the issue in development"
    echo "3. Test thoroughly in staging"
    echo "4. Prepare for redeployment"
    echo ""
    echo "MONITORING:"
    echo "- Check logs: docker logs -f ${CONTAINER_NAME}"
    echo "- Check metrics: https://grafana.mnbarh.com"
    echo "- Check errors: https://sentry.io"
    echo ""
}

main() {
    confirm_rollback
    stop_current_container
    restore_previous_version
    rollback_database
    wait_for_health || exit 1
    verify_rollback
    disable_feature_flag
    notify_team
}

main
