#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Node.js Environment Fix Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Check Node.js and npm versions
echo -e "${YELLOW}Step 1: Checking Node.js and npm versions...${NC}"
node_version=$(node --version)
npm_version=$(npm --version)
echo -e "${GREEN}Node.js version: $node_version${NC}"
echo -e "${GREEN}npm version: $npm_version${NC}"
echo ""

# Step 2: Clean up node_modules and lock files
echo -e "${YELLOW}Step 2: Cleaning up node_modules and lock files...${NC}"
echo "Removing root node_modules..."
rm -rf node_modules package-lock.json

echo "Removing frontend node_modules..."
rm -rf frontend/web-app/node_modules frontend/web-app/package-lock.json

echo "Removing backend services node_modules..."
find backend/services -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
find backend/services -name "package-lock.json" -type f -delete 2>/dev/null || true

echo -e "${GREEN}Cleanup completed${NC}"
echo ""

# Step 3: Clear npm cache
echo -e "${YELLOW}Step 3: Clearing npm cache...${NC}"
npm cache clean --force
echo -e "${GREEN}npm cache cleared${NC}"
echo ""

# Step 4: Install root dependencies
echo -e "${YELLOW}Step 4: Installing root dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install root dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}Root dependencies installed${NC}"
echo ""

# Step 5: Install frontend dependencies
echo -e "${YELLOW}Step 5: Installing frontend dependencies...${NC}"
cd frontend/web-app
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install frontend dependencies${NC}"
    exit 1
fi
cd ../..
echo -e "${GREEN}Frontend dependencies installed${NC}"
echo ""

# Step 6: Install backend services dependencies
echo -e "${YELLOW}Step 6: Installing backend services dependencies...${NC}"

services=(
    "listing-service-node"
    "cart-service"
    "payment-service"
    "crowdship-service"
    "compliance-service"
)

for service in "${services[@]}"; do
    echo "Installing dependencies for $service..."
    cd backend/services/$service
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install dependencies for $service${NC}"
        exit 1
    fi
    cd ../../..
    echo -e "${GREEN}$service dependencies installed${NC}"
done
echo ""

# Step 7: Verify installations
echo -e "${YELLOW}Step 7: Verifying installations...${NC}"
echo "Checking vite..."
npx vite --version
if [ $? -ne 0 ]; then
    echo -e "${RED}Vite verification failed${NC}"
    exit 1
fi

echo "Checking TypeScript..."
npx tsc --version
if [ $? -ne 0 ]; then
    echo -e "${RED}TypeScript verification failed${NC}"
    exit 1
fi
echo -e "${GREEN}All verifications passed${NC}"
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Node.js Environment Fix Completed!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Run: npm run start:mvp"
echo "2. Or run individual services:"
echo "   - npm run dev:listing"
echo "   - npm run dev:cart"
echo "   - npm run dev:payment"
echo ""
