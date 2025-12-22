# Second-Line AI Oversight Model

**Document ID:** GOV-2LOD-001
**Purpose:** Establishing Independent Risk & Compliance Oversight (Second Line of Defense)
**Owner:** Chief Risk Officer (CRO)
**Applicability:** Risk Management Function
**Status:** ACTIVE POLICY

---

## 1. Governance Structure: The Three Lines of Defense

To ensure robust governance of the AI Trust & Risk Operating System, Mnbara adopts the standard "Three Lines of Defense" model:

1.  **First Line (Operations & Tech):** The Trust & Safety agents and Engineering teams who build/operate the system daily. They "own" the risk.
2.  **Second Line (Risk & Compliance):** The independent function defined in this document. They "oversee" and challenge the risk.
3.  **Third Line (Internal Audit):** The independent assurance function that validates the first two lines.

---

## 2. Mandate of the Second Line

The Second Line of Defense (2LOD) has the mandate to efficiently challenge the First Line's assumptions, validate their controls, and monitor risk exposure independently of commercial or operational pressures.

### 2.1 Independence
The 2LOD reports directly to the **Risk Committee of the Board**, bypassing the Engineering and Product leadership structures.

---

## 3. Oversight Activities

### 3.1 Quarterly Decision Quality Review (DQR)
Every quarter, the 2LOD will sample a statistical cross-section (e.g., n=100) of:
1.  **AI False Positives:** Where the system blocked, and the human confirmed, but the customer complained.
2.  **Human Overrides:** Where the AI blocked, but the human overrode.
3.  **Edge Cases:** Decisions made with low confidence scores.

**Goal:** Determine if the *Logic Rules* are still aligned with the *Risk Appetite*.

### 3.2 Bias & Fairness Audits
The 2LOD runs independent tests using "Synthetic Probes" (fake users with varying demographics) to verify that rule logic does not produce disparate outcomes for protected groups.

### 3.3 Rule Change Validation
The 2LOD holds **Veto Power** over any major change to the Core Risk Policy. Engineering cannot deploy a new "Logic Set" that fundamentally alters risk tolerance without 2LOD sign-off.

---

## 4. Operational Authority (The "Emergency Brake")

The Chief Risk Officer (CRO) and their delegates in the 2LOD possess the unilateral authority to intervene in operations under specific conditions:

### 4.1 Authority to Pause
If the system demonstrates "Runaway Behavior" (e.g., a massive spike in false blocks) and the First Line fails to act within 15 minutes, the 2LOD is authorized to order an immediate **System Pause** (degrade to Manual Mode).

### 4.2 Authority to Mandate Retraining
If "Canary Task" failure rates (Automation Bias) exceed safety thresholds, the 2LOD can mandate the suspension of specific First Line agents until retraining is completed.

---

## 5. Reporting Pipeline

The 2LOD generates the **Quarterly AI Risk Report**, submitted to the Board Risk Committee. This report tracks:
*   Drift Metrics
*   Override Rates
*   Incident Integrity
*   Regulatory Compliance Status

This reporting line ensures that the Board receives an unvarnished view of AI safety, unfiltered by the product team's optimism.

---
**Approved By:**
Board Risk Committee
Chief Risk Officer
