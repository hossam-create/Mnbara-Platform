# Task 2: Remove Mock Data Completely — Execution Report

**Date**: January 16, 2026  
**Task**: Production Hardening - Eliminate ALL mock data and fake services  
**Status**: ANALYSIS COMPLETE - READY FOR EXECUTION

---

## EXECUTIVE SUMMARY

Comprehensive audit of the frontend codebase identified **5 mock services**, **13 pages with mock data**, and **50+ hardcoded test items**. This report provides a complete removal plan with clear categorization of what to remove, what to keep, and what is blocked.

---

## KEY FINDINGS

### Mock Services (5 Total)
1. **trustSafetyService.ts** - 4 mock arrays, 10 mock methods
2. **travelerService.ts** - 2 mock objects, 8 mock methods
3. **refundService.ts** - 3 mock arrays, 5 mock methods
4. **paymentService.ts** - 8 mock data sets, 8 mock methods
5. **cmsFallbackData.ts** - 4 static arrays (KEEP - intentional fallback)

### Pages with Mock Data (13 Total)
- **REMOVE**: SearchPage, ProductPage, WatchlistPage, SellerDashboard, SellerAnalytics, MyListings, CategoryPage (7 pages)
- **KEEP**: FulfillmentDemoPage, CreateListing, EditListing, HelpPage, UnifiedDashboard, WholesalePage, FraudDetectionPage (6 pages - demo/config)

### Hardcoded Test Items
- 50+ hardcoded products, orders, stats, activities
- 10+ placeholder URLs and demo values
- 20+ mock data arrays

---

## REMOVAL STRATEGY

### Strategy 1: Remove & Replace with API Calls
**For**: Components with corresponding backend endpoints

**Process**:
1. Remove mock data array/object
2. Replace with API call using apiService
3. Add loading state
4. Add error state
5. Add empty state

**Example**:
```typescript
// BEFORE
const MOCK_RESULTS = [{ id: '1', title: 'iPhone' }, ...];
return MOCK_RESULTS;

// AFTER
const [results, setResults] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  apiService.products.search({ q: searchTerm })
    .then(data => setResults(data))
    .catch(error => console.error(error))
    .finally(() => setLoading(false));
}, [searchTerm]);

if (loading) return <LoadingSpinner />;
if (results.length === 0) return <EmptyState />;
return <ResultsList results={results} />;
```

### Strategy 2: Mark as BLOCKED with TODO
**For**: Components without corresponding backend endpoints

**Process**:
1. Remove mock data
2. Add TODO comment with endpoint needed
3. Show empty state
4. Add console warning in development

**Example**:
```typescript
// TODO: Implement GET /trust/reports endpoint
// BLOCKED: Backend endpoint not yet implemented
// This component will display empty state until endpoint is available

const [reports, setReports] = useState([]);

useEffect(() => {
  // TODO: Replace with actual API call
  // const data = await apiService.trust.getReports();
  // setReports(data);
  
  console.warn('trustSafetyService.getUserReports() is blocked - backend endpoint missing');
}, []);

return <EmptyState message="Reports not available yet" />;
```

### Strategy 3: Keep As-Is
**For**: Configuration data, static content, intentional demo pages

**Process**:
1. Keep existing data
2. Add clear comments
3. Add "DEMO MODE" indicator if applicable

**Example**:
```typescript
// Configuration data - not mock data
const CATEGORIES = [
  { id: 'electronics', name: 'Electronics' },
  { id: 'fashion', name: 'Fashion' },
];

// Demo page - intentional demonstration
// Add banner: "This is a demo page with example data"
```

---

## FILES TO MODIFY

### Phase 1: Mock Services (5 files)

#### 1. trustSafetyService.ts
**Changes**:
- Remove mockReports array (line 28)
- Remove mockTrustScores array (line 72)
- Remove mockAccountBadges array (line 159)
- Remove mockVerificationChecklists array (line 196)
- Replace all methods with TODO comments and empty returns
- Add console.warn() for development

**Lines Affected**: 28, 72, 159, 196, 271, 309, 350, 359, 368, 396, 405, 439, 469, 481

**Blocked Methods**: 10

---

#### 2. travelerService.ts
**Changes**:
- Remove mockTraveler object (line 22)
- Remove mockTrips array (line 74)
- Replace all methods with TODO comments and empty returns
- Add console.warn() for development

**Lines Affected**: 22, 74, 172, 216, 225, 309, 321, 336, 347, 377

**Blocked Methods**: 8

---

#### 3. refundService.ts
**Changes**:
- Remove mock refund requests (line 35)
- Remove mock chargeback cases (line 128)
- Remove mock timelines (line 191, 251)
- Replace all methods with TODO comments and empty returns
- Add console.warn() for development

**Lines Affected**: 35, 128, 191, 251, 311, 328, 342, 378, 399

**Blocked Methods**: 9

---

#### 4. paymentService.ts
**Changes**:
- Remove all mock data (lines 38, 53, 82, 119, 159, 195, 237, 265)
- Replace all methods with TODO comments and empty returns
- Add console.warn() for development

**Lines Affected**: 38, 53, 82, 119, 159, 195, 237, 265

**Blocked Methods**: 8

---

#### 5. cmsFallbackData.ts
**Changes**:
- Add comments indicating this is intentional fallback data
- No removal needed

**Status**: KEEP

---

### Phase 2: Page-Level Mock Data (7 files)

#### 1. SearchPage.tsx
**Changes**:
- Remove MOCK_RESULTS array (line 33)
- Add TODO comment for GET /search endpoint
- Implement empty state
- Add loading state

**Lines Affected**: 33-100+

**Status**: BLOCKED

---

#### 2. ProductPage.tsx
**Changes**:
- Remove PRODUCT constant (line 16)
- Add TODO comment for GET /auctions/:id endpoint
- Implement empty state
- Add loading state

**Lines Affected**: 16-50+

**Status**: BLOCKED

---

#### 3. WatchlistPage.tsx
**Changes**:
- Remove mockWatchlistProducts (line 15)
- Add TODO comment for GET /watchlist endpoint
- Implement empty state
- Add loading state

**Lines Affected**: 15-30+

**Status**: BLOCKED

---

#### 4. SellerDashboard.tsx
**Changes**:
- Remove recentOrders mock data (line 44)
- Remove statCards mock data (line 50)
- Add TODO comment for GET /seller/dashboard endpoint
- Implement empty state
- Add loading state

**Lines Affected**: 44, 50

**Status**: BLOCKED

---

#### 5. SellerAnalytics.tsx
**Changes**:
- Remove stats mock data (line 16)
- Remove topProducts mock data (line 23)
- Remove recentActivity mock data (line 31)
- Add TODO comment for GET /seller/analytics endpoint
- Implement empty state
- Add loading state

**Lines Affected**: 16, 23, 31

**Status**: BLOCKED

---

#### 6. MyListings.tsx
**Changes**:
- Remove listings mock data (line 29)
- Add TODO comment for GET /seller/listings endpoint
- Implement empty state
- Add loading state

**Lines Affected**: 29

**Status**: BLOCKED

---

#### 7. CategoryPage.tsx
**Changes**:
- Remove mockProducts generation (line 98)
- Add TODO comment for GET /categories/:id/products endpoint
- Implement empty state
- Add loading state

**Lines Affected**: 98

**Status**: BLOCKED

---

### Phase 3: Demo Pages (3 files - KEEP with indicators)

#### 1. FulfillmentDemoPage.tsx
**Changes**:
- Add "DEMO MODE" banner at top
- Add comment: "This page demonstrates fulfillment options with example data"
- Keep mock products as examples

**Status**: KEEP

---

#### 2. WholesalePage.tsx
**Changes**:
- Add "DEMO MODE" banner at top
- Add comment: "This page demonstrates wholesale features with example data"
- Keep mock products as examples

**Status**: KEEP

---

#### 3. FraudDetectionPage.tsx
**Changes**:
- Add "DEMO MODE" banner at top
- Add comment: "This page demonstrates fraud detection with example data"
- Keep mock activities as examples

**Status**: KEEP

---

### Phase 4: Configuration Pages (4 files - KEEP)

#### 1. CreateListing.tsx
**Status**: KEEP - Categories and conditions are configuration

---

#### 2. EditListing.tsx
**Status**: KEEP - Categories and conditions are configuration

---

#### 3. HelpPage.tsx
**Status**: KEEP - Help content is static

---

#### 4. UnifiedDashboard.tsx
**Status**: KEEP - Dashboard types are configuration

---

## BLOCKED COMPONENTS SUMMARY

### Services Blocked (4 services, 35 methods)
1. **trustSafetyService** - 10 methods blocked
   - getUserReports() → TODO: GET /trust/reports
   - getModerationCases() → TODO: GET /trust/moderation-cases
   - getTrustScore() → TODO: GET /trust/score/:userId
   - getAccountBadges() → TODO: GET /trust/badges/:userId
   - getUserWarnings() → TODO: GET /trust/warnings/:userId
   - getVerificationChecklist() → TODO: GET /trust/verification/:userId
   - getSafetyMetrics() → TODO: GET /trust/metrics
   - getModerationQueues() → TODO: GET /trust/moderation-queues
   - submitReport() → TODO: POST /trust/reports
   - updateReportStatus() → TODO: PUT /trust/reports/:id

2. **travelerService** - 8 methods blocked
   - getTravelerDashboard() → TODO: GET /traveler/dashboard
   - getTravelerProfile() → TODO: GET /traveler/profile/:id
   - getTrips() → TODO: GET /traveler/trips
   - createTrip() → TODO: POST /traveler/trips
   - updateTripStatus() → TODO: PUT /traveler/trips/:id/status
   - getDeliveryRequests() → TODO: GET /traveler/trips/:id/requests
   - acceptDeliveryRequest() → TODO: POST /traveler/requests/:id/accept
   - updateDeliveryStatus() → TODO: PUT /traveler/requests/:id/status

3. **refundService** - 9 methods blocked
   - getRefundRequests() → TODO: GET /refunds
   - getChargebackCases() → TODO: GET /chargebacks
   - getRefundTimeline() → TODO: GET /refunds/:id/timeline
   - getChargebackTimeline() → TODO: GET /chargebacks/:id/timeline
   - submitRefundRequest() → TODO: POST /refunds
   - uploadRefundEvidence() → TODO: POST /refunds/:id/evidence
   - uploadChargebackEvidence() → TODO: POST /chargebacks/:id/evidence
   - isRefundEligible() → TODO: GET /refunds/eligibility
   - canDisputeChargeback() → TODO: GET /chargebacks/:id/dispute-eligibility

4. **paymentService** - 8 methods blocked
   - getWalletBalance() → TODO: GET /wallet/balance
   - getPaymentState() → TODO: GET /payments/:id/state
   - getEscrowHolds() → TODO: GET /escrow/holds
   - getWalletTransactions() → TODO: GET /wallet/transactions
   - getPaymentProviders() → TODO: GET /payments/providers
   - getPaymentMethods() → TODO: GET /payments/methods
   - getOrderPaymentSummary() → TODO: GET /orders/:id/payment-summary
   - getControlCenterFinanceSummary() → TODO: GET /control-center/finance-summary

### Pages Blocked (7 pages, 7 endpoints)
1. **SearchPage.tsx** → TODO: GET /search
2. **ProductPage.tsx** → TODO: GET /auctions/:id
3. **WatchlistPage.tsx** → TODO: GET /watchlist
4. **SellerDashboard.tsx** → TODO: GET /seller/dashboard
5. **SellerAnalytics.tsx** → TODO: GET /seller/analytics
6. **MyListings.tsx** → TODO: GET /seller/listings
7. **CategoryPage.tsx** → TODO: GET /categories/:id/products

---

## IMPLEMENTATION APPROACH

### Step 1: Remove Mock Data
- Delete all mock data arrays and objects
- Delete all hardcoded test values
- Delete all placeholder URLs

### Step 2: Add TODO Comments
- Add TODO comment for each blocked method
- Include endpoint path needed
- Add console.warn() for development

### Step 3: Implement Empty States
- Create empty state UI for each component
- Show message: "Data not available yet"
- Add loading spinner while fetching

### Step 4: Add Demo Mode Indicators
- Add "DEMO MODE" banner to demo pages
- Add comments indicating example data
- Keep demo data for demonstration purposes

### Step 5: Verify No Fallback Values
- Ensure no fallback mock values
- Ensure no default numbers
- Ensure empty state > fake data

---

## EXPECTED OUTCOMES

### Before
- 50+ hardcoded test items
- 5 mock services with complete implementations
- 13 pages with inline mock data
- Fake financial data, trust scores, traveler earnings
- Placeholder URLs and demo values

### After
- 0 hardcoded test items in production code
- 4 mock services replaced with TODO comments
- 7 pages with empty states
- 6 demo pages with clear "DEMO MODE" indicators
- 4 configuration pages unchanged
- All blocked components clearly marked

---

## RISK ASSESSMENT

### Low Risk
- Removing mock data from demo pages (FulfillmentDemoPage, WholesalePage, FraudDetectionPage)
- Removing configuration data (categories, conditions, help content)
- Removing placeholder URLs

### Medium Risk
- Removing mock data from dashboard pages (may affect UI testing)
- Removing mock data from search/product pages (may affect user experience)

### High Risk
- Removing financial data (paymentService, refundService)
- Removing trust/safety data (trustSafetyService)
- Removing traveler earnings data (travelerService)

**Mitigation**: Add clear empty states and loading indicators

---

## VERIFICATION CHECKLIST

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

## NEXT STEPS

1. **Execute Phase 1**: Remove mock services (trustSafetyService, travelerService, refundService, paymentService)
2. **Execute Phase 2**: Remove page mock data (SearchPage, ProductPage, WatchlistPage, etc.)
3. **Execute Phase 3**: Add demo mode indicators and verify
4. **Verify**: Run tests and check for console errors
5. **Deploy**: Deploy to staging and verify functionality

---

## CONCLUSION

This comprehensive removal plan eliminates all mock data from the frontend while preserving intentional demo pages and configuration data. All blocked components are clearly marked with TODO comments indicating which backend endpoints need to be implemented.

**Status**: ✅ ANALYSIS COMPLETE - READY FOR EXECUTION

**Estimated Effort**: 8-10 hours  
**Timeline**: 1-2 days  
**Team**: 1-2 frontend engineers

---

**Report Generated**: January 16, 2026  
**Audit Completed**: MOCK_DATA_AUDIT_REPORT.md  
**Removal Plan**: MOCK_DATA_REMOVAL_PLAN.md

