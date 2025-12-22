# PRICING RISK ANALYSIS
## Consumer Harm, Spread Caps, Regulatory Red Lines & Audit Requirements

**Platform:** Mnbara  
**Document:** Pricing Risk Framework  
**Date:** December 20, 2025  
**Classification:** Internal — Compliance, Finance & Product

---

# 1. CONSUMER HARM RISKS

## 1.1 Rate Manipulation Risks

- **Inflated spreads without disclosure** — Marking up FX rate without clear disclosure to user
- **Bait-and-switch rates** — Showing attractive rate at quote, executing at worse rate
- **Dynamic pricing discrimination** — Charging different rates based on user profile without justification
- **Hidden provider markups** — PSP adds margin on top of platform margin, user sees only final rate
- **Stale rate exploitation** — Quoting outdated rate, profiting from rate movement
- **Off-market execution** — Executing at rates significantly worse than market mid-rate

## 1.2 Fee Transparency Risks

- **Unbundled fee confusion** — Splitting fees to obscure total cost (platform fee + FX fee + transfer fee)
- **Percentage vs. absolute mismatch** — Showing low percentage but high absolute amount
- **Recipient amount unclear** — User doesn't know exact amount recipient will receive
- **Fee-in-rate hiding** — Embedding fees in exchange rate without explicit disclosure
- **Currency-dependent fee variation** — Charging more for certain corridors without clear rationale
- **Minimum fee exploitation** — Using minimum fees that disproportionately affect small transfers

## 1.3 Timing Exploitation Risks

- **Execution delay arbitrage** — Delaying execution to capture favorable rate movement for platform
- **Weekend/holiday rate exploitation** — Charging worse rates during market closures
- **Volatility exploitation** — Widening spreads during high volatility without user notice
- **Quote expiry manipulation** — Short quote windows forcing hasty decisions
- **Settlement timing advantage** — Platform settles at better rate than quoted

## 1.4 Vulnerable User Risks

- **Migrant worker exploitation** — Higher fees for remittance corridors (regulatory focus)
- **First-time user confusion** — Lack of price literacy leading to poor decisions
- **Urgency-based exploitation** — Higher prices for "instant" without clear value-cost tradeoff
- **Low-value transfer penalty** — Minimum fees that make small transfers uneconomical
- **Repeat user complacency** — Users stop comparing prices, locked into worse rates

## 1.5 Comparison Shopping Obstruction

- **Non-standard fee presentation** — Making comparison with competitors difficult
- **Bundled pricing** — Combining unrelated services to obscure individual costs
- **Dynamic pricing opacity** — Rates change based on unpublished factors
- **No benchmark reference** — Not showing mid-market rate for comparison
- **Loyalty penalty** — Regular users pay more than new users (hidden churn discount)

---

# 2. SPREAD CAPS

## 2.1 Maximum Spread by Corridor Type

**Major Pairs (High Liquidity):**
- USD/EUR — Maximum 1.5% above mid-market
- USD/GBP — Maximum 1.5% above mid-market
- EUR/GBP — Maximum 1.5% above mid-market
- USD/JPY — Maximum 1.5% above mid-market
- USD/CAD — Maximum 1.5% above mid-market
- USD/AUD — Maximum 1.5% above mid-market
- USD/CHF — Maximum 1.5% above mid-market

**Cross Pairs (Medium Liquidity):**
- EUR/JPY — Maximum 2.0% above mid-market
- GBP/CHF — Maximum 2.0% above mid-market
- AUD/NZD — Maximum 2.0% above mid-market

**Minor Pairs (Lower Liquidity):**
- USD/AED — Maximum 2.5% above mid-market
- USD/SAR — Maximum 2.5% above mid-market
- USD/SGD — Maximum 2.5% above mid-market
- EUR/TRY — Maximum 3.0% above mid-market

**Exotic Pairs (Low Liquidity):**
- USD/EGP — Maximum 3.5% above mid-market
- USD/NGN — Maximum 4.0% above mid-market
- USD/PKR — Maximum 4.0% above mid-market
- USD/TRY — Maximum 3.5% above mid-market
- USD/INR — Maximum 3.0% above mid-market

**Absolute Maximum:**
- No corridor may exceed 5% total markup under any circumstances
- Volatility events do not justify exceeding caps
- Emergency cap breach requires CEO + Compliance approval

## 2.2 Fee Caps

**Fixed Transaction Fees:**
- Minimum fee: $1.99 or equivalent
- Maximum fee: $14.99 or equivalent
- No transaction fee on amounts > $1,000

**Percentage Fees:**
- Standard percentage fee: 0.5% - 1.0%
- Maximum percentage fee: 2.0%
- Combined (spread + percentage): Maximum 5.0% total cost

**Speed-Based Premiums:**
- Instant delivery premium: Maximum 0.5% additional
- Same-day premium: Maximum 0.25% additional
- Standard delivery: No premium

## 2.3 Corridor-Specific Caps

**High-Volume Corridors (> $1M/month):**
- Spread cap: 1.5%
- Review: Quarterly pricing review required

**Medium-Volume Corridors ($100K - $1M/month):**
- Spread cap: 2.5%
- Review: Semi-annual pricing review

**Low-Volume Corridors (< $100K/month):**
- Spread cap: 3.5%
- Review: Annual pricing review

**Remittance Focus Corridors (Regulatory Scrutiny):**
- US → Mexico: Maximum 2.0% total cost
- US → Philippines: Maximum 2.5% total cost
- UK → India: Maximum 2.5% total cost
- UAE → India: Maximum 2.5% total cost
- UAE → Pakistan: Maximum 3.0% total cost

---

# 3. REGULATORY RED LINES

## 3.1 Absolute Prohibitions

- **No hidden fees** — Every fee component must be disclosed before transaction
- **No fee-in-rate obfuscation** — If margin is in rate, must disclose separately
- **No price discrimination without justification** — Cannot charge different prices without objective criteria
- **No bait-and-switch** — Executed rate must match quoted rate (within stated tolerance)
- **No deceptive advertising** — "No fees" claims prohibited if margin in rate
- **No bundling without itemization** — Each service must be priced separately
- **No minimum fee exploitation** — Minimum fees must be proportionate
- **No loyalty penalty** — Returning users cannot pay more than new users for same service

## 3.2 Disclosure Requirements (EU/UK)

- **Total cost disclosure** — Show total cost including all fees and margins before confirmation
- **Mid-market rate comparison** — Must show benchmark rate for comparison
- **Fee breakdown** — Itemize: platform fee, FX margin, provider fee, delivery fee
- **Recipient amount** — Must show exact amount recipient will receive in destination currency
- **Exchange rate source** — Must disclose rate source and update frequency
- **Quote validity** — Must state how long quoted rate is valid
- **Settlement timeline** — Must disclose expected delivery time

## 3.3 Disclosure Requirements (US)

- **Remittance Rule (CFPB)** — Must disclose: exchange rate, fees, total, recipient amount
- **Pre-payment disclosure** — Full disclosure before consumer pays
- **Receipt requirement** — Written receipt with all terms
- **Error resolution** — Must have 30-minute cancellation window
- **Truth in advertising** — No misleading claims about "low fees" or "best rates"

## 3.4 Pricing-Specific Regulatory Triggers

**CFPB (US) Red Flags:**
- Remittance costs significantly above corridor average
- Pattern of consumer complaints about undisclosed fees
- Advertising that obscures true cost
- Failure to refund on errors

**FCA (UK) Red Flags:**
- Consumer Duty breaches (fair value test failure)
- Price discrimination against vulnerable customers
- Opaque pricing structures
- Failure to disclose in clear, fair, not misleading manner

**EU (PSD2) Red Flags:**
- Non-itemized fee disclosure
- No mid-market rate comparison
- Hidden currency conversion fees
- Cross-border fee discrimination

## 3.5 Regulatory Safe Harbors

- **Clear fee disclosure** — Prominently displayed before confirmation
- **Benchmark comparison** — Mid-market rate shown alongside platform rate
- **Competitive pricing** — Within 1% of top 3 competitors
- **Complaint resolution** — Effective complaint handling with refund capability
- **Regular pricing review** — Documented periodic pricing reviews
- **Audit trail** — Every quote and execution logged with timestamps

---

# 4. AUDIT REQUIREMENTS

## 4.1 Rate Audit

**Real-Time Logging:**
- Every quote: Timestamp, mid-market rate source, mid-market rate, platform rate, spread %
- Every execution: Quote ID, execution timestamp, executed rate, any deviation from quote
- Provider rates: All provider quotes received, provider selected, provider rate

**Daily Reconciliation:**
- Compare executed rates to mid-market benchmark
- Flag any deviation > 0.5% from expected spread
- Calculate average spread by corridor
- Identify outliers (> 2 standard deviations)

**Weekly Analysis:**
- Average spread by corridor
- Spread distribution (min, max, median, P95)
- Comparison to stated pricing
- Comparison to competitive benchmarks

**Monthly Reporting:**
- Corridor-by-corridor pricing analysis
- Consumer cost analysis (total cost as % of transfer)
- Trend analysis (are spreads widening?)
- Competitive positioning report

## 4.2 Fee Audit

**Transaction-Level:**
- Log all fee components applied to each transaction
- Verify fee matches disclosed amount
- Flag any fee not in price schedule

**Consumer-Level:**
- Total fees paid per user per month
- Average fee rate per user
- Identify users paying above-average fees

**Corridor-Level:**
- Average fee by corridor
- Fee variance within corridor
- Comparison to regulatory expectations (remittance corridors)

## 4.3 Disclosure Audit

**Pre-Transaction Verification:**
- Confirm all required disclosures displayed
- Verify mid-market rate shown (where required)
- Verify fee breakdown itemized
- Verify recipient amount displayed

**Receipt Audit:**
- Random sampling of receipts for completeness
- Verify receipt matches executed transaction
- Verify all required elements present

**Website/App Audit:**
- Quarterly review of all pricing-related content
- Verify no misleading claims
- Verify pricing calculator accuracy
- Verify terms and conditions current

## 4.4 Compliance Audit Schedule

**Daily:**
- Automated rate deviation alerts
- Automated fee anomaly detection
- Quote-to-execution match verification

**Weekly:**
- Spread report by corridor
- Fee report by corridor
- Consumer complaint pricing analysis

**Monthly:**
- Full pricing compliance report
- Competitive benchmarking
- Regulatory requirement checklist

**Quarterly:**
- External pricing audit (sample)
- Consumer Duty fair value assessment (UK)
- Pricing policy review

**Annual:**
- Full external pricing audit
- Regulatory filing (where required)
- Pricing policy board approval

## 4.5 Documentation Requirements

**Retain for 7 Years:**
- All quotes issued (timestamp, rates, fees)
- All transactions executed (full details)
- All pricing policies and changes
- All pricing-related complaints and resolutions
- All audit reports and findings
- All competitive benchmarking data

**Immediately Accessible:**
- Current pricing policy
- Current fee schedule
- Rate source documentation
- Provider agreements (pricing sections)

## 4.6 Audit Red Flags

**Immediate Investigation Required:**
- Average spread > stated cap in any corridor
- Execution rate differs from quoted rate by > 0.1%
- Fee charged differs from disclosed fee
- Pattern of complaints about hidden fees
- Spread widening without market justification
- Price discrimination identified

**Escalation to Compliance:**
- Any regulatory inquiry about pricing
- Any consumer complaint to regulator about pricing
- Any media coverage of pricing practices
- Any competitive complaint about pricing
- Audit finding of systemic pricing issue

---

# 5. PRICING GOVERNANCE

## 5.1 Approval Requirements

**Pricing Change Approval:**
- Fee increase > 10%: CFO + CEO approval
- New fee introduction: CFO + Compliance + CEO approval
- Spread cap change: CFO + Compliance + CEO + Board notification
- Corridor-specific pricing: CFO + Compliance approval
- Promotional pricing: CFO approval

**Emergency Pricing:**
- Volatility spread widening: Pre-approved within caps
- Provider cost increase: CFO approval within 24hr
- Regulatory-mandated change: Immediate, CEO notification

## 5.2 Review Cadence

- **Daily:** Rate deviation monitoring (automated)
- **Weekly:** Spread and fee analysis (Finance)
- **Monthly:** Pricing report to CFO
- **Quarterly:** Pricing review with Compliance
- **Annual:** Pricing policy board approval

## 5.3 Ownership

- **CFO:** Pricing policy owner
- **Finance:** Rate and fee management
- **Compliance:** Regulatory alignment
- **Product:** User-facing disclosure
- **Legal:** Terms and conditions

---

**Document Owner:** Finance & Compliance  
**Version:** 1.0  
**Classification:** Internal — Restricted Distribution  
**Date:** December 20, 2025
