# REGULATORY RISK REVIEW
## Conceptual Audit of Governance Frameworks

**Classification:** LEGAL / COMPLIANCE REVIEW
**Status:** Audit Findngs
**Date:** December 19, 2025
**Reviewer:** Regulatory Risk Monitor

---

## 1. EXECUTIVE SUMMARY

The governance frameworks established (Sprints 8 & 9) are robust and "Regulator-Friendly" in their conservatism. However, scrutiny reveals specific areas where language could be tightened to further insulate the Platform from liability.

**Verdict:** **Low Risk** (Strategy is sound), but **Medium Execution Risk** (Microcopy must match strategy).

---

## 2. CATEGORY: AI & AUTOMATION

### ⚠️ Risky Wording to Avoid
*   **"Verified by AI"** — Implies truth/accuracy. AI cannot verify truth, only patterns.
    *   *Replace with:* "Checked by System" or "Pattern Match Detected".
*   **"The System Decided"** — Assigns agency to software (liability trap).
    *   *Replace with:* "The request was declined based on automated criteria."
*   **"Fraud Detected"** — Defamatory if false.
    *   *Replace with:* "Account flagged for security review" or "Unusual activity detected".
*   **"Error-Free" / "Perfect"** — Impossible standard.
    *   *Replace with:* "High-precision" or "Advanced".

### ✅ Phrases Regulators Like
*   **"Human-in-the-Loop"** — The gold standard for AI safety.
*   **"Advisory Signal"** — Clarifies that AI supports but does not command.
*   **"Non-Deterministic"** — Technical honesty about AI variability.
*   **"Appealable Decision"** — Ensures due process.

### 🛑 Missing Disclaimers (Conceptual)
*   **The "Hallucination" Disclosure:** A standard footer for AI chat interfaces stating: *"AI assistance may occasionally generate incorrect information. Please verify critical details."*
*   **The "Training Data" Exemption:** Explicit statement that user interaction with AI support does not constitute training data consent (unless explicit).

---

## 3. CATEGORY: FINANCIAL & MARKET DATA

### ⚠️ Risky Wording to Avoid
*   **"Savings"** — Promises a specific outcome.
    *   *Replace with:* "Estimated difference" or "Potential value".
*   **"Reference Rate"** — Often implies a legal Central Bank rate.
    *   *Replace with:* "Indicative Market Rate" or "Third-party rate".
*   **"Best Price"** — Superlative that is hard to prove and easy to sue over.
    *   *Replace with:* "Competitive price" or "Market average".
*   **"Investment"** — Triggers securities regulation immediately.
    *   *Replace with:* "Purchase" or "Transaction".

### ✅ Phrases Regulators Like
*   **"For Informational Purposes Only"** — The shield against reliance liability.
*   **"Indicative"** — Signals that the number may change before execution.
*   **"Past Performance is not indicative of future results"** — The classic, essential disclaimer.
*   **"Third-Party Data"** — Shifts liability to the data provider.

### 🛑 Missing Disclaimers (Conceptual)
*   **Latency Disclosure:** "Data displayed may be delayed up to [X] minutes and may not reflect real-time executable rates."
*   **Composite Source Disclosure:** "Rates are a composite of multiple sources and may differ from your bank's rate."

---

## 4. CATEGORY: PAYMENTS & LICENSING

### ⚠️ Risky Wording to Avoid
*   **"Deposit"** — Strictly a banking term.
    *   *Replace with:* "Load funds" or "Add funds".
*   **"Our Wallet"** — Implies you hold the money.
    *   *Replace with:* "Your [Partner Name] Balance" or "Platform Balance".
*   **"Transfer"** — Can imply money transmission.
    *   *Replace with:* "Send payment" or "Pay".
*   **"Instant"** — Regulators hate this if it takes even 1 second longer.
    *   *Replace with:* "Real-time" (defined usually as <10s) or "Fast".

### ✅ Phrases Regulators Like
*   **"Facilitator"** — Defines your role as the connector, not the bank.
*   **"Licensed Partner"** — Clearly identifies who holds the license.
*   **"Pass-through"** — Describes the flow of funds accurately (if applicable).
*   **"Merchant of Record"** — If applicable, clarifies liability.

### 🛑 Missing Disclaimers (Conceptual)
*   **Entity Relationship Statement:** "Mnbara is a technology platform, not a bank. Banking services provided by [Bank Name], Member FDIC."
*   **Funds Availability:** "Funds availability is subject to [Partner] terms and banking hours."

---

## 5. CATEGORY: DISPUTES & CONDUCT

### ⚠️ Risky Wording to Avoid
*   **"Judge" / "Verdict"** — Judicial terms.
    *   *Replace with:* "Arbiter" / "Decision".
*   **"Punishment"** — Implies penal system.
    *   *Replace with:* "Enforcement action" or "Restriction".
*   **"Permanent"** — Hard to defend if new evidence emerges.
    *   *Replace with:* "Indefinite" (allows for future appeal/change).

### ✅ Phrases Regulators Like
*   **"Fair and Transparent"** — The core consumer reliability standard.
*   **"Reasoned Decision"** — Implies logic was documented.
*   **"Consumer Duty"** — (UK specific) Acting to deliver good outcomes.
*   **"Good Faith"** — The legal standard for contract performance.

### 🛑 Missing Disclaimers (Conceptual)
*   **ADR (Alternative Dispute Resolution) Notice:** In EU/UK, you must inform users of their right to go to an external ombudsman if they are unhappy with your final decision.
*   **Evidence Limitation:** "We are not a court of law. Decisions are made based on the balance of probabilities using available evidence."

---

## 6. REVIEWER RECOMMENDATION

**Strategic Shift:**
Move from "Definitive" language to "Probabilistic" language in all automated systems, and "Process" language in all human systems.

**Critical Edit:**
Review all UI buttons.
*   Change *"Verify Identity"* → *"Submit for Verification"*
*   Change *"Instant Transfer"* → *"Send Payment"*
*   Change *"Best Rate"* → *"Current Rate"*

**Final Note:**
Regulators judge you not just by your Terms of Service, but by the *impression* your UI gives the average consumer. If it *looks* like a bank, they will regulate it like a bank. Keep the UI clearly distinct from a banking app interface.
