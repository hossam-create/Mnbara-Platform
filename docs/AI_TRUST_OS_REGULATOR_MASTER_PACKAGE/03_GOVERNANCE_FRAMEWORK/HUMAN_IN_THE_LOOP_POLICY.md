# Mandatory Human Justification Policy

**Document ID:** GOV-JUSTIFY-001
**Purpose:** Enforcing meaningful human oversight on AI recommendations
**Owner:** Chief Compliance Officer
**Applicability:** All Trust & Safety Operations Staff
**Effective Date:** Immediate

---

## 1. Policy Statement

To ensure our AI Trust & Risk Operating System remains a "Decision Support Tool" and does not devolve into "Automated Decision-Making" (GDPR Art. 22), Mnbara mandates that **all high-impact decisions must be accompanied by an explicit, recorded human justification.**

The "Click to Accept" button without context is **PROHIBITED** for adverse actions.

---

## 2. Requirement for Justification

A written or selected justification is **MANDATORY** in the following scenarios:

1.  **Overriding the AI:** When an agent disagrees with the system recommendation (e.g., Unblocking a user flagged as Fraud).
2.  **Confirming a High-Impact Block:** When an agent accepts a recommendation to permanently suspend an account or seize funds.
3.  **Handling a Canary Task:** When an agent detects a test task (as per the *Human Challenge Framework*).

*Note: Low-risk approvals (e.g., verifying an email address) may be exempt if defined in the Operational Handbook.*

---

## 3. Justification Mechanism

The Operational Dashboard must implement the following technical constraints:

1.  **Enforced Selection:** The "Confirm" button is disabled until a `Reason Code` is selected from a dropdown menu.
    *   *Examples:* "Verified ID Documents", "Spoke to Customer", "False Positive Pattern".
2.  **Free-Text Requirement:** For "Other" or "High Risk" overrides, a free-text note of minimum 10 characters is required.
3.  **Prohibition of Defaults:** The UI must not pre-select a justification reason. The human must actively choose.

---

## 4. Data Storage & Audit

Every justification is a **Legal Record**. It must be stored in the Immutable Audit Log with:
*   `Reviewer_ID`: Who made the decision.
*   `Timestamp`: When the decision was made (UTC).
*   `AI_Score_At_Time`: What the system recommended.
*   `Justification_Code`: The structured reason.
*   `Justification_Note`: The free-text explanation.

**Retention:** These records are retained for 7 years to support regulatory audits (SARs) and customer appeals.

---

## 5. Prohibited Practices

The following behaviors are strictly **forbidden** and constitute a policy violation:

1.  **"Speed Clicking":** Using macros or scripts to auto-select justifications.
2.  **Generic Notes:** Repeatedly entering "ok", "fine", or "." to bypass the text requirement.
3.  **Shared Accounts:** Using another agent's credentials to justify decisions.

---

## 6. Compliance & Enforcement

*   **Audit:** Internal Audit will randomly sample 50 justifications monthly to verify quality.
*   **Drift:** Justifications will be analyzed to detect "Concept Drift" (e.g., if agents constantly override the AI for "Reason X," the AI rules need updating).

Failure to adhere to this policy forces the system back into "Automated Decision" territory, creating legal liability. Compliance is therefore mandatory for employment.

---
**Approved By:**
Chief Compliance Officer
Head of Operations
