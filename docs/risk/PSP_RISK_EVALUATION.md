# PSP EVALUATION — RISK & COMPLIANCE MATRIX
## Payment Service Provider Risk Assessment

**Platform:** Mnbara  
**Document:** PSP Risk & Compliance Evaluation  
**Date:** December 20, 2025  
**Classification:** Internal — Finance, Risk & Compliance

---

# 1. LICENSING COVERAGE PER PSP

## 1.1 Global PSP Licensing Matrix

| PSP | EU (PSD2/EMI) | UK (FCA) | US (MTL) | UAE (CBUAE) | MENA | Escrow License | FX License |
|-----|---------------|----------|----------|-------------|------|----------------|------------|
| **Stripe** | ✓ (Ireland EMI) | ✓ | ✓ (49 states) | ✗ | Limited | ✗ | ✓ (via partners) |
| **PayPal** | ✓ (Luxembourg) | ✓ | ✓ | ✗ | Limited | ✗ | ✓ |
| **Adyen** | ✓ (Netherlands) | ✓ | ✓ | ✓ | ✓ | ✓ (custom) | ✓ |
| **Checkout.com** | ✓ (UK/EU) | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| **Payoneer** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Wise (TransferWise)** | ✓ (Belgium) | ✓ | ✓ | ✓ | Limited | ✗ | ✓ |
| **Rapyd** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **HyperPay** | ✗ | ✗ | ✗ | ✓ | ✓ (MENA focus) | ✗ | Limited |
| **Tap Payments** | ✗ | ✗ | ✗ | ✓ | ✓ (GCC) | ✗ | ✓ (GCC) |
| **PayTabs** | ✗ | ✗ | ✗ | ✓ | ✓ (MENA) | ✗ | Limited |

## 1.2 License Risk Rating

| PSP | Geographic Coverage | License Depth | Regulatory Risk | Overall Rating |
|-----|---------------------|---------------|-----------------|----------------|
| **Stripe** | High (45+ countries) | Medium | Low | ⭐⭐⭐⭐ |
| **PayPal** | Very High (200+ countries) | High | Low | ⭐⭐⭐⭐⭐ |
| **Adyen** | Very High | Very High | Very Low | ⭐⭐⭐⭐⭐ |
| **Checkout.com** | High | High | Low | ⭐⭐⭐⭐ |
| **Payoneer** | High | High | Low | ⭐⭐⭐⭐ |
| **Wise** | High | Medium | Low | ⭐⭐⭐⭐ |
| **Rapyd** | High | High | Low | ⭐⭐⭐⭐ |
| **HyperPay** | Low (MENA only) | Medium | Medium | ⭐⭐⭐ |
| **Tap Payments** | Low (GCC only) | Medium | Medium | ⭐⭐⭐ |
| **PayTabs** | Low (MENA only) | Medium | Medium | ⭐⭐⭐ |

## 1.3 Escrow Capability Matrix

| PSP | Native Escrow | Marketplace Split | Hold & Release | Escrow License | Platform Risk |
|-----|---------------|-------------------|----------------|----------------|---------------|
| **Stripe Connect** | ✓ | ✓ | ✓ | Via Stripe | Low |
| **PayPal Commerce** | ✓ | ✓ | ✓ | Via PayPal | Low |
| **Adyen for Platforms** | ✓ | ✓ | ✓ | Own license | Very Low |
| **Checkout.com Split** | ✓ | ✓ | ✓ | Via partners | Low |
| **Payoneer Escrow** | ✓ | ✓ | ✓ | Own license | Low |
| **Rapyd Collect** | ✓ | ✓ | ✓ | Own license | Low |
| **HyperPay** | ✗ | Limited | ✗ | N/A | High |
| **Tap Payments** | ✗ | Limited | ✗ | N/A | High |
| **PayTabs** | ✗ | Limited | ✗ | N/A | High |

---

# 2. AML / KYC RESPONSIBILITIES SPLIT

## 2.1 KYC Responsibility Matrix

| Responsibility | Platform | PSP | Shared | Notes |
|----------------|----------|-----|--------|-------|
| **User identity collection** | ✓ | — | — | Platform collects data |
| **ID verification** | Optional | ✓ | ✓ | PSP provides verification API |
| **Liveness check** | Optional | ✓ | ✓ | PSP or third-party |
| **Address verification** | ✓ | ✓ | ✓ | Either party |
| **PEP screening** | — | ✓ | ✓ | PSP mandatory |
| **Sanctions screening** | — | ✓ | — | PSP handles |
| **Ongoing monitoring** | ✓ | ✓ | ✓ | Both parties |
| **EDD (Enhanced Due Diligence)** | ✓ | ✓ | ✓ | Platform triggers, PSP may require |
| **Risk classification** | ✓ | ✓ | ✓ | Both classify independently |
| **Record retention** | ✓ | ✓ | — | Both must retain |

## 2.2 AML Responsibility Matrix

| Responsibility | Platform | PSP | Shared | Notes |
|----------------|----------|-----|--------|-------|
| **Transaction monitoring** | ✓ | ✓ | ✓ | Both monitor |
| **Threshold alerts** | ✓ | ✓ | ✓ | Platform sets, PSP enforces |
| **Pattern detection** | ✓ | ✓ | ✓ | Both detect |
| **SAR preparation** | ✓ | — | ✓ | Platform prepares |
| **SAR filing** | — | ✓ | ✓ | PSP files (or platform if licensed) |
| **Regulatory reporting** | — | ✓ | — | PSP handles |
| **MLRO function** | Recommended | ✓ | ✓ | Platform should have internal MLRO |
| **Training** | ✓ | ✓ | — | Both train staff |
| **Policy documentation** | ✓ | ✓ | — | Both maintain |

## 2.3 PSP-Specific AML/KYC Support

| PSP | KYC API | ID Verification | PEP/Sanctions | AML Monitoring | SAR Filing |
|-----|---------|-----------------|---------------|----------------|------------|
| **Stripe** | ✓ Identity | ✓ | ✓ | ✓ Radar | PSP files |
| **PayPal** | Limited | Via PayPal | ✓ | ✓ Built-in | PSP files |
| **Adyen** | ✓ Verify | ✓ | ✓ | ✓ RevenueProtect | PSP files |
| **Checkout.com** | ✓ | ✓ via partners | ✓ | ✓ | PSP files |
| **Payoneer** | ✓ | ✓ | ✓ | ✓ | PSP files |
| **Wise** | ✓ | ✓ | ✓ | ✓ | PSP files |
| **Rapyd** | ✓ | ✓ | ✓ | ✓ | PSP files |
| **HyperPay** | Limited | Limited | ✓ | Limited | Platform may need to file |
| **Tap Payments** | Limited | Limited | ✓ | Limited | Platform may need to file |

## 2.4 Liability Split

| Scenario | Platform Liable | PSP Liable | Shared | Notes |
|----------|-----------------|------------|--------|-------|
| Failed KYC (user not verified) | ✓ | — | — | Platform must verify |
| Missed sanctions match | — | ✓ | — | PSP responsible |
| AML breach (structuring undetected) | ✓ | ✓ | ✓ | Both liable |
| SAR not filed | — | ✓ | ✓ | PSP primary, platform secondary |
| Data breach (KYC data) | ✓ | — | ✓ | Depends on breach location |
| Regulatory fine (AML failure) | ✓ | ✓ | ✓ | Regulator may fine both |

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
| **Stripe** | $15 | Chargeback Protection (fee) | ✓ | 7-21 days | Radar |
| **PayPal** | $20 | Seller Protection | ✓ | 10-30 days | Built-in |
| **Adyen** | €15 | RevenueProtect | ✓ | 7-14 days | Risk engine |
| **Checkout.com** | $15 | Fraud Detection | ✓ | 7-21 days | Fraud filters |
| **Payoneer** | $25 | Limited | ✓ | 14-30 days | Basic |
| **Wise** | N/A (no cards) | N/A | N/A | N/A | N/A |
| **Rapyd** | $15-25 | Basic | ✓ | 7-21 days | Basic |
| **HyperPay** | Variable | Limited | Limited | 14-30 days | Basic |
| **Tap Payments** | Variable | Limited | ✓ | 14-30 days | Basic |

## 3.3 Dispute Resolution Matrix

| Dispute Type | Platform Role | PSP Role | Timeline | Escalation Path |
|--------------|---------------|----------|----------|-----------------|
| **User vs User** | Primary arbitrator | Hold funds | 14 days | Platform → Legal |
| **User vs Platform** | Respond to complaint | May mediate | 30 days | Regulator |
| **Chargeback** | Gather evidence | File with network | Card network rules | Arbitration |
| **Fraud claim** | Investigate | Block/refund | 7-14 days | Law enforcement |
| **AML hold** | Cooperate | Execute hold | Regulatory | MLRO → Regulator |

## 3.4 Chargeback Risk by PSP

| PSP | Chargeback Rate Threshold | Account Risk at Threshold | Mitigation Offered |
|-----|---------------------------|---------------------------|---------------------|
| **Stripe** | 0.75% | Warning | 1.0% → Review | Radar rules, 3DS |
| **PayPal** | 1.0% | Review | 1.5% → Restriction | Seller Protection |
| **Adyen** | 0.5% | Enhanced monitoring | 1.0% → Action required | Risk engine |
| **Checkout.com** | 0.75% | Warning | 1.0% → Review | Fraud filters |
| **Payoneer** | 1.0% | Review | 1.5% → Hold | Limited |
| **Rapyd** | 0.75% | Warning | 1.0% → Review | Basic |
| **HyperPay** | 1.5% | Review | 2.0% → Action | Limited |
| **Tap Payments** | 1.5% | Review | 2.0% → Action | Limited |

---

# 4. ACCOUNT FREEZE POWERS

## 4.1 Freeze Authority Matrix

| Freeze Trigger | Platform Can Freeze | PSP Can Freeze | Reversal Authority |
|----------------|---------------------|----------------|-------------------|
| **User dispute** | ✓ (via PSP API) | ✓ | Platform or PSP |
| **Chargeback received** | Auto | ✓ | PSP (after resolution) |
| **AML flag** | ✓ (request) | ✓ | PSP Compliance |
| **Sanctions match** | N/A (PSP auto) | ✓ (mandatory) | Legal only |
| **Fraud detection** | ✓ (via API) | ✓ | Platform or PSP |
| **Regulatory order** | N/A | ✓ (mandatory) | Regulator/Court |
| **Terms violation** | ✓ (request) | ✓ | PSP |
| **Platform request** | ✓ (initiate) | ✓ (execute) | Platform |

## 4.2 PSP Freeze Powers Comparison

| PSP | Platform-Initiated Freeze | PSP-Unilateral Freeze | Freeze Notification | Freeze Appeal | Freeze Duration Limit |
|-----|---------------------------|----------------------|---------------------|---------------|----------------------|
| **Stripe** | ✓ API | ✓ | Email + Dashboard | ✓ | 90 days (then review) |
| **PayPal** | ✓ API | ✓ (common) | Email | ✓ | 180 days |
| **Adyen** | ✓ API | ✓ | Dashboard | ✓ | Configurable |
| **Checkout.com** | ✓ API | ✓ | Email + Dashboard | ✓ | 90 days |
| **Payoneer** | ✓ | ✓ | Email | ✓ | 180 days |
| **Wise** | Limited | ✓ | Email | ✓ | Indefinite |
| **Rapyd** | ✓ API | ✓ | Email + API | ✓ | Configurable |
| **HyperPay** | Limited | ✓ | Email | Limited | Variable |
| **Tap Payments** | Limited | ✓ | Email | Limited | Variable |

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
| **Stripe** | ✓ | ✗ | View only | No fees |
| **PayPal** | ✗ (usually full) | ✗ | View only | No fees |
| **Adyen** | ✓ | Configurable | Full API access | No fees |
| **Checkout.com** | ✓ | ✗ | View only | No fees |
| **Payoneer** | ✓ | ✗ | View only | No fees |
| **Wise** | ✗ | ✗ | View only | No fees |
| **Rapyd** | ✓ | Configurable | Full API access | No fees |
| **HyperPay** | ✗ | ✗ | View only | Variable |
| **Tap Payments** | ✗ | ✗ | View only | Variable |

---

# 5. RED FLAGS / EXCLUSIONS

## 5.1 PSP Red Flags

| Red Flag | Stripe | PayPal | Adyen | Checkout | Payoneer | Wise | Rapyd | HyperPay | Tap |
|----------|--------|--------|-------|----------|----------|------|-------|----------|-----|
| High chargeback rate (> 1.5%) | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | N/A | ⚠️ | ⚠️ | ⚠️ |
| Sudden volume spike (10x) | ⚠️ | 🚨 | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | 🚨 | 🚨 |
| Cross-border high-risk corridor | ⚠️ | 🚨 | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | 🚨 | 🚨 |
| Marketplace with user payouts | ⚠️ | 🚨 | ✓ | ✓ | ✓ | ⚠️ | ✓ | 🚨 | 🚨 |
| High-value single transactions | ⚠️ | 🚨 | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | 🚨 | 🚨 |
| Travel/delivery services | ⚠️ | 🚨 | ✓ | ✓ | ⚠️ | ⚠️ | ✓ | ⚠️ | ⚠️ |
| First-time platform | ⚠️ | 🚨 | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |

**Legend:** ✓ Accepted | ⚠️ Enhanced review | 🚨 Likely rejection/restriction

## 5.2 Business Model Exclusions

| Business Type | Stripe | PayPal | Adyen | Checkout | Payoneer | Rapyd |
|---------------|--------|--------|-------|----------|----------|-------|
| Crowdshipping/peer delivery | ⚠️ | ⚠️ | ✓ | ✓ | ✓ | ✓ |
| Cross-border marketplace | ✓ | ⚠️ | ✓ | ✓ | ✓ | ✓ |
| Escrow services | ✓ Connect | ⚠️ | ✓ | ✓ | ✓ | ✓ |
| High-risk goods | ⚠️ | 🚨 | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| Crypto-related | 🚨 | 🚨 | 🚨 | 🚨 | 🚨 | ⚠️ |
| Adult content | 🚨 | 🚨 | ⚠️ | ⚠️ | 🚨 | ⚠️ |
| Gambling | 🚨 | 🚨 | ⚠️ | ⚠️ | 🚨 | ⚠️ |
| Weapons/tobacco | 🚨 | 🚨 | 🚨 | 🚨 | 🚨 | 🚨 |

## 5.3 Geographic Exclusions

| Region | Stripe | PayPal | Adyen | Checkout | Payoneer | Rapyd | HyperPay | Tap |
|--------|--------|--------|-------|----------|----------|-------|----------|-----|
| **US** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| **EU** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| **UK** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| **UAE** | ✗ | Limited | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Saudi Arabia** | ✗ | Limited | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Egypt** | ✗ | Limited | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| **Turkey** | ✗ | ⚠️ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Russia** | 🚨 | 🚨 | 🚨 | 🚨 | 🚨 | 🚨 | 🚨 | 🚨 |
| **Iran** | 🚨 | 🚨 | 🚨 | 🚨 | 🚨 | 🚨 | 🚨 | 🚨 |

## 5.4 Contract Red Flags

| Red Flag | Risk Level | Action |
|----------|------------|--------|
| Unlimited liability for chargebacks | 🚨 Critical | Negotiate cap |
| Unilateral pricing changes | ⚠️ High | Negotiate notice period |
| Unilateral service termination | ⚠️ High | Negotiate cure period |
| No fund access during dispute | ⚠️ High | Negotiate partial access |
| Long payout hold (> 30 days) | ⚠️ High | Negotiate reduction |
| Exclusive dealing requirement | ⚠️ Medium | Reject or limit scope |
| Automatic renewal without notice | ⚠️ Medium | Negotiate notice |
| Jurisdiction in unfavorable country | ⚠️ Medium | Negotiate arbitration |
| No SLA guarantees | ⚠️ Medium | Negotiate SLA |
| Indemnification for PSP negligence | 🚨 Critical | Reject |

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
| ☐ License verification | Confirm licenses in target jurisdictions | — |
| ☐ Insurance coverage | Verify fidelity bond / E&O insurance | — |
| ☐ Financial stability | Review financials (if available) | — |
| ☐ Regulatory history | Check for enforcement actions | — |
| ☐ Security certification | SOC2 / PCI-DSS compliance | — |
| ☐ SLA review | Uptime, support response, settlement | — |
| ☐ Contract review | Legal review of all terms | — |
| ☐ Pricing transparency | All fees documented | — |
| ☐ Integration complexity | API documentation review | — |
| ☐ Exit strategy | Data portability, notice period | — |

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
**Classification:** Internal — Restricted Distribution  
**Date:** December 20, 2025
