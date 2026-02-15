# EVIDENCE HANDLING RULES
## Dispute Evidence Collection & Evaluation Standards

**Classification:** Regulatory — Binding
**Status:** Operational Policy
**Effective Date:** December 19, 2025
**Document Owner:** Chief Risk Officer

---

## 1. Purpose

This document governs how evidence is:
- Collected from dispute parties
- Stored and secured
- Evaluated by human reviewers
- Used in decision-making

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   EVIDENCE IS EVALUATED BY HUMANS, NOT AI.                  │
│                                                             │
│   AI may organize evidence.                                 │
│   AI may flag inconsistencies.                              │
│   AI SHALL NOT weight, exclude, or prioritize evidence.     │
│                                                             │
│   THE HUMAN REVIEWER DECIDES WHAT EVIDENCE MEANS.           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Evidence Types

### 2.1 Accepted Evidence Types

| Type | Format | Limitations |
| :--- | :--- | :--- |
| **Photographs** | JPG, PNG, HEIC | Max 10MB per image, max 20 images |
| **Screenshots** | JPG, PNG | Must show date/context |
| **Videos** | MP4, MOV | Max 100MB, max 5 minutes |
| **Documents** | PDF | Max 10MB per document |
| **Correspondence** | In-app messages, Email | Must be verifiable |
| **Tracking records** | Carrier screenshots | Must show dates |
| **Receipts** | Photo or PDF | Original preferred |
| **Written statement** | Text | Unlimited length |

### 2.2 Evidence Categories

| Category | Weight Consideration | Examples |
| :--- | :--- | :--- |
| **Primary** | Highest consideration | Photos of item, tracking, receipts |
| **Supporting** | Corroborates primary | Correspondence, context |
| **Character** | Limited consideration | Past history on platform |
| **Third-party** | Case-by-case | External verification |

---

## 3. Collection Procedures

### 3.1 Initial Collection

```
EVIDENCE COLLECTION FLOW

1. DISPUTE FILED
   └─ System captures: Transaction data, messages, listing

2. COMPLAINANT SUBMISSION
   └─ 5-day window to submit evidence
   └─ All types accepted
   └─ System confirms receipt

3. RESPONDENT SUBMISSION
   └─ 5-day window after notification
   └─ Same types accepted
   └─ System confirms receipt

4. ADDITIONAL REQUEST (if needed)
   └─ Reviewer may request specific evidence
   └─ 3-day extension granted
   └─ Party notified of request
```

### 3.2 Submission Requirements

| Requirement | Standard |
| :--- | :--- |
| Authenticity | Submitter affirms evidence is genuine |
| Relevance | Evidence must relate to dispute |
| Completeness | Submitter should provide all relevant evidence |
| Timeliness | Within stated deadline |

### 3.3 Late Evidence

| Scenario | Handling |
| :--- | :--- |
| Within 24 hours of deadline | Accept with note |
| 1-3 days late, before decision | Reviewer discretion |
| After decision issued | May support appeal only |
| Deliberately withheld | May affect credibility |

---

## 4. Storage & Security

### 4.1 Storage Standards

| Requirement | Standard |
| :--- | :--- |
| Encryption at rest | AES-256 |
| Encryption in transit | TLS 1.3 |
| Access control | Role-based, logged |
| Retention | 7 years |
| Deletion | Secure deletion after retention |

### 4.2 Access Control

| Role | Access Level |
| :--- | :--- |
| Dispute parties | Own submissions only |
| Assigned reviewer | Full access to case evidence |
| Manager | Access for quality/escalation |
| Legal | Access with documented need |
| Audit | Access for compliance verification |

### 4.3 Confidentiality

| Principle | Implementation |
| :--- | :--- |
| Party privacy | Personal info visible only to reviewer |
| Cross-case isolation | Evidence not shared between cases |
| No external sharing | Without legal requirement |

---

## 5. AI Role in Evidence Handling

### 5.1 Permitted AI Functions

| Function | Scope | Human Oversight |
| :--- | :--- | :--- |
| **Organize** | Sort by type, date | Human reviews organization |
| **OCR** | Extract text from images | Human verifies extraction |
| **Translate** | Language translation | Human reviews translation |
| **Tag** | Apply descriptive tags | Human may re-tag |
| **Summarize** | Create timeline | Human verifies accuracy |
| **Flag** | Highlight discrepancies | Human evaluates significance |

### 5.2 Prohibited AI Functions

| Function | Prohibition | Reason |
| :--- | :--- | :--- |
| **Weight evidence** | PROHIBITED | Human judgment |
| **Exclude evidence** | PROHIBITED | Due process |
| **Determine credibility** | PROHIBITED | Human judgment |
| **Recommend outcome** | PROHIBITED | Human decides |
| **Prioritize evidence** | PROHIBITED | Human priority |
| **Authenticate** | PROHIBITED | Human verification |

### 5.3 AI Disclosure

When AI assists with evidence:

```
NOTICE: This evidence summary was organized with AI assistance.

The human reviewer has personally reviewed all original evidence 
and has not relied on AI summaries for decision-making.

All determinations of fact and credibility are made by the 
human reviewer.
```

---

## 6. Evaluation Standards

### 6.1 Human Evaluation Process

Every piece of evidence is evaluated by the human reviewer for:

| Factor | Question |
| :--- | :--- |
| **Relevance** | Does this relate to the dispute? |
| **Authenticity** | Does this appear genuine? |
| **Weight** | How persuasive is this? |
| **Corroboration** | Does other evidence support this? |
| **Contradiction** | Does this conflict with other evidence? |

### 6.2 Credibility Assessment

| Indicator | Consideration |
| :--- | :--- |
| Consistency | Does party's account remain consistent? |
| Corroboration | Is it supported by objective evidence? |
| Plausibility | Is it reasonable given circumstances? |
| Timeliness | Was it reported promptly? |
| Motive | Does party have reason to misrepresent? |

### 6.3 Evidence Conflicts

When evidence conflicts:

```
CONFLICT RESOLUTION APPROACH

1. Identify the specific conflict
2. Compare objective vs. subjective evidence
3. Assess credibility factors
4. Determine most probable facts
5. Document reasoning for resolution
```

---

## 7. Specific Evidence Rules

### 7.1 Photographs

| Rule | Standard |
| :--- | :--- |
| Metadata | Check for date/location if available |
| Context | Must show relevant subject clearly |
| Editing | Obvious editing may affect weight |
| Multiple angles | Preferred for item condition |

### 7.2 Tracking Information

| Rule | Standard |
| :--- | :--- |
| Source | Official carrier tracking preferred |
| Completeness | Full tracking history vs. selective |
| Discrepancies | Address any tracking gaps |
| Delivery confirmation | Signature, photo if available |

### 7.3 Communications

| Rule | Standard |
| :--- | :--- |
| In-platform | Full context automatically available |
| External | Must show headers/timestamps |
| Completeness | Selective quoting affects weight |
| Tone/intent | Context considered |

### 7.4 Third-Party Evidence

| Rule | Standard |
| :--- | :--- |
| Verification | Attempt to verify source |
| Independence | Consider relationship to party |
| Corroboration | Does it match other evidence? |

---

## 8. Evidence Preservation

### 8.1 Preservation Triggers

| Event | Preservation Action |
| :--- | :--- |
| Dispute filed | Transaction evidence frozen |
| Evidence submitted | Timestamped, hashed |
| Legal hold | Extended retention, no deletion |

### 8.2 Chain of Custody

| Record | Captured |
| :--- | :--- |
| Upload timestamp | System recorded |
| Uploader identity | Linked to account |
| Access log | Who viewed, when |
| Modification | Any changes logged |

---

## 9. Party Rights

### 9.1 Submission Rights

| Right | Implementation |
| :--- | :--- |
| **Submit evidence** | All parties have opportunity |
| **Respond to evidence** | See opposing evidence, respond |
| **Request extension** | May request additional time |
| **Withdraw evidence** | Before decision only |

### 9.2 Visibility Rights

| Information | Visible To |
| :--- | :--- |
| Own submissions | Submitting party |
| Opposing evidence | Both parties (redacted if needed) |
| What reviewer considered | In decision |
| Why not considered | Explained in decision |

### 9.3 Limitations

| Right | Limitation |
| :--- | :--- |
| Evidence quantity | Reasonable limits apply |
| Evidence format | Supported formats only |
| Evidence timing | Deadline enforced |

---

## 10. Documentation Requirements

### 10.1 Evidence Log

For every dispute, maintain:

| Element | Content |
| :--- | :--- |
| Evidence inventory | List of all submitted items |
| Timestamps | When each submitted |
| Review status | Reviewed yes/no |
| Weight assigned | How persuasive (high/medium/low) |
| Notes | Reviewer observations |

### 10.2 Decision Documentation

| Element | Requirement |
| :--- | :--- |
| Evidence considered | List all reviewed items |
| Key evidence | Identify pivotal evidence |
| Conflicts resolved | Explain resolution |
| Weight rationale | Why certain evidence was persuasive |

---

## 11. Audit & Compliance

### 11.1 Audit Schedule

| Audit | Frequency | Scope |
| :--- | :--- | :--- |
| Access log review | Weekly | Unauthorized access |
| Evidence handling | Monthly | Process compliance |
| Storage security | Quarterly | Encryption, access |
| Retention compliance | Annually | Deletion, retention |
| AI boundary compliance | Monthly | Prohibited functions |

### 11.2 Violations

| Violation | Response |
| :--- | :--- |
| Unauthorized access | Investigation + access revocation |
| AI used inappropriately | Immediate correction + review |
| Evidence tampering | Termination + possible legal action |
| Retention violation | Remediation + audit |

---

## 12. Attestation

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
