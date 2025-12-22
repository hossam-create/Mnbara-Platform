# Founder Dashboard Specification

A simple, honest dashboard for founders. Every metric includes what it means and what not to assume.

---

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FOUNDER DASHBOARD                                        Last updated: Now │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  TODAY'S PULSE                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  TRUST HEALTH                                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  MONEY MOVEMENT                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  GROWTH SIGNALS                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  THINGS THAT NEED ATTENTION                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Section 1: Today's Pulse

Quick snapshot of what's happening right now.

### Metrics

| Metric | Description | What This Means | What Not to Assume |
|--------|-------------|-----------------|-------------------|
| **Active Users** | People using the platform right now | Someone has the app or site open | They're not necessarily doing anything meaningful |
| **Transactions in Progress** | Orders currently being fulfilled | Work is happening | These haven't completed yet—anything could still go wrong |
| **Support Queue** | Unresolved support tickets | People need help | A low number isn't always good—it might mean people aren't bothering to ask |
| **System Status** | Are all services running? | Green = systems responding | Doesn't mean everything is working perfectly for users |

### Copy for UI

**Section Title:** Today's Pulse

**Subtitle:** What's happening right now

**Active Users Card:**
- Label: "Active right now"
- Value: {{COUNT}}
- Helper: "People with the app or site open"

**Transactions Card:**
- Label: "In progress"
- Value: {{COUNT}} orders
- Helper: "Being picked up, shipped, or delivered"

**Support Queue Card:**
- Label: "Waiting for help"
- Value: {{COUNT}} tickets
- Helper: "Oldest: {{OLDEST_AGE}}"

**System Status Card:**
- Label: "Systems"
- Value: {{STATUS}} (All good / Issues detected)
- Helper: "{{SERVICES_UP}} of {{SERVICES_TOTAL}} services responding"

---

## Section 2: Trust Health

The metrics that matter most for a trust-first business.

### Metrics

| Metric | Description | What This Means | What Not to Assume |
|--------|-------------|-----------------|-------------------|
| **Completion Rate** | % of started transactions that finish successfully | People are getting what they paid for | High completion doesn't mean they're happy—just that it technically worked |
| **Dispute Rate** | % of transactions with disputes opened | Something went wrong enough that someone complained | Low disputes might mean people gave up instead of complaining |
| **Resolution Time** | Average time to resolve disputes | How fast we fix problems | Fast resolution isn't always good—rushing can mean bad decisions |
| **Repeat Users** | % of users who come back | People found enough value to return | They might be coming back to check on a problem, not to buy again |

### Copy for UI

**Section Title:** Trust Health

**Subtitle:** Are we keeping our promises?

**Completion Rate Card:**
- Label: "Transactions completed"
- Value: {{PERCENT}}%
- Trend: {{TREND}} vs last week
- Helper: "Started → delivered successfully"
- Warning (if <90%): "Below 90% needs investigation"

**Dispute Rate Card:**
- Label: "Disputes opened"
- Value: {{PERCENT}}%
- Trend: {{TREND}} vs last week
- Helper: "Of completed transactions"
- Warning (if >5%): "Above 5% triggers growth pause"

**Resolution Time Card:**
- Label: "Avg resolution time"
- Value: {{HOURS}} hours
- Trend: {{TREND}} vs last week
- Helper: "From dispute opened to resolved"
- Warning (if >48): "Target is under 48 hours"

**Repeat Users Card:**
- Label: "Came back"
- Value: {{PERCENT}}%
- Trend: {{TREND}} vs last week
- Helper: "Users with 2+ transactions"

---

## Section 3: Money Movement

What's flowing through the platform.

### Metrics

| Metric | Description | What This Means | What Not to Assume |
|--------|-------------|-----------------|-------------------|
| **GMV Today** | Total value of transactions today | Money moved through the platform | This isn't revenue—most of this goes to sellers and travelers |
| **Revenue Today** | Fees we actually earned | What we made | Doesn't account for refunds that might come later |
| **In Escrow** | Money currently held | Transactions waiting for delivery confirmation | This is other people's money—we're just holding it |
| **Pending Payouts** | Money owed to sellers/travelers | We need to pay this out | Cash flow obligation, not profit |

### Copy for UI

**Section Title:** Money Movement

**Subtitle:** What's flowing through

**GMV Card:**
- Label: "Transaction volume"
- Value: ${{AMOUNT}}
- Period: Today
- Helper: "Total value of all transactions"
- Note: "This isn't our revenue"

**Revenue Card:**
- Label: "Fees earned"
- Value: ${{AMOUNT}}
- Period: Today
- Helper: "Service fees collected"
- Note: "Before refunds"

**Escrow Card:**
- Label: "Held in escrow"
- Value: ${{AMOUNT}}
- Helper: "Waiting for delivery confirmation"
- Note: "Other people's money"

**Payouts Card:**
- Label: "Owed to users"
- Value: ${{AMOUNT}}
- Helper: "Pending payouts to sellers & travelers"
- Note: "Cash flow obligation"

---

## Section 4: Growth Signals

How we're growing (or not).

### Metrics

| Metric | Description | What This Means | What Not to Assume |
|--------|-------------|-----------------|-------------------|
| **New Users This Week** | People who signed up | Interest in the platform | Signups aren't customers—most won't transact |
| **First Transactions** | New users who completed their first order | Someone trusted us enough to try | One transaction doesn't mean they'll come back |
| **Acquisition Source** | Where new users came from | Which channels are working | "Working" just means signups—not quality users |
| **Referral Rate** | % of new users from existing users | Organic word-of-mouth | Could be one power user referring everyone, not broad satisfaction |

### Copy for UI

**Section Title:** Growth Signals

**Subtitle:** How we're finding users

**New Users Card:**
- Label: "Signed up"
- Value: {{COUNT}}
- Period: This week
- Helper: "New accounts created"
- Note: "Most won't transact"

**First Transactions Card:**
- Label: "First purchase"
- Value: {{COUNT}}
- Period: This week
- Helper: "New users who completed an order"
- Conversion: "{{PERCENT}}% of signups"

**Acquisition Source Card:**
- Label: "Where they came from"
- Breakdown:
  - Organic search: {{PERCENT}}%
  - Direct: {{PERCENT}}%
  - Referral: {{PERCENT}}%
  - Other: {{PERCENT}}%
- Helper: "Self-reported or tracked"

**Referral Card:**
- Label: "From existing users"
- Value: {{PERCENT}}%
- Helper: "New users referred by current users"
- Note: "Check if it's concentrated or spread out"

---

## Section 5: Things That Need Attention

Issues that might need a decision.

### Alert Types

| Alert | Trigger | What It Means | What to Do |
|-------|---------|---------------|------------|
| **Trust Alert** | Dispute rate >5% | More problems than normal | Review recent disputes, consider pausing growth |
| **Capacity Alert** | Support queue >50 | Team is overwhelmed | Add support capacity or slow down acquisition |
| **System Alert** | Service degraded | Something technical is wrong | Engineering needs to look |
| **Growth Alert** | Kill-switch threshold approached | Metrics nearing pause triggers | Review and decide whether to slow down |

### Copy for UI

**Section Title:** Things That Need Attention

**Subtitle:** Issues that might need a decision

**No Alerts State:**
- Message: "Nothing urgent right now"
- Helper: "We'll surface issues here when they need attention"

**Trust Alert Card:**
- Icon: ⚠️
- Title: "Trust metrics need review"
- Detail: "Dispute rate is {{PERCENT}}% (threshold: 5%)"
- Action: "Review disputes →"
- Context: "This might mean we should pause growth activities"

**Capacity Alert Card:**
- Icon: ⚠️
- Title: "Support is backed up"
- Detail: "{{COUNT}} tickets waiting, oldest is {{AGE}}"
- Action: "View queue →"
- Context: "Response time affects trust"

**System Alert Card:**
- Icon: 🔴
- Title: "System issue detected"
- Detail: "{{SERVICE}} is responding slowly"
- Action: "View status →"
- Context: "Users might be experiencing problems"

**Growth Alert Card:**
- Icon: ⚠️
- Title: "Approaching growth pause trigger"
- Detail: "{{METRIC}} is at {{VALUE}} (threshold: {{THRESHOLD}})"
- Action: "Review metrics →"
- Context: "Consider slowing acquisition"

---

## Interpretation Guide

### What Good Looks Like

| Metric | Healthy Range | Concern Threshold |
|--------|---------------|-------------------|
| Completion Rate | >95% | <90% |
| Dispute Rate | <3% | >5% |
| Resolution Time | <24 hours | >48 hours |
| Repeat Users | >30% | <20% |
| Support Queue | <20 tickets | >50 tickets |
| First Transaction Rate | >15% of signups | <10% of signups |

### What to Watch For

**Good numbers that might be misleading:**
- High completion rate + low repeat users = People got what they ordered but didn't love it
- Low disputes + low repeat users = People aren't complaining, but they're not coming back
- High GMV + low revenue = We're moving money but not capturing value
- Fast growth + declining completion = We're acquiring faster than we can serve

**Bad numbers that might be okay:**
- High dispute rate during a new corridor launch = Expected growing pains
- Slow resolution time during holidays = Temporary capacity issue
- Low new signups during intentional growth pause = Working as intended

---

## Dashboard Principles

1. **Show the number, then explain it**
   - Every metric has a "what this means" tooltip
   - No number stands alone

2. **Warn against wrong conclusions**
   - Every metric has a "what not to assume" note
   - Prevent false confidence

3. **Surface decisions, not just data**
   - "Things that need attention" is actionable
   - Don't just show red numbers—say what to do

4. **Honest about uncertainty**
   - Use ranges, not false precision
   - Acknowledge when we don't know

5. **Trust metrics first**
   - Trust health appears before money
   - Growth signals come after trust

---

*Document Version: 1.0*
*Last Updated: December 2025*
*Owner: Product Team*
