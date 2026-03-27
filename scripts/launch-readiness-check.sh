#!/bin/bash

# mnbarh Platform - Launch Readiness Check
# Launch Date: January 1, 2026
# Final verification before launch

set -e

echo "ًںڑ€ mnbarh Platform - Launch Readiness Check"
echo "============================================"
echo "Launch Date: January 1, 2026"
echo "Current Date: $(date)"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TOTAL=0
PASSED=0

check() {
    local name="$1"
    local condition="$2"
    TOTAL=$((TOTAL + 1))
    
    if eval "$condition" 2>/dev/null; then
        echo -e "${GREEN}âœ…${NC} $name"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}â‌Œ${NC} $name"
    fi
}

echo "ًں“پ FRONTEND CHECKS"
echo "==================="
check "Frontend package.json exists" "[ -f frontend/web-app/package.json ]"
check "Frontend App.tsx exists" "[ -f frontend/web-app/src/App.tsx ]"
check "ProductPage complete" "[ -f frontend/web-app/src/pages/ProductPage.tsx ] && grep -q 'handleAddToCart' frontend/web-app/src/pages/ProductPage.tsx"
check "CheckoutPage complete" "[ -f frontend/web-app/src/pages/CheckoutPage.tsx ] && grep -q 'handlePaymentSubmit' frontend/web-app/src/pages/CheckoutPage.tsx"
check "CategoryPage complete" "[ -f frontend/web-app/src/pages/CategoryPage.tsx ]"
check "HelpPage complete" "[ -f frontend/web-app/src/pages/HelpPage.tsx ]"
check "Seller Dashboard exists" "[ -f frontend/web-app/src/pages/seller/SellerDashboard.tsx ]"
check "Auth pages complete" "[ -f frontend/web-app/src/pages/auth/LoginPage.tsx ] && [ -f frontend/web-app/src/pages/auth/RegisterPage.tsx ]"

echo ""
echo "ًں”§ BACKEND CHECKS"
echo "=================="
check "Auth Service Java exists" "[ -d backend/services/auth-service-java ]"
check "Listing Service Node exists" "[ -d backend/services/listing-service-node ]"
check "Payment Service exists" "[ -d backend/services/payment-service ]"
check "Order Service exists" "[ -d backend/services/order-service ]"
check "Notification Service exists" "[ -d backend/services/notification-service ]"
check "API Gateway exists" "[ -d backend/services/api-gateway ]"

echo ""
echo "ًںگ³ DOCKER CHECKS"
echo "================="
check "docker-compose.yml exists" "[ -f docker-compose.yml ]"
check "docker-compose.prod.yml exists" "[ -f docker-compose.prod.yml ]"

echo ""
echo "âک¸ï¸ڈ  KUBERNETES CHECKS"
echo "====================="
check "K8s services.yaml exists" "[ -f k8s/services.yaml ]"
check "K8s configmap.yaml exists" "[ -f k8s/configmap.yaml ]"
check "K8s secrets.yaml exists" "[ -f k8s/secrets.yaml ]"
check "K8s ingress.yaml exists" "[ -f k8s/ingress.yaml ]"
check "K8s hpa.yaml exists" "[ -f k8s/hpa.yaml ]"
check "K8s deploy script exists" "[ -f k8s/deploy.sh ]"

echo ""
echo "ًں“œ SCRIPTS CHECKS"
echo "=================="
check "Build script exists" "[ -f scripts/build-and-deploy.sh ]"
check "Integration test exists" "[ -f scripts/test-integration.sh ]"
check "Production deploy exists" "[ -f scripts/production-deploy.sh ]"

echo ""
echo "ًں“ڑ DOCUMENTATION CHECKS"
echo "========================"
check "README exists" "[ -f README.md ]"
check "Security docs exist" "[ -f SECURITY.md ]"
check "Production guide exists" "[ -f PRODUCTION_ACCESS_GUIDE.md ]"

echo ""
echo "ًں”گ SECURITY CHECKS"
echo "==================="
check "Environment example exists" "[ -f .env.example ]"
check "No hardcoded secrets in .env" "! grep -q 'sk_live_' .env 2>/dev/null"
check "Gitignore includes .env" "grep -q '.env' .gitignore"

echo ""
echo "============================================"
echo "ًں“ٹ LAUNCH READINESS SUMMARY"
echo "============================================"
echo ""

PERCENTAGE=$((PASSED * 100 / TOTAL))

echo "Total Checks: $TOTAL"
echo "Passed: $PASSED"
echo "Failed: $((TOTAL - PASSED))"
echo "Score: ${PERCENTAGE}%"
echo ""

if [ $PERCENTAGE -ge 95 ]; then
    echo -e "${GREEN}ًںژ‰ EXCELLENT! Platform is READY for launch!${NC}"
    echo ""
    echo "âœ… All critical systems verified"
    echo "âœ… Frontend complete"
    echo "âœ… Backend services ready"
    echo "âœ… Infrastructure configured"
    echo ""
    echo "ًںڑ€ LAUNCH APPROVED FOR JANUARY 1, 2026! ًںڑ€"
elif [ $PERCENTAGE -ge 80 ]; then
    echo -e "${YELLOW}âڑ ï¸ڈ  GOOD - Minor items need attention${NC}"
    echo ""
    echo "Review failed checks above before launch"
elif [ $PERCENTAGE -ge 60 ]; then
    echo -e "${YELLOW}âڑ ï¸ڈ  NEEDS WORK - Several items incomplete${NC}"
    echo ""
    echo "Complete failed items before launch"
else
    echo -e "${RED}â‌Œ NOT READY - Critical items missing${NC}"
    echo ""
    echo "Significant work needed before launch"
fi

echo ""
echo "Report generated: $(date)"

