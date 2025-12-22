# GUARANTEE PHASE — SECURITY DEPOSIT SYSTEM
## Fraud Prevention & Arbitration Rules

**Platform:** Mnbara  
**Document:** Security Deposit Hardening Specification  
**Date:** December 20, 2025  
**Classification:** Internal — Risk & Trust Operations

---

# 1. FRAUD SCENARIOS TABLE

## 1.1 Buyer Refusal

| Scenario | Signal | Evidence Required | Decision | Deposit Movement |
|----------|--------|-------------------|----------|------------------|
| Buyer refuses to accept delivery without reason | Traveler reports refusal + buyer silent | Photo/video of item at location + communication log + GPS timestamp | Platform rules in favor of traveler | Buyer deposit → Traveler (full) |
| Buyer claims "not what I ordered" without proof | Dispute opened, no buyer evidence | Compare original request spec vs delivered item photos | Platform review required | Hold both deposits → 48hr evidence window |
| Buyer ghosts at pickup location | Traveler at location, buyer unresponsive for 2+ hours | Traveler GPS at agreed location + call/message attempts (3+) + timestamp proof | Traveler compensation from buyer deposit | Buyer deposit → Traveler (delivery fee + compensation %) |
| Buyer demands refund after accepting | Confirmation already recorded | Buyer's own confirmation (button press / signature) | Dispute rejected | No deposit movement — case closed |
| Buyer claims item damaged in transit | Photos show damage | Pre-delivery photos (traveler) vs post-delivery photos (buyer) | Compare condition, assess fault | If traveler fault: Traveler deposit → Buyer. If pre-existing: Buyer deposit retained |

## 1.2 Fake Delivery Claim

| Scenario | Signal | Evidence Required | Decision | Deposit Movement |
|----------|--------|-------------------|----------|------------------|
| Traveler marks delivered, buyer denies receipt | Dispute opened by buyer | GPS proof of traveler location + photo at door/location + communication log | Cross-reference evidence quality | If traveler evidence weak: Traveler deposit → Buyer. If strong: Buyer required to prove non-receipt |
| Traveler uploads fake delivery photo | Image metadata inconsistent (wrong date/location) | EXIF data analysis + GPS mismatch detection | Platform flags as fraudulent | Traveler deposit → Buyer + TravelerRiskFlag SET |
| Traveler delivers to wrong address | Buyer reports wrong location | Compare agreed address vs delivery GPS coordinates | Traveler fault if mismatch > 500m | Traveler deposit → Buyer (item cost + fees) |
| Traveler claims customs seizure | No item delivered | Customs documentation required (official stamp/receipt) | Verify document authenticity | If verified: Split deposits (50/50 return). If unverified: Traveler deposit → Buyer |

## 1.3 Wrong Product

| Scenario | Signal | Evidence Required | Decision | Deposit Movement |
|----------|--------|-------------------|----------|------------------|
| Completely different item delivered | Buyer photo shows wrong product | Original request spec + receipt from purchase + buyer's photo of received item | Clear mismatch = Traveler fault | Traveler deposit → Buyer (full) |
| Correct item, wrong variant (size/color) | Buyer disputes variant | Original request spec (must include variant) + receipt + delivered item photo | If spec was vague: Shared fault. If spec clear: Traveler fault | Shared: 50/50 return. Traveler: Full to buyer |
| Counterfeit product | Buyer alleges fake | Traveler purchase receipt + brand verification (if possible) + buyer photos | Platform cannot verify authenticity without physical item | Escalate to manual review, may require return |
| Item missing accessories | Buyer claims incomplete | Original spec (must list accessories) + traveler purchase receipt | Compare itemized receipt vs delivered contents | If receipt shows accessories: Traveler deposit → Buyer (partial). If not listed: Dispute rejected |

## 1.4 Traveler Disappearance

| Scenario | Signal | Evidence Required | Decision | Deposit Movement |
|----------|--------|-------------------|----------|------------------|
| Traveler stops responding after payment received | No communication for 48+ hours | Communication log + last known activity + deposit status | Automatic escalation after 72hr silence | Traveler deposit → Buyer (full) + TravelerRiskFlag SET |
| Traveler claims personal emergency | Traveler requests delay | Proof of emergency (medical/travel docs) within 72hr | Platform grants extension or cancellation | If valid: Mutual return of deposits. If no proof: Traveler deposit → Buyer |
| Traveler's flight cancelled | Travel disruption | Airline cancellation notice + rebooking proof (if any) | Force majeure consideration | Mutual return of deposits (no penalty) |
| Traveler detained at customs | Item confiscated, traveler delayed | Official customs documentation + communication proof | Verify authenticity of docs | If verified: Mutual return. If suspicious: Hold for investigation |
| Traveler deletes account mid-transaction | Account deletion attempted | System block on deletion during active transactions | Transaction must complete or arbitrate first | Traveler deposit held until resolution |

## 1.5 Collusion Attempts

| Scenario | Signal | Evidence Required | Decision | Deposit Movement |
|----------|--------|-------------------|----------|------------------|
| Buyer-Traveler same person (self-dealing) | IP/device/payment method match | Device fingerprint + IP logs + payment account match | Transaction voided | Both deposits frozen → Investigation |
| Fake dispute to extract deposit | Pattern: User always "wins" disputes | Dispute history analysis + counterparty patterns | Flag if win rate > 80% over 5+ disputes | Case-by-case review + RiskFlag SET |
| Coordinated rating manipulation | Buyer/Traveler repeatedly transact together | Transaction graph analysis (closed loop) | If > 3 transactions between same pair in 30 days: Flag | No deposit impact, but TrustFlag SET on both |
| Third-party deposit funding | Deposit paid by non-account holder | Payment source verification | Transaction voided if mismatch | Deposits frozen → Manual review |

---

# 2. EVIDENCE REQUIREMENTS

## 2.1 Mandatory Proofs (Required for Any Dispute)

| Party | Evidence Type | Description | Validity Window |
|-------|---------------|-------------|-----------------|
| Traveler | GPS Timestamp at Delivery | Device location at time of delivery | Within 30 min of delivery claim |
| Traveler | Delivery Photo | Photo of item at delivery location | Timestamp within 24hr of delivery |
| Traveler | Purchase Receipt | Proof of item acquisition | Must match transaction item |
| Buyer | Dispute Reason | Written description of issue | Within 48hr of delivery |
| Buyer | Photo of Received Item | If disputing condition/content | Within 48hr of delivery |

## 2.2 Optional Proofs (Strengthens Case)

| Party | Evidence Type | Description | Weight |
|-------|---------------|-------------|--------|
| Traveler | Video of Handoff | Recording of item transfer | High |
| Traveler | Buyer Signature | Digital or physical confirmation | Very High |
| Traveler | Customs Declaration | Proof of legal transit | Medium |
| Buyer | Packaging Condition | Photos of how item arrived | Medium |
| Buyer | Third-Party Verification | Expert opinion (for authenticity) | High |
| Both | Communication Log | Message history with timestamps | High |
| Both | Witness Statement | Third party confirmation | Medium |

## 2.3 Invalid Proofs (Will Be Rejected)

| Evidence Type | Reason for Rejection |
|---------------|----------------------|
| Screenshots of text messages (editable) | Easily fabricated |
| Photos without EXIF data | Cannot verify timestamp/location |
| Photos with mismatched EXIF (location/date) | Suspected manipulation |
| Verbal claims without documentation | No verifiable record |
| Evidence submitted after 7-day window | Exceeds evidence submission deadline |
| Proof from unverified third parties | Cannot confirm identity/relationship |
| Evidence showing illegal activity | Cannot be used in arbitration |

---

# 3. TRUST FLAGS (READ-ONLY)

## 3.1 BuyerRiskFlag

| Flag State | Trigger Condition | Visibility | Auto-Clear |
|------------|-------------------|------------|------------|
| `BUYER_RISK_NONE` | Default state | Internal only | N/A |
| `BUYER_RISK_DISPUTE_PATTERN` | 3+ disputes in 30 days | Internal only | After 90 days clean |
| `BUYER_RISK_REFUSAL_PATTERN` | 2+ delivery refusals in 30 days | Internal only | After 90 days clean |
| `BUYER_RISK_PAYMENT_ISSUE` | Deposit payment failed 2+ times | Internal only | After successful deposit |
| `BUYER_RISK_COLLUSION_SUSPECTED` | Collusion signals detected | Internal only | Manual review only |
| `BUYER_RISK_BLACKLISTED` | Permanent ban applied | Internal only | Never (appeal only) |

**Rules:**
- Flags are SET by arbitration outcomes, never by algorithm alone
- Flags are READ-ONLY for matching/display — no score mutation
- Flags DO NOT automatically block users
- Travelers see: "This buyer has limited history" (generic) — no flag details exposed

## 3.2 TravelerRiskFlag

| Flag State | Trigger Condition | Visibility | Auto-Clear |
|------------|-------------------|------------|------------|
| `TRAVELER_RISK_NONE` | Default state | Internal only | N/A |
| `TRAVELER_RISK_DELIVERY_FAILURE` | 2+ failed deliveries in 30 days | Internal only | After 90 days clean |
| `TRAVELER_RISK_EVIDENCE_FRAUD` | Fake evidence submitted | Internal only | Manual review only |
| `TRAVELER_RISK_DISAPPEARANCE` | 1+ unexplained disappearance | Internal only | After 180 days clean |
| `TRAVELER_RISK_COLLUSION_SUSPECTED` | Collusion signals detected | Internal only | Manual review only |
| `TRAVELER_RISK_BLACKLISTED` | Permanent ban applied | Internal only | Never (appeal only) |

**Rules:**
- Flags are SET by platform arbitration, not automated
- Flags inform internal operations (support priority, manual review triggers)
- Flags DO NOT modify trust scores directly
- Buyers see: "This traveler is new" or "Verified Traveler" — no flag details exposed

---

# 4. BLACKLIST RULES

## 4.1 Permanent Blacklist

| Offense | Blacklist Type | Appeal Allowed |
|---------|----------------|----------------|
| Confirmed identity fraud (fake documents) | Permanent | NO |
| Confirmed evidence fabrication | Permanent | NO |
| Confirmed collusion (proven self-dealing) | Permanent | NO |
| Illegal items (drugs, weapons, contraband) | Permanent | NO |
| Harassment or threats to other users | Permanent | NO |
| Multiple account abuse (proven) | Permanent | NO |
| Money laundering signals (confirmed) | Permanent | NO |

## 4.2 Temporary Blacklist

| Offense | Blacklist Duration | Appeal Allowed |
|---------|-------------------|----------------|
| 3+ unresolved disputes in 30 days | 30 days | YES |
| 2+ unexplained delivery failures | 60 days | YES |
| Deposit payment failures (3+) | Until resolved | YES |
| Unverified emergency claims | 30 days | YES |
| Suspicious activity (unconfirmed) | 14 days (investigation) | YES |
| First-time collusion signals | 30 days (warning) | YES |

## 4.3 Appeal Process

| Step | Description | Timeline |
|------|-------------|----------|
| 1 | User submits appeal via support ticket | Anytime after blacklist |
| 2 | Platform reviews original evidence | 5 business days |
| 3 | User may submit new evidence | 7-day window |
| 4 | Final decision by Trust & Safety team | 10 business days |
| 5 | Decision communicated (final) | Binding, no re-appeal for 180 days |

**Appeal Rules:**
- Permanent blacklists: NO appeal (except identity fraud false positive)
- Temporary blacklists: ONE appeal allowed per incident
- Failed appeal: Blacklist duration extended by 30 days
- Successful appeal: Full restoration + public apology if reputational damage

---

# 5. ABUSE PREVENTION

## 5.1 Multiple Account Detection

| Signal | Detection Method | Action |
|--------|------------------|--------|
| Same device fingerprint | Browser/app fingerprinting | Flag for review |
| Same IP address (non-VPN) | IP matching | Flag if same IP + different accounts transact |
| Same payment method | Card/wallet fingerprint | Block transaction |
| Same phone number | Phone verification DB | Block registration |
| Same email domain pattern | Email pattern analysis (john1@, john2@) | Flag for review |
| Same document (ID/passport) | Document hash matching | Block registration + blacklist original |

**Rules:**
- Legitimate household sharing: Allowed if different payment methods + phone numbers
- Account recovery: Only one account per verified identity
- Second account request: Requires support ticket + identity re-verification

## 5.2 IP/Device Reuse Rules

| Scenario | Rule | Action |
|----------|------|--------|
| Same device, two accounts | Not allowed | Block second account |
| Same IP, two accounts (home) | Allowed with different identities | Flag, allow |
| Same IP, two accounts transacting together | Collusion signal | Block transaction + investigate |
| VPN usage | Allowed | No action |
| TOR usage | Allowed but flagged | Manual review for large transactions |
| Device change mid-transaction | Unusual | Flag for verification |

**Rules:**
- Device fingerprint stored at registration
- Device change requires re-verification (OTP)
- IP alone is not sufficient for blocking (false positives)

## 5.3 Deposit Cycling Prevention

| Pattern | Description | Detection | Action |
|---------|-------------|-----------|--------|
| Deposit → Withdraw → Repeat | User deposits, creates transaction, cancels, withdraws | Track deposit/withdrawal ratio | Flag if ratio > 3:1 in 30 days |
| Micro-deposit testing | Small deposits to test payment system | Track deposit amounts < $5 | Block after 3 micro-deposits |
| Deposit from multiple sources | Different cards/wallets funding same account | Payment source tracking | Flag if > 3 sources in 7 days |
| Deposit immediately before blacklist | User anticipates ban, tries to cash out | Withdrawal freeze during investigation | Hold withdrawals until case closed |
| Circular deposit flow | A deposits → B deposits → A deposits | Transaction graph analysis | Flag + freeze both accounts |

**Rules:**
- Minimum deposit hold: 24 hours before withdrawal available
- Maximum deposits per day: 3 transactions
- Maximum deposit sources per account: 3 verified payment methods
- Deposit during active dispute: Blocked until resolved
- Withdrawal during active dispute: Blocked until resolved

---

# DECISION AUTHORITY

| Decision Type | Authority | Override |
|---------------|-----------|----------|
| Evidence acceptance/rejection | Platform Trust Team | No external override |
| Deposit release | Platform (after evidence review) | No external override |
| Blacklist (temporary) | Automated + Trust Team review | Appeal allowed |
| Blacklist (permanent) | Trust Team only | No appeal (except false positive) |
| Dispute resolution | Platform Arbitration | Final and binding |

**Platform is FINAL ARBITRATOR.**

---

# ESCALATION MATRIX

| Dispute Value | Handler | SLA |
|--------------|---------|-----|
| < $50 | Automated rules + basic review | 48 hours |
| $50 - $200 | Trust Associate | 72 hours |
| $200 - $500 | Trust Specialist | 5 business days |
| > $500 | Trust & Safety Lead | 7 business days |
| Any + legal threat | Legal Team | 14 business days |

---

**Document Owner:** Trust & Safety Operations  
**Version:** 1.0  
**Classification:** Internal Use Only  
**Date:** December 20, 2025
