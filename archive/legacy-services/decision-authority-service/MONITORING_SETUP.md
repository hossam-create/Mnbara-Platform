# Decision Authority Service - Monitoring Setup

**Service**: Decision Authority Service  
**Version**: 1.0.0  
**Last Updated**: January 30, 2026

---

## Overview

This document describes the monitoring, logging, and alerting setup for the Decision Authority Service.

---

## Structured Logging

### JSON Structured Logging

All logs are output in JSON format for easy parsing and analysis.

**Log File Locations**:
- `logs/error.log` - Error level logs only
- `logs/combined.log` - All logs

**Log Levels**:
- `debug` - Detailed debugging information
- `info` - General informational messages
- `warn` - Warning messages
- `error` - Error messages

### Logging Configuration

```typescript
import { log } from './utils/logger';

// Info logging
log.info('Operation completed', { duration: 100 });

// Decision request logging
log.decisionRequest('dec_123', 'LISTING', 'list_456', { source: 'INTERNAL' });

// Decision response logging
log.decisionResponse('dec_123', 'APPROVED', 150, { source: 'INTERNAL' });

// Error logging
log.error('Decision failed', error, { decisionId: 'dec_123' });

// Audit logging
log.audit('DECISION_APPROVED', 'system', 'dec_123', { reason: 'auto-approved' });

// Performance logging
log.performance('database_query', 45, { table: 'AssetDecisionRecord' });
```

### Log Format

```json
{
  "timestamp": "2026-01-30 12:00:00",
  "level": "info",
  "message": "Decision request received",
  "service": "decision-authority-service",
  "decisionId": "dec_123",
  "assetType": "LISTING",
  "assetId": "list_456"
}
```

---

## Prometheus Metrics

### Key Metrics

#### Decision Requests
- **`decision_requests_total`** - Total decision requests
  - Labels: `asset_type`, `source`
  - Type: Counter

- **`decision_requests_duration_ms`** - Request duration in milliseconds
  - Labels: `asset_type`, `status`
  - Type: Histogram
  - Buckets: 10, 50, 100, 500, 1000, 2000, 5000, 10000

#### Decision Status
- **`decision_status_distribution`** - Distribution of decision statuses
  - Labels: `status`
  - Type: Gauge
  - Values: PENDING, APPROVED, REJECTED, EXPIRED, CANCELLED

#### Errors
- **`decision_errors_total`** - Total decision errors
  - Labels: `error_type`, `asset_type`
  - Type: Counter

- **`custodii_api_errors_total`** - Custodii API errors
  - Labels: `error_type`, `status_code`
  - Type: Counter

#### Performance
- **`decision_polling_total`** - Polling attempts
  - Labels: `status`
  - Type: Counter

- **`active_decisions`** - Active pending decisions
  - Labels: `asset_type`
  - Type: Gauge

- **`db_query_duration_ms`** - Database query duration
  - Labels: `operation`, `table`
  - Type: Histogram

- **`cache_hit_rate`** - Cache hit rate percentage
  - Labels: `cache_type`
  - Type: Gauge

### Metrics Endpoint

```bash
GET /metrics
```

Returns Prometheus-formatted metrics.

### Metrics Usage

```typescript
import { metrics } from './utils/metrics';

// Record decision request
metrics.recordDecisionRequest('LISTING', 'INTERNAL');

// Record decision duration
metrics.recordDecisionDuration('LISTING', 'APPROVED', 150);

// Update status distribution
metrics.updateStatusDistribution('APPROVED', 1000);

// Record error
metrics.recordDecisionError('timeout', 'LISTING');

// Record Custodii API error
metrics.recordCustodiiApiError('connection_error', '500');

// Update active decisions
metrics.updateActiveDecisions('LISTING', 50);

// Record database query
metrics.recordDbQuery('SELECT', 'AssetDecisionRecord', 45);

// Update cache hit rate
metrics.updateCacheHitRate('decision_cache', 0.85);
```

---

## Alerting Rules

### Alert Configuration

Alert rules are defined in `monitoring/alert-rules.yml` and should be loaded into Prometheus.

### Critical Alerts

#### High Error Rate
- **Condition**: Error rate > 5% for 5 minutes
- **Severity**: Critical
- **Action**: Page on-call engineer immediately
- **Runbook**: [High Error Rate](./runbooks/HIGH_ERROR_RATE.md)

#### Service Down
- **Condition**: Service not responding for 1 minute
- **Severity**: Critical
- **Action**: Page on-call engineer immediately
- **Runbook**: [Service Down](./runbooks/SERVICE_DOWN.md)

#### Database Connection Error
- **Condition**: Database connection errors detected
- **Severity**: Critical
- **Action**: Page on-call engineer immediately
- **Runbook**: [Database Connection Error](./runbooks/DATABASE_CONNECTION_ERROR.md)

#### External Auto-Disabled
- **Condition**: External mode auto-disabled due to errors
- **Severity**: Critical
- **Action**: Page on-call engineer immediately
- **Runbook**: [External Auto-Disabled](./runbooks/EXTERNAL_AUTO_DISABLED.md)

### Warning Alerts

#### High Latency
- **Condition**: P95 latency > 5 seconds for 5 minutes
- **Severity**: Warning
- **Action**: Investigate and optimize
- **Runbook**: [High Latency](./runbooks/HIGH_LATENCY.md)

#### Custodii API Errors
- **Condition**: > 10 API errors in 5 minutes
- **Severity**: Warning
- **Action**: Check Custodii API status
- **Runbook**: [Custodii API Error](./runbooks/CUSTODII_API_ERROR.md)

#### High Polling Backlog
- **Condition**: > 1000 active pending decisions
- **Severity**: Warning
- **Action**: Investigate polling performance
- **Runbook**: [Polling Backlog Growth](./runbooks/POLLING_BACKLOG_GROWTH.md)

#### Slow Database Queries
- **Condition**: P95 query duration > 1 second
- **Severity**: Warning
- **Action**: Optimize queries or add indexes
- **Runbook**: [Slow Queries](./runbooks/SLOW_QUERIES.md)

#### Decision Timeout
- **Condition**: > 5 timeout errors in 5 minutes
- **Severity**: Warning
- **Action**: Investigate timeout causes
- **Runbook**: [Decision Timeout](./runbooks/DECISION_TIMEOUT.md)

### Info Alerts

#### Low Cache Hit Rate
- **Condition**: Cache hit rate < 50% for 10 minutes
- **Severity**: Info
- **Action**: Monitor and optimize cache
- **Runbook**: [Low Cache Hit Rate](./runbooks/LOW_CACHE_HIT_RATE.md)

---

## Grafana Dashboard

### Dashboard Overview

The Grafana dashboard provides real-time visualization of key metrics:

1. **Decision Request Volume** - Requests per second by asset type
2. **Decision Request Latency (P95)** - Latency percentiles
3. **Decision Status Distribution** - Pie chart of decision statuses
4. **Error Rate** - Error rate percentage over time
5. **Active Pending Decisions** - Number of pending decisions
6. **Custodii API Errors** - API error rate
7. **Database Query Duration (P95)** - Query performance
8. **Cache Hit Rate** - Cache effectiveness
9. **Decision Polling Attempts** - Polling activity
10. **Request Duration Distribution** - Heatmap of latencies
11. **Error Types Breakdown** - Pie chart of error types
12. **Service Health Status** - Service up/down status

### Dashboard Import

1. Open Grafana
2. Go to Dashboards → Import
3. Upload `monitoring/grafana-dashboard.json`
4. Select Prometheus data source
5. Click Import

### Dashboard URL

```
http://grafana.mnbarh.com/d/decision-authority-service
```

---

## Prometheus Configuration

### Prometheus Scrape Config

Add to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'decision-authority-service'
    static_configs:
      - targets: ['localhost:3010']
    metrics_path: '/metrics'
    scrape_interval: 30s
    scrape_timeout: 10s
```

### Alert Manager Configuration

Add to `alertmanager.yml`:

```yaml
route:
  receiver: 'default'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
      continue: true
    - match:
        severity: warning
      receiver: 'slack'

receivers:
  - name: 'default'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#mnbarh-alerts'

  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_SERVICE_KEY'

  - name: 'slack'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#mnbarh-warnings'
```

---

## Health Check Endpoint

### Health Check

```bash
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "service": "decision-authority-service",
  "mode": "INTERNAL",
  "source": "INTERNAL",
  "timestamp": "2026-01-30T12:00:00.000Z"
}
```

**Status Codes**:
- `200` - Service is healthy
- `503` - Service is unhealthy

---

## Monitoring Best Practices

### Key Metrics to Monitor

1. **Request Volume** - Track request rate trends
2. **Latency** - Monitor P50, P95, P99 latencies
3. **Error Rate** - Track error percentage
4. **Active Decisions** - Monitor pending decision backlog
5. **Database Performance** - Track query duration
6. **Cache Hit Rate** - Monitor cache effectiveness
7. **API Availability** - Track Custodii API health

### Alert Response Procedures

1. **Critical Alerts**
   - Page on-call engineer immediately
   - Investigate root cause
   - Execute runbook procedures
   - Document incident

2. **Warning Alerts**
   - Investigate within 15 minutes
   - Optimize or fix issue
   - Monitor for escalation

3. **Info Alerts**
   - Monitor trends
   - Optimize when convenient
   - No immediate action required

### SLA Targets

- **Availability**: 99.9% uptime
- **Latency**: P95 < 5 seconds
- **Error Rate**: < 0.1%
- **Decision Processing**: < 30 seconds

---

## Troubleshooting

### High Error Rate

1. Check error logs: `tail -f logs/error.log`
2. Review recent deployments
3. Check Custodii API status
4. Review database performance
5. Check for resource constraints

### High Latency

1. Check database query performance
2. Review active decision count
3. Check Custodii API latency
4. Review cache hit rate
5. Check for resource constraints

### Service Down

1. Check service logs
2. Verify database connectivity
3. Check port availability
4. Review recent deployments
5. Check system resources

### Database Connection Error

1. Verify database is running
2. Check connection string
3. Verify credentials
4. Check network connectivity
5. Review database logs

---

## Related Documentation

- [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md) - Deployment procedures
- [ROLLBACK_PROCEDURE.md](./ROLLBACK_PROCEDURE.md) - Rollback procedures
- [README.md](./README.md) - Service overview

