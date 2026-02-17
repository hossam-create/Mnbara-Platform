# 🎯 MNBARA PLATFORM — COMPREHENSIVE FIX TASKS

**Date:** 2026-02-17  
**Status:** Post-Refactoring Phase 1 Complete  
**Sources:** REFACTORING_HANDOVER.md + DEEP_CODE_ANALYSIS.md

---

## 🔴 CRITICAL PRIORITY (Must Fix Immediately)

### TASK-001: Replace In-Memory Storage with Database Persistence
**Severity:** CRITICAL  
**Services Affected:** wallet-service, payment-service, product-service, subscription-service

**Problem:**
- `wallet-service/src/app.ts` uses `const wallets: Record<string, Wallet> = {}` (in-memory)
- `payment-service/src/app.ts` uses `const wallets: Record<string, Wallet> = {}` (in-memory)
- `product-service/src/app.ts` uses `const products: Product[] = []` (in-memory)
- `subscription-service` has no database schema at all
- All data is lost on restart

**Action Required:**
1. **wallet-service**: Wire `app.ts` to use existing `wallet.service.ts` (Prisma-backed)
2. **payment-service**: Wire `app.ts` to use existing payment services with Prisma
3. **product-service**: Wire `app.ts` to use existing `product.service.ts` (Prisma-backed)
4. **subscription-service**: Create `prisma/schema.prisma` and implement persistence
5. Run `npx prisma migrate dev` for each service
6. Test that data persists across restarts

**Files to Modify:**
- `backend/services/wallet-service/src/app.ts`
- `backend/services/payment-service/src/app.ts`
- `backend/services/product-service/src/app.ts`
- `backend/services/subscription-service/prisma/schema.prisma` (CREATE)
- `backend/services/subscription-service/src/services/subscription.service.ts` (CREATE)

---

### TASK-002: Remove Hardcoded Secrets from Version Control
**Severity:** CRITICAL  
**Security Risk:** HIGH

**Problem:**
- `.env` files with real secrets are committed to repo
- JWT secrets are plain-English sentences, not cryptographic keys
- Database passwords are default/weak values

**Action Required:**
1. Add all `.env` files to `.gitignore` (if not already)
2. Remove committed `.env` files from git history:
   ```bash
   git rm --cached .env
   git rm --cached backend/services/*/.env
   git commit -m "Remove committed secrets"
   ```
3. Create `.env.example` templates with placeholder values
4. Generate strong secrets:
   ```bash
   # Generate 256-bit JWT secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
5. Document secret generation in README
6. Update deployment docs to use environment-specific secrets

**Files to Modify:**
- `.gitignore` (add `.env`)
- `.env.example` (create with placeholders)
- `backend/services/auth-service/.env.example`
- `backend/services/*//.env.example` (all services)
- `README.md` (add secret generation instructions)

---

### TASK-003: Fix Port Number Conflicts
**Severity:** CRITICAL  
**Services Affected:** All services

**Problem:**
- `settlement-service` and `subscription-service` both use port 3016
- `notification-service` has TWO entry files on different ports (3013 vs 3004)
- `auth-service` has 3 different port configs (3001, 3014, varies)
- `product-service` has 2 entry files on different ports (3006, 3004)
- `api-gateway` defaults to 10000 but .env says 8080

**Canonical Port Map (from docker-compose.yml):**
```
api-gateway:           3000
auth-service:          3001
user-service:          3002
payment-service:       3003
orders-service:        3004
wallet-service:        3005
product-service:       3006
escrow-service:        3007
notification-service:  3008
matching-service:      3009
trips-service:         3010
settlement-service:    3011
subscription-service:  3012
admin-service:         3013
cart-service:          3014
feature-management:    3015
country-layer:         3016
```

**Action Required:**
1. Update each service's entry file to use correct port from map
2. Remove all hardcoded fallback ports
3. Enforce `process.env.PORT` with no fallback (fail fast if missing)
4. Update all `.env.example` files with correct ports
5. Update `docker-compose.yml` to match (already done in Phase 1)
6. Update frontend API client base URL to match gateway port

**Files to Modify:**
- `backend/services/*/src/index.ts` (or app.ts, main.ts - see TASK-004)
- `backend/services/*/.env.example`
- `frontend/web-app/src/services/api/client.ts`
- `frontend/web-app/vite.config.ts` (proxy config)

---

### TASK-004: Consolidate Multiple Entry Points Per Service
**Severity:** HIGH  
**Services Affected:** payment-service, wallet-service, product-service, notification-service, auth-service

**Problem:**
- **payment-service**: Has `app.ts`, `main.ts`, AND `index.ts` (3 entry files!)
- **wallet-service**: Has `app.ts` (in-memory) AND `index.ts` (Prisma-backed)
- **product-service**: Has `app.ts`, `index.ts`, AND `server.ts`
- **notification-service**: Has `index.ts` (TypeScript) AND `index.js` (JavaScript)
- **auth-service**: Has `index.ts` AND `simple-auth.ts`

**Action Required:**
1. Choose ONE entry file per service (recommend `index.ts`)
2. Delete or archive alternative entry files
3. Update `package.json` scripts to point to chosen entry file
4. Update `Dockerfile` CMD to point to chosen entry file
5. Update `docker-compose.yml` command to point to chosen entry file
6. Ensure chosen entry file uses Prisma (not in-memory storage)

**Decision Matrix:**
| Service | Keep | Delete | Reason |
|---------|------|--------|--------|
| payment-service | `index.ts` | `app.ts`, `main.ts` | index.ts likely uses proper services |
| wallet-service | `index.ts` | `app.ts` | index.ts uses Prisma, app.ts is in-memory |
| product-service | `index.ts` | `app.ts`, `server.ts` | index.ts likely uses proper services |
| notification-service | `index.ts` | `index.js` | Keep TypeScript, delete JavaScript |
| auth-service | `index.ts` | `simple-auth.ts` | simple-auth is stripped-down test version |

**Files to Modify:**
- `backend/services/payment-service/package.json`
- `backend/services/payment-service/Dockerfile`
- `backend/services/wallet-service/package.json`
- `backend/services/wallet-service/Dockerfile`
- (repeat for each service)

**Files to DELETE:**
- `backend/services/payment-service/src/app.ts`
- `backend/services/payment-service/src/main.ts`
- `backend/services/wallet-service/src/app.ts`
- `backend/services/product-service/src/app.ts`
- `backend/services/product-service/src/server.ts`
- `backend/services/notification-service/src/index.js`
- `backend/services/auth-service/src/simple-auth.ts`

---

### TASK-005: Fix CORS Wildcard Configuration
**Severity:** HIGH  
**Security Risk:** HIGH

**Problem:**
- 5 services use `cors({ origin: '*' })` — accept requests from ANY website
- NestJS services use `app.enableCors()` with no config — also allows all origins
- Financial services (wallet, payment, escrow) are wide open

**Action Required:**
1. Define allowed origins in environment variables:
   ```
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://mnbara.com
   ```
2. Update CORS config in each service:
   ```typescript
   app.use(cors({
     origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
     credentials: true
   }));
   ```
3. For NestJS services:
   ```typescript
   app.enableCors({
     origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
     credentials: true
   });
   ```

**Files to Modify:**
- `backend/services/wallet-service/src/index.ts` (after consolidation)
- `backend/services/payment-service/src/index.ts`
- `backend/services/product-service/src/index.ts`
- `backend/services/subscription-service/src/app.ts`
- `backend/services/auth-service/src/index.ts`
- `backend/services/orders-service/src/main.ts`
- `backend/services/trips-service/src/main.ts`
- `backend/services/matching-service/src/main.ts`
- All `.env.example` files (add ALLOWED_ORIGINS)

---

### TASK-006: Fix Missing Dependencies
**Severity:** MEDIUM  
**Services Affected:** wallet-service, payment-service

**Problem:**
- Both services import `compression` but don't list it in `package.json`
- Services will crash on startup if compression isn't a transitive dependency

**Action Required:**
1. Add `compression` to dependencies:
   ```bash
   cd backend/services/wallet-service
   npm install compression
   npm install --save-dev @types/compression
   
   cd ../payment-service
   npm install compression
   npm install --save-dev @types/compression
   ```
2. Verify services start without errors

**Files to Modify:**
- `backend/services/wallet-service/package.json`
- `backend/services/payment-service/package.json`

---

## 🟡 HIGH PRIORITY (Fix Within 1 Week)

### TASK-007: Fix Insecure JWT Verification
**Severity:** HIGH  
**Security Risk:** CRITICAL

**Problem:**
- `product-service/src/app.ts` line 190: `const sellerId = JSON.parse(atob(token.split('.')[1])).id;`
- JWT is decoded without signature verification
- Any client can forge a JWT with any `id` or `role`

**Action Required:**
1. Install `jsonwebtoken` if not already present
2. Replace manual decoding with proper verification:
   ```typescript
   import jwt from 'jsonwebtoken';
   
   const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string, role: string };
   const sellerId = decoded.id;
   ```
3. Add error handling for invalid/expired tokens
4. Search codebase for other instances of `atob(token.split` and fix them

**Files to Modify:**
- `backend/services/product-service/src/index.ts` (after consolidation)
- Search and fix any other services doing manual JWT parsing

---

### TASK-008: Resolve Crowdship Service Routing Issue
**Severity:** HIGH  
**Services Affected:** api-gateway

**Problem:**
- API Gateway has route `/api/crowdship` pointing to `http://crowdship-service:3004`
- `crowdship-service` is NOT in `docker-compose.yml`
- Port 3004 is assigned to `orders-service`

**Action Required:**
1. Determine if crowdship functionality is needed
2. **Option A (Remove):** Delete crowdship route from gateway
3. **Option B (Implement):** 
   - Create crowdship-service
   - Assign new port (e.g., 3017)
   - Add to docker-compose.yml
   - Implement service

**Files to Modify:**
- `backend/services/api-gateway/src/config/routes.config.ts`
- `docker-compose.yml` (if implementing)

---

### TASK-009: Resolve Compliance Service Port Conflict
**Severity:** MEDIUM  
**Services Affected:** api-gateway, wallet-service

**Problem:**
- Gateway has route for `compliance-service` on port 3005
- Port 3005 is assigned to `wallet-service`
- `compliance-service` is missing from docker-compose.yml

**Action Required:**
1. Determine if compliance-service is needed
2. **Option A (Remove):** Delete compliance route from gateway
3. **Option B (Implement):**
   - Create compliance-service
   - Assign new port (e.g., 3018)
   - Add to docker-compose.yml
   - Implement service

**Files to Modify:**
- `backend/services/api-gateway/src/config/routes.config.ts`
- `docker-compose.yml` (if implementing)

---

### TASK-010: Consolidate Duplicate Wallet Logic
**Severity:** HIGH  
**Services Affected:** wallet-service, payment-service

**Problem:**
- Both services implement their own wallet endpoints
- Both initialize test wallets with random balances
- No single source of truth for user balances
- User could have different balances in each service

**Action Required:**
1. Choose wallet-service as single source of truth
2. Remove wallet endpoints from payment-service
3. Make payment-service call wallet-service for balance checks
4. Implement proper inter-service communication (HTTP or message queue)
5. Update payment flows to:
   - Check balance via wallet-service
   - Hold funds via wallet-service
   - Release funds via wallet-service

**Files to Modify:**
- `backend/services/payment-service/src/index.ts` (remove wallet endpoints)
- `backend/services/payment-service/src/services/wallet-client.service.ts` (CREATE)
- `backend/services/wallet-service/src/index.ts` (ensure proper endpoints)

---

### TASK-011: Standardize Framework Choice
**Severity:** MEDIUM  
**Impact:** Long-term maintainability

**Problem:**
- 10 services use raw Express
- 4 services use NestJS
- Inconsistent error handling, middleware, validation patterns

**Action Required:**
1. **Decision:** Choose NestJS as standard (better structure, DI, decorators)
2. Create migration plan for Express services
3. Start with smallest services first
4. Migrate one service per sprint
5. Document migration pattern for team

**Priority Order for Migration:**
1. subscription-service (smallest, newest)
2. cart-service
3. feature-management-service
4. notification-service
5. escrow-service
6. product-service
7. wallet-service
8. payment-service (largest, most complex - do last)

**Note:** This is a long-term task, can be done incrementally

---

### TASK-012: Fix Frontend API Base URL Mismatch
**Severity:** MEDIUM  
**Services Affected:** frontend, api-gateway

**Problem:**
- Frontend client defaults to `localhost:10000/api`
- Vite proxy forwards `/api` to `localhost:8080`
- `.env` says gateway is on 8080
- Gateway code defaults to 10000
- Multi-hop configuration is fragile

**Action Required:**
1. Standardize on port 3000 for api-gateway (already in docker-compose.yml)
2. Update gateway entry file to use port 3000
3. Update frontend client to use port 3000
4. Update Vite proxy to forward to port 3000
5. Update all `.env.example` files

**Files to Modify:**
- `backend/services/api-gateway/src/index.ts`
- `backend/services/api-gateway/.env.example`
- `frontend/web-app/src/services/api/client.ts`
- `frontend/web-app/vite.config.ts`
- `frontend/web-app/.env.example`

---

## 🟢 MEDIUM PRIORITY (Fix Within 2 Weeks)

### TASK-013: Remove Deprecated @types/axios
**Severity:** LOW  
**Services Affected:** orders-service

**Problem:**
- `orders-service/package.json` includes `@types/axios@^0.14.0`
- Axios ships its own types since v0.18
- Deprecated package could cause type conflicts

**Action Required:**
```bash
cd backend/services/orders-service
npm uninstall @types/axios
```

**Files to Modify:**
- `backend/services/orders-service/package.json`

---

### TASK-014: Standardize Node Version Requirements
**Severity:** LOW  
**Services Affected:** All services

**Problem:**
- `orders-service` pins to exact `22.20.0`
- Some services use `>=18.0.0`
- Most services have no engine specified

**Action Required:**
1. Choose standard Node version (recommend `>=20.0.0`)
2. Add to all `package.json` files:
   ```json
   "engines": {
     "node": ">=20.0.0",
     "npm": ">=10.0.0"
   }
   ```
3. Update `.nvmrc` or `.node-version` in root
4. Update Dockerfiles to use same Node version

**Files to Modify:**
- All `backend/services/*/package.json`
- `.node-version` (root)
- All `Dockerfile` files

---

### TASK-015: Remove Duplicate bcrypt Libraries
**Severity:** LOW  
**Services Affected:** auth-service

**Problem:**
- Auth service has both `bcrypt` (native) and `bcryptjs` (pure JS)
- Redundant, confusing, adds unnecessary weight

**Action Required:**
1. Keep `bcrypt` (faster, native)
2. Remove `bcryptjs`:
   ```bash
   cd backend/services/auth-service
   npm uninstall bcryptjs
   ```
3. Search codebase for `bcryptjs` imports and replace with `bcrypt`

**Files to Modify:**
- `backend/services/auth-service/package.json`
- Any files importing `bcryptjs` (search and replace)

---

### TASK-016: Consolidate Environment Variables
**Severity:** MEDIUM  
**Services Affected:** All services

**Problem:**
- Environment variables scattered across multiple `.env` files
- No single source of truth
- Easy to have mismatched configs

**Action Required:**
1. Create unified `.env.example` in root with all variables
2. Document which services use which variables
3. Create service-specific `.env.example` files that reference root
4. Update docker-compose.yml to load root `.env` file
5. Document environment variable precedence

**Files to CREATE:**
- `.env.example` (root, comprehensive)
- `docs/ENVIRONMENT_VARIABLES.md` (documentation)

**Files to UPDATE:**
- `docker-compose.yml` (env_file references)
- All service `.env.example` files

---

### TASK-017: Add Integration Tests for Gateway Routing
**Severity:** MEDIUM  
**Services Affected:** api-gateway

**Problem:**
- Gateway routing was updated in Phase 1
- No integration tests to verify routes work
- Manual testing needed

**Action Required:**
1. Create integration test suite for gateway
2. Test each route forwards to correct service
3. Test authentication middleware
4. Test rate limiting
5. Test error handling
6. Add to CI/CD pipeline

**Files to CREATE:**
- `backend/services/api-gateway/tests/integration/routing.test.ts`
- `backend/services/api-gateway/tests/integration/auth.test.ts`
- `backend/services/api-gateway/tests/integration/rate-limit.test.ts`

---

### TASK-018: Refactor Payment Service Monolith
**Severity:** MEDIUM  
**Impact:** Long-term architecture

**Problem:**
- Payment service has 79 service files
- Contains AI risk scoring, trust ops, disputes, protection, ratings, delivery verification, abuse detection
- Essentially a monolith disguised as microservice

**Action Required:**
1. Analyze payment-service functionality
2. Identify logical service boundaries:
   - Core payment processing
   - Risk/fraud detection
   - Dispute management
   - Trust/reputation
   - Delivery verification
3. Create extraction plan
4. Extract one domain at a time into separate services
5. Update API gateway routing

**Note:** This is a major refactoring, should be done incrementally over multiple sprints

---

## 📋 VERIFICATION CHECKLIST

After completing critical tasks, verify:

- [ ] All services start without errors
- [ ] All services connect to databases (no in-memory storage)
- [ ] No port conflicts (each service on unique port)
- [ ] No hardcoded secrets in repo
- [ ] CORS properly configured (no wildcards)
- [ ] JWT verification uses signature checking
- [ ] All dependencies installed (no missing imports)
- [ ] Single entry point per service
- [ ] Data persists across service restarts
- [ ] Frontend can communicate with all backend services
- [ ] Health checks pass for all services
- [ ] Integration tests pass

---

## 🚀 EXECUTION PLAN

### Week 1: Critical Fixes
- Days 1-2: TASK-001 (Database persistence)
- Day 3: TASK-002 (Remove secrets)
- Day 4: TASK-003 (Fix ports)
- Day 5: TASK-004 (Consolidate entry points)

### Week 2: Security & Architecture
- Days 1-2: TASK-005 (Fix CORS)
- Day 3: TASK-006 (Missing deps) + TASK-007 (JWT verification)
- Days 4-5: TASK-008, TASK-009 (Service routing issues)

### Week 3: Consolidation
- Days 1-3: TASK-010 (Wallet consolidation)
- Days 4-5: TASK-012 (API URL mismatch) + TASK-016 (Env vars)

### Week 4: Testing & Documentation
- Days 1-2: TASK-017 (Integration tests)
- Days 3-5: Verification checklist + documentation updates

---

## 📊 PROGRESS TRACKING

| Task ID | Status | Assignee | Started | Completed | Notes |
|---------|--------|----------|---------|-----------|-------|
| TASK-001 | 🟢 DONE | Antigravity | 2026-02-17 | 2026-02-17 | Implemented Prisma in subscription-service, verified others |
| TASK-002 | 🔴 TODO | - | - | - | Critical: Remove secrets |
| TASK-003 | 🟡 PARTIAL | - | - | - | Ports mapped in docker-compose, need service updates |
| TASK-004 | 🔴 TODO | - | - | - | Critical: Consolidate entry points |
| TASK-005 | 🔴 TODO | - | - | - | Critical: Fix CORS |
| TASK-006 | 🔴 TODO | - | - | - | Add compression dependency |
| TASK-007 | 🔴 TODO | - | - | - | Critical: JWT verification |
| TASK-008 | 🔴 TODO | - | - | - | Crowdship routing |
| TASK-009 | 🔴 TODO | - | - | - | Compliance routing |
| TASK-010 | 🔴 TODO | - | - | - | Wallet consolidation |
| TASK-011 | 🟡 FUTURE | - | - | - | Framework standardization (long-term) |
| TASK-012 | 🔴 TODO | - | - | - | API URL mismatch |
| TASK-013 | 🟢 TODO | - | - | - | Remove @types/axios |
| TASK-014 | 🟢 TODO | - | - | - | Node version standardization |
| TASK-015 | 🟢 TODO | - | - | - | Remove duplicate bcrypt |
| TASK-016 | 🟢 TODO | - | - | - | Consolidate env vars |
| TASK-017 | 🟢 TODO | - | - | - | Integration tests |
| TASK-018 | 🟡 FUTURE | - | - | - | Payment service refactor (long-term) |

---

**Legend:**
- 🔴 TODO: Not started
- 🟡 PARTIAL: In progress or partially complete
- 🟢 DONE: Completed and verified
- 🟡 FUTURE: Planned for future sprint

---

**END OF COMPREHENSIVE FIX TASKS**
