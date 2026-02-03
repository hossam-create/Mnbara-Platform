#!/bin/bash
set -e

APP_URL=${1:-"http://localhost"}
MAX_RETRIES=30
RETRY_DELAY=2

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🏥 Running health checks...${NC}"

# Services to check
SERVICES=(
    "auction-service:3003"
    "listing-service:3002"
    "internal-ledger-service:3010"
    "payment-service:3008"
    "p2p-exchange-service:3005"
)

check_service() {
    local service_name=$1
    local service_port=$2
    local url="$APP_URL:$service_port/health"
    
    echo -n "Checking $service_name... "
    
    for i in $(seq 1 $MAX_RETRIES); do
        if curl -f -s -o /dev/null "$url"; then
            echo -e "${GREEN}✅ Healthy${NC}"
            return 0
        fi
        sleep $RETRY_DELAY
    done
    
    echo -e "${RED}❌ Failed${NC}"
    return 1
}

# Check database
echo -n "Checking PostgreSQL... "
if docker exec mnbara-postgres pg_isready -U mnbarh > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
    exit 1
fi

# Check Redis
echo -n "Checking Redis... "
if docker exec mnbara-redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
    exit 1
fi

# Check all services
FAILED=0
for service in "${SERVICES[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if ! check_service "$name" "$port"; then
        FAILED=1
    fi
done

if [ $FAILED -eq 1 ]; then
    echo -e "${RED}❌ Health checks failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All health checks passed!${NC}"
exit 0
