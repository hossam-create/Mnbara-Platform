# Runbook: Polling Backlog Growth

## Symptoms

- `polling_backlog_size` increasing continuously
- Alert: "Polling Backlog Spike"
- Many decisions stuck in PENDING status
- Increased decision expiry rate
- User complaints about decisions not resolving

## Probable Causes

1. Custodii API not responding to status updates
2. Polling service not running or crashed
3. Polling interval too long
4. High decision request rate exceeding processing capacity
5. Webhook delivery failures (status updates not received)
6. Database performance issues preventing status updates

## Immediate Actions

### 1. Assess Backlog Size

Check current backlog:
```
polling_backlog_size  # Current number of PENDING decisions
```

Check backlog growth rate:
```
# Compare current vs 5 minutes ago
# If growing >10 decisions/minute, immediate action needed
```

### 2. Verify Polling Service Status

Check service health:
```bash
curl http://localhost:3010/health/ready
```

Check logs for polling activity:
```bash
grep "polling" logs.json | tail -20
```

Look for:
- Recent polling attempts
- Polling errors
- Polling service crashes

### 3. Check Decision Age

Query oldest PENDING decisions:
```sql
SELECT id, requested_at, EXTRACT(EPOCH FROM (NOW() - requested_at)) as age_seconds
FROM asset_decision_records
WHERE status = 'PENDING'
ORDER BY requested_at ASC
LIMIT 10;
```

If decisions are >60s old, they should be expiring soon.

### 4. Verify External API Connectivity

Check circuit breaker state:
```
circuit_breaker_state{decision_source="EXTERNAL"}
```

Test Custodii API manually:
```bash
curl -H "Authorization: Bearer $CUSTODII_API_KEY" \
  $CUSTODII_API_URL/health
```

### 5. Implement Immediate Mitigation

**Option A: Increase Polling Frequency (Low Risk)**
```bash
# Reduce polling interval
export DECISION_POLL_INTERVAL_MS=2000  # From 5000ms
systemctl restart decision-authority-service
```

**Option B: Manual Decision Resolution (Medium Risk)**

For critical decisions, manually update status:
```sql
UPDATE asset_decision_records
SET status = 'APPROVED',
    decided_at = NOW(),
    source = 'OVERRIDE',
    authority = 'ops-manual-intervention',
    reason = 'Manual resolution due to polling backlog'
WHERE id = '<decision-id>';
```

**Option C: Trigger Dead Decision Cleanup (Medium Risk)**

Force cleanup of old PENDING decisions:
```bash
# Reduce max age temporarily
export DEAD_DECISION_MAX_AGE_MS=30000  # From 60000ms
systemctl restart decision-authority-service
```

**Option D: Switch to INTERNAL Mode (High Risk)**
```bash
export DECISION_AUTHORITY_MODE=INTERNAL
systemctl restart decision-authority-service
```

## Verification Steps

### 1. Monitor Backlog Size

```bash
watch -n 5 'curl -s http://localhost:3010/metrics | grep polling_backlog_size'
```

Verify:
- Backlog size decreasing
- No new backlog growth
- Stable or declining trend

### 2. Check Decision Resolution Rate

```bash
curl http://localhost:3010/metrics | grep decisions_approved_total
curl http://localhost:3010/metrics | grep decisions_rejected_total
```

Verify:
- Decisions being resolved
- Resolution rate matches request rate

### 3. Verify Polling Activity

```bash
tail -f logs.json | grep polling
```

Look for:
- Regular polling attempts
- Successful status updates
- No repeated errors

### 4. Check Dead Decision Cleanup

```bash
curl http://localhost:3010/metrics | grep dead_decision_cleanup_total
```

Verify:
- Cleanup running periodically
- Old decisions being expired

## Root Cause Investigation

### Polling Service Issues

1. Check service logs for crashes
2. Review polling service configuration
3. Check for resource exhaustion (CPU/memory)
4. Verify polling loop is running

### External API Issues

1. Check Custodii API response times
2. Verify webhook delivery
3. Check API rate limiting
4. Review API error responses

### Database Issues

1. Check database connection pool
2. Review query performance
3. Check for lock contention
4. Verify index usage

### Capacity Issues

1. Compare request rate vs processing capacity
2. Check service resource utilization
3. Review scaling configuration
4. Assess need for horizontal scaling

## Long-Term Solutions

1. **Implement Webhook-Based Updates**
   - Reduce reliance on polling
   - Faster status updates
   - Lower resource usage

2. **Optimize Polling Strategy**
   - Adaptive polling intervals
   - Priority-based polling
   - Batch polling requests

3. **Add Backlog Monitoring**
   - Alert on backlog growth rate
   - Dashboard for backlog trends
   - Automated mitigation triggers

4. **Improve Dead Decision Cleanup**
   - More aggressive cleanup
   - Configurable expiry times
   - Automatic retry for expired decisions

5. **Scale Polling Service**
   - Horizontal scaling
   - Dedicated polling workers
   - Load balancing

## Post-Incident Actions

1. Document backlog growth pattern
2. Update backlog alert thresholds
3. Review polling configuration:
   - Polling interval
   - Batch size
   - Max poll duration
4. Assess need for:
   - Webhook implementation
   - Service scaling
   - Configuration tuning
5. Schedule capacity planning review

## Escalation

- **Level 1**: On-call SRE (immediate if backlog >100)
- **Level 2**: Platform Engineering Lead (if backlog >500)
- **Level 3**: Custodii Support (if webhook issues)
- **Level 4**: Engineering Director (if business impact)

## Related Runbooks

- CUSTODII_OUTAGE.md
- HIGH_DECISION_LATENCY.md
- EXTERNAL_AUTO_DISABLED.md
