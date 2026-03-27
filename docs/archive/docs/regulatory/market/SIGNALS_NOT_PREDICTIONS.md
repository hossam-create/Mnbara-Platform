# SIGNALS NOT PREDICTIONS
## Market Information Classification Policy

**Classification:** Regulatory — Binding
**Status:** Operational Policy
**Effective Date:** December 19, 2025
**Document Owner:** Chief Risk Officer

---

## 1. Policy Statement

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   THE PLATFORM PROVIDES SIGNALS, NOT PREDICTIONS.           │
│                                                             │
│   Signals are observations of current or past data.         │
│   Predictions are statements about the future.              │
│                                                             │
│   WE OBSERVE. WE DO NOT FORECAST.                           │
│   WE REPORT. WE DO NOT RECOMMEND.                           │
│   WE INFORM. WE DO NOT ADVISE.                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Definitions

### 2.1 Signal (Permitted)

| Attribute | Definition |
| :--- | :--- |
| **Nature** | Observation of data that exists |
| **Tense** | Present or past |
| **Certainty** | What is or was |
| **Purpose** | Inform user of current state |
| **Example** | "Current price is $1,199" |

### 2.2 Prediction (Prohibited)

| Attribute | Definition |
| :--- | :--- |
| **Nature** | Statement about future state |
| **Tense** | Future |
| **Certainty** | What may or will be |
| **Purpose** | Guide future decisions |
| **Example** | "Price will increase next month" |

### 2.3 Distinction Matrix

| Signal (✓ Allowed) | Prediction (✗ Prohibited) |
| :--- | :--- |
| "Current price: $1,199" | "Price will rise" |
| "Price 30 days ago: $1,099" | "Expect 10% increase" |
| "Average price this month: $1,150" | "Best time to buy is Tuesday" |
| "Price changed +5% this week" | "Trend will continue" |
| "5 travelers on this route today" | "Prices will drop when more join" |
| "This item usually takes 14 days" | "Your item will arrive by Dec 25" |

---

## 3. Permitted Information Types

### 3.1 Current State Signals

| Category | Examples | Permitted |
| :--- | :--- | :--- |
| **Prices** | "Current listing: $X" | ✓ |
| **Availability** | "3 travelers available now" | ✓ |
| **Exchange rates** | "Current rate: 1 USD = 31 EGP" | ✓ |
| **Fees** | "Platform fee: 2.5%" | ✓ |
| **Trust scores** | "Current score: 87" | ✓ |

### 3.2 Historical Data Signals

| Category | Examples | Permitted |
| :--- | :--- | :--- |
| **Price history** | "30-day average: $X" | ✓ |
| **Volume** | "12 transactions last week" | ✓ |
| **Rate history** | "Rate 7 days ago: 30.5" | ✓ |
| **Delivery times** | "Average delivery: 14 days" | ✓ |
| **Seasonal patterns** | "Historically busier in December" | ✓ with disclaimer |

### 3.3 Comparative Signals

| Category | Examples | Permitted |
| :--- | :--- | :--- |
| **Price comparison** | "Lower than 7-day average" | ✓ |
| **Route comparison** | "More travelers on US→UK route" | ✓ |
| **Fee comparison** | "Our fee vs. typical: 2.5% vs. 4%" | ⚠️ Careful framing |

---

## 4. Prohibited Information Types

### 4.1 Absolute Prohibitions

| Category | Prohibited Statement | Reason |
| :--- | :--- | :--- |
| **Price predictions** | "Prices will go up/down" | Future claim |
| **Timing advice** | "Wait to buy" / "Buy now before increase" | Advice |
| **Rate forecasts** | "USD will strengthen" | Financial prediction |
| **Availability forecasts** | "More travelers will join" | Future claim |
| **Guarantee of outcome** | "You will save money" | Outcome promise |

### 4.2 Conditional Prohibitions

| Category | May Be Permitted If | Example |
| :--- | :--- | :--- |
| **Trend observation** | Clearly labeled as historical | "Has trended upward over past 30 days" |
| **Pattern observation** | Strong disclaimer added | "Historically busier in Q4; patterns may not repeat" |
| **Estimate** | Clearly labeled as estimate | "Estimated: ~14 days (actual may vary)" |

---

## 5. Language Standards

### 5.1 Permitted Phrases

| Use Case | Permitted Phrasing |
| :--- | :--- |
| Current price | "Current price is..." |
| Historical price | "Average over past X days was..." |
| Rate display | "Current indicative rate is..." |
| Delivery time | "Previous similar deliveries took..." |
| Availability | "Currently X travelers available..." |
| Change | "Changed by X% since [date]..." |

### 5.2 Prohibited Phrases

| Phrase | Reason | Alternative |
| :--- | :--- | :--- |
| "Will increase/decrease" | Prediction | "Has increased/decreased" |
| "Best time to buy" | Advice | "Historical patterns show..." |
| "Expect rates to..." | Prediction | "Rate has been..." |
| "You should..." | Advice | "Options include..." |
| "Guaranteed to..." | Outcome promise | "Historically..." |
| "We recommend..." | Advice | "Options are..." |

### 5.3 Disclaimer Requirements

| Information Type | Required Disclaimer |
| :--- | :--- |
| Historical patterns | "Past patterns may not repeat" |
| Averages | "Individual results vary" |
| Estimates | "Actual may differ" |
| Third-party data | "Source: [Name]; we do not verify" |
| Timing observations | "Times change; this is historical" |

---

## 6. Display Rules

### 6.1 Historical Data Display

```
CORRECT: Historical Data Display

Average price (last 30 days): $1,156
Range: $1,099 - $1,225

⚠️ Historical only. Future prices may differ.
```

```
INCORRECT: Prediction Display

Average price (last 30 days): $1,156
Trend: ↑ Increasing — expect higher prices
```

### 6.2 Rate Display

```
CORRECT: Rate Signal

Current rate: 1 USD = 31.00 EGP
Source: Reuters | Updated: 5 min ago

⚠️ Indicative only. Actual rate set by your bank.
```

```
INCORRECT: Rate Prediction

Current rate: 1 USD = 31.00 EGP
Rate is trending up — lock in now!
```

### 6.3 Availability Display

```
CORRECT: Availability Signal

Travelers on US→EG route: 7 available now
Peak availability: Typically higher in summer (historical)

⚠️ Availability changes constantly.
```

```
INCORRECT: Availability Prediction

Travelers on US→EG route: 7 available now
More expected next week — wait for better rates!
```

---

## 7. AI/Algorithm Constraints

### 7.1 AI-Generated Content Rules

| Rule | Requirement |
| :--- | :--- |
| No predictive language | AI must not use future tense for market data |
| No recommendations | AI must not suggest timing or action |
| No outcome promises | AI must not guarantee savings/results |
| Disclaimer injection | System must add disclaimers automatically |

### 7.2 Algorithmic Display Rules

| Feature | Permitted | Prohibited |
| :--- | :--- | :--- |
| Price charts | Historical only | Trend projections |
| Heat maps | Current/historical | Forecast overlays |
| Alerts | "Price changed" | "Price will change" |
| Notifications | "Now available" | "Will become available" |

---

## 8. User Communications

### 8.1 Marketing Constraints

| Marketing May Say | Marketing Shall Not Say |
| :--- | :--- |
| "Compare prices" | "Find the best time to buy" |
| "See current rates" | "Know when rates will drop" |
| "View historical data" | "Predict market movements" |
| "Explore options" | "Optimize your purchase timing" |

### 8.2 Support Communications

| Support May Say | Support Shall Not Say |
| :--- | :--- |
| "Historical average is X" | "Prices should drop soon" |
| "Current rate is X" | "Wait for a better rate" |
| "Typical delivery is X days" | "Your item will arrive by X date" |

---

## 9. Compliance Verification

### 9.1 Content Review

| Review | Frequency | Owner |
| :--- | :--- | :--- |
| New feature copy | Before launch | Legal + Product |
| Marketing materials | Before publish | Legal + Marketing |
| AI-generated content | Continuous monitoring | Engineering |
| Support scripts | Quarterly | Compliance + Support |

### 9.2 Violation Response

| Violation | Response |
| :--- | :--- |
| Predictive language in UI | Immediate correction |
| Advice in support communication | Coaching + correction |
| Marketing prediction | Retraction + review |
| AI generating predictions | System fix + audit |

---

## 10. Rationale

### 10.1 Regulatory Rationale

| Concern | Our Position |
| :--- | :--- |
| Financial advice regulations | We do not provide financial advice |
| Investment advice regulations | We do not recommend investments |
| Consumer protection | We do not make outcome promises |
| Misleading information | We only state verifiable facts |

### 10.2 Business Rationale

| Concern | Our Position |
| :--- | :--- |
| Liability | No liability for predictions we don't make |
| User trust | Honest information builds trust |
| Expectation management | Users understand our limitations |

---

## 11. Attestation

```
This policy has been reviewed and approved by:

Chief Risk Officer:          _______________________  Date: _______
Chief Marketing Officer:     _______________________  Date: _______
General Counsel:             _______________________  Date: _______
```

---
**Document Version:** 1.0
**Next Review:** June 2026
**Classification:** Regulatory — Binding
