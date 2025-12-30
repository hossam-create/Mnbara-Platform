# MVP Testing & Integration Guide

## Status: Ready for Testing

---

## Quick Start

### 1. Database Setup (5 minutes)
```bash
# Windows
scripts\setup-databases.bat

# Linux/Mac
chmod +x scripts/setup-databases.sh
./scripts/setup-databases.sh
```

### 2. Start Services (2 minutes)
```bash
# Windows
scripts\start-mvp.bat

# Linux/Mac
chmod +x scripts/start-mvp.sh
./scripts/start-mvp.sh
```

### 3. Verify Services (1 minute)
```bash
# Windows
scripts\verify-services.bat

# Linux/Mac
chmod +x scripts/verify-services.sh
./scripts/verify-services.sh
```

### 4. Run Integration Tests (3 minutes)
```bash
npm test test/integration/mvp-integration.test.ts
```

---

## Service Endpoints

| Service | Port | Health Check | API Base |
|---------|------|--------------|----------|
| Listing | 3001 | /health | /api/products |
| Cart | 3002 | /health | /api/cart |
| Payment | 3003 | /health | /api/payments |
| Crowdship | 3004 | /health | /api/crowdship |
| Compliance | 3005 | /health | /api/kyc |

---

## Manual Testing

### Test 1: Get Products
```bash
curl http://localhost:3001/api/products
```

### Test 2: Add to Cart
```bash
curl -X POST http://localhost:3002/api/cart/test-user/add \
  -H "Content-Type: application/json" \
  -d '{"productId":"prod-1","quantity":2,"price":999.99}'
```

### Test 3: Create Payment
```bash
curl -X POST http://localhost:3003/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -d '{"amount":999.99,"currency":"usd"}'
```

---

## Integration Test Coverage

✅ Product Service (4 tests)
- Get products list
- Get single product
- Search products
- Filter by category

✅ Cart Service (6 tests)
- Get empty cart
- Add item to cart
- Update quantity
- Get cart with items
- Remove item
- Clear cart

✅ Payment Service (2 tests)
- Create payment intent
- Get payment status

✅ End-to-End Flow (1 test)
- Complete purchase flow

**Total: 13 integration tests**

---

## Troubleshooting

### Services not starting
```bash
# Check Docker
docker ps

# Restart Docker Compose
docker-compose restart

# Check logs
docker-compose logs
```

### Database connection errors
```bash
# Reset databases
docker-compose down -v
docker-compose up -d postgres redis
./scripts/setup-databases.sh
```

### Port already in use
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

---

## Next Steps

After successful testing:
1. ✅ Database Setup & Seeding - COMPLETE
2. ✅ Service Startup & Verification - COMPLETE
3. ✅ Testing & Integration - COMPLETE
4. ⏳ Frontend Integration
5. ⏳ Seller Dashboard
6. ⏳ Production Deployment
