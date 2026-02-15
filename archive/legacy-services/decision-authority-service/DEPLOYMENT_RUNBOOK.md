# Decision Authority Service - Deployment Runbook

**Service**: Decision Authority Service  
**Version**: 1.0.0  
**Last Updated**: January 30, 2026

---

## Overview

This runbook provides step-by-step instructions for deploying the Decision Authority Service to staging and production environments.

---

## Pre-Deployment Checklist

- [ ] All tests passing (90%+ coverage)
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Docker image built and tested locally
- [ ] Health check endpoint verified
- [ ] Monitoring configured
- [ ] Rollback plan prepared

---

## Deployment Steps

### 1. Build Docker Image

```bash
cd backend/services/decision-authority-service

# Build image
docker build -t mnbarh-decision-authority-service:latest .

# Tag for registry
docker tag mnbarh-decision-authority-service:latest \
  registry.example.com/mnbarh-decision-authority-service:latest

# Push to registry
docker push registry.example.com/mnbarh-decision-authority-service:latest
```

### 2. Staging Deployment

#### 2.1 Configure Environment

```bash
# Copy staging environment
cp .env.staging .env

# Verify configuration
cat .env
```

#### 2.2 Run Database Migrations

```bash
# Set environment
export NODE_ENV=staging
export DATABASE_URL=postgresql://staging_user:password@postgres-staging:5432/decision_authority_staging

# Run migrations
bash scripts/migrate-production.sh
```

#### 2.3 Deploy Service

```bash
# Using Docker Compose
docker-compose -f docker-compose.yml up -d decision-authority-service

# Or using Kubernetes
kubectl apply -f k8s/decision-authority-service-staging.yaml
```

#### 2.4 Verify Deployment

```bash
# Check health
curl http://localhost:3010/health

# Check logs
docker logs mnbarh-decision-authority-service

# Run smoke tests
npm run test:smoke
```

### 3. Production Deployment

#### 3.1 Configure Environment

```bash
# Copy production environment
cp .env.production .env

# Update secrets
export CUSTODII_API_KEY=sk_live_xxxxxxxxxxxxx
export CUSTODII_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Verify configuration
cat .env
```

#### 3.2 Run Database Migrations

```bash
# Set environment
export NODE_ENV=production
export DATABASE_URL=postgresql://prod_user:password@postgres-prod:5432/decision_authority_prod

# Run migrations
bash scripts/migrate-production.sh
```

#### 3.3 Deploy Service

```bash
# Using Docker Compose
docker-compose -f docker-compose.prod.yml up -d decision-authority-service

# Or using Kubernetes
kubectl apply -f k8s/decision-authority-service-prod.yaml
```

#### 3.4 Verify Deployment

```bash
# Check health
curl https://decision-authority-service.mnbarh.com/health

# Check logs
kubectl logs -f deployment/decision-authority-service

# Run smoke tests
npm run test:smoke
```

#### 3.5 Monitor Service

```bash
# Check metrics
curl https://decision-authority-service.mnbarh.com/metrics

# View Grafana dashboard
# https://grafana.mnbarh.com/d/decision-authority-service

# Check alerts
# https://alertmanager.mnbarh.com
```

---

## Feature Flag Rollout Strategy

### Phase 1: INTERNAL Mode (Safe Default)
- **Duration**: 24 hours
- **Mode**: `DECISION_AUTHORITY_MODE=INTERNAL`
- **Behavior**: Auto-approve all decisions
- **Risk**: Minimal (maintains current behavior)
- **Monitoring**: Basic health checks

### Phase 2: Gradual EXTERNAL Rollout
- **Duration**: 7 days
- **Rollout**: 1% → 10% → 50% → 100%
- **Mode**: `DECISION_AUTHORITY_MODE=EXTERNAL`
- **Behavior**: Use Custodii API for decisions
- **Risk**: Controlled via gradual rollout
- **Monitoring**: Detailed metrics and alerts

### Phase 3: Full EXTERNAL Mode
- **Duration**: Ongoing
- **Mode**: `DECISION_AUTHORITY_MODE=EXTERNAL`
- **Behavior**: All decisions via Custodii API
- **Risk**: Depends on Custodii availability
- **Monitoring**: Production monitoring

---

## Rollback Procedure

### Quick Rollback (< 5 minutes)

```bash
# 1. Revert to previous Docker image
docker-compose -f docker-compose.yml down decision-authority-service
docker pull registry.example.com/mnbarh-decision-authority-service:previous
docker-compose -f docker-compose.yml up -d decision-authority-service

# 2. Verify health
curl http://localhost:3010/health

# 3. Check logs
docker logs mnbarh-decision-authority-service
```

### Database Rollback

```bash
# 1. Identify migration to rollback to
npx prisma migrate status

# 2. Rollback
bash scripts/rollback-production.sh

# 3. Verify database
npx prisma db execute --stdin < /dev/null
```

### Full Rollback

```bash
# 1. Stop service
docker-compose -f docker-compose.yml down decision-authority-service

# 2. Rollback database
bash scripts/rollback-production.sh

# 3. Restore previous version
docker pull registry.example.com/mnbarh-decision-authority-service:previous
docker-compose -f docker-compose.yml up -d decision-authority-service

# 4. Verify
curl http://localhost:3010/health
```

---

## Monitoring & Alerts

### Key Metrics

- `decision_requests_total` - Total decision requests
- `decision_requests_duration_ms` - Request duration
- `decision_status_distribution` - Status breakdown
- `decision_errors_total` - Error count
- `custodii_api_errors_total` - Custodii API errors

### Alert Rules

| Alert | Threshold | Action |
|-------|-----------|--------|
| High Error Rate | > 5% | Page on-call |
| High Latency | > 5s | Investigate |
| Service Down | Health check fails | Immediate rollback |
| Database Connection Error | Connection fails | Investigate |
| Custodii API Error | > 10 consecutive errors | Switch to INTERNAL mode |

### Grafana Dashboard

- Decision request volume
- Decision status distribution
- Error rate and types
- Latency percentiles (p50, p95, p99)
- Custodii API health

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker logs mnbarh-decision-authority-service

# Check environment variables
docker inspect mnbarh-decision-authority-service | grep -A 20 Env

# Check database connection
npx prisma db execute --stdin < /dev/null

# Check port availability
lsof -i :3010
```

### High Error Rate

```bash
# Check Custodii API status
curl https://api.custodii.com/v1/health

# Check database performance
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

# Check logs for errors
docker logs mnbarh-decision-authority-service | grep ERROR
```

### High Latency

```bash
# Check database query performance
EXPLAIN ANALYZE SELECT * FROM AssetDecisionRecord WHERE status = 'PENDING';

# Check Custodii API latency
time curl https://api.custodii.com/v1/decisions

# Check service metrics
curl http://localhost:3010/metrics | grep decision_requests_duration
```

---

## Post-Deployment Verification

### 1. Health Check

```bash
curl http://localhost:3010/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "decision-authority-service",
  "mode": "INTERNAL",
  "source": "INTERNAL",
  "timestamp": "2026-01-30T12:00:00.000Z"
}
```

### 2. Metrics Check

```bash
curl http://localhost:3010/metrics
```

Expected: Prometheus metrics in text format

### 3. Decision Request Test

```bash
curl -X POST http://localhost:3010/api/v1/decisions \
  -H "Content-Type: application/json" \
  -d '{
    "assetType": "LISTING",
    "assetId": "test-123",
    "metadata": {}
  }'
```

Expected response:
```json
{
  "decisionId": "dec_xxx",
  "status": "APPROVED",
  "source": "INTERNAL",
  "timestamp": "2026-01-30T12:00:00.000Z"
}
```

### 4. Audit Log Check

```bash
curl http://localhost:3010/api/v1/audit-logs?limit=10
```

Expected: List of recent audit log entries

---

## Rollback Triggers

Automatic rollback should be triggered if:

1. **Health Check Fails**: Service not responding to health checks
2. **Error Rate > 10%**: More than 10% of requests failing
3. **Latency > 10s**: P95 latency exceeds 10 seconds
4. **Database Connection Error**: Cannot connect to database
5. **Custodii API Down**: Cannot reach Custodii API (in EXTERNAL mode)

---

## Support & Escalation

### On-Call Support

- **Primary**: DevOps Team
- **Secondary**: Backend Team
- **Escalation**: Engineering Manager

### Contact Information

- **Slack**: #mnbarh-incidents
- **PagerDuty**: mnbarh-on-call
- **Email**: devops@mnbarh.com

---

## Deployment History

| Date | Version | Environment | Status | Notes |
|------|---------|-------------|--------|-------|
| 2026-01-30 | 1.0.0 | Staging | Pending | Initial deployment |

---

## Related Documentation

- [README.md](./README.md) - Service overview
- [ROLLBACK_PROCEDURE.md](./ROLLBACK_PROCEDURE.md) - Detailed rollback steps
- [MONITORING_SETUP.md](./MONITORING_SETUP.md) - Monitoring configuration
- [Specification](../../.kiro/specs/custodii-decision-authority/README.md) - Full specification

