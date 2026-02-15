# Developer Completion Guide — Expansion Plan

This guide helps the developer complete what’s missing from the **EXPANSION_PLAN_EBAY_LIVE_CRAFTER_PLUGINS** and wire the **"Mnbarh Live"** button to the eBay Live backend.

---

## 1. Mnbarh Live button → eBay Live (done)

- **Button**: In `frontend/web-app/src/components/layout/CategoryNav.tsx` the first nav item is **"Mnbarh Live"** with `<Link to="/live">`.
- **Route**: In `frontend/web-app/src/App.tsx` the route **`/live`** was added and renders **`LiveStreamPage`** (eBay Live UI: Discover Streams, Create Stream, Watch Stream, Analytics).
- **Backend URL**: All live-streaming components now use **`REACT_APP_LIVE_SERVICE_URL`** (default `http://localhost:3000`). Set this in `frontend/web-app/.env` to match where the eBay Live service runs.

**What you need to do**

1. **Run the eBay Live backend**  
   From repo root:
   ```bash
   cd backend/services/ebay-live-service
   npm install && npm run dev
   ```
   It listens on **port 3000** by default (or the port in its `.env`).

2. **Point the frontend to it**  
   In `frontend/web-app/.env` (or `.env.local`):
   ```env
   REACT_APP_LIVE_SERVICE_URL=http://localhost:3000
   ```
   Use your real backend URL in staging/production (e.g. `https://api.yourdomain.com` or the API Gateway URL for live).

3. **Test**  
   Start the web app, click **"Mnbarh Live"** in the nav → you should land on `/live` and see the Live Stream page (Discover / Create / Watch / Analytics). Stream listing and creation call the eBay Live service; WebSocket (Socket.IO) uses the same base URL.

---

## 2. API Gateway — routes (done)

Implemented in **`backend/services/api-gateway/src/config/routes.config.ts`**:

- **Plugin system**: `/api/plugins`, `/api/marketplace/plugins`, `/api/developers/plugins` → plugin-system service (port 3015).
- **eBay Live**: In addition to `/api/live-streams` and `/api/live-auctions`, the gateway now proxies **`/api/streams`**, **`/api/chat`**, **`/api/auction`**, **`/api/analytics`** to the eBay Live service (port 3020 by default; set `EBAY_LIVE_SERVICE_URL`).

In production, set **`REACT_APP_LIVE_SERVICE_URL`** to the API Gateway URL so the frontend uses the gateway for live APIs.

---

## 3. Plugin Marketplace UI (optional for first release)

- **Backend**: Plugin Marketplace API exists under `backend/services/plugin-system/` (e.g. `PluginMarketplaceAPI.ts`, plugin routes).
- **Frontend**: There is a lazy-loaded **`PluginMarketplacePage`** in `App.tsx` at route **`/plugins`**, but the page may be a stub.

**What you need to do**

1. Open `frontend/web-app/src/pages/plugin-marketplace/PluginMarketplacePage.tsx`.
2. If it’s a stub, build a simple UI that:
   - Lists available plugins (GET from API Gateway `/api/plugins` or equivalent).
   - Allows install/uninstall (POST/DELETE to the plugin API).
3. Ensure the API Gateway route for the plugin system (see section 2) is in place so `/plugins` page can call the backend.

---

## 4. Phase 0 (optional for first release)

From **EXPANSION_PLAN_IMPLEMENTATION_ANALYSIS.md**:

- **Wallet consolidation**: Not done (internal-ledger and wallet-service both still exist). Can be deferred.
- **Event taxonomy**: No new event types for “live” or “plugin”. Can be added later.
- **API Gateway**: Covered in section 2 above.

You can ship **Mnbarh Live** and **Plugins** without completing Phase 0, but the gateway routes (section 2) are required for production.

---

## 5. Payment / order integration (eBay Live)

The plan mentions “auto payment capture” for live auctions. The analysis did not confirm that winning bids trigger payment/order creation.

**Done.** When `POST /api/auction/:auctionId/payment` is called, the service returns the payment record and, if **`LIVE_ORDER_CALLBACK_URL`** is set, POSTs the winner payload to that URL. Set it in `backend/services/ebay-live-service/.env` so the platform can create an order and capture payment.

(Implemented: “ends” or “winner” is set.
Payment route now calls LIVE_ORDER_CALLBACK_URL when set (see .env.example).

---

## 6. Quick reference — files touched for Mnbarh Live

| Purpose | File |
|--------|------|
| Route for `/live` | `frontend/web-app/src/App.tsx` |
| Live stream page | `frontend/web-app/src/components/live-streaming/LiveStreamPage.tsx` |
| Nav button | `frontend/web-app/src/components/layout/CategoryNav.tsx` (already `to="/live"`) |
| Backend URL config | All under `frontend/web-app/src/components/live-streaming/` use `REACT_APP_LIVE_SERVICE_URL` (default `http://localhost:3000`) |
| Shared config (optional) | `frontend/web-app/src/config/liveService.ts` (defines `LIVE_SERVICE_BASE_URL` and `liveServiceApi`) |
| eBay Live backend | `backend/services/ebay-live-service/` (port 3000 by default) |

---

## 7. Summary

- **Mnbarh Live button** is linked to **eBay Live**: button goes to `/live`, route renders `LiveStreamPage`, and all live components use `REACT_APP_LIVE_SERVICE_URL` (default `http://localhost:3000`).
- **Done in code**: API Gateway routes for `/api/streams`, `/api/chat`, `/api/auction`, `/api/analytics` and for orders (`/api/v1/orders`, `/api/v1/orders/from-live-auction`); Plugin Marketplace uses `apiService.marketplace`; orders-service implements `from-live-auction`; ebay-live-service calls `LIVE_ORDER_CALLBACK_URL`. **To run**: set env vars (see each service’s `.env.example`), start API Gateway, orders-service, ebay-live-service, plugin-system; set `REACT_APP_LIVE_SERVICE_URL` and `VITE_API_BASE_URL` in the frontend. Phase 0 and pre-launch checklist can follow later.

For full implementation and deployment status, see **EXPANSION_PLAN_IMPLEMENTATION_ANALYSIS.md**.
