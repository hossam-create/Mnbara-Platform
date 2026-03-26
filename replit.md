# Multi-Project Replit: Mnbara Platform + GeoCore Next

## Projects

### 1. Mnbara Platform (Port 5000 — Main Preview)
Cross-border e-commerce marketplace connecting travelers with buyers.
- **Directory:** `frontend/web/`
- **Stack:** React 19, Vite 7, TailwindCSS 4, TypeScript, Ethers.js
- **Workflow:** `Frontend` → runs `cd frontend/web && npm run dev` on port 5000

### 2. GeoCore Next (Port 3000)
Modern global classifieds and real-time auctions platform.
- **Frontend Directory:** `geocore-next/frontend/`
- **Backend Directory:** `geocore-next/backend/`
- **Stack:** Next.js 15, React 19, TailwindCSS 3, TypeScript + Go 1.25, Gin, GORM, PostgreSQL, Redis
- **Workflows:**
  - `GeoCore Frontend` → runs `cd geocore-next/frontend && npm run dev -- -p 3000` (console, port 3000)
  - `GeoCore Backend` → runs `cd geocore-next/backend && go run ./cmd/api/` (console, port 8080) — requires PostgreSQL

## Setup Notes
- Both frontends serve on different ports; only port 5000 is the main webview (Mnbara)
- GeoCore Next frontend is accessible at port 3000
- GeoCore Go backend requires a PostgreSQL database on port 5432 and Redis on port 6379
- Go backend env config: `geocore-next/backend/.env` (copy of `.env.example`)

## Go Backend Bug Fixes Applied
- Added `Language`, `Currency` fields and `ToPublic()` method to `users/model.go`
- Fixed pointer comparison issues in `listings/search_validation.go`
- Fixed GORM Order() single-argument call in `listings/search.go`
- Added missing `strings` import in `admin/handler.go`

## Recent Changes
- 2025-12-30: Mnbara Platform initial setup — Vite config for port 5000, fixed HTML/CSS issues, added ethers
- 2026-03-26: Imported GeoCore Next — Go 1.25 installed, backend compiled, Next.js frontend configured with missing globals.css, QueryProvider, tailwind config, postcss config
