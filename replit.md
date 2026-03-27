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

## Auth Module (Task 12: Auth Hardening & Test Coverage)

### Bugs Fixed
- `verify_handler.go`: Silent error ignore on `generateToken()` in `VerifyEmail` — now returns 500 on failure
- `password_reset_handler.go`: Nil pointer panic when Redis is nil (e.g. in tests) — added nil guards around all `h.rdb` calls in `ForgotPassword` and `ResetPassword`
- `verify_handler.go`: Same nil panic in `ResendVerification` — added nil guards around all `h.rdb` calls

### Auth Test Suite (`internal/auth/auth_test.go`)
Comprehensive coverage of all auth endpoints (44 tests):
- **Register**: happy path, duplicate email, weak/missing/invalid inputs, name too short
- **Login**: success, wrong password, nonexistent user, missing fields, unverified account warning
- **Me endpoint**: success with valid JWT, no token, malformed token, expired token, wrong auth header format
- **Email verification**: success (token consumed, user marked verified, fresh JWT returned), invalid token, already verified, expired token, missing token
- **Forgot password**: registered email, unregistered email (blind 200), invalid email, rate limit behavior
- **Validate reset token**: valid, invalid, expired
- **Reset password**: success + login works + old password rejected, password mismatch, weak passwords (4 subtests), expired token, invalid token, token consumed after use, missing fields
- **JWT middleware**: missing header, garbage token, expired token, wrong algorithm (RS256), wrong secret
- **End-to-end password reset flow**: full sequence from register → inject token → validate → reset → login
- **Rate limiter**: fail-open behavior when Redis is nil
