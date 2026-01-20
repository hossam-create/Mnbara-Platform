# AI Trust & Risk: Regulator Interview Prep Guide

**Document ID:** REG-PREP-GUIDE-001
**Audience:** CRO, CCO, CTO, Head of Trust & Safety
**Purpose:** Preparation for live regulatory examination.
**Context:** This guide provides the *optimal* responses to hostile regulatory questioning, along with "Red Flag" answers that must be avoided.

---

## 1. Automated Decision Making & Autonomy

### Q1. "Does this system make automated decisions that affect your customers?"
*   **Best Answer:** "No. The system is a **Decision Support Tool**. It provides a risk recommendation, but any high-impact action (like a permanent ban or account freeze) requires **Human Confirmation**. We do not engage in solely automated decision-making as defined by GDPR Article 22."
*   **Red Flag (DO NOT SAY):** "Yes, the AI handles everything automatically to save costs." / "The model decides who gets blocked."
*   **Why It Matters:** Admissions of "solely automated" processing trigger strict legal requirements (Right to Explanation, Opt-out) and liability.

### Q2. "Can I see the algorithm that decides who to ban?"
*   **Best Answer:** "We can show you the **Logic Rules** that generate the *recommendation*. Since the final decision is human, the 'algorithm' is actually a combination of these transparent rules and our trained staff's judgment."
*   **Red Flag (DO NOT SAY):** "It's a black box, so we can't really see inside it." / "The neural network weights are proprietary."
*   **Why It Matters:** Regulators demand explainability. "Black box" is a trigger word for "Unsafe."

### Q3. "What happens if the system goes rogue and starts blocking everyone?"
*   **Best Answer:** "We have a **Circuit Breaker** mechanism. If the block rate exceeds a defined safe threshold (e.g., 5% variance), the system automatically defaults to 'Manual Review Only' mode. It is technically incapable of sustaining a mass-block event."
*   **Red Flag (DO NOT SAY):** "That won't happen, the model is very accurate." / "We would just restart the server."
*   **Why It Matters:** Proves you have **Operational Resilience** and Fail-Safe controls.

---

## 2. Bias, Fairness & Logic

### Q4. "How do you ensure this system doesn't discriminate against protected groups?"
*   **Best Answer:** "We practice **Input Sanitization**. The system strictly excludes sensitive fields (Race, Religion, Gender) from the input schema. Furthermore, we use **Deterministic Rules** based on behavior (e.g., velocity, device usage), preventing the system from inferring proxy variables through opaque correlations."
*   **Red Flag (DO NOT SAY):** "We don't know, the data might be biased." / "The AI figures out who is risky."
*   **Why It Matters:** Proves **Fairness by Design** rather than just hoping for the best.

### Q5. "Show me proof that your logic is fair."
*   **Best Answer:** "We conduct **Fairness Audits** where we test rule outcomes across different geographies. Additionally, here is a **Shadow Evaluation Report** [Hand over artifact] showing the impact analysis of our latest rule set before it went live."
*   **Red Flag (DO NOT SAY):** "We haven't had any complaints yet."
*   **Why It Matters:** Evidence-based compliance. You must *prove* fairness, not just claim it.

### Q6. "Why aren't you using Machine Learning? It's the industry standard."
*   **Best Answer:** "We prioritize **Explainability and Control** over raw predictive power in this specific use case. Deterministic systems allow us to guarantee compliance with regulatory explainability requirements that 'Black Box' ML cannot currently meet."
*   **Red Flag (DO NOT SAY):** "We don't have enough data." / "ML is too hard."
*   **Why It Matters:** Positions the choice as a **Strategic Risk Decision**, not a technical deficit.

---

## 3. Operations & Human Oversight

### Q7. "How do you know your human reviewers aren't just rubber-stamping the AI?"
*   **Best Answer:** "We monitor **Reviewer Metrics**. If an agent approves a decision in under 2 seconds (too fast to read), it is flagged. We also measure 'Agreement Rate'—if an agent agrees 100% of the time, they are audited for compliance."
*   **Red Flag (DO NOT SAY):** "We trust our team." / "They are incentivized to move fast."
*   **Why It Matters:** "Automation Bias" (humans blindly trusting computers) is a known regulatory failure mode.

### Q8. "Can a junior analyst change the rules to hide a mistake?"
*   **Best Answer:** "No. We enforce **Segregation of Duties**. The person who authors a rule cannot approve it. Deployment requires a separate DevOps approval. All changes are logged in our Immutable Audit Trail."
*   **Red Flag (DO NOT SAY):** "Yes, they have admin access."
*   **Why It Matters:** Internal Fraud / Governance control.

### Q9. "What happens if a customer complains about a decision?"
*   **Best Answer:** "They trigger a **Human Appeal**. A senior agent reviews the specific Logic Trace (not just the score) and has the authority to overturn the decision. We track these overturns to improve future rules."
*   **Red Flag (DO NOT SAY):** "The decision is final." / "Computers don't make mistakes."
*   **Why It Matters:** **Consumer Protection** and Redress rights.

---

## 4. Drift & Reliability

### Q10. "How do you detect if the system is drifting?"
*   **Best Answer:** "We monitor the **Output Distribution** (Approval vs. Decline rates) daily. We set strict alerting thresholds (e.g., +/- 10% change). We also track 'Rule Trigger Frequency' to find dead rules."
*   **Red Flag (DO NOT SAY):** "We retrain the model every month." (Implies ML) / "We check it manually sometimes."
*   **Why It Matters:** **Model Risk Management** (MRM) requirement.

### Q11. "Scenario: A new fraud attack starts, and your rules miss it. What is your reaction time?"
*   **Best Answer:** "Once detected (via lagging chargeback data), we can author, test (in Shadow Mode), and deploy a new **Hotfix Rule** in under 4 hours using our 'Expedited Change Process'."
*   **Red Flag (DO NOT SAY):** "The AI will eventually learn it."
*   **Why It Matters:** Operational **Agility** and response capability.

---

## 5. Audit & Evidence

### Q12. "Can you reconstruct a decision made 2 years ago?"
*   **Best Answer:** "Yes. We store a **Full Logic Snapshot** (Input Data + Rule Version + Decision Trace) in WORM storage. We can 'replay' that exact transaction today and get the exact same result."
*   **Red Flag (DO NOT SAY):** "We have the logs, but the code has changed since then."
*   **Why It Matters:** **Reproducibility** is key for legal defense and audit.

### Q13. "Where is the evidence that you tested the last change?"
*   **Best Answer:** "Here is the **Shadow Evaluation Report** [Artifact] for Release v12. It shows the simulated outcome on 100,000 historical transactions compared to the previous version, with zero unexpected deviations."
*   **Red Flag (DO NOT SAY):** "We tested it in dev."
*   **Why It Matters:** **Validation** evidence is mandatory for MRM.

---

## 6. Stress Test & Scenario Questions

### Q14. "Scenario: The Chief Revenue Officer orders you to turn off fraud checks for a big sale event. Do you do it?"
*   **Best Answer:** "No. Fraud controls are a **Board-Mandated Policy**. Changes require Risk Committee approval. I would escalate this request to the CRO and General Counsel immediately."
*   **Red Flag (DO NOT SAY):** "Yes, business comes first."
*   **Why It Matters:** Tests **Governance Culture** and independence of the Risk function.

### Q15. "Scenario: You discover a bug that blocked 10,000 legitimate users yesterday. What is your first move?"
*   **Best Answer:** "First, **Containment**: Rollback the faulty rule immediately. Second, **Remediation**: Run a batch job to unblock those specific users and notify them. Third, **Reporting**: Notify the Regulator (you) if it meets the 'Material Incident' threshold."
*   **Red Flag (DO NOT SAY):** "Fix it quietly and hope no one notices."
*   **Why It Matters:** **Incident Management** integrity.

### Q16. "Prove to me that this system isn't accessing the payment ledger directly."
*   **Best Answer:** "Here is the **Network Architecture Diagram** [Artifact]. You can see the firewall rules explicitly block Outbound Traffic from the Risk Engine to the Core Ledger. It has Read-Only permissions on the Data Warehouse replica only."
*   **Red Flag (DO NOT SAY):** "I think it's separate."
*   **Why It Matters:** **Security Architecture** and Blast Radius containment.

---

## 7. Strategic & Accountability

### Q17. "Who owns the risk of this system? The Vendor or You?"
*   **Best Answer:** "We do. The **Chief Risk Officer** owns the policy. The system is just the tool we use to enforce our policy. We do not outsource accountability."
*   **Red Flag (DO NOT SAY):** "The software vendor indemnifies us."
*   **Why It Matters:** **Third-Party Risk Management** (TPRM). You cannot outsource liability.

### Q18. "Is this system 'training' on our data?"
*   **Best Answer:** "No. It is **stateless and deterministic**. It processes data to render a verdict and then discards the context. It does not update internal weights or 'learn' from the transaction."
*   **Red Flag (DO NOT SAY):** "Yes, it gets smarter with every transaction."
*   **Why It Matters:** Data Privacy (GDPR) and Model Integrity.

### Q19. "Why should we trust you with this technology?"
*   **Best Answer:** "Because we have built it to be **Safe, Transparent, and Limited**. We have purposely chosen control over complexity. We have invited you (the regulator) to see the 'Glass Box'. We have nothing to hide."
*   **Red Flag (DO NOT SAY):** "Because AI is the future."
*   **Why It Matters:** Builds **Institutional Trust**.

### Q20. "What is your 'Kill Switch'?"
*   **Best Answer:** "The Duty Officer can toggle the **'Bypass Mode'** switch physically in the admin console. This instantly routes all traffic to the default 'Manual Review' queue or 'Fail Safe' state, bypassing the AI entirely."
*   **Red Flag (DO NOT SAY):** "We pull the plug on the server."
*   **Why It Matters:** Ultimate **Control** in a crisis.
