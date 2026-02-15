# Runbook: Custodii API Outage

## Symptoms

- Circuit breaker OPEN for EXTERNAL decision source
- Alert: "Custodii Unreachable"
- Increased decision failures with source=EXTERNAL
- Timeout errors in logs for Custodii API calls
- SLA breach alerts (high failure rate)

## Probable Causes

1. Custodii API service is down
2. Network connectivity issues between services
3. Custodii API rate limiting
4. DNS resolution failure
5. TLS/SSL certificate issues
6. Custodii API authentication token expired

## Immediate Actions

### 1. Verify Outage Scope

Check metrics:
```
circuit_breaker_state{decision_source="EXTERNAL"} == 1  # OPEN
decision_failures_total{decision_source="EXTERNAL"}     # Increasing
```

Check logs for recent errors:
```
grep "custodii" logs.json | grep "error"
```

### 2. Check Custodii API Status

- Verify Custodii API endpoint is reachable
- Check Custodii status page (if available)
- Contact Custodii support if necessary

### 3. Assess Impact

Check current decision backlog:
```
polling_backlog_size  # Number of PENDING decisions
```

Check decision request rate:
```
decisions_requested_total{decision_source="EXTERNAL"}
```

### 4. Decide on Mitigation Strategy

**Option A: Wait for Recovery (Low Impact)**
- Circuit breaker will auto-retry after timeout (default 60s)
- Suitable if outage is brief (<5 minutes)
- Monitor circuit breaker state transitions

**Option B: Switch to INTERNAL Mode (High Impact)**
- Set environment variable: `DECISION_AUTHORITY_MODE=INTERNAL`
- Restart service (or hot-reload if supported)
- All new decisions will auto-approve
- Document reason for mode switch

### 5. Execute Mitigation

If switching to INTERNAL mode:

```bash
# Update environment variable
export DECISION_AUTHORITY_MODE=INTERNAL

# Restart service
systemctl restart decision-authority-service

# Verify mode change
curl http://localhost:3010/health/ready
```

### 6. Monitor Recovery

Watch for:
- Circuit breaker state returning to CLOSED
- Successful decision requests
- Polling backlog decreasing
- No new failure alerts

## Verification Steps

### 1. Check Service Health

```bash
curl http://localhost:3010/health/ready
```

Expected: `{"status":"healthy"}`

### 2. Verify Decision Processing

```bash
curl -X POST http://localhost:3010/api/v1/decisions/request \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"assetType":"LISTING","assetId":"test-123","metadata":{}}'
```

Expected: Decision created with appropriate status

### 3. Check Metrics

```bash
curl http://localhost:3010/metrics
```

Verify:
- `circuit_breaker_state` is 0 (CLOSED) or recovering
- `decision_failures_total` is not increasing
- `decisions_requested_total` is increasing normally

### 4. Review Logs

```bash
tail -f logs.json | grep -E "(circuit_breaker|custodii|decision)"
```

Look for:
- Successful decision requests
- No repeated error patterns
- Circuit breaker state changes

## Post-Incident Actions

1. Document incident timeline
2. Update incident log with:
   - Start time
   - Detection time
   - Mitigation time
   - Resolution time
   - Root cause (if known)
3. If switched to INTERNAL mode, plan switch back to EXTERNAL:
   - Verify Custodii API is stable
   - Schedule maintenance window
   - Update environment variable
   - Restart service
   - Monitor for 24 hours
4. Review and adjust:
   - Circuit breaker thresholds
   - Retry configuration
   - SLA thresholds
   - Alert sensitivity

## Escalation

- **Level 1**: On-call SRE (immediate)
- **Level 2**: Platform Engineering Lead (if outage >15 minutes)
- **Level 3**: Custodii Support (if external issue confirmed)
- **Level 4**: Engineering Director (if business impact significant)

## Related Runbooks

- HIGH_DECISION_LATENCY.md
- POLLING_BACKLOG_GROWTH.md
- EXTERNAL_AUTO_DISABLED.md
