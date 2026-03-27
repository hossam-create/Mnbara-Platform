# Mnbara Platform - Comprehensive File Inventory & Dependency Analysis

**Date**: February 6, 2026  
**Analysis Team**: Phase 1 Analysis (Week 1-2)  
**Purpose**: Complete file inventory, dependency mapping, and restructuring recommendations

---

## 1. Complete File Inventory

### 1.1 Root Directory Overview

The root directory contains **180+ files** across multiple categories:

| Category | Count | Examples |
|----------|-------|----------|
| Documentation | 80+ | `README.md`, `PHASE_*.md`, `PROJECT_*.md` |
| Configuration | 15+ | `package.json`, `tsconfig.json`, `docker-compose*.yml` |
| Scripts | 20+ | `*.bat`, `*.ps1`, `deploy-*.sh` |
| Reports | 40+ | `*_REPORT.md`, `*_SUMMARY.md`, `*_COMPLETE.md` |
| Arabic Docs | 10+ | `ابدأ_من_هنا.md`, `المساعد_الذكي_مكتمل.md` |

### 1.2 Directory Structure Summary

```
mnbara-platform/
├── .claude/              # AI Assistant configuration
├── .cursor/               # Cursor IDE settings
├── .github/               # GitHub workflows
├── .husky/               # Git hooks configuration
├── .kiro/                # Kiro specifications (12 spec directories)
├── archive/              # Consolidated archive (400+ files)
│   ├── docs/             # General documentation
│   ├── docs-archive-2026-01-20/  # 309+ archived docs
│   ├── implementation-reports/   # Phase implementation reports
│   ├── mnbara-web-legacy/  # Legacy web app
│   ├── nextjs-app/        # Next.js experiments
│   ├── prompts/           # AI prompts
│   ├── project-management/ # PM documents
│   ├── roadmaps/          # Project roadmaps
│   ├── specs/             # Archived specifications
│   └── testing-reports/   # Testing documentation
├── backend/              # Backend microservices
│   ├── core-api/         # Core API layer
│   ├── services/         # 75+ microservices
│   └── shared/           # Shared utilities
├── frontend/             # Frontend applications
│   └── web-app/          # Main web application
├── mobile-app/           # React Native mobile app
├── plans/                # Planning documents
└── Root files            # Configuration & documentation
```

---

## 2. Backend Services Inventory

### 2.1 Complete Service List (75+ Services)

| Category | Services |
|----------|----------|
| **Core** | api-gateway, user-service, auth-service, notification-service |
| **Commerce** | product-service, listing-service, listing-service-node, cart-service, order-service, orders-service |
| **Payments** | payment-service, wallet-service, stripe-connect-service, paypal-service, crypto-service, bnpl-service, escrow-service, settlement-service, internal-ledger-service |
| **AI/ML** | ai-core, ai-agent-service, ai-assistant-service, ai-business-service, ai-buyer-service, ai-chatbot-service, ai-pricing-service, ai-recommendations, ai-recommendations-v2, recommendation-engine-service, recommendation-service, demand-forecasting-service |
| **Trust/Safety** | fraud-detection-service, compliance-service, security-service, decision-authority-service, rules-engine, signal-aggregation-service |
| **User Features** | seller-service, review-service, rewards-service, customer-id-service |
| **Search/Match** | search-service, matching-service, category-service, feature-management-service |
| **Delivery** | smart-delivery-service, crowdship-service, trips-service |
| **Communication** | chat-service, push-notification-service, novu-service |
| **Localization** | i18n-service, image-processing-service, file-storage-service |
| **Analytics** | analytics-service, sustainability-service |
| **Integrations** | medusa-adapter, location-service, geolock-service, kyc-service, blockchain-service |
| **Utilities** | job-queue-service, task-scheduler, request-engine, ar-preview-service, vr-showroom-service, voice-commerce-service, social-commerce-service, wholesale-service, image-recognition-service, seo-service, ui-config-service, admin-service, card-service |

### 2.2 Duplicate/Similar Services Identified

| Service | Duplicate Of | Recommendation |
|---------|--------------|---------------|
| `listing-service` | `listing-service-node` | Consolidate into single service |
| `ai-recommendations` | `ai-recommendations-v2` | Merge v2 into main, archive v1 |
| `recommendation-service` | `recommendation-engine-service` | Evaluate for consolidation |
| `order-service` | `orders-service` | Consolidate into single service |

---

## 3. Dependency Mapping

### 3.1 Root Dependencies

```json
{
  "name": "mnbarh-platform",
  "devDependencies": {
    "@prisma/client": "^5.22.0",
    "@types/node": "^20.10.0",
    "axios": "^1.6.2",
    "concurrently": "^8.2.2",
    "prisma": "^5.22.0",
    "typescript": "^5.3.3",
    "vitest": "^1.0.4"
  }
}
```

### 3.2 Frontend Dependencies (web-app)

```json
{
  "dependencies": [
    "@headlessui/react": "^1.7.17",
    "@reduxjs/toolkit": "^2.0.1",
    "@tanstack/react-query": "^5.14.2",
    "axios": "^1.6.2",
    "framer-motion": "^10.16.16",
    "i18next": "^25.7.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-redux": "^9.0.4",
    "react-router-dom": "^6.20.1",
    "socket.io-client": "^4.7.4"
  ]
}
```

### 3.3 Mobile App Dependencies

```json
{
  "dependencies": [
    "@react-native-firebase/*": "^19.0.0",
    "@react-navigation/*": "^6.5.11",
    "@reduxjs/toolkit": "^2.0.0",
    "axios": "^1.6.2",
    "react-native": "0.75.0",
    "react-native-paper": "^5.11.4",
    "socket.io-client": "^4.7.2"
  ]
}
```

### 3.4 Common Backend Dependencies Pattern

| Dependency | Version Range | Services Using |
|------------|---------------|----------------|
| express | ^4.18.x | 50+ services |
| @prisma/client | ^5.7.x - ^5.22.x | 30+ services |
| typescript | ^5.3.x | 40+ services |
| winston | ^3.11.x | 15+ services |
| dotenv | ^16.3.x | 50+ services |
| cors | ^2.8.x | 40+ services |
| jsonwebtoken | ^9.0.x | 25+ services |

### 3.5 Version Conflicts Identified

| Dependency | Versions Found | Severity | Action Required |
|------------|----------------|----------|-----------------|
| @prisma/client | 5.7.0, 5.22.0 | High | Standardize to latest |
| axios | 1.6.2 (consistent) | Low | OK |
| react | 18.2.0 (consistent) | Low | OK |
| socket.io-client | 4.7.2, 4.7.4 | Low | Standardize to latest |
| stripe | 14.9.0 | N/A | Payment service only |

### 3.6 External API Dependencies

| Service | External API | Purpose |
|---------|--------------|---------|
| payment-service | Stripe | Payment processing |
| paypal-service | PayPal | Payment processing |
| crypto-service | Blockchain APIs | Crypto transactions |
| kyc-service | External KYC providers | Identity verification |
| firebase-services | Firebase | Push notifications, auth |
| location-service | Map APIs | Geolocation |
| image-recognition-service | ML Vision APIs | Image analysis |

---

## 4. Archive Analysis

### 4.1 Archive Directory Structure

```
archive/
├── docs/                          # Active documentation
├── docs-archive-2026-01-20/       # 309+ files, ~15MB
│   ├── legacy/                    # Legacy regulatory docs
│   ├── regulatory/                # Compliance documentation
│   ├── risk/                      # Risk assessment docs
│   └── security/                  # Security audits
├── implementation-reports/        # Phase completion reports
├── mnbara-web-legacy/            # Legacy Next.js app
├── nextjs-app/                    # Next.js experiments
├── payment-service-cleanup-2026-01-20/  # 79+ cleanup files
├── prompts/                       # AI execution prompts
├── project-management/            # PM documentation
├── roadmaps/                      # Strategic roadmaps
├── specs/                         # Archived specifications
└── testing-reports/              # Test documentation
```

### 4.2 Archive Assessment Summary

| Archive Type | Files | Size | Assessment |
|--------------|-------|------|------------|
| Payment Service Cleanup | 79+ | ~2MB | **SAFE TO DELETE** - Cleanup artifacts |
| Documentation Archive | 309+ | ~15MB | **KEEP** - Contains regulatory docs |
| Implementation Reports | 50+ | ~5MB | **KEEP** - Historical progress |
| Legacy Web App | 100+ | ~10MB | **ARCHIVE** - Reference only |
| Next.js Experiments | 50+ | ~3MB | **DELETE** - Outdated experiments |
| AI Prompts | 20+ | ~0.5MB | **KEEP** - Reusable patterns |
| Testing Reports | 30+ | ~2MB | **KEEP** - Quality records |

### 4.3 Critical Files to Restore

**None identified** - The archive consolidation on 2026-01-20 already preserved all critical documentation. No files need to be restored to the active codebase.

### 4.4 Recommended Archive Cleanup

**DELETE immediately:**
- `payment-service-cleanup-2026-01-20/` (cleanup artifacts)
- `nextjs-app/` (outdated experiments)

**ARCHIVE to external storage:**
- `docs-archive-2026-01-20/` (can move to cold storage)

**KEEP in repository:**
- `implementation-reports/`
- `testing-reports/`
- `prompts/`

---

## 5. Gap Analysis

### 5.1 Current vs. Target Architecture

| Component | Current State | Target State | Gap |
|-----------|---------------|---------------|-----|
| **Monorepo Structure** | Fragmented services | Organized by domain | Medium |
| **Shared Package** | Multiple Prisma versions | Single shared package | High |
| **API Gateway** | Single service | Centralized with auth | Low |
| **Documentation** | Scattered | Centralized docs | Medium |
| **Testing** | Inconsistent | Unified test framework | Medium |
| **CI/CD** | Basic scripts | Complete pipeline | High |

### 5.2 Missing Directories in Target Structure

| Missing Directory | Purpose | Priority |
|-------------------|---------|----------|
| `packages/shared/` | Common utilities, types | High |
| `infrastructure/` | Terraform, Kubernetes configs | High |
| `tools/` | Development scripts, CLI | Medium |
| `docs/api/` | API documentation | Medium |
| `docs/architecture/` | System design docs | Medium |

### 5.3 Orphan Files (No Clear Purpose)

| File | Location | Recommendation |
|------|----------|----------------|
| `compile-contracts.js` | Root | Investigate purpose |
| `compile.js` | Root | Move to scripts/ |
| `gitleaks-report.json` | Root | Delete (generated) |
| `replit.nix` | Root | Delete (not used) |
| `chatgpt.txt` | Root | Archive or delete |
| `-p/` | Root | Rename or delete |

### 5.4 Files Not in Target Categories

| File | Category | Notes |
|------|----------|-------|
| `ARCHIVE_CONSOLIDATION_REPORT.md` | Documentation | Keep - useful history |
| `CLEANUP_ARCHIVE_PLAN.md` | Documentation | Keep - reference |
| `NEW_FOLDER_ANALYSIS_REPORT.md` | Documentation | Keep - shows cleanup process |
| `EXTERNAL_FOLDER_CLEANUP_SUMMARY.md` | Documentation | Keep - shows cleanup process |

---

## 6. Security & Licensing Assessment

### 6.1 Security-Sensitive Files

| File | Sensitivity | Notes |
|------|-------------|-------|
| `.env` files | **HIGH** | Never commit - should be in .gitignore |
| `docker-compose*.yml` | Medium | Contains service configs |
| `package.json` | Low | Dependencies only |

### 6.2 Licensing Concerns

**No licensing concerns identified.** All identified files appear to be original work or use standard open-source licenses (MIT, Apache 2.0).

### 6.3 GitHub Security

- `gitleaks-report.json` exists - indicates security scanning performed
- No exposed secrets detected in the examined files
- `.github/` contains workflows - review for sensitive data

---

## 7. Dependency Graph (Mermaid)

```mermaid
graph TD
    subgraph Frontend
        FW[web-app] --> RQ[react-query]
        FW --> RR[react-router]
        FW --> AX[axios]
        FW --> SM[socket.io-client]
    end

    subgraph Mobile
        MB[mobile-app] --> RN[react-native]
        MB --> FF[@react-native-firebase]
        MB --> RNV[react-navigation]
    end

    subgraph API Gateway
        GW[api-gateway] --> FW
        GW --> MB
        GW --> SV[Backend Services]
    end

    subgraph Backend Services Core
        US[user-service] --> PR[Prisma]
        AS[auth-service] --> PR
        PS[payment-service] --> ST[Stripe]
    end

    subgraph Shared
        SH[shared/prisma] --> PR
    end

    FW -.-> GW
    MB -.-> GW
    SV --> PR
```

---

## 8. Risk Assessment for Restructuring

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Service Downtime** | High | Medium | Blue-green deployment |
| **Breaking Changes** | High | Medium | Versioned APIs |
| **Data Migration** | High | Low | Backup before migration |
| **Version Conflicts** | Medium | High | Incremental updates |
| **Test Coverage** | Medium | Medium | Automated regression |
| **Documentation Loss** | Low | Low | Version-controlled docs |

---

## 9. Recommended Order of Operations

### Phase 1: Preparation (Week 1)
1. [ ] Create `packages/shared/` directory with common types
2. [ ] Standardize Prisma version to ^5.22.0 across all services
3. [ ] Consolidate duplicate services (listing-service, orders-service)
4. [ ] Archive cleanup artifacts (payment-service-cleanup)

### Phase 2: Infrastructure (Week 2)
1. [ ] Create `infrastructure/` directory with K8s configs
2. [ ] Set up `tools/` directory for CLI utilities
3. [ ] Centralize API documentation in `docs/api/`
4. [ ] Move orphan files to appropriate locations

### Phase 3: Documentation (Week 3)
1. [ ] Consolidate scattered documentation
2. [ ] Archive outdated experiments (nextjs-app)
3. [ ] Create unified architecture documentation
4. [ ] Document dependency standards

### Phase 4: Quality (Week 4)
1. [ ] Enforce dependency versions via root package.json
2. [ ] Set up automated dependency updates
3. [ ] Create migration scripts for services
4. [ ] Validate all services after consolidation

---

## 10. Summary Statistics

| Metric | Value |
|--------|-------|
| **Total Files** | 1,500+ |
| **Backend Services** | 75+ |
| **Archived Files** | 400+ |
| **Root-level Files** | 180+ |
| **Configuration Files** | 50+ |
| **Documentation Files** | 200+ |
| **Version Conflicts** | 2 (Prisma) |
| **Duplicate Services** | 4 |
| **Security Issues** | 0 (clear) |
| **Estimated Cleanup Savings** | ~20MB |

---

## 11. Conclusion

The Mnbara Platform codebase is well-structured with clear separation of concerns across frontend, backend, and mobile applications. Key findings:

1. **Good**: Active development is evident with comprehensive documentation
2. **Issue**: Version inconsistencies in Prisma across services
3. **Issue**: Duplicate services that should be consolidated
4. **Opportunity**: Create shared packages to reduce duplication
5. **Action**: Follow recommended order of operations for safe restructuring

The archive is well-organized with consolidation completed on 2026-01-20. No critical files need to be restored.

---

**Report Generated**: February 6, 2026  
**Analyst**: Phase 1 Analysis Team  
**Status**: ✅ Analysis Complete
