# Mock Data Removal Plan — Production Hardening Task 2

**Date**: January 16, 2026  
**Objective**: Eliminate ALL mock data and fake services from frontend  
**Status**: EXECUTION PLAN

---

## EXECUTIVE SUMMARY

This document outlines the complete removal of mock data, dummy services, and fake implementations from the frontend codebase. The audit identified **5 mock services**, **13 pages with mock data**, and **50+ hardcoded test items**.

**Approach**:
1. Remove all mock data arrays and objects
2. Replace with real API calls OR mark as BLOCKED
3. Add TODO comments only if backend endpoint missing
4. Use empty states instead of fake data
5. No fallback mock values

---

## PHASE 1: MOCK SERVICES REMOVAL

### 1.1 trustSafetyService.ts
**Status**: BLOCKED - Backend endpoints missing

**Mock Data to Remove**:
- mockReports (line 28) - 3 hardcoded reports
- mockTrustScores (line 72) - 2 hardcoded scores
- mockAccountBadges (line 159) - 3 hardcoded badges
- mockVerificationChecklists (line 196) - 1 hardcoded checklist

**Mock Methods to Replace**:
- getUserReports() → TODO: Implement GET /trust/reports
- getModerationCases() → TODO: Implement GET /trust/moderation-cases
- getTrustScore() → TODO: Implement GET /trust/score/:userId
- getAccountBadges() → TODO: Implement GET /trust/badges/:userId
- getUserWarnings() → TODO: Implement GET /trust/warnings/:userId
- getVerificationChecklist() → TODO: Implement GET /trust/verification/:userId
- getSafetyMetrics() → TODO: Implement GET /trust/metrics
- getModerationQueues() → TODO: Implement GET /trust/moderation-queues
- submitReport() → TODO: Implement POST /trust/reports
- updateReportStatus() → TODO: Implement PUT /trust/reports/:id

**Action**: Mark all methods as BLOCKED with TODO comments

---

### 1.2 travelerService.ts
**Status**: BLOCKED - Backend endpoints missing

**Mock Data to Remove**:
- mockTraveler (line 22) - Complete traveler profile
- mockTrips (line 74) - 2 hardcoded trips

**Mock Methods to Replace**:
- getTravelerDashboard() → TODO: Implement GET /traveler/dashboard
- getTravelerProfile() → TODO: Implement GET /traveler/profile/:id
- getTrips() → TODO: Implement GET /traveler/trips
- createTrip() → TODO: Implement POST /traveler/trips
- updateTripStatus() → TODO: Implement PUT /traveler/trips/:id/status
- getDeliveryRequests() → TODO: Implement GET /traveler/trips/:id/requests
- acceptDeliveryRequest() → TODO: Implement POST /traveler/requests/:id/accept
- updateDeliveryStatus() → TODO: Implement PUT /traveler/requests/:id/status

**Action**: Mark all methods as BLOCKED with TODO comments

---

### 1.3 refundService.ts
**Status**: BLOCKED - Backend endpoints missing

**Mock Data to Remove**:
- getRefundRequests() - 3 hardcoded refunds (line 35)
- getChargebackCases() - 2 hardcoded chargebacks (line 128)
- getRefundTimeline() - 4 hardcoded timeline events (line 191)
- getChargebackTimeline() - 4 hardcoded timeline events (line 251)

**Mock Methods to Replace**:
- getRefundRequests() → TODO: Implement GET /refunds
- getChargebackCases() → TODO: Implement GET /chargebacks
- getRefundTimeline() → TODO: Implement GET /refunds/:id/timeline
- getChargebackTimeline() → TODO: Implement GET /chargebacks/:id/timeline
- submitRefundRequest() → TODO: Implement POST /refunds
- uploadRefundEvidence() → TODO: Implement POST /refunds/:id/evidence
- uploadChargebackEvidence() → TODO: Implement POST /chargebacks/:id/evidence
- isRefundEligible() → TODO: Implement GET /refunds/eligibility
- canDisputeChargeback() → TODO: Implement GET /chargebacks/:id/dispute-eligibility

**Action**: Mark all methods as BLOCKED with TODO comments

---

### 1.4 paymentService.ts
**Status**: BLOCKED - Backend endpoints missing

**Mock Data to Remove**:
- getWalletBalance() - Hardcoded balance (line 38)
- getPaymentState() - Hardcoded payment state (line 53)
- getEscrowHolds() - 2 hardcoded escrow holds (line 82)
- getWalletTransactions() - 3 hardcoded transactions (line 119)
- getPaymentProviders() - 2 hardcoded providers (line 159)
- getPaymentMethods() - 3 hardcoded payment methods (line 195)
- getOrderPaymentSummary() - Hardcoded summary (line 237)
- getControlCenterFinanceSummary() - Hardcoded metrics (line 265)

**Mock Methods to Replace**:
- getWalletBalance() → TODO: Implement GET /wallet/balance
- getPaymentState() → TODO: Implement GET /payments/:id/state
- getEscrowHolds() → TODO: Implement GET /escrow/holds
- getWalletTransactions() → TODO: Implement GET /wallet/transactions
- getPaymentProviders() → TODO: Implement GET /payments/providers
- getPaymentMethods() → TODO: Implement GET /payments/methods
- getOrderPaymentSummary() → TODO: Implement GET /orders/:id/payment-summary
- getControlCenterFinanceSummary() → TODO: Implement GET /control-center/finance-summary

**Action**: Mark all methods as BLOCKED with TODO comments

---

### 1.5 cmsFallbackData.ts
**Status**: KEEP - This is intentional fallback data

**Note**: This file contains intentional fallback data for CMS content. Keep as-is but add clear comments indicating it's fallback-only.

---

## PHASE 2: PAGE-LEVEL MOCK DATA REMOVAL

### 2.1 SearchPage.tsx
**Status**: BLOCKED - Backend endpoint missing

**Mock Data to Remove**:
- MOCK_RESULTS (line 33) - 8 hardcoded search results

**Action**: 
- Remove MOCK_RESULTS array
- Replace with empty state
- Add TODO: Implement GET /search API call

---

### 2.2 ProductPage.tsx
**Status**: BLOCKED - Backend endpoint missing

**Mock Data to Remove**:
- PRODUCT (line 16) - Static product data

**Action**:
- Remove PRODUCT constant
- Replace with empty state
- Add TODO: Implement GET /auctions/:id API call

---

### 2.3 FulfillmentDemoPage.tsx
**Status**: KEEP - This is a demo page

**Note**: This is intentionally a demo page. Keep as-is but add clear "DEMO MODE" indicator.

---

### 2.4 WatchlistPage.tsx
**Status**: BLOCKED - Backend endpoint missing

**Mock Data to Remove**:
- mockWatchlistProducts (line 15) - 2 hardcoded products

**Action**:
- Remove mockWatchlistProducts
- Replace with empty state
- Add TODO: Implement GET /watchlist API call

---

### 2.5 SellerDashboard.tsx
**Status**: BLOCKED - Backend endpoints missing

**Mock Data to Remove**:
- recentOrders (line 44) - 3 hardcoded orders
- statCards (line 50) - 4 hardcoded stats

**Action**:
- Remove mock data
- Replace with empty state
- Add TODO: Implement GET /seller/dashboard API call

---

### 2.6 SellerAnalytics.tsx
**Status**: BLOCKED - Backend endpoints missing

**Mock Data to Remove**:
- stats (line 16) - 4 hardcoded stats
- topProducts (line 23) - 5 hardcoded products
- recentActivity (line 31) - 4 hardcoded activities

**Action**:
- Remove all mock data
- Replace with empty state
- Add TODO: Implement GET /seller/analytics API call

---

### 2.7 MyListings.tsx
**Status**: BLOCKED - Backend endpoint missing

**Mock Data to Remove**:
- listings (line 29) - 2 hardcoded listings

**Action**:
- Remove listings mock data
- Replace with empty state
- Add TODO: Implement GET /seller/listings API call

---

### 2.8 CreateListing.tsx
**Status**: KEEP - Categories and conditions are configuration

**Note**: Keep categories and conditions as they are configuration data, not mock data.

---

### 2.9 EditListing.tsx
**Status**: KEEP - Categories and conditions are configuration

**Note**: Keep categories and conditions as they are configuration data, not mock data.

---

### 2.10 HelpPage.tsx
**Status**: KEEP - Help content is static

**Note**: Keep help categories and FAQs as they are static content, not mock data.

---

### 2.11 UnifiedDashboard.tsx
**Status**: KEEP - Dashboard types are configuration

**Note**: Keep dashboard type options as they are configuration data.

---

### 2.12 CategoryPage.tsx
**Status**: BLOCKED - Backend endpoint missing

**Mock Data to Remove**:
- mockProducts (line 98) - 12 generated mock products

**Action**:
- Remove mockProducts generation
- Replace with empty state
- Add TODO: Implement GET /categories/:id/products API call

---

### 2.13 WholesalePage.tsx
**Status**: KEEP - This is a feature demo page

**Note**: This is a feature demo page. Keep as-is but add clear "DEMO MODE" indicator.

---

### 2.14 FraudDetectionPage.tsx
**Status**: KEEP - This is a feature demo page

**Note**: This is a feature demo page. Keep as-is but add clear "DEMO MODE" indicator.

---

## PHASE 3: PLACEHOLDER VALUES REMOVAL

### Placeholder URLs
- FulfillmentDemoPage.tsx (line 18, 26, 34) - Replace with actual CDN URLs
- AdEditor.tsx (line 211) - Replace with actual product URL
- TravelerEditor.tsx (line 163, 192) - Replace with actual URLs
- SecurityEventLoggingDemo.tsx (line 27-32) - Replace with actual demo values

### Demo Email/IDs
- SecurityEventLoggingDemo.tsx - Replace with actual demo values

---

## SUMMARY TABLE

| File | Type | Status | Action |
|------|------|--------|--------|
| trustSafetyService.ts | Service | BLOCKED | Remove all mock data, add TODO comments |
| travelerService.ts | Service | BLOCKED | Remove all mock data, add TODO comments |
| refundService.ts | Service | BLOCKED | Remove all mock data, add TODO comments |
| paymentService.ts | Service | BLOCKED | Remove all mock data, add TODO comments |
| cmsFallbackData.ts | Service | KEEP | Add comments indicating fallback-only |
| SearchPage.tsx | Page | BLOCKED | Remove mock results, add TODO |
| ProductPage.tsx | Page | BLOCKED | Remove static product, add TODO |
| FulfillmentDemoPage.tsx | Page | KEEP | Add "DEMO MODE" indicator |
| WatchlistPage.tsx | Page | BLOCKED | Remove mock products, add TODO |
| SellerDashboard.tsx | Page | BLOCKED | Remove mock data, add TODO |
| SellerAnalytics.tsx | Page | BLOCKED | Remove mock data, add TODO |
| MyListings.tsx | Page | BLOCKED | Remove mock listings, add TODO |
| CreateListing.tsx | Page | KEEP | Keep configuration data |
| EditListing.tsx | Page | KEEP | Keep configuration data |
| HelpPage.tsx | Page | KEEP | Keep static content |
| UnifiedDashboard.tsx | Page | KEEP | Keep configuration data |
| CategoryPage.tsx | Page | BLOCKED | Remove mock products, add TODO |
| WholesalePage.tsx | Page | KEEP | Add "DEMO MODE" indicator |
| FraudDetectionPage.tsx | Page | KEEP | Add "DEMO MODE" indicator |

---

## BLOCKED COMPONENTS

The following components are BLOCKED and cannot be fully implemented until backend endpoints are created:

### Services (8 endpoints needed)
1. trustSafetyService - 10 methods blocked
2. travelerService - 8 methods blocked
3. refundService - 9 methods blocked
4. paymentService - 8 methods blocked

### Pages (5 endpoints needed)
1. SearchPage - GET /search
2. ProductPage - GET /auctions/:id
3. WatchlistPage - GET /watchlist
4. SellerDashboard - GET /seller/dashboard
5. SellerAnalytics - GET /seller/analytics
6. MyListings - GET /seller/listings
7. CategoryPage - GET /categories/:id/products

---

## EXECUTION CHECKLIST

- [ ] Phase 1: Remove mock services
  - [ ] trustSafetyService.ts
  - [ ] travelerService.ts
  - [ ] refundService.ts
  - [ ] paymentService.ts
  - [ ] cmsFallbackData.ts (add comments)

- [ ] Phase 2: Remove page mock data
  - [ ] SearchPage.tsx
  - [ ] ProductPage.tsx
  - [ ] WatchlistPage.tsx
  - [ ] SellerDashboard.tsx
  - [ ] SellerAnalytics.tsx
  - [ ] MyListings.tsx
  - [ ] CategoryPage.tsx
  - [ ] Add "DEMO MODE" indicators to demo pages

- [ ] Phase 3: Replace placeholder values
  - [ ] Update placeholder URLs
  - [ ] Update demo email/IDs

- [ ] Verification
  - [ ] No mock data in production code
  - [ ] All blocked components have TODO comments
  - [ ] Empty states display correctly
  - [ ] No console errors

---

## NOTES

- **No Fallback Values**: Do not add fallback mock values. Use empty states instead.
- **TODO Comments**: Add TODO comments ONLY if backend endpoint does not exist.
- **Empty States**: Implement proper empty state UI for all data-driven components.
- **Demo Pages**: Keep demo pages but add clear "DEMO MODE" indicators.
- **Configuration Data**: Keep configuration data (categories, conditions, help content).

---

**Status**: READY FOR EXECUTION

