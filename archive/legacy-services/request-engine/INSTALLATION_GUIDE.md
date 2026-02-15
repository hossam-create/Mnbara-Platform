# Installation Guide - Security Phase 5.1

## Quick Installation

### 1. Install Dependencies

```bash
cd backend/services/request-engine
npm install
```

This will install:
- `ioredis` - Redis client for rate limiting and fraud detection
- `@types/pg` - TypeScript types for PostgreSQL
- `@types/multer` - TypeScript types for file uploads
- All existing dependencies

### 2. Setup Redis

**Option A: Local Redis (Development)**
```bash
# Windows (using Chocolatey)
choco install redis-64

# Start Redis
redis-server

# Or using Docker
docker run -d -p 6379:6379 redis:latest
```

**Option B: Redis Cloud (Production)**
- Sign up at https://redis.com/try-free/
- Get connection details
- Update `.env` file

### 3. Configure Environment

Create or update `.env` file:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/request_engine

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_SKIP_SUCCESSFUL=false

# Fraud Detection
FRAUD_DETECTION_ENABLED=true
FRAUD_BLOCK_HIGH_RISK=true
FRAUD_LOG_LEVEL=warn

# Server
PORT=3000
NODE_ENV=development
```

### 4. Run Database Migration

```bash
# Windows
.\scripts\run-migration.bat 004_fraud_detection.sql

# Linux/Mac
./scripts/run-migration.sh 004_fraud_detection.sql
```

### 5. Run Tests

```bash
# All tests
npm test

# Specific tests
npm test -- advancedRateLimiter.test.ts
npm test -- FraudDetectionService.test.ts
```

### 6. Start Development Server

```bash
npm run dev
```

## Verification

### Test Rate Limiting

```bash
# Test with curl (should be rate limited after 5 requests)
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/test \
    -H "Content-Type: application/json" \
    -d '{"test": true}'
  echo ""
done
```

### Test Fraud Detection

```bash
# Test with bot user agent (should be flagged)
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -H "User-Agent: curl/7.68.0" \
  -d '{"amount": 1000}'

# Test with normal user agent (should pass)
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0" \
  -d '{"amount": 1000}'
```

### Check Redis

```bash
# Connect to Redis
redis-cli

# Check rate limit keys
KEYS velocity:*

# Check blacklist
KEYS blacklist:*

# Check device tracking
KEYS device:*
```

### Check Database

```sql
-- Check fraud alerts
SELECT * FROM fraud_alerts 
ORDER BY created_at DESC 
LIMIT 10;

-- Check high-risk alerts
SELECT * FROM fraud_alerts 
WHERE risk_level IN ('HIGH', 'CRITICAL')
ORDER BY created_at DESC;
```

## Troubleshooting

### Redis Connection Issues

**Problem**: Cannot connect to Redis
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution**:
1. Check if Redis is running: `redis-cli ping`
2. Start Redis: `redis-server`
3. Check Redis port: `netstat -an | findstr 6379`
4. Update REDIS_HOST and REDIS_PORT in `.env`

### Database Migration Issues

**Problem**: Migration fails
```
Error: relation "fraud_alerts" already exists
```

**Solution**:
1. Check if table exists: `\dt fraud_alerts` in psql
2. Drop table if needed: `DROP TABLE fraud_alerts CASCADE;`
3. Re-run migration

### Test Failures

**Problem**: Tests fail with module not found
```
Cannot find module 'ioredis'
```

**Solution**:
1. Install dependencies: `npm install`
2. Clear cache: `npm cache clean --force`
3. Reinstall: `rm -rf node_modules && npm install`

### Type Errors

**Problem**: TypeScript errors
```
Cannot find module 'pg' or its corresponding type declarations
```

**Solution**:
1. Install types: `npm install --save-dev @types/pg`
2. Rebuild: `npm run build`

## Production Deployment

### 1. Environment Setup

```env
# Production Redis (use Redis Cloud or AWS ElastiCache)
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
REDIS_TLS=true

# Production Database
DATABASE_URL=postgresql://user:password@prod-db:5432/request_engine

# Security
RATE_LIMIT_ENABLED=true
FRAUD_DETECTION_ENABLED=true
FRAUD_BLOCK_HIGH_RISK=true

# Logging
NODE_ENV=production
LOG_LEVEL=info
```

### 2. Build

```bash
npm run build
```

### 3. Start

```bash
npm start
```

### 4. Health Check

```bash
curl http://localhost:3000/health
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  request-engine:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/request_engine
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=request_engine
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Run with Docker

```bash
docker-compose up -d
```

## Monitoring

### Logs

```bash
# View logs
tail -f logs/app.log

# View error logs
tail -f logs/error.log

# View fraud detection logs
grep "fraud" logs/app.log
```

### Metrics

```bash
# Redis metrics
redis-cli INFO stats

# Database metrics
psql -c "SELECT * FROM pg_stat_database WHERE datname = 'request_engine';"
```

## Support

For issues or questions:
- Check documentation in `SECURITY_PHASE_5.1_COMPLETE.md`
- Review examples in `src/app.example.ts` and `src/app.fraud-example.ts`
- Check test files for usage patterns
- Contact development team

---

**Installation Complete!** 🚀

Your security systems are now ready to protect your application.
