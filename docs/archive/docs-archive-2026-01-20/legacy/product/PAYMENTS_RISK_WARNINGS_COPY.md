# PAYMENTS RISK WARNINGS COPY
## User-Facing Messaging Library

**Confidential**
**Classification:** UX Copy / Microcopy
**Audience:** Design, Frontend, Content Teams
**Date:** December 19, 2025

---

## 1. Copy Philosophy

```
┌─────────────────────────────────────────────────────────────┐
│                     COPY PRINCIPLES                         │
│                                                             │
│  ✅ PLAIN LANGUAGE    - No jargon, no legalese             │
│  ✅ TRUST-FIRST       - Assume good faith, build confidence │
│  ✅ HONEST            - State facts, not fears              │
│  ✅ HELPFUL           - Explain what to do, not just warn   │
│                                                             │
│  ❌ NO FEAR TACTICS   - No "DANGER!" or "WARNING!"          │
│  ❌ NO DARK PATTERNS  - No guilt, shame, or manipulation    │
│  ❌ NO HIDDEN MEANING - Say exactly what you mean           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. High-Value Transaction Warnings

### 2.1 Standard High-Value Notice ($500-$1,000)

**Banner (Yellow):**
```
💡 This is a high-value transaction

For purchases over $500, we recommend using Escrow or Card payment 
for stronger protection. You can choose any method you prefer.
```

### 2.2 Elevated High-Value Notice ($1,000-$5,000)

**Banner (Yellow) + Info:**
```
💡 Large purchase ahead

This is a $[amount] transaction. Here's what you should know:

• Escrow holds your payment until you confirm delivery
• Card payments offer chargeback protection through your bank
• Bank transfers have limited dispute options

Take a moment to choose the payment method that feels right for you.
```

### 2.3 Very High-Value Notice (>$5,000)

**Modal (Yellow) + Acknowledgment:**
```
📋 Extra care for large purchases

You're making a $[amount] transaction. For amounts this size, 
we want to make sure you're comfortable with your choices.

What we recommend:
• Use Platform Escrow for maximum protection
• If using a card, confirm your daily limit with your bank
• Consider splitting into smaller transactions if you're unsure

This isn't required—it's just information to help you decide.

☐ I've reviewed this and want to proceed

[ Go back ]                    [ Continue ]
```

---

## 3. Cross-Border Warnings

### 3.1 Standard Cross-Border Notice

**Banner (Blue/Informational):**
```
🌍 This is an international transaction

Your item is coming from [Country]. Here's what that means:

• Customs or import duties may apply (paid by you at delivery)
• Delivery takes longer than domestic purchases
• Currency conversion fees may be charged by your bank

We'll help you track your item every step of the way.
```

### 3.2 Cross-Border with Currency Conversion

**Banner (Blue):**
```
💱 Currency note

This purchase is in USD. If your account is in a different currency, 
your bank will convert it at their rate (not ours).

Bank conversion fees are typically 1-3% but vary by bank.
Check with your bank for exact rates.
```

### 3.3 Cross-Border to Restricted Region

**Banner (Yellow):**
```
⚠️ Limited delivery options

Deliveries to [Region] have some restrictions. This might affect:

• Delivery time (may be longer)
• Tracking accuracy (may be limited)
• Return options (may be more difficult)

Your funds are still protected if the item isn't delivered.
```

---

## 4. Chargeback & Dispute Limitations

### 4.1 Card Payment Chargeback Info

**Info Box (When card is selected):**
```
ℹ️ About card payment protection

If something goes wrong, you can dispute the charge with your bank.

Things to know:
• Disputes must typically be filed within 60-120 days
• Your bank makes the final decision, not us
• The process usually takes 30-90 days

Escrow is faster: we handle disputes directly, usually within 72 hours.
```

### 4.2 Bank Transfer Limited Protection

**Warning Box (When bank transfer is selected):**
```
⚠️ Bank transfers have limited protection

Bank transfers are like sending cash—once it's sent, it's difficult 
to get back if something goes wrong.

What this means:
• Your bank may not be able to reverse the payment
• Dispute options are very limited
• We can't recover funds from completed transfers

For better protection, consider Escrow or Card payment instead.

[ View other options ]    [ I understand, continue with bank transfer ]
```

### 4.3 Wallet Provider Varies

**Info Box (When wallet is selected):**
```
ℹ️ Wallet protection varies

Different wallets offer different levels of buyer protection.

• PayPal: Has buyer protection for eligible purchases
• Apple Pay: Uses your card's protection (chargeback)
• Other wallets: Check your provider's terms

We recommend confirming your wallet's protection before paying.
```

---

## 5. Currency Volatility Warnings

### 5.1 Standard Volatility Notice

**Banner (Blue):**
```
💱 Exchange rate notice

Currency rates change constantly. The rate you see now is an estimate. 
Your actual rate will be set when your payment is processed.

Recent movement: [Currency pair] has moved ~[X]% this week.
```

### 5.2 High Volatility Notice

**Banner (Yellow):**
```
💱 Currency has been moving

[Currency] has moved more than usual recently (±[X]% this week).

This means the amount you pay in your currency could be:
• Higher or lower than the estimate shown
• Different from what you expect

Consider this when deciding on your purchase timing.
```

### 5.3 Extreme Volatility Notice

**Banner (Orange) + Acknowledgment:**
```
⚠️ Significant currency movement

[Currency] has experienced significant movement recently (±[X]% this week).

What this means for you:
• The actual amount charged could differ significantly from estimates
• You may want to wait for the currency to stabilize
• Your bank's rate may differ from what we show

There's no right or wrong choice—just make sure you're comfortable.

☐ I understand currency rates may change significantly

[ Wait and check later ]              [ Proceed anyway ]
```

---

## 6. Regulatory & Compliance Notices

### 6.1 Transaction Limit Notice

**Info Box:**
```
ℹ️ Transaction limits

Your payment method may have daily or transaction limits:

• Cards: Check with your bank (common limits: $2,000-$10,000/day)
• Bank transfers: Usually no limit, but may require extra verification
• Wallets: Varies by provider

If your payment is declined, this might be why.
```

### 6.2 Verification Required Notice

**Banner (Blue):**
```
📋 Extra verification may be needed

For your protection, your bank may ask for additional verification 
for international or high-value transactions.

This might include:
• SMS or app confirmation
• A call from your bank
• Temporary card hold

This is normal and helps keep your money safe.
```

### 6.3 Regulatory Restriction Notice

**Modal (Red) - Blocking:**
```
🚫 We can't process this payment

Due to regulatory restrictions, we're unable to process payments 
to/from [Region] at this time.

This isn't about you—it's a legal requirement we must follow.

What you can do:
• Try a different payment method
• Contact support for alternatives
• Check if the traveler can use a different route

[ Contact Support ]              [ Go Back ]
```

---

## 7. Escrow-Specific Messaging

### 7.1 Escrow Explanation

**Info Box:**
```
🔒 How Escrow works

1. You pay → Money goes to a secure holding account (not to the traveler)
2. Traveler fulfills → They purchase and deliver your item
3. You confirm → Once you have your item and it's correct, you confirm
4. Traveler paid → Only then does the traveler receive payment

If something goes wrong, your money is protected.
```

### 7.2 Escrow Hold Notice

**Info Box:**
```
⏳ Your payment is being held

Your $[amount] is safely in escrow. It will stay there until:

• You confirm you received your item, OR
• You request a refund (if there's a problem), OR
• The protection period expires (you'll be notified first)

You're in control.
```

### 7.3 Escrow Release Confirmation

**Modal:**
```
✋ Confirm release of funds

You're about to release $[amount] to [Traveler Name].

Before you confirm:
• Have you received your item?
• Is it what you ordered?
• Are you satisfied with the condition?

Once released, funds cannot be recovered.

[ Not yet, go back ]              [ Yes, release funds ]
```

---

## 8. Error & Problem Messages

### 8.1 Payment Failed

**Message:**
```
❌ Payment didn't go through

Your payment wasn't processed. This could be because:

• Your bank declined the transaction
• You've reached a spending limit
• There was a temporary technical issue

Your money hasn't been charged. Try again or use a different 
payment method.

[ Try again ]    [ Use different method ]    [ Contact support ]
```

### 8.2 Partial Payment Issue

**Message:**
```
⚠️ Something went wrong

We received part of your payment, but there was an issue. 
Don't worry—your money is safe.

What's happening:
• We're reviewing the transaction
• You'll receive an email within 2 hours with next steps
• No action needed from you right now

If you don't hear from us, contact support.

[ Contact support ]
```

### 8.3 Currency Conversion Failed

**Message:**
```
💱 Currency conversion issue

We couldn't convert your payment at this time. This might be because:

• Rates are temporarily unavailable
• Your bank couldn't process the conversion

Try again in a few minutes, or use a payment method in USD.

[ Try again ]    [ Pay in USD ]
```

---

## 9. Confirmation & Success Messages

### 9.1 Payment Successful (Escrow)

**Message:**
```
✅ Payment received!

Your $[amount] is now safely in escrow.

What happens next:
1. We've notified [Traveler Name] of your request
2. They'll purchase your item during their trip
3. You'll receive tracking updates along the way
4. When it arrives, you'll confirm and release payment

Track your order anytime in "My Orders."

[ View order ]    [ Back to home ]
```

### 9.2 Payment Successful (Card/Direct)

**Message:**
```
✅ Payment complete!

Your payment of $[amount] has been processed.

What happens next:
1. [Traveler Name] has been notified
2. Your item is on its way
3. Track delivery in "My Orders"

Remember: If anything goes wrong, you have chargeback rights 
through your card issuer.

[ View order ]    [ Back to home ]
```

---

## 10. Help & Support Copy

### 10.1 Payment Help

**Help Article:**
```
💬 Which payment method should I choose?

There's no single "best" option—it depends on what matters most to you.

Choose ESCROW if:
• This is your first time with this traveler
• The item is expensive
• You want maximum protection

Choose CARD if:
• You're comfortable with chargeback processes
• You want instant payment
• You trust the traveler

Choose BANK TRANSFER if:
• You're in a region with limited card access
• You're very confident in the transaction
• You understand the limited protection

Still unsure? Start with Escrow. It's the safest option for everyone.
```

### 10.2 Dispute Help

**Help Article:**
```
💬 What if something goes wrong?

We hope everything goes smoothly, but if it doesn't, here's what to do:

FOR ESCROW PAYMENTS:
1. Don't release funds
2. Open a dispute in "My Orders"
3. We'll review within 72 hours
4. You'll get a full refund if the item wasn't delivered correctly

FOR CARD PAYMENTS:
1. Contact us first—we may be able to help
2. If not, contact your bank within 60 days
3. Your bank will investigate and decide

FOR BANK TRANSFERS:
1. Contact us immediately
2. We'll work with the traveler to resolve
3. Note: Refunds are difficult for bank transfers

The sooner you report a problem, the more we can help.
```

---

## 11. Tone & Language Guidelines

### Words to Use
| Instead of... | Say... |
| :--- | :--- |
| Warning | Notice / Heads up |
| Danger | Something to know |
| You must | We recommend |
| Required | Needed / Helpful |
| Immediately | Soon / As soon as you can |
| Failure | Didn't work / Issue |
| Error | Something went wrong |
| Risk | Things to consider |

### Sentence Patterns
| Bad | Good |
| :--- | :--- |
| "WARNING: You may lose money!" | "Here's something to know about this option." |
| "Are you SURE you want to do this?" | "Before you proceed, let's review." |
| "This is a BAD choice!" | "This option has some limitations." |
| "You're making a mistake!" | "There are other options to consider." |

---
**Document Owner:** Content Lead
**UX Review:** Design Team
**Compliance Review:** Legal
**Version:** 1.0 (Payments Copy)
