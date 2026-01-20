# HUMAN-IN-THE-LOOP (HITL) GOVERNANCE FRAMEWORK

**Confidential & Privileged**
**Subject:** Human Oversight Principles & Decision Authority
**Applicability:** All AI-Driven Risk Assessment Modules

---

## 1. Legal & Operational Authority Statement

To satisfy all requirements of regulatory accountability and legal liability, we establish the following fundamental principle:

> **"The algorithm has no legal personality and no execution authority."**

The AI system is essentially a complex calculator. All legal, financial, and operational liability rests 100% with the human officers who utilize the system's output. A "System Error" is not an acceptable legal defense; ultimate responsibility lies with the "Operator."

## 2. Decision Ownership Hierarchy

The decision-making process is structured as a hierarchical pyramid where authority increases with human involvement.

| Level | Role | Nature | Authority |
| :--- | :--- | :--- | :--- |
| **L0** | **AI Operating System** | Automated | **Recommendation Only**. Cannot execute final disposition. |
| **L1** | **Compliance Analyst** | Human | **Initial Adjudication**. valid for Low/Medium risk items. |
| **L2** | **Senior Risk Officer** | Human | **Final Authority**. Required for High Risk, Blocking, or Reporting to Regulators. |
| **L3** | **Risk Committee** | Human Board | **Governance**. Reviews policy & systematic override patterns. |

## 3. Human Override Rights (The "Veto" Power)

The Human Officer retains absolute sovereignty over the AI recommendation.
*   **Right to Reject:** A human officer may **reject** an AI "High Risk" flag if they determine it is a False Positive based on external context not available to the model.
*   **Right to Escalate:** A human officer may **escalate** a "Low Risk" transaction if their intuition or external intelligence suggests a threat the AI missed.
*   **Documentation:** ANY override of the System's recommendation requires a mandatory input of a "Reason Code" and a typed "Justification Note" for the audit trail.

## 4. Mandatory Review Thresholds

While low-risk items may be processed with lighter touch (spot checks), the following conditions trigger **Mandatory Human Review** before any proceeding:

1.  **Risk Score > 80/100**: Any transaction flagged as "High Risk".
2.  **PEP Match**: Any potential match against Politically Exposed Persons lists.
3.  **Sanction Potential**: Any partial match for sanctioned entities/countries.
4.  **Anomaly Detection**: Any behavior deviation > 3 Standard Deviations from the user's norm.
5.  **High Value**: Transactions exceeding $10,000 equivalent (or local regulatory threshold).

## 5. Separation of Duties

To prevent internal fraud and bias, we enforce strict role separation:

*   **Developers:** Build and maintain the code. They **CANNOT** access production customer data or adjudicate live alerts.
*   **Risk Officers:** Review alerts and make decisions. They **CANNOT** modify the AI's weightings or logic code.
*   **Auditors:** Review the decisions of the Risk Officers and the performance of the AI. They have Read-Only access to both.

## 6. Emergency Stop Authority (The "Kill Switch")

In the event of observed widespread error (e.g., a "flash crash" of false positives due to a data feed error), specific senior roles have **Emergency Stop Authority**.

*   **Mechanism:** A physical or digital "Circuit Breaker" that immediately disconnects the AI inference engine.
*   **Consequence:** The system defaults to "Manual Mode" or "Rule-Based Mode" (legacy systems).
*   **Authorized Roles:** Chief Risk Officer (CRO), Chief Information Security Officer (CISO), or the Head of Compliance.

---
**Governance Officer Signature:** ______________________
**Date:** ______________________
