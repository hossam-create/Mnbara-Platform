# PAYMENTS KILL SWITCH POLICY
## Emergency Control Framework for Payment Advisory Layer

**Classification:** Regulatory — Binding
**Status:** Operational Policy
**Effective Date:** December 19, 2025
**Document Owner:** Chief Risk Officer

---

## 1. Purpose

This document defines the kill switch mechanisms for payment advisory features, including:

- Who can disable payment advisory functions
- Under what circumstances
- Response time requirements (SLA)
- Recovery procedures

---

## 2. Kill Switch Scope

### 2.1 What Kill Switches Control

| Kill Switch | Scope | Effect When OFF |
| :--- | :--- | :--- |
| `PAYMENT_ADVISORY_ENABLED` | All payment comparison/advisory | Show basic payment options only |
| `FX_DISPLAY_ENABLED` | Exchange rate display | Hide FX estimates |
| `PAYMENT_METHOD_COMPARISON_ENABLED` | Side-by-side comparison | List without comparison |
| `FEE_BREAKDOWN_ENABLED` | Detailed fee display | Show totals only |
| `PAYMENT_RISK_WARNINGS_ENABLED` | Risk warning banners | Hide advisory warnings |

### 2.2 What Kill Switches Do NOT Control

| Function | Status | Reason |
| :--- | :--- | :--- |
| Payment execution | NOT controlled | Partner function |
| Escrow fund release | NOT controlled | Partner function |
| Refund processing | NOT controlled | Partner function |
| Basic payment selection | NOT controlled | Core function |

Kill switches control **advisory/informational** layers only. Core payment functionality remains available.

---

## 3. Kill Switch Hierarchy

### 3.1 Global Payment Advisory Shutdown

**Trigger:** `PAYMENT_ADVISORY_ENABLED = FALSE`

**Effect:**
```
When PAYMENT_ADVISORY_ENABLED = FALSE:

• All comparison features disabled
• All FX rate displays disabled
• All fee breakdowns disabled
• All risk warnings disabled

Users see:
• Basic payment method list
• No comparison or recommendation
• "Complete payment with [Method]" (no details)

Partner payment flows: UNAFFECTED
```

### 3.2 Component-Level Kill Switches

| Component | Flag | Independent |
| :--- | :--- | :--- |
| FX Display | `FX_DISPLAY_ENABLED` | Yes |
| Comparison | `PAYMENT_METHOD_COMPARISON_ENABLED` | Yes |
| Fee Breakdown | `FEE_BREAKDOWN_ENABLED` | Yes |
| Risk Warnings | `PAYMENT_RISK_WARNINGS_ENABLED` | Yes |

Component kill switches can be toggled independently without affecting other components.

---

## 4. Authorization Matrix

### 4.1 Who Can Disable

| Kill Switch | Authorization Required | Backup Authority |
| :--- | :--- | :--- |
| Global Payment Advisory | CRO or General Counsel | CEO |
| FX Display | CRO or Compliance Officer | General Counsel |
| Comparison Features | CRO or Product Lead | General Counsel |
| Fee Breakdown | CRO or Product Lead | Compliance Officer |
| Risk Warnings | CRO only | General Counsel |

### 4.2 Who Can Re-Enable

| Kill Switch | Authorization Required |
| :--- | :--- |
| Global Payment Advisory | CRO + General Counsel (both required) |
| FX Display | CRO or Compliance Officer |
| Comparison Features | CRO or Product Lead |
| Fee Breakdown | CRO or Product Lead |
| Risk Warnings | CRO + Compliance Officer (both required) |

### 4.3 Emergency Override

In the event that authorized personnel are unavailable:

| Scenario | Override Authority |
| :--- | :--- |
| CRO unavailable | CEO may authorize |
| General Counsel unavailable | CEO may authorize |
| CEO unavailable | Board Chair may authorize |

All emergency overrides require:
- Documentation within 24 hours
- Review at next Board meeting

---

## 5. Trigger Conditions

### 5.1 Mandatory Kill Switch Triggers

The following conditions **REQUIRE** immediate kill switch activation:

| Trigger | Kill Switch | Response Time |
| :--- | :--- | :--- |
| Regulatory order to cease | Global | Immediate |
| Material legal violation discovered | Global | < 1 hour |
| Incorrect rates causing user harm | FX Display | < 30 minutes |
| Disclosure failure (systematic) | Risk Warnings | < 1 hour |
| Partner integration failure | Affected component | < 30 minutes |

### 5.2 Discretionary Kill Switch Triggers

The following conditions **MAY** trigger kill switch activation at CRO discretion:

| Trigger | Kill Switch | Assessment |
| :--- | :--- | :--- |
| Elevated user complaints | Any | CRO judgment |
| Partner uncertainty | Affected component | CRO judgment |
| Regulatory inquiry pending | Any | CRO + Legal judgment |
| Security concern | Any | CISO + CRO judgment |

---

## 6. Response Time SLA

### 6.1 Activation SLA

| Trigger Type | Maximum Response Time |
| :--- | :--- |
| Regulatory order | Immediate (< 15 minutes) |
| Legal/compliance emergency | < 1 hour |
| User harm detected | < 30 minutes |
| Partner failure | < 30 minutes |
| Discretionary | < 4 hours |

### 6.2 Verification SLA

After activation:

| Verification | Timeline |
| :--- | :--- |
| Confirm kill switch active | < 5 minutes |
| Verify user-facing effect | < 15 minutes |
| Notify affected teams | < 30 minutes |
| Document activation | < 2 hours |

---

## 7. Activation Procedure

### 7.1 Standard Activation

```
KILL SWITCH ACTIVATION PROCEDURE

1. AUTHORIZE
   □ Obtain authorization from appropriate authority
   □ Document reason and authorizer
   
2. ACTIVATE
   □ Access admin dashboard or CLI
   □ Set flag to FALSE
   □ Confirm change saved
   
3. VERIFY
   □ Check flag status in monitoring
   □ Verify user-facing experience changed
   □ Test from user perspective
   
4. NOTIFY
   □ Notify Product Lead
   □ Notify Engineering Lead
   □ Notify Support Team
   □ Update status page (if user-facing impact)
   
5. DOCUMENT
   □ Log in incident management system
   □ Record: Who, What, When, Why
   □ Attach authorization evidence
```

### 7.2 Emergency Activation

```
EMERGENCY ACTIVATION (Regulatory Order)

1. ACTIVATE IMMEDIATELY
   □ Do not wait for full authorization chain
   □ Any authorized person may activate
   
2. NOTIFY SIMULTANEOUSLY
   □ Alert CRO, CEO, General Counsel
   □ Use emergency contact methods
   
3. DOCUMENT WITHIN 24 HOURS
   □ Full incident documentation
   □ Authorization confirmation retroactive
```

---

## 8. Recovery Procedure

### 8.1 Pre-Recovery Checklist

Before re-enabling any kill switch:

```
PRE-RECOVERY CHECKLIST

□ Root cause identified and documented
□ Fix implemented and tested
□ Legal/Compliance review completed
□ Authorization from required parties obtained
□ Rollback plan confirmed
□ Monitoring in place for re-activation issues
```

### 8.2 Recovery Procedure

```
KILL SWITCH RECOVERY PROCEDURE

1. AUTHORIZE
   □ Obtain authorization (see Section 4.2)
   □ Document approval

2. TEST
   □ Enable in staging environment
   □ Verify correct behavior
   □ Verify no recurrence of issue

3. ENABLE
   □ Enable at 10% traffic (if capability exists)
   □ Monitor for 1 hour
   □ Enable at 50% traffic
   □ Monitor for 1 hour
   □ Enable at 100% traffic

4. MONITOR
   □ Watch for issue recurrence
   □ Monitor user feedback
   □ Monitor support tickets

5. DOCUMENT
   □ Close incident
   □ Document lessons learned
   □ Update procedures if needed
```

---

## 9. Audit Requirements

### 9.1 Kill Switch Audit Log

All kill switch changes are logged with:

| Field | Requirement |
| :--- | :--- |
| Timestamp | UTC, millisecond precision |
| Actor | User ID of person making change |
| Action | Enable/Disable |
| Flag | Which kill switch |
| Reason | Text description |
| Authorization | Reference to approval |

### 9.2 Log Retention

| Log Type | Retention Period |
| :--- | :--- |
| Kill switch changes | 7 years |
| Authorization records | 7 years |
| Incident documentation | 7 years |

### 9.3 Audit Access

| Role | Access |
| :--- | :--- |
| Internal Audit | Full access |
| External Auditors | Upon engagement |
| Regulators | Upon request |

---

## 10. Testing Requirements

### 10.1 Kill Switch Testing

| Test Type | Frequency | Owner |
| :--- | :--- | :--- |
| Functionality test (staging) | Monthly | Engineering |
| Activation drill (production) | Quarterly | SRE |
| Recovery drill | Quarterly | SRE |
| Authorization verification | Annually | Compliance |

### 10.2 Test Documentation

Each test must document:
- Date and time
- Participants
- Procedure followed
- Results
- Issues identified
- Remediation actions

---

## 11. Attestation

```
This policy has been reviewed and approved by:

Chief Risk Officer:          _______________________  Date: _______
Chief Technology Officer:    _______________________  Date: _______
General Counsel:             _______________________  Date: _______
Chief Executive Officer:     _______________________  Date: _______
```

---
**Document Version:** 1.0
**Next Review:** June 2026
**Classification:** Regulatory — Binding
