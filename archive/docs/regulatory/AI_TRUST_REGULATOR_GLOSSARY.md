# Regulator Glossary: AI Trust & Risk Operating System

**Document ID:** REG-GLOSSARY-001
**Audience:** Regulators, Auditors, Legal Counsel
**Purpose:** Standardized definitions for system oversight.

| Term | Plain Meaning | Why It Matters to Regulators |
| :--- | :--- | :--- |
| **Deterministic AI** | A system that always produces the exact same output for the same input, with zero randomness. | Ensures consistency, fairness, and total reproducibility of past decisions during an audit. |
| **Expert System** | A logic program that applies pre-written rules (e.g., "If X then Y") defined by human experts, rather than learning patterns on its own. | Proves that humans, not black-box algorithms, explicitly defined the risk logic. |
| **Advisory Decision** | A system output that suggests an action (e.g., "Recommend Block") but does not execute it autonomously for high-impact cases. | Ensures the AI remains a support tool, leaving ultimate legal outcomes to human judgment. |
| **Human-in-the-Loop (HITL)** | A workflow where a human must review and confirm the AI's suggestion before any significant action (like banning a user) occurs. | Prevents automated systems from unilaterally causing harm or denying critical services. |
| **Shadow Evaluation** | Running a new rule in the background to test it on live data without actually affecting any user decisions. | Demonstrates that the company safely tests new logic for errors before applying it to the public. |
| **Drift Detection** | Monitoring the system to see if the percentage of "High Risk" flags changes unexpectedly over time. | Alerts regulators if the system's behavior is becoming unstable or if market conditions have shifted. |
| **False Positive** | When the system incorrectly flags a safe user as risky (creating friction). | Tracks consumer harm/inconvenience and ensures the system isn't overly aggressive. |
| **False Negative** | When the system incorrectly lets a risky user pass (missing fraud). | Tracks the system's failure to protect the financial ecosystem from bad actors. |
| **Override Authority** | The power of a designated human officer to reject the AI's recommendation and apply their own judgment. | Confirms that humans are the final decision-makers and can correct system errors in real-time. |
| **Emergency Rollback** | A "Kill Switch" process to instantly revert the system to a previous safe version if an error is found. | Shows the ability to immediately stop consumer harm during a malfunction. |
| **Read-Only Boundary** | Technical limit preventing the risk system from changing user data (it can look, but not touch). | Prevents a malfunction in the risk engine from corrupting core banking or identity records. |
| **Audit Trail** | An immutable, timestamped record of every input, rule used, and decision made. | Allows regulators to reconstruct exactly why a decision was made years after the fact. |
| **Model Change Governance** | The formal bureaucratic process required to update the system's logic (Draft -> Test -> Sign-off -> Deploy). | Prevents unauthorized or unreviewed changes to risk policy by developers. |
| **No Online Learning** | The system is technically incapable of rewriting its own logic or "learning" from live traffic automatically. | eliminates the risk of the AI "going rogue" or learning bias from bad data in production. |
| **Recommendation vs Legal Effect** | The distinction between a system *flag* (Recommendation) and a contract termination (Legal Effect). | Key to GDPR Art. 22 compliance; ensures machines don't make legally binding decisions on people. |
