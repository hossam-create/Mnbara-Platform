#!/bin/bash

# P2P Exchange Service - Smoke Tests
# Quick tests to verify basic functionality after deployment

set -e

echo "=========================================="
echo "P2P Exchange Service - Smoke Tests"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3005}"
ADMIN_TOKEN="${ADMIN_TOKEN:-test-admin-token}"
USER_TOKEN="${USER_TOKEN:-test-user-token}"

# Counters
PASSED=0
FAILED=0

# Functions
log_pass() {
    echo -e "${GREEN}✓${NC} $1"
    PASSED=$((PASSED + 1))
}

log_fail() {
    echo -e "${RED}✗${NC} $1"
    FAILED=$((FAILED + 1))
}

log_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Test 1: Health Check
test_health_check() {
    log_info "Test 1: Health Check"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" ${BASE_URL}/health)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        STATUS=$(echo "$BODY" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        if [ "$STATUS" = "healthy" ]; then
            log_pass "Health check returned healthy status"
        else
            log_fail "Health check returned unhealthy status: $STATUS"
        fi
    else
        log_fail "Health check failed with HTTP $HTTP_CODE"
    fi
    echo ""
}

# Test 2: Metrics Endpoint
test_metrics() {
    log_info "Test 2: Metrics Endpoint"
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/metrics)
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        log_pass "Metrics endpoint accessible"
    else
        log_fail "Metrics endpoint failed with HTTP $HTTP_CODE"
    fi
    echo ""
}

# Test 3: Database Connection
test_database() {
    log_info "Test 3: Database Connection"
    
    RESPONSE=$(curl -s ${BASE_URL}/health)
    DB_STATUS=$(echo "$RESPONSE" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$DB_STATUS" = "connected" ]; then
        log_pass "Database connection successful"
    else
        log_fail "Database connection failed: $DB_STATUS"
    fi
    echo ""
}

# Test 4: Redis Connection
test_redis() {
    log_info "Test 4: Redis Connection"
    
    RESPONSE=$(curl -s ${BASE_URL}/health)
    REDIS_STATUS=$(echo "$RESPONSE" | grep -o '"redis":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$REDIS_STATUS" = "connected" ]; then
        log_pass "Redis connection successful"
    else
        log_fail "Redis connection failed: $REDIS_STATUS"
    fi
    echo ""
}

# Test 5: Marketplace API (Unauthenticated)
test_marketplace_api() {
    log_info "Test 5: Marketplace API"
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/api/v1/exchange/marketplace)
    
    # Should return 401 (unauthorized) or 200 (if public)
    if [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 200 ]; then
        log_pass "Marketplace API endpoint accessible (HTTP $HTTP_CODE)"
    else
        log_fail "Marketplace API endpoint failed with HTTP $HTTP_CODE"
    fi
    echo ""
}

# Test 6: Exchange Request API (Authenticated)
test_exchange_request_api() {
    log_info "Test 6: Exchange Request API (Authenticated)"
    
    if [ -z "$USER_TOKEN" ] || [ "$USER_TOKEN" = "test-user-token" ]; then
        log_info "Skipping (no valid user token provided)"
        echo ""
        return
    fi
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $USER_TOKEN" \
        ${BASE_URL}/api/v1/exchange/requests)
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        log_pass "Exchange Request API accessible"
    else
        log_fail "Exchange Request API failed with HTTP $HTTP_CODE"
    fi
    echo ""
}

# Test 7: Admin API (Authenticated)
test_admin_api() {
    log_info "Test 7: Admin API (Authenticated)"
    
    if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "test-admin-token" ]; then
        log_info "Skipping (no valid admin token provided)"
        echo ""
        return
    fi
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        ${BASE_URL}/api/v1/admin/exchange/requests)
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        log_pass "Admin API accessible"
    else
        log_fail "Admin API failed with HTTP $HTTP_CODE"
    fi
    echo ""
}

# Test 8: Create Exchange Request (Full Flow Test)
test_create_exchange_request() {
    log_info "Test 8: Create Exchange Request (Full Flow)"
    
    if [ -z "$USER_TOKEN" ] || [ "$USER_TOKEN" = "test-user-token" ]; then
        log_info "Skipping (no valid user token provided)"
        echo ""
        return
    fi
    
    PAYLOAD='{
        "fromCurrency": "USD",
        "toCurrency": "EGP",
        "fromAmount": 100,
        "preferredRate": 30.5,
        "expiresInHours": 24
    }'
    
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Authorization: Bearer $USER_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD" \
        ${BASE_URL}/api/v1/exchange/requests)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" -eq 201 ]; then
        log_pass "Exchange request created successfully"
    else
        log_fail "Exchange request creation failed with HTTP $HTTP_CODE"
    fi
    echo ""
}

# Test 9: External Provider Connectivity
test_external_providers() {
    log_info "Test 9: External Provider Connectivity"
    
    # Test OpenExchangeRates (if API key is configured)
    if [ ! -z "$OPENEXCHANGERATES_API_KEY" ] && [ "$OPENEXCHANGERATES_API_KEY" != "your-staging-openexchangerates-api-key" ]; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            "https://openexchangerates.org/api/latest.json?app_id=$OPENEXCHANGERATES_API_KEY")
        
        if [ "$HTTP_CODE" -eq 200 ]; then
            log_pass "OpenExchangeRates API accessible"
        else
            log_fail "OpenExchangeRates API failed with HTTP $HTTP_CODE"
        fi
    else
        log_info "Skipping OpenExchangeRates (no API key configured)"
    fi
    
    echo ""
}

# Test 10: Service Logs Check
test_service_logs() {
    log_info "Test 10: Service Logs Check"
    
    if command -v docker &> /dev/null; then
        ERROR_COUNT=$(docker logs p2p-exchange-service-staging 2>&1 | grep -i "error" | wc -l)
        
        if [ "$ERROR_COUNT" -lt 5 ]; then
            log_pass "Service logs look healthy (< 5 errors)"
        else
            log_fail "Service logs contain $ERROR_COUNT errors"
        fi
    else
        log_info "Skipping (Docker not available)"
    fi
    
    echo ""
}

# Run all tests
main() {
    echo "Running smoke tests against: $BASE_URL"
    echo ""
    
    test_health_check
    test_metrics
    test_database
    test_redis
    test_marketplace_api
    test_exchange_request_api
    test_admin_api
    test_create_exchange_request
    test_external_providers
    test_service_logs
    
    # Summary
    echo "=========================================="
    echo "Test Results"
    echo "=========================================="
    echo -e "${GREEN}Passed:${NC} $PASSED"
    echo -e "${RED}Failed:${NC} $FAILED"
    echo "Total: $((PASSED + FAILED))"
    echo ""
    
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}Some tests failed!${NC}"
        exit 1
    fi
}

# Run main function
main
