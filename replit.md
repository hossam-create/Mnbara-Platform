# GeoCore Next

Modern global classifieds and real-time auctions platform (Uber + eBay + Amazon roadmap).

## Project Structure

- **Frontend Directory:** `geocore-next/frontend/` (pnpm monorepo — Vite + React)
- **Backend Directory:** `geocore-next/backend/` (Go 1.23+, Gin, GORM)
- **Stack:** Vite, React, TailwindCSS, TypeScript + Go, Gin, GORM, PostgreSQL, Redis

## Workflows & Ports

| Workflow | Port | Description |
|---|---|---|
| `Go Backend` | 9000 | Go/Gin REST API — **independent workflow**, `geocore-next/backend/start.sh` |
| `geocore-next/frontend/artifacts/web: web` | 22333 (ext 4200) | Vite/React web marketplace |
| `geocore-next/frontend/artifacts/admin: web` | 23744 (ext 3003) | Admin dashboard |
| `geocore-next/frontend/artifacts/mobile: expo` | 18115 (ext 5000) | React Native Expo mobile |
| `geocore-next/frontend/artifacts/api-server: API Server` | 8080 | Node.js API server |
| `geocore-next/frontend/artifacts/mockup-sandbox` | 8081 | Component preview server |

## Critical Architecture Notes

- **Go Backend is a SEPARATE workflow** (`Go Backend`) — NOT spawned by the Vite plugin.  
  `vite.config.ts` was updated to remove `goBackendPlugin`. Backend is managed independently via `geocore-next/backend/start.sh`.
- The web Vite server proxies `/api`, `/ws`, `/webhooks` to port 9000 (Go backend).
- After task merges, `post-merge.sh` kills port 9000 → Replit auto-restarts `Go Backend` workflow.
- The web/canvas iframes survive backend restarts because the Vite server is no longer coupled.

## CRITICAL: Do NOT change frontend design/UI/CSS

Only work on the data layer, API connections, and backend logic.

## Canvas Iframe URLs

- Web: `workspace_iframe.html?initialPath=%2Fweb%2F&id=artifacts%2Fweb`
- Admin: `workspace_iframe.html?initialPath=%2Fadmin%2F&id=artifacts%2Fadmin`
- Mobile: expo domain + `workspace_iframe.html?initialPath=%2F&id=artifacts%2Fmobile`

## Post-Merge Protocol

After any task merge, the `scripts/post-merge.sh` script:
1. Runs `pnpm install`
2. Runs `go build ./...` (compile check)
3. Runs `fuser -k 9000/tcp` → kills Go backend → `Go Backend` workflow auto-restarts

## Go Backend Features (60+ endpoints)

- Auth: register, login, refresh JWT, email verify, password reset, social login
- Listings: CRUD, search/filter (full-text + geo), suggestions, favorites, expiry scheduler
- Auctions: CRUD, bidding, auto-bid, anti-sniping, real-time WebSocket, auction-end cron
- Chat: conversations, messages, WebSocket (Redis pub/sub)
- Payments: Stripe integration (disabled without `STRIPE_SECRET_KEY`)
- Images: R2 upload (disabled without `R2_ACCOUNT_ID`)
- Notifications: push (disabled without `FIREBASE_SERVICE_ACCOUNT_JSON`), in-app
- Admin: stats, user management, listing moderation, revenue, KYC
- Stores/Storefronts, Reviews, KYC

## Required Env Vars for Production

Before deploying with `APP_ENV=production`, set at least one of:

- `ALLOWED_ORIGINS` — comma-separated list of allowed CORS origins (e.g. `https://myapp.com,https://admin.myapp.com`). Wildcards (`*`) are stripped and not allowed in production.
- `FRONTEND_URL` — fallback single origin used if `ALLOWED_ORIGINS` is unset (e.g. `https://myapp.com`).

**If neither is set in production, the server refuses to start** with a descriptive fatal error — this prevents accidental deployment with an open or broken CORS policy.

In development (`APP_ENV` is anything other than `production`), all origins are allowed automatically.

## Missing Env Vars (features disabled, not broken)

- `STRIPE_SECRET_KEY` — payments
- `R2_ACCOUNT_ID` — image uploads
- `FIREBASE_SERVICE_ACCOUNT_JSON` — push notifications

## Auth Module Tests

44-test suite in `internal/auth/auth_test.go` covering all auth endpoints end-to-end.
