# FX ADVISORY LIMITS
## Foreign Exchange Information Display Policy

**Classification:** Regulatory — Binding
**Status:** Operational Policy
**Effective Date:** December 19, 2025
**Document Owner:** Chief Risk Officer

---

## 1. Scope Definition

### 1.1 What This Document Covers

This document governs the display of foreign exchange (FX) information on the Platform. It establishes:
- What rate information may be displayed
- Required disclaimers
- Prohibited activities
- Display standards

### 1.2 Regulatory Position

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   THE PLATFORM DOES NOT EXECUTE FOREIGN EXCHANGE.          │
│                                                             │
│   We display indicative rate information from third-party  │
│   sources for informational purposes only.                 │
│                                                             │
│   Actual exchange rates are determined and executed by     │
│   the user's bank or payment provider.                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Rate Display Rules

### 2.1 Mandatory Display Elements

Every FX rate displayed **MUST** include:

| Element | Requirement | Example |
| :--- | :--- | :--- |
| Rate source | Named provider | "Source: Reuters" |
| Timestamp | Time of quote | "As of 12:30 UTC" |
| Rate type | Mid-market/indicative | "Mid-market rate" |
| Disclaimer | Standard disclaimer | See Section 4 |

### 2.2 Rate Display Format

**Standard Format:**
```
Estimated in your currency: ~37,170 EGP

Rate: 1 USD = 31.00 EGP (mid-market, indicative)
Source: [Provider Name]
Updated: [Timestamp]

⚠️ This is NOT the rate you will receive.
Your bank or payment provider sets the actual rate.
```

### 2.3 Prohibited Rate Displays

| Prohibited | Reason |
| :--- | :--- |
| "Our rate" | Implies we provide rates |
| "Guaranteed rate" | We cannot guarantee |
| "Best rate" | Comparative claim |
| "Locked rate" | Implies execution capability |
| "You will receive" | Implies certainty |

---

## 3. Timing Disclaimers

### 3.1 Rate Staleness Rules

| Rate Age | Display Requirement |
| :--- | :--- |
| < 5 minutes | Standard display |
| 5-15 minutes | Add "may not be current" |
| 15-60 minutes | Add "significantly outdated" |
| > 60 minutes | Do not display (fetch fresh) |

### 3.2 Market Hours Disclaimers

| Market Status | Disclaimer |
| :--- | :--- |
| Normal hours | Standard |
| Weekend | "Markets are closed. Rate as of Friday close." |
| Holiday | "Markets may be closed. Rate may be outdated." |
| Volatility event | "Markets are volatile. Rates changing rapidly." |

### 3.3 Timing Information Copy

**During Business Hours:**
```
Rate updated 3 minutes ago.
Rates change constantly throughout the day.
```

**Outside Business Hours:**
```
Rate from market close on [Date].
Rates may change significantly when markets reopen.
```

**High Volatility:**
```
⚠️ Currency markets are unusually volatile.
Actual rate may differ significantly from estimate.
```

---

## 4. Mandatory Disclaimers

### 4.1 Primary Disclaimer (Always Required)

```
CURRENCY DISCLAIMER

The exchange rate shown is for informational purposes only.

• This is NOT the rate you will receive
• Your actual rate is set by your bank or payment provider
• Rates change constantly
• Your bank may charge additional conversion fees (typically 1-3%)

We do not execute currency exchange. We only display information.
```

### 4.2 Short Disclaimer (Minimum)

```
⚠️ Indicative rate only. Your bank sets the actual rate.
```

### 4.3 Disclaimer Placement

| Context | Disclaimer Required |
| :--- | :--- |
| Rate first shown | Full disclaimer visible |
| Checkout page | Short disclaimer minimum |
| Confirmation screen | Short disclaimer minimum |
| Receipt/confirmation | Rate source and timestamp |

---

## 5. No Execution Language

### 5.1 Prohibited Phrases

The Platform **SHALL NOT** use phrases that imply FX execution:

| Prohibited | Reason | Allowed Alternative |
| :--- | :--- | :--- |
| "Exchange your money" | Implies execution | "View exchange rates" |
| "Convert your payment" | Implies execution | "Payment will be converted by your bank" |
| "Get this rate" | Implies rate guarantee | "Indicative rate" |
| "Lock in this rate" | Implies rate lock | Not applicable |
| "Our exchange rate" | Implies we provide rate | "Rate from [source]" |
| "Best rate available" | Comparative claim | "Current mid-market rate" |

### 5.2 Required Passive Language

| Context | Passive Language |
| :--- | :--- |
| Describing conversion | "Your payment will be converted by your bank" |
| Describing rate | "The indicative rate from [source] is..." |
| Describing fees | "Your bank may charge..." |

---

## 6. Source Attribution

### 6.1 Required Attribution

Every rate display **MUST** attribute source:

| Element | Requirement |
| :--- | :--- |
| Provider name | Always visible |
| Rate type | Mid-market, buy, sell, or indicative |
| Timestamp | Time of quote |
| Update frequency | If not real-time |

### 6.2 Approved Rate Sources

| Source | Type | Update Frequency |
| :--- | :--- | :--- |
| Reuters | Indicative | Real-time |
| XE | Mid-market | Near real-time |
| ECB | Reference | Daily |
| Partner-provided | Indicative | Varies |

### 6.3 Rate Source Audit

| Requirement | Frequency |
| :--- | :--- |
| Source accuracy verification | Monthly |
| Latency audit | Weekly |
| Stale rate detection | Real-time |

---

## 7. User Expectations Management

### 7.1 Pre-Transaction Disclosure

Before any transaction involving currency conversion:

```
Your payment is in USD. If your bank account is in 
a different currency, your bank will convert it.

Bank conversion fees typically range from 1% to 3%.
These fees are charged by YOUR bank, not by us.
```

### 7.2 Post-Transaction Disclosure

After transaction:

```
Your payment of $1,422.15 USD has been processed.

If you paid from a non-USD account, your bank may
have applied a conversion at their rate plus fees.

Check your bank statement for the final amount charged.
```

---

## 8. Rate Comparison Restrictions

### 8.1 Prohibited Comparisons

| Comparison Type | Status |
| :--- | :--- |
| Our rate vs. competitor | **PROHIBITED** |
| Our rate vs. banks | **PROHIBITED** |
| Rate savings claims | **PROHIBITED** |
| Rate quality claims | **PROHIBITED** |

### 8.2 Permitted Information

| Information | Status |
| :--- | :--- |
| Historical rate chart (educational) | Allowed with disclaimer |
| Rate source comparison | Allowed (factual) |
| Typical bank fee ranges | Allowed (industry data) |

---

## 9. Violations

### 9.1 Violation Classification

| Violation | Severity | Response |
| :--- | :--- | :--- |
| Missing disclaimer | High | Immediate correction |
| Implied rate guarantee | Critical | Immediate removal |
| Implied execution capability | Critical | Incident, legal review |
| Stale rate display | Medium | System fix |

### 9.2 Incident Response

For Critical violations:
1. Remove content immediately
2. Notify Legal within 1 hour
3. Document affected users
4. Assess regulatory notification need
5. Post-incident review

---

## 10. Attestation

```
This document has been reviewed and approved by:

Chief Risk Officer:          _______________________  Date: _______
General Counsel:             _______________________  Date: _______
Chief Marketing Officer:     _______________________  Date: _______
```

---
**Document Version:** 1.0
**Next Review:** June 2026
**Classification:** Regulatory — Binding
