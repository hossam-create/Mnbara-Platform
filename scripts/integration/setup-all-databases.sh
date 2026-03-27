#!/bin/bash

# Setup All Databases for Mnbara Platform
# Run this script to create and migrate all service databases

set -e

echo "🗄️  Setting up all databases for Mnbara Platform..."

# Array of services with databases
services=(
  "listing-service"
  "auction-service"
  "payment-service"
  "kyc-service"
  "internal-ledger-service"
  "ai-recommendations"
  "escrow-service"
  "stripe-connect-service"
  "notification-service"
  "auth-service"
  "push-notification-service"
  "chat-service"
  "file-storage-service"
  "job-queue-service"
  "image-recognition-service"
  "recommendation-engine-service"
  "location-service"
  "medusa-adapter"
  "search-service"
  "review-service"
  "image-processing-service"
  "i18n-service"
  "novu-service"
  "analytics-service"
  "ai-agent-service"
)

# Base directory
BASE_DIR="backend/services"

# Counter
total=${#services[@]}
current=0

for service in "${services[@]}"; do
  current=$((current + 1))
  echo ""
  echo "[$current/$total] Setting up $service..."
  
  SERVICE_DIR="$BASE_DIR/$service"
  
  if [ -d "$SERVICE_DIR" ]; then
    cd "$SERVICE_DIR"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
      echo "  📦 Installing dependencies..."
      npm install --silent
    fi
    
    # Generate Prisma client
    if [ -f "prisma/schema.prisma" ]; then
      echo "  🔧 Generating Prisma client..."
      npx prisma generate
    fi
    
    # Run migrations
    if [ -d "prisma/migrations" ]; then
      echo "  🚀 Running migrations..."
      npx prisma migrate deploy
    fi
    
    echo "  ✅ $service setup complete"
    
    cd - > /dev/null
  else
    echo "  ⚠️  Directory not found: $SERVICE_DIR"
  fi
done

echo ""
echo "🎉 All databases setup complete!"
echo ""
echo "Next steps:"
echo "1. Verify connections: npm run db:test"
echo "2. Seed data: npm run seed"
echo "3. Start services: npm run dev:all"
