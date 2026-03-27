# Mnbara Platform — PRD Scope & MVP Triage

**Author:** Senior Product Manager (analysis)  
**Date:** February 2026  
**Purpose:** Establish exact MVP scope, prevent feature creep, reconcile documentation vs code.

---

## Part 1: Document Review

### 1.1 Features Claimed by Document

| Document | Claims | Contradictions / Notes |
|----------|--------|------------------------|
| **MNBARA_UNIFIED_PRD_v1.0.md** | 87 microservices; "Production Ready"; 40% complete; Plugin System, eBay Live, CrafterCMS, AI (10 svc), Blockchain, Multi-currency | Status says "Production Ready" and "40% complete" in same doc. PRD catalog lists many services as "✅ Active" that are archived or not in `backend/services`. |
| **MNBARA_MASTER_DOCUMENTATION.md** | Same 87-service catalog; Control Center; P2P Exchange; Decision Authority; Manual Payout; Flutter 20% | Ports and locations sometimes don’t match ARCHITECTURE_FINAL (e.g. many "Active" services live in `archive/legacy-services/`). |
| **ARCHITECTURE_FINAL.md** | **16 core services** for MVP; 71 archived; "Production Ready" | Single source of truth for *reduced* scope. Explicitly archives: plugin-system, ebay-live, kyc-service, decision-authority, fraud-detection, p2p-exchange, stripe-connect, review-service, chat, etc. |
| **MVP_ROADMAP.md** | 6-week MVP: real payments, basic crowdshipping, essential mobile. **Out of scope:** advanced AI, blockchain, live streaming, **plugin marketplace**, VR/AR | Clear MVP boundary. Plugin and live streaming explicitly out of scope. |
| **MVP_README.md** | Minimal 5-system MVP: Users, Orders, Payments, Admin, Subscription; $2.99 service fee | Describes a *different*, minimal MVP (possibly `backend/mvp-services/` or legacy). Not aligned with main codebase or 16-service architecture. |
| **GAPS_ANALYSIS.md** | PRD vs reality: 60% gap; real money "mock"; AI 90% missing; plugin "Backend Only" | Correctly flags contradictions. |
| **COMPREHENSIVE_100_PERCENT_COMPLETION.md** | "100/100" readiness; rate limiting, CORS, tests, deployment scripts | Focuses on quality/security of *existing* code, not scope. |

### 1.2 Contradictions Summary

- **Service count:** PRD/Master = 87 microservices; ARCHITECTURE_FINAL = 16 core (71 archived). **Authority for MVP:** ARCHITECTURE_FINAL.
- **"Production ready":** Used in PRD and ARCHITECTURE_FINAL while GAPS_ANALYSIS and PRD itself state 40% complete and mock payments. **Reality:** Production-ready *architecture* and *security posture*, not full feature set.
- **Plugin marketplace:** PRD and Master list it as Active; MVP_ROADMAP says **out of scope**. Gateway and frontend still have plugin routes and `/plugins` page. **Reality:** Code present; scope says post-MVP.
- **Fees:** Multiple fee concepts (marketplace fee, escrow fee, $2.99 MVP fee in MVP_README). No single source of truth for MVP fee model.

---

## Part 2: Code Reality Check

### 2.1 Active Backend Services (from `backend/services/`)

Present and with `package.json`: **api-gateway**, **auth-service**, **user-service**, **product-service**, **country-layer-service**, **trips-service**, **orders-service**, **wallet-service**, **matching-service**, **admin-service**, **notification-service**, **feature-management-service**, **payment-service**, **escrow-service**, **settlement-service**, **cart-service**, **subscription-service**.  
*(Auction logic exists inside product-service and admin-service; no standalone auction-service in this list. KYC logic in auth-service and admin-service. No standalone plugin-system in backend/services; gateway points to plugin-system-service URL.)*

### 2.2 Feature-by-Feature Status

| Area | Feature | Status | Evidence |
|------|---------|--------|----------|
| **Marketplace (eBay)** | Product listing | **IMPLEMENTED** | product-service: CRUD, filters, pagination |
| | Product search | **PARTIAL** | search.routes.ts returns mock empty results; getProducts() is real |
| | Seller shops | **MISSING** | No dedicated seller-shop UI or API |
| | Reviews/ratings | **MISSING** | review-service archived; no reviews in active services |
| | Cart | **IMPLEMENTED** | cart-service in backend; frontend uses it |
| **Crowdshipping (Hitchhiker)** | Traveler profiles | **IMPLEMENTED** | trips-service: travelers module, profiles |
| | Trip creation | **IMPLEMENTED** | trips-service: create, search trips |
| | Order matching | **PARTIAL** | matching-service exists; integration with requests/trips unclear |
| | Delivery tracking | **PARTIAL** | Trip schema has currentLat/currentLng; no full tracking UI flow |
| **Financial (Binance)** | Multi-currency wallets | **IMPLEMENTED** | wallet-service: multi-currency schema and APIs |
| | Currency exchange | **PARTIAL** | forex in wallet-service; real FX provider integration unclear |
| | Escrow system | **IMPLEMENTED** | escrow-service active |
| | Payment processing | **PARTIAL** | payment-service exists; docs say "currently mock" for real money |
| **AI** | Smart matching | **PARTIAL** | matching-service present; "smart" algorithm not evidenced |
| | Fraud detection | **MISSING** | fraud-detection-service archived |
| | Risk scoring | **MISSING** | No dedicated risk-scoring service in active set |
| | Recommendations | **MISSING** | recommendation services archived |
| **Admin** | User management | **IMPLEMENTED** | admin-service |
| | Order monitoring | **IMPLEMENTED** | PasteOrdersManager, orders in admin |
| | Financial reports | **PARTIAL** | FinancePage, guarantees; full reports unclear |
| | System settings | **IMPLEMENTED** | feature-management-service |

---

## Part 3: Feature Triage

### CORE MVP (Must have for launch)

- User registration/login and profiles (auth, user)
- Product listing and browse (product-service)
- Product search that works (fix mock search or use getProducts with q)
- Cart and checkout (cart, orders)
- Real payment processing (Stripe/Connect + escrow for real money)
- Trip creation and search (trips)
- Basic traveler–request matching (matching-service + trips + orders)
- Order lifecycle and status (orders-service)
- Admin: user list, order list, basic financial visibility
- KYC for high-value or traveler flows (auth-service KYC or admin KYC module)
- Country/compliance layer (country-layer-service)
- Notifications (notification-service)
- API gateway and rate limiting / CORS (existing)

### NICE TO HAVE (Post-launch)

- Plugin marketplace (backend may be archived; frontend at `/plugins` — keep or hide)
- Live streaming / Mnbarh Live (eBay-style live)
- Seller shops / storefronts
- Reviews and ratings
- Advanced AI (recommendations, fraud ML, pricing)
- P2P Exchange (archived; reintroduce later if in vision)
- Decision Authority / Custodii (archived)
- Blockchain / token / crypto escrow
- VR/AR, voice commerce
- Advanced analytics and BI
- Multi-region deployment and advanced DevOps

### REMOVE (Causing confusion or bloat)

- **Duplicate fee pages:** Consolidate FeesPage (`/payments/fees`) and FeesPricingPage (`/policies/fees-pricing`) into one clear "Fees & pricing" experience; remove or redirect the other.
- **Plugin in nav if out of scope:** If MVP_ROADMAP is authority, remove or hide "Plugins" from main nav and Control Center (or show "Coming soon") so scope is clear.
- **MVP_README’s $2.99-only narrative** unless that *is* the MVP model: align or move to archive so only one MVP definition exists.
- **Test/demo routes in production build:** Consider gating `/runtime-check`, `/demo/fulfillment`, `/checkout/fulfillment` behind feature flag or env so they’re not user-facing in production.
- **Example dashboards in production bundle:** `examples/RoleBasedDashboard*.tsx`, `SecurityCompliantDashboard.tsx` — move to dev-only or storybook; don’t ship as main app routes unless needed.

### MISSING (Need to build or restore)

- **Real payment flow:** Replace mock with Stripe (and optionally Escrow Kenya) end-to-end.
- **Working product search:** Either wire Elasticsearch or use product-service getProducts with search params so results are non-empty and relevant.
- **Basic delivery tracking UX:** Use trip location data to show a simple tracking view for buyer/seller.
- **Single, clear fee model:** Document and implement one fee structure for MVP (e.g. marketplace % + escrow % or fixed fee).
- **Reviews (if MVP):** If reviews are must-have, reintroduce a minimal review capability (could be in product-service or small review module).

---

## Part 4: Frontend Cleanup Targets

### 4.1 PLUGIN

- **What it is:** Plugin marketplace for sellers/admins to install extensions (e.g. live streaming, themes). Backend: plugin-system (archived in ARCHITECTURE_FINAL). Gateway still has routes to `plugin-system-service`. Frontend: `/plugins` → PluginMarketplacePage + PluginMarketplace, install modal, etc.
- **Verdict:** **Out of scope for MVP** per MVP_ROADMAP. Options: (1) Hide from main nav and Control Center and show "Coming soon", or (2) Remove route and menu entry until Phase 2. Do **not** delete plugin code yet; keep for post-MVP. Recommend: hide from nav, keep route for internal/testing.

### 4.2 FEES

- **What it is:** Two different pages: (1) **FeesPage** at `/payments/fees` — fee structure and table (tiered, surcharges). (2) **FeesPricingPage** at `/policies/fees-pricing` — marketing-style fees & pricing with tabs/locale.
- **Verdict:** **Consolidate.** Keep one "Fees & pricing" page (e.g. under `/payments/fees` or `/policies/fees-pricing`), redirect the other, and align content with the single MVP fee model. Remove or repurpose the duplicate.

### 4.3 Test / Demo Pages in Production Code

- **RuntimeCheckPage** (`/runtime-check`): Dev/diagnostic. Gate behind `VITE_ENABLE_RUNTIME_CHECK` or remove from production build.
- **FulfillmentDemoPage** (`/checkout/fulfillment`, `/demo/fulfillment`): Demo flow. Same: feature flag or dev-only.
- **examples/** (RoleBasedDashboard*, SecurityCompliantDashboard): Not routed in App but in bundle. Move to dev/storybook or exclude from prod build.

### 4.4 Duplicate Implementations

- **Buyer protection:** BuyerProtectionPage (root) vs trust/BuyerProtectionPage. Consolidate to one route and one component.
- **Fees:** As above (FeesPage vs FeesPricingPage).
- **Control Center vs Admin:** Both use same AdminLayout; Control Center is the main "spaceship" C2. No duplication; ensure single entry `/admin` and clear naming.

---

## Summary: Recommended MVP Scope

**In scope:**

- Auth, users, KYC (basic), country-layer
- Product listing + search (fix search)
- Cart, orders, checkout
- Real payments (Stripe + escrow)
- Trips, travelers, matching, basic delivery tracking
- Wallets (multi-currency as implemented)
- Admin: users, orders, finances, feature flags
- Notifications
- Single, documented fee model and one fees page

**Out of scope (post-MVP):**

- Plugin marketplace (hide or "Coming soon")
- Live streaming
- Blockchain / token
- Advanced AI
- P2P Exchange (revisit later)
- Reviews (unless added as minimal MVP item)
- Seller shops, VR/AR, voice

**Cleanup:**

- Consolidate fee pages; align docs to ARCHITECTURE_FINAL and MVP_ROADMAP.
- Hide or gate test/demo and example pages.
- One buyer-protection page; one fees page.
- Treat ARCHITECTURE_FINAL + MVP_ROADMAP as the single source of truth for MVP scope.

---

*End of PRD MVP Scope and Triage*
---

## Part 5: Action Plan, Ownership, and Acceptance Criteria

### 5.1 Decisions (Single Source of Truth)

- MVP fee model: keep seller subscription ($19.99/month) and $2.99 service fee per order; document both in a single “Fees & Pricing” page; remove duplicates.
- Payments: Stripe (test → live) with escrow release/refund; no blockchain/crypto in MVP.
- Plugin marketplace: out of scope; hide nav and route, leave code for Phase 2.
- Search: implement basic server-side search via product-service parameters; avoid complex search infra in MVP.
- Tracking: minimal delivery tracking view based on trips-service lat/lng; no full logistics stack.
- Source of truth for MVP: ARCHITECTURE_FINAL.md + MVP_ROADMAP.md.

### 5.2 Triage Board (Must Do for MVP)

| ID | Item | Owner | Priority | Status | Target |
|----|------|-------|----------|--------|--------|
| T-001 | Stripe live mode + webhooks | Payments Lead | P0 | Planned | Week 1 |
| T-002 | Escrow release/refund flows (buyer↔seller) | Wallet Lead | P0 | In progress | Week 1 |
| T-003 | Consolidate fees pages (one route, docs aligned) | Frontend Lead | P1 | Planned | Week 1 |
| T-004 | Product search (q, filters via product-service) | Backend Lead | P1 | In progress | Week 1 |
| T-005 | Minimal delivery tracking UI (trip map) | Frontend Lead | P1 | Planned | Week 2 |
| T-006 | Hide plugin marketplace from nav | Frontend Lead | P2 | Planned | Week 1 |
| T-007 | Notifications: order status + payment | Platform Lead | P1 | Planned | Week 2 |
| T-008 | Admin: consolidated orders and finance | Admin Lead | P1 | In progress | Week 2 |
| T-009 | KYC gate for high-value/travelers | Auth Lead | P1 | Planned | Week 2 |

### 5.3 Acceptance Criteria (Go/No-Go)

- Payments: successful card charge via Stripe in live mode; webhook records payment; escrow can fund, release, refund.
- Orders: buyer can place order; traveler can accept; status updates visible in admin and user dashboards.
- Search: entering a query returns relevant product results (non-empty) with pagination.
- Fees: one canonical page and doc aligned with $19.99/month and $2.99 per order; no duplicate routes.
- Tracking: buyer sees basic location/ETA for accepted delivery (from trips-service).
- Country/compliance: operations blocked on invalid country codes; 195+ countries endpoint live.
- Admin: can list users/orders, view basic finance, and toggle feature flags without errors.

### 5.4 Cleanup Checklist (Pre-Release)

- Remove or gate demo/runtime routes behind env flags for production builds.
- Consolidate BuyerProtection pages and Fees pages.
- Align all docs to ARCHITECTURE_FINAL + MVP_ROADMAP terminology and service counts.
- Ensure Swagger tags reflect MVP scope only.

### 5.5 References

- Wallet Escrow Service: [escrow.service.ts](file:///e:/New%20computer/Development%20Coding/Projects/Repos/geo/mnbara-platform/backend/services/wallet-service/src/escrow/escrow.service.ts)
- Transfer (Atomic): [transfer.service.ts](file:///e:/New%20computer/Development%20Coding/Projects/Repos/geo/mnbara-platform/backend/services/wallet-service/src/transfer/transfer.service.ts)
- Product Service (search): [product-service](file:///e:/New%20computer/Development%20Coding/Projects/Repos/geo/mnbara-platform/backend/services/product-service)
- Country Layer: [country-layer-service](file:///e:/New%20computer/Development%20Coding/Projects/Repos/geo/mnbara-platform/backend/services/country-layer-service)
- Admin: [admin-service](file:///e:/New%20computer/Development%20Coding/Projects/Repos/geo/mnbara-platform/backend/services/admin-service)
