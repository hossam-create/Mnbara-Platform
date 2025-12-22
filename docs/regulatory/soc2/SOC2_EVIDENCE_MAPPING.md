# SOC 2 TYPE II EVIDENCE MAPPING: AI TRUST & RISK OS

**Confidential & Privileged**
**Scope:** AI Trust & Risk Operating System
**Audit Reference:** AICPA Trust Services Criteria (TSC) 2017
**Status:** Audit-Ready

---

## 1. Security (Common Criteria - CC)

| Ref | Control Objective | Control Description | Technical Enforcement | Evidence Artifact | Owner | Frequency |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CC6.1** | Logical Access (RBAC) | The system restricts AI model configuration access to authorized personnel only. | **IAM Policies:** Deny-by-default on production buckets. **App Logic:** Middleware checks JWT scopes for `risk:admin`. | `IAM_Policy_Export.json`<br>`Access_Review_Log.pdf` | CISO | Quarterly |
| **CC6.3** | Least Privilege (Data) | The AI service account has Read-Only access to transaction DBs and Write-Only access to Audit Logs. | **Db User Grants:** `GRANT SELECT ON transactions`, `GRANT INSERT ON logs`. No `UPDATE/DELETE`. | `Database_User_Permissions.sql`<br>`Env_Var_Config.txt` | DevOps Lead | Continuous |
| **CC7.1** | Vulnerability Scanning | Automated scanning of AI container images and dependencies for CVEs before deployment. | **CI/CD Pipeline:** GitHub Actions safeguards block build if Critical Severity > 0. | `Trivy_Scan_Report.pdf`<br>`Container_Registry_Logs.json` | SecOps | Per Build |
| **CC8.1** | Change Management (Frozen Core) | Production models are immutable. Updates require a full SDLC cycle: Sandbox -> Shadow -> Approval -> Prod. | **Git Branch Protection:** `main` branch requires 2 approvals. **Binary Hashing:** Enforced checksums. | `Pull_Request_History.pdf`<br>`Release_Manifest_v2.json` | Release Mgr | Per Release |

## 2. Availability (A)

| Ref | Control Objective | Control Description | Technical Enforcement | Evidence Artifact | Owner | Frequency |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A1.2** | Resilience (Fail-Open) | If AI inference latency exceeds 200ms, the system fails open to legacy rules to prevent transaction blocking. | **Circuit Breaker:** Rolling window checks in API Gateway logic. **Timeout Config:** Hard limits on RPC calls. | `Health_Check_Logs.csv`<br>`Circuit_Breaker_Config.yaml` | SRE Lead | Annually |
| **A1.3** | Backup & Restoration | AI Model binaries and configurations are backed up to geo-redundant storage. | **S3 Replication:** Cross-region replication rules. **Versioning:** Enabled on buckets. | `Restore_Drill_Report.pdf`<br>`Backup_Policy_Config.json` | Infra Lead | Quarterly |

## 3. Processing Integrity (PI) - *Critical for AI*

| Ref | Control Objective | Control Description | Technical Enforcement | Evidence Artifact | Owner | Frequency |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PI1.2** | Input Validation | The system rejects malformed or null data inputs to prevent model hallucinations or errors. | **JSON Schema:** Strict type checking at API ingress. **Drift Monitor:** Reject if input variance > 3 SD. | `Input_Validation_Middleware.ts`<br>`Rejected_Input_Log.csv` | Data Eng | Continuous |
| **PI1.4** | Quality Assurance (Shadow Mode) | New models must run in Shadow Mode for 30 days without impacting customers before promotion. | **Feature Flag:** `model_v2_shadow=true`. **Comparison Job:** Batch script comparing v1 vs v2 outputs. | `Shadow_Mode_Analysis.ipynb`<br>`Sign_Off_Form_Risk_Committee.pdf` | Head of Risk | Per Model |
| **PI1.5** | Deterministic Output | The system must produce the exact same score for the same input, regardless of time. | **Unit Tests:** Regression suite sending static payload and asserting static response. | `Regression_Test_Suite_Results.xml`<br>`Reproducibility_Cert.pdf` | QA Lead | Per Build |

## 4. Confidentiality (C) & Privacy (P)

| Ref | Control Objective | Control Description | Technical Enforcement | Evidence Artifact | Owner | Frequency |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **C1.1** | Data Encryption | Sensitive customer data is encrypted in transit and at rest. | **TLS 1.3:** Enforced on Load Balancer. **AES-256:** Enforced on DB/S3 Volumes. | `TLS_Certificate_Config.pem`<br>`Encryption_Key_Rotation_Log.csv` | NetSec | Annually |
| **P3.1** | Operations Retention | Audit logs are retained for 7 years (AML requirement) in immutable storage. | **WORM Storage:** S3 Object Lock set to `Retain until 2032`. **Lifecycle Policy:** No delete actions allowed. | `Retention_Policy_Config.json`<br>`Data_Lifecycle_Screenshot.png` | DPO | Annually |
| **P4.3** | Data Minimization | The AI model is legally and technically barred from processing "Protected Class" variables (Race, Religion). | **ETL Pipeline:** `DROP COLUMN` steps for sensitive fields before model ingestion. | `ETL_Transformation_Script.py`<br>`Feature_Manifest.csv` | Data Scientist | Per Model |

## 5. Custom AI Governance Controls

| Ref | Control Objective | Control Description | Technical Enforcement | Evidence Artifact | Owner | Frequency |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **HITL-1** | Human Authority | High-Risk actions require a human approval token. The AI cannot "auto-execute" blocks. | **API Logic:** `POST /block` returns 403 without `human_jwt`. **Workflow Engine:** Routing to analyst queue. | `Code_Snippet_Approval_Check.ts`<br>`Audit_Log_Overrides.csv` | Prod Mgr | Continuous |
| **HITL-2** | Override Traceability | Every human override of an AI score must have a logged justification reason. | **UI Form:** "Reason" field is mandatory (non-nullable) in the review dashboard. | `Override_Reason_Distribution.pdf` | Risk Ops | Monthly |
| **GOV-1** | Drift Alerting | System notifies Risk Team if Model Drift (PSI) exceeds 0.25. | **Monitoring Service:** Prometheus alert rule -> PagerDuty. | `Drift_Alert_Config.yaml`<br>`Incident_Response_Log_Drift.pdf` | Data Ops | Daily |

---
**Audit Attestation:**
The controls mapped above are implemented, active, and technically enforced as of [Date].

*__________________________*
**Head of Information Security**
