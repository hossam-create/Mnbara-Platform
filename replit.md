# GeoCore Next

Modern global classifieds and real-time auctions platform.

## Project Structure

- **Frontend Directory:** `geocore-next/frontend/` (pnpm monorepo — Vite + React)
- **Backend Directory:** `geocore-next/backend/` (Go 1.25, Gin, GORM)
- **Stack:** Vite, React, TailwindCSS, TypeScript + Go 1.25, Gin, GORM, PostgreSQL, Redis

## Workflows

- `GeoCore Frontend` → runs `cd geocore-next/frontend && PORT=5000 BASE_PATH=/ pnpm --filter @workspace/web run dev` (webview, port 5000)
- `GeoCore Backend` → runs `cd geocore-next/backend && go run ./cmd/api/` (console, port 8080) — requires PostgreSQL

## Frontend Details (geocore-next/frontend)

Sourced from: https://github.com/hossam-create/geocore-marketplace

- pnpm workspace monorepo with:
  - `artifacts/web` — main Vite/React web app
  - `artifacts/api-server` — API server
  - `lib/api-client-react` — shared React API client
  - `lib/api-spec`, `lib/api-zod`, `lib/db` — shared libraries
- Requires `PORT=5000` and `BASE_PATH=/` env vars to run

## Backend (geocore-next/backend)

- Go backend requires PostgreSQL (port 5432) and Redis (port 6379)
- Config: `geocore-next/backend/.env`

## Go Backend Bug Fixes Applied

- Added `Language`, `Currency` fields and `ToPublic()` method to `users/model.go`
- Fixed pointer comparison issues in `listings/search_validation.go`
- Fixed GORM Order() single-argument call in `listings/search.go`
- Added missing `strings` import in `admin/handler.go`
