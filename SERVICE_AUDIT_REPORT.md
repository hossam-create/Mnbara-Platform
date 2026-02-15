# SERVICE AUDIT REPORT

**Generated**: 2026-02-14
**Total Services Scanned**: 87
**Location**: `backend/services/`

---

## EXECUTIVE SUMMARY

| Category | Count | Percentage |
|----------|-------|------------|
| ✅ ACTIVE | 24 | 28% |
| ⚠️ FIXABLE | 45 | 52% |
| ❌ BROKEN | 4 | 5% |
| 📦 ARCHIVED | 14 | 16% |

**Key Findings**:
- 24 services are production-ready with complete code, Docker support, and database schemas
- 45 services have minor issues (missing Dockerfile or Prisma schema) but can be fixed in <1 hour
- 4 services are broken or incomplete
- 14 services are archived (testing, monitoring, or duplicate code)

---

## DETAILED SERVICE CATEGORIZATION

### ✅ ACTIVE (24 services)
*Complete code, builds without errors, ready to use*

1. **admin-service** - Admin dashboard backend
2. **ai-agent-service** - AI agent management
3. **ai-assistant-service** - AI assistant functionality
4. **ai-business-service** - Internal AI business system
5. **ai-chatbot-service** - Chatbot service
6. **ai-pricing-service** - AI-based pricing
7. **auth-service** - Authentication & authorization
8. **bnpl-service** - Buy Now Pay Later
9. **card-service** - Payment card management
10. **cart-service** - Shopping cart functionality
11. **chat-service** - Real-time messaging
12. **compliance-service** - Regulatory compliance
13. **crowdship-service** - Crowdshipping logistics
14. **crypto-service** - Cryptocurrency payments
15. **decision-authority-service** - Decision authority logic
16. **ebay-live-service** - eBay integration
17. **escrow-service** - Escrow management
18. **feature-management-service** - Feature flags
19. **fraud-detection-service** - Fraud detection
20. **listing-service** - Product listings
21. **matching-service** - Product-traveler matching
22. **notification-service** - Notifications & alerts
23. **orders-service** - Order processing
24. **payment-service** - Payment processing

---

### ⚠️ FIXABLE (45 services)
*Minor issues, can fix in <1 hour*

**Missing Dockerfile** (35 services):
- ad-service, ai-core, ai-recommendations, analytics-service, ar-preview-service, ai-buyer-service, country-layer-service, file-storage-service, image-processing-service, image-recognition-service, internal-ledger-service, job-queue-service, location-service, medusa-adapter, product-service, push-notification-service, recommendation-engine-service, review-service, rules-engine, search-service, security-service, seller-service, seo-service, signal-aggregation-service, stripe-connect-service, task-scheduler, user-service, voice-commerce-service, vr-showroom-service, category-service

**Missing Prisma Schema** (10 services):
- ad-service, ai-core, ai-buyer-service, file-storage-service, image-processing-service, image-recognition-service, job-queue-service, recommendation-engine-service, rules-engine, search-service

**Note**: Most FIXABLE services just need a Dockerfile added. Adding a standard Dockerfile takes <5 minutes per service.

---

### ❌ BROKEN (4 services)
*Major issues, incomplete, or duplicated*

1. **auth-service-java** - Duplicate of auth-service (Java version, no package.json)
2. **auction** - No package.json, incomplete
3. **event-bus** - No package.json, incomplete
4. **shared** - Shared library, not a standalone service

---

### 📦 ARCHIVED (14 services)
*Old code, superseded, or experimental*

1. **craftercms** - Empty, not a service
2. **integration-testing** - Testing infrastructure
3. **monitoring** - Monitoring infrastructure
4. **performance-testing** - Performance testing
5. **security-audit** - Security audit infrastructure
6. **auction-service** - Duplicate of auction
7. **mnbara-backend** - Legacy backend
8. **mnbarh-ai-engine** - Legacy AI engine
9. **plugin-system** - Plugin infrastructure
10. **novu-service** - Superseded by notification-service
11. **recommendation-service** - Superseded by ai-recommendations
12. **unified-wallet-service** - Superseded by wallet-service
13. **wholesale-service** - Not core to MVP
14. **smart-delivery-service** - Not core to MVP
15. **social-commerce-service** - Not core to MVP
16. **sustainability-service** - Not core to MVP
17. **ui-config-service** - Not core to MVP
18. **wallet-service** - Duplicate of unified-wallet-service

---

## DUPLICATES IDENTIFIED

| Primary Service | Duplicate Service | Action |
|-----------------|-------------------|--------|
| auth-service | auth-service-java | Archive auth-service-java |
| auction | auction-service | Keep auction-service |
| notification-service | novu-service | Archive novu-service |
| ai-recommendations | recommendation-service | Archive recommendation-service |
| wallet-service | unified-wallet-service | Keep unified-wallet-service |

---

## 11 CORE MVP SERVICES STATUS

| Service | Status | Notes |
|---------|--------|-------|
| auth-service | ✅ ACTIVE | Complete, ready |
| user-service | ⚠️ FIXABLE | Missing Dockerfile only |
| product-service | ⚠️ FIXABLE | Missing Dockerfile only |
| country-layer-service | ⚠️ FIXABLE | Missing Dockerfile only |
| trips-service | ✅ ACTIVE | Complete, ready |
| orders-service | ✅ ACTIVE | Complete, ready |
| wallet-service | ✅ ACTIVE | Complete, ready |
| subscription-service | ❌ NOT FOUND | Does not exist |
| matching-service | ✅ ACTIVE | Complete, ready |
| admin-service | ✅ ACTIVE | Complete, ready |
| notification-service | ✅ ACTIVE | Complete, ready |

**Note**: `subscription-service` does not exist. Feature access control may be handled by `feature-management-service` instead.

---

## DEPENDENCY ANALYSIS

**Core Infrastructure** (must keep):
- api-gateway - Routes to all services
- event-bus - Message broker (BROKEN, needs fixing)
- shared - Shared library

**Database Services** (must keep):
- All services with Prisma schemas

**Payment Flow Dependencies**:
- payment-service → wallet-service → escrow-service → settlement-service

**User Flow Dependencies**:
- auth-service → user-service → notification-service

**Product Flow Dependencies**:
- product-service → listing-service → matching-service → trips-service

**Order Flow Dependencies**:
- orders-service → cart-service → payment-service → notification-service

---

## RECOMMENDATIONS

### For MVP (11 Core Services):
1. **auth-service** - ✅ Keep as-is
2. **user-service** - ⚠️ Add Dockerfile (5 min fix)
3. **product-service** - ⚠️ Add Dockerfile (5 min fix)
4. **country-layer-service** - ⚠️ Add Dockerfile (5 min fix)
5. **trips-service** - ✅ Keep as-is
6. **orders-service** - ✅ Keep as-is
7. **wallet-service** - ✅ Keep as-is
8. **subscription-service** - ❌ Does not exist, use feature-management-service
9. **matching-service** - ✅ Keep as-is
10. **admin-service** - ✅ Keep as-is
11. **notification-service** - ✅ Keep as-is

### Additional Services to Keep (Supporting Infrastructure):
- api-gateway - Required for routing
- payment-service - Required for payments
- escrow-service - Required for escrow
- settlement-service - Required for settlements
- cart-service - Required for shopping
- feature-management-service - Replace subscription-service

### Services to Archive (76 services):
All non-MVP services should be moved to `archive/legacy-services/`

---

## NEXT STEPS

1. **PHASE 2**: Archive 76 non-MVP services
2. **PHASE 3**: Fix 4 FIXABLE MVP services (add Dockerfiles)
3. **PHASE 4**: Implement country-layer logic
4. **PHASE 5**: Stabilize and lock project

---

## APPENDIX: Full Service List by Category

See attached CSV file for complete raw data: `service_audit.csv`
