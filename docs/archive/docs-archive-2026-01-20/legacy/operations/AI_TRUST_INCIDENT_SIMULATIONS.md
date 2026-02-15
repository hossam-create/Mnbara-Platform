# Incident Simulation & Tabletop Exercises: AI Trust & Risk

**Document ID:** OPS-INCIDENT-SIM-001
**Audience:** Trust & Safety Ops, Risk Committee, Auditors
**Context:** Operational Readiness & Crisis Management

---

## SECTION 1 — INCIDENT MANAGEMENT PHILOSOPHY

Our philosophy treats AI incidents as **Governance Failures**, not "Model Glitches." Because our system is deterministic, any error is a result of **incorrectly defined policy** (human error in rule authorship) or **data pipeline corruption** (infrastructure error), not random "hallucination."

*   **Logic Error vs Operational Misuse:** Unlike ML models that drift silently, our Logic Engine executes exactly what it was told. Therefore, incidents are primarily about mitigating the impact of *bad instructions* or *bad inputs*.
*   **Mandatory Simulations:** We do not debug in production. Tabletop exercises ensure that when a "Flash Crash" of rule logic occurs (e.g., blocking 100% of users), the team acts via muscle memory, not panic.

---

## SECTION 2 — INCIDENT CATEGORIES

| Category | Description | Severity | Detection Signal |
| :--- | :--- | :--- | :--- |
| **1. False Positive Spike** | System aggressively blocks legitimate users (e.g., >20% decline rate). | **SEV-1 (Critical)** | Approval Ratio Drop Alert (<85%). |
| **2. False Negative Exposure** | System fails to catch a known fraud attack pattern. | **SEV-2 (High)** | Fraud Loss Spike / Chargeback increase. |
| **3. Drift Misdetection** | Input data shifts (e.g., new country) without rule adjustment. | **SEV-3 (Medium)** | "Unknown Attribute" log rate increase. |
| **4. Human Override Abuse** | Operator systematically approves high-risk items (Insider Threat). | **SEV-1 (Critical)** | Override Rate > 30% for single agent. |
| **5. Change Control Failure** | Unauthorized rule change deployed to production. | **SEV-1 (Critical)** | Checksum mismatch in configuration monitoring. |
| **6. Logging Gap** | Audit logs stop writing to WORM storage. | **SEV-0 (Emergency)** | Logic Engine unable to write commit. |

---

## SECTION 3 — TABLETOP SCENARIOS

### Scenario 1: The "Flash Block" (False Positive Spike)
*   **Trigger:** A new rule designed to block botnets accidentally flags all iOS users as bots due to a Regex error.
*   **Monitoring:** "Approval Rate" drops from 95% to 10% in 5 minutes. Customer support queue floods.
*   **Containment:** Duty Officer executes **Emergency Rollback** to `Rule_Set_v-1`.
*   **Authority:** Duty Manager (No Committee approval needed for *restoring service*).
*   **Regulator Notification:** Required if outage > 4 hours or affects > 10,000 customers (Operational Resilience).

### Scenario 2: The "Silent Leak" (False Negative)
*   **Trigger:** A sophisticated fraud ring bypasses the "Velocity Rule" by using slower, distributed attacks.
*   **Monitoring:** Finance team reports 400% spike in chargebacks over the weekend.
*   **Containment:** Risk Analyst authors a new "Hotfix Rule" to target the specific User-Agent pattern. Deploys via "Expedited Path" (Peer Review only).
*   **Roles:** Analyst (Author), Sr. Manager (Approve), Ops (Monitor).
*   **Review:** Post-mortem must update the Regression Test Suite to include this attack vector.

### Scenario 3: The "Insider Override"
*   **Trigger:** An internal Ops agent approves 50 fraudulent accounts owned by friends.
*   **Monitoring:** "Agent Override Anomaly" alert triggers (Agent A approved 99% vs Team Avg 5%).
*   **Containment:** Immediate suspension of Agent A's access. Revocation of approved accounts via "Batch Rescan" tool.
*   **Authority:** Head of Trust & Safety + Legal.
*   **Regulatory:** Filing of SAR (Suspicious Activity Report) on the employee.

### Scenario 4: Data Pipeline Corruption
*   **Trigger:** The vendor supplying "IP Geolocation" sends null/garbage data. Rules default to "Block" on missing data.
*   **Monitoring:** "Input Null Rate" spikes to 100%.
*   **Containment:** Enable "Circuit Breaker" to bypass Geolocation rules (shift to lighter screening) to maintain uptime.
*   **Authority:** Engineering Lead + Risk Lead.

### Scenario 5: Regulatory Inquiry (Drill)
*   **Trigger:** Regulator demands explanation for why User X was blocked last Tuesday.
*   **Action:** Compliance Officer retrieves "Decision Snapshot" from the Immutable Audit Log.
*   **Artifact:** JSON Trace explaining exactly which rules triggered.
*   **Outcome:** Draft formal "Statement of Reasons" letter within 4 hours.

---

## SECTION 4 — ROLES & RESPONSIBILITIES

*   **Incident Commander (Exec Owner):** Head of Risk. Ultimate decision authority. Only person who can declare "Crisis Ended."
*   **Ops Lead (Trust Analyst):** Monitors dashboards. First responder. Can trigger "Pause" on specific rules.
*   **Engineering Lead:** Technical investigator. Verifies if root cause is Code vs Logic vs Infrastructure.
*   **Compliance Officer:** Regulatory liaison. Determines if a SAR or Breach Notification is legally required.

---

## SECTION 5 — RUNBOOK TIMELINE ("The Golden Hour")

*   **0-15 Min (Detection):**
    *   Alert fires.
    *   Ops Lead verifies it's real (not a dashboard glitch).
    *   **Decision Point:** Is this Tech (Server down) or Logic (Bad Rule)?
*   **15-30 Min (Containment):**
    *   If Logic: Execute **Rollback** to last known good version.
    *   If Tech: Failover to secondary region or enable Circuit Breaker.
    *   Status Page updated: "Investigating Delays."
*   **30-60 Min (Investigation):**
    *   Engineering isolates the root cause (e.g., "The Regex on the bot rule was greedy").
    *   Risk Team drafts a fix.
*   **1-4 Hours (Remediation):**
    *   Fix is tested in Shadow Mode (accelerated 15-min window).
    *   Fix deployed to Production.
*   **Post-Mortem:**
    *   "Why did the test suite miss this?" -> Add new test case.

---

## SECTION 6 — EVIDENCE & AUDIT TRAIL

To close an incident, the following must be attached to the Ticket:
1.  **Time-Series Graph:** Screenshot of the anomaly start/end times.
2.  **Audit Log Extract:** Sample of 10 decisions showing the error.
3.  **Command Log:** Evidence of who pressed "Rollback" and when.
4.  **Shadow Report:** Proof the fix was tested before re-deployment.
5.  **Root Cause Analysis (RCA):** The "5 Whys" document.

---

## SECTION 7 — REGULATOR-FACING NARRATIVE (Template)

**Subject:** Operational Incident Report - [Date]
**Summary:** On [Date], the Application detected an anomaly in [Rule Set Name].
**Root Cause:** A formatting error in a recently deployed logic rule caused [Condition].
**Automated Response:** The system's "Circuit Breaker" reduced traffic throughput to prevent incorrect decisions.
**Human Intervention:** Operations Staff executed a "Rollback" at [Time], restoring normal service within [X] minutes.
**Impact:** [X] users affected. All wrongful blocks have been remediated.
**Corrective Action:** The regression test suite has been updated to prevent recurrence.

*Note: The AI did not act autonomously. All actions were result of defined configuration. Human oversight restored control immediately.*
