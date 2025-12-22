# Human Decision Quality Metrics: AI Trust & Risk

**Document ID:** AUDIT-METRICS-HITL-001
**Purpose:** Measuring the efficacy of Human-in-the-Loop controls
**Owner:** Quality Assurance (QA) & Internal Audit
**Reporting Cadence:** Monthly

---

## 1. Metric Philosophy

In our AI Trust System, humans are the "Safety Valve." If humans fail to catch machine errors, the safety valve is broken. Therefore, measuring **Human Decision Quality** is just as critical as measuring **Model Accuracy**.

We do not just measure "Throughput" (speed); we measure "Vigilance" (quality).

---

## 2. Core Metrics: Vigilance & Automation Bias

These metrics detect if human reviewers are becoming passive "rubber stamps."

### 2.1 Canary Miss Rate (CMR)
*   **Definition:** The percentage of injected "Canary Tasks" (intentional fake errors) that an agent failed to identify.
*   **Formula:** `(Missed Canaries / Total Canaries) * 100`
*   **Thresholds:**
    *   🟢 < 5% (Excellent Vigilance)
    *   🟡 5-10% (Warning)
    *   🔴 > 10% (Critical Risk - Retraining Required)

### 2.2 Time-to-Decision (TTD) Distribution
*   **Definition:** Analyzing the time spent reviewing a case before clicking "Approve/Block".
*   **Red Flag:** "Impossible Speed" (e.g., decisions made in < 2 seconds).
*   **Metric:** `% of decisions made in < Minimum_Viable_Review_Time`.

### 2.3 Agreement Rate (AR)
*   **Definition:** The percentage of time an agent *agrees* with the AI recommendation.
*   **Red Flag:** 100% Agreement Rate over a large sample (N>500) suggests total automation bias (no critical thinking).

---

## 3. Core Metrics: Competence & Accuracy

These metrics measure if the human decisions are actually *correct*.

### 3.1 Override Accuracy (OA)
*   **Definition:** When a human overrides the AI (e.g., unblocks a user), was that the right call?
*   **Measurement:** A random sample of overrides is peer-reviewed by a Senior QA Analyst (or "Golden Set" verification).
*   **Formula:** `(Valid Overrides / Total Overrides Checked) * 100`

### 3.2 False Positive Appeal Rate (FPAR)
*   **Definition:** The rate of customer support tickets/appeals generated from decisions confirmed by a specific agent.
*   **Significance:** A high FPAR indicates the agent is confirming bad AI recommendations too aggressively.

### 3.3 Justification Quality Score (JQS)
*   **Definition:** Qualitative assessment (1-5 score) of the mandatory written justifications.
*   **Fails:** "ok", "fine", ".", copied/pasted text.
*   **Passes:** Specific references to evidence (e.g., "ID mismatch verified").

---

## 4. Operational Health Dashboard

A "Human Health" dashboard is reviewed by the Risk Committee monthly:

| Metric | Target | Status | Action if Failed |
| :--- | :--- | :--- | :--- |
| **System Canary Miss Rate** | < 5% | 🟢 | Increase Canary frequency to wake up team. |
| **Rubber Stamp Rate** | < 1% | 🟢 | Audit specific agents with high rates. |
| **Golden Set Accuracy** | > 98% | 🟢 | Review policy clarity (maybe rules are vague). |

---

## 5. Audit Usage

Internal Auditors use these metrics to answer the regulatory question:
> *"Is your Human-in-the-Loop control real, or just theater?"*

Evidence of actively tracking and remediating `Canary Miss Rate` is the primary defense against claims of negligence in automated decisioning supervision.

---
**Approved By:**
Head of Quality Assurance
Chief Risk Officer
