# Sprint 7: Trust & Reputation Expansion (Advisory Only)

## Overview

This sprint implements advisory-only trust and reputation extensions for the Crowdship platform. The system provides explainable trust signals, cross-market portability checks, and reputation snapshots without any enforcement, auto-ranking, or hidden penalties.

## Hard Rules (Non-Negotiable)

| Rule | Enforcement |
|------|-------------|
| ❌ No enforcement | Trust scores never trigger automatic actions |
| ❌ No auto-ranking | User rankings are not modified |
| ❌ No hidden penalties | All signals are visible to users |
| ✅ Deterministic only | Same input always produces same output |
| ✅ Read-only snapshots | Trust data is never mutated through this API |
| ✅ All signals visible | Every factor affecting trust is shown |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Trust & Reputation API                    │
│                      (Advisory Only)                         │
├─────────────────────────────────────────────────────────────┤
│  GET /api/trust/reputation/:userId  → Reputation Snapshot   │
│  GET /api/trust/history             → Trust History         │
│  GET /api/trust/portability         → Cross-Market Check    │
│  GET /api/trust/health              → Service Health        │
│  GET /api/trust/constraints         → Service Rules         │
├─────────────────────────────────────────────────────────────┤
│                    Feature Flag Gate                         │
│         FF_TRUST_REPUTATION_ENABLED (default: OFF)          │
│         FF_EMERGENCY_DISABLE_ALL (kill switch)              │
├─────────────────────────────────────────────────────────────┤
│                 TrustReputationService                       │
│  - getReputationSnapshot()  [READ-ONLY]                     │
│  - getTrustHistory()        [READ-ONLY]                     │
│  - checkPortability()       [READ-ONLY]                     │
│  - getHealth()                                               │
├─────────────────────────────────────────────────────────────┤
│                    Audit Logging                             │
│  - snapshotId, userId, action, timestamp                    │
│  - NO content storage                                        │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### GET /api/trust/reputation/:userId

Returns a read-only reputation snapshot for a user.

**Response:**
```json
{
  "success": true,
  "data": {
    "snapshotId": "snap_abc123",
    "userId": "user-123",
    "timestamp": "2025-12-19T10:00:00Z",
    "trustLevel": "VERIFIED",
    "trustScore": 65,
    "signals": [...],
    "marketScores": [...],
    "decayIndicators": [...],
    "portabilityStatus": {...},
    "explanation": {...},
    "disclaimer": {
      "type": "TRUST_ADVISORY",
      "isAdvisoryOnly": true,
      "noEnforcement": true,
      "noAutoRanking": true,
      "noHiddenPenalties": true,
      "allSignalsVisible": true
    }
  },
  "advisory": true
}
```

### GET /api/trust/history

Returns time-based trust history snapshots.

**Query Parameters:**
- `userId` (required): User ID
- `days` (optional): Number of days (1-90, default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "history": [...],
    "trend": {
      "direction": "IMPROVING",
      "changePercent": 5.2,
      "periodDays": 30,
      "explanation": "Trust score increased by 5.2% over 30 days."
    },
    "disclaimer": {...}
  },
  "advisory": true
}
```

### GET /api/trust/portability

Checks cross-market trust portability (advisory only).

**Query Parameters:**
- `userId` (required): User ID
- `sourceMarket` (required): Source market code
- `targetMarkets` (required): Comma-separated target market codes

**Response:**
```json
{
  "success": true,
  "data": {
    "sourceMarket": "MARKET_0",
    "targetMarkets": [
      {
        "market": "MARKET_1",
        "isPortable": true,
        "portabilityPercent": 70,
        "requirements": [...],
        "blockers": []
      }
    ],
    "overallPortable": true,
    "portabilityScore": 70,
    "explanation": "Trust from MARKET_0 can be partially transferred."
  },
  "advisory": true
}
```

### GET /api/trust/health

Returns service health status.

### GET /api/trust/constraints

Returns service constraints and rules documentation.

## Data Types

### Trust Levels

| Level | Score Range | Description |
|-------|-------------|-------------|
| NEW | 0-19 | New user, no history |
| BASIC | 20-39 | Some activity |
| VERIFIED | 40-59 | Identity verified |
| TRUSTED | 60-79 | Established track record |
| ELITE | 80-100 | Top performer |

### Trust Signals

All signals are visible. Types include:
- `TRANSACTION_COMPLETED` - Successful transaction
- `POSITIVE_REVIEW` - Received positive review
- `NEGATIVE_REVIEW` - Received negative review
- `DISPUTE_RESOLVED` - Dispute resolved favorably
- `DISPUTE_LOST` - Dispute resolved unfavorably
- `VERIFICATION_COMPLETED` - Identity verification done
- `ACCOUNT_AGE` - Account age factor
- `RESPONSE_TIME` - Response time factor
- `CANCELLATION` - Transaction cancellation

### Decay Indicators

Visible warnings about potential trust decay:
- `INACTIVITY` - No recent activity
- `RESPONSE_TIME_DEGRADATION` - Slower response times
- `CANCELLATION_RATE_INCREASE` - Higher cancellation rate
- `REVIEW_SCORE_DECLINE` - Declining review scores

## Feature Flags

```bash
# Enable trust & reputation advisory
FF_TRUST_REPUTATION_ENABLED=false  # Default OFF

# Emergency kill switch (disables all AI features)
FF_EMERGENCY_DISABLE_ALL=false
```

## Files Created/Modified

### Created
- `backend/services/crowdship-service/src/types/trust-reputation.types.ts`
- `backend/services/crowdship-service/src/services/trust-reputation.service.ts`
- `backend/services/crowdship-service/src/routes/trust-reputation.routes.ts`
- `backend/services/crowdship-service/src/services/__tests__/trust-reputation.test.ts`
- `docs/SPRINT7_TRUST_REPUTATION_IMPLEMENTATION.md`

### Modified
- `backend/services/crowdship-service/src/config/feature-flags.ts` - Added `TRUST_REPUTATION_ENABLED`
- `.env.example` - Added `FF_TRUST_REPUTATION_ENABLED`

## Testing

```bash
# Run tests
npm test -- --testPathPattern=trust-reputation

# Test coverage
npm test -- --coverage --testPathPattern=trust-reputation
```

### Test Categories

1. **Advisory-Only Constraints**
   - Disclaimer presence
   - All signals visible
   - No score mutation

2. **Deterministic Outputs**
   - Same input = same output
   - Consistent history
   - Consistent portability

3. **Feature Flag Enforcement**
   - Disabled when flag off
   - Emergency disable works
   - All endpoints respect flags

4. **No Side Effects**
   - Queries don't modify state
   - Multiple calls are safe
   - No external mutations

## What This Service Does NOT Do

| Action | Status |
|--------|--------|
| Modify trust scores | ❌ Never |
| Change user rankings | ❌ Never |
| Apply penalties | ❌ Never |
| Trigger enforcement | ❌ Never |
| Hide signals | ❌ Never |
| Auto-transfer trust | ❌ Never |
| Execute transactions | ❌ Never |

## Integration

To integrate with the main application:

```typescript
import trustReputationRoutes from './routes/trust-reputation.routes';

// Mount routes
app.use('/api/trust', trustReputationRoutes);
```

## Audit Logging

Every request is logged with:
- `snapshotId` - Unique identifier
- `userId` - User being queried
- `action` - Type of operation
- `timestamp` - When it occurred

**NOT logged:**
- Raw trust scores
- Internal calculations
- Signal content

## Security Considerations

1. **Read-Only Access** - No mutations possible
2. **Feature Gated** - Disabled by default
3. **Emergency Kill Switch** - Instant disable capability
4. **Audit Trail** - All access logged
5. **No PII in Logs** - Only IDs and timestamps

## Future Considerations

- Integration with external trust providers (advisory only)
- Enhanced decay prediction models
- Cross-platform trust federation (read-only)
- Trust visualization dashboards
