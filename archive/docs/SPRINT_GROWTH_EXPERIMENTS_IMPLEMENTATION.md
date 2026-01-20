# Sprint: Growth Experiments Infrastructure

## Status: COMPLETE

## Overview

Non-regulated growth experiments framework for isolated, safe A/B testing of UI/UX elements only.

## Hard Rules Enforced

| Rule | Implementation |
|------|----------------|
| Experiments MUST be isolated | Market/corridor scoping, cohort isolation |
| Feature flags OFF by default | `FF_EXPERIMENTS_ENABLED=false` |
| No shared state mutation | In-memory counters only, no DB writes |
| No experiment can affect payments/escrow/trust/risk/ranking/enforcement | Blocked types list enforced |
| No long-term storage | Assignments computed on-the-fly |
| No auto-enrollment without visibility | Explicit exposure recording |

## Allowed Experiment Types

- `UI_COPY_VARIANT` - Text/copy changes
- `LAYOUT_TOGGLE` - Layout variations
- `INFO_PANEL` - Read-only informational panels
- `EDUCATION_FLOW` - Optional education/onboarding flows

## Blocked Experiment Types

- `PAYMENT_FLOW` ❌
- `ESCROW_LOGIC` ❌
- `TRUST_SCORING` ❌
- `RISK_ASSESSMENT` ❌
- `RANKING_ALGORITHM` ❌
- `ENFORCEMENT_RULE` ❌

## API Endpoints (All READ-ONLY)

| Endpoint | Description |
|----------|-------------|
| `GET /api/experiments/constraints` | Hard constraints (always available) |
| `GET /api/experiments/active` | Active experiments for user/market |
| `GET /api/experiments/health` | System health status |
| `GET /api/experiments/metrics` | Aggregated metrics only |
| `GET /api/experiments/audit` | In-memory audit log |
| `GET /api/experiments/assignment` | Preview assignment (no exposure) |

## Safety Mechanisms

### 1. Exposure Control
- Default: 5% exposure
- Hard cap: 20% maximum
- Per-experiment limits enforced

### 2. Auto-Disable
- Error threshold: 5% (configurable)
- Automatic disable on error spike
- Audit log entry created

### 3. Kill Switch
- Per-experiment kill switch
- Global emergency disable (`FF_EMERGENCY_DISABLE_ALL`)
- Immediate effect, no delay

### 4. Automatic Expiration
- All experiments have end dates
- Auto-disable on expiry
- No zombie experiments

## Feature Flags

```env
# Growth Experiments (Non-Regulated)
FF_EXPERIMENTS_ENABLED=false
```

## Files Created

| File | Purpose |
|------|---------|
| `types/experiments.types.ts` | Type definitions |
| `config/experiments.config.ts` | Experiment configurations |
| `services/experiments.service.ts` | Core service logic |
| `routes/experiments.routes.ts` | API routes |
| `__tests__/experiments.test.ts` | Test coverage |

## Determinism Guarantee

User assignment is deterministic:
- Same user + same experiment = same variant (always)
- Based on SHA-256 hash of `userId:cohortSeed`
- No randomness, no storage needed

## Metrics (Aggregated Only)

Metrics returned are aggregated:
- Total exposures per variant
- Error rates
- Health status

NO individual user data is exposed or stored.

## Integration Example

```typescript
import { experimentsService } from './services/experiments.service';

// Get active experiments for user
const result = experimentsService.getActiveExperiments(
  'user123',
  'MARKET_0',
  'US_EG'
);

// Check user's assignment
const assignment = result.userAssignments.find(
  a => a.experimentId === 'exp_welcome_copy_v1'
);

if (assignment && !assignment.isControl) {
  // Show variant UI
  const variantConfig = result.experiments
    .find(e => e.id === assignment.experimentId)
    ?.variants.find(v => v.id === assignment.variantId)
    ?.config;
}
```

## Test Coverage

- ✅ Feature flag behavior
- ✅ Deterministic assignment
- ✅ No side effects
- ✅ Market/corridor isolation
- ✅ Kill switch behavior
- ✅ Auto-disable on errors
- ✅ Metrics aggregation
- ✅ Disclaimer presence
- ✅ Blocked types enforcement

## Constraints Summary

```
┌─────────────────────────────────────────────────────────┐
│                 EXPERIMENTS CONSTRAINTS                  │
├─────────────────────────────────────────────────────────┤
│ ✅ UI copy variants                                      │
│ ✅ Layout toggles                                        │
│ ✅ Info panels (read-only)                               │
│ ✅ Education flows                                       │
├─────────────────────────────────────────────────────────┤
│ ❌ Payment flows                                         │
│ ❌ Escrow logic                                          │
│ ❌ Trust scoring                                         │
│ ❌ Risk assessment                                       │
│ ❌ Ranking algorithms                                    │
│ ❌ Enforcement rules                                     │
├─────────────────────────────────────────────────────────┤
│ Max exposure: 20%                                        │
│ Default exposure: 5%                                     │
│ Error threshold: 5%                                      │
│ Max duration: 30 days                                    │
└─────────────────────────────────────────────────────────┘
```
