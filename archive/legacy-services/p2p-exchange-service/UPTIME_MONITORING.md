# 99.9% Uptime Monitoring for Matching Engine

## Overview

This document describes the comprehensive uptime monitoring system implemented for the P2P Exchange Marketplace matching engine to achieve and maintain 99.9% uptime SLA.

## Architecture

### Components

1. **UptimeMonitorService** - Core service for tracking uptime metrics
2. **MatchingEngineHealthService** - Health checks for the matching engine
3. **UptimeMonitorController** - API endpoints for uptime data
4. **Monitoring Routes** - REST API routes for uptime monitoring

### Key Features

- **Real-time Health Checks**: Periodic health checks every 30 seconds
- **Uptime Tracking**: Tracks uptime percentage over multiple time periods (1h, 24h, 7d, 30d)
- **Downtime Events**: Records and stores downtime events with reasons
- **SLA Compliance**: Automatic SLA compliance checking (99.9% target)
- **Metrics Export**: Prometheus-compatible metrics endpoint
- **Alerting**: Integration with monitoring systems for alerts

## Implementation Details

### UptimeMonitorService

Located at: `src/services/uptime-monitor.service.ts`

**Key Methods:**

```typescript
// Record matching engine startup
static async recordStartup(): Promise<void>

// Record matching engine shutdown
static async recordShutdown(): Promise<void>

// Record health check result
static async recordHealthCheck(healthy: boolean, details?: Record<string, any>): Promise<void>

// Get current uptime status
static async getUptimeStatus(): Promise<{...}>

// Calculate uptime percentage for a period
static async calculateUptimePercentage(periodMinutes: number = 1440): Promise<number>

// Get downtime events
static async getDowntimeEvents(limit: number = 100): Promise<any[]>

// Generate uptime report
static async generateUptimeReport(): Promise<{...}>

// Check SLA compliance
static async checkSLACompliance(periodMinutes: number = 1440): Promise<{...}>

// Reset uptime data (development only)
static async reset(): Promise<void>
```

**Data Storage:**

- Uses Redis for fast, persistent storage
- Keys:
  - `matching_engine:uptime` - Uptime status and timestamps
  - `matching_engine:health` - Health check status
  - `matching_engine:downtime_events` - List of downtime events
  - `matching_engine:uptime_report` - Latest uptime report

### MatchingEngineHealthService

Located at: `src/services/matching-engine-health.service.ts`

**Key Methods:**

```typescript
// Start periodic health checks
static startHealthChecks(): void

// Stop health checks
static stopHealthChecks(): void

// Get current health status
static async getHealthStatus(): Promise<{...}>

// Check if matching engine is responsive
static async isResponsive(): Promise<boolean>

// Get health metrics
static async getHealthMetrics(): Promise<{...}>
```

**Health Checks Include:**

1. **Database Connection**: Verifies PostgreSQL connectivity
2. **Redis Connection**: Verifies Redis connectivity
3. **Matching Engine Job Status**: Checks if matching engine job is running
4. **Job Staleness**: Detects if matching engine job hasn't run in 2 minutes
5. **Active Requests**: Counts active exchange requests
6. **Pending Matches**: Counts pending matches

**Failure Handling:**

- Tracks consecutive failures (max 3 before escalation)
- Records downtime events on failures
- Logs warnings and errors for investigation

### UptimeMonitorController

Located at: `src/controllers/uptime-monitor.controller.ts`

**API Endpoints:**

```
GET  /api/v1/admin/uptime/status              - Get current uptime status
GET  /api/v1/admin/uptime/report              - Get uptime report
GET  /api/v1/admin/uptime/sla                 - Check SLA compliance
GET  /api/v1/admin/uptime/downtime-events     - Get downtime events
GET  /api/v1/admin/health/matching-engine     - Get matching engine health
GET  /api/v1/admin/health/metrics             - Get health metrics
POST /api/v1/admin/uptime/reset               - Reset uptime data (dev only)
```

## Usage

### Starting Uptime Monitoring

The uptime monitoring is automatically started when the service starts:

```typescript
// In src/index.ts
await UptimeMonitorService.recordStartup();
MatchingEngineHealthService.startHealthChecks();
```

### Checking Uptime Status

```bash
# Get current uptime status
curl http://localhost:3005/api/v1/admin/uptime/status

# Get uptime report
curl http://localhost:3005/api/v1/admin/uptime/report

# Check SLA compliance (24 hours)
curl http://localhost:3005/api/v1/admin/uptime/sla?period=1440

# Get downtime events
curl http://localhost:3005/api/v1/admin/uptime/downtime-events?limit=50

# Get matching engine health
curl http://localhost:3005/api/v1/admin/health/matching-engine

# Get health metrics
curl http://localhost:3005/api/v1/admin/health/metrics
```

### Response Examples

**Uptime Status:**
```json
{
  "status": "running",
  "lastStartup": "2026-01-28T12:00:00.000Z",
  "lastShutdown": null,
  "lastHealthCheck": "2026-01-28T12:05:30.000Z",
  "healthStatus": "healthy"
}
```

**Uptime Report:**
```json
{
  "period": "2026-01-28T12:05:30.000Z",
  "uptime1h": 100.00,
  "uptime24h": 99.95,
  "uptime7d": 99.92,
  "uptime30d": 99.88,
  "downtimeEvents": [...],
  "status": "running"
}
```

**SLA Compliance:**
```json
{
  "compliant": true,
  "uptime": 99.95,
  "slaTarget": 99.9,
  "allowedDowntimeMinutes": 1.44,
  "actualDowntimeMinutes": 0.72
}
```

**Matching Engine Health:**
```json
{
  "healthy": true,
  "lastCheckTime": 1706432730000,
  "consecutiveFailures": 0,
  "details": {
    "database": {
      "status": "connected",
      "duration": 5
    },
    "redis": {
      "status": "connected",
      "duration": 3
    },
    "matchingEngine": {
      "status": "running",
      "lastRun": "2026-01-28T12:05:30.000Z",
      "timeSinceLastRun": 2000
    },
    "activeRequests": 42,
    "pendingMatches": 15
  }
}
```

## Monitoring Integration

### Prometheus Metrics

The service exposes Prometheus-compatible metrics at `/metrics` endpoint:

```
# Matching engine uptime metrics
matching_engine_uptime_percentage{period="1h"} 100.0
matching_engine_uptime_percentage{period="24h"} 99.95
matching_engine_uptime_percentage{period="7d"} 99.92
matching_engine_uptime_percentage{period="30d"} 99.88

# Health check metrics
matching_engine_health_check_duration_seconds 0.045
matching_engine_health_check_failures_total 2
matching_engine_consecutive_failures 0

# SLA compliance metrics
matching_engine_sla_compliant{period="24h"} 1
matching_engine_sla_uptime{period="24h"} 99.95
```

### Grafana Dashboard

Import the pre-configured dashboard at `monitoring/grafana-dashboard.json`:

1. Open Grafana
2. Go to Dashboards → Import
3. Upload `monitoring/grafana-dashboard.json`
4. Select Prometheus data source
5. Click Import

**Dashboard Panels:**

- Uptime percentage (1h, 24h, 7d, 30d)
- SLA compliance status
- Downtime events timeline
- Health check status
- Consecutive failures
- Matching engine job status
- Active requests and pending matches

### Alert Rules

Alert rules are defined in `monitoring/alert-rules.yml`:

**Critical Alerts:**

1. **MatchingEngineDown**: Matching engine is down or unreachable
2. **MatchingEngineStalled**: Matching engine hasn't run in 2 minutes
3. **HighConsecutiveFailures**: 3+ consecutive health check failures
4. **SLAViolation**: Uptime drops below 99.9%

**Example Alert Rule:**

```yaml
- alert: MatchingEngineDown
  expr: matching_engine_health_check_failures_total > 0
  for: 5m
  labels:
    severity: critical
    service: p2p-exchange
  annotations:
    summary: "Matching engine is down"
    description: "Matching engine has been down for {{ $value }} minutes"
```

## SLA Targets

### 99.9% Uptime SLA

- **Monthly Downtime Allowance**: 43.2 minutes
- **Weekly Downtime Allowance**: 10.08 minutes
- **Daily Downtime Allowance**: 1.44 minutes
- **Hourly Downtime Allowance**: 3.6 seconds

### Calculation

```
Uptime % = (Total Time - Downtime) / Total Time * 100
SLA Compliant = Uptime % >= 99.9%
```

## Testing

### Unit Tests

Located at: `src/services/__tests__/uptime-monitor.service.test.ts`

Run tests:
```bash
npm test -- --testPathPattern="uptime-monitor.service"
```

**Test Coverage:**

- Startup/shutdown recording
- Health check recording
- Uptime percentage calculation
- Downtime event tracking
- SLA compliance checking
- Data reset functionality

### Integration Tests

Located at: `src/services/__tests__/matching-engine-health.service.test.ts`

**Test Coverage:**

- Health check execution
- Database connectivity check
- Redis connectivity check
- Matching engine job status check
- Stalled job detection
- Consecutive failure tracking

## Troubleshooting

### High Downtime Events

**Symptoms:**
- Uptime percentage dropping below 99.9%
- Multiple downtime events in logs

**Investigation:**

1. Check matching engine logs:
   ```bash
   tail -f logs/error.log | grep "matching_engine"
   ```

2. Check health check details:
   ```bash
   curl http://localhost:3005/api/v1/admin/health/matching-engine
   ```

3. Check downtime events:
   ```bash
   curl http://localhost:3005/api/v1/admin/uptime/downtime-events?limit=20
   ```

4. Check database and Redis connectivity:
   ```bash
   curl http://localhost:3005/health
   ```

### Stalled Matching Engine

**Symptoms:**
- Health check shows "stalled" status
- No new matches being created

**Investigation:**

1. Check matching engine job status:
   ```bash
   redis-cli hgetall matching_engine:job
   ```

2. Check matching engine logs:
   ```bash
   tail -f logs/error.log | grep "matching_engine"
   ```

3. Restart matching engine:
   ```bash
   # Restart the service
   docker restart p2p-exchange-service
   ```

### False Positives

**Symptoms:**
- Health checks failing but service is working
- Downtime events recorded incorrectly

**Solutions:**

1. Increase health check timeout (currently 10 seconds)
2. Adjust consecutive failure threshold (currently 3)
3. Check system resources (CPU, memory, disk)
4. Check network connectivity

## Best Practices

### 1. Regular Monitoring

- Check uptime status daily
- Review downtime events weekly
- Generate monthly uptime reports

### 2. Alerting

- Set up alerts for SLA violations
- Set up alerts for consecutive failures
- Set up alerts for stalled matching engine

### 3. Maintenance

- Schedule maintenance during low-traffic periods
- Notify users before maintenance
- Plan for graceful degradation

### 4. Incident Response

- Document all downtime events
- Investigate root causes
- Implement preventive measures
- Update runbooks

## Performance Impact

### Resource Usage

- **CPU**: < 1% (health checks every 30 seconds)
- **Memory**: ~10 MB (Redis data storage)
- **Network**: Minimal (local Redis queries)
- **Disk**: ~1 MB per month (logs)

### Optimization

- Health checks run asynchronously
- Redis caching for fast queries
- Downtime events limited to 1000 most recent
- Metrics aggregation for long-term storage

## Future Enhancements

1. **Machine Learning**: Predict downtime based on patterns
2. **Auto-Remediation**: Automatically restart failed components
3. **Multi-Region**: Track uptime across multiple regions
4. **Custom Alerts**: User-defined alert thresholds
5. **Webhook Integration**: Send alerts to external systems
6. **Historical Analysis**: Long-term trend analysis

## References

- [Prometheus Metrics](https://prometheus.io/docs/concepts/data_model/)
- [Grafana Dashboards](https://grafana.com/docs/grafana/latest/dashboards/)
- [SLA Best Practices](https://en.wikipedia.org/wiki/Service-level_agreement)
- [Health Check Patterns](https://microservices.io/patterns/observability/health-check-api.html)

---

**Last Updated**: 2026-01-28  
**Version**: 1.0.0  
**Status**: Production Ready
