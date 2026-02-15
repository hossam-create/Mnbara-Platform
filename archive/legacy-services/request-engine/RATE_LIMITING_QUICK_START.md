# Rate Limiting - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install ioredis
npm install --save-dev @types/ioredis
```

### 2. Start Redis

```bash
# Using Docker (recommended)
docker run -d --name redis-rate-limit -p 6379:6379 redis:7-alpine

# Or using Docker Compose
docker-compose up -d redis
```

### 3. Set Environment Variable

```env
# .env
REDIS_URL=redis://localhost:6379
```

### 4. Apply to Your Routes

```typescript
import express from 'express';
import {
  generalApiLimiter,
  paymentLimiter,
  disputeLimiter
} from './middleware/advancedRateLimiter';

const app = express();

// Apply general rate limiting to all API routes
app.use('/api', generalApiLimiter);

// Apply specific limits to sensitive routes
app.use('/api/payments', paymentLimiter);
app.use('/api/disputes', disputeLimiter);

// Your routes here
app.get('/api/users', (req, res) => {
  res.json({ message: 'Success' });
});

app.listen(3000);
```

### 5. Test It

```bash
# Make requests
curl http://localhost:3000/api/users

# Check headers
curl -I http://localhost:3000/api/users

# Expected headers:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
# X-RateLimit-Reset: 1706140800000
```

---

## 📊 Available Limiters

| Limiter | Limit | Window | Use Case |
|---------|-------|--------|----------|
| `generalApiLimiter` | 100 | 15 min | All API routes |
| `paymentLimiter` | 20 | 1 hour | Payment operations |
| `payoutLimiter` | 5 | 1 hour | Payout requests |
| `disputeLimiter` | 10 | 1 hour | Dispute operations |
| `webhookLimiter` | 1000 | 1 hour | Webhook endpoints |
| `sensitiveLimiter` | 10 | 1 hour | Sensitive operations |
| `authLimiter` | 5 | 15 min | Login/Register |

---

## 🎯 Common Use Cases

### Protect Login Endpoint

```typescript
import { authLimiter } from './middleware/advancedRateLimiter';

app.post('/api/auth/login', authLimiter, loginController);
app.post('/api/auth/register', authLimiter, registerController);
```

### Protect Payment Endpoints

```typescript
import { paymentLimiter } from './middleware/advancedRateLimiter';

app.post('/api/payments/create', paymentLimiter, createPayment);
app.post('/api/payments/refund', paymentLimiter, refundPayment);
```

### Custom Rate Limit

```typescript
import { createRateLimiter } from './middleware/advancedRateLimiter';

const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: 5,             // 5 uploads
  keyPrefix: 'upload'
});

app.post('/api/upload', uploadLimiter, uploadController);
```

---

## 🔑 Role-Based Limits

Limits automatically adjust based on user role:

```typescript
// Unverified users: 20% of base limit
req.user = { id: 1, role: 'USER', verified: false };
// Gets 20 requests/hour instead of 100

// Verified users: 100% of base limit
req.user = { id: 1, role: 'USER', verified: true };
// Gets 100 requests/hour

// Admins: Unlimited
req.user = { id: 1, role: 'ADMIN' };
// No rate limiting applied
```

---

## 🛠️ Utility Functions

### Check Rate Limit Status

```typescript
import { getRateLimitInfo } from './middleware/advancedRateLimiter';

const info = await getRateLimitInfo('ratelimit:api:user:123', {
  windowMs: 900000,
  maxRequests: 100,
  keyPrefix: 'api'
});

console.log(`Remaining: ${info.remaining}/${info.limit}`);
```

### Reset Rate Limit (Admin)

```typescript
import { resetRateLimit } from './middleware/advancedRateLimiter';

await resetRateLimit('ratelimit:api:user:123');
```

---

## 📝 Response Format

### Success (Within Limit)

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706140800000

{
  "data": "..."
}
```

### Rate Limit Exceeded

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706140800000
Retry-After: 900

{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 900,
  "limit": 100,
  "reset": "2026-01-24T12:00:00.000Z"
}
```

---

## 🐛 Troubleshooting

### Redis Not Connected

```bash
# Check if Redis is running
docker ps | grep redis

# Start Redis if not running
docker start redis-rate-limit

# Test connection
redis-cli ping
# Should return: PONG
```

### Rate Limits Not Working

```typescript
// 1. Check if middleware is applied
app.use('/api', generalApiLimiter); // ✅ Correct

// 2. Check if user is admin (bypasses limits)
console.log(req.user?.role); // If 'ADMIN', limits are bypassed

// 3. Check Redis connection
import { initializeRedis } from './middleware/advancedRateLimiter';
const redis = initializeRedis();
await redis.ping(); // Should not throw error
```

---

## 📚 Full Documentation

For complete documentation, see:
- `RATE_LIMITING_DOCUMENTATION.md` - Complete guide
- `RATE_LIMITING_DEPENDENCIES.md` - Setup and dependencies
- `RATE_LIMITING_PHASE_5.1_COMPLETE.md` - Implementation details

---

## 🎓 Examples

### Example 1: E-commerce API

```typescript
import express from 'express';
import {
  generalApiLimiter,
  paymentLimiter,
  authLimiter
} from './middleware/advancedRateLimiter';

const app = express();

// General API protection
app.use('/api', generalApiLimiter);

// Auth endpoints - strict limits
app.post('/api/auth/login', authLimiter, login);
app.post('/api/auth/register', authLimiter, register);

// Payment endpoints - moderate limits
app.post('/api/checkout', paymentLimiter, checkout);
app.post('/api/refund', paymentLimiter, refund);

// Public endpoints - general limits
app.get('/api/products', getProducts);
app.get('/api/categories', getCategories);
```

### Example 2: Admin Dashboard

```typescript
import { createRateLimiter } from './middleware/advancedRateLimiter';

// Admins bypass automatically, but set limits for non-admins
const adminLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 50,
  keyPrefix: 'admin'
});

app.use('/api/admin', requireAdmin, adminLimiter);
```

### Example 3: Webhook Receiver

```typescript
import { webhookLimiter } from './middleware/advancedRateLimiter';

// High limits for webhooks
app.post('/webhooks/stripe', webhookLimiter, stripeWebhook);
app.post('/webhooks/paypal', webhookLimiter, paypalWebhook);
```

---

## ⚡ Performance Tips

1. **Use Redis Cluster** for high traffic
2. **Monitor Redis memory** usage
3. **Set appropriate TTL** on keys
4. **Use connection pooling**
5. **Enable Redis persistence** if needed

---

## 🔒 Security Tips

1. **Always use HTTPS** in production
2. **Monitor rate limit violations**
3. **Adjust limits** based on usage patterns
4. **Combine with WAF** for additional protection
5. **Use strong Redis password**

---

## 📞 Support

- Check `RATE_LIMITING_DOCUMENTATION.md` for detailed info
- Review test cases in `__tests__/advancedRateLimiter.test.ts`
- Monitor logs for rate limit violations

---

**Quick Start Version:** 1.0.0  
**Last Updated:** January 24, 2026
