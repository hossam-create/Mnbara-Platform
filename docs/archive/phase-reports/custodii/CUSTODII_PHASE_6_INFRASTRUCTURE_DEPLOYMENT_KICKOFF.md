# Phase 6: Infrastructure & Deployment - Kickoff

**Date**: January 30, 2026  
**Phase**: 6 - Infrastructure & Deployment  
**Status**: 🚀 STARTING  
**Duration**: 2-3 days  
**Tasks**: 25

---

## Overview

Phase 6 focuses on infrastructure setup, feature flags, Docker configuration, database migrations, monitoring, and deployment configuration for the Decision Authority Service. This phase prepares the system for staging and production deployment.

---

## Phase 6 Tasks Breakdown

### 6.1 Feature Flags (7 tasks)
**Objective**: Configure environment variables and feature flags for decision authority integration

#### 6.1.1 Add DECISION_AUTHORITY_MODE env var
**Status**: Ready to implement
**Description**: Add feature flag to enable/disable decision authority integration
**Implementation**:
```bash
# .env
DECISION_AUTHORITY_MODE=INTERNAL  # INTERNAL, EXTERNAL, MOCK
```

#### 6.1.2 Add CUSTODII_API_URL env var
**Status**: Ready to implement
**Description**: Custodii API endpoint URL
**Implementation**:
```bash
CUSTODII_API_URL=https://api.custodii.com/v1
```

#### 6.1.3 Add CUSTODII_API_KEY env var (secret)
**Status**: Ready to implement
**Description**: Custodii API authentication key
**Implementation**:
```bash
CUSTODII_API_KEY=sk_live_xxxxxxxxxxxxx
```

#### 6.1.4 Add CUSTODII_WEBHOOK_SECRET env var (secret)
**Status**: Ready to implement
**Description**: Webhook signature validation secret
**Implementation**:
```bash
CUSTODII_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

#### 6.1.5 Add DECISION_TIMEOUT_MS env var
**Status**: Ready to implement
**Description**: Decision request timeout in milliseconds
**Implementation**:
```bash
DECISION_TIMEOUT_MS=30000  # 30 seconds
```

#### 6.1.6 Add DECISION_POLL_INTERVAL_MS env var
**Status**: Ready to implement
**Description**: Polling interval for pending decisions
**Implementation**:
```bash
DECISION_POLL_INTERVAL_MS=5000  # 5 seconds
```

#### 6.1.7 Document all env vars in README
**Status**: Ready to implement
**Description**: Create comprehensive environment variable documentation

---

### 6.2 Docker Configuration (5 tasks)
**Objective**: Create Docker setup for decision-authority-service

#### 6.2.1 Create Dockerfile for decision-authority-service
**Status**: Ready to implement
**File**: `backend/services/decision-authority-service/Dockerfile`
**Implementation**:
```dockerfile
FROM node:22.20.0-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY dist ./dist

# Expose port
EXPOSE 3010

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3010/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "dist/index.js"]
```

#### 6.2.2 Add service to docker-compose.yml
**Status**: Ready to implement
**Implementation**:
```yaml
decision-authority-service:
  build:
    context: ./backend/services/decision-authority-service
    dockerfile: Dockerfile
  container_name: decision-authority-service
  ports:
    - "3010:3010"
  environment:
    - NODE_ENV=production
    - DATABASE_URL=postgresql://user:password@postgres:5432/decision_authority
    - DECISION_AUTHORITY_MODE=${DECISION_AUTHORITY_MODE:-INTERNAL}
    - CUSTODII_API_URL=${CUSTODII_API_URL}
    - CUSTODII_API_KEY=${CUSTODII_API_KEY}
  depends_on:
    - postgres
  networks:
    - mnbara-network
  restart: unless-stopped
```

#### 6.2.3 Configure service networking
**Status**: Ready to implement
**Description**: Set up network communication between services

#### 6.2.4 Add health check endpoint
**Status**: Ready to implement
**Description**: Implement `/health` endpoint for Docker health checks

#### 6.2.5 Test local Docker deployment
**Status**: Ready to implement
**Description**: Test Docker setup locally before deployment

---

### 6.3 Database Migration (4 tasks)
**Objective**: Create production-ready database migration scripts

#### 6.3.1 Create production migration scripts
**Status**: Ready to implement
**File**: `backend/services/decision-authority-service/scripts/migrate-production.sh`
**Implementation**:
```bash
#!/bin/bash
set -e

echo "Running production migrations..."
npx prisma migrate deploy --skip-generate

echo "Seeding database..."
npx prisma db seed

echo "Migrations complete!"
```

#### 6.3.2 Add rollback scripts
**Status**: Ready to implement
**File**: `backend/services/decision-authority-service/scripts/rollback-production.sh`
**Implementation**:
```bash
#!/bin/bash
set -e

echo "Rolling back to previous migration..."
npx prisma migrate resolve --rolled-back <migration_name>

echo "Rollback complete!"
```

#### 6.3.3 Test migration on staging database
**Status**: Ready to implement
**Description**: Test migrations on staging before production

#### 6.3.4 Document migration procedure
**Status**: Ready to implement
**Description**: Create comprehensive migration documentation

---

### 6.4 Monitoring & Logging (5 tasks)
**Objective**: Set up monitoring, logging, and alerting

#### 6.4.1 Add structured logging (JSON format)
**Status**: Ready to implement
**Description**: Implement JSON structured logging for all services

#### 6.4.2 Add decision metrics (Prometheus format)
**Status**: Ready to implement
**Description**: Export metrics in Prometheus format
**Metrics**:
- `decision_requests_total` - Total decision requests
- `decision_requests_duration_ms` - Request duration
- `decision_status_distribution` - Status breakdown
- `decision_errors_total` - Error count

#### 6.4.3 Add alerting rules for failures
**Status**: Ready to implement
**Description**: Create alert rules for critical failures

#### 6.4.4 Add dashboard for decision monitoring
**Status**: Ready to implement
**Description**: Create Grafana dashboard for monitoring

#### 6.4.5 Document monitoring setup
**Status**: Ready to implement
**Description**: Create monitoring documentation

---

### 6.5 Deployment Configuration (4 tasks)
**Objective**: Configure deployment for staging and production

#### 6.5.1 Update render.yaml with new service
**Status**: Ready to implement
**File**: `render.yaml`
**Implementation**:
```yaml
services:
  - type: web
    name: decision-authority-service
    runtime: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DECISION_AUTHORITY_MODE
        value: INTERNAL
      - key: DATABASE_URL
        fromDatabase:
          name: decision-authority-db
          property: connectionString
```

#### 6.5.2 Configure staging environment (INTERNAL mode)
**Status**: Ready to implement
**Description**: Set up staging with INTERNAL mode (auto-approve)

#### 6.5.3 Configure production environment (INTERNAL mode initially)
**Status**: Ready to implement
**Description**: Set up production with INTERNAL mode initially, switch to EXTERNAL later

#### 6.5.4 Add deployment runbook
**Status**: Ready to implement
**File**: `backend/services/decision-authority-service/DEPLOYMENT_RUNBOOK.md`

#### 6.5.5 Add rollback procedure
**Status**: Ready to implement
**File**: `backend/services/decision-authority-service/ROLLBACK_PROCEDURE.md`

---

## Implementation Strategy

### Day 1: Feature Flags & Docker
1. ✅ Configure all environment variables (6.1.1-6.1.6)
2. ✅ Create Dockerfile (6.2.1)
3. ✅ Add to docker-compose (6.2.2)
4. ✅ Configure networking (6.2.3)
5. ✅ Test Docker locally (6.2.5)

### Day 2: Database & Monitoring
1. ✅ Create migration scripts (6.3.1-6.3.2)
2. ✅ Test migrations (6.3.3)
3. ✅ Add structured logging (6.4.1)
4. ✅ Add metrics (6.4.2)
5. ✅ Create alerts (6.4.3)

### Day 3: Deployment Configuration
1. ✅ Update render.yaml (6.5.1)
2. ✅ Configure staging (6.5.2)
3. ✅ Configure production (6.5.3)
4. ✅ Create runbooks (6.5.4-6.5.5)
5. ✅ Documentation (6.1.7, 6.3.4, 6.4.5)

---

## Success Criteria

- ✅ All 25 tasks completed
- ✅ Docker setup working locally
- ✅ Database migrations tested
- ✅ Monitoring configured
- ✅ Deployment runbooks created
- ✅ Staging environment ready
- ✅ Production environment ready
- ✅ Comprehensive documentation

---

## Files to Create/Modify

### New Files
- `backend/services/decision-authority-service/Dockerfile`
- `backend/services/decision-authority-service/scripts/migrate-production.sh`
- `backend/services/decision-authority-service/scripts/rollback-production.sh`
- `backend/services/decision-authority-service/DEPLOYMENT_RUNBOOK.md`
- `backend/services/decision-authority-service/ROLLBACK_PROCEDURE.md`
- `backend/services/decision-authority-service/MONITORING_SETUP.md`
- `.env.staging` (staging environment)
- `.env.production` (production environment)

### Modified Files
- `docker-compose.yml` (add decision-authority-service)
- `render.yaml` (add decision-authority-service)
- `backend/services/decision-authority-service/README.md` (env vars documentation)

---

## Environment Variables Summary

### Feature Flags
```bash
DECISION_AUTHORITY_MODE=INTERNAL|EXTERNAL|MOCK
DECISION_TIMEOUT_MS=30000
DECISION_POLL_INTERVAL_MS=5000
```

### Custodii Integration
```bash
CUSTODII_API_URL=https://api.custodii.com/v1
CUSTODII_API_KEY=sk_live_xxxxxxxxxxxxx
CUSTODII_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Database
```bash
DATABASE_URL=postgresql://user:password@host:5432/decision_authority
```

### Monitoring
```bash
LOG_LEVEL=info
METRICS_ENABLED=true
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

---

## Next Steps After Phase 6

### Phase 7: Testing & QA (20 tasks)
- Unit tests (90%+ coverage)
- Integration tests
- Load testing
- Security testing
- User acceptance testing

### Phase 8: Documentation & Training (15 tasks)
- Technical documentation
- User documentation
- Training materials
- Runbooks

### Phase 9: Staging Deployment (15 tasks)
- Deploy to staging
- Run smoke tests
- Integration verification
- Performance verification

### Phase 10: Production Deployment (20 tasks)
- Pre-deployment checklist
- Production deployment
- Post-deployment verification
- Gradual rollout

---

## Critical Notes

### Feature Flag Strategy
- **INTERNAL mode**: Auto-approve all decisions (current behavior)
- **EXTERNAL mode**: Use Custodii API for decisions
- **MOCK mode**: Use mock decision source for testing

### Deployment Strategy
- Start with INTERNAL mode in production
- Monitor for 24 hours
- Switch to EXTERNAL mode gradually (1% → 10% → 50% → 100%)

### Rollback Plan
- Keep previous version running
- Quick rollback script ready
- Database rollback scripts prepared
- Monitoring alerts configured

---

## Status

**Phase 6**: 🚀 READY TO START  
**Estimated Duration**: 2-3 days  
**Priority**: HIGH (Critical for deployment)  
**Next Phase**: Phase 7 - Testing & QA

---

**Kickoff Date**: January 30, 2026  
**Target Completion**: February 1, 2026  
**Status**: Ready to begin implementation
