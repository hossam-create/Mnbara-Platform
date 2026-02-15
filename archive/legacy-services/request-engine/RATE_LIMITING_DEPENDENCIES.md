# Rate Limiting System - Dependencies & Setup

## Required Dependencies

### Production Dependencies

```json
{
  "dependencies": {
    "redis": "^4.6.0",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5"
  }
}
```

### Development Dependencies

```json
{
  "devDependencies": {
    "@types/redis": "^4.0.11",
    "@types/express": "^4.17.21",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11"
  }
}
```

---

## Installation

### Install Dependencies

```bash
cd backend/services/request-engine

# Install production dependencies
npm install redis express express-rate-limit

# Install development dependencies
npm install --save-dev @types/redis @types/express jest @types/jest
```

---

## Redis Setup

### Option 1: Local Redis (Development)

#### Install Redis

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Windows:**
```bash
# Using WSL or Docker
docker run -d -p 6379:6379 redis:alpine
```

#### Verify Installation

```bash
redis-cli ping
# Expected output: PONG
```

### Option 2: Docker Redis (Development)

```bash
# Run Redis container
docker run -d \
  --name redis-rate-limiter \
  -p 6379:6379 \
  redis:alpine

# Verify
docker ps | grep redis
```

### Option 3: Redis Cloud (Production)

**Recommended Providers:**
- **Redis Cloud** (redis.com)
- **AWS ElastiCache**
- **Azure Cache for Redis**
- **Google Cloud Memorystore**

**Connection String Format:**
```
redis://username:password@host:port
```

---

## Environment Variables

### Required Variables

Create or update `.env` file:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_TLS=false

# Rate Limiting Configuration
RATE_LIMIT_ENABLED=true
RATE_LIMIT_SKIP_SUCCESSFUL=false
RATE_LIMIT_SKIP_FAILED=false

# General API Limits
RATE_LIMIT_GENERAL_WINDOW=900000
RATE_LIMIT_GENERAL_MAX=100

# Sensitive Endpoints Limits
RATE_LIMIT_SENSITIVE_WINDOW=3600000
RATE_LIMIT_SENSITIVE_MAX=10

# Payment Limits
RATE_LIMIT_PAYMENT_WINDOW=3600000
RATE_LIMIT_PAYMENT_MAX=20

# Payout Limits
RATE_LIMIT_PAYOUT_WINDOW=3600000
RATE_LIMIT_PAYOUT_MAX=5

# Dispute Limits
RATE_LIMIT_DISPUTE_WINDOW=3600000
RATE_LIMIT_DISPUTE_MAX=10

# Webhook Limits
RATE_LIMIT_WEBHOOK_WINDOW=3600000
RATE_LIMIT_WEBHOOK_MAX=1000

# Role-Based Limits
RATE_LIMIT_UNVERIFIED_MAX=20
RATE_LIMIT_VERIFIED_MAX=100
```

### Example `.env.example`

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password_here
REDIS_TLS=false

# Rate Limiting
RATE_LIMIT_ENABLED=true
```

---

## Application Integration

### 1. Initialize Redis on Startup

**File:** `backend/services/request-engine/src/index.ts`

```typescript
import express from 'express';
import { initializeRedis, closeRedis } from './middleware/advancedRateLimiter';

const app = express();

// Initialize Redis
async function startServer() {
  try {
    // Initialize Redis for rate limiting
    await initializeRedis();
    console.log('✅ Redis initialized for rate limiting');

    // Start server
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, closing server...');
      server.close(async () => {
        await closeRedis();
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

### 2. Apply Rate Limiters to Routes

**File:** `backend/services/request-engine/src/app.ts`

```typescript
import express from 'express';
import {
  generalRateLimiter,
  paymentRateLimiter,
  disputeRateLimiter,
  payoutRateLimiter,
  webhookRateLimiter
} from './middleware/advancedRateLimiter';

const app = express();

// Apply general rate limiter to all routes
app.use('/api', generalRateLimiter);

// Apply specific rate limiters
app.use('/api/payments', paymentRateLimiter);
app.use('/api/disputes', disputeRateLimiter);
app.use('/api/payouts', payoutRateLimiter);
app.use('/api/webhooks', webhookRateLimiter);

export default app;
```

### 3. Update Existing Routes

**File:** `backend/services/request-engine/src/routes/disputeRoutes.ts`

```typescript
import { Router } from 'express';
import { disputeRateLimiter } from '../middleware/advancedRateLimiter';
import { authenticate } from '../middleware/auth';
import { DisputeController } from '../controllers/DisputeController';

const router = Router();
const disputeController = new DisputeController();

// Apply rate limiter to all dispute routes
router.use(authenticate, disputeRateLimiter);

router.post('/open', disputeController.openDispute);
router.post('/:id/evidence', disputeController.addEvidence);
router.get('/:id', disputeController.getDisputeById);

export default router;
```

---

## Testing Setup

### 1. Jest Configuration

**File:** `backend/services/request-engine/jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts']
};
```

### 2. Test Setup File

**File:** `backend/services/request-engine/src/test/setup.ts`

```typescript
// Mock Redis for tests
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    multi: jest.fn(() => ({
      zRemRangeByScore: jest.fn(),
      zCard: jest.fn(),
      zAdd: jest.fn(),
      expire: jest.fn(),
      exec: jest.fn().mockResolvedValue([null, 0, null, null])
    }))
  }))
}));

// Set test environment variables
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.NODE_ENV = 'test';
```

### 3. Run Tests

```bash
# Run all tests
npm test

# Run rate limiter tests only
npm test -- advancedRateLimiter.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

---

## Docker Setup

### Docker Compose Configuration

**File:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  redis:
    image: redis:alpine
    container_name: redis-rate-limiter
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  request-engine:
    build: ./backend/services/request-engine
    container_name: request-engine
    ports:
      - "3000:3000"
    environment:
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
    depends_on:
      redis:
        condition: service_healthy
    volumes:
      - ./backend/services/request-engine:/app
      - /app/node_modules

volumes:
  redis-data:
```

### Start Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Production Deployment

### 1. Redis Configuration

**Recommended Settings:**

```conf
# redis.conf

# Memory
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Security
requirepass your_strong_password_here
bind 0.0.0.0
protected-mode yes

# Performance
tcp-backlog 511
timeout 300
tcp-keepalive 300
```

### 2. Environment Variables (Production)

```env
# Production Redis
REDIS_URL=redis://username:password@production-redis.example.com:6379
REDIS_TLS=true
REDIS_PASSWORD=your_strong_password

# Rate Limiting
RATE_LIMIT_ENABLED=true
NODE_ENV=production
```

### 3. Health Checks

```typescript
// Add health check endpoint
app.get('/health/redis', async (req, res) => {
  try {
    const client = getRedisClient();
    if (!client) {
      return res.status(503).json({ status: 'unavailable' });
    }
    
    await client.ping();
    res.json({ status: 'healthy' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});
```

---

## Monitoring Setup

### 1. Redis Monitoring

```bash
# Monitor Redis in real-time
redis-cli monitor

# Check memory usage
redis-cli info memory

# Check connected clients
redis-cli client list

# Check slow queries
redis-cli slowlog get 10
```

### 2. Application Metrics

```typescript
// Add Prometheus metrics
import { Counter, Histogram } from 'prom-client';

const rateLimitCounter = new Counter({
  name: 'rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['endpoint', 'user_role']
});

const rateLimitViolations = new Counter({
  name: 'rate_limit_violations_total',
  help: 'Total number of rate limit violations',
  labelNames: ['endpoint', 'user_role']
});
```

---

## Troubleshooting

### Common Issues

#### 1. Redis Connection Failed

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution:**
```bash
# Check if Redis is running
redis-cli ping

# Start Redis
redis-server

# Or using Docker
docker start redis-rate-limiter
```

#### 2. Rate Limiter Not Working

**Error:** Requests not being rate limited

**Solution:**
```typescript
// Check if Redis is initialized
import { initializeRedis } from './middleware/advancedRateLimiter';

// Ensure this is called on startup
await initializeRedis();
```

#### 3. Admin Bypass Not Working

**Error:** Admin users still rate limited

**Solution:**
```typescript
// Verify user role is set correctly
console.log('User role:', req.user?.role);

// Ensure role enum matches
import { UserRole } from './middleware/advancedRateLimiter';
if (req.user?.role === UserRole.ADMIN) {
  // Should bypass
}
```

---

## Performance Tuning

### Redis Optimization

```conf
# Increase max connections
maxclients 10000

# Disable persistence for rate limiting (optional)
save ""
appendonly no

# Use pipelining
pipeline yes
```

### Application Optimization

```typescript
// Use connection pooling
const redisClient = createClient({
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
  },
  // Enable pipelining
  commandsQueueMaxLength: 1000
});
```

---

## Security Checklist

- [ ] Redis password configured
- [ ] Redis TLS enabled (production)
- [ ] Redis bind address restricted
- [ ] Rate limit violations logged
- [ ] Admin bypass logged
- [ ] Environment variables secured
- [ ] Redis memory limits set
- [ ] Connection timeouts configured
- [ ] Health checks implemented
- [ ] Monitoring alerts configured

---

**Document Version:** 1.0.0  
**Last Updated:** January 24, 2026  
**Status:** Production Ready
