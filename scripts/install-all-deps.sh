#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Installing All Dependencies${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to install dependencies for a service
install_service_deps() {
    local service_path=$1
    local service_name=$(basename $service_path)
    
    echo -e "${YELLOW}Installing dependencies for $service_name...${NC}"
    cd $service_path
    
    # Remove existing node_modules and lock file
    rm -rf node_modules package-lock.json
    
    # Install dependencies
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install dependencies for $service_name${NC}"
        cd - > /dev/null
        return 1
    fi
    
    echo -e "${GREEN}✓ $service_name dependencies installed${NC}"
    cd - > /dev/null
    return 0
}

# Install root dependencies
echo -e "${YELLOW}Installing root dependencies...${NC}"
rm -rf node_modules package-lock.json
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install root dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Root dependencies installed${NC}"
echo ""

# Install frontend dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
install_service_deps "frontend/web-app"
if [ $? -ne 0 ]; then
    exit 1
fi
echo ""

# Install backend services dependencies
echo -e "${YELLOW}Installing backend services dependencies...${NC}"
services=(
    "backend/services/listing-service-node"
    "backend/services/cart-service"
    "backend/services/payment-service"
    "backend/services/crowdship-service"
    "backend/services/compliance-service"
)

for service in "${services[@]}"; do
    install_service_deps $service
    if [ $? -ne 0 ]; then
        exit 1
    fi
    echo ""
done

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}All dependencies installed successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Verify setup: bash scripts/verify-nodejs-setup.sh"
echo "2. Start MVP: npm run start:mvp"
echo ""
