# GROWTH EXPERIMENTS PRODUCT SPECIFICATION
## Non-Regulated Experimentation Framework

**Confidential**
**Classification:** Product / Growth
**Audience:** Product, Growth, Design Teams
**Date:** December 19, 2025

---

## 1. Experimentation Philosophy

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     "HELP USERS UNDERSTAND, NOT CHOOSE FOR THEM."          │
│                                                             │
│  Experiments improve CLARITY, not influence DECISIONS.      │
│  We measure UNDERSTANDING, not CONVERSION.                  │
│  We optimize for CONFIDENCE, not URGENCY.                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Hard Limits (Non-Negotiable)

| Forbidden | Reason |
| :--- | :--- |
| ❌ Influence payment choice | Regulatory risk |
| ❌ Influence trust outcomes | Fairness violation |
| ❌ Pressure tactics | Dark pattern |
| ❌ Hidden incentives | Trust violation |
| ❌ Countdown timers | Artificial urgency |
| ❌ Social proof manipulation | Deceptive |
| ❌ Default selections | Removes user agency |

### Allowed Focus Areas

| Allowed | Goal |
| :--- | :--- |
| ✅ Clarity improvements | Reduce confusion |
| ✅ Education enhancements | Increase understanding |
| ✅ Layout optimization | Improve scanability |
| ✅ Copy clarity tests | Reduce misinterpretation |
| ✅ Progressive disclosure | Reduce overwhelm |
| ✅ Search/filter UX | Help users find what they need |

---

## 2. Allowed Experiment Types

### 2.1 Onboarding Clarity Experiments

**Objective:** Help new users understand the platform faster.

**Allowed Variants:**

| Experiment | Control | Variant A | Variant B |
| :--- | :--- | :--- | :--- |
| Step count | 5 steps | 3 steps (condensed) | 7 steps (detailed) |
| Progress indicator | Dots | Progress bar | Checklist |
| Tooltip timing | On hover | On first visit | On-demand only |
| Welcome modal | Text-heavy | Visual/icon-heavy | Video walkthrough |

**Measurement:**
- Time to complete onboarding
- Drop-off rate per step
- Support tickets within 24h of signup
- Self-reported clarity score (post-onboarding survey)

**NOT Allowed:**
- Skipping safety disclosures
- Hiding terms and conditions
- Auto-selecting preferences

---

### 2.2 Intent Chip Copy Variants

**Objective:** Help users express their purchase intent more accurately.

**Allowed Variants:**

| Experiment | Control | Variant A | Variant B |
| :--- | :--- | :--- | :--- |
| Placeholder text | "What are you looking for?" | "Describe your item (e.g., iPhone 15 Pro)" | "Tell us what you want" |
| Error messaging | "Invalid input" | "Try adding more detail" | "Example: Brand, model, color" |
| Suggestion chips | None | Popular searches | Recent categories |
| Confirmation copy | "You're looking for:" | "We understood:" | "Your request:" |

**Measurement:**
- Intent parsing accuracy
- User edits after initial parse
- Successful match rate
- "I didn't mean this" rate

**NOT Allowed:**
- Pre-filling intent without user input
- Suggesting higher-priced alternatives
- Biasing toward specific products

---

### 2.3 Trust Explanation Wording

**Objective:** Help users understand trust scores without influencing their decision.

**Allowed Variants:**

| Experiment | Control | Variant A | Variant B |
| :--- | :--- | :--- | :--- |
| Trust label | "High Trust" | "Highly Verified" | "Established Member" |
| Explanation style | Bullet points | Narrative paragraph | Icon + short text |
| "Why" link | "Why?" | "How is this calculated?" | "What does this mean?" |
| Factor display | All factors shown | Top 3 factors only | Expandable detail |

**Measurement:**
- Click-through on "Why" explanation
- Time spent on trust explanation
- Post-transaction trust accuracy ("Was trust level accurate?")
- Support tickets about trust scores

**NOT Allowed:**
- Hiding negative trust factors
- Emphasizing positive over negative
- Using fear language for low trust

---

### 2.4 Education Panels

**Objective:** Increase user understanding of platform mechanics.

**Allowed Experiment Areas:**

| Panel | Control | Variant A | Variant B |
| :--- | :--- | :--- | :--- |
| "How Escrow Works" | Text explanation | Animated diagram | Step-by-step timeline |
| "Cross-Border Risks" | Bullet list | FAQ format | Interactive Q&A |
| "Payment Protection" | Dense paragraph | Comparison table | Visual flowchart |
| "Dispute Process" | Legal-style text | Friendly walkthrough | Video explainer |

**Measurement:**
- Panel view duration
- "Helpful?" rating (thumbs up/down)
- Subsequent support ticket topics
- Quiz completion (if offered)

**NOT Allowed:**
- Minimizing actual risks
- Hiding limitations
- Overpromising protection

---

### 2.5 Search & Filter UX Improvements

**Objective:** Help users find what they're looking for faster.

**Allowed Variants:**

| Experiment | Control | Variant A | Variant B |
| :--- | :--- | :--- | :--- |
| Filter placement | Sidebar | Top bar | Bottom sheet (mobile) |
| Sort options | Dropdown | Tabs | Radio buttons |
| Empty state | "No results" | Suggestions + modify tips | Broader search prompt |
| Category display | Grid | List | Hybrid (featured + list) |

**Measurement:**
- Time to first meaningful result
- Filter usage rate
- Search refinement count
- Successful transaction after search

**NOT Allowed:**
- Hiding certain results
- Promoting sponsored content as organic
- Biasing toward higher-margin items

---

### 2.6 Comparison Layouts

**Objective:** Help users compare options more easily.

**Allowed Variants:**

| Experiment | Control | Variant A | Variant B |
| :--- | :--- | :--- | :--- |
| Traveler comparison | Vertical list | Side-by-side cards | Feature matrix |
| Payment comparison | Text list | Visual comparison table | Toggle view |
| Price display | USD only | USD + local estimate | User-selected currency |
| Fee breakdown | Hidden until click | Always visible | Progressive reveal |

**Measurement:**
- Comparison feature usage
- Time to selection
- Selection confidence (post-choice survey)
- "Changed my mind" rate

**NOT Allowed:**
- Hiding options
- Visual emphasis on preferred option
- Pre-selecting "recommended"

---

## 3. Experiment Governance

### 3.1 Approval Matrix

| Experiment Type | Required Approval | Review Cycle |
| :--- | :--- | :--- |
| Copy variants (< 10 words) | Product Lead | Weekly |
| Layout changes | Product + Design Lead | Weekly |
| New education content | Product + Legal | Bi-weekly |
| Flow changes | Product + UX Lead | Bi-weekly |
| Anything touching trust/payment | Risk Officer | Per-experiment |

### 3.2 Experiment Checklist

Before launching any experiment:

- [ ] Does NOT influence payment method selection
- [ ] Does NOT influence trust perception unfairly
- [ ] Does NOT create artificial urgency
- [ ] Does NOT hide critical information
- [ ] Does NOT use manipulative language
- [ ] Has clear hypothesis documented
- [ ] Has neutral success metrics defined
- [ ] Has rollback plan
- [ ] Has been reviewed by required approvers

### 3.3 Kill Criteria

Automatically stop experiment if:

| Metric | Threshold | Action |
| :--- | :--- | :--- |
| Support ticket spike | +50% vs baseline | Pause, investigate |
| User confusion reports | Any cluster (3+) | Pause, investigate |
| Payment method shift | Any statistically significant shift | Stop, review with Risk |
| Complaint keywords | "Confused", "tricked", "hidden" | Immediate stop |

---

## 4. Experiment Lifecycle

### 4.1 Standard Process

```
┌─────────────────────────────────────────────────────────────┐
│                  EXPERIMENT LIFECYCLE                       │
│                                                             │
│  1. HYPOTHESIS                                              │
│     → "We believe [change] will improve [clarity metric]"  │
│                                                             │
│  2. DESIGN                                                  │
│     → Define control and variant(s)                        │
│     → Document what's measured                             │
│     → Get required approvals                               │
│                                                             │
│  3. LAUNCH                                                  │
│     → Start at 5-10% of traffic                            │
│     → Monitor for kill criteria                            │
│                                                             │
│  4. ANALYZE                                                 │
│     → Wait for statistical significance                    │
│     → Check for unintended effects                         │
│                                                             │
│  5. DECIDE                                                  │
│     → Ship winner OR                                       │
│     → Learn and iterate OR                                 │
│     → Roll back                                            │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Minimum Runtime

| Experiment Type | Minimum Duration | Sample Size |
| :--- | :--- | :--- |
| Copy test | 7 days | 1,000 users |
| Layout test | 14 days | 2,000 users |
| Flow test | 21 days | 5,000 users |
| Education content | 14 days | 2,000 users |

---

## 5. Documentation Requirements

### 5.1 Experiment Brief Template

```
EXPERIMENT: [Name]
DATE: [Start date]
OWNER: [Name]

HYPOTHESIS:
We believe [specific change] will [expected outcome] because [reasoning].

CONTROL:
[Description of current experience]

VARIANT(S):
[Description of test experience(s)]

METRICS:
Primary: [Main clarity/understanding metric]
Secondary: [Supporting metrics]
Guardrails: [What we watch to ensure no harm]

APPROVAL:
[ ] Product Lead
[ ] Design Lead
[ ] Legal (if education content)
[ ] Risk Officer (if touches trust/payment)

DURATION: [X days]
TRAFFIC: [X%]

RESULTS: [Filled in after completion]
DECISION: [Ship / Iterate / Rollback]
LEARNINGS: [Key takeaways]
```

---
**Document Owner:** Growth Lead
**Review:** Product, Legal, Risk
**Version:** 1.0 (Non-Regulated Experiments)
