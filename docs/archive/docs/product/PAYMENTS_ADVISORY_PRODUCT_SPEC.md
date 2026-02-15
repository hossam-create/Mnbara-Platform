# PAYMENTS ADVISORY PRODUCT SPECIFICATION
## Advisory-Only Payment Experience

**Confidential**
**Classification:** Product Specification
**Audience:** Product, Design, Frontend Teams
**Date:** December 19, 2025

---

## 1. Core Philosophy

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│         "COMPARE. EXPLAIN. WARN. NEVER CHOOSE."             │
│                                                             │
│    The system presents options with full transparency.      │
│    The user always makes the final selection.               │
│    No default is set without clear explanation.             │
│    No ranking is hidden. No nudging allowed.                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Design Constraints
| Constraint | Implementation |
| :--- | :--- |
| User always chooses | No pre-selected options |
| System only compares | Side-by-side display with pros/cons |
| No hidden ranking | Alphabetical or by user history (disclosed) |
| No behavioral nudging | Equal visual weight for all options |
| Full transparency | Every fee, risk, and limitation visible |

---

## 2. Payment Method Comparison Framework

### 2.1 Supported Payment Methods

| Method | Type | Protection Level | Speed |
| :--- | :--- | :--- | :--- |
| **Platform Escrow** | Held by Platform | Highest | 1-3 days release |
| **Credit/Debit Card** | Card Network | High (Chargeback) | Instant |
| **Digital Wallet** | Provider-dependent | Medium | Instant |
| **Bank Transfer** | Direct | Low | 1-5 days |

### 2.2 Comparison Matrix

```
┌─────────────────────────────────────────────────────────────┐
│              PAYMENT METHOD COMPARISON                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │   ESCROW    │    CARD     │   WALLET    │   BANK      │ │
│  ├─────────────┼─────────────┼─────────────┼─────────────┤ │
│  │ Protection  │ Protection  │ Protection  │ Protection  │ │
│  │ ★★★★★       │ ★★★★☆       │ ★★★☆☆       │ ★★☆☆☆       │ │
│  ├─────────────┼─────────────┼─────────────┼─────────────┤ │
│  │ Speed       │ Speed       │ Speed       │ Speed       │ │
│  │ ★★★☆☆       │ ★★★★★       │ ★★★★★       │ ★★☆☆☆       │ │
│  ├─────────────┼─────────────┼─────────────┼─────────────┤ │
│  │ Fees        │ Fees        │ Fees        │ Fees        │ │
│  │ 2.5%        │ 2.9% + $0.30│ 1.5-3%      │ $5-25 flat  │ │
│  ├─────────────┼─────────────┼─────────────┼─────────────┤ │
│  │ Dispute     │ Dispute     │ Dispute     │ Dispute     │ │
│  │ Platform    │ Card issuer │ Varies      │ Limited     │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Detailed Method Profiles

#### Platform Escrow
**How It Works:**
Your payment is held securely by the platform until you confirm receipt of your item.

| Aspect | Detail |
| :--- | :--- |
| **Best For** | High-value items, first-time transactions, new travelers |
| **Protection** | Full refund if item not delivered |
| **Release** | You control when funds are released |
| **Fees** | 2.5% of transaction |
| **Disputes** | Handled by platform (SLA: 72 hours response) |

**Pros:**
- ✅ Highest buyer protection
- ✅ You decide when traveler gets paid
- ✅ Platform mediates disputes

**Cons:**
- ⚠️ Funds held until delivery confirmed
- ⚠️ Release may take 1-3 business days

**Risk Level:** 🟢 LOW

---

#### Credit/Debit Card
**How It Works:**
Standard card payment with chargeback rights through your card issuer.

| Aspect | Detail |
| :--- | :--- |
| **Best For** | Quick transactions, users familiar with chargebacks |
| **Protection** | Chargeback through card issuer (60-120 days) |
| **Speed** | Instant payment |
| **Fees** | 2.9% + $0.30 |
| **Disputes** | Through your bank (not platform) |

**Pros:**
- ✅ Instant payment processing
- ✅ Familiar process
- ✅ Card issuer protection

**Cons:**
- ⚠️ Chargeback process can be slow (30-90 days)
- ⚠️ Not all disputes are successful
- ⚠️ International cards may have additional fees

**Risk Level:** 🟢 LOW

---

#### Digital Wallet (PayPal, Apple Pay, etc.)
**How It Works:**
Payment through your existing wallet balance or linked payment method.

| Aspect | Detail |
| :--- | :--- |
| **Best For** | Users with existing wallet balances |
| **Protection** | Varies by provider (check your wallet's buyer protection) |
| **Speed** | Instant |
| **Fees** | 1.5-3% (varies by provider) |
| **Disputes** | Through wallet provider |

**Pros:**
- ✅ Fast checkout
- ✅ No need to enter card details
- ✅ Some providers offer buyer protection

**Cons:**
- ⚠️ Protection varies significantly by provider
- ⚠️ Some wallets have limited dispute windows
- ⚠️ May have currency conversion fees

**Risk Level:** 🟡 MEDIUM (varies by provider)

---

#### Bank Transfer
**How It Works:**
Direct transfer from your bank account to the transaction.

| Aspect | Detail |
| :--- | :--- |
| **Best For** | Users in jurisdictions with limited card access |
| **Protection** | Limited (difficult to reverse) |
| **Speed** | 1-5 business days |
| **Fees** | $5-25 flat (varies by bank) |
| **Disputes** | Through your bank (very limited) |

**Pros:**
- ✅ Lower fees for high-value transactions
- ✅ No card limits

**Cons:**
- ⚠️ Very limited dispute options
- ⚠️ Slow processing
- ⚠️ Difficult to reverse if issues arise

**Risk Level:** 🟠 HIGHER (limited protection)

---

### 2.4 Contextual Recommendations

The system displays contextual recommendations based on transaction attributes:

| Context | Recommended Option | Reason Shown |
| :--- | :--- | :--- |
| First transaction with traveler | Escrow | "This is your first transaction with this traveler. Escrow gives you the most protection." |
| High-value (>$500) | Escrow | "For high-value items, escrow ensures your payment is protected until delivery." |
| Repeat trusted traveler | Any (equal display) | "You've completed 5+ transactions with this traveler. All payment methods available." |
| Cross-border | Escrow or Card | "Cross-border transactions benefit from stronger protection options." |
| Low-value (<$50) | Any (equal display) | "For lower-value items, any payment method works well." |

**Display Rule:** Recommendations are shown as informational banners, NOT as pre-selections.

---

## 3. FX Advisory Layer

### 3.1 Rate Comparison Display

```
┌─────────────────────────────────────────────────────────────┐
│                   FX RATE INFORMATION                       │
│                                                             │
│  Your purchase: $1,199 USD                                  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Estimated in your currency:                           │ │
│  │                                                       │ │
│  │ 💵 ~37,170 EGP                                        │ │
│  │                                                       │ │
│  │ Rate: 1 USD = 31.00 EGP (mid-market)                 │ │
│  │ Source: Reuters, updated 5 minutes ago               │ │
│  │                                                       │ │
│  │ ⚠️ Final rate determined at payment time.            │ │
│  │    Your bank may apply additional fees.              │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [ View rate history ]  [ Set rate alert ]                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Fee Transparency

**Always Display:**
| Fee Type | Visibility | Example |
| :--- | :--- | :--- |
| Platform fee | Always shown | "Platform fee: $29.98 (2.5%)" |
| Payment processing | Always shown | "Card processing: $35.07 (2.9% + $0.30)" |
| Estimated FX spread | Always shown | "Estimated FX cost: ~1-3% (set by your bank)" |
| Traveler fee | Always shown | "Traveler fee: $150" |

**Fee Breakdown Modal:**
```
┌─────────────────────────────────────────────────────────────┐
│                    FEE BREAKDOWN                            │
│                                                             │
│  Item price:                           $1,199.00           │
│  Traveler fee:                         $  150.00           │
│  ─────────────────────────────────────────────────         │
│  Subtotal:                             $1,349.00           │
│                                                             │
│  Platform fee (2.5%):                  $   33.73           │
│  Payment processing (2.9% + $0.30):    $   39.42           │
│  ─────────────────────────────────────────────────         │
│  TOTAL (USD):                          $1,422.15           │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ℹ️ Your bank may charge additional fees for:          │ │
│  │    • Currency conversion (typically 1-3%)             │ │
│  │    • International transaction (typically 0-3%)       │ │
│  │                                                       │ │
│  │ These fees are set by YOUR bank, not by us.          │ │
│  │ We show them so you're not surprised.                │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Timing Hints

**Display (Informational Only):**
```
┌─────────────────────────────────────────────────────────────┐
│  💡 FX TIMING INSIGHT                                       │
│                                                             │
│  USD/EGP has moved ~2% this week.                          │
│                                                             │
│  • Current: 31.00 EGP per USD                              │
│  • 7-day high: 31.50                                       │
│  • 7-day low: 30.20                                        │
│                                                             │
│  This is informational only. We cannot predict rates.      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 FX Disclaimer (Mandatory)

**Always Displayed:**
```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ CURRENCY DISCLAIMER                                     │
│                                                             │
│  Exchange rates shown are ESTIMATES based on current       │
│  mid-market rates. The actual rate you receive depends on:│
│                                                             │
│  • Your bank or card issuer's rate                         │
│  • The time your payment is processed                      │
│  • Any fees your bank charges for conversion               │
│                                                             │
│  We do not control or guarantee exchange rates.            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Payment Risk Warnings

### 4.1 Warning Trigger Matrix

| Condition | Warning Level | Warning Type |
| :--- | :--- | :--- |
| Transaction > $1,000 | 🟡 Caution | High-value notice |
| Transaction > $5,000 | 🟠 Elevated | Enhanced notice + acknowledgment |
| Cross-border payment | 🟡 Caution | Cross-border notice |
| Volatile currency pair | 🟡 Caution | Currency volatility notice |
| Bank transfer selected | 🟠 Elevated | Limited protection notice |
| New traveler (< 3 trips) | 🟡 Caution | New traveler notice |
| Restricted destination | 🔴 Block | Regulatory restriction |

### 4.2 Warning Display Rules

**Rule 1:** Warnings appear BEFORE payment method selection.
**Rule 2:** Elevated warnings require acknowledgment checkbox.
**Rule 3:** Block-level warnings prevent proceeding.
**Rule 4:** User can always see "Why am I seeing this?"

---

## 5. UX Artifacts

### 5.1 "Why This Payment Option Is Shown"

**Location:** Next to each payment option
**Trigger:** Tap on (i) icon or "Why?"

**Example (Escrow):**
```
┌─────────────────────────────────────────────────────────────┐
│  ℹ️ WHY ESCROW IS SHOWN                                     │
│                                                             │
│  Escrow is available for all transactions on our platform. │
│                                                             │
│  We're highlighting it because:                            │
│  • This is a high-value transaction ($1,199)              │
│  • This is your first transaction with this traveler      │
│                                                             │
│  You can choose any available payment method.              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 "Safer Option Available" Banner

**Trigger:** User selects lower-protection option when higher is available

**Display:**
```
┌─────────────────────────────────────────────────────────────┐
│  💡 SAFER OPTION AVAILABLE                                  │
│                                                             │
│  You selected: Bank Transfer                               │
│                                                             │
│  Bank transfers have LIMITED protection if something       │
│  goes wrong.                                               │
│                                                             │
│  Consider: Escrow or Card payment for more protection.    │
│                                                             │
│  [ View alternatives ]  [ Keep my choice ]                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Design Rules:**
- Banner is informational, not blocking
- "Keep my choice" is equally prominent as alternatives
- No fear language, just factual comparison

### 5.3 "Higher Risk But Allowed" Acknowledgment

**Trigger:** User proceeds with elevated-risk payment method

**Display:**
```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ ACKNOWLEDGMENT REQUIRED                                 │
│                                                             │
│  You're choosing Bank Transfer for a $2,500 transaction.   │
│                                                             │
│  Please understand:                                        │
│  • Bank transfers are difficult to reverse                 │
│  • Dispute options are limited                             │
│  • We recommend escrow for transactions over $500         │
│                                                             │
│  ☐ I understand the risks and want to proceed             │
│                                                             │
│  [ Go back ]              [ Proceed ]                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.4 Human Confirmation Modal (Final Step)

**Trigger:** User clicks "Pay" or "Confirm Payment"

**Display:**
```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐   │
│  │             ✋ CONFIRM YOUR PAYMENT                  │   │
│  │                                                     │   │
│  │ You are paying:                         $1,422.15  │   │
│  │                                                     │   │
│  │ Item: iPhone 15 Pro Max 256GB                      │   │
│  │ Traveler: Sarah M.                                 │   │
│  │ Payment method: Platform Escrow                    │   │
│  │                                                     │   │
│  │ ┌───────────────────────────────────────────────┐   │   │
│  │ │ 🔒 WHAT HAPPENS NEXT                          │   │   │
│  │ │                                               │   │   │
│  │ │ 1. Your $1,422.15 goes to escrow             │   │   │
│  │ │ 2. Traveler is notified of your request      │   │   │
│  │ │ 3. When you receive your item, you confirm   │   │   │
│  │ │ 4. Traveler receives payment                 │   │   │
│  │ │                                               │   │   │
│  │ │ Your money is protected until you confirm.   │   │   │
│  │ └───────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │ [ Cancel ]            [ Confirm & Pay ]            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Anti-Dark Pattern Checklist

Before shipping any payment UI:

- [ ] All options have equal visual weight (no giant buttons vs. tiny text)
- [ ] No option is pre-selected
- [ ] Fees are shown BEFORE confirmation, not after
- [ ] "Recommended" labels explain WHY (not just "recommended")
- [ ] User can easily compare all options
- [ ] Cancel/back is as prominent as proceed
- [ ] No countdown timers creating urgency
- [ ] No shame language ("Are you SURE you don't want protection?")
- [ ] Warnings are factual, not fear-based
- [ ] All disclaimers are readable (not tiny gray text)

---
**Document Owner:** Product Lead
**Design Review:** UX Team
**Compliance Review:** Legal
**Version:** 1.0 (Payments Advisory)
