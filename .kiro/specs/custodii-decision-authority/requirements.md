# Custodii Decision Authority API Integration - Requirements

## 1. Overview

This specification defines the integration of Custodii's external Decision Authority API into the Mnbarh Platform. The integration enables external regulatory/compliance entities to make binding decisions on asset disposition (listings, auctions, escrow releases) while maintaining backward compatibility with internal decision-making.

## 2. Business Context

### 2.1 Current State
- Mnbarh Platform makes all asset disposition decisions internally
- Listing approval, auction validation, escrow release are controlled by internal services
- No external authority can override or control asset states

### 2.2 Target State
- Support DUAL-MODE operation: INTERNAL (current) | EXTERNAL (Custodii)
- External authority can make binding decisions on asset disposition
- Seamless transition between modes via feature flags
- Zero disruption to existing business logic during integration

### 2.3 Integration Goals
- **Non-Breaking**: Existing services continue to work without modification
- **Pluggable**: Decision authority can be swapped at runtime via configuration
- **Auditable**: All decisions (internal/external) are logged with full provenance
- **Testable**: Mock external authority for development/staging environments

## 3. User Stories

### 3.1 As a Platform Operator
**Story**: I want to enable external decision authority mode so that Custodii can control asset disposition
**Acceptance Criteria**:
- [ ] Can toggle DECISION_AUTHORITY_MODE between INTERNAL and EXTERNAL via environment variable
- [ ] Mode change takes effect without service restart (hot reload)
- [ ] All services respect the configured mode
- [ ] Audit logs clearly indicate which mode was active for each decision

### 3.2 As a Compliance Officer
**Story**: I want to see the decision source for every asset state change so I can verify regulatory compliance
**Acceptance Criteria**:
- [ ] Every asset state change records: decision_source (INTERNAL|EXTERNAL), decision_ref, authority, timestamp, reason
- [ ] Can query all decisions by source type
- [ ] Can trace any asset state back to its authorizing decision
- [ ] Decision records are immutable (append-only)

### 3.3 As a Developer
**Story**: I want to test external decision authority integration without connecting to real Custodii API
**Acceptance Criteria**:
- [ ] Mock DecisionSource implementation available for testing
- [ ] Can simulate PENDING, APPROVED, REJECTED decision states
- [ ] Can test decision state transitions
- [ ] Integration tests cover both INTERNAL and EXTERNAL modes

### 3.4 As a Seller
**Story**: I want to see the disposition status of my listing so I know if it's approved for sale
**Acceptance Criteria**:
- [ ] Listing detail page shows disposition_status: PENDING | APPROVED | REJECTED
- [ ] Status updates in real-time when decision changes
- [ ] Clear messaging explains what each status means
- [ ] Can filter my listings by disposition status

### 3.5 As a Buyer
**Story**: I want to see only approved listings so I don't waste time on items that can't be sold
**Acceptance Criteria**:
- [ ] Search results show only APPROVED listings by default
- [ ] Can optionally view PENDING listings (with clear warning)
- [ ] REJECTED listings are hidden from public view
- [ ] Product detail page shows disposition status badge

### 3.6 As an Admin
**Story**: I want to manually override external decisions in emergency situations
**Acceptance Criteria**:
- [ ] Admin panel shows all pending external decisions
- [ ] Can manually approve/reject with override reason
- [ ] Override is logged with admin identity and justification
- [ ] Override notifications sent to compliance team

## 4. Functional Requirements

### 4.1 Decision Authority API Contract

#### 4.1.1 Core Entities
```typescript
enum DecisionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

enum DecisionSource {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL',
  OVERRIDE = 'OVERRIDE'
}

interface AssetDecisionRecord {
  id: string;
  assetType: 'LISTING' | 'AUCTION' | 'ESCROW_RELEASE';
  assetId: string;
  status: DecisionStatus;
  source: DecisionSource;
  authority: string; // 'MNBARH_INTERNAL' | 'CUSTODII' | admin email
  decisionRef: string | null; // External reference ID
  reason: string | null;
  metadata: Record<string, any>;
  requestedAt: Date;
  decidedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 4.1.2 API Endpoints (Backend)
```
POST   /api/v1/decisions/request          - Request decision from authority
GET    /api/v1/decisions/:id              - Get decision by ID
GET    /api/v1/decisions/asset/:assetId   - Get decisions for asset
PATCH  /api/v1/decisions/:id/override     - Admin override (requires auth)
GET    /api/v1/decisions                  - List decisions (with filters)
POST   /api/v1/decisions/:id/webhook      - Webhook for external updates
```

### 4.2 Decision Source Abstraction

#### 4.2.1 Interface
```typescript
interface IDecisionSource {
  requestDecision(request: DecisionRequest): Promise<AssetDecisionRecord>;
  getDecision(decisionId: string): Promise<AssetDecisionRecord>;
  pollDecision(decisionId: string): Promise<AssetDecisionRecord>;
  cancelDecision(decisionId: string): Promise<void>;
}

interface DecisionRequest {
  assetType: 'LISTING' | 'AUCTION' | 'ESCROW_RELEASE';
  assetId: string;
  metadata: Record<string, any>;
}
```

#### 4.2.2 Implementations
- **InternalDecisionSource**: Auto-approves based on internal rules (current behavior)
- **CustodiiDecisionSource**: Calls external Custodii API
- **MockDecisionSource**: Simulates external API for testing

### 4.3 Service Integration Points

#### 4.3.1 Listing Service
- **Current**: Listings auto-approved on creation
- **New**: Request decision before making listing public
- **Integration**: Replace `listing.status = 'ACTIVE'` with `await decisionSource.requestDecision()`

#### 4.3.2 Auction Service
- **Current**: Auctions start immediately when created
- **New**: Require APPROVED decision before auction goes live
- **Integration**: Add decision check in auction start workflow

#### 4.3.3 Escrow Service
- **Current**: Escrow releases based on internal rules
- **New**: Request decision before releasing funds
- **Integration**: Add decision gate before `releaseEscrow()`

### 4.4 Feature Flags

```env
# Decision Authority Configuration
DECISION_AUTHORITY_MODE=INTERNAL          # INTERNAL | EXTERNAL
CUSTODII_API_URL=https://api.custodii.com
CUSTODII_API_KEY=<secret>
CUSTODII_WEBHOOK_SECRET=<secret>
DECISION_TIMEOUT_MS=30000                 # 30 seconds
DECISION_POLL_INTERVAL_MS=5000            # 5 seconds
```

### 4.5 Database Schema

```sql
-- Decision records table (append-only)
CREATE TABLE asset_decision_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type VARCHAR(50) NOT NULL,
  asset_id VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL,
  source VARCHAR(20) NOT NULL,
  authority VARCHAR(255) NOT NULL,
  decision_ref VARCHAR(255),
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_asset_lookup (asset_type, asset_id),
  INDEX idx_status (status),
  INDEX idx_source (source),
  INDEX idx_decision_ref (decision_ref)
);

-- Decision audit log (immutable)
CREATE TABLE decision_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES asset_decision_records(id),
  event_type VARCHAR(50) NOT NULL,
  actor VARCHAR(255) NOT NULL,
  old_status VARCHAR(20),
  new_status VARCHAR(20),
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Webhook events (for external updates)
CREATE TABLE decision_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_ref VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_decision_ref (decision_ref),
  INDEX idx_processed (processed)
);
```

## 5. Non-Functional Requirements

### 5.1 Performance
- Decision requests must complete within 30 seconds (timeout)
- Polling interval: 5 seconds for PENDING decisions
- Cache decision results for 5 minutes
- Support 1000 concurrent decision requests

### 5.2 Reliability
- Retry failed external API calls (3 attempts with exponential backoff)
- Fallback to INTERNAL mode if external API unavailable
- Queue decision requests if external API is down
- Alert on decision timeout or repeated failures

### 5.3 Security
- All external API calls use HTTPS with certificate validation
- API keys stored in secure environment variables
- Webhook signatures validated using HMAC-SHA256
- Decision overrides require admin authentication + audit log

### 5.4 Compliance
- All decisions logged with full provenance (who, when, why)
- Decision records are immutable (append-only)
- Audit trail retained for 7 years
- Support compliance export (CSV/JSON)

## 6. Integration Phases

### Phase 1: Foundation (Week 1)
- Create decision authority database schema
- Implement IDecisionSource interface
- Build InternalDecisionSource (current behavior)
- Build MockDecisionSource (testing)

### Phase 2: Backend Integration (Week 2)
- Integrate decision source into listing-service
- Integrate decision source into auction-service
- Integrate decision source into escrow-service
- Add decision API endpoints

### Phase 3: External Integration (Week 3)
- Implement CustodiiDecisionSource
- Add webhook handler for external updates
- Implement polling mechanism for PENDING decisions
- Add retry/fallback logic

### Phase 4: Frontend Integration (Week 4)
- Add disposition_status to listing UI
- Add decision status filters
- Build admin decision management panel
- Add real-time status updates

### Phase 5: Testing & Deployment (Week 5)
- Integration tests (INTERNAL mode)
- Integration tests (EXTERNAL mode with mock)
- Load testing (1000 concurrent requests)
- Staging deployment with INTERNAL mode
- Production deployment with feature flag OFF

## 7. Success Criteria

### 7.1 Technical Success
- [ ] All existing tests pass without modification
- [ ] New decision authority tests achieve 90%+ coverage
- [ ] Zero downtime during deployment
- [ ] Feature flag toggle works without restart
- [ ] External API integration completes within 30s timeout

### 7.2 Business Success
- [ ] Can switch to EXTERNAL mode in production
- [ ] Custodii API successfully controls asset disposition
- [ ] Admin override workflow functions correctly
- [ ] Compliance audit export works
- [ ] Zero customer-facing errors during rollout

## 8. Risks & Mitigations

### 8.1 Risk: External API Downtime
**Impact**: Listings/auctions blocked, business disruption
**Mitigation**: 
- Automatic fallback to INTERNAL mode
- Queue requests for retry when API recovers
- Alert ops team on repeated failures

### 8.2 Risk: Decision Timeout
**Impact**: Poor user experience, abandoned listings
**Mitigation**:
- 30-second timeout with clear error message
- Retry mechanism with exponential backoff
- Admin panel to manually resolve stuck decisions

### 8.3 Risk: Breaking Existing Services
**Impact**: Production outage, revenue loss
**Mitigation**:
- Comprehensive integration tests
- Feature flag allows instant rollback
- Gradual rollout (staging → 1% → 10% → 100%)
- InternalDecisionSource maintains exact current behavior

### 8.4 Risk: Security Vulnerability
**Impact**: Unauthorized decision manipulation
**Mitigation**:
- Webhook signature validation
- API key rotation policy
- Admin override requires MFA
- All actions logged with full audit trail

## 9. Dependencies

### 9.1 External Dependencies
- Custodii API documentation and credentials
- Custodii webhook endpoint configuration
- Custodii API rate limits and SLA

### 9.2 Internal Dependencies
- listing-service (modification required)
- auction-service (modification required)
- escrow-service (modification required)
- api-gateway (new routes)
- admin-service (new UI panels)

## 10. Open Questions

1. **Decision Expiry**: How long should PENDING decisions remain valid before expiring?
2. **Batch Decisions**: Should we support batch decision requests for multiple assets?
3. **Decision Appeals**: Can sellers appeal REJECTED decisions? What's the workflow?
4. **Partial Approval**: Can Custodii approve with conditions (e.g., "approved for 30 days only")?
5. **Notification**: Should users be notified when decision status changes?
6. **Pricing Impact**: Do PENDING listings show in search? At what price?
7. **Refund Policy**: If listing rejected after purchase, who pays refund fees?

## 11. Out of Scope

- Custodii API implementation (external system)
- Multi-authority support (only one external authority at a time)
- Decision workflow customization (fixed PENDING → APPROVED/REJECTED flow)
- Historical decision migration (only new decisions tracked)
- Real-time decision streaming (polling only, no WebSocket)
