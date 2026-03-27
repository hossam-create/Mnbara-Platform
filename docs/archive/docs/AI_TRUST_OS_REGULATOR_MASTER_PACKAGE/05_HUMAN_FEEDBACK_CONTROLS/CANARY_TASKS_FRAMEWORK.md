# Human Challenge (Canary Task) Framework

**Document ID:** GOV-CANARY-001
**Purpose:** Combating Automation Bias in Human-in-the-Loop Systems
**Owner:** Head of Trust & Safety Operations
**Status:** ACTIVE POLICY

---

## 1. Purpose & Philosophy

In a high-performing AI decision support system, the greatest risk is **Automation Bias**: the tendency for human operators to stop critically thinking and blindly click "Approve" because the AI is usually right.

This framework establishes a **"Human Challenge" (Canary)** protocol. We intentionally inject known errors (Canaries) into the review queue to measure human vigilance. This turns the human review process from a passive task into an active, verified control.

---

## 2. The Canary Mechanism

### 2.1 Injection Logic
*   **Source:** The Shadow Evaluator or a dedicated "Red Team" dataset.
*   **Method:** A "Known Good" transaction is synthetically labeled as "High Risk" (or vice versa) and inserted into the live production queue.
*   **Invisibility:** The Canary task must be indistinguishable from a regular task in the UI.

### 2.2 Frequency Limits
*   **Rate:** Canary tasks shall not exceed **5%** of an agent's total daily volume.
*   **Randomization:** Injection timing must be stochastic to prevent pattern recognition.

### 2.3 Safety Wrapper
*   **No Customer Impact:** If an agent acts on a Canary task (e.g., blocks a Good Canary), the system **MUST NOT** execute that action on the real user. The system intercepts the decision, logs the result, and discards the action.

---

## 3. Operational Workflow

1.  **Agent Presentation:** Agent receives Task #999 (A Canary).
2.  **Agent Decision:**
    *   *Scenario A (Pass):* Agent reviews data, disagrees with the AI recommendation, and selects "Override".
        *   **Feedback:** "Correct! This was a test of your vigilance."
    *   *Scenario B (Fail):* Agent blindly accepts the AI recommendation.
        *   **Feedback:** "Alert: You missed a Canary Task. Please review the specific rules for this case."
3.  **Logging:** The outcome is logged to the `Agent_Performance_Db`.

---

## 4. Signal Detection & Metrics

We classify failures into two categories:

| Signal Type | Description | Interpretation |
| :--- | :--- | :--- |
| **Vigilance Fade** | Agent fails Canaries late in shift. | Needs breaks/scheduling adjustment. |
| **Rubber Stamping** | Agent fails >50% of Canaries consistently. | High Risk of Automation Bias. Needs retraining. |

**Key Performance Indicator (KPI):**
*   **Automation Bias Score (ABS):** The percentage of Canary tasks failed.
*   Target ABS: < 5%.

---

## 5. Remediation Protocol

If an agent's Automation Bias Score exceeds the safety threshold:

1.  **Level 1 (Warning):** Instant UI feedback and mandatory 5-minute cooldown break.
2.  **Level 2 (Retraining):** Removal from queue; mandatory refresher course on Risk Policy.
3.  **Level 3 (Revocation):** Permanent removal of "Approver" privileges.

*Note: Canary failures are treated as "Training Opportunities," not disciplinary events, unless malicious negligence is proven.*

---

## 6. Monthly Canary Effectiveness Report

**Owner:** Ops Quality Lead

A monthly report will be generated for the Risk Committee containing:
1.  **Global Vigilance Rate:** System-wide pass/fail rate.
2.  **Bias Hotspots:** Specific rule types where humans frequently "trust" the AI too much.
3.  **Impact Analysis:** Estimate of real errors prevented based on Canary catch rates.

---

## 7. Compliance Statement

This framework enables us to prove to regulators that our "Human-in-the-Loop" coverage is **active and effective**, not just a passive rubber-stamp. It provides the statistical evidence required to defend the "Non-Automated Decision" classification under GDPR.

---
**Approved By:**
Head of Trust & Safety
Chief Risk Officer
