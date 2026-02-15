# ✅ MNBARA PLATFORM - ACTIVATION CHECKLIST
**Version:** 1.0 | **Last Updated:** 2026-02-13

## 🎯 PRE-ACTIVATION CHECKS

### System Health Verification
- [ ] **Database Connection**: PostgreSQL is running and accessible
- [ ] **Redis Cache**: Redis is running and responding to ping
- [ ] **Docker Services**: All containers are healthy (`docker-compose ps`)
- [ ] **Port Availability**: No conflicts on ports 3000-8080
- [ ] **Disk Space**: >10GB free space available
- [ ] **Memory**: >4GB RAM available for services

### Environment Setup
- [ ] **Environment Files**: All `.env` files configured
- [ ] **API Keys**: Stripe, PayPal, M-Pesa keys set (for production)
- [ ] **JWT Secret**: Secure JWT secret configured
- [ ] **Database Migrations**: All migrations applied
- [ ] **SSL Certificates**: HTTPS certificates ready (for production)

## 🔧 SERVICE HEALTH VERIFICATION

### Core Services Check
```bash
# Run health checks on all services
curl -s http://localhost:8080/health | jq .
curl -s http://localhost:3001/health | jq .
curl -s http://localhost:3002/health | jq .
curl -s http://localhost:3003/health | jq .
curl -s http://localhost:3004/health | jq .
```

**Expected Status**: All services return `"status": "healthy"`

### Database Connectivity
```bash
# Test PostgreSQL connection
docker exec mnbara-postgres pg_isready -U mnbara_user

# Test Redis connection
docker exec mnbara-redis redis-cli ping
```

**Expected Response**: `PONG`

### API Gateway Status
```bash
# Test main API endpoints
curl -s http://localhost:8080/api/v1/health
curl -s http://localhost:8080/api/v1/auth/health
curl -s http://localhost:8080/api/v1/users/health
```

## 🎛️ DASHBOARD ACTIVATION ORDER

### Phase 1: Core Infrastructure (Minutes 0-5)
1. [ ] **PostgreSQL Database** → Verify connection and migrations
2. [ ] **Redis Cache** → Confirm caching is operational
3. [ ] **API Gateway** → Test main routing and health endpoints
4. [ ] **Auth Service** → Verify JWT token generation

### Phase 2: User Services (Minutes 5-10)
1. [ ] **User Service** → Test user registration and login
2. [ ] **Listing Service** → Verify product listing creation
3. [ ] **Payment Service** → Test payment intent creation (mock mode)
4. [ ] **Search Service** → Confirm search functionality

### Phase 3: Frontend Applications (Minutes 10-15)
1. [ ] **Main Web App** → Load homepage and test navigation
2. [ ] **Admin Dashboard** → Access admin panel and verify permissions
3. [ ] **Control Center** → Test system monitoring and controls
4. [ ] **Seller Dashboard** → Verify seller account functionality
5. [ ] **Traveler Dashboard** → Test traveler trip management

### Phase 4: Advanced Features (Minutes 15-20)
1. [ ] **Real-time Chat** → Test WebSocket connections
2. **Auction System** → Verify auction creation and bidding
3. **Live Streaming** → Test RTMP/HLS streaming (if configured)
4. **Plugin System** → Verify plugin marketplace access

## 🧪 TESTING PROCEDURES

### Authentication Flow Test
```bash
# Test user registration
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User","userType":"buyer"}'

# Test user login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

**Expected**: JWT token returned successfully

### Dashboard Access Test
```bash
# Test each dashboard URL
curl -s http://localhost:3000/ | grep -q "Mnbara" && echo "✅ Homepage OK"
curl -s http://localhost:3001/admin | grep -q "Admin" && echo "✅ Admin OK"
curl -s http://localhost:3002/control-center | grep -q "Control" && echo "✅ Control Center OK"
```

### Database Transaction Test
```bash
# Test basic CRUD operations
curl -X POST http://localhost:8080/api/v1/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Test Item","description":"Test description","price":99.99,"currency":"USD"}'
```

### Payment Flow Test (Mock)
```bash
# Test payment intent creation
curl -X POST http://localhost:8080/api/v1/payments/intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount":99.99,"currency":"USD","paymentMethod":"stripe"}'
```

### Real-time Features Test
```bash
# Test WebSocket connection (using wscat)
npm install -g wscat
wscat -c ws://localhost:8080/ws/chat

# Test notification service
curl -X POST http://localhost:8080/api/v1/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔍 VERIFICATION CHECKLIST

### User Management
- [ ] User registration works with email verification
- [ ] User login returns valid JWT token
- [ ] Password reset flow is functional
- [ ] User profile updates successfully
- [ ] Multi-factor authentication available (if configured)

### Marketplace Features
- [ ] Product listings can be created and viewed
- [ ] Search functionality returns relevant results
- [ ] Category navigation works properly
- [ ] Product images upload and display correctly
- [ ] User ratings and reviews system functional

### Payment & Escrow
- [ ] Payment intents can be created (mock mode)
- [ ] Escrow system processes transactions
- [ ] Fee calculations are accurate
- [ ] Refund process works correctly
- [ ] Transaction history is accessible

### Communication
- [ ] Real-time chat between users
- [ ] Email notifications are sent
- [ ] Push notifications work (mobile)
- [ ] System alerts are functional
- [ ] Message delivery is reliable

### Admin & Control
- [ ] Admin can manage users and listings
- [ ] Control center shows system metrics
- [ ] Dispute resolution system works
- [ ] Analytics dashboard displays data
- [ ] System logs are accessible

## 🚨 CRITICAL ISSUES CHECK

### Blockers (Stop Activation)
- [ ] **Database Connection Failed** → Cannot proceed
- [ ] **API Gateway Down** → System inaccessible
- [ ] **Authentication Broken** → Users cannot login
- [ ] **Payment System Error** → Transactions fail
- [ ] **Frontend Not Loading** → User interface broken

### Warnings (Proceed with Caution)
- [ ] **Slow Response Times** > 2 seconds
- [ ] **High Memory Usage** > 80%
- [ ] **Database Connection Pool Exhausted**
- [ ] **Redis Cache Misses** > 50%
- [ ] **Error Rate** > 5%

## ✅ FINAL VERIFICATION

### System-Wide Health Check
```bash
# Run comprehensive health check
npm run health:full

# Check all service logs
docker-compose logs --tail=50

# Verify database connectivity
npm run test:db-connection

# Run smoke tests
npm run test:smoke
```

### Performance Baseline
- [ ] Homepage loads in < 1 second
- [ ] API responses in < 500ms
- [ ] Database queries in < 100ms
- [ ] Search results in < 2 seconds
- [ ] Payment processing in < 5 seconds

### Security Verification
- [ ] HTTPS enabled (production)
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] CSRF tokens validated

## 📋 SIGN-OFF

**Activation Completed By:** _______________________  
**Date:** _______________________  
**Time:** _______________________  

**System Status:** ☐ Healthy ☐ Degraded ☐ Failed  
**Ready for Users:** ☐ Yes ☐ No  

**Notes:**
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________

**Next Steps:**
- Monitor system for 24 hours
- Review performance metrics
- Address any warnings
- Plan production deployment

---

**Emergency Contacts:**
- Technical: tech@mnbara.com
- Support: support@mnbara.com
- On-call: +1-555-TECH-HELP