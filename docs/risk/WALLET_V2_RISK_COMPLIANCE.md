# WALLET V2 — RISK & COMPLIANCE SPECIFICATION
## Risk Map, Controls, Kill Switches & Compliance Boundaries

**Platform:** Mnbara  
**Document:** Wallet v2 Risk & Compliance Framework  
**Date:** December 20, 2025  
**Classification:** Internal — Risk, Compliance & Product

---

# 1. WALLET RISK MAP

## 1.1 Custody Risk

| Risk | Description | Likelihood | Impact | Mitigation |
|------|-------------|------------|--------|------------|
| PSP insolvency | Funds held by PSP become inaccessible | Low | Critical | Multi-PSP strategy, segregated accounts, insurance |
| Custodial failure | PSP unable to process transactions | Medium | High | Backup PSP, settlement buffer, SLA enforcement |
| Commingling | User funds mixed with platform funds | Low | Critical | Strict segregation, daily reconciliation, audit |
| Settlement delay | Funds not settled to user in time | Medium | Medium | Float buffer, real-time reconciliation, alerts |
| Regulatory seizure | Funds frozen by regulator | Low | Critical | Compliance program, legal reserves, communication plan |
| Cyber theft | Unauthorized access to custodied funds | Low | Critical | PSP security audit, cyber insurance, incident response |

**Custody Control Requirements:**

| Control | Requirement |
|---------|-------------|
| Segregation | 100% user funds segregated from platform operational funds |
| Reconciliation | Daily automated reconciliation, variance < 0.01% |
| Insurance | PSP fidelity bond covering user funds |
| Audit | Quarterly segregation attestation from PSP |
| Backup | Secondary PSP with < 24hr failover capability |

---

## 1.2 AML Exposure

| Risk | Description | Likelihood | Impact | Mitigation |
|------|-------------|------------|--------|------------|
| Money laundering | Wallet used to layer illicit funds | Medium | Critical | Transaction monitoring, velocity limits, SAR filing |
| Terrorist financing | Funds used for prohibited purposes | Low | Critical | Sanctions screening, PEP monitoring, corridor blocks |
| Structuring | Multiple small transactions to avoid thresholds | Medium | High | Aggregate monitoring, pattern detection |
| Round-tripping | Funds circulated to obscure origin | Medium | High | Graph analysis, source/destination matching |
| Third-party funding | Funds deposited by non-account holder | Medium | Medium | Payment source verification, name matching |
| Dormant abuse | Dormant accounts used for burst activity | Low | Medium | Reactivation verification, velocity caps post-dormancy |

**AML Control Requirements:**

| Control | Requirement |
|---------|-------------|
| Real-time screening | All transactions screened against OFAC, EU, UN sanctions |
| Threshold monitoring | Flag single > $3K, aggregate > $10K/30d |
| Velocity monitoring | Alert on 5x baseline activity |
| SAR capability | File within 24-72hr of detection |
| MLRO oversight | All alerts reviewed within 24hr |

---

## 1.3 Fraud Vectors

| Vector | Attack Description | Likelihood | Impact | Mitigation |
|--------|-------------------|------------|--------|------------|
| Deposit fraud | Deposit with stolen card/account | Medium | High | 3DS, card verification, deposit cooling period |
| Withdrawal fraud | Unauthorized withdrawal request | Medium | High | Withdrawal verification, cooling period, limits |
| Collusion | Buyer-traveler fake transactions | Medium | Medium | Transaction graph analysis, pattern detection |
| Chargeback abuse | Deposit, transact, chargeback | Medium | High | Chargeback buffer hold, velocity tracking |
| Identity fraud | Wallet opened with fake identity | Medium | High | Enhanced KYC, biometric verification |
| Social engineering | Support manipulated to release funds | Low | High | Strict verification protocols, dual control |

**Fraud Control Requirements:**

| Control | Requirement |
|---------|-------------|
| Deposit verification | First deposit held 24hr, card fingerprinting |
| Withdrawal verification | 2FA required for all withdrawals |
| Chargeback reserve | Hold 2% of GMV for chargeback exposure |
| Pattern detection | Real-time fraud scoring on all transactions |
| Support protocols | No fund release via phone/email without in-app 2FA |

---

## 1.4 Account Takeover (ATO)

| Vector | Attack Description | Likelihood | Impact | Mitigation |
|--------|-------------------|------------|--------|------------|
| Credential stuffing | Stolen credentials from breach | High | High | 2FA mandatory, breach detection, login alerts |
| Phishing | User tricked into revealing credentials | Medium | High | User education, anti-phishing headers, in-app warnings |
| SIM swap | Attacker takes over phone number | Medium | High | Biometric for high-risk actions, non-SMS 2FA option |
| Session hijacking | Session token stolen | Low | High | Short session lifetime, IP/device binding |
| Insider attack | Employee accesses user account | Low | Critical | Access logging, dual control, least privilege |
| Device compromise | Malware on user device | Medium | High | Device fingerprinting, anomaly detection |

**ATO Control Requirements:**

| Control | Requirement |
|---------|-------------|
| 2FA | Mandatory for all wallet actions |
| Biometric | Required for withdrawal > $100 or first withdrawal |
| Device binding | Alert on new device, require re-verification |
| Session management | 30-min idle timeout, 24hr max session |
| Login alerts | Email/push on every login |
| Suspicious activity | Auto-lock on 3 failed attempts, unusual location |

---

# 2. MANDATORY CONTROLS

## 2.1 KYC Tiering

| Tier | Verification Required | Balance Cap | Single Tx Limit | Monthly Limit | Withdrawal |
|------|----------------------|-------------|-----------------|---------------|------------|
| **Tier 0 (Unverified)** | Email + phone only | $0 | $0 | $0 | Not allowed |
| **Tier 1 (Basic)** | + ID verification | $500 | $200 | $1,000 | $500/month |
| **Tier 2 (Standard)** | + Address verification | $2,500 | $1,000 | $5,000 | $2,500/month |
| **Tier 3 (Enhanced)** | + Selfie + PEP/Sanctions clear | $10,000 | $3,000 | $15,000 | $10,000/month |
| **Tier 4 (Premium)** | + Source of funds + EDD | $50,000 | $10,000 | $50,000 | $25,000/month |
| **Tier 5 (Business)** | + Business verification + UBO | $250,000 | $50,000 | $250,000 | $100,000/month |

**Tier Upgrade Rules:**

| Rule | Description |
|------|-------------|
| Automatic upgrade | System prompts upgrade when limit approached |
| Verification validity | ID valid for 3 years, address for 1 year |
| Downgrade | If verification expires, downgrade to lower tier |
| PEP/Sanctions | Continuous screening, immediate flag on match |
| Manual override | Only by Compliance for documented reason |

---

## 2.2 Velocity Limits

| Action | Limit Type | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Cooldown |
|--------|------------|--------|--------|--------|--------|----------|
| **Deposits** | Per day | 3 | 5 | 10 | 20 | 24hr reset |
| **Deposits** | Per week | 7 | 15 | 30 | 50 | 7-day rolling |
| **Withdrawals** | Per day | 1 | 2 | 3 | 5 | 24hr reset |
| **Withdrawals** | Per week | 3 | 7 | 14 | 21 | 7-day rolling |
| **Transactions** | Per day | 5 | 10 | 25 | 50 | 24hr reset |
| **Transactions** | Per week | 15 | 35 | 75 | 150 | 7-day rolling |
| **Failed attempts** | Per day | 3 | 5 | 5 | 10 | 24hr lock |

**Velocity Breach Response:**

| Breach Level | Response |
|--------------|----------|
| Soft limit (80%) | Warning notification to user |
| Hard limit (100%) | Action blocked, user notified |
| Pattern anomaly | Flag for manual review |
| Repeat breach (3+ in 30 days) | Temporary restriction + compliance review |

---

## 2.3 Balance Caps

| Cap Type | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Tier 5 |
|----------|--------|--------|--------|--------|--------|
| **Maximum balance** | $500 | $2,500 | $10,000 | $50,000 | $250,000 |
| **Escrow maximum** | $200 | $1,000 | $3,000 | $10,000 | $50,000 |
| **Single deposit max** | $200 | $500 | $2,000 | $5,000 | $25,000 |
| **Daily deposit max** | $500 | $1,500 | $5,000 | $15,000 | $75,000 |

**Balance Cap Rules:**

| Rule | Description |
|------|-------------|
| Deposit rejection | Deposits that would exceed cap are rejected (not partially accepted) |
| Incoming transaction | Transactions that would exceed cap held in transit |
| Warning threshold | User warned at 80% of balance cap |
| Cap increase | Requires tier upgrade verification |
| Emergency override | Only by Compliance, max 48hr, documented |

---

## 2.4 Withdrawal Cooling Periods

| Scenario | Cooling Period | Bypass Allowed |
|----------|----------------|----------------|
| First withdrawal ever | 72 hours after first deposit | No |
| First withdrawal on new device | 48 hours | No |
| Withdrawal > 50% of balance | 24 hours | Biometric + support call |
| Withdrawal > $1,000 | 24 hours | Biometric only |
| Withdrawal to new destination | 48 hours | No |
| Post-password change | 72 hours | No |
| Post-phone change | 72 hours | No |
| Post-email change | 48 hours | No |
| After security alert | 72 hours | Compliance approval only |

**Cooling Period Rules:**

| Rule | Description |
|------|-------------|
| Countdown visible | User sees exact time remaining |
| Cancellation | User can cancel withdrawal during cooling |
| Acceleration | No acceleration of cooling period |
| Alert during cooling | Any suspicious activity extends by 24hr |
| Exemption | Only Compliance can exempt, fully documented |

---

# 3. WALLET KILL SWITCHES

## 3.1 Per-User Freeze

| Switch | Scope | Trigger | Authority | Reversal |
|--------|-------|---------|-----------|----------|
| `WALLET_FREEZE_INBOUND` | Block deposits | Suspicious funding | L2 Trust | L3 review |
| `WALLET_FREEZE_OUTBOUND` | Block withdrawals | Possible ATO, fraud | L2 Trust | L3 + 2FA re-verify |
| `WALLET_FREEZE_TRANSACT` | Block platform transactions | Active dispute | L2 Trust | Dispute resolution |
| `WALLET_FREEZE_FULL` | Block all wallet activity | AML flag, fraud confirmed | L3 Trust | Compliance approval |
| `WALLET_FREEZE_LEGAL` | Block all + legal hold | Regulatory/legal order | Legal | Legal/Court order |

**Per-User Freeze Rules:**

| Rule | Description |
|------|-------------|
| User notification | Required within 24hr (except legal hold) |
| Reason provided | General reason shown to user (not investigation details) |
| Appeal process | User can submit appeal via support |
| Maximum duration | 90 days without escalation to Legal |
| Funds protected | Frozen funds remain in segregated custody |

---

## 3.2 Corridor Freeze

| Switch | Scope | Trigger | Authority | Reversal |
|--------|-------|---------|-----------|----------|
| `CORRIDOR_MONITOR` | Enhanced logging | Elevated fraud rate | L4 Trust | L4 after 30-day review |
| `CORRIDOR_SLOW` | Add 24hr delay to all transactions | High fraud rate (> 5%) | Compliance | Compliance review |
| `CORRIDOR_RESTRICT` | Lower limits by 50% | Critical fraud rate | Compliance | Compliance + Legal |
| `CORRIDOR_PAUSE_NEW` | Block new transactions, allow in-flight | Regulatory concern | Legal | Legal clearance |
| `CORRIDOR_BLOCK` | Block all transactions | Sanctions, regulatory order | Legal | Legal + Regulatory |

**Corridor Freeze Thresholds:**

| Metric | MONITOR | SLOW | RESTRICT | PAUSE_NEW | BLOCK |
|--------|---------|------|----------|-----------|-------|
| Fraud rate | > 2% | > 5% | > 8% | > 10% | Regulatory |
| Dispute rate | > 10% | > 15% | > 20% | > 25% | Regulatory |
| Chargeback rate | > 1% | > 2% | > 3% | > 5% | Regulatory |

**Corridor Freeze Rules:**

| Rule | Description |
|------|-------------|
| In-flight protection | Active transactions complete under PAUSE_NEW |
| User notification | 24hr notice before RESTRICT or higher |
| Escalation path | MONITOR → SLOW → RESTRICT → PAUSE_NEW → BLOCK |
| Review cycle | Weekly review during any corridor action |
| Geographic scope | Can apply to country, route, or region |

---

## 3.3 Global Wallet Disable

| Switch | Scope | Trigger | Authority | Reversal |
|--------|-------|---------|-----------|----------|
| `GLOBAL_DEPOSIT_PAUSE` | All deposits | Payment processor issue | CTO | CTO + Finance |
| `GLOBAL_WITHDRAW_PAUSE` | All withdrawals | Liquidity crisis, breach | CFO | CFO + CEO |
| `GLOBAL_TRANSACT_PAUSE` | All wallet transactions | Critical fraud attack | CEO | CEO + CTO |
| `GLOBAL_WALLET_LOCKDOWN` | All wallet operations | Existential threat, breach | CEO + Board | Board resolution |

**Global Disable Triggers:**

| Scenario | Response | Authority |
|----------|----------|-----------|
| Payment processor outage | GLOBAL_DEPOSIT_PAUSE | CTO |
| Bank partner suspension | GLOBAL_WITHDRAW_PAUSE | CFO |
| Coordinated fraud attack (> $50K/hr loss) | GLOBAL_TRANSACT_PAUSE | CEO |
| Data breach with fund access | GLOBAL_WALLET_LOCKDOWN | CEO + Board |
| Regulatory cease and desist | GLOBAL_WALLET_LOCKDOWN | Legal + Board |

**Global Disable Rules:**

| Rule | Description |
|------|-------------|
| Immediate notification | All users notified within 1hr |
| Status page | Public status updated immediately |
| Investor notification | Board notified within 4hr |
| Maximum duration | LOCKDOWN: 72hr max before resolution plan |
| Staged reversal | LOCKDOWN → PAUSE → MONITOR → NORMAL |

---

# 4. COMPLIANCE BOUNDARIES

## 4.1 What Wallet v2 CAN Show

| Data Element | Visibility | Condition |
|--------------|------------|-----------|
| Available balance | Always | Real-time from PSP |
| Pending balance | Always | Transactions in cooling/settlement |
| Transaction history | Always | Last 12 months, full history on request |
| Deposit status | Always | Including reason for hold |
| Withdrawal status | Always | Including countdown timer |
| Escrow positions | Always | Active transactions only |
| Hold reason (general) | If held | "Verification required" / "Under review" |
| Limit status | Always | Current tier, limits, usage |
| Verification status | Always | Current tier, what's needed for next |
| Fee breakdown | Always | Before any transaction |

**Display Rules:**

| Rule | Description |
|------|-------------|
| Balance accuracy | Displayed balance must match PSP within 60 seconds |
| No hidden fees | All fees shown before confirmation |
| No hidden holds | All holds explained (general reason) |
| Audit trail | User can request full transaction export |
| Real-time sync | Refresh on every screen open |

---

## 4.2 What Wallet v2 CAN Lock

| Lock Type | Reason | User Visibility | Unlock Path |
|-----------|--------|-----------------|-------------|
| Inbound lock | Suspicious funding source | "Deposits temporarily paused" | Verification required |
| Outbound lock | Security concern | "Withdrawals paused for security" | Re-verify identity |
| Transaction lock | Dispute active | "Funds held pending resolution" | Dispute resolution |
| Balance lock | AML review | "Account under review" | Compliance clearance |
| Full lock | Fraud/regulatory | "Account restricted" | Compliance + possible legal |

**Lock Rules:**

| Rule | Description |
|------|-------------|
| Reason always shown | User sees category of reason (not details) |
| Estimated time | Show estimate if available |
| Appeal path | Clear CTA to contact support |
| No silent locks | Lock must trigger user notification within 24hr |
| Partial operations | Only lock what's necessary (precision locking) |

---

## 4.3 What Wallet v2 CANNOT Move Without Human Approval

| Action | Approval Required | Approval Authority |
|--------|-------------------|-------------------|
| Withdrawal > $1,000 | User 2FA + biometric | User |
| Withdrawal > $5,000 | User + 24hr cooling | User + system |
| Withdrawal > 50% balance | User + biometric + cooling | User + system |
| First withdrawal | 72hr cooling, no bypass | System |
| Withdrawal to new destination | 48hr cooling | System |
| Release from escrow | Buyer confirmation OR arbitration | Buyer OR platform |
| Refund from escrow | Arbitration decision | Platform (dual approval) |
| Fund freeze | L2+ Trust team member | Platform |
| Freeze reversal | L3+ Trust + verification | Platform |
| Limit override | Compliance only | Platform |
| Emergency fund release | L4 + Compliance dual | Platform |

**Approval Rules:**

| Rule | Description |
|------|-------------|
| No automation for fund release | All fund movements require human trigger or confirmation |
| Cooling period mandatory | System-enforced, cannot be bypassed by code |
| Dual control for high value | > $5,000 requires two platform approvals |
| User confirmation required | User must actively confirm (no passive consent) |
| Audit trail | Every approval logged with identity + timestamp |

---

# 5. RED LINES

## 5.1 AI Cannot Move Funds

| Rule | Description | Enforcement |
|------|-------------|-------------|
| `AI_NO_FUND_MOVEMENT` | AI/ML systems cannot execute fund movements | Hard-coded system constraint |
| `AI_NO_FREEZE_EXECUTION` | AI cannot directly freeze accounts | AI flags only, human executes |
| `AI_NO_RELEASE_APPROVAL` | AI cannot approve fund release | AI recommends, human decides |
| `AI_NO_LIMIT_OVERRIDE` | AI cannot change user limits | AI suggests, compliance decides |
| `AI_NO_BYPASS_COOLING` | AI cannot shorten cooling periods | Cooling periods are absolute |

**AI Permitted Actions:**

| Action | AI Role | Human Role |
|--------|---------|------------|
| Fraud detection | Flag transaction | Trust team reviews + decides |
| AML monitoring | Generate alert | MLRO reviews + files SAR |
| Risk scoring | Calculate score | Score informs human decision |
| Pattern detection | Identify anomaly | Trust team investigates |
| Recommendation | Suggest action | Human approves or rejects |

---

## 5.2 No Silent Freezes

| Rule | Description | Enforcement |
|------|-------------|-------------|
| `FREEZE_REQUIRES_NOTIFICATION` | User must be notified of any freeze within 24hr | System-enforced notification |
| `FREEZE_REQUIRES_REASON` | General reason category must be shown | Template reasons, always visible |
| `FREEZE_REQUIRES_APPEAL` | Clear appeal path must be provided | Support CTA on every freeze screen |
| `FREEZE_AUDIT_MANDATORY` | All freezes logged with authority + timestamp | Immutable audit log |
| `FREEZE_REVIEW_REQUIRED` | All freezes reviewed within 7 days | Compliance review queue |

**Exception: Law Enforcement Hold**

| Condition | Handling |
|-----------|----------|
| Court order requiring non-disclosure | User not notified |
| Regulatory investigation | Notification may be delayed per regulation |
| Documentation | All exceptions require legal order on file |
| Review | Legal must review non-notification quarterly |

---

## 5.3 All Actions Explainable

| Principle | Description | Implementation |
|-----------|-------------|----------------|
| `EXPLAINABLE_TO_USER` | User can understand why action taken | Plain-language explanations |
| `EXPLAINABLE_TO_REGULATOR` | Platform can document reason to regulator | Complete audit trail |
| `EXPLAINABLE_TO_AUDITOR` | External auditor can verify decision logic | Decision documentation |
| `NO_BLACK_BOX_DECISIONS` | No decision based on opaque AI score alone | Human rationale required |
| `TRACEABLE_AUTHORITY` | Every action linked to responsible person | Named accountability |

**Explainability Requirements:**

| Action | User Explanation | Internal Documentation |
|--------|------------------|------------------------|
| Freeze | "Account paused for security review" | Full risk factors + evidence |
| Limit reached | "Daily limit reached. Resets in X hours." | Transaction log |
| Withdrawal delayed | "72-hour security hold on new accounts" | Policy reference |
| Transaction blocked | "This transaction exceeds your current limit" | Limit calculation |
| Verification required | "Additional verification needed for this amount" | KYC tier requirement |

---

# CONTROL AUTHORITY MATRIX

| Control | L1 Support | L2 Trust | L3 Trust | L4 Trust | Compliance | Legal | CEO |
|---------|------------|----------|----------|----------|------------|-------|-----|
| View user wallet | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Freeze inbound | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Freeze outbound | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Freeze full | — | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Unfreeze | — | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Override limits | — | — | — | — | ✓ | — | ✓ |
| Corridor freeze | — | — | — | ✓ | ✓ | ✓ | ✓ |
| Global pause | — | — | — | — | — | ✓ | ✓ |
| Global lockdown | — | — | — | — | — | — | ✓ (+ Board) |

---

# AUDIT REQUIREMENTS

| Event | Logged Data | Retention | Access |
|-------|-------------|-----------|--------|
| Balance change | Before/after, reason, authority | 7 years | Compliance + Audit |
| Freeze action | User, scope, reason, authority | 7 years | Compliance + Legal |
| Unfreeze action | User, scope, authority, verification | 7 years | Compliance + Legal |
| Limit override | User, old/new limit, authority, reason | 7 years | Compliance |
| Kill switch | Switch type, scope, authority, reason | Permanent | Legal + Executive |
| Human approval | Approver, action, timestamp, evidence | 7 years | Compliance + Audit |
| AI flag | Algorithm, input, output, human decision | 7 years | Compliance + Audit |

---

**Document Owner:** Risk & Compliance  
**Version:** 1.0  
**Classification:** Internal — Restricted Distribution  
**Date:** December 20, 2025
