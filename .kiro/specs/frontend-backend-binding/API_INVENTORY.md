# API Inventory & Mapping — Phase 7.1 Frontend ↔ Backend Binding

**Date**: January 16, 2026  
**Status**: DRAFT - Comprehensive Scan Required  
**Objective**: Create definitive API inventory for frontend-backend binding without mock APIs

---

## EXECUTIVE SUMMARY

This document provides a complete mapping of:
- **Frontend Screens/Pages**: All React components displaying dynamic data
- **Backend Services**: Available microservices and their endpoints
- **Data Requirements**: Fields needed for each screen
- **API Endpoints**: Real backend endpoints (no mocks)
- **Authentication**: Required auth for each endpoint

---

## FRONTEND SCREENS INVENTORY

### 1. AUTHENTICATION & USER MANAGEMENT

| Screen | Component Path | Required Data | Backend Service | Endpoint | Method | Auth |
|--------|---|---|---|---|---|---|
| Login | `src/pages/auth/LoginPage.tsx` | email, password | auth-service | `POST /auth/login` | POST | N |
| Register | `src/pages/auth/RegisterPage.tsx` | email, password, name, phone | auth-service | `POST /auth/register` | POST | N |
| Forgot Password | `src/pages/auth/ForgotPasswordPage.tsx` | email | auth-service | `POST /auth/forgot-password` | POST | N |
| Profile | `src/pages/ProfilePage.tsx` | user data, avatar, bio | auth-service | `GET /auth/profile` | GET | Y |
| Settings | `src/pages/SettingsPage.tsx` | preferences, notifications, privacy | auth-service | `GET /auth/settings` | GET | Y |

### 2. WALLET & PAYMENTS

| Screen | Component Path | Required Data | Backend Service | Endpoint | Method | Auth |
|--------|---|---|---|---|---|---|
| Wallet Dashboard | `src/pages/wallet/WalletPage.tsx` | balance, transactions, history | wallet-service | `GET /wallet/balance` | GET | Y |
| Wallet Ledger | `src/components/wallet/LedgerTable.tsx` | transaction history, filters | wallet-service | `GET /wallet/ledger` | GET | Y |
| Balance Display | `src/components/wallet/BalanceDisplay.tsx` | current balance, currency | wallet-service | `GET /wallet/balance` | GET | Y |
| Add Funds | `src/pages/wallet/AddFundsPage.tsx` | amount, payment method | payment-service | `POST /payments/deposit` | POST | Y |
| Withdraw Funds | `src/pages/wallet/WithdrawPage.tsx` | amount, bank details | payment-service | `POST /payments/withdraw` | POST | Y |
| Transaction History | `src/pages/wallet/TransactionHistoryPage.tsx` | transactions, filters, pagination | wallet-service | `GET /wallet/transactions` | GET | Y |

### 3. AUCTIONS

| Screen | Component Path | Required Data | Backend Service | Endpoint | Method | Auth |
|--------|---|---|---|---|---|---|
| Auction List | `src/pages/SearchPage.tsx` | auctions, filters, pagination | auction-service | `GET /auctions` | GET | N |
| Auction Details | `src/pages/ProductPage.tsx` | auction data, bids, seller info | auction-service | `GET /auctions/:id` | GET | N |
| Create Auction | `src/pages/SellPage.tsx` | item details, reserve price, duration | auction-service | `POST /auctions` | POST | Y |
| Place Bid | `src/components/auction/BidForm.tsx` | bid amount, auction id | auction-service | `POST /auctions/:id/bids` | POST | Y |
| Auction History | `src/pages/orders/AuctionHistoryPage.tsx` | user auctions, status | auction-service | `GET /auctions/user/:userId` | GET | Y |
| Active Auctions | `src/pages/seller/ActiveAuctionsPage.tsx` | seller auctions, status | auction-service | `GET /auctions/seller/:userId` | GET | Y |

### 4. ORDERS & FULFILLMENT

| Screen | Component Path | Required Data | Backend Service | Endpoint | Method | Auth |
|--------|---|---|---|---|---|---|
| Orders List | `src/pages/OrdersPage.tsx` | orders, status, filters | orders-service | `GET /orders` | GET | Y |
| Order Details | `src/pages/orders/OrderDetailsPage.tsx` | order data, items, tracking | orders-service | `GET /orders/:id` | GET | Y |
| Checkout | `src/pages/CheckoutPage.tsx` | cart items, shipping, payment | orders-service | `POST /orders` | POST | Y |
| Fulfillment Options | `src/pages/FulfillmentDemoPage.tsx` | fulfillment methods, costs | smart-delivery-service | `GET /fulfillment/options` | GET | Y |
| Shipping Tracking | `src/components/orders/TrackingComponent.tsx` | tracking data, status | smart-delivery-service | `GET /fulfillment/tracking/:id` | GET | Y |

### 5. DISPUTES & APPEALS

| Screen | Component Path | Required Data | Backend Service | Endpoint | Method | Auth |
|--------|---|---|---|---|---|---|
| Disputes List | `src/pages/control-center/DisputesPage.tsx` | disputes, status, filters | auction-service | `GET /disputes` | GET | Y |
| Dispute Details | `src/components/disputes/DisputeDetailsModal.tsx` | dispute data, messages, evidence | auction-service | `GET /disputes/:id` | GET | Y |
| Create Dispute | `src/components/disputes/CreateDisputeForm.tsx` | reason, evidence, description | auction-service | `POST /disputes` | POST | Y |
| Appeal | `src/components/disputes/AppealForm.tsx` | appeal reason, evidence | auction-service | `POST /disputes/:id/appeal` | POST | Y |

### 6. TRUST & SAFETY

| Screen | Component Path | Required Data | Backend Service | Endpoint | Method | Auth |
|--------|---|---|---|---|---|---|
| Trust Score | `src/components/trustSafety/TrustScoreDisplay.tsx` | trust score, breakdown | auction-service | `GET /trust/score/:userId` | GET | N |
| Safeguards | `src/components/trustSafety/SafeguardsPanel.tsx` | safeguard status, limits | auction-service | `GET /safeguards/:userId` | GET | Y |
| Trust Actions | `src/pages/control-center/TrustActionsPage.tsx` | actions, status, history | auction-service | `GET /trust-actions` | GET | Y |
| Appeal Review | `src/pages/control-center/AppealReviewPage.tsx` | appeals, status | auction-service | `GET /appeals` | GET | Y |

### 7. SEARCH & DISCOVERY

| Screen | Component Path | Required Data | Backend Service | Endpoint | Method | Auth |
|--------|---|---|---|---|---|---|
| Search Results | `src/pages/SearchPage.tsx` | results, filters, pagination | listing-service | `GET /search` | GET | N |
| Category Browse | `src/pages/CategoryPage.tsx` | categories, items, filters | category-service | `GET /categories` | GET | N |
| Watchlist | `src/pages/WatchlistPage.tsx` | watched items, status | auction-service | `GET /watchlist` | GET | Y |
| Recommendations | `src/components/home/RecommendationsSection.tsx` | recommended items | recommendation-service | `GET /recommendations` | GET | N |

### 8. CART & CHECKOUT

| Screen | Component Path | Required Data | Backend Service | Endpoint | Method | Auth |
|--------|---|---|---|---|---|---|
| Cart | `src/pages/CartPage.tsx` | cart items, totals, taxes | cart-service | `GET /cart` | GET | Y |
| Add to Cart | `src/components/product/AddToCartButton.tsx` | item id, quantity | cart-service | `POST /cart/items` | POST | Y |
| Checkout | `src/pages/CheckoutPage.tsx` | order summary, shipping, payment | orders-service | `POST /orders` | POST | Y |
| Payment | `src/components/payment/PaymentForm.tsx` | payment details, amount | payment-service | `POST /payments` | POST | Y |

### 9. ADMIN & CONTROL CENTER

| Screen | Component Path | Required Data | Backend Service | Endpoint | Method | Auth |
|--------|---|---|---|---|---|---|
| Admin Dashboard | `src/pages/admin/AdminDashboard.tsx` | stats, metrics, alerts | admin-service | `GET /admin/dashboard` | GET | Y |
| User Management | `src/pages/admin/UserManagementPage.tsx` | users, roles, status | admin-service | `GET /admin/users` | GET | Y |
| Compliance | `src/pages/admin/CompliancePage.tsx` | compliance data, reports | compliance-service | `GET /compliance/reports` | GET | Y |
| Analytics | `src/pages/admin/AnalyticsPage.tsx` | analytics data, charts | analytics-service | `GET /analytics` | GET | Y |

### 10. SELLER TOOLS

| Screen | Component Path | Required Data | Backend Service | Endpoint | Method | Auth |
|--------|---|---|---|---|---|---|
| Seller Dashboard | `src/pages/seller/SellerDashboard.tsx` | sales, stats, inventory | seller-service | `GET /seller/dashboard` | GET | Y |
| Inventory | `src/pages/seller/InventoryPage.tsx` | items, stock, status | listing-service | `GET /seller/inventory` | GET | Y |
| Sales History | `src/pages/seller/SalesHistoryPage.tsx` | sales, revenue, trends | seller-service | `GET /seller/sales` | GET | Y |
| Ratings & Reviews | `src/pages/seller/RatingsPage.tsx` | ratings, reviews, feedback | seller-service | `GET /seller/ratings` | GET | Y |

### 11. TRAVELER/BUYER TOOLS

| Screen | Component Path | Required Data | Backend Service | Endpoint | Method | Auth |
|--------|---|---|---|---|---|---|
| Traveler Dashboard | `src/pages/traveler/TravelerDashboard.tsx` | purchases, trips, status | traveler-service | `GET /traveler/dashboard` | GET | Y |
| Purchase History | `src/pages/traveler/PurchaseHistoryPage.tsx` | purchases, filters | orders-service | `GET /orders` | GET | Y |
| Saved Items | `src/pages/traveler/SavedItemsPage.tsx` | saved items, collections | auction-service | `GET /watchlist` | GET | Y |

### 12. NOTIFICATIONS & MESSAGES

| Screen | Component Path | Required Data | Backend Service | Endpoint | Method | Auth |
|--------|---|---|---|---|---|---|
| Notifications | `src/components/notifications/NotificationCenter.tsx` | notifications, unread count | notification-service | `GET /notifications` | GET | Y |
| Messages | `src/pages/control-center/MessagesPage.tsx` | messages, conversations | notification-service | `GET /messages` | GET | Y |

---

## BACKEND SERVICES INVENTORY

### Core Services

| Service | Port | Status | Key Endpoints |
|---------|------|--------|---|
| auth-service | 3001 | ✅ | POST /auth/login, POST /auth/register, GET /auth/profile |
| wallet-service | 3002 | ✅ | GET /wallet/balance, GET /wallet/ledger, GET /wallet/transactions |
| auction-service | 3003 | ✅ | GET /auctions, POST /auctions, POST /auctions/:id/bids |
| payment-service | 3004 | ✅ | POST /payments, POST /payments/deposit, POST /payments/withdraw |
| orders-service | 3005 | ✅ | GET /orders, POST /orders, GET /orders/:id |
| listing-service | 3006 | ✅ | GET /listings, POST /listings, GET /search |
| notification-service | 3007 | ✅ | GET /notifications, POST /notifications |
| cart-service | 3008 | ✅ | GET /cart, POST /cart/items, DELETE /cart/items/:id |
| seller-service | 3009 | ✅ | GET /seller/dashboard, GET /seller/sales |
| traveler-service | 3010 | ✅ | GET /traveler/dashboard, GET /traveler/purchases |
| smart-delivery-service | 3011 | ✅ | GET /fulfillment/options, GET /fulfillment/tracking/:id |
| compliance-service | 3012 | ✅ | GET /compliance/reports, POST /compliance/checks |
| admin-service | 3013 | ✅ | GET /admin/dashboard, GET /admin/users |

---

## MISSING ENDPOINTS (❌ MISSING)

| Screen | Required Endpoint | Service | Status |
|--------|---|---|---|
| Fee Calculator | `GET /calculator/fees` | payment-service | ❌ MISSING |
| Refund Status | `GET /refunds/:id` | payment-service | ❌ MISSING |
| Chargeback Info | `GET /chargebacks/:id` | payment-service | ❌ MISSING |
| Guarantee Details | `GET /guarantees/:id` | auction-service | ❌ MISSING |
| Reserve Price Info | `GET /auctions/:id/reserve` | auction-service | ❌ MISSING |
| Bid Throttle Status | `GET /auctions/:id/throttle` | auction-service | ❌ MISSING |
| Settlement Status | `GET /settlement/:id` | settlement-service | ❌ MISSING |
| Analytics Export | `GET /analytics/export` | analytics-service | ❌ MISSING |

---

## AUTHENTICATION REQUIREMENTS

### Token-Based Auth (JWT)
- **Header**: `Authorization: Bearer {token}`
- **Issued by**: auth-service
- **Expiry**: 24 hours
- **Refresh**: POST /auth/refresh

### Public Endpoints (No Auth)
- POST /auth/login
- POST /auth/register
- POST /auth/forgot-password
- GET /auctions (list only)
- GET /search
- GET /categories
- GET /recommendations

### Protected Endpoints (Auth Required)
- All `/wallet/*` endpoints
- All `/orders/*` endpoints
- All `/cart/*` endpoints
- All `/seller/*` endpoints
- All `/traveler/*` endpoints
- All `/admin/*` endpoints
- All `/trust/*` endpoints
- All `/disputes/*` endpoints

---

## DATA FLOW PATTERNS

### Pattern 1: Read-Only Display
```
Frontend Screen → GET /service/resource → Display Data
Example: Wallet Balance Display
```

### Pattern 2: Create/Update
```
Frontend Form → POST /service/resource → Confirmation → Update UI
Example: Create Auction
```

### Pattern 3: List with Pagination
```
Frontend List → GET /service/resources?page=1&limit=20 → Display + Pagination
Example: Orders List
```

### Pattern 4: Real-Time Updates
```
Frontend → WebSocket /service/subscribe → Real-time Data
Example: Bid Updates, Notifications
```

---

## NEXT STEPS

1. **Verify Endpoints**: Confirm all endpoints exist in backend services
2. **Document Response Schemas**: Define request/response formats
3. **Test Connectivity**: Verify frontend can reach all services
4. **Implement API Clients**: Create service clients for each backend
5. **Remove Mock Data**: Replace all mock APIs with real endpoints
6. **Add Error Handling**: Implement proper error handling for all calls
7. **Add Loading States**: Implement loading indicators for async operations
8. **Add Caching**: Implement client-side caching where appropriate

---

## COMPLIANCE NOTES

- ✅ No PII in URLs
- ✅ All sensitive data in request body
- ✅ HTTPS required for all endpoints
- ✅ Rate limiting implemented
- ✅ Audit logging enabled
- ✅ CORS configured

