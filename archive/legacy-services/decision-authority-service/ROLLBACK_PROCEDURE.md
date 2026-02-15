# Decision Authority Service - Rollback Procedure

**Service**: Decision Authority Service  
**Version**: 1.0.0  
**Last Updated**: January 30, 2026

---

## Overview

This document provides detailed procedures for rolling back the Decision Authority Service in case of critical issues.

---

## Rollback Decision Tree

```
Issue Detected
    ↓
Is it a code issue?
    ├─ YES → Code Rollback (Section 2)
    └─ NO → Is it a database issue?
            ├─ YES → Database Rollback (Section 3)
            └─ NO → Configuration Rollback (Section 4)
```

---

## 1. Pre-Rollback Checklist

Before initiating any rollback:

- [ ] Confirm issue is reproducible
- [ ] Notify team in #mnbarh-incidents
- [ ] Document issue details
- [ ] Identify rollback target version
- [ ] Verify rollback plan
- [ ] Prepare communication for stakeholders

---

## 2. Code Rollback

### 2.1 Quick Rollback (< 5 minutes)

**When to use**: Service is down or critical errors

```bash
# 1. Stop current service
docker-compose -f docker-compose.yml down decision-authority-service

# 2. Pull previous image
docker pull registry.example.com/mnbarh-decision-authority-service:v1.0.0-previous

# 3. Tag as latest
docker tag registry.example.com/mnbarh-decision-authority-service:v1.0.0-previous \
  registry.example.com/mnbarh-decision-authority-service:latest

# 4. Start service
docker-compose -f docker-compose.yml up -d decision-authority-service

# 5. Verify health
sleep 10
curl http://localhost:3010/health

# 6. Check logs
docker logs mnbarh-decision-authority-service | tail -50
```

### 2.2 Staged Rollback (5-15 minutes)

**When to use**: Partial issues or need for verification

```bash
# 1. Start previous version on different port
docker run -d \
  --name decision-authority-service-rollback \
  -p 3011:3010 \
  -e NODE_ENV=production \
  -e PORT=3010 \
  registry.example.com/mnbarh-decision-authority-service:v1.0.0-previous

# 2. Test previous version
curl http://localhost:3011/health

# 3. If healthy, switch traffic
docker-compose -f docker-compose.yml down decision-authority-service
docker rename decision-authority-service-rollback decision-authority-service
docker network connect mnbarh-network decision-authority-service

# 4. Verify
curl http://localhost:3010/health
```

### 2.3 Git-Based Rollback (15-30 minutes)

**When to use**: Need to rebuild from source

```bash
# 1. Identify previous commit
git log --oneline backend/services/decision-authority-service | head -10

# 2. Checkout previous version
git checkout <commit-hash> -- backend/services/decision-authority-service

# 3. Rebuild image
cd backend/services/decision-authority-service
docker build -t mnbarh-decision-authority-service:rollback .

# 4. Stop current service
docker-compose -f docker-compose.yml down decision-authority-service

# 5. Update docker-compose to use rollback image
# Edit docker-compose.yml and change image to rollback

# 6. Start service
docker-compose -f docker-compose.yml up -d decision-authority-service

# 7. Verify
curl http://localhost:3010/health

# 8. Restore current code
git checkout HEAD -- backend/services/decision-authority-service
```

---

## 3. Database Rollback

### 3.1 Identify Migrations

```bash
# List all migrations
npx prisma migrate status

# Output example:
# Following migration have not yet been applied:
# 20260130_add_decision_fields
#
# Following migrations have been applied:
# 20260120_initial_schema
# 20260125_add_audit_logs
```

### 3.2 Rollback to Previous Migration

```bash
# 1. Set environment
export NODE_ENV=production
export DATABASE_URL=postgresql://prod_user:password@postgres-prod:5432/decision_authority_prod

# 2. Identify target migration
# Example: rollback from 20260130_add_decision_fields to 20260125_add_audit_logs

# 3. Rollback
npx prisma migrate resolve --rolled-back 20260130_add_decision_fields

# 4. Verify
npx prisma migrate status
```

### 3.3 Manual Rollback (If Prisma Fails)

```bash
# 1. Connect to database
psql $DATABASE_URL

# 2. Check current schema
SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;

# 3. Delete failed migration record
DELETE FROM _prisma_migrations WHERE migration_name = '20260130_add_decision_fields';

# 4. Manually revert schema changes
-- Example: DROP column if added
ALTER TABLE AssetDecisionRecord DROP COLUMN IF EXISTS new_field;

# 5. Verify
SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;
```

### 3.4 Restore from Backup

```bash
# 1. List available backups
aws s3 ls s3://mnbarh-backups/decision-authority-db/

# 2. Download backup
aws s3 cp s3://mnbarh-backups/decision-authority-db/backup-2026-01-30.sql ./

# 3. Restore database
psql $DATABASE_URL < backup-2026-01-30.sql

# 4. Verify
psql $DATABASE_URL -c "SELECT COUNT(*) FROM AssetDecisionRecord;"
```

---

## 4. Configuration Rollback

### 4.1 Environment Variable Rollback

```bash
# 1. Identify problematic variable
# Example: DECISION_AUTHORITY_MODE=EXTERNAL causing issues

# 2. Revert to previous value
export DECISION_AUTHORITY_MODE=INTERNAL

# 3. Update .env file
sed -i 's/DECISION_AUTHORITY_MODE=EXTERNAL/DECISION_AUTHORITY_MODE=INTERNAL/' .env

# 4. Restart service
docker-compose -f docker-compose.yml restart decision-authority-service

# 5. Verify
curl http://localhost:3010/health
```

### 4.2 Feature Flag Rollback

```bash
# 1. Disable problematic feature
export DECISION_AUTHORITY_MODE=INTERNAL
export METRICS_ENABLED=false

# 2. Update configuration
docker-compose -f docker-compose.yml down decision-authority-service
docker-compose -f docker-compose.yml up -d decision-authority-service

# 3. Verify
curl http://localhost:3010/health
```

---

## 5. Rollback Verification

### 5.1 Health Check

```bash
# Service health
curl http://localhost:3010/health

# Expected response:
# {
#   "status": "healthy",
#   "service": "decision-authority-service",
#   "mode": "INTERNAL",
#   "source": "INTERNAL",
#   "timestamp": "2026-01-30T12:00:00.000Z"
# }
```

### 5.2 Functional Tests

```bash
# Test decision request
curl -X POST http://localhost:3010/api/v1/decisions \
  -H "Content-Type: application/json" \
  -d '{
    "assetType": "LISTING",
    "assetId": "test-123",
    "metadata": {}
  }'

# Expected: APPROVED status
```

### 5.3 Data Integrity Check

```bash
# Check recent decisions
curl http://localhost:3010/api/v1/decisions?limit=10

# Check audit logs
curl http://localhost:3010/api/v1/audit-logs?limit=10

# Verify no data loss
psql $DATABASE_URL -c "SELECT COUNT(*) FROM AssetDecisionRecord;"
```

### 5.4 Performance Check

```bash
# Check latency
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3010/health

# Check error rate
curl http://localhost:3010/metrics | grep decision_errors_total

# Check database performance
psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 5;"
```

---

## 6. Post-Rollback Actions

### 6.1 Notify Team

```bash
# Post to Slack
@channel Rollback completed for decision-authority-service
- Previous version: v1.0.0
- Reason: [issue description]
- Status: Healthy
- ETA for fix: [time]
```

### 6.2 Document Issue

```bash
# Create incident report
cat > INCIDENT_REPORT_2026-01-30.md << EOF
# Incident Report - Decision Authority Service

**Date**: 2026-01-30  
**Service**: decision-authority-service  
**Version**: v1.0.0  
**Status**: Rolled back to v0.9.9  

## Issue Description
[Describe what went wrong]

## Root Cause
[Identify root cause]

## Resolution
[Describe rollback steps taken]

## Prevention
[How to prevent in future]

## Timeline
- 12:00 - Issue detected
- 12:05 - Rollback initiated
- 12:10 - Service healthy
- 12:15 - Verification complete
EOF
```

### 6.3 Root Cause Analysis

```bash
# Review logs
docker logs mnbarh-decision-authority-service > logs-2026-01-30.txt

# Review metrics
curl http://localhost:3010/metrics > metrics-2026-01-30.txt

# Review database
psql $DATABASE_URL -c "SELECT * FROM DecisionAuditLog ORDER BY createdAt DESC LIMIT 100;" > audit-2026-01-30.txt
```

### 6.4 Fix and Re-deploy

```bash
# 1. Fix issue in code
# [Make necessary changes]

# 2. Test locally
npm test

# 3. Build new image
docker build -t mnbarh-decision-authority-service:v1.0.1 .

# 4. Push to registry
docker push registry.example.com/mnbarh-decision-authority-service:v1.0.1

# 5. Deploy to staging
# [Follow deployment runbook]

# 6. Deploy to production
# [Follow deployment runbook]
```

---

## 7. Emergency Contacts

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| On-Call DevOps | [Name] | [Phone] | @[slack] |
| Engineering Manager | [Name] | [Phone] | @[slack] |
| CTO | [Name] | [Phone] | @[slack] |

---

## 8. Rollback Checklist

- [ ] Issue confirmed and documented
- [ ] Team notified
- [ ] Rollback plan reviewed
- [ ] Backup verified
- [ ] Rollback executed
- [ ] Health checks passed
- [ ] Functional tests passed
- [ ] Data integrity verified
- [ ] Performance verified
- [ ] Team notified of completion
- [ ] Incident report created
- [ ] Root cause analysis started

---

## Related Documentation

- [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md) - Deployment procedures
- [MONITORING_SETUP.md](./MONITORING_SETUP.md) - Monitoring configuration
- [README.md](./README.md) - Service overview

