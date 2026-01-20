# Frontend ↔ Backend Binding — Requirements

**Date**: January 16, 2026  
**Phase**: 7.1 - AI-Ready Architecture Foundation  
**Status**: ACTIVE  
**Priority**: CRITICAL (Blocks all frontend functionality)

---

## EXECUTIVE SUMMARY

The platform has completed Phases 5.0-6.4 (Auction System, Trust Scoring, Compliance). Phase 7.1 focuses on binding the frontend to real backend services, replacing mock data with actual API calls. This is the "electrical connections" phase - connecting all frontend screens to their corresponding backend endpoints.

**Current State**: Frontend has mock data; backend services exist but frontend is not consuming them.  
**Goal**: 100% of frontend screens bound to real backend APIs with proper error handling and loading states.

---

## USER STORIES

### Story 1: Wallet Balance Display
**As a** user  
**I want to** see my real wallet balance from the backend  
**So that** I know my actual available funds

**Acceptance Criteria**:
- [ ] Wallet balance displays real data from `GET /wallet/balance`
- [ ] Balance updates on screen load
- [ ] Loading state shown while fetching
- [ ] Error state shown if API fails
- [ ] No hardcoded balance values
- [ ] Balance is read-only (no edit UI)

**Effort**: 2 hours  
**Dependencies**: wallet-service must be running

---

### Story 2: Transaction History
**As a** user  
**I want to** see my transaction history from the backend  
**So that** I can track my wallet activity

**Acceptance Criteria**:
- [ ] Transaction history displays real data from `GET /wallet/ledger`
- [ ] Transactions are immutable (no edit/delete UI)
- [ ] Pagination works correctly
- [ ] Filters work (date range, transaction type)
- [ ] Loading state shown while fetching
- [ ] Error state shown if API fails

**Effort**: 3 hours  
**Dependencies**: wallet-service must be running

---

### Story 3: Auction List
**As a** buyer  
**I want to** see real auctions from the backend  
**So that** I can browse and bid on actual items

**Acceptance Criteria**:
- [ ] Auction list displays real data from `GET /auctions`
- [ ] Filters work (category, price range, status)
- [ ] Pagination works correctly
- [ ] Loading state shown while fetching
- [ ] Error state shown if API fails
- [ ] Auction details page loads real data from `GET /auctions/:id`

**Effort**: 4 hours  
**Dependencies**: auction-service must be running

---

### Story 4: Place Bid
**As a** buyer  
**I want to** place a bid on an auction  
**So that** I can compete for items

**Acceptance Criteria**:
- [ ] Bid form submits to `POST /auctions/:id/bids`
- [ ] Bid validation happens on backend
- [ ] Success message shown on successful bid
- [ ] Error message shown if bid fails
- [ ] Bid amount validated (must be higher than current bid)
- [ ] User must be authenticated
- [ ] Bid history updates in real-time

**Effort**: 3 hours  
**Dependencies**: auction-service, auth-service must be running

---

### Story 5: Orders List
**As a** buyer  
**I want to** see my orders from the backend  
**So that** I can track my purchases

**Acceptance Criteria**:
- [ ] Orders list displays real data from `GET /orders`
- [ ] Order details page loads real data from `GET /orders/:id`
- [ ] Order status is accurate
- [ ] Pagination works correctly
- [ ] Filters work (status, date range)
- [ ] Loading state shown while fetching
- [ ] Error state shown if API fails

**Effort**: 3 hours  
**Dependencies**: orders-service must be running

---

### Story 6: Create Auction
**As a** seller  
**I want to** create an auction via the backend  
**So that** I can list items for sale

**Acceptance Criteria**:
- [ ] Auction creation form submits to `POST /auctions`
- [ ] Form validation happens on backend
- [ ] Success message shown on successful creation
- [ ] Error message shown if creation fails
- [ ] User is redirected to auction details page
- [ ] Auction appears in seller's active auctions list
- [ ] User must be authenticated

**Effort**: 4 hours  
**Dependencies**: auction-service, auth-service must be running

---

### Story 7: Cart Management
**As a** buyer  
**I want to** manage my cart via the backend  
**So that** my cart persists across sessions

**Acceptance Criteria**:
- [ ] Cart displays real data from `GET /cart`
- [ ] Add to cart submits to `POST /cart/items`
- [ ] Remove from cart submits to `DELETE /cart/items/:id`
- [ ] Update quantity submits to `PUT /cart/items/:id`
- [ ] Cart totals are calculated correctly
- [ ] Loading state shown while fetching
- [ ] Error state shown if API fails

**Effort**: 3 hours  
**Dependencies**: cart-service must be running

---

### Story 8: Checkout
**As a** buyer  
**I want to** checkout and create an order  
**So that** I can complete my purchase

**Acceptance Criteria**:
- [ ] Checkout form submits to `POST /orders`
- [ ] Order is created with correct items and totals
- [ ] Payment is processed
- [ ] Order confirmation is shown
- [ ] User is redirected to order details page
- [ ] Order appears in user's orders list
- [ ] User must be authenticated

**Effort**: 4 hours  
**Dependencies**: orders-service, payment-service must be running

---

### Story 9: Disputes
**As a** user  
**I want to** view and manage disputes via the backend  
**So that** I can resolve transaction issues

**Acceptance Criteria**:
- [ ] Disputes list displays real data from `GET /disputes`
- [ ] Dispute details page loads real data from `GET /disputes/:id`
- [ ] Create dispute submits to `POST /disputes`
- [ ] Add message submits to `POST /disputes/:id/messages`
- [ ] Add evidence submits to `POST /disputes/:id/evidence`
- [ ] Loading state shown while fetching
- [ ] Error state shown if API fails

**Effort**: 4 hours  
**Dependencies**: auction-service must be running

---

### Story 10: Trust & Safety
**As a** user  
**I want to** see my trust score and safeguards  
**So that** I understand my account status

**Acceptance Criteria**:
- [ ] Trust score displays real data from `GET /trust/score/:userId`
- [ ] Safeguards display real data from `GET /safeguards/:userId`
- [ ] Trust actions display real data from `GET /trust-actions`
- [ ] Loading state shown while fetching
- [ ] Error state shown if API fails
- [ ] Trust score breakdown is visible

**Effort**: 2 hours  
**Dependencies**: auction-service must be running

---

## ACCEPTANCE CRITERIA (GLOBAL)

### API Connectivity
- [ ] All frontend screens have corresponding backend endpoints
- [ ] All endpoints are documented in API_INVENTORY.md
- [ ] All endpoints are tested and working
- [ ] All endpoints return correct data format

### Error Handling
- [ ] All API calls have error handling
- [ ] Error messages are user-friendly
- [ ] Errors are logged for debugging
- [ ] Retry logic implemented for transient failures
- [ ] 401 errors redirect to login
- [ ] 403 errors show permission denied message
- [ ] 500 errors show generic error message

### Loading States
- [ ] All async operations show loading indicator
- [ ] Loading state is cleared on success or error
- [ ] Skeleton loaders used where appropriate
- [ ] No data shown while loading

### Authentication
- [ ] All protected endpoints require auth token
- [ ] Auth token is sent in Authorization header
- [ ] Token is refreshed when expired
- [ ] User is redirected to login if token is invalid

### Performance
- [ ] API calls complete within 5 seconds
- [ ] No unnecessary API calls
- [ ] Caching implemented where appropriate
- [ ] Pagination implemented for large datasets

### Data Validation
- [ ] All user input is validated on frontend
- [ ] All user input is validated on backend
- [ ] Invalid data is rejected with clear error message
- [ ] No PII is logged or exposed

### Compliance
- [ ] No hardcoded API keys or secrets
- [ ] All sensitive data sent in request body (not URL)
- [ ] HTTPS required for all endpoints
- [ ] CORS configured correctly
- [ ] Rate limiting respected

---

## MISSING ENDPOINTS (TO BE IMPLEMENTED)

| Endpoint | Service | Status | Priority |
|----------|---------|--------|----------|
| `GET /calculator/fees` | payment-service | ❌ MISSING | HIGH |
| `GET /refunds/:id` | payment-service | ❌ MISSING | HIGH |
| `GET /chargebacks/:id` | payment-service | ❌ MISSING | MEDIUM |
| `GET /guarantees/:id` | auction-service | ❌ MISSING | MEDIUM |
| `GET /auctions/:id/reserve` | auction-service | ❌ MISSING | MEDIUM |
| `GET /auctions/:id/throttle` | auction-service | ❌ MISSING | MEDIUM |
| `GET /settlement/:id` | settlement-service | ❌ MISSING | MEDIUM |
| `GET /analytics/export` | analytics-service | ❌ MISSING | LOW |

---

## DEPENDENCIES

### Backend Services (Must Be Running)
- auth-service (port 3001)
- wallet-service (port 3002)
- auction-service (port 3003)
- payment-service (port 3004)
- orders-service (port 3005)
- listing-service (port 3006)
- notification-service (port 3007)
- cart-service (port 3008)
- seller-service (port 3009)
- traveler-service (port 3010)
- smart-delivery-service (port 3011)
- compliance-service (port 3012)
- admin-service (port 3013)

### Frontend Libraries
- axios (HTTP client)
- react (UI framework)
- react-router (routing)
- zustand or redux (state management)

### Environment Variables
- `VITE_API_BASE_URL` - Backend API base URL (default: http://localhost:8080)
- `VITE_API_TIMEOUT` - API timeout in ms (default: 30000)

---

## CONSTRAINTS

### Technical
- Must use existing axios client (api.service.ts)
- Must maintain backward compatibility with existing code
- Must not break existing tests
- Must follow existing code style and patterns

### Business
- Must not expose PII in logs or URLs
- Must comply with data protection regulations
- Must maintain audit trail for all transactions
- Must support multi-currency transactions

### Timeline
- Phase 7.1 must complete within 2 weeks
- All critical endpoints must be bound first
- Optional endpoints can be deferred to Phase 7.2

---

## SUCCESS METRICS

### Functional
- [ ] 100% of frontend screens bound to backend APIs
- [ ] 0 hardcoded mock data in production
- [ ] 100% of API calls have error handling
- [ ] 100% of async operations have loading states

### Performance
- [ ] API response time ≤ 2 seconds (p95)
- [ ] Frontend load time ≤ 3 seconds
- [ ] No memory leaks in API calls
- [ ] No unnecessary re-renders

### Quality
- [ ] 0 console errors in production
- [ ] 0 unhandled promise rejections
- [ ] 100% of error cases tested
- [ ] 100% of happy paths tested

### User Experience
- [ ] Users see loading indicators
- [ ] Users see clear error messages
- [ ] Users can retry failed operations
- [ ] Users can navigate without errors

---

## NEXT STEPS

1. **Verify Endpoints**: Confirm all endpoints exist in backend services
2. **Document Response Schemas**: Define request/response formats for each endpoint
3. **Test Connectivity**: Verify frontend can reach all services
4. **Implement API Clients**: Create service clients for each backend
5. **Bind Frontend Screens**: Replace mock data with real API calls
6. **Add Error Handling**: Implement proper error handling for all calls
7. **Add Loading States**: Implement loading indicators for async operations
8. **Test End-to-End**: Verify all screens work with real backend
9. **Performance Testing**: Ensure API calls meet performance targets
10. **Production Deployment**: Deploy to production with monitoring

---

## NOTES

- This spec focuses on **binding existing frontend screens to existing backend services**
- No new features are being added in Phase 7.1
- The goal is to replace mock data with real API calls
- All backend services are assumed to be stable and working
- Frontend screens are assumed to be complete and functional

