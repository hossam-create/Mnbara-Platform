# SPRINT 3: KILL SWITCH ARCHITECTURE
## Emergency Control Documentation

**Confidential & Privileged**
**Classification:** Critical Operational Control
**Sprint:** 3 — Ops & Safety
**Date:** December 18, 2025

---

## 1. Kill Switch Philosophy

```
┌─────────────────────────────────────────────────────────────┐
│  "THE ABILITY TO STOP IS AS IMPORTANT AS THE ABILITY TO GO."│
│                                                             │
│  Every AI feature must have an independent off switch.      │
│  Every corridor must be independently disableable.          │
│  The entire AI layer can be disconnected in < 5 minutes.    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Kill Switch Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         GLOBAL ADVISORY SHUTDOWN (GAS)              │   │
│  │         "Red Button" — All AI OFF                   │   │
│  │         Authority: CRO, CISO, CEO                   │   │
│  │         SLA: < 5 minutes                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│          ┌───────────────┼───────────────┐                  │
│          ▼               ▼               ▼                  │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐     │
│  │ CORRIDOR      │ │ CORRIDOR      │ │ CORRIDOR      │     │
│  │ SHUTDOWN      │ │ SHUTDOWN      │ │ SHUTDOWN      │     │
│  │ US → EG       │ │ US → UAE      │ │ EU → KSA      │     │
│  │               │ │               │ │               │     │
│  │ Authority:    │ │ Authority:    │ │ Authority:    │     │
│  │ Ops Manager   │ │ Ops Manager   │ │ Ops Manager   │     │
│  └───────────────┘ └───────────────┘ └───────────────┘     │
│          │               │               │                  │
│          ▼               ▼               ▼                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              FEATURE FLAG KILL SWITCHES             │   │
│  │                                                     │   │
│  │  ☐ risk_scoring_enabled                            │   │
│  │  ☐ trust_calculation_enabled                       │   │
│  │  ☐ smart_matching_enabled                          │   │
│  │  ☐ pricing_recommendations_enabled                 │   │
│  │  ☐ route_optimization_enabled                      │   │
│  │                                                     │   │
│  │  Authority: Tech Lead + Ops Manager                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Feature Flag Kill Switches

### 3.1 Flag Inventory

| Flag Name | Default | Fallback Behavior | Authority |
| :--- | :--- | :--- | :--- |
| `ai_risk_scoring_enabled` | TRUE | Route to manual review | Tech Lead |
| `ai_trust_scoring_enabled` | TRUE | Display "Trust Unknown" badge | Tech Lead |
| `ai_smart_matching_enabled` | TRUE | Show all travelers (unranked) | Product + Tech |
| `ai_pricing_hints_enabled` | TRUE | Hide pricing suggestions | Product |
| `ai_route_optimization_enabled` | TRUE | Show basic route info only | Product |
| `ai_fraud_detection_enabled` | TRUE | Increase manual sampling to 100% | Risk Officer |

### 3.2 Flag Behavior Specification

**When `ai_risk_scoring_enabled = FALSE`:**
```
┌─────────────────────────────────────────────────────────────┐
│  IF ai_risk_scoring_enabled = FALSE THEN                    │
│      risk_score = NULL                                      │
│      risk_level = "UNKNOWN"                                 │
│      routing = "MANUAL_REVIEW"                              │
│      ui_message = "This transaction requires manual review" │
│  END IF                                                     │
└─────────────────────────────────────────────────────────────┘
```

**When `ai_trust_scoring_enabled = FALSE`:**
```
┌─────────────────────────────────────────────────────────────┐
│  IF ai_trust_scoring_enabled = FALSE THEN                   │
│      trust_score = NULL                                     │
│      trust_badge = "UNKNOWN" (gray)                         │
│      trust_explanation = "Trust data temporarily unavailable"│
│      require_acknowledgment = TRUE                          │
│  END IF                                                     │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Flag Change Protocol

1. **Request:** Logged in incident management system
2. **Approval:** Dual approval (Tech Lead + Ops Manager)
3. **Execution:** Via admin dashboard or CLI
4. **Verification:** Confirm flag state change in monitoring
5. **Communication:** Notify affected teams via Slack/PagerDuty
6. **Documentation:** Log reason, time, approver in audit trail

---

## 4. Corridor-Level Shutdown

### 4.1 Corridor Definition

A "Corridor" is a directional trade route:
- `US → EG` (United States to Egypt)
- `US → UAE` (United States to UAE)
- `EU → KSA` (Europe to Saudi Arabia)

### 4.2 Shutdown Triggers

| Trigger | Severity | Auto/Manual |
| :--- | :--- | :--- |
| Fraud spike > 500% baseline | Critical | Auto-throttle, Manual shutdown |
| Regulatory order | Critical | Manual only |
| Payment provider outage | High | Auto-throttle |
| Customs/import ban | Critical | Manual only |
| Ops capacity exhausted | Medium | Manual |

### 4.3 Shutdown Procedure

```
┌─────────────────────────────────────────────────────────────┐
│  CORRIDOR SHUTDOWN PROCEDURE                                │
│                                                             │
│  1. DECISION: Ops Manager confirms shutdown needed          │
│  2. NOTIFY: Alert active users in corridor                  │
│  3. FREEZE: Stop new transaction creation                   │
│  4. PROTECT: Existing escrows remain protected              │
│  5. ROUTE: In-flight transactions to manual queue           │
│  6. DISPLAY: "This route is temporarily unavailable"        │
│  7. LOG: Record shutdown reason and timestamp               │
│  8. MONITOR: Track recovery conditions                      │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 User Experience During Shutdown

```
┌─────────────────────────────────────────────────────────────┐
│  📍 US → Egypt route temporarily unavailable                │
│                                                             │
│  We've paused this route while we resolve an issue.         │
│  Your existing orders are safe and will be processed.       │
│                                                             │
│  Try another route or check back later.                     │
│                                                             │
│  [ View other routes ]  [ Notify me when available ]        │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Global Advisory Shutdown (GAS)

### 5.1 Definition

The **Global Advisory Shutdown** is the "nuclear option" that disables ALL AI features across the entire platform simultaneously.

### 5.2 Triggers (Extremely Rare)

| Trigger | Authorization |
| :--- | :--- |
| Platform-wide security breach | CISO |
| Regulatory stop order | CEO + Legal |
| AI producing systemically wrong outputs | CRO |
| Coordinated multi-corridor attack | CRO + CISO |

### 5.3 Execution

**Method 1: Admin Dashboard**
```
Dashboard → Emergency Controls → Global Advisory Shutdown
→ Enter reason → Confirm with 2FA → Execute
```

**Method 2: Command Line (Break Glass)**
```
$ mnbara-ctl emergency --global-ai-shutdown --reason="[reason]" --user=[admin]
```

**Method 3: Physical Kill Switch (Data Center)**
```
Locate: Emergency Control Panel (Rack 42, Position A1)
Action: Turn key to "AI OFFLINE" position
Result: Immediate API disconnect
```

### 5.4 GAS Behavior

```
┌─────────────────────────────────────────────────────────────┐
│  GLOBAL ADVISORY SHUTDOWN ACTIVE                            │
│                                                             │
│  State Changes:                                             │
│  • All ai_* feature flags → FALSE                          │
│  • All risk scores → NULL (treat as UNKNOWN)               │
│  • All trust scores → NULL (treat as UNKNOWN)              │
│  • All AI recommendations → HIDDEN                         │
│  • All transactions → MANUAL REVIEW                        │
│                                                             │
│  Preserved:                                                 │
│  • Escrow protection (continues)                           │
│  • Core transaction flow (continues with manual review)    │
│  • User accounts (accessible)                              │
│  • Payment processing (continues with extra checks)        │
└─────────────────────────────────────────────────────────────┘
```

### 5.5 User Experience During GAS

```
┌─────────────────────────────────────────────────────────────┐
│  ℹ️ We're in maintenance mode                               │
│                                                             │
│  Some features are temporarily limited while we             │
│  perform important updates.                                 │
│                                                             │
│  • Your funds are safe in escrow                           │
│  • Your orders are being processed                         │
│  • Some features may take longer than usual                │
│                                                             │
│  We'll be back to normal soon.                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Manual Override Authority

### 6.1 Human Override Principle

```
┌─────────────────────────────────────────────────────────────┐
│  "A QUALIFIED HUMAN CAN ALWAYS OVERRIDE THE AI."            │
│                                                             │
│  No AI decision is final.                                   │
│  Every AI recommendation can be rejected.                   │
│  Human judgment supersedes algorithmic output.              │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Override Authority Matrix

| Override Type | Who Can Override | Logging Required |
| :--- | :--- | :--- |
| Reject AI risk flag | L1 Analyst | Reason code + note |
| Approve despite high risk | L2 Senior Officer | Reason + manager notification |
| Release escrow manually | L2 Senior Officer | Full justification |
| Unblock user account | L2 Senior Officer | Documentation required |
| Override trust badge | L2 Senior Officer | Reason + evidence |

### 6.3 Override Logging Requirements

Every override creates an immutable audit record:

```json
{
  "override_id": "OVR-2025-12-001234",
  "timestamp": "2025-12-18T18:30:00Z",
  "officer_id": "USR-ANALYST-042",
  "officer_name": "Sarah M.",
  "transaction_id": "TXN-2025-12-567890",
  "ai_recommendation": "HIGH_RISK",
  "officer_decision": "APPROVED",
  "reason_code": "FALSE_POSITIVE_VERIFIED",
  "justification": "Verified with customer via video call. Known repeat buyer.",
  "evidence_attached": true,
  "supervisor_notified": true
}
```

---

## 7. Kill Switch Testing Protocol

### 7.1 Scheduled Testing

| Test Type | Frequency | Scope |
| :--- | :--- | :--- |
| Feature flag toggle | Weekly | One non-critical flag |
| Corridor shutdown drill | Monthly | Staging environment |
| GAS simulation | Quarterly | Production (off-peak, with warning) |

### 7.2 Test Procedure

1. **Announce:** 24-hour notice to affected teams
2. **Execute:** Toggle kill switch
3. **Verify:** Confirm degradation behavior matches spec
4. **Restore:** Return to normal state
5. **Document:** Log test results and any issues

---

## 8. Recovery Procedures

### 8.1 Feature Flag Recovery

```
1. Confirm root cause resolved
2. Request flag re-enable (same approval as disable)
3. Enable flag in staging first
4. Verify behavior in staging
5. Enable flag in production
6. Monitor for 15 minutes
7. Confirm recovery complete
```

### 8.2 Corridor Recovery

```
1. Confirm issue resolved (fraud stopped, provider online)
2. Ops Manager approves reopening
3. Enable corridor at 10% capacity
4. Monitor for 1 hour
5. Increase to 50% capacity
6. Monitor for 1 hour
7. Increase to 100% capacity
8. Notify users route is available
```

### 8.3 GAS Recovery

```
1. Root cause confirmed resolved by CRO/CISO
2. CEO or CRO authorizes recovery
3. Enable AI features one by one (risk → trust → matching)
4. Each feature: staging test → production 10% → 50% → 100%
5. Full system health check
6. Incident post-mortem scheduled within 24 hours
```

---

## 9. Authority Summary

| Action | Authority | Backup Authority |
| :--- | :--- | :--- |
| Feature Flag Toggle | Tech Lead | Ops Manager |
| Corridor Shutdown | Ops Manager | Risk Officer |
| Corridor Recovery | Ops Manager | Risk Officer |
| GAS Activation | CRO, CISO, or CEO | Any two of the three |
| GAS Recovery | CRO or CEO | CISO + COO together |
| Manual Override | L2 Senior Officer | L3 Manager |

---
**Document Owner:** SRE Lead
**Security Review:** CISO
**Version:** 1.0 (Sprint 3)
