# P2P Exchange Service - Staging Deployment Guide

## Overview

This guide covers the complete process for deploying the P2P Exchange Service to the staging environment.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Deployment Steps](#deployment-steps)
4. [Verification](#verification)
5. [Smoke Tests](#smoke-tests)
6. [Pilot Testing](#pilot-testing)
7. [Monitoring](#monitoring)
8. [Rollback Procedure](#rollback-procedure)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+
- npm 9+
- PostgreSQL 14+ (for staging database)
- Redis 7+ (for staging cache)
- curl (for testing)

### Required Access
- Staging server SSH access
- Docker registry access
- Staging database credentials
- AWS S3 access (for file storage)
- External API keys:
  - OpenExchangeRates API key
  - Tatum.io API key
  - Stripe test API key
  - PayPal sandbox credentials
  - Wise sandbox API key
- Sentry DSN (for error tracking)

### Required Files
- `.env.staging` - Staging environment variables
- `docker-compose.staging.yml` - Staging Docker Compose config
- SSL certificates (if using HTTPS)

---

## Pre-Deployment Checklist

### Code Readiness
- [ ] All Phase 8 Day 1-3 tasks completed
- [ ] All tests passing (unit, integration, e2e)
- [ ] Code reviewed and approved
- [ ] No critical security vulnerabilities
- [ ] Documentation updated

### Infrastructure Readiness
- [ ] Staging database created and accessible
- [ ] Staging Redis instance running
- [ ] Docker network configured
- [ ] S3 bucket created for proof storage
- [ ] Monitoring stack deployed (Prometheus, Grafana)
- [ ] Sentry project created

### Configuration Readiness
- [ ] `.env.staging` file configured with all variables
- [ ] External API keys tested and working
- [ ] Database connection string verified
- [ ] Redis connection string verified
- [ ] CORS origins configured
- [ ] Feature flags set appropriately

### Team Readiness
- [ ] Deployment window scheduled
- [ ] Team notified of deployment
- [ ] On-call engineer assigned
- [ ] Rollback plan reviewed
- [ ] Communication plan ready

---

## Deployment Steps

### Step 1: Prepare Environment

```bash
# Clone repository (if not already)
git clone https://github.com/mnbarh/platform.git
cd platform/backend/services/p2p-exchange-service

# Checkout latest stable branch
git checkout main
git pull origin main

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate
```

### Step 2: Configure Environment

```bash
# Copy staging environment file
cp .env.staging.example .env.staging

# Edit environment variables
nano .env.staging

# Verify configuration
cat .env.staging | grep -v '^#' | grep -v '^$'
```

**Critical Variables to Configure**:
- `DATABASE_URL` - Staging database connection
- `REDIS_URL` - Staging Redis connection
- `JWT_SECRET` - Unique secret for staging
- `OPENEXCHANGERATES_API_KEY` - FX rates API key
- `TATUM_API_KEY` - External escrow API key
- `STRIPE_SECRET_KEY` - Stripe test key
- `AWS_ACCESS_KEY_ID` - AWS credentials
- `AWS_S3_BUCKET` - S3 bucket name
- `SENTRY_DSN` - Sentry error tracking

### Step 3: Run Automated Deployment

**Linux/Mac**:
```bash
# Make script executable
chmod +x scripts/deploy-staging.sh

# Run deployment
./scripts/deploy-staging.sh
```

**Windows**:
```cmd
scripts\deploy-staging.bat
```

The script will:
1. Check prerequisites
2. Build Docker image
3. Stop existing container
4. Run database migrations
5. Seed database
6. Start new container
7. Wait for health check
8. Verify deployment
9. Run smoke tests

### Step 4: Manual Deployment (Alternative)

If automated script fails, deploy manually:

```bash
# 1. Build Docker image
docker build -t mnbarh/p2p-exchange-service:staging .

# 2. Stop existing container
docker stop p2p-exchange-service-staging
docker rm p2p-exchange-service-staging

# 3. Run database migrations
export $(cat .env.staging | grep -v '^#' | xargs)
npm run prisma:deploy

# 4. Seed database
npm run prisma:seed

# 5. Start container
docker run -d \
  --name p2p-exchange-service-staging \
  --env-file .env.staging \
  -p 3005:3005 \
  --network mnbarh-network \
  --restart unless-stopped \
  mnbarh/p2p-exchange-service:staging

# 6. Check logs
docker logs -f p2p-exchange-service-staging
```

---

## Verification

### 1. Health Check

```bash
curl http://staging.mnbarh.com:3005/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "p2p-exchange-service",
  "version": "1.0.0",
  "timestamp": "2026-01-28T12:00:00.000Z",
  "database": "connected",
  "redis": "connected",
  "uptime": 60
}
```

### 2. Metrics Check

```bash
curl http://staging.mnbarh.com:3005/metrics
```

Should return Prometheus metrics in text format.

### 3. Database Check

```bash
# Connect to database
psql $DATABASE_URL

# Check tables
\dt

# Check data
SELECT COUNT(*) FROM "ExchangeRequest";
SELECT COUNT(*) FROM "ExternalEscrowProvider";

# Exit
\q
```

### 4. Redis Check

```bash
# Connect to Redis
redis-cli -h staging-redis

# Check connection
PING

# Check keys
KEYS *

# Exit
exit
```

### 5. Logs Check

```bash
# View recent logs
docker logs --tail 100 p2p-exchange-service-staging

# Follow logs
docker logs -f p2p-exchange-service-staging

# Check for errors
docker logs p2p-exchange-service-staging 2>&1 | grep -i error
```

---

## Smoke Tests

### Automated Smoke Tests

```bash
# Run smoke tests
chmod +x scripts/smoke-tests.sh
./scripts/smoke-tests.sh
```

### Manual Smoke Tests

#### Test 1: Create Exchange Request

```bash
# Get user token (from auth service)
USER_TOKEN="your-user-token"

# Create exchange request
curl -X POST http://staging.mnbarh.com:3005/api/v1/exchange/requests \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromCurrency": "USD",
    "toCurrency": "EGP",
    "fromAmount": 100,
    "preferredRate": 30.5,
    "expiresInHours": 24
  }'
```

#### Test 2: Browse Marketplace

```bash
curl http://staging.mnbarh.com:3005/api/v1/exchange/marketplace
```

#### Test 3: Get Security Deposit

```bash
curl -H "Authorization: Bearer $USER_TOKEN" \
  http://staging.mnbarh.com:3005/api/v1/exchange/security-deposit
```

#### Test 4: Get External Escrow Providers

```bash
curl http://staging.mnbarh.com:3005/api/v1/exchange/external-escrow-providers
```

---

## Pilot Testing

### Phase 1: Internal Testing (Day 1-2)

**Participants**: 5-10 internal team members

**Test Scenarios**:
1. Create exchange request (USD → EGP, $50)
2. Browse marketplace
3. Accept match (manual)
4. Complete internal settlement
5. Test external escrow (Tatum)
6. Test communication
7. Upload proof of payment
8. Confirm receipt

**Success Criteria**:
- All scenarios complete successfully
- No critical bugs
- < 1% error rate
- Response time < 500ms

### Phase 2: Pilot Users (Day 3-7)

**Participants**: 50 selected users

**Limits**:
- Max transaction: $100
- Max daily volume: $500
- Trusted users only
- Manual approval for first transaction

**Monitoring**:
- Real-time error tracking
- User feedback collection
- Performance metrics
- Settlement success rate

**Success Criteria**:
- 95%+ settlement success rate
- < 5% dispute rate
- 4.0+ average rating
- < 2% error rate

---

## Monitoring

### Grafana Dashboard

URL: `http://staging.mnbarh.com:3000`

**Key Panels to Monitor**:
1. Service Health (uptime, error rate)
2. Exchange Requests (created, completed)
3. Matching Engine (matches, latency)
4. Settlements (success rate, duration)
5. Security (deposits, fraud detections)
6. External Providers (API calls, errors)
7. System Resources (CPU, memory)

### Prometheus Alerts

URL: `http://staging.mnbarh.com:9090`

**Critical Alerts**:
- ServiceDown
- HighErrorRate
- DatabaseConnectionFailed
- HighSettlementFailureRate

### Sentry Error Tracking

URL: `https://sentry.io/organizations/mnbarh/projects/p2p-exchange-staging`

**Monitor**:
- Error frequency
- Error types
- Affected users
- Stack traces

### Log Aggregation

```bash
# View logs in real-time
docker logs -f p2p-exchange-service-staging

# Search for errors
docker logs p2p-exchange-service-staging 2>&1 | grep ERROR

# Search for specific user
docker logs p2p-exchange-service-staging 2>&1 | grep "userId:user_123"
```

---

## Rollback Procedure

### Automatic Rollback

The deployment script includes automatic rollback on failure.

### Manual Rollback

If issues are discovered after deployment:

```bash
# 1. Stop current container
docker stop p2p-exchange-service-staging
docker rm p2p-exchange-service-staging

# 2. Restore previous version
docker run -d \
  --name p2p-exchange-service-staging \
  --env-file .env.staging \
  -p 3005:3005 \
  --network mnbarh-network \
  --restart unless-stopped \
  mnbarh/p2p-exchange-service:staging-previous

# 3. Rollback database (if needed)
npm run prisma:migrate:rollback

# 4. Verify service
curl http://staging.mnbarh.com:3005/health

# 5. Notify team
echo "Rollback completed. Service restored to previous version."
```

### Rollback Triggers

Immediate rollback if:
- Error rate > 5%
- Settlement failure rate > 10%
- Service unavailable > 5 minutes
- Critical security vulnerability
- Database corruption

---

## Troubleshooting

### Issue: Service Won't Start

**Symptoms**: Container exits immediately

**Diagnosis**:
```bash
docker logs p2p-exchange-service-staging
```

**Common Causes**:
1. Database connection failed
   - Check `DATABASE_URL`
   - Verify database is running
   - Check network connectivity

2. Redis connection failed
   - Check `REDIS_URL`
   - Verify Redis is running
   - Check network connectivity

3. Missing environment variables
   - Check `.env.staging` file
   - Verify all required variables are set

### Issue: High Error Rate

**Symptoms**: Many 500 errors in logs

**Diagnosis**:
```bash
# Check error logs
docker logs p2p-exchange-service-staging 2>&1 | grep ERROR

# Check Sentry
# Visit Sentry dashboard
```

**Common Causes**:
1. External API failures
   - Check OpenExchangeRates status
   - Check Tatum.io status
   - Verify API keys

2. Database issues
   - Check connection pool
   - Check slow queries
   - Verify indexes

3. Redis issues
   - Check memory usage
   - Check connection count
   - Verify cache hit rate

### Issue: Slow Response Times

**Symptoms**: API responses > 2 seconds

**Diagnosis**:
```bash
# Check metrics
curl http://staging.mnbarh.com:3005/metrics | grep http_request_duration

# Check database
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"
```

**Common Causes**:
1. Database slow queries
   - Add missing indexes
   - Optimize queries
   - Increase connection pool

2. External API latency
   - Check provider status
   - Implement caching
   - Add timeouts

3. High load
   - Scale horizontally
   - Optimize code
   - Add rate limiting

### Issue: Settlement Failures

**Symptoms**: Settlements stuck in PENDING

**Diagnosis**:
```bash
# Check settlement logs
docker logs p2p-exchange-service-staging 2>&1 | grep settlement

# Check database
psql $DATABASE_URL -c "SELECT * FROM \"Settlement\" WHERE status = 'PENDING';"
```

**Common Causes**:
1. PSP webhook not received
   - Check webhook configuration
   - Verify webhook secret
   - Check firewall rules

2. External escrow provider failure
   - Check provider status
   - Verify API credentials
   - Check provider logs

3. Timeout
   - Increase timeout settings
   - Implement retry logic
   - Add manual intervention

---

## Post-Deployment Tasks

### Day 1
- [ ] Monitor service health continuously
- [ ] Review error logs every hour
- [ ] Check metrics dashboard
- [ ] Run smoke tests every 4 hours
- [ ] Collect team feedback

### Day 2-3
- [ ] Invite pilot users
- [ ] Monitor user activity
- [ ] Collect user feedback
- [ ] Address any issues
- [ ] Optimize performance

### Day 4-7
- [ ] Analyze metrics
- [ ] Review settlement success rate
- [ ] Check dispute rate
- [ ] Prepare production deployment plan
- [ ] Document lessons learned

---

## Success Criteria

### Technical Metrics
- [ ] 99.5%+ uptime
- [ ] < 2% error rate
- [ ] < 500ms average response time
- [ ] 95%+ settlement success rate
- [ ] < 10 second match time

### Business Metrics
- [ ] 50+ pilot users onboarded
- [ ] $5,000+ exchange volume
- [ ] 80%+ match rate
- [ ] < 5% dispute rate

### User Satisfaction
- [ ] 4.0+ average rating
- [ ] Positive feedback from 80%+ users
- [ ] < 10% support tickets per transaction

---

## Support

### On-Call Engineer
- **Primary**: [Name] - [Phone] - [Email]
- **Secondary**: [Name] - [Phone] - [Email]

### Communication Channels
- **Slack**: #p2p-exchange-staging
- **Email**: ops@mnbarh.com
- **PagerDuty**: P2P Exchange Service

### Escalation Path
1. On-call engineer (immediate)
2. Tech lead (< 30 minutes)
3. CTO (< 1 hour)

---

**Last Updated**: 2026-01-28  
**Version**: 1.0.0  
**Next Review**: Before production deployment
