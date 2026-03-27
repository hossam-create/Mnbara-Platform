# Runbook: EXTERNAL Mode Auto-Disabled

## Symptoms

- Alert: "SLA Breach - Auto Disable"
- Service automatically switched to INTERNAL mode
- High failure rate (>50%) or timeout rate (>30%)
- All new decisions auto-approving
- Circuit breaker in OPEN state

## Probable Causes

1. Sustained Custodii API outage
2. Network connectivity issues
3. Repeated timeout errors
4. API rate limiting
5. Authentication failures
6. Service degradation

## Immediate Actions

### 1. Verify Auto-Disable Event

Check logs for SLA breach:
```bash
grep "SLA breach" logs.json | tail -5
```

Check current mode:
```bash
curl http://localhost:3010/health/ready | jq '.checks'
```

### 2. Assess SLA Metrics

Check failure rate:
```
decision_failures_total{decision_source="EXTERNAL"} / decisions_requested_total{decision_source="EXTERNAL"}
```

Check timeout rate:
```
# Review timeout metrics in logs
grep "timeout" logs.json | grep "EXTERNAL" | wc -l
```

### 3. Determine Root Cause

**Check Custodii API Status:**
```bash
curl -H "Authorization: Bearer $CUSTODII_API_KEY" \
  $CUSTODII_API_URL/health
```

**Check Circuit Breaker:**
```
circuit_breaker_state{decision_source="EXTERNAL"}  # Should be 1 (OPEN)
```

**Review Recent Errors:**
```bash
grep "EXTERNAL" logs.json | grep "error" | tail -20
```

### 4. Assess Business Impact

**Current State:**
- All decisions auto-approving (INTERNAL mode)
- No external compliance checks
- Potential regulatory risk

**Decision Required:**
- Continue in INTERNAL mode (accept risk)
- Wait for EXTERNAL recovery (delay decisions)
- Manual decision review (operational overhead)

### 5. Choose Recovery Strategy

**Strategy A: Wait for Auto-Recovery (Recommended)**

Circuit breaker will test recovery automatically:
- Wait for circuit breaker timeout (default 60s)
- Circuit enters HALF_OPEN state
- Test requests sent to Custodii
- If successful, circuit closes
- Service remains in INTERNAL mode (manual re-enable required)

**Strategy B: Manual Re-Enable (After Verification)**

Only after confirming Custodii is healthy:
```bash
# Verify Custodii API is responding
curl -H "Authorization: Bearer $CUSTODII_API_KEY" \
  $CUSTODII_API_URL/health

# Re-enable EXTERNAL mode
export DECISION_AUTHORITY_MODE=EXTERNAL
systemctl restart decision-authority-service
```

**Strategy C: Stay in INTERNAL Mode**

If Custodii issues persist:
- Document decision to stay in INTERNAL mode
- Notify compliance team
- Schedule manual review of auto-approved decisions
- Plan re-enable during maintenance window

## Verification Steps

### 1. Verify Current Mode

```bash
curl http://localhost:3010/health/ready
```

Check logs for mode confirmation:
```bash
grep "decision_authority_mode" logs.json | tail -1
```

### 2. Test Decision Processing

```bash
curl -X POST http://localhost:3010/api/v1/decisions/request \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"assetType":"LISTING","assetId":"test-123","metadata":{}}'
```

Verify:
- Decision created successfully
- Status is APPROVED (if INTERNAL mode)
- Source is INTERNAL

### 3. Monitor SLA Metrics

```bash
watch -n 10 'curl -s http://localhost:3010/metrics | grep -E "(failure_rate|timeout_rate)"'
```

Verify:
- Failure rate decreasing
- Timeout rate decreasing
- Metrics stabilizing

### 4. Check Circuit Breaker Recovery

```bash
watch -n 5 'curl -s http://localhost:3010/metrics | grep circuit_breaker_state'
```

Monitor for:
- State transition to HALF_OPEN (2)
- State transition to CLOSED (0)
- Stable CLOSED state

## Re-Enabling EXTERNAL Mode

### Prerequisites

1. Custodii API confirmed healthy
2. Circuit breaker in CLOSED state
3. SLA metrics within thresholds
4. No recent error patterns
5. Approval from operations lead

### Re-Enable Procedure

1. **Verify Custodii Health**
```bash
# Test API endpoint
curl -H "Authorization: Bearer $CUSTODII_API_KEY" \
  $CUSTODII_API_URL/health

# Test decision request
curl -X POST $CUSTODII_API_URL/decisions \
  -H "Authorization: Bearer $CUSTODII_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"assetType":"LISTING","assetId":"test","metadata":{}}'
```

2. **Update Configuration**
```bash
export DECISION_AUTHORITY_MODE=EXTERNAL
```

3. **Restart Service**
```bash
systemctl restart decision-authority-service
```

4. **Verify Mode Change**
```bash
curl http://localhost:3010/health/ready
grep "EXTERNAL" logs.json | tail -5
```

5. **Monitor Closely**

Watch for 30 minutes:
- Decision success rate
- Circuit breaker state
- SLA metrics
- Error logs

### Rollback Plan

If issues recur within 30 minutes:
```bash
export DECISION_AUTHORITY_MODE=INTERNAL
systemctl restart decision-authority-service
```

## Post-Incident Actions

1. **Document Incident**
   - Auto-disable trigger time
   - Root cause
   - Duration in INTERNAL mode
   - Re-enable time
   - Total decisions auto-approved

2. **Review Auto-Approved Decisions**
   - Query decisions during INTERNAL mode period
   - Schedule compliance review if needed
   - Document any regulatory implications

3. **Assess SLA Thresholds**
   - Were thresholds appropriate?
   - Too sensitive (false positives)?
   - Too lenient (late detection)?
   - Adjust if needed

4. **Update Monitoring**
   - Add pre-breach warnings
   - Improve failure detection
   - Enhance alerting

5. **Improve Resilience**
   - Review circuit breaker config
   - Optimize retry strategy
   - Consider fallback improvements

## Escalation

- **Level 1**: On-call SRE (immediate notification)
- **Level 2**: Compliance Team (within 1 hour)
- **Level 3**: Platform Engineering Lead (for re-enable approval)
- **Level 4**: Custodii Support (if external issue)
- **Level 5**: Engineering Director (if extended outage)

## Related Runbooks

- CUSTODII_OUTAGE.md
- HIGH_DECISION_LATENCY.md
- POLLING_BACKLOG_GROWTH.md

## Compliance Notes

**Regulatory Impact:**
- Auto-approved decisions bypass external compliance checks
- May require post-incident review
- Document all auto-approved decisions
- Notify compliance team within SLA

**Audit Trail:**
- All auto-disable events logged
- Decision source clearly marked
- Audit log includes mode changes
- Compliance export available
