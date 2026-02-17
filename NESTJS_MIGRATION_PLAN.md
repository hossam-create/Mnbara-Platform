# NestJS Migration Plan - Phase 2

**Date:** 2026-02-17  
**Objective:** Migrate all Express services to NestJS for consistency, better structure, and enterprise-grade patterns

---

## 📊 Current State Analysis

### ✅ Already Using NestJS (Reference Architecture)
- **orders-service** - Full NestJS with modules, controllers, DTOs
- **trips-service** - Full NestJS with Swagger
- **matching-service** - Full NestJS
- **admin-service** - Full NestJS

### 🔄 Need Migration (Express → NestJS)
1. **auth-service** - Express + Passport (96 files)
2. **payment-service** - Express (182 files - largest!)
3. **wallet-service** - Express (106 files)
4. **product-service** - Express (24 files)
5. **api-gateway** - Express + http-proxy-middleware (16 files)
6. **notification-service** - Express (30 files)
7. **escrow-service** - Express (24 files)
8. **settlement-service** - Express (18 files)
9. **subscription-service** - Express (7 files)
10. **cart-service** - Express (8 files)
11. **feature-management-service** - Express (12 files)
12. **country-layer-service** - Express (24 files)
13. **user-service** - Express (4 files)

---

## 🎯 Migration Strategy

### Phase 2.1: Foundation Services (Week 1)
**Priority: High-traffic, core business logic**

1. **auth-service** ⭐ CRITICAL
   - Current: Express + Passport strategies
   - Target: NestJS + @nestjs/passport + JWT guards
   - Complexity: HIGH (OAuth flows, session management)
   - Dependencies: All other services depend on this

2. **wallet-service** ⭐ CRITICAL
   - Current: Express with Prisma services
   - Target: NestJS modules (Wallet, Ledger, Transfer, Escrow)
   - Complexity: MEDIUM
   - Note: Already has good service layer separation

3. **payment-service** ⭐ CRITICAL
   - Current: Express with 79 service files
   - Target: NestJS with feature modules (Stripe, Escrow, Disputes, etc.)
   - Complexity: VERY HIGH (largest service)
   - Strategy: Break into sub-modules

### Phase 2.2: Business Logic Services (Week 2)
4. **product-service**
   - Current: Express with routes/controllers
   - Target: NestJS with Products, Categories, Search modules
   - Complexity: MEDIUM

5. **escrow-service**
   - Current: Express
   - Target: NestJS with state machine pattern
   - Complexity: MEDIUM

6. **notification-service**
   - Current: Express (has both .ts and .js files!)
   - Target: NestJS with Email, SMS, Push modules
   - Complexity: MEDIUM
   - Note: Clean up dual language issue

### Phase 2.3: Supporting Services (Week 3)
7. **settlement-service**
8. **subscription-service**
9. **cart-service**
10. **feature-management-service**
11. **country-layer-service**
12. **user-service**

### Phase 2.4: Gateway (Week 4)
13. **api-gateway**
   - Current: Express + http-proxy-middleware
   - Target: NestJS API Gateway with @nestjs/microservices
   - Complexity: HIGH (routing, auth, rate limiting)
   - Note: Do this LAST after all services are migrated

---

## 🏗️ NestJS Architecture Pattern (Reference: orders-service)

```
service/
├── src/
│   ├── main.ts                    # Bootstrap
│   ├── app.module.ts              # Root module
│   ├── common/                    # Shared utilities
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── cache/
│   │   │   ├── cache.module.ts
│   │   │   └── cache.service.ts
│   │   └── guards/
│   │       └── jwt-auth.guard.ts
│   └── [feature]/                 # Feature modules
│       ├── [feature].module.ts
│       ├── [feature].controller.ts
│       ├── [feature].service.ts
│       ├── dto/
│       │   ├── create-[feature].dto.ts
│       │   └── update-[feature].dto.ts
│       └── entities/
│           └── [feature].entity.ts
├── prisma/
│   └── schema.prisma
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## 📋 Migration Checklist (Per Service)

### Pre-Migration
- [ ] Audit current routes and endpoints
- [ ] Document all middleware chains
- [ ] Identify shared utilities
- [ ] List all environment variables
- [ ] Review Prisma schema

### Migration Steps
- [ ] Install NestJS dependencies
- [ ] Create `nest-cli.json`
- [ ] Create `app.module.ts` root module
- [ ] Create `main.ts` bootstrap
- [ ] Migrate Prisma to `common/prisma` module
- [ ] Create feature modules (one per domain)
- [ ] Convert routes → controllers with decorators
- [ ] Convert middleware → guards/interceptors
- [ ] Create DTOs with class-validator
- [ ] Update `package.json` scripts
- [ ] Update Dockerfile CMD
- [ ] Test all endpoints
- [ ] Update integration tests

### Post-Migration
- [ ] Remove old Express files
- [ ] Update README
- [ ] Update docker-compose health checks
- [ ] Verify CORS configuration
- [ ] Verify environment validation

---

## 🔧 Standard NestJS Dependencies

```json
{
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/config": "^3.1.1",
    "@nestjs/swagger": "^7.1.17",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/jwt": "^10.2.0",
    "@prisma/client": "^5.22.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.2.1",
    "@nestjs/schematics": "^10.0.3",
    "@nestjs/testing": "^10.3.0",
    "@types/express": "^4.17.21",
    "@types/passport-jwt": "^3.0.13",
    "typescript": "^5.3.3",
    "prisma": "^5.22.0"
  }
}
```

---

## ⚠️ Migration Risks & Mitigation

### Risk 1: Breaking Changes
**Mitigation:** 
- Migrate one service at a time
- Keep old code until new code is tested
- Use feature flags for gradual rollout

### Risk 2: Auth Integration
**Mitigation:**
- Migrate auth-service FIRST
- Create shared JWT guard module
- Test with existing tokens

### Risk 3: Database Connections
**Mitigation:**
- Use NestJS lifecycle hooks for Prisma
- Implement proper connection pooling
- Add health checks

### Risk 4: Performance Regression
**Mitigation:**
- Benchmark before/after
- Use NestJS caching
- Profile with clinic.js

---

## 📈 Success Metrics

- [ ] All services use NestJS
- [ ] Consistent module structure
- [ ] Swagger docs auto-generated
- [ ] DTOs with validation
- [ ] Dependency injection throughout
- [ ] No Express imports remaining
- [ ] All tests passing
- [ ] Docker builds successful

---

## 🚀 Next Steps

1. **Start with auth-service** (most critical)
2. Create shared `@mnbarh/common` package for:
   - JWT guards
   - Prisma module
   - DTOs
   - Decorators
3. Document patterns as we go
4. Update DEEP_CODE_ANALYSIS.md when complete
