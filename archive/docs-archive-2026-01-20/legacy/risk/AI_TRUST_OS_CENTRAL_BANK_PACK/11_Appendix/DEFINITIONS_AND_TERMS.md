# GLOSSARY OF REGULATORY & TECHNICAL TERMS

**Confidential & Privileged**
**Context:** AI Trust & Risk Operating System Documentation

---

## 1. Core System Concepts

### Deterministic System
A system architecture where the output is fully determined by the initial state and inputs, with no random variation. In the context of this AI OS, it guarantees that **Input A + Configuration B** will *always* result in **Risk Score C**, regardless of when the calculation is performed. This provides absolute auditability and eliminates "black box" unpredictability.

### Advisory Decision Support
A regulatory classification for technology that provides information, analysis, or recommendations to a human decision-maker but does **not** have the independent authority to execute binding actions (such as blocking funds or closing accounts). The AI suggests; the Human decides.

## 2. Operational States

### Shadow Mode (Champion/Challenger)
A risk-free testing environment where a new model version processes real-time production data in the background ("Shadow") without its outputs affecting actual customers or operations. Its performance is logged and compared against the active ("Champion") model to validate safety and accuracy before formal promotion.

### Human Override
The explicit act of a strictly authorized human officer rejecting the AI System's recommendation. This action is the supreme authority in the governance hierarchy. An override requires a mandatory justification log and permanently supersedes the algorithmic output for that specific transaction.

## 3. Risk Management

### Model Risk
The potential for adverse consequences (financial loss, reputational damage, or regulatory breach) resulting from decisions based on incorrect or misused model outputs. We manage this through the **Three Lines of Defense** framework, treating the model as a source of risk rather than just a utility.

### Drift (Concept & Data)
The statistical phenomenon where the relationship between input data and target variables changes over time.
*   **Data Drift:** A change in the distribution of input data (e.g., a sudden influx of users from a new country).
*   **Concept Drift:** A change in the underlying meaning of the data (e.g., a fraud technique that used to be rare becomes common).
*   **Management:** Detected via continuous monitoring (PSI/KL Divergence) and remediated via manual retraining, never automatic adjustment.

---
**Maintained By:**
*Risk Governance Secretariat*
