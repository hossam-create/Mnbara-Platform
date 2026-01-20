#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Node.js Setup Verification Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

failed=0

# Check Node.js
echo -e "${YELLOW}Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    node_version=$(node --version)
    echo -e "${GREEN}✓ Node.js installed: $node_version${NC}"
else
    echo -e "${RED}✗ Node.js not found${NC}"
    failed=1
fi
echo ""

# Check npm
echo -e "${YELLOW}Checking npm...${NC}"
if command -v npm &> /dev/null; then
    npm_version=$(npm --version)
    echo -e "${GREEN}✓ npm installed: $npm_version${NC}"
else
    echo -e "${RED}✗ npm not found${NC}"
    failed=1
fi
echo ""

# Check root node_modules
echo -e "${YELLOW}Checking root node_modules...${NC}"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ Root node_modules exists${NC}"
else
    echo -e "${RED}✗ Root node_modules missing${NC}"
    failed=1
fi
echo ""

# Check frontend node_modules
echo -e "${YELLOW}Checking frontend node_modules...${NC}"
if [ -d "frontend/web-app/node_modules" ]; then
    echo -e "${GREEN}✓ Frontend node_modules exists${NC}"
else
    echo -e "${RED}✗ Frontend node_modules missing${NC}"
    failed=1
fi
echo ""

# Check vite
echo -e "${YELLOW}Checking vite...${NC}"
if npx vite --version &> /dev/null; then
    vite_version=$(npx vite --version)
    echo -e "${GREEN}✓ Vite available: $vite_version${NC}"
else
    echo -e "${RED}✗ Vite not available${NC}"
    failed=1
fi
echo ""

# Check TypeScript
echo -e "${YELLOW}Checking TypeScript...${NC}"
if npx tsc --version &> /dev/null; then
    tsc_version=$(npx tsc --version)
    echo -e "${GREEN}✓ TypeScript available: $tsc_version${NC}"
else
    echo -e "${RED}✗ TypeScript not available${NC}"
    failed=1
fi
echo ""

# Check backend services
echo -e "${YELLOW}Checking backend services node_modules...${NC}"
services=(
    "listing-service-node"
    "cart-service"
    "payment-service"
    "crowdship-service"
    "compliance-service"
)

for service in "${services[@]}"; do
    if [ -d "backend/services/$service/node_modules" ]; then
        echo -e "${GREEN}✓ $service node_modules exists${NC}"
    else
        echo -e "${RED}✗ $service node_modules missing${NC}"
        failed=1
    fi
done
echo ""

# Check Docker
echo -e "${YELLOW}Checking Docker...${NC}"
if command -v docker &> /dev/null; then
    docker_version=$(docker --version)
    echo -e "${GREEN}✓ Docker installed: $docker_version${NC}"
else
    echo -e "${RED}✗ Docker not found${NC}"
    failed=1
fi
echo ""

# Check Docker Compose
echo -e "${YELLOW}Checking Docker Compose...${NC}"
if command -v docker-compose &> /dev/null; then
    compose_version=$(docker-compose --version)
    echo -e "${GREEN}✓ Docker Compose installed: $compose_version${NC}"
else
    echo -e "${RED}✗ Docker Compose not found${NC}"
    failed=1
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
if [ $failed -eq 0 ]; then
    echo -e "${GREEN}All checks passed! ✓${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "${YELLOW}You can now run:${NC}"
    echo "  npm run start:mvp"
    exit 0
else
    echo -e "${RED}Some checks failed! ✗${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Please run:${NC}"
    echo "  bash scripts/fix-nodejs-env.sh"
    exit 1
fi
