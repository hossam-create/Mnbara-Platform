# Requirements: Platform Restructure - Phase 2
## Create New Monorepo Structure

**Feature Name:** platform-restructure-phase2  
**Created:** March 2, 2026  
**Status:** Draft  
**Priority:** Critical

---

**⚠️ CRITICAL: DO NOT CREATE NEW APPS OR SERVICES. INTEGRATE EXISTING CODE ONLY.**

---

## 1. Overview

### 1.1 Purpose
Transform the Mnbara Platform from a fragmented multi-location codebase into a unified, well-organized monorepo structure using Nx. This phase focuses on integrating and organizing existing code, NOT creating new applications or services.

### 1.2 Background
Phase 1 analysis revealed:
- 6 separate frontend applications
- 3 separate mobile applications
- 3 different backend locations
- 70+ archived services
- 50+ duplicate dependencies
- ~5GB project size

### 1.3 Goals
- Create a clean, organized monorepo structure
- Set up 5 shared packages (@mnbara/*)
- Prepare application scaffolds (web, mobile)
- Organize services into logical categories
- Establish unified configuration and tooling

---

## 2. User Stories

### 2.1 As a Developer
**I want** a clear, organized project structure  
**So that** I can easily navigate and understand the codebase

**Acceptance Criteria:**
- All applications are in `apps/` directory
- All services are categorized in `services/` subdirectories
- All shared code is in `packages/` directory
- Directory structure matches the implementation plan

### 2.2 As a Developer
**I want** shared packages for common functionality  
**So that** I can reuse code across applications and services

**Acceptance Criteria:**
- @mnbara/types package exists with TypeScript type definitions
- @mnbara/ui-components package exists with React components
- @mnbara/utils package exists with utility functions
- @mnbara/api-client package exists with API client code
- @mnbara/validation package exists with validation schemas
- All packages are properly configured and importable

### 2.3 As a Developer
**I want** a monorepo tool (Nx) configured  
**So that** I can build, test, and run multiple projects efficiently

**Acceptance Criteria:**
- Nx workspace is initialized
- nx.json is properly configured
- Build caching is enabled
- Task dependencies are configured
- Workspace can run multiple projects in parallel

### 2.4 As a DevOps Engineer
**I want** unified configuration files  
**So that** all projects follow the same standards

**Acceptance Criteria:**
- Root tsconfig.json with path mappings
- Root package.json with workspace configuration
- Shared ESLint configuration
- Shared Prettier configuration
- Shared Jest/Vitest configuration

### 2.5 As a Project Manager
**I want** clear documentation of the new structure  
**So that** the team understands how to work with the monorepo

**Acceptance Criteria:**
- README.md explains the structure
- CONTRIBUTING.md explains development workflow
- Each major directory has its own README
- Migration guide is available

---

## 3. Functional Requirements

### 3.1 Monorepo Setup
**FR-3.1.1:** Initialize Nx workspace with empty preset  
**FR-3.1.2:** Configure workspace to use npm as package manager  
**FR-3.1.3:** Set up Nx caching and computation caching  
**FR-3.1.4:** Configure task pipeline (build → test → lint)

### 3.2 Directory Structure
**FR-3.2.1:** Create `apps/` directory for applications  
**FR-3.2.2:** Create `apps/web/` for unified web application  
**FR-3.2.3:** Create `apps/mobile/` for mobile application  
**FR-3.2.4:** Create `services/` directory with subdirectories:
- `services/core/` - Core services (auth, user, notification)
- `services/marketplace/` - E-commerce services (product, order, cart)
- `services/crowdshipping/` - Delivery services (trips, matching)
- `services/financial/` - Financial services (payment, wallet, escrow, settlement)

**FR-3.2.5:** Create `packages/` directory for shared code  
**FR-3.2.6:** Create `infrastructure/` directory (preserve existing)  
**FR-3.2.7:** Create `docs/` directory (preserve existing)  
**FR-3.2.8:** Create `archive/` directory (preserve existing)

### 3.3 Shared Packages
**FR-3.3.1:** Create @mnbara/types package with:
- user.types.ts
- order.types.ts
- payment.types.ts
- delivery.types.ts
- common.types.ts

**FR-3.3.2:** Create @mnbara/ui-components package with:
- Button component
- Input component
- Card component
- Modal component
- Badge component
- Spinner component

**FR-3.3.3:** Create @mnbara/utils package with:
- currency utilities
- date utilities
- validation utilities
- helper functions

**FR-3.3.4:** Create @mnbara/api-client package with:
- Base API client
- Endpoint definitions
- Request/response interceptors

**FR-3.3.5:** Create @mnbara/validation package with:
- Zod schemas for user data
- Zod schemas for order data
- Zod schemas for payment data

### 3.4 Application Integration
**FR-3.4.1:** Integrate existing Next.js 15 web application into apps/web/  
**FR-3.4.2:** Integrate existing Flutter 3.x mobile application into apps/mobile/  
**FR-3.4.3:** Configure both applications to use shared packages  
**FR-3.4.4:** Preserve existing routing structure  
**FR-3.4.5:** Preserve existing environment configuration

### 3.5 Service Integration
**FR-3.5.1:** Integrate existing core services (NestJS):
- auth-service (from backend/services/auth-service)
- user-service (from backend/services/user-service)
- notification-service (from backend/services/notification-service)

**FR-3.5.2:** Integrate existing marketplace services:
- product-service
- order-service
- cart-service

**FR-3.5.3:** Integrate existing crowdshipping services:
- trips-service
- matching-service

**FR-3.5.4:** Integrate existing financial services:
- payment-service
- wallet-service
- escrow-service
- settlement-service

**FR-3.5.5:** Each service must have:
- src/ directory with basic structure
- package.json with dependencies
- tsconfig.json
- Dockerfile
- README.md

### 3.6 Configuration Files
**FR-3.6.1:** Create root package.json with:
- Workspace configuration
- Shared dependencies
- Common scripts (dev, build, test, lint)

**FR-3.6.2:** Create root tsconfig.json with:
- Path mappings for @mnbara/* packages
- Strict TypeScript configuration
- ES2022 target

**FR-3.6.3:** Create .eslintrc.json with:
- TypeScript rules
- React rules
- Import rules

**FR-3.6.4:** Create .prettierrc with:
- Consistent formatting rules

**FR-3.6.5:** Create jest.config.js or vitest.config.ts with:
- Shared test configuration

### 3.7 Documentation
**FR-3.7.1:** Create root README.md explaining:
- Project structure
- Getting started
- Available commands
- Development workflow

**FR-3.7.2:** Create CONTRIBUTING.md with:
- Code standards
- Commit conventions
- PR process
- Testing requirements

**FR-3.7.3:** Create docs/architecture/NEW_STRUCTURE.md explaining:
- Monorepo architecture
- Package dependencies
- Service communication
- Deployment strategy

---

## 4. Non-Functional Requirements

### 4.1 Performance
**NFR-4.1.1:** Initial build time must be < 5 minutes  
**NFR-4.1.2:** Incremental builds must be < 1 minute  
**NFR-4.1.3:** Nx caching must reduce rebuild time by 70%

### 4.2 Maintainability
**NFR-4.2.1:** All code must follow TypeScript strict mode  
**NFR-4.2.2:** All packages must have clear interfaces  
**NFR-4.2.3:** All services must follow consistent structure

### 4.3 Scalability
**NFR-4.3.1:** Structure must support 50+ services  
**NFR-4.3.2:** Structure must support 10+ applications  
**NFR-4.3.3:** Monorepo must handle 100+ packages

### 4.4 Developer Experience
**NFR-4.4.1:** Setup time for new developers < 30 minutes  
**NFR-4.4.2:** Clear error messages for configuration issues  
**NFR-4.4.3:** IDE support (VS Code) with proper IntelliSense

---

## 5. Technical Constraints

### 5.1 Technology Stack
- **Monorepo Tool:** Nx (latest stable version)
- **Package Manager:** npm
- **Language:** TypeScript 5.7+
- **Node Version:** 20+
- **Frontend Framework:** Next.js 15
- **Mobile Framework:** Flutter 3.x
- **Backend Framework:** NestJS

### 5.2 Existing Infrastructure
- Must preserve existing `infrastructure/` directory
- Must preserve existing `docs/` directory
- Must preserve existing `archive/` directory
- Must not delete any archived services

### 5.3 Compatibility
- Must work on Windows, macOS, and Linux
- Must work with existing CI/CD pipelines
- Must be compatible with Docker
- Must be compatible with Kubernetes

---

## 6. Dependencies

### 6.1 External Dependencies
- Nx CLI installed globally
- Node.js 20+ installed
- npm 10+ installed
- Git installed

### 6.2 Internal Dependencies
- Phase 1 analysis complete ✅
- Backup of existing codebase created
- Team approval obtained

---

## 7. Success Criteria

### 7.1 Structure Created
- [ ] Nx workspace initialized
- [ ] All directories created as specified
- [ ] All shared packages created and buildable
- [ ] Application scaffolds created
- [ ] Service scaffolds created

### 7.2 Configuration Complete
- [ ] Root package.json configured
- [ ] Root tsconfig.json configured
- [ ] ESLint configured
- [ ] Prettier configured
- [ ] Test framework configured

### 7.3 Documentation Complete
- [ ] Root README.md created
- [ ] CONTRIBUTING.md created
- [ ] Architecture documentation created
- [ ] Each package has README.md

### 7.4 Validation
- [ ] `npm install` completes successfully
- [ ] `nx build @mnbara/types` succeeds
- [ ] `nx build @mnbara/ui-components` succeeds
- [ ] `nx build @mnbara/utils` succeeds
- [ ] `nx build @mnbara/api-client` succeeds
- [ ] `nx build @mnbara/validation` succeeds
- [ ] `nx run-many --target=build --all` succeeds
- [ ] No TypeScript errors
- [ ] No ESLint errors

---

## 8. Out of Scope

### 8.1 Not Included in Phase 2
- ❌ Migrating existing code from old structure
- ❌ Recovering archived services
- ❌ Implementing actual business logic
- ❌ Setting up databases
- ❌ Configuring CI/CD pipelines
- ❌ Writing tests for business logic
- ❌ Deploying to production

### 8.2 Deferred to Later Phases
- Phase 3: Code migration and service recovery
- Phase 4: Testing and optimization

---

## 9. Risks and Mitigations

### 9.1 Risk: Nx Learning Curve
**Mitigation:** Provide clear documentation and examples

### 9.2 Risk: Configuration Complexity
**Mitigation:** Start with minimal configuration, iterate

### 9.3 Risk: Team Resistance
**Mitigation:** Involve team in decisions, provide training

### 9.4 Risk: Time Overrun
**Mitigation:** Focus on essentials first, iterate later

---

## 10. Timeline

**Estimated Duration:** 2 weeks (10 working days)

### Week 1 (Days 1-5)
- Days 1-2: Nx setup and directory structure
- Days 3-4: Shared packages creation
- Day 5: Application scaffolds

### Week 2 (Days 6-10)
- Days 6-8: Service scaffolds
- Days 9-10: Configuration and documentation

---

## 11. Acceptance Testing

### 11.1 Manual Testing
1. Clone the new structure
2. Run `npm install`
3. Run `nx build @mnbara/types`
4. Run `nx build @mnbara/ui-components`
5. Run `nx run-many --target=build --all`
6. Verify no errors

### 11.2 Automated Testing
1. Run `nx run-many --target=lint --all`
2. Run `nx run-many --target=test --all`
3. Verify all checks pass

---

## 12. References

- [Phase 1 Analysis Report](.kiro/restructure/phase1-analysis-report.md)
- [Implementation Plan](.kiro/restructure/implementation-plan.md)
- [Executive Summary](.kiro/restructure/executive-summary-ar.md)
- [Nx Documentation](https://nx.dev)

---

**Document Version:** 1.0  
**Last Updated:** March 2, 2026  
**Status:** Ready for Review
