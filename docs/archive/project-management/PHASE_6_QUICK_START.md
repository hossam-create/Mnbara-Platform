# Phase 6: Infrastructure & Deployment - Quick Start Guide

**Date**: January 30, 2026  
**Phase**: 6 - Infrastructure & Deployment  
**Status**: 🚀 STARTING TODAY  
**Duration**: 2-3 days  
**Tasks**: 25

---

## What is Phase 6?

Phase 6 sets up the infrastructure and deployment configuration for the Decision Authority Service. It includes:
- Feature flags and environment variables
- Docker containerization
- Database migrations
- Monitoring and logging
- Deployment configuration for staging and production

---

## Phase 6 Tasks at a Glance

| Task Group | Tasks | Status |
|-----------|-------|--------|
| 6.1 Feature Flags | 7 | ⏳ TODO |
| 6.2 Docker Configuration | 5 | ⏳ TODO |
| 6.3 Database Migration | 4 | ⏳ TODO |
| 6.4 Monitoring & Logging | 5 | ⏳ TODO |
| 6.5 Deployment Configuration | 4 | ⏳ TODO |
| **TOTAL** | **25** | **⏳ TODO** |

---

## Quick Task List

### 6.1 Feature Flags (7 tasks)
- [ ] 6.1.1 Add DECISION_AUTHORITY_MODE env var
- [ ] 6.1.2 Add CUSTODII_API_URL env var
- [ ] 6.1.3 Add CUSTODII_API_KEY env var (secret)
- [ ] 6.1.4 Add CUSTODII_WEBHOOK_SECRET env var (secret)
- [ ] 6.1.5 Add DECISION_TIMEOUT_MS env var
- [ ] 6.1.6 Add DECISION_POLL_INTERVAL_MS env var
- [ ] 6.1.7 Document all env vars in README

### 6.2 Docker Configuration (5 tasks)
- [ ] 6.2.1 Create Dockerfile for decision-authority-service
- [ ] 6.2.2 Add service to docker-compose.yml
- [ ] 6.2.3 Configure service networking
- [ ] 6.2.4 Add health check endpoint
- [ ] 6.2.5 Test local Docker deployment

### 6.3 Database Migration (4 tasks)
- [ ] 6.3.1 Create production migration scripts
- [ ] 6.3.2 Add rollback scripts
- [ ] 6.3.3 Test migration on staging database
- [ ] 6.3.4 Document migration procedure

### 6.4 Monitoring & Logging (5 tasks)
- [ ] 6.4.1 Add structured logging (JSON format)
- [ ] 6.4.2 Add decision metrics (Prometheus format)
- [ ] 6.4.3 Add alerting rules for failures
- [ ] 6.4.4 Add dashboard for decision monitoring
- [ ] 6.4.5 Document monitoring setup

### 6.5 Deployment Configuration (4 tasks)
- [ ] 6.5.1 Update render.yaml with new service
- [ ] 6.5.2 Configure staging environment (INTERNAL mode)
- [ ] 6.5.3 Configure production environment (INTERNAL mode initially)
- [ ] 6.5.4 Add deployment runbook
- [ ] 6.5.5 Add rollback procedure

---

## Key Environment Variables

```bash
# Feature Flags
DECISION_AUTHORITY_MODE=INTERNAL  # INTERNAL, EXTERNAL, MOCK
DECISION_TIMEOUT_MS=30000
DECISION_POLL_INTERVAL_MS=5000

# Custodii Integration
CUSTODII_API_URL=https://api.custodii.com/v1
CUSTODII_API_KEY=sk_live_xxxxxxxxxxxxx
CUSTODII_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Database
DATABASE_URL=postgresql://user:password@host:5432/decision_authority

# Monitoring
LOG_LEVEL=info
METRICS_ENABLED=true
```

---

## Implementation Timeline

### Day 1: Feature Flags & Docker (12 tasks)
**Morning**:
- 6.1.1-6.1.6: Configure environment variables
- 6.1.7: Document env vars

**Afternoon**:
- 6.2.1: Create Dockerfile
- 6.2.2: Add to docker-compose
- 6.2.3: Configure networking
- 6.2.4: Add health check
- 6.2.5: Test Docker locally

### Day 2: Database & Monitoring (9 tasks)
**Morning**:
- 6.3.1-6.3.2: Create migration scripts
- 6.3.3: Test migrations
- 6.3.4: Document migrations

**Afternoon**:
- 6.4.1: Add structured logging
- 6.4.2: Add metrics
- 6.4.3: Add alerts
- 6.4.4: Create dashboard
- 6.4.5: Document monitoring

### Day 3: Deployment Configuration (4 tasks)
**Morning**:
- 6.5.1: Update render.yaml
- 6.5.2: Configure staging
- 6.5.3: Configure production

**Afternoon**:
- 6.5.4: Create deployment runbook
- 6.5.5: Create rollback procedure

---

## Files to Create

### Docker & Deployment
- `backend/services/decision-authority-service/Dockerfile`
- `backend/services/decision-authority-service/scripts/migrate-production.sh`
- `backend/services/decision-authority-service/scripts/rollback-production.sh`
- `backend/services/decision-authority-service/DEPLOYMENT_RUNBOOK.md`
- `backend/services/decision-authority-service/ROLLBACK_PROCEDURE.md`
- `backend/services/decision-authority-service/MONITORING_SETUP.md`

### Environment Files
- `.env.staging`
- `.env.production`

### Modified Files
- `docker-compose.yml`
- `render.yaml`
- `backend/services/decision-authority-service/README.md`

---

## Success Criteria

✅ All 25 tasks completed
✅ Docker setup working locally
✅ Database migrations tested
✅ Monitoring configured
✅ Deployment runbooks created
✅ Staging environment ready
✅ Production environment ready
✅ Comprehensive documentation

---

## Key Decisions

### Feature Flag Strategy
- **INTERNAL mode**: Auto-approve (current behavior, safe default)
- **EXTERNAL mode**: Use Custodii API (production)
- **MOCK mode**: Use mock data (testing)

### Deployment Strategy
- Start with INTERNAL mode in production
- Monitor for 24 hours
- Gradually roll out EXTERNAL mode (1% → 10% → 50% → 100%)

### Rollback Plan
- Keep previous version running
- Quick rollback script ready
- Database rollback prepared
- Monitoring alerts configured

---

## Next Phase

**Phase 7: Testing & QA** (20 tasks)
- Unit tests (90%+ coverage)
- Integration tests
- Load testing
- Security testing
- User acceptance testing

---

## Status

**Phase 6**: 🚀 STARTING TODAY  
**Estimated Duration**: 2-3 days  
**Target Completion**: February 1, 2026  
**Next Phase**: Phase 7 - Testing & QA

---

**Ready to begin!** 🚀
