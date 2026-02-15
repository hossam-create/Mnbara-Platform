# Rate Limiting System - Documentation

## Overview

A comprehensive, Redis-based rate limiting system that provides scalable request throttling with multiple tiers, role-based limits, and admin bypass capabilities.

## Features

✅ **Redis-Based Storage** - Distributed rate limiting across multiple instances  
✅ **Multiple Tiers** - Different limits for different endpoint types  
✅ **Role-Based Limits** - Custom limits based on user verification status  
✅ **Admin Bypass** - Unlimited access for admin users  
✅ **Violation Logging** - Comprehensive logging of rate limit violations  
✅ **Standard Headers** - RFC-compliant rate limit headers  
✅ **Graceful Degradation** - Fallback behavior when Redis is unavailable  
✅ **Flexible Key Strategies** - Support for IP, User ID, and API Key  

---

## Architecture

### Storage Strategy

The system uses **Redis Sorted Sets** for implementing a sliding window rate limiter:

```
Key: rl:payment:user:123
Value: Sorted Set of timestamps
Score: Request timestamp
```

**Benefits:**
- Accurate sliding window (not fixed window)
- Automatic cleanup of old entries
- Atomic operations
- Distributed across instances

### Key Generation

Rate limit keys are generated using a hierarchical strategy:

1. **Authenticated Users**: `rl:{tier}:user:{userId}`
2. **API Key Users**: `rl:{tier}:apikey:{apiKey}`
3. **Anonymous Users**: `rl:{tier}:ip:{ipAddress}`

---

## Rate Limit Tiers

### 1. General API (Default)
```typescript
{
  windowMs: 15 * 60 * 1000,  // 15 minutes
  maxRequests: 100,
  keyPrefix: 'rl:general'
}
```
**Use Case:** Default limit for all API endpoints

### 2. Sensitive Endpoints
```typescript
{
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: 10,
  keyPrefix: 'rl:sensitive'
}
```
**Use Case:** Payouts, disputes, admin actions

### 3. Webhook Endpoints
```typescript
{
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: 1000,
  keyPrefix: 'rl:webhook'
}
```
**Use Case:** External webhook receivers (Stripe, payment providers)

### 4. Payment Endpoints
```typescript
{
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: 20,
  keyPrefix: 'rl:payment'
}
```
**Use Case:** `/api/payments/*` endpoints

### 5. Payout Endpoints
```typescript
{
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: 5,
  keyPrefix: 'rl:payout'
}
```
**Use Case:** `/api/payouts/*` endpoints

### 6. Dispute Endpoints
```typescript
{
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: 10,
  keyPrefix: 'rl:dispute'
}
```
**Use Case:** `/api/disputes/*` endpoints

---

## Role-Based Limits

### Unverified Users
```typescript
{
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: 20
}
```
**Applied to:** Users without email verification

### Verified Users
```typescript
{
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: 100
}
```
**Applied to:** Users with verified email

### Admin Users
```typescript
{
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: Infinity  // Unlimited
}
```
**Applied to:** Users with ADMIN role (bypasses all limits)

---

## Usage

### Basic Usage

```typescript
import { createRateLimiter } from './middleware/advancedRateLimiter';

// Create custom rate limiter
const customLimiter = createRateLimiter({
  windowMs: 60000,      // 1 minute
  maxRequests: 10,      // 10 requests
  keyPrefix: 'custom'
});

// Apply to route
app.get('/api/custom', customLimiter, handler);
```

### Preset Limiters

```typescript
import {
  generalRateLimiter,
  paymentRateLimiter,
  disputeRateLimiter,
  payoutRateLimiter
} from './middleware/advancedRateLimiter';

// Apply preset limiters
app.use('/api', generalRateLimiter);
app.use('/api/payments', paymentRateLimiter);
app.use('/api/disputes', disputeRateLimiter);
app.use('/api/payouts', payoutRateLimiter);
```

### Role-Based Limiting

```typescript
import { createRoleBasedRateLimiter } from './middleware/advancedRateLimiter';

const roleBasedLimiter = createRoleBasedRateLimiter();

// Apply to protected routes
app.use('/api/protected', authenticate, roleBasedLimiter, handler);
```

### Custom Handler

```typescript
const limiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 10,
  keyPrefix: 'custom',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Custom rate limit message',
      retryAfter: 60
    });
  }
});
```

---

## Response Headers

The middleware sets standard rate limit headers on all responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2026-01-24T12:00:00.000Z
Retry-After: 900
```

### Header Descriptions

- **X-RateLimit-Limit**: Maximum requests allowed in the window
- **X-RateLimit-Remaining**: Requests remaining in current window
- **X-RateLimit-Reset**: ISO timestamp when the limit resets
- **Retry-After**: Seconds until the limit resets (only when exceeded)

---

## Error Response

When rate limit is exceeded:

```json
{
  "error": "Too many requests",
  "message": "You have exceeded the rate limit. Please try again later.",
  "retryAfter": 900,
  "limit": 100,
  "resetTime": "2026-01-24T12:00:00.000Z"
}
```

**HTTP Status Code:** `429 Too Many Requests`

---

## Redis Setup

### Environment Variables

```env
REDIS_URL=redis://localhost:6379
```

### Initialize Redis

```typescript
import { initializeRedis, closeRedis } from './middleware/advancedRateLimiter';

// On application startup
await initializeRedis();

// On application shutdown
await closeRedis();
```

### Redis Connection Handling

The system handles Redis connection issues gracefully:

- **Automatic Reconnection**: Up to 10 attempts with exponential backoff
- **Fallback Behavior**: Allows requests when Redis is unavailable
- **Connection Monitoring**: Logs connection status changes

---

## Logging

### Violation Logging

When a rate limit is exceeded:

```typescript
logger.warn('Rate limit exceeded', {
  key: 'rl:payment:user:123',
  userId: 123,
  ip: '192.168.1.1',
  path: '/api/payments/create',
  method: 'POST',
  limit: 20,
  resetTime: '2026-01-24T12:00:00.000Z'
});
```

### Connection Logging

```typescript
logger.info('Redis client connected');
logger.info('Redis client ready');
logger.error('Redis client error', { error });
```

---

## Admin Bypass

Admin users automatically bypass all rate limits:

```typescript
// Detected automatically from req.user.role
if (req.user?.role === UserRole.ADMIN) {
  logger.debug('Admin user bypassing rate limit', { userId: req.user.id });
  return next();
}
```

**Requirements:**
- User must be authenticated
- User role must be `ADMIN`
- Logged for audit purposes

---

## Route Configuration Examples

### Payment Service

```typescript
import express from 'express';
import { paymentRateLimiter } from './middleware/advancedRateLimiter';
import { authenticate } from './middleware/auth';

const router = express.Router();

// Apply rate limiter to all payment routes
router.use(authenticate, paymentRateLimiter);

router.post('/create', paymentController.create);
router.get('/:id', paymentController.getById);
router.post('/:id/refund', paymentController.refund);

export default router;
```

### Dispute Service

```typescript
import express from 'express';
import { disputeRateLimiter } from './middleware/advancedRateLimiter';
import { authenticate } from './middleware/auth';

const router = express.Router();

// Apply rate limiter to all dispute routes
router.use(authenticate, disputeRateLimiter);

router.post('/open', disputeController.open);
router.post('/:id/evidence', disputeController.addEvidence);
router.get('/:id', disputeController.getById);

export default router;
```

### Payout Service

```typescript
import express from 'express';
import { payoutRateLimiter } from './middleware/advancedRateLimiter';
import { authenticate, requireAdmin } from './middleware/auth';

const router = express.Router();

// Apply strict rate limiter to payout routes
router.use(authenticate, requireAdmin, payoutRateLimiter);

router.post('/create', payoutController.create);
router.post('/:id/approve', payoutController.approve);
router.get('/:id', payoutController.getById);

export default router;
```

---

## Performance Considerations

### Redis Operations

Each rate limit check performs:
1. Remove old entries (ZREMRANGEBYSCORE)
2. Count current requests (ZCARD)
3. Add new request (ZADD)
4. Set expiry (EXPIRE)

**Total:** 4 Redis operations per request (pipelined)

### Optimization Tips

1. **Use Connection Pooling**: Redis client handles this automatically
2. **Monitor Redis Memory**: Set appropriate TTL values
3. **Use Redis Cluster**: For high-traffic applications
4. **Cache Rate Limit Info**: Consider caching for very high traffic

---

## Testing

### Unit Tests

```bash
npm test -- advancedRateLimiter.test.ts
```

### Integration Tests

```bash
# Start Redis
docker run -d -p 6379:6379 redis:alpine

# Run tests
npm test
```

### Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:3000/api/test

# Using Artillery
artillery quick --count 100 --num 10 http://localhost:3000/api/test
```

---

## Monitoring

### Metrics to Track

1. **Rate Limit Hits**: Number of requests blocked
2. **Rate Limit Violations by User**: Identify abusive users
3. **Rate Limit Violations by Endpoint**: Identify problematic endpoints
4. **Redis Connection Status**: Monitor Redis availability
5. **Average Response Time**: Impact of rate limiting

### Recommended Alerts

- **High Violation Rate**: > 10% of requests blocked
- **Redis Connection Down**: Alert immediately
- **Specific User Abuse**: > 100 violations per hour
- **Endpoint Abuse**: > 50% requests blocked for an endpoint

---

## Troubleshooting

### Redis Connection Issues

**Problem:** Rate limiter not working  
**Solution:** Check Redis connection and logs

```bash
# Check Redis status
redis-cli ping

# Check logs
tail -f logs/app.log | grep Redis
```

### High Rate Limit Violations

**Problem:** Legitimate users being blocked  
**Solution:** Adjust limits or investigate traffic patterns

```typescript
// Increase limits temporarily
const customLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 200,  // Increased from 100
  keyPrefix: 'custom'
});
```

### Admin Bypass Not Working

**Problem:** Admin users still rate limited  
**Solution:** Verify user role is set correctly

```typescript
// Check user object
console.log('User role:', req.user?.role);

// Ensure role is ADMIN
if (req.user?.role !== UserRole.ADMIN) {
  logger.warn('User is not admin', { userId: req.user?.id, role: req.user?.role });
}
```

---

## Security Considerations

### DDoS Protection

Rate limiting provides basic DDoS protection but should be combined with:

1. **WAF (Web Application Firewall)**: CloudFlare, AWS WAF
2. **Network-Level Protection**: Fail2ban, iptables
3. **CDN**: Distribute load across edge servers

### API Key Security

When using API keys for rate limiting:

1. **Hash API Keys**: Store hashed versions in database
2. **Rotate Keys**: Implement key rotation policy
3. **Monitor Usage**: Track API key usage patterns
4. **Revoke Compromised Keys**: Immediate revocation capability

### IP Spoofing

Be aware of IP spoofing when using IP-based rate limiting:

1. **Use X-Forwarded-For Carefully**: Validate proxy headers
2. **Trust Proxy Settings**: Configure Express trust proxy
3. **Prefer User ID**: Use authenticated user ID when possible

---

## Future Enhancements

### Planned Features

1. **Dynamic Rate Limits**: Adjust limits based on system load
2. **Burst Allowance**: Allow short bursts above limit
3. **Rate Limit Quotas**: Monthly/daily quotas in addition to per-hour
4. **Whitelist/Blacklist**: IP-based whitelist and blacklist
5. **Rate Limit Analytics Dashboard**: Real-time monitoring UI

### Integration Opportunities

1. **Prometheus Metrics**: Export rate limit metrics
2. **Grafana Dashboards**: Visualize rate limit data
3. **Slack Alerts**: Notify team of violations
4. **Datadog Integration**: APM monitoring

---

## Dependencies

```json
{
  "dependencies": {
    "redis": "^4.6.0",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/redis": "^4.0.11",
    "@types/express": "^4.17.21",
    "jest": "^29.7.0"
  }
}
```

---

## License

Internal use only - Part of Request Engine Service

---

**Document Version:** 1.0.0  
**Last Updated:** January 24, 2026  
**Status:** Production Ready
