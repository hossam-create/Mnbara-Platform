# Immediate Execution Checklist - Start Here

**Date:** December 20, 2025  
**Duration:** Next 2 weeks  
**Goal:** Unblock all other development

---

## 🚀 Week 1: Foundation Setup

### Task 22: Finalize Database Migrations (Days 1-2)

**Objective:** Ensure all database schema is complete and migrations run successfully

**Checklist:**

- [ ] Review all pending migrations in `backend/services/auth-service/prisma/migrations/`
- [ ] Verify FX_RESTRICTION_ENGINE migration exists and is complete
  - [ ] Check: `20251220_add_fx_restriction_engine/migration.sql`
  - [ ] Verify tables: `fx_restrictions`, `fx_rates`, `fx_corridors`
  - [ ] Verify indexes on `corridor_id`, `currency_pair`

- [ ] Verify PRICING_SPREAD_LOGIC migration exists and is complete
  - [ ] Check: `20251220_add_pricing_spread_logic/migration.sql`
  - [ ] Verify tables: `pricing_spreads`, `spread_rules`, `spread_history`
  - [ ] Verify indexes on `seller_id`, `product_category`

- [ ] Run all migrations in order
  ```bash
  cd backend/services/auth-service
  npx prisma migrate deploy
  ```

- [ ] Verify database schema
  ```bash
  npx prisma db push --skip-generate
  ```

- [ ] Generate Prisma client
  ```bash
  npx prisma generate
  ```

- [ ] Test database connection from each service
  - [ ] Auth service can connect
  - [ ] Payment service can connect
  - [ ] Auction service can connect
  - [ ] Matching service can connect

- [ ] Create database backup
  ```bash
  pg_dump mnbara_db > backup_20251220.sql
  ```

**Success Criteria:**
- All migrations run without errors
- Prisma client generates successfully
- All services can connect to database
- Schema matches FX_RESTRICTION_ENGINE and PRICING_SPREAD_LOGIC docs

**Blocking:** Everything else

---

### Task 24: API Gateway & Core Routing (Days 3-5)

**Objective:** Set up Kong/Prism with authentication, rate limiting, and validation

**Checklist:**

#### Part 1: Kong Configuration

- [ ] Review Kong setup in `backend/services/api-gateway/`
- [ ] Configure Kong routes for all services
  - [ ] Auth service routes
  - [ ] Payment service routes
  - [ ] Auction service routes
  - [ ] Matching service routes
  - [ ] Recommendation service routes

- [ ] Set up Kong authentication plugin
  - [ ] JWT validation
  - [ ] OAuth2 support
  - [ ] API key support

- [ ] Configure rate limiting
  - [ ] 100 requests/minute per user
  - [ ] 1000 requests/minute per IP
  - [ ] Burst allowance for spikes

- [ ] Set up request validation middleware
  - [ ] Content-type validation
  - [ ] Request body schema validation
  - [ ] Header validation

- [ ] Configure response logging
  - [ ] Log all requests/responses
  - [ ] Include timing information
  - [ ] Include error details

#### Part 2: API Gateway Implementation

- [ ] Review `backend/services/api-gateway/src/config/routes.config.ts`
- [ ] Verify all routes are defined
  - [ ] `/api/auth/*` routes
  - [ ] `/api/payments/*` routes
  - [ ] `/api/auctions/*` routes
  - [ ] `/api/products/*` routes
  - [ ] `/api/orders/*` routes

- [ ] Implement middleware stack
  - [ ] Correlation ID middleware
  - [ ] Logging middleware
  - [ ] Auth middleware
  - [ ] Rate limiter middleware
  - [ ] Validation middleware
  - [ ] Error handler middleware

- [ ] Test API Gateway
  ```bash
  cd backend/services/api-gateway
  npm run dev
  ```

- [ ] Test routes
  - [ ] Health check: `GET /health`
  - [ ] Auth route: `POST /api/auth/login`
  - [ ] Payment route: `GET /api/payments/balance`
  - [ ] Auction route: `GET /api/auctions`

- [ ] Test rate limiting
  - [ ] Send 101 requests in 1 minute
  - [ ] Verify 429 response on 101st request

- [ ] Test authentication
  - [ ] Request without token → 401
  - [ ] Request with invalid token → 401
  - [ ] Request with valid token → 200

**Success Criteria:**
- Kong/Prism running and responding
- All routes configured and working
- Rate limiting enforced
- Authentication working
- Logging capturing all requests

**Blocking:** Tasks 1, 2, 3, 4, 6, 7, 8

---

## 🔐 Week 2: Authentication Foundation

### Task 19: Backend Authentication Service (Days 1-4)

**Objective:** Complete JWT/OAuth2 authentication with role-based access control

**Checklist:**

#### Part 1: JWT Implementation

- [ ] Review `backend/services/auth-service/src/services/auth.service.ts`
- [ ] Implement JWT token generation
  - [ ] Generate access token (15 min expiry)
  - [ ] Generate refresh token (7 day expiry)
  - [ ] Include user ID, role, permissions in token

- [ ] Implement JWT validation
  - [ ] Verify signature
  - [ ] Check expiry
  - [ ] Extract claims

- [ ] Implement token refresh
  - [ ] Accept refresh token
  - [ ] Validate refresh token
  - [ ] Issue new access token
  - [ ] Rotate refresh token

- [ ] Test JWT flow
  ```bash
  # Login
  POST /api/auth/login
  { "email": "test@example.com", "password": "password" }
  
  # Should return
  { "accessToken": "...", "refreshToken": "..." }
  
  # Use token
  GET /api/auth/me
  Authorization: Bearer <accessToken>
  
  # Should return user info
  ```

#### Part 2: OAuth2 Implementation

- [ ] Set up Google OAuth2
  - [ ] Create Google OAuth app
  - [ ] Configure redirect URI
  - [ ] Implement Google login endpoint
  - [ ] Test Google login flow

- [ ] Set up Apple OAuth2
  - [ ] Create Apple OAuth app
  - [ ] Configure redirect URI
  - [ ] Implement Apple login endpoint
  - [ ] Test Apple login flow

- [ ] Implement OAuth2 callback handling
  - [ ] Exchange code for token
  - [ ] Create/update user
  - [ ] Issue JWT tokens

#### Part 3: Role-Based Access Control

- [ ] Review `backend/services/auth-service/src/middleware/permission.middleware.ts`
- [ ] Define roles
  - [ ] `admin` - Full access
  - [ ] `seller` - Seller features
  - [ ] `buyer` - Buyer features
  - [ ] `traveler` - Traveler features

- [ ] Define permissions
  - [ ] `create:listing` - Create product listing
  - [ ] `create:auction` - Create auction
  - [ ] `create:order` - Create order
  - [ ] `manage:users` - Admin user management
  - [ ] `manage:disputes` - Admin dispute management

- [ ] Implement permission middleware
  - [ ] Check user role
  - [ ] Check required permissions
  - [ ] Return 403 if unauthorized

- [ ] Implement resource-level permissions
  - [ ] User can only access own orders
  - [ ] Seller can only manage own listings
  - [ ] Admin can access all resources

#### Part 4: Testing

- [ ] Test login flow
  ```bash
  POST /api/auth/login
  { "email": "test@example.com", "password": "password" }
  ```

- [ ] Test token refresh
  ```bash
  POST /api/auth/refresh
  { "refreshToken": "..." }
  ```

- [ ] Test protected route
  ```bash
  GET /api/auth/me
  Authorization: Bearer <token>
  ```

- [ ] Test permission check
  ```bash
  POST /api/admin/users (as buyer)
  # Should return 403
  ```

- [ ] Test OAuth2 flow
  - [ ] Redirect to Google login
  - [ ] Callback with code
  - [ ] Exchange for JWT tokens

**Success Criteria:**
- JWT tokens generated and validated
- OAuth2 flows working (Google, Apple)
- Role-based access control enforced
- Permission middleware working
- All auth tests passing

**Blocking:** Tasks 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13

---

## 📋 Daily Standup Template

Use this for daily progress tracking:

```
Date: [DATE]
Week: [WEEK]
Task: [TASK_NUMBER - TASK_NAME]

✅ Completed Today:
- [Item 1]
- [Item 2]

⏳ In Progress:
- [Item 1]
- [Item 2]

🚫 Blockers:
- [Blocker 1]
- [Blocker 2]

📊 Progress:
- [X/Y] checklist items complete
- [X%] task complete

Next Steps:
- [Action 1]
- [Action 2]
```

---

## 🔍 Quality Gates

Before moving to next task, verify:

### Task 22 Complete When:
- [ ] All migrations run successfully
- [ ] Prisma client generates without errors
- [ ] All services can connect to database
- [ ] Database backup created

### Task 24 Complete When:
- [ ] API Gateway starts without errors
- [ ] All routes respond correctly
- [ ] Rate limiting works
- [ ] Authentication middleware works
- [ ] Logging captures all requests

### Task 19 Complete When:
- [ ] JWT tokens generated and validated
- [ ] OAuth2 flows working
- [ ] Role-based access control enforced
- [ ] All auth tests passing
- [ ] Permission middleware working

---

## 🚨 Common Issues & Solutions

### Database Migration Fails
**Problem:** Migration fails with "table already exists"
**Solution:** 
```bash
# Check migration status
npx prisma migrate status

# Reset database (dev only!)
npx prisma migrate reset

# Or manually drop and recreate
psql mnbara_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

### API Gateway Won't Start
**Problem:** Port already in use
**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### JWT Token Invalid
**Problem:** "Invalid token" error
**Solution:**
- Check token expiry: `jwt.decode(token)`
- Verify secret matches: Check `JWT_SECRET` env var
- Check token format: Should be `Bearer <token>`

### OAuth2 Redirect Loop
**Problem:** Infinite redirect between app and OAuth provider
**Solution:**
- Verify redirect URI matches exactly in OAuth app settings
- Check state parameter is being validated
- Verify callback endpoint is accessible

---

## 📞 Escalation Path

If blocked:

1. **Technical Issue:** Check docs in `docs/architecture/`
2. **Missing Dependency:** Check if previous task is complete
3. **Configuration:** Review `.env.example` and environment setup
4. **Integration:** Test service-to-service communication
5. **Escalate:** Document issue and request help

---

## ✨ Success Indicators

**After Week 1:**
- Database fully migrated
- API Gateway responding to requests
- All services can connect to database

**After Week 2:**
- Users can login with email/password
- Users can login with Google/Apple
- Protected routes require valid token
- Role-based access control working

**Ready for Phase 2 When:**
- All Week 1 & 2 tasks complete
- All quality gates passed
- No critical blockers remaining

---

**Document Owner:** Engineering Team  
**Last Updated:** December 20, 2025  
**Next Review:** December 22, 2025 (End of Week 1)
