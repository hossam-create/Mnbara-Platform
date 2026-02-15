# Mnbara Platform - Infrastructure & DevOps Setup

## Overview
This document outlines the complete infrastructure setup for the Mnbara E-commerce Platform, including Kubernetes Helm Charts, Docker Compose configurations, CI/CD pipelines, database schemas, and monitoring stack.

## Directory Structure

```
mnbara-platform/
├── k8s/                           # Kubernetes configurations
│   └── helm/
│       └── mnbarh/               # Main Helm chart
│           ├── Chart.yaml         # Chart dependencies
│           ├── values-dev.yaml   # Development values
│           ├── values-staging.yaml
│           └── values-prod.yaml
│       └── charts/                # Individual service charts
│           ├── api-gateway/
│           ├── auth-service/
│           ├── user-service/
│           ├── listing-service/
│           ├── auction-service/
│           ├── payment-service/
│           ├── escrow-service/
│           ├── notification-service/
│           ├── orders-service/
│           ├── matching-service/
│           ├── internal-ledger-service/
│           ├── ai-core/
│           └── recommendation-service/
├── docker-compose.dev.hot-reload.yml    # Development with hot-reload
├── monitoring/
│   ├── prometheus/
│   │   ├── prometheus.yml       # Prometheus configuration
│   │   └── rules/               # Alert rules
│   ├── grafana/
│   │   ├── provisioning/
│   │   │   ├── datasources/
│   │   │   └── dashboards/
│   │   └── dashboards/           # Dashboard definitions
│   ├── alertmanager/
│   │   └── alertmanager.yml     # Alertmanager config
│   └── docker-compose.monitoring.yml
├── backend/
│   └── shared/
│       └── prisma/
│           ├── schema.postgis.prisma     # Complete schema with PostGIS
│           └── migrations/
│               └── 001_postgis_setup/
│                   └── migration.sql     # Performance indexes & PostGIS
└── .github/workflows/
    ├── ci.yml                   # CI pipeline
    └── cd-deploy.yml            # CD pipeline
```

## Quick Start

### Development Environment

1. **Start all services with hot-reload:**
```bash
docker-compose -f docker-compose.dev.hot-reload.yml up -d
```

2. **Access development tools:**
   - API Gateway: http://localhost:8080
   - pgAdmin: http://localhost:8082
   - Redis Commander: http://localhost:8083
   - RabbitMQ Management: http://localhost:15672

### Kubernetes Deployment

1. **Install Helm dependencies:**
```bash
cd k8s/helm/mnbarh
helm dependency update
```

2. **Deploy to staging:**
```bash
helm upgrade --install mnbarh-staging . \
  --namespace staging \
  --create-namespace \
  -f values-staging.yaml
```

3. **Deploy to production:**
```bash
helm upgrade --install mnbarh-production . \
  --namespace production \
  --create-namespace \
  -f values-prod.yaml
```

### Monitoring Stack

1. **Start monitoring:**
```bash
docker-compose -f monitoring/docker-compose.monitoring.yml up -d
```

2. **Access dashboards:**
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3000 (admin/admin)
   - Alertmanager: http://localhost:9093

## Key Features

### Docker Compose - Development
- ✅ Hot-reload for all services
- ✅ Volume mounts for live code changes
- ✅ Debug ports exposed (9229)
- ✅ PostGIS extension enabled
- ✅ Management UIs (pgAdmin, Redis Commander)
- ✅ Proper network isolation

### Kubernetes - Production
- ✅ Auto-scaling with HPA
- ✅ Resource limits and requests
- ✅ Health checks (liveness/readiness)
- ✅ Service monitoring with Prometheus
- ✅ Network policies
- ✅ Pod disruption budgets

### CI/CD Pipeline
- ✅ Automated testing on PR
- ✅ Docker image building and pushing
- ✅ Environment detection (dev/staging/prod)
- ✅ Database migrations
- ✅ Helm chart validation
- ✅ Automated deployments
- ✅ Smoke tests after deployment

### Database
- ✅ PostGIS for geospatial queries
- ✅ Performance indexes for all major tables
- ✅ Full-text search support
- ✅ Audit logging
- ✅ Transaction management

### Monitoring
- ✅ Prometheus metrics collection
- ✅ Grafana dashboards
- ✅ Alert rules for infrastructure, application, and business metrics
- ✅ Multi-level alerting (warning/critical)
- ✅ Integration with PagerDuty and email

## Environment Variables

### Required Secrets
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# External APIs
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# AWS (for ECR)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
EKS_CLUSTER_NAME=...

# Monitoring
GRAFANA_PASSWORD=...
SMTP_PASSWORD=...
PAGERDUTY_SERVICE_KEY=...
```

## Health Endpoints

All services expose the following endpoints:
- `GET /health` - Health check
- `GET /health/ready` - Readiness check
- `GET /metrics` - Prometheus metrics

## Performance Optimization

### Database Indexes
- Partial indexes for active records
- GIN indexes for text search
- Spatial indexes for PostGIS
- Compound indexes for common queries

### Caching
- Redis for session storage
- Redis for API response caching
- Connection pooling for databases

### Query Optimization
- Query analysis with EXPLAIN ANALYZE
- Slow query logging
- Connection pool monitoring

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check what's using a port
   lsof -i :5432
   ```

2. **Docker disk space:**
   ```bash
   docker system prune -a
   ```

3. **Kubernetes pod issues:**
   ```bash
   kubectl describe pod <pod-name>
   kubectl logs <pod-name>
   ```

## Support

- **Documentation:** https://wiki.mnbarh.com
- **Runbooks:** https://wiki.mnbarh.com/runbooks
- **Slack:** #devops-support
