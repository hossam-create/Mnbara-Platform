# P2P Exchange Service - Deployment Guide

**Version**: 1.0.0  
**Date**: January 28, 2026  
**Status**: Production Ready

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Migration](#database-migration)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [Verification](#verification)
7. [Rollback Procedure](#rollback-procedure)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- Node.js 20+ (LTS)
- PostgreSQL 15+
- Redis 7+
- Docker 24+ (for containerized deployment)
- npm 10+

### Required Accounts
- OpenExchangeRates API key
- Tatum.io API key
- Stripe account (optional)
- PayPal account (optional)
- AWS S3 bucket (optional, for file storage)

---

## Environment Configuration

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Configure Required Variables

**Database**:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/p2p_exchange_db
```

**Redis**:
```env
REDIS_URL=redis://localhost:6379
```

**Authentication**:
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production-256-bit-key
```

**FX Provider**:
```env
OPENEXCHANGERATES_API_KEY=your-openexchangerates-api-key
```

**External Escrow**:
```env
TATUM_API_KEY=your-tatum-api-key
```

**Payment Providers** (Optional):
```env
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
```

**File Storage**:
```env
STORAGE_TYPE=local  # or 's3'
UPLOAD_PATH=./uploads

# If using S3
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET=mnbarh-p2p-proofs
AWS_REGION=us-east-1
```

### 3. Validate Configuration

```bash
# Check environment variables
npm run env:check

# Test database connection
npm run db:test

# Test Redis connection
npm run redis:test
```

---

## Database Migration

### Development Environment

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed initial data
npm run prisma:seed
```

### Production Environment

**Linux/Mac**:
```bash
chmod +x scripts/migrate-production.sh
./scripts/migrate-production.sh
```

**Windows**:
```cmd
scripts\migrate-production.bat
```

### Migration Steps

1. **Generate Prisma Client**: Creates TypeScript types
2. **Run Migrations**: Applies database schema changes
3. **Seed Data**: Inserts initial data (currencies, providers)

### Verify Migration

```bash
# Check database tables
psql $DATABASE_URL -c "\dt"

# Check seeded data
psql $DATABASE_URL -c "SELECT * FROM \"ExternalEscrowProvider\";"
```

---

## Docker Deployment

### 1. Build Docker Image

```bash
cd backend/services/p2p-exchange-service
docker build -t mnbarh-p2p-exchange-service:latest .
```

### 2. Run with Docker Compose

```bash
# From project root
docker-compose up p2p-exchange-service
```

### 3. Verify Container

```bash
# Check container status
docker ps | grep p2p-exchange-service

# Check logs
docker logs mnbarh-p2p-exchange-service

# Check health
curl http://localhost:3005/health
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations tested on staging
- [ ] Redis connection verified
- [ ] External API keys validated
- [ ] SSL certificates configured
- [ ] Monitoring and logging setup
- [ ] Backup strategy in place
- [ ] Rollback plan documented

### Deployment Steps

#### 1. Prepare Production Environment

```bash
# Set NODE_ENV
export NODE_ENV=production

# Set production database URL
export DATABASE_URL=postgresql://user:password@prod-db:5432/p2p_exchange_db
```

#### 2. Run Database Migrations

```bash
./scripts/migrate-production.sh
```

#### 3. Build Application

```bash
npm run build
```

#### 4. Start Service

```bash
# Using PM2 (recommended)
pm2 start dist/index.js --name p2p-exchange-service

# Or using Docker
docker-compose -f docker-compose.prod.yml up -d p2p-exchange-service
```

#### 5. Verify Deployment

```bash
# Check health endpoint
curl https://api.mnbarh.com/api/v1/exchange/health

# Check service status
pm2 status p2p-exchange-service

# Check logs
pm2 logs p2p-exchange-service
```

---

## Verification

### Health Check

```bash
curl http://localhost:3005/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "service": "p2p-exchange-service",
  "version": "1.0.0",
  "timestamp": "2026-01-28T10:00:00.000Z",
  "database": "connected",
  "redis": "connected",
  "uptime": 3600
}
```

### API Endpoints

```bash
# Test exchange request creation
curl -X POST http://localhost:3005/api/v1/exchange/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "fromCurrency": "USD",
    "toCurrency": "SAR",
    "fromAmount": 100,
    "desiredRate": 3.75
  }'

# Test marketplace browsing
curl http://localhost:3005/api/v1/exchange/marketplace?fromCurrency=USD&toCurrency=SAR
```

### Database Verification

```bash
# Check table counts
psql $DATABASE_URL -c "
  SELECT 
    'ExchangeRequest' as table_name, COUNT(*) as count FROM \"ExchangeRequest\"
  UNION ALL
  SELECT 'ExternalEscrowProvider', COUNT(*) FROM \"ExternalEscrowProvider\";
"
```

---

## Rollback Procedure

### When to Rollback

- Critical bugs discovered
- Database corruption
- Service unavailable > 5 minutes
- Security vulnerability

### Rollback Steps

#### 1. Stop Service

```bash
# Using PM2
pm2 stop p2p-exchange-service

# Using Docker
docker-compose stop p2p-exchange-service
```

#### 2. Rollback Database (if needed)

```bash
./scripts/rollback-migration.sh
```

#### 3. Restore Previous Version

```bash
# Using PM2
pm2 delete p2p-exchange-service
pm2 start dist-backup/index.js --name p2p-exchange-service

# Using Docker
docker-compose down p2p-exchange-service
docker-compose up -d p2p-exchange-service:previous
```

#### 4. Verify Rollback

```bash
curl http://localhost:3005/health
```

---

## Troubleshooting

### Database Connection Issues

**Problem**: Cannot connect to database

**Solution**:
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check PostgreSQL status
systemctl status postgresql
```

### Redis Connection Issues

**Problem**: Cannot connect to Redis

**Solution**:
```bash
# Check REDIS_URL
echo $REDIS_URL

# Test connection
redis-cli -u $REDIS_URL ping

# Check Redis status
systemctl status redis
```

### Migration Failures

**Problem**: Migration fails

**Solution**:
```bash
# Check migration status
npm run prisma:migrate status

# Reset database (development only!)
npm run prisma:migrate reset

# Run migrations manually
psql $DATABASE_URL -f prisma/migrations/20260128_initial_production/migration.sql
```

### Port Already in Use

**Problem**: Port 3005 already in use

**Solution**:
```bash
# Find process using port
lsof -i :3005

# Kill process
kill -9 <PID>

# Or change port
export PORT=3006
```

### Health Check Fails

**Problem**: Health check returns unhealthy

**Solution**:
```bash
# Check logs
pm2 logs p2p-exchange-service

# Check database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check Redis connection
redis-cli -u $REDIS_URL ping

# Restart service
pm2 restart p2p-exchange-service
```

---

## Monitoring

### Logs

```bash
# View logs (PM2)
pm2 logs p2p-exchange-service

# View logs (Docker)
docker logs -f mnbarh-p2p-exchange-service

# View logs (file)
tail -f logs/p2p-exchange-service.log
```

### Metrics

```bash
# Prometheus metrics
curl http://localhost:3005/metrics

# Health check
curl http://localhost:3005/health
```

### Alerts

Configure alerts for:
- Service down
- High error rate (> 5%)
- Database connection failures
- Redis connection failures
- High response time (> 1s)

---

## Support

### Documentation
- API Documentation: `/docs/api`
- Architecture: `/docs/architecture`
- User Guide: `/docs/user-guide`

### Contact
- Email: support@mnbarh.com
- Slack: #p2p-exchange-support
- On-call: +966-XXX-XXXX

---

## Appendix

### Environment Variables Reference

See `.env.example` for complete list of environment variables.

### Database Schema

See `prisma/schema.prisma` for complete database schema.

### API Endpoints

See `PHASE_8_P2P_EXCHANGE_API_COMPLETION.md` for complete API documentation.

---

**Last Updated**: January 28, 2026  
**Version**: 1.0.0  
**Status**: Production Ready
