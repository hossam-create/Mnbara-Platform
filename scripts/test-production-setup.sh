#!/bin/bash

# ============================================
# Production Setup Test Script
# Test all production components before deployment
# ============================================

set -e

echo "🧪 Testing Production Setup"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FAILED_TESTS=0
TOTAL_TESTS=0

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${BLUE}Testing: $test_name${NC}"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS: $test_name${NC}"
    else
        echo -e "${RED}❌ FAIL: $test_name${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

echo -e "${BLUE}Step 1: Testing System Requirements${NC}"
run_test "Docker installed" "command -v docker"
run_test "Docker Compose installed" "command -v docker-compose"
run_test "Node.js installed" "command -v node"
run_test "PostgreSQL client installed" "command -v psql"
run_test "Nginx installed" "command -v nginx"

echo ""
echo -e "${BLUE}Step 2: Testing File Structure${NC}"
run_test "Production environment file exists" "test -f .env.production"
run_test "Docker compose production file exists" "test -f docker-compose.prod.yml"
run_test "Owner setup script exists" "test -f scripts/setup-owner.sh"
run_test "Owner SQL script exists" "test -f scripts/setup-owner-accounts.sql"
run_test "Production deploy script exists" "test -f scripts/production-deploy.sh"

echo ""
echo -e "${BLUE}Step 3: Testing Frontend Applications${NC}"
run_test "Web app package.json exists" "test -f frontend/web-app/package.json"
run_test "Admin dashboard package.json exists" "test -f frontend/admin-dashboard/package.json"
run_test "System control package.json exists" "test -f frontend/system-control-dashboard/package.json"

echo ""
echo -e "${BLUE}Step 4: Testing Backend Services${NC}"
run_test "Auth service exists" "test -f backend/services/auth-service/package.json"
run_test "Listing service exists" "test -f backend/services/listing-service/package.json"
run_test "Payment service exists" "test -f backend/services/payment-service/package.json"
run_test "Order service exists" "test -f backend/services/order-service/package.json"

echo ""
echo -e "${BLUE}Step 5: Testing Authentication Setup${NC}"
run_test "Admin AuthContext has proper login" "grep -q 'await authService.login' frontend/admin-dashboard/src/contexts/AuthContext.tsx"
run_test "System AuthContext has proper login" "grep -q '/api/system-auth/login' frontend/system-control-dashboard/src/contexts/AuthContext.tsx"
run_test "System AuthContext has MFA support" "grep -q 'mfaCode' frontend/system-control-dashboard/src/contexts/AuthContext.tsx"

echo ""
echo -e "${BLUE}Step 6: Testing Security Implementation${NC}"
run_test "System control has clearance levels" "grep -q 'clearanceLevel' frontend/system-control-dashboard/src/contexts/AuthContext.tsx"
run_test "System control has session timeout" "grep -q 'sessionTimeRemaining' frontend/system-control-dashboard/src/contexts/AuthContext.tsx"
run_test "Admin dashboard has role-based access" "grep -q 'hasRole' frontend/admin-dashboard/src/contexts/AuthContext.tsx"

echo ""
echo -e "${BLUE}Step 7: Testing Database Schema${NC}"
run_test "Auth service has Prisma schema" "test -f backend/services/auth-service/prisma/schema.prisma"
run_test "Listing service has Prisma schema" "test -f backend/services/listing-service/prisma/schema.prisma"
run_test "Payment service has Prisma schema" "test -f backend/services/payment-service/prisma/schema.prisma"
run_test "Order service has Prisma schema" "test -f backend/services/order-service/prisma/schema.prisma"

echo ""
echo -e "${BLUE}Step 8: Testing Configuration Files${NC}"
run_test "Kubernetes configs exist" "test -d k8s"
run_test "Monitoring configs exist" "test -f k8s/monitoring.yaml"
run_test "SSL config template exists" "test -f config/ssl-certificates.yaml"

echo ""
echo "============================================"
echo -e "${BLUE}TEST RESULTS SUMMARY${NC}"
echo "============================================"

PASSED_TESTS=$((TOTAL_TESTS - FAILED_TESTS))
PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo "Pass Rate: $PASS_RATE%"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}Production setup is ready for deployment.${NC}"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Run: ./scripts/production-deploy.sh"
    echo "2. Configure your domain DNS settings"
    echo "3. Update firewall rules"
    echo "4. Test the deployed applications"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}❌ SOME TESTS FAILED!${NC}"
    echo -e "${RED}Please fix the issues before deploying to production.${NC}"
    echo ""
    echo -e "${YELLOW}Common Issues:${NC}"
    echo "- Missing dependencies (install Docker, Node.js, etc.)"
    echo "- Missing configuration files"
    echo "- Incorrect file permissions"
    echo "- Missing environment variables"
    echo ""
    exit 1
fi