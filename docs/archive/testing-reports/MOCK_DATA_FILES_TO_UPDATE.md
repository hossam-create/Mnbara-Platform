# Mock Data Removal — Files to Update

**Date**: January 16, 2026  
**Task**: Task 2 - Remove Mock Data Completely  
**Status**: READY FOR EXECUTION

---

## FILES TO UPDATE (12 files)

### PHASE 1: MOCK SERVICES (5 files)

#### 1. frontend/web-app/src/services/trustSafetyService.ts
**Status**: BLOCKED  
**Action**: Remove mock data, add TODO comments  
**Lines to Remove**: 28, 72, 159, 196  
**Methods to Replace**: 10  
**Endpoints Needed**: 10

```
Lines 28-71: Remove mockReports array
Lines 72-158: Remove mockTrustScores array
Lines 159-195: Remove mockAccountBadges array
Lines 196-270: Remove mockVerificationChecklists array
Lines 271-308: Replace getUserReports() with TODO
Lines 309-349: Replace getModerationCases() with TODO
Lines 350-358: Replace getTrustScore() with TODO
Lines 359-367: Replace getAccountBadges() with TODO
Lines 368-395: Replace getUserWarnings() with TODO
Lines 396-404: Replace getVerificationChecklist() with TODO
Lines 405-438: Replace getSafetyMetrics() with TODO
Lines 439-468: Replace getModerationQueues() with TODO
Lines 469-480: Replace submitReport() with TODO
Lines 481-485: Replace updateReportStatus() with TODO
```

---

#### 2. frontend/web-app/src/services/travelerService.ts
**Status**: BLOCKED  
**Action**: Remove mock data, add TODO comments  
**Lines to Remove**: 22, 74  
**Methods to Replace**: 8  
**Endpoints Needed**: 8

```
Lines 22-72: Remove mockTraveler object
Lines 74-171: Remove mockTrips array
Lines 172-215: Replace getTravelerDashboard() with TODO
Lines 216-224: Replace getTravelerProfile() with TODO
Lines 225-308: Replace getTrips() with TODO
Lines 309-320: Replace createTrip() with TODO
Lines 321-335: Replace updateTripStatus() with TODO
Lines 336-346: Replace getDeliveryRequests() with TODO
Lines 347-376: Replace acceptDeliveryRequest() with TODO
Lines 377-390: Replace updateDeliveryStatus() with TODO
```

---

#### 3. frontend/web-app/src/services/refundService.ts
**Status**: BLOCKED  
**Action**: Remove mock data, add TODO comments  
**Lines to Remove**: 35, 128, 191, 251  
**Methods to Replace**: 9  
**Endpoints Needed**: 9

```
Lines 35-125: Remove mock refund requests
Lines 128-188: Remove mock chargeback cases
Lines 191-248: Remove mock refund timeline
Lines 251-308: Remove mock chargeback timeline
Lines 311-326: Replace submitRefundRequest() with TODO
Lines 328-345: Replace uploadRefundEvidence() with TODO
Lines 342-345: Replace uploadChargebackEvidence() with TODO
Lines 378-397: Replace isRefundEligible() with TODO
Lines 399-402: Replace canDisputeChargeback() with TODO
```

---

#### 4. frontend/web-app/src/services/paymentService.ts
**Status**: BLOCKED  
**Action**: Remove mock data, add TODO comments  
**Lines to Remove**: 38, 53, 82, 119, 159, 195, 237, 265  
**Methods to Replace**: 8  
**Endpoints Needed**: 8

```
Lines 38-51: Remove mock wallet balance
Lines 53-80: Remove mock payment state
Lines 82-117: Remove mock escrow holds
Lines 119-157: Remove mock transactions
Lines 159-193: Remove mock providers
Lines 195-235: Remove mock payment methods
Lines 237-263: Remove mock order summary
Lines 265-280: Remove mock finance summary
```

---

#### 5. frontend/web-app/src/services/cmsFallbackData.ts
**Status**: KEEP  
**Action**: Add comments indicating fallback-only  
**Lines to Update**: 1-10 (add comments)

```
Add comment at top:
// This file contains intentional fallback data for CMS content
// This is NOT mock data - it's used when CMS is unavailable
// Do NOT remove or modify this data
```

---

### PHASE 2: PAGE-LEVEL MOCK DATA (7 files)

#### 6. frontend/web-app/src/pages/SearchPage.tsx
**Status**: BLOCKED  
**Action**: Remove mock results, add TODO comment  
**Lines to Remove**: 33-100+  
**Endpoints Needed**: 1 (GET /search)

```
Lines 33-100+: Remove MOCK_RESULTS array
Add TODO comment:
// TODO: Implement GET /search endpoint
// BLOCKED: Backend endpoint not yet implemented
// Replace with: apiService.products.search({ q: searchTerm })
```

---

#### 7. frontend/web-app/src/pages/ProductPage.tsx
**Status**: BLOCKED  
**Action**: Remove static product, add TODO comment  
**Lines to Remove**: 16-50+  
**Endpoints Needed**: 1 (GET /auctions/:id)

```
Lines 16-50+: Remove PRODUCT constant
Add TODO comment:
// TODO: Implement GET /auctions/:id endpoint
// BLOCKED: Backend endpoint not yet implemented
// Replace with: apiService.auction.getById(auctionId)
```

---

#### 8. frontend/web-app/src/pages/WatchlistPage.tsx
**Status**: BLOCKED  
**Action**: Remove mock products, add TODO comment  
**Lines to Remove**: 15-30+  
**Endpoints Needed**: 1 (GET /watchlist)

```
Lines 15-30+: Remove mockWatchlistProducts
Add TODO comment:
// TODO: Implement GET /watchlist endpoint
// BLOCKED: Backend endpoint not yet implemented
// Replace with: apiService.users.getWatchlist()
```

---

#### 9. frontend/web-app/src/pages/seller/SellerDashboard.tsx
**Status**: BLOCKED  
**Action**: Remove mock data, add TODO comment  
**Lines to Remove**: 44, 50  
**Endpoints Needed**: 1 (GET /seller/dashboard)

```
Lines 44: Remove recentOrders mock data
Lines 50: Remove statCards mock data
Add TODO comment:
// TODO: Implement GET /seller/dashboard endpoint
// BLOCKED: Backend endpoint not yet implemented
// Replace with: apiService.seller.getDashboard()
```

---

#### 10. frontend/web-app/src/pages/seller/SellerAnalytics.tsx
**Status**: BLOCKED  
**Action**: Remove mock data, add TODO comment  
**Lines to Remove**: 16, 23, 31  
**Endpoints Needed**: 1 (GET /seller/analytics)

```
Lines 16: Remove stats mock data
Lines 23: Remove topProducts mock data
Lines 31: Remove recentActivity mock data
Add TODO comment:
// TODO: Implement GET /seller/analytics endpoint
// BLOCKED: Backend endpoint not yet implemented
// Replace with: apiService.seller.getAnalytics()
```

---

#### 11. frontend/web-app/src/pages/seller/MyListings.tsx
**Status**: BLOCKED  
**Action**: Remove mock listings, add TODO comment  
**Lines to Remove**: 29  
**Endpoints Needed**: 1 (GET /seller/listings)

```
Lines 29: Remove listings mock data
Add TODO comment:
// TODO: Implement GET /seller/listings endpoint
// BLOCKED: Backend endpoint not yet implemented
// Replace with: apiService.listing.getSellerListings()
```

---

#### 12. frontend/web-app/src/pages/CategoryPage.tsx
**Status**: BLOCKED  
**Action**: Remove mock products, add TODO comment  
**Lines to Remove**: 98  
**Endpoints Needed**: 1 (GET /categories/:id/products)

```
Lines 98: Remove mockProducts generation
Add TODO comment:
// TODO: Implement GET /categories/:id/products endpoint
// BLOCKED: Backend endpoint not yet implemented
// Replace with: apiService.category.getProducts(categoryId)
```

---

### PHASE 3: DEMO PAGES (3 files - ADD INDICATORS)

#### 13. frontend/web-app/src/pages/FulfillmentDemoPage.tsx
**Status**: KEEP  
**Action**: Add "DEMO MODE" indicator  
**Lines to Update**: 1-10 (add banner)

```
Add at top of component:
<div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
  <p className="text-yellow-700 font-bold">DEMO MODE</p>
  <p className="text-yellow-600 text-sm">This page demonstrates fulfillment options with example data</p>
</div>
```

---

#### 14. frontend/web-app/src/pages/features/WholesalePage.tsx
**Status**: KEEP  
**Action**: Add "DEMO MODE" indicator  
**Lines to Update**: 1-10 (add banner)

```
Add at top of component:
<div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
  <p className="text-yellow-700 font-bold">DEMO MODE</p>
  <p className="text-yellow-600 text-sm">This page demonstrates wholesale features with example data</p>
</div>
```

---

#### 15. frontend/web-app/src/pages/features/FraudDetectionPage.tsx
**Status**: KEEP  
**Action**: Add "DEMO MODE" indicator  
**Lines to Update**: 1-10 (add banner)

```
Add at top of component:
<div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
  <p className="text-yellow-700 font-bold">DEMO MODE</p>
  <p className="text-yellow-600 text-sm">This page demonstrates fraud detection with example data</p>
</div>
```

---

## FILES TO KEEP (4 files - NO CHANGES)

#### 1. frontend/web-app/src/pages/seller/CreateListing.tsx
**Status**: KEEP  
**Reason**: Categories and conditions are configuration data, not mock data

#### 2. frontend/web-app/src/pages/seller/EditListing.tsx
**Status**: KEEP  
**Reason**: Categories and conditions are configuration data, not mock data

#### 3. frontend/web-app/src/pages/HelpPage.tsx
**Status**: KEEP  
**Reason**: Help content is static content, not mock data

#### 4. frontend/web-app/src/pages/UnifiedDashboard.tsx
**Status**: KEEP  
**Reason**: Dashboard types are configuration data, not mock data

---

## SUMMARY

### Files to Update: 12
- Mock Services: 5 files
- Page Mock Data: 7 files

### Files to Keep: 4
- Configuration Pages: 4 files

### Demo Pages to Update: 3
- Add "DEMO MODE" indicators

### Total Changes: 15 files

---

## EXECUTION ORDER

### Step 1: Mock Services (5 files)
1. trustSafetyService.ts
2. travelerService.ts
3. refundService.ts
4. paymentService.ts
5. cmsFallbackData.ts

### Step 2: Page Mock Data (7 files)
6. SearchPage.tsx
7. ProductPage.tsx
8. WatchlistPage.tsx
9. SellerDashboard.tsx
10. SellerAnalytics.tsx
11. MyListings.tsx
12. CategoryPage.tsx

### Step 3: Demo Pages (3 files)
13. FulfillmentDemoPage.tsx
14. WholesalePage.tsx
15. FraudDetectionPage.tsx

---

## VERIFICATION

After all changes:
- [ ] No mock data in production code
- [ ] All blocked components have TODO comments
- [ ] All blocked components have console.warn() in development
- [ ] Empty states display correctly
- [ ] Loading states display correctly
- [ ] No console errors
- [ ] Demo pages have "DEMO MODE" indicators
- [ ] Configuration data preserved
- [ ] No fallback mock values
- [ ] All placeholder URLs removed

---

**Status**: ✅ READY FOR EXECUTION

