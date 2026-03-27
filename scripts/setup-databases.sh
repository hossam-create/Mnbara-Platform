#!/bin/bash

echo "========================================"
echo "Database Setup Script"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Start database containers
echo "📦 Starting database containers..."
docker-compose up -d postgres redis

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
sleep 10

# Run migrations for each service
echo ""
echo "🔄 Running database migrations..."
echo ""

echo "[1/5] Listing Service..."
cd backend/services/listing-service-node
npx prisma migrate dev --name init
npx prisma generate
npx ts-node prisma/seed.ts
cd ../../..

echo ""
echo "[2/5] Payment Service..."
cd backend/services/payment-service
npx prisma migrate dev --name init
npx prisma generate
npx ts-node prisma/seed.ts
cd ../../..

echo ""
echo "[3/5] Cart Service..."
cd backend/services/cart-service
npx prisma migrate dev --name init
npx prisma generate
cd ../../..

echo ""
echo "[4/5] Compliance Service..."
cd backend/services/compliance-service
npx prisma migrate dev --name init
npx prisma generate
cd ../../..

echo ""
echo "[5/5] Crowdship Service..."
cd backend/services/crowdship-service
npx prisma migrate dev --name init
npx prisma generate
cd ../../..

echo ""
echo "========================================"
echo "✅ Database setup complete!"
echo "========================================"
echo ""
echo "📊 Database Status:"
docker-compose ps postgres redis
echo ""
echo "🎉 Ready to start services!"
