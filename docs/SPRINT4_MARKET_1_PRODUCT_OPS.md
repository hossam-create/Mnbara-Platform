# Sprint 4: Market 1 Product & Ops Enablement

## Overview

Market 1 activation from a PRODUCT & OPS angle.

- Market 0 already live (US → MENA)
- Market 1 = EU → MENA (UK, DE, FR → EG, AE, SA)
- Same trust-first, human-confirmed principles

## Constraints (STRICTLY ENFORCED)

| Constraint | Status |
|------------|--------|
| ❌ No new user powers | ENFORCED |
| ❌ No automation | ENFORCED |
| ❌ No payments | ENFORCED |
| ✅ Advisory only | ENFORCED |
| ✅ Human confirmation required | ENFORCED |

---

## 1. Market 1 Product Configuration

### 1.1 Allowed Intents

| Intent | Allowed | Confirmation Required | Trust Requirement |
|--------|---------|----------------------|-------------------|
| `BUY_FROM_ABROAD` | ✅ | Yes | STANDARD |
| `TRAVEL_MATCH` | ✅ | Yes | TRUSTED |
| `PRICE_VERIFY` | ✅ | No | ANY |
| `BROWSE` | ✅ | No | ANY |
| `COMPARE` | ✅ | No | ANY |

### 1.2 Blocked Intents

| Intent | Blocked | Reason |
|--------|---------|--------|
| `AUTO_MATCH` | ✅ | No automation |
| `AUTO_PURCHASE` | ✅ | No automation |
| `BULK_ORDER` | ✅ | Not available in Market 1 |
| `RESALE` | ✅ | Not supported |

### 1.3 Blocked Flows

| Flow | Blocked | User Message |
|------|---------|--------------|
| Payment Execution | ✅ | "Payment processing is not yet available for this corridor." |
| Escrow Execution | ✅ | "Escrow services are recommended but not yet executable." |
| Auto Matching | ✅ | "Please manually review and confirm traveler matches." |
| Background Actions | ✅ | "All actions require your explicit confirmation." |
| Ranking Suppression | ✅ | "All recommendations are transparent with explanations." |

---

## 2. Corridor-Specific UX Adjustments

### 2.1 Risk Banners

Each Market 1 corridor displays:
- Risk level indicator (low/medium/elevated/high)
- Customs complexity rating
- Value category (standard vs high-value)
- Restricted items list
- Advisory notice

**Component:** `Market1RiskBanner.tsx`

### 2.2 Trust Explanations

Each transaction shows:
- Current buyer trust level
- Current traveler trust level
- Required trust levels
- Pass/fail status
- Reasons for requirements
- How to improve trust

**Component:** `TrustExplanationPanel.tsx`

### 2.3 Corridor Configurations

| Corridor | Customs Complexity | High-Value Threshold |
|----------|-------------------|---------------------|
| UK → EG | 1.25 (Medium) | $200 |
| UK → AE | 1.05 (Low) | $200 |
| DE → EG | 1.30 (Medium-High) | $200 |
| FR → AE | 1.10 (Low-Medium) | $200 |

---

## 3. Human Ops Playbooks

### 3.1 Review Flow

```
Intent Review → Trust Review → Corridor Review → Log Decision
```

See: `docs/ops/MARKET_1_OPS_PLAYBOOK.md`

### 3.2 Escalation Path

```
L1: Ops Team (15 min) → L2: Ops Lead → L3: Engineering → L4: Emergency
```

| Level | Trigger | Contact |
|-------|---------|---------|
| L1 | User complaint | ops-market1@mnbara.com |
| L2 | Multiple complaints (>3/hour) | ops-lead@mnbara.com |
| L3 | System error >5% | oncall-crowdship@mnbara.com |
| L4 | Emergency (>10% error) | emergency@mnbara.com |

---

## 4. Launch Day Checklist

### Feature Flags

```env
FF_MARKET_1_ENABLED=false          # Enable at launch
FF_CORRIDOR_AI_ADVISORY=true       # Already on
FF_TRUST_GATING=true               # Already on
FF_HUMAN_CONFIRMATION_CHECKPOINTS=true
FF_RATE_LIMITING_ENABLED=true
FF_ABUSE_GUARDS_ENABLED=true
FF_CORRIDOR_CAPS_ENABLED=true
FF_OPS_VISIBILITY_ENABLED=true
FF_EMERGENCY_DISABLE_ALL=false     # Must be off
```

### Ops Staffing

- [ ] Primary ops assigned
- [ ] Backup ops assigned
- [ ] Ops lead on-call
- [ ] Engineering on-call
- [ ] Escalation path confirmed

### Launch Sequence

1. Enable UK_AE corridor (lowest risk)
2. Wait 15 minutes, verify metrics
3. Enable FR_AE corridor
4. Wait 15 minutes, verify metrics
5. Enable UK_EG corridor
6. Wait 15 minutes, verify metrics
7. Enable DE_EG corridor
8. Wait 15 minutes, verify metrics
9. Set `FF_MARKET_1_ENABLED=true`

See: `docs/ops/MARKET_1_LAUNCH_CHECKLIST.md`

---

## 5. Metrics to Watch (Read-Only)

### Funnel Health

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Intent classification rate | >95% | 90-95% | <90% |
| Corridor assessment rate | >90% | 80-90% | <80% |
| Trust gating pass rate | >70% | 50-70% | <50% |
| Confirmation completion | >60% | 40-60% | <40% |

### Trust Friction

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Trust rejection rate | <20% | 20-40% | >40% |
| High-value rejection rate | <30% | 30-50% | >50% |
| Trust upgrade requests | <10/hour | 10-50/hour | >50/hour |

### System Health

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| API error rate | <1% | 1-5% | >5% |
| P95 latency | <1000ms | 1-3s | >3s |
| Corridor capacity | <70% | 70-90% | >90% |

---

## 6. Abort Conditions

### Exact Signals That Force Shutdown

| Signal | Threshold | Action |
|--------|-----------|--------|
| Trust rejection rate | >50% | **SHUTDOWN** |
| API error rate | >10% | **SHUTDOWN** |
| Manual kill switch | Activated | **SHUTDOWN** |
| Corridor capacity | 100% | THROTTLE |
| Abuse incidents | >5/hour | ALERT |
| Funnel drop | >30% below baseline | ALERT |
| P95 latency | >5000ms | ALERT |

### Shutdown Command

```bash
# Emergency kill switch
export FF_EMERGENCY_DISABLE_ALL=true

# Or Market 1 only
export FF_MARKET_1_ENABLED=false

# Apply
kubectl rollout restart deployment/crowdship-service
```

### Post-Abort Requirements

1. Notify all stakeholders
2. Document incident
3. Schedule post-mortem
4. Do NOT re-enable without review

---

## Files Created

### Backend
- `backend/services/crowdship-service/src/config/market-1-config.ts`
- `backend/services/crowdship-service/src/config/feature-flags.ts` (updated)

### Frontend
- `frontend/web/src/components/crowdship/Market1RiskBanner.tsx`
- `frontend/web/src/components/crowdship/TrustExplanationPanel.tsx`

### Ops Documentation
- `docs/ops/MARKET_1_LAUNCH_CHECKLIST.md`
- `docs/ops/MARKET_1_OPS_PLAYBOOK.md`

---

## Definition of Done

- [x] Market 1 product configuration (intents, flows)
- [x] Corridor-specific UX (risk banners, trust explanations)
- [x] Human ops playbooks (review flow, escalation path)
- [x] Launch day checklist (feature flags, ops staffing)
- [x] Metrics to watch (funnel health, trust friction)
- [x] Abort conditions (exact signals, shutdown commands)
- [x] Feature flag `FF_MARKET_1_ENABLED` added
- [x] No new user powers
- [x] No automation
- [x] No payments
- [x] Same principles as Market 0

## Sprint 4: COMPLETE ✅
