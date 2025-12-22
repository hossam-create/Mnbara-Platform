# Internal Control Matrix: AI Trust & Risk Operating System

**Document ID:** GOV-ICM-001
**Control Frameworks:** COSO ERM, ISO 27001:2022, NIST AI RMF (Partial)
**System Scope:** AI Trust & Risk Operating System (Production)

---

## 1. Control Framework Overview

This matrix defines the **Key Rist Indicators (KRIs)** and **Key Control Activities** governing the AI Trust system. It ensures that the "Human-in-the-Loop" architecture functions not just as a design principle, but as an auditable operational reality.

*   **Preventive Controls:** Technical barriers that stop unsafe actions (e.g., Read-Only access).
*   **Detective Controls:** Monitoring alerts that identify failures (e.g., Drift detection).
*   **Corrective Controls:** Mechanisms to fix issues (e.g., Rollback).

---

## 2. Governance & Oversight

| ID | Risk | Control Objective | Description | Type | Owner | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GOV-01** | Unauthorized AI Use | Define permitted system scope. | **AI Use Policy** explicitly restricts system to "Advisory" role. Prohibits autonomous blocking. | Prev / Manual | Risk Comm | Signed Charter |
| **GOV-02** | Accountability Gap | Ensure clear ownership. | **RACI Matrix** assigns "Decision Owner" (CRO) and "Tech Owner" (CTO). | Prev / Manual | HR | Org Chart |
| **GOV-03** | Lack of Transparency | Independent review. | **Quarterly Internal Audit** reviews sample of 50 log files for policy compliance. | Det / Manual | Audit | Audit Report |

---

## 3. Access Control (Identity)

| ID | Risk | Control Objective | Description | Type | Owner | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ACC-01** | Unauthorized Logic Change | Limit write access to rules. | **RBAC: Rule Author** role restricted to Risk Analysts. DevOps required for deploy. | Prev / Auto | Security | IAM Config |
| **ACC-02** | Insider Fraud | Prevent self-approval. | **Segregation of Duties (SoD):** Author of rule cannot be Approver of rule. | Prev / Auto | Security | Jira Workflow |
| **ACC-03** | Production Tampering | Protect runtime integrity. | **Read-Only Database Access** for all human users in Prod. Only System Service Account can write logs. | Prev / Auto | DevOps | DB Logs |

---

## 4. AI Decision Integrity & Change Management

| ID | Risk | Control Objective | Description | Type | Owner | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CHG-01** | Bad Logic Deployment | Verify rule impact pre-live. | **Mandatory Shadow Evaluation:** All high-impact rules must run in Shadow Mode for 24h. | Prev / Manual | Risk Mgr | Shadow Report |
| **CHG-02** | Indeterministic Behavior | Ensure reproducibility. | **Deterministic Regression Suite:** CI pipeline fails if `f(input)` varies across runs. | Prev / Auto | Eng | Build Log |
| **CHG-03** | Configuration Drift | Track logic version. | **Version Pinning:** Every decision log records the `Rule_Set_Version_ID` used. | Det / Auto | App | Audit Log |

---

## 5. Monitoring & Incident Response

| ID | Risk | Control Objective | Description | Type | Owner | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MON-01** | Model/Concept Drift | Detect distribution shifts. | **Drift Monitor Alert:** Triggers if Acceptance Rate deviates > 5% from baseline. | Det / Auto | Data Ops | Alert Ticket |
| **MON-02** | System Failure | Maintain business continuity. | **Circuit Breaker:** Auto-degrades to "Manual Review" on timeout (>500ms). | Corr / Auto | SRE | System Log |
| **INC-01** | Prolonged Error | Restore service fast. | **Emergency Rollback Authority:** Duty Officer authorized to revert version without committee vote during Sev-1. | Corr / Manual | Ops | Cmd History |

---

## 6. Data Privacy & Retention

| ID | Risk | Control Objective | Description | Type | Owner | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DAT-01** | Excessive Data Collection | Minimize PII exposure. | **Schema Validator:** API drops any field not explicitly defined in "Allowed Input" schema. | Prev / Auto | Privacy | Code Config |
| **DAT-02** | Illegal Retention | Comply with GDPR/AML. | **WORM Lifecycle Policy:** S3 Object Lock set to 7 Years for Audit Bucket. | Prev / Auto | Cloud | AWS Config |
| **DAT-03** | Biometric Leakage | Prevent sensitive ingest. | **Biometric Exclusion:** System technically blocked from accepting binary image data. | Prev / Auto | Architect | Architecture Doc |

---

## 7. AI-Specific Controls (The "Governor")

| ID | Risk | Control Objective | Description | Type | Owner | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AI-01** | Autonomous Harm | Prevent robot-led bans. | **Human-in-the-Loop Gate:** Code requires `approver_id != null` for "BLOCK" status execution. | Prev / Auto | Eng | Code logic |
| **AI-02** | Black-Box Opacity | Guarantee explanation. | **Logic Trace Generation:** System must output JSON trace array with every score. | Det / Auto | Eng | Log Sample |
| **AI-03** | Model Hallucination | Prevent random outputs. | **No Online Learning:** Write-access to Model Weights disabled in Production runtime. | Prev / Auto | DevOps | Runtime Config |

---

## 8. Control Effectiveness Notes

*   **Design Effectiveness:** Controls are deemed **Effective**. The use of "Hard Constraints" (e.g., Read-Only DB, Static Code) eliminates entire classes of risk (like Model Poisoning) by design.
*   **Operating Effectiveness:** Pending "SOC 2 Type II" observation period (6 months).
*   **Gaps:** None identified at launch.
