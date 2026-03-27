# ANALYTICS GUARDRAILS & BIAS MONITORING
## Metrics Safety Policy

**Classification:** OPERATIONAL — Data Science / Risk
**Status:** Active Policy
**Document Owner:** Chief Risk Officer

---

## 1. PROHIBITED METRICS (The "Never Use" List)

The following metrics must **NEVER** be used as inputs for automated enforcement, scoring, or user penalty decisions. They may act as *signals* for human review, but never for independent judgment.

### 1.1 Protected Class Proxies
*   **Postal/Zip Code:** (Strong proxy for race/income)
*   **Surname Origin:** (Proxy for ethnicity)
*   **Device Language:** (Proxy for nationality)
*   **Email Domain:** (e.g., discrimination against non-standard domains)
*   **Device Type (High-end vs Low-end):** (Proxy for income status)

### 1.2 Behavior Proxies
*   **Mouse/Click Speed:** (Biased against users with motor impairments)
*   **Typing Speed/Mistakes:** (Biased against non-native speakers or dyslexic users)
*   **Time of Day usage:** (Biased against shift workers or diverse time zones)
*   **App Backgrounding:** (Checking other apps is not suspicious behavior per se)

### 1.3 Context Blindness
*   **Message Length:** Short messages are not necessarily "rude".
*   **Response Latency:** Slow reply time does not equal "fraud" or "unreliability" (life happens).

---

## 2. AUTOMATION BIAS PREVENTION

Human reviewers often over-trust AI outputs ("The computer says he's a fraudster"). We implement the following to break this bias:

### 2.1 The "Advisory" Labeling Requirement
All AI outputs presented to humans must carry explicit uncertainty labels:
*   **Allowed:** "Risk Score: 85/100 (Potential Concern)"
*   **Prohibited:** "Verdict: GUILTY" or "Fraudster Detected"

### 2.2 Counterfactual Presentation
When AI suggests a negative enforcement (e.g., "Block User"), the interface MUST present:
1.  **The Evidence FOR the decision.**
2.  **At least one potential exculpatory factor.** (e.g., "However, this user has a 5-year positive history.")
    *   *Purpose:* Forces the human to weigh evidence, not rubber-stamp.

### 2.3 "Why?" Buttons
No score can be presented without expanded context available on click.
*   *Bad:* "Trust: Low"
*   *Good:* "Trust: Low because account age < 1 day AND zero social verifications."

---

## 3. INTERPRETATION RED FLAGS

Analysts must be trained to spot these logical fallacies in risk data:

### 3.1 The "New User" Fallacy
*   **Observation:** "This user has no history and is making a large transaction."
*   **Bias:** Assuming "No Data = Bad Data".
*   **Correction:** New users are the growth engine. High value != Fraud. Verify, don't punish.

### 3.2 The "Bot Behavior" Fallacy
*   **Observation:** "User replies instantly and pastes identical text."
*   **Bias:** Assuming automation is malicious.
*   **Correction:** Professionals use clipboards/snippets for efficiency. Check content utility, not just mechanics.

### 3.3 The "Language" Fallacy
*   **Observation:** "User's grammar is poor / broken English."
*   **Bias:** Associating fluency with honesty.
*   **Correction:** Global platforms have global users. Evaluate intent, not syntax.

### 3.4 The "Cross-Border" Fallacy
*   **Observation:** "IP address in Country A, shipping to Country B, card from Country C."
*   **Bias:** Geography mismatch = Crime.
*   **Correction:** Expats, travelers, and digital nomads exist. This is a *verification trigger*, not a legitimate *rejection reason* on its own.

---

## 4. ANALYTICS USAGE TIERS

We classify metrics into 3 Safety Tiers:

### Tier A: Enforcement Grade (Safe for Automation)
*   *Can be used to auto-block.*
*   Examples: Stolen Credit Card match, known sanctions list match, technically impossible velocity (100 txns in 1 sec).

### Tier B: Investigative Grade (Human Review Only)
*   *Can trigger an alert, but never an auto-action.*
*   Examples: IP distance mismatch, device fingerprint change, high-value transaction, unusual category interest.

### Tier C: Informational Grade (Context Only)
*   *Can participate in a dashboard, but no alerts.*
*   Examples: Browsing time, average session length, preferred categories.

---

## 5. AUDIT MECHANISM

### 5.1 The Bias Canary
We run a "Shadow Model" on a diverse dataset to check for disparate impact.
*   *Metric:* If the Rejection Rate for [Region A] deviates >10% from the global baseline without a specifically identified fraud ring, an **ALARM** triggers for manual audit.

### 5.2 The "False Positive" Escalation
If a human overturns an AI risk flag, that data point is:
1.  Tagged "False Positive".
2.  Fed back into the model to penalize the specific rule that triggered it.
3.  Reviewed by a Risk Manager weekly.

---

**Attestation:** This policy ensures our analytics inform human judgment rather than replacing it, preventing systemic discrimination.
