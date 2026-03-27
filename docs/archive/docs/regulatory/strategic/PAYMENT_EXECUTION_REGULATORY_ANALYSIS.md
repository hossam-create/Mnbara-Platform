# PAYMENT EXECUTION REGULATORY ANALYSIS
## Strategic Assessment for Payments Infrastructure Expansion

**Classification:** CONFIDENTIAL — Board & Legal Only
**Status:** Strategic Analysis
**Date:** December 19, 2025
**Document Owner:** General Counsel + Chief Risk Officer

---

## EXECUTIVE SUMMARY

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   CURRENT STATE: ADVISORY ONLY                              │
│   PROPOSED STATE: PAYMENT EXECUTION                         │
│                                                             │
│   ASSESSMENT: HIGH REGULATORY COMPLEXITY                    │
│   RECOMMENDATION: MAINTAIN ADVISORY MODEL                   │
│                   OR PROCEED WITH EXTREME CAUTION           │
│                                                             │
│   This document outlines what would be required if the      │
│   Platform chose to execute payments directly. It does      │
│   NOT recommend doing so.                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# PART I: LICENSING PREREQUISITES

## 1. Activity Classification

### 1.1 Triggering Activities

The following activities trigger licensing requirements:

| Activity | Advisory (Current) | Execution (Proposed) | Trigger |
| :--- | :--- | :--- | :--- |
| Display payment options | ✓ No license | N/A | — |
| Initiate payment on behalf of user | ✗ Not done | Requires license | YES |
| Hold customer funds | ✗ Not done | Requires license | YES |
| Transmit funds between parties | ✗ Not done | Requires license | YES |
| Execute FX transactions | ✗ Not done | Requires license | YES |
| Issue payment instruments | ✗ Not done | Requires license | YES |
| Access bank accounts (PIS) | ✗ Not done | Requires license | YES |

### 1.2 License Trigger Matrix

```
DOES YOUR ACTIVITY REQUIRE A LICENSE?

Q1: Do you initiate payments on behalf of users?
    YES → Money Transmission / Payment Services license likely required
    NO  → Continue to Q2

Q2: Do you hold customer funds for any period?
    YES → Money Transmission / E-Money license likely required
    NO  → Continue to Q3

Q3: Do you transmit funds between parties?
    YES → Money Transmission license required
    NO  → Continue to Q4

Q4: Do you execute currency exchange?
    YES → FX / Money Changer license likely required
    NO  → Continue to Q5

Q5: Do you access customer bank accounts?
    YES → Open Banking authorization (PSD2 PISP) required
    NO  → Advisory model may be sufficient
```

---

## 2. United States Requirements

### 2.1 Federal Requirements

| Requirement | Authority | Description |
| :--- | :--- | :--- |
| **FinCEN Registration** | FinCEN | Register as Money Services Business (MSB) |
| **BSA Compliance** | FinCEN | Bank Secrecy Act AML program required |
| **OFAC Compliance** | Treasury | Sanctions screening mandatory |

### 2.2 State Requirements (50 States + DC)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   US STATE LICENSING: THE HARD TRUTH                        │
│                                                             │
│   • 49 states + DC require money transmitter licenses      │
│   • Montana is the only state without MTL requirement      │
│   • Each state has different:                               │
│     - Application process (3-12 months)                    │
│     - Capital requirements ($25K - $2M)                    │
│     - Bonding requirements ($10K - $500K)                  │
│     - Renewal requirements (annual)                        │
│     - Examination schedules                                │
│                                                             │
│   ESTIMATED COST: $1-3M initial + $500K-1M annual          │
│   ESTIMATED TIME: 18-36 months for full coverage           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 US License Categories

| License | When Required | Capital | Bonding | Time |
| :--- | :--- | :--- | :--- | :--- |
| **State MTL** | Transmitting money | $25K-$2M per state | $10K-$500K | 3-12 mo/state |
| **FinCEN MSB** | Any money services | N/A | N/A | 30 days |
| **NMLS Registration** | Multi-state | Varies | Varies | Varies |

### 2.4 US Alternative Path

| Alternative | Description | Licensing |
| :--- | :--- | :--- |
| **Partner through bank** | Use bank partner with licenses | None (bank's licenses apply) |
| **Use licensed PSP** | Partner with Stripe, Adyen, etc. | None (PSP's licenses apply) |
| **Agent model** | Become agent of licensed entity | Limited (agent agreement) |

---

## 3. European Union Requirements

### 3.1 PSD2 Framework

| License | When Required | Scope |
| :--- | :--- | :--- |
| **Payment Institution (PI)** | Payment initiation, execution | Full EU passporting |
| **E-Money Institution (EMI)** | Issue e-money, hold funds | Full EU passporting |
| **Account Information Service (AIS)** | View accounts only | Lighter registration |
| **Payment Initiation Service (PIS)** | Initiate payments from accounts | PI license required |

### 3.2 EU License Requirements

```
PAYMENT INSTITUTION (PI) LICENSE

Capital Requirements:
• €20,000 minimum (payment initiation only)
• €50,000 minimum (payment execution)
• €125,000 minimum (full payment services)

Safeguarding:
• Customer funds must be safeguarded
• Segregated bank accounts required
• Or insurance/guarantee arrangement

Ongoing:
• Annual supervisory fees
• Regular reporting to regulator
• Periodic examinations

Timeline: 6-12 months
Cost: €100K-€500K initial + ongoing
```

### 3.3 EU Member State Variations

| Country | Regulator | Notes |
| :--- | :--- | :--- |
| Ireland | Central Bank of Ireland | Common EU entry point |
| Lithuania | Bank of Lithuania | Faster processing, popular |
| Luxembourg | CSSF | Strong reputation |
| Germany | BaFin | Thorough process |
| Netherlands | DNB | Established fintech hub |

### 3.4 UK Post-Brexit

| Requirement | Authority | Notes |
| :--- | :--- | :--- |
| **FCA Authorization** | FCA | Separate from EU |
| **Payment Services** | FCA | Similar to PSD2 but UK-specific |
| **E-Money** | FCA | Separate regime |
| **Temporary Permission** | N/A | Expired for most entities |

---

## 4. MENA Requirements

### 4.1 United Arab Emirates

| Jurisdiction | License | Authority | Notes |
| :--- | :--- | :--- | :--- |
| **DIFC** | Payment Services | DFSA | Dollar-based, common choice |
| **ADGM** | Payment Services | FSRA | Alternative free zone |
| **UAE (onshore)** | Stored Value Facility | Central Bank | Full UAE access |

```
UAE LICENSING CONSIDERATIONS

• Free zones (DIFC, ADGM) are faster but limited to zone
• Onshore license required for UAE-wide operations
• Central Bank license process: 12-24 months
• Capital requirements: AED 5-15M depending on license
• Local ownership requirements may apply (onshore)
```

### 4.2 Saudi Arabia

| License | Authority | Notes |
| :--- | :--- | :--- |
| **Payment Services** | SAMA | Saudi Arabian Monetary Authority |
| **Fintech License** | SAMA Sandbox | Testing environment |

```
SAUDI ARABIA CONSIDERATIONS

• SAMA licensing highly selective
• Local entity required
• Significant capital requirements
• Saudi national board members may be required
• Sandbox first, then full license path
```

### 4.3 Egypt

| License | Authority | Notes |
| :--- | :--- | :--- |
| **Payment Service Provider** | Central Bank of Egypt | Required for payment services |
| **E-Payment License** | CBE | For electronic payment services |

```
EGYPT CONSIDERATIONS

• CBE licensing required
• Egyptian entity mandatory
• Local partnership often required
• Capital and operational requirements
• FX controls apply to cross-border
```

### 4.4 MENA Summary

| Country | Complexity | Timeline | Capital Estimate |
| :--- | :--- | :--- | :--- |
| UAE (DIFC) | Medium | 6-12 months | $500K-$1M |
| UAE (Onshore) | High | 12-24 months | $2M+ |
| Saudi Arabia | Very High | 18-36 months | $3M+ |
| Egypt | High | 12-24 months | $1M+ |
| Bahrain | Medium | 6-12 months | $500K+ |
| Jordan | Medium | 9-18 months | $500K+ |

---

# PART II: LIABILITY TRANSFER POINTS

## 5. Liability Architecture

### 5.1 Current Model (Advisory)

```
CURRENT LIABILITY FLOW

User → Platform (Advisory) → Licensed Partner (Execution)

Platform Liability:
• Display accuracy
• User interface
• Information provision

Partner Liability:
• Payment execution
• Fund custody
• AML/KYC compliance
• Regulatory compliance
• Transaction disputes
```

### 5.2 Proposed Model (Execution)

```
PROPOSED LIABILITY FLOW (IF LICENSED)

User → Platform (Execution)

Platform Liability:
• ALL payment execution liabilities
• Fund custody and safeguarding
• AML/KYC program operation
• Sanctions screening
• Regulatory compliance
• Transaction disputes
• Fraud losses
• System failures
• Data breaches (payment data)
```

### 5.3 Liability Comparison

| Liability Area | Advisory Model | Execution Model |
| :--- | :--- | :--- |
| Payment failure | Partner | **PLATFORM** |
| Fraud loss | Partner | **PLATFORM** |
| Chargeback | Partner | **PLATFORM** |
| AML violation | Partner | **PLATFORM** |
| Sanctions violation | Partner | **PLATFORM** |
| Fund loss | Partner | **PLATFORM** |
| Data breach (payment) | Partner | **PLATFORM** |
| System outage | Shared | **PLATFORM** |
| Regulatory fine | Partner | **PLATFORM** |

### 5.4 Liability Transfer Points

| Event | Liability Transfers When |
| :--- | :--- |
| Payment initiation | User action confirmed → Platform liability begins |
| Fund receipt | Funds received → Custody liability begins |
| Fund holding | Any holding period → Safeguarding liability |
| Fund release | Release instruction → Liability until received |
| Transaction completion | Beneficiary receipt → Liability may reduce |

---

## 6. Insurance Implications

### 6.1 Required Insurance (Execution Model)

| Coverage | Minimum | Purpose |
| :--- | :--- | :--- |
| Professional Indemnity | $5-10M | Errors and omissions |
| Cyber Liability | $5-10M | Data breach, system failure |
| Crime / Fidelity | $2-5M | Employee fraud, theft |
| Directors & Officers | $5-10M | Management liability |
| Fund Safeguarding | 100% of funds | Regulatory requirement |

### 6.2 Insurance Cost Estimate

| Coverage | Annual Premium Estimate |
| :--- | :--- |
| Full payment services coverage | $200K-$500K |
| Increased with transaction volume | Variable |

---

# PART III: AML/KYC ESCALATION

## 7. AML Program Requirements

### 7.1 Current Model (Advisory)

| Requirement | Platform Obligation |
| :--- | :--- |
| AML program | Basic (platform access) |
| Transaction monitoring | Not required |
| SAR filing | Not required |
| Sanctions screening | Limited (own users) |
| Record keeping | Platform records only |

### 7.2 Execution Model Requirements

```
FULL AML PROGRAM REQUIREMENTS

1. AML COMPLIANCE OFFICER
   • Designated individual
   • Board reporting
   • Regulatory interface

2. WRITTEN AML POLICY
   • Approved by Board
   • Regular updates
   • Training documentation

3. RISK ASSESSMENT
   • Product risk
   • Customer risk
   • Geographic risk
   • Regular updates

4. CUSTOMER DUE DILIGENCE (CDD)
   • Identity verification
   • Beneficial ownership
   • Source of funds (high risk)
   • Enhanced due diligence (EDD)

5. TRANSACTION MONITORING
   • Automated monitoring system
   • Alert investigation
   • Case management
   • Documentation

6. SUSPICIOUS ACTIVITY REPORTING
   • SAR/STR filing
   • Timely submission
   • Record retention

7. SANCTIONS SCREENING
   • Real-time screening
   • OFAC, UN, EU, UK lists
   • Alert management
   • Documentation

8. RECORD KEEPING
   • 5-7 years minimum
   • Transaction records
   • CDD records
   • SAR records

9. TRAINING
   • All relevant staff
   • Annual refresher
   • Documented completion

10. INDEPENDENT AUDIT
    • Annual requirement
    • Qualified auditor
    • Remediation tracking
```

### 7.3 AML Program Cost

| Component | Annual Cost Estimate |
| :--- | :--- |
| Compliance Officer | $150K-$250K |
| Compliance team (3-5 people) | $300K-$600K |
| Transaction monitoring system | $100K-$300K |
| Screening tools | $50K-$150K |
| Training program | $25K-$50K |
| Independent audit | $50K-$100K |
| **TOTAL** | **$675K-$1.45M/year** |

---

## 8. KYC Escalation

### 8.1 KYC Tiers

| Tier | When | Requirements |
| :--- | :--- | :--- |
| **Basic** | All users | Name, email, phone |
| **Standard** | Payment users | ID verification, address |
| **Enhanced** | High risk, high value | Source of funds, additional docs |
| **Ongoing** | All | Continuous monitoring |

### 8.2 Enhanced Due Diligence Triggers

| Trigger | EDD Required |
| :--- | :--- |
| PEP (Politically Exposed Person) | Yes |
| High-risk country | Yes |
| Unusual transaction pattern | Yes |
| High-value transaction | Yes (threshold varies) |
| Negative news | Yes |
| Complex structure | Yes |

### 8.3 Geographic Risk Classification

| Risk Level | Countries (Examples) |
| :--- | :--- |
| **Prohibited** | OFAC sanctioned, FATF black list |
| **High Risk** | FATF grey list, high corruption indices |
| **Medium Risk** | Emerging markets, some MENA |
| **Standard** | US, EU, major economies |

---

# PART IV: REGULATORY DECISION TREE

## 9. Go / No-Go Framework

### 9.1. Primary Decision Tree

```
PAYMENT EXECUTION DECISION TREE

START
│
├─ Q1: Is payment execution core to business model?
│   │
│   ├─ NO → MAINTAIN ADVISORY MODEL ← RECOMMENDED PATH
│   │
│   └─ YES → Continue
│
├─ Q2: Do you have $3-5M for licensing & compliance (Year 1)?
│   │
│   ├─ NO → Partner with licensed entity → HYBRID MODEL
│   │
│   └─ YES → Continue
│
├─ Q3: Can you wait 18-36 months for full licensing?
│   │
│   ├─ NO → Partner with licensed entity → HYBRID MODEL
│   │
│   └─ YES → Continue
│
├─ Q4: Do you have AML/compliance expertise in-house?
│   │
│   ├─ NO → Build team first (6-12 months) → Reconsider
│   │
│   └─ YES → Continue
│
├─ Q5: Are target jurisdictions US + EU + MENA?
│   │
│   ├─ YES → Extreme complexity → Consider narrower scope
│   │
│   └─ NO (single region) → Continue
│
├─ Q6: Have you completed legal pre-assessment?
│   │
│   ├─ NO → Engage specialized counsel first
│   │
│   └─ YES + Positive → PROCEED WITH CAUTION
│
└─ FULL EXECUTION: 
   • Multi-year project
   • Multi-million dollar investment
   • Significant ongoing compliance burden
   • High regulatory risk
```

### 9.2 Alternative Paths

| Path | Description | Licensing Required | Time | Cost |
| :--- | :--- | :--- | :--- | :--- |
| **Advisory Only** | Current model | None | N/A | Current |
| **Licensed Partner** | Use PSP partner | None (theirs) | 1-3 mo | Fees only |
| **Agent Model** | Become agent of license holder | Limited | 3-6 mo | Low |
| **Single Jurisdiction** | License in one country | One license | 6-18 mo | $500K-$2M |
| **Multi-Jurisdiction** | Full global licensing | Many licenses | 3-5 years | $5M+ |

---

## 10. Red Lines

### 10.1 Absolute Red Lines

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ABSOLUTE RED LINES — CANNOT BE CROSSED                    │
│                                                             │
│   ❌ NEVER transmit funds without required licenses         │
│                                                             │
│   ❌ NEVER hold customer funds without safeguarding         │
│                                                             │
│   ❌ NEVER process payments involving sanctioned parties    │
│                                                             │
│   ❌ NEVER operate in sanctioned jurisdictions              │
│                                                             │
│   ❌ NEVER operate without AML program (if licensed)        │
│                                                             │
│   ❌ NEVER ignore suspicious activity                       │
│                                                             │
│   ❌ NEVER mislead regulators                               │
│                                                             │
│   Crossing these lines = Criminal liability + Company death │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Operational Red Lines

| Red Line | Consequence |
| :--- | :--- |
| Operating without license | Criminal prosecution, fines, shutdown |
| BSA/AML violation | Up to $1M/day fines, criminal liability |
| OFAC violation | Up to $20M+ fines, criminal liability |
| Fund misappropriation | Criminal prosecution, civil liability |
| Unauthorized payment services | Regulatory action, potential fraud charges |

### 10.3 Pre-Requisites Before ANY Execution

| Pre-Requisite | Status |
| :--- | :--- |
| Board approval | Required |
| Legal opinion (external) | Required |
| Licensing path defined | Required |
| AML program designed | Required |
| Capital secured | Required |
| Compliance team in place | Required |
| Insurance in place | Required |
| Technology infrastructure | Required |
| Regulator pre-consultation | Recommended |

---

## 11. Recommendation

### 11.1 Strategic Recommendation

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   RECOMMENDATION: MAINTAIN ADVISORY MODEL                   │
│                                                             │
│   Rationale:                                                │
│                                                             │
│   1. REGULATORY COMPLEXITY                                  │
│      Multi-jurisdiction licensing is multi-year, multi-    │
│      million dollar undertaking                             │
│                                                             │
│   2. LIABILITY EXPOSURE                                     │
│      Execution model transfers all liability to Platform   │
│                                                             │
│   3. OPERATIONAL BURDEN                                     │
│      Full AML program requires significant investment      │
│                                                             │
│   4. PARTNER AVAILABILITY                                   │
│      Licensed partners (Stripe, Adyen, etc.) provide       │
│      execution capabilities without Platform licensing     │
│                                                             │
│   5. BUSINESS FOCUS                                         │
│      Platform's value is in matching and trust, not        │
│      payment processing                                     │
│                                                             │
│   ALTERNATIVE: Enhance partner integrations                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 If Execution is Pursued

| Phase | Timeline | Investment | Focus |
| :--- | :--- | :--- | :--- |
| Phase 0 | 0-3 mo | $100K | Legal assessment, feasibility |
| Phase 1 | 3-12 mo | $500K | Single jurisdiction license |
| Phase 2 | 12-24 mo | $1-2M | Second jurisdiction + operations |
| Phase 3 | 24-48 mo | $2-3M | Additional jurisdictions |
| Ongoing | Annual | $1-2M | Compliance, audit, renewal |

---

## 12. Attestation

```
This analysis has been reviewed. Proceeding with payment execution
requires explicit Board approval with full understanding of 
regulatory, legal, financial, and operational implications.

General Counsel:             _______________________  Date: _______
Chief Risk Officer:          _______________________  Date: _______
Chief Financial Officer:     _______________________  Date: _______
Chief Executive Officer:     _______________________  Date: _______

BOARD RESOLUTION REQUIRED FOR ANY CHANGE FROM ADVISORY MODEL.
```

---
**Document Version:** 1.0
**Classification:** CONFIDENTIAL — Board & Legal Only
**Next Review:** Upon strategic change consideration
