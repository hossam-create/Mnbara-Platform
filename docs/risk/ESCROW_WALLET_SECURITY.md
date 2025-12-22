# REAL ESCROW & WALLET — SECURITY SPECIFICATION
## Financial Risk, AML Compliance & Kill Switch Controls

**Platform:** Mnbara  
**Document:** Escrow & Wallet Security Controls  
**Date:** December 20, 2025  
**Classification:** Internal — Finance, Risk & Compliance

---

# 1. FINANCIAL RISK TABLE

## 1.1 Chargeback Attempt

| Scenario | Risk | Control | Escalation |
|----------|------|---------|------------|
| Buyer initiates chargeback after delivery confirmed | Fund loss + traveler unpaid | Immediate escrow freeze on chargeback notification | Finance → Legal within 24hr |
| Buyer initiates chargeback before delivery | Transaction cancellation | Auto-cancel transaction, return traveler deposit | Standard process, no escalation |
| Serial chargebacker detected (2+ in 90 days) | Pattern fraud | Account restriction + enhanced verification | Compliance review + possible ban |
| Chargeback on released funds (post-payout) | Platform loss | Recover from traveler payout if possible; if not, platform absorbs | Finance → Legal → Recovery |
| Fraudulent chargeback (goods received, buyer lies) | Fund loss + reputation | Fight chargeback with delivery evidence | Legal + payment processor dispute |

**Controls:**

| Control | Description |
|---------|-------------|
| Chargeback buffer | 14-day hold after delivery before traveler payout |
| Evidence package | Auto-generate chargeback defense package on release |
| Repeat offender block | 2+ chargebacks = permanent payment method ban |
| Card fingerprinting | Track card BIN + last 4 across accounts |
| 3D Secure mandatory | All card payments require 3DS authentication |

---

## 1.2 Fake Delivery Confirmation

| Scenario | Risk | Control | Escalation |
|----------|------|---------|------------|
| Traveler marks delivered without actual delivery | Fraudulent fund release | Buyer confirmation required before release | Standard dispute if buyer denies |
| Traveler submits fake GPS/photo evidence | Evidence fraud | EXIF verification + GPS cross-reference | Trust team review |
| Traveler confirms delivery, buyer silent (14+ days) | Ambiguous state | Auto-release after 14 days with warning emails | Standard auto-release |
| Coordinated fake confirmation (traveler controls buyer account) | Account compromise/collusion | Device/IP cross-reference | Fraud investigation |
| Repeated fake delivery patterns (2+ disputed) | Serial fraud | Account suspension + hold all funds | Compliance + Legal |

**Controls:**

| Control | Description |
|---------|-------------|
| Dual confirmation | Both traveler + buyer must confirm for instant release |
| GPS accuracy threshold | Delivery GPS must be within 500m of buyer address |
| Photo timestamp | Delivery photo must have valid EXIF within 24hr |
| Cooling period | 72hr hold even after dual confirmation for first-time travelers |
| Dispute window | Buyer has 48hr post-delivery to dispute |

---

## 1.3 Collusion: Buyer + Traveler

| Scenario | Risk | Control | Escalation |
|----------|------|---------|------------|
| Same person controls both accounts | Self-dealing, fee avoidance | Device/IP/payment fingerprint matching | Immediate freeze + investigation |
| Family/friend collusion for fake transactions | Artificial volume, rating manipulation | Transaction graph analysis (closed loops) | Flag + manual review |
| Fake disputes to extract deposits | Deposit theft | Dispute outcome analysis (win rate anomalies) | Compliance review |
| Collusion to launder funds | AML violation | Payment pattern analysis | AML team + SAR filing |
| Split account usage (buyer on device A, traveler on device B, same owner) | Detection evasion | Behavioral biometrics + session patterns | Enhanced monitoring |

**Controls:**

| Control | Description |
|---------|-------------|
| Device fingerprint match | Block transactions between accounts with same device |
| IP correlation | Flag same IP transacting as buyer AND traveler |
| Payment source match | Block if buyer payment source = traveler payout destination |
| Transaction velocity | Flag if same pair transacts 3+ times in 30 days |
| Graph analysis | Weekly scan for closed-loop transaction patterns |

---

## 1.4 Money Laundering Patterns

| Scenario | Risk | Control | Escalation |
|----------|------|---------|------------|
| Structuring (multiple transactions just under reporting threshold) | AML violation | Aggregate transaction monitoring | AML team + SAR filing |
| Rapid in-out (deposit → transaction → withdraw) | Layering | Minimum hold periods + withdrawal delays | Compliance review |
| High-value transactions from high-risk jurisdictions | Sanctions/AML risk | Enhanced due diligence (EDD) | Compliance + possible block |
| Unusual transaction patterns (late night, round numbers) | Suspicious activity | Behavioral anomaly detection | AML review |
| Third-party funding (someone else pays for buyer) | Source of funds unclear | Payment source verification | Block + request documentation |

**Controls:**

| Control | Description |
|---------|-------------|
| Transaction threshold alerts | Auto-flag transactions > $3,000 |
| Aggregate monitoring | Track 30-day cumulative volume per user |
| Source of funds | Require documentation for deposits > $5,000 |
| Jurisdiction screening | Block/flag sanctioned countries |
| PEP screening | Check politically exposed persons database |

---

## 1.5 Rapid Wallet Cycling

| Scenario | Risk | Control | Escalation |
|----------|------|---------|------------|
| Deposit → withdraw within hours | Testing/layering | Minimum 24hr hold on deposits | Auto-block repeat offenders |
| Multiple deposits from different sources, single withdrawal | Aggregation/laundering | Flag if 3+ deposit sources in 7 days | AML review |
| Circular flow (A → B → A) | Round-tripping | Transaction graph detection | Freeze both accounts |
| Micro-deposits followed by large withdrawal | Structuring | Aggregate deposit tracking | Compliance flag |
| Wallet used as pass-through (no actual transactions) | Money transmission | Require transaction history for large withdrawals | Compliance review |

**Controls:**

| Control | Description |
|---------|-------------|
| Deposit hold | 24hr minimum before withdrawal available |
| Withdrawal limits | Daily: $1,000 / Weekly: $5,000 / Monthly: $15,000 |
| Source matching | Withdrawal destination must match verified user identity |
| Activity requirement | Must have 1+ completed transaction before withdrawal > $500 |
| Velocity limits | Max 3 deposits per day, 5 withdrawals per week |

---

# 2. AML / COMPLIANCE FLAGS (READ-ONLY)

## 2.1 Velocity Anomaly

| Flag State | Trigger Condition | Effect | Auto-Clear |
|------------|-------------------|--------|------------|
| `VELOCITY_NORMAL` | Within expected patterns | Standard processing | N/A |
| `VELOCITY_ELEVATED` | 3x normal transaction frequency in 7 days | Enhanced monitoring | After 30 days normal activity |
| `VELOCITY_HIGH` | 5x normal transaction frequency in 7 days | Manual review queue | After 60 days normal activity |
| `VELOCITY_CRITICAL` | 10x normal OR > 20 transactions in 24hr | Immediate compliance alert | Manual clear only |

**Velocity Thresholds:**

| User Type | Normal (30-day) | Elevated | High | Critical |
|-----------|-----------------|----------|------|----------|
| New User (< 90 days) | 1-3 transactions | 4-6 | 7-10 | 11+ |
| Established User | 5-15 transactions | 16-30 | 31-50 | 51+ |
| Power User (verified) | 20-50 transactions | 51-100 | 101-150 | 151+ |

**Rules:**
- Flag is READ-ONLY — informs review, does not auto-block
- Velocity calculated on rolling 7-day and 30-day windows
- Both transaction count AND value velocity tracked
- Value velocity: Same thresholds applied to cumulative amounts

---

## 2.2 Round-Trip Payments

| Flag State | Trigger Condition | Effect | Auto-Clear |
|------------|-------------------|--------|------------|
| `ROUND_TRIP_NONE` | No circular patterns detected | Standard processing | N/A |
| `ROUND_TRIP_SUSPECTED` | A → B → A within 30 days detected | Flag for review | After 90 days no recurrence |
| `ROUND_TRIP_CONFIRMED` | A → B → A with minimal value change (< 5%) | Compliance investigation | Manual clear after investigation |
| `ROUND_TRIP_NETWORK` | 3+ accounts in circular flow | AML escalation | Manual clear + possible SAR |

**Detection Pattern:**

| Pattern | Description | Flag Level |
|---------|-------------|------------|
| Simple loop | A pays B, B pays A | SUSPECTED |
| Value-preserving loop | Loop with < 5% value loss | CONFIRMED |
| Multi-hop loop | A → B → C → A | CONFIRMED |
| Complex network | 4+ accounts interconnected | NETWORK |

**Rules:**
- Detection runs on 30-day rolling window
- Same payment method on both ends = higher flag priority
- Timing correlation (payments within 24hr of each other) = elevated suspicion
- All CONFIRMED and NETWORK flags require SAR assessment

---

## 2.3 Repeated Disputes

| Flag State | Trigger Condition | Effect | Auto-Clear |
|------------|-------------------|--------|------------|
| `DISPUTE_NORMAL` | 0-1 disputes in 90 days | Standard processing | N/A |
| `DISPUTE_ELEVATED` | 2-3 disputes in 90 days | Enhanced evidence requirements | After 180 days clean |
| `DISPUTE_HIGH` | 4-5 disputes in 90 days | Manual review for all transactions | After 365 days clean |
| `DISPUTE_CRITICAL` | 6+ disputes in 90 days OR 50%+ dispute rate | Transaction restrictions | Manual clear only |

**Dispute Analysis:**

| Metric | Weight | Impact |
|--------|--------|--------|
| Disputes won by user | Low | May indicate legitimate issues |
| Disputes lost by user | High | Indicates user-at-fault pattern |
| Disputes withdrawn | Medium | May indicate gaming |
| Dispute timing (late disputes) | High | May indicate buyer's remorse abuse |

**Rules:**
- DISPUTE_CRITICAL users: Maximum transaction value capped at $100
- Users losing 3+ consecutive disputes: TBD by compliance
- Dispute rate = disputes / total transactions (minimum 5 transactions)
- Both buyer-initiated AND traveler-initiated disputes counted

---

## 2.4 Cross-Border High-Risk Corridor

| Flag State | Trigger Condition | Effect | Auto-Clear |
|------------|-------------------|--------|------------|
| `CORRIDOR_STANDARD` | Low-risk country pair | Standard processing | N/A |
| `CORRIDOR_MONITORED` | One monitored country involved | Enhanced documentation | Per-transaction |
| `CORRIDOR_HIGH_RISK` | One high-risk country involved | Compliance review required | Per-transaction |
| `CORRIDOR_RESTRICTED` | Sanctioned or blocked country | Transaction blocked | N/A — Cannot transact |

**Country Risk Classification:**

| Category | Examples | Treatment |
|----------|----------|-----------|
| **Standard** | US-UK, US-Canada, EU internal | Normal processing |
| **Monitored** | Turkey, UAE, Brazil, Russia | Enhanced monitoring |
| **High-Risk** | Iran-adjacent, Afghanistan-adjacent, Venezuela | Compliance review |
| **Restricted** | OFAC-sanctioned, UN-sanctioned | Transaction blocked |

**Corridor-Specific Controls:**

| Corridor Type | Max Transaction | Documentation Required |
|---------------|-----------------|------------------------|
| Standard | $5,000 | Standard KYC |
| Monitored | $2,000 | Standard KYC + transaction purpose |
| High-Risk | $500 | Enhanced KYC + source of funds + purpose |
| Restricted | $0 | N/A — Blocked |

**Rules:**
- Corridor flag SET based on traveler origin + buyer destination
- Flag is READ-ONLY but triggers required controls
- CORRIDOR_RESTRICTED: Hard block, no override possible
- Corridor list updated quarterly from FATF + OFAC + EU lists

---

# 3. ESCROW DISPUTE LOGIC

## 3.1 Evidence Priority Order

| Priority | Evidence Type | Weight | Notes |
|----------|---------------|--------|-------|
| 1 | **Bank/Payment processor record** | Definitive | Platform's payment gateway logs |
| 2 | **Buyer in-app confirmation button press** | Very High | Timestamped, cannot be forged |
| 3 | **Traveler delivery photo + GPS** | High | Must have valid EXIF + GPS |
| 4 | **Communication logs (in-app)** | High | Timestamped, immutable |
| 5 | **Third-party tracking (courier API)** | Medium-High | If applicable |
| 6 | **External photos (no EXIF)** | Medium | Considered but not definitive |
| 7 | **External communication (WhatsApp, etc.)** | Low | Easily edited, low weight |
| 8 | **Verbal/written statements** | Very Low | No verification possible |

**Evidence Evaluation Rules:**

| Rule | Description |
|------|-------------|
| Single-source evidence | Never decide based on only one piece of evidence |
| Contradictory evidence | Higher-weight evidence wins |
| Missing evidence | Party with burden of proof loses if evidence absent |
| Late evidence | Evidence submitted after 7 days = reduced weight |
| EXIF validation | All photo evidence must pass EXIF integrity check |

---

## 3.2 When Refund Overrides Delivery

| Condition | Result | Fund Movement |
|-----------|--------|---------------|
| Buyer provides proof of non-delivery + traveler has no counter-evidence | Refund buyer | Escrow → Buyer |
| Item confirmed delivered but significantly not as described (evidence clear) | Refund buyer | Escrow → Buyer |
| Traveler unresponsive for 14+ days + buyer requests refund | Refund buyer | Escrow → Buyer |
| Chargeback won by buyer (bank decision) | Refund enforced | Escrow → Buyer (via bank) |
| Traveler admits non-delivery or fault | Refund buyer | Escrow → Buyer |
| Item confirmed illegal/prohibited (customs seizure with documentation) | Partial refund | Escrow → Buyer (minus any recovery) |

**Refund Decision Authority:**

| Amount | Decision Authority |
|--------|-------------------|
| < $100 | L2 Trust Associate |
| $100 - $500 | L3 Trust Specialist |
| $500 - $2,000 | L3 + L4 (dual approval) |
| > $2,000 | L4 + Compliance (dual approval) |

**Rules:**
- Refund ALWAYS requires documented justification
- Refund does not close dispute — traveler appeal window: 7 days
- Refund is reversible only if new definitive evidence emerges
- Partial refunds allowed (pro-rata) for partial delivery

---

## 3.3 When Freeze is Mandatory

| Trigger | Freeze Scope | Duration | Release Authority |
|---------|--------------|----------|-------------------|
| Chargeback/reversal received | Disputed transaction | 90 days | Bank resolution |
| AML flag triggered | User's full wallet | Until cleared | Compliance officer |
| Sanctions match detected | User's full wallet | Indefinite | Legal + Compliance |
| Fraud investigation initiated | User's full wallet | Until investigation complete | Fraud team lead |
| Regulatory inquiry received | Affected transactions | As required | Legal team |
| Court order/subpoena | As specified | As ordered | Legal team |
| Platform security breach | All wallets | Until secure | CTO + CEO |
| Collusion confirmed | Both users' wallets | Until investigation complete | Compliance |

**Mandatory Freeze Rules:**

| Rule | Description |
|------|-------------|
| No single-person release | Mandatory freezes require dual approval to lift |
| User notification | User notified within 24hr (except law enforcement holds) |
| No interest accrual | Frozen funds do not earn/lose value |
| Maximum hold without action | 90 days — then must escalate to Legal |
| Appeal process | User may appeal after 14 days with new evidence |

---

# 4. KILL SWITCHES

## 4.1 Wallet Freeze

| Switch | Scope | Trigger | Authority | Reversal |
|--------|-------|---------|-----------|----------|
| `USER_WALLET_FREEZE` | Single user wallet | Fraud suspicion, AML flag, user request | L4 Trust Lead | L4 + Compliance |
| `USER_WALLET_PARTIAL_FREEZE` | Specific funds only | Disputed transaction | L3 Trust Specialist | L3 + L4 |
| `USER_WALLET_PAYOUT_FREEZE` | Block withdrawals only | Verification required | L2 Trust Associate | L3 |
| `USER_WALLET_INBOUND_FREEZE` | Block deposits only | Suspicious funding source | Compliance | Compliance |

**Wallet Freeze Rules:**

| Rule | Description |
|------|-------------|
| User notification | Required within 24hr (standard) or withheld (law enforcement) |
| Maximum duration | 90 days without escalation to Legal |
| Partial operations | Specify exactly what is frozen (deposits, withdrawals, transactions) |
| Emergency override | CEO only — logged + justified |

---

## 4.2 Escrow Freeze

| Switch | Scope | Trigger | Authority | Reversal |
|--------|-------|---------|-----------|----------|
| `ESCROW_TRANSACTION_FREEZE` | Single transaction | Dispute opened, fraud suspicion | L2 Trust Associate | L3 after resolution |
| `ESCROW_USER_FREEZE` | All of user's escrow positions | Multiple disputes, fraud pattern | L3 Trust Specialist | L4 + Compliance |
| `ESCROW_CORRIDOR_FREEZE` | All transactions on a route | Regulatory concern, fraud cluster | Compliance | Compliance + Legal |
| `ESCROW_GLOBAL_FREEZE` | All platform escrow | Critical incident, breach | CEO + CTO | CEO + CTO + Legal |

**Escrow Freeze Rules:**

| Rule | Description |
|------|-------------|
| Automatic transaction freeze | Any dispute auto-freezes that transaction |
| User freeze threshold | 3+ frozen transactions = auto-user-freeze |
| Corridor freeze threshold | 10+ frozen transactions in 7 days = auto-corridor-freeze |
| Global freeze | Only for existential threats (breach, regulatory shutdown) |

---

## 4.3 Corridor-Wide Suspension

| Switch | Scope | Trigger | Authority | Reversal |
|--------|-------|---------|-----------|----------|
| `CORRIDOR_MONITOR` | Enhanced surveillance on route | Elevated fraud rate | L4 Trust Lead | L4 after 30-day review |
| `CORRIDOR_RESTRICT` | Lower limits on route | High fraud rate (> 5%) | Compliance | Compliance + Finance |
| `CORRIDOR_SUSPEND_NEW` | Block new transactions | Critical fraud rate (> 10%) | Compliance + Legal | Legal clearance |
| `CORRIDOR_SUSPEND_ALL` | Block all transactions | Regulatory order, sanctions | Legal | Legal + Regulatory clearance |

**Corridor Metrics:**

| Metric | Formula | Threshold |
|--------|---------|-----------|
| Fraud Rate | (Confirmed fraud transactions / Total transactions) × 100 | > 5% = RESTRICT |
| Dispute Rate | (Disputes / Total transactions) × 100 | > 15% = MONITOR |
| Chargeback Rate | (Chargebacks / Total transactions) × 100 | > 2% = RESTRICT |
| Loss Rate | (Platform losses / GMV) × 100 | > 1% = SUSPEND_NEW |

**Corridor Suspension Rules:**

| Rule | Description |
|------|-------------|
| In-flight transactions | Allowed to complete under SUSPEND_NEW |
| Notification | Users notified 24hr before RESTRICT/SUSPEND_NEW |
| Duration | SUSPEND_NEW: Max 30 days, then must lift or escalate |
| Review cycle | Weekly review during any corridor action |

---

## 4.4 Global Financial Halt

| Switch | Scope | Trigger | Authority | Reversal |
|--------|-------|---------|-----------|----------|
| `GLOBAL_DEPOSIT_HALT` | All deposits platform-wide | Payment processor failure, fraud attack | CTO + Finance Controller | CTO + CEO |
| `GLOBAL_WITHDRAWAL_HALT` | All withdrawals platform-wide | Liquidity crisis, breach | CFO + CEO | CFO + CEO + Board |
| `GLOBAL_TRANSACTION_HALT` | All new transactions | Critical breach, regulatory order | CEO + Legal | CEO + Legal + Board |
| `GLOBAL_FULL_HALT` | All financial operations | Existential threat | CEO + Board | Board approval |

**Global Halt Triggers:**

| Scenario | Response |
|----------|----------|
| Payment processor down | GLOBAL_DEPOSIT_HALT |
| Bank partner suspension | GLOBAL_WITHDRAWAL_HALT |
| Data breach with financial exposure | GLOBAL_TRANSACTION_HALT |
| Regulatory cease-and-desist | GLOBAL_FULL_HALT |
| Coordinated fraud attack (> $50K/hr) | GLOBAL_TRANSACTION_HALT |

**Global Halt Rules:**

| Rule | Description |
|------|-------------|
| Immediate notification | All users, partners, regulators notified within 1hr |
| Status page | Public status page updated immediately |
| Investor notification | Board notified within 4hr |
| Maximum duration | GLOBAL_FULL_HALT: 72hr max before resolution plan required |
| Reversal process | Staged reversal: HALT → RESTRICT → MONITOR → NORMAL |

---

# AUTHORITY MATRIX

| Action | L2 | L3 | L4 | Compliance | Finance | Legal | CEO |
|--------|----|----|----|----|---------|-------|-----|
| User Wallet Freeze | — | — | ✓ | ✓ | — | — | ✓ |
| Escrow Transaction Freeze | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| Escrow User Freeze | — | ✓ | ✓ | ✓ | — | — | ✓ |
| Corridor Restrict | — | — | — | ✓ | ✓ | — | ✓ |
| Corridor Suspend | — | — | — | ✓ | — | ✓ | ✓ |
| Global Deposit Halt | — | — | — | — | ✓ | — | ✓ |
| Global Withdrawal Halt | — | — | — | — | ✓ | — | ✓ |
| Global Transaction Halt | — | — | — | — | — | ✓ | ✓ |
| Global Full Halt | — | — | — | — | — | — | ✓ (+ Board) |

---

# AUDIT TRAIL REQUIREMENTS

| Action | Logged Data | Retention |
|--------|-------------|-----------|
| Any freeze initiated | User ID, scope, reason, authority, timestamp | 7 years |
| Any freeze released | User ID, scope, resolution, authority, timestamp | 7 years |
| Kill switch activated | Switch type, scope, reason, authority, timestamp | Permanent |
| Kill switch deactivated | Switch type, resolution, authority, timestamp | Permanent |
| AML flag set | User ID, flag type, evidence, timestamp | 7 years + SAR retention |
| Dispute decision | Transaction ID, decision, evidence summary, authority | 7 years |
| Fund release | Transaction ID, amount, recipient, approvers | 7 years |

---

**Document Owner:** Finance, Risk & Compliance Operations  
**Version:** 1.0  
**Classification:** Internal — Restricted Distribution  
**Date:** December 20, 2025
