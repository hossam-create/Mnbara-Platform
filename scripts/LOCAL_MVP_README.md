# 🔒 Local MVP Validation Scripts

This directory contains scripts for Phase 2.5 - Local MVP Validation.

**Purpose:** Test the complete Mnbara platform locally before any production deployment.

**Mode:** CTO Internal Testing
**Environment:** Local only (localhost)
**Payment:** Stripe TEST mode only
**Data:** Mock test data only

---

## 📁 Files

### Docker Compose
- **`../docker-compose.local-mvp.yml`** - Minimal MVP services for local testing

### Scripts
- **`local-mvp-start.bat`** - Automated startup script (Windows)
- **`local-mvp-seed-test-data.js`** - Creates 15 test users and sample data
- **`test-local-mvp.js`** - Runs end-to-end test scenarios

### Documentation
- **`../LOCAL_MVP_VALIDATION_PLAN.md`** - Complete validation plan
- **`../PHASE_2_6_VALIDATION_REPORT_TEMPLATE.md`** - Report template
- **`../FINAL_LOCAL_MVP_LOCK_REPORT.md`** - Implementation summary

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd scripts
npm install
```

### 2. Start Services
```bash
# Windows
local-mvp-start.bat

# Or manually
cd ..
docker-compose -f docker-compose.local-mvp.yml up -d
```

### 3. Wait for Services
Wait 60 seconds for all services to be healthy.

### 4. Run Migrations
```bash
cd ../backend/services/auth-service && npx prisma migrate deploy
cd ../backend/services/user-service && npx prisma migrate deploy
cd ../backend/services/wallet-service && npx prisma migrate deploy
cd ../backend/services/payment-service && npx prisma migrate deploy
cd ../backend/services/escrow-service && npx prisma migrate deploy
cd ../backend/services/orders-service && npx prisma migrate deploy
cd ../backend/services/trips-service && npx prisma migrate deploy
cd ../backend/services/matching-service && npx prisma migrate deploy
cd ../backend/services/notification-service && npx prisma migrate deploy
cd ../backend/services/subscription-service && npx prisma migrate deploy
```

### 5. Seed Test Data
```bash
cd scripts
npm run seed
```

### 6. Run Tests
```bash
npm test
```

---

## 📊 Test Data Created

### Users (15 total)
- **5 Buyers:** buyer1-5@test.local (50,000 EGP each)
- **5 Sellers:** seller1-5@test.local (10,000 EGP each, subscriptions active)
- **5 Travelers:** traveler1-5@test.local (5,000 EGP each)

### Products (5)
- iPhone 15 Pro (1,200 EGP)
- Nike Air Max (150 EGP)
- Sony Headphones (300 EGP)
- Gucci Bag (2,000 EGP)
- MacBook Pro (2,500 EGP)

### Trips (5)
- New York → Cairo (March 1)
- London → Cairo (March 5)
- Dubai → Cairo (March 10)
- Paris → Cairo (March 15)
- Istanbul → Cairo (March 20)

### Test Credentials
- **Email:** buyer1@test.local (or seller1@test.local, traveler1@test.local)
- **Password:** Test123!@#

---

## 🧪 Test Scenarios

### Scenario 1: Happy Path ✅
Complete order flow from buyer request to funds release.

**Steps:**
1. Buyer logs in
2. Seller logs in
3. Buyer checks wallet balance
4. Buyer creates order
5. Funds held in escrow
6. Delivery confirmed
7. Funds released to seller
8. Seller balance updated

**Expected:** All steps pass, response times < 500ms

---

### Scenario 2: Dispute Path ⚠️
Order with dispute resolution.

**Steps:**
1. Order created and funds held
2. Buyer reports issue
3. Dispute initiated
4. Admin reviews
5. Decision made
6. Funds released or refunded

**Status:** Partial implementation (dispute flow TODO)

---

### Scenario 3: Cancellation Path ⚠️
Order cancellation and refund.

**Steps:**
1. Order created
2. Seller cancels
3. Funds refunded
4. Order status updated

**Status:** Partial implementation (cancellation flow TODO)

---

## 📊 Service URLs

### Backend Services
- Auth: http://localhost:3001
- User: http://localhost:3002
- Payment: http://localhost:3003
- Product: http://localhost:3004
- Wallet: http://localhost:3005
- Orders: http://localhost:3006
- Escrow: http://localhost:3007
- Trips: http://localhost:3009
- Matching: http://localhost:3010
- Notification: http://localhost:3011
- Subscription: http://localhost:3012

### Infrastructure
- PostgreSQL: localhost:5432 (user: mnbarh_local, pass: local_test_password)
- Redis: localhost:6379
- RabbitMQ: http://localhost:15672 (user: mnbarh_local, pass: local_test_password)

### Frontend
- Web App: http://localhost:5173

---

## 🔧 Troubleshooting

### Services Not Starting
```bash
# Check Docker
docker ps

# Check logs
cd ..
docker-compose -f docker-compose.local-mvp.yml logs -f [service-name]

# Restart service
docker-compose -f docker-compose.local-mvp.yml restart [service-name]
```

### Database Issues
```bash
# Connect to PostgreSQL
docker exec -it mnbarh-postgres-local psql -U mnbarh_local -d mnbarh_local

# List databases
\l

# Connect to specific database
\c auth_db
```

### Port Conflicts
Stop conflicting services or modify ports in `docker-compose.local-mvp.yml`.

### Clean Start
```bash
cd ..
docker-compose -f docker-compose.local-mvp.yml down -v
docker-compose -f docker-compose.local-mvp.yml up -d
```

---

## 📝 Validation Report

After running tests, copy the template and fill in results:

```bash
cp ../PHASE_2_6_VALIDATION_REPORT_TEMPLATE.md ../PHASE_2_6_VALIDATION_REPORT.md
```

Fill in:
- ✅ What works perfectly
- ❌ What breaks
- 📊 Performance data
- 🗄️ Database integrity
- 🔗 Service communication
- 🚀 Recommendations

---

## ✅ Success Criteria

### Must Pass
- [ ] All 15 test users created
- [ ] All services running
- [ ] Happy path works end-to-end
- [ ] Wallet operations work
- [ ] Escrow state machine works
- [ ] Notifications delivered
- [ ] No data corruption
- [ ] Response times < 500ms

### Nice to Have
- [ ] Dispute flow works
- [ ] Cancellation flow works
- [ ] Edge cases handled

---

## 🚫 Important Reminders

- ❌ NO PRODUCTION DATA
- ❌ NO REAL STRIPE KEYS
- ❌ NO CLOUD DEPLOYMENT
- ❌ NO PUBLIC ACCESS
- ✅ LOCAL TESTING ONLY
- ✅ TEST MODE ONLY

---

## 📚 Related Documentation

- `../LOCAL_MVP_VALIDATION_PLAN.md` - Complete validation plan
- `../FINAL_LOCAL_MVP_LOCK_REPORT.md` - Implementation summary
- `../COMPREHENSIVE_100_PERCENT_COMPLETION.md` - Overall project status
- `../POST_MVP_COMPLETE_SUMMARY.md` - Recent work summary

---

**🔒 TEST MODE ONLY - NO PRODUCTION**

