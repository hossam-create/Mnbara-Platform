# TRUST DECAY DISCLOSURE
## Score Aging & Recency Weighting Policy

**Classification:** Regulatory — Binding
**Status:** Operational Policy
**Effective Date:** December 19, 2025
**Document Owner:** Chief Risk Officer

---

## 1. Policy Statement

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   TRUST SCORES REFLECT RECENT BEHAVIOR.                     │
│                                                             │
│   Older activity contributes less to current trust than     │
│   recent activity. This reflects that behavior patterns     │
│   may change over time.                                     │
│                                                             │
│   Users are entitled to understand how score aging works.   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Rationale for Decay

### 2.1 Why Trust Decays

| Reason | Explanation |
| :--- | :--- |
| **Relevance** | Recent behavior is more predictive than old behavior |
| **Rehabilitation** | Past mistakes should not permanently define users |
| **Accuracy** | Stale data may not reflect current reliability |
| **Fairness** | Users who improve should see score improvement |

### 2.2 Why Trust Does NOT Decay to Zero

| Reason | Explanation |
| :--- | :--- |
| **History has value** | Long track record indicates stability |
| **Minimum floor** | Account tenure provides baseline trust |
| **Continuity** | Users should not restart from zero unfairly |

---

## 3. Decay Model

### 3.1 Decay Function

Trust score components are weighted by recency:

```
Component Weight = Base Weight × Recency Factor

Where:
  Recency Factor = f(age of activity)
```

### 3.2 Recency Factor Schedule

| Activity Age | Recency Factor | Interpretation |
| :--- | :--- | :--- |
| 0-30 days | 1.0 | Full weight |
| 31-90 days | 0.9 | 90% weight |
| 91-180 days | 0.75 | 75% weight |
| 181-365 days | 0.5 | 50% weight |
| 1-2 years | 0.3 | 30% weight |
| 2-3 years | 0.15 | 15% weight |
| 3+ years | 0.05 | 5% weight (minimum) |

### 3.3 Minimum Weight Floor

No activity weight decays below **5%**. This ensures:

- Long history has residual value
- Very old positive activity still contributes
- Very old negative activity eventually fades (but never to zero)

---

## 4. What Decays

### 4.1 Components Subject to Decay

| Component | Decays | Rationale |
| :--- | :--- | :--- |
| Transaction completions | Yes | Recency matters |
| Review ratings received | Yes | Recency matters |
| Review ratings given | Yes | Recency matters |
| Response time history | Yes | Recency matters |
| Minor dispute history | Yes | Rehabilitation |

### 4.2 Components NOT Subject to Decay

| Component | Decays | Rationale |
| :--- | :--- | :--- |
| Account age | No | Tenure is cumulative |
| Identity verification | No | Once verified, remains |
| Fraud-related restrictions | No* | Safety-critical |
| Regulatory holds | No | Compliance requirement |

*Fraud history may be subject to expungement after appeal (see Section 7).

---

## 5. User Disclosure

### 5.1 Mandatory Disclosure

Users **MUST** be informed that:

```
YOUR TRUST SCORE REFLECTS RECENT ACTIVITY

Your Trust Score is calculated using your activity history,
with recent activity weighted more heavily than older activity.

This means:
• Your recent transactions matter most
• Older completions contribute less over time
• Staying active maintains your score
• Past issues fade (but don't disappear entirely)

Your score is recalculated regularly to reflect your
current activity level and reliability.
```

### 5.2 Score Factor Display

When showing trust factors:

```
TRUST FACTORS

Recent Transactions (last 90 days)
████████████████░░░░ 45 completed     [HIGH IMPACT]

Older Transactions (90+ days ago)
██████████░░░░░░░░░░ 78 completed     [LOWER IMPACT]

Account Age
████████████████████ 2.5 years        [STABLE FACTOR]

Recent Reviews
████████████████░░░░ 4.7 average      [HIGH IMPACT]
```

### 5.3 Inactivity Warning

If user's decay is affecting score significantly:

```
YOUR SCORE IS DECLINING DUE TO INACTIVITY

Your Trust Score has decreased because:
• Your most recent transaction was 4 months ago
• Recent activity has more weight than older activity

Tips to maintain your score:
• Complete transactions when you're ready
• Maintain your verification status

There's no penalty for taking breaks—your history 
remains, but recent activity weighs more heavily.
```

---

## 6. Recalculation Frequency

### 6.1 Calculation Schedule

| Trigger | Recalculation |
| :--- | :--- |
| Transaction completed | Immediate |
| Review received | Immediate |
| Dispute resolved | Immediate |
| Time-based decay | Daily (overnight batch) |
| Manual review | On demand |

### 6.2 User Visibility

| Information | Visibility |
| :--- | :--- |
| Current score | Real-time |
| Last calculation timestamp | Visible |
| Next scheduled recalculation | Not shown (continuous) |
| Score change reason | Visible on change |

---

## 7. Negative History Handling

### 7.1 Negative Events Decay

Negative events (disputes lost, low ratings) also decay:

| Event Age | Weight in Score |
| :--- | :--- |
| 0-180 days | Full weight |
| 181-365 days | 75% weight |
| 1-2 years | 50% weight |
| 2-3 years | 25% weight |
| 3+ years | 10% weight |

### 7.2 Serious Events

| Event Type | Decay | Reason |
| :--- | :--- | :--- |
| Minor dispute | Standard decay | Rehabilitation |
| Major dispute | Slower decay (50% of standard) | Higher impact |
| Fraud finding | No decay | Safety-critical |
| Legal/regulatory | No decay | Compliance |

### 7.3 Fraud History Expungement

Fraud-related history may be expunged **ONLY** through:

1. **Formal appeal** to Trust Review Board
2. **Evidence** of wrongful finding OR rehabilitation
3. **Board approval** (majority vote)
4. **Minimum time elapsed** (2 years from finding)

Expungement is **NOT** automatic and requires human review.

---

## 8. Decay Transparency

### 8.1 What Users Can See

| Information | Available |
| :--- | :--- |
| Current score | Yes |
| Score history (graph) | Yes |
| Factor breakdown | Yes |
| Decay explanation | Yes (in Help) |
| Exact decay percentages | Yes (in Help) |

### 8.2 What Users Cannot See

| Information | Reason |
| :--- | :--- |
| Exact algorithm weights | Proprietary |
| Other users' scores | Privacy |
| Real-time calculation steps | Technical complexity |

---

## 9. Decay Fairness Controls

### 9.1 Anti-Gaming Measures

| Behavior | Response |
| :--- | :--- |
| Activity burst to inflate score | Activity rate caps |
| Self-dealing transactions | Detection and invalidation |
| Review manipulation | Detection and penalty |

### 9.2 Hardship Provisions

Users experiencing hardship (illness, etc.) may request:

| Provision | Process |
| :--- | :--- |
| Decay pause | Submit request with documentation |
| Score freeze | Reviewed by Trust Operations |
| Duration | Maximum 6 months |

Hardship provisions are **not automatic** and require human review.

---

## 10. Audit & Compliance

### 10.1 Decay Audit

| Audit | Frequency | Owner |
| :--- | :--- | :--- |
| Decay factor accuracy | Quarterly | Data Science |
| Disclosure completeness | Quarterly | Compliance |
| User complaint review | Monthly | Trust Operations |
| Fairness assessment | Annually | Risk Committee |

### 10.2 Decay Policy Changes

Changes to decay parameters require:

1. Data analysis justification
2. Risk Committee review
3. User impact assessment
4. 30-day notice before implementation

---

## 11. Attestation

```
This policy has been reviewed and approved by:

Chief Risk Officer:          _______________________  Date: _______
Chief Data Officer:          _______________________  Date: _______
General Counsel:             _______________________  Date: _______
```

---
**Document Version:** 1.0
**Next Review:** June 2026
**Classification:** Regulatory — Binding
