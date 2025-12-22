# CENTRAL BANK Q&A RUNTIME (EXECUTIVE CHEAT SHEET)

**Confidential & Privileged**
**Use Situation:** Live Regulator Meetings / Crisis Response
**Updates:** Continuous (Live Doc)

---

## 1. The "Elevator Pitch" (System Definition)
> "The AI Trust OS is a **deterministic, non-autonomous decision-support tool** that provides risk intelligence to human compliance officers under a strict **Human-in-the-Loop** governance framework."

---

## 2. The "Safe" Vocabulary List

| **ALWAYS SAY (Green Words)** | **NEVER SAY (Red Words)** |
| :--- | :--- |
| **Deterministic** (Predictable) | **Generative** (Creative/Hallucinating) |
| **Decision Support** | **Autonomous Agent** |
| **Advisory / Recommendation** | **Decision Maker** |
| **Frozen Core** (Static logic) | **Online Learning / Self-Evolving** |
| **Human-in-the-Loop** | **Fully Automated** |
| **Fail-Safe / Circuit Breaker** | **Unstoppable** |
| **Drift Monitoring** | **Retraining on the fly** |

---

## 3. Top 15 "High Risk" Regulator Questions & Answers

**Q1: "Does the system make financial decisions on its own?"**
> **A:** **No.** It is advisory only. It highlights risks, but a human officer must explicitly review and sign off on any critical blocking or financial action.

**Q2: "What if the model is wrong and blocks a good customer?"**
> **A:** The system sets a "Temporary Hold" for human review. The human analyst corrects the error. No funds are touched or lost; it is purely a delay for safety.

**Q3: "How do you explain the decision (Black Box problem)?"**
> **A:** The system is **not** a black box. We use SHAP (Shapley) values to mathematically attribute every score to specific inputs (e.g., "Score is high because Geo-IP mismatch").

**Q4: "Can it discriminate against minorities?"**
> **A:** We use **Input Exclusion**: protected class data (race, religion) is physically removed from the training set. We also perform quarterly statistical fairness audits to prove non-bias.

**Q5: "Does it learn from my live data?"**
> **A:** **No.** It operates on a "Frozen Core." It does not learn in real-time. Updates are offline, tested in a sandbox, and manually deployed only after validation.

**Q6: "Who is liable if the AI fails?"**
> **A:** The Bank/Institution retains 100% legal liability. The AI is a tool; the human operator is the accountable officer.

**Q7: "Can we audit a decision from 2 years ago?"**
> **A:** **Yes.** We store the Model Version, Input Snapshot, and Logic State in WORM (Write-Once) storage for 7 years. We can reconstruct any past decision exactly.

**Q8: "What happens if the internet cuts out or the system crashes?"**
> **A:** We have a "Fail-Open" hardware circuit breaker. Operations revert immediately to manual review or legacy rules. Business continuity is prioritized.

**Q9: "Can a hacker poison the AI logic?"**
> **A:** Since there is no "online learning," there is no feedback loop for a hacker to poison. The model logic is read-only in production.

**Q10: "Is the data sent to OpenAI or Google?"**
> **A:** **No.** All inference runs on-premise or in our private, isolated VPC. No PII ever leaves our secure enclave to third-party public APIs.

**Q11: "How do you manage Model Drift?"**
> **A:** We monitor PSI (Population Stability Index) daily. If data patterns shift beyond a 0.1 threshold, an alert triggers a human review to decide if the model needs offline retraining.

**Q12: "Can the AI override a human?"**
> **A:** **Never.** The hierarchy is absolute. A human officer can override the AI (with a log note), but the AI cannot override a human.

**Q13: "Do you use Shadow Mode?"**
> **A:** **Yes.** Every update runs in "Shadow Mode" (silent parallel run) for 30 days to prove safety before it is allowed to affect live customers.

**Q14: "How complex is the underlying math?"**
> **A:** It uses standard industry methodologies (e.g., Random Forest / Gradient Boosting) validated by our Model Risk Management team. It is complex but standard and explainable.

**Q15: "Can you turn it off right now?"**
> **A:** **Yes.** We have an Emergency Stop Protocol authorized by the CRO. It takes less than 5 minutes to revert to legacy systems.

---

## 4. Emergency Escalation
*If the regulator is not satisfied or asks for "Source Code Inspection":*
> "We are happy to arrange a deep-dive technical workshop with our Chief Data Scientist and Independent Validator to walk through the validation reports and white-box testing results."

---
**Verified Current:** [Date: 2025-12-18]
**Owner:** Regulatory Affairs
