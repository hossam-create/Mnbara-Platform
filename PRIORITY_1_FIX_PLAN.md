# PRIORITY 1 FIXES - BEFORE PRODUCTION LAUNCH

**Date:** February 18, 2026
**Status:** IN PROGRESS
**Target:** Complete before MVP launch

---

## ISSUES TO FIX

### 1. ✅ Complete Auth Guard Implementations
**Location:** `backend/services/wallet-service/src/routes/control-center.routes.ts`
**Issue:** Admin role verification commented out
**Risk:** Security vulnerability - unauthorized access to admin endpoints
**Action:** Implement proper JWT-based admin authentication

### 2. ✅ Verify Wallet Service Dual Entry Point
**Location:** `backend/services/wallet-service/src/`
**Issue:** Both `main.ts` (NestJS) and `index.ts` (Express) exist
**Risk:** Confusion about which entry point is canonical
**Action:** Remove `index.ts` or document why both are needed

### 3. ✅ Audit Payment Service Wallet Usage
**Location:** `backend/services/payment-service/src/services/wallet.service.ts`
**Issue:** File exists but not marked as deprecated (unlike wallet.service.DEPRECATED.ts)
**Risk:** Duplicate wallet logic might still be in use
**Action:** Verify it's not being used and deprecate or remove

### 4. ✅ Implement RabbitMQ Publish
**Location:** `backend/services/trips-service/src/controllers/traveler.controller.ts`
**Issue:** RabbitMQ publish is console.log only
**Risk:** Location updates not propagated to other services
**Action:** Implement actual RabbitMQ publish or document as future feature

### 5. ✅ Complete Escrow Fund Integration
**Location:** `backend/services/escrow-service/src/services/escrow.service.ts`
**Issue:** `holdFunds`, `transferFunds`, `refundFunds` are stubs
**Risk:** Escrow operations don't actually move money
**Action:** Integrate with payment-service or wallet-service

### 6. ✅ Verify Database Migrations
**Location:** All services with Prisma schemas
**Issue:** Need to verify migration state across all services
**Risk:** Schema mismatches between services
**Action:** Run migration verification script

---

## EXECUTION PLAN

### Phase 1: Security Fixes (Critical)
1. Implement auth guards in wallet-service control-center routes
2. Implement auth guards in wallet-service ledger routes
3. Add rate limiting to remaining services

### Phase 2: Code Cleanup (Important)
4. Resolve wallet-service dual entry point
5. Audit and remove/deprecate payment-service wallet.service.ts
6. Remove archived .env files from docs folder

### Phase 3: Integration Completion (Important)
7. Implement or document RabbitMQ publish in trips-service
8. Complete escrow-service fund integration
9. Verify all database migrations

---

## TRACKING

- [ ] Task 1: Auth guards in control-center routes
- [ ] Task 2: Auth guards in ledger routes  
- [ ] Task 3: Rate limiting for services
- [ ] Task 4: Wallet-service entry point resolution
- [ ] Task 5: Payment-service wallet audit
- [ ] Task 6: Remove archived .env files
- [ ] Task 7: RabbitMQ implementation/documentation
- [ ] Task 8: Escrow fund integration
- [ ] Task 9: Database migration verification

---

## NOTES

- All fixes should be tested before marking complete
- Security fixes take absolute priority
- Document any decisions to defer features
- Update audit report after completion
