# BANK INTEGRATION BOUNDARIES
## Partner Responsibility Framework

**Classification:** Regulatory — Binding
**Status:** Operational Policy
**Effective Date:** December 19, 2025
**Document Owner:** Chief Risk Officer

---

## 1. Purpose

This document defines the boundaries between Platform responsibilities and Banking/Payment Partner responsibilities. The purpose is to:

- Establish clear liability separation
- Define what the Platform will **NEVER** do
- Specify what partners **MUST** handle
- Ensure regulatory clarity for all parties

---

## 2. What The Platform NEVER Does

### 2.1 Payment Processing

| Activity | Platform Role |
| :--- | :--- |
| Accept customer deposits | **NEVER** |
| Hold customer funds | **NEVER** |
| Process card payments | **NEVER** |
| Debit bank accounts | **NEVER** |
| Credit bank accounts | **NEVER** |
| Issue refunds | **NEVER** (partner instruction only) |

### 2.2 Currency Operations

| Activity | Platform Role |
| :--- | :--- |
| Execute foreign exchange | **NEVER** |
| Set exchange rates | **NEVER** |
| Hold foreign currency | **NEVER** |
| Guarantee exchange rates | **NEVER** |
| Provide FX hedging | **NEVER** |

### 2.3 Credential Handling

| Activity | Platform Role |
| :--- | :--- |
| Store credit card numbers | **NEVER** |
| Store CVV/CVC codes | **NEVER** |
| Store bank account numbers | **NEVER** (tokenized references only) |
| Access customer bank accounts | **NEVER** |
| Store authentication credentials | **NEVER** |

### 2.4 Financial Services

| Activity | Platform Role |
| :--- | :--- |
| Provide credit/loans | **NEVER** |
| Offer insurance products | **NEVER** |
| Provide investment advice | **NEVER** |
| Manage customer wealth | **NEVER** |
| Issue payment cards | **NEVER** |

---

## 3. What Partners MUST Handle

### 3.1 Payment Partner Responsibilities

| Responsibility | Partner Obligation |
| :--- | :--- |
| Payment processing | Full ownership |
| PCI DSS compliance | Required certification |
| Card data security | Full liability |
| Chargeback handling | Full ownership |
| Fraud detection on payments | Partner responsibility |
| Refund processing | Partner execution |
| Settlement with merchants | Partner responsibility |

### 3.2 Escrow Partner Responsibilities

| Responsibility | Partner Obligation |
| :--- | :--- |
| Fund custody | Regulated escrow holder |
| Fund segregation | Separate from operating funds |
| Interest handling | Per applicable law |
| Release authorization | Based on Platform instruction |
| Dispute fund freezing | Per escrow agreement |
| Regulatory reporting | Partner responsibility |

### 3.3 FX Partner Responsibilities

| Responsibility | Partner Obligation |
| :--- | :--- |
| Rate quotation | Partner provides rates |
| Rate execution | Partner executes |
| FX risk management | Partner responsibility |
| Regulatory licensing | Partner must be licensed |
| Settlement | Partner responsibility |

### 3.4 Compliance Responsibilities

| Responsibility | Partner Obligation |
| :--- | :--- |
| AML/KYC on transactions | Partner responsibility |
| Sanctions screening | Partner responsibility |
| Suspicious activity reporting | Partner responsibility |
| Regulatory reporting | Partner responsibility |
| License maintenance | Partner responsibility |

---

## 4. Liability Separation Matrix

### 4.1 Clear Liability Assignment

| Event | Platform Liability | Partner Liability |
| :--- | :--- | :--- |
| Incorrect payment display | ✓ | - |
| Payment processing failure | - | ✓ |
| Fraudulent transaction | - | ✓ |
| Chargeback dispute | - | ✓ |
| Escrow fund loss | - | ✓ |
| FX rate discrepancy | - | ✓ |
| AML violation | - | ✓ |
| Data breach (payment data) | - | ✓ |
| Data breach (user profile) | ✓ | - |
| Incorrect fee display | ✓ | - |
| Incorrect rate display | Joint (source attribution) | Joint |

### 4.2 Joint Liability Scenarios

In cases of joint liability:
1. Platform liable for information accuracy as displayed
2. Partner liable for execution accuracy
3. Responsibility determined by source of error

---

## 5. Data Flow Boundaries

### 5.1 What Platform Sends to Partners

| Data Type | Allowed | Format |
| :--- | :--- | :--- |
| Transaction amount | Yes | Numeric |
| Currency requested | Yes | ISO code |
| User reference ID | Yes | Tokenized |
| Transaction purpose | Yes | Category code |
| Escrow instruction | Yes | Instruction code |

### 5.2 What Platform NEVER Sends

| Data Type | Status |
| :--- | :--- |
| Full user name | **NEVER** (unless required by partner) |
| Social security number | **NEVER** |
| Bank login credentials | **NEVER** |
| Card details | **NEVER** (direct to partner) |

### 5.3 What Partners Send to Platform

| Data Type | Purpose |
| :--- | :--- |
| Transaction ID | Reference |
| Status updates | Display to user |
| Failure codes | Error messaging |
| Indicative rates | Display only |
| Fee schedules | Display only |

---

## 6. Integration Constraints

### 6.1 API Boundaries

| Integration Type | Allowed | Prohibited |
| :--- | :--- | :--- |
| Payment initiation redirect | ✓ | - |
| Payment status query | ✓ | - |
| Direct card processing | - | ✓ |
| Direct debit initiation | - | ✓ |
| Open Banking access | - | ✓ |

### 6.2 Session Handling

| Scenario | Requirement |
| :--- | :--- |
| Payment authentication | Occurs on partner domain |
| 3D Secure | Partner handles entirely |
| Bank redirect | User authenticates with bank directly |
| Session return | Platform receives status only |

---

## 7. Partner Selection Criteria

### 7.1 Mandatory Requirements

| Requirement | Verification |
| :--- | :--- |
| Licensed in operating jurisdiction | License verification |
| PCI DSS Level 1 (payment) | Certificate required |
| Regulated escrow provider (escrow) | License verification |
| AML/KYC program | Due diligence review |
| Insurance coverage | Certificate required |

### 7.2 Ongoing Monitoring

| Monitoring | Frequency |
| :--- | :--- |
| License status verification | Quarterly |
| Compliance audit results | Annually |
| Security posture review | Annually |
| Incident review | Continuous |

---

## 8. Contractual Requirements

### 8.1 Mandatory Contract Clauses

All partner agreements **MUST** include:

| Clause | Purpose |
| :--- | :--- |
| Clear liability allocation | Matches this document |
| Data handling obligations | GDPR/privacy compliance |
| Audit rights | Platform can audit |
| Incident notification | 24-hour requirement |
| Regulatory change notification | 30-day advance notice |
| Termination rights | Platform can exit |

### 8.2 Prohibited Contract Terms

| Prohibited Term | Reason |
| :--- | :--- |
| Platform assumes payment liability | Inconsistent with model |
| Platform indemnifies for partner fraud | Inappropriate risk transfer |
| Exclusive arrangement (without exit) | Operational risk |

---

## 9. Incident Handling

### 9.1 Partner Incident Response

| Incident Type | Platform Action | Partner Obligation |
| :--- | :--- | :--- |
| Payment processing outage | Display alternative options | Notify within 1 hour |
| Security breach | Assess impact, notify users | Notify within 24 hours |
| Regulatory action | Assess continued partnership | Notify immediately |
| Fund loss event | Halt new transactions | Notify immediately |

### 9.2 Escalation Path

1. Partner incident notification received
2. Platform Risk Officer assesses impact
3. If user impact: User notification
4. If regulatory impact: Compliance notification
5. Board notification for material events

---

## 10. Attestation

```
This document has been reviewed and approved by:

Chief Risk Officer:          _______________________  Date: _______
General Counsel:             _______________________  Date: _______
Chief Technology Officer:    _______________________  Date: _______
```

---
**Document Version:** 1.0
**Next Review:** June 2026
**Classification:** Regulatory — Binding
