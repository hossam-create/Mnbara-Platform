# Frontend Mock Data & Dummy Services Audit Report

**Generated:** 2025-01-17  
**Scope:** `frontend/web-app/src/services/` and `frontend/web-app/src/pages/`  
**Status:** Comprehensive audit completed

---

## Executive Summary

This report documents all mock data, dummy data, fake services, hardcoded test data, and placeholder values found in the frontend codebase. The audit identified **15 primary files** with mock implementations and **20+ secondary files** with hardcoded test data.

### Key Findings:
- **Mock Services:** 5 major services with complete mock implementations
- **Mock Data Arrays:** 20+ static arrays with hardcoded test data
- **Demo Pages:** 6 pages with demonstration/example data
- **Hardcoded Test Data:** 10+ pages with inline mock data
- **Placeholder Values:** Multiple pages with example URLs and test values

---

## PART 1: MOCK SERVICE IMPLEMENTATIONS

### 1. Trust & Safety Service
**File:** `frontend/web-app/src/services/trustSafetyService.ts`

#### Mock Data Arrays:
- **Line 28:** `mockReports: UserReport[]` - 3 hardcoded user reports
  - report_001: Inappropriate content report
  - report_002: Fraudulent listing report
  - report_003: Harassment report

- **Line 72:** `mockTrustScores: TrustScore[]` - 2 hardcoded trust scores
  - user_001: High trust score (85.5)
  - user_002: Low trust score (45.2)

- **Line 159:** `mockAccountBadges: AccountBadge[]` - 3 hardcoded badges
  - badge_001: Verified User badge
  - badge_002: Trusted Traveler badge
  - badge_003: Warning badge

- **Line 196:** `mockVerificationChecklists: VerificationChecklist[]` - 1 hardcoded checklist
  - user_001: Complete verification checklist with 5 items

#### Mock Methods:
- **Line 271:** `getUserReports()` - Returns filtered mock reports with simulated 200ms delay
- **Line 309:** `getModerationCases()` - Generates mock cases from mock reports
- **Line 350:** `getTrustScore()` - Returns mock trust score for user_001
- **Line 359:** `getAccountBadges()` - Returns mock badges filtered by userId
- **Line 368:** `getUserWarnings()` - Generates mock warnings based on mock badges
- **Line 396:** `getVerificationChecklist()` - Returns mock verification checklist
- **Line 405:** `getSafetyMetrics()` - Calculates metrics from mock data
- **Line 439:** `getModerationQueues()` - Returns mock moderation queues
- **Line 469:** `submitReport()` - Adds to mock data (UI only)
- **Line 481:** `updateReportStatus()` - Updates mock data (UI only)

---

### 2. Traveler Service
**File:** `frontend/web-app/src/services/travelerService.ts`

#### Mock Data Objects:
- **Line 22:** `mockTraveler: Traveler` - Complete traveler profile
  - id: 'traveler_001'
  - name: 'Ahmed Hassan'
  - email: 'ahmed.hassan@mnbara.com'
  - 2 hardcoded routes (Cairo-Dubai, Dubai-Riyadh)
  - Hardcoded stats: 127 completed orders, 15420.50 total earnings

- **Line 74:** `mockTrips: Trip[]` - 2 hardcoded trips
  - trip_001: Cairo to Dubai (PUBLISHED status)
    - 1 accepted delivery request with timeline
  - trip_002: Dubai to Riyadh (DRAFT status)

#### Mock Methods:
- **Line 172:** `getTravelerDashboard()` - Returns mock traveler data with hardcoded stats
- **Line 216:** `getTravelerProfile()` - Returns mock traveler for 'traveler_001'
- **Line 225:** `getTrips()` - Returns filtered mock trips with pagination
- **Line 309:** `createTrip()` - Adds to mock trips array (UI only)
- **Line 321:** `updateTripStatus()` - Updates mock trip status (UI only)
- **Line 336:** `getDeliveryRequests()` - Returns mock delivery requests
- **Line 347:** `acceptDeliveryRequest()` - Updates mock request status (UI only)
- **Line 377:** `updateDeliveryStatus()` - Updates mock delivery status (UI only)

---

### 3. Refund Service
**File:** `frontend/web-app/src/services/refundService.ts`

#### Mock Data Arrays:
- **Line 35:** `getRefundRequests()` - Returns 3 hardcoded refund requests
  - refund_1: UNDER_REVIEW status, $299.99
  - refund_2: APPROVED status, $150.00
  - refund_3: REJECTED status, $75.00

- **Line 128:** `getChargebackCases()` - Returns 2 hardcoded chargeback cases
  - chargeback_1: UNDER_REVIEW status, $500.00
  - chargeback_2: RESOLVED_SELLER status, $200.00

- **Line 191:** `getRefundTimeline()` - Returns 4 hardcoded timeline events
- **Line 251:** `getChargebackTimeline()` - Returns 4 hardcoded timeline events

#### Mock Methods:
- **Line 311:** `submitRefundRequest()` - Creates mock refund (UI only)
- **Line 328:** `uploadRefundEvidence()` - Mock file upload (UI only)
- **Line 342:** `uploadChargebackEvidence()` - Mock file upload (UI only)
- **Line 378:** `isRefundEligible()` - Mock eligibility logic
- **Line 399:** `canDisputeChargeback()` - Mock dispute logic

---

### 4. Payment Service
**File:** `frontend/web-app/src/services/paymentService.ts`

#### Mock Data:
- **Line 38:** `getWalletBalance()` - Returns hardcoded wallet balance
  - available: $1250.75
  - held: $450.00
  - pending: $75.25

- **Line 53:** `getPaymentState()` - Returns hardcoded payment state
  - status: COMPLETED
  - amount: $299.99

- **Line 82:** `getEscrowHolds()` - Returns 2 hardcoded escrow holds
  - esc_1: HELD status, $299.99
  - esc_2: RELEASED status, $150.00

- **Line 119:** `getWalletTransactions()` - Returns 3 hardcoded transactions
- **Line 159:** `getPaymentProviders()` - Returns 2 hardcoded providers (Stripe, Paymob)
- **Line 195:** `getPaymentMethods()` - Returns 3 hardcoded payment methods
- **Line 237:** `getOrderPaymentSummary()` - Returns hardcoded order payment summary
- **Line 265:** `getControlCenterFinanceSummary()` - Returns hardcoded finance metrics

---

### 5. CMS Fallback Data
**File:** `frontend/web-app/src/services/cmsFallbackData.ts`

#### Static Mock Data Arrays:
- **Line 3:** `HERO_SLIDES` - 4 hardcoded hero banner slides
- **Line 38:** `DEALS_PRODUCTS` - 5 hardcoded deal products
  - iPhone 15 Pro Max: $949.99
  - PlayStation 5: $449.99
  - Samsung 65" TV: $1497.99
  - MacBook Pro 14": $1649.00
  - Dyson V15: $549.99

- **Line 101:** `CATEGORIES` - 6 hardcoded categories
- **Line 110:** `CORE_VALUES` - 4 hardcoded core values
- **Line 119:** `FALLBACK_HOMEPAGE_DATA` - Complete fallback homepage structure

---

## PART 2: MOCK DATA IN PAGES

### Demo/Example Pages

#### 1. FulfillmentDemoPage
**File:** `frontend/web-app/src/pages/FulfillmentDemoPage.tsx`

- **Line 11:** `mockProducts` - 3 hardcoded products
  - prod-glass-vase: Fragile item, 15000 EGP
  - prod-furniture-sofa: Oversized item, 250000 EGP
  - prod-book: Standard item, 8000 EGP

#### 2. WatchlistPage
**File:** `frontend/web-app/src/pages/WatchlistPage.tsx`

- **Line 15:** `mockWatchlistProducts` - 2 hardcoded watchlist products
  - iPhone 14 Pro Max: $1099
  - MacBook Air M2: $1399

#### 3. SearchPage
**File:** `frontend/web-app/src/pages/SearchPage.tsx`

- **Line 33:** `MOCK_RESULTS` - 8 hardcoded search results
  - iPhone 15 Pro Max: $1049.99
  - PlayStation 5: $549.99
  - MacBook Pro 14": $1699.00
  - Nike Air Jordan 1: $289.99
  - Samsung 65" TV: $1897.99
  - Dyson V15: $549.99
  - Canon EOS R6: $2199.00
  - Vintage Rolex: $8500.00

---

### Seller Dashboard Pages

#### 4. SellerDashboard
**File:** `frontend/web-app/src/pages/seller/SellerDashboard.tsx`

- **Line 44:** `recentOrders` - 3 hardcoded recent orders
  - ORD-001: iPhone 15 Pro, 4999 SAR, pending
  - ORD-002: MacBook Air M3, 5499 SAR, shipped
  - ORD-003: AirPods Pro, 899 SAR, delivered

- **Line 50:** `statCards` - 4 hardcoded stat cards
  - Total Revenue: 45,680 SAR
  - Total Sales: 156
  - Active Listings: 24
  - Total Views: 3,420

#### 5. SellerAnalytics
**File:** `frontend/web-app/src/pages/seller/SellerAnalytics.tsx`

- **Line 16:** `stats` - 4 hardcoded analytics stats
- **Line 23:** `topProducts` - 5 hardcoded top products
  - iPhone 15 Pro Max: 45 sales, 224,955 revenue
  - MacBook Air M3: 28 sales, 153,972 revenue
  - AirPods Pro: 67 sales, 60,233 revenue
  - iPad Pro 12.9": 12 sales, 51,588 revenue
  - Apple Watch Ultra: 8 sales, 25,592 revenue

- **Line 31:** `recentActivity` - 4 hardcoded activity items

#### 6. MyListings
**File:** `frontend/web-app/src/pages/seller/MyListings.tsx`

- **Line 29:** `listings` - 2 hardcoded listings
  - iPhone 15 Pro Max 256GB: 4999 SAR
  - MacBook Air M3 15": 5499 SAR

#### 7. CreateListing
**File:** `frontend/web-app/src/pages/seller/CreateListing.tsx`

- **Line 41:** `categories` - 10 hardcoded product categories
- **Line 46:** `conditions` - 4 hardcoded product conditions

#### 8. EditListing
**File:** `frontend/web-app/src/pages/seller/EditListing.tsx`

- **Line 25:** `categories` - 10 hardcoded product categories
- **Line 26:** `conditions` - 4 hardcoded product conditions

---

### Other Pages with Mock Data

#### 9. HelpPage
**File:** `frontend/web-app/src/pages/HelpPage.tsx`

- **Line 37:** `helpCategories` - Multiple hardcoded help categories with FAQs

#### 10. UnifiedDashboard
**File:** `frontend/web-app/src/pages/UnifiedDashboard.tsx`

- **Line 5:** `dashboardTypes` - Hardcoded dashboard type options

#### 11. CategoryPage
**File:** `frontend/web-app/src/pages/CategoryPage.tsx`

- **Line 60:** `conditionOptions` - Hardcoded condition filter options
- **Line 89:** `subcategories` - Hardcoded subcategories for each category
- **Line 98:** `mockProducts` - Generated mock products (12 items)

#### 12. WholesalePage
**File:** `frontend/web-app/src/pages/features/WholesalePage.tsx`

- **Line 23:** `categories` - 5 hardcoded wholesale categories
- **Line 25:** `products` - 5 hardcoded wholesale products

#### 13. FraudDetectionPage
**File:** `frontend/web-app/src/pages/features/FraudDetectionPage.tsx`

- **Line 12:** `recentActivity` - 4 hardcoded activity items

---

## PART 3: HARDCODED TEST DATA & PLACEHOLDER VALUES

### Placeholder URLs & Example Data

| File | Line | Type | Value |
|------|------|------|-------|
| FulfillmentDemoPage.tsx | 18 | Image URL | `https://example.com/vase.jpg` |
| FulfillmentDemoPage.tsx | 26 | Image URL | `https://example.com/sofa.jpg` |
| FulfillmentDemoPage.tsx | 34 | Image URL | `https://example.com/books.jpg` |
| AdEditor.tsx | 211 | Placeholder | `https://example.com/product` |
| TravelerEditor.tsx | 163 | Placeholder | `traveler@example.com` |
| TravelerEditor.tsx | 192 | Placeholder | `https://example.com/avatar.jpg` |
| SecurityEventLoggingDemo.tsx | 27 | Demo Email | `demo@example.com` |
| SecurityEventLoggingDemo.tsx | 28 | Demo Payment ID | `pi_demo_123` |
| SecurityEventLoggingDemo.tsx | 29 | Demo Amount | `100.00` |
| SecurityEventLoggingDemo.tsx | 32 | Demo Metadata | `{"endpoint": "/api/demo"}` |

---

## PART 4: MOCK IMPLEMENTATION PATTERNS

### Pattern 1: Service-Level Mock Data
Services define mock data at module level and return it from async methods with simulated delays:

```typescript
// Example from trustSafetyService.ts
const mockReports: UserReport[] = [/* data */];

async getUserReports() {
  await new Promise(resolve => setTimeout(resolve, 200)); // Simulated delay
  return mockReports;
}
```

### Pattern 2: UI-Only Operations
Mock services include comments indicating operations are UI-only:

```typescript
// Example from travelerService.ts
// Add to mock data (UI only)
mockTrips.push(newTrip);
```

### Pattern 3: Hardcoded Component Data
Pages define mock data inline in component state:

```typescript
// Example from SellerDashboard.tsx
const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([
  { id: 'ORD-001', product: 'iPhone 15 Pro', ... }
]);
```

### Pattern 4: Static Arrays
Fallback data and configuration stored as module-level constants:

```typescript
// Example from cmsFallbackData.ts
export const HERO_SLIDES = [/* data */];
export const DEALS_PRODUCTS = [/* data */];
```

---

## PART 5: SUMMARY BY CATEGORY

### Mock Services (Complete Implementations)
1. **trustSafetyService.ts** - 4 mock arrays, 10 mock methods
2. **travelerService.ts** - 2 mock objects, 8 mock methods
3. **refundService.ts** - 3 mock arrays, 5 mock methods
4. **paymentService.ts** - 8 mock data sets, 8 mock methods
5. **cmsFallbackData.ts** - 4 static arrays, 1 fallback structure

### Demo/Example Pages
1. **FulfillmentDemoPage.tsx** - 3 mock products
2. **WatchlistPage.tsx** - 2 mock products
3. **SearchPage.tsx** - 8 mock search results

### Dashboard Pages with Mock Data
1. **SellerDashboard.tsx** - 7 mock items (orders + stats)
2. **SellerAnalytics.tsx** - 13 mock items (stats + products + activity)
3. **MyListings.tsx** - 2 mock listings
4. **CreateListing.tsx** - 14 mock items (categories + conditions)
5. **EditListing.tsx** - 14 mock items (categories + conditions)

### Other Pages with Mock Data
1. **HelpPage.tsx** - Multiple help categories
2. **UnifiedDashboard.tsx** - Dashboard type options
3. **CategoryPage.tsx** - 12 generated mock products
4. **WholesalePage.tsx** - 5 mock wholesale products
5. **FraudDetectionPage.tsx** - 4 mock activity items

---

## PART 6: RECOMMENDATIONS

### Immediate Actions
1. **Document Mock Data Clearly** - Add comments indicating which data is mock/demo
2. **Separate Mock Services** - Consider moving mock implementations to separate files
3. **Add Feature Flags** - Use feature flags to toggle between mock and real services
4. **Update Placeholder URLs** - Replace example.com URLs with actual CDN/asset URLs

### Medium-Term Actions
1. **Create Mock Data Factory** - Centralize mock data generation
2. **Implement Service Abstraction** - Create interface for switching between mock/real services
3. **Add Environment Configuration** - Use environment variables to control mock vs. real
4. **Document API Contracts** - Ensure mock data matches real API responses

### Long-Term Actions
1. **Remove Mock Services** - Replace with real backend integration
2. **Implement API Mocking Library** - Use MSW (Mock Service Worker) for consistent mocking
3. **Add Integration Tests** - Test with both mock and real services
4. **Monitor Data Consistency** - Ensure mock data stays in sync with backend

---

## PART 7: RISK ASSESSMENT

### Low Risk
- Static fallback data (cmsFallbackData.ts)
- Demo pages (FulfillmentDemoPage.tsx)
- Placeholder URLs in forms

### Medium Risk
- Mock data in dashboard pages (could confuse users if not clearly marked)
- Hardcoded test data in component state
- Mock service methods that modify state

### High Risk
- Mock services that return financial data (paymentService.ts, refundService.ts)
- Mock trust/safety data (trustSafetyService.ts)
- Mock traveler earnings data (travelerService.ts)

**Recommendation:** Add clear UI indicators (e.g., "Demo Mode" banner) when mock services are active.

---

## APPENDIX: FILE LISTING

### Services with Mock Data
- `frontend/web-app/src/services/trustSafetyService.ts`
- `frontend/web-app/src/services/travelerService.ts`
- `frontend/web-app/src/services/refundService.ts`
- `frontend/web-app/src/services/paymentService.ts`
- `frontend/web-app/src/services/cmsFallbackData.ts`

### Pages with Mock Data
- `frontend/web-app/src/pages/FulfillmentDemoPage.tsx`
- `frontend/web-app/src/pages/WatchlistPage.tsx`
- `frontend/web-app/src/pages/SearchPage.tsx`
- `frontend/web-app/src/pages/seller/SellerDashboard.tsx`
- `frontend/web-app/src/pages/seller/SellerAnalytics.tsx`
- `frontend/web-app/src/pages/seller/MyListings.tsx`
- `frontend/web-app/src/pages/seller/CreateListing.tsx`
- `frontend/web-app/src/pages/seller/EditListing.tsx`
- `frontend/web-app/src/pages/HelpPage.tsx`
- `frontend/web-app/src/pages/UnifiedDashboard.tsx`
- `frontend/web-app/src/pages/CategoryPage.tsx`
- `frontend/web-app/src/pages/features/WholesalePage.tsx`
- `frontend/web-app/src/pages/features/FraudDetectionPage.tsx`

---

**Report End**
