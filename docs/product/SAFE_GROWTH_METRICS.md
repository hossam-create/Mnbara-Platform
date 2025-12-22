# SAFE GROWTH METRICS
## Measurement Framework for Non-Regulated Experiments

**Confidential**
**Classification:** Analytics / Growth
**Audience:** Product, Analytics, Growth Teams
**Date:** December 19, 2025

---

## 1. Metrics Philosophy

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     "MEASURE UNDERSTANDING, NOT MANIPULATION."              │
│                                                             │
│  We track whether users UNDERSTAND, not whether they BUY.   │
│  We measure CONFIDENCE, not CONVERSION.                     │
│  We optimize for CLARITY, not CLICKS.                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Metric Classification

| Type | Purpose | Optimization Goal |
| :--- | :--- | :--- |
| **Clarity Metrics** | Did user understand? | Increase |
| **Confidence Metrics** | Was user sure of choice? | Increase |
| **Friction Metrics** | Did user struggle? | Decrease |
| **Support Metrics** | Did user need help? | Decrease |
| **Guardrail Metrics** | Are we causing harm? | Monitor only |

---

## 2. Primary Success Metrics (Read-Only)

### 2.1 Funnel Clarity Metrics

**Time to Understand**
```
Definition: Time from entering a screen to taking a meaningful action 
            (not click-away or back)

Measurement:
- Onboarding: Time from start to completion
- Payment selection: Time from options shown to selection
- Trust review: Time spent on trust explanation

Good Signal: Decreasing time (users understand faster)
Bad Signal: Very short time (users skipping) OR very long (confused)

Target Range: Screen-dependent, establish baseline first
```

**Comprehension Verification Rate**
```
Definition: % of users who correctly answer a verification question
            (e.g., "Where does your money go first?")

Measurement:
- Post-flow micro-surveys (optional, 5% sample)
- Quiz completion accuracy
- Correct action taken after education

Good Signal: High accuracy (>80%)
Bad Signal: Low accuracy (<60%) or high skip rate

Target: >85% correct for critical concepts (escrow, protection)
```

---

### 2.2 Drop-Off Reduction Metrics

**Abandonment Rate by Stage**
```
Definition: % of users who leave at each funnel stage

Measurement:
- Onboarding: Step-by-step drop-off
- Transaction: Intent → Match → Confirm → Pay
- Education: Panel open → Panel complete

Good Signal: Lower abandonment, especially at education stages
Bad Signal: High abandonment at explanation screens

Target: <20% drop-off at any single step
```

**Back-Button Rate**
```
Definition: % of users who go back after reaching a screen

Measurement:
- Back button clicks per screen
- Time before back (immediate = confusion)

Good Signal: Low back rate after understanding screens
Bad Signal: High immediate back rate (didn't understand)

Target: <10% immediate back (<3 seconds)
```

---

### 2.3 Confirmation Confidence Metrics

**Selection Confidence Score**
```
Definition: Self-reported confidence at decision points

Measurement:
- Optional micro-survey: "How confident are you in this choice?" (1-5)
- Shown after: traveler selection, payment selection, final confirm

Good Signal: High average confidence (4+)
Bad Signal: Low confidence with high selection rate (forced choice)

Target: Average 4.2+ on 5-point scale
```

**Post-Decision Doubt Rate**
```
Definition: % of users who revisit/change decision after confirmation

Measurement:
- Order modifications within 1 hour
- "Cancel" clicks before processing
- Support tickets about changing mind

Good Signal: Low doubt rate (<5%)
Bad Signal: High doubt + high support tickets

Target: <5% modification attempts within 1 hour
```

---

### 2.4 Support Ticket Reduction

**Topic-Based Ticket Rate**
```
Definition: Support tickets per 1,000 transactions, by topic

Measurement:
- Categorize tickets by root cause
- Track: Confusion, Misunderstanding, How-to, Complaint

Good Signal: Decreasing "Confusion" and "Misunderstanding" tickets
Bad Signal: Increasing tickets on tested feature

Target Topics to Reduce:
- "How does escrow work?" → Education effectiveness
- "I didn't know about fees" → Fee transparency
- "What does trust score mean?" → Trust explanation clarity
```

**First-Contact Resolution Rate**
```
Definition: % of tickets resolved without escalation

Measurement:
- Tickets closed in first response
- No reopening within 24 hours

Good Signal: High FCR = users understand explanation
Bad Signal: Low FCR = fundamental confusion

Target: >80% FCR for common questions
```

---

### 2.5 Misunderstanding Rate

**Incorrect Action Rate**
```
Definition: % of users who take an action inconsistent with their stated intent

Measurement:
- Intent expressed vs. action taken
- Disputes citing "I didn't understand"
- Post-action confusion indicators

Good Signal: <2% incorrect action rate
Bad Signal: Patterns of same misunderstanding

Target: <2% overall, <1% for payment-related actions
```

**Expectation Mismatch Rate**
```
Definition: Post-transaction survey - "Was this what you expected?"

Measurement:
- Sample survey after transaction completion
- "Yes, exactly" vs. "Somewhat" vs. "No, different"

Good Signal: >90% "Yes, exactly"
Bad Signal: >10% "No, different"

Target: >90% expectation match
```

---

## 3. Guardrail Metrics (Monitor Only)

These metrics are NOT optimized. They're watched to ensure experiments don't cause harm.

### 3.1 Decision Distribution Guardrails

**Payment Method Distribution**
```
Purpose: Ensure experiments don't shift payment choices

Watch For:
- Any variant causing >5% shift in payment method selection
- Shift toward lower-protection methods

Action: If shift detected → Pause experiment, investigate

⚠️ This is NOT a success metric. We don't optimize for payment choice.
```

**Trust Acceptance Distribution**
```
Purpose: Ensure experiments don't influence who users trust

Watch For:
- Changes in trust level acceptance patterns
- Users accepting lower trust more often (or rejecting high trust)

Action: If pattern detected → Pause experiment, investigate

⚠️ This is NOT a success metric. We don't influence trust decisions.
```

### 3.2 User Sentiment Guardrails

**Manipulation Keyword Detection**
```
Purpose: Catch if users feel manipulated

Keywords Monitored:
- "Tricked"
- "Forced"
- "Hidden"
- "Confusing"
- "Misleading"
- "Scam" (false positive possible but must investigate)

Action: Any cluster (3+ mentions) → Immediate experiment pause
```

**Complaint Rate**
```
Purpose: Ensure experiments don't increase complaints

Baseline: Establish pre-experiment complaint rate
Threshold: >20% increase vs. baseline → Pause

Categories:
- UX complaints
- Clarity complaints
- Trust complaints
```

---

## 4. Metric Collection Methods

### 4.1 Passive Collection (All Users)

| Metric | Collection Method |
| :--- | :--- |
| Time on screen | Analytics event timestamps |
| Back button rate | Navigation events |
| Drop-off rate | Funnel step tracking |
| Click patterns | Event logging |
| Modification rate | Action audit logs |

### 4.2 Active Collection (Sample Only)

| Metric | Collection Method | Sample Rate |
| :--- | :--- | :--- |
| Confidence score | Micro-survey | 5% of users |
| Comprehension quiz | Optional quiz | 10% of users |
| Expectation match | Post-transaction survey | 5% of transactions |
| Satisfaction rating | "Was this helpful?" | On education panels |

### 4.3 Support-Based Collection

| Metric | Collection Method |
| :--- | :--- |
| Ticket topics | Support ticket categorization |
| Confusion indicators | Keyword detection in tickets |
| First contact resolution | Ticket lifecycle tracking |

---

## 5. Reporting Framework

### 5.1 Experiment Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│              EXPERIMENT: [Name]                             │
│              Status: RUNNING | Day 7 of 14                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PRIMARY METRICS                                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Metric           │ Control │ Variant │ Δ      │ Sig? │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ Time to understand│ 45s     │ 32s     │ -29%   │ ✓    │ │
│  │ Confidence score  │ 3.8     │ 4.2     │ +10%   │ ✓    │ │
│  │ Drop-off rate     │ 18%     │ 12%     │ -33%   │ ✓    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  GUARDRAILS                                                 │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Payment distribution: ✅ No shift detected            │ │
│  │ Trust acceptance: ✅ No shift detected                │ │
│  │ Manipulation keywords: ✅ None detected               │ │
│  │ Complaint rate: ✅ Within baseline                    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  RECOMMENDATION: Continue to significance                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Weekly Growth Review

**Standing Agenda:**
1. Active experiments status
2. Guardrail check (any violations?)
3. Completed experiments decision
4. Upcoming experiments review
5. Learnings synthesis

---

## 6. Metric Ownership

| Metric Category | Owner | Review Frequency |
| :--- | :--- | :--- |
| Clarity metrics | Product | Weekly |
| Confidence metrics | UX Research | Bi-weekly |
| Support metrics | Support Lead | Weekly |
| Guardrail metrics | Risk Officer | Daily during experiments |

---
**Document Owner:** Analytics Lead
**Review:** Product, Risk
**Version:** 1.0 (Safe Growth Metrics)
