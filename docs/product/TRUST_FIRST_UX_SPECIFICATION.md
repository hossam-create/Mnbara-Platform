# PRODUCT & UX SPECIFICATION: TRUST-FIRST COMMERCE
## Sprint 2+ Implementation Guide

**Confidential**
**Platform:** Mnbara - Global Commerce
**Markets:** US → MENA (EG / UAE / KSA)
**Audience:** Design, Frontend, Product Teams
**Date:** December 18, 2025

---

## DESIGN PHILOSOPHY

```
┌─────────────────────────────────────────────────────────────┐
│  "SIMPLE TO USE. IMPOSSIBLE TO MISUNDERSTAND.              │
│   THE USER ALWAYS KNOWS WHAT'S HAPPENING AND WHY."         │
└─────────────────────────────────────────────────────────────┘
```

### Core UX Principles
1. **Transparency Over Elegance:** If hiding something makes the UI cleaner, don't hide it.
2. **Explain, Don't Assume:** Every AI recommendation comes with a "Why."
3. **Confirm, Never Assume:** No action that affects money or trust happens without explicit tap.
4. **Escape Always Available:** User can always go back, cancel, or override.

---

# SECTION 1: USER FLOWS

## 1.1 BUYER FLOW: Search → Match → Trust → Confirm

### Step 1: Search & Intent Expression
**Screen:** Home / Search

**User Action:** Types or speaks what they want.
*Example: "iPhone 15 Pro Max 256GB Black from Apple Store NYC"*

**System Response:**
- Parse intent into structured "Intent Chip"
- Display editable chip for confirmation

**UI State:**
```
┌─────────────────────────────────────────────────────────────┐
│  🔍 What are you looking for?                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ "iPhone 15 Pro Max 256GB Black from Apple Store NYC"│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ✨ We understood:                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📱 iPhone 15 Pro Max  │ 💾 256GB  │ ⚫ Black        │   │
│  │ 📍 Apple Store NYC    │ ✏️ Edit                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [ Confirm Intent ]                                         │
└─────────────────────────────────────────────────────────────┘
```

**Transparency Rule:** User MUST confirm the interpreted intent before matching begins.

---

### Step 2: Traveler Matches
**Screen:** Match Results

**System Response:**
- Display travelers who can fulfill the request
- Each match shows Trust Score + Explanation

**UI State:**
```
┌─────────────────────────────────────────────────────────────┐
│  🎒 Travelers who can help                                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👤 Sarah M.           ⭐ 4.9 (47 trips)             │   │
│  │ 📍 NYC → Cairo        ✈️ Dec 24                     │   │
│  │                                                     │   │
│  │ 💚 HIGH TRUST                                       │   │
│  │ ℹ️ Why? [Tap to see]                                │   │
│  │                                                     │   │
│  │ [ View Profile ]  [ Request ]                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👤 Ahmed K.           ⭐ 4.2 (12 trips)             │   │
│  │ 📍 NYC → Cairo        ✈️ Dec 22                     │   │
│  │                                                     │   │
│  │ 🟡 MEDIUM TRUST                                     │   │
│  │ ℹ️ Why? Newer account, fewer verified trips        │   │
│  │                                                     │   │
│  │ [ View Profile ]  [ Request ]                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💡 "Higher trust = more verified history. You decide."    │
└─────────────────────────────────────────────────────────────┘
```

**Transparency Rule:** Trust level and its reason are ALWAYS visible. Never hidden behind taps.

---

### Step 3: Trust View (Expanded)
**Screen:** Traveler Profile / Trust Details

**User Action:** Taps "Why?" or "View Profile"

**UI State:**
```
┌─────────────────────────────────────────────────────────────┐
│  👤 Sarah M. - Trust Details                                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💚 HIGH TRUST SCORE                                 │   │
│  │                                                     │   │
│  │ Here's why we show this:                            │   │
│  │                                                     │   │
│  │ ✅ Verified ID (Government ID checked)              │   │
│  │ ✅ 47 completed deliveries                          │   │
│  │ ✅ 4.9 average rating                               │   │
│  │ ✅ Active for 2+ years                              │   │
│  │ ✅ Payment history: No disputes                     │   │
│  │                                                     │   │
│  │ ⚠️ Things to know:                                  │   │
│  │ • We can't guarantee future behavior               │   │
│  │ • Always use escrow protection                     │   │
│  │ • Report any issues immediately                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [ Request This Traveler ]                                  │
└─────────────────────────────────────────────────────────────┘
```

**Transparency Rule:** Show WHAT factors contribute to trust. Never just show a number.

---

### Step 4: Confirm Action (Human Confirmation Modal)
**Screen:** Confirmation Modal (Overlay)

**Trigger:** User taps "Request" or "Confirm Purchase"

**UI State:**
```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐   │
│  │             ✋ CONFIRM YOUR REQUEST                 │   │
│  │                                                     │   │
│  │ You are requesting:                                 │   │
│  │ 📱 iPhone 15 Pro Max 256GB Black                   │   │
│  │ 💵 Estimated: $1,199 + $150 traveler fee           │   │
│  │ 🎒 Traveler: Sarah M.                               │   │
│  │ 📍 NYC → Cairo                                      │   │
│  │                                                     │   │
│  │ ┌───────────────────────────────────────────────┐   │   │
│  │ │ 🔒 YOUR MONEY IS PROTECTED                    │   │   │
│  │ │                                               │   │   │
│  │ │ • Funds go to ESCROW (not to traveler)       │   │   │
│  │ │ • Released ONLY when you confirm delivery    │   │   │
│  │ │ • Full refund if item not delivered          │   │   │
│  │ └───────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │ [ Cancel ]           [ Confirm & Pay to Escrow ]   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Transparency Rule:** ALWAYS show where money goes. ALWAYS explain escrow.

---

## 1.2 TRAVELER FLOW: Offer → Readiness → Accept

### Step 1: Browse Available Requests
**Screen:** Traveler Dashboard / Requests

**UI State:**
```
┌─────────────────────────────────────────────────────────────┐
│  ✈️ Your Trip: NYC → Cairo (Dec 24)                        │
│                                                             │
│  📦 Requests matching your route:                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📱 iPhone 15 Pro Max                                │   │
│  │ 👤 Requested by: Ahmed R.                           │   │
│  │ 💵 Traveler fee: $150                               │   │
│  │                                                     │   │
│  │ 💚 BUYER TRUST: HIGH                                │   │
│  │ ℹ️ Verified buyer, 12 successful purchases          │   │
│  │                                                     │   │
│  │ [ View Details ]  [ Make Offer ]                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

### Step 2: Trust Readiness Check
**Screen:** Offer Confirmation

**Before traveler can make offer, system checks readiness:**

**UI State:**
```
┌─────────────────────────────────────────────────────────────┐
│  ✅ YOUR TRUST READINESS                                    │
│                                                             │
│  To make offers, you need:                                  │
│                                                             │
│  ✅ Verified ID                      Complete               │
│  ✅ Payment method linked            Complete               │
│  ✅ Trip details confirmed           Complete               │
│  ⚠️ Deposit for high-value items    Required ($100)        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ℹ️ Why a deposit?                                     │ │
│  │                                                       │ │
│  │ For items over $500, we hold a small deposit to      │ │
│  │ protect buyers. It's returned when you deliver.      │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [ Add Deposit ]                                            │
└─────────────────────────────────────────────────────────────┘
```

---

### Step 3: Recommendation View
**Screen:** Smart Offer Suggestions

**UI State:**
```
┌─────────────────────────────────────────────────────────────┐
│  💡 OFFER RECOMMENDATIONS                                   │
│                                                             │
│  Based on similar deliveries, we suggest:                   │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 💵 Suggested fee: $140 - $160                        │ │
│  │                                                       │ │
│  │ Why? Similar items on your route typically           │ │
│  │ earn $145 on average.                                │ │
│  │                                                       │ │
│  │ You can set any fee you want.                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Your fee: [ $150 ]                                         │
│                                                             │
│  [ Submit Offer ]                                           │
└─────────────────────────────────────────────────────────────┘
```

**Transparency Rule:** Suggestions are CLEARLY labeled as suggestions. User sets final value.

---

## 1.3 HIGH-RISK FLOW: Safety Checkpoint

**Trigger:** Transaction flagged as elevated risk (high value, new user, unusual pattern)

**Screen:** Safety Checkpoint (Interstitial)

**UI State:**
```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐   │
│  │            ⚠️ SAFETY CHECKPOINT                     │   │
│  │                                                     │   │
│  │ We noticed something about this transaction:        │   │
│  │                                                     │   │
│  │ 🟡 This is a high-value item ($2,500+)             │   │
│  │ 🟡 The traveler is relatively new (3 trips)        │   │
│  │                                                     │   │
│  │ This doesn't mean anything is wrong.               │   │
│  │ We just want you to be aware.                      │   │
│  │                                                     │   │
│  │ ┌───────────────────────────────────────────────┐   │   │
│  │ │ 💡 SAFER ALTERNATIVES:                        │   │   │
│  │ │                                               │   │   │
│  │ │ • Choose a traveler with more history        │   │   │
│  │ │ • Split into smaller purchases               │   │   │
│  │ │ • Add extra delivery verification            │   │   │
│  │ └───────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │ [ See Other Travelers ]  [ I Understand, Continue ]│   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Transparency Rule:** User MUST acknowledge the checkpoint. Cannot be dismissed automatically.

---

# SECTION 2: UI COMPONENTS

## 2.1 Intent Chip (Editable)

**Purpose:** Display the system's understanding of user intent in editable form.

**Anatomy:**
```
┌─────────────────────────────────────────────────────────────┐
│  [ 📱 iPhone 15 Pro Max ] [ 💾 256GB ] [ ⚫ Black ]         │
│  [ 📍 Apple Store NYC ]   [ ✏️ Edit ]                       │
└─────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Each token is a tappable chip
- Tap opens edit modal for that specific attribute
- User can add/remove tokens
- "Edit" link opens full edit mode

**States:**
- `default`: Blue/Neutral chip background
- `ai-suggested`: Subtle sparkle icon, labeled "Suggested"
- `user-edited`: Checkmark icon, labeled "Your choice"

---

## 2.2 "Why This Is Recommended" Explainer

**Purpose:** Make AI recommendations transparent and understandable.

**Anatomy:**
```
┌─────────────────────────────────────────────────────────────┐
│  💡 Why we suggest this:                                    │
│                                                             │
│  • ✅ High success rate on this route (94%)                │
│  • ✅ Price is within typical range                        │
│  • ✅ Traveler has delivered similar items                 │
│                                                             │
│  This is a suggestion. You decide.                         │
└─────────────────────────────────────────────────────────────┘
```

**Rules:**
- ALWAYS use bullet points (scannable)
- ALWAYS end with "You decide" or similar
- NEVER use technical jargon (no "confidence score")
- LIMIT to 3-5 reasons maximum

---

## 2.3 "Safer Alternatives" Card

**Purpose:** Present lower-risk options without shaming user's original choice.

**Anatomy:**
```
┌─────────────────────────────────────────────────────────────┐
│  💡 Safer alternatives available                            │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🛡️ Traveler with 50+ trips available                 │ │
│  │    Same route, arriving 2 days later                  │ │
│  │    [ View ]                                           │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [ Keep my choice ]                                         │
└─────────────────────────────────────────────────────────────┘
```

**Rules:**
- Present as OPTION, not as warning
- Make "Keep my choice" equally prominent
- Never guilt-trip or fear-monger

---

## 2.4 Risk Warning Banner

**Purpose:** Alert user to elevated risk without blocking action.

**Anatomy:**
```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ Elevated Risk Notice                          [ ℹ️ ]    │
│  This transaction has factors that need your attention.    │
└─────────────────────────────────────────────────────────────┘
```

**Variants:**
| Level | Color | Icon | Dismissible |
| :--- | :--- | :--- | :--- |
| **Info** | Blue | ℹ️ | Yes |
| **Caution** | Yellow | ⚠️ | After reading |
| **Warning** | Orange | ⚠️ | After acknowledgment |
| **Block** | Red | 🛑 | No (requires action) |

**Rules:**
- Caution and Warning require user to tap "I understand" before proceeding
- Block level prevents action until issue is resolved
- NEVER use red for non-blocking alerts (crying wolf)

---

## 2.5 Human Confirmation Modal

**Purpose:** The final gate before any action that affects money, trust, or status.

**Anatomy:**
```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ✋ CONFIRM YOUR ACTION                 │   │
│  │                                                     │   │
│  │  [Summary of what will happen]                      │   │
│  │                                                     │   │
│  │  [Protection explanation if applicable]             │   │
│  │                                                     │   │
│  │  [ Cancel ]              [ Confirm ]                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Rules:**
- Modal CANNOT be dismissed by tapping outside
- "Confirm" button requires deliberate tap (no swipe shortcuts)
- For high-value actions: require typing "CONFIRM" or entering PIN
- NO countdown timers (rushed decisions are bad decisions)

---

# SECTION 3: COPY & MICROCOPY

## 3.1 Core Concept Explanations

### Trust Score
> **What is Trust?**
> Trust shows how much verified history a user has on Mnbara. Higher trust means more completed transactions, verified identity, and positive ratings. It's based on facts, not guesses.

### Risk
> **What is Risk?**
> Some transactions have more uncertainty than others. High-value items, new users, or unusual requests may need extra care. We'll always tell you when something needs your attention.

### Escrow
> **What is Escrow?**
> Escrow is a safe place for your money. When you pay, the money goes to escrow—not to the traveler. It's only released when you confirm you received your item. If something goes wrong, you get your money back.

### Cross-Border
> **What is Cross-Border?**
> Cross-border means your item is coming from another country. This may involve customs, duties, or longer delivery times. We'll help you understand what to expect.

---

## 3.2 Error & Warning Messages

### Validation Errors
| Situation | Message |
| :--- | :--- |
| Empty field | "Please fill this in to continue." |
| Invalid email | "That doesn't look like an email. Check for typos?" |
| Weak password | "Your password needs to be stronger. Try adding numbers or symbols." |
| Payment failed | "Payment didn't go through. Check your card details or try another method." |

### System Warnings
| Situation | Message |
| :--- | :--- |
| New user | "This user is new to Mnbara. They haven't built up history yet." |
| High value | "This is a high-value item. Take a moment to review the details." |
| Price unusual | "This price is unusual for this item. Make sure it's what you expect." |
| Long delivery | "Delivery might take longer than usual due to customs." |

### Trust Warnings
| Situation | Message |
| :--- | :--- |
| Low trust traveler | "This traveler has limited history. You can still proceed, but consider the alternatives." |
| Unverified ID | "This user hasn't verified their ID yet. ID verification helps build trust." |
| Recent disputes | "This user has had recent disputes. Tap to learn more." |

### Positive Confirmations
| Situation | Message |
| :--- | :--- |
| Payment to escrow | "Done! Your money is safely in escrow." |
| Offer sent | "Your offer is on its way! We'll notify you when they respond." |
| Delivery confirmed | "Great! Funds released to traveler. Thanks for using Mnbara!" |

---

# SECTION 4: TRUST TRANSPARENCY RULES

## 4.1 What MUST Always Be Shown

| Element | Rule | Exception |
| :--- | :--- | :--- |
| **Trust Level** | Visible on every user card | None |
| **Trust Reason** | At least top 3 factors shown | None |
| **Escrow Status** | Always visible during transaction | None |
| **Fee Breakdown** | Item cost + traveler fee + platform fee | None |
| **Risk Warnings** | Cannot be hidden or minimized | None |
| **"Why" Explainers** | Available for every AI suggestion | None |

## 4.2 What MUST Never Be Hidden

| Element | Why |
| :--- | :--- |
| **Negative trust factors** | Users deserve full picture |
| **Fee components** | Builds trust, prevents surprises |
| **Risk flags** | User safety is non-negotiable |
| **Cancellation options** | User must always have exit |
| **Dispute process** | User needs to know recourse |

## 4.3 User Override Protocol

When user chooses to override a warning:

```
┌─────────────────────────────────────────────────────────────┐
│  You're choosing to proceed despite our notice.             │
│                                                             │
│  ✅ I understand the risks involved                        │
│  ✅ I know I can use escrow protection                     │
│  ✅ I can report issues if something goes wrong            │
│                                                             │
│  [ Go Back ]              [ Proceed Anyway ]                │
└─────────────────────────────────────────────────────────────┘
```

**Rules:**
- User must check acknowledgment boxes
- Override is logged for support purposes
- User receives follow-up notification: "How did this transaction go?"

---

# SECTION 5: MVP → V2 EVOLUTION

## 5.1 What Stays FROZEN (Constitutional)

| Element | Reason |
| :--- | :--- |
| **Human Confirmation Modal** | Core trust promise |
| **Trust Score Visibility** | Core transparency promise |
| **Escrow Protection** | Core safety promise |
| **Override Capability** | User agency promise |
| **"Why" Explainers** | AI transparency promise |
| **No Auto-Execution** | Regulatory requirement |

## 5.2 What Can Be Enhanced (V2+)

| Element | MVP State | V2 Enhancement |
| :--- | :--- | :--- |
| **Intent Chip** | Basic parsing | Voice input, image recognition |
| **Trust Score** | Static factors | Real-time verification updates |
| **Pricing Hints** | Historical average | Dynamic demand-based suggestions |
| **Route Optimization** | Single traveler | Multi-traveler chain suggestions |
| **Delivery Tracking** | Status updates | Real-time GPS (with consent) |
| **Dispute Triage** | Manual queue | AI-assisted severity classification |

## 5.3 Feature Unlock Criteria

| Feature | Unlock When |
| :--- | :--- |
| Smart Pricing v2 | MVP stable 6 months + <5% pricing disputes |
| Voice Intent | MVP stable 3 months + voice input tested in beta |
| Multi-Traveler Chains | Escrow handling proven + legal review complete |
| FX Hints | Regulatory consultation completed |

---

# APPENDIX: DESIGN CHECKLIST

Before shipping any AI-assisted feature, verify:

- [ ] User can see WHY the recommendation was made
- [ ] User can REJECT or MODIFY the recommendation
- [ ] User must CONFIRM before any action affecting money
- [ ] Risk warnings are VISIBLE, not hidden
- [ ] Escrow status is CLEAR
- [ ] Override option EXISTS with acknowledgment
- [ ] Copy is PLAIN LANGUAGE, no jargon
- [ ] No AUTO-EXECUTION of any kind

---
**Document Owner:** Product Team
**Design Lead:** UX Team
**Compliance Review:** Legal & Risk
**Version:** 1.0 (Sprint 2+ Ready)
