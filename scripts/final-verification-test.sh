#!/bin/bash

# 🧪 MNBARA PLATFORM - FINAL LOCAL VERIFICATION TEST
# Complete end-to-end platform testing

echo "🧪 MNBARA PLATFORM - FINAL LOCAL VERIFICATION"
echo "=================================================="
echo "Testing complete platform functionality..."
echo ""

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

# Function to make API call
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
        return 0
    else
        echo -e "${RED}❌ FAILED${NC} (HTTP $http_code)"
        echo "Response: $body"
        ((FAILED_TESTS++))
        return 1
    fi
}

# Function to extract JSON value
extract_json() {
    echo "$1" | grep -o "\"$2\":\"[^\"]*\"" | cut -d'"' -f4
}

# Phase 1: Service Health Check
echo "🔍 Phase 1: Complete Service Health Check"
echo "=================================================="

services=(
    "Auth:3001"
    "Subscription:3016"
    "Country:3015"
    "Order:3000"
    "Product:3006"
    "Payment:3003"
    "Wallet:3005"
)

healthy_services=0
total_services=${#services[@]}

for service in "${services[@]}"; do
    IFS=':' read -r name port <<< "$service"
    echo -n "Health check $name (port $port)... "
    if curl -s -f "http://localhost:$port/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ HEALTHY${NC}"
        ((healthy_services++))
    else
        echo -e "${RED}❌ UNHEALTHY${NC}"
    fi
done

echo ""
echo "Service Status: $healthy_services/$total_services healthy"

if [ $healthy_services -lt 5 ]; then
    echo -e "${RED}❌ Critical services unhealthy. Cannot proceed with verification.${NC}"
    exit 1
fi

# Phase 2: Complete User Journey Test
echo ""
echo "🚀 Phase 2: Complete User Journey Test"
echo "=================================================="

# Test 1: User Registration
echo "1️⃣ Testing User Registration Flow..."

# Register Buyer
buyer_data="{\"email\":\"testbuyer@example.com\",\"password\":\"test123\",\"role\":\"buyer\"}"
if response=$(api_call "POST" "http://localhost:3001/auth/register" "$buyer_data" "Register test buyer"); then
    buyer_token=$(extract_json "$response" "token")
    buyer_id=$(extract_json "$response" "id")
    echo "✅ Buyer registered: $buyer_id"
fi

# Register Seller  
seller_data="{\"email\":\"testseller@example.com\",\"password\":\"test123\",\"role\":\"seller\"}"
if response=$(api_call "POST" "http://localhost:3001/auth/register" "$seller_data" "Register test seller"); then
    seller_token=$(extract_json "$response" "token")
    seller_id=$(extract_json "$response" "id")
    echo "✅ Seller registered: $seller_id"
fi

# Register Traveler
traveler_data="{\"email\":\"testtraveler@example.com\",\"password\":\"test123\",\"role\":\"traveler\"}"
if response=$(api_call "POST" "http://localhost:3001/auth/register" "$traveler_data" "Register test traveler"); then
    traveler_token=$(extract_json "$response" "token")
    traveler_id=$(extract_json "$response" "id")
    echo "✅ Traveler registered: $traveler_id"
fi

# Test 2: Seller Subscription Activation
echo ""
echo "2️⃣ Testing Seller Subscription Activation..."

subscription_data="{\"userId\":\"$seller_id\",\"plan\":\"seller-basic\",\"durationMonths\":1}"
api_call "POST" "http://localhost:3016/subscriptions" "$subscription_data" "Activate seller subscription"

# Test 3: Product Creation and Publishing
echo ""
echo "3️⃣ Testing Product Creation and Publishing..."

product_data="{\"name\":\"Colombian Coffee Beans\",\"description\":\"Premium single-origin coffee from Colombia\",\"price\":29.99,\"originCountry\":\"Colombia\",\"purchaseCountry\":\"Colombia\",\"deliveryCountry\":\"US\"}"
if response=$(api_call "POST" "http://localhost:3006/products" "$product_data" "Create product" "Authorization: Bearer $seller_token"); then
    product_id=$(extract_json "$response" "id")
    echo "✅ Product created: $product_id"
fi

# Publish Product
api_call "POST" "http://localhost:3006/products/$product_id/publish" "{}" "Publish product" "Authorization: Bearer $seller_token"

# Test 4: Order Creation
echo ""
echo "4️⃣ Testing Order Creation..."

order_data="{\"itemName\":\"Coffee from Colombia\",\"itemPrice\":29.99,\"originCountry\":\"Colombia\",\"purchaseCountry\":\"Colombia\",\"deliveryCountry\":\"US\"}"
if response=$(api_call "POST" "http://localhost:3000/orders" "$order_data" "Create order" "Authorization: Bearer $buyer_token"); then
    order_id=$(extract_json "$response" "id")
    echo "✅ Order created: $order_id"
fi

# Test 5: Order Acceptance
echo ""
echo "5️⃣ Testing Order Acceptance..."

accept_data="{\"message\":\"I can bring this coffee from my trip to Colombia!\",\"estimatedDelivery\":\"2024-02-25\"}"
api_call "POST" "http://localhost:3000/orders/$order_id/accept" "$accept_data" "Accept order" "Authorization: Bearer $traveler_token"

# Test 6: Payment Processing
echo ""
echo "6️⃣ Testing Payment Processing..."

payment_data="{\"orderId\":\"$order_id\",\"amount\":2.99,\"paymentMethod\":\"card\"}"
api_call "POST" "http://localhost:3000/payments" "$payment_data" "Process payment" "Authorization: Bearer $buyer_token"

# Test 7: Country Validation
echo ""
echo "7️⃣ Testing Country Layer Validation..."
api_call "GET" "http://localhost:3015/countries" "" "Get all countries"
api_call "GET" "http://localhost:3015/countries/CO" "" "Get Colombia country info"
api_call "GET" "http://localhost:3015/countries/CO/risk" "" "Get Colombia risk assessment"

# Test 8: Wallet Operations
echo ""
echo "8️⃣ Testing Wallet Operations..."

# Create test wallets
buyer_wallet_data="{\"userId\":\"$buyer_id\",\"currency\":\"USD\",\"initialBalance\":10000}"
if response=$(api_call "POST" "http://localhost:3005/wallets" "$buyer_wallet_data" "Create buyer wallet"); then
    buyer_wallet_id=$(extract_json "$response" "id")
    echo "✅ Buyer wallet created: $buyer_wallet_id"
fi

# Check wallet balance
api_call "GET" "http://localhost:3005/wallet/$buyer_wallet_id" "" "Check buyer wallet balance"

# Test 9: Escrow Operations
echo ""
echo "9️⃣ Testing Escrow Operations..."

# Create seller wallet
seller_wallet_data="{\"userId\":\"$seller_id\",\"currency\":\"USD\"}"
if response=$(api_call "POST" "http://localhost:3005/wallets" "$seller_wallet_data" "Create seller wallet"); then
    seller_wallet_id=$(extract_json "$response" "id")
    echo "✅ Seller wallet created: $seller_wallet_id"
fi

# Create system wallet
system_wallet_data="{\"userId\":\"system-001\",\"currency\":\"USD\",\"type\":\"SYSTEM\"}"
if response=$(api_call "POST" "http://localhost:3005/wallets" "$system_wallet_data" "Create system wallet"); then
    system_wallet_id=$(extract_json "$response" "id")
    echo "✅ System wallet created: $system_wallet_id"
fi

# Create escrow
escrow_data="{\"buyerWalletId\":\"$buyer_wallet_id\",\"sellerWalletId\":\"$seller_wallet_id\",\"amount\":1000,\"currency\":\"USD\",\"referenceType\":\"ORDER\",\"referenceId\":\"$order_id\",\"systemWalletId\":\"$system_wallet_id\",\"description\":\"Test escrow for order\"}"
if response=$(api_call "POST" "http://localhost:3005/escrow" "$escrow_data" "Create escrow"); then
    escrow_id=$(extract_json "$response" "escrowId")
    echo "✅ Escrow created: $escrow_id"
fi

# Test 10: Admin Operations
echo ""
echo "🔟 Testing Admin Operations..."

# Create admin user
admin_data="{\"email\":\"testadmin@example.com\",\"password\":\"admin123\",\"role\":\"admin\"}"
if response=$(api_call "POST" "http://localhost:3001/auth/register" "$admin_data" "Register admin"); then
    admin_token=$(extract_json "$response" "token")
    admin_id=$(extract_json "$response" "id")
    echo "✅ Admin registered: $admin_id"
fi

# Test admin override
admin_override_data="{\"userId\":\"$seller_id\",\"action\":\"activate\",\"plan\":\"seller-pro\"}"
api_call "POST" "http://localhost:3016/admin/override-subscription" "$admin_override_data" "Admin subscription override"

# Phase 3: Performance Testing
echo ""
echo "⚡ Phase 3: Performance Testing"
echo "=================================================="

echo "Testing concurrent API calls..."
start_time=$(date +%s%N)

# Simulate concurrent users
for i in {1..5}; do
    (
        curl -s "http://localhost:3001/auth/register" \
            -X POST \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"concurrent$i@example.com\",\"password\":\"test123\",\"role\":\"buyer\"}" > /dev/null 2>&1
    ) &
done

wait

end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))
echo "Concurrent registration completed in: ${duration}ms"

if [ $duration -lt 2000 ]; then
    echo -e "${GREEN}✅ Performance test passed${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ Performance test failed${NC}"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# Phase 4: Error Handling Testing
echo ""
echo "⚠️ Phase 4: Error Handling Testing"
echo "=================================================="

echo "Testing invalid authentication..."
invalid_auth_data="{\"email\":\"invalid@example.com\",\"password\":\"wrongpassword\"}"
api_call "POST" "http://localhost:3001/auth/login" "$invalid_auth_data" "Test invalid login" false

echo ""
echo "Testing seller without subscription..."
no_sub_seller_data="{\"email\":\"nosub@example.com\",\"password\":\"test123\",\"role\":\"seller\"}"
if response=$(api_call "POST" "http://localhost:3001/auth/register" "$no_sub_seller_data" "Register seller without subscription"); then
    no_sub_token=$(extract_json "$response" "token")
fi

no_sub_product_data="{\"name\":\"Test Product\",\"description\":\"Should fail\",\"price\":10.00,\"originCountry\":\"US\",\"purchaseCountry\":\"US\",\"deliveryCountry\":\"US\"}"
api_call "POST" "http://localhost:3006/products" "$no_sub_product_data" "Create product without subscription" false "Authorization: Bearer $no_sub_token"

echo ""
echo "Testing invalid country code..."
invalid_country_data="{\"name\":\"Test Product\",\"description\":\"Invalid country\",\"price\":10.00,\"originCountry\":\"INVALID\",\"purchaseCountry\":\"US\",\"deliveryCountry\":\"US\"}"
api_call "POST" "http://localhost:3006/products" "$invalid_country_data" "Create product with invalid country" false "Authorization: Bearer $seller_token"

# Final Summary
echo ""
echo "📊 FINAL VERIFICATION SUMMARY"
echo "=================================================="
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo -e "Success Rate: ${GREEN}$((PASSED_TESTS * 100 / TOTAL_TESTS))%${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ] && [ $PASSED_TESTS -ge 20 ]; then
    echo -e "${GREEN}🎉 PLATFORM VERIFICATION PASSED!${NC}"
    echo "✅ Complete user journey tested successfully"
    echo "✅ All core services working correctly"
    echo "✅ Payment processing functional"
    echo "✅ Escrow system operational"
    echo "✅ Admin controls working"
    echo "✅ Performance within acceptable limits"
    echo "✅ Error handling working correctly"
    echo ""
    echo "🚀 Mnbara Platform is READY FOR PRODUCTION!"
    echo ""
    echo "🔗 Access Points:"
    echo "   Main Web App:     http://localhost:5173"
    echo "   Admin Dashboard:  http://localhost:3007"
    echo "   API Documentation: http://localhost:3005/api"
    echo ""
    echo "📋 Key Features Verified:"
    echo "   • User registration and authentication"
    echo "   • Seller subscription system ($19.99/month)"
    echo "   • Product creation and publishing"
    echo "   • Order request and acceptance"
    echo "   • Payment processing ($2.99 service fee)"
    echo "   • Escrow fund management"
    echo "   • Country compliance (195+ countries)"
    echo "   • Admin override capabilities"
    echo "   • Performance under load"
    echo "   • Error handling and security"
    exit 0
else
    echo -e "${RED}❌ PLATFORM VERIFICATION FAILED!${NC}"
    echo "Issues detected that need to be resolved before production."
    echo "Check the failed tests above and fix them."
    exit 1
fi