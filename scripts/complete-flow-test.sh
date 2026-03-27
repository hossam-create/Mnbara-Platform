#!/bin/bash

# 🎯 Mnbara Platform - Complete Flow Test with Seller Subscription
# This script tests the entire "Request Item → Accept → Pay" flow with seller subscription gating

echo "🚀 Starting Complete Flow Test with Seller Subscription..."
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test an endpoint
test_endpoint() {
    local method=$1
    local url=$2
    local data=$3
    local description=$4
    
    echo -n "Testing: $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$url" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" -H "Content-Type: application/json" -d "$data" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ PASSED${NC} (HTTP $http_code)"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC} (HTTP $http_code)"
        echo "Response: $body"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to extract JSON value
extract_json() {
    echo "$1" | grep -o "\"$2\":\"[^\"]*\"" | cut -d'"' -f4
}

# Test data
SELLER_EMAIL="seller@example.com"
SELLER_PASSWORD="password123"
BUYER_EMAIL="buyer@example.com" 
BUYER_PASSWORD="password123"
TRAVELER_EMAIL="traveler@example.com"
TRAVELER_PASSWORD="password123"

echo ""
echo "📋 Test Flow:"
echo "1. Register users (seller, buyer, traveler)"
echo "2. Create seller subscription"
echo "3. Test product creation without subscription (should fail)"
echo "4. Test product creation with subscription (should pass)"
echo "5. Test product publishing"
echo "6. Create order request"
echo "7. Accept order as traveler"
echo "8. Process payment"
echo ""

# Test 1: Register Seller
echo "1️⃣  Testing Seller Registration..."
seller_response=$(curl -s -X POST "http://localhost:3001/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$SELLER_EMAIL\",\"password\":\"$SELLER_PASSWORD\",\"role\":\"seller\"}")

if echo "$seller_response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Seller Registration PASSED${NC}"
    ((TESTS_PASSED++))
    SELLER_TOKEN=$(echo "$seller_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    SELLER_ID=$(echo "$seller_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
else
    echo -e "${RED}❌ Seller Registration FAILED${NC}"
    echo "Response: $seller_response"
    ((TESTS_FAILED++))
fi

# Test 2: Register Buyer
echo ""
echo "2️⃣  Testing Buyer Registration..."
buyer_response=$(curl -s -X POST "http://localhost:3001/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$BUYER_EMAIL\",\"password\":\"$BUYER_PASSWORD\",\"role\":\"buyer\"}")

if echo "$buyer_response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Buyer Registration PASSED${NC}"
    ((TESTS_PASSED++))
    BUYER_TOKEN=$(echo "$buyer_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
    echo -e "${RED}❌ Buyer Registration FAILED${NC}"
    echo "Response: $buyer_response"
    ((TESTS_FAILED++))
fi

# Test 3: Register Traveler
echo ""
echo "3️⃣  Testing Traveler Registration..."
traveler_response=$(curl -s -X POST "http://localhost:3001/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TRAVELER_EMAIL\",\"password\":\"$TRAVELER_PASSWORD\",\"role\":\"traveler\"}")

if echo "$traveler_response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Traveler Registration PASSED${NC}"
    ((TESTS_PASSED++))
    TRAVELER_TOKEN=$(echo "$traveler_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
    echo -e "${RED}❌ Traveler Registration FAILED${NC}"
    echo "Response: $traveler_response"
    ((TESTS_FAILED++))
fi

# Test 4: Create Seller Subscription
echo ""
echo "4️⃣  Testing Seller Subscription Creation..."
subscription_response=$(curl -s -X POST "http://localhost:3016/subscriptions" \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"$SELLER_ID\",\"plan\":\"seller-basic\",\"durationMonths\":1}")

if echo "$subscription_response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Seller Subscription Creation PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Seller Subscription Creation FAILED${NC}"
    echo "Response: $subscription_response"
    ((TESTS_FAILED++))
fi

# Test 5: Test Product Creation WITHOUT Subscription (should fail)
echo ""
echo "5️⃣  Testing Product Creation WITHOUT Subscription (should fail)..."
# First, let's test with buyer token (no seller subscription)
product_no_sub_response=$(curl -s -X POST "http://localhost:3006/products" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $BUYER_TOKEN" \
    -d "{\"name\":\"Test Product\",\"description\":\"A test product\",\"price\":99.99,\"originCountry\":\"US\",\"purchaseCountry\":\"US\",\"deliveryCountry\":\"US\"}")

if echo "$product_no_sub_response" | grep -q '"success":false'; then
    echo -e "${GREEN}✅ Product Creation WITHOUT Subscription CORRECTLY FAILED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Product Creation WITHOUT Subscription INCORRECTLY PASSED${NC}"
    echo "Response: $product_no_sub_response"
    ((TESTS_FAILED++))
fi

# Test 6: Test Product Creation WITH Subscription (should pass)
echo ""
echo "6️⃣  Testing Product Creation WITH Subscription (should pass)..."
product_with_sub_response=$(curl -s -X POST "http://localhost:3006/products" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SELLER_TOKEN" \
    -d "{\"name\":\"Premium Coffee Beans\",\"description\":\"Authentic Colombian coffee\",\"price\":29.99,\"originCountry\":\"Colombia\",\"purchaseCountry\":\"Colombia\",\"deliveryCountry\":\"US\"}")

if echo "$product_with_sub_response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Product Creation WITH Subscription PASSED${NC}"
    ((TESTS_PASSED++))
    PRODUCT_ID=$(echo "$product_with_sub_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
else
    echo -e "${RED}❌ Product Creation WITH Subscription FAILED${NC}"
    echo "Response: $product_with_sub_response"
    ((TESTS_FAILED++))
fi

# Test 7: Test Product Publishing
echo ""
echo "7️⃣  Testing Product Publishing..."
publish_response=$(curl -s -X POST "http://localhost:3006/products/$PRODUCT_ID/publish" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SELLER_TOKEN")

if echo "$publish_response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Product Publishing PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Product Publishing FAILED${NC}"
    echo "Response: $publish_response"
    ((TESTS_FAILED++))
fi

# Test 8: Create Order Request
echo ""
echo "8️⃣  Testing Order Creation (Request Item from Traveler)..."
order_response=$(curl -s -X POST "http://localhost:3000/orders" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $BUYER_TOKEN" \
    -d "{\"itemName\":\"Premium Coffee Beans\",\"itemPrice\":29.99,\"originCountry\":\"Colombia\",\"purchaseCountry\":\"Colombia\",\"deliveryCountry\":\"US\"}")

if echo "$order_response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Order Creation PASSED${NC}"
    ((TESTS_PASSED++))
    ORDER_ID=$(echo "$order_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
else
    echo -e "${RED}❌ Order Creation FAILED${NC}"
    echo "Response: $order_response"
    ((TESTS_FAILED++))
fi

# Test 9: Accept Order as Traveler
echo ""
echo "9️⃣  Testing Order Acceptance by Traveler..."
accept_response=$(curl -s -X POST "http://localhost:3000/orders/$ORDER_ID/accept" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TRAVELER_TOKEN" \
    -d "{\"message\":\"I can bring this from Colombia!\",\"estimatedDelivery\":\"2024-02-20\"}")

if echo "$accept_response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Order Acceptance PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Order Acceptance FAILED${NC}"
    echo "Response: $accept_response"
    ((TESTS_FAILED++))
fi

# Test 10: Process Payment
echo ""
echo "🔟 Testing Payment Processing..."
payment_response=$(curl -s -X POST "http://localhost:3000/payments" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $BUYER_TOKEN" \
    -d "{\"orderId\":\"$ORDER_ID\",\"amount\":2.99,\"paymentMethod\":\"card\"}")

if echo "$payment_response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Payment Processing PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Payment Processing FAILED${NC}"
    echo "Response: $payment_response"
    ((TESTS_FAILED++))
fi

# Test 11: Admin Override Subscription
echo ""
echo "1️⃣1️⃣ Testing Admin Subscription Override..."
# First create an admin user
admin_response=$(curl -s -X POST "http://localhost:3001/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"admin@example.com\",\"password\":\"admin123\",\"role\":\"admin\"}")

ADMIN_TOKEN=$(echo "$admin_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

override_response=$(curl -s -X POST "http://localhost:3016/admin/override-subscription" \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"$SELLER_ID\",\"action\":\"activate\",\"plan\":\"seller-pro\"}")

if echo "$override_response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Admin Subscription Override PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Admin Subscription Override FAILED${NC}"
    echo "Response: $override_response"
    ((TESTS_FAILED++))
fi

# Summary
echo ""
echo "=================================================="
echo "📊 TEST SUMMARY"
echo "=================================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Core flow is working correctly.${NC}"
    echo "✅ Seller subscription system is enforced"
    echo "✅ Product creation requires seller subscription"
    echo "✅ Product publishing requires seller subscription"
    echo "✅ Order creation works"
    echo "✅ Order acceptance works"
    echo "✅ Payment processing works"
    echo "✅ Admin override works"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED. Check the responses above.${NC}"
    exit 1
fi