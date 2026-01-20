# Market 1 Launch Day Checklist

## Pre-Launch (T-24h)

### Feature Flags

- [ ] `FF_MARKET_1_ENABLED=false` (still off)
- [ ] `FF_CORRIDOR_AI_ADVISORY=true` (already on from Market 0)
- [ ] `FF_TRUST_GATING=true` (already on from Market 0)
- [ ] `FF_HUMAN_CONFIRMATION_CHECKPOINTS=true` (already on)
- [ ] `FF_RATE_LIMITING_ENABLED=true` (already on)
- [ ] `FF_ABUSE_GUARDS_ENABLED=true` (already on)
- [ ] `FF_CORRIDOR_CAPS_ENABLED=true` (already on)
- [ ] `FF_OPS_VISIBILITY_ENABLED=true` (already on)
- [ ] `FF_EMERGENCY_DISABLE_ALL=false` (must be off)

### Corridor Configuration

- [ ] UK_EG corridor config verified
- [ ] UK_AE corridor config verified
- [ ] DE_EG corridor config verified
- [ ] FR_AE corridor config verified
- [ ] All corridors `enabled: false` until launch

### Ops Staffing

- [ ] Primary ops: _________________ (name)
- [ ] Backup ops: _________________ (name)
- [ ] Ops lead on-call: _________________ (name)
- [ ] Engineering on-call: _________________ (name)
- [ ] Escalation path confirmed
- [ ] All contacts have Slack access

### System Health

- [ ] Ops dashboard accessible
- [ ] All health probes passing
- [ ] No active alerts
- [ ] Market 0 corridors healthy
- [ ] Rate limiting working
- [ ] Abuse guards active

---

## Launch (T-0)

### Step 1: Enable Corridors (Ops Lead)

```bash
# Enable Market 1 corridors one at a time
# Start with lowest risk corridor

# 1. UK → UAE (lowest customs complexity)
# Update config: UK_AE.enabled = true
# Deploy config change

# 2. Wait 15 minutes, check metrics

# 3. FR → UAE
# Update config: FR_AE.enabled = true
# Deploy config change

# 4. Wait 15 minutes, check metrics

# 5. UK → Egypt
# Update config: UK_EG.enabled = true
# Deploy config change

# 6. Wait 15 minutes, check metrics

# 7. DE → Egypt
# Update config: DE_EG.enabled = true
# Deploy config change
```

### Step 2: Enable Feature Flag (Ops Lead)

```bash
# After all corridors enabled and stable
export FF_MARKET_1_ENABLED=true
```

### Step 3: Verify (Ops Team)

- [ ] Ops dashboard shows Market 1 corridors
- [ ] Intent classification working
- [ ] Trust gating working
- [ ] Risk banners displaying
- [ ] Confirmation checkpoints working
- [ ] No error spikes

---

## Post-Launch Monitoring (T+0 to T+4h)

### Every 15 Minutes

- [ ] Check ops dashboard
- [ ] Review corridor health
- [ ] Check intent funnel
- [ ] Review trust friction alerts
- [ ] Check rate limiting status
- [ ] Verify kill switch is OFF

### Metrics to Watch

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Trust rejection rate | <20% | 20-40% | >40% |
| API error rate | <1% | 1-5% | >5% |
| Corridor capacity | <70% | 70-90% | >90% |
| Funnel conversion | >baseline | -20% | -30% |
| P95 latency | <1000ms | 1-3s | >3s |

### Escalation Triggers

- [ ] If trust rejection >40% → Alert ops lead
- [ ] If error rate >5% → Alert engineering
- [ ] If any corridor >90% capacity → Prepare throttle
- [ ] If funnel drops >20% → Investigate

---

## Abort Procedure

### Soft Abort (Throttle)

```bash
# Reduce traffic to Market 1 corridors
# Update corridor caps to 50% of normal
```

### Hard Abort (Shutdown)

```bash
# Emergency kill switch
export FF_EMERGENCY_DISABLE_ALL=true

# Or disable Market 1 only
export FF_MARKET_1_ENABLED=false

# Restart service
kubectl rollout restart deployment/crowdship-service
```

### Post-Abort

- [ ] Notify stakeholders
- [ ] Document incident
- [ ] Schedule post-mortem
- [ ] Do NOT re-enable without review

---

## Success Criteria (T+24h)

- [ ] All 4 corridors operational
- [ ] Trust rejection rate <30%
- [ ] Error rate <2%
- [ ] No abort triggered
- [ ] No critical escalations
- [ ] Funnel conversion within 10% of baseline
- [ ] Zero payment attempts (blocked correctly)
- [ ] Zero automation attempts (blocked correctly)

---

## Rollback Plan

### If Issues Within First Hour

1. Disable newest corridor first
2. Wait 15 minutes
3. If stable, investigate
4. If not stable, disable next corridor
5. Continue until stable

### If Issues After First Hour

1. Check if isolated to one corridor
2. If yes, disable that corridor only
3. If no, activate kill switch
4. Investigate before re-enabling

---

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Ops Lead | | | |
| Engineering Lead | | | |
| Product Owner | | | |

---

## Emergency Contacts

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| Ops Lead | | | @ops-lead |
| Engineering On-Call | | | @oncall |
| Emergency | | | #incident-response |
