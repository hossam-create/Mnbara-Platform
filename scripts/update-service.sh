#!/bin/bash

# 🚀 Mnbara Service Update Script
# Usage: ./scripts/update-service.sh [service-name] [version]
# Example: ./scripts/update-service.sh auth-service v3.3.0

set -e

SERVICE_NAME=$1
VERSION=$2
NAMESPACE="mnbara"
REGISTRY="mnbara"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Mnbara Service Update Script${NC}"
echo "=================================="

# Validate inputs
if [ -z "$SERVICE_NAME" ] || [ -z "$VERSION" ]; then
    echo -e "${RED}❌ Usage: ./update-service.sh [service-name] [version]${NC}"
    echo "Example: ./update-service.sh auth-service v3.3.0"
    exit 1
fi

echo -e "${YELLOW}📦 Updating: $SERVICE_NAME to $VERSION${NC}"

# Step 1: Run tests
echo -e "\n${YELLOW}1️⃣ Running tests...${NC}"
cd backend/services/$SERVICE_NAME
npm run test || { echo -e "${RED}❌ Tests failed!${NC}"; exit 1; }
echo -e "${GREEN}✅ Tests passed${NC}"

# Step 2: Build Docker image
echo -e "\n${YELLOW}2️⃣ Building Docker image...${NC}"
docker build -t $REGISTRY/$SERVICE_NAME:$VERSION .
echo -e "${GREEN}✅ Image built${NC}"

# Step 3: Push to registry
echo -e "\n${YELLOW}3️⃣ Pushing to registry...${NC}"
docker push $REGISTRY/$SERVICE_NAME:$VERSION
echo -e "${GREEN}✅ Image pushed${NC}"

# Step 4: Update Kubernetes deployment
echo -e "\n${YELLOW}4️⃣ Updating Kubernetes deployment...${NC}"
kubectl set image deployment/$SERVICE_NAME \
    $SERVICE_NAME=$REGISTRY/$SERVICE_NAME:$VERSION \
    -n $NAMESPACE

# Step 5: Wait for rollout
echo -e "\n${YELLOW}5️⃣ Waiting for rollout...${NC}"
kubectl rollout status deployment/$SERVICE_NAME -n $NAMESPACE

# Step 6: Verify
echo -e "\n${YELLOW}6️⃣ Verifying deployment...${NC}"
kubectl get pods -l app=$SERVICE_NAME -n $NAMESPACE

echo -e "\n${GREEN}🎉 Update complete! $SERVICE_NAME is now running $VERSION${NC}"
