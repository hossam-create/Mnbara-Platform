# PSP EVALUATION â€” RISK & COMPLIANCE MATRIX
## Payment Service Provider Risk Assessment

**Platform:** Mnbarh  
**Document:** PSP Risk & Compliance Evaluation  
**Date:** December 20, 2025  
**Classification:** Internal â€” Finance, Risk & Compliance

---

# 1. LICENSING COVERAGE PER PSP

## 1.1 Global PSP Licensing Matrix

| PSP | EU (PSD2/EMI) | UK (FCA) | US (MTL) | UAE (CBUAE) | MENA | Escrow License | FX License |
|-----|---------------|----------|----------|-------------|------|----------------|------------|
| **Stripe** | âœ“ (Ireland EMI) | âœ“ | âœ“ (49 states) | âœ— | Limited | âœ— | âœ“ (via partners) |
| **PayPal** | âœ“ (Luxembourg) | âœ“ | âœ“ | âœ— | Limited | âœ— | âœ“ |
| **Adyen** | âœ“ (Netherlands) | âœ“ | âœ“ | âœ“ | âœ“ | âœ“ (custom) | âœ“ |
| **Checkout.com** | âœ“ (UK/EU) | âœ“ | âœ“ | âœ“ | âœ“ | âœ— | âœ“ |
| **Payoneer** | âœ“ | âœ“ | âœ“ | âœ“ | âœ“ | âœ“ | âœ“ |
| **Wise (TransferWise)** | âœ“ (Belgium) | âœ“ | âœ“ | âœ“ | Limited | âœ— | âœ“ |
| **Rapyd** | âœ“ | âœ“ | âœ“ | âœ“ | âœ“ | âœ“ | âœ“ |
| **HyperPay** | âœ— | âœ— | âœ— | âœ“ | âœ“ (MENA focus) | âœ— | Limited |
| **Tap Payments** | âœ— | âœ— | âœ— | âœ“ | âœ“ (GCC) | âœ— | âœ“ (GCC) |
| **PayTabs** | âœ— | âœ— | âœ— | âœ“ | âœ“ (MENA) | âœ— | Limited |

## 1.2 License Risk Rating

| PSP | Geographic Coverage | License Depth | Regulatory Risk | Overall Rating |
|-----|---------------------|---------------|-----------------|----------------|
| **Stripe** | High (45+ countries) | Medium | Low | â­گâ­گâ­گâ­گ |
| **PayPal** | Very High (200+ countries) | High | Low | â­گâ­گâ­گâ­گâ­گ |
| **Adyen** | Very High | Very High | Very Low | â­گâ­گâ­گâ­گâ­گ |
| **Checkout.com** | High | High | Low | â­گâ­گâ­گâ­گ |
| **Payoneer** | High | High | Low | â­گâ­گâ­گâ­گ |
| **Wise** | High | Medium | Low | â­گâ­گâ­گâ­گ |
| **Rapyd** | High | High | Low | â­گâ­گâ­گâ­گ |
| **HyperPay** | Low (MENA only) | Medium | Medium | â­گâ­گâ­گ |
| **Tap Payments** | Low (GCC only) | Medium | Medium | â­گâ­گâ­گ |
| **PayTabs** | Low (MENA only) | Medium | Medium | â­گâ­گâ­گ |

## 1.3 Escrow Capability Matrix

| PSP | Native Escrow | Marketplace Split | Hold & Release | Escrow License | Platform Risk |
|-----|---------------|-------------------|----------------|----------------|---------------|
| **Stripe Connect** | âœ“ | âœ“ | âœ“ | Via Stripe | Low |
| **PayPal Commerce** | âœ“ | âœ“ | âœ“ | Via PayPal | Low |
| **Adyen for Platforms** | âœ“ | âœ“ | âœ“ | Own license | Very Low |
| **Checkout.com Split** | âœ“ | âœ“ | âœ“ | Via partners | Low |
| **Payoneer Escrow** | âœ“ | âœ“ | âœ“ | Own license | Low |
| **Rapyd Collect** | âœ“ | âœ“ | âœ“ | Own license | Low |
| **HyperPay** | âœ— | Limited | âœ— | N/A | High |
| **Tap Payments** | âœ— | Limited | âœ— | N/A | High |
| **PayTabs** | âœ— | Limited | âœ— | N/A | High |

---

# 2. AML / KYC RESPONSIBILITIES SPLIT

## 2.1 KYC Responsibility Matrix

| Responsibility | Platform | PSP | Shared | Notes |
|----------------|----------|-----|--------|-------|
| **User identity collection** | âœ“ | â€” | â€” | Platform collects data |
| **ID verification** | Optional | âœ“ | âœ“ | PSP provides verification API |
| **Liveness check** | Optional | âœ“ | âœ“ | PSP or third-party |
| **Address verification** | âœ“ | âœ“ | âœ“ | Either party |
| **PEP screening** | â€” | âœ“ | âœ“ | PSP mandatory |
| **Sanctions screening** | â€” | âœ“ | â€” | PSP handles |
| **Ongoing monitoring** | âœ“ | âœ“ | âœ“ | Both parties |
| **EDD (Enhanced Due Diligence)** | âœ“ | âœ“ | âœ“ | Platform triggers, PSP may require |
| **Risk classification** | âœ“ | âœ“ | âœ“ | Both classify independently |
| **Record retention** | âœ“ | âœ“ | â€” | Both must retain |

## 2.2 AML Responsibility Matrix

| Responsibility | Platform | PSP | Shared | Notes |
|----------------|----------|-----|--------|-------|
| **Transaction monitoring** | âœ“ | âœ“ | âœ“ | Both monitor |
| **Threshold alerts** | âœ“ | âœ“ | âœ“ | Platform sets, PSP enforces |
| **Pattern detection** | âœ“ | âœ“ | âœ“ | Both detect |
| **SAR preparation** | âœ“ | â€” | âœ“ | Platform prepares |
| **SAR filing** | â€” | âœ“ | âœ“ | PSP files (or platform if licensed) |
| **Regulatory reporting** | â€” | âœ“ | â€” | PSP handles |
| **MLRO function** | Recommended | âœ“ | âœ“ | Platform should have internal MLRO |
| **Training** | âœ“ | âœ“ | â€” | Both train staff |
| **Policy documentation** | âœ“ | âœ“ | â€” | Both maintain |

## 2.3 PSP-Specific AML/KYC Support

| PSP | KYC API | ID Verification | PEP/Sanctions | AML Monitoring | SAR Filing |
|-----|---------|-----------------|---------------|----------------|------------|
| **Stripe** | âœ“ Identity | âœ“ | âœ“ | âœ“ Radar | PSP files |
| **PayPal** | Limited | Via PayPal | âœ“ | âœ“ Built-in | PSP files |
| **Adyen** | âœ“ Verify | âœ“ | âœ“ | âœ“ RevenueProtect | PSP files |
| **Checkout.com** | âœ“ | âœ“ via partners | âœ“ | âœ“ | PSP files |
| **Payoneer** | âœ“ | âœ“ | âœ“ | âœ“ | PSP files |
| **Wise** | âœ“ | âœ“ | âœ“ | âœ“ | PSP files |
| **Rapyd** | âœ“ | âœ“ | âœ“ | âœ“ | PSP files |
| **HyperPay** | Limited | Limited | âœ“ | Limited | Platform may need to file |
| **Tap Payments** | Limited | Limited | âœ“ | Limited | Platform may need to file |

## 2.4 Liability Split

| Scenario | Platform Liable | PSP Liable | Shared | Notes |
|----------|-----------------|------------|--------|-------|
| Failed KYC (user not verified) | âœ“ | â€” | â€” | Platform must verify |
| Missed sanctions match | â€” | âœ“ | â€” | PSP responsible |
| AML breach (structuring undetected) | âœ“ | âœ“ | âœ“ | Both liable |
| SAR not filed | â€” | âœ“ | âœ“ | PSP primary, platform secondary |
| Data breach (KYC data) | âœ“ | â€” | âœ“ | Depends on breach location |
| Regulatory fine (AML failure) | âœ“ | âœ“ | âœ“ | Regulator may fine both |

---

# 3. CHARGEBACK & DISPUTE HANDLING

## 3.1 Chargeback Responsibility Matrix

| Stage | Platform Responsibility | PSP Responsibility |
|-------|------------------------|---------------------|
| **Prevention** | Fraud detection, 3DS enforcement, user verification | 3DS infrastructure, card network rules |
| **Notification** | Receive alert, notify user | Transmit chargeback from bank |
| **Evidence gathering** | Collect transaction proof, delivery evidence | Provide submission interface |
| **Response filing** | Prepare defense package | Submit to card network |
| **Arbitration** | Support if escalated | Handle card network arbitration |
| **Fund recovery** | Debit user if lost | Execute fund movement |
| **Reporting** | Internal chargeback metrics | Network compliance reporting |

## 3.2 Chargeback Protection Comparison

| PSP | Chargeback Fee | Protection Offered | Liability Shift (3DS) | Dispute SLA | Fraud Tools |
|-----|----------------|--------------------|-----------------------|-------------|-------------|
| **Stripe** | $15 | Chargeback Protection (fee) | âœ“ | 7-21 days | Radar |
| **PayPal** | $20 | Seller Protection | âœ“ | 10-30 days | Built-in |
| **Adyen** | â‚¬15 | RevenueProtect | âœ“ | 7-14 days | Risk engine |
| **Checkout.com** | $15 | Fraud Detection | âœ“ | 7-21 days | Fraud filters |
| **Payoneer** | $25 | Limited | âœ“ | 14-30 days | Basic |
| **Wise** | N/A (no cards) | N/A | N/A | N/A | N/A |
| **Rapyd** | $15-25 | Basic | âœ“ | 7-21 days | Basic |
| **HyperPay** | Variable | Limited | Limited | 14-30 days | Basic |
| **Tap Payments** | Variable | Limited | âœ“ | 14-30 days | Basic |

## 3.3 Dispute Resolution Matrix

| Dispute Type | Platform Role | PSP Role | Timeline | Escalation Path |
|--------------|---------------|----------|----------|-----------------|
| **User vs User** | Primary arbitrator | Hold funds | 14 days | Platform â†’ Legal |
| **User vs Platform** | Respond to complaint | May mediate | 30 days | Regulator |
| **Chargeback** | Gather evidence | File with network | Card network rules | Arbitration |
| **Fraud claim** | Investigate | Block/refund | 7-14 days | Law enforcement |
| **AML hold** | Cooperate | Execute hold | Regulatory | MLRO â†’ Regulator |

## 3.4 Chargeback Risk by PSP

| PSP | Chargeback Rate Threshold | Account Risk at Threshold | Mitigation Offered |
|-----|---------------------------|---------------------------|---------------------|
| **Stripe** | 0.75% | Warning | 1.0% â†’ Review | Radar rules, 3DS |
| **PayPal** | 1.0% | Review | 1.5% â†’ Restriction | Seller Protection |
| **Adyen** | 0.5% | Enhanced monitoring | 1.0% â†’ Action required | Risk engine |
| **Checkout.com** | 0.75% | Warning | 1.0% â†’ Review | Fraud filters |
| **Payoneer** | 1.0% | Review | 1.5% â†’ Hold | Limited |
| **Rapyd** | 0.75% | Warning | 1.0% â†’ Review | Basic |
| **HyperPay** | 1.5% | Review | 2.0% â†’ Action | Limited |
| **Tap Payments** | 1.5% | Review | 2.0% â†’ Action | Limited |

---

# 4. ACCOUNT FREEZE POWERS

## 4.1 Freeze Authority Matrix

| Freeze Trigger | Platform Can Freeze | PSP Can Freeze | Reversal Authority |
|----------------|---------------------|----------------|-------------------|
| **User dispute** | âœ“ (via PSP API) | âœ“ | Platform or PSP |
| **Chargeback received** | Auto | âœ“ | PSP (after resolution) |
| **AML flag** | âœ“ (request) | âœ“ | PSP Compliance |
| **Sanctions match** | N/A (PSP auto) | âœ“ (mandatory) | Legal only |
| **Fraud detection** | âœ“ (via API) | âœ“ | Platform or PSP |
| **Regulatory order** | N/A | âœ“ (mandatory) | Regulator/Court |
| **Terms violation** | âœ“ (request) | âœ“ | PSP |
| **Platform request** | âœ“ (initiate) | âœ“ (execute) | Platform |

## 4.2 PSP Freeze Powers Comparison

| PSP | Platform-Initiated Freeze | PSP-Unilateral Freeze | Freeze Notification | Freeze Appeal | Freeze Duration Limit |
|-----|---------------------------|----------------------|---------------------|---------------|----------------------|
| **Stripe** | âœ“ API | âœ“ | Email + Dashboard | âœ“ | 90 days (then review) |
| **PayPal** | âœ“ API | âœ“ (common) | Email | âœ“ | 180 days |
| **Adyen** | âœ“ API | âœ“ | Dashboard | âœ“ | Configurable |
| **Checkout.com** | âœ“ API | âœ“ | Email + Dashboard | âœ“ | 90 days |
| **Payoneer** | âœ“ | âœ“ | Email | âœ“ | 180 days |
| **Wise** | Limited | âœ“ | Email | âœ“ | Indefinite |
| **Rapyd** | âœ“ API | âœ“ | Email + API | âœ“ | Configurable |
| **HyperPay** | Limited | âœ“ | Email | Limited | Variable |
| **Tap Payments** | Limited | âœ“ | Email | Limited | Variable |

## 4.3 Freeze Risk Assessment

| PSP | Unilateral Freeze Risk | Business Impact | Predictability | Control Level |
|-----|------------------------|-----------------|----------------|---------------|
| **Stripe** | Medium | High (funds held) | High | Good API control |
| **PayPal** | High | Very High | Low (notorious) | Limited control |
| **Adyen** | Low | Medium | High | Excellent control |
| **Checkout.com** | Low | Medium | High | Good control |
| **Payoneer** | Medium | High | Medium | Medium control |
| **Wise** | Medium | Medium | Medium | Limited control |
| **Rapyd** | Low | Medium | High | Good control |
| **HyperPay** | Medium | Medium | Medium | Limited control |
| **Tap Payments** | Medium | Medium | Medium | Limited control |

## 4.4 Fund Access During Freeze

| PSP | Partial Freeze Possible | User Withdrawal During Freeze | Platform Access During Freeze | Interest/Fees During Freeze |
|-----|-------------------------|-------------------------------|-------------------------------|----------------------------|
| **Stripe** | âœ“ | âœ— | View only | No fees |
| **PayPal** | âœ— (usually full) | âœ— | View only | No fees |
| **Adyen** | âœ“ | Configurable | Full API access | No fees |
| **Checkout.com** | âœ“ | âœ— | View only | No fees |
| **Payoneer** | âœ“ | âœ— | View only | No fees |
| **Wise** | âœ— | âœ— | View only | No fees |
| **Rapyd** | âœ“ | Configurable | Full API access | No fees |
| **HyperPay** | âœ— | âœ— | View only | Variable |
| **Tap Payments** | âœ— | âœ— | View only | Variable |

---

# 5. RED FLAGS / EXCLUSIONS

## 5.1 PSP Red Flags

| Red Flag | Stripe | PayPal | Adyen | Checkout | Payoneer | Wise | Rapyd | HyperPay | Tap |
|----------|--------|--------|-------|----------|----------|------|-------|----------|-----|
| High chargeback rate (> 1.5%) | âڑ ï¸ڈ | âڑ ï¸ڈ | âڑ ï¸ڈ | âڑ ï¸ڈ | âڑ ï¸ڈ | N/A | âڑ ï¸ڈ | âڑ ï¸ڈ | âڑ ï¸ڈ |
| Sudden volume spike (10x) | âڑ ï¸ڈ | ًںڑ¨ | âڑ ï¸ڈ | âڑ ï¸ڈ | âڑ ï¸ڈ | âڑ ï¸ڈ | âڑ ï¸ڈ | ًںڑ¨ | ًںڑ¨ |
| Cross-border high-risk corridor | âڑ ï¸ڈ | ًںڑ¨ | âڑ ï¸ڈ | âڑ ï¸ڈ | âڑ ï¸ڈ | âڑ ï¸ڈ | âڑ ï¸ڈ | ًںڑ¨ | ًںڑ¨ |
| Marketplace with user payouts | âڑ ï¸ڈ | ًںڑ¨ | âœ“ | âœ“ | âœ“ | âڑ ï¸ڈ | âœ“ | ًںڑ¨ | ًںڑ¨ |
| High-value single transactions | âڑ ï¸ڈ | ًںڑ¨ | âڑ ï¸ڈ | âڑ ï¸ڈ | âڑ ï¸ڈ | âڑ ï¸ڈ | âڑ ï¸ڈ | ًںڑ¨ | ًںڑ¨ |
| Travel/delivery services | âڑ ï¸ڈ | ًںڑ¨ | âœ“ | âœ“ | âڑ ï¸ڈ | âڑ ï¸ڈ | âœ“ | âڑ ï¸ڈ | âڑ ï¸ڈ |
| First-time platform | âڑ ï¸ڈ | ًںڑ¨ | âڑ ï¸ڈ | âڑ ï¸ڈ | âڑ ï¸ڈ | âڑ ï¸ڈ | âڑ ï¸ڈ | âڑ ï¸ڈ | âڑ ï¸ڈ |

**Legend:** âœ“ Accepted | âڑ ï¸ڈ Enhanced review | ًںڑ¨ Likely rejection/restriction

## 5.2 Business Model Exclusions

| Business Type | Stripe | PayPal | Adyen | Checkout | Payoneer | Rapyd |
|---------------|--------|--------|-------|----------|----------|-------|
| Crowdshipping/peer delivery | âڑ ï¸ڈ | âڑ ï¸ڈ | âœ“ | âœ“ | âœ“ | âœ“ |
| Cross-border marketplace | âœ“ | âڑ ï¸ڈ | âœ“ | âœ“ | âœ“ | âœ“ |
| Escrow services | âœ“ Connect | âڑ ï¸ڈ | âœ“ | âœ“ | âœ“ | âœ“ |
| High-risk goods | âڑ ï¸ڈ | ًںڑ¨ | âڑ ï¸ڈ | âڑ ï¸ڈ | âڑ ï¸ڈ | âڑ ï¸ڈ |
| Crypto-related | ًںڑ¨ | ًںڑ¨ | ًںڑ¨ | ًںڑ¨ | ًںڑ¨ | âڑ ï¸ڈ |
| Adult content | ًںڑ¨ | ًںڑ¨ | âڑ ï¸ڈ | âڑ ï¸ڈ | ًںڑ¨ | âڑ ï¸ڈ |
| Gambling | ًںڑ¨ | ًںڑ¨ | âڑ ï¸ڈ | âڑ ï¸ڈ | ًںڑ¨ | âڑ ï¸ڈ |
| Weapons/tobacco | ًںڑ¨ | ًںڑ¨ | ًںڑ¨ | ًںڑ¨ | ًںڑ¨ | ًںڑ¨ |

## 5.3 Geographic Exclusions

| Region | Stripe | PayPal | Adyen | Checkout | Payoneer | Rapyd | HyperPay | Tap |
|--------|--------|--------|-------|----------|----------|-------|----------|-----|
| **US** | âœ“ | âœ“ | âœ“ | âœ“ | âœ“ | âœ“ | âœ— | âœ— |
| **EU** | âœ“ | âœ“ | âœ“ | âœ“ | âœ“ | âœ“ | âœ— | âœ— |
| **UK** | âœ“ | âœ“ | âœ“ | âœ“ | âœ“ | âœ“ | âœ— | âœ— |
| **UAE** | âœ— | Limited | âœ“ | âœ“ | âœ“ | âœ“ | âœ“ | âœ“ |
| **Saudi Arabia** | âœ— | Limited | âœ“ | âœ“ | âœ“ | âœ“ | âœ“ | âœ“ |
| **Egypt** | âœ— | Limited | âœ“ | âœ“ | âœ“ | âœ“ | âœ“ | âœ— |
| **Turkey** | âœ— | âڑ ï¸ڈ | âœ“ | âœ“ | âœ“ | âœ“ | âœ— | âœ— |
| **Russia** | ًںڑ¨ | ًںڑ¨ | ًںڑ¨ | ًںڑ¨ | ًںڑ¨ | ًںڑ¨ | ًںڑ¨ | ًںڑ¨ |
| **Iran** | ًںڑ¨ | ًںڑ¨ | ًںڑ¨ | ًںڑ¨ | ًںڑ¨ | ًںڑ¨ | ًںڑ¨ | ًںڑ¨ |

## 5.4 Contract Red Flags

| Red Flag | Risk Level | Action |
|----------|------------|--------|
| Unlimited liability for chargebacks | ًںڑ¨ Critical | Negotiate cap |
| Unilateral pricing changes | âڑ ï¸ڈ High | Negotiate notice period |
| Unilateral service termination | âڑ ï¸ڈ High | Negotiate cure period |
| No fund access during dispute | âڑ ï¸ڈ High | Negotiate partial access |
| Long payout hold (> 30 days) | âڑ ï¸ڈ High | Negotiate reduction |
| Exclusive dealing requirement | âڑ ï¸ڈ Medium | Reject or limit scope |
| Automatic renewal without notice | âڑ ï¸ڈ Medium | Negotiate notice |
| Jurisdiction in unfavorable country | âڑ ï¸ڈ Medium | Negotiate arbitration |
| No SLA guarantees | âڑ ï¸ڈ Medium | Negotiate SLA |
| Indemnification for PSP negligence | ًںڑ¨ Critical | Reject |

---

# 6. RISK SCORING SUMMARY

## 6.1 Overall PSP Risk Matrix

| PSP | License Risk | AML Risk | Freeze Risk | Chargeback Risk | Exclusion Risk | Overall |
|-----|--------------|----------|-------------|-----------------|----------------|---------|
| **Stripe** | Low | Low | Medium | Medium | Medium | **Low-Medium** |
| **PayPal** | Very Low | Low | High | Medium | High | **Medium-High** |
| **Adyen** | Very Low | Very Low | Low | Low | Low | **Very Low** |
| **Checkout.com** | Low | Low | Low | Low | Low | **Low** |
| **Payoneer** | Low | Low | Medium | Medium | Medium | **Low-Medium** |
| **Wise** | Low | Low | Medium | N/A | Medium | **Low-Medium** |
| **Rapyd** | Low | Low | Low | Medium | Low | **Low** |
| **HyperPay** | Medium | Medium | Medium | Medium | High | **Medium-High** |
| **Tap Payments** | Medium | Medium | Medium | Medium | High | **Medium-High** |

## 6.2 Recommendation Matrix

| Use Case | Primary PSP | Backup PSP | Avoid |
|----------|-------------|------------|-------|
| **Global marketplace** | Adyen | Checkout.com | PayPal (freeze risk) |
| **US + EU focus** | Stripe | Adyen | HyperPay, Tap |
| **MENA focus** | Checkout.com / Adyen | HyperPay | Stripe (no coverage) |
| **GCC only** | Tap Payments | HyperPay | Stripe, PayPal |
| **Cross-border payouts** | Payoneer | Wise | PayPal |
| **High-risk corridors** | Adyen | Rapyd | PayPal |
| **New platform (low volume)** | Stripe | PayPal | Adyen (volume requirements) |

## 6.3 Multi-PSP Strategy Recommendation

| Strategy | Configuration | Rationale |
|----------|---------------|-----------|
| **Primary (Global)** | Adyen or Checkout.com | Best licensing, lowest freeze risk |
| **Secondary (Backup)** | Stripe | Easy integration, good for scaling |
| **MENA Specialist** | HyperPay or Tap | Local coverage where global PSPs weak |
| **Payout Specialist** | Payoneer | Best for cross-border traveler payouts |
| **FX Specialist** | Wise | Competitive FX rates |

---

# 7. DUE DILIGENCE CHECKLIST

## 7.1 Pre-Integration Checklist

| Item | Requirement | Verified |
|------|-------------|----------|
| âکگ License verification | Confirm licenses in target jurisdictions | â€” |
| âکگ Insurance coverage | Verify fidelity bond / E&O insurance | â€” |
| âکگ Financial stability | Review financials (if available) | â€” |
| âکگ Regulatory history | Check for enforcement actions | â€” |
| âکگ Security certification | SOC2 / PCI-DSS compliance | â€” |
| âکگ SLA review | Uptime, support response, settlement | â€” |
| âکگ Contract review | Legal review of all terms | â€” |
| âکگ Pricing transparency | All fees documented | â€” |
| âکگ Integration complexity | API documentation review | â€” |
| âکگ Exit strategy | Data portability, notice period | â€” |

## 7.2 Ongoing Monitoring

| Metric | Frequency | Threshold | Action |
|--------|-----------|-----------|--------|
| Uptime | Daily | < 99.5% | Escalate |
| Settlement time | Daily | > T+1 | Investigate |
| Chargeback rate | Weekly | > 0.5% | Review |
| Freeze incidents | Monthly | > 2 | Review relationship |
| Pricing changes | Quarterly | > 10% increase | Renegotiate |
| License status | Quarterly | Any change | Legal review |
| Regulatory news | Ongoing | Any enforcement | Risk assessment |

---

**Document Owner:** Finance & Compliance  
**Version:** 1.0  
**Classification:** Internal â€” Restricted Distribution  
**Date:** December 20, 2025

