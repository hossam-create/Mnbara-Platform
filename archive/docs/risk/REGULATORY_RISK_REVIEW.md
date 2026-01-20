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

### âڑ ï¸ڈ Risky Wording to Avoid
*   **"Verified by AI"** â€” Implies truth/accuracy. AI cannot verify truth, only patterns.
    *   *Replace with:* "Checked by System" or "Pattern Match Detected".
*   **"The System Decided"** â€” Assigns agency to software (liability trap).
    *   *Replace with:* "The request was declined based on automated criteria."
*   **"Fraud Detected"** â€” Defamatory if false.
    *   *Replace with:* "Account flagged for security review" or "Unusual activity detected".
*   **"Error-Free" / "Perfect"** â€” Impossible standard.
    *   *Replace with:* "High-precision" or "Advanced".

### âœ… Phrases Regulators Like
*   **"Human-in-the-Loop"** â€” The gold standard for AI safety.
*   **"Advisory Signal"** â€” Clarifies that AI supports but does not command.
*   **"Non-Deterministic"** â€” Technical honesty about AI variability.
*   **"Appealable Decision"** â€” Ensures due process.

### ًں›‘ Missing Disclaimers (Conceptual)
*   **The "Hallucination" Disclosure:** A standard footer for AI chat interfaces stating: *"AI assistance may occasionally generate incorrect information. Please verify critical details."*
*   **The "Training Data" Exemption:** Explicit statement that user interaction with AI support does not constitute training data consent (unless explicit).

---

## 3. CATEGORY: FINANCIAL & MARKET DATA

### âڑ ï¸ڈ Risky Wording to Avoid
*   **"Savings"** â€” Promises a specific outcome.
    *   *Replace with:* "Estimated difference" or "Potential value".
*   **"Reference Rate"** â€” Often implies a legal Central Bank rate.
    *   *Replace with:* "Indicative Market Rate" or "Third-party rate".
*   **"Best Price"** â€” Superlative that is hard to prove and easy to sue over.
    *   *Replace with:* "Competitive price" or "Market average".
*   **"Investment"** â€” Triggers securities regulation immediately.
    *   *Replace with:* "Purchase" or "Transaction".

### âœ… Phrases Regulators Like
*   **"For Informational Purposes Only"** â€” The shield against reliance liability.
*   **"Indicative"** â€” Signals that the number may change before execution.
*   **"Past Performance is not indicative of future results"** â€” The classic, essential disclaimer.
*   **"Third-Party Data"** â€” Shifts liability to the data provider.

### ًں›‘ Missing Disclaimers (Conceptual)
*   **Latency Disclosure:** "Data displayed may be delayed up to [X] minutes and may not reflect real-time executable rates."
*   **Composite Source Disclosure:** "Rates are a composite of multiple sources and may differ from your bank's rate."

---

## 4. CATEGORY: PAYMENTS & LICENSING

### âڑ ï¸ڈ Risky Wording to Avoid
*   **"Deposit"** â€” Strictly a banking term.
    *   *Replace with:* "Load funds" or "Add funds".
*   **"Our Wallet"** â€” Implies you hold the money.
    *   *Replace with:* "Your [Partner Name] Balance" or "Platform Balance".
*   **"Transfer"** â€” Can imply money transmission.
    *   *Replace with:* "Send payment" or "Pay".
*   **"Instant"** â€” Regulators hate this if it takes even 1 second longer.
    *   *Replace with:* "Real-time" (defined usually as <10s) or "Fast".

### âœ… Phrases Regulators Like
*   **"Facilitator"** â€” Defines your role as the connector, not the bank.
*   **"Licensed Partner"** â€” Clearly identifies who holds the license.
*   **"Pass-through"** â€” Describes the flow of funds accurately (if applicable).
*   **"Merchant of Record"** â€” If applicable, clarifies liability.

### ًں›‘ Missing Disclaimers (Conceptual)
*   **Entity Relationship Statement:** "Mnbarh is a technology platform, not a bank. Banking services provided by [Bank Name], Member FDIC."
*   **Funds Availability:** "Funds availability is subject to [Partner] terms and banking hours."

---

## 5. CATEGORY: DISPUTES & CONDUCT

### âڑ ï¸ڈ Risky Wording to Avoid
*   **"Judge" / "Verdict"** â€” Judicial terms.
    *   *Replace with:* "Arbiter" / "Decision".
*   **"Punishment"** â€” Implies penal system.
    *   *Replace with:* "Enforcement action" or "Restriction".
*   **"Permanent"** â€” Hard to defend if new evidence emerges.
    *   *Replace with:* "Indefinite" (allows for future appeal/change).

### âœ… Phrases Regulators Like
*   **"Fair and Transparent"** â€” The core consumer reliability standard.
*   **"Reasoned Decision"** â€” Implies logic was documented.
*   **"Consumer Duty"** â€” (UK specific) Acting to deliver good outcomes.
*   **"Good Faith"** â€” The legal standard for contract performance.

### ًں›‘ Missing Disclaimers (Conceptual)
*   **ADR (Alternative Dispute Resolution) Notice:** In EU/UK, you must inform users of their right to go to an external ombudsman if they are unhappy with your final decision.
*   **Evidence Limitation:** "We are not a court of law. Decisions are made based on the balance of probabilities using available evidence."

---

## 6. REVIEWER RECOMMENDATION

**Strategic Shift:**
Move from "Definitive" language to "Probabilistic" language in all automated systems, and "Process" language in all human systems.

**Critical Edit:**
Review all UI buttons.
*   Change *"Verify Identity"* â†’ *"Submit for Verification"*
*   Change *"Instant Transfer"* â†’ *"Send Payment"*
*   Change *"Best Rate"* â†’ *"Current Rate"*

**Final Note:**
Regulators judge you not just by your Terms of Service, but by the *impression* your UI gives the average consumer. If it *looks* like a bank, they will regulate it like a bank. Keep the UI clearly distinct from a banking app interface.

