# Custodii Decision Authority API Integration - Design Document

## 1. Architecture Overview

### 1.1 System Context

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Mnbarh Platform                                 │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │   Listing    │  │   Auction    │  │    Escrow    │                │
│  │   Service    │  │   Service    │  │   Service    │                │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                │
│         │                  │                  │                         │
│         └──────────────────┼──────────────────┘                         │
│                            │                                            │
│                   ┌────────▼────────┐                                   │
│                   │  Decision       │                                   │
│                   │  Authority      │                                   │
│                   │  Service        │                                   │
│                   │                 │                                   │
│                   │  ┌───────────┐  │                                   │
│                   │  │ SLA       │  │  ← Monitors failure rates        │
│                   │  │ Monitor   │  │                                   │
│                   │  └───────────┘  │                                   │
│                   │  ┌───────────┐  │                                   │
│                   │  │ Dead      │  │  ← Cleans stuck decisions        │
│                   │  │ Decision  │  │                                   │
│                   │  │ Cleanup   │  │                                   │
│                   │  └───────────┘  │                                   │
│                   └────────┬────────┘                                   │
│                            │                                            │
│              ┌─────────────┼─────────────┐                             │
│              │             │             │                             │
│     ┌────────▼────┐  ┌────▼─────┐  ┌───▼──────┐                      │
│     │  Internal   │  │ Custodii │  │   Mock   │                      │
│     │  Decision   │  │ Decision │  │ Decision │                      │
│     │  Source     │  │  Source  │  │  Source  │                      │
│     │             │  │          │  │          │                      │
│     │             │  │ ┌──────┐ │  │          │                      │
│     │             │  │ │Circuit│ │  │          │  ← Prevents cascading│
│     │             │  │ │Breaker│ │  │          │    failures          │
│     │             │  │ └──────┘ │  │          │                      │
│     │             │  │ ┌──────┐ │  │          │                      │
│     │             │  │ │Retry │ │  │          │  ← Handles transient │
│     │             │  │ │Logic │ │  │          │    errors            │
│     │             │  │ └──────┘ │  │          │                      │
│     └─────────────┘  └────┬─────┘  └──────────┘                      │
│                           │                                            │
└───────────────────────────┼────────────────────────────────────────────┘
                            │
                            │ HTTPS (with resilience)
                            │
                   ┌────────▼────────┐
                   │  Custodii API   │
                   │  (External)     │
                   └─────────────────┘
```

### 1.2 Design Principles

1. **Abstraction**: Decision logic abstracted behind IDecisionSource interface
2. **Pluggability**: Decision source swappable via configuration
3. **Non-Breaking**: Existing services work without modification
4. **Auditability**: All decisions logged with full provenance
5. **Resilience**: Graceful degradation if external API fails
6. **Enterprise-Grade**: Circuit breakers, retry logic, SLA monitoring, automatic cleanup

## 2. Component Design

### 2.1 Decision Authority Service

**Location**: `backend/services/decision-authority-service/`

**Responsibilities**:
- Manage decision lifecycle (request → pending → approved/rejected)
- Route requests to appropriate decision source
- Handle webhooks from external authorities
- Provide decision query API
- Manage decision audit trail
- Monitor SLA compliance and trigger fallbacks
- Clean up stuck/expired decisions

**Key Classes**:


#### 2.1.1 DecisionAuthorityService
```typescript
class DecisionAuthorityService {
  constructor(
    private prisma: PrismaClient,
    private decisionSource: IDecisionSource,
    private auditLogService: AuditLogService
  ) {}

  async requestDecision(request: DecisionRequest): Promise<AssetDecisionRecord>
  async getDecision(decisionId: string): Promise<AssetDecisionRecord>
  async listDecisions(filters: DecisionFilters): Promise<AssetDecisionRecord[]>
  async overrideDecision(decisionId: string, override: DecisionOverride): Promise<AssetDecisionRecord>
}
```

**Design Notes**:
- Stateless service, all state in database
- No knowledge of which decision source is active
- All operations logged via AuditLogService
- Supports admin overrides with justification

#### 2.1.2 AuditLogService
```typescript
class AuditLogService {
  async logDecisionEvent(event: DecisionAuditEvent): Promise<void>
  async logSystemEvent(event: SystemAuditEvent): Promise<void>
  async getAuditLog(decisionId: string): Promise<DecisionAuditEvent[]>
  async queryAuditLogs(filters: AuditLogFilters): Promise<DecisionAuditEvent[]>
}
```

**Design Notes**:
- Append-only audit trail
- Logs decision lifecycle events
- Logs system resilience events (circuit breaker, SLA breach, cleanup)
- Immutable records for compliance

### 2.2 Resilience Components (Phase 3.3)

#### 2.2.1 Circuit Breaker Pattern

**Purpose**: Prevent cascading failures by stopping requests to failing external services

**Implementation**: `src/utils/CircuitBreaker.ts`

**State Machine**:
```
CLOSED (normal) ──[5 failures]──> OPEN (failing)
    ▲                                  │
    │                                  │
    │                            [60s timeout]
    │                                  │
    │                                  ▼
    └──[2 successes]──── HALF_OPEN (testing)
                              │
                         [1 failure]
                              │
                              ▼
                            OPEN
```

**Configuration**:
```typescript
{
  failureThreshold: 5,      // Failures before opening circuit
  successThreshold: 2,      // Successes to close circuit
  timeout: 60000,           // Time before attempting reset (ms)
  rollingWindowMs: 60000    // Window for tracking failures
}
```

**Behavior**:
- **CLOSED**: Normal operation, all requests pass through
- **OPEN**: Service is failing, requests fail immediately (no external calls)
- **HALF_OPEN**: Testing recovery, limited requests allowed
- Automatic recovery testing after timeout period
- Tracks success/failure statistics

**Integration**: Wraps all CustodiiDecisionSource external API calls

#### 2.2.2 Retry Strategy with Exponential Backoff

**Purpose**: Automatically retry transient failures with increasing delays

**Implementation**: `src/utils/RetryStrategy.ts`

**Configuration**:
```typescript
{
  maxRetries: 3,            // Maximum retry attempts
  initialDelayMs: 1000,     // First retry delay
  maxDelayMs: 10000,        // Maximum delay cap
  backoffMultiplier: 2      // Exponential multiplier
}
```

**Retry Schedule**:
- Attempt 1: Immediate
- Attempt 2: 1s delay
- Attempt 3: 2s delay
- Attempt 4: 4s delay

**Retryable Errors**:
- Timeout errors (ECONNABORTED, ETIMEDOUT)
- Network errors (ECONNREFUSED, ENOTFOUND)
- Server errors (HTTP 500+)

**Non-Retryable Errors** (fail immediately):
- Client errors (HTTP 400, 404)
- Authentication errors (HTTP 401, 403)
- Validation errors

**Integration**: Used by CustodiiDecisionSource for all external API calls

#### 2.2.3 SLA Monitor Service

**Purpose**: Track failure/timeout rates and auto-disable EXTERNAL mode on SLA breach

**Implementation**: `src/services/SLAMonitorService.ts`

**Configuration**:
```typescript
{
  maxFailureRate: 0.5,      // 50% failure rate threshold
  maxTimeoutRate: 0.3,      // 30% timeout rate threshold
  windowMs: 300000          // 5-minute rolling window
}
```

**Metrics Tracked**:
- Total requests in window
- Failed requests
- Timed-out requests
- Failure rate (failures / total)
- Timeout rate (timeouts / total)

**Breach Detection**:
- Requires minimum 10 requests before triggering
- If failure rate > 50% → SLA breach
- If timeout rate > 30% → SLA breach
- Triggers only once (no spam)
- Logs breach to audit log

**Actions on Breach**:
- Log SLA breach event
- Notify operations team (future)
- Recommend fallback to INTERNAL mode (future)

**Integration**: Monitors all CustodiiDecisionSource operations

#### 2.2.4 Dead Decision Cleanup Service

**Purpose**: Automatically expire decisions stuck in PENDING beyond max duration

**Implementation**: `src/services/DeadDecisionCleanupService.ts`

**Configuration**:
- Max age: 2x decision timeout (default 60s)
- Cleanup interval: 60s (configurable)

**Behavior**:
- Runs periodic cleanup job (every 60s)
- Finds decisions stuck in PENDING > 60s
- Updates status to EXPIRED
- Logs expiry to audit log
- Continues on errors (resilient)

**Lifecycle**:
```typescript
class DeadDecisionCleanupService {
  start(): void              // Start periodic cleanup
  stop(): Promise<void>      // Stop cleanup gracefully
  runCleanup(): Promise<void> // Manual cleanup trigger
}
```

**Integration**: Runs as background service in main application

### 2.3 Decision Source Abstraction

#### 2.3.1 IDecisionSource Interface

**Contract**:
```typescript
interface IDecisionSource {
  requestDecision(request: DecisionRequest): Promise<AssetDecisionRecord>;
  getDecision(decisionId: string): Promise<AssetDecisionRecord>;
  pollDecision(decisionId: string): Promise<AssetDecisionRecord>;
  cancelDecision(decisionId: string): Promise<void>;
}
```

**Design Notes**:
- Immutable contract (NEVER change)
- All implementations must satisfy this interface
- No knowledge of implementation details
- Enables pluggable decision sources

#### 2.3.2 InternalDecisionSource

**Purpose**: Maintain current auto-approval behavior (default mode)

**Implementation**: `src/sources/InternalDecisionSource.ts`

**Behavior**:
- Auto-approves all requests immediately
- No external API calls
- Zero latency
- 100% availability

**Use Cases**:
- Default mode (DECISION_AUTHORITY_MODE=INTERNAL)
- Fallback when external API unavailable
- Development/testing without external dependencies

#### 2.3.3 CustodiiDecisionSource

**Purpose**: Integrate with external Custodii Decision Authority API

**Implementation**: `src/sources/CustodiiDecisionSource.ts`

**Resilience Integration**:
```typescript
class CustodiiDecisionSource implements IDecisionSource {
  constructor(
    private config: CustodiiConfig,
    private circuitBreaker: CircuitBreaker,
    private retryStrategy: RetryStrategy,
    private auditLogService: AuditLogService
  ) {}

  async requestDecision(request: DecisionRequest): Promise<AssetDecisionRecord> {
    return this.circuitBreaker.execute(async () => {
      return this.retryStrategy.execute(async () => {
        // Make external API call
        const response = await axios.post(
          `${this.config.apiUrl}/decisions`,
          request,
          { headers: { Authorization: `Bearer ${this.config.apiKey}` } }
        );
        return this.mapResponse(response.data);
      });
    });
  }

  private isRetryableError(error: any): boolean {
    // Timeout errors
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return true;
    // Network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') return true;
    // Server errors
    if (axios.isAxiosError(error) && error.response?.status >= 500) return true;
    // Client errors (non-retryable)
    return false;
  }
}
```

**Error Handling**:
- Circuit breaker prevents cascading failures
- Retry strategy handles transient errors
- Intelligent error classification (retryable vs non-retryable)
- All errors logged to audit trail

**API Endpoints**:
- `POST /decisions` - Request new decision
- `GET /decisions/:id` - Get decision status
- `PATCH /decisions/:id` - Update decision (webhook)

#### 2.3.4 MockDecisionSource

**Purpose**: Simulate external API for testing/development

**Implementation**: `src/sources/MockDecisionSource.ts`

**Features**:
- Configurable delay simulation
- Status transition simulation (PENDING → APPROVED/REJECTED)
- Deterministic behavior for testing
- No external dependencies

**Configuration**:
```typescript
{
  autoApprove: true,        // Auto-approve after delay
  delayMs: 2000,            // Simulated processing delay
  approvalRate: 0.9         // 90% approval rate
}
```

### 2.4 Polling & Webhook Services

#### 2.4.1 DecisionPollingService

**Purpose**: Poll external API for PENDING decision status updates

**Implementation**: `src/services/DecisionPollingService.ts`

**Configuration**:
```typescript
{
  pollIntervalMs: 5000,     // Poll every 5 seconds
  maxPollDurationMs: 30000, // Max 30 seconds
  batchSize: 10             // Poll 10 decisions per batch
}
```

**Behavior**:
- Finds all PENDING decisions
- Polls decision source for status updates
- Updates database on status change
- Logs all status transitions
- Stops polling after max duration (timeout)

**Lifecycle**:
```typescript
class DecisionPollingService {
  start(): void              // Start polling loop
  stop(): Promise<void>      // Stop polling gracefully
  pollOnce(): Promise<void>  // Manual poll trigger
}
```

#### 2.4.2 WebhookService

**Purpose**: Handle real-time decision updates from external authority

**Implementation**: `src/services/WebhookService.ts`

**Security**:
- HMAC-SHA256 signature validation
- Timestamp validation (prevent replay attacks)
- IP whitelist (optional)

**Signature Validation**:
```typescript
function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

**Event Processing**:
- Validate signature
- Parse webhook payload
- Update decision status
- Log event to audit trail
- Notify affected services (future)

### 2.5 REST API Layer

#### 2.5.1 DecisionController

**Endpoints**:
```typescript
POST   /api/v1/decisions/request          // Request decision
GET    /api/v1/decisions/:id              // Get decision by ID
GET    /api/v1/decisions/asset/:assetId   // Get decisions for asset
GET    /api/v1/decisions                  // List decisions (with filters)
PATCH  /api/v1/decisions/:id/override     // Admin override
```

**Authentication**:
- All endpoints require JWT authentication
- Override endpoint requires admin role
- Webhook endpoint uses HMAC signature

**Validation**:
- Request body validation (Zod schemas)
- Parameter validation (UUID format)
- Authorization checks (role-based)

#### 2.5.2 AuditLogController

**Endpoints**:
```typescript
GET /api/v1/audit-logs/:decisionId        // Get audit log for decision
GET /api/v1/audit-logs                    // Query audit logs (admin only)
```

**Filters**:
- Decision ID
- Event type
- Actor
- Date range
- Source type (INTERNAL/EXTERNAL/OVERRIDE)

## 3. Data Model

### 3.1 Database Schema

#### 3.1.1 AssetDecisionRecord
```sql
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
```

**Fields**:
- `id`: Unique decision identifier
- `asset_type`: LISTING | AUCTION | ESCROW_RELEASE
- `asset_id`: Reference to asset in source service
- `status`: PENDING | APPROVED | REJECTED | EXPIRED
- `source`: INTERNAL | EXTERNAL | OVERRIDE
- `authority`: Who made the decision (system, Custodii, admin email)
- `decision_ref`: External reference ID (for Custodii)
- `reason`: Human-readable reason for decision
- `metadata`: Additional context (JSON)
- `requested_at`: When decision was requested
- `decided_at`: When decision was made
- `expires_at`: When decision expires (if applicable)

#### 3.1.2 DecisionAuditLog
```sql
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
```

**Event Types**:
- `DECISION_REQUESTED`: Decision requested from authority
- `DECISION_APPROVED`: Decision approved
- `DECISION_REJECTED`: Decision rejected
- `DECISION_EXPIRED`: Decision expired (timeout)
- `DECISION_OVERRIDDEN`: Admin override
- `CIRCUIT_BREAKER_OPENED`: Circuit breaker opened
- `CIRCUIT_BREAKER_CLOSED`: Circuit breaker closed
- `SLA_BREACH`: SLA threshold exceeded
- `DEAD_DECISION_CLEANUP`: Stuck decision cleaned up

#### 3.1.3 DecisionWebhookEvent
```sql
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

**Purpose**: Store webhook events for processing and replay

## 4. Configuration

### 4.1 Environment Variables

#### 4.1.1 Core Configuration
```env
# Decision Authority Mode
DECISION_AUTHORITY_MODE=INTERNAL          # INTERNAL | EXTERNAL

# Custodii API Configuration
CUSTODII_API_URL=https://api.custodii.com
CUSTODII_API_KEY=<secret>
CUSTODII_WEBHOOK_SECRET=<secret>

# Timeouts
DECISION_TIMEOUT_MS=30000                 # 30 seconds
DECISION_POLL_INTERVAL_MS=5000            # 5 seconds
```

#### 4.1.2 Resilience Configuration (Phase 3.3)
```env
# Circuit Breaker
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5       # Failures before opening
CIRCUIT_BREAKER_SUCCESS_THRESHOLD=2       # Successes to close
CIRCUIT_BREAKER_TIMEOUT_MS=60000          # 60s before retry
CIRCUIT_BREAKER_WINDOW_MS=60000           # 60s rolling window

# Retry Strategy
RETRY_MAX_ATTEMPTS=3                      # Max retry attempts
RETRY_INITIAL_DELAY_MS=1000               # 1s initial delay
RETRY_MAX_DELAY_MS=10000                  # 10s max delay
RETRY_BACKOFF_MULTIPLIER=2                # Exponential multiplier

# SLA Monitoring
SLA_MAX_FAILURE_RATE=0.5                  # 50% max failure rate
SLA_MAX_TIMEOUT_RATE=0.3                  # 30% max timeout rate
SLA_WINDOW_MS=300000                      # 5-minute window

# Dead Decision Cleanup
DEAD_DECISION_MAX_AGE_MS=60000            # 60s max age
DEAD_DECISION_CLEANUP_INTERVAL_MS=60000   # 60s cleanup interval
```

### 4.2 Configuration Profiles

#### 4.2.1 Production (Conservative)
```env
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_SUCCESS_THRESHOLD=2
CIRCUIT_BREAKER_TIMEOUT_MS=60000
RETRY_MAX_ATTEMPTS=3
RETRY_INITIAL_DELAY_MS=1000
SLA_MAX_FAILURE_RATE=0.5
SLA_MAX_TIMEOUT_RATE=0.3
```

#### 4.2.2 Staging (Aggressive)
```env
CIRCUIT_BREAKER_FAILURE_THRESHOLD=3
CIRCUIT_BREAKER_SUCCESS_THRESHOLD=1
CIRCUIT_BREAKER_TIMEOUT_MS=30000
RETRY_MAX_ATTEMPTS=2
RETRY_INITIAL_DELAY_MS=500
SLA_MAX_FAILURE_RATE=0.3
SLA_MAX_TIMEOUT_RATE=0.2
```

#### 4.2.3 Development (Permissive)
```env
CIRCUIT_BREAKER_FAILURE_THRESHOLD=10
CIRCUIT_BREAKER_SUCCESS_THRESHOLD=3
CIRCUIT_BREAKER_TIMEOUT_MS=120000
RETRY_MAX_ATTEMPTS=5
RETRY_INITIAL_DELAY_MS=2000
SLA_MAX_FAILURE_RATE=0.8
SLA_MAX_TIMEOUT_RATE=0.5
```

## 5. Failure Scenarios & Recovery

### 5.1 Failure Scenario Matrix

| Scenario | Detection | Behavior | Recovery |
|----------|-----------|----------|----------|
| Custodii timeout | Retry strategy | Retry 3x with backoff → Circuit breaker | Auto-recover after 60s |
| Custodii 500 error | Retry strategy | Retry 3x with backoff → Circuit breaker | Auto-recover after 60s |
| Custodii 404 error | Error classification | Fail immediately (no retry) | N/A (client error) |
| Network failure | Retry strategy | Retry 3x with backoff → Circuit breaker | Auto-recover after 60s |
| High failure rate (>50%) | SLA monitor | Log SLA breach → Recommend fallback | Manual re-enable |
| High timeout rate (>30%) | SLA monitor | Log SLA breach → Recommend fallback | Manual re-enable |
| Stuck PENDING decision | Dead decision cleanup | Auto-expire after 60s | Cleanup service |
| Circuit breaker OPEN | Circuit breaker | Fail immediately (no requests) | Auto-test after 60s |
| Circuit breaker HALF_OPEN | Circuit breaker | Limited requests for testing | Success → CLOSED, Failure → OPEN |

### 5.2 Graceful Degradation

**Degradation Path**:
1. Normal operation (EXTERNAL mode, circuit CLOSED)
2. Transient failures (retry with backoff)
3. Repeated failures (circuit OPEN)
4. SLA breach (recommend fallback to INTERNAL)
5. Manual fallback (DECISION_AUTHORITY_MODE=INTERNAL)

**Recovery Path**:
1. Circuit breaker tests recovery (HALF_OPEN)
2. Successful requests (circuit CLOSED)
3. SLA metrics improve
4. Manual re-enable (DECISION_AUTHORITY_MODE=EXTERNAL)

## 6. Monitoring & Observability

### 6.1 Metrics (Future)

**Decision Metrics**:
- `decisions_requested_total` (counter)
- `decisions_approved_total` (counter)
- `decisions_rejected_total` (counter)
- `decisions_expired_total` (counter)
- `decision_duration_seconds` (histogram)

**Resilience Metrics**:
- `circuit_breaker_state` (gauge: 0=CLOSED, 1=OPEN, 2=HALF_OPEN)
- `circuit_breaker_failures_total` (counter)
- `circuit_breaker_successes_total` (counter)
- `retry_attempts_total` (counter)
- `sla_failure_rate` (gauge)
- `sla_timeout_rate` (gauge)
- `dead_decisions_cleaned_total` (counter)

**API Metrics**:
- `custodii_api_requests_total` (counter)
- `custodii_api_errors_total` (counter)
- `custodii_api_duration_seconds` (histogram)

### 6.2 Logs

**Structured Logging** (JSON format):
```json
{
  "timestamp": "2026-01-21T10:30:00Z",
  "level": "info",
  "service": "decision-authority-service",
  "event": "circuit_breaker_opened",
  "details": {
    "failures": 5,
    "threshold": 5,
    "window_ms": 60000
  }
}
```

**Log Events**:
- Decision lifecycle events
- Circuit breaker state changes
- Retry attempts
- SLA breaches
- Dead decision cleanup
- Webhook processing
- Admin overrides

### 6.3 Alerts (Future)

**Critical Alerts**:
- Circuit breaker OPEN for > 5 minutes
- SLA breach (failure rate > 50%)
- Dead decision count > 100
- Webhook processing failures

**Warning Alerts**:
- Circuit breaker HALF_OPEN
- Retry rate > 20%
- Decision timeout rate > 10%

## 7. Security Considerations

### 7.1 Authentication & Authorization

**API Authentication**:
- JWT tokens for internal API calls
- Bearer token for Custodii API calls
- HMAC signature for webhook validation

**Authorization**:
- Role-based access control (RBAC)
- Admin role required for overrides
- Audit log access restricted to admins

### 7.2 Data Protection

**Secrets Management**:
- API keys stored in environment variables
- Webhook secrets rotated regularly
- No secrets in logs or audit trail

**Data Encryption**:
- HTTPS for all external API calls
- TLS 1.2+ required
- Certificate validation enforced

### 7.3 Webhook Security

**Signature Validation**:
```typescript
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');

if (!crypto.timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(signature))) {
  throw new Error('Invalid webhook signature');
}
```

**Additional Protections**:
- Timestamp validation (prevent replay)
- IP whitelist (optional)
- Rate limiting
- Idempotency keys

## 8. Testing Strategy

### 8.1 Unit Tests

**Coverage Target**: 90%+

**Test Suites**:
- CircuitBreaker (15 tests)
- RetryStrategy (12 tests)
- SLAMonitorService (10 tests)
- DeadDecisionCleanupService (11 tests)
- CustodiiDecisionSource (15 tests)
- DecisionAuthorityService (20 tests)
- AuditLogService (10 tests)

### 8.2 Integration Tests

**Scenarios**:
- INTERNAL mode end-to-end
- EXTERNAL mode with MockDecisionSource
- Mode switching without restart
- Webhook processing
- Admin override workflow
- Circuit breaker integration
- Retry strategy integration

### 8.3 Load Tests

**Targets**:
- 100 concurrent decision requests
- 1000 concurrent decision requests
- Polling under load
- Webhook processing under load

**Metrics**:
- Response time < 200ms (p95)
- Error rate < 1%
- No memory leaks
- Database query performance

## 9. Deployment Strategy

### 9.1 Phased Rollout

**Phase 1: Staging (INTERNAL mode)**
- Deploy decision-authority-service
- Run smoke tests
- Verify integration with existing services

**Phase 2: Production (INTERNAL mode)**
- Deploy to production
- Feature flag OFF (INTERNAL mode)
- Monitor for 1 week

**Phase 3: Gradual EXTERNAL Rollout**
- Enable EXTERNAL mode for 1% of traffic
- Monitor for 24 hours
- Increase to 10%, 50%, 100%

### 9.2 Rollback Plan

**Instant Rollback**:
- Set `DECISION_AUTHORITY_MODE=INTERNAL`
- No service restart required
- All decisions continue with auto-approval

**Full Rollback**:
- Revert to previous deployment
- Database migrations are backward compatible
- No data loss

## 10. Success Criteria

### 10.1 Technical Success

- [x] All existing tests pass without modification
- [x] New tests achieve 90%+ coverage
- [x] Zero downtime during deployment
- [x] Feature flag toggle works without restart
- [x] External API integration completes within 30s
- [x] Circuit breaker prevents cascading failures
- [x] Retry strategy handles transient errors
- [x] SLA monitor detects degraded service
- [x] Dead decision cleanup prevents stuck states

### 10.2 Business Success

- [ ] Can switch to EXTERNAL mode in production
- [ ] Custodii API successfully controls asset disposition
- [ ] Admin override workflow functions correctly
- [ ] Compliance audit export works
- [ ] Zero customer-facing errors during rollout

## 11. Future Enhancements

### 11.1 Phase 4: Advanced Features

- Multi-authority support (multiple external authorities)
- Decision workflow customization
- Batch decision processing
- Real-time decision streaming (WebSocket)
- Decision analytics dashboard
- Automated SLA-based fallback

### 11.2 Phase 5: Optimization

- Decision result caching
- Predictive decision pre-fetching
- Machine learning for decision prediction
- Advanced monitoring dashboards
- Automated performance tuning

---

## Document Version

**Version**: 2.0  
**Last Updated**: January 21, 2026  
**Status**: Phase 3.3 Complete (Resilience Patterns Implemented)

**Changes from v1.0**:
- Added comprehensive resilience architecture (Circuit Breaker, Retry, SLA Monitor, Dead Decision Cleanup)
- Updated system context diagram with resilience components
- Added detailed failure scenario matrix
- Added configuration profiles for different environments
- Added monitoring and observability section
- Updated success criteria with resilience requirements
