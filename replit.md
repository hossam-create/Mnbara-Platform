# GeoCore Next

Modern global classifieds and real-time auctions platform.

## Project Structure

- **Frontend Directory:** `geocore-next/frontend/`
- **Backend Directory:** `geocore-next/backend/`
- **Stack:** Next.js 15, React 19, TailwindCSS 3, TypeScript + Go 1.25, Gin, GORM, PostgreSQL, Redis

## Workflows

- `GeoCore Frontend` → runs `cd geocore-next/frontend && npm run dev -- -p 5000` (webview, port 5000)
- `GeoCore Backend` → runs `cd geocore-next/backend && go run ./cmd/api/` (console, port 8080) — requires PostgreSQL

## Setup Notes

- GeoCore Next frontend is the main webview on port 5000
- GeoCore Go backend requires a PostgreSQL database on port 5432 and Redis on port 6379
- Go backend env config: `geocore-next/backend/.env` (copy of `.env.example`)

## Go Backend Bug Fixes Applied

- Added `Language`, `Currency` fields and `ToPublic()` method to `users/model.go`
- Fixed pointer comparison issues in `listings/search_validation.go`
- Fixed GORM Order() single-argument call in `listings/search.go`
- Added missing `strings` import in `admin/handler.go`

## Recent Changes

- 2026-03-26: Imported GeoCore Next — Go 1.25 installed, backend compiled, Next.js frontend configured with missing globals.css, QueryProvider, tailwind config, postcss config
- 2026-03-26: Removed Mnbara Platform — deleted `frontend/` directory, removed `Frontend` workflow, reconfigured GeoCore Frontend to port 5000 as main webview
