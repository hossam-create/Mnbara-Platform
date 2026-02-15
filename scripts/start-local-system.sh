#!/bin/bash

# 🚀 Mnbara Platform - Local MVP System Startup Script
# This script starts all core services for local testing

echo "🚀 Starting Mnbara Platform Local MVP System..."
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Service ports
SERVICES=(
  "Auth:3001"
  "Subscription:3016" 
  "Country:3015"
  "Order:3000"
  "Product:3006"
)

# Function to check if service is running
check_service() {
    local name=$1
    local port=$2
    
    if curl -s -f "http://localhost:$port/health" > /dev/null; then
        echo -e "${GREEN}✅ $name Service: RUNNING (Port $port)${NC}"
        return 0
    else
        echo -e "${RED}❌ $name Service: NOT RUNNING (Port $port)${NC}"
        return 1
    fi
}

# Function to start service
start_service() {
    local service_path=$1
    local service_name=$2
    local port=$3
    local start_command=$4
    
    echo -e "${BLUE}🔄 Starting $service_name on port $port...${NC}"
    
    cd "$service_path" || exit 1
    
    # Kill existing process on port if running
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    
    # Start service in background
    nohup $start_command > "logs/$service_name.log" 2>&1 &
    
    # Wait for service to start
    sleep 3
    
    if check_service "$service_name" "$port"; then
        echo -e "${GREEN}✅ $service_name started successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to start $service_name${NC}"
        echo "Check logs: $service_path/logs/$service_name.log"
        return 1
    fi
}

# Create logs directory
mkdir -p logs

echo "📋 Starting core services..."
echo ""

# Start Auth Service
echo "1️⃣ Starting Auth Service..."
if start_service "backend/services/auth-service" "Auth" "3001" "node dist/simple-auth.js"; then
    AUTH_PID=$!
fi

echo ""

# Start Subscription Service  
echo "2️⃣ Starting Subscription Service..."
if start_service "backend/services/subscription-service" "Subscription" "3016" "node src/app.ts"; then
    SUBSCRIPTION_PID=$!
fi

echo ""

# Start Country Layer Service
echo "3️⃣ Starting Country Layer Service..."
if start_service "backend/services/country-layer-service" "Country" "3015" "node dist/server.js"; then
    COUNTRY_PID=$!
fi

echo ""

# Start Order Service
echo "4️⃣ Starting Order Service..."
if start_service "backend/mvp-services/order-service" "Order" "3000" "node dist/server.js"; then
    ORDER_PID=$!
fi

echo ""

# Start Product Service
echo "5️⃣ Starting Product Service..."
if start_service "backend/services/product-service" "Product" "3006" "node src/app.ts"; then
    PRODUCT_PID=$!
fi

echo ""
echo "=================================================="
echo "📊 System Status Check"
echo "=================================================="

# Check all services
SERVICES_RUNNING=0
TOTAL_SERVICES=5

for service in "${SERVICES[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if check_service "$name" "$port"; then
        ((SERVICES_RUNNING++))
    fi
done

echo ""
echo "=================================================="
echo "📈 Service Summary"
echo "=================================================="
echo -e "Services Running: ${GREEN}$SERVICES_RUNNING/$TOTAL_SERVICES${NC}"

if [ $SERVICES_RUNNING -eq $TOTAL_SERVICES ]; then
    echo -e "${GREEN}🎉 All services are running! System ready for testing.${NC}"
    echo ""
    echo "🔗 Service Endpoints:"
    echo "   Auth Service: http://localhost:3001"
    echo "   Subscription Service: http://localhost:3016"
    echo "   Country Layer Service: http://localhost:3015"
    echo "   Order Service: http://localhost:3000"
    echo "   Product Service: http://localhost:3006"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Run: bash scripts/test-complete-flow.sh"
    echo "   2. Test with Postman/Insomnia"
    echo "   3. Check logs in ./logs/ directory"
    
    # Save PIDs for cleanup
    echo "$AUTH_PID $SUBSCRIPTION_PID $COUNTRY_PID $ORDER_PID $PRODUCT_PID" > .service_pids
    
elif [ $SERVICES_RUNNING -ge 3 ]; then
    echo -e "${YELLOW}⚠️  Partial system startup. $SERVICES_RUNNING services running.${NC}"
    echo "Check logs and restart failed services."
else
    echo -e "${RED}❌ Critical services failed to start.${NC}"
    echo "Check logs in ./logs/ directory and fix issues."
    exit 1
fi

echo ""
echo "🎯 System startup complete!"