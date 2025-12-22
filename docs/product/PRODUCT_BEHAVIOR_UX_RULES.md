# PRODUCT BEHAVIOR & UX RULES
## Trust-First Commerce with eBay-Inspired Patterns

**Platform:** Mnbara  
**Date:** December 20, 2025

---

## CORE BEHAVIORAL PRINCIPLES

```
┌─────────────────────────────────────────────────────────────────┐
│  TRUST-FIRST COMMERCE                                           │
│                                                                 │
│  1. Every action is user-initiated                              │
│  2. Every decision shows its reasoning                          │
│  3. Every confirmation is explicit                              │
│  4. Every exit is available                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Anti-Pattern Prohibitions
| ❌ Prohibited | ✅ Required Instead |
|---------------|---------------------|
| Auto-submit anything | Explicit tap required |
| Auto-accept offers | User reviews and confirms |
| Hidden information | Full transparency |
| Countdown timers | "Take your time" messaging |
| Scarcity messaging | Neutral, factual counts |
| Pre-selected options | User selects explicitly |
| Buried cancellation | Cancel always visible |

---

# SECTION 1: BUYER BEHAVIOR RULES

## Screen: Home

### Behavior Rules
| Rule | Implementation |
|------|----------------|
| Search is primary | Search bar is largest element |
| No auto-suggestions until typing | User initiates search |
| Recent searches shown | Only after user has history |
| No trending/FOMO sections | No "hot items" or "selling fast" |

### Copy
| Element | Text |
|---------|------|
| Headline | `What would you like to get?` |
| Search placeholder | `Describe what you're looking for...` |
| Browse CTA | `Browse Requests` |
| Traveler CTA | `I'm Traveling` |

### Decision Visibility
```
"Why am I seeing this?"
→ Not applicable on home (no algorithmic content)
```

---

## Screen: Search Results

### Behavior Rules
| Rule | Implementation |
|------|----------------|
| Results sorted by relevance | Not by "sponsored" or paid |
| Trust badges always visible | Every result shows trust level |
| No auto-refresh | User taps to refresh |
| Neutral result count | "12 travelers found" not "12 travelers waiting!" |

### Copy
| Element | Text |
|---------|------|
| Results header | `[X] travelers can help` |
| Filter button | `Filter` |
| Empty state | `No travelers found for this item` |
| Card CTA | `View Details` |

### Decision Visibility
```
"Why am I seeing these results?"

Results are sorted by:
• Route match (closest to your destination)
• Traveler availability (soonest arrival)
• Trust level (verified travelers first)

We don't promote paid listings.
```

---

## Screen: Request Details

### Behavior Rules
| Rule | Implementation |
|------|----------------|
| All information visible | No hidden fees, no "see more" for critical info |
| Trust breakdown accessible | One tap to see trust factors |
| Price breakdown always shown | Item + fee + platform fee |
| Risk banners non-dismissible | Until user acknowledges |

### Copy
| Element | Text |
|---------|------|
| Section headers | `Route`, `Terms`, `About the Traveler` |
| Trust expand | `Why this trust level?` |
| Price total | `Estimated total: $[X]` |
| CTA (Buyer) | `Create Similar Request` |
| CTA (Traveler) | `Make an Offer` |

### Decision Visibility
```
"Why is this marked [Trust Level]?"

[Traveler Name] has:
✅ [List of positive factors]
⏳ [List of developing factors]

Trust is based on verified history.
It doesn't guarantee future behavior.
```

---

## Screen: My Requests

### Behavior Rules
| Rule | Implementation |
|------|----------------|
| Status always clear | Active, Pending, Completed, Cancelled |
| Offer count shown | "[X] offers" badge on each request |
| Edit/Cancel always visible | Until offer is accepted |
| No auto-archive | User controls their list |

### Copy
| Element | Text |
|---------|------|
| Empty state | `No requests yet. Create one to get started.` |
| Status: Active | `Active — Visible to travelers` |
| Status: Pending | `Pending — Waiting for traveler` |
| Status: Completed | `Completed` |
| Edit button | `Edit Request` |
| Cancel button | `Cancel Request` |

---

## Screen: Offers Received

### Behavior Rules
| Rule | Implementation |
|------|----------------|
| All offers shown equally | No "recommended" highlighting |
| Trust levels visible | Every offer shows traveler trust |
| No expiration pressure | Offers don't expire automatically |
| Comparison enabled | User can view side-by-side |

### Copy
| Element | Text |
|---------|------|
| Header | `[X] travelers have made offers` |
| Subheader | `Take your time reviewing.` |
| Offer CTA | `Accept This Offer` |
| Profile CTA | `View Profile` |
| Tip | `Higher trust means more verified history. You decide.` |

### Decision Visibility
```
"Why are offers shown in this order?"

Offers are listed by:
• When they were received (newest first)

We don't rank offers. You review and decide.
```

---

## Screen: Accept Offer

### Behavior Rules
| Rule | Implementation |
|------|----------------|
| Summary shown | Full recap before confirmation |
| Escrow explained | Always show where money goes |
| Checkbox for high-risk | Required acknowledgment |
| Both buttons equal weight | Cancel and Confirm same size |

### Confirmation Checkpoint
```
┌─────────────────────────────────────────────────┐
│ ✋ CONFIRM YOUR CHOICE                          │
│                                                 │
│ You're accepting this offer from:               │
│ 👤 [Name] • [Trust Badge]                       │
│ ✈️ Arriving: [Date]                             │
│ 💵 Fee: $[Amount]                               │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🔒 Your money is protected                  │ │
│ │ Funds go to escrow until you confirm        │ │
│ │ delivery. Full refund if not delivered.     │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [ Go Back ]            [ Accept & Continue ]    │
└─────────────────────────────────────────────────┘
```

---

# SECTION 2: TRAVELER BEHAVIOR RULES

## Screen: Browse Requests

### Behavior Rules
| Rule | Implementation |
|------|----------------|
| Route filter prominent | First action is setting route |
| Buyer trust visible | Every request shows buyer trust |
| No bidding pressure | No "X travelers viewing" |
| Value warnings shown | High-value items flagged |

### Copy
| Element | Text |
|---------|------|
| Header | `Browse Requests` |
| Filter prompt | `Show requests for your route` |
| Results | `[X] requests match your route` |
| Empty state | `No requests on this route yet` |
| Card CTA | `View Details` |

### Decision Visibility
```
"Why am I seeing these requests?"

Requests are filtered by:
• Your travel route
• Your travel dates

Results are sorted by:
• Fee amount (highest first)
• Buyer trust level
```

---

## Screen: Request Details (Traveler View)

### Behavior Rules
| Rule | Implementation |
|------|----------------|
| Buyer trust visible | Full trust breakdown available |
| Item details complete | URL, notes, specifications |
| Fee suggestion shown | AI suggestion with explanation |
| No commitment until submit | Viewing doesn't create obligation |

### Copy
| Element | Text |
|---------|------|
| Buyer section | `About the Buyer` |
| Trust CTA | `View Full Profile` |
| Fee hint | `Buyer is offering: $[X] traveler fee` |
| Helper | `You can propose a different fee.` |
| CTA | `Make an Offer` |

---

## Screen: Make Offer

### Behavior Rules
| Rule | Implementation |
|------|----------------|
| Fee is user-controlled | AI suggests, user decides |
| All fields editable | Nothing pre-locked |
| Review before submit | Summary screen required |
| Cancel always available | No "are you sure?" on cancel |

### Copy
| Element | Text |
|---------|------|
| Fee label | `Your Traveler Fee` |
| Fee suggestion | `Similar items earn $[X]-$[Y]. This is a suggestion.` |
| Date label | `When will you arrive?` |
| Message label | `Message to Buyer (optional)` |
| Message hint | `A personal message helps buyers choose you.` |
| CTA | `Review Offer` |

### Confirmation Checkpoint
```
┌─────────────────────────────────────────────────┐
│ ✋ CONFIRM YOUR OFFER                           │
│                                                 │
│ You're offering to deliver:                     │
│ 📱 [Item Name]                                  │
│                                                 │
│ Your fee: $[Amount]                             │
│ Arriving: [Date]                                │
│                                                 │
│ The buyer will review your offer and decide     │
│ whether to accept. You'll be notified either    │
│ way.                                            │
│                                                 │
│ [ Go Back ]              [ Send Offer ]         │
└─────────────────────────────────────────────────┘
```

---

## Screen: My Offers

### Behavior Rules
| Rule | Implementation |
|------|----------------|
| Status always clear | Pending, Accepted, Declined |
| Withdraw available | Until buyer accepts |
| No auto-decline | Offers stay pending indefinitely |
| Notification settings | User controls alerts |

### Copy
| Element | Text |
|---------|------|
| Empty state | `You haven't made any offers yet.` |
| Status: Pending | `Pending — Waiting for buyer` |
| Status: Accepted | `Accepted — Ready to shop` |
| Status: Declined | `Not selected` |
| Withdraw button | `Withdraw Offer` |

---

# SECTION 3: CONFIRMATION CHECKPOINTS

## Checkpoint Matrix

| Action | Checkpoint Type | Acknowledgment |
|--------|-----------------|----------------|
| Submit request | Modal | Confirm button |
| Edit request | Inline | Save button |
| Cancel request | Modal | Confirm button |
| Accept offer | Modal | Confirm button |
| Accept offer (high-risk) | Modal | Checkbox + Confirm |
| Make offer | Modal | Confirm button |
| Withdraw offer | Modal | Confirm button |
| Confirm delivery | Modal | Confirm button |
| Report issue | Modal | Issue type + Confirm |
| Rate user | Inline | Submit button |

---

## High-Risk Checkpoint Rules

### When to Trigger
| Condition | Trigger |
|-----------|---------|
| Item value ≥ $1000 | ⚠️ Caution banner |
| Item value ≥ $2500 | ⚠️ Warning + checkbox |
| Counterparty new (< 3 txns) | ℹ️ Info banner |
| Counterparty new + high value | ⚠️ Warning + checkbox |
| Unverified ID + high value | ⚠️ Warning + checkbox |

### Checkpoint Template
```
┌─────────────────────────────────────────────────┐
│ ⚠️ BEFORE YOU PROCEED                          │
│                                                 │
│ We noticed:                                     │
│ • [Risk Factor 1]                               │
│ • [Risk Factor 2]                               │
│                                                 │
│ This doesn't mean something is wrong.           │
│ We just want you to be aware.                   │
│                                                 │
│ ☐ I've reviewed this and want to proceed        │
│                                                 │
│ [ See Alternatives ]   [ Continue ]             │
│                         (enabled when checked)  │
└─────────────────────────────────────────────────┘
```

---

# SECTION 4: ERROR STATES

## Error Types & Copy

### Network Error
```
📶 No connection

Check your internet and try again.

[ Retry ]
```

### Server Error
```
😕 Something went wrong

We're having trouble on our end.
Please try again in a moment.

[ Retry ]   [ Go Home ]
```

### Validation Error
```
Field-level errors shown inline:

• "Please enter an item name"
• "Please select a valid date"
• "Price must be a number"
```

### Action Failed
```
😕 Couldn't complete that

[Specific reason if known]

Your information has been saved.

[ Try Again ]   [ Go Back ]
```

### Session Expired
```
🔐 Session expired

For your security, please sign in again.

[ Sign In ]
```

### Not Found
```
🔍 Not found

This [request/offer/user] doesn't exist
or has been removed.

[ Go Back ]   [ Go Home ]
```

---

## Error Behavior Rules

| Rule | Implementation |
|------|----------------|
| Never lose user data | Auto-save drafts locally |
| Clear error messaging | Specific, not generic |
| Always provide action | Retry or escape route |
| No blame language | "Something went wrong" not "You made an error" |
| Persist user context | Don't reset forms on error |

---

# SECTION 5: EMPTY STATES

## Empty State Templates

### No Search Results
```
📭 No matches found

We couldn't find travelers for "[Query]"

Try:
• Using different keywords
• Checking your spelling
• Browsing categories instead

[ Clear Search ]   [ Browse Categories ]
```

### No Requests on Route
```
📭 No requests on this route

No one needs items from [Origin] to [Destination] right now.

Check back later, or try:
• Expanding your dates
• Nearby destinations

[ Change Route ]
```

### No Offers Received
```
📬 No offers yet

Travelers are reviewing your request.
We'll notify you when someone makes an offer.

Average response time: 4-8 hours

[ Edit Request ]
```

### No Requests Created (Buyer)
```
📦 No requests yet

Create a request to find travelers who can
bring you what you're looking for.

[ Create Your First Request ]
```

### No Offers Made (Traveler)
```
✈️ No offers yet

Browse requests matching your travel route
and make offers to start earning.

[ Browse Requests ]
```

### No Transaction History
```
📋 No history yet

Your completed transactions will appear here.

[ Browse Requests ]   [ Create Request ]
```

---

## Empty State Rules

| Rule | Implementation |
|------|----------------|
| Always explain why empty | Context for the user |
| Suggest next action | Clear path forward |
| Positive framing | "Not yet" vs "Nothing" |
| No guilt messaging | No "You haven't done X" |

---

# SECTION 6: TRUST & RISK EXPLANATIONS

## Trust Level Display Rules

### Always Visible
| Element | Location |
|---------|----------|
| Trust badge | Every user card, every listing |
| Trust level | Inline with username |
| Trust expansion | One tap away |

### Trust Badges
| Level | Badge | Color |
|-------|-------|-------|
| High | `Verified` or `High Trust` | 💚 Green |
| Medium | `Building Trust` | 🟡 Yellow |
| New | `New` | 🔴 Red (soft) |

---

## Trust Explanation Template
```
"Why this trust level?"

[Username] has:

✅ ID verified
✅ [X] successful transactions
✅ [X.X] average rating
✅ Member since [Year]
✅ No unresolved disputes

─────────────────────────────

Trust is based on verified history.
It doesn't guarantee future behavior.
You're always protected by escrow.
```

---

## Risk Explanation Template
```
"Why am I seeing this warning?"

We noticed:
• [Specific factor 1]
• [Specific factor 2]

This doesn't mean something is wrong.
It's information to help you decide.

Your protections:
• Funds held in escrow
• Support available 24/7
• Dispute resolution if needed
```

---

## Decision Visibility Rules

### What Must Be Explained
| Decision | Explanation Required |
|----------|---------------------|
| Search ranking | How results are sorted |
| Trust level | What factors contribute |
| Risk warning | Why it's being shown |
| Fee suggestion | How it was calculated |
| Traveler recommendation | Why they're suggested |

### Explanation Access
| Method | When to Use |
|--------|-------------|
| Inline text | Always visible context |
| `ℹ️` icon tap | Secondary details |
| "Why?" link | Full breakdown |
| Tooltip | Quick definitions |

---

# SECTION 7: SCREEN-BY-SCREEN RULES SUMMARY

## Buyer Screens

| Screen | Key Rules |
|--------|-----------|
| Home | Search-first, no FOMO, no auto-content |
| Search Results | Trust visible, neutral counts, no paid promotion |
| Request Details | Full transparency, trust breakdown, price breakdown |
| My Requests | Status clear, edit/cancel visible, no auto-archive |
| Offers Received | All offers equal, no ranking, no expiration |
| Accept Offer | Summary + escrow explanation + checkpoint |

## Traveler Screens

| Screen | Key Rules |
|--------|-----------|
| Browse Requests | Route filter first, buyer trust visible, no pressure |
| Request Details | Full item info, fee suggestion with "why" |
| Make Offer | User controls fee, review before submit |
| My Offers | Status clear, withdraw available, no auto-decline |

## Shared Screens

| Screen | Key Rules |
|--------|-----------|
| Profile | Trust factors visible, history shown |
| Messages | No read receipts, no typing indicators |
| Settings | All preferences explicit, no defaults that harm |
| Help | Always accessible, no chatbot-first |

---

# SECTION 8: COPY GLOSSARY

## Standard Terms

| Term | Usage | Don't Use |
|------|-------|-----------|
| Request | Buyer's item request | Order, Listing, Post |
| Offer | Traveler's proposal | Bid, Quote |
| Traveler | Person delivering | Seller, Courier, Shopper |
| Buyer | Person requesting | Customer, User |
| Fee | Traveler compensation | Commission, Tip, Reward |
| Escrow | Protected payment | Holding, Reserve |
| Trust | Verified history | Score, Rating, Rank |

## Action Verbs

| Action | Button Text |
|--------|-------------|
| Search | `Search` |
| Create | `Create Request` |
| Submit | `Submit` |
| Accept | `Accept This Offer` |
| Confirm | `Confirm` |
| Cancel | `Cancel` |
| Edit | `Edit` |
| Delete | `Delete` |
| Report | `Report Issue` |
| View | `View Details` |

---

**Document Owner:** Product Team  
**Version:** 1.0  
**Date:** December 20, 2025
