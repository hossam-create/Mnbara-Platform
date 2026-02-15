# TRUST PORTABILITY POLICY
## User Data Ownership & Transfer Rights

**Classification:** Regulatory — Binding
**Status:** Operational Policy
**Effective Date:** December 19, 2025
**Document Owner:** Chief Risk Officer

---

## 1. Policy Statement

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   USERS OWN THEIR REPUTATION DATA.                         │
│                                                             │
│   Trust scores are calculated from user activity.          │
│   Users have the right to understand, access, and          │
│   request portability of their reputation data.            │
│                                                             │
│   Trust data shall not be used to lock users in.           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Definitions

| Term | Definition |
| :--- | :--- |
| **Trust Score** | Calculated indicator of user reliability based on platform activity |
| **Reputation Data** | Raw data elements used to calculate Trust Score |
| **Derived Score** | The calculated Trust Score itself |
| **Portable Data** | Data user may export under this policy |
| **Non-Portable Data** | Data that cannot be exported (see Section 5) |

---

## 3. User Rights

### 3.1 Right to Understand

Users have the right to understand:

| Information | Accessibility |
| :--- | :--- |
| What data is collected | Disclosed in Privacy Policy |
| How Trust Score is calculated | Summary in Help Center |
| What factors affect their score | Visible in Trust Profile |
| Why their score changed | Available on request |

### 3.2 Right to Access

Users have the right to access:

| Data Type | Access Method | Timeline |
| :--- | :--- | :--- |
| Current Trust Score | Real-time in app | Immediate |
| Score history | Account settings | Immediate |
| Factor breakdown | Trust Profile page | Immediate |
| Raw reputation data | Data export request | 30 days |

### 3.3 Right to Portability

Users have the right to export:

| Data Type | Format | Included |
| :--- | :--- | :--- |
| Transaction history | JSON/CSV | ✓ |
| Completion record | JSON/CSV | ✓ |
| Review history (given) | JSON/CSV | ✓ |
| Review history (received) | JSON/CSV | ✓ |
| Dispute outcomes | JSON/CSV | ✓ |
| Verification status | JSON/CSV | ✓ |
| Account tenure | JSON/CSV | ✓ |

---

## 4. Portable Data Specification

### 4.1 Standard Export Package

Upon user request, the following data package is provided:

```
TRUST_DATA_EXPORT/
├── account_summary.json
│   └── Account ID, creation date, verification status
├── transaction_history.csv
│   └── Date, type, amount, completion status, counterparty rating
├── reviews_received.csv
│   └── Date, rating, comment (anonymized reviewer)
├── reviews_given.csv
│   └── Date, rating, comment
├── disputes.csv
│   └── Date, type, outcome
├── trust_score_history.csv
│   └── Date, score, primary factors
└── export_metadata.json
    └── Export date, data completeness, version
```

### 4.2 Data Format Standards

| Requirement | Standard |
| :--- | :--- |
| File format | JSON and CSV (user choice) |
| Encoding | UTF-8 |
| Date format | ISO 8601 |
| Machine readable | Required |
| Human readable | Required |

### 4.3 Export Timeline

| Request Type | Processing Time |
| :--- | :--- |
| Standard export | 30 days maximum |
| GDPR/CCPA request | 30 days (or as required by law) |
| Account closure export | 30 days |

---

## 5. Non-Portable Data

### 5.1 Data Excluded from Portability

| Data Type | Reason for Exclusion |
| :--- | :--- |
| Calculated Trust Score (number) | Proprietary calculation; raw data provided instead |
| Other users' personal data | Third-party privacy |
| Internal risk flags | Security and fraud prevention |
| Algorithm parameters | Trade secret protection |
| Fraud investigation data | Legal/security |

### 5.2 Rationale

The calculated Trust Score itself is not portable because:

1. **Proprietary Methodology:** The scoring algorithm is proprietary.
2. **Context-Specific:** Scores are meaningful only within this platform's context.
3. **Raw Data Sufficient:** Users receive all underlying data to demonstrate their history elsewhere.
4. **No Industry Standard:** No universal trust score format exists.

Users receive **all raw data** that contributes to their score, enabling them to establish credibility on other platforms.

---

## 6. Data Transfer to Third Parties

### 6.1 User-Initiated Transfers

| Scenario | Process |
| :--- | :--- |
| User requests export | Self-service download |
| User shares with partner | User provides export file |
| API access (future) | OAuth-based user consent |

### 6.2 Platform-Initiated Transfers

| Scenario | Requirement |
| :--- | :--- |
| Sale of business | User notification; data transfer subject to same policies |
| Regulatory order | As required by law |
| Partner integration | User consent required for each transfer |

### 6.3 Prohibited Transfers

| Scenario | Status |
| :--- | :--- |
| Sale of trust data to data brokers | **PROHIBITED** |
| Transfer without user consent | **PROHIBITED** |
| Bulk reputation data export | **PROHIBITED** |

---

## 7. Anti-Lock-In Provisions

### 7.1 No Trust-Based Coercion

The Platform **SHALL NOT**:

| Prohibited Action | Rationale |
| :--- | :--- |
| Penalize users for requesting export | User right |
| Reduce trust score for export | Punitive |
| Delay export to discourage departure | Coercive |
| Threaten "trust loss" for leaving | Coercive |

### 7.2 Equal Treatment

Users who request data export shall receive:

- Same service quality during processing
- No warning banners about leaving
- No "are you sure?" guilt messaging
- Standard processing times

---

## 8. Incoming Trust (From Other Platforms)

### 8.1 Current Position

The Platform does **NOT** currently import trust data from other platforms because:

1. No industry standard for trust portability
2. Verification of external data is unreliable
3. Gaming/fraud risk from fabricated data
4. Liability concerns

### 8.2 New User Treatment

Users arriving from other platforms:

| Status | Platform Approach |
| :--- | :--- |
| New user, claims history elsewhere | Starts with "NEW" status |
| Verified identity | Identity verification accelerates trust |
| Verified reference | Manual review case-by-case |

### 8.3 Future Consideration

If industry standards emerge for trust portability, the Platform will:

1. Evaluate adoption
2. Assess security/integrity risks
3. Consult with regulators
4. Update this policy accordingly

---

## 9. Account Closure & Data Retention

### 9.1 Upon Account Closure

| Data Type | Retention | Reason |
| :--- | :--- | :--- |
| Transaction records | 7 years | Legal/tax requirements |
| Trust score history | 7 years | Audit trail |
| Dispute records | 7 years | Legal/compliance |
| Personal identifiers | Deleted after retention period | Privacy |

### 9.2 User Rights at Closure

| Right | Implementation |
| :--- | :--- |
| Export before closure | Must be offered before finalization |
| Deletion request | Honored after mandatory retention |
| Anonymization | Applied where deletion impossible |

---

## 10. Compliance & Audit

### 10.1 Compliance Verification

| Audit | Frequency | Owner |
| :--- | :--- | :--- |
| Export request fulfillment | Monthly | Compliance |
| Timeline adherence | Monthly | Operations |
| Data completeness | Quarterly | Data Team |
| Format correctness | Quarterly | Engineering |

### 10.2 Non-Compliance Response

| Finding | Response |
| :--- | :--- |
| Delayed export | Expedite + root cause analysis |
| Incomplete export | Re-process + review procedure |
| Denied valid request | Immediate escalation to Legal |

---

## 11. Attestation

```
This policy has been reviewed and approved by:

Chief Risk Officer:          _______________________  Date: _______
Chief Privacy Officer:       _______________________  Date: _______
General Counsel:             _______________________  Date: _______
```

---
**Document Version:** 1.0
**Next Review:** June 2026
**Classification:** Regulatory — Binding
