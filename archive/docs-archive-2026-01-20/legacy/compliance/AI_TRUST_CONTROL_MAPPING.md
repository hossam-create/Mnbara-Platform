# AI Trust & Risk: Control Mapping (SOC 2 & ISO 27001)

**Document ID:** GRC-CONTROL-MAP-001
**Audience:** Internal Audit, External Auditors (SOC2/ISO), Regulators
**Context:** Compliance Readiness & Control Evidence

---

## SECTION 1 — CONTROL PHILOSOPHY

Our architectural philosophy prioritizes **Auditability** and **Determinism** over raw predictive power. In regulated environments, the ability to *prove* why a decision was made is more valuable than a marginal increase in theoretical accuracy.

1.  **Deterministic AI Simplifies Compliance:** By using static Logic Rules instead of self-learning models, we eliminate "Black Box" risks. Every output is mathematically provable `(Input + Rule = Output)`, satisfying "Right to Explanation" requirements natively.
2.  **Human-in-the-Loop Limits Liability:** The system is an *Advisor*, not an *Executor*. By mandating human confirmation for negative actions (bans/freezes), we ensure that accountability resides with a legal person, not an algorithm.
3.  **Auditability > Accuracy:** A 99% accurate model that cannot explain its 1% failure rate is undeployable in fintech. Our system provides 100% explainability, which is the baseline requirement for licensure.

---

## SECTION 2 — SOC 2 CONTROL MAPPING

### Trust Service Criterion: Security
*   **Control Objective:** Prevent unauthorized access to risk logic and decision data.
*   **System Mechanism:** **RBAC (Role-Based Access Control)** via Identity Service. Segregation of duties between "Rule Author" (Analyst) and "Rule Deployer" (DevOps).
*   **Evidence:** Access logs showing failed unauthorized attempts; PR (Pull Request) approval history for rule changes.
*   **Audit Verification:** Sample 5 recent rule deployments to verify dual sign-off.

### Trust Service Criterion: Availability
*   **Control Objective:** Ensure risk decisioning is available to support payment processing.
*   **System Mechanism:** **Stateless Horizontal Scaling** (Kubernetes). Multi-AZ deployment. "Circuit Breaker" fallback to Manual Review if dependencies fail.
*   **Evidence:** Uptime dashboards (Prometheus/Grafana); Circuit Breaker activation logs.
*   **Audit Verification:** Simulate a dependency failure and verify system degrades to "Manual" state without crashing.

### Trust Service Criterion: Processing Integrity
*   **Control Objective:** Ensure system processing is complete, valid, accurate, and timely.
*   **System Mechanism:** **Immutable Audit Log**. Every input vector is hashed and logged alongside the decision. Deterministic execution ensures simple mathematical verification.
*   **Evidence:** "Replay Tests" where historical inputs are re-run to prove output consistency.
*   **Audit Verification:** Re-run a sample of 100 transactions from last month and compare outputs against the log.

### Trust Service Criterion: Confidentiality
*   **Control Objective:** Protect sensitive risk intelligence (e.g., fraud rules) from leakage.
*   **System Mechanism:** **Rule Encryption at Rest**. Rules are stored as encrypted blobs. Code base does not contain hardcoded credentials.
*   **Evidence:** Encryption key management logs (KMS); Code scanning reports (SAST).
*   **Audit Verification:** Inspect database dump to ensure rule logic is verified encrypted.

### Trust Service Criterion: Privacy
*   **Control Objective:** Protect PII used in decisoning.
*   **System Mechanism:** **Data Minimization & Ephemeral Processing**. PII is processed in RAM and discarded post-decision. Only metadata and Result IDs are persisted long-term.
*   **Evidence:** Data retention policy configuration; Database schema review showing absence of raw PII fields.
*   **Audit Verification:** Review `RetentionPolicy` config files to confirm automated deletion schedules.

---

## SECTION 3 — ISO 27001 CONTROL ALIGNMENT

### A.5 Information Security Policies
*   **Intent:** Management direction for InfoSec.
*   **System Mapping:** Governance Framework (Doc `GOV-AI-TRUST-001`) explicitly defines "AI Safety" policies.
*   **Artifacts:** Signed Policy Documents; Evidence of annual policy review.

### A.6 Organization of Information Security
*   **Intent:** Defined responsibilities.
*   **System Mapping:** "Human-in-the-Loop" protocol explicitly assigns decision accountability to the **Risk Officer**, separating it from IT responsibilities.
*   **Artifacts:** Job Descriptions; Organizational Chart showing Risk vs IT separation.

### A.9 Access Control
*   **Intent:** Limit access to information.
*   **System Mapping:** The **Decision Gateway API** enforces strict API Key + OAuth authentication for all callers. Internal components use mutual TLS (mTLS).
*   **Artifacts:** API Gateway logs; mTLS certificate inventory.

### A.12 Operations Security
*   **Intent:** Secure operations and logging.
*   **System Mapping:** **Immutable Audit Logger (IAL)** writes to WORM storage. Logs cannot be modified by admins.
*   **Artifacts:** Log integrity checksums; SIEM dashboard screenshots.

### A.14 System Acquisition, Development & Maintenance
*   **Intent:** Security in the lifecycle.
*   **System Mapping:** **Shadow Evaluation Mode**. All new rules must pass a shadow test phase before production.
*   **Artifacts:** Shadow Evaluation reports showing pass/fail metrics for recent deployments.

### A.16 Incident Management
*   **Intent:** Management of security incidents.
*   **System Mapping:** **Health & Integrity Monitor** alerts on drift/anomalies (potential attack/failure). Defined "Emergency Rollback" procedure.
*   **Artifacts:** Incident Ticket history; Post-Mortem reports for any "Drift Alerts".

### A.18 Compliance
*   **Intent:** Compliance with legal obligations.
*   **System Mapping:** GDPR Art. 22 compliance via "Advisory Only" architecture. AML retention (7 years) enforced via storage policy.
*   **Artifacts:** Legal Opinion Letter confirming GDPR alignment; Storage configuration screenshots.

---

## SECTION 4 — AML / FINCRIME CONTROLS

### Risk-Based Approach
*   **Support:** The system supports dynamic scoring. Higher risk transactions (e.g., cross-border) trigger stricter rule sets automatically.
*   **Artifact:** Rule Logic documentation showing different thresholds for different risk tiers.

### False Positive Reduction
*   **Support:** "Shadow Evaluation" allows tuning rules on historical data to minimize noise *before* affecting customers.
*   **Artifact:** Tuning Reports showing "Before vs After" false positive rates.

### Escalation Governance (SARs)
*   **Support:** When significant fraud is detected, the system generates a "Case File" snapshot for the analyst to review for Suspicious Activity Report (SAR) filing.
*   **Artifact:** Case Management logs showing "System Alert -> Human Review -> SAR Decision" chain.

---

## SECTION 5 — EVIDENCE & AUDIT ARTIFACTS

Auditors should be provided with the following standard evidence packages:

1.  **Decision Log Extract:** A CSV sample of 1,000 anonymized decisions showing Input, Rule Version, Score, and Outcome.
2.  **Shadow Evaluation Report:** A PDF report from the last major rule deployment showing the comparison testing results.
3.  **Change Approval Ticket:** A Jira/ServiceNow ticket showing the approval workflow for a recent Rule Set update (Analyst Request -> Manager Approval -> DevOps Deploy).
4.  **Rollback Log:** Evidence (if any) or processed test of the "Emergency Rollback" functionality.
5.  **Override Metrics Report:** Monthly report showing % of AI decisions overridden by humans (drifts/tuning needs).
6.  **Retention Policy Config:** Screenshot of the cloud storage lifecycle policy enforcing the 7-year retention for AML data.

---

## SECTION 6 — AUDITOR Q&A

### Q1. "Can the AI change itself?"
**Answer:** "No. The system utilizes deterministic logic with no online learning capability. Logic changes require a manual code deployment."

### Q2. "Who is accountable for decisions?"
**Answer:** "The Chief Risk Officer. The system is a support tool; legally binding decisions (like account closure) require human confirmation."

### Q3. "How do you detect drift?"
**Answer:** "We monitor the output distribution daily. A deviation >10% triggers a generic alert for human investigation."

### Q4. "How do you rollback unsafe logic?"
**Answer:** "The Duty Officer has 'One-Click Rollback' authority to revert to the previous verified Rule Set version."

### Q5. "How do you explain decisions to regulators?"
**Answer:** "Every decision generates a 'Logic Trace' (JSON) explaining exactly which rule criteria were met. We can produce a plain-English 'Statement of Reasons' for any transaction."
