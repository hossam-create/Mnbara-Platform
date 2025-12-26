#!/bin/bash

# ⏪ Mnbara Rollback Script
# Usage: ./scripts/rollback.sh [service-name] [revision]
# Example: ./scripts/rollback.sh auth-service 5

set -e

SERVICE_NAME=$1
REVISION=$2
NAMESPACE="mnbara"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}⏪ Mnbara Rollback Script${NC}"
echo "========================="

if [ -z "$SERVICE_NAME" ]; then
    echo -e "${RED}❌ Usage: ./rollback.sh [service-name] [revision]${NC}"
    echo "If revision is not specified, rolls back to previous version"
    exit 1
fi

echo -e "${YELLOW}⚠️  Rolling back: $SERVICE_NAME${NC}"

# Show current status
echo -e "\n${YELLOW}📊 Current deployment status:${NC}"
kubectl rollout history deployment/$SERVICE_NAME -n $NAMESPACE

# Rollback
if [ -z "$REVISION" ]; then
    echo -e "\n${YELLOW}⏪ Rolling back to previous version...${NC}"
    kubectl rollout undo deployment/$SERVICE_NAME -n $NAMESPACE
else
    echo -e "\n${YELLOW}⏪ Rolling back to revision $REVISION...${NC}"
    kubectl rollout undo deployment/$SERVICE_NAME --to-revision=$REVISION -n $NAMESPACE
fi

# Wait for rollback
echo -e "\n${YELLOW}⏳ Waiting for rollback to complete...${NC}"
kubectl rollout status deployment/$SERVICE_NAME -n $NAMESPACE

# Verify
echo -e "\n${YELLOW}✅ Verifying rollback:${NC}"
kubectl get pods -l app=$SERVICE_NAME -n $NAMESPACE

echo -e "\n${GREEN}🎉 Rollback complete!${NC}"
