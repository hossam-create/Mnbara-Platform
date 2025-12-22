# CENTRAL BANK LIVE INTERVIEW DRILL: AI TRUST & RISK SYSTEM

**Confidential & Privileged**
**Purpose:** Preparation for On-Site Supervisory Visits / Section 166 Reviews
**Audience:** Chief Risk Officer, CTO, Head of Compliance
**Status:** **MANDATORY REVIEW** prior to regulator interaction

---

## I. Executive Summary of Defense Posture

*   **System Nature:** Deterministic, Rule-Assisted Expert System. (Avoid the term "Generative AI").
*   **Agency:** Non-Autonomous. Advisory Only.
*   **Liability:** 100% Human. The human "pushes the button."
*   **Architecture:** Frozen Core. No online learning.

---

## II. Technical Architecture & Stability (Questions 1-8)

### Q1: "Does the model learn from production data in real-time?"
*   **✅ SAFE ANSWER:** "No. The model is a 'Frozen Core'. It is deterministic. All retraining happens offline in a sandbox environment and requires human approval to be deployed as a new version."
*   **🚩 RED FLAG:** "Yes, it constantly gets smarter as more users transact." (Implies potential for poisoning/drift).

### Q2: "Can you explain exactly why the model flagged Transaction X?"
*   **✅ SAFE ANSWER:** "Yes. We can provide the specific feature weights (e.g., velocity, geo-location) that exceeded the pre-defined risk threshold. We use SHAP values to explain every output."
*   **🚩 RED FLAG:** "It’s a neural network, so the logic is a bit of a black box, but it's very accurate." (Unacceptable opacity).

### Q3: "What happens if there is a 'flash crash' or massive network outage?"
*   **✅ SAFE ANSWER:** "The system has a hardware 'Fail-Open' mode. It defaults immediately to manual human review or legacy rule-based processing. Business continuity is prioritized over AI availability."
*   **🚩 RED FLAG:** "It runs in the cloud, so it shouldn't go down." (Naive).

### Q4: "How do you detect Model Drift?"
*   **✅ SAFE ANSWER:** "We monitor the Population Stability Index (PSI) daily. If the input distribution deviates by >0.1 PSI, a 'Stale Model' alert is triggered to the Risk Team."
*   **🚩 RED FLAG:** "We retrain it every week to keep it fresh." (Operational risk).

### Q5: "Is customer data sent to third-party AI providers (e.g., OpenAI, Google)?"
*   **✅ SAFE ANSWER:** "No. All risk inference runs strictly on-premise (or in our private VPC). No PII ever leaves our secure enclave."
*   **🚩 RED FLAG:** "We use an API for some sentiment analysis." (Data sovereignty breach).

### Q6: "Can a developer change the risk thresholds secretly?"
*   **✅ SAFE ANSWER:** "No. We enforce Segregation of Duties. Developers have no write access to production configurations. Changes require 'Four-Eyes' approval from Risk & Compliance."
*   **🚩 RED FLAG:** "Yes, we have a CI/CD pipeline that pushes code in minutes." (Lack of governance).

### Q7: "How do you handle 'Hallucinations'?"
*   **✅ SAFE ANSWER:** "This system is not a Large Language Model (LLM). It is a discriminative model (Classifier) that outputs a probability score (0-1). It does not generate text or 'hallucinate' facts."
*   **🚩 RED FLAG:** "We use prompt engineering to reduce hallucinations." (Wrong technology stack).

### Q8: "What is your latency budget for inference?"
*   **✅ SAFE ANSWER:** "Strict 200ms budget. If inference takes longer, the request times out and defaults to the rules engine to prevent payment friction."
*   **🚩 RED FLAG:** "It takes as long as it needs." (Availability risk).

---

## III. Governance & Liability (Questions 9-16)

### Q9: "Who is legally responsible if the AI flags a false positive that harms a customer?"
*   **✅ SAFE ANSWER:** "The Bank/Platform is responsible. The AI is a tool, not a legal entity. The final decision rests with the human officer who reviews the flag."
*   **🚩 RED FLAG:** "The algorithm made a mistake." (Abdicating responsibility).

### Q10: "Can the AI block an account automatically?"
*   **✅ SAFE ANSWER:** "No. The system can only recommend a 'Temporary Hold'. A human analyst must review and confirm the block within [X] minutes. No permanent adverse action is fully automated."
*   **🚩 RED FLAG:** "Yes, to stop fraud fast, we auto-ban." (Due process violation).

### Q11: "Do you use 'Shadow Mode' before deployment?"
*   **✅ SAFE ANSWER:** "Yes. Every new model allows runs in 'Shadow Mode' (Champion/Challenger) for minimally 30 days. We only promote it if it proves safer than the existing model."
*   **🚩 RED FLAG:** "We test it in staging, then push it live." (Insufficient production validation).

### Q12: "How do you ensure the model doesn't discriminate (e.g., racial bias)?"
*   **✅ SAFE ANSWER:** "We practice 'Input Exclusion'—protected class variables are physically removed from the dataset. We also conduct quarterly 'Fairness Audits' to test error rates across demographic proxies."
*   **🚩 RED FLAG:** "The algorithm is math, it doesn't see race." (Provably false assumption).

### Q13: "What is your 'Kill Switch' procedure?"
*   **✅ SAFE ANSWER:** "The Chief Risk Officer has authority to invoke the 'Emergency Stop' protocol, which disconnects the AI inference engine and reverts to legacy rules immediately."
*   **🚩 RED FLAG:** "We would have to ask the engineering team to rollback the server." (Too slow).

### Q14: "How long are inference logs kept?"
*   **✅ SAFE ANSWER:** "All decision inputs, model versions, and outputs are stored in WORM (Write-Once-Read-Many) storage for 7 years to ensure full regulatory reconstructability."
*   **🚩 RED FLAG:** "Logs are rotated every 90 days." (Compliance breach).

### Q15: "Are the Risk Committee members technical enough to understand the model?"
*   **✅ SAFE ANSWER:** "The Committee includes an independent technical advisor. Furthermore, all models are presented with 'Business Translation' documents explaining their function in plain language."
*   **🚩 RED FLAG:** "They just sign off on what the data scientists say." (Governance failure).

### Q16: "Does the model operate independently of the Core Banking System?"
*   **✅ SAFE ANSWER:** "It is loosely coupled via API. It acts as an advisor to the Core. It has no direct database access to modify balances or ledgers."
*   **🚩 RED FLAG:** "It is integrated directly into the database." (Security risk).

---

## IV. Operational & Fraud Specifics (Questions 17-23)

### Q17: "Can the model flag 'Structuring' (Smurfing)?"
*   **✅ SAFE ANSWER:** "Yes, using deterministic velocity rules and network graph analysis to detect linked low-value transactions."
*   **🚩 RED FLAG:** "It tries to guess intent." (Too vague).

### Q18: "What is the false positive rate?"
*   **✅ SAFE ANSWER:** "Currently [X]%. We accept a higher false positive rate (conservative posture) to ensure we do not miss financial crime, provided human review capacity is sufficient."
*   **🚩 RED FLAG:** "It's near zero." (Impossible/Lying).

### Q19: "How often is the human overriding the AI?"
*   **✅ SAFE ANSWER:** "We track the 'Override Rate'. If it exceeds 20%, it triggers a Model Review, as it implies the model is losing alignment with human risk appetite."
*   **🚩 RED FLAG:** "The humans usually just agree with the AI." (Automation Bias).

### Q20: "Can a hacker 'poison' your training data?"
*   **✅ SAFE ANSWER:** "Training data is snapshotted from historical rigid ledgers. We do not use user-generated feedback loops for training without manual curation, preventing poisoning attacks."
*   **🚩 RED FLAG:** "We trust our data sources." (Naive).

### Q21: "Is the model explained to the customer?"
*   **✅ SAFE ANSWER:** "If a customer is denied, we provide the 'Principal Reason Codes' (e.g., 'Verification Failure'), derived from the model's output, ensuring transparency."
*   **🚩 RED FLAG:** "No, it's proprietary trade secrets." (GDPR/Consumer right violation).

### Q22: "What happens if the Input Data is corrupt?"
*   **✅ SAFE ANSWER:** "The system has strict schema validation. If data is malformed, it rejects the request *before* inference. We do not allow the model to hallucinate on bad data."
*   **🚩 RED FLAG:** "The model tries its best to interpret it." (Unpredictable behavior).

### Q23: "How do you detect 'Model Decay'?"
*   **✅ SAFE ANSWER:** "We measure 'Confidence Decay'. If the average probability score for 'safe' transactions starts dropping over time, we know the model's boundary is blurring."
*   **🚩 RED FLAG:** "We wait for customer complaints." (Reactive).

---

## V. Advanced Escalation & Traps (Questions 24-30)

### Q24: "Does this system maximize profit or minimize risk?" (The Trap)
*   **✅ SAFE ANSWER:** "Its sole mandate is **Risk Minimization**. Commercial metrics (like conversion rate) are secondary to regulatory compliance and safety."
*   **🚩 RED FLAG:** "It balances risk and revenue." (Regulators hate this trade-off in compliance tools).

### Q25: "Are you using Generative AI (LLMs) for decisioning?"
*   **✅ SAFE ANSWER:** "No. Decisioning is strictly numerical/deterministic. LLMs are used *only* for summarization of documents, with human review."
*   **🚩 RED FLAG:** "Yes, GPT-4 decides who is fraud." (Immediate Audit Fail).

### Q26: "If I ask you to replay a transaction from 3 years ago, can you?"
*   **✅ SAFE ANSWER:** "Yes. We can reload the exact model binary version and input state from that day and reproduce the exact same score."
*   **🚩 RED FLAG:** "We can show you the logs, but we can't re-run the old model." (Auditability failure).

### Q27: "Who tests the model?"
*   **✅ SAFE ANSWER:** "An independent Validation Team (2nd Line of Defense) that reports to the CRO, separate from the Data Science team that built it."
*   **🚩 RED FLAG:** "The developers test their own code." (Conflict of interest).

### Q28: "How do you handle 'Automation Bias' (Humans lazily accepting AI)?"
*   **✅ SAFE ANSWER:** "We inject 'Canary' (known false) test cases into the live workflow to ensure humans are paying attention. If they miss a Canary, they require retraining."
*   **🚩 RED FLAG:** "Our staff are very diligent." (Hope is not a strategy).

### Q29: "What is your reliance on Cloud Providers?"
*   **✅ SAFE ANSWER:** "We treat cloud providers as a critical outsourcing arrangement. We have an 'Exit Strategy' and can port the containerized model to on-prem hardware if necessary."
*   **🚩 RED FLAG:** "We are 100% dependent on AWS." (Concentration risk).

### Q30: "Can you turn it off right now?"
*   **✅ SAFE ANSWER:** "Yes. *Pulls out 'Emergency Ops Protocol' binder*. Here is the procedure."
*   **🚩 RED FLAG:** "I need to call the vendor." (Lack of control).

---

## VI. Human Mistake Traps

### Trap 1: "Going Off-Script"
*   **Scenario:** Regulator asks a friendly, hypothetical question: "Ideally, wouldn't it be cool if meant..."
*   **Defense:** Do not speculate. Stick to *current* capabilities. "We only deploy what is validated."

### Trap 2: "Blaming the Vendor"
*   **Scenario:** Regulator finds a bug.
*   **Defense:** Never blame the software vendor. **YOU** own the risk. "We are investigating this deviation in our implementation."

### Trap 3: "Over-Confidence"
*   **Scenario:** "This model is perfect."
*   **Defense:** "No model is perfect. That is why we have humans in the loop and capital buffers."

---
**Document Status:** READY FOR DRILL
*Risk Committee*
