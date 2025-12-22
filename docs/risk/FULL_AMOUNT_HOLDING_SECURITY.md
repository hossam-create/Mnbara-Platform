# FULL AMOUNT HOLDING PHASE — SECURITY SPECIFICATION
## Fund Holding, Arbitration & Release Rules

**Platform:** Mnbara  
**Document:** Full Amount Holding Phase Security  
**Date:** December 20, 2025  
**Classification:** Internal — Finance & Risk Operations

---

# 1. FAILURE SCENARIOS TABLE

## 1.1 Buyer Claims Payment Without Proof

| Trigger | Required Evidence | Allowed Decision | Fund Release Direction |
|---------|-------------------|------------------|------------------------|
| Buyer claims they paid but platform shows no record | Bank/wallet transfer receipt with transaction ID + timestamp + amount | **If evidence valid:** Credit buyer's hold balance | No release until payment verified |
| Buyer screenshot shows payment but no bank confirmation | Bank statement (PDF) showing debit + platform reference ID | **If evidence valid:** Manual credit after bank verification | Funds held until bank confirms |
| Buyer claims payment from third-party wallet | Wallet transaction hash + wallet address ownership proof | **If evidence valid + address matches:** Credit buyer | Reject if address mismatch |
| Buyer claims payment but amount differs | Receipt showing correct amount + explanation of difference | **If within 5% variance:** Accept with adjustment | Reject if variance > 5% |
| Buyer provides edited/fake receipt | EXIF analysis + transaction ID verification fails | **REJECT + Flag buyer** | No release + BuyerRiskFlag SET |

**Rules:**
- Payment proof must include: Transaction ID, Amount, Date/Time, Recipient (Platform)
- Platform bank reconciliation is source of truth
- Verbal claims without documentation: REJECTED
- Multiple failed payment claims (3+): Temporary account restriction

---

## 1.2 Traveler Claims Purchase Without Receipt

| Trigger | Required Evidence | Allowed Decision | Fund Release Direction |
|---------|-------------------|------------------|------------------------|
| Traveler claims item purchased, no receipt | Photo of item + store name + price tag visible | **Request formal receipt within 48hr** | Hold until receipt provided |
| Traveler provides handwritten receipt | Printed/digital receipt from registered business | **REJECT handwritten** | No release until valid receipt |
| Traveler provides receipt but amount exceeds agreed price | Justification for overage (tax, shipping, unavailable model) | **If overage ≤ 10%:** Accept with buyer approval. **If > 10%:** Escalate | Buyer must approve excess release |
| Traveler provides receipt from wrong country/store | Receipt must match agreed purchase location | **REJECT** | No release + request correct receipt |
| Traveler provides duplicate receipt (used before) | Receipt hash matching against database | **REJECT + Flag traveler** | No release + TravelerRiskFlag SET |

**Rules:**
- Acceptable receipts: Printed store receipt, digital invoice, e-commerce order confirmation
- Receipt must include: Store name, Item description, Price, Date, Transaction/order number
- Handwritten receipts: NEVER accepted
- Photos of receipts: Accepted if legible + EXIF intact

---

## 1.3 Partial Delivery Dispute

| Trigger | Required Evidence | Allowed Decision | Fund Release Direction |
|---------|-------------------|------------------|------------------------|
| Buyer claims only partial items received | Buyer photo of received items vs original order specification | **If partial confirmed:** Calculate pro-rata release | Partial to traveler, remainder held |
| Traveler claims full delivery, buyer disagrees | Traveler delivery photo + GPS + buyer's received items photo | **Compare evidence weights** | Higher-evidence party favored |
| Buyer accepts partial, waives remainder | Written confirmation from buyer (in-app) | **Release partial amount to traveler** | Remainder refunded to buyer |
| Buyer claims accessories missing, traveler denies | Original order spec (must list accessories) + receipt line items | **If spec included accessories:** Traveler fault | Hold accessory value, release remainder |
| Quantity dispute (ordered 5, received 3) | Receipt showing quantity + buyer photo of received quantity | **If receipt shows 5, photo shows 3:** Traveler fault | Release pro-rata (3/5), hold remainder |

**Rules:**
- Partial release requires: Both parties confirm OR arbitration decision
- Minimum releasable amount: $5 or 10% of total (whichever greater)
- Partial dispute SLA: 7 business days maximum hold during investigation
- If buyer accepts partial: Traveler cannot later claim full amount

---

## 1.4 Fake Admin Confirmation Attempt

| Trigger | Required Evidence | Allowed Decision | Fund Release Direction |
|---------|-------------------|------------------|------------------------|
| User claims "admin approved" via message/email | Verification against admin action log | **If no log entry:** REJECT + investigate source | No release + freeze account |
| User forwards fake email from "support@mnbara.com" | Email header analysis + DKIM/SPF verification | **If spoofed:** REJECT + report phishing | No release + security alert |
| User claims phone call from admin authorizing release | Internal call log verification | **If no record:** REJECT + security review | No release + flag account |
| User submits forged approval document | Document hash + signature verification against admin records | **If forged:** PERMANENT BAN | No release + legal escalation |
| User bribes/colludes with actual admin | Internal audit trail + dual-control verification failure | **If detected:** Terminate admin + ban user | Freeze all funds + investigation |

**Rules:**
- Admin confirmations ONLY valid if logged in internal system
- No admin can authorize release via email/phone/message EVER
- All admin actions require system authentication (no verbal approvals)
- Fake admin impersonation: Immediate permanent ban + legal referral

---

# 2. HOLDING RISK FLAGS (READ-ONLY)

## 2.1 HighValueHold

| Flag State | Trigger Condition | Effect | Auto-Clear |
|------------|-------------------|--------|------------|
| `HIGH_VALUE_HOLD_NONE` | Transaction < $500 | Standard processing | N/A |
| `HIGH_VALUE_HOLD_ELEVATED` | Transaction $500 - $2,000 | Manual review before release | After successful release |
| `HIGH_VALUE_HOLD_CRITICAL` | Transaction > $2,000 | Dual-control approval required | After successful release |
| `HIGH_VALUE_HOLD_MAXIMUM` | Transaction > $5,000 | Senior admin + compliance review | After successful release |

**Rules:**
- Flag is SET automatically based on transaction value
- Flag is READ-ONLY — does not block, only triggers review requirement
- High-value transactions require enhanced evidence (video + signature preferred)
- No single admin can approve HIGH_VALUE_HOLD_CRITICAL or above

---

## 2.2 CrossBorderHold

| Flag State | Trigger Condition | Effect | Auto-Clear |
|------------|-------------------|--------|------------|
| `CROSS_BORDER_HOLD_NONE` | Same-country transaction | Standard processing | N/A |
| `CROSS_BORDER_HOLD_LOW` | Between allied/low-risk countries | Standard + customs reminder | After delivery confirmed |
| `CROSS_BORDER_HOLD_MEDIUM` | Involves 1 high-risk country | Enhanced documentation required | After delivery confirmed |
| `CROSS_BORDER_HOLD_HIGH` | Involves 2+ high-risk countries OR sanctions-adjacent | Compliance review mandatory | Manual clear only |

**High-Risk Country Indicators:**
- FATF grey/black list countries
- Countries with active sanctions (OFAC, EU, UN)
- Countries with high fraud rates (platform data)

**Rules:**
- Flag is SET based on traveler origin + buyer destination
- Flag is READ-ONLY — informs review, does not auto-block
- CROSS_BORDER_HOLD_HIGH: Requires compliance sign-off before ANY release
- Customs seizure documentation requirements increase with flag level

---

## 2.3 FirstTimeTravelerHold

| Flag State | Trigger Condition | Effect | Auto-Clear |
|------------|-------------------|--------|------------|
| `FIRST_TIME_TRAVELER_NONE` | Traveler has 3+ successful deliveries | Standard processing | N/A |
| `FIRST_TIME_TRAVELER_NEW` | Traveler has 0 deliveries | Extended hold period (72hr post-delivery) | After 3 successful deliveries |
| `FIRST_TIME_TRAVELER_EARLY` | Traveler has 1-2 deliveries | Standard hold + manual review | After 3 successful deliveries |

**Rules:**
- Flag is SET based on traveler delivery history
- Flag is READ-ONLY — extends review time, does not block
- First-time travelers: Maximum transaction value capped at $300
- Funds released only after buyer confirmation + 72hr cooling period

---

# 3. MANUAL ARBITRATION RULES

## 3.1 When Buyer Confirmation Overrides

| Scenario | Override Allowed | Conditions |
|----------|------------------|------------|
| Buyer confirms delivery, traveler silent | YES — Release to traveler | Buyer confirmation logged + 24hr wait |
| Buyer confirms partial, traveler claims full | YES — Release partial only | Buyer's stated amount is maximum release |
| Buyer confirms but later disputes | NO — Confirmation is binding | Dispute rejected if confirmed > 24hr ago |
| Buyer confirms under duress (alleged) | ESCALATE — Hold pending investigation | Buyer must provide evidence of duress |
| Buyer confirms wrong transaction | ESCALATE — Freeze both | Must verify transaction ID mismatch |

**Rules:**
- Buyer confirmation is binding after 24-hour window
- Buyer cannot retract confirmation without evidence of fraud/duress
- Buyer confirmation triggers automatic release countdown (configurable)
- Multiple confirmation retractions (2+): BuyerRiskFlag SET

---

## 3.2 When Admin Overrides Both Parties

| Scenario | Override Allowed | Required Authorization |
|----------|------------------|------------------------|
| Both parties unresponsive for 14+ days | YES — Default to platform policy | Single admin + supervisor sign-off |
| Both parties provide contradictory evidence | YES — Platform decides | Dual-control (2 admins required) |
| Suspected collusion between parties | YES — Freeze and investigate | Compliance officer required |
| Legal/regulatory requirement | YES — Immediate action | Legal team authorization |
| Platform error caused dispute | YES — Correct and compensate | Senior admin + documentation |

**Rules:**
- Admin override requires written justification (stored permanently)
- Both parties notified within 24hr of override decision
- Admin override is FINAL — no appeal except for new evidence
- All admin overrides logged in immutable audit trail

---

## 3.3 When Freeze is Mandatory

| Trigger | Freeze Type | Duration | Release Condition |
|---------|-------------|----------|-------------------|
| Fraud investigation initiated | Full freeze | Until investigation complete | Compliance clearance |
| Regulatory inquiry received | Full freeze | Until inquiry resolved | Legal team clearance |
| Sanctions match detected | Full freeze | Indefinite | Compliance + legal clearance |
| Chargeback/reversal received | Disputed amount freeze | 90 days | Bank resolution |
| Court order received | Full freeze | As ordered | Court release order |
| AML flag triggered | Full freeze | Until cleared | Compliance clearance |
| User death reported | Full freeze | Until estate resolution | Legal documentation |

**Rules:**
- Mandatory freeze CANNOT be overridden by any single person
- Mandatory freeze requires legal/compliance involvement
- Users notified of freeze (except in law enforcement cases)
- Interest/fees do not accrue during mandatory freeze

---

# 4. ABUSE PREVENTION

## 4.1 Reused Payment/Receipt Proofs

| Detection Method | Action |
|------------------|--------|
| **Receipt hash matching** | Each receipt image hashed (SHA-256) and stored |
| **Transaction ID tracking** | All transaction IDs logged; duplicates flagged |
| **EXIF metadata comparison** | Same photo submitted twice detected |
| **OCR text extraction** | Receipt text extracted and compared |
| **Cross-user matching** | Same receipt used by different users flagged |

| Scenario | Action |
|----------|--------|
| Same receipt used twice by same user | REJECT second use + warning |
| Same receipt used by different users | REJECT + investigate both accounts |
| Receipt from previous transaction reused | REJECT + TravelerRiskFlag SET |
| Edited receipt (amounts changed) | PERMANENT BAN + legal referral |
| Stock/template receipt detected | REJECT + immediate review |

**Rules:**
- Every receipt/proof stored with hash + timestamp
- Duplicate detection runs on ALL new submissions
- Users cannot delete submitted proofs
- Proof tampering: Zero tolerance, permanent ban

---

## 4.2 Admin Role Separation

| Role | Permissions | Restrictions |
|------|-------------|--------------|
| **Support Agent (L1)** | View disputes, request evidence, communicate with users | Cannot release funds, cannot override |
| **Trust Associate (L2)** | Review evidence, make release recommendations | Cannot approve own recommendations |
| **Trust Specialist (L3)** | Approve releases < $500, override buyer/traveler | Cannot approve high-value alone |
| **Trust Lead (L4)** | Approve releases < $2,000, second approval for high-value | Cannot approve compliance-flagged |
| **Compliance Officer** | Approve sanctions/AML cases, override all | Cannot handle own transactions |
| **Finance Controller** | Execute fund movements, audit trail access | Cannot make arbitration decisions |

**Separation Rules:**

| Rule | Requirement |
|------|-------------|
| No self-approval | Admin cannot approve case they opened/reviewed |
| No same-team approval | L3 cannot approve another L3's recommendation (must go to L4) |
| No single-point control | Any release > $500 requires 2 different admins |
| Rotation requirement | Same admin cannot handle consecutive disputes from same user |
| Audit trail | Every action logged with admin ID + timestamp + justification |

---

## 4.3 Dual-Control for Release Approval

### Threshold Matrix

| Transaction Value | Approval Requirement |
|-------------------|----------------------|
| < $100 | Single L2 approval |
| $100 - $500 | Single L3 approval |
| $500 - $2,000 | L3 + L4 approval (dual) |
| $2,000 - $5,000 | L4 + Compliance approval (dual) |
| > $5,000 | L4 + Compliance + Finance Controller (triple) |

### Dual-Control Process

| Step | Action | Requirement |
|------|--------|-------------|
| 1 | First approver reviews evidence | Submit approval recommendation |
| 2 | Case routed to second approver | Different person, same or higher level |
| 3 | Second approver independently reviews | Cannot see first approver's notes initially |
| 4 | Both approvals recorded | System compares decisions |
| 5 | If both approve: Release executed | If disagree: Escalate to next level |
| 6 | If disagreement: Third approver (tie-breaker) | Must be higher than both |

### Dual-Control Rules

| Rule | Description |
|------|-------------|
| Independence | Second approver cannot communicate with first before decision |
| Blindness | Second approver sees evidence, not first approver's recommendation (initially) |
| Time limit | Second approval must occur within 24hr of first |
| Escalation | Disagreement always escalates up, never down |
| Emergency bypass | Only CEO/COO can bypass dual-control (logged + justified) |

---

# FUND RELEASE DECISION MATRIX

| Evidence State | Buyer State | Traveler State | Decision | Release Direction |
|----------------|-------------|----------------|----------|-------------------|
| Complete + matching | Confirmed | Confirmed | RELEASE | 100% to Traveler |
| Complete + matching | Confirmed | Unresponsive | RELEASE | 100% to Traveler (after 72hr) |
| Complete + matching | Unresponsive | Confirmed | HOLD | Wait 14 days, then release |
| Complete + matching | Disputes | Confirmed | ARBITRATE | Platform decides |
| Partial evidence | Any | Any | HOLD | Request additional evidence |
| Contradictory evidence | Disputes | Disputes | ARBITRATE | Platform decides |
| No evidence | Any | Any | HOLD | Maximum 30 days, then escalate |
| Fraud detected | Any | Any | FREEZE | Investigate + possible return |

---

# HOLD DURATION LIMITS

| Scenario | Maximum Hold | After Maximum |
|----------|--------------|---------------|
| Standard dispute | 14 days | Escalate to Lead |
| High-value dispute | 21 days | Escalate to Compliance |
| Cross-border dispute | 30 days | Escalate to Legal |
| Fraud investigation | 90 days | Legal decision required |
| Regulatory freeze | No limit | As required by law |

---

# AUDIT REQUIREMENTS

| Action | Logged Data | Retention |
|--------|-------------|-----------|
| Fund hold initiated | Transaction ID, amount, timestamp, reason | 7 years |
| Evidence submitted | Document hash, submitter, timestamp | 7 years |
| Admin review | Admin ID, decision, justification | 7 years |
| Fund release | Amount, recipient, approvers, timestamp | 7 years |
| Override action | Admin ID, override type, justification | Permanent |
| Fraud flag | User ID, flag type, evidence, admin | Permanent |

---

**Document Owner:** Finance & Trust Operations  
**Version:** 1.0  
**Classification:** Internal Use Only  
**Date:** December 20, 2025
