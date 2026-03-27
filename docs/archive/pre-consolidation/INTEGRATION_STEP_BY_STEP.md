# Integration Execution Plan - Step by Step

**Date**: February 4, 2026  
**Status**: Ready to Execute  
**Goal**: Integrate all 22 microservices and launch platform

---

## 🎯 Quick Start (5 Commands)

```bash
# 1. Setup all databases (15-20 min)
./scripts/integration/setup-all-databases.sh

# 2. Start all services (2-3 min)
./scripts/integration/start-all-services.sh

# 3. Health check (30 sec)
./scripts/integration/health-check-all.sh

# 4. Run integration tests (5-10 min)
npm run test:integration

# 5. Deploy to staging (10-15 min)
npm run deploy:staging
```

---

## 📋 Phase 1: Local Development Setup (Day 1)

### Step 1.1: Prerequisites Check
```bash
# Check Node.js version (need v18+)
node --version

# Check PostgreSQL (need v14+)
psql --version

# Check Docker (optional but recommended)
docker --version

# Check Redis (for caching)
redis-cli ping
```

### Step 1.2: Environment Variables
```bash
# Copy example env files for all services
for service in backend/services/*/; do
  if [ -f "$service/.env.example" ]; then
    cp "$service/.env.example" "$service/.env"
    echo "Created .env for $(basename $service)"
  fi
done

# Edit critical env vars:
# - Database URLs
# - API keys (Stripe, OpenAI, etc.)
# - JWT secrets
# - External service credentials
```

### Step 1.3: Database Setup
```bash
# Run the automated setup script
chmod +x scripts/integration/setup-all-databases.sh
./scripts/integration/setup-all-databases.sh

# This will:
# - Install dependencies for all services
# - Generate Prisma clients
# - Run all migrations
# - Create 22 databases
```

### Step 1.4: Start Services
```bash
# Make scripts executable
chmod +x scripts/integration/start-all-services.sh
chmod +x scripts/integration/stop-all-services.sh
chmod +x scripts/integration/health-check-all.sh

# Start all services
./scripts/integration/start-all-services.sh

# Wait 30 seconds for services to initialize
sleep 30

# Check health
./scripts/integration/health-check-all.sh
```

### Step 1.5: Verify Services
```bash
# Test individual services
curl http://localhost:3001/health  # Listing Service
curl http://localhost:3002/health  # Auction Service
curl http://localhost:3014/health  # Auth Service
curl http://localhost:3029/health  # AI Agent Service

# Check logs if any service fails
tail -f logs/listing-service.log
tail -f logs/auth-service.log
```

---

## 📋 Phase 2: API Gateway Setup (Day 1-2)

### Step 2.1: Configure Routes
```bash
# Edit API Gateway routes
cd backend/services/api-gateway
nano src/config/routes.config.ts

# Add all service routes (already documented in INTEGRATION_READINESS_GUIDE.md)
```

### Step 2.2: Setup Authentication
```bash
# Configure JWT middleware
# Add rate limiting
# Setup CORS
# Configure request logging
```

### Step 2.3: Test Gateway
```bash
# Start API Gateway
cd backend/services/api-gateway
npm run dev

# Test routing
curl http://localhost:3000/api/listings/health
curl http://localhost:3000/api/auth/health
```

---

## 📋 Phase 3: Integration Testing (Day 2-3)

### Step 3.1: Service-to-Service Tests
```bash
# Test listing → search integration
npm run test:integration:listing-search

# Test auction → notification integration
npm run test:integration:auction-notification

# Test payment → ledger integration
npm run test:integration:payment-ledger
```

### Step 3.2: End-to-End Tests
```bash
# User registration flow
npm run test:e2e:registration

# Product listing flow
npm run test:e2e:listing

# Purchase flow
npm run test:e2e:purchase

# Auction flow
npm run test:e2e:auction
```

### Step 3.3: Load Testing
```bash
# Install k6 or artillery
npm install -g artillery

# Run load tests
artillery run tests/load/api-gateway.yml
artillery run tests/load/listing-service.yml
artillery run tests/load/auction-service.yml
```

---

## 📋 Phase 4: Frontend Integration (Day 3-4)

### Step 4.1: API Client Setup
```bash
cd frontend/web-app

# Install dependencies
npm install axios react-query

# Configure API client
# Set base URL
# Add interceptors
# Setup error handling
```

### Step 4.2: Connect Components
```bash
# Update components to use real APIs
# Replace mock data with API calls
# Add loading states
# Add error boundaries
```

### Step 4.3: Test Frontend
```bash
# Start frontend
npm run dev

# Test user flows:
# - Registration/Login
# - Browse products
# - Create listing
# - Place bid
# - Make payment
```

---

## 📋 Phase 5: Deployment Preparation (Day 4-5)

### Step 5.1: Docker Build
```bash
# Build all service images
for service in backend/services/*/; do
  if [ -f "$service/Dockerfile" ]; then
    docker build -t mnbara/$(basename $service):latest $service
  fi
done

# Push to registry
docker push mnbara/listing-service:latest
docker push mnbara/auction-service:latest
# ... etc
```

### Step 5.2: Kubernetes Setup
```bash
# Create namespace
kubectl create namespace mnbara-staging

# Deploy services
kubectl apply -f k8s/services/ -n mnbara-staging

# Deploy ingress
kubectl apply -f k8s/ingress/ -n mnbara-staging

# Check status
kubectl get pods -n mnbara-staging
kubectl get services -n mnbara-staging
```

### Step 5.3: Configure Monitoring
```bash
# Deploy Prometheus
kubectl apply -f k8s/monitoring/prometheus.yml

# Deploy Grafana
kubectl apply -f k8s/monitoring/grafana.yml

# Import dashboards
# Setup alerts
```

---

## 📋 Phase 6: Staging Deployment (Day 5-7)

### Step 6.1: Deploy to Staging
```bash
# Run deployment script
npm run deploy:staging

# This will:
# - Build Docker images
# - Push to registry
# - Deploy to Kubernetes
# - Run migrations
# - Verify health checks
```

### Step 6.2: Smoke Tests
```bash
# Run automated smoke tests
npm run test:smoke:staging

# Manual verification:
# - Check all services are running
# - Test critical user flows
# - Verify integrations
```

### Step 6.3: Performance Testing
```bash
# Run load tests against staging
artillery run tests/load/staging.yml

# Monitor:
# - Response times
# - Error rates
# - Resource usage
```

---

## 📋 Phase 7: Production Deployment (Week 2)

### Step 7.1: Pre-Production Checklist
```bash
# Security audit
npm audit
npm run security:check

# Performance benchmarks
npm run benchmark

# Database backups
npm run backup:create

# Rollback plan ready
npm run rollback:prepare
```

### Step 7.2: Production Deploy
```bash
# Blue-green deployment
npm run deploy:production:blue-green

# Or canary deployment
npm run deploy:production:canary

# Monitor closely for first hour
```

### Step 7.3: Post-Deploy Verification
```bash
# Health checks
npm run health:check:production

# Smoke tests
npm run test:smoke:production

# Monitor dashboards
# - Error rates
# - Response times
# - User activity
```

---

## 🚨 Troubleshooting

### Service Won't Start
```bash
# Check logs
tail -f logs/{service-name}.log

# Check port availability
lsof -i :{port}

# Check database connection
psql -h localhost -U postgres -d {service_db}

# Restart service
kill $(cat logs/{service-name}.pid)
./scripts/integration/start-all-services.sh
```

### Database Migration Fails
```bash
# Check migration status
cd backend/services/{service-name}
npx prisma migrate status

# Reset database (DEV ONLY!)
npx prisma migrate reset

# Run migrations manually
npx prisma migrate deploy
```

### Integration Test Fails
```bash
# Check service health
./scripts/integration/health-check-all.sh

# Check service logs
tail -f logs/*.log

# Run test in verbose mode
npm run test:integration -- --verbose
```

---

## 📊 Success Metrics

### Performance Targets
- API response time < 200ms (p95)
- Database query time < 50ms (p95)
- Page load time < 2s
- Error rate < 0.1%

### Availability Targets
- Uptime > 99.9%
- RTO < 1 hour
- RPO < 5 minutes

### Business Metrics
- User registration rate
- Conversion rate
- Transaction volume
- Revenue

---

## 🎯 Next Actions

### Immediate (Today)
1. ✅ Run database setup script
2. ✅ Start all services
3. ✅ Verify health checks
4. ✅ Test critical flows

### This Week
1. ✅ Complete integration testing
2. ✅ Deploy to staging
3. ✅ Run load tests
4. ✅ Fix any issues

### Next Week
1. ✅ Security audit
2. ✅ Performance optimization
3. ✅ Production deployment
4. ✅ Monitor and iterate

---

## 📞 Support

### Documentation
- [Integration Readiness Guide](INTEGRATION_READINESS_GUIDE.md)
- [Service READMEs](backend/services/*/README.md)
- [API Documentation](docs/api/)

### Monitoring
- Grafana: http://grafana.mnbara.com
- Prometheus: http://prometheus.mnbara.com
- Logs: http://logs.mnbara.com

---

**Status**: Ready to Execute  
**Next Command**: `./scripts/integration/setup-all-databases.sh`

🚀 Let's launch this platform!
