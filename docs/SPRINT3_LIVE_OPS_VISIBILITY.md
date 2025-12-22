# Sprint 3 Live Ops Visibility

## Overview

Sprint 3 Live Ops Visibility provides **internal, READ-ONLY operational visibility** for the AI-assisted marketplace. This dashboard allows ops teams to monitor system health, corridor performance, and trust metrics without any ability to modify production state.

## Core Principle

> **"Ops can SEE everything, CHANGE nothing."**

## Constraints (STRICTLY ENFORCED)

| Constraint | Description |
|------------|-------------|
| **NO Controls** | No buttons, toggles, or inputs that change state |
| **Display Only** | All data is read-only visualization |
| **No Mutations** | No API endpoints accept POST/PUT/DELETE |
| **No Hidden Metrics** | All metrics are visible and transparent |
| **Audit-Friendly** | All access is logged for compliance |

## Dashboard Sections

### 1. Kill Switch Status
- Emergency disable state (active/inactive)
- Feature flag states (AI Core, Corridor Advisory, Trust Gating, etc.)
- Last modified timestamp and modifier
- **NO CONTROLS** - state display only

### 2. Trust Friction Alerts
- High rejection rate alerts
- Trust gap warnings
- Repeated failure notifications
- Corridor bottleneck alerts
- Severity levels: critical, high, medium, low

### 3. Corridor Health
- Per-corridor status (healthy, degraded, at_capacity, disabled)
- Volume and transaction counts
- Capacity utilization percentage
- Average risk and trust scores
- Recent error counts

### 4. Intent Flow Funnel
- Stage-by-stage flow visualization
- Conversion rates between stages
- Trust gating pass/fail breakdown
- Confirmation completion rates
- Period selection: 1h, 24h, 7d

### 5. Rate Limiting Status
- Per-endpoint utilization
- Throttled request counts
- Blocked request counts
- Average response times

## API Endpoints

All endpoints are **GET only** and require `FF_OPS_VISIBILITY_ENABLED=true`.

| Endpoint | Description |
|----------|-------------|
| `GET /ops/snapshot` | Complete ops snapshot |
| `GET /ops/corridors` | Corridor health metrics |
| `GET /ops/funnel?period=24h` | Intent flow funnel |
| `GET /ops/alerts` | Trust friction alerts |
| `GET /ops/rate-limits` | Rate limiting status |
| `GET /ops/kill-switch` | Kill switch state (no controls) |
| `GET /ops/constraints` | Verify read-only constraints |

## Feature Flag

```env
# Enable ops visibility dashboard (default: false)
FF_OPS_VISIBILITY_ENABLED=true
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Ops Dashboard (READ-ONLY)                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Kill Switch │  │   Alerts    │  │   Corridor Health   │  │
│  │   Status    │  │  (Display)  │  │     (Display)       │  │
│  │  (Display)  │  │             │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │     Intent Funnel       │  │    Rate Limiting        │   │
│  │       (Display)         │  │      (Display)          │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ GET only
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Ops Visibility Service                    │
│                      (READ-ONLY)                            │
├─────────────────────────────────────────────────────────────┤
│  getCorridorHealth()    │  getIntentFunnel()               │
│  getTrustFrictionAlerts()│  getRateLimitingStatus()        │
│  getKillSwitchStatus()  │  getOpsSnapshot()                │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Read from
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Metrics Store                            │
│              (In-memory / Time-series DB)                   │
└─────────────────────────────────────────────────────────────┘
```

## Files

### Backend
- `backend/services/crowdship-service/src/services/ops-visibility.service.ts`
- `backend/services/crowdship-service/src/routes/ops.routes.ts`
- `backend/services/crowdship-service/src/services/__tests__/ops-visibility.test.ts`

### Frontend
- `frontend/admin-dashboard/src/pages/OpsDashboard.tsx`
- `frontend/admin-dashboard/src/services/ops.service.ts`
- `frontend/admin-dashboard/src/components/ops/CorridorHealthPanel.tsx`
- `frontend/admin-dashboard/src/components/ops/IntentFunnelPanel.tsx`
- `frontend/admin-dashboard/src/components/ops/TrustFrictionAlertsPanel.tsx`
- `frontend/admin-dashboard/src/components/ops/RateLimitingStatusPanel.tsx`
- `frontend/admin-dashboard/src/components/ops/KillSwitchStatusPanel.tsx`
- `frontend/admin-dashboard/src/components/ops/index.ts`

## Security & Audit

### Access Logging
All ops dashboard access is logged with:
- Request ID
- User ID
- Endpoint accessed
- IP address
- User agent
- Timestamp

### No Mutation Verification
The `/ops/constraints` endpoint verifies:
```json
{
  "opsVisibility": {
    "readOnly": true,
    "noControls": true,
    "noMutations": true,
    "auditFriendly": true,
    "noHiddenMetrics": true
  },
  "verified": true
}
```

## Auto-Refresh

The dashboard auto-refreshes every 30 seconds to provide near-real-time visibility without manual intervention.

## Integration with Sprint 3 Hardening

This visibility layer integrates with:
- Rate limiting metrics from `rate-limiter.middleware.ts`
- Abuse guard metrics from `abuse-guard.service.ts`
- Structured logging from `structured-logger.service.ts`
- Health checks from `health-check.service.ts`
- Feature flags from `feature-flags.ts`

## Definition of Done

- [x] Backend ops visibility service (READ-ONLY)
- [x] Backend ops routes (GET only)
- [x] Frontend ops dashboard page
- [x] Corridor health panel
- [x] Intent funnel panel
- [x] Trust friction alerts panel
- [x] Rate limiting status panel
- [x] Kill switch status panel (NO CONTROLS)
- [x] Frontend ops service
- [x] Tests for ops visibility
- [x] Feature flag gating
- [x] Audit logging
- [x] Documentation

## Sprint 3 Live Ops: COMPLETE ✅
