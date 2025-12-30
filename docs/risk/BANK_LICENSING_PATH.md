# BANK LICENSING PATH â€” RISK & COMPLIANCE SPECIFICATION
## Regulatory Readiness, Risk Register & Decision Criteria

**Platform:** Mnbarh  
**Document:** Bank Licensing Compliance Assessment  
**Date:** December 20, 2025  
**Classification:** Internal â€” Legal, Compliance & Executive

---

# 1. LICENSING READINESS CHECKLIST

## 1.1 KYC / KYB Maturity

| Requirement | Current State | Target State | Gap | Priority |
|-------------|---------------|--------------|-----|----------|
| **Individual Identity Verification** | | | | |
| âکگ Government ID verification (automated) | â€” | Required | â€” | Critical |
| âکگ Liveness detection (biometric) | â€” | Required | â€” | Critical |
| âکگ Address verification (utility bill/bank statement) | â€” | Required | â€” | High |
| âکگ PEP/Sanctions screening | â€” | Required | â€” | Critical |
| âکگ Adverse media screening | â€” | Required | â€” | High |
| âکگ Ongoing monitoring (re-verification) | â€” | Annual minimum | â€” | Medium |
| **Business Verification (Travelers as Merchants)** | | | | |
| âکگ Business registration verification | â€” | Required if > $10K/year | â€” | High |
| âکگ Beneficial ownership identification | â€” | Required if > $10K/year | â€” | High |
| âکگ Ultimate beneficial owner (UBO) verification | â€” | 25%+ ownership threshold | â€” | High |
| âکگ Business address verification | â€” | Required | â€” | Medium |
| **Documentation** | | | | |
| âکگ KYC policy document | â€” | Board-approved | â€” | Critical |
| âکگ Customer acceptance policy | â€” | Documented | â€” | Critical |
| âکگ Risk-based approach documentation | â€” | Required | â€” | Critical |
| âکگ Record retention policy (5+ years) | â€” | Required | â€” | Critical |

**Maturity Scoring:**

| Level | Description | Readiness |
|-------|-------------|-----------|
| Level 1 | Manual KYC, no automation | Not Ready |
| Level 2 | Automated ID verification, manual PEP | Partially Ready |
| Level 3 | Full automation + ongoing monitoring | Ready for PSP |
| Level 4 | Real-time screening + risk scoring | Ready for EMI |
| Level 5 | Predictive risk + behavioral analysis | Bank-grade |

---

## 1.2 AML Monitoring

| Requirement | Current State | Target State | Gap | Priority |
|-------------|---------------|--------------|-----|----------|
| **Transaction Screening** | | | | |
| âکگ Real-time sanctions list screening | â€” | Required | â€” | Critical |
| âکگ Watchlist screening (OFAC, EU, UN) | â€” | Required | â€” | Critical |
| âکگ PEP transaction flagging | â€” | Required | â€” | Critical |
| âکگ Cross-border transaction monitoring | â€” | Required | â€” | Critical |
| **Pattern Detection** | | | | |
| âکگ Structuring detection (threshold avoidance) | â€” | Required | â€” | High |
| âکگ Velocity anomaly detection | â€” | Required | â€” | High |
| âکگ Round-trip payment detection | â€” | Required | â€” | High |
| âکگ Unusual pattern flagging | â€” | Required | â€” | Medium |
| **Case Management** | | | | |
| âکگ Alert investigation workflow | â€” | Required | â€” | Critical |
| âکگ Case documentation system | â€” | Required | â€” | Critical |
| âکگ Escalation procedures | â€” | Required | â€” | Critical |
| âکگ Management reporting | â€” | Monthly | â€” | High |
| **Personnel** | | | | |
| âکگ Designated MLRO (Money Laundering Reporting Officer) | â€” | Required | â€” | Critical |
| âکگ AML-trained staff | â€” | 100% relevant staff | â€” | Critical |
| âکگ Annual AML training program | â€” | Required | â€” | High |

---

## 1.3 Transaction Monitoring

| Requirement | Current State | Target State | Gap | Priority |
|-------------|---------------|--------------|-----|----------|
| **Threshold Monitoring** | | | | |
| âکگ Single transaction threshold (> $3,000) | â€” | Auto-flag | â€” | Critical |
| âکگ Aggregate threshold (> $10,000 / 30 days) | â€” | Auto-flag | â€” | Critical |
| âکگ Cross-border threshold (> $1,000) | â€” | Enhanced review | â€” | High |
| âکگ High-risk corridor monitoring | â€” | Real-time | â€” | Critical |
| **Behavioral Monitoring** | | | | |
| âکگ Unusual transaction timing | â€” | Flagging | â€” | Medium |
| âکگ Deviation from stated purpose | â€” | Flagging | â€” | High |
| âکگ Geographic inconsistencies | â€” | Flagging | â€” | High |
| âکگ Dormant account reactivation | â€” | Flagging | â€” | Medium |
| **System Capabilities** | | | | |
| âکگ Real-time transaction monitoring | â€” | Required | â€” | Critical |
| âکگ Historical transaction analysis | â€” | 5+ year lookback | â€” | High |
| âکگ Link analysis (network detection) | â€” | Required | â€” | High |
| âکگ Risk scoring per transaction | â€” | Required | â€” | Medium |

---

## 1.4 Reporting Obligations

| Requirement | Current State | Target State | Gap | Priority |
|-------------|---------------|--------------|-----|----------|
| **Suspicious Activity Reports (SAR)** | | | | |
| âکگ SAR filing capability | â€” | Required | â€” | Critical |
| âکگ SAR filing within regulatory timeline (24-72hr) | â€” | Required | â€” | Critical |
| âکگ SAR documentation retention (5+ years) | â€” | Required | â€” | Critical |
| âکگ Tipping-off prevention training | â€” | Required | â€” | Critical |
| **Regulatory Reports** | | | | |
| âکگ Currency Transaction Reports (CTR) if applicable | â€” | Per jurisdiction | â€” | High |
| âکگ Cross-border transfer reports | â€” | Required | â€” | High |
| âکگ Annual AML compliance report | â€” | Required | â€” | High |
| âکگ Quarterly risk assessment report | â€” | Required | â€” | Medium |
| **Internal Reports** | | | | |
| âکگ Board-level AML reporting | â€” | Quarterly | â€” | High |
| âکگ MLRO activity report | â€” | Monthly | â€” | High |
| âکگ Training completion reports | â€” | Annual | â€” | Medium |
| âکگ Audit findings tracking | â€” | Ongoing | â€” | High |

---

# 2. REGULATORY SCOPE BOUNDARIES

## 2.1 Platform MAY Do (Without License)

| Activity | Scope | Conditions | Regulatory Basis |
|----------|-------|------------|------------------|
| **Marketplace facilitation** | Connect buyers and travelers | No custody of funds | Agent exemption |
| **Payment initiation** | Initiate payments to PSP | Funds flow directly to PSP | PISP model |
| **Escrow display** | Show escrow status to users | Actual custody with bank/PSP | Information service |
| **KYC collection** | Collect identity documents | Forward to licensed PSP for verification | Data processor |
| **Transaction matching** | Match buyer requests to travelers | No financial advice | Marketplace |
| **Fee calculation** | Calculate and display fees | Actual collection by PSP | Information service |
| **Dispute coordination** | Facilitate dispute evidence collection | Fund decision executed by PSP | Customer support |
| **Compliance screening** | Run sanctions/PEP checks | As agent of licensed PSP | Delegated screening |

**Key Limitations:**
- âکگ NO holding funds in platform accounts
- âکگ NO custody without license
- âکگ NO payment processing without PSP
- âکگ NO issuing payment instruments

---

## 2.2 Platform MAY NOT Do (Without License)

| Activity | Prohibition Reason | Consequence if Violated | Mitigation |
|----------|-------------------|-------------------------|------------|
| **Hold customer funds** | Money transmission | License revocation, fines, criminal liability | Use licensed PSP escrow |
| **Issue wallets (actual)** | E-money issuance | EMI license required | Display-only wallet (PSP backend) |
| **Process payments directly** | Payment services | PSD2/payment license required | Route through PSP |
| **Guarantee fund availability** | Banking activity | Banking license required | Disclaimer: "Subject to PSP" |
| **Provide credit/loans** | Lending activity | Lending license required | No credit features |
| **Exchange currencies** | FX services | FX/EMI license required | Use PSP FX services |
| **Investment advice** | Investment services | MiFID authorization | No investment features |
| **Insurance services** | Insurance products | Insurance license required | Partner with insurer |

**Violation Consequences:**

| Severity | Consequence |
|----------|-------------|
| Minor | Regulatory warning, compliance order |
| Moderate | Fines (up to 4% of turnover), cease and desist |
| Severe | License denial, criminal investigation, executive liability |
| Critical | Platform shutdown, asset freezing, prosecution |

---

## 2.3 Platform MUST Delegate to Bank/PSP

| Function | Delegation Target | SLA Requirement | Fallback |
|----------|-------------------|-----------------|----------|
| **Fund custody** | Licensed PSP / EMI | 99.9% availability | Secondary PSP |
| **Fund movement** | Licensed PSP | T+0 to T+1 settlement | Manual processing |
| **IBAN/account issuance** | Banking partner | Per agreement | Alternative PSP |
| **Card issuance** | Card issuing bank | Per agreement | Virtual cards only |
| **FX conversion** | Licensed FX provider | Real-time rates | Fixed rate fallback |
| **Chargeback handling** | Acquiring bank | 45-day SLA | Direct user refund |
| **SAR filing** | MLRO + PSP | Per regulation (24-72hr) | Platform MLRO files |
| **Transaction reporting** | PSP | Per regulation | Mirror reporting |
| **Sanctions screening** | PSP (or delegated) | Real-time | Platform backup screening |
| **Fund recovery** | Bank / Legal | Per case | Insurance claim |

**Delegation Documentation Required:**

| Document | Purpose | Update Frequency |
|----------|---------|------------------|
| PSP Agreement | Define responsibilities | Annual review |
| Outsourcing register | Track delegated functions | Quarterly |
| SLA monitoring report | Track PSP performance | Monthly |
| Contingency plan | Fallback procedures | Annual review |
| Regulatory notification | Inform regulator of outsourcing | As required |

---

# 3. RISK REGISTER

## 3.1 AML Breach

| Risk ID | Risk Description | Likelihood | Impact | Control | Control Owner | Residual Risk |
|---------|------------------|------------|--------|---------|---------------|---------------|
| AML-001 | Failure to detect money laundering | Medium | Critical | Real-time transaction monitoring | MLRO | Medium |
| AML-002 | Failure to file SAR on time | Low | High | Automated SAR deadline tracking | MLRO | Low |
| AML-003 | Inadequate customer due diligence | Medium | High | Risk-based CDD tiering | Compliance | Medium |
| AML-004 | Sanctions evasion through platform | Low | Critical | Real-time sanctions screening | Compliance | Low |
| AML-005 | Staff tipping off customer | Low | Critical | Annual training + monitoring | HR + Compliance | Low |
| AML-006 | Incomplete audit trail | Low | High | Immutable logging system | IT + Compliance | Low |

**AML Controls:**

| Control | Description | Testing Frequency |
|---------|-------------|-------------------|
| Transaction monitoring system | Automated pattern detection | Continuous |
| Sanctions screening | Real-time OFAC/EU/UN checks | Continuous |
| SAR workflow | Structured reporting process | Monthly testing |
| Training program | Annual AML certification | Annual |
| Independent audit | External AML audit | Annual |

---

## 3.2 Custody Risk

| Risk ID | Risk Description | Likelihood | Impact | Control | Control Owner | Residual Risk |
|---------|------------------|------------|--------|---------|---------------|---------------|
| CUS-001 | PSP insolvency | Low | Critical | Multi-PSP strategy + insurance | Finance + Legal | Medium |
| CUS-002 | Unauthorized fund access | Low | Critical | Segregated accounts + dual control | Finance | Low |
| CUS-003 | Commingling of funds | Low | Critical | Segregation policy + reconciliation | Finance | Low |
| CUS-004 | Settlement failure | Medium | High | Reconciliation + escalation | Finance | Medium |
| CUS-005 | PSP license revocation | Low | Critical | PSP due diligence + backup PSP | Legal + Finance | Low |
| CUS-006 | Cyber theft from PSP | Low | Critical | PSP security audit + cyber insurance | IT + Finance | Medium |

**Custody Controls:**

| Control | Description | Testing Frequency |
|---------|-------------|-------------------|
| Segregation verification | PSP provides segregation evidence | Quarterly |
| Reconciliation | Daily settlement reconciliation | Daily |
| PSP due diligence | Annual PSP financial review | Annual |
| Insurance coverage | Verify PSP fidelity bond | Annual |
| Backup PSP readiness | Test failover capability | Semi-annual |

---

## 3.3 Liquidity Risk

| Risk ID | Risk Description | Likelihood | Impact | Control | Control Owner | Residual Risk |
|---------|------------------|------------|--------|---------|---------------|---------------|
| LIQ-001 | Insufficient funds to cover payouts | Low | Critical | Minimum reserve policy | Finance | Low |
| LIQ-002 | Mass withdrawal event | Low | High | Withdrawal limits + staging | Finance | Medium |
| LIQ-003 | PSP delayed settlement | Medium | Medium | Multi-day float buffer | Finance | Low |
| LIQ-004 | FX exposure on cross-border | Medium | Medium | Hedging policy + rate buffers | Finance | Medium |
| LIQ-005 | Chargeback wave | Low | High | Chargeback reserve fund | Finance | Medium |
| LIQ-006 | Regulatory freeze order | Low | Critical | Legal contingency + communication plan | Legal | Medium |

**Liquidity Controls:**

| Control | Description | Threshold |
|---------|-------------|-----------|
| Minimum reserve | Maintain X% of escrow balance | 10% minimum |
| Withdrawal staging | Large withdrawals require 24-48hr | > $5,000 |
| Float monitoring | Daily liquidity dashboard | 3-day minimum float |
| Chargeback reserve | Set aside for potential chargebacks | 2% of GMV |
| Stress testing | Quarterly liquidity stress tests | N/A |

---

## 3.4 Fraud Exposure

| Risk ID | Risk Description | Likelihood | Impact | Control | Control Owner | Residual Risk |
|---------|------------------|------------|--------|---------|---------------|---------------|
| FRD-001 | Account takeover | Medium | High | 2FA + device fingerprinting | IT | Medium |
| FRD-002 | Fake delivery confirmation | Medium | Medium | Dual confirmation + evidence | Trust | Medium |
| FRD-003 | Collusion (buyer + traveler) | Low | Medium | Pattern detection + graph analysis | Trust | Low |
| FRD-004 | Identity fraud (synthetic ID) | Medium | High | Enhanced ID verification | Compliance | Medium |
| FRD-005 | Payment fraud (stolen cards) | Medium | High | 3DS + card fingerprinting | Finance | Medium |
| FRD-006 | Internal fraud (employee) | Low | Critical | Dual control + segregation of duties | HR + Finance | Low |

**Fraud Controls:**

| Control | Description | Testing Frequency |
|---------|-------------|-------------------|
| Identity verification | Automated + manual review | Continuous |
| Device fingerprinting | Track device across accounts | Continuous |
| Transaction limits | Tiered by verification level | Continuous |
| Internal controls | Dual approval for fund release | Continuous |
| Fraud monitoring | Real-time fraud scoring | Continuous |

---

## 3.5 Regulatory Breach

| Risk ID | Risk Description | Likelihood | Impact | Control | Control Owner | Residual Risk |
|---------|------------------|------------|--------|---------|---------------|---------------|
| REG-001 | Operating without required license | Low | Critical | Legal review + regulatory mapping | Legal | Low |
| REG-002 | Non-compliance with PSP terms | Medium | High | SLA monitoring + audit | Compliance | Medium |
| REG-003 | Data protection breach (GDPR) | Medium | High | DPO + privacy program | Legal + IT | Medium |
| REG-004 | Consumer protection violation | Medium | Medium | Complaint handling + T&C review | Legal | Medium |
| REG-005 | Cross-border licensing gap | Medium | High | Jurisdiction-by-jurisdiction review | Legal | Medium |
| REG-006 | Regulatory examination failure | Low | High | Exam readiness program | Compliance | Low |

**Regulatory Controls:**

| Control | Description | Testing Frequency |
|---------|-------------|-------------------|
| Regulatory mapping | Track licensing requirements per market | Quarterly |
| Compliance calendar | Track filing deadlines | Continuous |
| Policy review | Update policies to regulations | Semi-annual |
| Exam readiness | Mock regulatory exams | Annual |
| Legal monitoring | Track regulatory changes | Continuous |

---

# 4. GO / NO-GO CRITERIA

## 4.1 When to Apply for EMI License

| Criterion | Threshold | Evidence Required | Status |
|-----------|-----------|-------------------|--------|
| **Volume** | | | |
| âکگ Monthly transaction volume | > $1M / month sustained 6 months | Transaction reports | â€” |
| âکگ Active users | > 10,000 monthly active | User metrics | â€” |
| âکگ Cross-border volume | > 30% of transactions | Transaction reports | â€” |
| **Operational Maturity** | | | |
| âکگ KYC Level 4 achieved | Full automation + ongoing monitoring | Audit report | â€” |
| âکگ AML program established | MLRO + training + SAR capability | Policy documents | â€” |
| âکگ Dispute resolution SLA | < 7 days average resolution | Case metrics | â€” |
| âکگ Fraud rate | < 0.5% of GMV | Fraud reports | â€” |
| **Financial Readiness** | | | |
| âکگ Initial capital | â‚¬350,000 (EU EMI) or jurisdiction equivalent | Bank statement | â€” |
| âکگ Ongoing capital | 2% of average outstanding e-money | Financial projections | â€” |
| âکگ Insurance/guarantee | Per regulatory requirements | Insurance policy | â€” |
| **Governance** | | | |
| âکگ Board with regulatory experience | At least 1 director | CVs | â€” |
| âکگ Compliance officer appointed | Full-time, qualified | Employment contract | â€” |
| âکگ MLRO appointed | Full-time, qualified | Employment contract | â€” |
| âکگ External audit | Big 4 or equivalent | Engagement letter | â€” |

**EMI Application GO = ALL criteria met**

---

## 4.2 When to Stay with PSP

| Condition | Recommendation | Reasoning |
|-----------|----------------|-----------|
| Monthly volume < $500K | **Stay with PSP** | EMI overhead not justified |
| Single market focus | **Stay with PSP** | Passport benefits not needed |
| < 5,000 active users | **Stay with PSP** | Scale insufficient |
| Fraud rate > 1% | **Stay with PSP** | Clean up before applying |
| No dedicated compliance staff | **Stay with PSP** | Not operationally ready |
| PSP fees < 2% of revenue | **Stay with PSP** | Cost savings don't justify |
| < 2 years operating history | **Stay with PSP** | Regulators prefer track record |
| Pending regulatory issues | **Stay with PSP** | Resolve before applying |
| Capital unavailable | **Stay with PSP** | Cannot meet requirements |
| Management bandwidth limited | **Stay with PSP** | Application is resource-intensive |

**PSP Strategy Table:**

| Phase | Volume | Strategy | Focus |
|-------|--------|----------|-------|
| Launch | $0 - $100K/mo | Single PSP | Product-market fit |
| Growth | $100K - $500K/mo | Primary PSP + backup | Operational excellence |
| Scale | $500K - $1M/mo | Multi-PSP + EMI evaluation | Compliance maturity |
| Mature | > $1M/mo | EMI application | Licensing |

---

## 4.3 Red Flags to Stop Licensing

| Red Flag | Severity | Action | Remediation Required |
|----------|----------|--------|----------------------|
| **Regulatory** | | | |
| Pending regulatory investigation | Critical | STOP | Investigation closed, no adverse finding |
| Cease and desist order | Critical | STOP | Order lifted + clean slate |
| SAR filing history issues | High | PAUSE | External audit + remediation |
| Regulatory warning in past 24 months | High | PAUSE | Warning addressed + evidence |
| **Operational** | | | |
| Data breach in past 12 months | High | PAUSE | Remediation complete + reaudit |
| Fraud rate > 2% | High | PAUSE | Reduce to < 0.5% |
| AML audit failure | Critical | STOP | Pass external AML audit |
| Significant operational incident | Medium | PAUSE | Root cause + remediation |
| **Financial** | | | |
| Insufficient capital | Critical | STOP | Secure funding |
| Negative cash flow (unsustainable) | High | PAUSE | Path to profitability |
| PSP relationship issues | High | PAUSE | Resolve or new PSP |
| Pending litigation (material) | High | PAUSE | Litigation resolved |
| **Governance** | | | |
| Key person with regulatory sanctions | Critical | STOP | Person removed |
| Board lacks financial services experience | High | PAUSE | Add qualified director |
| No dedicated compliance function | High | PAUSE | Hire compliance team |
| Ownership structure unclear | Critical | STOP | Clarify UBO structure |

**Red Flag Assessment:**

| Assessment | Meaning | Timeline |
|------------|---------|----------|
| STOP | Do not proceed with application | Until resolved |
| PAUSE | Delay application until resolved | 3-6 months minimum |
| PROCEED WITH CAUTION | Can apply but disclose issue | Active monitoring |
| CLEAR | No red flags, proceed | Immediate |

---

# DECISION MATRIX

| Metric | Stay with PSP | Evaluate EMI | Apply for EMI |
|--------|---------------|--------------|---------------|
| Monthly Volume | < $500K | $500K - $1M | > $1M |
| Active Users | < 5,000 | 5,000 - 10,000 | > 10,000 |
| Markets | 1-2 | 3-5 | 5+ |
| Fraud Rate | > 1% | 0.5% - 1% | < 0.5% |
| KYC Maturity | Level 1-2 | Level 3 | Level 4-5 |
| PSP Fee Burden | < 2% rev | 2-4% rev | > 4% rev |
| Capital Available | No | Partial | Yes |
| Compliance Team | No | Partial | Yes |
| Operating History | < 1 year | 1-2 years | > 2 years |
| Red Flags | Any STOP | Any PAUSE | CLEAR |

---

# LICENSING TIMELINE ESTIMATE

| Phase | Duration | Key Activities |
|-------|----------|----------------|
| **Readiness Assessment** | 2-3 months | Gap analysis, remediation planning |
| **Remediation** | 3-6 months | Address gaps, build compliance function |
| **Application Preparation** | 2-3 months | Drafting, documentation, board approval |
| **Regulatory Submission** | 1 month | Submit + respond to initial queries |
| **Regulatory Review** | 6-12 months | Q&A, site visits, additional documentation |
| **Authorization** | 1 month | Final approval + conditions |
| **Post-Authorization** | 3 months | Operational readiness + go-live |

**Total Estimate: 18-30 months from decision to licensed operation**

---

# OWNER MATRIX

| Domain | Primary Owner | Secondary Owner | Escalation |
|--------|---------------|-----------------|------------|
| KYC/KYB | Compliance Officer | MLRO | Legal Counsel |
| AML | MLRO | Compliance Officer | CEO |
| Transaction Monitoring | MLRO | Finance Controller | Compliance Officer |
| Reporting | MLRO | Compliance Officer | CEO |
| Licensing Decision | CEO | Legal Counsel | Board |
| Risk Register | Compliance Officer | Finance Controller | CEO |
| PSP Relationship | Finance Controller | Legal Counsel | CEO |
| Capital Planning | CFO | CEO | Board |

---

**Document Owner:** Legal & Compliance  
**Version:** 1.0  
**Classification:** Internal â€” Restricted Distribution  
**Date:** December 20, 2025

