# Custodii × Mnbarh Platform - AI Execution Prompts

## Overview

This document contains AI-ready execution prompts for implementing the Custodii Decision Authority API integration into the Mnbarh Platform. Each prompt is designed to be copy-pasted directly into an AI coding assistant (like Cursor, GitHub Copilot, or Claude) to guide implementation.

---

## 🎯 Phase 1: Foundation & Core Service

### Prompt 1.1: Create Decision Authority Service Skeleton

```
I need to create a new microservice called "decision-authority-service" in the Mnbarh Platform.

Context:
- Location: backend/services/decision-authority-service/
- Tech stack: Node.js 22.20.0, TypeScript, Express, Prisma, PostgreSQL
- Purpose: Manage external decision authority integration for asset disposition

Tasks:
1. Create service directory structure
2. Initialize package.json with these dependencies:
   - express, cors, helmet, dotenv, axios, jsonwebtoken, joi, uuid, node-cron
   - @prisma/client, prisma
   - TypeScript and testing dependencies
3. Create tsconfig.json with strict mode
4. Create .env.example with:
   - DECISION_AUTHORITY_MODE (INTERNAL|EXTERNAL)
   - CUSTODII_API_URL, CUSTODII_API_KEY, CUSTODII_WEBHOOK_SECRET
   - DECISION_TIMEOUT_MS, DECISION_POLL_INTERVAL_MS
   - DATABASE_URL, JWT_SECRET, PORT
5. Create src/index.ts with Express server, health check endpoint, graceful shutdown
6. Create basic folder structure: src/{config,interfaces,sources,services,controllers,routes,middleware,utils}

Requirements:
- Follow existing Mnbarh service patterns (see backend/services/auction-service/ for reference)
- Use Node.js 22.20.0 (same as other services)
- Include comprehensive error handling
- Add structured logging

Generate all files with complete implementations.
```

### Prompt 1.2: Create Database Schema

```
I need to create the Prisma database schema for the decision authority service.

Context:
- File: backend/services/decision-authority-service/prisma/schema.prisma
- Database: PostgreSQL
- Purpose: Store decision records, audit logs, and webhook events

Requirements:
Create schema with these models:

1. AssetDecisionRecord (main table, append-only):
   - id (UUID, primary key)
   - assetType (enum: LISTING, AUCTION, ESCROW_RELEASE)
   - assetId (string)
   - status (enum: PENDING, APPROVED, REJECTED, EXPIRED, CANCELLED)
   - source (enum: INTERNAL, EXTERNAL, OVERRIDE)
   - authority (string) - 'MNBARH_INTERNAL' | 'CUSTODII' | admin email
   - decisionRef (string, nullable) - External reference ID
   - reason (text, nullable)
   - metadata (JSON, default {})
   - requestedAt, decidedAt, expiresAt (timestamps)
   - createdAt, updatedAt (auto timestamps)
   - Indexes: [assetType, assetId], [status], [source], [decisionRef]

2. DecisionAuditLog (immutable audit trail):
   - id (UUID, primary key)
   - decisionId (UUID, foreign key to AssetDecisionRecord)
   - eventType (string) - 'CREATED', 'STATUS_CHANGED', 'OVERRIDDEN'
   - actor (string) - User/system that triggered event
   - oldStatus, newStatus (string, nullable)
   - reason (text, nullable)
   - metadata (JSON, default {})
   - createdAt (timestamp)
   - Indexes: [decisionId], [eventType]

3. DecisionWebhookEvent (webhook queue):
   - id (UUID, primary key)
   - decisionRef (string)
   - eventType (string)
   - payload (JSON)
   - processed (boolean, default false)
   - processedAt (timestamp, nullable)
   - error (text, nullable)
   - createdAt (timestamp)
   - Indexes: [decisionRef], [processed]

Generate complete Prisma schema with proper relations and constraints.
```

### Prompt 1.3: Implement IDecisionSource Interface

```
I need to create the decision source abstraction layer.

Context:
- File: backend/services/decision-authority-service/src/interfaces/IDecisionSource.ts
- Purpose: Abstract interface for pluggable decision sources (Internal, Custodii, Mock)

Requirements:
Create TypeScript interface with:

1. Enums:
   - DecisionStatus: PENDING, APPROVED, REJECTED, EXPIRED, CANCELLED
   - AssetType: LISTING, AUCTION, ESCROW_RELEASE

2. Interfaces:
   - DecisionRequest: { assetType, assetId, metadata }
   - DecisionResponse: { decisionId, status, decisionRef?, reason?, decidedAt?, expiresAt? }

3. IDecisionSource interface with methods:
   - requestDecision(request: DecisionRequest): Promise<DecisionResponse>
   - getDecision(decisionId: string): Promise<DecisionResponse>
   - pollDecision(decisionId: string): Promise<DecisionResponse>
   - cancelDecision(decisionId: string): Promise<void>
   - getSourceName(): string

Include comprehensive JSDoc comments explaining each method's purpose and behavior.
```

### Prompt 1.4: Implement InternalDecisionSource

```
I need to implement the internal decision source that maintains current platform behavior.

Context:
- File: backend/services/decision-authority-service/src/sources/InternalDecisionSource.ts
- Purpose: Auto-approve all decisions immediately (current Mnbarh behavior)
- Implements: IDecisionSource interface

Requirements:
1. Implement all IDecisionSource methods
2. requestDecision() should:
   - Generate UUID for decisionId
   - Return APPROVED status immediately
   - Set decidedAt to current timestamp
   - Set reason to "Auto-approved by internal rules"
3. getDecision() should return APPROVED status
4. pollDecision() should call getDecision() (no polling needed)
5. cancelDecision() should be no-op (log only)
6. getSourceName() should return "INTERNAL"

Include:
- Comprehensive logging using winston or similar
- Error handling
- Unit tests in __tests__/InternalDecisionSource.test.ts

Generate complete implementation with tests.
```

### Prompt 1.5: Implement MockDecisionSource

```
I need to implement a mock decision source for testing.

Context:
- File: backend/services/decision-authority-service/src/sources/MockDecisionSource.ts
- Purpose: Simulate external API behavior for testing
- Implements: IDecisionSource interface

Requirements:
1. Constructor accepts MockDecisionConfig:
   - initialStatus (default: PENDING)
   - delayMs (default: 1000)
   - finalStatus (default: APPROVED)
   - reason (default: "Mock decision")

2. Implement all IDecisionSource methods:
   - requestDecision(): Return initialStatus, simulate async status change after delayMs
   - getDecision(): Return current status from in-memory map
   - pollDecision(): Same as getDecision()
   - cancelDecision(): Update status to CANCELLED
   - getSourceName(): Return "MOCK"

3. Use in-memory Map to store decisions
4. Simulate realistic timing with setTimeout

Include:
- Configurable behavior for different test scenarios
- Unit tests covering all status transitions
- Tests for timeout scenarios

Generate complete implementation with comprehensive tests.
```

---

## 🎯 Phase 2: Core Service Logic

### Prompt 2.1: Implement DecisionAuthorityService

```
I need to implement the core business logic service.

Context:
- File: backend/services/decision-authority-service/src/services/DecisionAuthorityService.ts
- Purpose: Orchestrate decision lifecycle, route to appropriate source, manage database
- Dependencies: Prisma client, IDecisionSource, AuditLogService

Requirements:
Implement service class with methods:

1. requestDecision(request: DecisionRequest, userId: string): Promise<AssetDecisionRecord>
   - Get decision source from factory based on DECISION_AUTHORITY_MODE
   - Call source.requestDecision()
   - Save to database (AssetDecisionRecord)
   - Log audit event (CREATED)
   - Return decision record

2. getDecision(decisionId: string): Promise<AssetDecisionRecord>
   - Fetch from database
   - If PENDING and EXTERNAL mode, poll source for updates
   - Update database if status changed
   - Return decision record

3. listDecisions(filters: DecisionFilters): Promise<AssetDecisionRecord[]>
   - Support filters: assetType, status, source, dateRange
   - Paginate results
   - Return decisions with audit logs

4. overrideDecision(decisionId: string, newStatus: DecisionStatus, reason: string, adminId: string): Promise<AssetDecisionRecord>
   - Validate admin permissions
   - Update decision status
   - Set source to OVERRIDE
   - Log audit event (OVERRIDDEN)
   - Return updated decision

5. handleExpiredDecisions(): Promise<void>
   - Find decisions where expiresAt < now and status = PENDING
   - Update status to EXPIRED
   - Log audit events

Include:
- Transaction support for database operations
- Comprehensive error handling
- Logging for all operations
- Unit tests with mocked dependencies

Generate complete implementation with tests achieving 90%+ coverage.
```

### Prompt 2.2: Implement REST API Controllers

```
I need to implement the REST API controllers for decision management.

Context:
- File: backend/services/decision-authority-service/src/controllers/DecisionController.ts
- Purpose: Expose HTTP endpoints for decision operations
- Dependencies: DecisionAuthorityService, Express

Requirements:
Implement controller with endpoints:

1. POST /api/v1/decisions/request
   - Body: { assetType, assetId, metadata }
   - Auth: Required (JWT)
   - Response: DecisionResponse
   - Validation: Joi schema

2. GET /api/v1/decisions/:id
   - Params: decisionId
   - Auth: Required
   - Response: AssetDecisionRecord with audit logs

3. GET /api/v1/decisions/asset/:assetId
   - Params: assetId
   - Query: assetType (required)
   - Auth: Required
   - Response: AssetDecisionRecord[]

4. GET /api/v1/decisions
   - Query: status, source, assetType, page, limit
   - Auth: Required
   - Response: Paginated list

5. PATCH /api/v1/decisions/:id/override
   - Params: decisionId
   - Body: { status, reason }
   - Auth: Required (admin only)
   - Response: Updated AssetDecisionRecord

Include:
- Request validation middleware (Joi)
- Authentication middleware (JWT)
- Authorization middleware (admin check for override)
- Error handling middleware
- Rate limiting
- Integration tests for all endpoints

Generate complete implementation with tests.
```

### Prompt 2.3: Implement Webhook Handler

```
I need to implement the webhook handler for external decision updates.

Context:
- File: backend/services/decision-authority-service/src/controllers/WebhookController.ts
- Purpose: Receive and process webhook events from Custodii API
- Security: HMAC signature validation

Requirements:
1. POST /api/v1/webhook/decisions endpoint:
   - Validate HMAC-SHA256 signature using CUSTODII_WEBHOOK_SECRET
   - Parse webhook payload
   - Save to DecisionWebhookEvent table
   - Process event asynchronously
   - Return 200 OK immediately

2. Webhook processing:
   - Find decision by decisionRef
   - Update status if changed
   - Log audit event
   - Mark webhook as processed

3. Retry logic:
   - Retry failed webhooks (3 attempts with exponential backoff)
   - Log errors
   - Alert on repeated failures

Include:
- HMAC signature validation function
- Webhook event processor
- Error handling and logging
- Unit tests with mock signatures
- Integration tests

Generate complete implementation with security best practices.
```

---

## 🎯 Phase 3: External Integration

### Prompt 3.1: Implement CustodiiDecisionSource

```
I need to implement the Custodii API integration.

Context:
- File: backend/services/decision-authority-service/src/sources/CustodiiDecisionSource.ts
- Purpose: Call external Custodii API for decision requests
- Implements: IDecisionSource interface

Requirements:
1. Use axios HTTP client with:
   - Base URL from CUSTODII_API_URL
   - Bearer token authentication (CUSTODII_API_KEY)
   - Timeout from DECISION_TIMEOUT_MS
   - Request/response interceptors for logging

2. Implement IDecisionSource methods:
   - requestDecision(): POST /decisions with { asset_type, asset_id, metadata }
   - getDecision(): GET /decisions/:id
   - pollDecision(): Same as getDecision()
   - cancelDecision(): POST /decisions/:id/cancel
   - getSourceName(): Return "CUSTODII"

3. Response mapping:
   - Map Custodii response format to DecisionResponse
   - Handle status mapping (pending→PENDING, approved→APPROVED, etc.)
   - Parse timestamps

4. Error handling:
   - Network errors
   - Timeout errors
   - API errors (4xx, 5xx)
   - Retry logic (3 attempts with exponential backoff)

Include:
- Comprehensive logging
- Circuit breaker pattern
- Unit tests with mocked HTTP client
- Integration tests with mock server

Generate complete implementation with robust error handling.
```

### Prompt 3.2: Implement Decision Polling Service

```
I need to implement the polling mechanism for PENDING decisions.

Context:
- File: backend/services/decision-authority-service/src/services/DecisionPollingService.ts
- Purpose: Poll external API for PENDING decision status updates
- Uses: CustodiiDecisionSource, DecisionAuthorityService

Requirements:
1. Start polling when decision is created with PENDING status
2. Poll interval: DECISION_POLL_INTERVAL_MS (default 5s)
3. Max poll duration: DECISION_TIMEOUT_MS (default 30s)
4. Stop polling when:
   - Status changes to APPROVED/REJECTED/EXPIRED
   - Timeout reached
   - Error occurs

5. On status change:
   - Update database
   - Log audit event
   - Emit event for real-time updates

6. On timeout:
   - Update status to EXPIRED
   - Log audit event
   - Alert operations team

Include:
- In-memory tracking of active polls
- Graceful shutdown (stop all polls)
- Error handling and retry logic
- Unit tests with mocked time
- Integration tests

Generate complete implementation with proper resource cleanup.
```

---

## 🎯 Phase 4: Service Integration

### Prompt 4.1: Integrate with Listing Service

```
I need to integrate decision authority into the listing service.

Context:
- Service: backend/services/listing-service/
- Purpose: Request decision before making listing public
- Integration point: Listing creation workflow

Requirements:
1. Add decision-authority-service client:
   - File: src/clients/DecisionAuthorityClient.ts
   - Methods: requestDecision(), getDecision(), pollDecision()

2. Modify listing creation:
   - File: src/services/listing.service.ts
   - After validation, before making listing public:
     * Request decision from authority
     * If INTERNAL mode: Continue immediately (APPROVED)
     * If EXTERNAL mode: Wait for decision or timeout
     * Store decisionId in listing record

3. Add disposition_status field:
   - Prisma schema: Add dispositionStatus enum field
   - Values: PENDING, APPROVED, REJECTED
   - Migration: Add column with default APPROVED for existing listings

4. Update listing queries:
   - Filter public listings by dispositionStatus = APPROVED
   - Admin can see all statuses

5. Add webhook handler:
   - Endpoint: POST /api/v1/listings/decision-webhook
   - Update listing status when decision changes

Include:
- Backward compatibility (existing listings work unchanged)
- Error handling (fallback to INTERNAL mode on failure)
- Integration tests
- API documentation updates

Generate complete integration with minimal changes to existing code.
```

### Prompt 4.2: Integrate with Auction Service

```
I need to integrate decision authority into the auction service.

Context:
- Service: backend/services/auction-service/
- Purpose: Require APPROVED decision before auction starts
- Integration point: Auction start workflow

Requirements:
1. Add decision-authority-service client (same as listing service)

2. Modify auction start:
   - File: src/services/auction.service.ts
   - Before starting auction:
     * Check if decision exists and is APPROVED
     * If not, request decision
     * Block auction start until APPROVED or timeout
     * Store decisionId in auction record

3. Add disposition_status field to Auction model

4. Update auction queries:
   - Only show APPROVED auctions to public
   - Block bidding on non-APPROVED auctions

5. Add webhook handler for decision updates

Include:
- Real-time updates via WebSocket when decision changes
- Error handling
- Integration tests
- API documentation

Generate complete integration maintaining existing auction functionality.
```

---

## 🎯 Phase 5: Frontend Integration

### Prompt 5.1: Create Frontend Decision Types and API Client

```
I need to create TypeScript types and API client for decisions in the frontend.

Context:
- Location: frontend/web-app/src/
- Purpose: Type-safe decision status handling in React components

Requirements:
1. Create types file:
   - File: src/types/decision.types.ts
   - Export: DecisionStatus, AssetType, DecisionResponse, AssetDecisionRecord

2. Create API client:
   - File: src/services/decisionService.ts
   - Methods:
     * requestDecision(assetType, assetId, metadata)
     * getDecision(decisionId)
     * getDecisionsByAsset(assetType, assetId)
     * overrideDecision(decisionId, status, reason) - admin only

3. Create React hook:
   - File: src/hooks/useDecisionStatus.ts
   - Hook: useDecisionStatus(assetType, assetId)
   - Returns: { status, loading, error, refetch }
   - Auto-polls for PENDING decisions
   - Real-time updates via WebSocket

Include:
- Axios interceptors for auth
- Error handling
- Loading states
- TypeScript strict mode

Generate complete implementation with proper typing.
```

### Prompt 5.2: Add Disposition Status UI Components

```
I need to create UI components for displaying decision status.

Context:
- Location: frontend/web-app/src/components/
- Purpose: Show disposition status badges and filters

Requirements:
1. Create DispositionStatusBadge component:
   - File: src/components/common/DispositionStatusBadge.tsx
   - Props: { status: DecisionStatus, size?: 'sm' | 'md' | 'lg' }
   - Display:
     * PENDING: Yellow badge with "Pending Review"
     * APPROVED: Green badge with "Approved"
     * REJECTED: Red badge with "Rejected"
     * EXPIRED: Gray badge with "Expired"
   - Include icon and tooltip with explanation

2. Create DispositionStatusFilter component:
   - File: src/components/common/DispositionStatusFilter.tsx
   - Props: { value: DecisionStatus[], onChange: (statuses) => void }
   - Multi-select dropdown for filtering by status

3. Update listing card component:
   - File: src/components/product/ProductCard.tsx
   - Add DispositionStatusBadge if status !== APPROVED
   - Show "Under Review" message for PENDING

4. Update listing detail page:
   - File: src/pages/ProductPage.tsx
   - Show prominent status badge
   - Display decision reason if REJECTED
   - Show estimated review time for PENDING

Include:
- Responsive design
- Accessibility (ARIA labels)
- i18n support (English/Arabic)
- Component tests

Generate complete UI components with Tailwind CSS styling.
```

---

## 🎯 Phase 6: Testing & Deployment

### Prompt 6.1: Create Comprehensive Test Suite

```
I need to create a comprehensive test suite for the decision authority service.

Context:
- Location: backend/services/decision-authority-service/tests/
- Purpose: Achieve 90%+ test coverage

Requirements:
1. Unit tests:
   - All decision sources (Internal, Mock, Custodii)
   - DecisionAuthorityService
   - Controllers
   - Utility functions

2. Integration tests:
   - INTERNAL mode end-to-end
   - EXTERNAL mode with MockDecisionSource
   - Webhook processing
   - Admin override workflow
   - Mode switching

3. Load tests:
   - 100 concurrent decision requests
   - 1000 concurrent decision requests
   - Polling under load
   - Webhook processing under load

4. Security tests:
   - Webhook signature validation
   - API authentication
   - Admin authorization
   - SQL injection prevention

Test framework: Jest
Coverage target: 90%+

Include:
- Test fixtures and factories
- Mock data generators
- Test utilities
- CI/CD integration

Generate complete test suite with proper organization.
```

### Prompt 6.2: Create Deployment Configuration

```
I need to create deployment configuration for the decision authority service.

Context:
- Platform: Docker + Render.com
- Purpose: Deploy service to staging and production

Requirements:
1. Create Dockerfile:
   - File: backend/services/decision-authority-service/Dockerfile
   - Multi-stage build (build + production)
   - Node.js 22.20.0 base image
   - Health check endpoint

2. Update docker-compose.yml:
   - Add decision-authority-service
   - Configure networking
   - Environment variables
   - Database connection

3. Update render.yaml:
   - Add decision-authority-service
   - Configure environment: staging, production
   - Set DECISION_AUTHORITY_MODE=INTERNAL initially
   - Configure secrets (API keys)

4. Create migration scripts:
   - File: scripts/migrate-decision-authority.sh
   - Run Prisma migrations
   - Seed initial data if needed

5. Create deployment runbook:
   - File: .kiro/specs/custodii-decision-authority/DEPLOYMENT_RUNBOOK.md
   - Pre-deployment checklist
   - Deployment steps
   - Rollback procedure
   - Smoke tests

Include:
- Environment-specific configurations
- Health checks
- Monitoring setup
- Alerting rules

Generate complete deployment configuration.
```

---

## 🎯 Quick Reference Prompts

### Quick Prompt: Debug Decision Not Updating

```
I have a decision stuck in PENDING status that's not updating.

Debug steps:
1. Check decision record in database:
   SELECT * FROM asset_decision_records WHERE id = '<decisionId>';

2. Check audit logs:
   SELECT * FROM decision_audit_log WHERE decision_id = '<decisionId>' ORDER BY created_at DESC;

3. Check webhook events:
   SELECT * FROM decision_webhook_events WHERE decision_ref = '<decisionRef>' AND processed = false;

4. Check polling service logs:
   grep "decisionId:<decisionId>" /var/log/decision-authority-service.log

5. Manually trigger poll:
   curl -X POST http://localhost:3010/api/v1/decisions/<decisionId>/poll \
     -H "Authorization: Bearer <token>"

6. Check external API status:
   curl -X GET https://api.custodii.com/decisions/<decisionRef> \
     -H "Authorization: Bearer <apiKey>"

Provide diagnostic output and suggest fixes.
```

### Quick Prompt: Switch to EXTERNAL Mode

```
I need to switch the platform from INTERNAL to EXTERNAL decision authority mode.

Steps:
1. Verify Custodii API credentials are configured
2. Test Custodii API connectivity
3. Update environment variable: DECISION_AUTHORITY_MODE=EXTERNAL
4. Restart decision-authority-service (hot reload should work)
5. Verify mode switch in health check: GET /health
6. Monitor logs for any errors
7. Test with a single listing creation
8. Gradually roll out to more traffic

Provide step-by-step commands and verification checks.
```

### Quick Prompt: Add New Decision Source

```
I need to add a new decision source called "RegulatoryAuthority".

Steps:
1. Create src/sources/RegulatoryAuthorityDecisionSource.ts implementing IDecisionSource
2. Add configuration in src/config/config.ts:
   - REGULATORY_AUTHORITY_API_URL
   - REGULATORY_AUTHORITY_API_KEY
3. Update DecisionSourceFactory to include new source
4. Add to DecisionAuthorityMode enum: REGULATORY_AUTHORITY
5. Write unit tests
6. Update documentation

Generate complete implementation following the pattern of CustodiiDecisionSource.
```

---

## 📚 Additional Resources

### Documentation References
- Main spec: `.kiro/specs/custodii-decision-authority/README.md`
- Requirements: `.kiro/specs/custodii-decision-authority/requirements.md`
- Tasks: `.kiro/specs/custodii-decision-authority/tasks.md`
- Code examples: `.kiro/specs/custodii-decision-authority/CODE_IMPLEMENTATION.md`

### Existing Service Patterns
- Reference service: `backend/services/auction-service/`
- Database patterns: `backend/services/auction-service/prisma/schema.prisma`
- API patterns: `backend/services/auction-service/src/controllers/`
- Test patterns: `backend/services/auction-service/src/services/__tests__/`

### Key Principles
1. **Non-Breaking**: Existing services must work unchanged
2. **Pluggable**: Decision sources are swappable
3. **Auditable**: All decisions logged with full provenance
4. **Resilient**: Graceful degradation on failures
5. **Testable**: 90%+ test coverage required

---

## 🎯 Usage Instructions

### For AI Coding Assistants

1. **Copy the relevant prompt** for your current task
2. **Provide context** from existing codebase if needed
3. **Review generated code** for correctness and style consistency
4. **Run tests** to verify implementation
5. **Iterate** if needed with follow-up prompts

### For Human Developers

1. **Read the prompt** to understand requirements
2. **Use as a checklist** for implementation
3. **Reference code examples** in CODE_IMPLEMENTATION.md
4. **Follow task order** in tasks.md
5. **Update documentation** as you progress

---

**Document Version**: 1.0  
**Last Updated**: January 20, 2026  
**Status**: Ready for AI-Assisted Implementation
