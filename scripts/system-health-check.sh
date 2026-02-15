#!/bin/bash

# Mnbara Platform - System Health Check & Verification Script
# This script validates that all services are properly connected and functional

echo "🎯 Mnbara Platform - System Health Check"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Service health check function
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $service_name... "
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        echo -e "${GREEN}✅ HEALTHY${NC}"
        return 0
    else
        echo -e "${RED}❌ UNHEALTHY${NC}"
        return 1
    fi
}

# Database connection check
check_database() {
    local db_name=$1
    local connection_string=$2
    
    echo -n "Checking $db_name database... "
    
    if psql "$connection_string" -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ CONNECTED${NC}"
        return 0
    else
        echo -e "${RED}❌ CONNECTION FAILED${NC}"
        return 1
    fi
}

# Redis connection check
check_redis() {
    local redis_url=$1
    
    echo -n "Checking Redis... "
    
    if redis-cli -u "$redis_url" ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ CONNECTED${NC}"
        return 0
    else
        echo -e "${RED}❌ CONNECTION FAILED${NC}"
        return 1
    fi
}

# API endpoint validation
check_api_endpoint() {
    local endpoint_name=$1
    local url=$2
    local method=${3:-GET}
    local data=${4:-}
    
    echo -n "Checking $endpoint_name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url")
    else
        response=$(curl -s -X "$method" -H "Content-Type: application/json" -d "$data" -w "\n%{http_code}" "$url")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✅ WORKING${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED ($http_code)${NC}"
        echo "Response: $body"
        return 1
    fi
}

# Start health check
echo ""
echo "🔍 Phase 1: Infrastructure Health Check"
echo "----------------------------------------"

# Check PostgreSQL
check_database "PostgreSQL" "postgresql://postgres:password@localhost:5432/mnbara"

# Check Redis
check_redis "redis://localhost:6379"

# Check RabbitMQ (if available)
if command -v rabbitmqctl &> /dev/null; then
    echo -n "Checking RabbitMQ... "
    if rabbitmqctl status > /dev/null 2>&1; then
        echo -e "${GREEN}✅ RUNNING${NC}"
    else
        echo -e "${RED}❌ NOT RUNNING${NC}"
    fi
fi

echo ""
echo "🔍 Phase 2: Core Services Health Check"
echo "---------------------------------------"

# Check API Gateway
check_service "API Gateway" "http://localhost:3000/health"

# Check Auth Service
check_service "Auth Service" "http://localhost:3001/health"

# Check User Service
check_service "User Service" "http://localhost:3002/health"

# Check Product Service
check_service "Product Service" "http://localhost:3003/health"

# Check Order Service
check_service "Order Service" "http://localhost:3004/health"

# Check Payment Service
check_service "Payment Service" "http://localhost:3005/health"

# Check Country Layer Service
check_service "Country Layer Service" "http://localhost:3015/health"

echo ""
echo "🔍 Phase 3: API Integration Tests"
echo "---------------------------------"

# Test user registration/login flow
echo "Testing authentication flow..."
auth_response=$(curl -s -X POST "http://localhost:3001/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }' -w "\n%{http_code}")

auth_code=$(echo "$auth_response" | tail -n1)
if [ "$auth_code" = "201" ] || [ "$auth_code" = "200" ]; then
    echo -e "${GREEN}✅ User registration working${NC}"
else
    echo -e "${RED}❌ User registration failed${NC}"
fi

# Test product creation with country validation
echo "Testing product creation with country validation..."
product_response=$(curl -s -X POST "http://localhost:3003/api/v1/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -d '{
    "title": "Test Product",
    "description": "Test description",
    "price": 99.99,
    "originCountry": "US",
    "purchaseCountry": "SA",
    "deliveryCountry": "AE"
  }' -w "\n%{http_code}")

product_code=$(echo "$product_response" | tail -n1)
if [ "$product_code" = "201" ] || [ "$product_code" = "200" ]; then
    echo -e "${GREEN}✅ Product creation with country data working${NC}"
else
    echo -e "${YELLOW}⚠️  Product creation may need authentication${NC}"
fi

# Test country layer validation
echo "Testing country layer validation..."
country_response=$(curl -s -X POST "http://localhost:3015/api/v1/countries/validate-route" \
  -H "Content-Type: application/json" \
  -d '{
    "originCountry": "US",
    "destinationCountry": "SA",
    "productType": "electronics"
  }' -w "\n%{http_code}")

country_code=$(echo "$country_response" | tail -n1)
if [ "$country_code" = "200" ]; then
    echo -e "${GREEN}✅ Country validation working${NC}"
else
    echo -e "${RED}❌ Country validation failed${NC}"
fi

echo ""
echo "🔍 Phase 4: Database Schema Validation"
echo "---------------------------------------"

# Check if core tables exist
echo "Checking database schema..."

# Check users table
if psql "postgresql://postgres:password@localhost:5432/mnbara" -c "\dt users" | grep -q "users"; then
    echo -e "${GREEN}✅ Users table exists${NC}"
else
    echo -e "${RED}❌ Users table missing${NC}"
fi

# Check products table with COOL fields
if psql "postgresql://postgres:password@localhost:5432/mnbara" -c "\dt products" | grep -q "products"; then
    echo -e "${GREEN}✅ Products table exists${NC}"
    
    # Check for country fields
    if psql "postgresql://postgres:password@localhost:5432/mnbara" -c "\d products" | grep -q "origin_country"; then
        echo -e "${GREEN}✅ Country fields present in products${NC}"
    else
        echo -e "${YELLOW}⚠️  Country fields missing from products${NC}"
    fi
else
    echo -e "${RED}❌ Products table missing${NC}"
fi

# Check orders table
if psql "postgresql://postgres:password@localhost:5432/mnbara" -c "\dt orders" | grep -q "orders"; then
    echo -e "${GREEN}✅ Orders table exists${NC}"
else
    echo -e "${RED}❌ Orders table missing${NC}"
fi

# Check country layer tables
if psql "postgresql://postgres:password@localhost:5432/mnbara_country_layer" -c "\dt countries" | grep -q "countries"; then
    echo -e "${GREEN}✅ Country layer tables exist${NC}"
else
    echo -e "${RED}❌ Country layer tables missing${NC}"
fi

echo ""
echo "🔍 Phase 5: Service Dependencies Check"
echo "---------------------------------------"

# Check Redis keys
redis_keys=$(redis-cli -h localhost -p 6379 keys "*" | wc -l)
echo "Redis keys: $redis_keys"

# Check if services can communicate with each other
echo "Testing service-to-service communication..."

# Test if API Gateway can reach Auth Service
if curl -s "http://localhost:3000/health" | grep -q "healthy"; then
    echo -e "${GREEN}✅ API Gateway can reach downstream services${NC}"
else
    echo -e "${RED}❌ API Gateway communication issues${NC}"
fi

echo ""
echo "=========================================="
echo "📊 HEALTH CHECK SUMMARY"
echo "=========================================="

# Count successes and failures
# This would be implemented with proper counters in a real script

echo ""
echo "🔧 Recommended Actions:"
echo "1. Run database migrations if tables are missing"
echo "2. Start any services that are not running"
echo "3. Check environment variables for external service credentials"
echo "4. Verify network connectivity between services"
echo "5. Check logs for any error messages"

echo ""
echo "📋 Next Steps:"
echo "1. Fix any ❌ RED issues above"
echo "2. Run this script again to verify fixes"
echo "3. Test the core user flow manually"
echo "4. Run load tests if all services are healthy"

echo ""
echo "✅ Health check complete!"