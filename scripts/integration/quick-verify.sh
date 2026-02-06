#!/bin/bash

# Quick Verification Script
# Fast check of critical services and integrations

set -e

echo "⚡ Quick verification of Mnbara platform..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
passed=0
failed=0

# Function to test endpoint
test_endpoint() {
  local name=$1
  local url=$2
  
  if curl -s -f "$url" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} $name"
    passed=$((passed + 1))
  else
    echo -e "${RED}✗${NC} $name"
    failed=$((failed + 1))
  fi
}

# Test critical services
echo "Testing Critical Services:"
test_endpoint "Auth Service" "http://localhost:3014/health"
test_endpoint "Listing Service" "http://localhost:3001/health"
test_endpoint "Auction Service" "http://localhost:3002/health"
test_endpoint "Payment Service" "http://localhost:3003/health"
test_endpoint "Internal Ledger" "http://localhost:3009/health"

echo ""
echo "Testing New Services:"
test_endpoint "AI Recommendations" "http://localhost:3010/health"
test_endpoint "Stripe Connect" "http://localhost:3012/health"
test_endpoint "Chat Service" "http://localhost:3016/health"
test_endpoint "Search Service" "http://localhost:3023/health"
test_endpoint "AI Agent Service" "http://localhost:3029/health"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Quick Verification Summary:"
echo -e "  ${GREEN}Passed: $passed${NC}"
echo -e "  ${RED}Failed: $failed${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $failed -eq 0 ]; then
  echo ""
  echo -e "${GREEN}🎉 All critical services are running!${NC}"
  exit 0
else
  echo ""
  echo -e "${YELLOW}⚠️  Some services are not responding. Check logs.${NC}"
  exit 1
fi
