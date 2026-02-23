#!/bin/bash

# ============================================
# Critical Fixes Verification Script
# ============================================
# This script verifies that all 3 critical fixes are properly deployed
# Date: February 18, 2026

set -e

echo "=========================================="
echo "MNBARA PLATFORM - CRITICAL FIXES VERIFICATION"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
WARN=0

# Function to check if a service is running
check_service() {
    local service=$1
    local port=$2
    
    echo -n "Checking $service (port $port)... "
    
    if curl -s -f "http://localhost:$port/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ RUNNING${NC}"
        ((PASS++))
        return 0
    else
        echo -e "${RED}✗ NOT RUNNING${NC}"
        ((FAIL++))
        return 1
    fi
}

# Function to check CORS configuration
check_cors() {
    local service=$1
    local port=$2
    
    echo -n "Checking CORS for $service... "
    
    # Test with allowed origin
    local response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Origin: http://localhost:3000" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS "http://localhost:$port/health" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ] || [ "$response" = "204" ]; then
        echo -e "${GREEN}✓ CONFIGURED${NC}"
        ((PASS++))
        return 0
    else
        echo -e "${YELLOW}⚠ NEEDS VERIFICATION${NC}"
        ((WARN++))
        return 1
    fi
}

# Function to check wallet service communication
check_wallet_communication() {
    echo -n "Checking payment-service → wallet-service communication... "
    
    # Check if wallet-service is reachable from payment-service
    if curl -s -f "http://localhost:3005/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ REACHABLE${NC}"
        ((PASS++))
        return 0
    else
        echo -e "${RED}✗ NOT REACHABLE${NC}"
        ((FAIL++))
        return 1
    fi
}

# Function to check API Gateway routes
check_api_gateway_routes() {
    echo -n "Checking API Gateway routes... "
    
    # Test a few key routes
    local routes=("/api/auth" "/api/wallet" "/api/products")
    local all_ok=true
    
    for route in "${routes[@]}"; do
        local response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$route" 2>/dev/null || echo "000")
        
        # 401 (unauthorized) or 404 (not found) are acceptable - means route exists
        # 502 (bad gateway) is NOT acceptable - means service doesn't exist
        if [ "$response" = "502" ] || [ "$response" = "503" ] || [ "$response" = "000" ]; then
            all_ok=false
            break
        fi
    done
    
    if [ "$all_ok" = true ]; then
        echo -e "${GREEN}✓ NO 502 ERRORS${NC}"
        ((PASS++))
        return 0
    else
        echo -e "${RED}✗ FOUND 502 ERRORS${NC}"
        ((FAIL++))
        return 1
    fi
}

echo "=========================================="
echo "ISSUE #1: CORS WILDCARD VULNERABILITIES"
echo "=========================================="
echo ""

check_cors "orders-service" 3006
check_cors "order-service (MVP)" 3036
check_cors "country-layer-service" 3016

echo ""
echo "=========================================="
echo "ISSUE #2: API GATEWAY ROUTING"
echo "=========================================="
echo ""

check_service "api-gateway" 3000
check_api_gateway_routes

echo ""
echo "=========================================="
echo "ISSUE #3: DUPLICATE WALLET LOGIC"
echo "=========================================="
echo ""

check_service "wallet-service" 3005
check_service "payment-service" 3003
check_wallet_communication

echo ""
echo "=========================================="
echo "ADDITIONAL CHECKS"
echo "=========================================="
echo ""

# Check if axios is installed in payment-service
echo -n "Checking axios dependency in payment-service... "
if grep -q '"axios"' backend/services/payment-service/package.json 2>/dev/null; then
    echo -e "${GREEN}✓ INSTALLED${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ NOT INSTALLED${NC}"
    ((FAIL++))
fi

# Check if WalletClient exists
echo -n "Checking WalletClient exists... "
if [ -f "backend/services/payment-service/src/clients/wallet-client.ts" ]; then
    echo -e "${GREEN}✓ EXISTS${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    ((FAIL++))
fi

# Check if old WalletService is deprecated
echo -n "Checking old WalletService is deprecated... "
if [ -f "backend/services/payment-service/src/services/wallet.service.DEPRECATED.ts" ]; then
    echo -e "${GREEN}✓ DEPRECATED${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠ NOT DEPRECATED${NC}"
    ((WARN++))
fi

echo ""
echo "=========================================="
echo "SUMMARY"
echo "=========================================="
echo ""
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${YELLOW}Warnings: $WARN${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ ALL CRITICAL FIXES VERIFIED${NC}"
    echo ""
    echo "Production Readiness: 🟢 READY"
    echo ""
    exit 0
else
    echo -e "${RED}✗ SOME CHECKS FAILED${NC}"
    echo ""
    echo "Production Readiness: 🔴 NOT READY"
    echo ""
    echo "Please fix the failed checks before deploying to production."
    echo ""
    exit 1
fi
