#!/bin/bash

# Start All Services
# Launch all microservices in development mode

set -e

echo "🚀 Starting all Mnbara services..."

# Array of services
services=(
  "listing-service:3001"
  "auction-service:3002"
  "payment-service:3003"
  "kyc-service:3007"
  "internal-ledger-service:3009"
  "ai-recommendations:3010"
  "escrow-service:3011"
  "stripe-connect-service:3012"
  "notification-service:3013"
  "auth-service:3014"
  "push-notification-service:3015"
  "chat-service:3016"
  "file-storage-service:3017"
  "job-queue-service:3018"
  "image-recognition-service:3019"
  "recommendation-engine-service:3020"
  "location-service:3021"
  "medusa-adapter:3022"
  "search-service:3023"
  "review-service:3024"
  "image-processing-service:3025"
  "i18n-service:3026"
  "novu-service:3027"
  "analytics-service:3028"
  "ai-agent-service:3029"
)

BASE_DIR="backend/services"

# Create logs directory
mkdir -p logs

echo ""
echo "Starting ${#services[@]} services..."
echo "Logs will be written to logs/ directory"
echo ""

for service_port in "${services[@]}"; do
  IFS=':' read -r service port <<< "$service_port"
  
  SERVICE_DIR="$BASE_DIR/$service"
  
  if [ -d "$SERVICE_DIR" ]; then
    echo "Starting $service on port $port..."
    
    cd "$SERVICE_DIR"
    
    # Start service in background
    PORT=$port npm run dev > "../../../logs/$service.log" 2>&1 &
    
    # Save PID
    echo $! > "../../../logs/$service.pid"
    
    cd - > /dev/null
    
    # Wait a bit before starting next service
    sleep 1
  else
    echo "⚠️  Service directory not found: $SERVICE_DIR"
  fi
done

echo ""
echo "✅ All services started!"
echo ""
echo "To check status: ./scripts/integration/health-check-all.sh"
echo "To stop all: ./scripts/integration/stop-all-services.sh"
echo "To view logs: tail -f logs/{service-name}.log"
