# SYSTEMIC SCALE RISK ANALYSIS
## Risk Amplification at Massive Scale

**Classification:** CONFIDENTIAL — Risk Committee Only
**Status:** Strategic Risk Assessment
**Date:** December 19, 2025
**Document Owner:** Chief Risk Officer

---

## EXECUTIVE SUMMARY

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   SCALE CREATES SYSTEMIC RISK                               │
│                                                             │
│   What works at 10K users may fail catastrophically at 1M.  │
│   What is manageable at 1M may collapse at 10M.             │
│                                                             │
│   This document identifies:                                 │
│   • Risks that amplify non-linearly with scale             │
│   • Critical thresholds that trigger new risk categories   │
│   • Mandatory control upgrades at each scale tier          │
│                                                             │
│   CORE INSIGHT:                                             │
│   Small platform = Individual failures                     │
│   Large platform = Systemic failures + Regulatory target   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# PART I: SCALE TIER DEFINITIONS

## 1. Platform Scale Tiers

### 1.1 User Base Tiers

| Tier | Users | Monthly Active | Transactions/Month | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 0** | 0-10K | 0-3K | 0-5K | Early Stage |
| **Tier 1** | 10K-100K | 3K-30K | 5K-50K | Growth Stage |
| **Tier 2** | 100K-1M | 30K-300K | 50K-500K | Scale Stage |
| **Tier 3** | 1M-10M | 300K-3M | 500K-5M | Mass Market |
| **Tier 4** | 10M-100M | 3M-30M | 5M-50M | Dominant Player |
| **Tier 5** | 100M+ | 30M+ | 50M+ | Critical Infrastructure |

### 1.2 Volume Tiers

| Tier | GMV/Month | Escrow Balance | Cross-Border % |
| :--- | :--- | :--- | :--- |
| **Tier 0** | $0-$1M | $0-$200K | Any |
| **Tier 1** | $1M-$10M | $200K-$2M | Any |
| **Tier 2** | $10M-$100M | $2M-$20M | Any |
| **Tier 3** | $100M-$1B | $20M-$200M | Significant |
| **Tier 4** | $1B-$10B | $200M-$2B | Major |
| **Tier 5** | $10B+ | $2B+ | Dominant |

---

# PART II: ABUSE AMPLIFICATION RISKS

## 2. Fraud at Scale

### 2.1 Fraud Risk Amplification

| Risk | Tier 0-1 | Tier 2-3 | Tier 4-5 |
| :--- | :--- | :--- | :--- |
| **Individual fraud** | Contained | Amplified | Industrialized |
| **Organized fraud rings** | Rare | Common | Sophisticated |
| **Fraud-as-a-Service** | Not target | Emerging target | Primary target |
| **Insider threats** | Rare | Possible | Probable |
| **State-sponsored actors** | N/A | Possible | Probable |

### 2.2 Fraud Volume Projection

```
FRAUD AT SCALE (Assuming 2% fraud attempt rate)

Tier 0:  200 fraud attempts/year → Manageable manually
Tier 1:  2,000 fraud attempts/year → Manual + basic automation
Tier 2:  20,000 fraud attempts/year → Automation required
Tier 3:  200,000 fraud attempts/year → ML/AI detection required
Tier 4:  2,000,000 fraud attempts/year → Enterprise fraud system
Tier 5:  20,000,000+ fraud attempts/year → Industry-leading systems

CRITICAL INSIGHT:
Human review capacity: ~5,000-10,000 cases/year per analyst
At Tier 3+: 20-40+ fraud analysts required just for review
```

### 2.3 Fraud Control Upgrades

| Tier | Mandatory Controls |
| :--- | :--- |
| **Tier 0-1** | Basic velocity checks, email verification, manual review |
| **Tier 2** | Device fingerprinting, IP reputation, automated rules engine |
| **Tier 3** | ML fraud detection, graph analysis, dedicated fraud team |
| **Tier 4** | Real-time ML, behavioral biometrics, fraud consortium sharing |
| **Tier 5** | Industry consortium leadership, custom AI, regulatory coordination |

---

## 3. AML/Sanctions at Scale

### 3.1 AML Risk Amplification

| Risk | Tier 0-1 | Tier 2-3 | Tier 4-5 |
| :--- | :--- | :--- | :--- |
| **Money laundering** | Opportunistic | Structured | Industrial |
| **Sanctions evasion** | Accidental | Attempts | Sophisticated |
| **Structuring** | Rare | Systematic | Organized |
| **Trade-based laundering** | Unlikely | Emerging | Common |
| **Terrorist financing** | Unlikely | Possible | Target |

### 3.2 SAR Volume Projection

```
SAR FILING PROJECTION (Assuming 0.1% SAR rate)

Tier 0:  10 SARs/year → Minimal burden
Tier 1:  100 SARs/year → 1 compliance analyst sufficient
Tier 2:  1,000 SARs/year → 3-5 compliance analysts
Tier 3:  10,000 SARs/year → Dedicated AML department (15-25 staff)
Tier 4:  100,000 SARs/year → Enterprise AML operation (100+ staff)
Tier 5:  1,000,000+ SARs/year → Bank-level compliance infrastructure

CRITICAL THRESHOLD:
At 10,000+ SARs/year: FinCEN/regulator attention guaranteed
At 100,000+: Systematic regulatory examination likely
```

### 3.3 AML Control Upgrades

| Tier | Mandatory Controls |
| :--- | :--- |
| **Tier 0-1** | Basic screening, transaction monitoring, BSA officer |
| **Tier 2** | Automated monitoring, EDD program, dedicated team |
| **Tier 3** | Enterprise TMS, case management, regulatory relationships |
| **Tier 4** | Real-time monitoring, ML enhancement, examiner-ready |
| **Tier 5** | Regulatory partnership, industry standard-setting, innovation |

---

## 4. Content & Safety at Scale

### 4.1 Harmful Content Amplification

| Risk | Tier 0-1 | Tier 2-3 | Tier 4-5 |
| :--- | :--- | :--- | :--- |
| **Prohibited items** | Occasional | Systematic | Industrial |
| **Counterfeit goods** | Rare | Common | Pervasive |
| **Stolen goods** | Rare | Organized | Rings |
| **Dangerous items** | Rare | Emerging | Targeted |
| **CSAM risk** | Minimal | Elevated | Extreme vigilance |

### 4.2 Content Moderation Load

```
CONTENT MODERATION PROJECTION (Assuming 1% flag rate)

Tier 0:  100 flags/year → Founder can handle
Tier 1:  1,000 flags/year → 1 moderator sufficient
Tier 2:  10,000 flags/year → 5-10 moderators
Tier 3:  100,000 flags/year → 50-100 moderators + automation
Tier 4:  1,000,000 flags/year → 500+ moderators + ML first-pass
Tier 5:  10,000,000+ flags/year → Industry-leading moderation

CRITICAL INSIGHT:
At Tier 3+: Media/regulatory scrutiny for moderation failures
At Tier 4+: Public health/safety implications
Single high-profile failure at scale = existential reputational damage
```

### 4.3 Content Control Upgrades

| Tier | Mandatory Controls |
| :--- | :--- |
| **Tier 0-1** | Basic keyword filters, manual review, report mechanism |
| **Tier 2** | ML classification, photo analysis, tiered review queue |
| **Tier 3** | Advanced ML, trust & safety team, external partnerships |
| **Tier 4** | Industry-leading AI, large T&S org, law enforcement liaison |
| **Tier 5** | Standard-setting, transparency reports, regulatory coordination |

---

## 5. Platform Manipulation at Scale

### 5.1 Manipulation Risk Amplification

| Risk | Tier 0-1 | Tier 2-3 | Tier 4-5 |
| :--- | :--- | :--- | :--- |
| **Fake reviews** | Occasional | Organized | Industrial |
| **Sybil attacks** | Rare | Common | Sophisticated |
| **Trust score gaming** | Unlikely | Systematic | Professionalized |
| **Market manipulation** | N/A | Possible | Organized |
| **Coordinated inauthentic behavior** | N/A | Emerging | Common |

### 5.2 Manipulation Control Upgrades

| Tier | Mandatory Controls |
| :--- | :--- |
| **Tier 0-1** | Basic duplicate detection, velocity limits |
| **Tier 2** | Graph analysis, device clustering, behavioral analysis |
| **Tier 3** | ML detection, dedicated integrity team, link analysis |
| **Tier 4** | Advanced graph ML, coordinated behavior detection |
| **Tier 5** | Research partnerships, academic collaboration, disclosure |

---

# PART III: REGULATORY SCRUTINY RISKS

## 6. Regulatory Attention Thresholds

### 6.1 Scrutiny Trigger Points

```
REGULATORY ATTENTION MATRIX

Volume Threshold      → Trigger
────────────────────────────────────────────────────────
$10M GMV/year         → State regulator awareness
$50M GMV/year         → Federal regulator awareness (FinCEN, FTC)
$100M GMV/year        → Active monitoring, likely inquiry
$500M GMV/year        → Examination likely
$1B GMV/year          → Systematic supervision
$10B GMV/year         → Systemically important designation possible

User Threshold        → Trigger
────────────────────────────────────────────────────────
100K users            → Local consumer protection attention
1M users              → National consumer protection attention
10M users             → Congressional/Parliamentary awareness
50M users             → Systematic oversight
100M users            → Critical infrastructure consideration
```

### 6.2 Regulatory Risk Categories

| Tier | Regulatory Posture |
| :--- | :--- |
| **Tier 0-1** | Below threshold; routine oversight only |
| **Tier 2** | Emerging attention; proactive compliance recommended |
| **Tier 3** | Active oversight; examination likely; must be prepared |
| **Tier 4** | Systematic supervision; dedicated regulatory relationships |
| **Tier 5** | Regulated as infrastructure; potential utility treatment |

### 6.3 Multi-Regulator Complexity

```
REGULATORY MULTIPLIER EFFECT

At Tier 3+, expect simultaneous attention from:

FINANCIAL REGULATORS:
• FinCEN (AML)
• State banking regulators (49+)
• CFPB (consumer protection)
• FTC (unfair practices)
• SEC (if any investment component)
• OCC (if banking services)

CROSS-BORDER:
• EU regulators (PSD2, DSA, GDPR)
• UK FCA
• MENA regulators

SECTOR-SPECIFIC:
• Customs (cross-border goods)
• Product safety agencies
• Tax authorities (multi-jurisdiction)

Consumer Protection:
• FTC (US)
• State AGs (50)
• Consumer Financial Protection Bureau
• EU consumer authorities

TOTAL: 100+ regulatory relationships at scale
```

---

## 7. Specific Regulatory Risks

### 7.1 Anti-Money Laundering

| Tier | AML Risk | Regulatory Response |
| :--- | :--- | :--- |
| **Tier 0-1** | Low visibility | Basic compliance sufficient |
| **Tier 2** | Emerging visibility | Program maturity expected |
| **Tier 3** | High visibility | Examination guaranteed |
| **Tier 4** | Constant examination | Consent order risk if gaps |
| **Tier 5** | Assumed perfect | Any failure = major enforcement |

### 7.2 Consumer Protection

| Tier | Consumer Risk | Regulatory Response |
| :--- | :--- | :--- |
| **Tier 0-1** | Individual complaints | Routine handling |
| **Tier 2** | Pattern possible | CFPB monitoring |
| **Tier 3** | Pattern likely visible | Investigation possible |
| **Tier 4** | Systemic patterns | Enforcement likely if issues |
| **Tier 5** | Any pattern = news | Immediate investigation |

### 7.3 Competition / Antitrust

| Tier | Competition Risk | Regulatory Response |
| :--- | :--- | :--- |
| **Tier 0-2** | No concern | None |
| **Tier 3** | Market position notable | Monitoring possible |
| **Tier 4** | Significant market share | Antitrust scrutiny |
| **Tier 5** | Dominant position | Potential enforcement, breakup risk |

---

## 8. Regulatory Control Upgrades

| Tier | Mandatory Controls |
| :--- | :--- |
| **Tier 0-1** | Basic compliance, documented policies, one officer |
| **Tier 2** | Formal compliance program, regular audits, 3-5 staff |
| **Tier 3** | Enterprise compliance, CCO role, regulatory affairs, 15-30 staff |
| **Tier 4** | Dedicated regulatory team, agency relationships, 50-100+ staff |
| **Tier 5** | Industry-leading program, regulatory co-development, 200+ staff |

---

# PART IV: OPERATIONAL COLLAPSE RISKS

## 9. Infrastructure Risks at Scale

### 9.1 System Reliability

| Tier | Availability Target | Downtime Cost/Hour | Required SLA |
| :--- | :--- | :--- | :--- |
| **Tier 0-1** | 99% | $1K-$10K | Best effort |
| **Tier 2** | 99.5% | $10K-$100K | Basic SLA |
| **Tier 3** | 99.9% | $100K-$1M | Formal SLA |
| **Tier 4** | 99.95% | $1M-$10M | Enterprise SLA |
| **Tier 5** | 99.99% | $10M+ | Carrier-grade |

### 9.2 Failure Impact

```
DOWNTIME IMPACT AT SCALE

Tier 0:  1 hour down = Minor inconvenience
Tier 1:  1 hour down = User complaints
Tier 2:  1 hour down = Revenue loss + trust damage
Tier 3:  1 hour down = News coverage + regulatory inquiry
Tier 4:  1 hour down = Major incident + potential hearings
Tier 5:  1 hour down = National/global impact

CRITICAL INSIGHT:
Infrastructure at Tier 4+ must be treated as critical infrastructure
Multiple data centers, hot failover, 24/7 NOC required
```

### 9.3 Infrastructure Control Upgrades

| Tier | Mandatory Controls |
| :--- | :--- |
| **Tier 0-1** | Cloud hosting, basic monitoring, backup |
| **Tier 2** | Multi-AZ, auto-scaling, incident response |
| **Tier 3** | Multi-region, disaster recovery, 24/7 support |
| **Tier 4** | Active-active, zero-downtime deploy, global NOC |
| **Tier 5** | Industry-leading resilience, chaos engineering |

---

## 10. Human Resources at Scale

### 10.1 Staffing Risks

```
STAFFING REQUIREMENTS AT SCALE

Function              Tier 1    Tier 2    Tier 3    Tier 4    Tier 5
─────────────────────────────────────────────────────────────────────
Trust & Safety        2         10        50        200       500+
Compliance/AML        2         5-10      25-50     100-200   400+
Customer Support      5         25        100       500       2000+
Engineering           10        50        150       500       1500+
Operations            5         20        75        250       800+
Legal                 1         5         15        50        150+
Risk Management       1         5         15        50        150+
─────────────────────────────────────────────────────────────────────
TOTAL HEADCOUNT       ~30       ~130      ~500      ~1700     ~5500+

CRITICAL RISK:
Scaling hiring 10x in 12-18 months creates:
• Quality dilution
• Culture erosion
• Training gaps
• Management gaps
• Knowledge silos
```

### 10.2 Key Person Risk

| Tier | Key Person Risk | Mitigation Required |
| :--- | :--- | :--- |
| **Tier 0-1** | Founder dependency | Document everything |
| **Tier 2** | Department head dependency | Cross-training, backup |
| **Tier 3** | Leadership gaps dangerous | Deep bench, succession |
| **Tier 4** | Any departure = news | Institutional knowledge |
| **Tier 5** | Executive change = stock move | Board-level succession |

### 10.3 HR Control Upgrades

| Tier | Mandatory Controls |
| :--- | :--- |
| **Tier 0-1** | Documentation, cross-training |
| **Tier 2** | Formal hiring, training programs, management layer |
| **Tier 3** | HR department, leadership development, succession planning |
| **Tier 4** | Enterprise HR, executive development, talent analytics |
| **Tier 5** | Industry-leading people ops, internal mobility at scale |

---

## 11. Financial Collapse Risks

### 11.1 Escrow / Fund Risks

```
ESCROW FAILURE RISK AT SCALE

Scenario: Escrow partner failure / fraud / cyberattack

Tier 0:  $200K at risk → Fund from operations
Tier 1:  $2M at risk → Significant but survivable
Tier 2:  $20M at risk → Potential existential threat
Tier 3:  $200M at risk → Catastrophic; requires insurance
Tier 4:  $2B at risk → Systemic event; requires bank-level protections
Tier 5:  $20B+ at risk → Financial system risk; utility treatment

CRITICAL INSIGHT:
At Tier 3+: Escrow/custody becomes bank-level responsibility
Insurance requirements: $50M-$500M+ coverage
Regulatory scrutiny of safeguarding: Intense
```

### 11.2 Financial Control Upgrades

| Tier | Mandatory Controls |
| :--- | :--- |
| **Tier 0-1** | Basic insurance, segregated accounts |
| **Tier 2** | Enhanced insurance ($5M+), regular reconciliation |
| **Tier 3** | Major insurance ($50M+), daily reconciliation, multiple custodians |
| **Tier 4** | $100M+ insurance, real-time reconciliation, distributed custody |
| **Tier 5** | Bank-level treasury, central bank relationships |

---

# PART V: SCALE RISK MATRIX

## 12. Comprehensive Risk Matrix

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           SCALE RISK MATRIX                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                     │ Tier 0-1  │ Tier 2    │ Tier 3    │ Tier 4    │ Tier 5       │
│ Risk Category       │ <100K     │ 100K-1M   │ 1M-10M    │ 10M-100M  │ 100M+        │
├─────────────────────┼───────────┼───────────┼───────────┼───────────┼──────────────┤
│ FRAUD               │ LOW       │ MEDIUM    │ HIGH      │ EXTREME   │ EXISTENTIAL  │
│ Fraudsters          │ Amateur   │ Semi-pro  │ Organized │ Syndicates│ State actors │
│ Control Level       │ Basic     │ Automated │ ML-driven │ Enterprise│ Industry-best│
├─────────────────────┼───────────┼───────────┼───────────┼───────────┼──────────────┤
│ AML/SANCTIONS       │ LOW       │ MEDIUM    │ HIGH      │ VERY HIGH │ EXTREME      │
│ Scrutiny            │ Routine   │ Monitoring│ Examination│ Continuous│ Partnership  │
│ Control Level       │ Basic     │ Formal    │ Enterprise│ Bank-level│ Standard-set │
├─────────────────────┼───────────┼───────────┼───────────┼───────────┼──────────────┤
│ CONTENT/SAFETY      │ LOW       │ MEDIUM    │ HIGH      │ VERY HIGH │ EXTREME      │
│ Failure Impact      │ Contained │ Reputation│ News      │ Congress  │ Legislation  │
│ Control Level       │ Manual    │ Semi-auto │ ML + team │ Large org │ Industry-best│
├─────────────────────┼───────────┼───────────┼───────────┼───────────┼──────────────┤
│ REGULATORY          │ MINIMAL   │ LOW       │ MEDIUM    │ HIGH      │ VERY HIGH    │
│ Attention           │ None      │ Awareness │ Active    │ Systematic│ Infrastructure│
│ Control Level       │ Policies  │ Program   │ Team      │ Org       │ Co-regulator │
├─────────────────────┼───────────┼───────────┼───────────┼───────────┼──────────────┤
│ INFRASTRUCTURE      │ LOW       │ MEDIUM    │ HIGH      │ VERY HIGH │ EXTREME      │
│ Downtime Impact     │ Minimal   │ Revenue   │ Trust     │ News      │ National     │
│ Control Level       │ Cloud     │ Multi-AZ  │ Multi-reg │ Active-act│ Carrier-grade│
├─────────────────────┼───────────┼───────────┼───────────┼───────────┼──────────────┤
│ FINANCIAL/ESCROW    │ LOW       │ MEDIUM    │ HIGH      │ EXTREME   │ SYSTEMIC     │
│ Failure Impact      │ Contained │ Significant│ Major    │ Catastroph│ System-wide  │
│ Control Level       │ Insurance │ Enhanced  │ Major    │ Bank-level│ Utility-level│
├─────────────────────┼───────────┼───────────┼───────────┼───────────┼──────────────┤
│ PEOPLE/ORG          │ LOW       │ MEDIUM    │ HIGH      │ HIGH      │ HIGH         │
│ Key Person Risk     │ Founder   │ Leaders   │ Executives│ Board     │ Institution  │
│ Control Level       │ Document  │ Backup    │ Succession│ Deep bench│ Institutional│
├─────────────────────┼───────────┼───────────┼───────────┼───────────┼──────────────┤
│ OVERALL RISK SCORE  │ 1.5/5     │ 2.5/5     │ 3.5/5     │ 4.5/5     │ 5/5          │
│                     │ LOW       │ MEDIUM    │ HIGH      │ VERY HIGH │ EXTREME      │
└─────────────────────┴───────────┴───────────┴───────────┴───────────┴──────────────┘
```

---

# PART VI: MANDATORY CONTROLS BY TIER

## 13. Control Upgrade Schedule

### 13.1 Tier 0-1 Baseline (< 100K Users)

```
TIER 0-1 MANDATORY CONTROLS

FRAUD:
☐ Email verification
☐ Basic velocity checks
☐ Manual review process
☐ Report mechanism

AML:
☐ BSA/AML policy
☐ Basic screening (OFAC)
☐ BSA officer designated
☐ SAR filing capability

CONTENT:
☐ Prohibited items policy
☐ Keyword filtering
☐ Report and remove process
☐ Human review queue

REGULATORY:
☐ Documented policies
☐ Terms of service
☐ Privacy policy
☐ Basic compliance records

INFRASTRUCTURE:
☐ Cloud hosting
☐ Basic monitoring
☐ Daily backups
☐ Incident response plan

FINANCIAL:
☐ Basic D&O insurance
☐ Segregated escrow
☐ Monthly reconciliation

PEOPLE:
☐ Key process documentation
☐ Basic cross-training
☐ Founder succession consideration

ESTIMATED COST: $100K-$500K/year
```

### 13.2 Tier 2 Upgrade (100K-1M Users)

```
TIER 2 MANDATORY CONTROLS (In addition to Tier 1)

FRAUD:
☑ Device fingerprinting
☑ IP reputation scoring
☑ Automated rules engine
☑ Fraud analyst (1-2 FTE)

AML:
☑ Automated transaction monitoring
☑ EDD program
☑ Dedicated compliance (2-3 FTE)
☑ Regular independent testing

CONTENT:
☑ ML classification (basic)
☑ Photo/image analysis
☑ Tiered review queue
☑ Moderators (5-10 FTE)

REGULATORY:
☑ Formal compliance program
☑ Regular audits (annual)
☑ Regulatory tracking
☑ Compliance team (3-5 FTE)

INFRASTRUCTURE:
☑ Multi-AZ deployment
☑ Auto-scaling
☑ 24/7 monitoring
☑ Formal incident response

FINANCIAL:
☑ Enhanced insurance ($5M+)
☑ Weekly reconciliation
☑ Audit trail enhancement

PEOPLE:
☑ Formal hiring process
☑ Training programs
☑ Management layer
☑ HR function (2-3 FTE)

ESTIMATED ADDITIONAL COST: $500K-$2M/year
TOTAL: $600K-$2.5M/year
```

### 13.3 Tier 3 Upgrade (1M-10M Users)

```
TIER 3 MANDATORY CONTROLS (In addition to Tier 2)

FRAUD:
☑ ML fraud detection (advanced)
☑ Graph analysis
☑ Consortium data sharing
☑ Fraud team (10-20 FTE)

AML:
☑ Enterprise TMS
☑ Case management system
☑ Regulatory relationships
☑ AML team (15-30 FTE)
☑ Examiner-ready posture

CONTENT:
☑ Advanced ML classification
☑ Trust & Safety team (30-50 FTE)
☑ External partnerships (NCMEC, etc.)
☑ Transparency reporting

REGULATORY:
☑ Chief Compliance Officer role
☑ Regulatory affairs function
☑ Multi-regulator management
☑ Compliance org (20-40 FTE)

INFRASTRUCTURE:
☑ Multi-region deployment
☑ Disaster recovery tested
☑ 24/7 NOC
☑ SRE team (10-20 FTE)

FINANCIAL:
☑ Major insurance ($50M+)
☑ Daily reconciliation
☑ Multiple custodians
☑ Treasury function

PEOPLE:
☑ HR department
☑ Leadership development
☑ Succession planning
☑ HR org (10-20 FTE)

ESTIMATED ADDITIONAL COST: $3M-$10M/year
TOTAL: $3.5M-$12M/year
```

### 13.4 Tier 4 Upgrade (10M-100M Users)

```
TIER 4 MANDATORY CONTROLS (In addition to Tier 3)

FRAUD:
☑ Real-time ML
☑ Behavioral biometrics
☑ Fraud consortium leadership
☑ Fraud org (50-100 FTE)

AML:
☑ Bank-level BSA program
☑ Examiner relationships
☑ Consent order prevention
☑ AML org (100-200 FTE)

CONTENT:
☑ Industry-leading AI
☑ Large T&S org (150-250 FTE)
☑ Law enforcement liaison
☑ Proactive threat hunting

REGULATORY:
☑ Dedicated regulatory team
☑ Agency relationships
☑ Policy co-development
☑ Compliance org (75-150 FTE)

INFRASTRUCTURE:
☑ Active-active global
☑ Zero-downtime deployment
☑ Global NOC 24/7
☑ SRE org (50-100 FTE)

FINANCIAL:
☑ $100M+ insurance
☑ Real-time reconciliation
☑ Distributed custody
☑ Treasury org (10-20 FTE)

PEOPLE:
☑ Enterprise HR
☑ Executive development
☑ Talent analytics
☑ HR org (50-100 FTE)

ESTIMATED ADDITIONAL COST: $15M-$50M/year
TOTAL: $18M-$60M/year
```

### 13.5 Tier 5 Upgrade (100M+ Users)

```
TIER 5 MANDATORY CONTROLS (In addition to Tier 4)

☑ Industry standard-setting role
☑ Regulatory co-development
☑ Academic/research partnerships
☑ Full transparency reporting
☑ Board-level risk governance
☑ Central bank relationships (where applicable)
☑ Crisis management capability
☑ Industry consortium leadership
☑ Global policy engagement
☑ Multi-stakeholder governance

ESTIMATED ADDITIONAL COST: $50M-$150M+/year
TOTAL: $70M-$200M+/year
```

---

## 14. Transition Risk Windows

### 14.1 Critical Transition Periods

```
DANGER ZONES: TRANSITION RISK

Tier 0→1 (10K users):
• Risk: Outgrowing founder capacity
• Mitigation: Hire first dedicated team before hitting limit

Tier 1→2 (100K users):
• Risk: Manual processes break
• Mitigation: Automation must precede growth

Tier 2→3 (1M users):
• Risk: Regulatory attention without readiness
• Mitigation: Build compliance before triggering scrutiny

Tier 3→4 (10M users):
• Risk: Organizational strain
• Mitigation: Scale people ahead of growth

Tier 4→5 (100M users):
• Risk: Becoming systemically important unprepared
• Mitigation: Treat as critical infrastructure early
```

### 14.2 Control Implementation Timeline

| Transition | Lead Time Required |
| :--- | :--- |
| Tier 0→1 | 3-6 months before |
| Tier 1→2 | 6-12 months before |
| Tier 2→3 | 12-18 months before |
| Tier 3→4 | 18-24 months before |
| Tier 4→5 | 24-36 months before |

---

## 15. Attestation

```
This risk assessment has been reviewed and acknowledged.

Chief Risk Officer:          _______________________  Date: _______
Chief Executive Officer:     _______________________  Date: _______
Chief Technology Officer:    _______________________  Date: _______
Board Risk Committee Chair:  _______________________  Date: _______
```

---
**Document Version:** 1.0
**Classification:** CONFIDENTIAL — Risk Committee Only
**Next Review:** Quarterly or upon tier transition
