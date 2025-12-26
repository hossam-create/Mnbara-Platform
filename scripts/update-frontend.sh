#!/bin/bash

# 🌐 Mnbara Frontend Update Script
# Usage: ./scripts/update-frontend.sh [app-name] [version]
# Example: ./scripts/update-frontend.sh web-app v3.3.0

set -e

APP_NAME=$1
VERSION=$2
NAMESPACE="mnbara"
REGISTRY="mnbara"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🌐 Mnbara Frontend Update Script${NC}"
echo "=================================="

if [ -z "$APP_NAME" ] || [ -z "$VERSION" ]; then
    echo -e "${RED}❌ Usage: ./update-frontend.sh [app-name] [version]${NC}"
    echo "Available apps: web-app, admin-dashboard, system-control-dashboard"
    exit 1
fi

echo -e "${YELLOW}📦 Updating: $APP_NAME to $VERSION${NC}"

# Step 1: Build
echo -e "\n${YELLOW}1️⃣ Building frontend...${NC}"
cd frontend/$APP_NAME
npm run build || { echo -e "${RED}❌ Build failed!${NC}"; exit 1; }
echo -e "${GREEN}✅ Build successful${NC}"

# Step 2: Build Docker image
echo -e "\n${YELLOW}2️⃣ Building Docker image...${NC}"
docker build -t $REGISTRY/$APP_NAME:$VERSION .
echo -e "${GREEN}✅ Image built${NC}"

# Step 3: Push to registry
echo -e "\n${YELLOW}3️⃣ Pushing to registry...${NC}"
docker push $REGISTRY/$APP_NAME:$VERSION
echo -e "${GREEN}✅ Image pushed${NC}"

# Step 4: Update Kubernetes
echo -e "\n${YELLOW}4️⃣ Updating Kubernetes...${NC}"
kubectl set image deployment/$APP_NAME \
    $APP_NAME=$REGISTRY/$APP_NAME:$VERSION \
    -n $NAMESPACE

# Step 5: Wait for rollout
echo -e "\n${YELLOW}5️⃣ Waiting for rollout...${NC}"
kubectl rollout status deployment/$APP_NAME -n $NAMESPACE

echo -e "\n${GREEN}🎉 Frontend update complete!${NC}"
