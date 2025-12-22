# Market 1 Human Ops Playbook

## Overview

Market 1 = EU → MENA corridors (UK, DE, FR → EG, AE, SA)

Same trust-first, human-confirmed principles as Market 0.

**CONSTRAINTS:**
- ❌ No new user powers
- ❌ No automation
- ❌ No payments
- ✅ Advisory only
- ✅ Human confirmation required everywhere

---

## 1. Review Flow

### 1.1 Intent Review

| Step | Action | Owner |
|------|--------|-------|
| 1 | Check intent classification in ops dashboard | Ops |
| 2 | Verify intent is in ALLOWED list | Ops |
| 3 | If BLOCKED intent, confirm user sees block message | Ops |
| 4 | Log review decision | System |

**Allowed Intents:**
- `BUY_FROM_ABROAD` ✓
- `TRAVEL_MATCH` ✓
- `PRICE_VERIFY` ✓
- `BROWSE` ✓
- `COMPARE` ✓

**Blocked Intents:**
- `AUTO_MATCH` ✗
- `AUTO_PURCHASE` ✗
- `BULK_ORDER` ✗
- `RESALE` ✗

### 1.2 Trust Review

| Step | Action | Owner |
|------|--------|-------|
| 1 | Check buyer trust level | System |
| 2 | Check traveler trust level | System |
| 3 | For high-value (>$200): verify BOTH are TRUSTED | Ops |
| 4 | If trust gating fails, verify downgrade message shown | Ops |
| 5 | Log trust decision | System |

### 1.3 Corridor Review

| Step | Action | Owner |
|------|--------|-------|
| 1 | Verify corridor is enabled in config | Ops |
| 2 | Check corridor capacity (<100%) | Ops |
| 3 | Verify restrictions are displayed to user | Ops |
| 4 | Check risk banner is shown | Ops |

---

## 2. Escalation Path

### Level 1: Ops Team (First Response)

**Triggers:**
- User complaint about blocked flow
- Trust gating rejection dispute
- Corridor restriction question

**Actions:**
- Review ops dashboard
- Check audit logs
- Provide explanation to user
- Escalate if unresolved in 15 minutes

**Contact:** ops-market1@mnbara.com

### Level 2: Ops Lead (Escalation)

**Triggers:**
- Multiple similar complaints (>3 in 1 hour)
- Potential system issue
- Trust scoring dispute

**Actions:**
- Review patterns in ops dashboard
- Check for system anomalies
- Coordinate with engineering if needed
- Decision: continue, throttle, or escalate

**Contact:** ops-lead@mnbara.com

### Level 3: Engineering On-Call

**Triggers:**
- System error rate >5%
- Ops dashboard showing anomalies
- Potential bug identified

**Actions:**
- Investigate technical issue
- Hotfix if needed
- Coordinate with ops on user communication

**Contact:** oncall-crowdship@mnbara.com

### Level 4: Emergency (Kill Switch)

**Triggers:**
- Error rate >10%
- Trust rejection rate >50%
- Security incident
- Regulatory concern

**Actions:**
- Activate kill switch: `FF_EMERGENCY_DISABLE_ALL=true`
- Notify all stakeholders
- Post-incident review required

**Contact:** emergency@mnbara.com + Slack #incident-response

---

## 3. Common Scenarios

### Scenario A: User Can't Complete Transaction

```
1. Check ops dashboard for user's requestId
2. Review intent classification
3. Review trust gating result
4. If blocked legitimately → explain to user
5. If system error → escalate to L3
```

### Scenario B: High Trust Rejection Rate

```
1. Check ops dashboard alerts
2. Review rejection reasons
3. If >30% rejection rate:
   - Check if threshold is too strict
   - Check if user population changed
4. If >50% rejection rate:
   - Prepare for potential throttle
   - Alert ops lead
```

### Scenario C: Corridor at Capacity

```
1. Verify in ops dashboard
2. Check if legitimate volume or abuse
3. If legitimate:
   - Monitor for natural decrease
   - Consider temporary throttle
4. If abuse:
   - Check abuse guard logs
   - Block offending users
```

### Scenario D: User Disputes Trust Level

```
1. Pull user's trust history
2. Review verification status
3. Explain trust calculation (advisory)
4. If user wants to improve:
   - Direct to verification flow
   - Explain history requirements
5. DO NOT manually override trust
```

---

## 4. Shift Handoff Checklist

### End of Shift

- [ ] Review all open escalations
- [ ] Document any ongoing issues
- [ ] Check ops dashboard for anomalies
- [ ] Update shift log
- [ ] Brief incoming ops team

### Start of Shift

- [ ] Review shift log from previous shift
- [ ] Check ops dashboard status
- [ ] Review any overnight alerts
- [ ] Confirm kill switch status (should be OFF)
- [ ] Test ops dashboard access

---

## 5. Do NOT Do List

| Action | Why |
|--------|-----|
| ❌ Manually approve blocked intents | No automation bypass |
| ❌ Override trust gating | Trust is deterministic |
| ❌ Process payments | No payments in Market 1 |
| ❌ Auto-match users | Human confirmation required |
| ❌ Hide recommendations | Transparency required |
| ❌ Suppress rankings without explanation | All changes must be visible |

---

## 6. Contact Directory

| Role | Contact | Hours |
|------|---------|-------|
| Ops Team | ops-market1@mnbara.com | 24/7 |
| Ops Lead | ops-lead@mnbara.com | Business hours |
| Engineering | oncall-crowdship@mnbara.com | 24/7 |
| Emergency | emergency@mnbara.com | 24/7 |
| Slack | #market1-ops | 24/7 |

---

## 7. Quick Reference

### Feature Flags (Market 1)

```
FF_MARKET_1_ENABLED=true
FF_CORRIDOR_AI_ADVISORY=true
FF_TRUST_GATING=true
FF_HUMAN_CONFIRMATION_CHECKPOINTS=true
FF_OPS_VISIBILITY_ENABLED=true
```

### Abort Thresholds

| Signal | Threshold | Action |
|--------|-----------|--------|
| Trust rejection rate | >50% | SHUTDOWN |
| API error rate | >10% | SHUTDOWN |
| Corridor capacity | 100% | THROTTLE |
| Abuse incidents | >5/hour | ALERT |
| Funnel drop | >30% below baseline | ALERT |
| P95 latency | >5000ms | ALERT |

### Kill Switch Command

```bash
# Emergency shutdown
export FF_EMERGENCY_DISABLE_ALL=true

# Restart service to apply
kubectl rollout restart deployment/crowdship-service
```
