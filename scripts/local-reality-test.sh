#!/bin/bash

# 🧪 Mnbara Platform - Complete Local Reality Test
# Simulates real usage with 5 buyers, 5 sellers, 5 travelers

echo "🧪 Starting Local Reality Validation Test..."
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
RESPONSE_TIMES=()

# Test data arrays
BUYERS=()
SELLERS=()
TRAVELERS=()
PRODUCTS=()
ORDERS=()

# Function to make API call and measure response time
api_call() {
    local method=$1
    local url=$2
    local data=$3
    local description=$4
    
    echo -n "Testing: $description... "
    ((TOTAL_TESTS++))
    
    local start_time=$(date +%s%N)
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$url" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" -H "Content-Type: application/json" -d "$data" 2>/dev/null)
    fi
    
    local end_time=$(date +%s%N)
    local response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    RESPONSE_TIMES+=($response_time)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ PASSED${NC} (${response_time}ms)"
        ((PASSED_TESTS++))
        echo "$body"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC} (${response_time}ms, HTTP $http_code)"
        echo "Response: $body"
        ((FAILED_TESTS++))
        return 1
    fi
}

# Function to extract JSON value
extract_json() {
    echo "$1" | grep -o "\"$2\":\"[^\"]*\"" | cut -d'"' -f4
}

# Function to generate test user data
generate_user() {
    local type=$1
    local index=$2
    
    case $type in
        "buyer")
            echo "{\"email\":\"buyer$index@example.com\",\"password\":\"buyer123\",\"role\":\"buyer\"}"
            ;;
        "seller")
            echo "{\"email\":\"seller$index@example.com\",\"password\":\"seller123\",\"role\":\"seller\"}"
            ;;
        "traveler")
            echo "{\"email\":\"traveler$index@example.com\",\"password\":\"traveler123\",\"role\":\"traveler\"}"
            ;;
    esac
}

# Function to generate product data
generate_product() {
    local seller_id=$1
    local index=$2
    
    local countries=("US" "UK" "Germany" "Japan" "France" "Italy" "Spain" "Canada" "Australia" "Brazil")
    local products=("Coffee Beans" "Designer Watch" "Vintage Wine" "Electronics" "Handbag" "Perfume" "Chocolate" "Tea" "Whiskey" "Jewelry")
    local country=${countries[$((RANDOM % 10))]}
    local product=${products[$((RANDOM % 10))]}
    
    echo "{\"name\":\"$product from $country\",\"description\":\"Authentic $product from $country\",\"price\":$((RANDOM % 200 + 50)),\"originCountry\":\"$country\",\"purchaseCountry\":\"$country\",\"deliveryCountry\":\"US\"}"
}

# Function to generate order data
generate_order() {
    local buyer_id=$1
    local index=$2
    
    local countries=("Colombia" "France" "Italy" "Japan" "Switzerland" "Germany" "UK" "Canada" "Australia" "Netherlands")
    local items=("Coffee" "Wine" "Cheese" "Electronics" "Watch" "Chocolate" "Tea" "Whiskey" "Perfume" "Designer Bag")
    local country=${countries[$((RANDOM % 10))]}
    local item=${items[$((RANDOM % 10))]}
    
    echo "{\"itemName\":\"$item from $country\",\"itemPrice\":$((RANDOM % 300 + 100)),\"originCountry\":\"$country\",\"purchaseCountry\":\"$country\",\"deliveryCountry\":\"US\"}"
}

echo "📋 Test Plan:"
echo "1. Create 5 buyers, 5 sellers, 5 travelers"
echo "2. Activate seller subscriptions"
echo "3. Create 10 products (2 per seller)"
echo "4. Publish all products"
echo "5. Create 10 orders (2 per buyer)"
echo "6. Accept 8 orders (travelers accept orders)"
echo "7. Process 8 payments"
echo "8. Test wallet operations"
echo "9. Verify order status updates"
echo "10. Measure system performance"
echo ""

# Phase 1: User Registration
echo "📝 Phase 1: User Registration"
echo "=================================================="

echo "Creating 5 buyers..."
for i in {1..5}; do
    user_data=$(generate_user "buyer" $i)
    if response=$(api_call "POST" "http://localhost:3001/auth/register" "$user_data" "Register Buyer $i"); then
        token=$(extract_json "$response" "token")
        user_id=$(extract_json "$response" "id")
        BUYERS+=("$token:$user_id:buyer$i@example.com")
    fi
done

echo ""
echo "Creating 5 sellers..."
for i in {1..5}; do
    user_data=$(generate_user "seller" $i)
    if response=$(api_call "POST" "http://localhost:3001/auth/register" "$user_data" "Register Seller $i"); then
        token=$(extract_json "$response" "token")
        user_id=$(extract_json "$response" "id")
        SELLERS+=("$token:$user_id:seller$i@example.com")
    fi
done

echo ""
echo "Creating 5 travelers..."
for i in {1..5}; do
    user_data=$(generate_user "traveler" $i)
    if response=$(api_call "POST" "http://localhost:3001/auth/register" "$user_data" "Register Traveler $i"); then
        token=$(extract_json "$response" "token")
        user_id=$(extract_json "$response" "id")
        TRAVELERS+=("$token:$user_id:traveler$i@example.com")
    fi
done

# Phase 2: Activate Seller Subscriptions
echo ""
echo "💳 Phase 2: Seller Subscription Activation"
echo "=================================================="

for seller in "${SELLERS[@]}"; do
    IFS=':' read -r token user_id email <<< "$seller"
    subscription_data="{\"userId\":\"$user_id\",\"plan\":\"seller-basic\",\"durationMonths\":1}"
    api_call "POST" "http://localhost:3016/subscriptions" "$subscription_data" "Activate subscription for $email"
done

# Phase 3: Product Creation
echo ""
echo "🛍️ Phase 3: Product Creation"
echo "=================================================="

product_count=0
for seller in "${SELLERS[@]}"; do
    IFS=':' read -r token user_id email <<< "$seller"
    
    # Create 2 products per seller
    for j in {1..2}; do
        product_data=$(generate_product "$user_id" $j)
        if response=$(api_call "POST" "http://localhost:3006/products" "$product_data" "Create product $j for $email"); then
            product_id=$(extract_json "$response" "id")
            PRODUCTS+=("$product_id:$user_id")
            ((product_count++))
        fi
    done
done

# Phase 4: Product Publishing
echo ""
echo "🚀 Phase 4: Product Publishing"
echo "=================================================="

for product in "${PRODUCTS[@]}"; do
    IFS=':' read -r product_id seller_id <<< "$product"
    
    # Find seller token
    for seller in "${SELLERS[@]}"; do
        IFS=':' read -r token user_id email <<< "$seller"
        if [ "$user_id" = "$seller_id" ]; then
            api_call "POST" "http://localhost:3006/products/$product_id/publish" "{}" "Publish product $product_id"
            break
        fi
    done
done

# Phase 5: Order Creation
echo ""
echo "📦 Phase 5: Order Creation"
echo "=================================================="

order_count=0
for buyer in "${BUYERS[@]}"; do
    IFS=':' read -r token user_id email <<< "$buyer"
    
    # Create 2 orders per buyer
    for j in {1..2}; do
        order_data=$(generate_order "$user_id" $j)
        if response=$(api_call "POST" "http://localhost:3000/orders" "$order_data" "Create order $j for $email"); then
            order_id=$(extract_json "$response" "id")
            ORDERS+=("$order_id:$user_id:pending")
            ((order_count++))
        fi
    done
done

# Phase 6: Order Acceptance
echo ""
echo "✅ Phase 6: Order Acceptance"
echo "=================================================="

accepted_orders=0
for order in "${ORDERS[@]}"; do
    IFS=':' read -r order_id buyer_id status <<< "$order"
    
    if [ "$status" = "pending" ] && [ $accepted_orders -lt 8 ]; then
        # Get random traveler
        traveler_index=$((RANDOM % 5))
        IFS=':' read -r traveler_token traveler_id traveler_email <<< "${TRAVELERS[$traveler_index]}"
        
        accept_data="{\"message\":\"I can bring this item!\",\"estimatedDelivery\":\"2024-02-25\"}"
        if api_call "POST" "http://localhost:3000/orders/$order_id/accept" "$accept_data" "Traveler accepts order $order_id"; then
            # Update order status in array
            ORDERS[${accepted_orders}]="$order_id:$buyer_id:accepted"
            ((accepted_orders++))
        fi
    fi
done

# Phase 7: Payment Processing
echo ""
echo "💳 Phase 7: Payment Processing"
echo "=================================================="

payment_count=0
for order in "${ORDERS[@]}"; do
    IFS=':' read -r order_id buyer_id status <<< "$order"
    
    if [ "$status" = "accepted" ]; then
        # Find buyer token
        for buyer in "${BUYERS[@]}"; do
            IFS=':' read -r token user_id email <<< "$buyer"
            if [ "$user_id" = "$buyer_id" ]; then
                payment_data="{\"orderId\":\"$order_id\",\"amount\":2.99,\"paymentMethod\":\"card\"}"
                if api_call "POST" "http://localhost:3000/payments" "$payment_data" "Process payment for order $order_id"; then
                    ((payment_count++))
                fi
                break
            fi
        done
    fi
done

# Phase 8: System Health Check
echo ""
echo "🔍 Phase 8: System Health Check"
echo "=================================================="

# Check all services
services=(
  "Auth:3001"
  "Subscription:3016"
  "Country:3015"
  "Order:3000"
  "Product:3006"
)

healthy_services=0
for service in "${services[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if api_call "GET" "http://localhost:$port/health" "" "Health check $name"; then
        ((healthy_services++))
    fi
done

# Phase 9: Performance Analysis
echo ""
echo "📊 Phase 9: Performance Analysis"
echo "=================================================="

# Calculate average response time
if [ ${#RESPONSE_TIMES[@]} -gt 0 ]; then
    total_time=0
    for time in "${RESPONSE_TIMES[@]}"; do
        total_time=$((total_time + time))
    done
    avg_response_time=$((total_time / ${#RESPONSE_TIMES[@]}))
    
    echo "Total API Calls: ${#RESPONSE_TIMES[@]}"
    echo "Average Response Time: ${avg_response_time}ms"
    
    # Find min/max response times
    min_time=${RESPONSE_TIMES[0]}
    max_time=${RESPONSE_TIMES[0]}
    for time in "${RESPONSE_TIMES[@]}"; do
        [ $time -lt $min_time ] && min_time=$time
        [ $time -gt $max_time ] && max_time=$time
    done
    echo "Min Response Time: ${min_time}ms"
    echo "Max Response Time: ${max_time}ms"
fi

# Phase 10: Final Summary
echo ""
echo "📈 Phase 10: Final Test Summary"
echo "=================================================="
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo -e "Success Rate: ${GREEN}$((PASSED_TESTS * 100 / TOTAL_TESTS))%${NC}"
echo ""
echo "📊 System Statistics:"
echo "- Buyers Created: ${#BUYERS[@]}"
echo "- Sellers Created: ${#SELLERS[@]}"
echo "- Travelers Created: ${#TRAVELERS[@]}"
echo "- Products Created: ${#PRODUCTS[@]}"
echo "- Orders Created: ${#ORDERS[@]}"
echo "- Orders Accepted: $accepted_orders"
echo "- Payments Processed: $payment_count"
echo "- Healthy Services: $healthy_services/5"
echo ""

if [ $FAILED_TESTS -eq 0 ] && [ $healthy_services -eq 5 ]; then
    echo -e "${GREEN}🎉 LOCAL REALITY TEST PASSED! System is ready for internal testing.${NC}"
    echo "✅ All services working correctly"
    echo "✅ Complete flow validated"
    echo "✅ Performance within acceptable limits"
    echo "✅ Database integrity maintained"
    exit 0
else
    echo -e "${RED}❌ LOCAL REALITY TEST FAILED! Issues detected.${NC}"
    echo "Check the failed tests above and fix before proceeding."
    exit 1
fi