# SPRINT 3: FAILURE MODES & DEGRADATION STRATEGY
## Operational Safety Documentation

**Confidential & Privileged**
**Classification:** Operational Resilience
**Sprint:** 3 — Ops & Safety
**Date:** December 18, 2025

---

## 1. Executive Summary

This document defines all recognized failure modes for the AI Trust & Risk Operating System and prescribes the degradation strategy for each. The core principle is:

```
┌─────────────────────────────────────────────────────────────┐
│  "WHEN IN DOUBT, FAIL TO HUMAN."                           │
│                                                             │
│  The system never fails to autonomous action.              │
│  The system never fails to silence.                        │
│  The system always fails to explicit human control.        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Failure Mode Inventory

### 2.1 FM-001: AI Service Unavailable

**Description:** The AI Risk/Trust inference API is unreachable or timing out.

**Detection:**
- Health check fails (3 consecutive pings @ 5s interval)
- Response latency > 500ms
- HTTP 5xx response codes

**Impact:**
- No risk scores available
- No trust calculations
- No AI recommendations

**Degradation Response:**
```
┌─────────────────────────────────────────────────────────────┐
│  AI OFF → MANUAL FLOW                                       │
│                                                             │
│  1. Circuit breaker OPENS                                   │
│  2. All transactions route to MANUAL REVIEW QUEUE           │
│  3. UI displays: "AI assistance temporarily unavailable"    │
│  4. Human officers process queue with legacy rules          │
│  5. Monitoring alerts Ops team                              │
└─────────────────────────────────────────────────────────────┘
```

**User Experience:**
| Screen | Message |
| :--- | :--- |
| Buyer Match | "We're experiencing technical issues. Your request will be reviewed by our team." |
| Traveler Offer | "Trust verification is temporarily delayed. You can proceed, but confirmation may take longer." |

**SLA:** Detection < 30s, Failover < 60s

---

### 2.2 FM-002: Partial Data — Trust Score Missing

**Description:** User record exists but Trust Score calculation fails or returns null.

**Detection:**
- `trust_score` field is null or undefined
- Trust service returns partial response
- Data inconsistency flag raised

**Impact:**
- Cannot display Trust Level for user
- Cannot make trust-based recommendations

**Degradation Response:**
```
┌─────────────────────────────────────────────────────────────┐
│  TRUST UNKNOWN → BLOCK WITH EXPLANATION                     │
│                                                             │
│  1. Display UNKNOWN TRUST badge (gray)                      │
│  2. Show explanation: "Trust data not available"            │
│  3. Require EXPLICIT user acknowledgment to proceed         │
│  4. Log event for investigation                             │
│  5. Notify data ops if pattern emerges                      │
└─────────────────────────────────────────────────────────────┘
```

**User Experience:**
```
┌─────────────────────────────────────────────────────────────┐
│  ⚪ TRUST UNKNOWN                                           │
│                                                             │
│  We couldn't verify this user's trust score right now.      │
│  This might be temporary.                                   │
│                                                             │
│  You can still proceed, but please be extra careful.        │
│  Consider using escrow protection.                          │
│                                                             │
│  [ Go Back ]  [ I Understand, Continue ]                    │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.3 FM-003: Partial Data — Risk Score Missing

**Description:** Transaction cannot be risk-scored due to missing input data or model failure.

**Detection:**
- `risk_score` returns null
- Input validation fails
- Model inference throws exception

**Impact:**
- Cannot assess transaction risk level
- Cannot apply risk-based routing

**Degradation Response:**
```
┌─────────────────────────────────────────────────────────────┐
│  RISK UNKNOWN → DEFAULT SAFE WARNING                        │
│                                                             │
│  1. Treat as HIGH RISK (conservative default)               │
│  2. Display warning banner                                  │
│  3. Route to MANUAL REVIEW                                  │
│  4. DO NOT auto-approve under any circumstance              │
│  5. Log for model investigation                             │
└─────────────────────────────────────────────────────────────┘
```

**User Experience:**
```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ ADDITIONAL REVIEW REQUIRED                              │
│                                                             │
│  We need more time to verify this transaction.              │
│  Your funds will remain in escrow until review completes.   │
│                                                             │
│  Expected review time: 2-4 hours                            │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.4 FM-004: Corridor Overload

**Description:** A specific trade corridor (e.g., US→EG) experiences volume spike beyond processing capacity.

**Detection:**
- Queue depth > threshold (e.g., 500 pending)
- Average processing time > 2x baseline
- Manual review backlog > 4 hours

**Impact:**
- Delayed match confirmations
- Delayed trust verifications
- User experience degradation

**Degradation Response:**
```
┌─────────────────────────────────────────────────────────────┐
│  CORRIDOR OVERLOAD → THROTTLE + TRANSPARENCY                │
│                                                             │
│  1. Rate limit new requests for affected corridor           │
│  2. Display honest wait time estimates                      │
│  3. Offer alternative corridors (if available)              │
│  4. Pause non-essential AI features (recommendations)       │
│  5. Prioritize safety-critical flows (escrow, disputes)     │
└─────────────────────────────────────────────────────────────┘
```

**User Experience:**
```
┌─────────────────────────────────────────────────────────────┐
│  📍 High demand on US → Egypt route                         │
│                                                             │
│  This route is busier than usual right now.                 │
│  Estimated processing time: 6-8 hours                       │
│                                                             │
│  [ Check other routes ]  [ Continue anyway ]                │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.5 FM-005: Suspicious Behavior Spike

**Description:** Anomaly detection triggers indicating potential coordinated attack, fraud ring, or system abuse.

**Detection:**
- Fraud score distribution shifts > 2 SD
- Cluster of high-risk flags in short window
- Unusual geographic or velocity patterns
- Manual reports spike

**Impact:**
- Potential ongoing fraud event
- Legitimate users may be affected by tighter controls

**Degradation Response:**
```
┌─────────────────────────────────────────────────────────────┐
│  SUSPICIOUS SPIKE → ELEVATED CAUTION MODE                   │
│                                                             │
│  1. ALERT: Risk Officer + CISO notified immediately         │
│  2. Auto-tighten thresholds (HIGH RISK > 70 instead of 80) │
│  3. Increase manual review sampling (100% of flagged)       │
│  4. Enable "cooling off" for new account actions            │
│  5. Prepare for potential corridor shutdown                 │
└─────────────────────────────────────────────────────────────┘
```

**User Experience:**
- No visible change initially (invisible tightening)
- If user is flagged: "Additional verification required"
- Legitimate users should not notice unless individually affected

---

### 2.6 FM-006: Manual Operations Overload

**Description:** Human review queue exceeds officer capacity, causing dangerous backlog.

**Detection:**
- Queue depth > 8-hour processing capacity
- Officer utilization > 95%
- Average case age > 4 hours

**Impact:**
- User experience degrades (long waits)
- Risk of rushing reviews (quality drops)
- Escrow release delays

**Degradation Response:**
```
┌─────────────────────────────────────────────────────────────┐
│  OPS OVERLOAD → PRIORITIZE + COMMUNICATE                    │
│                                                             │
│  1. Triage queue by severity (disputes > new users > rest)  │
│  2. Enable auto-clear for LOW RISK (score < 20)             │
│  3. Extend SLAs with transparent user communication         │
│  4. Escalate to management for staffing decision            │
│  5. Consider temporary corridor throttling                  │
└─────────────────────────────────────────────────────────────┘
```

**Auto-Clear Criteria (only during overload):**
| Condition | Auto-Clear Allowed |
| :--- | :--- |
| Risk Score < 20 | ✅ Yes |
| Trust Score > 90 | ✅ Yes |
| Transaction Value < $100 | ✅ Yes |
| ALL conditions met | ✅ Auto-clear with audit log |
| ANY condition not met | ❌ Manual review required |

---

## 3. Degradation Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│  LEVEL 0: NOMINAL                                           │
│  All systems operational. AI advisory active.               │
├─────────────────────────────────────────────────────────────┤
│  LEVEL 1: DEGRADED                                          │
│  Some AI features limited. Core flows operational.          │
├─────────────────────────────────────────────────────────────┤
│  LEVEL 2: MANUAL MODE                                       │
│  AI offline. Human officers process all transactions.       │
├─────────────────────────────────────────────────────────────┤
│  LEVEL 3: CORRIDOR SHUTDOWN                                 │
│  Specific routes disabled. Other routes operational.        │
├─────────────────────────────────────────────────────────────┤
│  LEVEL 4: GLOBAL ADVISORY SHUTDOWN                          │
│  All AI features disabled. Platform in manual-only mode.    │
├─────────────────────────────────────────────────────────────┤
│  LEVEL 5: PLATFORM MAINTENANCE                              │
│  All transactions paused. Escrow protected. Ops only.       │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Summary Matrix

| Failure Mode | Detection Time | Degradation Level | Recovery Owner |
| :--- | :--- | :--- | :--- |
| FM-001: AI Unavailable | < 30s | Level 2 | SRE |
| FM-002: Trust Missing | Immediate | Level 1 | Data Ops |
| FM-003: Risk Missing | Immediate | Level 2 | Data Ops |
| FM-004: Corridor Overload | < 5 min | Level 1-3 | Ops Manager |
| FM-005: Suspicious Spike | < 1 min | Level 1-3 | Risk Officer |
| FM-006: Manual Overload | < 15 min | Level 1 | Ops Manager |

---
**Document Owner:** SRE Lead
**Review:** Risk Committee
**Version:** 1.0 (Sprint 3)
