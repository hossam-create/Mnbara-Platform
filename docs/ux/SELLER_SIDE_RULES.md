# Seller-Side UX Rules

Rules for seller/traveler listing creation and management. Transparency first, no hidden mechanics.

---

## Core Principles

| Principle | Implementation |
|-----------|----------------|
| Transparency | Show all factors affecting visibility |
| No hidden ranking | Explain why listings appear where they do |
| No auto-approval | Human review for flagged content |
| Clear feedback | Tell sellers exactly what's wrong and how to fix it |

---

## 1. Warning Triggers

### When to Show Warnings (Yellow)

Warnings inform but don't block. Seller can proceed.

| Trigger | Warning Copy |
|---------|--------------|
| **Price below market** | "Your price is lower than similar items. Make sure this is intentional." |
| **Price above market** | "Your price is higher than similar items. Buyers may compare before choosing." |
| **Missing photos** | "Listings with photos get 3x more responses. Consider adding images." |
| **Short description** | "A detailed description helps buyers trust your listing." |
| **New seller** | "As a new seller, your first few transactions build your reputation." |
| **Unverified phone** | "Verifying your phone helps buyers trust you." |
| **Cross-border route** | "This route crosses borders. Customs rules may apply." |
| **High-value item** | "High-value items may require additional verification from buyers." |
| **Long delivery window** | "Delivery windows over 14 days may reduce buyer interest." |
| **Category mismatch** | "This item might fit better in [suggested category]." |

### Warning UI Pattern

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Heads up                                                 │
│                                                             │
│ Your price ($50) is lower than similar items ($75-$120).    │
│ Make sure this is intentional.                              │
│                                                             │
│ [Continue anyway]                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Blocking Triggers

### When to Block Submission (Red)

Blocks prevent submission until fixed. Always explain why.

| Trigger | Block Copy | How to Fix |
|---------|------------|------------|
| **Missing required fields** | "Please complete all required fields." | Highlight empty fields |
| **Invalid price** | "Price must be greater than $0." | Focus price field |
| **Prohibited item** | "This item type isn't allowed on our platform." | Link to prohibited items list |
| **Duplicate listing** | "You already have an active listing for this item." | Link to existing listing |
| **Account restricted** | "Your account is currently restricted from creating listings." | Link to account status |
| **Unverified identity** | "Please verify your identity before listing items over $500." | Link to verification |
| **Banned keywords** | "Your listing contains terms that aren't allowed." | Highlight problematic text |
| **Suspicious pattern** | "We need to verify this listing before it goes live." | Explain review process |
| **Rate limit exceeded** | "You've created too many listings today. Try again tomorrow." | Show when they can retry |
| **Corridor not supported** | "We don't support deliveries on this route yet." | Show supported routes |

### Block UI Pattern

```
┌─────────────────────────────────────────────────────────────┐
│ 🚫 Can't submit yet                                         │
│                                                             │
│ Please verify your identity before listing items over $500. │
│                                                             │
│ Why? High-value listings require verified sellers to        │
│ protect buyers.                                             │
│                                                             │
│ [Verify Now]  [List a lower-value item instead]             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Trust Requirements

### Trust Level Explanations

| Trust Level | What It Means | How to Reach It |
|-------------|---------------|-----------------|
| **New** | Just joined | Complete registration |
| **Standard** | Basic verification | Verify email + phone |
| **Trusted** | Proven track record | 5+ successful transactions, 4+ rating |
| **Verified** | Full verification | ID verified + 10+ transactions + 4.5+ rating |

### Trust Requirement Copy

**For New Sellers:**
```
Your Trust Level: New

What this means:
- You can list items up to $100
- Buyers see you're new to the platform
- Your first transactions build your reputation

How to level up:
□ Verify your email (done)
□ Verify your phone
□ Complete your first transaction
□ Maintain a good rating
```

**For Restricted Actions:**
```
This action requires Trusted status

You're currently: Standard
You need: Trusted

What's different:
- Trusted sellers can list items up to $1,000
- Trusted sellers appear higher in search
- Trusted sellers can offer express delivery

How to get there:
- Complete 3 more successful transactions
- Maintain your 4.2 rating
```

### Trust Display in Listing Form

```
┌─────────────────────────────────────────────────────────────┐
│ Your Seller Profile                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Trust Level: Standard ⭐⭐⭐                                 │
│ Rating: 4.2 (12 reviews)                                    │
│ Completed: 15 transactions                                  │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ What buyers see:                                        │ │
│ │ • Your trust level badge                                │ │
│ │ • Your rating and review count                          │ │
│ │ • How long you've been on the platform                  │ │
│ │ • Your response rate                                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [View full profile] [Improve your trust level]              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Visibility Transparency

### No Hidden Ranking

Always explain why listings appear where they do.

**Visibility Factors (Show All):**

```
┌─────────────────────────────────────────────────────────────┐
│ How your listing ranks in search                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Factors that help:                                          │
│ ✓ Complete profile (+15%)                                   │
│ ✓ Verified phone (+10%)                                     │
│ ✓ Good rating 4.2★ (+12%)                                   │
│ ✓ Fast response rate (+8%)                                  │
│                                                             │
│ Factors that could improve:                                 │
│ ○ Add photos (+20% if added)                                │
│ ○ Longer description (+5% if expanded)                      │
│ ○ Verify ID (+15% if verified)                              │
│                                                             │
│ Your estimated visibility: 45/100                           │
│ Average for similar listings: 52/100                        │
│                                                             │
│ This is an estimate. Actual ranking depends on buyer        │
│ searches and preferences.                                   │
└─────────────────────────────────────────────────────────────┘
```

### Ranking Explanation Copy

**When listing is created:**
> "Your listing is live. It will appear in search results based on relevance to buyer searches, your trust level, and listing quality."

**When listing has low visibility:**
> "Your listing is getting fewer views than similar items. Here's why and how to improve:"

**When listing is boosted:**
> "Your listing is currently featured because [reason]. This is not paid promotion."

---

## 5. Review Process

### No Auto-Approval for Flagged Content

**What triggers manual review:**
- First listing from new account
- High-value items (>$500)
- Flagged keywords
- Unusual patterns
- Reported content

**Review Status Copy:**

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Listing under review                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Your listing is being reviewed by our team.                 │
│                                                             │
│ Why? This is your first listing. We review all first        │
│ listings to keep the marketplace safe.                      │
│                                                             │
│ What happens:                                               │
│ • We'll review within 24 hours (usually faster)             │
│ • You'll get a notification when it's approved              │
│ • If there's an issue, we'll explain what to fix            │
│                                                             │
│ Status: Submitted 2 hours ago                               │
│ Estimated review: Within 22 hours                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**After Review - Approved:**
> "Your listing is now live. Good luck with your sale!"

**After Review - Changes Needed:**
```
Your listing needs changes before it can go live.

What we found:
• Description mentions "guaranteed delivery" - we can't guarantee delivery times
• Price seems unusually low for this item - please confirm it's correct

Please update your listing and resubmit.
[Edit Listing]
```

**After Review - Rejected:**
```
We can't approve this listing.

Reason: This item type isn't allowed on our platform.

What you can do:
• Review our prohibited items list
• Contact support if you think this is a mistake

[View Prohibited Items] [Contact Support]
```

---

## 6. Form Validation Copy

### Field-Level Validation

| Field | Validation | Error Copy |
|-------|------------|------------|
| Title | 10-100 chars | "Title must be between 10 and 100 characters" |
| Description | 50-2000 chars | "Please add more detail (at least 50 characters)" |
| Price | > 0, < 10000 | "Price must be between $1 and $10,000" |
| Category | Required | "Please select a category" |
| Condition | Required | "Please select the item condition" |
| Origin | Required | "Where will this item ship from?" |
| Destination | Required | "Where should this item be delivered?" |
| Photos | Recommended | "Listings with photos get more responses" |

### Real-Time Feedback

```
Title: iPhone 15 Pro Max 256GB
       ✓ Good length (24 characters)

Description: Brand new, sealed in box.
             ⚠️ Consider adding more detail (28 characters, 50 recommended)

Price: $1199
       ✓ Within typical range for this category ($900-$1400)
```

---

## 7. Listing Status Copy

### Status Explanations

| Status | Badge | Explanation |
|--------|-------|-------------|
| Draft | 📝 | "Not visible to buyers. Finish and publish when ready." |
| Under Review | 🔍 | "Being reviewed by our team. Usually takes less than 24 hours." |
| Active | ✅ | "Live and visible to buyers." |
| Paused | ⏸️ | "Hidden from search. You can reactivate anytime." |
| Matched | 🤝 | "A buyer is interested. Check your messages." |
| Completed | ✓ | "Transaction complete. Thanks for using MNBARA!" |
| Expired | ⏰ | "This listing has expired. Renew to make it active again." |
| Removed | 🚫 | "This listing was removed. [See why]" |

---

## 8. Seller Dashboard Copy

### Performance Transparency

```
┌─────────────────────────────────────────────────────────────┐
│ Your Seller Performance                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ This Month                                                  │
│ ─────────────────────────────────────────────────────────── │
│ Views: 234          (↑ 12% vs last month)                   │
│ Inquiries: 18       (↓ 5% vs last month)                    │
│ Completed: 3        (same as last month)                    │
│                                                             │
│ Your Metrics                                                │
│ ─────────────────────────────────────────────────────────── │
│ Response rate: 92%  (Great! Buyers appreciate fast replies) │
│ Response time: 2h   (Faster than 78% of sellers)            │
│ Completion rate: 94% (3% above average)                     │
│                                                             │
│ What This Means                                             │
│ ─────────────────────────────────────────────────────────── │
│ Your response rate and completion rate are strong.          │
│ Inquiries are slightly down - consider refreshing your      │
│ listing photos or adjusting prices.                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Quick Reference

### Warning vs Block Decision Tree

```
Is it a safety issue?
├─ Yes → BLOCK
└─ No
   └─ Is it a policy violation?
      ├─ Yes → BLOCK
      └─ No
         └─ Could it hurt the seller's success?
            ├─ Yes → WARN
            └─ No → Allow silently
```

### Copy Tone Guidelines

| Situation | Tone | Example |
|-----------|------|---------|
| Warning | Helpful, not alarming | "Heads up: ..." |
| Block | Clear, not harsh | "Can't submit yet: ..." |
| Success | Encouraging | "You're all set!" |
| Error | Specific, actionable | "Please fix: [specific issue]" |
| Trust info | Educational | "Here's how trust levels work..." |

### Never Say

| Avoid | Use Instead |
|-------|-------------|
| "You must..." | "Please..." |
| "Error" | "Something needs attention" |
| "Invalid" | "Please check..." |
| "Denied" | "We can't approve this because..." |
| "Your listing was rejected" | "Your listing needs changes" |
| "Violation" | "This doesn't meet our guidelines" |

---

*Document Version: 1.0*
*Last Updated: December 2025*
*Owner: Product & UX Team*

