#!/bin/bash

# Mnbara Platform - Core Flow Verification Script
# Tests the complete "Request Item → Accept → Pay" flow

echo "🎯 Mnbara Platform - Core Flow Verification"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API Base URLs
API_GATEWAY="http://localhost:3000"
AUTH_SERVICE="http://localhost:3001"
USER_SERVICE="http://localhost:3002"
PRODUCT_SERVICE="http://localhost:3003"
ORDER_SERVICE="http://localhost:3004"
PAYMENT_SERVICE="http://localhost:3005"
COUNTRY_SERVICE="http://localhost:3015"

# Test data
TEST_USER_EMAIL="testuser@example.com"
TEST_USER_PASSWORD="Test123!"
TEST_USER_FIRSTNAME="Test"
TEST_USER_LASTNAME="User"
TEST_TRAVELER_EMAIL="testtraveler@example.com"
TEST_TRAVELER_PASSWORD="Test123!"
TEST_TRAVELER_FIRSTNAME="Traveler"
TEST_TRAVELER_LASTNAME="Test"

# Global variables
USER_TOKEN=""
TRAVELER_TOKEN=""
ORDER_ID=""
PRODUCT_ID=""

# Function to make API calls
api_call() {
    local method=$1
    local url=$2
    local data=$3
    local token=$4
    
    local headers=""
    if [ -n "$token" ]; then
        headers="-H \"Authorization: Bearer $token\""
    fi
    
    if [ -n "$data" ]; then
        curl -s -X "$method" "$url" \
            -H "Content-Type: application/json" \
            $headers \
            -d "$data" \
            -w "\n%{http_code}"
    else
        curl -s -X "$method" "$url" \
            $headers \
            -w "\n%{http_code}"
    fi
}

# Function to extract status code
get_status_code() {
    echo "$1" | tail -n1
}

# Function to extract response body
get_response_body() {
    echo "$1" | sed '$d'
}

# Test 1: User Registration
test_user_registration() {
    echo -e "${BLUE}Test 1: User Registration${NC}"
    
    local response=$(api_call "POST" "$AUTH_SERVICE/api/v1/auth/register" \
        '{
            "email": "'$TEST_USER_EMAIL'",
            "password": "'$TEST_USER_PASSWORD'",
            "firstName": "'$TEST_USER_FIRSTNAME'",
            "lastName": "'$TEST_USER_LASTNAME'",
            "role": "buyer"
        }')
    
    local status_code=$(get_status_code "$response")
    
    if [ "$status_code" = "201" ] || [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✅ User registration successful${NC}"
        return 0
    else
        echo -e "${RED}❌ User registration failed (HTTP $status_code)${NC}"
        return 1
    fi
}

# Test 2: User Login
test_user_login() {
    echo -e "${BLUE}Test 2: User Login${NC}"
    
    local response=$(api_call "POST" "$AUTH_SERVICE/api/v1/auth/login" \
        '{
            "email": "'$TEST_USER_EMAIL'",
            "password": "'$TEST_USER_PASSWORD'"
        }')
    
    local status_code=$(get_status_code "$response")
    local body=$(get_response_body "$response")
    
    if [ "$status_code" = "200" ]; then
        USER_TOKEN=$(echo "$body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$USER_TOKEN" ]; then
            echo -e "${GREEN}✅ User login successful${NC}"
            return 0
        else
            echo -e "${RED}❌ Token not found in response${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ User login failed (HTTP $status_code)${NC}"
        return 1
    fi
}

# Test 3: Country Layer Service
test_country_layer() {
    echo -e "${BLUE}Test 3: Country Layer Service${NC}"
    
    local response=$(api_call "GET" "$COUNTRY_SERVICE/api/v1/countries" \
        "" "" "$USER_TOKEN")
    
    local status_code=$(get_status_code "$response")
    
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✅ Country layer service accessible${NC}"
        return 0
    else
        echo -e "${RED}❌ Country layer service not accessible (HTTP $status_code)${NC}"
        return 1
    fi
}

# Test 4: Country Route Validation
test_country_validation() {
    echo -e "${BLUE}Test 4: Country Route Validation${NC}"
    
    local response=$(api_call "POST" "$COUNTRY_SERVICE/api/v1/countries/validate-route" \
        '{
            "originCountry": "US",
            "destinationCountry": "SA",
            "productType": "electronics"
        }' "$USER_TOKEN")
    
    local status_code=$(get_status_code "$response")
    
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✅ Country route validation working${NC}"
        return 0
    else
        echo -e "${RED}❌ Country route validation failed (HTTP $status_code)${NC}"
        return 1
    fi
}

# Test 5: Product Creation with Country Data
test_product_creation() {
    echo -e "${BLUE}Test 5: Product Creation with Country Data${NC}"
    
    local response=$(api_call "POST" "$PRODUCT_SERVICE/api/v1/products" \
        '{
            "title": "Test iPhone 15 Pro",
            "description": "Latest iPhone model, unlocked",
            "price": 1199.99,
            "categoryId": "electronics",
            "originCountry": "US",
            "purchaseCountry": "US",
            "deliveryCountry": "SA"
        }' "$USER_TOKEN")
    
    local status_code=$(get_status_code "$response")
    local body=$(get_response_body "$response")
    
    if [ "$status_code" = "201" ]; then
        PRODUCT_ID=$(echo "$body" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$PRODUCT_ID" ]; then
            echo -e "${GREEN}✅ Product creation with country data successful${NC}"
            return 0
        else
            echo -e "${RED}❌ Product ID not found in response${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Product creation failed (HTTP $status_code)${NC}"
        return 1
    fi
}

# Test 6: Order Creation (Request Item)
test_order_creation() {
    echo -e "${BLUE}Test 6: Order Creation (Request Item)${NC}"
    
    local response=$(api_call "POST" "$ORDER_SERVICE/api/v1/orders" \
        '{
            "itemName": "iPhone 15 Pro Max",
            "country": "USA",
            "maxPrice": 1200,
            "description": "Latest iPhone model, unlocked, 256GB, Space Gray",
            "weight": 0.5,
            "urgency": "NORMAL"
        }' "$USER_TOKEN")
    
    local status_code=$(get_status_code "$response")
    local body=$(get_response_body "$response")
    
    if [ "$status_code" = "201" ]; then
        ORDER_ID=$(echo "$body" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$ORDER_ID" ]; then
            echo -e "${GREEN}✅ Order creation successful${NC}"
            return 0
        else
            echo -e "${RED}❌ Order ID not found in response${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Order creation failed (HTTP $status_code)${NC}"
        return 1
    fi
}

# Test 7: View Available Orders
test_view_orders() {
    echo -e "${BLUE}Test 7: View Available Orders${NC}"
    
    local response=$(api_call "GET" "$ORDER_SERVICE/api/v1/orders?status=PENDING" \
        "" "" "$USER_TOKEN")
    
    local status_code=$(get_status_code "$response")
    
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✅ View orders successful${NC}"
        return 0
    else
        echo -e "${RED}❌ View orders failed (HTTP $status_code)${NC}"
        return 1
    fi
}

# Test 8: Payment Processing
test_payment_processing() {
    echo -e "${BLUE}Test 8: Payment Processing${NC}"
    
    local response=$(api_call "POST" "$PAYMENT_SERVICE/api/v1/payments" \
        '{
            "orderId": "'$ORDER_ID'",
            "amount": 2.99,
            "paymentMethod": "card"
        }' "$USER_TOKEN")
    
    local status_code=$(get_status_code "$response")
    
    if [ "$status_code" = "200" ] || [ "$status_code" = "201" ]; then
        echo -e "${GREEN}✅ Payment processing successful${NC}"
        return 0
    else
        echo -e "${RED}❌ Payment processing failed (HTTP $status_code)${NC}"
        return 1
    fi
}

# Test 9: Traveler Registration
test_traveler_registration() {
    echo -e "${BLUE}Test 9: Traveler Registration${NC}"
    
    local response=$(api_call "POST" "$AUTH_SERVICE/api/v1/auth/register" \
        '{
            "email": "'$TEST_TRAVELER_EMAIL'",
            "password": "'$TEST_TRAVELER_PASSWORD'",
            "firstName": "'$TEST_TRAVELER_FIRSTNAME'",
            "lastName": "'$TEST_TRAVELER_LASTNAME'",
            "role": "traveler"
        }')
    
    local status_code=$(get_status_code "$response")
    
    if [ "$status_code" = "201" ] || [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✅ Traveler registration successful${NC}"
        return 0
    else
        echo -e "${RED}❌ Traveler registration failed (HTTP $status_code)${NC}"
        return 1
    fi
}

# Test 10: Traveler Login
test_traveler_login() {
    echo -e "${BLUE}Test 10: Traveler Login${NC}"
    
    local response=$(api_call "POST" "$AUTH_SERVICE/api/v1/auth/login" \
        '{
            "email": "'$TEST_TRAVELER_EMAIL'",
            "password": "'$TEST_TRAVELER_PASSWORD'"
        }')
    
    local status_code=$(get_status_code "$response")
    local body=$(get_response_body "$response")
    
    if [ "$status_code" = "200" ]; then
        TRAVELER_TOKEN=$(echo "$body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$TRAVELER_TOKEN" ]; then
            echo -e "${GREEN}✅ Traveler login successful${NC}"
            return 0
        else
            echo -e "${RED}❌ Traveler token not found in response${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Traveler login failed (HTTP $status_code)${NC}"
        return 1
    fi
}

# Test 11: Order Acceptance
test_order_acceptance() {
    echo -e "${BLUE}Test 11: Order Acceptance${NC}"
    
    local response=$(api_call "POST" "$ORDER_SERVICE/api/v1/orders/$ORDER_ID/accept" \
        '{
            "message": "I can deliver this item. I will be traveling to Saudi Arabia next week.",
            "estimatedDelivery": "2024-02-25T10:00:00Z"
        }' "$TRAVELER_TOKEN")
    
    local status_code=$(get_status_code "$response")
    
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✅ Order acceptance successful${NC}"
        return 0
    else
        echo -e "${RED}❌ Order acceptance failed (HTTP $status_code)${NC}"
        return 1
    fi
}

# Main execution function
main() {
    echo "Starting core flow verification..."
    echo ""
    
    local passed_tests=0
    local total_tests=11
    
    # Run all tests
    test_user_registration && ((passed_tests++))
    echo ""
    
    test_user_login && ((passed_tests++))
    echo ""
    
    test_country_layer && ((passed_tests++))
    echo ""
    
    test_country_validation && ((passed_tests++))
    echo ""
    
    test_product_creation && ((passed_tests++))
    echo ""
    
    test_order_creation && ((passed_tests++))
    echo ""
    
    test_view_orders && ((passed_tests++))
    echo ""
    
    test_payment_processing && ((passed_tests++))
    echo ""
    
    test_traveler_registration && ((passed_tests++))
    echo ""
    
    test_traveler_login && ((passed_tests++))
    echo ""
    
    test_order_acceptance && ((passed_tests++))
    echo ""
    
    # Summary
    echo "=========================================="
    echo "📊 CORE FLOW VERIFICATION SUMMARY"
    echo "=========================================="
    echo "Tests Passed: $passed_tests/$total_tests"
    echo "Success Rate: $((passed_tests * 100 / total_tests))%"
    
    if [ "$passed_tests" -eq "$total_tests" ]; then
        echo -e "${GREEN}🎉 ALL TESTS PASSED! Core flow is working correctly.${NC}"
        echo ""
        echo "✅ User can register and login"
        echo "✅ Country layer is accessible and validates routes"
        echo "✅ Products can be created with country data"
        echo "✅ Orders can be created (request items)"
        echo "✅ Orders can be viewed by travelers"
        echo "✅ Payments can be processed"
        echo "✅ Travelers can register and login"
        echo "✅ Travelers can accept orders"
        echo ""
        echo "🚀 The core marketplace flow is ready!"
    else
        echo -e "${RED}❌ Some tests failed. Please check the errors above.${NC}"
        echo ""
        echo "🔧 Recommended actions:"
        echo "1. Check if all services are running"
        echo "2. Verify database connections"
        echo "3. Check service logs for errors"
        echo "4. Run the system health check script"
        exit 1
    fi
}

# Run main function
main "$@"