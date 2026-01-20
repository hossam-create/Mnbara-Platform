# Board-Level AI Kill Switch (Emergency Stop) Policy

**Document ID:** GOV-KILLSWITCH-001
**Purpose:** Defining the Authority and Protocol for Immediate AI Suspension
**Owner:** Board Risk Committee
**Authority:** Highest Operational Directive
**Status:** ACTIVE

---

## 1. Policy Statement

The Board of Directors explicitly mandates the existence of an **"Emergency Kill Switch"** (also known as a Circuit Breaker or Bypass). This mechanism must allow for the immediate, unilateral cessation of all automated risk scoring and recommendation logic in the event of a catastrophic failure.

**Principle:** It is better to have *no* AI assistance (and rely on manual defaults) than to have *faulty* AI assistance causing mass consumer harm.

---

## 2. Kill Switch Authority Roles

Authority to activate the Kill Switch is granted to specific roles to ensure rapid reaction without bureaucratic delay.

| Role | Authority Level | Scope | Justification Required |
| :--- | :--- | :--- | :--- |
| **Duty Operations Officer** | **Unilateral** | Production Runtime | "Good Faith Belief" of harm. Can act immediately, report later. |
| **Head of Trust & Safety** | **Unilateral** | Production Runtime | Confirmed failure metrics. |
| **Chief Risk Officer (CRO)** | **Absolute** | All Systems | Strategic/Regulatory necessity. |
| **Legal Counsel** | **Directive** | All Systems | Discovery of legal breach. |

*Note: No committee vote is required to STOP the system. A committee vote IS required to RESTART it.*

---

## 3. Activation Criteria (Triggers)

The Kill Switch **MUST** be activated immediately if any of the following thresholds are breached:

1.  **Mass False Positive Event:** Decline/Block rate exceeds **20%** of traffic (baseline 5%) for > 15 minutes.
2.  **Audit Failure:** The immutable audit log service becomes unreachable or fails to write. (Policy: "Fail Closed").
3.  **Regulatory Order:** A direct "Cease and Desist" order is received from a competent authority regarding specific automated processing.
4.  **Data Corruption:** Upstream data feeds (e.g., Credit Bureau) are confirmed to be sending null or garbage data affecting > 10% of decisions.
5.  **Cyber Breach:** Confirmation of unauthorized intrusion into the Risk Engine or Rules Repository.

---

## 4. The Kill Switch Mechanism (Technical)

Upon activation, the system shall transition to one of two pre-defined **Fail-Safe States**:

*   **Mode A (Manual Default):** All high-risk decisions are routed to the Manual Review Queue. No automated blocks are executed. (Used when blocking logic is suspect).
*   **Mode B (Fail Open/Closed):**
    *   *For Fraud:* Fail Closed (Deny all high-risk checks) - Used during cyber attacks.
    *   *For User Friction:* Fail Open (Allow low-risk checks) - Used during data corruption to prevent mass blocking.

*The specific technical mode is selected by the Duty Officer based on the nature of the crisis.*

---

## 5. Communication Protocol

**Immediate (T+0 to T+30 mins):**
1.  **Ops Channel:** Broadcast "KILL SWITCH ACTIVATED - [Mode A/B] - [Reason]".
2.  **Notify Execs:** SMS/Page to CRO and CTO.
3.  **Status Page:** Update customer-facing status to "Service Degraded - Manual Processing Delays".

**Regulatory (T+4 hours):**
*   If the outage affects specific regulatory reporting or SLA obligations, the **Compliance Officer** must notify the regulator of a "Material Operational Incident".

---

## 6. Restart Protocol (De-Escalation)

Re-activating the AI system (turning the Kill Switch OFF) requires a higher standard of approval than turning it on.

**Restart Requirements:**
1.  **Root Cause Identified:** The specific bug/rule/data issue is found.
2.  **Fix Verified:** A fix has been tested in **Shadow Mode** for at least 1 hour with positive results.
3.  **Executive Sign-Off:** The **Chief Risk Officer** (or designate) must sign off on the restart. The Duty Officer *cannot* self-authorize a restart.

---
**Ratified By:**
Board of Directors
Risk Committee Chair
Chief Executive Officer
