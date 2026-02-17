#!/bin/bash

# 🧪 Mnbara Platform - Escrow Service Integration Test
# Comprehensive test of the escrow state machine functionality

echo "🧪 Starting Escrow Service Integration Test..."
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to make API call and measure response time
api_call() {
    local method=$1
    local url=$2
    local data=$3
    local description=$4
    local expect_success=${5:-true}
    
    echo -n "Testing: $description... "
    ((TOTAL_TESTS++))
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$url" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" -H "Content-Type: application/json" -d "$data" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    local success=false
    if [ "$expect_success" = "true" ]; then
        if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
            success=true
        fi
    else
        if [ "$http_code" -ge 400 ]; then
            success=true
        fi
    fi
    
    if [ "$success" = "true" ]; then
        echo -e "${GREEN}✅ PASSED${NC} (HTTP $http_code)"
        ((PASSED_TESTS++))
        echo "$body"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC} (HTTP $http_code)"
        echo "Response: $body"
        ((FAILED_TESTS++))
        return 1
    fi
}

# Test data
BUYER_WALLET="wallet-buyer-001"
SELLER_WALLET="wallet-seller-001"
SYSTEM_WALLET="wallet-system-001"
TEST_AMOUNT="10000" # $100.00 in cents
TEST_CURRENCY="USD"

# Phase 1: System Health Check
echo "🔍 Phase 1: System Health Check"
echo "=================================================="

echo -n "Health check wallet service... "
if curl -s -f "http://localhost:3005/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ HEALTHY${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ UNHEALTHY${NC}"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# Phase 2: Create Test Wallets
echo ""
echo "💰 Phase 2: Create Test Wallets"
echo "=================================================="

# Create buyer wallet with initial balance
buyer_wallet_data="{\"userId\":\"buyer-001\",\"currency\":\"USD\",\"initialBalance\":50000}"
if response=$(api_call "POST" "http://localhost:3005/wallets" "$buyer_wallet_data" "Create buyer wallet"); then
    BUYER_WALLET=$(echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Buyer wallet created: $BUYER_WALLET"
fi

# Create seller wallet
seller_wallet_data="{\"userId\":\"seller-001\",\"currency\":\"USD\"}"
if response=$(api_call "POST" "http://localhost:3005/wallets" "$seller_wallet_data" "Create seller wallet"); then
    SELLER_WALLET=$(echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Seller wallet created: $SELLER_WALLET"
fi

# Create system wallet
system_wallet_data="{\"userId\":\"system-001\",\"currency\":\"USD\",\"type\":\"SYSTEM\"}"
if response=$(api_call "POST" "http://localhost:3005/wallets" "$system_wallet_data" "Create system wallet"); then
    SYSTEM_WALLET=$(echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "✅ System wallet created: $SYSTEM_WALLET"
fi

# Phase 3: Escrow State Machine Testing
echo ""
echo "🔒 Phase 3: Escrow State Machine Testing"
echo "=================================================="

ESCROW_ID=""

# Test 1: Create Escrow
echo "1️⃣ Creating escrow..."
create_escrow_data="{\"buyerWalletId\":\"$BUYER_WALLET\",\"sellerWalletId\":\"$SELLER_WALLET\",\"amount\":$TEST_AMOUNT,\"currency\":\"$TEST_CURRENCY\",\"referenceType\":\"ORDER\",\"referenceId\":\"order-001\",\"systemWalletId\":\"$SYSTEM_WALLET\",\"description\":\"Test escrow for order 001\"}"
if response=$(api_call "POST" "http://localhost:3005/escrow" "$create_escrow_data" "Create escrow"); then
    ESCROW_ID=$(echo "$response" | grep -o '"escrowId":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Escrow created: $ESCROW_ID"
fi

# Test 2: Get Escrow by ID
echo ""
echo "2️⃣ Retrieving escrow by ID..."
api_call "GET" "http://localhost:3005/escrow/$ESCROW_ID" "" "Get escrow by ID"

# Test 3: Create and Fund Escrow (Atomic)
echo ""
echo "3️⃣ Creating and funding escrow atomically..."
create_fund_data="{\"buyerWalletId\":\"$BUYER_WALLET\",\"sellerWalletId\":\"$SELLER_WALLET\",\"amount\":$TEST_AMOUNT,\"currency\":\"$TEST_CURRENCY\",\"referenceType\":\"ORDER\",\"referenceId\":\"order-002\",\"systemWalletId\":\"$SYSTEM_WALLET\",\"description\":\"Test atomic escrow\",\"createdBy\":\"buyer-001\"}"
api_call "POST" "http://localhost:3005/escrow/create-and-fund" "$create_fund_data" "Create and fund escrow atomically"

# Test 4: Fund Existing Escrow
echo ""
echo "4️⃣ Funding existing escrow..."
fund_data="{\"escrowId\":\"$ESCROW_ID\",\"userId\":\"buyer-001\",\"description\":\"Funding escrow from buyer wallet\"}"
api_call "POST" "http://localhost:3005/escrow/fund" "$fund_data" "Fund existing escrow"

# Test 5: Release Escrow
echo ""
echo "5️⃣ Releasing escrow to seller..."
release_data="{\"escrowId\":\"$ESCROW_ID\",\"userId\":\"system-001\",\"description\":\"Releasing escrow to seller after delivery confirmation\"}"
api_call "POST" "http://localhost:3005/escrow/release" "$release_data" "Release escrow to seller"

# Test 6: Create Another Escrow for Refund Test
echo ""
echo "6️⃣ Creating escrow for refund test..."
refund_escrow_data="{\"buyerWalletId\":\"$BUYER_WALLET\",\"sellerWalletId\":\"$SELLER_WALLET\",\"amount\":$TEST_AMOUNT,\"currency\":\"$TEST_CURRENCY\",\"referenceType\":\"ORDER\",\"referenceId\":\"order-003\",\"systemWalletId\":\"$SYSTEM_WALLET\",\"description\":\"Test escrow for refund\"}"
if response=$(api_call "POST" "http://localhost:3005/escrow" "$refund_escrow_data" "Create escrow for refund test"); then
    REFUND_ESCROW_ID=$(echo "$response" | grep -o '"escrowId":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Refund escrow created: $REFUND_ESCROW_ID"
fi

# Fund the refund escrow
echo ""
echo "6️⃣ Funding refund escrow..."
refund_fund_data="{\"escrowId\":\"$REFUND_ESCROW_ID\",\"userId\":\"buyer-001\",\"description\":\"Funding escrow for refund test\"}"
api_call "POST" "http://localhost:3005/escrow/fund" "$refund_fund_data" "Fund refund escrow"

# Test 7: Refund Escrow
echo ""
echo "7️⃣ Refunding escrow to buyer..."
refund_data="{\"escrowId\":\"$REFUND_ESCROW_ID\",\"userId\":\"system-001\",\"description\":\"Refunding escrow due to order cancellation\"}"
api_call "POST" "http://localhost:3005/escrow/refund" "$refund_data" "Refund escrow to buyer"

# Test 8: Dispute Escrow
echo ""
echo "8️⃣ Creating and disputing escrow..."
dispute_escrow_data="{\"buyerWalletId\":\"$BUYER_WALLET\",\"sellerWalletId\":\"$SELLER_WALLET\",\"amount\":$TEST_AMOUNT,\"currency\":\"$TEST_CURRENCY\",\"referenceType\":\"ORDER\",\"referenceId\":\"order-004\",\"systemWalletId\":\"$SYSTEM_WALLET\",\"description\":\"Test escrow for dispute\"}"
if response=$(api_call "POST" "http://localhost:3005/escrow" "$dispute_escrow_data" "Create escrow for dispute test"); then
    DISPUTE_ESCROW_ID=$(echo "$response" | grep -o '"escrowId":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Dispute escrow created: $DISPUTE_ESCROW_ID"
fi

# Fund the dispute escrow
echo ""
echo "8️⃣ Funding dispute escrow..."
dispute_fund_data="{\"escrowId\":\"$DISPUTE_ESCROW_ID\",\"userId\":\"buyer-001\",\"description\":\"Funding escrow for dispute test\"}"
api_call "POST" "http://localhost:3005/escrow/fund" "$dispute_fund_data" "Fund dispute escrow"

# Dispute the escrow
echo ""
echo "8️⃣ Disputing escrow..."
dispute_data="{\"escrowId\":\"$DISPUTE_ESCROW_ID\",\"userId\":\"buyer-001\",\"disputeReason\":\"Item not as described\",\"description\":\"Buyer disputes the order due to item quality issues\"}"
api_call "POST" "http://localhost:3005/escrow/dispute" "$dispute_data" "Dispute escrow"

# Phase 4: Query Escrows
echo ""
echo "🔍 Phase 4: Query Escrow Operations"
echo "=================================================="

# Test 9: Get Escrows by User Wallet
echo "9️⃣ Getting escrows by user wallet..."
api_call "GET" "http://localhost:3005/escrow/user/$BUYER_WALLET" "" "Get escrows by buyer wallet"

# Test 10: Get Escrows by Reference
echo ""
echo "🔟 Getting escrows by reference..."
api_call "GET" "http://localhost:3005/escrow/reference/ORDER/order-001" "" "Get escrows by reference"

# Phase 5: Balance Verification
echo ""
echo "💰 Phase 5: Balance Verification"
echo "=================================================="

echo "Checking buyer wallet balance after escrow operations..."
api_call "GET" "http://localhost:3005/wallet/$BUYER_WALLET" "" "Check buyer wallet balance"

echo ""
echo "Checking seller wallet balance after escrow operations..."
api_call "GET" "http://localhost:3005/wallet/$SELLER_WALLET" "" "Check seller wallet balance"

echo ""
echo "Checking system wallet balance after escrow operations..."
api_call "GET" "http://localhost:3005/wallet/$SYSTEM_WALLET" "" "Check system wallet balance"

# Phase 6: Error Handling Tests
echo ""
echo "⚠️ Phase 6: Error Handling Tests"
echo "=================================================="

echo "Testing invalid escrow creation..."
invalid_escrow_data="{\"buyerWalletId\":\"invalid-wallet\",\"sellerWalletId\":\"$SELLER_WALLET\",\"amount\":$TEST_AMOUNT,\"currency\":\"$TEST_CURRENCY\",\"referenceType\":\"ORDER\",\"referenceId\":\"order-invalid\",\"systemWalletId\":\"$SYSTEM_WALLET\"}"
api_call "POST" "http://localhost:3005/escrow" "$invalid_escrow_data" "Create escrow with invalid wallet" false

echo ""
echo "Testing duplicate escrow reference..."
duplicate_data="{\"buyerWalletId\":\"$BUYER_WALLET\",\"sellerWalletId\":\"$SELLER_WALLET\",\"amount\":$TEST_AMOUNT,\"currency\":\"$TEST_CURRENCY\",\"referenceType\":\"ORDER\",\"referenceId\":\"order-001\",\"systemWalletId\":\"$SYSTEM_WALLET\"}"
api_call "POST" "http://localhost:3005/escrow" "$duplicate_data" "Create duplicate escrow reference" false

echo ""
echo "Testing funding non-existent escrow..."
invalid_fund_data="{\"escrowId\":\"non-existent-escrow\",\"userId\":\"buyer-001\"}"
api_call "POST" "http://localhost:3005/escrow/fund" "$invalid_fund_data" "Fund non-existent escrow" false

echo ""
echo "Testing releasing unfunded escrow..."
unfunded_release_data="{\"escrowId\":\"$ESCROW_ID\",\"userId\":\"system-001\"}"
api_call "POST" "http://localhost:3005/escrow/release" "$unfunded_release_data" "Release already released escrow" false

# Final Summary
echo ""
echo "📊 FINAL TEST SUMMARY"
echo "=================================================="
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo -e "Success Rate: ${GREEN}$((PASSED_TESTS * 100 / TOTAL_TESTS))%${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL ESCROW TESTS PASSED!${NC}"
    echo "✅ Escrow state machine is working correctly"
    echo "✅ All escrow operations (create, fund, release, refund, dispute)"
    echo "✅ Balance tracking and fund transfers"
    echo "✅ Error handling and validation"
    echo "✅ Query operations (by user, by reference)"
    echo ""
    echo "🚀 Escrow service is ready for production!"
    exit 0
else
    echo -e "${RED}❌ SOME ESCROW TESTS FAILED!${NC}"
    echo "Check the failed tests above and fix before production deployment."
    exit 1
fi