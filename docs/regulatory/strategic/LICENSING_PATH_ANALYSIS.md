# LICENSING PATH ANALYSIS
## EMI vs. MSB vs. Full Bank Charter

**Classification:** CONFIDENTIAL — Board & Legal Only
**Status:** Strategic Analysis
**Date:** December 19, 2025
**Document Owner:** General Counsel + Chief Risk Officer

---

## EXECUTIVE SUMMARY

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   LICENSE PATH COMPARISON                                   │
│                                                             │
│   EMI (E-Money Institution)                                 │
│   └─ Best for: Payment + stored value services             │
│   └─ Complexity: MEDIUM                                     │
│   └─ Timeline: 6-18 months                                 │
│                                                             │
│   MSB (Money Services Business)                             │
│   └─ Best for: Money transmission, FX, check cashing       │
│   └─ Complexity: HIGH (US state-by-state)                  │
│   └─ Timeline: 18-36 months (full US coverage)             │
│                                                             │
│   FULL BANK CHARTER                                         │
│   └─ Best for: Deposits, lending, full banking services    │
│   └─ Complexity: EXTREME                                    │
│   └─ Timeline: 3-5+ years                                  │
│                                                             │
│   RECOMMENDATION: EMI (if execution required)               │
│                   or Partner Model (preferred)              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# PART I: LICENSE TYPE DEFINITIONS

## 1. E-Money Institution (EMI)

### 1.1 Definition

| Attribute | Description |
| :--- | :--- |
| **Jurisdiction** | EU/EEA (via PSD2/EMD2), UK |
| **Regulatory Authority** | National regulators (e.g., Central Bank of Ireland, FCA) |
| **Core Permission** | Issue electronic money, payment services |
| **Passporting** | Yes (within EU/EEA) |
| **Deposit taking** | NO (e-money is not a deposit) |
| **Lending** | NO (cannot lend customer funds) |

### 1.2 What EMI Allows

| Activity | Permitted |
| :--- | :--- |
| Issue e-money (stored value) | ✓ |
| Execute payment transactions | ✓ |
| Money transfers/remittance | ✓ |
| Currency exchange (ancillary) | ✓ |
| Payment accounts | ✓ |
| Card issuance | ✓ |
| Hold customer funds | ✓ (safeguarded) |
| Accept deposits (banking) | ✗ |
| Grant credit (lending) | ✗ (limited exception) |
| Interest on balances | ✗ |

### 1.3 EMI Sub-Types

| Type | Capital | Scope |
| :--- | :--- | :--- |
| **Full EMI** | €350,000 | Full e-money services |
| **Small EMI** | Based on volume | Limited to €5M average outstanding |
| **PI (Payment Institution)** | €20,000-€125,000 | Payment services only (no e-money issuance) |

---

## 2. Money Services Business (MSB)

### 2.1 Definition

| Attribute | Description |
| :--- | :--- |
| **Jurisdiction** | United States (Federal + State) |
| **Regulatory Authority** | FinCEN (Federal), State regulators |
| **Core Permission** | Money transmission, FX, check services |
| **Passporting** | NO (state-by-state licensing required) |
| **Deposit taking** | NO |
| **Lending** | NO |

### 2.2 What MSB Allows

| Activity | Permitted |
| :--- | :--- |
| Money transmission | ✓ |
| Currency exchange | ✓ |
| Check cashing | ✓ |
| Issuing/selling money orders | ✓ |
| Issuing/selling traveler's checks | ✓ |
| Prepaid access | ✓ |
| Accept deposits (banking) | ✗ |
| Grant credit (lending) | ✗ |
| Interest on balances | ✗ |

### 2.3 MSB Categories

| Category | Description | Federal Registration |
| :--- | :--- | :--- |
| **Money Transmitter** | Transfer of funds | FinCEN + State MTL |
| **Currency Dealer/Exchanger** | FX services | FinCEN + State |
| **Check Casher** | Check cashing services | FinCEN + State |
| **Issuer of Money Orders** | Money order issuance | FinCEN + State |
| **Prepaid Access Provider** | Prepaid instruments | FinCEN + State |

---

## 3. Full Bank Charter

### 3.1 Definition

| Attribute | Description |
| :--- | :--- |
| **Jurisdiction** | US (Federal/State), EU, other |
| **Regulatory Authority** | OCC, FDIC, Fed (US); ECB, National (EU) |
| **Core Permission** | Full banking: deposits, lending, payments |
| **Deposit insurance** | Yes (FDIC, DGS) |
| **Lending** | Yes |

### 3.2 What Bank Charter Allows

| Activity | Permitted |
| :--- | :--- |
| Accept deposits | ✓ |
| Grant credit/loans | ✓ |
| Payment services | ✓ |
| Issue cards | ✓ |
| Money transmission | ✓ (inherent) |
| Currency exchange | ✓ |
| Investment services | ✓ (with additions) |
| Pay interest on deposits | ✓ |
| Access to central bank | ✓ |
| Access to payment networks | ✓ |

### 3.3 Bank Charter Types (US)

| Type | Regulator | Requirements |
| :--- | :--- | :--- |
| **National Bank** | OCC | Federal charter, FDIC mandatory |
| **State Bank (Fed member)** | State + Fed | State charter, Fed membership |
| **State Bank (non-member)** | State + FDIC | State charter, FDIC insurance |
| **Industrial Loan Company** | State + FDIC | Limited charter (Utah, etc.) |
| **Special Purpose Charter** | OCC | Fintech charter (limited) |

---

# PART II: COMPARATIVE ANALYSIS

## 4. Master Comparison Table

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                           LICENSE TYPE COMPARISON                                       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                        │ EMI (EU/UK)        │ MSB (US)           │ Bank Charter (US)   │
├────────────────────────┼────────────────────┼────────────────────┼─────────────────────┤
│ INITIAL CAPITAL        │ €350,000           │ $25K-$2M/state     │ $10M-$30M+          │
│                        │ (Full EMI)         │ (varies widely)    │                     │
├────────────────────────┼────────────────────┼────────────────────┼─────────────────────┤
│ ONGOING CAPITAL        │ 2% of avg e-money  │ Per state rules    │ 8-10.5% risk-       │
│                        │ outstanding OR     │ (bonding varies)   │ weighted assets     │
│                        │ €350K (higher)     │                    │ (Basel III)         │
├────────────────────────┼────────────────────┼────────────────────┼─────────────────────┤
│ TIME TO LICENSE        │ 6-18 months        │ 18-36 months       │ 3-5+ years          │
│                        │ (single country)   │ (full US coverage) │                     │
├────────────────────────┼────────────────────┼────────────────────┼─────────────────────┤
│ GEOGRAPHIC SCOPE       │ EU/EEA (passport)  │ US (state-by-      │ US (national) or    │
│                        │ UK (separate)      │ state, 49+DC)      │ State-specific      │
├────────────────────────┼────────────────────┼────────────────────┼─────────────────────┤
│ DEPOSITS               │ NO                 │ NO                 │ YES                 │
├────────────────────────┼────────────────────┼────────────────────┼─────────────────────┤
│ LENDING                │ NO                 │ NO                 │ YES                 │
├────────────────────────┼────────────────────┼────────────────────┼─────────────────────┤
│ PAYMENT SERVICES       │ YES                │ YES                │ YES                 │
├────────────────────────┼────────────────────┼────────────────────┼─────────────────────┤
│ E-MONEY ISSUANCE       │ YES                │ Limited            │ YES                 │
├────────────────────────┼────────────────────┼────────────────────┼─────────────────────┤
│ DEPOSIT INSURANCE      │ NO (safeguarding)  │ NO                 │ YES (FDIC)          │
├────────────────────────┼────────────────────┼────────────────────┼─────────────────────┤
│ REGULATORY INTENSITY   │ MEDIUM             │ HIGH               │ EXTREME             │
├────────────────────────┼────────────────────┼────────────────────┼─────────────────────┤
│ COMPLIANCE COST (Yr 1) │ $500K-$1.5M        │ $1M-$3M            │ $5M-$15M+           │
├────────────────────────┼────────────────────┼────────────────────┼─────────────────────┤
│ ONGOING COMPLIANCE     │ $300K-$800K/yr     │ $500K-$1.5M/yr     │ $2M-$10M+/yr        │
└────────────────────────┴────────────────────┴────────────────────┴─────────────────────┘
```

---

## 5. Capital Requirements Detail

### 5.1 EMI Capital Requirements

| Jurisdiction | Initial Capital | Ongoing Capital | Safeguarding |
| :--- | :--- | :--- | :--- |
| **EU (Full EMI)** | €350,000 | Higher of: €350K or 2% avg e-money | 100% of e-money |
| **EU (Small EMI)** | Volume-based | Simplified | 100% of e-money |
| **EU (PI only)** | €20K-€125K | Calculation method | N/A (no e-money) |
| **UK (EMI)** | £350,000 | Same as EU | 100% of e-money |
| **UK (Small EMI)** | None specified | Volume limits apply | 100% of e-money |

### 5.2 MSB Capital Requirements

| State | Net Worth / Capital | Surety Bond | Permissible Investments |
| :--- | :--- | :--- | :--- |
| **California** | $500,000 | $500,000-$7M | Yes |
| **New York** | $500,000+ | $500,000-$5M | Yes |
| **Texas** | $300,000 | $300,000-$2M | Yes |
| **Florida** | $100,000 | $100,000-$2M | Yes |
| **Illinois** | $100,000 | $100,000-$500K | Yes |
| **Varies** | $25,000-$2,000,000 | $10,000-$7,000,000 | Varies |

**US Total Estimate (all states):** $2M-$10M in capital + $2M-$5M in bonds

### 5.3 Bank Charter Capital Requirements

| Charter Type | Minimum Capital | Risk-Based Capital | Leverage Ratio |
| :--- | :--- | :--- | :--- |
| **National Bank (OCC)** | $12M-$20M+ | 8% Tier 1 | 4% minimum |
| **State Bank** | $10M-$15M+ | 8% Tier 1 | 4% minimum |
| **De Novo (new bank)** | $20M-$30M+ | 8%+ (often higher) | 5-8% (often higher) |
| **Industrial Loan** | $5M-$10M | Varies by state | Varies |

**Note:** De novo banks typically required to hold capital well above minimums for 3-5 years.

---

## 6. Time to License

### 6.1 EMI Timeline

```
EMI LICENSING TIMELINE (EU)

Month 0-1:   Pre-application preparation
Month 1-3:   Application drafting
Month 3:     Application submission
Month 3-9:   Regulator review (varies by country)
Month 9-12:  Follow-up questions, additional requirements
Month 12-15: Decision (approval/rejection)
Month 15-18: Operational readiness

TOTAL: 6-18 months (varies by jurisdiction)

Faster jurisdictions: Lithuania (6-9 mo), Ireland (9-12 mo)
Slower jurisdictions: Germany (12-18 mo), France (12-18 mo)
```

### 6.2 MSB Timeline

```
MSB LICENSING TIMELINE (US - All States)

Month 0-3:   FinCEN registration (30 days)
             NMLS application preparation
             State prioritization

Month 3-12:  Tier 1 states (CA, NY, FL, TX) - 6-12 months each
             Applications submitted in parallel

Month 12-24: Tier 2 states - 3-9 months each
             Ongoing Tier 1 follow-up

Month 24-36: Remaining states
             Address rejections/resubmissions

TOTAL: 18-36 months for full US coverage

Alternative: Partner with existing licensee = 1-3 months
```

### 6.3 Bank Charter Timeline

```
BANK CHARTER TIMELINE (US)

Year 0-1:    Pre-filing preparation
             Business plan development
             Management team assembly
             Capital raising

Year 1-2:    OCC/State application filed
             Regulatory review
             Community meetings (if applicable)
             FDIC application (if applicable)

Year 2-3:    Conditional approval
             Additional capital requirements
             Technology build-out

Year 3-4:    Final approval
             De novo period begins
             Enhanced supervision

Year 4-7:    De novo restrictions
             Enhanced capital requirements
             Frequent examinations

TOTAL: 3-5 years to full operation
       7+ years to exit de novo status

Alternative: Acquire existing bank = 12-24 months + premium
```

---

## 7. Ongoing Compliance Burden

### 7.1 EMI Compliance Requirements

| Requirement | Frequency | Effort | Cost |
| :--- | :--- | :--- | :--- |
| Safeguarding reconciliation | Daily | High | Included in ops |
| Regulatory reporting | Monthly/Quarterly | Medium | $50K-$100K/yr |
| AML transaction monitoring | Continuous | High | $100K-$200K/yr |
| Audit (annual) | Annual | High | $50K-$150K |
| Capital monitoring | Continuous | Medium | Included |
| Consumer complaints | Continuous | Medium | $50K-$100K/yr |
| PCR/PIS compliance | Continuous | Medium | $50K-$100K/yr |

**EMI Total Annual Compliance:** $300K-$800K

### 7.2 MSB Compliance Requirements

| Requirement | Frequency | Effort | Cost |
| :--- | :--- | :--- | :--- |
| FinCEN reporting (CTR, SAR) | Transaction-based | High | $100K-$200K/yr |
| State reporting (49+ states) | Varies by state | Very High | $150K-$300K/yr |
| State examinations | Annual/biennial | Very High | $100K-$200K/yr |
| License renewals (49+ states) | Annual | High | $100K-$200K/yr |
| Bonding maintenance | Annual | Medium | $50K-$150K/yr |
| AML program | Continuous | High | $150K-$300K/yr |
| Independent audit | Annual | High | $75K-$150K |

**MSB Total Annual Compliance:** $500K-$1.5M

### 7.3 Bank Compliance Requirements

| Requirement | Frequency | Effort | Cost |
| :--- | :--- | :--- | :--- |
| Capital planning | Continuous | Very High | $200K-$500K/yr |
| Regulatory examinations | Annual (multiple) | Extreme | $300K-$500K/yr |
| Call Reports | Quarterly | High | $100K-$200K/yr |
| FDIC assessments | Quarterly | N/A | Asset-based |
| CRA compliance | Continuous | High | $100K-$300K/yr |
| BSA/AML program | Continuous | Very High | $300K-$1M/yr |
| Consumer compliance | Continuous | High | $200K-$400K/yr |
| Risk management (ORM, ERM) | Continuous | Very High | $300K-$500K/yr |
| Internal audit | Continuous | Very High | $200K-$400K/yr |
| External audit | Annual | Very High | $150K-$500K |
| Board governance | Continuous | High | $200K-$500K/yr |

**Bank Total Annual Compliance:** $2M-$10M+

---

# PART III: RISK ASSESSMENT

## 8. Risk Ranking Matrix

### 8.1 Regulatory Risk

| Risk Factor | EMI | MSB | Bank |
| :--- | :--- | :--- | :--- |
| License denial risk | MEDIUM | MEDIUM-HIGH | HIGH |
| License revocation risk | MEDIUM | MEDIUM | MEDIUM-HIGH |
| Examination failure | MEDIUM | HIGH | VERY HIGH |
| Enforcement action | MEDIUM | HIGH | HIGH |
| Criminal liability exposure | MEDIUM | MEDIUM-HIGH | HIGH |

### 8.2 Operational Risk

| Risk Factor | EMI | MSB | Bank |
| :--- | :--- | :--- | :--- |
| Execution complexity | MEDIUM | HIGH | VERY HIGH |
| Technology requirements | MEDIUM | HIGH | VERY HIGH |
| Talent requirements | MEDIUM | HIGH | VERY HIGH |
| Third-party dependencies | MEDIUM | MEDIUM | LOW-MEDIUM |
| Scalability challenges | LOW-MEDIUM | MEDIUM | MEDIUM |

### 8.3 Financial Risk

| Risk Factor | EMI | MSB | Bank |
| :--- | :--- | :--- | :--- |
| Capital consumption | MEDIUM | MEDIUM-HIGH | VERY HIGH |
| Ongoing compliance cost | MEDIUM | HIGH | VERY HIGH |
| Liability exposure | MEDIUM | HIGH | VERY HIGH |
| Credit risk | LOW (no lending) | LOW (no lending) | HIGH |
| Liquidity risk | LOW-MEDIUM | MEDIUM | HIGH |

### 8.4 Overall Risk Score

```
RISK SCORE (1 = Low, 5 = Extreme)

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   EMI:           ▓▓▓░░  2.5/5  MEDIUM                       │
│                                                             │
│   MSB:           ▓▓▓▓░  3.5/5  HIGH                         │
│                                                             │
│   BANK CHARTER:  ▓▓▓▓▓  4.5/5  VERY HIGH                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Best Fit Analysis

### 9.1 When to Choose EMI

```
CHOOSE EMI WHEN:

✓ You need payment services in EU/UK
✓ You want to issue stored value / wallets
✓ You need EU passporting
✓ You have €350K-€500K initial capital
✓ You can handle medium compliance burden
✓ You do NOT need deposit-taking or lending
✓ You want faster time-to-market (6-18 months)

EMI IS NOT SUITABLE WHEN:

✗ You need US-wide coverage
✗ You want to take deposits
✗ You want to offer lending
✗ You need interest-bearing accounts
```

### 9.2 When to Choose MSB

```
CHOOSE MSB WHEN:

✓ You need money transmission in US
✓ You need FX services in US
✓ You can handle state-by-state licensing
✓ You have $2M-$10M for full US coverage
✓ You can wait 18-36 months
✓ You do NOT need deposit-taking or lending
✓ You have strong compliance infrastructure

MSB IS NOT SUITABLE WHEN:

✗ You need fast time-to-market
✗ You need EU coverage
✗ You want to take deposits
✗ You want to offer lending
✗ You have limited compliance resources
```

### 9.3 When to Choose Bank Charter

```
CHOOSE BANK CHARTER WHEN:

✓ You need to take deposits
✓ You need to offer lending
✓ You need access to Fed/payment rails
✓ You have $20M-$50M+ capital
✓ You have 5+ year timeline
✓ You have banking-grade management team
✓ You want full banking relationship with customers

BANK CHARTER IS NOT SUITABLE WHEN:

✗ You only need payment services
✗ You need fast time-to-market
✗ You have limited capital (<$20M)
✗ You lack banking executive experience
✗ Credit/lending is not core to your model
```

---

# PART IV: RECOMMENDATION FRAMEWORK

## 10. Decision Framework

### 10.1 Primary Decision Tree

```
LICENSING DECISION TREE

Q1: Do you need deposit-taking or lending?
    │
    ├─ YES → BANK CHARTER (only option)
    │         ├─ Do you have $20M+ and 5 years?
    │         │   ├─ YES → Pursue de novo charter
    │         │   └─ NO  → Partner with bank or acquire
    │         └─ Consider: BaaS partnership with licensed bank
    │
    └─ NO → Continue to Q2

Q2: What is your primary market?
    │
    ├─ US → Continue to Q3
    │
    ├─ EU/UK → EMI recommended
    │          └─ Consider Lithuania or Ireland for speed
    │
    └─ BOTH → Need both EMI + MSB (or partners)

Q3: Can you wait 18-36 months for full US coverage?
    │
    ├─ YES → Full MSB licensing path
    │        └─ Start with largest states (CA, NY, TX, FL)
    │
    └─ NO → Partner with licensed MSB or bank
            └─ API-based solutions (Stripe, Marqeta, etc.)
```

### 10.2 Hybrid Approaches

| Approach | Description | Speed | Control | Cost |
| :--- | :--- | :--- | :--- | :--- |
| **BaaS (Banking as a Service)** | Partner with licensed bank | Fast | Low | Medium |
| **PSP Partnership** | Use Stripe, Adyen, etc. | Fast | Low | Low |
| **Agent Model** | Become agent of license holder | Fast | Medium | Low |
| **Acquisition** | Buy licensed entity | Medium | High | High |
| **De Novo License** | Build from scratch | Slow | Full | Very High |

---

## 11. Strategic Recommendation

### 11.1 For the Platform

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   RECOMMENDATION FOR MNBARA PLATFORM                        │
│                                                             │
│   CURRENT STATE: Advisory Only (No Licensing Required)      │
│                                                             │
│   IF PAYMENT EXECUTION REQUIRED:                            │
│                                                             │
│   OPTION A: PARTNER MODEL (RECOMMENDED)                     │
│   • Use licensed PSP (Stripe, Adyen, PayPal)               │
│   • No licensing required                                   │
│   • Fast implementation (weeks)                            │
│   • Liability stays with partner                           │
│   • Cost: Transaction fees only                            │
│                                                             │
│   OPTION B: EMI LICENSE (IF PARTNER INSUFFICIENT)           │
│   • Obtain EMI in Lithuania or Ireland                     │
│   • Timeline: 6-12 months                                  │
│   • Capital: €350,000                                      │
│   • Compliance: €300K-€500K/year                           │
│   • Covers EU/EEA only                                     │
│                                                             │
│   OPTION C: MSB (US REQUIRED, NOT RECOMMENDED)              │
│   • 49+ state licenses required                            │
│   • Timeline: 18-36 months                                 │
│   • Capital: $2M-$10M                                      │
│   • Compliance: $500K-$1.5M/year                           │
│   • Very high complexity                                   │
│                                                             │
│   OPTION D: BANK CHARTER (NOT RECOMMENDED)                  │
│   • Only if deposits/lending core to model                 │
│   • Timeline: 3-5 years                                    │
│   • Capital: $20M-$50M+                                    │
│   • Compliance: $2M-$10M/year                              │
│   • Extreme complexity                                     │
│                                                             │
│   STRATEGIC ADVICE:                                         │
│   Maintain advisory model. Platform's value is in          │
│   matching and trust, not payment rails. If execution      │
│   needed, partner model provides all benefits without      │
│   regulatory burden.                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 Summary Decision Matrix

| If Your Need Is... | Choose... | Timeline | Investment |
| :--- | :--- | :--- | :--- |
| Payment display only | Advisory (current) | N/A | N/A |
| Payment processing (any market) | Partner (Stripe, etc.) | Weeks | Fees only |
| Payment + wallet (EU) | EMI | 6-18 mo | €500K-€1M |
| Payment + wallet (US) | MSB (or partner) | 18-36 mo | $2M-$5M |
| Full banking (deposits, loans) | Bank Charter | 3-5 yr | $20M-$50M+ |

---

## 12. Attestation

```
This analysis is for strategic planning purposes only and 
does not constitute legal advice. Specific licensing decisions 
require consultation with qualified legal counsel in each 
relevant jurisdiction.

General Counsel:             _______________________  Date: _______
Chief Risk Officer:          _______________________  Date: _______
Chief Financial Officer:     _______________________  Date: _______
```

---
**Document Version:** 1.0
**Classification:** CONFIDENTIAL — Board & Legal Only
**Next Review:** Upon strategic change consideration
