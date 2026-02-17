# 🔍 MNBARA PLATFORM — DEEP CODE-LEVEL ANALYSIS

**Date:** 2026-02-16  
**Scope:** Actual source code, not documentation claims  
**Methodology:** File-by-file review of backend services, frontend app, configurations, schemas, and security posture

---

## ⚠️ CRITICAL FINDINGS (Must Fix Before Production)

### 1. ✅ RESOLVED: Multiple Services Run on In-Memory Storage
**Status:** Fixed
**Details:** Redundant in-memory `app.ts` files were deleted from `wallet-service` and `payment-service`. The remaining `index.ts` entry points correctly use Prisma and Stripe services.

### 2. ✅ RESOLVED: Hardcoded Secrets in `.env` Files
**Status:** Fixed
**Details:** Verified that `.gitignore` correctly excludes all `.env` files. `git ls-files` confirms they are not tracked.

### 3. ✅ RESOLVED: Port Number Chaos
**Status:** Fixed
**Details:** 
- Created `PORTS.md` with canonical port mapping.
- Updated `settlement-service` (3008), `api-gateway` (3000), `orders-service` (3006), and `trips-service` (3009) to match `docker-compose.yml`.

### 4. ✅ RESOLVED: Multiple Conflicting Entry Points
**Status:** Fixed
**Details:** Deleted unused `app.ts` and `server.ts` files. Each service now has a single clear entry point (`index.ts` or `main.ts`).

### 5. ✅ RESOLVED: CORS Set to `origin: '*'`
**Status:** Fixed
**Details:** The vulnerable `app.ts` files were deleted. The remaining `index.ts` files use proper `ALLOWED_ORIGINS` environment variable checks.

### 6. ✅ RESOLVED: Missing `compression` Dependency
**Status:** Fixed
**Details:** The code using `compression` was in the deleted `app.ts` files. The production code does not have missing dependencies.

---

## 🟡 ARCHITECTURAL ISSUES

### 7. Duplicate Wallet Logic Across Two Services

The **payment-service** (`app.ts`) and **wallet-service** (`app.ts`) both:
- Define their own `Wallet` and `Transaction` interfaces
- Initialize their own `initializeTestWallets()` with the same test user IDs
- Implement their own `/wallet/:userId` endpoints
- Run independently with no coordination

This means:
- A user could have $400 in the wallet-service and $200 in the payment-service
- Holding funds in one service doesn't affect the other
- There's no single source of truth for balances

---

### 8. Framework Fragmentation

The backend uses a **mix of raw Express and NestJS** with no clear pattern:

| Pattern | Services |
|---------|----------|
| **Raw Express** (manual routing) | auth, wallet, payment, product, subscription, escrow, notification, cart, api-gateway, feature-management |
| **NestJS** (decorators, modules) | orders-service, trips-service, matching-service, admin-service |

This creates inconsistency in:
- Error handling patterns
- Middleware application
- Dependency injection
- Input validation approach
- Swagger documentation

---

### 9. Auth Context Exported from Two Places

The frontend exports `useAuth` from **two different files**:

1. `src/contexts/AuthContext.tsx` — defines and exports `useAuth` (line 21)
2. `src/hooks/useAuth.ts` — imports `AuthContext` and re-exports its own `useAuth`

Both are valid but could confuse developers. Components importing from the wrong path would still work but could lead to subtle bugs if the implementations ever diverge.

---

### 10. Frontend API Base URL Mismatch

```typescript
// client.ts — line 5
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:10000/api'

// vite.config.ts — proxy
proxy: { '/api': { target: 'http://localhost:8080' } }

// .env — root
API_GATEWAY_PORT=8080

// api-gateway/index.ts
const PORT = process.env.PORT || 10000
```

The default API URL in the client is `localhost:10000/api`, but the Vite proxy forwards `/api` to `localhost:8080`, and the `.env` says the gateway is on 8080, but the gateway code defaults to 10000. This multi-hop configuration is fragile.

---

### 11. Insecure JWT Verification in product-service

```typescript
// product-service/src/app.ts, line 190
const sellerId = JSON.parse(atob(token.split('.')[1])).id;
```

The product service **decodes JWTs manually via `atob` without signature verification**. Any client can forge a JWT with any `id` or `role` and gain access. The admin endpoint at line 217 does the same thing.

---

### 12. `@types/axios` Deprecated Dependency

```json
// orders-service/package.json, line 40
"@types/axios": "^0.14.0"
```

Axios ships its own TypeScript types since v0.18. The `@types/axios` package is deprecated and could cause type conflicts.

---

### 13. Node Version Pinning Inconsistency

| Service | Node Version Requirement |
|---------|------------------------|
| orders-service | `"node": "22.20.0"` (exact pin) |
| wallet-service | `"node": ">=18.0.0"` (range) |
| payment-service | `"node": ">=18.0.0"` (range) |
| All others | No engine specified |

Pinning to `22.20.0` exactly in one service while others use ranges or nothing will cause deployment issues.

---

### 14. Redundant bcrypt Libraries

The auth-service installs **both** `bcrypt` (native) **and** `bcryptjs` (pure JS):

```json
"bcrypt": "^6.0.0",
"bcryptjs": "^3.0.3",
```

These serve the same purpose. Using both is confusing and adds unnecessary weight (bcrypt requires native compilation).

---

### 15. Payment Service Has 79 Service Files

```
payment-service/src/services/ — 79 files
payment-service/src/controllers/ — 24 files
payment-service/src/routes/ — 22 files
```

This single "payment service" contains AI risk scoring, trust operations, dispute management, protection services, rating services, delivery verification, abuse detection, and much more. It's essentially a **monolith disguised as a microservice**.

---

## 🟢 POSITIVE FINDINGS

### Well-Designed Schemas
The Prisma schemas are thoughtfully designed:
- **auth-service**: Clean User/OAuth/RefreshToken models with proper indexes and cascading deletes
- **wallet-service**: Comprehensive multi-currency support with 50+ currencies, hedging orders, auto-conversion, and audit logs
- **orders-service**: Full e-commerce order model with status history, shipping rates, delivery tracking, and tracking events

### Good Frontend Architecture
- Well-structured Redux store with 8 slices and selective persistence
- Proper React Query configuration with smart retry logic
- Clean context/provider pattern for auth, theme, and sockets
- Proper code-splitting with lazy loading in `App.tsx`
- Good error boundary setup
- Professional API client with interceptors, upload progress, and performance logging

### Solid Auth Flow
- JWT token refresh with automatic 5-minute-before-expiry refresh
- Proper cookie configuration (httpOnly, secure in production)
- OAuth strategy setup for Google, Facebook, Apple
- Session management with Redis

### Testing Investment
- ~60 test files found across the backend services
- Payment service has comprehensive safety tests for escrow, dispute, and protection
- Frontend has testing library setup with Vitest

---

## 📊 SUMMARY SCORECARD

| Category | Score | Notes |
|----------|-------|-------|
| **Architecture Design** | 7/10 | Good design on paper, fragmented in implementation |
| **Code Quality** | 4/10 | Multiple entry points, in-memory stores, inconsistent patterns |
| **Security** | 3/10 | Hardcoded secrets, wildcard CORS, unsigned JWT parsing |
| **Data Integrity** | 2/10 | Core financial services run on in-memory objects |
| **Schema Design** | 8/10 | Well-thought-out Prisma schemas, good indexes |
| **Frontend Quality** | 8/10 | Clean architecture, good practices |
| **Documentation** | 9/10 | Extensive docs, but some claims don't match code reality |
| **Test Coverage** | 5/10 | Good investment in financial safety tests, thin elsewhere |
| **Deployment Readiness** | 3/10 | Port conflicts, missing deps, env chaos |
| **Overall** | **5/10** | Strong foundation with serious implementation gaps |

---

## 🎯 PRIORITIZED FIX PLAN

### Phase 1: Stop-Ship Fixes (Week 1)
1. **Wire real database connections** to wallet-service and payment-service entry points (use existing Prisma services, don't write new ones)
2. **Remove committed `.env` files** from version control; add to `.gitignore`
3. **Fix port assignments** — create a canonical port map and enforce it
4. **Consolidate entry points** — each service gets exactly ONE entry file
5. **Fix CORS** — whitelist specific origins, not `*`

### Phase 2: Structural Fixes (Week 2-3)
6. **Choose one framework** — migrate all Express services to NestJS, or vice versa
7. **Merge wallet logic** — single source of truth for balances
8. **Add JWT signature verification** to product-service and all manual JWT parsing
9. **Fix missing dependencies** (`compression` in wallet & payment service)
10. **Remove duplicate `bcrypt`/`bcryptjs`** — pick one

### Phase 3: Production Hardening (Week 3-4)
11. **SSL/TLS** everywhere
12. **Secret management** via vault or cloud provider
13. **Add health checks** that verify database connectivity
14. **Set up CI/CD** that actually runs tests before deploy
15. **Increase test coverage** on critical paths (auth, payments, orders)

---

## 📎 APPENDIX: TOOL OUTPUT EVIDENCE

### Port Collision Proof
```
settlement-service/index.ts:13  → PORT 3016
subscription-service/app.ts:11  → PORT 3016   ← COLLISION
```

### In-Memory Store Proof
```
wallet-service/src/app.ts:18    → "// In-memory wallet storage for testing"
payment-service/src/app.ts:24   → "// In-memory wallet storage for testing"
product-service/src/app.ts:19   → "// In-memory product storage for MVP"
```

### Missing Dependency Proof
```
wallet-service/package.json     → no "compression" listed
payment-service/package.json    → no "compression" listed
wallet-service/src/app.ts:4     → import compression from 'compression';
payment-service/src/app.ts:4    → import compression from 'compression';
```

---

**END OF DEEP CODE ANALYSIS**
