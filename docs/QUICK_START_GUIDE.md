# 🚀 MNBARA PLATFORM - QUICK START GUIDE
**Version:** 1.0 | **Last Updated:** 2026-02-13

## ⚡ GET STARTED IN 5 MINUTES

### 1. Prerequisites
```bash
# Install Docker & Docker Compose
docker --version
docker-compose --version

# Install Node.js 18+
node --version
npm --version
```

### 2. Clone & Setup
```bash
git clone <repository-url> mnbara-platform
cd mnbara-platform

# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env

# Install dependencies
npm install
cd backend && npm install && cd ..
cd frontend/web-app && npm install && cd ../..
```

### 3. Start Platform
```bash
# Option A: Docker (Recommended)
docker-compose up -d

# Option B: Manual Start
npm run dev:backend  # Start all backend services
npm run dev:frontend # Start frontend
```

## 🎯 DASHBOARD ACCESS

### Main URLs
| Dashboard | URL | Credentials | Status |
|-----------|-----|-------------|---------|
| **Homepage** | http://localhost:3000 | - | ✅ Live |
| **Admin Panel** | http://localhost:3001/admin | admin@mnbara.com / Admin123! | ✅ Active |
| **Control Center** | http://localhost:3002/control-center | founder@mnbara.com / Founder123! | ✅ Active |
| **Seller Dashboard** | http://localhost:3000/seller/dashboard | seller@mnbara.com / Seller123! | ✅ Active |
| **Traveler Dashboard** | http://localhost:3000/traveler/dashboard | traveler@mnbara.com / Traveler123! | ✅ Active |
| **API Documentation** | http://localhost:8080/docs | - | ✅ Live |

### Test Accounts
```
👤 Admin User:
   Email: admin@mnbara.com
   Password: Admin123!
   Role: Administrator

👤 Founder User:
   Email: founder@mnbara.com
   Password: Founder123!
   Role: Platform Owner

👤 Seller User:
   Email: seller@mnbara.com
   Password: Seller123!
   Role: Marketplace Seller

👤 Traveler User:
   Email: traveler@mnbara.com
   Password: Traveler123!
   Role: Delivery Traveler

👤 Buyer User:
   Email: buyer@mnbara.com
   Password: Buyer123!
   Role: Marketplace Buyer
```

## 🔧 SERVICE STATUS

### Quick Health Check
```bash
# Check all services
curl http://localhost:8080/health

# Individual service health
curl http://localhost:3001/health  # API Gateway
curl http://localhost:3002/health  # Auth Service
curl http://localhost:3003/health  # User Service
curl http://localhost:3004/health  # Payment Service
```

### Service Ports
| Service | Port | Status Check |
|---------|------|--------------|
| API Gateway | 8080 | curl localhost:8080/health |
| Auth Service | 3001 | curl localhost:3001/health |
| User Service | 3002 | curl localhost:3002/health |
| Listing Service | 3003 | curl localhost:3003/health |
| Payment Service | 3004 | curl localhost:3004/health |
| Frontend | 3000 | curl localhost:3000 |
| Admin Panel | 3001 | curl localhost:3001 |
| Control Center | 3002 | curl localhost:3002 |

## 🚨 COMMON ISSUES & FIXES

### 1. Database Connection Failed
```bash
# Check PostgreSQL
docker-compose logs postgres

# Fix: Restart database
docker-compose restart postgres

# Verify connection
psql -h localhost -U mnbara_user -d mnbara_db -c "SELECT 1;"
```

### 2. Redis Connection Error
```bash
# Check Redis logs
docker-compose logs redis

# Fix: Restart Redis
docker-compose restart redis

# Test connection
redis-cli ping
```

### 3. Frontend Build Failed
```bash
# Clear node_modules and reinstall
cd frontend/web-app
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### 4. API Gateway Not Responding
```bash
# Check logs
docker-compose logs api-gateway

# Fix: Restart gateway
docker-compose restart api-gateway

# Wait 30 seconds for startup
sleep 30 && curl http://localhost:8080/health
```

### 5. Port Already in Use
```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :8080

# Kill process or use different port
kill -9 <PID>
# OR modify .env file with different ports
```

## 📊 QUICK TESTS

### Test User Registration
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User",
    "userType": "buyer"
  }'
```

### Test API Authentication
```bash
# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer@mnbara.com",
    "password": "Buyer123!"
  }'

# Use token for authenticated request
curl -X GET http://localhost:8080/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Database Connection
```bash
# Check PostgreSQL
docker exec mnbara-postgres pg_isready -U mnbara_user

# Check Redis
docker exec mnbara-redis redis-cli ping
```

## 🎯 NEXT STEPS

### For Development
1. **Explore Admin Panel**: http://localhost:3001/admin
2. **Test Control Center**: http://localhost:3002/control-center  
3. **Review API Docs**: http://localhost:8080/docs
4. **Check Service Logs**: `docker-compose logs -f`

### For Testing
1. **Create Test Listings**: Use seller dashboard
2. **Place Test Orders**: Use buyer dashboard
3. **Test Payment Flow**: Use Stripe test cards
4. **Verify Emails**: Check console logs for email links

### For Production
1. **Update Environment Variables**: Production API keys
2. **Configure Domains**: Set up proper DNS
3. **Enable SSL**: Configure HTTPS certificates
4. **Set Up Monitoring**: Configure health checks

## 📞 NEED HELP?

### Quick Support
- **Check Logs**: `docker-compose logs <service-name>`
- **Health Status**: http://localhost:8080/health
- **API Status**: http://localhost:8080/health/detailed

### Documentation
- **Main PRD**: docs/MNBARA_UNIFIED_PRD_v1.0.md
- **Developer Guide**: docs/DEVELOPER_COMPANION_GUIDE.md
- **Gaps Analysis**: docs/GAPS_ANALYSIS.md

### Emergency Contacts
- **Technical Issues**: tech@mnbara.com
- **Urgent Support**: support@mnbara.com
- **System Status**: status.mnbara.com

---

**🎉 SUCCESS!** Platform is running. Start exploring the dashboards and testing features.