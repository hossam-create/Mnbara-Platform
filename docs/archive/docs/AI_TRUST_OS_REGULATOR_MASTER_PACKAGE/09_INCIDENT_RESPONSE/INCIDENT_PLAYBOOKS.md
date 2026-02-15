# Incident Response Playbooks: AI Trust & Risk

**Document ID:** OPS-RUNBOOK-001
**Audience:** Trust & Safety Ops, SRE, Incident Commanders
**Status:** ACTIVE

---

## 1. Incident Classification

| Type | Description |
| :--- | :--- |
| **Logic Failure** | The rule engine is functioning technically, but producing "wrong" outcomes (e.g., blocking good users). |
| **Technical Failure** | The service is down, high latency, or API errors. |
| **Data Failure** | Upstream data (e.g., Credit Bureau) is null or corrupted. |
| **Compliance Failure** | Audit logs are failing to write; Regulatory limit breached. |

---

## 2. Severity Levels

| Level | Definition | Response SLA |
| :--- | :--- | :--- |
| **SEV-1 (Critical)** | >10% of users affected; Audit Data Loss; Legal Risk. | **15 Minutes** |
| **SEV-2 (High)** | Fraud spike detected; Single High-Value false positive. | **1 Hour** |
| **SEV-3 (Medium)** | Minor drift warning; Single low-value complaint. | **4 Hours** |
| **SEV-4 (Low)** | UI glitch; Non-impacting bug. | **24 Hours** |

---

## 3. Playbooks

### Playbook A: "Flash Block" (Mass False Positives)
**Trigger:** Approval Rate drops below 80% (Baseline 95%).
**Roles:** Incident Commander (Risk Lead), SRE, Ops Analyst.

1.  **Detect:** Dashboard alert fires: `CRITICAL: APPROVAL RATE < 80%`.
2.  **Verify:** Ops Analyst checks if traffic is legitimate or a bot attack.
3.  **Contain:**
    *   *If rules are broken:* Execute **Emergency Rollback** to previous Role Set Version.
    *   *If Data is bad:* Enable "Graceful Degradation" (ignore specific failing signal).
4.  **Communicate:** Notify Customer Support Lead: "Expect high ticket volume."
5.  **Resolve:** Identify the specific faulty rule in Shadow Mode. Deploy fix.
6.  **Review:** Create "Regression Test Case" to prevent recurrence.

### Playbook B: "Silent Leak" (Missed Fraud / False Negatives)
**Trigger:** Finance reports unexpected chargeback spike.
**Roles:** Fraud Analyst, Data Scientist.

1.  **Detect:** Lagging indicator (Chargeback report) arrives.
2.  **Analyze:** Retrieve Audit Logs for the specific fraudulent IDs. Identifying the logic gap (e.g., "Velocity rule didn't catch 5 $100 transactions").
3.  **Contain:**
    *   Author "Hotfix Rule" to target the specific pattern immediately.
    *   Deploy via "Expedited Path" (Manager approval required).
4.  **Remediate:** Run "Batch Scrubber" to retrospectively find other accounts matching this pattern.
5.  **Review:** Update "Golden Dataset" with this new fraud vector.

### Playbook C: "Drift Verification" (Data Shift)
**Trigger:** Daily Drift Report shows >10% deviation in Input Feature (e.g., "User Age").
**Roles:** Data Ops, Risk Manager.

1.  **Investigate:** Is this a bug in the data pipeline (null values) or a real demographic shift?
2.  **Action:**
    *   *If Bug:* Pause auto-decisioning for rules using "User Age" until fixed.
    *   *If Real:* Recalibrate rule thresholds in Shadow Mode.
3.  **Approve:** Risk Committee sign-off on new calibration.

### Playbook D: "Audit Gap" (Logging Failure)
**Trigger:** System alert: `AUDIT_WRITE_FAILURE`.
**Roles:** SRE, Compliance Officer.

1.  **Immediate Action:** System automatically enters **Fail Closed** mode. No high-risk decisions can be processed without logs.
2.  **Contain:** Divert traffic to Manual Review Queue (if capacity allows) or Halt Processing.
3.  **Fix:** Restore connectivity to WORM storage.
4.  **Recover:** Reconcile any "In-Flight" transactions manually.
5.  **Report:** Notify Compliance Officer (potential regulatory breach).

### Playbook E: "Rogue Operator" (Insider Threat)
**Trigger:** Agent Override Rate > 3 std deviations above mean.
**Roles:** Security, HR, Legal.

1.  **Contain:** Revoke Agent access immediately.
2.  **Investigate:** Audit all actions taken by Agent in last 30 days.
3.  **Remediate:** Reverse any fraudulent unblocks. Field SAR (Suspicious Activity Report).

---

## 4. AI-Specific Safeguards

*   **Pause Authority:** The **Ops Lead** has the authority to "Pause" specific rules without code deployment if they are causing harm.
*   **Shadow Enforcement:** During a SEV-1, we may disable "Block" actions and switch to "Log Only" (Shadow) to stop customer bleeding while investigating.
*   **Regulator Notification:** Required for SEV-1 incidents involving Audit Gaps or Mass False Positives > 10,000 users.

---

## 5. Post-Incident Learning

**We explicitly DO NOT:**
*   Automatically retrain the model on the incident data (prevents poisoning).
*   Let the AI "self-heal".

**We DO:**
*   Manually code a regression test.
*   Update the "Anti-Patterns" library.
*   Conduct a "Blameless Post-Mortem" focused on process improvement.

---
**Approved By:** Head of Trust & Safety Operations
