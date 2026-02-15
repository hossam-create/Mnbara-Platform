# Runbook: High Decision Latency

## Symptoms

- `decision_request_latency_ms` p95 > 5000ms
- `decision_resolution_latency_ms` p95 > 30000ms
- User complaints about slow listing/auction creation
- Increased timeout errors
- Growing polling backlog

## Probable Causes

1. Custodii API slow response times
2. Database query performance degradation
3. High concurrent decision request volume
4. Network latency between services
5. Polling service overwhelmed
6. Retry storms causing cascading delays

## Immediate Actions

### 1. Identify Latency Source

Check metrics by source:
```
decision_request_latency_ms{decision_source="INTERNAL"}  # Should be <100ms
decision_request_latency_ms{decision_source="EXTERNAL"}  # May be higher
external_decision_latency_ms{operation="requestDecision"}
```

Check database query times:
```
# Review slow query logs
grep "slow query" logs.json
```

### 2. Assess Current Load

Check request rates:
```
decisions_requested_total  # Total request rate
polling_backlog_size       # Pending decisions
```

Check retry activity:
```
retry_attempts_total  # High retry rate indicates issues
```

### 3. Determine Impact Severity

**Low Impact** (p95 < 10s, no user complaints):
- Monitor and investigate during business hours
- No immediate action required

**Medium Impact** (p95 10-30s, some complaints):
- Investigate within 1 hour
- Consider temporary mitigations

**High Impact** (p95 > 30s, many complaints):
- Immediate investigation required
- Implement mitigations immediately

### 4. Quick Mitigations

**If EXTERNAL source is slow:**

Check circuit breaker state:
```
circuit_breaker_state{decision_source="EXTERNAL"}
```

If not already open, consider manual intervention:
- Reduce retry attempts temporarily
- Increase circuit breaker sensitivity
- Switch to INTERNAL mode if critical

**If database is slow:**

Check connection pool:
```
# Review database connection metrics
# Check for connection pool exhaustion
```

Temporary fixes:
- Restart service to reset connections
- Scale up database resources
- Add database read replicas

**If polling is overwhelmed:**

Reduce polling frequency temporarily:
```
# Update environment variable
DECISION_POLL_INTERVAL_MS=10000  # Increase from 5000ms
```

### 5. Implement Mitigation

Example: Reduce retry attempts
```bash
# Update environment
export RETRY_MAX_ATTEMPTS=1
export RETRY_INITIAL_DELAY_MS=500

# Restart service
systemctl restart decision-authority-service
```

Example: Switch to INTERNAL mode
```bash
export DECISION_AUTHORITY_MODE=INTERNAL
systemctl restart decision-authority-service
```

## Verification Steps

### 1. Monitor Latency Metrics

```bash
curl http://localhost:3010/metrics | grep latency
```

Verify:
- p95 latency decreasing
- No new latency spikes
- Consistent response times

### 2. Check Decision Success Rate

```bash
curl http://localhost:3010/metrics | grep decision_failures
```

Verify:
- Failure rate not increasing
- Decisions completing successfully

### 3. Test Decision Request

```bash
time curl -X POST http://localhost:3010/api/v1/decisions/request \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"assetType":"LISTING","assetId":"test-123","metadata":{}}'
```

Expected: Response within acceptable time (<5s for INTERNAL, <30s for EXTERNAL)

### 4. Review Recent Logs

```bash
tail -100 logs.json | jq 'select(.durationMs > 5000)'
```

Look for:
- Slow operations
- Timeout patterns
- Error correlations

## Root Cause Investigation

### Database Performance

1. Check slow query log
2. Review query execution plans
3. Check index usage
4. Monitor connection pool metrics
5. Review database resource utilization

### External API Performance

1. Check Custodii API status
2. Review network latency metrics
3. Check DNS resolution times
4. Verify TLS handshake times
5. Monitor API rate limiting

### Service Performance

1. Check CPU/memory utilization
2. Review garbage collection metrics
3. Check event loop lag
4. Monitor thread pool saturation
5. Review application logs for bottlenecks

## Long-Term Solutions

1. **Optimize Database Queries**
   - Add missing indexes
   - Optimize query patterns
   - Implement query caching

2. **Improve External API Integration**
   - Implement request batching
   - Add response caching
   - Optimize retry strategy

3. **Scale Service Resources**
   - Increase service replicas
   - Scale database resources
   - Add caching layer

4. **Optimize Polling Strategy**
   - Implement adaptive polling intervals
   - Add webhook-based updates
   - Batch polling requests

## Post-Incident Actions

1. Document latency patterns observed
2. Update performance baselines
3. Adjust alerting thresholds if needed
4. Review and optimize:
   - Timeout configurations
   - Retry strategies
   - Circuit breaker settings
5. Schedule performance review meeting
6. Update capacity planning

## Escalation

- **Level 1**: On-call SRE (immediate for high impact)
- **Level 2**: Database Team (if DB-related)
- **Level 3**: Platform Engineering Lead (if service-related)
- **Level 4**: Custodii Support (if external API-related)

## Related Runbooks

- CUSTODII_OUTAGE.md
- POLLING_BACKLOG_GROWTH.md
- EXTERNAL_AUTO_DISABLED.md
