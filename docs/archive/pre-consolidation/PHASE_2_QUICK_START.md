# Phase 2: Quick Start Guide

## What Was Done
API Gateway now routes all frontend requests through a single unified endpoint on port 10000.

## Start Everything
```bash
docker-compose -f docker-compose.dev.yml up
```

## Access Points
- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:10000
- **API Health**: http://localhost:10000/health
- **API Docs**: http://localhost:10000/api/v1

## Service Routing
| Endpoint | Service | Port |
|----------|---------|------|
| `/api/products` | Listing Service | 3001 |
| `/api/cart` | Cart Service | 3002 |
| `/api/payments` | Payment Service | 3003 |
| `/api/crowdship` | Crowdship Service | 3004 |
| `/api/compliance` | Compliance Service | 3005 |

## Test a Request
```bash
# Public endpoint (no auth)
curl http://localhost:10000/api/products

# Protected endpoint (requires JWT)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:10000/api/cart
```

## Key Files
- Routes: `backend/services/api-gateway/src/config/routes.config.ts`
- Gateway: `backend/services/api-gateway/src/index.ts`
- Docker: `docker-compose.dev.yml`
- Env: `.env.mvp`

## Frontend Already Configured
Frontend automatically uses `http://localhost:10000/api` via `VITE_API_BASE_URL` env var.

## Status
✅ Phase 2 Complete - Ready for Phase 3 (Testing)
