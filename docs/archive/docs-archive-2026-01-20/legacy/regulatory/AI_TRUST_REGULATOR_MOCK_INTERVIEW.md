# Mock Regulator Interview: AI Trust & Risk Operating System

**Document ID:** REG-INTERVIEW-PREP-001
**Audience:** Chief Risk Officer (CRO), Chief Compliance Officer (CCO), AI Governance Lead
**Context:** Preparation for Fintech License Audit / Central Bank Inspection

---

## SECTION 1 — CORE SAFETY & CONTROL

### Q1. Regulator: "Can this system unilaterally freeze customer assets or block accounts without human intervention?"
**Ideal Answer:** "No. The system is architected as a Decision Support Tool, not an Autonomous Agent. It has 'Read-Only' access to the core banking ledger. It can place a temporary 'Provisional Hold' flag, but a permanent freeze or account closure requires a digitally signed confirmation from an authorized human officer."
**Why Acceptable:** Confirms the "Human-in-the-Loop" safety brake preventing runaway automated harm.

### Q2. Regulator: "Does the system employ online learning or self-modification in production?"
**Ideal Answer:** "No. The system utilizes deterministic, version-controlled Rule Sets. It has zero capability to rewrite its own code, adjust weightings, or 'learn' from live traffic. All logic changes must pass through a strict SDLC (Software Development Life Cycle) and be deployed via a controlled release pipeline."
**Why Acceptable:** Eliminates the risk of "Model Drift" or the AI learning bias/bad behaviors from corrupted data streams.

### Q3. Regulator: "How do you guarantee that the same input will always produce the same decision?"
**Ideal Answer:** "The system is purely deterministic. We use static Expert System logic rules, not probabilistic neural networks. If we replay a transaction from 5 years ago with the exact same Context Vector and Rule Set Version, the mathematical output is bit-perfect identical."
**Why Acceptable:** Solves the "Reproducibility" requirement critical for audits.

### Q4. Regulator: "If the system receives partial or missing data, does it guess?"
**Ideal Answer:** "No. The system has strict `on_missing` behavior definitions. If critical data (e.g., KYC status) is missing, it defaults to a 'Fail-Safe' state (Manual Review) rather than attempting to infer or hallucinate a value."
**Why Acceptable:** Demonstrates conservative risk appetite.

### Q5. Regulator: "What happens if the API connection to the Risk Engine times out?"
**Ideal Answer:** "We employ a 'Circuit Breaker' pattern. If the Risk Engine is unreachable, the transaction is routed to a default fallback queue for manual processing. We never 'Fail Open' (approve without checking) on high-value transactions."
**Why Acceptable:** Ensures operational resilience and prevents fraud gaps during outages.

### Q6. Regulator: "Can a rogue developer change the risk rules directly in the database?"
**Ideal Answer:** "No. Risk Rules are treated as Code. They are stored in immutable version control, not a mutable database. Changes require multi-person review and separate deployment authorization. Database access is Read-Only for runtime services."
**Why Acceptable:** "Segregation of Duties" and "Change Management" controls are robust.

### Q7. Regulator: "Does the system understand the semantic meaning of 'High Risk'?"
**Ideal Answer:** "The system does not 'understand' context; it evaluates logical predicates defined by human experts. 'High Risk' is simply a label assignment based on a human-calibrated score threshold."
**Why Acceptable:** Avoids anthropomorphizing the AI; admits it's just a calculator.

### Q8. Regulator: "Is there a 'Kill Switch'?"
**Ideal Answer:** "Yes. The Duty Officer has 'Emergency Rollback' authority to revert the active Rule Set to the `Last_Known_Good_Version` instantly via the governance dashboard if aberrant behavior is detected."
**Why Acceptable:** Provides an immediate manual override for safety.

### Q9. Regulator: "How strictly is the operational environment sandboxed?"
**Ideal Answer:** "The functionality is isolated in ephemeral containers with no outbound network access to the public internet, preventing any potential data exfiltration or external command-and-control usage."
**Why Acceptable:** cybersecurity best practice.

### Q10. Regulator: "Can the system override a human decision?"
**Ideal Answer:** "Never. The architecture adheres to 'Human Supremacy'. If a human operator marks a transaction as Safe, the system log records the override, but it physically cannot block the transaction against the human's command."
**Why Acceptable:** Clarifies the hierarchy of authority clearly.

---

## SECTION 2 — BIAS, FAIRNESS & DRIFT

### Q11. Regulator: "How do you detect if the model targets specific demographics?"
**Ideal Answer:** "We enforce 'Explicit Feature Selection'. Protected attributes (Race, Religion, Gender) are technically blocked from entering the Feature Vector. The system essentially has no knowledge of these attributes to bias against."
**Why Acceptable:** "Privacy by Design" and exclusion of protected classes.

### Q12. Regulator: "What if the proxy variables (e.g. Zip Code) create indirect bias?"
**Ideal Answer:** "We conduct pre-deployment 'Fairness Audits' where we test rule impact across geographic regions. Post-deployment, we monitor 'Disparate Impact' metrics. If rejection rates in one region deviate significantly from the norm without a correlated fraud signal, the rule is suspended."
**Why Acceptable:** Shows proactive management of "Redlining" risks.

### Q13. Regulator: "How do you monitor for Model Drift?"
**Ideal Answer:** "Since the logic is static, we monitor 'Concept Drift' in the input data and 'Output Distribution Drift'. We track the ratio of decisions (Approve/Review/Decline) daily. A deviation >10% triggers an alert."
**Why Acceptable:** Standard statistical process control.

### Q14. Regulator: "Explain your False Positive management process."
**Ideal Answer:** "False Positives represent consumer friction. We measure the 'Overturn Rate' (how often humans override the AI). If a specific rule causes high overturns, it is flagged as 'Noisy' and sent back for re-calibration."
**Why Acceptable:** Focuses on consumer protection and system efficiency.

### Q15. Regulator: "Explain your False Negative management process."
**Ideal Answer:** "False Negatives represent missed risk (Fraud). When fraud is confirmed post-facto on an approved transaction, we feed that case into our 'Regression Suite' to author a new deterministic rule that would have caught it."
**Why Acceptable:** Shows a continuous improvement loop based on actual loss data.

### Q16. Regulator: "Do you use 'Shadow Evaluation'?"
**Ideal Answer:** "Yes. No High-Impact rule goes live without a 48-hour Shadow Phase where it evaluates live traffic silently. We compare its output against the incumbent logic to verify stability."
**Why Acceptable:** Standard operational risk mitigation.

### Q17. Regulator: " If the model performance degrades, does it fix itself?"
**Ideal Answer:** "No. The system alerts human operators. It cannot self-correct, as that would imply uncontrolled learning. Humans must diagnose and deploy a fix."
**Why Acceptable:** Reaffirms "No Online Learning."

### Q18. Regulator: "How do you ensure historical consistency?"
**Ideal Answer:** "We maintain a 'Golden Dataset' of historical scenarios. Every new release is thoroughly back-tested against this dataset to ensure it doesn't accidentally regress on known fraud patterns."
**Why Acceptable:** Standard QA practice.

### Q19. Regulator: "Is the threshold for 'High Risk' dynamic?"
**Ideal Answer:** "No, benchmarks are static configuration values approved by the Risk Committee. They do not float based on daily volume unless explicitly changed via a governance request."
**Why Acceptable:** Prevention of unpredictable/volatile behavior.

### Q20. Regulator: "Can the system explain *why* it biased a certain way?"
**Ideal Answer:** "Yes. Every decision comes with a Logic Trace. We can point to the specific line of logic (e.g., 'Velocity > 5') that caused the outcome, proving it was behavioral, not demographic."
**Why Acceptable:** "Explainable AI" (XAI) is a regulatory requirement.

---

## SECTION 3 — GOVERNANCE & ACCOUNTABILITY

### Q21. Regulator: "Who is legally responsible for a bad AI decision?"
**Ideal Answer:** "The organization, specifically the Senior Manager designated under the Senior Managers Certification Regime (e.g. the CRO). The algorithm is not a legal entity and cannot hold liability."
**Why Acceptable:** "The Algorithm is not a legal entity" is the key phrase.

### Q22. Regulator: "Who approves changes to the Rule Sets?"
**Ideal Answer:** "A quorum of the Risk Committee. The change request must be signed off by Risk Strategy (business owner) and Compliance (regulatory check) before Engineering can deploy."
**Why Acceptable:** Separation of "Definition" vs "Implementation."

### Q23. Regulator: "What is the role of the Board?"
**Ideal Answer:** "The Board approves the overall Risk Appetite Framework that sets the bounds for the system (e.g., 'Target Fraud Rate < 10bps'). They receive quarterly reports on system performance and override rates."
**Why Acceptable:** Proper Board-level oversight.

### Q24. Regulator: "Is there Separation of Duties?"
**Ideal Answer:** "Yes. The Data Scientists who mock up the rules do not have permissions to deploy them to Production. Deployment is handled by DevOps after formal approval."
**Why Acceptable:** Prevents "marking your own homework."

### Q25. Regulator: "Who owns the Audit Trail?"
**Ideal Answer:** "The Audit function. The logs are written to immutable storage ('WORM'). Even System Admins cannot delete or alter historical decision logs."
**Why Acceptable:** Integrity of evidence.

### Q26. Regulator: "How often is the system reviewed?"
**Ideal Answer:** "We conduct a 'Model Health Check' monthly and a full 'External Validation' annually by an independent third party."
**Why Acceptable:** Compliance with Model Risk Management (MRM) standards.

### Q27. Regulator: "Are human operators trained to challenge the AI?"
**Ideal Answer:** "Yes. Training emphasizes that the AI is advisory. Operators are evaluated not just on speed, but on their accuracy in catching AI errors (False Positives/Negatives)."
**Why Acceptable:** Mitigates "Automation Bias" (humans blindly trusting machines).

### Q28. Regulator: "What happens if a Key Person leaves?"
**Ideal Answer:** "The logic is documented in the Code and the Rule Repository, not just in an employee's head. The system documentation allows a new team to pick up immediately."
**Why Acceptable:** Business Continuity Planning (BCP).

### Q29. Regulator: "Can Marketing influence risk thresholds?"
**Ideal Answer:** "No. Marketing has no write access or approval authority over Risk Logic. Segregation is absolute."
**Why Acceptable:** Conflict of interest management.

### Q30. Regulator: "How do you handle 'Explainability' to the Board?"
**Ideal Answer:** "We do not show raw code. We present 'Plain English' policy equivalents (e.g., 'We block high-value transfers at 3 AM from new devices')."
**Why Acceptable:** Appropriate altitude of reporting.

---

## SECTION 4 — DATA, PRIVACY & GDPR

### Q31. Regulator: "Does this system constitute 'Automated Decision Making' under GDPR Art. 22?"
**Ideal Answer:** "No. The system produces a 'Recommendation'. For any decision with legal effect (e.g., account closure), a human review is mandatory. Therefore, it does not fall under the prohibition of Art. 22."
**Why Acceptable:** The standard legal defense for HITL systems.

### Q32. Regulator: "Do you train on customer data?"
**Ideal Answer:** "No. We do not use customer PII to train generative models or extensive ML weights. We use the data solely for transactional verification against static rules."
**Why Acceptable:** Minimization of privacy risk.

### Q33. Regulator: "Can a user execute their 'Right to Explanation'?"
**Ideal Answer:** "Yes. Because our system is deterministic, we can generate a granular 'Statement of Reasons' for any outcome, explaining exactly which policy criteria were not met."
**Why Acceptable:** Transparency compliance.

### Q34. Regulator: "How do you handle 'Right to Erasure' vs AML Retention efficiency?"
**Ideal Answer:** "We respect erasure for marketing/optional data. However, Audit Logs and Decision Records are retained for the statutory 7-year period as mandated by AML regulations, which supersedes the Right to Erasure for this specific scope."
**Why Acceptable:** Correct legal hierarchy (AML Law > GDPR Delete Request).

### Q35. Regulator: "Do you process Biometrics?"
**Ideal Answer:** "We process an 'Authentication Result' (True/False) from the device. We do not ingest, store, or process the raw biometric templates (Face/Fingerprint) within the Risk System."
**Why Acceptable:** Avoiding the "High Risk" classification of biometric processing.

### Q36. Regulator: "Is data minimized?"
**Ideal Answer:** "Yes. The system only fetches the specific fields required for the active rules. It does not ingest the 'Wait and See' data lake."
**Why Acceptable:** Principle of Data Minimization.

### Q37. Regulator: "Where is the data hosted?"
**Ideal Answer:** "Data residency is strictly enforced. Checks for EU customers occur in EU instances; US in US. No PII crosses borders for decisioning."
**Why Acceptable:** Data Sovereignty compliance.

### Q38. Regulator: "Are IDs pseudonymized?"
**Ideal Answer:** "Yes. The Risk Engine operates on Hashed User IDs. The re-identification key is held separately in the Identity Service, accessed only when a human reviewer loads the case."
**Why Acceptable:** Security-in-Depth.

---

## SECTION 5 — INCIDENT & FAILURE SCENARIOS

### Q39. Regulator: "Scenario: The AI rejects all transactions for 1 hour. What do you do?"
**Ideal Answer:** "1. Declare Sev-1 Incident. 2. Enable 'Emergency Circuit Breaker' (bypass/degrade mode). 3. Rollback to previous Rule Set. 4. Notify Regulator of significant outage."
**Why Acceptable:** Clear Incident Response Plan.

### Q40. Regulator: "Scenario: A human operator systematically approves Fraud that the AI caught."
**Ideal Answer:** "The 'Divergence Monitor' would flag this operator's Override Rate as an anomaly (e.g., 99% override vs team avg 5%). This triggers an internal investigation for collusion/incompetence."
**Why Acceptable:** Internal Fraud detection.

### Q41. Regulator: "Scenario: We (The Regulator) order you to change a rule immediately."
**Ideal Answer:** "We have a 'Hotfix' process for regulatory mandates that bypasses the standard backlog but still requires regression testing to ensure the fix doesn't break other controls."
**Why Acceptable:** Agility + Control.

### Q42. Regulator: "Scenario: The inputs from the Credit Bureau are wrong."
**Ideal Answer:** "The system tracks 'Data Quality Health'. If input null rates verify high, the system pauses auto-decisioning for that path and defaults to manual review to prevent mass wrongful rejections."
**Why Acceptable:** Resilience against vendor failure.

### Q43. Regulator: "Scenario: You discover a bug that biased decisions for 6 months."
**Ideal Answer:** "1. Report breach to Regulator. 2. Re-run all affected transactions through the corrected logic (Back-Cast). 3. Identify customers harmed. 4. Execute remediation/compensation plan."
**Why Acceptable:** Radical transparency and remediation focus.

### Q44. Regulator: "Scenario: The system is under DDoS attack."
**Ideal Answer:** "The Risk Engine is stateless and horizontally scalable. We auto-scale to absorb load. If overwhelmed, we shed load to 'Fail Safe' (Review) to protect the core ledger."
**Why Acceptable:** Operational resilience.

### Q45. Regulator: "Scenario: You lose your Audit Logs."
**Ideal Answer:** "Impossible by design. Logs are written synchronously to dual-region WORM storage. Loss of logs treats the system as 'Critical Failure' and halts processing."
**Why Acceptable:** Treating Audit as a critical dependency.
