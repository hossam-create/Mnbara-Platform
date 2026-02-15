# REGULATOR FAQ: PAYMENTS
## Regulatory Inquiry Response Guide

**Classification:** Regulatory — Confidential
**Status:** Active Reference
**Effective Date:** December 19, 2025
**Document Owner:** General Counsel

---

## 1. Purpose

This document provides standardized responses to common regulatory inquiries regarding the Platform's payments-related activities. All responses are designed to be:

- Accurate and legally precise
- Consistent across all regulatory interactions
- Supported by documented controls

---

## 2. Entity Classification Questions

### Q: Are you a bank?

**Answer: NO.**

```
The Platform is NOT a bank. We do not:

• Accept deposits
• Hold customer funds in our own accounts
• Provide credit or lending services
• Issue debit or credit cards
• Maintain deposit accounts for customers
• Pay interest on balances

The Platform is an information services company that provides:

• Payment method comparison and advisory
• Transaction facilitation through licensed partners
• Escrow instruction services (funds held by licensed third parties)

We operate as a technology platform, not a financial institution.
```

**Supporting Documentation:**
- Corporate registration (technology company)
- Bank Integration Boundaries policy
- Partner agreements showing fund custody with licensed entities

---

### Q: Are you a money services business (MSB) or money transmitter?

**Answer: NO.**

```
The Platform is NOT a money services business or money transmitter. We do not:

• Transmit money or monetary value
• Receive money for transmission
• Hold funds on behalf of customers (partners hold funds)
• Convert currencies
• Issue or sell payment instruments
• Cash checks

All money movement is performed by licensed payment processors 
and escrow providers. The Platform provides:

• Comparison of payment options
• User interface for transaction initiation (not execution)
• Instruction relay to licensed partners

The Platform does not touch, hold, or transmit customer funds.
```

**Supporting Documentation:**
- Payment flow architecture (showing partner execution)
- Bank Integration Boundaries policy
- Licensing opinion from external counsel

---

### Q: Do you need a payment services license (e.g., PSD2, state MTL)?

**Answer: UNDER CURRENT OPERATING MODEL, NO.**

```
Based on our current operating model, we do not believe a 
payment services license is required because:

1. We do not initiate payments
   (User initiates with our licensed partner directly)

2. We do not hold or transmit funds
   (Licensed escrow and payment partners hold funds)

3. We do not execute payment transactions
   (Partners execute all transactions)

4. We operate as an information service
   (Comparison, advisory, and instruction relay)

This assessment has been confirmed by external legal counsel 
and is reviewed annually or upon material operational changes.

We will proactively notify regulators if our model changes in 
ways that may require licensing.
```

**Supporting Documentation:**
- External legal opinion on licensing
- Annual licensing review memo
- Payments Advisory Constitution

---

## 3. Fund Handling Questions

### Q: Do you hold customer funds?

**Answer: NO.**

```
The Platform does NOT hold customer funds at any time.

Fund custody is maintained by licensed third-party partners:

• Payment processing: [Licensed Payment Processor Name]
• Escrow custody: [Licensed Escrow Provider Name]

Customer funds flow directly between:
• Customer → Licensed Payment Processor → Escrow Holder → Recipient

The Platform never has custody, possession, or control of 
customer funds. We provide instructions to partners, but 
partners hold the funds in their regulated accounts.

Escrow accounts are segregated from partner operating funds 
per applicable regulations.
```

**Supporting Documentation:**
- Payment flow diagram
- Partner custody agreements
- Partner regulatory licenses
- Bank Integration Boundaries policy

---

### Q: Do you move money?

**Answer: NO.**

```
The Platform does NOT move money. We do not:

• Initiate fund transfers
• Execute fund transfers
• Settle transactions
• Credit or debit accounts

All fund movement is performed by licensed partners:

• Payment Partner: [Name] — Licensed by [Authority]
• Escrow Partner: [Name] — Licensed by [Authority]

The Platform performs:
• Information display (payment options)
• User preference collection (which method to use)
• Instruction relay to partners (user wants to pay)
• Status display (transaction complete)

The Platform is an informational layer, not a funds movement layer.
```

**Supporting Documentation:**
- Technical architecture showing Platform has no funds access
- Partner agreements defining roles
- API specifications (no funds movement APIs on Platform)

---

### Q: Who is responsible for AML/KYC compliance on payments?

**Answer: OUR LICENSED PARTNERS.**

```
Anti-Money Laundering (AML) and Know Your Customer (KYC) 
obligations for payment processing are the responsibility 
of our licensed partners.

Partner Responsibilities:
• Customer identification and verification
• Transaction monitoring
• Suspicious Activity Report (SAR) filing
• Sanctions screening
• Record keeping per applicable law

Platform Role:
• We perform basic user verification for Platform access
• We cooperate with partner information requests
• We do not perform payment-specific AML/KYC
• We are not the regulated entity for payment AML

This allocation is documented in our partner agreements 
and reflects the regulatory status of each party.
```

**Supporting Documentation:**
- Partner agreements with AML responsibility clauses
- Platform user verification policy (for access, not payments)
- AML program attestations from partners

---

## 4. Currency Exchange Questions

### Q: Do you execute foreign exchange?

**Answer: NO.**

```
The Platform does NOT execute foreign exchange transactions.

We provide:
• Indicative exchange rate information (from third-party sources)
• Currency comparison for informational purposes
• Fee transparency (what banks typically charge)

Actual currency conversion is performed by:
• The user's bank or card issuer
• The payment processor (at their rates)

We do not:
• Set exchange rates
• Execute currency conversions
• Guarantee any exchange rate
• Hold foreign currency positions

Every rate displayed includes a disclaimer stating it is 
indicative only and the user's bank determines the actual rate.
```

**Supporting Documentation:**
- FX Advisory Limits policy
- Rate display screenshots with disclaimers
- Rate source agreements

---

### Q: Do you need an FX license?

**Answer: NO.**

```
The Platform does not require a foreign exchange license because:

1. We do not execute FX transactions
2. We do not hold currency positions
3. We only display informational rate data

Our FX information service is comparable to a financial news 
service or rate comparison website. We provide information; 
we do not execute transactions.

This position has been reviewed by external counsel and is 
consistent with regulatory guidance on information services.
```

**Supporting Documentation:**
- External legal opinion on FX licensing
- FX Advisory Limits policy
- Rate display specifications showing disclaimer requirements

---

## 5. User Protection Questions

### Q: How are user funds protected?

**Answer: BY OUR LICENSED PARTNERS.**

```
User funds are protected through:

1. LICENSED PARTNER CUSTODY
   • Funds held by regulated escrow providers
   • Segregated from operating funds
   • Subject to partner regulatory requirements

2. PARTNER PROTECTIONS
   • FDIC insurance (where applicable)
   • Partner bonding requirements
   • Partner capital requirements

3. PAYMENT METHOD PROTECTIONS
   • Card chargeback rights (card issuer)
   • Dispute resolution (escrow provider)
   • Consumer protection regulations (applicable law)

The Platform's role is to:
   • Select qualified, regulated partners
   • Monitor partner compliance
   • Facilitate user communication with partners
   • Provide Platform-level dispute mediation (escrow)

Specific protection amounts and terms depend on the payment 
method and the applicable partner/issuer policies.
```

**Supporting Documentation:**
- Partner due diligence files
- Partner insurance/bonding certificates
- Payment Risk Disclosure policy
- User terms of service

---

## 6. Regulatory Oversight Questions

### Q: Who regulates you?

**Answer:**

```
The Platform operates as a technology/information services 
company. Our regulatory touchpoints include:

CORPORATE
• Incorporated in [Jurisdiction]
• General corporate regulation applies

DATA PROTECTION
• GDPR (EU operations)
• CCPA (California users)
• Applicable data protection laws

CONSUMER PROTECTION
• FTC (if US operations)
• Consumer protection agencies (per jurisdiction)

We are NOT directly regulated by:
• Banking regulators (not a bank)
• Money transmission regulators (not an MSB)
• Securities regulators (not dealing in securities)

Our licensed partners ARE regulated by:
• [Payment Partner] — Regulated by [Banking Authority]
• [Escrow Partner] — Regulated by [Authority]

We voluntarily adopt financial services best practices and 
maintain documentation consistent with regulatory expectations,
even where not legally required, to ensure operational excellence.
```

---

### Q: Will you notify us if your model changes?

**Answer: YES.**

```
The Platform commits to proactive regulatory communication.

We will notify relevant regulators if:

1. Our operating model changes in ways that may affect 
   licensing requirements

2. We begin new activities that may require authorization

3. We experience material incidents affecting users

4. We become aware of potential regulatory concerns

Our compliance team reviews operational changes for regulatory 
impact before implementation. Material changes require legal 
review and, where appropriate, pre-implementation regulatory 
consultation.
```

**Supporting Documentation:**
- Change management policy
- Regulatory notification protocol
- Compliance team structure

---

## 7. Response Protocol

### 7.1 Who May Respond to Regulators

| Inquiry Type | Authorized Respondent |
| :--- | :--- |
| Written inquiry | General Counsel or designee |
| Verbal inquiry | Compliance Officer or designee |
| Formal examination | General Counsel + CEO |
| Informal inquiry | Compliance Officer (with Legal review) |

### 7.2 Response Timeline

| Inquiry Type | Response Target |
| :--- | :--- |
| Formal information request | Per stated deadline |
| Informal inquiry | 5 business days |
| Examination request | Immediate acknowledgment |

### 7.3 Documentation

All regulatory interactions are:
- Logged in compliance management system
- Reviewed by General Counsel
- Retained for minimum 7 years

---

## 8. Attestation

```
This document accurately represents the Platform's regulatory 
position and has been reviewed for accuracy.

General Counsel:             _______________________  Date: _______
Chief Risk Officer:          _______________________  Date: _______
Chief Executive Officer:     _______________________  Date: _______
```

---
**Document Version:** 1.0
**Next Review:** June 2026
**Classification:** Regulatory — Confidential
