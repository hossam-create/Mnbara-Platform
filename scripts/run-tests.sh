#!/bin/bash

# ًں§ھ mnbarh Test Runner Script
# Usage: ./scripts/run-tests.sh [service] [coverage]
# Example: ./scripts/run-tests.sh voice-commerce-service true

set -e

SERVICE=$1
COVERAGE=$2

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}ًں§ھ mnbarh Test Runner${NC}"
echo "======================"

# If no service specified, run all tests
if [ -z "$SERVICE" ]; then
    echo -e "${YELLOW}Running all tests...${NC}"
    npm run test:all
    
    if [ "$COVERAGE" == "true" ]; then
        echo -e "\n${YELLOW}ًں“ٹ Generating coverage report...${NC}"
        npm run test:coverage
    fi
    exit 0
fi

# Run specific service tests
echo -e "${YELLOW}Running tests for: $SERVICE${NC}"

if [ ! -d "backend/services/$SERVICE" ]; then
    echo -e "${RED}â‌Œ Service not found: $SERVICE${NC}"
    exit 1
fi

cd backend/services/$SERVICE

# Run tests
echo -e "\n${BLUE}ًں“‌ Running unit tests...${NC}"
npm run test

# Run with coverage if requested
if [ "$COVERAGE" == "true" ]; then
    echo -e "\n${BLUE}ًں“ٹ Running with coverage...${NC}"
    npm run test:coverage
    
    echo -e "\n${GREEN}âœ… Coverage report generated${NC}"
    echo -e "${BLUE}ًں“پ View report: coverage/index.html${NC}"
fi

echo -e "\n${GREEN}ًںژ‰ Tests complete!${NC}"

