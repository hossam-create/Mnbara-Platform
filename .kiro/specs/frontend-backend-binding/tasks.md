# Frontend ↔ Backend Binding — Implementation Tasks

**Date**: January 16, 2026  
**Phase**: 7.1 - AI-Ready Architecture Foundation  
**Status**: READY FOR EXECUTION

---

## TASK OVERVIEW

This task list implements the frontend-backend binding for Phase 7.1. The goal is to replace all mock data with real API calls from the backend services.

**Total Effort**: ~40 person-hours  
**Timeline**: 2 weeks  
**Team Size**: 2-3 engineers

---

## PHASE 1: ENDPOINT VERIFICATION (Week 1)

### 1.1 Scan Backend Services for Endpoints
- [ ] Scan auth-service for endpoints
- [ ] Scan wallet-service for endpoints
- [ ] Scan auction-service for endpoints
- [ ] Scan payment-service for endpoints
- [ ] Scan orders-service for endpoints
- [ ] Scan listing-service for endpoints
- [ ] Scan cart-service for endpoints
- [ ] Scan seller-service for endpoints
- [ ] Scan traveler-service for endpoints
- [ ] Scan notification-service for endpoints
- [ ] Scan admin-service for endpoints
- [ ] Document all endpoints in spreadsheet

**Effort**: 4 hours  
**Owner**: Backend Engineer  
**Acceptance Criteria**:
- [ ] All endpoints documented
- [ ] Endpoint paths verified
- [ ] HTTP methods verified
- [ ] Auth requirements verified

---

### 1.2 Document Response Schemas
- [ ] Document auth-service response schemas
- [ ] Document wallet-service response schemas
- [ ] Document auction-service response schemas
- [ ] Document payment-service response schemas
- [ ] Document orders-service response schemas
- [ ] Document listing-service response schemas
- [ ] Document cart-service response schemas
- [ ] Document seller-service response schemas
- [ ] Document traveler-service response schemas
- [ ] Document notification-service response schemas
- [ ] Document admin-service response schemas
- [ ] Create Postman collection with all endpoints

**Effort**: 6 hours  
**Owner**: Backend Engineer  
**Acceptance Criteria**:
- [ ] All response schemas documented
- [ ] Request/response examples provided
- [ ] Error responses documented
- [ ] Postman collection created and tested

---

### 1.3 Test All Endpoints
- [ ] Test auth endpoints (login, register, logout, refresh)
- [ ] Test wallet endpoints (balance, ledger, transactions)
- [ ] Test auction endpoints (list, details, bids, create)
- [ ] Test payment endpoints (create intent, confirm, status)
- [ ] Test orders endpoints (list, details, create)
- [ ] Test listing endpoints (search, categories, details)
- [ ] Test cart endpoints (get, add, remove, update)
- [ ] Test seller endpoints (dashboard, sales, inventory)
- [ ] Test traveler endpoints (dashboard, purchases)
- [ ] Test notification endpoints (list, mark read)
- [ ] Test admin endpoints (users, analytics, disputes)
- [ ] Document any missing or broken endpoints

**Effort**: 8 hours  
**Owner**: QA Engineer  
**Acceptance Criteria**:
- [ ] All endpoints tested and working
- [ ] Response data matches schema
- [ ] Error handling works correctly
- [ ] Missing endpoints identified

---

### 1.4 Update API_INVENTORY.md
- [ ] Update endpoint paths with verified URLs
- [ ] Update response schemas with actual data
- [ ] Update missing endpoints list
- [ ] Add endpoint testing status
- [ ] Add performance metrics (response time)
- [ ] Add authentication requirements

**Effort**: 2 hours  
**Owner**: Frontend Engineer  
**Acceptance Criteria**:
- [ ] API_INVENTORY.md updated with verified data
- [ ] All endpoints marked as verified or missing
- [ ] Response schemas documented
- [ ] Performance metrics recorded

---

## PHASE 2: API CLIENT IMPLEMENTATION (Week 1-2)

### 2.1 Create Auth Service Client
- [ ] Create `frontend/web-app/src/services/auth.service.ts`
- [ ] Implement login method
- [ ] Implement register method
- [ ] Implement logout method
- [ ] Implement refresh token method
- [ ] Implement forgot password method
- [ ] Implement reset password method
- [ ] Add error handling
- [ ] Add request/response logging
- [ ] Add unit tests

**Effort**: 3 hours  
**Owner**: Frontend Engineer  
**Acceptance Criteria**:
- [ ] All auth methods implemented
- [ ] Error handling works
- [ ] Unit tests pass
- [ ] Code follows existing patterns

---

### 2.2 Create Wallet Service Client
- [ ] Create `frontend/web-app/src/services/wallet.service.ts`
- [ ] Implement getBalance method
- [ ] Implement getLedger method
- [ ] Implement getByOwner method
- [ ] Implement transaction history method
- [ ] Add error handling
- [ ] Add caching for balance (5 min TTL)
- [ ] Add request/response logging
- [ ] Add unit tests

**Effort**: 3 hours  
**Owner**: Frontend Engineer  
**Acceptance Criteria**:
- [ ] All wallet methods implemented
- [ ] Caching works correctly
- [ ] Error handling works
- [ ] Unit tests pass

---

### 2.3 Create Auction Service Client
- [ ] Create `frontend/web-app/src/services/auction.service.ts`
- [ ] Implement getList method
- [ ] Implement getById method
- [ ] Implement placeBid method
- [ ] Implement getBids method
- [ ] Implement create method
- [ ] Implement getActive method
- [ ] Add error handling
- [ ] Add request/response logging
- [ ] Add unit tests

**Effort**: 4 hours  
**Owner**: Frontend Engineer  
**Acceptance Criteria**:
- [ ] All auction methods implemented
- [ ] Error handling works
- [ ] Unit tests pass
- [ ] Code follows existing patterns

---

### 2.4 Create Orders Service Client
- [ ] Create `frontend/web-app/src/services/orders.service.ts`
- [ ] Implement getList method
- [ ] Implement getById method
- [ ] Implement create method
- [ ] Implement updateStatus method
- [ ] Add error handling
- [ ] Add request/response logging
- [ ] Add unit tests

**Effort**: 3 hours  
**Owner**: Frontend Engineer  
**Acceptance Criteria**:
- [ ] All orders methods implemented
- [ ] Error handling works
- [ ] Unit tests pass
- [ ] Code follows existing patterns

---

### 2.5 Create Cart Service Client
- [ ] Create `frontend/web-app/src/services/cart.service.ts`
- [ ] Implement getCart method
- [ ] Implement addItem method
- [ ] Implement removeItem method
- [ ] Implement updateItem method
- [ ] Implement clear method
- [ ] Add error handling
- [ ] Add request/response logging
- [ ] Add unit tests

**Effort**: 2 hours  
**Owner**: Frontend Engineer  
**Acceptance Criteria**:
- [ ] All cart methods implemented
- [ ] Error handling works
- [ ] Unit tests pass
- [ ] Code follows existing patterns

---

### 2.6 Create Payment Service Client
- [ ] Create `frontend/web-app/src/services/payment.service.ts`
- [ ] Implement createIntent method
- [ ] Implement confirmPayment method
- [ ] Implement getStatus method
- [ ] Implement pollStatus method
- [ ] Add error handling
- [ ] Add request/response logging
- [ ] Add unit tests

**Effort**: 3 hours  
**Owner**: Frontend Engineer  
**Acceptance Criteria**:
- [ ] All payment methods implemented
- [ ] Error handling works
- [ ] Unit tests pass
- [ ] Code follows existing patterns

---

### 2.7 Create Disputes Service Client
- [ ] Create `frontend/web-app/src/services/disputes.service.ts`
- [ ] Implement getList method
- [ ] Implement getById method
- [ ] Implement create method
- [ ] Implement addMessage method
- [ ] Implement addEvidence method
- [ ] Implement escalate method
- [ ] Add error handling
- [ ] Add request/response logging
- [ ] Add unit tests

**Effort**: 3 hours  
**Owner**: Frontend Engineer  
**Acceptance Criteria**:
- [ ] All disputes methods implemented
- [ ] Error handling works
- [ ] Unit tests pass
- [ ] Code follows existing patterns

---

### 2.8 Create Other Service Clients
- [ ] Create seller.service.ts
- [ ] Create traveler.service.ts
- [ ] Create notifications.service.ts
- [ ] Create admin.service.ts
- [ ] Create listing.service.ts
- [ ] Add error handling to all
- [ ] Add unit tests to all

**Effort**: 6 hours  
**Owner**: Frontend Engineer  
**Acceptance Criteria**:
- [ ] All service clients created
- [ ] Error handling works
- [ ] Unit tests pass
- [ ] Code follows existing patterns

---

## PHASE 3: FRONTEND BINDING (Week 2)

### 3.1 Bind Wallet Screens
- [ ] Update WalletPage.tsx to use wallet.service
- [ ] Update BalanceDisplay.tsx to use wallet.service
- [ ] Update LedgerTable.tsx to use wallet.service
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add empty states
- [ ] Test with real backend

**Effort**: 3 hours  
**Owner**: Frontend Engineer  
**Acceptance Criteria**:
- [ ] Wallet screens use real API
- [ ] Loading states work
- [ ] Error handling works
- [ ] Empty states work
- [ ] Tests pass

---

### 3.2 Bind Auction Screens
- [ ] Update SearchPage.tsx to use auction.service
- [ ] Update ProductPage.tsx to use auction.service
- [ ] Update SellPage.tsx to use auction.service
- [ ] Update BidForm.tsx to use auction.service
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add empty states
- [ ] Test with real backend

**Effort**: 4 hours  
**Owner**: Frontend Engineer  
**Acceptance Criteria**:
- [ ] Auction screens use real API
- [ ] Loading states work
- [ ] Error handling works
- [ ] Empty states work
- [ ] Tests pass

---

### 3.3 Bind Orders Screens
- [ ] Update OrdersPage.tsx to use orders.service
- [ ] Update OrderDetailsPage.tsx to use orders.service
- [ ] Update CheckoutPage.tsx to use orders.service
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add empty states
- [ ] Test with real backend

**Effort**: 3 hours  
**Owner**: Frontend Engineer  
**Acceptance Criteria**:
- [ ] Orders screens use real API
- [ ] Loading states work
- [ ] Error handling works
- [ ] Empty states work
- [ ] Tests pass

---

### 3.4 Bind Cart Screens
- [ ] Update CartPage.tsx to use cart.service
- [ ] Update AddToCartButton.tsx to use cart.service
- [ ] Update CartSummary.tsx to use cart.service
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add empty states
- [ ] Test with real backend

**Effort**: 2 hours  
**Owner**: Frontend Engineer  
**Acceptance Criteria**:
- [ ] Cart screens use real API
- [ ] Loading states work
- [ ] Error handling works
- [ ] Empty states work
- [ ] Tests pass

---

### 3.5 Bind Disputes Screens
- [ ] Update DisputesPage.tsx to use disputes.service
- [ ] Update DisputeDetailsModal.tsx to use disputes.service
- [ ] Update CreateDisputeForm.tsx to use disputes.service
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add empty states
- [ ] Test with real backend

**Effort**: 3 hours  
**Owner**: Frontend Engineer  
**Acceptance Criteria**:
- [ ] Disputes screens use real API
- [ ] Loading states work
- [ ] Error handling works
- [ ] Empty states work
- [ ] Tests pass

---

### 3.6 Bind Trust & Safety Screens
- [ ] Update TrustScoreDisplay.tsx to use auction.service
- [ ] Update SafeguardsPanel.tsx to use auction.service
- [ ] Update TrustActionsPage.tsx to use auction.service
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add empty states
- [ ] Test with real backend

**Effort**: 2 hours  
**Owner**: Frontend Engineer  
**Acceptance Criteria**:
- [ ] Trust screens use real API
- [ ] Loading states work
- [ ] Error handling works
- [ ] Empty states work
- [ ] Tests pass

---

### 3.7 Bind Other Screens
- [ ] Bind seller screens to seller.service
- [ ] Bind traveler screens to traveler.service
- [ ] Bind notification screens to notifications.service
- [ ] Bind admin screens to admin.service
- [ ] Bind search screens to listing.service
- [ ] Add loading states to all
- [ ] Add error handling to all
- [ ] Test with real backend

**Effort**: 6 hours  
**Owner**: Frontend Engineer  
**Acceptance Criteria**:
- [ ] All screens use real API
- [ ] Loading states work
- [ ] Error handling works
- [ ] Empty states work
- [ ] Tests pass

---

## PHASE 4: ERROR HANDLING & OPTIMIZATION (Week 2)

### 4.1 Implement Retry Logic
- [ ] Add retry logic to api.service.ts
- [ ] Implement exponential backoff
- [ ] Add max retry attempts
- [ ] Add retry logging
- [ ] Test retry logic

**Effort**: 2 hours  
**Owner**: Frontend Engineer  
**Acceptance Criteria**:
- [ ] Retry logic works
- [ ] Exponential backoff works
- [ ] Max retries respected
- [ ] Logging works
- [ ] Tests pass

---

### 4.2 Implement Caching
- [ ] Add caching to api.service.ts
- [ ] Implement memory cache
- [ ] Implement localStorage cache
- [ ] Add cache invalidation
- [ ] Add cache stats
- [ ] Test caching

**Effort**: 3 hours  
**Owner**: Frontend Engineer  
**Acceptance Criteria**:
- [ ] Caching works
- [ ] Cache invalidation works
- [ ] Cache stats available
- [ ] Tests pass

---

### 4.3 Implement Request/Response Logging
- [ ] Add logging to api.service.ts
- [ ] Log all requests with timestamp
- [ ] Log all responses with status
- [ ] Log all errors with context
- [ ] Add log levels (debug, info, warn, error)
- [ ] Test logging

**Effort**: 2 hours  
**Owner**: Frontend Engineer  
**Acceptance Criteria**:
- [ ] Logging works
- [ ] All requests logged
- [ ] All errors logged
- [ ] Log levels work
- [ ] Tests pass

---

### 4.4 Implement Request/Response Validation
- [ ] Add schema validation to api.service.ts
- [ ] Validate all responses against schema
- [ ] Log validation errors
- [ ] Handle validation failures gracefully
- [ ] Test validation

**Effort**: 2 hours  
**Owner**: Frontend Engineer  
**Acceptance Criteria**:
- [ ] Validation works
- [ ] Invalid responses detected
- [ ] Errors logged
- [ ] Tests pass

---

### 4.5 Performance Optimization
- [ ] Analyze API response times
- [ ] Identify slow endpoints
- [ ] Implement pagination where needed
- [ ] Implement lazy loading where needed
- [ ] Optimize bundle size
- [ ] Test performance

**Effort**: 3 hours  
**Owner**: Frontend Engineer  
**Acceptance Criteria**:
- [ ] API response time ≤ 2s (p95)
- [ ] Frontend load time ≤ 3s
- [ ] No memory leaks
- [ ] No unnecessary re-renders

---

## PHASE 5: TESTING & VALIDATION (Week 2)

### 5.1 Unit Tests
- [ ] Write unit tests for all service clients
- [ ] Write unit tests for error handling
- [ ] Write unit tests for retry logic
- [ ] Write unit tests for caching
- [ ] Achieve 80%+ code coverage

**Effort**: 4 hours  
**Owner**: QA Engineer  
**Acceptance Criteria**:
- [ ] All service clients tested
- [ ] Error handling tested
- [ ] Retry logic tested
- [ ] Caching tested
- [ ] 80%+ code coverage

---

### 5.2 Integration Tests
- [ ] Test frontend-backend communication
- [ ] Test authentication flow
- [ ] Test error scenarios
- [ ] Test loading states
- [ ] Test with real backend

**Effort**: 4 hours  
**Owner**: QA Engineer  
**Acceptance Criteria**:
- [ ] All integration tests pass
- [ ] Authentication flow works
- [ ] Error scenarios handled
- [ ] Loading states work

---

### 5.3 E2E Tests
- [ ] Test complete user workflows
- [ ] Test wallet operations
- [ ] Test auction operations
- [ ] Test order operations
- [ ] Test dispute operations

**Effort**: 4 hours  
**Owner**: QA Engineer  
**Acceptance Criteria**:
- [ ] All E2E tests pass
- [ ] User workflows work
- [ ] No errors in console
- [ ] Performance acceptable

---

### 5.4 Manual Testing
- [ ] Test all screens with real backend
- [ ] Test error scenarios
- [ ] Test loading states
- [ ] Test empty states
- [ ] Test with different network speeds

**Effort**: 4 hours  
**Owner**: QA Engineer  
**Acceptance Criteria**:
- [ ] All screens work correctly
- [ ] Error handling works
- [ ] Loading states work
- [ ] Empty states work
- [ ] Performance acceptable

---

## PHASE 6: DEPLOYMENT & MONITORING (Week 2)

### 6.1 Prepare for Production
- [ ] Update environment variables
- [ ] Configure API base URL for production
- [ ] Enable monitoring and logging
- [ ] Set up error tracking (Sentry)
- [ ] Set up performance monitoring (New Relic)

**Effort**: 2 hours  
**Owner**: DevOps Engineer  
**Acceptance Criteria**:
- [ ] Environment variables configured
- [ ] API base URL set correctly
- [ ] Monitoring enabled
- [ ] Error tracking enabled
- [ ] Performance monitoring enabled

---

### 6.2 Deploy to Staging
- [ ] Deploy frontend to staging
- [ ] Deploy backend services to staging
- [ ] Run smoke tests
- [ ] Verify all endpoints working
- [ ] Monitor for errors

**Effort**: 2 hours  
**Owner**: DevOps Engineer  
**Acceptance Criteria**:
- [ ] Frontend deployed to staging
- [ ] Backend services deployed to staging
- [ ] Smoke tests pass
- [ ] All endpoints working
- [ ] No errors in logs

---

### 6.3 Deploy to Production
- [ ] Deploy frontend to production
- [ ] Deploy backend services to production
- [ ] Run smoke tests
- [ ] Verify all endpoints working
- [ ] Monitor for errors
- [ ] Notify users of changes

**Effort**: 2 hours  
**Owner**: DevOps Engineer  
**Acceptance Criteria**:
- [ ] Frontend deployed to production
- [ ] Backend services deployed to production
- [ ] Smoke tests pass
- [ ] All endpoints working
- [ ] No errors in logs
- [ ] Users notified

---

### 6.4 Post-Deployment Monitoring
- [ ] Monitor API response times
- [ ] Monitor error rates
- [ ] Monitor user activity
- [ ] Monitor system resources
- [ ] Respond to alerts

**Effort**: Ongoing  
**Owner**: DevOps Engineer  
**Acceptance Criteria**:
- [ ] API response time ≤ 2s (p95)
- [ ] Error rate ≤ 0.1%
- [ ] User activity normal
- [ ] System resources normal
- [ ] Alerts responded to

---

## SUMMARY

| Phase | Tasks | Effort | Timeline |
|-------|-------|--------|----------|
| 1: Verification | 4 tasks | 20 hours | Week 1 |
| 2: API Clients | 8 tasks | 27 hours | Week 1-2 |
| 3: Frontend Binding | 7 tasks | 23 hours | Week 2 |
| 4: Error Handling | 5 tasks | 12 hours | Week 2 |
| 5: Testing | 4 tasks | 16 hours | Week 2 |
| 6: Deployment | 4 tasks | 8 hours | Week 2 |
| **TOTAL** | **32 tasks** | **~106 hours** | **2 weeks** |

---

## NOTES

- Tasks can be parallelized (e.g., multiple engineers working on different service clients)
- Actual effort may vary based on backend service stability
- Missing endpoints may require backend implementation
- Performance optimization may require backend changes
- All tasks should include unit tests
- All tasks should follow existing code patterns and style

