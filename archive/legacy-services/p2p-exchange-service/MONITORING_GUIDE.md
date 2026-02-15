# P2P Exchange Service - Monitoring Guide

## Overview

This guide covers the monitoring, logging, and observability setup for the P2P Exchange Service.

---

## Table of Contents

1. [Logging](#logging)
2. [Metrics](#metrics)
3. [Alerting](#alerting)
4. [Error Tracking](#error-tracking)
5. [Dashboards](#dashboards)
6. [Health Checks](#health-checks)

---

## Logging

### Structured Logging with Winston

The service uses Winston for structured logging with JSON format in production and pretty-print format in development.

#### Log Levels

- **error**: Critical errors that need immediate attention
- **warn**: Warning messages (security events, degraded performance)
- **info**: General informational messages
- **http**: HTTP request/response logs
- **debug**: Detailed debugging information

#### Log Files

- `logs/error.log`: Error-level logs only
- `logs/combined.log`: All logs
- Console: All logs (with colors in development)

#### Helper Functions

```typescript
import logger, { 
  logExchangeRequest, 
  logMatch, 
  logSettlement, 
  logSecurity, 
  logError,
  logPerformance 
} from './utils/logger';

// Exchange request logging
logExchangeRequest('created', {
  requestId: 'req_123',
  userId: 'user_456',
  fromCurrency: 'USD',
  toCurrency: 'EGP',
  amount: 1000
});

// Match logging
logMatch('created', {
  matchId: 'match_789',
  requestId1: 'req_123',
  requestId2: 'req_456',
  score: 95
});

// Settlement logging
logSettlement('completed', {
  settlementId: 'settle_321',
  matchId: 'match_789',
  method: 'internal',
  duration: 1234
});

// Security event logging
logSecurity('fraud_detected', {
  userId: 'user_456',
  reason: 'multiple_failed_proofs',
  action: 'account_frozen'
});

// Error logging
logError(error, {
  userId: 'user_456',
  operation: 'create_exchange_request'
});

// Performance logging
logPerformance('matching_engine', 2345, {
  matchesCreated: 5,
  requestsProcessed: 100
});
```

---

## Metrics

### Prometheus Metrics

The service exposes Prometheus-compatible metrics at `/metrics` endpoint.

#### HTTP Metrics

- `http_request_duration_seconds`: HTTP request duration histogram
- `http_requests_total`: Total HTTP requests counter

#### Exchange Request Metrics

- `exchange_requests_created_total`: Total exchange requests created
- `exchange_requests_completed_total`: Total exchange requests completed
- `exchange_request_duration_seconds`: Duration from creation to completion
- `exchange_request_amount`: Amount distribution
- `active_exchange_requests`: Current active requests gauge

#### Matching Engine Metrics

- `matches_created_total`: Total matches created
- `matching_engine_duration_seconds`: Matching engine execution time
- `match_score`: Match score distribution
- `active_matches`: Current active matches gauge

#### Settlement Metrics

- `settlements_initiated_total`: Total settlements initiated
- `settlements_completed_total`: Total settlements completed
- `settlement_duration_seconds`: Settlement process duration
- `settlement_retries_total`: Total settlement retries

#### Security Metrics

- `security_deposits_created_total`: Total security deposits created
- `security_deposits_frozen_total`: Total security deposits frozen
- `trust_level_upgrades_total`: Total trust level upgrades
- `trust_level_downgrades_total`: Total trust level downgrades
- `fraud_detections_total`: Total fraud detections

#### Communication Metrics

- `messages_exchanged_total`: Total messages exchanged
- `messages_flagged_total`: Total messages flagged
- `external_contact_detections_total`: External contact attempts detected

#### External Provider Metrics

- `external_provider_calls_total`: Total external API calls
- `external_provider_duration_seconds`: External API call duration
- `external_provider_errors_total`: Total external provider errors

#### Business Metrics

- `total_volume`: Total exchange volume by currency
- `platform_fees_total`: Total platform fees collected
- `active_users`: Number of active users

#### Using Metrics

```typescript
import {
  recordHttpRequest,
  recordExchangeRequest,
  recordMatch,
  recordSettlement,
  recordFraudDetection,
  recordExternalProviderCall
} from './utils/metrics';

// Record HTTP request
recordHttpRequest('POST', '/api/v1/exchange/requests', 201, 0.234);

// Record exchange request
recordExchangeRequest('USD', 'EGP', 1000);

// Record match
recordMatch('automatic', 95);

// Record settlement
recordSettlement('internal', 'mnbarh', 1234, 'completed');

// Record fraud detection
recordFraudDetection('multiple_failed_proofs');

// Record external provider call
recordExternalProviderCall('tatum', 'create_escrow', 'success', 0.456);
```

---

## Alerting

### Alert Rules

Alert rules are defined in `monitoring/alert-rules.yml` for Prometheus Alertmanager.

#### Critical Alerts

1. **ServiceDown**: Service is down or unreachable
2. **HighErrorRate**: Error rate > 5% for 5 minutes
3. **DatabaseConnectionFailed**: Cannot connect to database
4. **RedisConnectionFailed**: Cannot connect to Redis

#### Performance Alerts

5. **HighResponseTime**: 95th percentile > 2s for 5 minutes
6. **HighMatchingEngineLatency**: Matching engine > 10s for 3 minutes
7. **HighSettlementLatency**: Settlement > 1 hour for 10 minutes

#### Business Alerts

8. **LowMatchRate**: Match rate < 50% for 30 minutes
9. **HighSettlementFailureRate**: Settlement failure > 10% for 15 minutes
10. **HighDisputeRate**: Dispute rate > 5% for 30 minutes

#### Security Alerts

11. **HighFraudDetectionRate**: Fraud detection > 10/hour
12. **MassiveSecurityDepositFreeze**: > 10 deposits frozen in 5 minutes
13. **ExternalContactSpike**: > 20 external contact attempts in 5 minutes

#### External Provider Alerts

14. **ExternalProviderHighErrorRate**: Provider error rate > 20%
15. **ExternalProviderDown**: Provider unavailable for 5 minutes
16. **ExternalProviderHighLatency**: Provider response time > 5s

#### Resource Alerts

17. **HighMemoryUsage**: Memory usage > 80%
18. **HighCPUUsage**: CPU usage > 80% for 5 minutes
19. **DiskSpaceRunningOut**: Disk usage > 85%

### Alert Configuration

```yaml
# Example alert rule
- alert: HighErrorRate
  expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
  for: 5m
  labels:
    severity: critical
    service: p2p-exchange
  annotations:
    summary: "High error rate detected"
    description: "Error rate is {{ $value | humanizePercentage }} (threshold: 5%)"
```

---

## Error Tracking

### Sentry Integration

The service integrates with Sentry for error tracking and performance monitoring.

#### Setup

1. Create a Sentry project at https://sentry.io
2. Copy the DSN
3. Add to `.env`:
   ```
   SENTRY_DSN=https://your-dsn@sentry.io/project-id
   ```

#### Features

- **Automatic Error Capture**: All unhandled errors are captured
- **Request Context**: Full request details (sanitized)
- **User Context**: User ID and email (when available)
- **Breadcrumbs**: Trail of events leading to error
- **Performance Monitoring**: Transaction tracing
- **Release Tracking**: Track errors by deployment

#### Manual Error Capture

```typescript
import { 
  captureException, 
  captureMessage, 
  setUser, 
  addBreadcrumb 
} from './utils/sentry';

// Capture exception
try {
  // risky operation
} catch (error) {
  captureException(error, {
    userId: 'user_123',
    operation: 'create_exchange_request'
  });
}

// Capture message
captureMessage('Unusual activity detected', 'warning');

// Set user context
setUser({
  id: 'user_123',
  email: 'user@example.com',
  username: 'john_doe'
});

// Add breadcrumb
addBreadcrumb({
  category: 'exchange',
  message: 'Exchange request created',
  level: 'info',
  data: {
    requestId: 'req_123',
    amount: 1000
  }
});
```

---

## Dashboards

### Grafana Dashboard

A pre-configured Grafana dashboard is available at `monitoring/grafana-dashboard.json`.

#### Dashboard Panels

1. **Service Health**
   - Uptime
   - Request rate
   - Error rate
   - Response time (p50, p95, p99)

2. **Exchange Requests**
   - Requests created (rate)
   - Requests completed (rate)
   - Active requests
   - Request duration distribution

3. **Matching Engine**
   - Matches created (rate)
   - Match rate (%)
   - Matching engine latency
   - Match score distribution

4. **Settlements**
   - Settlements initiated (rate)
   - Settlements completed (rate)
   - Settlement success rate (%)
   - Settlement duration

5. **Security**
   - Security deposits created
   - Deposits frozen
   - Trust level changes
   - Fraud detections

6. **Communication**
   - Messages exchanged
   - Messages flagged
   - External contact detections

7. **External Providers**
   - API calls by provider
   - Provider error rates
   - Provider latency

8. **Business Metrics**
   - Total volume by currency
   - Platform fees collected
   - Active users

9. **System Resources**
   - CPU usage
   - Memory usage
   - Disk usage
   - Network I/O

10. **Database**
    - Connection pool usage
    - Query duration
    - Active connections

11. **Redis**
    - Connected clients
    - Memory usage
    - Hit rate

12. **Alerts**
    - Active alerts
    - Alert history

#### Importing Dashboard

1. Open Grafana
2. Go to Dashboards → Import
3. Upload `monitoring/grafana-dashboard.json`
4. Select Prometheus data source
5. Click Import

---

## Health Checks

### Health Check Endpoint

**Endpoint**: `GET /health`

**Response** (Healthy):
```json
{
  "status": "healthy",
  "service": "p2p-exchange-service",
  "version": "1.0.0",
  "timestamp": "2026-01-28T12:00:00.000Z",
  "database": "connected",
  "redis": "connected",
  "uptime": 3600
}
```

**Response** (Unhealthy):
```json
{
  "status": "unhealthy",
  "service": "p2p-exchange-service",
  "version": "1.0.0",
  "timestamp": "2026-01-28T12:00:00.000Z",
  "error": "Cannot connect to database"
}
```

### Kubernetes Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3005
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

### Kubernetes Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 3005
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

---

## Monitoring Best Practices

### 1. Log Aggregation

- Use centralized logging (ELK, Splunk, CloudWatch)
- Set up log retention policies
- Create log-based alerts

### 2. Metric Collection

- Scrape metrics every 15-30 seconds
- Store metrics for at least 30 days
- Use metric aggregation for long-term storage

### 3. Alert Management

- Set appropriate thresholds
- Avoid alert fatigue
- Use alert grouping and deduplication
- Define escalation policies

### 4. Dashboard Organization

- Create role-specific dashboards (ops, business, security)
- Use consistent color schemes
- Add annotations for deployments
- Include links to runbooks

### 5. Error Tracking

- Set up error grouping rules
- Define error ownership
- Track error resolution time
- Use error trends for prioritization

### 6. Performance Monitoring

- Monitor all critical paths
- Set SLOs (Service Level Objectives)
- Track SLIs (Service Level Indicators)
- Use distributed tracing for complex flows

---

## Troubleshooting

### High Error Rate

1. Check error logs: `tail -f logs/error.log`
2. Check Sentry for error details
3. Check external provider status
4. Review recent deployments
5. Check database connection pool

### High Latency

1. Check slow query logs
2. Review database indexes
3. Check Redis cache hit rate
4. Review external provider latency
5. Check system resources (CPU, memory)

### Low Match Rate

1. Check matching engine logs
2. Review active exchange requests
3. Check matching criteria
4. Review trust level distribution
5. Check security deposit availability

### Settlement Failures

1. Check settlement logs
2. Review external provider status
3. Check webhook delivery
4. Review retry queue
5. Check PSP account status

---

## Support

For monitoring issues or questions:
- **Slack**: #p2p-exchange-monitoring
- **Email**: ops@mnbarh.com
- **On-Call**: PagerDuty rotation

---

**Last Updated**: 2026-01-28  
**Version**: 1.0.0
