# 🚀 Quick Start - Phase 2.5 (Updated)

## ✅ Current Status
- ✅ Docker running (v29.1.3)
- ✅ Node.js installed
- ✅ Required packages installed (axios, chalk)
- ✅ Infrastructure running:
  - PostgreSQL (Port 5432) ✅
  - Redis (Port 6379) ✅
  - RabbitMQ (Ports 5672, 15672) ✅

---

## 📝 Next Steps (Updated Method - Faster!)

### 1️⃣ Run Migrations (3 minutes)

```bash
scripts\run-all-migrations.bat
```

This script will automatically run migrations for all services:
- Auth Service
- User Service
- Payment Service
- Product Service
- Wallet Service
- Orders Service
- Escrow Service
- Trips Service
- Matching Service
- Notification Service
- Subscription Service

⏱️ **Expected Time**: 2-3 minutes

---

### 2️⃣ Start Backend Services (60 seconds)

```bash
scripts\start-services-manual.bat
```

This will open 11 separate windows for each service. Wait 60 seconds for all services to start.

⏱️ **Expected Time**: 60 seconds to start

**Note**: Windows will remain open so you can monitor logs for each service.

---

### 3️⃣ Seed Test Data (30 seconds)

```bash
cd scripts
npm run seed
```

This will create:
- 5 buyers (50,000 EGP each)
- 5 sellers (10,000 EGP + active subscription)
- 5 travelers (5,000 EGP each)
- 5 products (iPhone, Nike, Sony, Gucci, MacBook)
- 5 trips (New York, London, Dubai, Paris, Istanbul → Cairo)

⏱️ **Expected Time**: 30 seconds

---

### 4️⃣ Run Tests (3 minutes)

```bash
cd scripts
npm test
```

This will test:
- ✅ Happy Path: Complete order from start to finish
- ✅ Dispute Flow: Dispute and resolution
- ✅ Cancellation Flow: Cancellation and refund

⏱️ **Expected Time**: 3 minutes

---

## 🔐 Test Login Credentials

### Buyer
- Email: `buyer1@test.local` to `buyer5@test.local`
- Password: `Test123!@#`
- Balance: 50,000 EGP

### Seller
- Email: `seller1@test.local` to `seller5@test.local`
- Password: `Test123!@#`
- Balance: 10,000 EGP
- Subscription: Active (Premium)

### Traveler
- Email: `traveler1@test.local` to `traveler5@test.local`
- Password: `Test123!@#`
- Balance: 5,000 EGP

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
- PostgreSQL: `localhost:5432`
  - User: `mnbarh_local`
  - Password: `local_test_password`
- Redis: `localhost:6379`
- RabbitMQ: http://localhost:15672
  - User: `guest`
  - Password: `guest`

### Frontend (Optional)
```bash
cd frontend\web-app
npm run dev
```
- Web App: http://localhost:5173

---

## 🔧 Troubleshooting

### Service Won't Start
1. Check the service's window for errors
2. Verify infrastructure is running:
```bash
docker-compose -f docker-compose.local-mvp.yml ps
```
3. Verify migrations completed successfully
4. Restart the service from its window

### Database Issues
```bash
# Check PostgreSQL connection
docker exec -it mnbarh-postgres-local psql -U mnbarh_local -d auth_db -c "\dt"
```

### Restart Infrastructure
```bash
# Stop
docker-compose -f docker-compose.local-mvp.yml down

# Fresh start
docker-compose -f docker-compose.local-mvp.yml up -d postgres redis rabbitmq
```

### Complete Clean (Warning: Deletes all data!)
```bash
docker-compose -f docker-compose.local-mvp.yml down -v
docker-compose -f docker-compose.local-mvp.yml up -d postgres redis rabbitmq
# Then re-run migrations
scripts\run-all-migrations.bat
```

---

## ⏱️ Expected Time (New Method)

- ✅ Infrastructure: Already running
- Migrations: 3 minutes
- Start Services: 1 minute
- Seed Data: 0.5 minutes
- Tests: 3 minutes

**Total: ~7-8 minutes only!** 🚀

---

## 📝 After Completion

1. Open `PHASE_2_6_VALIDATION_REPORT_TEMPLATE.md`
2. Copy to `PHASE_2_6_VALIDATION_REPORT.md`
3. Fill in test results
4. Document any issues encountered
5. Save the report

---

## 🎯 Test Scenarios

### Happy Path
1. Buyer logs in
2. Requests product
3. Traveler accepts
4. Buyer pays
5. Product delivered
6. Buyer confirms receipt
7. Funds released to seller and traveler

### Dispute Flow
1. Buyer requests product
2. Traveler accepts
3. Payment made
4. Buyer opens dispute
5. Admin resolves dispute
6. Refund processed

### Cancellation Flow
1. Buyer requests product
2. Traveler accepts
3. Payment made
4. Buyer cancels
5. Automatic refund

---

## 🚫 Important Reminders

- ❌ No real data
- ❌ No real Stripe (TEST mode only)
- ❌ No cloud deployment
- ✅ Local testing only
- ✅ All data is fake

---

## 🔄 Difference from Old Method

### Old (20-30 minutes):
- Docker build for all services
- Long wait for building
- package-lock.json issues

### New (7-8 minutes):
- ✅ Direct run without build
- ✅ Separate windows per service
- ✅ Easy log monitoring
- ✅ Much faster!

---

**🔒 Local Test Mode Only - No Production Data**

**🎉 Ready to start? Begin with Step 1!**
