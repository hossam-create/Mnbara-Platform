#!/bin/bash

# âڈھ mnbarh Rollback Script
# Usage: ./scripts/rollback.sh [service-name] [revision]
# Example: ./scripts/rollback.sh auth-service 5

set -e

SERVICE_NAME=$1
REVISION=$2
NAMESPACE="mnbarh"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}âڈھ mnbarh Rollback Script${NC}"
echo "========================="

if [ -z "$SERVICE_NAME" ]; then
    echo -e "${RED}â‌Œ Usage: ./rollback.sh [service-name] [revision]${NC}"
    echo "If revision is not specified, rolls back to previous version"
    exit 1
fi

echo -e "${YELLOW}âڑ ï¸ڈ  Rolling back: $SERVICE_NAME${NC}"

# Show current status
echo -e "\n${YELLOW}ًں“ٹ Current deployment status:${NC}"
kubectl rollout history deployment/$SERVICE_NAME -n $NAMESPACE

# Rollback
if [ -z "$REVISION" ]; then
    echo -e "\n${YELLOW}âڈھ Rolling back to previous version...${NC}"
    kubectl rollout undo deployment/$SERVICE_NAME -n $NAMESPACE
else
    echo -e "\n${YELLOW}âڈھ Rolling back to revision $REVISION...${NC}"
    kubectl rollout undo deployment/$SERVICE_NAME --to-revision=$REVISION -n $NAMESPACE
fi

# Wait for rollback
echo -e "\n${YELLOW}âڈ³ Waiting for rollback to complete...${NC}"
kubectl rollout status deployment/$SERVICE_NAME -n $NAMESPACE

# Verify
echo -e "\n${YELLOW}âœ… Verifying rollback:${NC}"
kubectl get pods -l app=$SERVICE_NAME -n $NAMESPACE

echo -e "\n${GREEN}ًںژ‰ Rollback complete!${NC}"

