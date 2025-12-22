# CROSS-BORDER FX — RISK & REGULATORY SPECIFICATION
## FX Risk Types, Warnings, Prohibitions & Controls

**Platform:** Mnbara  
**Document:** Cross-Border FX Risk & Compliance Framework  
**Date:** December 20, 2025  
**Classification:** Internal — Risk, Compliance & Finance

---

# 1. FX RISK TYPES

## 1.1 Market Risk

| Risk | Description | Likelihood | Impact | Mitigation |
|------|-------------|------------|--------|------------|
| Rate volatility | Exchange rate moves between quote and execution | High | Medium | Rate lock window, volatility buffer |
| Adverse rate movement | Rate moves against user during transaction | High | Medium | Clear quote validity, user confirmation |
| Rate manipulation | Provider offers unfavorable rates | Low | High | Multi-provider quotes, rate benchmarking |
| Flash crash | Extreme sudden rate movement | Low | High | Circuit breakers, max deviation limits |
| Weekend/holiday gaps | Rate jumps after market closure | Medium | Medium | No execution during closed markets |
| Emerging market instability | High volatility in certain corridors | Medium | High | Corridor-specific limits, enhanced warnings |

**Market Risk Controls:**

| Control | Description |
|---------|-------------|
| Rate lock window | Quote valid for maximum 60 seconds |
| Volatility buffer | 0.5% buffer built into displayed rate |
| Max deviation | Transaction blocked if rate moves > 2% from quote |
| Multi-source pricing | Compare 2+ FX providers before display |
| Benchmark monitoring | Compare platform rate to Bloomberg/Reuters mid-rate |

---

## 1.2 Liquidity Risk

| Risk | Description | Likelihood | Impact | Mitigation |
|------|-------------|------------|--------|------------|
| Provider liquidity failure | FX provider cannot fulfill order | Low | High | Multi-provider fallback, order splitting |
| Large order impact | Large transaction moves market | Low | Medium | Order size limits, partial execution |
| Exotic pair illiquidity | Poor liquidity for minor currencies | Medium | Medium | Corridor restrictions, wider spreads disclosed |
| Settlement delay | Funds delayed in transit | Medium | Medium | Clear settlement timeline, buffer |
| Currency controls | Destination country restricts conversion | Low | High | Corridor blocking, user warning |
| Bank holiday impact | Settlement delayed due to holidays | Medium | Low | Calendar awareness, extended timelines |

**Liquidity Risk Controls:**

| Control | Description |
|---------|-------------|
| Provider redundancy | Minimum 2 active FX providers at all times |
| Order size cap | Single transaction max based on corridor liquidity |
| Settlement buffer | Quoted settlement time + 1 day buffer |
| Exotic corridor review | Quarterly review of minor currency pair performance |
| Holiday calendar | Automated adjustment for bank holidays |

---

## 1.3 Regulatory Exposure

| Risk | Description | Likelihood | Impact | Mitigation |
|------|-------------|------------|--------|------------|
| Unlicensed FX activity | Providing FX services without license | Medium | Critical | Outsource to licensed provider |
| Capital controls violation | Breaching local currency restrictions | Medium | Critical | Corridor blocking, amount limits |
| Sanctions breach | FX involving sanctioned entity/country | Low | Critical | Real-time sanctions screening |
| Reporting failure | Missing required regulatory reports | Medium | High | Automated reporting, calendar |
| Consumer protection breach | Non-compliant disclosures | Medium | High | Standardized disclosures |
| Cross-border licensing gap | Operating in jurisdiction without authorization | Medium | High | Jurisdiction mapping |

**Regulatory Compliance Requirements:**

| Jurisdiction | Requirement | Platform Response |
|--------------|-------------|-------------------|
| EU | PSD2/EMI license for FX | Use licensed PSP for execution |
| US | Money transmitter license per state | Use licensed partner |
| UK | FCA authorization for FX | Use FCA-authorized provider |
| UAE | CBUAE license | Use licensed local partner |
| Global | FATF AML standards | Full AML program |

---

## 1.4 Consumer Harm

| Risk | Description | Likelihood | Impact | Mitigation |
|------|-------------|------------|--------|------------|
| Unfavorable rate without awareness | User unaware of poor rate | Medium | Medium | Rate comparison education |
| Hidden fees | Fees not clearly disclosed | Low | High | Full fee transparency mandate |
| Rate confusion | User confused by multiple rates | Medium | Medium | Single, clear "you receive" display |
| Forced conversion | Conversion user didn't intend | Low | High | Explicit opt-in for any FX |
| Loss from delay | User loses due to settlement delay | Medium | Medium | Clear timeline disclosure |
| Over-conversion | More currency converted than needed | Low | Medium | Exact amount conversion only |

**Consumer Protection Controls:**

| Control | Description |
|---------|-------------|
| "You receive" display | Always show final amount in destination currency |
| Fee breakdown | Itemized: platform fee, FX spread, provider fee |
| Rate comparison | Show mid-market rate alongside platform rate |
| Confirmation screen | Explicit confirmation before any FX execution |
| Post-transaction receipt | Detailed receipt with all rates and fees |

---

# 2. MANDATORY WARNINGS

## 2.1 Rate Volatility Warnings

| Scenario | Warning Text | Display Location |
|----------|--------------|------------------|
| **Standard transaction** | "Exchange rates change frequently. The rate shown is valid for 60 seconds." | Quote screen |
| **High volatility corridor** | "⚠️ This currency pair experiences high volatility. Rates may change significantly." | Quote screen (highlighted) |
| **Emerging market** | "⚠️ Emerging market currencies can be volatile. Consider this before proceeding." | Quote screen (highlighted) |
| **Weekend/holiday** | "Markets are closed. Your rate will be set when markets reopen." | Quote screen (blocking) |
| **Rate expiry** | "This rate has expired. Please request a new quote." | Quote screen (blocking) |
| **Large transaction** | "Large transactions may experience different rates. Proceed carefully." | Quote screen |

**Volatility Warning Thresholds:**

| Corridor Type | Volatility Indicator | Warning Level |
|---------------|---------------------|---------------|
| Major (USD/EUR, USD/GBP) | < 0.5% daily move | Standard |
| Cross (EUR/GBP, AUD/CAD) | 0.5-1% daily move | Elevated |
| Minor (USD/TRY, USD/ZAR) | 1-3% daily move | High |
| Exotic (USD/EGP, USD/NGN) | > 3% daily move | Critical |

---

## 2.2 Fees Disclosure

| Fee Type | Disclosure Requirement | Display Format |
|----------|------------------------|----------------|
| **Platform fee** | Fixed fee per transaction | "$X.XX platform fee" |
| **FX spread** | Difference from mid-market rate | "FX margin: X.XX%" |
| **Provider fee** | Any passthrough fees | "$X.XX provider fee" |
| **Total cost** | All-in cost to user | "Total fees: $X.XX (X.XX%)" |
| **Rate markup** | How much above mid-market | "Rate includes X.XX% margin" |

**Fee Disclosure Template:**

```
┌─────────────────────────────────────────────────────────────┐
│ TRANSACTION BREAKDOWN                                       │
├─────────────────────────────────────────────────────────────┤
│ You send:                              $1,000.00 USD        │
│                                                             │
│ Exchange rate:                         1 USD = 50.25 EGP    │
│ Mid-market rate:                       1 USD = 50.75 EGP    │
│ Our margin:                            0.99%                │
│                                                             │
│ Platform fee:                          $2.99                │
│ Provider fee:                          $0.00                │
├─────────────────────────────────────────────────────────────┤
│ Total fees:                            $7.98 (0.80%)        │
│                                                             │
│ Recipient gets:                        49,750.00 EGP        │
└─────────────────────────────────────────────────────────────┘
```

**Disclosure Rules:**

| Rule | Requirement |
|------|-------------|
| Pre-confirmation | All fees shown BEFORE user confirms |
| Plain language | No jargon, clear "you pay" / "they receive" |
| Comparison available | Link to mid-market rate source |
| Receipt | Full breakdown sent post-transaction |
| No hidden fees | Any fee not disclosed = refundable |

---

## 2.3 Execution Delay Risk

| Scenario | Warning Text | Display |
|----------|--------------|---------|
| **Standard settlement** | "Funds typically arrive within 1-3 business days." | Timeline |
| **Cross-border** | "International transfers may take 2-5 business days." | Timeline |
| **High-risk corridor** | "⚠️ Transfers to this country may experience delays of up to 7 days." | Warning |
| **Currency controls** | "⚠️ This country has currency restrictions that may delay or block transfers." | Warning (prominent) |
| **Compliance review** | "Your transfer is under review. This may add 1-2 business days." | Status |
| **Bank holiday** | "Settlement delayed due to bank holiday in [country]." | Status |

**Settlement Timeline Matrix:**

| Corridor Type | Quoted Time | Buffer | Total Display |
|---------------|-------------|--------|---------------|
| Domestic | Same day | +1 day | "1 business day" |
| Major cross-border | T+1 | +2 days | "1-3 business days" |
| Minor cross-border | T+2 | +3 days | "2-5 business days" |
| Emerging market | T+3 | +4 days | "3-7 business days" |
| Restricted corridor | T+5+ | +5 days | "5-10+ business days" |

---

# 3. PROHIBITED ACTIONS

## 3.1 Auto FX Execution

| Prohibition | Description | Enforcement |
|-------------|-------------|-------------|
| `NO_AUTO_CONVERSION` | No automatic currency conversion without user action | Hard block |
| `NO_DEFAULT_FX` | FX cannot be pre-selected or defaulted | UI enforcement |
| `NO_SILENT_FX` | User must explicitly see and confirm any FX | Confirmation required |
| `NO_RECURRING_FX` | No standing orders for FX conversion | Feature blocked |
| `NO_TRIGGERED_FX` | No automatic FX on rate threshold | Feature blocked |
| `NO_AI_FX_DECISION` | AI cannot decide when/whether to convert | System constraint |

**What IS Allowed:**

| Action | Allowed | Condition |
|--------|---------|-----------|
| User initiates FX | ✓ | Explicit user action |
| User sees quote, confirms | ✓ | Quote + confirmation |
| User chooses currency | ✓ | User makes selection |
| Platform displays rate | ✓ | Informational only |
| Platform suggests timing | ✗ | No rate speculation |

---

## 3.2 FX Speculation

| Prohibition | Description | Enforcement |
|-------------|-------------|-------------|
| `NO_RATE_SPECULATION` | Platform cannot suggest "good time to convert" | Copy review |
| `NO_PRICE_ALERTS` | No alerts like "rate improved, convert now" | Feature blocked |
| `NO_HISTORICAL_COMPARISON` | No "rate is X% better than last week" | Copy blocked |
| `NO_FORWARD_CONTRACTS` | No future-dated FX locks | Feature blocked |
| `NO_FX_AS_INVESTMENT` | Cannot position FX as investment opportunity | Copy review |
| `NO_RATE_GUARANTEES` | Cannot guarantee future rates | Copy blocked |

**Prohibited Copy Examples:**

| ❌ Prohibited | ✅ Allowed Alternative |
|---------------|------------------------|
| "Great rate today!" | "Current rate: X.XX" |
| "Rates are up 5%" | [No comparison shown] |
| "Lock in this rate" | "This rate is valid for 60 seconds" |
| "Best time to convert" | [No timing advice] |
| "Don't miss out" | [No urgency language] |
| "Rates may go up" | [No speculation] |

---

## 3.3 Hidden Spreads

| Prohibition | Description | Enforcement |
|-------------|-------------|-------------|
| `NO_HIDDEN_MARGIN` | FX margin must be disclosed | Mandatory disclosure |
| `NO_OBSCURED_FEES` | All fees must be itemized | UI requirement |
| `NO_INFLATED_RATE` | Rate must be clearly benchmarked | Mid-rate comparison |
| `NO_BAIT_AND_SWITCH` | Executed rate must match quoted | Transaction audit |
| `NO_VARIABLE_SPREAD` | Spread must be consistent and disclosed | Rate monitoring |
| `NO_HIDDEN_PROVIDER_FEES` | Provider fees must be passthrough | Fee audit |

**Spread Transparency Requirements:**

| Requirement | Standard |
|-------------|----------|
| Maximum spread | 3% above mid-market for major pairs |
| Spread disclosure | Percentage AND absolute amount shown |
| Benchmark source | Bloomberg/Reuters mid-rate, updated every 60 seconds |
| Audit trail | Every quote logged with source rate + spread |
| User complaint | Any hidden fee claim = 100% refund of fee |

---

# 4. CONTROLS

## 4.1 Rate Deviation Alerts

| Deviation Level | Threshold | Action | Authority |
|-----------------|-----------|--------|-----------|
| Normal | < 0.5% from benchmark | No alert | Automatic |
| Elevated | 0.5% - 1% from benchmark | Internal alert | Operations |
| High | 1% - 2% from benchmark | Transaction pause + review | L3 Operations |
| Critical | > 2% from benchmark | Transaction blocked | Compliance required |
| Provider mismatch | > 0.25% between providers | Provider review | Finance |

**Rate Monitoring Rules:**

| Rule | Description |
|------|-------------|
| Benchmark source | Primary: Bloomberg. Backup: Reuters |
| Update frequency | Every 60 seconds during market hours |
| Off-market | Mid-rate frozen at market close, disclosed |
| Logging | All rates logged with timestamp + source |
| Audit | Weekly rate accuracy report |

---

## 4.2 Corridor Caps

| Cap Type | Major Pairs | Minor Pairs | Exotic Pairs | Enforcement |
|----------|-------------|-------------|--------------|-------------|
| **Single transaction** | $10,000 | $5,000 | $2,000 | Hard block |
| **Daily per user** | $25,000 | $15,000 | $5,000 | Hard block |
| **Weekly per user** | $75,000 | $35,000 | $15,000 | Hard block |
| **Monthly per user** | $150,000 | $75,000 | $35,000 | Hard block |
| **Corridor daily total** | $1M | $500K | $100K | Corridor pause |

**Corridor Classification:**

| Category | Example Pairs | Characteristics |
|----------|---------------|-----------------|
| Major | USD/EUR, USD/GBP, USD/JPY | High liquidity, low volatility |
| Minor | EUR/GBP, AUD/CAD, NZD/JPY | Medium liquidity |
| Exotic | USD/TRY, USD/ZAR, USD/EGP | Low liquidity, high volatility |
| Restricted | USD/IRR, USD/VEF, USD/KPW | Sanctions, capital controls |

**Cap Override Rules:**

| Override | Authority | Documentation |
|----------|-----------|---------------|
| User limit increase | Compliance (EDD required) | Source of funds |
| Corridor limit increase | Finance + Compliance | Business justification |
| Emergency increase | CFO | Written approval |
| No override available | Restricted corridors | N/A |

---

## 4.3 Manual Override

| Scenario | Override Action | Authority | Audit Requirement |
|----------|-----------------|-----------|-------------------|
| Rate deviation > 2% | Allow transaction | L4 Operations | Full documentation |
| Cap exceeded | Increase limit | Compliance | EDD + justification |
| Corridor restriction | Temporary allow | Legal + Compliance | Case-by-case approval |
| Provider failure | Manual execution | Finance | Dual approval |
| Compliance flag | Release transaction | MLRO | SAR assessment |
| Settlement failure | Manual resolution | Finance | Full investigation |

**Override Authorization Matrix:**

| Override Type | L3 Ops | L4 Ops | Finance | Compliance | Legal | MLRO |
|---------------|--------|--------|---------|------------|-------|------|
| Rate deviation (1-2%) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Rate deviation (> 2%) | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| User cap override | — | — | — | ✓ | — | — |
| Corridor cap override | — | — | ✓ | ✓ | — | — |
| Corridor unblock | — | — | — | ✓ | ✓ | — |
| Compliance release | — | — | — | — | — | ✓ |

**Override Rules:**

| Rule | Description |
|------|-------------|
| Documentation | Every override logged with full justification |
| Dual control | High-risk overrides require 2 approvals |
| Audit review | Monthly review of all overrides |
| Escalation | Rejected override → escalate to next level |
| User communication | User notified of any override affecting them |

---

# CORRIDOR RISK CLASSIFICATION

| Corridor | Risk Level | Transaction Limit | Required Verification | Special Controls |
|----------|------------|-------------------|----------------------|------------------|
| USD → EUR | Low | $10,000 | Tier 2 | None |
| USD → GBP | Low | $10,000 | Tier 2 | None |
| EUR → GBP | Low | $10,000 | Tier 2 | None |
| USD → CAD | Low | $10,000 | Tier 2 | None |
| USD → AED | Medium | $5,000 | Tier 3 | Source of funds > $3K |
| USD → EGP | High | $2,000 | Tier 3 | All transactions reviewed |
| USD → TRY | High | $2,000 | Tier 3 | Rate volatility warning |
| USD → NGN | High | $2,000 | Tier 4 | Source of funds all |
| USD → IRR | Blocked | $0 | N/A | Sanctions block |
| USD → RUB | Blocked | $0 | N/A | Sanctions block |

---

# AUDIT REQUIREMENTS

| Event | Logged Data | Retention | Access |
|-------|-------------|-----------|--------|
| Quote generated | User, pair, mid-rate, platform rate, spread, timestamp | 7 years | Operations + Audit |
| Quote expired | Quote ID, reason | 7 years | Operations |
| Transaction executed | All quote data + executed rate + fees | 7 years | Finance + Audit |
| Override action | Override type, authority, justification | 7 years | Compliance + Audit |
| Cap breach attempt | User, amount, cap, action taken | 7 years | Risk + Compliance |
| Deviation alert | Pair, benchmark, platform rate, deviation % | 7 years | Operations + Audit |

---

**Document Owner:** Risk & Compliance  
**Version:** 1.0  
**Classification:** Internal — Restricted Distribution  
**Date:** December 20, 2025
