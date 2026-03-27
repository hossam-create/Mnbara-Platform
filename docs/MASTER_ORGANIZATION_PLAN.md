# Mnbara Platform - Master Organization Plan

**Date:** February 14, 2026  
**Status:** Active Organization Initiative  
**Purpose:** Catalog all microservices and consolidate scattered documentation

---

## Executive Summary

The Mnbara platform is a dual-purpose system:
1. **E-commerce Marketplace** - Buy/sell products with auctions
2. **Crowdshipping Service** - Peer-to-peer package delivery via travelers

**Current State:**
- ~87 microservices identified
- 150+ scattered documentation files in `docs/markdown/`
- 11 active specifications in `.kiro/specs/`
- Documentation fragmentation across multiple locations

**Organization Goals:**
1. ✅ Catalog all microservices with purpose and status
2. 📋 Consolidate documentation into master PRD
3. 🗂️ Create clear navigation structure
4. 🧹 Archive obsolete/duplicate files
5. 📊 Establish single source of truth

---

## Part 1: Microservices Catalog

### Core Services (Authentication & User Management)

| Service | Purpose | Status | Location |
|---------|---------|--------|----------|
| **auth-service** | User authentication, OAuth2, JWT, sessions | ✅ Active | `backend/services/auth-service/` |
| **user-service** | User profiles, preferences, management | ✅ Active | `backend/services/user-service/` |
| **kyc-service** | KYC verification, identity validation | ✅ Active | `backend/services/kyc-service/` |
| **customer-id-service** | Customer identity management | 🔄 Review | `backend/services/customer-id-service/` |

### Payment & Financial Services

| Service | Purpose | Status | Location |
|---------|---------|--------|----------|
| **payment-service** | Payment processing, Stripe integration | ✅ Active | `backend/services/payment-service/` |
| **internal-ledger-service** | Internal wallet, ledger, payouts | ✅ Active | `backend/services/internal-ledger-service/` |
| **wallet-service** | User wallet management | ✅ Active | `backend/services/wallet-service/` |
| **unified-wallet-service** | Unified wallet interface | 🔄 Review | `backend/services/unified-wallet-service/` |
| **escrow-service** | Escrow for transactions | ✅ Active | `backend/services/escrow-service/` |
| **stripe-connect-service** | Stripe Connect for sellers | ✅ Active | `backend/services/stripe-connect-service/` |
| **paypal-service** | PayPal integration | 📋 Planned | `backend/services/paypal-service/` |
| **settlement-service** | Payment settlement | 🔄 Review | `backend/services/settlement-service/` |
| **card-service** | Card management | 📋 Planned | `backend/services/card-service/` |
| **crypto-service** | Cryptocurrency payments | 📋 Planned | `backend/services/crypto-service/` |
| **bnpl-service** | Buy Now Pay Later | 📋 Planned | `backend/services/bnpl-service/` |

### E-commerce Core Services

| Service | Purpose | Status | Location |
|---------|---------|--------|----------|
| **product-service** | Product catalog, listings | ✅ Active | `backend/services/product-service/` |
| **listing-service** | Product listing management | ✅ Active | `backend/services/listing-service/` |
| **auction-service** | Auction system, bidding | ✅ Active | `backend/services/auction-service/` |
| **cart-service** | Shopping cart | 🔄 Review | `backend/services/cart-service/` |
| **orders-service** | Order management | ✅ Active | `backend/services/orders-service/` |
| **category-service** | Product categorization | 🔄 Review | `backend/services/category-service/` |
| **seller-service** | Seller management | 🔄 Review | `backend/services/seller-service/` |
| **wholesale-service** | Wholesale operations | 📋 Planned | `backend/services/wholesale-service/` |

### Crowdshipping Services

| Service | Purpose | Status | Location |
|---------|---------|--------|----------|
| **request-engine** | Delivery requests, disputes, refunds | ✅ Active | `backend/services/request-engine/` |
| **trips-service** | Traveler trip management | ✅ Active | `backend/services/trips-service/` |
| **location-service** | GPS tracking, geolocation | ✅ Active | `backend/services/location-service/` |
| **matching-service** | Match travelers with packages | ✅ Active | `backend/services/matching-service/` |
| **crowdship-service** | Crowdshipping coordination | 🔄 Review | `backend/services/crowdship-service/` |
| **smart-delivery-service** | Smart delivery routing | 📋 Planned | `backend/services/smart-delivery-service/` |

### P2P Exchange & Marketplace

| Service | Purpose | Status | Location |
|---------|---------|--------|----------|
| **p2p-exchange-service** | P2P currency/goods exchange | ✅ Active | `backend/services/p2p-exchange-service/` |

### Communication Services

| Service | Purpose | Status | Location |
|---------|---------|--------|----------|
| **chat-service** | Real-time messaging | ✅ Active | `backend/services/chat-service/` |
| **notification-service** | Multi-channel notifications | ✅ Active | `backend/services/notification-service/` |
| **push-notification-service** | Push notifications | ✅ Active | `backend/services/push-notification-service/` |
| **novu-service** | Novu notification integration | ✅ Active | `backend/services/novu-service/` |

### AI & Intelligence Services

| Service | Purpose | Status | Location |
|---------|---------|--------|----------|
| **ai-agent-service** | AI agents, shopping assistant | ✅ Active | `backend/services/ai-agent-service/` |
| **ai-assistant-service** | AI assistant features | 🔄 Review | `backend/services/ai-assistant-service/` |
| **ai-recommendations** | Product recommendations | ✅ Active | `backend/services/ai-recommendations/` |
| **ai-pricing-service** | Dynamic pricing | ✅ Active | `backend/services/ai-pricing-service/` |
| **ai-buyer-service** | AI buyer assistance | 🔄 Review | `backend/services/ai-buyer-service/` |
| **ai-business-service** | AI business intelligence | 📋 Planned | `backend/services/ai-business-service/` |
| **ai-chatbot-service** | Chatbot service | 📋 Planned | `backend/services/ai-chatbot-service/` |
| **ai-core** | Core AI functionality | 🔄 Review | `backend/services/ai-core/` |
| **mnbarh-ai-engine** | Main AI engine | 🔄 Review | `backend/services/mnbarh-ai-engine/` |
| **recommendation-engine-service** | Recommendation engine | ✅ Active | `backend/services/recommendation-engine-service/` |
| **recommendation-service** | Recommendation API | 🔄 Review | `backend/services/recommendation-service/` |

### Search & Discovery

| Service | Purpose | Status | Location |
|---------|---------|--------|----------|
| **search-service** | Product search | ✅ Active | `backend/services/search-service/` |
| **image-recognition-service** | Image recognition | ✅ Active | `backend/services/image-recognition-service/` |
| **image-processing-service** | Image processing | ✅ Active | `backend/services/image-processing-service/` |

### Trust & Safety Services

| Service | Purpose | Status | Location |
|---------|---------|--------|----------|
| **decision-authority-service** | Custodii decision integration | ✅ Active | `backend/services/decision-authority-service/` |
| **fraud-detection-service** | Fraud detection | ✅ Active | `backend/services/fraud-detection-service/` |
| **security-service** | Security features | ✅ Active | `backend/services/security-service/` |
| **compliance-service** | Compliance management | 🔄 Review | `backend/services/compliance-service/` |
| **geolock-service** | Geographic restrictions | ✅ Active | `backend/services/geolock-service/` |

### Review & Rating Services

| Service | Purpose | Status | Location |
|---------|---------|--------|----------|
| **review-service** | Reviews and ratings | ✅ Active | `backend/services/review-service/` |
| **rewards-service** | Loyalty and rewards | ✅ Active | `backend/services/rewards-service/` |

### Infrastructure & Platform Services

| Service | Purpose | Status | Location |
|---------|---------|--------|----------|
| **api-gateway** | API gateway, routing | ✅ Active | `backend/services/api-gateway/` |
| **event-bus** | Event-driven messaging | 🔄 Review | `backend/services/event-bus/` |
| **job-queue-service** | Background job processing | ✅ Active | `backend/services/job-queue-service/` |
| **task-scheduler** | Scheduled tasks | ✅ Active | `backend/services/task-scheduler/` |
| **file-storage-service** | File storage | ✅ Active | `backend/services/file-storage-service/` |
| **analytics-service** | Analytics and tracking | ✅ Active | `backend/services/analytics-service/` |
| **monitoring** | System monitoring | 🔄 Review | `backend/services/monitoring/` |

### Business Logic & Rules

| Service | Purpose | Status | Location |
|---------|---------|--------|----------|
| **rules-engine** | Business rules engine | 🔄 Review | `backend/services/rules-engine/` |
| **signal-aggregation-service** | Signal aggregation | 🔄 Review | `backend/services/signal-aggregation-service/` |
| **demand-forecasting-service** | Demand forecasting | 📋 Planned | `backend/services/demand-forecasting-service/` |

### Integration & Adapter Services

| Service | Purpose | Status | Location |
|---------|---------|--------|----------|
| **medusa-adapter** | Medusa e-commerce adapter | ✅ Active | `backend/services/medusa-adapter/` |
| **ebay-live-service** | eBay integration | 📋 Planned | `backend/services/ebay-live-service/` |
| **blockchain-service** | Blockchain integration | 📋 Planned | `backend/services/blockchain-service/` |

### Content & Localization

| Service | Purpose | Status | Location |
|---------|---------|--------|----------|
| **i18n-service** | Internationalization | ✅ Active | `backend/services/i18n-service/` |
| **seo-service** | SEO optimization | 🔄 Review | `backend/services/seo-service/` |
| **ui-config-service** | UI configuration | 🔄 Review | `backend/services/ui-config-service/` |
| **craftercms** | CMS integration | 📋 Planned | `backend/services/craftercms/` |

### Advanced Features (Future)

| Service | Purpose | Status | Location |
|---------|---------|--------|----------|
| **ar-preview-service** | AR product preview | 📋 Planned | `backend/services/ar-preview-service/` |
| **vr-showroom-service** | VR showroom | 📋 Planned | `backend/services/vr-showroom-service/` |
| **voice-commerce-service** | Voice commerce | 📋 Planned | `backend/services/voice-commerce-service/` |
| **social-commerce-service** | Social commerce | 📋 Planned | `backend/services/social-commerce-service/` |
| **sustainability-service** | Sustainability tracking | 📋 Planned | `backend/services/sustainability-service/` |

### Admin & Management

| Service | Purpose | Status | Location |
|---------|---------|--------|----------|
| **admin-service** | Admin panel backend | 🔄 Review | `backend/services/admin-service/` |
| **ad-service** | Advertising management | 📋 Planned | `backend/services/ad-service/` |
| **feature-management-service** | Feature flags | 🔄 Review | `backend/services/feature-management-service/` |

### Legacy/Duplicate Services (Needs Review)

| Service | Purpose | Status | Location |
|---------|---------|--------|----------|
| **auction** | Old auction service | ⚠️ Duplicate | `backend/services/auction/` |
| **auth-service-java** | Java auth service | ⚠️ Duplicate | `backend/services/auth-service-java/` |
| **mnbara-backend** | Legacy backend | ⚠️ Legacy | `backend/services/mnbara-backend/` |

### Testing & Development

| Service | Purpose | Status | Location |
|---------|---------|--------|----------|
| **integration-testing** | Integration tests | 🔧 Dev | `backend/services/integration-testing/` |
| **performance-testing** | Performance tests | 🔧 Dev | `backend/services/performance-testing/` |
| **security-audit** | Security auditing | 🔧 Dev | `backend/services/security-audit/` |

### Shared Libraries

| Service | Purpose | Status | Location |
|---------|---------|--------|----------|
| **shared** | Shared utilities | ✅ Active | `backend/services/shared/` |
| **plugin-system** | Plugin architecture | 🔄 Review | `backend/services/plugin-system/` |

---

## Service Status Legend

- ✅ **Active** - Fully implemented and in use
- 🔄 **Review** - Exists but needs review for duplication/consolidation
- 📋 **Planned** - Planned but not yet implemented
- ⚠️ **Duplicate** - Potential duplicate, needs consolidation
- 🔧 **Dev** - Development/testing only

---

## Part 2: Documentation Consolidation Strategy

### Current Documentation Structure

```
docs/
├── The full PRD for Mnbara Platform.md (MASTER)
├── markdown/ (150+ files - NEEDS CONSOLIDATION)
│   ├── Sprint reports
│   ├── Project completion reports
│   ├── Phase documentation
│   ├── Integration guides
│   ├── Arabic translations
│   └── Various summaries
├── compliance/ (Production readiness)
├── archive/ (Historical documentation)
└── to do/ (Planning documents)

.kiro/specs/ (11 specifications)
├── manual-payout-system/ ✅
├── disputes-refunds-system/ 📋
├── custodii-decision-authority/ ✅
├── frontend-backend-binding/ 🚧
├── frontend-wallet-integration/ 📋
├── ai-ready-architecture/ 📋
├── ebay-category-products/ 📋
├── ecommerce-platform/ 📋
├── homepage-retail-recomposition/ 📋
├── live-location-tracking/ 📋
└── p2p-exchange-marketplace/ ✅
```

### Consolidation Plan

#### Phase 1: Categorize Documentation (Week 1)
1. **Active Documentation** - Currently relevant
2. **Historical Documentation** - Archive but keep
3. **Duplicate Documentation** - Consolidate
4. **Obsolete Documentation** - Archive

#### Phase 2: Create Master Structure (Week 2)
```
docs/
├── README.md (Navigation hub)
├── MASTER_PRD.md (Consolidated PRD)
├── ARCHITECTURE.md (System architecture)
├── API_REFERENCE.md (API documentation)
├── DEPLOYMENT_GUIDE.md (Deployment procedures)
├── USER_GUIDES/
│   ├── SHIPPER_GUIDE.md
│   ├── TRAVELER_GUIDE.md
│   └── ADMIN_GUIDE.md
├── TECHNICAL/
│   ├── MICROSERVICES_CATALOG.md
│   ├── DATABASE_SCHEMA.md
│   ├── INTEGRATION_PATTERNS.md
│   └── SECURITY_GUIDE.md
├── OPERATIONS/
│   ├── RUNBOOKS/
│   ├── MONITORING.md
│   └── INCIDENT_RESPONSE.md
├── COMPLIANCE/
│   ├── PRODUCTION_READINESS.md
│   ├── SECURITY_COMPLIANCE.md
│   └── DATA_PRIVACY.md
└── ARCHIVE/
    └── [Historical documents]
```

#### Phase 3: Consolidate Content (Week 3-4)
- Merge sprint reports into single progress tracker
- Consolidate project completion reports
- Update master PRD with all feature documentation
- Create single source of truth for each topic

---

## Part 3: Immediate Actions

### Priority 1: Critical Documentation
1. ✅ Create this master organization plan
2. 📋 Complete microservices catalog with README for each service
3. 📋 Consolidate payment system documentation
4. 📋 Consolidate crowdshipping documentation
5. 📋 Create unified API reference

### Priority 2: Cleanup
1. 📋 Identify and archive obsolete sprint reports
2. 📋 Merge duplicate service documentation
3. 📋 Consolidate phase documentation
4. 📋 Archive completed project reports

### Priority 3: Navigation
1. 📋 Create master README with clear navigation
2. 📋 Add cross-references between related docs
3. 📋 Create quick-start guides
4. 📋 Build searchable index

---

## Part 4: Service Dependencies Map

### Core Dependency Chain
```
api-gateway
  ├── auth-service
  │   └── user-service
  │       └── kyc-service
  ├── payment-service
  │   ├── internal-ledger-service
  │   ├── escrow-service
  │   └── stripe-connect-service
  ├── product-service
  │   ├── listing-service
  │   ├── auction-service
  │   └── category-service
  ├── request-engine
  │   ├── trips-service
  │   ├── matching-service
  │   └── location-service
  └── decision-authority-service
```

---

## Next Steps

1. **User Approval Required:**
   - Review this organization plan
   - Approve consolidation strategy
   - Prioritize which sections to tackle first

2. **Begin Execution:**
   - Start with approved priorities
   - Create consolidated documents
   - Archive obsolete files
   - Update cross-references

3. **Maintain Organization:**
   - Establish documentation standards
   - Create templates for new docs
   - Regular cleanup schedule

---

**Status:** Awaiting user approval to proceed with consolidation
**Last Updated:** February 14, 2026
