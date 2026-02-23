# Mnbara Platform - Architecture Standards

**Version:** 2.0
**Date:** February 18, 2026
**Status:** OFFICIAL STANDARD

---

## Framework Standards

### Backend Services

**Primary Framework:** NestJS (Recommended for all new services)

**Rationale:**
- Built-in dependency injection
- Decorator-based routing
- Integrated validation with class-validator
- Native Swagger/OpenAPI support
- Better testability
- Consistent structure

**Legacy Framework:** Express (Existing services only)

**Migration Strategy:**
- New services MUST use NestJS
- Existing Express services can remain but should be migrated gradually
- No new Express services will be created

---

## Service Structure Standards

### Entry Points

**Rule:** Each service MUST have exactly ONE entry point

**NestJS Services:**
```
src/
  main.ts          ← SINGLE ENTRY POINT
  app.module.ts
  ...
```

**Express Services (Legacy):**
```
src/
  index.ts         ← SINGLE ENTRY POINT
  ...
```

**package.json:**
```json
{
  "scripts": {
    "start": "node dist/main.js",  // NestJS
    // OR
    "start": "node dist/index.js"  // Express
  }
}
```

---

## Security Standards

### 1. Rate Limiting

**Requirement:** ALL public-facing endpoints MUST have rate limiting

**Implementation:**
```typescript
import { rateLimiter } from '@shared/middleware/rate-limiter';

app.use('/api/', rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // requests per window
}));
```

### 2. CORS Configuration

**Requirement:** ALL services MUST use environment-based CORS

**Implementation:**
```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
```

### 3. Authentication

**Requirement:** ALL protected endpoints MUST validate JWT tokens

**Implementation:**
```typescript
const authGuard = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.user = { id: userId, role: req.headers['x-user-role'] || 'user' };
  next();
};
```

### 4. Authorization

**Requirement:** Admin endpoints MUST verify admin role

**Implementation:**
```typescript
const adminGuard = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

---

## Code Quality Standards

### 1. No TODO Comments in Production

**Rule:** Replace all TODO comments with:
- GitHub issues (for future work)
- Proper implementation (for critical features)
- Documentation (for intentional stubs)

**Bad:**
```typescript
// TODO: Implement this later
function doSomething() {}
```

**Good:**
```typescript
/**
 * @see https://github.com/org/repo/issues/123
 * @deferred Post-MVP - Polling-based approach is sufficient for MVP
 */
function doSomething() {}
```

### 2. No Deprecated Code

**Rule:** Delete deprecated code, don't just mark it

**Bad:**
```typescript
/** @deprecated Use newFunction instead */
function oldFunction() {}
```

**Good:**
```typescript
// Delete oldFunction entirely
// Update all references to use newFunction
```

### 3. Single Responsibility

**Rule:** Each service should have ONE clear purpose

**Examples:**
- ✅ wallet-service: Wallet operations only
- ✅ payment-service: Payment processing only
- ❌ mega-service: Everything in one service

---

## Database Standards

### 1. Prisma for All Services

**Requirement:** ALL services MUST use Prisma ORM

**Structure:**
```
service/
  prisma/
    schema.prisma
    migrations/
```

### 2. Migration Management

**Rule:** Migrations MUST be versioned and tracked

**Process:**
1. Create migration: `npx prisma migrate dev`
2. Test migration locally
3. Commit migration files
4. Deploy with: `npx prisma migrate deploy`

---

## Testing Standards

### 1. Minimum Coverage

**Requirements:**
- Unit tests: 80% coverage minimum
- Integration tests: Critical flows only
- E2E tests: User journeys only

### 2. Test Structure

```
service/
  src/
    __tests__/
      unit/
      integration/
      e2e/
```

---

## Documentation Standards

### 1. README Requirements

**Every service MUST have:**
- Purpose description
- Setup instructions
- Environment variables
- API endpoints
- Testing instructions

### 2. API Documentation

**NestJS Services:**
- Use Swagger decorators
- Auto-generate OpenAPI spec

**Express Services:**
- Document endpoints in README
- Consider adding Swagger manually

---

## Deployment Standards

### 1. Health Checks

**Requirement:** ALL services MUST have `/health` endpoint

**Implementation:**
```typescript
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'healthy',
      service: 'service-name',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy' });
  }
});
```

### 2. Environment Variables

**Requirement:** ALL configuration MUST use environment variables

**Structure:**
```
.env.example      ← Template with safe values
.env              ← Actual values (gitignored)
```

### 3. Docker Support

**Requirement:** ALL services MUST have Dockerfile

**Standard Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

---

## Port Allocation

**Standard Port Map:**
```
3000  - api-gateway
3001  - auth-service
3002  - user-service
3003  - payment-service
3004  - product-service
3005  - wallet-service
3006  - orders-service
3007  - escrow-service
3008  - settlement-service
3009  - trips-service
3010  - matching-service
3011  - notification-service
3012  - subscription-service
3013  - cart-service
3014  - feature-management-service
3015  - admin-service
3016  - country-layer-service
```

---

## Logging Standards

### 1. Structured Logging

**Requirement:** Use Winston or similar structured logger

**Implementation:**
```typescript
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' })
  ]
});
```

### 2. Log Levels

- **error:** System errors, exceptions
- **warn:** Warnings, deprecated usage
- **info:** Important events, state changes
- **debug:** Detailed debugging information

---

## Error Handling Standards

### 1. Consistent Error Responses

**Format:**
```json
{
  "success": false,
  "error": "Error message in English",
  "errorCode": "ERROR_CODE",
  "timestamp": "2026-02-18T10:00:00Z"
}
```

### 2. HTTP Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
- 503: Service Unavailable

---

## Performance Standards

### 1. Response Time Targets

- API endpoints: < 200ms (p95)
- Database queries: < 50ms (p95)
- External API calls: < 1s (p95)

### 2. Caching Strategy

**Use Redis for:**
- Session data
- Frequently accessed data
- Rate limiting counters

---

## Monitoring Standards

### 1. Metrics

**Required metrics:**
- Request count
- Response time
- Error rate
- Database connection pool

### 2. Alerts

**Required alerts:**
- Service down
- High error rate (> 5%)
- Slow response time (> 1s)
- Database connection issues

---

## Compliance

**All services MUST comply with these standards by:**
- New services: Immediately
- Existing services: Within 6 months

**Exceptions:**
- Must be documented
- Must have approval from tech lead
- Must have migration plan

---

## Review Process

**Standards Review:** Quarterly
**Next Review:** May 2026
**Owner:** Engineering Team

---

**END OF ARCHITECTURE STANDARDS**
