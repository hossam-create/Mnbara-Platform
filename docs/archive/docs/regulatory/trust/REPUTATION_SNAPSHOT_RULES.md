# REPUTATION SNAPSHOT RULES
## Point-in-Time Trust Representation Standards

**Classification:** Regulatory — Binding
**Status:** Operational Policy
**Effective Date:** December 19, 2025
**Document Owner:** Chief Risk Officer

---

## 1. Purpose

This document defines rules for how Trust Scores and reputation data are:

- Captured at specific points in time
- Displayed to transaction counterparties
- Preserved for dispute resolution
- Used in transaction decisions

---

## 2. Core Principle

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   TRUST AT TIME OF TRANSACTION GOVERNS THE TRANSACTION.    │
│                                                             │
│   Users rely on the trust information visible when they    │
│   make decisions. Post-transaction changes do not          │
│   retroactively affect transaction terms or protections.   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Snapshot Timing

### 3.1 When Snapshots Are Captured

| Event | Snapshot Captured | Data Included |
| :--- | :--- | :--- |
| Transaction offer created | Yes | Traveler trust at offer time |
| Transaction match accepted | Yes | Both parties' trust at match time |
| Payment initiated | Yes | Trust at payment decision |
| Dispute opened | Yes | Trust at dispute initiation |
| Dispute resolved | Yes | Trust at resolution |

### 3.2 Snapshot Retention

| Snapshot Type | Retention Period |
| :--- | :--- |
| Transaction snapshot | 7 years |
| Dispute snapshot | 7 years |
| Pre-dispute trust | 7 years |
| Resolution outcome | 7 years |

---

## 4. What Snapshots Contain

### 4.1 Standard Snapshot Data

Each snapshot includes:

```json
{
  "snapshot_id": "SNP-2025-12-001234",
  "timestamp": "2025-12-19T04:20:00Z",
  "event_type": "MATCH_ACCEPTED",
  "transaction_id": "TXN-2025-12-567890",
  
  "buyer": {
    "user_id": "USR-BUYER-001",
    "trust_score": 87,
    "trust_level": "HIGH",
    "trust_factors": {
      "completed_transactions": 24,
      "positive_reviews": 22,
      "dispute_rate": 0.04,
      "account_age_days": 547,
      "verification_level": "FULL"
    },
    "active_warnings": [],
    "restrictions": []
  },
  
  "seller_or_traveler": {
    "user_id": "USR-TRAVELER-002",
    "trust_score": 92,
    "trust_level": "HIGH",
    "trust_factors": {
      "completed_transactions": 67,
      "positive_reviews": 64,
      "dispute_rate": 0.02,
      "account_age_days": 892,
      "verification_level": "FULL"
    },
    "active_warnings": [],
    "restrictions": []
  }
}
```

### 4.2 Extended Snapshot (Disputes)

For dispute-related snapshots, additional data:

```json
{
  "dispute_context": {
    "trust_at_transaction": { /* original snapshot */ },
    "trust_at_dispute_open": { /* current snapshot */ },
    "trust_changes_between": [
      {
        "date": "2025-12-15",
        "score_change": -3,
        "reason": "Dispute resolved against user"
      }
    ]
  }
}
```

---

## 5. Snapshot Immutability

### 5.1 Immutability Rule

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   SNAPSHOTS ARE IMMUTABLE.                                  │
│                                                             │
│   Once captured, a snapshot cannot be altered, deleted,     │
│   or modified for any reason.                               │
│                                                             │
│   If a snapshot is found to be incorrect, a correction      │
│   record is appended; the original is never changed.        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Correction Process

| Scenario | Process |
| :--- | :--- |
| Data error discovered | Append correction record |
| System error at capture | Append correction record |
| Fraudulent data | Append correction + flag |

**Correction Record Format:**
```json
{
  "correction_id": "COR-2025-12-000123",
  "original_snapshot_id": "SNP-2025-12-001234",
  "correction_timestamp": "2025-12-19T05:00:00Z",
  "correction_reason": "Trust score calculation error",
  "corrected_value": 85,
  "original_value": 87,
  "authorized_by": "DATA_OPS_MANAGER"
}
```

---

## 6. Display Rules

### 6.1 Real-Time vs. Snapshot Display

| Context | Display Rule |
| :--- | :--- |
| User browsing (pre-transaction) | Real-time current trust |
| Active transaction view | Snapshot at transaction start |
| Dispute review | Snapshot at relevant event |
| Historical transaction review | Snapshot at transaction time |

### 6.2 Snapshot Age Disclosure

If viewing a snapshot:

```
Trust information shown reflects data at the time of 
this transaction (December 15, 2025).

Current trust information may differ.

[ View current trust profile ]
```

### 6.3 Discrepancy Handling

If snapshot differs significantly from current trust:

| Difference | Action |
| :--- | :--- |
| Score dropped significantly | Flag for reviewer awareness |
| Score increased significantly | Informational only |
| Verification revoked | Flag for reviewer awareness |
| New restrictions added | Flag for mandatory review |

---

## 7. Dispute Resolution Use

### 7.1 Which Snapshot Governs

| Dispute Type | Governing Snapshot |
| :--- | :--- |
| Item not received | Snapshot at payment |
| Item not as described | Snapshot at payment |
| Buyer canceled | Snapshot at cancellation |
| Traveler failed | Snapshot at delivery deadline |

### 7.2 Snapshot as Evidence

In disputes:

- Snapshot is **immutable evidence** of trust state
- Cannot be challenged based on current trust
- Used to assess whether protections applied
- Used to assess reasonable reliance

### 7.3 Reviewer Access

Dispute reviewers see:

| Data | Access |
| :--- | :--- |
| Snapshot at transaction | Full access |
| Snapshot at dispute | Full access |
| Trust change history | Full access |
| Current real-time trust | Full access (for context) |

---

## 8. Protection Tier Locking

### 8.1 Protection Based on Snapshot

Transaction protections are determined by trust at transaction time:

| Rule | Application |
| :--- | :--- |
| Escrow limits | Based on snapshot trust |
| Auto-release eligibility | Based on snapshot trust |
| Dispute priority | Based on snapshot trust |
| Review sampling | Based on snapshot trust |

### 8.2 No Retroactive Changes

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   IF:   User had HIGH TRUST at transaction time             │
│   THEN: HIGH TRUST protections apply                        │
│                                                             │
│   EVEN IF: User's trust dropped after transaction           │
│                                                             │
│   Protections do not degrade retroactively.                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Data Integrity Controls

### 9.1 Snapshot Verification

| Control | Implementation |
| :--- | :--- |
| Timestamp integrity | Cryptographically signed |
| Data integrity | Hash verification |
| Storage redundancy | Multiple storage locations |
| Tamper detection | Alert on modification attempt |

### 9.2 Audit Trail

All snapshot operations are logged:

| Event | Logged Data |
| :--- | :--- |
| Snapshot creation | Timestamp, trigger, data hash |
| Snapshot access | Accessor, purpose, timestamp |
| Correction append | Corrector, reason, approval |

---

## 10. User Visibility

### 10.1 User Access to Snapshots

Users can view:

| Data | Access |
| :--- | :--- |
| Their own trust snapshots | Transaction history |
| Counterparty snapshot (their view) | Transaction history |
| Snapshot used in dispute | Dispute record |

### 10.2 User Export

Trust snapshots are included in data export (see Trust Portability Policy).

---

## 11. Attestation

```
This policy has been reviewed and approved by:

Chief Risk Officer:          _______________________  Date: _______
Chief Technology Officer:    _______________________  Date: _______
General Counsel:             _______________________  Date: _______
```

---
**Document Version:** 1.0
**Next Review:** June 2026
**Classification:** Regulatory — Binding
