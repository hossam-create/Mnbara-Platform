# SPRINT 3: INCIDENT RESPONSE PLAYBOOKS
## Operational Emergency Procedures

**Confidential & Privileged**
**Classification:** Critical Operational Procedures
**Sprint:** 3 — Ops & Safety
**Date:** December 18, 2025

---

## 1. Playbook Philosophy

```
┌─────────────────────────────────────────────────────────────┐
│  "WHEN AN INCIDENT OCCURS, PEOPLE DON'T RISE TO THE        │
│   OCCASION. THEY FALL TO THEIR LEVEL OF TRAINING."         │
│                                                             │
│  These playbooks exist so that at 3 AM, under stress,       │
│  the responder knows exactly what to do.                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Incident Severity Levels

| Severity | Definition | Response Time | Escalation |
| :--- | :--- | :--- | :--- |
| **SEV-1** | Platform down or major security breach | < 15 min | Immediate exec notification |
| **SEV-2** | Critical feature offline or fraud event | < 30 min | Ops Manager + Risk Officer |
| **SEV-3** | Degraded performance or partial outage | < 2 hours | On-call engineer |
| **SEV-4** | Minor issue, workaround available | < 24 hours | Standard ticket |

---

## 3. Playbook Index

| ID | Playbook Name | Trigger | Severity |
| :--- | :--- | :--- | :--- |
| PB-001 | AI Service Down | Health check failure | SEV-2 |
| PB-002 | Fraud Ring Detected | Anomaly detection alert | SEV-2 |
| PB-003 | Escrow System Failure | Payment service error | SEV-1 |
| PB-004 | Mass False Positives | Override rate spike | SEV-2 |
| PB-005 | Data Breach Suspected | Security alert | SEV-1 |
| PB-006 | Corridor Overwhelm | Queue depth exceeded | SEV-3 |

---

## PLAYBOOK PB-001: AI SERVICE DOWN

### Trigger
- Health check fails 3 consecutive times
- AI API returns 5xx errors
- Inference latency > 500ms for 5 minutes

### Severity: SEV-2

### Incident Commander: On-Call SRE

### Step-by-Step Response

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: DETECT & CONFIRM (0-5 minutes)                    │
├─────────────────────────────────────────────────────────────┤
│  □ Confirm alert is not false positive (check dashboards)  │
│  □ Verify health check from multiple locations             │
│  □ Check recent deployments or changes                     │
│  □ Declare incident in #incident-response channel          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: CONTAIN (5-15 minutes)                            │
├─────────────────────────────────────────────────────────────┤
│  □ ACTIVATE CIRCUIT BREAKER                                │
│    → Set ai_risk_scoring_enabled = FALSE                   │
│    → Set ai_trust_scoring_enabled = FALSE                  │
│  □ Verify fallback to manual queue is working              │
│  □ Notify Ops Manager                                      │
│  □ Update status page: "AI features temporarily limited"   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 3: DIAGNOSE (15-60 minutes)                          │
├─────────────────────────────────────────────────────────────┤
│  □ Check AI service logs for errors                        │
│  □ Check infrastructure (CPU, memory, network)             │
│  □ Check dependency services (database, cache)             │
│  □ If recent deployment: consider rollback                 │
│  □ Document findings in incident ticket                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 4: RESOLVE (variable)                                │
├─────────────────────────────────────────────────────────────┤
│  □ Apply fix OR perform rollback                           │
│  □ Verify AI service responding normally                   │
│  □ Re-enable feature flags (staging first)                 │
│  □ Monitor for 15 minutes                                  │
│  □ Re-enable feature flags (production)                    │
│  □ Update status page: "All systems operational"           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 5: POST-INCIDENT (within 24 hours)                   │
├─────────────────────────────────────────────────────────────┤
│  □ Complete incident report                                │
│  □ Schedule post-mortem meeting                            │
│  □ Identify action items to prevent recurrence             │
│  □ Update runbooks if needed                               │
└─────────────────────────────────────────────────────────────┘
```

### What Gets Disabled
- AI risk scoring
- AI trust scoring
- Smart matching recommendations
- Pricing hints

### What Continues
- Core transaction flow (manual)
- Escrow protection
- User authentication
- Payment processing

---

## PLAYBOOK PB-002: FRAUD RING DETECTED

### Trigger
- Anomaly detection: fraud score spike > 300%
- Cluster of related high-risk accounts
- Multiple manual fraud reports in short window
- Pattern matches known attack signature

### Severity: SEV-2

### Incident Commander: Risk Officer (Fraud Lead)

### Step-by-Step Response

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: DETECT & CONFIRM (0-10 minutes)                   │
├─────────────────────────────────────────────────────────────┤
│  □ Review anomaly detection dashboard                      │
│  □ Confirm pattern is real (not data glitch)               │
│  □ Identify affected corridor(s)                           │
│  □ Estimate scale (number of accounts, transactions)       │
│  □ Declare incident in #fraud-alerts channel               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: CONTAIN (10-30 minutes)                           │
├─────────────────────────────────────────────────────────────┤
│  □ TIGHTEN THRESHOLDS                                      │
│    → Lower HIGH_RISK threshold (80 → 65)                   │
│    → Increase manual review sampling to 100%               │
│  □ FREEZE suspected accounts (temporary hold)              │
│  □ PAUSE new account creation in affected corridor         │
│  □ ALERT payment provider (potential chargeback wave)      │
│  □ Notify Ops Manager and CISO                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 3: INVESTIGATE (30 minutes - 4 hours)                │
├─────────────────────────────────────────────────────────────┤
│  □ Map the fraud network (linked accounts, devices, IPs)   │
│  □ Identify entry point (how did they get in?)             │
│  □ Assess financial exposure (funds at risk)               │
│  □ Coordinate with payment provider on holds               │
│  □ Prepare evidence package for potential law enforcement  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 4: REMEDIATE (variable)                              │
├─────────────────────────────────────────────────────────────┤
│  □ Permanently ban confirmed fraud accounts                │
│  □ Update fraud detection rules with new patterns          │
│  □ Process refunds for affected legitimate users           │
│  □ Gradually relax thresholds (65 → 70 → 75 → 80)         │
│  □ Re-enable new account creation                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 5: POST-INCIDENT (within 48 hours)                   │
├─────────────────────────────────────────────────────────────┤
│  □ Complete fraud incident report                          │
│  □ Calculate total financial impact                        │
│  □ File SAR (Suspicious Activity Report) if required       │
│  □ Update fraud playbook with learnings                    │
│  □ Consider corridor-specific rule improvements            │
└─────────────────────────────────────────────────────────────┘
```

### What Gets Disabled
- New account creation (affected corridor)
- Auto-clear for low risk (100% manual)
- Promotional features (reduced visibility)

### What Continues
- Existing user transactions (with higher scrutiny)
- Escrow protection (enhanced)
- Other corridors (if not affected)

---

## PLAYBOOK PB-003: ESCROW SYSTEM FAILURE

### Trigger
- Payment service returns errors
- Escrow balance reconciliation fails
- Fund release/hold operations failing

### Severity: SEV-1 (CRITICAL)

### Incident Commander: CFO or Finance Lead + SRE Lead

### Step-by-Step Response

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: DETECT & CONFIRM (0-5 minutes)                    │
├─────────────────────────────────────────────────────────────┤
│  □ ⚠️ IMMEDIATE ALERT: CFO, CEO, CISO                      │
│  □ Confirm payment service status                          │
│  □ Check bank/processor status pages                       │
│  □ Verify escrow balance integrity                         │
│  □ Declare SEV-1 incident                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: CONTAIN (5-15 minutes)                            │
├─────────────────────────────────────────────────────────────┤
│  □ FREEZE ALL NEW ESCROW CREATION                          │
│  □ FREEZE ALL ESCROW RELEASES                              │
│  □ Existing escrows: PROTECTED (funds stay locked)         │
│  □ Display: "Payments temporarily unavailable"             │
│  □ Prepare customer communication draft                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 3: DIAGNOSE (15-60 minutes)                          │
├─────────────────────────────────────────────────────────────┤
│  □ Is this our system or payment provider?                 │
│  □ Contact payment provider emergency line                 │
│  □ Check for data integrity issues                         │
│  □ Prepare manual reconciliation if needed                 │
│  □ Legal: Assess disclosure obligations                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 4: RESOLVE (variable)                                │
├─────────────────────────────────────────────────────────────┤
│  □ Confirm payment service restored                        │
│  □ Run full reconciliation                                 │
│  □ Enable escrow creation (test transactions first)        │
│  □ Enable escrow release (manual approval for 24 hours)    │
│  □ Clear backlog with extra staffing                       │
│  □ Customer communication: "Services restored"             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 5: POST-INCIDENT (within 24 hours)                   │
├─────────────────────────────────────────────────────────────┤
│  □ Full audit of all transactions during incident          │
│  □ Customer impact assessment                              │
│  □ Regulatory notification if required                     │
│  □ Root cause analysis                                     │
│  □ Improve redundancy/monitoring                           │
└─────────────────────────────────────────────────────────────┘
```

### What Gets Disabled
- New escrow creation
- Escrow release
- New transaction initiation

### What Continues
- User login and browsing
- Existing escrow protection (locked, safe)
- Support and communication

---

## PLAYBOOK PB-004: MASS FALSE POSITIVES

### Trigger
- Override rate spikes > 50% (normal: ~15%)
- Customer complaints spike
- Support tickets about "blocked for no reason"
- Model drift alert triggered

### Severity: SEV-2

### Incident Commander: Risk Officer + Data Science Lead

### Step-by-Step Response

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: DETECT & CONFIRM (0-15 minutes)                   │
├─────────────────────────────────────────────────────────────┤
│  □ Review override rate dashboard                          │
│  □ Sample 10 recent overrides - are they legitimate FPs?   │
│  □ Check for data feed issues (stale data? wrong data?)    │
│  □ Check for recent model or threshold changes             │
│  □ Declare incident if confirmed                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: CONTAIN (15-30 minutes)                           │
├─────────────────────────────────────────────────────────────┤
│  □ RAISE HIGH_RISK threshold (80 → 90) to reduce flags     │
│  □ OR disable problematic feature (if identified)          │
│  □ Increase manual review capacity (all hands)             │
│  □ Prepare customer apology message template               │
│  □ Notify Ops Manager                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 3: DIAGNOSE (30 minutes - 2 hours)                   │
├─────────────────────────────────────────────────────────────┤
│  □ Was there a bad deployment? (Check: Rollback?)          │
│  □ Was there a data feed issue? (Check: Fix source?)       │
│  □ Was there model drift? (Check: Retrain needed?)         │
│  □ Was there a threshold misconfiguration?                 │
│  □ Document root cause                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 4: RESOLVE (variable)                                │
├─────────────────────────────────────────────────────────────┤
│  □ Apply fix (rollback, data fix, threshold correction)    │
│  □ Verify FP rate returning to normal                      │
│  □ Gradually restore thresholds (90 → 85 → 80)            │
│  □ Process apology communications to affected users        │
│  □ Consider compensation for severely impacted users       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 5: POST-INCIDENT (within 48 hours)                   │
├─────────────────────────────────────────────────────────────┤
│  □ Count affected users and transactions                   │
│  □ Document financial/reputational impact                  │
│  □ Improve monitoring to catch earlier                     │
│  □ Add regression test for this failure mode               │
└─────────────────────────────────────────────────────────────┘
```

---

## PLAYBOOK PB-005: DATA BREACH SUSPECTED

### Trigger
- Security monitoring alert
- Unusual data access patterns
- External report of leaked data
- Employee report of suspicious activity

### Severity: SEV-1 (CRITICAL)

### Incident Commander: CISO

### Step-by-Step Response

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: DETECT & CONFIRM (0-15 minutes)                   │
├─────────────────────────────────────────────────────────────┤
│  □ ⚠️ IMMEDIATE ALERT: CISO, CEO, Legal                    │
│  □ Assess: Is this real or false positive?                 │
│  □ Preserve evidence (do not delete logs)                  │
│  □ Identify scope: What data? How much? How long?          │
│  □ Declare SEV-1 security incident                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: CONTAIN (15-60 minutes)                           │
├─────────────────────────────────────────────────────────────┤
│  □ REVOKE compromised credentials immediately              │
│  □ ISOLATE affected systems (if possible without downtime) │
│  □ BLOCK suspicious IP addresses/actors                    │
│  □ Consider: GLOBAL ADVISORY SHUTDOWN if AI compromised    │
│  □ Engage external security firm if needed                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 3: INVESTIGATE (hours to days)                       │
├─────────────────────────────────────────────────────────────┤
│  □ Forensic analysis of access logs                        │
│  □ Determine: Entry point, duration, data accessed         │
│  □ Prepare regulatory notification (GDPR: 72 hours)        │
│  □ Prepare customer notification draft                     │
│  □ Coordinate with law enforcement if criminal             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 4: REMEDIATE (days to weeks)                         │
├─────────────────────────────────────────────────────────────┤
│  □ Patch vulnerability                                     │
│  □ Reset all potentially affected credentials              │
│  □ Notify affected customers                               │
│  □ File regulatory reports                                 │
│  □ Offer credit monitoring if PII exposed                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 5: POST-INCIDENT (within 1 week)                     │
├─────────────────────────────────────────────────────────────┤
│  □ Full security audit                                     │
│  □ External penetration test                               │
│  □ Policy and procedure review                             │
│  □ Board briefing                                          │
│  □ Consider public transparency report                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Escalation Matrix

| Condition | Notify | Within |
| :--- | :--- | :--- |
| SEV-1 declared | CEO, CFO, CISO | Immediately |
| SEV-2 declared | Ops Manager, Risk Officer | 15 minutes |
| Incident > 2 hours | Department heads | 2 hours |
| Customer data involved | Legal, DPO | Immediately |
| Financial exposure > $10K | CFO | 30 minutes |
| Regulatory implication | Legal, Compliance | Immediately |

---

## 5. Communication Templates

### Internal Incident Declaration
```
🚨 INCIDENT DECLARED
Severity: [SEV-1/2/3]
Type: [AI Down / Fraud / Escrow / etc.]
Incident Commander: [Name]
Status Channel: #incident-[id]
Current Status: [Investigating / Containing / Resolving]
ETA: [If known]
```

### External Status Page
```
[Investigating] We're investigating reports of [issue].
[Identified] We've identified the issue and are working on a fix.
[Monitoring] A fix has been implemented. We're monitoring the results.
[Resolved] This incident has been resolved.
```

---

## 6. Recovery Verification Checklist

Before closing any incident:

- [ ] Root cause identified and documented
- [ ] Fix verified in staging
- [ ] Fix deployed to production
- [ ] Monitoring confirms normal operation for 15+ minutes
- [ ] Affected users notified (if applicable)
- [ ] Status page updated to "Resolved"
- [ ] Incident ticket closed with full documentation
- [ ] Post-mortem scheduled (SEV-1/2 only)

---
**Document Owner:** Incident Management Lead
**Security Review:** CISO
**Version:** 1.0 (Sprint 3)
