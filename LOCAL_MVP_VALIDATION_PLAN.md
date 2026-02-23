# 🔒 LOCAL MVP VALIDATION - Phase 2.5

**Date:** February 19, 2026
**Status:** PRE-PRODUCTION LOCK
**Goal:** 100% Working Local System Before Any External Launch

---

## 🎯 Objective

Validate the ENTIRE system works perfectly on localhost with:
- 5 Buyers
- 5 Sellers (with active subscriptions)
- 5 Travelers
- Complete end-to-end flows
- Test payments only (Stripe sandbox/mock wallet)

**NO PRODUCTION. NO REAL STRIPE. NO PUBLIC DEPLOYMENT.**

---

## 📋 Phase 2.5 Checklist

### Infrastructure Setup
- [ ] All databases running locally (PostgreSQL)
- [ ] RabbitMQ running locally
- [ ] Redis running locally (if needed)
- [ ] All services running on localhost
- [ ] Frontend running on localhost

### Test Data Setup
- [ ] 5 Buyer accounts created
- [ ] 5 Seller accounts created with active subscriptions
- [ ] 5 Traveler accounts created
- [ ] Test products listed
- [ ] Test trips created

### Payment Configuration
- [ ] Stripe in TEST mode only
- [ ] Mock wallet with test balances
- [ ] No real payment processing
- [ ] Test API keys only

### Flow Validation
- [ ] User registration and login
- [ ] Seller subscription activation
- [ ] Product listing creation
- [ ] Trip creation by traveler
- [ ] Buyer request → Seller accept → Traveler match
- [ ] Order creation
- [ ] Wallet hold
- [ ] Order status updates
- [ ] Escrow release/refund
- [ ] Notifications sent

---

## 🧪 Test Scenarios

### Scenario 1: Happy Path
1. Buyer registers and logs in
2. Seller registers, subscribes, lists product
3. Traveler registers, creates trip
4. Buyer requests product
5. System matches with traveler
6. Order created, wallet holds funds
7. Traveler delivers
8. Buyer confirms
9. Funds released to seller
10. All notifications sent

### Scenario 2: Dispute Path
1. Order created and funds held
2. Buyer reports issue
3. Dispute initiated
4. Admin/arbitrator reviews
5. Decision made
6. Funds released or refunded

### Scenario 3: Cancellation Path
1. Order created
2. Seller cancels before acceptance
3. Funds refunded to buyer
4. Order status updated

---

## 📊 Validation Metrics

### Performance Targets (Local)
- API response time: < 500ms
- Database queries: < 100ms
- Page load time: < 2s
- Wallet operations: < 1s

### Data Integrity
- No orphaned records
- All foreign keys valid
- Transaction consistency
- Audit trail complete

### Service Communication
- All services reachable
- No timeout errors
- Proper error handling
- Retry logic working

---

## 🚫 What NOT to Do

- ❌ Do NOT use real Stripe keys
- ❌ Do NOT deploy to cloud
- ❌ Do NOT use production databases
- ❌ Do NOT invite real users
- ❌ Do NOT process real payments
- ❌ Do NOT scale infrastructure

---

## ✅ What TO Do

- ✅ Use localhost only
- ✅ Use Stripe test mode
- ✅ Use mock data
- ✅ Test all flows manually
- ✅ Document all issues
- ✅ Measure response times
- ✅ Verify database integrity

---

## 📝 Test Execution Plan

### Day 1: Infrastructure Setup
- Start all services locally
- Verify connectivity
- Run health checks
- Seed test data

### Day 2: Flow Testing
- Execute all test scenarios
- Document results
- Identify issues
- Measure performance

### Day 3: Issue Resolution
- Fix critical bugs
- Re-test failed scenarios
- Verify fixes
- Final validation

---

## 📈 Success Criteria

### Must Pass:
- [ ] All 15 test users created successfully
- [ ] All services running without crashes
- [ ] Complete happy path works end-to-end
- [ ] Wallet operations work correctly
- [ ] Escrow state machine works
- [ ] Notifications delivered
- [ ] No data corruption
- [ ] Response times acceptable

### Nice to Have:
- [ ] Dispute flow works
- [ ] Cancellation flow works
- [ ] Edge cases handled
- [ ] Error messages clear

---

## 🔍 Phase 2.6: System Map Report

After testing, we will generate a report with:

### What Works Perfectly ✅
- List all working features
- Performance metrics
- Success rates

### What Breaks ❌
- List all failures
- Error messages
- Reproduction steps

### Performance Data 📊
- Response times per endpoint
- Database query times
- Service communication latency

### Database Integrity 🗄️
- Record counts
- Orphaned records
- Constraint violations

### Service Communication 🔗
- Service-to-service calls
- Timeout issues
- Retry attempts

---

## 🎯 Next Steps After Validation

**IF ALL TESTS PASS:**
- Lock MVP as "Local Production Ready"
- Document final state
- Prepare for controlled beta

**IF TESTS FAIL:**
- Fix critical issues
- Re-run validation
- Do NOT proceed until 100% pass

---

## 🛠️ Implementation Files Created

### Docker Compose
- **File:** `docker-compose.local-mvp.yml`
- **Purpose:** Minimal MVP services for local testing
- **Services:** PostgreSQL, Redis, RabbitMQ + 12 core services
- **Usage:** `docker-compose -f docker-compose.local-mvp.yml up -d`

### Test Data Seeding
- **File:** `scripts/local-mvp-seed-test-data.js`
- **Purpose:** Creates 15 test users (5 buyers, 5 sellers, 5 travelers)
- **Features:** 
  - Creates wallets with test balances
  - Activates seller subscriptions
  - Lists 5 test products
  - Creates 5 test trips
- **Usage:** `node scripts/local-mvp-seed-test-data.js`

### Startup Script
- **File:** `scripts/local-mvp-start.bat` (Windows)
- **Purpose:** Automated startup of all services
- **Features:**
  - Checks Docker status
  - Starts infrastructure first
  - Waits for health checks
  - Starts all services
  - Displays service URLs
- **Usage:** `scripts\local-mvp-start.bat`

### Test Execution
- **File:** `scripts/test-local-mvp.js`
- **Purpose:** Runs end-to-end test scenarios
- **Scenarios:**
  1. Happy Path (complete order flow)
  2. Dispute Path (order with dispute)
  3. Cancellation Path (order cancellation)
- **Features:**
  - Performance metrics
  - Colored output
  - Detailed results
- **Usage:** `node scripts/test-local-mvp.js`

### Validation Report
- **File:** `PHASE_2_6_VALIDATION_REPORT_TEMPLATE.md`
- **Purpose:** Template for documenting test results
- **Sections:**
  - What works perfectly
  - What breaks
  - Performance data
  - Database integrity
  - Service communication
  - Recommendations

---

## 📋 Quick Start Guide

### Step 1: Start Infrastructure
```bash
# Windows
scripts\local-mvp-start.bat

# Or manually
docker-compose -f docker-compose.local-mvp.yml up -d
```

### Step 2: Wait for Services
Wait 60 seconds for all services to be healthy.

### Step 3: Run Migrations
```bash
cd backend/services/auth-service && npx prisma migrate deploy
cd backend/services/user-service && npx prisma migrate deploy
cd backend/services/wallet-service && npx prisma migrate deploy
cd backend/services/payment-service && npx prisma migrate deploy
cd backend/services/escrow-service && npx prisma migrate deploy
cd backend/services/orders-service && npx prisma migrate deploy
cd backend/services/trips-service && npx prisma migrate deploy
cd backend/services/matching-service && npx prisma migrate deploy
cd backend/services/notification-service && npx prisma migrate deploy
cd backend/services/subscription-service && npx prisma migrate deploy
```

### Step 4: Seed Test Data
```bash
npm install axios  # If not already installed
node scripts/local-mvp-seed-test-data.js
```

### Step 5: Run Tests
```bash
npm install chalk  # If not already installed
node scripts/test-local-mvp.js
```

### Step 6: Fill Validation Report
Copy `PHASE_2_6_VALIDATION_REPORT_TEMPLATE.md` to `PHASE_2_6_VALIDATION_REPORT.md` and fill in results.

---

## 🔧 Troubleshooting

### Services Not Starting
```bash
# Check Docker status
docker ps

# Check service logs
docker-compose -f docker-compose.local-mvp.yml logs -f [service-name]

# Restart specific service
docker-compose -f docker-compose.local-mvp.yml restart [service-name]
```

### Database Connection Issues
```bash
# Check PostgreSQL
docker exec -it mnbarh-postgres-local psql -U mnbarh_local -d mnbarh_local

# List databases
\l

# Connect to specific database
\c auth_db
```

### Port Conflicts
If ports are already in use, stop conflicting services or modify ports in `docker-compose.local-mvp.yml`.

### Clean Start
```bash
# Stop all services
docker-compose -f docker-compose.local-mvp.yml down

# Remove volumes (WARNING: Deletes all data)
docker-compose -f docker-compose.local-mvp.yml down -v

# Start fresh
docker-compose -f docker-compose.local-mvp.yml up -d
```

---

**Status:** READY TO BEGIN LOCAL VALIDATION
**Mode:** CTO Internal Testing
**Goal:** 100% Working Local System
