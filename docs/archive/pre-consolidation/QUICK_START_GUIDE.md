# Quick Start Guide - Mnbara Platform

**Date**: February 1, 2026  
**Status**: ✅ Ready to Execute  
**Goal**: Get started immediately with Sprint 0.1

---

## 🎯 What You Need to Know

### Current Status
- **Platform**: 40% complete (strong foundation, needs financial integration)
- **What Works**: Auth, Listings, Auctions, P2P Exchange, Disputes, KYC, Trust & Safety
- **What's Missing**: Real money custody, bank integration, licensed escrow, real FX

### The Plan
- **Strategy**: Fast-Track Launch using Stripe Connect + Escrow Kenya + OpenExchangeRates
- **Timeline**: 4-6 weeks to MVP launch
- **Budget**: $25K-$50K (vs $335K-$665K for full licensing)
- **Risk**: Low (proven providers)

---

## 🚀 Sprint 0.1: Local Environment Setup (2 Days)

### Prerequisites
- Node.js 18+ installed
- Docker Desktop installed
- Git installed
- Code editor (VS Code recommended)

### Step 1: Clone and Install (30 minutes)

```bash
# Navigate to project directory
cd E:\New computer\Development Coding\Projects\Repos\geo\mnbara-platform

# Install dependencies
npm install

# Verify installation
npm list --depth=0
```

**Expected Output**: List of all dependencies without errors

---

### Step 2: Start Databases (15 minutes)

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Verify databases are running
docker ps

# You should see:
# - postgres:15 (port 5432)
# - redis:7 (port 6379)
```

**Troubleshooting**:
- If port 5432 is busy: `docker-compose down` then try again
- If Docker not running: Start Docker Desktop first

---

### Step 3: Run Migrations (20 minutes)

```bash
# Run migrations for all services
npm run migrate:all

# Or run individually:
cd backend/services/auction-service
npx prisma migrate deploy

cd ../listing-service
npx prisma migrate deploy

cd ../internal-ledger-service
npx prisma migrate deploy

# ... repeat for other services
```

**Expected Output**: "Migration applied successfully" for each service

---

### Step 4: Start Services (30 minutes)

```bash
# Option 1: Start all services with Docker Compose
docker-compose up

# Option 2: Start services individually (for development)
# Terminal 1: API Gateway
cd backend/services/api-gateway
npm run dev

# Terminal 2: Auth Service
cd backend/services/auth-service
npm run dev

# Terminal 3: Listing Service
cd backend/services/listing-service
npm run dev

# Terminal 4: Auction Service
cd backend/services/auction-service
npm run dev

# Terminal 5: Frontend
cd frontend/web-app
npm run dev
```

**Expected Output**:
- API Gateway: `Server running on port 3000`
- Auth Service: `Server running on port 3001`
- Listing Service: `Server running on port 3002`
- Auction Service: `Server running on port 3003`
- Frontend: `Local: http://localhost:5173`

---

### Step 5: Verify Everything Works (15 minutes)

#### Test 1: Check API Gateway
```bash
curl http://localhost:3000/health
# Expected: {"status":"ok"}
```

#### Test 2: Check Auth Service
```bash
curl http://localhost:3001/health
# Expected: {"status":"ok"}
```

#### Test 3: Check Frontend
Open browser: `http://localhost:5173`
- You should see the Mnbara homepage
- Try navigating to different pages
- Check console for errors (should be none)

#### Test 4: Check Database Connection
```bash
# Connect to PostgreSQL
docker exec -it mnbara-postgres psql -U postgres

# List databases
\l

# You should see:
# - auction_service_db
# - listing_service_db
# - internal_ledger_db
# - etc.

# Exit
\q
```

---

### Step 6: Run Tests (30 minutes)

```bash
# Run all tests
npm test

# Or run tests for specific services:
cd backend/services/auction-service
npm test

cd ../listing-service
npm test

cd ../internal-ledger-service
npm test

# Frontend tests
cd frontend/web-app
npm test
```

**Expected Output**: All tests should pass (green)

---

## ✅ Success Criteria

After completing Sprint 0.1, you should have:

- [x] All dependencies installed
- [x] PostgreSQL and Redis running
- [x] All migrations applied
- [x] All services running locally
- [x] Frontend accessible at http://localhost:5173
- [x] No errors in console
- [x] All tests passing

---

## 🎯 Next Steps (Sprint 0.2)

Once Sprint 0.1 is complete, move to Sprint 0.2:

### Tasks:
1. Setup GitHub Repository
2. Create GitHub Actions Workflows
3. Setup AWS Account
4. Configure CI/CD Pipeline

### Files to Create:
```
.github/workflows/ci.yml
.github/workflows/deploy-staging.yml
.github/workflows/deploy-production.yml
```

---

## 📋 Checklist for Today

### Morning (2-3 hours)
- [ ] Install dependencies
- [ ] Start databases
- [ ] Run migrations
- [ ] Start services

### Afternoon (2-3 hours)
- [ ] Verify everything works
- [ ] Run tests
- [ ] Fix any issues
- [ ] Document any problems

---

## 🆘 Troubleshooting

### Problem: Port already in use
**Solution**:
```bash
# Find process using port
netstat -ano | findstr :5432

# Kill process (Windows)
taskkill /PID <process_id> /F

# Or change port in docker-compose.yml
```

### Problem: Database connection failed
**Solution**:
```bash
# Check if PostgreSQL is running
docker ps | findstr postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker logs mnbara-postgres
```

### Problem: Migration failed
**Solution**:
```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres redis

# Wait 10 seconds for PostgreSQL to start
timeout /t 10

# Run migrations again
npm run migrate:all
```

### Problem: Tests failing
**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear test cache
npm test -- --clearCache

# Run tests again
npm test
```

---

## 📞 Getting Help

### Documentation
- `SPRINT_EXECUTION_PLAN.md` - Full execution plan
- `MVP_LAUNCH_ROADMAP.md` - MVP roadmap
- `FAST_TRACK_LAUNCH_STRATEGY.md` - Fast-track strategy
- `Mnbarh_BUILD_MAP.md` - Complete build map

### Service READMEs
- `backend/services/auction-service/README.md`
- `backend/services/listing-service/README.md`
- `backend/services/internal-ledger-service/README.md`
- `backend/services/decision-authority-service/README.md`

---

## 💡 Pro Tips

1. **Use Docker Compose for simplicity**
   - Easier to manage all services
   - Consistent environment
   - Less terminal windows

2. **Keep logs visible**
   - Use `docker-compose logs -f` to see all logs
   - Or `docker-compose logs -f <service-name>` for specific service

3. **Use VS Code**
   - Install Docker extension
   - Install Prisma extension
   - Install ESLint extension

4. **Test frequently**
   - Run tests after each change
   - Catch issues early
   - Maintain high quality

---

## 📊 Time Estimate

| Task | Time | Difficulty |
|------|------|------------|
| Install dependencies | 30 min | Easy |
| Start databases | 15 min | Easy |
| Run migrations | 20 min | Medium |
| Start services | 30 min | Medium |
| Verify everything | 15 min | Easy |
| Run tests | 30 min | Medium |
| **TOTAL** | **~2.5 hours** | **Medium** |

---

## 🎉 Completion

Once you complete Sprint 0.1, you'll have:
- ✅ Fully functional local development environment
- ✅ All services running
- ✅ All tests passing
- ✅ Ready to start Sprint 0.2 (CI/CD setup)

---

**Status**: ✅ Ready to Start  
**Date**: February 1, 2026  
**Next**: Sprint 0.2 - CI/CD Setup

---

## 🚀 Let's Get Started!

```bash
# Start here:
cd E:\New computer\Development Coding\Projects\Repos\geo\mnbara-platform
npm install
docker-compose up -d postgres redis
npm run migrate:all
docker-compose up
```

**Good luck! 🎯**
