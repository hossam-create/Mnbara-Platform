# P2P Exchange Service - Deployment Runbook

**Version**: 1.0.0  
**Last Updated**: 2026-01-28

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Staging Deployment](#staging-deployment)
3. [Production Deployment](#production-deployment)
4. [Rollback Procedure](#rollback-procedure)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Readiness

- [ ] All tests passing (1200+ tests)
- [ ] Code reviewed and approved
- [ ] No critical security vulnerabilities
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version number bumped

### Infrastructure Readiness

- [ ] Database migrations tested
- [ ] Database backup created
- [ ] Redis cache cleared (if needed)
- [ ] S3 bucket configured
- [ ] Monitoring stack operational
- [ ] Sentry project configured

### Configuration Readiness

- [ ] Environment variables configured
- [ ] External API keys valid
- [ ] Database connection verified
- [ ] Redis connection verified
- [ ] CORS origins configured
- [ ] Feature flags set

### Team Readiness

- [ ] Deployment window scheduled
- [ ] Team notified (Slack, email)
- [ ] On-call engineer assigned
- [ ] Rollback plan reviewed
- [ ] Communication plan ready

---

## Staging Deployment

### Purpose

Test the deployment process and verify functionality before production.

### Prerequisites

- Access to staging environment
- Staging database credentials
- Staging Redis credentials
- Staging S3 bucket

### Deployment Steps

#### 1. Backup Staging Database

```bash
# Create backup
pg_dump -h staging-db.mnbarh.com -U postgres -d p2p_exchange > backup-staging-$(date +%Y%m%d-%H%M%S).sql

# Verify backup
ls -lh backup-staging-*.sql
```

#### 2. Pull Latest Code

```bash
cd backend/services/p2p-exchange-service
git checkout main
git pull origin main
```

#### 3. Install Dependencies

```bash
npm ci
```

#### 4. Run Database Migrations

```bash
# Check migration status
npm run prisma:migrate:status

# Run migrations
npm run prisma:migrate:deploy

# Verify migrations
npm run prisma:migrate:status
```

#### 5. Build Docker Image

```bash
# Build image
docker build -t p2p-exchange-service:staging-$(date +%Y%m%d-%H%M%S) .

# Tag as latest
docker tag p2p-exchange-service:staging-$(date +%Y%m%d-%H%M%S) p2p-exchange-service:staging-latest
```

#### 6. Deploy to Staging

```bash
# Using deployment script
./scripts/deploy-staging.sh

# Or manually
docker-compose -f docker-compose.staging.yml up -d
```

#### 7. Wait for Health Check

```bash
# Wait for service to be healthy
for i in {1..30}; do
  if curl -f http://staging.mnbarh.com:3005/health; then
    echo "Service is healthy"
    break
  fi
  echo "Waiting for service... ($i/30)"
  sleep 2
done
```

#### 8. Run Smoke Tests

```bash
./scripts/smoke-tests.sh staging
```

#### 9. Verify Deployment

- [ ] Health endpoint returns 200
- [ ] Metrics endpoint accessible
- [ ] Database connection working
- [ ] Redis connection working
- [ ] All smoke tests passing
- [ ] Logs show no errors

#### 10. Test with Pilot Users

- [ ] 50 pilot users invited
- [ ] Test transactions completed
- [ ] No critical issues reported
- [ ] Performance acceptable

#### 11. Monitor for 48 Hours

- [ ] Check metrics dashboard
- [ ] Review error logs
- [ ] Monitor Sentry
- [ ] Collect user feedback

### Staging Success Criteria

- ✅ All smoke tests passing
- ✅ No critical errors in logs
- ✅ Response time < 500ms (p95)
- ✅ Error rate < 1%
- ✅ Pilot users satisfied

---

## Production Deployment

### Deployment Window

- **Preferred**: Tuesday or Wednesday, 10 AM - 2 PM EST
- **Avoid**: Fridays, weekends, holidays, peak hours

### Communication

**Before Deployment** (24 hours):
```
Subject: P2P Exchange Service Deployment - [Date]

Team,

We will be deploying P2P Exchange Service to production on [Date] at [Time].

Expected downtime: None (rolling deployment)
Expected duration: 30 minutes

Please be available for monitoring and support.

Deployment lead: [Name]
On-call engineer: [Name]

Rollback plan: Available if needed
```

**During Deployment**:
```
#deployments channel:
"🚀 P2P Exchange deployment started - [Time]"
"✅ Database migrations complete"
"✅ Service deployed"
"✅ Health checks passing"
"✅ Smoke tests passing"
"🎉 Deployment complete - [Time]"
```

**After Deployment**:
```
Subject: P2P Exchange Service Deployment - Complete

Team,

P2P Exchange Service has been successfully deployed to production.

Deployment time: [Time]
Duration: [Duration]
Status: Success

Monitoring:
- Dashboard: https://grafana.mnbarh.com
- Errors: https://sentry.io
- Logs: https://logs.mnbarh.com

Please monitor for the next 24 hours and report any issues.
```

### Deployment Steps

#### 1. Final Pre-Deployment Checks

```bash
# Run pre-deployment checklist
./scripts/pre-deployment-check.sh

# Verify all checks pass
```

#### 2. Create Production Backup

```bash
# Backup database
pg_dump -h prod-db.mnbarh.com -U postgres -d p2p_exchange > backup-prod-$(date +%Y%m%d-%H%M%S).sql

# Upload to S3
aws s3 cp backup-prod-$(date +%Y%m%d-%H%M%S).sql s3://mnbarh-backups/p2p-exchange/

# Verify backup
aws s3 ls s3://mnbarh-backups/p2p-exchange/
```

#### 3. Deploy Using Script

```bash
# Run production deployment script
./scripts/deploy-production.sh

# Script will:
# - Check prerequisites
# - Create backup
# - Build Docker image
# - Run migrations
# - Deploy service
# - Run health checks
# - Run smoke tests
# - Enable feature flag (10%)
```

#### 4. Monitor Initial Deployment

**First 10 Minutes**:
- [ ] Service health: OK
- [ ] Error rate: < 0.1%
- [ ] Response time: < 200ms (p95)
- [ ] No critical errors in logs

**First Hour**:
- [ ] Exchange requests created: Normal
- [ ] Matches created: Normal
- [ ] Settlements completed: Normal
- [ ] No user complaints

**First 24 Hours**:
- [ ] All metrics within targets
- [ ] No critical issues
- [ ] User feedback positive
- [ ] Ready for traffic increase

#### 5. Gradual Rollout

**Day 1: 10% Traffic**
```bash
# Enable 10% traffic
curl -X POST https://api.mnbarh.com/admin/feature-flags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"flag": "p2p_exchange_enabled", "percentage": 10}'
```

**Day 2: 25% Traffic** (if Day 1 successful)
```bash
# Increase to 25%
curl -X POST https://api.mnbarh.com/admin/feature-flags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"flag": "p2p_exchange_enabled", "percentage": 25}'
```

**Day 3: 50% Traffic** (if Day 2 successful)
```bash
# Increase to 50%
curl -X POST https://api.mnbarh.com/admin/feature-flags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"flag": "p2p_exchange_enabled", "percentage": 50}'
```

**Day 4: 100% Traffic** (if Day 3 successful)
```bash
# Full rollout
curl -X POST https://api.mnbarh.com/admin/feature-flags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"flag": "p2p_exchange_enabled", "percentage": 100}'
```

### Success Criteria for Traffic Increase

Before increasing traffic, verify:
- ✅ Error rate < 0.1%
- ✅ Response time < 200ms (p95)
- ✅ Settlement success rate > 95%
- ✅ No critical issues
- ✅ Positive user feedback
- ✅ Team approval

---

## Rollback Procedure

### When to Rollback

Rollback immediately if:
- ❌ Error rate > 5%
- ❌ Service unavailable > 5 minutes
- ❌ Database corruption
- ❌ Critical security vulnerability
- ❌ Settlement failure rate > 10%

### Rollback Steps

#### 1. Initiate Rollback

```bash
# Run rollback script
./scripts/rollback-production.sh

# Or manually:
# 1. Stop current container
docker-compose -f docker-compose.prod.yml down

# 2. Restore previous version
docker tag p2p-exchange-service:prod-backup p2p-exchange-service:prod-latest

# 3. Start previous version
docker-compose -f docker-compose.prod.yml up -d
```

#### 2. Rollback Database (if needed)

```bash
# Only if database changes are incompatible
psql -h prod-db.mnbarh.com -U postgres -d p2p_exchange < backup-prod-YYYYMMDD-HHMMSS.sql
```

#### 3. Disable Feature Flag

```bash
# Disable P2P Exchange
curl -X POST https://api.mnbarh.com/admin/feature-flags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"flag": "p2p_exchange_enabled", "percentage": 0}'
```

#### 4. Verify Rollback

- [ ] Service health: OK
- [ ] Error rate: Normal
- [ ] Response time: Normal
- [ ] No new errors

#### 5. Notify Team

```
#incidents channel:
"🚨 P2P Exchange rollback initiated - [Time]"
"Reason: [Reason]"
"Status: In progress"
"ETA: 5 minutes"

"✅ Rollback complete - [Time]"
"Service restored to previous version"
"Investigating root cause"
```

### Post-Rollback

1. **Investigate Root Cause**
   - Review error logs
   - Check metrics
   - Identify issue
   - Document findings

2. **Fix Issue**
   - Create fix
   - Test thoroughly
   - Review fix
   - Prepare for re-deployment

3. **Re-Deploy**
   - Follow deployment process
   - Extra monitoring
   - Gradual rollout

---

## Post-Deployment Verification

### Immediate Verification (0-10 minutes)

```bash
# Health check
curl https://api.mnbarh.com/p2p-exchange/health

# Metrics check
curl https://api.mnbarh.com/p2p-exchange/metrics

# Create test exchange request
curl -X POST https://api.mnbarh.com/p2p-exchange/api/v1/exchange/requests \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{
    "type": "BUY",
    "fromCurrency": "USD",
    "toCurrency": "EGP",
    "fromAmount": 100,
    "toAmount": 3000,
    "rate": 30.0
  }'

# Browse marketplace
curl https://api.mnbarh.com/p2p-exchange/api/v1/exchange/marketplace
```

### Short-term Verification (1-24 hours)

- [ ] Monitor error rate (target: < 0.1%)
- [ ] Monitor response time (target: < 200ms p95)
- [ ] Monitor settlement success rate (target: > 95%)
- [ ] Check Sentry for new errors
- [ ] Review user feedback
- [ ] Check support tickets

### Long-term Verification (1-7 days)

- [ ] Monitor business metrics
- [ ] Analyze user behavior
- [ ] Review performance trends
- [ ] Check for memory leaks
- [ ] Verify data integrity
- [ ] Collect user satisfaction

---

## Troubleshooting

### Service Won't Start

**Symptoms**: Container exits immediately

**Diagnosis**:
```bash
# Check container logs
docker logs p2p-exchange-service

# Check for common issues
- Database connection failed
- Redis connection failed
- Missing environment variables
- Port already in use
```

**Solution**:
```bash
# Fix environment variables
# Fix database connection
# Fix Redis connection
# Change port if needed
# Restart service
```

### Database Migration Failed

**Symptoms**: Migration error in logs

**Diagnosis**:
```bash
# Check migration status
npm run prisma:migrate:status

# Check database connection
psql -h prod-db.mnbarh.com -U postgres -d p2p_exchange -c "SELECT 1"
```

**Solution**:
```bash
# Rollback failed migration
npm run prisma:migrate:resolve --rolled-back [migration_name]

# Fix migration file
# Re-run migration
npm run prisma:migrate:deploy
```

### High Error Rate

**Symptoms**: Error rate > 1%

**Diagnosis**:
```bash
# Check error logs
tail -f logs/error.log

# Check Sentry
# Check external provider status
```

**Solution**:
- Fix identified errors
- Restart service if needed
- Rollback if critical

### Slow Response Time

**Symptoms**: Response time > 500ms

**Diagnosis**:
```bash
# Check database queries
# Check Redis cache hit rate
# Check external provider latency
# Check system resources
```

**Solution**:
- Optimize slow queries
- Increase cache TTL
- Scale up resources
- Add more instances

---

## Emergency Contacts

### On-Call Rotation

- **Primary**: Check PagerDuty
- **Secondary**: Check PagerDuty
- **Escalation**: Tech Lead → CTO

### Contact Methods

- **PagerDuty**: Automatic alerts
- **Slack**: #p2p-exchange-ops
- **Phone**: +1-555-ONCALL

### External Contacts

- **AWS Support**: +1-800-AWS-SUPPORT
- **Database Provider**: support@provider.com
- **Monitoring**: support@grafana.com

---

## Deployment History

| Date | Version | Deployed By | Status | Notes |
|------|---------|-------------|--------|-------|
| 2026-01-28 | 1.0.0 | Admin | Success | Initial production deployment |

---

**For Deployment Support**: Contact ops@mnbarh.com or call +1-555-ONCALL

---

**Last Updated**: 2026-01-28  
**Version**: 1.0.0
