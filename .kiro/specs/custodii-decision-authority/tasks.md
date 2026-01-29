# Custodii Decision Authority API Integration - Implementation Tasks

## Phase 1: Foundation & Core Service (Week 1)

### 1.1 Decision Authority Service Setup
- [x] 1.1.1 Create service directory structure
- [x] 1.1.2 Initialize package.json with dependencies
- [x] 1.1.3 Setup TypeScript configuration
- [x] 1.1.4 Initialize Prisma with PostgreSQL
- [x] 1.1.5 Create .env.example with required variables

### 1.2 Database Schema & Models
- [x] 1.2.1 Define Prisma schema for AssetDecisionRecord
- [x] 1.2.2 Define Prisma schema for DecisionAuditLog
- [x] 1.2.3 Define Prisma schema for DecisionWebhookEvent
- [x] 1.2.4 Create initial migration
- [x] 1.2.5 Generate Prisma client

### 1.3 Decision Source Abstraction
- [x] 1.3.1 Create IDecisionSource interface
- [x] 1.3.2 Define DecisionRequest/DecisionResponse types
- [x] 1.3.3 Create DecisionSourceFactory
- [x] 1.3.4 Add configuration loader for DECISION_AUTHORITY_MODE

### 1.4 Internal Decision Source
- [x] 1.4.1 Implement InternalDecisionSource class
- [x] 1.4.2 Add auto-approval logic (current behavior)
- [x] 1.4.3 Write unit tests for InternalDecisionSource
- [x] 1.4.4 Add integration tests

### 1.5 Mock Decision Source
- [x] 1.5.1 Implement MockDecisionSource class
- [x] 1.5.2 Add configurable delay simulation
- [x] 1.5.3 Add status transition simulation
- [x] 1.5.4 Write unit tests for MockDecisionSource

## Phase 2: Core Service Logic (Week 2)

### 2.1 Decision Authority Service
- [x] 2.1.1 Create DecisionAuthorityService class
- [x] 2.1.2 Implement requestDecision() method
- [x] 2.1.3 Implement getDecision() method
- [x] 2.1.4 Implement listDecisions() with filters
- [x] 2.1.5 Implement overrideDecision() for admin
- [x] 2.1.6 Add decision expiry handling
- [x] 2.1.7 Write comprehensive unit tests

### 2.2 Audit Logging
- [x] 2.2.1 Create AuditLogService
- [x] 2.2.2 Log decision creation events
- [x] 2.2.3 Log status change events
- [x] 2.2.4 Log override events
- [x] 2.2.5 Add audit query methods
- [x] 2.2.6 Write audit log tests

### 2.3 REST API Layer
- [x] 2.3.1 Create DecisionController
- [x] 2.3.2 Add POST /api/v1/decisions/request endpoint
- [x] 2.3.3 Add GET /api/v1/decisions/:id endpoint
- [x] 2.3.4 Add GET /api/v1/decisions/asset/:assetId endpoint
- [x] 2.3.5 Add GET /api/v1/decisions (list with filters)
- [ ] 2.3.6 Add PATCH /api/v1/decisions/:id/override endpoint
- [x] 2.3.7 Add authentication middleware
- [x] 2.3.8 Add validation middleware
- [x] 2.3.9 Write API integration tests

### 2.4 Webhook Handler
- [x] 2.4.1 Create WebhookController
- [x] 2.4.2 Add POST /api/v1/decisions/webhook endpoint
- [x] 2.4.3 Implement HMAC signature validation
- [x] 2.4.4 Add webhook event processing
- [x] 2.4.5 Add retry logic for failed processing
- [x] 2.4.6 Write webhook tests with mock signatures

## Phase 3: External Integration (Week 3)

### 3.1 Custodii Decision Source
- [x] 3.1.1 Implement CustodiiDecisionSource class
- [x] 3.1.2 Add HTTP client with axios
- [x] 3.1.3 Implement requestDecision() API call
- [x] 3.1.4 Implement getDecision() API call
- [x] 3.1.5 Add API authentication (Bearer token)
- [x] 3.1.6 Add request/response logging
- [x] 3.1.7 Write unit tests with mocked HTTP

### 3.2 Polling Mechanism
- [x] 3.2.1 Create DecisionPollingService
- [x] 3.2.2 Implement polling loop for PENDING decisions
- [x] 3.2.3 Add configurable poll interval (default 5s)
- [x] 3.2.4 Add max poll duration (default 30s)
- [x] 3.2.5 Handle timeout scenarios
- [x] 3.2.6 Write polling tests

### 3.3 Retry & Fallback Logic
- [x] 3.3.1 Add exponential backoff retry (3 attempts)
- [x] 3.3.2 Implement circuit breaker pattern
- [x] 3.3.3 Add fallback to INTERNAL mode on repeated failures
- [x] 3.3.4 Add health check endpoint for external API
- [x] 3.3.5 Write retry/fallback tests

### 3.4 Observability & Operations (Phase 3.4)
- [x] 3.4.1 Implement metrics collection (vendor-neutral)
- [x] 3.4.2 Add structured logging (JSON format)
- [x] 3.4.3 Implement correlation ID management
- [x] 3.4.4 Add health check endpoints (liveness + readiness)
- [x] 3.4.5 Implement alert signal emission
- [x] 3.4.6 Add startup configuration logging
- [x] 3.4.7 Create operational runbooks
- [x] 3.4.8 Write observability tests

### 3.5 Error Handling
- [x] 3.5.1 Define custom error classes
- [x] 3.5.2 Add timeout error handling
- [x] 3.5.3 Add network error handling
- [x] 3.5.4 Add validation error handling
- [x] 3.5.5 Add error logging and alerting
- [x] 3.5.6 Write error scenario tests

## Phase 4: Service Integration (Week 4)

### 4.1 Listing Service Integration
- [ ] 4.1.1 Add decision-authority-service client
- [ ] 4.1.2 Modify listing creation to request decision
- [ ] 4.1.3 Add disposition_status field to Listing model
- [ ] 4.1.4 Update listing queries to filter by status
- [ ] 4.1.5 Add decision status webhook handler
- [ ] 4.1.6 Write integration tests
- [ ] 4.1.7 Update API documentation

### 4.2 Auction Service Integration
- [x] 4.2.1 Add decision-authority-service client
- [x] 4.2.2 Modify auction start to require APPROVED decision
- [x] 4.2.3 Add disposition_status field to Auction model
- [x] 4.2.4 Block bidding on non-APPROVED auctions
- [x] 4.2.5 Add decision status webhook handler
- [x] 4.2.6 Write integration tests
- [x] 4.2.7 Update API documentation

### 4.3 Escrow Service Integration
- [x] 4.3.1 Add decision-authority-service client
- [x] 4.3.2 Modify escrow release to require APPROVED decision
- [x] 4.3.3 Add decision tracking to escrow records
- [x] 4.3.4 Add decision status webhook handler
- [x] 4.3.5 Write integration tests
- [x] 4.3.6 Update API documentation

### 4.4 API Gateway Updates
- [x] 4.4.1 Add routes for decision-authority-service
- [x] 4.4.2 Configure rate limiting for decision endpoints
- [x] 4.4.3 Add CORS configuration
- [x] 4.4.4 Update gateway documentation

## Phase 5: Frontend Integration (Week 5)

### 5.1 Decision Status Types & API Client
- [ ] 5.1.1 Create decision.types.ts with TypeScript types
- [ ] 5.1.2 Create decisionService.ts API client
- [ ] 5.1.3 Add decision status fetching methods
- [ ] 5.1.4 Add real-time status update hooks

### 5.2 Listing UI Updates
- [ ] 5.2.1 Add disposition_status badge to listing cards
- [ ] 5.2.2 Update listing detail page with status display
- [ ] 5.2.3 Add status filter to search/browse
- [ ] 5.2.4 Add pending status messaging
- [ ] 5.2.5 Add rejected status messaging
- [ ] 5.2.6 Write component tests

### 5.3 Auction UI Updates
- [ ] 5.3.1 Add disposition_status badge to auction cards
- [ ] 5.3.2 Update auction detail page with status display
- [ ] 5.3.3 Disable bidding UI for non-APPROVED auctions
- [ ] 5.3.4 Add status messaging
- [ ] 5.3.5 Write component tests

### 5.4 Seller Dashboard Updates
- [ ] 5.4.1 Add decision status column to listings table
- [ ] 5.4.2 Add status filter dropdown
- [ ] 5.4.3 Add pending decisions notification
- [ ] 5.4.4 Add decision history view
- [ ] 5.4.5 Write component tests

### 5.5 Admin Decision Management Panel
- [ ] 5.5.1 Create admin decision list page
- [ ] 5.5.2 Add decision detail modal
- [ ] 5.5.3 Add override decision form
- [ ] 5.5.4 Add decision audit log viewer
- [ ] 5.5.5 Add decision statistics dashboard
- [ ] 5.5.6 Write component tests

## Phase 6: Infrastructure & Deployment (Week 6)

### 6.1 Feature Flags
- [x] 6.1.1 Add DECISION_AUTHORITY_MODE env var
- [x] 6.1.2 Add CUSTODII_API_URL env var
- [x] 6.1.3 Add CUSTODII_API_KEY env var (secret)
- [x] 6.1.4 Add CUSTODII_WEBHOOK_SECRET env var (secret)
- [x] 6.1.5 Add DECISION_TIMEOUT_MS env var
- [x] 6.1.6 Add DECISION_POLL_INTERVAL_MS env var
- [x] 6.1.7 Document all env vars in README

### 6.2 Docker Configuration
- [x] 6.2.1 Create Dockerfile for decision-authority-service
- [x] 6.2.2 Add service to docker-compose.yml
- [x] 6.2.3 Configure service networking
- [x] 6.2.4 Add health check endpoint
- [x] 6.2.5 Test local Docker deployment

### 6.3 Database Migration
- [x] 6.3.1 Create production migration scripts
- [x] 6.3.2 Add rollback scripts
- [x] 6.3.3 Test migration on staging database
- [x] 6.3.4 Document migration procedure

### 6.4 Monitoring & Logging
- [x] 6.4.1 Add structured logging (JSON format)
- [x] 6.4.2 Add decision metrics (Prometheus format)
- [x] 6.4.3 Add alerting rules for failures
- [x] 6.4.4 Add dashboard for decision monitoring
- [x] 6.4.5 Document monitoring setup

### 6.5 Deployment Configuration
- [x] 6.5.1 Update render.yaml with new service
- [x] 6.5.2 Configure staging environment (INTERNAL mode)
- [x] 6.5.3 Configure production environment (INTERNAL mode initially)
- [x] 6.5.4 Add deployment runbook
- [x] 6.5.5 Add rollback procedure

## Phase 7: Testing & Quality Assurance (Week 7)

### 7.1 Unit Tests
- [ ] 7.1.1 Achieve 90%+ coverage for decision-authority-service
- [ ] 7.1.2 Achieve 90%+ coverage for decision sources
- [ ] 7.1.3 Achieve 90%+ coverage for controllers
- [ ] 7.1.4 Review and fix flaky tests

### 7.2 Integration Tests
- [ ] 7.2.1 Test INTERNAL mode end-to-end
- [ ] 7.2.2 Test EXTERNAL mode with MockDecisionSource
- [ ] 7.2.3 Test mode switching without restart
- [ ] 7.2.4 Test webhook processing
- [ ] 7.2.5 Test admin override workflow

### 7.3 Load Testing
- [ ] 7.3.1 Test 100 concurrent decision requests
- [ ] 7.3.2 Test 1000 concurrent decision requests
- [ ] 7.3.3 Test polling under load
- [ ] 7.3.4 Test webhook processing under load
- [ ] 7.3.5 Identify and fix bottlenecks

### 7.4 Security Testing
- [ ] 7.4.1 Test webhook signature validation
- [ ] 7.4.2 Test API authentication
- [ ] 7.4.3 Test admin authorization
- [ ] 7.4.4 Test SQL injection prevention
- [ ] 7.4.5 Test XSS prevention in UI
- [ ] 7.4.6 Run security audit (npm audit)

### 7.5 User Acceptance Testing
- [ ] 7.5.1 Test seller listing creation flow
- [ ] 7.5.2 Test buyer search/browse with status filters
- [ ] 7.5.3 Test admin decision management
- [ ] 7.5.4 Test decision status notifications
- [ ] 7.5.5 Collect and address user feedback

## Phase 8: Documentation & Training (Week 8)

### 8.1 Technical Documentation
- [ ] 8.1.1 Write API documentation (OpenAPI/Swagger)
- [ ] 8.1.2 Write architecture documentation
- [ ] 8.1.3 Write database schema documentation
- [ ] 8.1.4 Write deployment guide
- [ ] 8.1.5 Write troubleshooting guide

### 8.2 User Documentation
- [ ] 8.2.1 Write seller guide (decision status meanings)
- [ ] 8.2.2 Write buyer guide (filtered search)
- [ ] 8.2.3 Write admin guide (decision management)
- [ ] 8.2.4 Create FAQ document

### 8.3 Training Materials
- [ ] 8.3.1 Create demo video for sellers
- [ ] 8.3.2 Create demo video for admins
- [ ] 8.3.3 Create training slides for support team
- [ ] 8.3.4 Conduct training sessions

### 8.4 Runbooks
- [ ] 8.4.1 Write deployment runbook
- [ ] 8.4.2 Write rollback runbook
- [ ] 8.4.3 Write incident response runbook
- [ ] 8.4.4 Write mode switching runbook

## Phase 9: Staging Deployment (Week 9)

### 9.1 Staging Environment Setup
- [ ] 9.1.1 Deploy decision-authority-service to staging
- [ ] 9.1.2 Run database migrations
- [ ] 9.1.3 Configure INTERNAL mode
- [ ] 9.1.4 Verify service health

### 9.2 Smoke Tests
- [ ] 9.2.1 Test listing creation with decision
- [ ] 9.2.2 Test auction creation with decision
- [ ] 9.2.3 Test escrow release with decision
- [ ] 9.2.4 Test admin override
- [ ] 9.2.5 Test webhook processing

### 9.3 Integration Verification
- [ ] 9.3.1 Verify listing-service integration
- [ ] 9.3.2 Verify auction-service integration
- [ ] 9.3.3 Verify escrow-service integration
- [ ] 9.3.4 Verify frontend integration
- [ ] 9.3.5 Verify API gateway routing

### 9.4 Performance Verification
- [ ] 9.4.1 Run load tests on staging
- [ ] 9.4.2 Verify response times < 200ms
- [ ] 9.4.3 Verify no memory leaks
- [ ] 9.4.4 Verify database query performance

## Phase 10: Production Deployment (Week 10)

### 10.1 Pre-Deployment Checklist
- [ ] 10.1.1 All tests passing
- [ ] 10.1.2 Security audit complete
- [ ] 10.1.3 Documentation complete
- [ ] 10.1.4 Rollback plan ready
- [ ] 10.1.5 Monitoring configured
- [ ] 10.1.6 Alerts configured
- [ ] 10.1.7 Team trained

### 10.2 Production Deployment
- [ ] 10.2.1 Deploy decision-authority-service
- [ ] 10.2.2 Run database migrations
- [ ] 10.2.3 Configure INTERNAL mode (feature flag OFF)
- [ ] 10.2.4 Deploy updated listing-service
- [ ] 10.2.5 Deploy updated auction-service
- [ ] 10.2.6 Deploy updated escrow-service
- [ ] 10.2.7 Deploy updated frontend
- [ ] 10.2.8 Verify all services healthy

### 10.3 Post-Deployment Verification
- [ ] 10.3.1 Run smoke tests
- [ ] 10.3.2 Monitor error rates
- [ ] 10.3.3 Monitor response times
- [ ] 10.3.4 Monitor decision creation rate
- [ ] 10.3.5 Verify no customer-facing errors

### 10.4 Gradual Rollout (EXTERNAL Mode)
- [ ] 10.4.1 Enable EXTERNAL mode for 1% of traffic
- [ ] 10.4.2 Monitor for 24 hours
- [ ] 10.4.3 Enable for 10% of traffic
- [ ] 10.4.4 Monitor for 24 hours
- [ ] 10.4.5 Enable for 50% of traffic
- [ ] 10.4.6 Monitor for 24 hours
- [ ] 10.4.7 Enable for 100% of traffic
- [ ] 10.4.8 Monitor for 1 week

### 10.5 Post-Launch
- [ ] 10.5.1 Collect user feedback
- [ ] 10.5.2 Address any issues
- [ ] 10.5.3 Optimize performance
- [ ] 10.5.4 Plan future enhancements

---

## Task Priorities

**Critical Path** (Must complete for MVP):
- Phase 1: Foundation
- Phase 2: Core Service
- Phase 4: Service Integration
- Phase 6: Infrastructure
- Phase 9: Staging Deployment

**High Priority** (Required for production):
- Phase 3: External Integration
- Phase 5: Frontend Integration
- Phase 7: Testing
- Phase 10: Production Deployment

**Medium Priority** (Can be done post-launch):
- Phase 8: Documentation & Training

**Low Priority** (Nice to have):
- Advanced monitoring dashboards
- Decision analytics
- Batch decision processing

---

## Estimated Timeline

- **Weeks 1-2**: Foundation & Core Service (20 tasks)
- **Weeks 3-4**: External Integration & Service Integration (30 tasks)
- **Weeks 5-6**: Frontend & Infrastructure (25 tasks)
- **Weeks 7-8**: Testing & Documentation (20 tasks)
- **Weeks 9-10**: Deployment & Rollout (15 tasks)

**Total**: 10 weeks, 110+ tasks

---

## Success Metrics

- [ ] All existing tests pass without modification
- [ ] New tests achieve 90%+ coverage
- [ ] Zero downtime during deployment
- [ ] Feature flag toggle works without restart
- [ ] External API integration completes within 30s
- [ ] Can switch to EXTERNAL mode in production
- [ ] Zero customer-facing errors during rollout
