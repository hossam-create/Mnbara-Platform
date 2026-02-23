#!/bin/bash

# Mnbara Platform - Pre-Launch Checklist Script
# Automated verification of all production readiness requirements

set -e

echo "=========================================="
echo "Mnbara Platform - Pre-Launch Checklist"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
check_pass() {
  echo -e "${GREEN}✓ $1${NC}"
  ((PASSED++))
}

check_fail() {
  echo -e "${RED}✗ $1${NC}"
  ((FAILED++))
}

check_warn() {
  echo -e "${YELLOW}⚠ $1${NC}"
  ((WARNINGS++))
}

section() {
  echo ""
  echo -e "${BLUE}=== $1 ===${NC}"
  echo ""
}

# 1. Environment Variables
section "1. Environment Variables"

if [ -f ".env" ]; then
  check_fail ".env file found in root (should be gitignored)"
else
  check_pass ".env file not in repository"
fi

if [ -f ".env.example" ]; then
  check_pass ".env.example template exists"
else
  check_warn ".env.example template missing"
fi

# 2. Security Checks
section "2. Security Checks"

# Check for hardcoded secrets
if grep -r "sk_live_" backend/ --include="*.ts" --include="*.js" 2>/dev/null; then
  check_fail "Found hardcoded Stripe live keys"
else
  check_pass "No hardcoded Stripe live keys"
fi

if grep -r "password.*=.*['\"]" backend/ --include="*.ts" --include="*.js" 2>/dev/null | grep -v "PASSWORD" | grep -v "process.env"; then
  check_warn "Possible hardcoded passwords found"
else
  check_pass "No obvious hardcoded passwords"
fi

# 3. Database Migrations
section "3. Database Migrations"

if [ -x "./scripts/verify-migrations.sh" ]; then
  if ./scripts/verify-migrations.sh > /dev/null 2>&1; then
    check_pass "All database migrations verified"
  else
    check_fail "Database migration verification failed"
  fi
else
  check_warn "Migration verification script not executable"
fi

# 4. Service Health Checks
section "4. Service Health Checks"

SERVICES=(
  "auth-service"
  "user-service"
  "payment-service"
  "product-service"
  "wallet-service"
  "orders-service"
  "escrow-service"
  "notification-service"
)

for SERVICE in "${SERVICES[@]}"; do
  if [ -f "backend/services/$SERVICE/src/index.ts" ] || [ -f "backend/services/$SERVICE/src/main.ts" ]; then
    if grep -q "/health" "backend/services/$SERVICE/src/"*.ts 2>/dev/null; then
      check_pass "$SERVICE has health check endpoint"
    else
      check_warn "$SERVICE missing health check endpoint"
    fi
  fi
done

# 5. Docker Configuration
section "5. Docker Configuration"

if [ -f "docker-compose.yml" ]; then
  check_pass "docker-compose.yml exists"
  
  # Check for port conflicts
  if grep -E "^\s+- \"[0-9]+:[0-9]+\"" docker-compose.yml | sort | uniq -d | grep -q .; then
    check_fail "Port conflicts detected in docker-compose.yml"
  else
    check_pass "No port conflicts in docker-compose.yml"
  fi
else
  check_fail "docker-compose.yml missing"
fi

# 6. Package Dependencies
section "6. Package Dependencies"

if command -v npm &> /dev/null; then
  check_pass "npm is installed"
else
  check_fail "npm is not installed"
fi

if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  check_pass "Node.js is installed ($NODE_VERSION)"
else
  check_fail "Node.js is not installed"
fi

# 7. Git Status
section "7. Git Status"

if git diff --quiet; then
  check_pass "No uncommitted changes"
else
  check_warn "Uncommitted changes detected"
fi

if git ls-files --others --exclude-standard | grep -q .; then
  check_warn "Untracked files detected"
else
  check_pass "No untracked files"
fi

# 8. Documentation
section "8. Documentation"

REQUIRED_DOCS=(
  "README.md"
  "DEPLOYMENT_CHECKLIST.md"
  "ARCHITECTURE_STANDARDS.md"
)

for DOC in "${REQUIRED_DOCS[@]}"; do
  if [ -f "$DOC" ]; then
    check_pass "$DOC exists"
  else
    check_warn "$DOC missing"
  fi
done

# 9. Test Coverage
section "9. Test Coverage"

if [ -d "backend/services/wallet-service/src/__tests__" ]; then
  check_pass "Wallet service has tests"
else
  check_warn "Wallet service missing tests"
fi

if [ -d "backend/services/payment-service/src/__tests__" ]; then
  check_pass "Payment service has tests"
else
  check_warn "Payment service missing tests"
fi

# 10. Rate Limiting
section "10. Rate Limiting"

if [ -f "backend/shared/middleware/rate-limiter.ts" ]; then
  check_pass "Rate limiter middleware exists"
else
  check_warn "Rate limiter middleware missing"
fi

# Summary
echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ Pre-launch checklist PASSED!${NC}"
  echo ""
  echo "Platform is ready for production deployment."
  exit 0
else
  echo -e "${RED}✗ Pre-launch checklist FAILED!${NC}"
  echo ""
  echo "Please fix the failed checks before deploying to production."
  exit 1
fi
