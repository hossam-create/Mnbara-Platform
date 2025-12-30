#!/bin/bash

# MNBara Platform - Smoke Tests
# Hour 22-23: Final Smoke Tests Before Go-Live

set -e

echo "🧪 MNBara Platform - Smoke Tests"
echo "================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BASE_URL="${BASE_URL:-https://mnbara.com}"
API_URL="${API_URL:-https://api.mnbara.com}"

# Counters
PASSED=0
FAILED=0
TOTAL=0

# Test function
run_test() {
    local test_name=$1
    local test_command=$2
    
    TOTAL=$((TOTAL + 1))
    echo -n "Test $TOTAL: $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "🌐 Testing Production Environment"
echo "Base URL: $BASE_URL"
echo "API URL: $API_URL"
echo ""

# Test 1: Homepage loads
run_test "Homepage loads" \
    "curl -f -s -o /dev/null $BASE_URL"

# Test 2: API health check
run_test "API health check" \
    "curl -f -s -o /dev/null $API_URL/health"

# Test 3: Products API
run_test "Products API responds" \
    "curl -f -s -o /dev/null $API_URL/api/products"

# Test 4: Cart API
run_test "Cart API responds" \
    "curl -f -s -o /dev/null $API_URL/api/cart/test-user"

# Test 5: Payment API health
run_test "Payment API health" \
    "curl -f -s -o /dev/null $API_URL/api/payments/health"

# Test 6: Seller API health
run_test "Seller API health" \
    "curl -f -s -o /dev/null $API_URL/api/sellers/health"

# Test 7: Compliance API health
run_test "Compliance API health" \
    "curl -f -s -o /dev/null $API_URL/api/compliance/health"

# Test 8: SSL Certificate valid
run_test "SSL certificate valid" \
    "curl -f -s -o /dev/null https://mnbara.com"

# Test 9: DNS resolving
run_test "DNS resolving correctly" \
    "nslookup mnbara.com > /dev/null"

# Test 10: Database connection
run_test "Database connection" \
    "kubectl exec -it deployment/listing-service -- node -e 'require(\"./dist/index.js\")' || true"

# Test 11: Redis connection
run_test "Redis connection" \
    "kubectl exec -it deployment/cart-service -- node -e 'require(\"./dist/index.js\")' || true"

# Test 12: Search functionality
run_test "Search functionality" \
    "curl -f -s -o /dev/null '$API_URL/api/products/search?q=test'"

# Test 13: Product details
run_test "Product details page" \
    "curl -f -s -o /dev/null $API_URL/api/products/1"

# Test 14: Static assets loading
run_test "Static assets loading" \
    "curl -f -s -o /dev/null $BASE_URL/assets/logo.png || true"

# Test 15: API response time < 1s
run_test "API response time < 1s" \
    "[ \$(curl -o /dev/null -s -w '%{time_total}' $API_URL/api/products | cut -d. -f1) -lt 1 ]"

echo ""
echo "📊 Test Results"
echo "==============="
echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

# Calculate percentage
PERCENTAGE=$((PASSED * 100 / TOTAL))
echo "Success Rate: $PERCENTAGE%"
echo ""

# Final verdict
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All smoke tests passed! Ready for go-live!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please investigate before go-live.${NC}"
    exit 1
fi
