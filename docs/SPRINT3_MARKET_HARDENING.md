# Sprint 3: Market Hardening & Go-Live Safety

## Executive Summary

Sprint 3 implements market hardening and go-live safety measures for the AI advisory layer. All features remain advisory-only, deterministic, and feature-flagged with an emergency kill switch.

## Scope Delivered

### 1. Rate Limiting ✅

**Location:** `backend/services/crowdship-service/src/middleware/rate-limiter.middleware.ts`

Per-endpoint rate limits:
- `corridor/advisory`: 30 requests/minute
- `intent/classify`: 60 requests/minute
- `checkpoints`: 30 requests/minute
- Default: 100 requests/minute

Features:
- Per-user + per-IP tracking
- Soft throttling at 80% with warnings
- Human-readable error messages
- Rate limit headers (`X-RateLimit-*`)

```typescript
// Response headers
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1734520260
X-RateLimit-Warning: "Approaching rate limit" // At 80%
```

### 2. Abuse Guards ✅

**Location:** `backend/services/crowdship-service/src/services/abuse-guard.service.ts`

Protection against:
- **Intent Spam**: Max 10/minute, 100/hour, 5-minute cooldown
- **Offer Flooding**: Max 5/minute, 50/hour, 10-minute cooldown
- **Corridor Volume Caps**: $50,000/day per corridor, 500 transactions/day

All blocks include:
- Human-readable reason
- Suggestions for resolution
- Cooldown time remaining

```typescript
interface AbuseCheckResult {
  allowed: boolean;
  warning?: string;
  cooldownUntil?: Date;
  reason?: string;
  suggestions?: string[];
}
```

### 3. Corridor Caps ✅

Daily volume limits per corridor:
- Max $50,000 USD per corridor per day
- Max 500 transactions per corridor per day
- Warning at 80% capacity

```typescript
// Corridor volume status
{
  corridorId: "US_EG",
  volumeUSD: 35000,
  transactionCount: 250,
  remainingVolumeUSD: 15000,
  remainingTransactions: 250,
  percentUsed: 70
}
```

### 4. Feature Flag Safety ✅

**Location:** `backend/services/crowdship-service/src/config/feature-flags.ts`

Sprint 3 flags (all default OFF):
```typescript
RATE_LIMITING_ENABLED: false,
ABUSE_GUARDS_ENABLED: false,
CORRIDOR_CAPS_ENABLED: false,
STRUCTURED_LOGGING_ENABLED: false,
GRACEFUL_DEGRADATION_ENABLED: false,
EMERGENCY_DISABLE_ALL: false,  // Global kill switch
```

**Emergency Kill Switch:**
When `FF_EMERGENCY_DISABLE_ALL=true`:
- All AI features disabled immediately
- Health check returns UNHEALTHY
- All advisory endpoints return disabled message
- No partial states - complete shutdown

### 5. Health Probes ✅

**Location:** `backend/services/crowdship-service/src/routes/health.routes.ts`

Kubernetes-compatible probes:

| Endpoint | Purpose | Success Code |
|----------|---------|--------------|
| `/health/live` | Liveness probe | 200 |
| `/health/ready` | Readiness probe | 200/503 |
| `/health/status` | Detailed status | 200 |
| `/health/flags` | Feature flag status | 200 |
| `/health/rate-limit` | Rate limit status | 200 |
| `/health/corridors` | Corridor caps status | 200 |
| `/health/constraints` | No-regression verification | 200 |

### 6. Structured Logging ✅

**Location:** `backend/services/crowdship-service/src/services/structured-logger.service.ts`

Log format:
```json
{
  "timestamp": "2024-12-18T10:30:00.000Z",
  "level": "INFO",
  "message": "Corridor advisory processed",
  "service": "crowdship-service",
  "version": "1.0.0",
  "environment": "production",
  "requestId": "req-123",
  "correlationId": "corridor-abc",
  "userId": "user-1",
  "corridor": "US_EG",
  "intent": "BUY_FROM_ABROAD",
  "riskLevel": "LOW",
  "durationMs": 45
}
```

Features:
- PII sanitization (passwords, emails, etc.)
- Request-scoped logging
- Log level filtering
- Recent logs retrieval for debugging

### 7. Graceful Degradation ✅

**Location:** `backend/services/crowdship-service/src/services/health-check.service.ts`

When AI Core is unavailable:
- Service continues operating
- Returns degraded status
- Advisory features limited
- Core functionality preserved

```typescript
// Degraded mode response
{
  message: "Service is operating in degraded mode. AI advisory features may be limited.",
  advisory: true,
  degraded: true
}
```

### 8. Frontend Guardrails ✅

**Location:** `frontend/web/src/components/crowdship/ServiceStatusBanner.tsx`

Components:
- `ServiceStatusBanner` - Overall service status
- `RateLimitBanner` - Rate limit warnings
- `CorridorCapBanner` - Corridor volume warnings

All banners include:
- Clear status indication
- Human-readable messages
- Actionable suggestions
- Advisory-only notice

---

## No-Regressions Enforcement ✅

Verified constraints (endpoint: `/health/constraints`):

| Constraint | Status | Description |
|------------|--------|-------------|
| No Payments | ✅ Enforced | No payment processing in advisory layer |
| No Escrow Execution | ✅ Enforced | Escrow is recommended only, never executed |
| No Auto-Matching | ✅ Enforced | No automatic buyer-traveler matching |
| No Background Execution | ✅ Enforced | All actions require explicit user confirmation |
| No Ranking Suppression | ✅ Enforced | All ranking decisions include explanations |
| Human Confirmation Required | ✅ Enforced | Checkpoints require explicit user confirmation |
| Deterministic Only | ✅ Enforced | Same input always produces same output |
| Read-Only Advisory | ✅ Enforced | All outputs are advisory only |

---

## API Endpoints

### Health Endpoints

```
GET /health/live
Response: { status: "alive", uptime: 123456, uptimeHuman: "1d 10h 17m" }

GET /health/ready
Response: { status: "healthy|degraded|unhealthy", version, uptime, components[], flags }

GET /health/status
Response: { ...ready, detailed: { featureFlags, corridorVolumes, recentErrors, constraints } }

GET /health/flags
Response: { flags: {...}, emergencyDisabled: false, timestamp }

GET /health/rate-limit
Response: { userId, ip, endpoints: [{ endpoint, count, limit, remaining, resetTime }] }

GET /health/corridors
Response: { corridors: [{ corridorId, volumeUSD, percentUsed, ... }] }

GET /health/constraints
Response: { constraints: {...}, verified: true }
```

---

## Environment Variables

```bash
# Sprint 3 Feature Flags (all default OFF)
FF_RATE_LIMITING_ENABLED=false
FF_ABUSE_GUARDS_ENABLED=false
FF_CORRIDOR_CAPS_ENABLED=false
FF_STRUCTURED_LOGGING_ENABLED=false
FF_GRACEFUL_DEGRADATION_ENABLED=false
FF_EMERGENCY_DISABLE_ALL=false

# Frontend Feature Flags
REACT_APP_FF_RATE_LIMITING_ENABLED=false
REACT_APP_FF_EMERGENCY_DISABLE_ALL=false
```

---

## Files Created/Modified

### Backend
- `backend/services/crowdship-service/src/config/feature-flags.ts` - Sprint 3 flags
- `backend/services/crowdship-service/src/middleware/rate-limiter.middleware.ts` - Rate limiting
- `backend/services/crowdship-service/src/services/abuse-guard.service.ts` - Abuse detection
- `backend/services/crowdship-service/src/services/structured-logger.service.ts` - Structured logging
- `backend/services/crowdship-service/src/services/health-check.service.ts` - Health checks
- `backend/services/crowdship-service/src/routes/health.routes.ts` - Health endpoints
- `backend/services/crowdship-service/src/services/__tests__/market-hardening.test.ts` - Tests

### Frontend
- `frontend/web/src/services/crowdship-ai.service.ts` - Sprint 3 health APIs
- `frontend/web/src/components/crowdship/ServiceStatusBanner.tsx` - Status banners

---

## Deployment Checklist

### Pre-Go-Live
- [ ] All feature flags OFF by default
- [ ] Emergency kill switch tested
- [ ] Health probes configured in Kubernetes
- [ ] Structured logging to log aggregator
- [ ] Rate limits tuned for expected traffic
- [ ] Corridor caps set appropriately

### Go-Live
1. Enable `FF_STRUCTURED_LOGGING_ENABLED`
2. Enable `FF_RATE_LIMITING_ENABLED`
3. Enable `FF_ABUSE_GUARDS_ENABLED`
4. Enable `FF_CORRIDOR_CAPS_ENABLED`
5. Enable `FF_GRACEFUL_DEGRADATION_ENABLED`
6. Monitor health endpoints
7. Gradually enable AI features

### Emergency Rollback
```bash
# Immediate shutdown of all AI features
FF_EMERGENCY_DISABLE_ALL=true
```

---

## Definition of Done ✅

| Requirement | Status |
|-------------|--------|
| Rate limits per user/IP | ✅ |
| Abuse guards (intent spam, offer flooding) | ✅ |
| Corridor caps (max daily volume) | ✅ |
| Soft throttling with warnings | ✅ |
| All features behind flags (OFF default) | ✅ |
| Emergency disable flag (kill switch) | ✅ |
| Health probes (liveness/readiness) | ✅ |
| Structured logs (requestId, corridor, intent, riskLevel) | ✅ |
| Graceful degradation if AI Core unavailable | ✅ |
| NO payments confirmed | ✅ |
| NO auto-matching confirmed | ✅ |
| NO background execution confirmed | ✅ |
| NO ranking suppression without explanation | ✅ |

---

## Sprint 3 (Hardening) — COMPLETE ✅
