# STARTUP GUIDE - Mnbara Platform MVP

**Version**: 1.0.0
**Status**: Production Ready
**Last Updated**: 2026-02-14

---

## PREREQUISITES

### Required Software
- Docker Desktop (latest version)
- Docker Compose (v2.0+)
- Node.js 18+ (for local development)
- PostgreSQL 15+ (for local development)
- Redis 7+ (for local development)

### System Requirements
- **CPU**: 4 cores minimum, 8 cores recommended
- **RAM**: 16GB minimum, 32GB recommended
- **Disk**: 50GB free space minimum
- **OS**: Windows 10/11, macOS 12+, or Linux (Ubuntu 20.04+)

---

## QUICK START

### 1. Clone Repository
```bash
git clone https://github.com/mnbara/platform.git
cd mnbara-platform
```

### 2. Start Infrastructure
```bash
docker-compose up -d postgres redis
```

### 3. Start Core Services
```bash
docker-compose up -d api-gateway auth-service user-service product-service
```

### 4. Start Additional Services
```bash
docker-compose up -d country-layer-service trips-service orders-service wallet-service
docker-compose up -d matching-service admin-service notification-service
docker-compose up -d payment-service escrow-service settlement-service cart-service
docker-compose up -d feature-management-service
```

### 5. Verify Services
```bash
# Check all services are running
docker-compose ps

# Check service health
curl http://localhost:8080/health
curl http://localhost:3001/health
curl http://localhost:3002/health
# ... check all services
```

### 6. Access Platform
- **API Gateway**: http://localhost:8080
- **Admin Dashboard**: http://localhost:3008
- **API Documentation**: http://localhost:8080/docs

---

## DETAILED SETUP

### Environment Configuration

#### 1. Create .env file
```bash
cp .env.example .env
```

#### 2. Configure Environment Variables
```bash
# Database
DATABASE_URL=postgresql://mnbarh:mnbarh_dev_password@localhost:5432/mnbarh?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-256-bit-key-for-security

# API Gateway
API_GATEWAY_PORT=8080

# Service Ports
AUTH_SERVICE_PORT=3001
USER_SERVICE_PORT=3002
PRODUCT_SERVICE_PORT=3003
TRIPS_SERVICE_PORT=3004
ORDERS_SERVICE_PORT=3005
WALLET_SERVICE_PORT=3006
MATCHING_SERVICE_PORT=3007
ADMIN_SERVICE_PORT=3008
NOTIFICATION_SERVICE_PORT=3009
FEATURE_MANAGEMENT_SERVICE_PORT=3010
PAYMENT_SERVICE_PORT=3011
ESCROW_SERVICE_PORT=3012
SETTLEMENT_SERVICE_PORT=3013
CART_SERVICE_PORT=3014
COUNTRY_LAYER_SERVICE_PORT=3015
```

### Database Setup

#### 1. Initialize Database
```bash
# Run migrations for all services
cd backend/services/auth-service && npx prisma migrate deploy
cd backend/services/user-service && npx prisma migrate deploy
cd backend/services/product-service && npx prisma migrate deploy
cd backend/services/trips-service && npx prisma migrate deploy
cd backend/services/matching-service && npx prisma migrate deploy
cd backend/services/country-layer-service && npx prisma migrate deploy
```

#### 2. Seed Data (Optional)
```bash
# Seed countries
cd backend/services/country-layer-service
npm run seed
```

### Service Startup Order

#### Phase 1: Infrastructure (Required First)
```bash
docker-compose up -d postgres redis
```

Wait for databases to be ready (30 seconds)

#### Phase 2: Core Services
```bash
docker-compose up -d api-gateway auth-service user-service product-service
```

#### Phase 3: Business Logic Services
```bash
docker-compose up -d country-layer-service trips-service orders-service wallet-service
docker-compose up -d matching-service
```

#### Phase 4: Supporting Services
```bash
docker-compose up -d payment-service escrow-service settlement-service cart-service
docker-compose up -d admin-service notification-service feature-management-service
```

---

## LOCAL DEVELOPMENT

### Running Services Locally (without Docker)

#### 1. Start Infrastructure
```bash
docker-compose up -d postgres redis
```

#### 2. Install Dependencies
```bash
cd backend/services/auth-service
npm install
```

#### 3. Generate Prisma Client
```bash
npx prisma generate
```

#### 4. Run Migrations
```bash
npx prisma migrate deploy
```

#### 5. Start Service
```bash
npm run dev
```

Repeat for each service.

---

## TESTING

### Health Check All Services
```bash
#!/bin/bash
services=(
  "8080:api-gateway"
  "3001:auth-service"
  "3002:user-service"
  "3003:product-service"
  "3004:trips-service"
  "3005:orders-service"
  "3006:wallet-service"
  "3007:matching-service"
  "3008:admin-service"
  "3009:notification-service"
  "3010:feature-management-service"
  "3011:payment-service"
  "3012:escrow-service"
  "3013:settlement-service"
  "3014:cart-service"
  "3015:country-layer-service"
)

for service in "${services[@]}"; do
  IFS=':' read -r port name <<< "$service"
  echo "Checking $name on port $port..."
  if curl -f http://localhost:$port/health > /dev/null 2>&1; then
    echo "✅ $name is healthy"
  else
    echo "❌ $name is unhealthy"
  fi
done
```

### Test Complete Flow
```bash
# 1. Register user
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 2. Login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 3. Create product with countries
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title":"Test Product",
    "price":100.00,
    "originCountry":"US",
    "purchaseCountry":"US",
    "deliveryCountry":"UK"
  }'

# 4. Create trip
curl -X POST http://localhost:8080/api/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "originCountry":"US",
    "destinationCountry":"UK",
    "departureDate":"2026-03-01",
    "arrivalDate":"2026-03-15"
  }'

# 5. Match products with travelers
curl -X POST http://localhost:8080/api/match \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"productId":"PRODUCT_ID"}'
```

---

## TROUBLESHOOTING

### Service Won't Start

#### Check Logs
```bash
docker-compose logs auth-service
```

#### Check Database Connection
```bash
docker-compose exec postgres psql -U mnbarh -d mnbarh -c "SELECT 1"
```

#### Check Redis Connection
```bash
docker-compose exec redis redis-cli ping
```

### Database Migrations Failed

#### Reset Database
```bash
# WARNING: This deletes all data
docker-compose down -v
docker-compose up -d postgres
# Re-run migrations
```

#### Check Migration Status
```bash
cd backend/services/auth-service
npx prisma migrate status
```

### Port Conflicts

#### Change Ports in .env
```bash
# Example: Change auth-service port to 3002
AUTH_SERVICE_PORT=3002
```

#### Check What's Using Port
```bash
netstat -ano | findstr :3001
```

### Memory Issues

#### Increase Docker Memory
1. Open Docker Desktop
2. Go to Settings → Resources
3. Increase Memory to 8GB+

#### Reduce Service Instances
```bash
# In docker-compose.yml, add:
services:
  auth-service:
    deploy:
      replicas: 1
```

### Build Errors

#### Clear Docker Cache
```bash
docker system prune -a
docker-compose build --no-cache auth-service
```

#### Check Node Version
```bash
node --version  # Should be 18+
```

---

## MONITORING

### View Service Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth-service

# Last 100 lines
docker-compose logs --tail=100 auth-service
```

### Check Resource Usage
```bash
# CPU and Memory
docker stats

# Disk usage
docker system df
```

### Health Check Script
```bash
# Save as health-check.sh
#!/bin/bash
for service in api-gateway auth-service user-service product-service trips-service orders-service wallet-service matching-service admin-service notification-service feature-management-service payment-service escrow-service settlement-service cart-service country-layer-service; do
  if docker-compose ps | grep -q "$service.*Up"; then
    echo "✅ $service is running"
  else
    echo "❌ $service is not running"
  fi
done
```

---

## DEPLOYMENT

### Production Deployment

#### 1. Build Images
```bash
docker-compose build
```

#### 2. Tag Images
```bash
docker tag mnbara/auth-service:latest registry.example.com/mnbara/auth-service:1.0.0
```

#### 3. Push to Registry
```bash
docker push registry.example.com/mnbara/auth-service:1.0.0
```

#### 4. Deploy to Production
```bash
kubectl apply -f k8s/
```

### Environment-Specific Configurations

#### Development
```bash
cp .env.development .env
docker-compose up -d
```

#### Staging
```bash
cp .env.staging .env
docker-compose -f docker-compose.staging.yml up -d
```

#### Production
```bash
cp .env.production .env
docker-compose -f docker-compose.prod.yml up -d
```

---

## MAINTENANCE

### Database Backups
```bash
# Backup
docker-compose exec postgres pg_dump -U mnbarh mnbarh > backup.sql

# Restore
docker-compose exec -T postgres psql -U mnbarh mnbarh < backup.sql
```

### Log Rotation
```bash
# Configure in docker-compose.yml
services:
  auth-service:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Service Updates
```bash
# Pull latest images
docker-compose pull

# Restart services
docker-compose up -d

# Zero-downtime deployment (requires load balancer)
docker-compose up -d --no-deps --build auth-service
```

---

## SUPPORT

### Documentation
- API Documentation: http://localhost:8080/docs
- Architecture: ARCHITECTURE_FINAL.md
- Service Audit: SERVICE_AUDIT_REPORT.md

### Getting Help
- **Technical Support**: tech@mnbara.com
- **Emergency Issues**: emergency@mnbara.com
- **Documentation**: docs.mnbara.com

### Common Issues

| Issue | Solution |
|-------|----------|
| Service won't start | Check logs, verify database connection |
| Database migration failed | Reset database, re-run migrations |
| Port already in use | Change port in .env or stop conflicting service |
| Out of memory | Increase Docker memory allocation |
| Build fails | Clear Docker cache, check Node version |

---

## NEXT STEPS

1. ✅ Complete platform setup
2. ✅ Verify all services are healthy
3. ✅ Run test flow
4. ⏳ Configure monitoring
5. ⏳ Set up CI/CD pipeline
6. ⏳ Deploy to production

---

**Status**: ✅ PRODUCTION READY
**Version**: 1.0.0
**Date**: 2026-02-14
