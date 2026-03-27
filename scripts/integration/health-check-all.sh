#!/bin/bash

# Health Check All Services
# Verify all microservices are running and healthy

set -e

echo "🏥 Health checking all Mnbara services..."

# Service ports
declare -A services=(
  ["Listing Service"]="3001"
  ["Auction Service"]="3002"
  ["Payment Service"]="3003"
  ["KYC Service"]="3007"
  ["Internal Ledger"]="3009"
  ["AI Recommendations"]="3010"
  ["Escrow Service"]="3011"
  ["Stripe Connect"]="3012"
  ["Notification Service"]="3013"
  ["Auth Service"]="3014"
  ["Push Notifications"]="3015"
  ["Chat Service"]="3016"
  ["File Storage"]="3017"
  ["Job Queue"]="3018"
  ["Image Recognition"]="3019"
  ["Recommendation Engine"]="3020"
  ["Location Service"]="3021"
  ["Medusa Adapter"]="3022"
  ["Search Service"]="3023"
  ["Review Service"]="3024"
  ["Image Processing"]="3025"
  ["i18n Service"]="3026"
  ["Novu Service"]="3027"
  ["Analytics Service"]="3028"
  ["AI Agent Service"]="3029"
)

# Counters
healthy=0
unhealthy=0
total=${#services[@]}

echo ""
echo "Checking $total services..."
echo ""

for service in "${!services[@]}"; do
  port="${services[$service]}"
  
  # Try to connect to health endpoint
  if curl -s -f "http://localhost:$port/health" > /dev/null 2>&1; then
    echo "✅ $service (port $port) - HEALTHY"
    healthy=$((healthy + 1))
  else
    echo "❌ $service (port $port) - UNHEALTHY"
    unhealthy=$((unhealthy + 1))
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Health Check Summary:"
echo "  Total Services: $total"
echo "  Healthy: $healthy"
echo "  Unhealthy: $unhealthy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $unhealthy -eq 0 ]; then
  echo ""
  echo "🎉 All services are healthy!"
  exit 0
else
  echo ""
  echo "⚠️  Some services are unhealthy. Please check logs."
  exit 1
fi
