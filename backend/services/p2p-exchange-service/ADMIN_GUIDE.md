# P2P Exchange - Admin Guide

**Administrative Guide for P2P Exchange Service**

This guide covers administrative operations, monitoring, and troubleshooting for the P2P Exchange Service.

---

## Table of Contents

1. [Admin Dashboard](#admin-dashboard)
2. [Proof Verification](#proof-verification)
3. [Dispute Resolution](#dispute-resolution)
4. [User Management](#user-management)
5. [Settlement Management](#settlement-management)
6. [Monitoring & Alerts](#monitoring--alerts)
7. [Security Operations](#security-operations)
8. [Reporting](#reporting)

---

## Admin Dashboard

### Accessing the Dashboard

1. Navigate to `/admin/exchange`
2. Login with admin credentials
3. Dashboard loads with real-time statistics

### Dashboard Overview

**Key Metrics**:
- Active exchange requests
- Pending matches
- Pending proofs
- Active disputes
- Settlement success rate
- Platform revenue (24h, 7d, 30d)

**Quick Actions**:
- Review pending proofs
- View active disputes
- Monitor settlements
- Freeze user accounts
- Generate reports

---

## Proof Verification

### Proof Review Queue

**Endpoint**: `/api/v1/admin/exchange/proofs/pending`

**View**: Admin Dashboard → Proof Verification

### Reviewing Proofs

**For each proof**:

1. **View Proof Image/PDF**
   - Click to open full-size
   - Check clarity and readability
   - Verify all details visible

2. **Check Transaction Details**
   - Amount matches
   - Recipient matches
   - Date/time is recent
   - Reference number (if applicable)

3. **Verify Against Match**
   - Match ID
   - Buyer and seller IDs
   - Transaction amount
   - Currency pair

4. **Check for Red Flags**
   - Edited/photoshopped images
   - Wrong amount
   - Wrong recipient
   - Old transaction date
   - Suspicious patterns

### Verification Actions

**Approve Proof**:
```
POST /api/v1/admin/exchange/proofs/:id/verify
{
  "approved": true,
  "notes": "Payment verified successfully"
}
```

**What happens**:
- Proof status → VERIFIED
- Seller is notified
- Settlement proceeds
- Match completes

**Reject Proof**:
```
POST /api/v1/admin/exchange/proofs/:id/verify
{
  "approved": false,
  "notes": "Amount does not match transaction"
}
```

**What happens**:
- Proof status → REJECTED
- Buyer is notified
- Buyer can upload new proof
- Or dispute is created

### Verification Guidelines

**Approve if**:
- ✅ Clear and readable
- ✅ Correct amount
- ✅ Correct recipient
- ✅ Recent date/time
- ✅ Valid transaction reference

**Reject if**:
- ❌ Blurry or unreadable
- ❌ Wrong amount
- ❌ Wrong recipient
- ❌ Old transaction
- ❌ Edited/fake proof
- ❌ Duplicate proof

**Request More Info if**:
- ⚠️ Partially visible
- ⚠️ Missing details
- ⚠️ Unclear reference
- ⚠️ Unusual format

---

## Dispute Resolution

### Dispute Types

1. **Payment Not Received**: Seller claims non-receipt
2. **Wrong Amount**: Amount mismatch
3. **Timeout**: Automatic dispute after timeout
4. **Fraud Suspicion**: Suspicious activity detected
5. **Communication Violation**: External contact attempt

### Dispute Review Process

**Step 1: Review Case Details**
- Match information
- Transaction details
- Timeline of events
- User communication logs

**Step 2: Review Evidence**
- Buyer's proof of payment
- Seller's account statements
- Communication logs
- Previous transaction history

**Step 3: Investigate**
- Check payment provider status
- Verify transaction with bank (if needed)
- Review user history
- Check for patterns

**Step 4: Make Decision**
- Favor buyer
- Favor seller
- Split decision
- Request more evidence

### Resolution Actions

**Favor Buyer**:
```
POST /api/v1/admin/exchange/disputes/:id/resolve
{
  "decision": "FAVOR_BUYER",
  "reason": "Payment proof is valid, seller account issue",
  "action": "REFUND_BUYER"
}
```

**What happens**:
- Buyer gets refund
- Seller's security deposit deducted
- Seller's trust level downgraded
- Match marked as failed

**Favor Seller**:
```
POST /api/v1/admin/exchange/disputes/:id/resolve
{
  "decision": "FAVOR_SELLER",
  "reason": "No valid proof of payment provided",
  "action": "DEDUCT_BUYER_DEPOSIT"
}
```

**What happens**:
- Seller keeps funds
- Buyer's security deposit deducted
- Buyer's trust level downgraded
- Match marked as failed

**Split Decision**:
```
POST /api/v1/admin/exchange/disputes/:id/resolve
{
  "decision": "SPLIT",
  "reason": "Both parties partially at fault",
  "action": "PARTIAL_REFUND"
}
```

**What happens**:
- Partial refund to buyer
- Partial deduction from seller
- Both trust levels affected
- Match marked as disputed

### Dispute Guidelines

**Favor Buyer if**:
- Valid proof of payment
- Seller account issues
- Seller unresponsive
- Clear evidence of payment

**Favor Seller if**:
- No valid proof
- Buyer admitted non-payment
- Fake/edited proof
- Payment to wrong account

**Split if**:
- Both parties partially at fault
- Unclear evidence
- Technical issues
- Good faith errors

---

## User Management

### Viewing User Details

**Endpoint**: `/api/v1/admin/users/:userId/exchange-activity`

**Information Available**:
- Total exchanges
- Success rate
- Average completion time
- Dispute rate
- Trust level
- Security deposit balance
- Active requests/matches
- Transaction history

### User Actions

**Freeze Security Deposit**:
```
POST /api/v1/admin/exchange/security-deposit/:userId/freeze
{
  "amount": 100,
  "reason": "Suspicious activity detected"
}
```

**Use cases**:
- Fraud investigation
- Multiple disputes
- Suspicious patterns
- Policy violations

**Unfreeze Security Deposit**:
```
POST /api/v1/admin/exchange/security-deposit/:userId/unfreeze
{
  "amount": 100,
  "reason": "Investigation completed, no fraud found"
}
```

**Downgrade Trust Level**:
```
POST /api/v1/admin/exchange/trust-level/:userId/downgrade
{
  "newLevel": "BRONZE",
  "reason": "Multiple failed transactions"
}
```

**Ban User**:
```
POST /api/v1/admin/users/:userId/ban
{
  "reason": "Confirmed fraud",
  "duration": "permanent"
}
```

**What happens**:
- User cannot create requests
- Active requests cancelled
- Active matches disputed
- Security deposit held

---

## Settlement Management

### Monitoring Settlements

**View**: Admin Dashboard → Settlements

**Filters**:
- Status (PENDING, COMPLETED, FAILED)
- Method (internal, external)
- Date range
- Amount range

### Settlement Actions

**Retry Failed Settlement**:
```
POST /api/v1/admin/exchange/settlements/:id/retry
```

**Use cases**:
- PSP temporary outage
- Network issues
- Timeout errors
- Transient failures

**Manual Settlement**:
```
POST /api/v1/admin/exchange/settlements/:id/manual-complete
{
  "reason": "Manually verified external transfer",
  "evidence": "Transaction hash: 0x..."
}
```

**Use cases**:
- External escrow completed outside system
- Manual bank transfer
- Special circumstances

**Cancel Settlement**:
```
POST /api/v1/admin/exchange/settlements/:id/cancel
{
  "reason": "Fraudulent transaction detected"
}
```

**Use cases**:
- Fraud detected
- User request
- Technical error

### Settlement Monitoring

**Key Metrics**:
- Settlement success rate (target: >95%)
- Average settlement time (target: <1 hour)
- Failed settlements (target: <5%)
- Retry rate (target: <10%)

**Alerts**:
- Settlement failure rate >10%
- Settlement time >2 hours
- PSP errors >20%
- External escrow issues

---

## Monitoring & Alerts

### Monitoring Dashboard

**Access**: https://grafana.mnbarh.com

**Key Dashboards**:
1. Service Health
2. Exchange Requests
3. Matching Engine
4. Settlements
5. Security & Fraud
6. Business Metrics

### Alert Types

**Critical Alerts** (PagerDuty):
- Service down
- Database connection failed
- High error rate (>5%)
- Settlement failure spike

**Warning Alerts** (Slack):
- High response time
- Low match rate
- High dispute rate
- External provider issues

**Info Alerts** (Email):
- Daily summary
- Weekly report
- Monthly metrics

### Alert Response

**Service Down**:
1. Check service status
2. Review error logs
3. Restart service if needed
4. Escalate if persistent

**High Error Rate**:
1. Check error logs
2. Identify error pattern
3. Fix if known issue
4. Escalate if unknown

**Settlement Failures**:
1. Check PSP status
2. Review failed settlements
3. Retry if transient
4. Investigate if persistent

---

## Security Operations

### Fraud Detection

**Automatic Detection**:
- Multiple failed proofs
- Rapid account creation
- Suspicious patterns
- External contact attempts
- Device fingerprint mismatch

**Manual Investigation**:
1. Review user activity
2. Check transaction patterns
3. Verify identity documents
4. Contact user if needed
5. Make decision

### Security Actions

**Freeze Account**:
- Immediate action
- Pending investigation
- User notified
- Time-limited (7 days)

**Ban Account**:
- Permanent action
- Confirmed fraud
- User notified
- Security deposit forfeited

**Whitelist User**:
- Verified legitimate user
- Bypass some checks
- Higher limits
- Priority support

### Security Monitoring

**Key Metrics**:
- Fraud detection rate
- False positive rate
- Account freeze rate
- Ban rate
- Security deposit deductions

**Patterns to Watch**:
- Multiple accounts from same IP
- Rapid succession of requests
- Always same currency pair
- Unusual amounts
- Consistent disputes

---

## Reporting

### Available Reports

**Daily Report**:
- Exchange volume
- Number of exchanges
- Platform revenue
- Active users
- Success rate

**Weekly Report**:
- Trend analysis
- Top users
- Top currency pairs
- Dispute summary
- Performance metrics

**Monthly Report**:
- Business metrics
- Growth analysis
- User acquisition
- Revenue breakdown
- Strategic insights

### Generating Reports

**API Endpoint**:
```
GET /api/v1/admin/exchange/reports
?type=daily|weekly|monthly
&startDate=2026-01-01
&endDate=2026-01-31
&format=json|csv|pdf
```

**Dashboard**:
1. Go to Admin Dashboard → Reports
2. Select report type
3. Choose date range
4. Select format
5. Click Generate

### Report Metrics

**Business Metrics**:
- Total volume by currency
- Platform revenue
- Average transaction size
- User growth
- Retention rate

**Operational Metrics**:
- Match rate
- Settlement success rate
- Average completion time
- Dispute rate
- Support tickets

**User Metrics**:
- Active users
- New users
- Trust level distribution
- Top traders
- User satisfaction

---

## Best Practices

### Proof Verification

1. **Be Thorough**: Check all details carefully
2. **Be Fair**: Apply same standards to all
3. **Be Fast**: Verify within 1 hour if possible
4. **Document**: Add clear notes for decisions
5. **Escalate**: If unsure, ask senior admin

### Dispute Resolution

1. **Be Impartial**: No bias towards buyer or seller
2. **Be Evidence-Based**: Decide based on facts
3. **Be Timely**: Resolve within 24-48 hours
4. **Be Clear**: Explain decision clearly
5. **Be Final**: Stick to decision unless new evidence

### User Management

1. **Be Cautious**: Don't freeze/ban without evidence
2. **Be Communicative**: Inform users of actions
3. **Be Reversible**: Allow appeals
4. **Be Consistent**: Apply same rules to all
5. **Be Documented**: Record all actions

### Security Operations

1. **Be Proactive**: Monitor for patterns
2. **Be Responsive**: Act on alerts quickly
3. **Be Investigative**: Dig deeper on suspicions
4. **Be Protective**: Protect legitimate users
5. **Be Collaborative**: Work with security team

---

## Escalation Procedures

### When to Escalate

**To Senior Admin**:
- Complex disputes
- High-value transactions (>$10,000)
- Unclear evidence
- Policy questions
- User complaints

**To Tech Team**:
- Technical issues
- System errors
- Performance problems
- Integration failures
- Bug reports

**To Legal Team**:
- Legal threats
- Regulatory questions
- Subpoenas
- Terms violations
- Fraud cases

**To Management**:
- Major incidents
- PR issues
- Strategic decisions
- Policy changes
- Budget requests

### Escalation Process

1. **Document**: Record all details
2. **Notify**: Inform relevant party
3. **Provide Context**: Share background
4. **Follow Up**: Track resolution
5. **Close Loop**: Update all parties

---

## Support

### Admin Support Channels

- **Slack**: #admin-p2p-exchange
- **Email**: admin-support@mnbarh.com
- **Phone**: +1-555-ADMIN (24/7)
- **On-Call**: PagerDuty rotation

### Resources

- **Admin Portal**: https://admin.mnbarh.com
- **Documentation**: https://docs.mnbarh.com/admin
- **Runbooks**: https://runbooks.mnbarh.com
- **Status Page**: https://status.mnbarh.com

---

## Frequently Asked Questions

### How do I verify a proof quickly?

1. Check amount matches
2. Check recipient matches
3. Check date is recent
4. If all match, approve
5. If any mismatch, reject or request more info

### What if I'm unsure about a dispute?

1. Review all evidence thoroughly
2. Check user history
3. Look for similar cases
4. Consult with senior admin
5. Request more evidence if needed

### How do I handle angry users?

1. Stay professional
2. Listen to their concerns
3. Explain decisions clearly
4. Offer alternatives if possible
5. Escalate if threatening

### What if a settlement keeps failing?

1. Check PSP status
2. Review error logs
3. Try manual retry
4. Contact PSP support
5. Consider manual settlement

### How do I spot fraud patterns?

1. Multiple accounts from same IP
2. Rapid succession of requests
3. Always disputes
4. Unusual amounts
5. Consistent patterns

---

**For Admin Support**: Contact admin-support@mnbarh.com or call +1-555-ADMIN (24/7)

---

**Last Updated**: 2026-01-28  
**Version**: 1.0.0
