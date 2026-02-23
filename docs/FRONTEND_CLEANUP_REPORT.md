# Frontend Cleanup Report — Mnbara Platform

**Role:** Senior Frontend Architect & UX Designer  
**Date:** February 2026  
**Context:** PRD MVP scope from `docs/PRD_MVP_SCOPE_AND_TRIAGE.md`  
**Mission:** Remove non-MVP features, fix UX issues, ensure professional clean UX for launch.

---

## UNWANTED ELEMENTS FOUND

### Header/Nav

| Element | Location | Current state | ACTION |
|--------|----------|----------------|--------|
| **PLUGIN** | `Header.tsx` L72–75: `<Link to="/plugins">Plugins</Link>` in top utility bar | Visible in main nav | **REMOVE** from header for MVP (per PRD: plugin marketplace out of scope). Keep route for "Coming soon" or remove from nav only. |
| **FEES** | `Header.tsx` L71–74: `<Link to="/payments/fees">Fees</Link>` | Points to PaymentsFeesPage | **KEEP** but consolidate with FeesPricingPage; use single "Fees & pricing" label and one destination (e.g. `/payments/fees`). |
| **Affiliate** | `Header.tsx` L80–82 | Link to `/affiliate/program` | **KEEP** (low clutter) or move to footer only for MVP. |
| **Watchlist** | `Header.tsx` L102–105 | `<button>` with no `onClick` or navigation | **FIX**: Wire to `/saved` or wishlist route, or remove until feature exists. |
| **My Mnbarh** | `Header.tsx` L106–109 | `<button>` with no handler | **FIX**: Wire to user menu/dashboard or remove. |
| **Cart** | `Header.tsx` L110–112 | `<Link to="/cart">` | **BROKEN**: No `/cart` route in `App.tsx`. **FIX**: Add route for `CartPage` or link to checkout. |

### CategoryNav

| Element | Location | Issue | ACTION |
|--------|----------|--------|--------|
| **Plugins** | `CategoryNav.tsx` L30: `{ name: 'nav.plugins', slug: '/plugins' }` | Non-MVP | **REMOVE** from category nav for MVP. |
| **Mnbarh Live** | `CategoryNav.tsx` L29, L56–69 | Out of MVP scope | **REMOVE** or replace with "Live (Coming soon)" linking to `/live` with coming-soon state. |
| **Saved** | slug `/saved` | No route in App | **FIX**: Add `/saved` route (wishlist) or remove from nav. |
| **New Arrivals** | slug `/new-arrivals` | No route | **FIX**: Add route (e.g. search with sort) or remove. |
| **Wallet** | moreCategories `/wallet` | No route | **FIX**: Add `/wallet` or remove from "More". |
| **Gift Cards / Brand Outlet** | moreCategories | No routes | **REMOVE** from nav until routes exist, or add placeholder routes. |

### Footer

| Element | Location | ACTION |
|--------|----------|--------|
| Fees | `Footer.tsx` L31: Link to `/payments/fees` | **KEEP**; ensure single fees page. |
| Other links | Payments, Legal, Earn | **KEEP**; all have routes. |

---

### Routes

| Route | Purpose | ACTION |
|-------|---------|--------|
| `/runtime-check` | Dev/diagnostic page | **REMOVE** from production or gate behind `import.meta.env.DEV` / feature flag. |
| `/checkout/fulfillment`, `/demo/fulfillment` | Fulfillment demo | **REMOVE** from main nav; gate for dev or remove routes for MVP. |
| `/plugins` | Plugin marketplace | **HIDE** from all nav (header + CategoryNav). Keep route; show "Coming soon" on page. |
| `/live` | Live streaming | **HIDE** from CategoryNav for MVP (or "Coming soon"). Keep route optional. |
| **Missing: `/cart`** | Cart page | **ADD** route: `<Route path="/cart" element={<CartPage />} />`. |
| **Missing: `/checkout`** | Checkout flow | **ADD** route for `CheckoutPage` (main checkout, not fulfillment demo). |
| **Missing: `/order-success/:id`** | Post-payment success | **ADD** route (CheckoutPage navigates to it). |
| **Missing: `/traveler` or `/trips`** | Traveler dashboard / trip creation | **ADD** routes for `TravelerDashboard` and `TripCreation` for crowdshipping MVP. |
| **Missing: `/saved`** | Wishlist (if MVP) | **ADD** route or remove "Saved" from nav. |

---

### Components

| Component / Area | Location | ACTION |
|------------------|----------|--------|
| **Plugin marketplace** | `pages/plugin-marketplace/`, `components/plugin-marketplace/` | **KEEP** code; remove from nav. Optionally show "Coming soon" on `/plugins`. |
| **Examples (test/demo)** | `examples/RoleBasedDashboardExample.tsx`, `RoleBasedDashboardReal.tsx`, `RoleBasedDashboardIntegrated.tsx`, `SecurityCompliantDashboard.tsx` | **DELETE** or move to `src/dev/` / Storybook; not referenced in `App.tsx`. Removes dead code from bundle. |
| **Duplicate Buyer Protection** | `pages/BuyerProtectionPage.tsx` (full UI) vs `pages/trust/BuyerProtectionPage.tsx` (simple) | **MERGE**: Use one page (e.g. trust version or richer one); other route redirects to it. |
| **Duplicate Fees** | `pages/payments/FeesPage.tsx` vs `pages/FeesPricingPage.tsx` | **CONSOLIDATE**: One "Fees & pricing" page; redirect `/policies/fees-pricing` → `/payments/fees` or vice versa. |
| **MnbarLayout / EbayLayout** | `components/layout/MnbarLayout.tsx`, `EbayLayout.tsx` | **REVIEW**: Only `App.basic.tsx` uses MnbarLayout; EbayLayout unused. Remove from main bundle or keep for dev; do not use in main `App.tsx` for MVP. |
| **FilterSidebar** | `components/search/FilterSidebar.tsx` | **FIX**: Replace `href="#"` with proper category/search links or `button` + handler. |
| **ProductPage** | Breadcrumb `href="#"` | **FIX**: Use `Link` to category or search with proper `to`. |
| **Header** | Watchlist, My Mnbarh | **FIX**: Add dropdown/menu or link to real routes. |

---

## USER FLOW COMPLETENESS

### Buyer

| Step | Exists? | Clean UI? | Notes |
|------|---------|-----------|--------|
| 1. Register/Login | ✅ | ✅ | LoginPage, RegisterPage; loading + error states. |
| 2. Browse products | ✅ | ⚠️ | SearchPage uses MOCK_RESULTS; not wired to product-service. |
| 3. View product details | ✅ | ✅ | ProductPage with MainLayout. |
| 4. Request item / Add to cart | ⚠️ | ⚠️ | Cart API exists; no `/cart` route; ProductPage "Add to cart" may not navigate. |
| 5. Pay | ⚠️ | ⚠️ | CheckoutPage exists but **no `/checkout` route**; navigates to `/order-success/:id` which has **no route**. |
| 6. Track order | ❌ | — | No `/orders` or order-detail route for buyer. |

**Verdict: GAPS FOUND**  
**Gaps:** Cart route missing; Checkout route missing; Order success route missing; Order tracking missing; Search uses mock data.

---

### Seller

| Step | Exists? | Clean UI? | Notes |
|------|---------|-----------|--------|
| 1. Register/Login | ✅ | ✅ | Same as buyer. |
| 2. Subscribe ($19.99) | ❌ | — | SubscriptionDemo page exists but **not routed**; no subscription flow in nav. |
| 3. Add product | ⚠️ | ⚠️ | SellPage is informational only; no "Create listing" form or route. |
| 4. Manage products | ❌ | — | No seller dashboard or "My listings" route. |
| 5. View orders | ❌ | — | No seller orders view in main app (admin has PasteOrdersManager). |
| 6. Track earnings | ❌ | — | No earnings/payout UI. |

**Verdict: GAPS FOUND**  
**Gaps:** Subscription flow; Add listing form + route; Seller dashboard; Seller orders view; Earnings view.

---

### Traveler

| Step | Exists? | Clean UI? | Notes |
|------|---------|-----------|--------|
| 1. Register/Login | ✅ | ✅ | Same. |
| 2. Create trip | ⚠️ | ✅ | TripCreation.tsx exists; **no route** in App. |
| 3. Browse orders | ❌ | — | No traveler "Available orders" page. |
| 4. Accept order | ❌ | — | No accept-order UI. |
| 5. Update delivery | ❌ | — | DeliveryStatusTimeline exists but no parent route/flow. |
| 6. Receive payment | ❌ | — | No traveler payout view. |

**Verdict: GAPS FOUND**  
**Gaps:** Route for TripCreation/TravelerDashboard; Traveler orders list; Accept order; Delivery update flow; Payment received view.

---

## UX ISSUES

| Issue | Severity | Location / Detail |
|-------|----------|-------------------|
| Cart link 404 (no /cart route) | **HIGH** | Header → /cart |
| Checkout not reachable (no /checkout route) | **HIGH** | CheckoutPage exists but not routed |
| Order success redirect to non-existent route | **HIGH** | CheckoutPage navigates to `/order-success/${orderId}` |
| Many `href="#"` (broken or no-op) | **MEDIUM** | FilterSidebar, MnbarLayout, ProductPage breadcrumb |
| Watchlist / My Mnbarh buttons do nothing | **MEDIUM** | Header |
| Search results are mock data | **MEDIUM** | SearchPage MOCK_RESULTS |
| Duplicate fees pages | **LOW** | Confusing; consolidate |
| Duplicate buyer protection pages | **LOW** | Two different UIs; consolidate |
| No loading/error state on some list views | **LOW** | Varies by page |
| Inconsistent button styles | **LOW** | Some pages use `@/components/ui/button`, others ad-hoc classes |

---

## DESIGN CONSISTENCY

| Area | Status | Notes |
|------|--------|------|
| **Colors** | **CONSISTENT** | `tailwind.config.js`: brand (blue, blueDark, yellow, text, gray, border); primary/secondary/danger/success scales. |
| **Typography** | **NEEDS WORK** | Mixed use of `text-3xl`, `text-xl`, `text-sm` without a single scale; no clear H1/H2/body tokens. |
| **Spacing** | **NEEDS WORK** | Mix of Tailwind spacing (e.g. `gap-4`, `p-4`) and inline styles (`height: '120px'`, `height: '32px'` in Header). Prefer Tailwind scale. |
| **Components** | **CONSISTENT** | Shared UI: Button (variants), Card, Tabs, Badge, Alert, LoadingSpinner, ErrorBoundary. Some pages still use raw divs/buttons. |

---

## CLEANUP ACTION PLAN

### Priority 1 (Do First)

1. **Add missing MVP routes in `App.tsx`**
   - `/cart` → `CartPage`
   - `/checkout` → `CheckoutPage`
   - `/order-success/:id` → Order success page (create if missing)
   - `/traveler` → `TravelerDashboard`, `/traveler/create-trip` → `TripCreation`

2. **Fix broken header**
   - Remove "Plugins" link from `Header.tsx` (MVP).
   - Keep "Fees" but ensure it points to single fees page.
   - Wire "Cart" to `/cart` (after route is added) or leave as-is once route exists.
   - Wire Watchlist to `/saved` or remove until feature exists.
   - Wire "My Mnbarh" to user menu or `/dashboards` (or remove).

3. **Fix CategoryNav**
   - Remove "Plugins" and "Mnbarh Live" from category pills for MVP (or show "Coming soon").
   - Remove or fix "Saved", "New Arrivals", "Wallet", "Gift Cards", "Brand Outlet" (either add routes or remove from nav).

4. **Consolidate fees**
   - Pick one fees page (e.g. `FeesPage` at `/payments/fees`).
   - Redirect `/policies/fees-pricing` to `/payments/fees` (or merge content and remove one file).

5. **Consolidate buyer protection**
   - Single buyer protection page; redirect `policies/buyer-protection` to `trust/buyer-protection` (or use one component for both routes).

### Priority 2 (Do After)

6. **Remove or gate test/demo routes**
   - Gate `/runtime-check` (e.g. only in dev) or remove.
   - Remove or gate `/checkout/fulfillment` and `/demo/fulfillment`.

7. **Replace `href="#"`**
   - FilterSidebar: use `Link` to `/search?category=...` or buttons with state.
   - ProductPage: breadcrumb `Link` to category/search.
   - MnbarLayout/EbayLayout: replace with proper links or remove if unused.

8. **Wire SearchPage to API**
   - Replace MOCK_RESULTS with product-service search/list API (e.g. getProducts or search endpoint).

9. **Remove or relocate examples**
   - Delete or move `examples/RoleBasedDashboard*.tsx`, `SecurityCompliantDashboard.tsx` to dev-only or Storybook so they are not in production bundle.

10. **Optional: Seller flows**
    - Add "Create listing" route and form (or link to existing backend).
    - Add seller dashboard route (e.g. "My listings").
    - Add subscription flow if in MVP (route to SubscriptionDemo or dedicated page).

---

## FILES TO DELETE (or move to dev)

| File path | Reason |
|-----------|--------|
| `frontend/web-app/src/examples/RoleBasedDashboardExample.tsx` | Test/demo; not in App routes; dead code. |
| `frontend/web-app/src/examples/RoleBasedDashboardReal.tsx` | Same. |
| `frontend/web-app/src/examples/RoleBasedDashboardIntegrated.tsx` | Same. |
| `frontend/web-app/src/examples/SecurityCompliantDashboard.tsx` (+ `.module.css` if any) | Same. |

---

## FILES TO MODIFY

| File path | Change |
|-----------|--------|
| `frontend/web-app/src/App.tsx` | Add routes: `/cart`, `/checkout`, `/order-success/:id`, `/traveler`, `/traveler/create-trip`. Optionally gate `/runtime-check`; remove or gate fulfillment demo routes. |
| `frontend/web-app/src/components/layout/Header.tsx` | Remove Plugins link; keep Fees; fix or remove Watchlist/My Mnbarh; ensure Cart links to `/cart`. |
| `frontend/web-app/src/components/layout/CategoryNav.tsx` | Remove Plugins and Live from pills (or "Coming soon"); remove or fix Saved, New Arrivals, Wallet, Gift Cards, Brand Outlet. |
| `frontend/web-app/src/pages/ProductPage.tsx` | Breadcrumb: replace `href="#"` with `Link` and proper `to`. |
| `frontend/web-app/src/components/search/FilterSidebar.tsx` | Replace `href="#"` with category/search links or handlers. |
| `frontend/web-app/src/App.tsx` (redirects) | Add redirect from `/policies/fees-pricing` to `/payments/fees` (or merge into one page). |
| `frontend/web-app/src/App.tsx` (buyer protection) | Use single Buyer Protection component for both `/policies/buyer-protection` and `/trust/buyer-protection`, or redirect one to the other. |

---

## COMPONENTS TO CREATE (if missing)

| Component name | Purpose |
|----------------|--------|
| **OrderSuccessPage** | Shown after checkout; receipt + next steps. Used by `/order-success/:id`. |
| **TravelerLayout** (optional) | Wrapper for traveler dashboard and trip creation with traveler-specific nav. |

---

## ROUTES TO REMOVE (or gate)

| Route path | Reason |
|------------|--------|
| `/runtime-check` | Dev/diagnostic; not for end users. Gate with `import.meta.env.DEV` or feature flag. |
| `/checkout/fulfillment` | Demo page; not core checkout. Gate or remove. |
| `/demo/fulfillment` | Same. |

---

## UX IMPROVEMENTS

| Improvement | Impact |
|-------------|--------|
| Add cart and checkout routes | Users can complete purchase flow without 404. |
| Add traveler and trip creation routes | Travelers can participate in crowdshipping. |
| Single fees page and single buyer-protection page | Less confusion; consistent content. |
| Replace placeholder nav links (Watchlist, My Mnbarh) | No dead-end clicks. |
| Replace `href="#"` with real links or actions | Better accessibility and expected behavior. |
| Wire search to real API | Browse reflects real catalog. |
| Remove demo/test routes from production | Cleaner, smaller bundle; no accidental access. |

---

## ESTIMATED CLEANUP TIME

- **Priority 1 (routes, header, CategoryNav, fees/buyer consolidation):** 3–4 hours  
- **Priority 2 (gate/remove demo, fix href#, wire search, remove examples):** 2–3 hours  
- **Total:** **~6–7 hours** for a single developer.

---

## OWNER MATRIX & ACCEPTANCE CRITERIA (MVP)

### Owners

- Frontend Lead: Primary owner for routes, header, nav, page consolidation
- Product Integrations: Wire search to product-service
- Platform Lead: Feature flags for dev/demo gating

### Task Board

| ID | Task | Owner | Priority | Files | Acceptance Criteria |
|----|------|-------|----------|-------|---------------------|
| FE-001 | Add `/cart`, `/checkout`, `/order-success/:id` routes | Frontend Lead | P0 | [App.tsx](file:///e:/New%20computer/Development%20Coding/Projects/Repos/geo/mnbara-platform/frontend/web-app/src/App.tsx) | Navigating to these paths renders the expected pages without 404s; successful checkout redirects to `/order-success/:id`. |
| FE-002 | Remove “Plugins” from header & CategoryNav | Frontend Lead | P0 | [Header.tsx](file:///e:/New%20computer/Development%20Coding/Projects/Repos/geo/mnbara-platform/frontend/web-app/src/components/layout/Header.tsx), [CategoryNav.tsx](file:///e:/New%20computer/Development%20Coding/Projects/Repos/geo/mnbara-platform/frontend/web-app/src/components/layout/CategoryNav.tsx) | No “Plugins” pill or header link is visible in MVP build; optional `/plugins` route shows “Coming soon”. |
| FE-003 | Consolidate fees pages to a single route | Frontend Lead | P0 | Fees pages + [App.tsx](file:///e:/New%20computer/Development%20Coding/Projects/Repos/geo/mnbara-platform/frontend/web-app/src/App.tsx) | Only one “Fees & pricing” page is accessible; other path redirects. Content reflects $19.99/month + $2.99 order fee. |
| FE-004 | Consolidate Buyer Protection pages | Frontend Lead | P1 | BuyerProtection pages + [App.tsx](file:///e:/New%20computer/Development%20Coding/Projects/Repos/geo/mnbara-platform/frontend/web-app/src/App.tsx) | Only one page is used; other path redirects; breadcrumb and links updated. |
| FE-005 | Gate `/runtime-check`, `/checkout/fulfillment`, `/demo/fulfillment` | Platform Lead | P1 | [App.tsx](file:///e:/New%20computer/Development%20Coding/Projects/Repos/geo/mnbara-platform/frontend/web-app/src/App.tsx) | These routes are not accessible in production builds; accessible only in dev via env flag. |
| FE-006 | Replace `href=\"#\"` with real links/actions | Frontend Lead | P1 | [FilterSidebar.tsx](file:///e:/New%20computer/Development%20Coding/Projects/Repos/geo/mnbara-platform/frontend/web-app/src/components/search/FilterSidebar.tsx), [ProductPage.tsx](file:///e:/New%20computer/Development%20Coding/Projects/Repos/geo/mnbara-platform/frontend/web-app/src/pages/ProductPage.tsx) | No placeholder anchors remain; navigation behaves correctly and passes accessibility checks. |
| FE-007 | Wire SearchPage to product-service | Product Integrations | P1 | Search page + API client | Searching yields non-empty, relevant results from API with pagination; no MOCK_RESULTS in production. |
| FE-008 | Remove or move examples from production bundle | Frontend Lead | P2 | `src/examples/*` | Examples are not included in production build; bundle size reduced; dead files moved or deleted. |
| FE-009 | Traveler routes: `/traveler`, `/traveler/create-trip` | Frontend Lead | P2 | [App.tsx](file:///e:/New%20computer/Development%20Coding/Projects/Repos/geo/mnbara-platform/frontend/web-app/src/App.tsx) | Travelers can reach dashboard and trip creation; navigation verified end-to-end. |

### Exit Criteria (Frontend MVP)

- All P0 and P1 items above are completed and verified.
- Single fees page and single buyer-protection page in the production build.
- No broken links or placeholder anchors in nav-critical components.
- Search uses real API; cart and checkout flows complete without 404s.
- Dev/demo routes are gated and not accessible in production.

---

*End of Frontend Cleanup Report*
