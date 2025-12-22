# BEHAVIORAL ESCALATION PROTOCOL
## De-Escalation Logic & Safety-First Support

**Classification:** OPERATIONAL — Support Teams
**Status:** Active Protocol
**Document Owner:** Head of Trust & Safety

---

## 1. ESCALATION DETECTION MATRIX

We categorize user interactions into four emotional tiers. Recognition relies on keywords, velocity, and tone.

### Tier 1: Informational (Green)
*   **Signals:** Standard grammar, single questions, neutral tone.
*   **Keywords:** "How do I...", "When will...", "Status of...", "Fees".
*   **Action:** Standard informational response (AI or Human).

### Tier 2: Frustration (Yellow)
*   **Signals:** Multiple punctuation (??, !!), repetitive messaging, mild profanity, CAPS usage < 20%.
*   **Keywords:** "Annoying", "Taking too long", "Ridiculous", "Confused".
*   **Action:** Acknowledge frustration, provide factual status, **no automated defensive replies**.

### Tier 3: Hostility / Threat (Red)
*   **Signals:** ALL CAPS, insults, personal attacks, high velocity (5+ msgs/min), demands for superiors.
*   **Keywords:** "Scam", "Liars", "Stole", "Lawyer", "Sue", "Police", "Fraud", "Report you".
*   **Action:** **IMMEDIATE AI SILENCE.** Route to Risk Ops. Founder/Exec review highly recommended.

### Tier 4: Safety / Crisis (Black)
*   **Signals:** Threats of self-harm, threats of violence, location dropping, stalking behavior.
*   **Action:** **EMERGENCY PROTOCOL.** Legal/Law Enforcement liaison engagement. Zero engagement via standard channels.

---

## 2. THE "PAUSE" DOCTRINE (AI & Automation Rules)

To prevent algorithmic escalation, strict inhibitors are hard-coded:

1.  **Sentiment Breaker:** If sentiment score drops below threshold (negative/hostile), AI **MUST** stop replying. It cannot try to "fix" the mood.
2.  **Loop Prevention:** If a user repeats the same question 3 times, automation stops.
3.  **Legal Stop:** Identification of words "Lawyer", "Attorney", "Sue", or "Court" triggers an immediate handover to the Legal Queue.
4.  **No Apologies:** Automated systems are forbidden from apologizing for specific events (which admits liability). They may only apologize for "inconvenience" or "frustration" in the abstract.

---

## 3. HUMAN ESCALATION PATHS

### Path A: The "Cool Down" (Frustration)
*   **Trigger:** User is angry but rational.
*   **Goal:** Restore logic.
*   **Tactic:** Switch channel (Chat → Email). Slow down response time (15-30 mins) to allow adrenaline to dissipate.
*   **Response Style:** "I've received your message. I need to look into the details to ensure I give you the correct answer. I will email you within [Timeframe]."

### Path B: The "Legal Shield" (Threats)
*   **Trigger:** User mentions legal action or regulatory reporting.
*   **Goal:** Minimize liability exposure.
*   **Tactic:** Cease all informal conversation. Move to formal, written record only.
*   **Response Style:** "Since you have mentioned taking legal action, I must pass this conversation to our formal dispute resolution team. They will communicate with you via email to ensure a proper record."

### Path C: The "Grey Rock" (Abuse)
*   **Trigger:** Personal insults, profanity, circular arguing.
*   **Goal:** Disengagement without provocation.
*   **Tactic:** Do not defend. Do not argue back. Do not educate. Quote policy and stop.
*   **Response Style:** "Our Community Standards require respectful communication. I have provided the final decision regarding this transaction. We will not be able to discuss this specific matter further."

---

## 4. FOUNDER-SAFE RESPONSE SCRIPTS

These scripts are designed for high-stress situations to protect the operator from liability while maintaining professional posture.

### Scenario 1: The "You Stole My Money" Accusation
**Do Not Say:** "We didn't steal it, the bank is holding it!" (Defensive/Emotional)
**Safe Response:**
> "I understand you are concerned about the funds. I can confirm that the transaction is currently in [Status] status. The funds are held in specific escrow accounts as per the Terms of Service. Here is the transaction ID for your records."

### Scenario 2: The "I'm Going to Ruin Your Reputation" Threat
**Do Not Say:** "Go ahead, we didn't do anything wrong!" (Challenge)
**Safe Response:**
> "We hope to resolve this amicably. We take all feedback seriously. Our priority right now is to review the specific details of your transaction to ensure our policies were followed correctly."

### Scenario 3: The Demand for Immediate Exception
**Do Not Say:** "Okay, just this once." (Sets precedent/unfair practice)
**Safe Response:**
> "For security and fairness reasons, we must follow the standard validation process for all accounts. We cannot bypass these security checks manually. I will update you as soon as the system completes the validation."

### Scenario 4: "Why is this taking so long??"
**Do Not Say:** "We are really busy/understaffed." (Admits operational failure)
**Safe Response:**
> "This review process typically takes 24-48 hours to ensure accuracy. Your case is currently in the queue and is being processed in the order received."

---

## 5. DISENGAGEMENT CRITERIA (When to Stop)

You are authorized to **STOP** responding if:

1.  **The Decision is Final:** You have stated the outcome, provided the rationale, and the user is merely arguing the result.
    *   *Last Word:* "As mentioned, this decision is final based on the evidence provided. We will not be replying further regarding this specific decision."
2.  **Extortion:** The user demands payment/action in exchange for not leaving a bad review.
    *   *Action:* Flag account for "Extortion". Disengage.
3.  **Safety Threat:** Any specific threat of physical harm.
    *   *Action:* Bans/Law Enforcement. No further communication.

---

## 6. INTERNAL RULES OF ENGAGEMENT

1.  **Never Argue Facts:** If a user says "Reference X", don't argue "No, it's Y". State "Our records show Y".
2.  **Never Blame the User:** Avoid "You failed to..." Use "We did not receive..."
3.  **Never Promise Outcomes:** Never say "You will get a refund." Say "You have submitted a request for a refund."
4.  **Screenshots are Forever:** Assume every message you send will be screenshotted and posted on Twitter/Reddit. **Write for the audience, not just the user.**

---
**Protocol Use:** For training Support Staff and configuring AI Guardrails.
**Review:** Quarterly.
