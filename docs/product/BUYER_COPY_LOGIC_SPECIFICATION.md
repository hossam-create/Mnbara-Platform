# BUYER-SIDE COPY & LOGIC SPECIFICATION
## Complete Copy Library and UX Decision Rules

**Platform:** Mnbara  
**Audience:** Frontend, Product, Content Teams  
**Date:** December 20, 2025

---

## COPY PRINCIPLES

| Principle | Application |
|-----------|-------------|
| **Calm** | Conversational tone, no exclamation marks, no urgency |
| **No Pressure** | Never rush, never create FOMO, always "take your time" |
| **No Fear** | Inform, don't scare. Present facts, not consequences |
| **Always Explain Why** | Every warning, every suggestion includes reasoning |

### Voice Examples
```
✅ GOOD: "This traveler is new. They're still building history."
❌ BAD:  "Warning! Unverified traveler. Proceed with caution!"

✅ GOOD: "Your money stays in escrow until you confirm delivery."
❌ BAD:  "Protect yourself! Never send money directly!"

✅ GOOD: "Take your time reviewing offers."
❌ BAD:  "Don't miss out! 3 travelers are waiting!"
```

---

# SECTION 1: BUTTON LABELS

## Primary Actions
| Action | Label | Notes |
|--------|-------|-------|
| Submit search | `Search` | Simple, clear |
| View item details | `View Details` | Not "See More" |
| Create request | `Create Request` | Not "Post" or "Submit" |
| Continue to next step | `Continue` | Not "Next" or "Proceed" |
| Submit request | `Submit Request` | Final action, explicit |
| Make offer selection | `View Offers` | Navigational |
| Accept an offer | `Accept This Offer` | Specific, not generic |
| Confirm action | `Confirm` | For modals |

## Secondary Actions
| Action | Label | Notes |
|--------|-------|-------|
| Go back | `Go Back` | Not just "Back" |
| Cancel action | `Cancel` | Clear exit option |
| Edit request | `Edit Request` | Full label |
| Cancel request | `Cancel Request` | Full label |
| View profile | `View Profile` | For user profiles |
| Learn more | `Learn More` | For info expansions |

## Destructive Actions
| Action | Label | Notes |
|--------|-------|-------|
| Delete request | `Delete Request` | Requires confirmation |
| Withdraw offer | `Withdraw` | Less severe than delete |
| Cancel accepted offer | `Cancel This Agreement` | Serious, modal required |

---

# SECTION 2: WARNING TEXT

## Warning Levels

### Level 1: Info (ℹ️)
Low priority, informational only. Dismissible.

| Trigger | Copy |
|---------|------|
| New traveler | `This traveler is new to Mnbara. They're still building history on the platform.` |
| New buyer | `This buyer is new. They haven't completed many purchases yet.` |
| First-time action | `This is your first request. We'll guide you through each step.` |
| Cross-border | `This item comes from another country. Delivery times may vary.` |

### Level 2: Caution (⚠️)
Worth noting. Requires acknowledgment to dismiss.

| Trigger | Copy |
|---------|------|
| High-value item ($1000-2499) | `This is a high-value item. Take a moment to review the traveler's profile before accepting.` |
| Limited traveler history | `This traveler has completed fewer than 5 deliveries. Their history is still developing.` |
| Unusual price | `This price is different from similar items. Make sure it's what you expect.` |
| Longer delivery time | `Delivery is expected to take longer than usual for this route.` |

### Level 3: Warning (⚠️ Orange)
Important notice. Requires checkbox acknowledgment.

| Trigger | Copy |
|---------|------|
| Very high value ($2500+) | `This is a very high-value item ($X). Please review all details carefully before proceeding.` |
| Multiple risk factors | `We noticed a few things about this transaction that need your attention. Please review below.` |
| Unverified traveler + high value | `This traveler hasn't completed ID verification, and this is a high-value item. Consider your options.` |

---

## Warning Banner Templates

### Info Banner
```
┌─────────────────────────────────────────────────┐
│ ℹ️ [TITLE]                                      │
│                                                 │
│ [Explanation text]                              │
│                                                 │
│                                    [ Got It ]   │
└─────────────────────────────────────────────────┘
```

### Caution Banner
```
┌─────────────────────────────────────────────────┐
│ ⚠️ [TITLE]                              [ ℹ️ ]  │
│                                                 │
│ [Explanation text including "why" context]      │
│                                                 │
│                             [ I Understand ]    │
└─────────────────────────────────────────────────┘
```

### Warning Banner (Inline)
```
┌─────────────────────────────────────────────────┐
│ ⚠️ [TITLE]                                      │
│                                                 │
│ [Explanation text]                              │
│                                                 │
│ Why we're showing this:                         │
│ • [Reason 1]                                    │
│ • [Reason 2]                                    │
│                                                 │
│ This doesn't mean something is wrong.           │
│ We just want you to be aware.                   │
└─────────────────────────────────────────────────┘
```

---

# SECTION 3: TRUST EXPLANATIONS

## Trust Level Copy

### High Trust (💚)
**Badge Label:** `Verified` or `High Trust`

**Expanded Explanation:**
```
This user has a strong history on Mnbara.

Here's what we know:
✅ ID verified
✅ [X] completed transactions
✅ [X.X] average rating
✅ Member since [Year]
✅ No unresolved disputes

Higher trust means more verified history. 
It doesn't guarantee future behavior.
```

### Medium Trust (🟡)
**Badge Label:** `Building Trust`

**Expanded Explanation:**
```
This user is building their history on Mnbara.

Here's what we know:
✅ ID verified
⏳ [X] completed transactions (fewer than 10)
✅ [X.X] average rating
✅ Member since [Month Year]

They're still establishing their track record.
Standard protections apply to all transactions.
```

### New User (🔴)
**Badge Label:** `New`

**Expanded Explanation:**
```
This user is new to Mnbara.

Here's what we know:
✅ Account created
⏳ Limited transaction history
⏳ Still building ratings

Everyone starts somewhere. Standard protections 
apply to all transactions, including this one.
```

---

## Trust Factor Explanations

| Factor | Positive Copy | Neutral/Negative Copy |
|--------|---------------|----------------------|
| ID Verification | `ID verified` | `ID not yet verified` |
| Transaction Count | `[X] successful transactions` | `Limited transaction history` |
| Rating | `[X.X] average rating from [Y] reviews` | `No ratings yet` |
| Account Age | `Member since [Year]` | `New member` |
| Disputes | `No unresolved disputes` | `[X] past disputes (resolved)` |

---

## Why We Show Trust

**Permanent footer on all trust panels:**
```
Why we show this:
Trust is based on verified history—completed transactions, 
ratings, and account verification. It helps you make 
informed decisions, but it doesn't guarantee outcomes.
You're always protected by escrow.
```

---

# SECTION 4: CONFIRMATION MODALS

## Modal Structure
```
┌─────────────────────────────────────────────────┐
│                                                 │
│    [ICON] [TITLE]                               │
│                                                 │
│    [Summary of what will happen]                │
│                                                 │
│    [Protection/Context box - if applicable]     │
│                                                 │
│    [Checkbox acknowledgment - if high-risk]     │
│                                                 │
│    [ Secondary Action ]    [ Primary Action ]   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Modal: Create Request
**Trigger:** User submits a new purchase request

```
┌─────────────────────────────────────────────────┐
│                                                 │
│    📦 SUBMIT YOUR REQUEST                       │
│                                                 │
│    You're requesting:                           │
│    [Item Name]                                  │
│    From: [Location]                             │
│    To: [Destination]                            │
│    Traveler fee: $[Amount]                      │
│                                                 │
│    ┌─────────────────────────────────────────┐  │
│    │ What happens next:                      │  │
│    │                                         │  │
│    │ Your request becomes visible to         │  │
│    │ travelers. They'll send you offers,     │  │
│    │ and you choose which one works best.    │  │
│    │                                         │  │
│    │ You can edit or cancel anytime before   │  │
│    │ accepting an offer.                     │  │
│    └─────────────────────────────────────────┘  │
│                                                 │
│    [ Go Back ]           [ Submit Request ]     │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Modal: Accept Offer (Standard)
**Trigger:** User accepts a traveler's offer

```
┌─────────────────────────────────────────────────┐
│                                                 │
│    ✋ CONFIRM YOUR CHOICE                       │
│                                                 │
│    You're accepting this offer:                 │
│                                                 │
│    👤 [Traveler Name]                           │
│    ✈️ Arriving: [Date]                          │
│    💵 Traveler fee: $[Amount]                   │
│                                                 │
│    ┌─────────────────────────────────────────┐  │
│    │ 🔒 YOUR MONEY IS PROTECTED              │  │
│    │                                         │  │
│    │ • Funds go to escrow, not the traveler  │  │
│    │ • Released only when you confirm        │  │
│    │ • Full refund if item isn't delivered   │  │
│    └─────────────────────────────────────────┘  │
│                                                 │
│    [ Go Back ]       [ Accept & Continue ]      │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Modal: Accept Offer (High-Risk)
**Trigger:** User accepts offer with risk flags

```
┌─────────────────────────────────────────────────┐
│                                                 │
│    ⚠️ BEFORE YOU ACCEPT                        │
│                                                 │
│    We noticed a few things:                     │
│                                                 │
│    • This is a high-value item ($[Amount])      │
│    • This traveler is new ([X] deliveries)      │
│                                                 │
│    This doesn't mean something is wrong.        │
│    We just want you to be aware.                │
│                                                 │
│    ┌─────────────────────────────────────────┐  │
│    │ 💡 You might also consider:             │  │
│    │                                         │  │
│    │ • Reviewing the traveler's profile      │  │
│    │ • Messaging them with questions         │  │
│    │ • Waiting for offers from more          │  │
│    │   experienced travelers                 │  │
│    └─────────────────────────────────────────┘  │
│                                                 │
│    ☐ I've reviewed this and want to proceed    │
│                                                 │
│    [ See Other Offers ]   [ Accept Anyway ]     │
│                            (enabled when checked)│
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Modal: Cancel Request
**Trigger:** User cancels their own request

```
┌─────────────────────────────────────────────────┐
│                                                 │
│    ❌ CANCEL YOUR REQUEST                       │
│                                                 │
│    Are you sure you want to cancel?             │
│                                                 │
│    📱 [Item Name]                               │
│                                                 │
│    This will:                                   │
│    • Remove your request from listings          │
│    • Decline any pending offers                 │
│                                                 │
│    You can create a new request anytime.        │
│                                                 │
│    [ Keep Request ]       [ Yes, Cancel ]       │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Modal: Confirm Delivery
**Trigger:** User confirms item received

```
┌─────────────────────────────────────────────────┐
│                                                 │
│    ✅ CONFIRM DELIVERY                          │
│                                                 │
│    Did you receive your item?                   │
│                                                 │
│    📱 [Item Name]                               │
│    👤 Delivered by: [Traveler Name]             │
│                                                 │
│    ┌─────────────────────────────────────────┐  │
│    │ When you confirm:                       │  │
│    │                                         │  │
│    │ • Funds will be released to the         │  │
│    │   traveler                              │  │
│    │ • You'll be asked to leave a rating     │  │
│    │ • The transaction will be complete      │  │
│    └─────────────────────────────────────────┘  │
│                                                 │
│    [ Not Yet ]           [ Yes, I Received It ] │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Modal: Report Issue
**Trigger:** User reports a problem

```
┌─────────────────────────────────────────────────┐
│                                                 │
│    🚨 REPORT AN ISSUE                           │
│                                                 │
│    What's happening?                            │
│                                                 │
│    ○ Item not received                          │
│    ○ Item is different from description         │
│    ○ Item is damaged                            │
│    ○ Communication problem                      │
│    ○ Something else                             │
│                                                 │
│    ┌─────────────────────────────────────────┐  │
│    │ What happens when you report:           │  │
│    │                                         │  │
│    │ • Funds stay in escrow                  │  │
│    │ • Our support team will review          │  │
│    │ • We'll contact both parties            │  │
│    │ • Most issues resolve in 24-48 hours    │  │
│    └─────────────────────────────────────────┘  │
│                                                 │
│    [ Cancel ]              [ Report Issue ]     │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

# SECTION 5: UX DECISION RULES

## When to Show Warnings

| Condition | Action |
|-----------|--------|
| Item value ≥ $1000 | Show Caution banner |
| Item value ≥ $2500 | Show Warning banner + checkbox |
| Traveler deliveries < 5 | Show Info banner |
| Traveler deliveries < 2 | Show Caution banner |
| Traveler not ID verified | Show Caution banner |
| Multiple conditions met | Combine into Warning banner |
| Cross-border delivery | Show Info banner |
| First-time buyer | Show helpful Info banner |

---

## When to Require Acknowledgment

| Scenario | Required Action |
|----------|-----------------|
| Standard request submission | Confirmation modal |
| Standard offer acceptance | Confirmation modal |
| High-value item ($1000+) | Modal + "I understand" checkbox |
| New traveler + high value | Modal + checkbox + alternatives shown |
| Cancel accepted offer | Modal + explicit confirmation |
| Confirm delivery | Modal + clear explanation |
| Report an issue | Modal + issue selection |

---

## When to Show Alternatives

| Trigger | Show Alternatives |
|---------|-------------------|
| Accepting offer from new traveler | ✅ Yes |
| High-value + medium/low trust | ✅ Yes |
| User hesitates (30+ seconds on modal) | ✅ Yes (subtle) |
| Standard transaction | ❌ No |

**Alternatives Copy:**
```
You might also consider:
• [X] other travelers have made offers
• [X] of them have higher trust ratings
• [ See Other Offers ]
```

---

## Button State Rules

| Button | State Rule |
|--------|------------|
| `Submit Request` | Enabled only when all required fields valid |
| `Accept This Offer` | Always enabled (modal handles warnings) |
| `Accept Anyway` (in warning modal) | Disabled until checkbox checked |
| `Confirm` | Enabled only after required acknowledgments |
| `Report Issue` | Enabled only when issue type selected |

---

## Copy Length Rules

| Element | Max Length | Guidance |
|---------|------------|----------|
| Button label | 3 words | Action-focused |
| Warning title | 4 words | Clear, not alarming |
| Warning body | 2 sentences | Explain + reassure |
| Modal title | 4 words | Action description |
| Modal body | 50 words max | Essential info only |
| Trust explanation | 75 words max | Factual, scannable |

---

## Prohibited Copy Patterns

| ❌ Never Use | ✅ Use Instead |
|--------------|----------------|
| "Warning!" / "Danger!" | "We noticed..." |
| "Beware" / "Watch out" | "Here's what we know" |
| "Act now" / "Hurry" | "Take your time" |
| "Only X left" | Don't mention scarcity |
| "Don't miss out" | No FOMO language |
| "Are you sure?" | "You're about to..." |
| "This cannot be undone" | "You can [alternative] anytime" |
| Legal jargon | Plain English |
| "Terms and conditions apply" | Explain the specific thing |
| "Proceed at your own risk" | "Standard protections apply" |

---

## Escape Hatch Rules

Every screen must provide:

| Element | Implementation |
|---------|----------------|
| **Back/Cancel** | Always visible, always functional |
| **Edit option** | Available until final confirmation |
| **Help access** | Persistent in header or footer |
| **Exit confirmation** | Only if user has unsaved changes |

---

# SECTION 6: EMPTY & ERROR STATES

## Empty States

### No Offers Yet
```
📬 No offers yet

Travelers are reviewing your request.
We'll notify you when someone makes an offer.

Average response time: 4-8 hours
```

### No Matching Travelers
```
📭 No travelers on this route

No travelers are currently going from
[Origin] to [Destination].

You can:
• Create a request and wait for matches
• Try a nearby destination
• Check back later

[ Create Request ]
```

### No Requests Created
```
📦 No requests yet

You haven't created any purchase requests.

When you find something you want, 
create a request and travelers will send offers.

[ Create Your First Request ]
```

---

## Error States

### Submission Failed
```
😕 Couldn't submit your request

Something went wrong on our end.
Your information has been saved.

[ Try Again ]

If this keeps happening, contact support.
```

### Action Failed
```
😕 That didn't work

We couldn't complete this action.
Please try again.

[ Try Again ]   [ Go Back ]
```

### Validation Error
```
Field: [Field Name]
Error: [Specific helpful message]

Examples:
• "Please enter an item name"
• "This doesn't look like a valid URL"
• "Please select a date"
```

---

**Document Owner:** Content & UX Teams  
**Version:** 1.0  
**Date:** December 20, 2025
