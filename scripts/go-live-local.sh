#!/bin/bash

# 🚀 MNBARA PLATFORM - LOCAL DEPLOYMENT LAUNCH SCRIPT
# Complete local deployment with all services

echo "🚀 MNBARA PLATFORM - LOCAL DEPLOYMENT LAUNCH"
echo "=================================================="
echo "Starting complete platform locally..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Service status tracking
SERVICES_STARTED=()
SERVICES_FAILED=()
TOTAL_SERVICES=0

# Function to check if service is running
check_service() {
    local name=$1
    local port=$2
    local max_attempts=30
    local attempt=0
    
    echo -n "Checking $name service (port $port)... "
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -f "http://localhost:$port/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ RUNNING${NC}"
            return 0
        fi
        
        ((attempt++))
        sleep 2
    done
    
    echo -e "${RED}❌ NOT RUNNING${NC}"
    return 1
}

# Function to start service
start_service() {
    local service_path=$1
    local service_name=$2
    local port=$3
    local start_command=$4
    local service_type=$5
    
    echo -e "${BLUE}🔄 Starting $service_name on port $port...${NC}"
    
    # Kill existing process on port if running
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    
    # Start service
    cd "$service_path" || return 1
    
    if [ "$service_type" = "node" ]; then
        nohup $start_command > "logs/$service_name.log" 2>&1 &
    elif [ "$service_type" = "npm" ]; then
        nohup npm run dev > "logs/$service_name.log" 2>&1 &
    elif [ "$service_type" = "ts-node" ]; then
        nohup npx ts-node-dev --respawn --transpile-only $start_command > "logs/$service_name.log" 2>&1 &
    else
        nohup $start_command > "logs/$service_name.log" 2>&1 &
    fi
    
    local pid=$!
    
    # Wait a moment for service to start
    sleep 3
    
    if check_service "$service_name" "$port"; then
        echo -e "${GREEN}✅ $service_name started successfully (PID: $pid)${NC}"
        SERVICES_STARTED+=("$service_name:$port:$pid")
        return 0
    else
        echo -e "${RED}❌ Failed to start $service_name${NC}"
        SERVICES_FAILED+=("$service_name:$port")
        return 1
    fi
}

# Create logs directory
mkdir -p logs

echo "📋 Starting Mnbara Platform Services..."
echo ""

# PHASE 1: CORE INFRASTRUCTURE
echo "🏗️ PHASE 1: Core Infrastructure"
echo "=================================================="

# Start PostgreSQL (if using local)
echo "1️⃣ PostgreSQL Database..."
echo "   (Assuming PostgreSQL is already running on port 5432)"
echo -e "${GREEN}✅ PostgreSQL ready${NC}"

# Start Redis (if using local)
echo ""
echo "2️⃣ Redis Cache..."
echo "   (Assuming Redis is already running on port 6379)"
echo -e "${GREEN}✅ Redis ready${NC}"

# PHASE 2: CORE SERVICES
echo ""
echo "🔧 PHASE 2: Core Services"
echo "=================================================="

# Start Auth Service
echo "3️⃣ Auth Service (Port 3001)..."
if start_service "backend/services/auth-service" "Auth" "3001" "node dist/simple-auth.js" "node"; then
    ((TOTAL_SERVICES++))
fi

# Start Country Layer Service
echo ""
echo "4️⃣ Country Layer Service (Port 3015)..."
if start_service "backend/services/country-layer-service" "Country" "3015" "node dist/server.js" "node"; then
    ((TOTAL_SERVICES++))
fi

# Start Subscription Service
echo ""
echo "5️⃣ Subscription Service (Port 3016)..."
if start_service "backend/services/subscription-service" "Subscription" "3016" "npm run dev" "npm"; then
    ((TOTAL_SERVICES++))
fi

# PHASE 3: BUSINESS SERVICES
echo ""
echo "💼 PHASE 3: Business Services"
echo "=================================================="

# Start Order Service
echo "6️⃣ Order Service (Port 3000)..."
if start_service "backend/mvp-services/order-service" "Order" "3000" "node dist/server.js" "node"; then
    ((TOTAL_SERVICES++))
fi

# Start Product Service
echo ""
echo "7️⃣ Product Service (Port 3006)..."
if start_service "backend/services/product-service" "Product" "3006" "npm run dev" "npm"; then
    ((TOTAL_SERVICES++))
fi

# Start Payment Service
echo ""
echo "8️⃣ Payment Service (Port 3003)..."
if start_service "backend/services/payment-service" "Payment" "3003" "node dist/app.js" "node"; then
    ((TOTAL_SERVICES++))
fi

# Start Wallet Service
echo ""
echo "9️⃣ Wallet Service (Port 3005)..."
if start_service "backend/services/wallet-service" "Wallet" "3005" "npm run dev" "npm"; then
    ((TOTAL_SERVICES++))
fi

# PHASE 4: FRONTEND SERVICES
echo ""
echo "🎨 PHASE 4: Frontend Services"
echo "=================================================="

# Start Web App
echo "🔟 Web Application (Port 5173)..."
if start_service "frontend/web-app" "WebApp" "5173" "npm run dev" "npm"; then
    ((TOTAL_SERVICES++))
fi

# Start Admin Dashboard
echo ""
echo "1️⃣1️⃣ Admin Dashboard (Port 3007)..."
if start_service "frontend/admin-dashboard" "Admin" "3007" "npm run dev" "npm"; then
    ((TOTAL_SERVICES++))
fi

# PHASE 5: MONITORING & STATUS
echo ""
echo "📊 PHASE 5: Service Status Check"
echo "=================================================="

# Wait a bit more for all services to stabilize
echo "Waiting for all services to stabilize..."
sleep 10

# Check all services
echo ""
echo "🔍 Final Service Status Check:"
echo "----------------------------------------"

SUCCESS_COUNT=0
for service_info in "${SERVICES_STARTED[@]}"; do
    IFS=':' read -r name port pid <<< "$service_info"
    if check_service "$name" "$port"; then
        ((SUCCESS_COUNT++))
    fi
done

echo ""
echo "📈 DEPLOYMENT SUMMARY"
echo "=================================================="
echo -e "Total Services Started: ${BLUE}$TOTAL_SERVICES${NC}"
echo -e "Services Running: ${GREEN}$SUCCESS_COUNT${NC}"
echo -e "Services Failed: ${RED}${#SERVICES_FAILED[@]}${NC}"
echo -e "Success Rate: ${GREEN}$((SUCCESS_COUNT * 100 / TOTAL_SERVICES))%${NC}"

if [ $SUCCESS_COUNT -ge 8 ]; then
    echo ""
    echo -e "${GREEN}🎉 LOCAL DEPLOYMENT SUCCESSFUL!${NC}"
    echo ""
    echo "🔗 Service Endpoints:"
    echo "   Main Web App:     http://localhost:5173"
    echo "   Admin Dashboard:  http://localhost:3007"
    echo "   Auth Service:     http://localhost:3001"
    echo "   Order Service:    http://localhost:3000"
    echo "   Product Service:  http://localhost:3006"
    echo "   Payment Service:  http://localhost:3003"
    echo "   Wallet Service:   http://localhost:3005"
    echo "   Country Service:  http://localhost:3015"
    echo "   Subscription:     http://localhost:3016"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Test the complete user flow"
    echo "   2. Verify all API endpoints"
    echo "   3. Check logs in ./logs/ directory"
    echo "   4. Run integration tests"
    echo "   5. Prepare for production deployment"
    echo ""
    echo "🚀 Mnbara Platform is LIVE locally!"
    
    # Save service PIDs for cleanup
    > .local_service_pids
    for service_info in "${SERVICES_STARTED[@]}"; do
        IFS=':' read -r name port pid <<< "$service_info"
        echo "$pid" >> .local_service_pids
    done
    
elif [ $SUCCESS_COUNT -ge 5 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Partial deployment successful.${NC}"
    echo "Some services failed to start. Check logs for details."
    echo "Core services are running - you can test basic functionality."
else
    echo ""
    echo -e "${RED}❌ Deployment failed.${NC}"
    echo "Too many services failed to start."
    echo "Check logs in ./logs/ directory and fix issues."
    exit 1
fi

echo ""
echo "🎯 Local deployment complete!"