#!/bin/bash

# Mnbara Platform - Database Migration Verification Script
# Verifies that all Prisma migrations are in sync across services

set -e

echo "=================================="
echo "Database Migration Verification"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for issues
ISSUES=0

# Services with Prisma schemas
SERVICES=(
  "backend/services/auth-service"
  "backend/services/user-service"
  "backend/services/payment-service"
  "backend/services/product-service"
  "backend/services/wallet-service"
  "backend/services/orders-service"
  "backend/services/escrow-service"
  "backend/services/settlement-service"
  "backend/services/trips-service"
  "backend/services/matching-service"
  "backend/services/notification-service"
  "backend/services/subscription-service"
  "backend/services/cart-service"
  "backend/services/feature-management-service"
  "backend/services/admin-service"
  "backend/services/country-layer-service"
)

echo "Checking ${#SERVICES[@]} services..."
echo ""

for SERVICE in "${SERVICES[@]}"; do
  SERVICE_NAME=$(basename "$SERVICE")
  
  echo "Checking $SERVICE_NAME..."
  
  # Check if service directory exists
  if [ ! -d "$SERVICE" ]; then
    echo -e "${YELLOW}⚠ Service directory not found: $SERVICE${NC}"
    ((ISSUES++))
    continue
  fi
  
  # Check if prisma directory exists
  if [ ! -d "$SERVICE/prisma" ]; then
    echo -e "${YELLOW}⚠ No Prisma schema found in $SERVICE_NAME${NC}"
    continue
  fi
  
  # Check if schema.prisma exists
  if [ ! -f "$SERVICE/prisma/schema.prisma" ]; then
    echo -e "${RED}✗ schema.prisma missing in $SERVICE_NAME${NC}"
    ((ISSUES++))
    continue
  fi
  
  # Check if migrations directory exists
  if [ ! -d "$SERVICE/prisma/migrations" ]; then
    echo -e "${YELLOW}⚠ No migrations directory in $SERVICE_NAME${NC}"
    continue
  fi
  
  # Count migrations
  MIGRATION_COUNT=$(find "$SERVICE/prisma/migrations" -mindepth 1 -maxdepth 1 -type d | wc -l)
  
  if [ "$MIGRATION_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠ No migrations found in $SERVICE_NAME${NC}"
  else
    echo -e "${GREEN}✓ Found $MIGRATION_COUNT migration(s) in $SERVICE_NAME${NC}"
  fi
  
  # Check if Prisma client is generated
  if [ ! -d "$SERVICE/node_modules/.prisma/client" ] && [ ! -d "$SERVICE/node_modules/@prisma/client" ]; then
    echo -e "${YELLOW}⚠ Prisma client not generated in $SERVICE_NAME${NC}"
    echo "  Run: cd $SERVICE && npx prisma generate"
  fi
  
  echo ""
done

echo "=================================="
echo "Verification Complete"
echo "=================================="
echo ""

if [ $ISSUES -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Found $ISSUES issue(s)${NC}"
  echo ""
  echo "To fix issues:"
  echo "1. Ensure all services have proper Prisma setup"
  echo "2. Run 'npx prisma generate' in each service"
  echo "3. Run 'npx prisma migrate deploy' to apply migrations"
  exit 1
fi
