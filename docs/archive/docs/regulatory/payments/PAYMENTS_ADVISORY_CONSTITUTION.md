# PAYMENTS ADVISORY CONSTITUTION
## Foundational Governance Document

**Classification:** Regulatory — Binding
**Status:** Constitutional (Immutable without Board Approval)
**Effective Date:** December 19, 2025
**Document Owner:** Chief Risk Officer

---

## 1. Constitutional Declaration

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   THIS PLATFORM PROVIDES PAYMENT ADVISORY SERVICES ONLY.   │
│                                                             │
│   WE DO NOT:                                                │
│   • Execute payments                                        │
│   • Hold customer funds                                     │
│   • Perform currency exchange                               │
│   • Act as a bank or money transmitter                      │
│                                                             │
│   ALL FINANCIAL ACTIONS REQUIRE HUMAN CONFIRMATION          │
│   AND ARE EXECUTED BY LICENSED THIRD-PARTY PROVIDERS.       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Why Advisory-Only

### 2.1 Regulatory Rationale

The Platform operates as an **information and comparison service** for payment methods, not as a financial services provider. This architectural decision is based on:

| Requirement | Our Position |
| :--- | :--- |
| Banking License | Not required. We do not hold deposits. |
| Money Transmission License | Not required. We do not transmit funds. |
| Payment Services Directive (PSD2) | Not applicable. We do not initiate payments. |
| Currency Exchange License | Not required. We do not execute FX transactions. |
| Anti-Money Laundering (AML) | Deferred to licensed payment partners. |

### 2.2 Operational Rationale

| Principle | Implementation |
| :--- | :--- |
| **Risk Isolation** | Financial risk resides with licensed partners. |
| **Liability Clarity** | Clear separation of responsibilities. |
| **Regulatory Simplicity** | Operate within information services scope. |
| **User Protection** | Users benefit from partner protections. |

### 2.3 User Benefit

- Users receive **neutral comparison** of payment options.
- Users make their **own informed decisions**.
- Users are protected by **partner guarantees** (chargebacks, escrow, etc.).
- Users are never **auto-enrolled** in financial products.

---

## 3. Explicit Prohibitions

### 3.1 Absolute Prohibitions (No Exceptions)

The Platform **SHALL NOT**, under any circumstances:

| Prohibition | Scope | Enforcement |
| :--- | :--- | :--- |
| **Execute payments** | No payment initiation without user action | Technical block |
| **Hold customer funds** | No escrow custody (partners hold) | Architectural |
| **Perform currency exchange** | No FX execution | Technical block |
| **Set exchange rates** | Display only (source: third party) | Policy |
| **Auto-select payment methods** | User must explicitly choose | Technical block |
| **Store payment credentials** | No card numbers, bank accounts | Technical block |
| **Access bank accounts** | No open banking access | Architectural |
| **Debit accounts autonomously** | No auto-debit capability | Technical block |

### 3.2 Conditional Prohibitions (Board Approval Required)

| Prohibition | Condition for Change |
| :--- | :--- |
| Recommend specific payment | Requires regulatory review + user consent framework |
| Display personalized rates | Requires disclosure framework + opt-in |
| Store payment preferences | Requires privacy impact assessment |

### 3.3 Violations

Any violation of Section 3.1 prohibitions:
- Constitutes a **Critical Incident (SEV-1)**
- Requires **immediate system shutdown** of affected component
- Triggers **Board notification within 1 hour**
- May require **regulatory disclosure**

---

## 4. Human-in-the-Loop Guarantee

### 4.1 Mandatory Human Actions

The following actions **SHALL NOT** proceed without explicit human confirmation:

| Action | Human Step Required |
| :--- | :--- |
| Initiate payment | User taps "Confirm and Pay" |
| Select payment method | User selects from options |
| Release escrow | User confirms delivery receipt |
| Cancel transaction | User confirms cancellation |
| Change payment method | User explicitly selects new method |

### 4.2 Confirmation Requirements

**Confirmation Modal Standards:**

| Element | Requirement |
| :--- | :--- |
| Clear action statement | "You are about to pay $X" |
| Reversibility disclosure | "This action cannot be undone" OR "You can cancel within X hours" |
| Confirm button | Explicit action label, not "OK" |
| Cancel option | Equal prominence to confirm |

### 4.3 Prohibited Automation

| Automation Type | Status |
| :--- | :--- |
| Auto-pay | **PROHIBITED** |
| Recurring payment setup | **PROHIBITED** without explicit consent per occurrence |
| One-click payment | **PROHIBITED** |
| Saved payment auto-selection | **PROHIBITED** |
| Default payment method | **PROHIBITED** |

---

## 5. Advisory Function Scope

### 5.1 What Advisory Includes

| Function | Description |
| :--- | :--- |
| Payment comparison | Display multiple options with neutral presentation |
| Fee disclosure | Show all fees transparently |
| Risk disclosure | Explain risks of each payment method |
| Protection comparison | Compare buyer protection levels |
| FX rate display | Show indicative rates with disclaimers |

### 5.2 What Advisory Excludes

| Function | Status |
| :--- | :--- |
| Recommending a specific option | NOT advisory function |
| Executing the payment | NOT advisory function |
| Guaranteeing outcomes | NOT advisory function |
| Providing financial advice | NOT advisory function |

---

## 6. Amendment Process

### 6.1 Constitutional Amendments

Changes to this document require:

1. **Proposal** by Chief Risk Officer
2. **Legal Review** by General Counsel
3. **Regulatory Assessment** by Compliance Officer
4. **Board Approval** by majority vote
5. **30-Day Notice** before implementation

### 6.2 Non-Amendable Provisions

The following provisions **CANNOT** be amended:

- Section 3.1 (Absolute Prohibitions)
- Section 4.3 (Prohibited Automation)
- Human-in-the-Loop requirement for financial actions

---

## 7. Attestation

```
I attest that I have read, understood, and will ensure compliance 
with this Payments Advisory Constitution.

Chief Executive Officer:     _______________________  Date: _______
Chief Risk Officer:          _______________________  Date: _______
Chief Technology Officer:    _______________________  Date: _______
General Counsel:             _______________________  Date: _______
```

---
**Document Version:** 1.0
**Next Review:** June 2026
**Classification:** Regulatory — Binding
