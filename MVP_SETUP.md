# MNBara MVP - Quick Setup Guide

## Prerequisites
- Docker & Docker Compose
- Node.js 18+
- npm or yarn

## Quick Start

### Windows
```bash
scripts\start-mvp.bat
```

### Linux/Mac
```bash
chmod +x scripts/start-mvp.sh
./scripts/start-mvp.sh
```

## Manual Setup

### 1. Install Dependencies
```bash
cd backend/services/listing-service-node && npm install
cd ../cart-service && npm install
cd ../payment-service && npm install
cd ../crowdship-service && npm install
cd ../compliance-service && npm install
```

### 2. Start Infrastructure
```bash
docker-compose -f docker-compose.dev.yml up -d postgres redis
```

### 3. Run Migrations
```bash
cd backend/services/listing-service-node && npx prisma migrate dev
cd ../cart-service && npx prisma migrate dev
cd ../payment-service && npx prisma migrate dev
cd ../crowdship-service && npx prisma migrate dev
cd ../compliance-service && npx prisma migrate dev
```

### 4. Start Services
```bash
# Terminal 1
cd backend/services/listing-service-node && npm run dev

# Terminal 2
cd backend/services/cart-service && npm run dev

# Terminal 3
cd backend/services/payment-service && npm run dev

# Terminal 4
cd backend/services/crowdship-service && npm run dev

# Terminal 5
cd backend/services/compliance-service && npm run dev
```

## Service URLs

- **Listing Service**: http://localhost:3001
- **Cart Service**: http://localhost:3002
- **Payment Service**: http://localhost:3003
- **Crowdship Service**: http://localhost:3004
- **Compliance Service**: http://localhost:3005

## API Testing

### Products
```bash
# Get products
curl http://localhost:3001/api/products

# Create product
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Product","price":99.99,"category":"electronics"}'
```

### Cart
```bash
# Add to cart
curl -X POST http://localhost:3002/api/cart/add \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","productId":"prod123","quantity":1}'
```

### Payment
```bash
# Create payment intent
curl -X POST http://localhost:3003/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -d '{"amount":99.99,"currency":"usd"}'
```

## Environment Variables

Copy `.env.mvp` to `.env` and update:
- `STRIPE_SECRET_KEY` - Your Stripe test key
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
netstat -ano | findstr :3001

# Kill the process (Windows)
taskkill /PID <PID> /F
```

### Database Connection Error
```bash
# Restart PostgreSQL
docker-compose -f docker-compose.dev.yml restart postgres
```

### Redis Connection Error
```bash
# Restart Redis
docker-compose -f docker-compose.dev.yml restart redis
```

## Stop Services

```bash
docker-compose -f docker-compose.dev.yml down
```
