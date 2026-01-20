# SOC 2 & ISO 27001 Control Mapping: AI Trust & Risk Operating System

**Document ID:** COMPLIANCE-MAP-002
**Auditor:** Independent GRC Assessor
**Target Standards:** SOC 2 Trust Services Criteria (TSC) 2017, ISO/IEC 27001:2022
**System Status:** Production Readiness Audit

---

## SECTION 1 — SCOPE & SYSTEM BOUNDARY

**1.1 In-Scope Components:**
*   **Policy Execution Engine (PEE):** Deterministic logic processing.
*   **Context Assembler (CA):** Data fetching and normalization.
*   **Immutable Audit Logger (IAL):** Write-Only logging service.
*   **Shadow Evaluator:** Parallel execution environment for rule testing.
*   **Decision Gateway API:** Interface for external systems.

**1.2 Out-of-Scope Components:**
*   **Payment Execution:** The system *recommends* decisions but does not execute money movement. Control of funds allows with the Payment Gateway.
*   **Identity Provider:** User authentication is offloaded to a compliant IdP (e.g., Auth0/Okta).
*   **Underlying Infrastructure:** Physical security of datacenters (AWS/Azure responsibility).

**1.3 Data Flow Boundary:**
*   **Inbound:** Read-Only JSON payloads via TLS 1.3.
*   **Outbound:** Risk Recommendation (JSON) + Logic Trace.
*   **Storage:** WORM retention for Audit Logs; Ephemeral RAM for PII processing.

---

## SECTION 2 — SOC 2 CONTROL MAPPING (Common Criteria)

| Criteria | Control Objective | System Mechanism | Evidence Generated | Responsible |
| :--- | :--- | :--- | :--- | :--- |
| **CC1.2** | **Ethics & Integrity** | Code of Conduct requires HITL for adverse actions. | Signed Policy Acknowledgments; Governance Charter. | Risk Committee |
| **CC2.2** | **Internal Communication** | Alerts for logic drift or system failure broadcast to Ops channels. | PagerDuty/Slack Alert Logs; Incident Tickets. | Operations |
| **CC3.2** | **Risk Assessment** | Pre-launch Risk Matrix defines thresholds for operational and model risk. | Risk Committee Approval Pack; Bi-annual Risk Assessment. | CRO |
| **CC4.1** | **Monitoring** | Detects drift in decision distribution (e.g., mass rejection). | Datadog/Prometheus Dashboards; Drift Alert Logs. | DevOps |
| **CC5.2** | **Control Activities** | Logic rules must be deterministic and testable. | Unit Test Results; Regression Suite Reports. | Engineering |
| **CC6.1** | **Logical Access** | Restrict access to rule configuration to authorized persionnel. | RBAC Config; Access Review Logs; IdP Logs. | Security Admin |
| **CC7.2** | **System Operations** | Ensure processing integrity and availability. | Uptime Reports; Circuit Breaker Activation Logs. | SRE |
| **CC8.1** | **Change Management** | Prevent unauthorized logic changes. | 48h Shadow Evaluation Report; Change Approval Records. | Risk Manager |
| **CC9.2** | **Risk Mitigation** | Vendor risk management for data providers. | Vendor Security Reviews; Data Quality Monitoring Logs. | Compliance |

---

## SECTION 3 — ISO 27001:2022 CONTROL MAPPING

| ISO Control | Description | System Compliance Implementation | Evidence Artifacts |
| :--- | :--- | :--- | :--- |
| **A.5.15** | **Access Control** | **RBAC Enforced.** Read-Only access for Ops; Write access for Logic Authors; Deploy access for DevOps. | Access Matrix; User entitlement reviews. |
| **A.5.37** | **Documented Procedures** | Standard Operating Procedures (SOPs) for rule creation, shadow testing, and rollback. | Published SOPs; Wiki version history. |
| **A.8.2** | **Information Class.** | Data inputs classified as "Confidential"; Decision logs classified as "Regulatory Retention". | Data Dictionary; Schema Tags. |
| **A.8.9** | **Config Management** | Rule Logic is "Infrastructure as Code". No manual DB edits allowed. | Git Commit History; CI/CD Pipelines. |
| **A.12.1** | **Ops Guidelines** | "Runbooks" define response to drift/outage. | Incident Response Plan; Runbook executions. |
| **A.12.4** | **Logging & Monitor** | **Immutable Audit Logs.** WORM storage for 7 years (AML). Admin cannot delete. | Log Integrity Checksums; Retention Policy Config. |
| **A.14.2** | **Sec. Dev. Lifecycle** | Logic changes pass through Shadow Mode. Peer review mandatory. | Pull Request Approvals; Shadow Reports. |
| **A.18.1** | **Compliance** | GDPR Art. 22 Compliance via Advisory architecture. | Legal Opinion; Privacy Impact Assessment (PIA). |

---

## SECTION 4 — AI-SPECIFIC CONTROLS (Additive)

*These controls exceed standard SOC 2 / ISO baselines to address specific AI/Model Risks.*

1.  **Deterministic Integrity:**
    *   *Control:* System guarantees `f(input) = output` with 0.00% variance.
    *   *Verification:* Regression suite replays 100k historical transactions on every build.
2.  **Human-in-the-Loop (HITL) Enforcement:**
    *   *Control:* System physically cannot execute "BLOCK" status without a linked `human_approval_id` for High Severity cases.
    *   *Verification:* Audit log analysis showing 100% human attribution for bans.
3.  **Shadow Evaluation Gate:**
    *   *Control:* Logic updates are deployed to a "Shadow Sidecar" first.
    *   *Verification:* Pipeline blocks production promotion if Shadow Evaluation deviation > Threshold (e.g. 5%).
4.  **Automatic Drift Circuit Breaker:**
    *   *Control:* If output distribution shifts > X% in 1 hour, system auto-degrades to Manual/Fail-Safe.
    *   *Verification:* Chaos engineering test results.

---

## SECTION 5 — EVIDENCE ARTIFACTS

**Auditors may request the following population for testing:**

1.  **Population A: Rules Change Management**
    *   Sample of 25 rule changes.
    *   Required: Ticket #, Business Need, Author, Approver, Shadow Report, Deployment Time.
2.  **Population B: Access Reviews**
    *   Quarterly reviews of "Rule Author" and "Admin" privileges.
3.  **Population C: Incident Response**
    *   Tickets for any "Drift Alerts" or "Circuit Breaker" activations.
4.  **Population D: Human Overrides**
    *   Log extract of decisions overridden by operators (evidence of HITL efficacy).
5.  **Artifact E: Retention Settings**
    *   Screenshot of Cloud Storage Bucket configuration showing Object Lock (WORM) enabled for 7 years.

---

## SECTION 6 — AUDITOR CONCLUSION

**Assessment Date:** 2025-12-18

**Overall Posture:**
The AI Trust & Risk Operating System demonstrates a **High Maturity** control environment. By opting for a deterministic architecture over "black box" machine learning, the system significantly reduces model risk and compliance complexity.

**Readiness Assessment:**
*   **SOC 2:** Ready for **Type I** (Design Effectiveness). Type II (Operating Effectiveness) requires 6-12 months of observation.
*   **ISO 27001:** Aligned with controls. Policy framework is sufficient for certification audit.

**Residual Risks:**
*   Reliance on "Human-in-the-Loop" effectiveness (training risk).
*   Quality of external data feeds (vendor risk).

**Recommendation:**
Proceed to System Activation. Initiate observation period for SOC 2 Type II immediately.

---
**Auditor Signature:**
*Independent GRC Assessor*
