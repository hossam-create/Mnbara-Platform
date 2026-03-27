# Monitoring Dashboards

Grafana dashboard configurations for comprehensive platform monitoring.

---

## Overview

Monitoring dashboards for all Mnbara Platform services with Prometheus metrics, alerts, and visualizations.

---

## Dashboard 1: System Overview

### Panels

1. **Service Health Status**
   - Gauge: Overall system health
   - Stat: Total services
   - Stat: Healthy services
   - Stat: Unhealthy services
   - Stat: Degraded services

2. **Request Metrics**
   - Graph: Requests per second (QPS)
   - Graph: Response time (p50, p95, p99)
   - Graph: Error rate (%)
   - Stat: Total requests (24h)
   - Stat: Error count (24h)

3. **Database Metrics**
   - Gauge: PostgreSQL connections
   - Graph: Query latency
   - Stat: Active connections
   - Stat: Idle connections
   - Stat: Max connections

4. **Cache Metrics**
   - Gauge: Redis memory usage
   - Graph: Cache hit rate (%)
   - Stat: Total keys
   - Stat: Expired keys (24h)
   - Stat: Evicted keys (24h)

5. **Queue Metrics**
   - Gauge: RabbitMQ message count
   - Graph: Message rate (publish/consume)
   - Stat: Queue depth
   - Stat: Unacked messages

6. **Infrastructure**
   - Gauge: CPU usage (%)
   - Gauge: Memory usage (%)
   - Gauge: Disk usage (%)
   - Gauge: Network I/O

---

## Dashboard 2: Service Health

### Panels

1. **Auth Service (Port 3001)**
   - Gauge: Health status
   - Graph: Request rate
   - Graph: Response time
   - Stat: Total requests
   - Stat: Error count
   - Stat: Uptime (%)

2. **Product Service (Port 3006)**
   - Gauge: Health status
   - Graph: Request rate
   - Graph: Response time
   - Stat: Total requests
   - Stat: Error count
   - Stat: Uptime (%)

3. **Order Service (Port 3006)**
   - Gauge: Health status
   - Graph: Request rate
   - Graph: Response time
   - Stat: Total requests
   - Stat: Error count
   - Stat: Uptime (%)

4. **Payment Service (Port 3003)**
   - Gauge: Health status
   - Graph: Request rate
   - Graph: Response time
   - Stat: Total requests
   - Stat: Error count
   - Stat: Uptime (%)

5. **Wallet Service (Port 3005)**
   - Gauge: Health status
   - Graph: Request rate
   - Graph: Response time
   - Stat: Total requests
   - Stat: Error count
   - Stat: Uptime (%)

6. **Matching Service (Port 3010)**
   - Gauge: Health status
   - Graph: Request rate
   - Graph: Response time
   - Stat: Total requests
   - Stat: Error count
   - Stat: Uptime (%)

---

## Dashboard 3: Database Performance

### Panels

1. **PostgreSQL Primary**
   - Gauge: Connection pool usage (%)
   - Graph: Active connections
   - Graph: Query latency (p50, p95, p99)
   - Stat: Total queries
   - Stat: Slow queries
   - Stat: Failed queries

2. **PostgreSQL Replicas**
   - Gauge: Replication lag (seconds)
   - Graph: Replication throughput
   - Stat: Replication slots
   - Stat: Active replicas
   - Stat: Lagging replicas

3. **PgBouncer**
   - Gauge: Pool usage (%)
   - Graph: Wait time
   - Graph: Client connections
   - Stat: Total queries
   - Stat: Cache hits
   - Stat: Cache misses

4. **Database Size**
   - Graph: Database size (GB)
   - Graph: Table size (top 10)
   - Graph: Index size (top 10)
   - Stat: Total size
   - Stat: Growth rate (24h)

5. **Query Performance**
   - Graph: Query duration histogram
   - Graph: Top 10 slowest queries
   - Stat: Average query time
   - Stat: Median query time
   - Stat: 95th percentile

---

## Dashboard 4: Event Streaming

### Panels

1. **Kafka Metrics**
   - Gauge: Messages per second
   - Graph: Producer rate
   - Graph: Consumer rate
   - Stat: Total messages (24h)
   - Stat: Lag time
   - Stat: Consumer lag

2. **RabbitMQ Metrics**
   - Gauge: Message queue depth
   - Graph: Publish rate
   - Graph: Consume rate
   - Stat: Total messages
   - Stat: Unacked messages
   - Stat: Dead lettered messages

3. **Topic/Queue Details**
   - Graph: Messages per topic/queue
   - Graph: Consumer groups
   - Stat: Active topics
   - Stat: Active queues
   - Stat: Dead letter queues

4. **Event Processing**
   - Graph: Event rate
   - Graph: Processing time
   - Graph: Error rate
   - Stat: Total events (24h)
   - Stat: Failed events
   - Stat: Retried events

---

## Dashboard 5: Business Metrics

### Panels

1. **Order Metrics**
   - Graph: Orders per hour
   - Graph: Order value
   - Stat: Total orders (24h)
   - Stat: Total value (24h)
   - Stat: Average order value

2. **User Metrics**
   - Graph: New users per hour
   - Graph: Active users
   - Stat: Total users
   - Stat: Active users (24h)
   - Stat: New users (24h)

3. **Product Metrics**
   - Graph: Products listed per hour
   - Graph: Products sold
   - Stat: Total products
   - Stat: Products listed (24h)
   - Stat: Products sold (24h)

4. **Payment Metrics**
   - Graph: Payments per hour
   - Graph: Payment value
   - Stat: Total payments (24h)
   - Stat: Total value (24h)
   - Stat: Success rate (%)

5. **Matching Metrics**
   - Graph: Matches per hour
   - Graph: Match success rate
   - Stat: Total matches (24h)
   - Stat: Successful matches
   - Stat: Failed matches

---

## Dashboard 6: Alerts & Incidents

### Panels

1. **Active Alerts**
   - Table: Alert severity
   - Table: Alert message
   - Table: Alert time
   - Table: Alert status
   - Stat: Critical alerts
   - Stat: Warning alerts
   - Stat: Info alerts

2. **Incident History**
   - Graph: Incidents per day
   - Graph: Mean time to resolve (MTTR)
   - Stat: Total incidents (7d)
   - Stat: Resolved incidents
   - Stat: Open incidents

3. **Alert Rules**
   - Table: Alert rule
   - Table: Condition
   - Table: Severity
   - Table: Status
   - Stat: Active rules
   - Stat: Triggered alerts (24h)

4. **Notification Channels**
   - Table: Channel type
   - Table: Channel status
   - Stat: Sent notifications (24h)
   - Stat: Failed notifications
   - Stat: Delivery rate (%)

---

## Grafana Configuration

### Data Sources

**Prometheus**
```yaml
apiVersion: 1
type: Prometheus
access:
  type: proxy
  url: http://prometheus:9090
  isDefault: true
  editable: false
```

**PostgreSQL**
```yaml
apiVersion: 1
type: postgres
url: postgres://mnbarh:mnbarh_dev_password@postgres-primary:5432/mnbarh
database: mnbarh
user: mnbarh
sslmode: disable
```

---

## Alert Rules

### System Alerts

**High CPU Usage**
```yaml
- alert: HighCPUUsage
  expr: 100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High CPU usage detected"
    description: "CPU usage is {{ $value }}% on {{ $labels.instance }}"
```

**High Memory Usage**
```yaml
- alert: HighMemoryUsage
  expr: (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 < 20
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "High memory usage detected"
    description: "Memory available is {{ $value }}% on {{ $labels.instance }}"
```

**High Disk Usage**
```yaml
- alert: HighDiskUsage
  expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes) * 100 < 10
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "High disk usage detected"
    description: "Disk available is {{ $value }}% on {{ $labels.instance }}"
```

### Service Alerts

**Service Down**
```yaml
- alert: ServiceDown
  expr: up == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Service {{ $labels.job }} is down"
    description: "Service {{ $labels.job }} has been down for more than 1 minute"
```

**High Error Rate**
```yaml
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High error rate detected"
    description: "Error rate is {{ $value | humanizePercentage }} for {{ $labels.job }}"
```

**High Response Time**
```yaml
- alert: HighResponseTime
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High response time detected"
    description: "95th percentile response time is {{ $value }}s for {{ $labels.job }}"
```

### Database Alerts

**High Connection Pool Usage**
```yaml
- alert: HighConnectionPoolUsage
  expr: pg_stat_activity_count / pg_settings_max_connections > 0.9
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High connection pool usage"
    description: "Connection pool usage is {{ $value | humanizePercentage }}"
```

**High Replication Lag**
```yaml
- alert: HighReplicationLag
  expr: pg_replication_slot_confirmed_flush_lag_bytes > 100000000
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High replication lag detected"
    description: "Replication lag is {{ $value | humanize }}"
```

---

## PagerDuty Integration

### Alert Routing

```yaml
receivers:
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: '<YOUR_PAGERDUTY_SERVICE_KEY>'
        description: 'Send alerts to PagerDuty'

route:
  receiver: pagerduty
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
```

---

## Dashboard JSON

### System Overview Dashboard

```json
{
  "dashboard": {
    "title": "Mnbara Platform - System Overview",
    "panels": [
      {
        "title": "Service Health Status",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=~\".*service\"}",
            "legendFormat": "{{job}}"
          }
        ]
      },
      {
        "title": "Requests per Second",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{job}}"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "{{job}}"
          }
        ]
      }
    ]
  }
}
```

---

**Status**: ✅ Monitoring Dashboards Configured
**Next**: Update TODO list and generate final summary

---

## Transformation Progress Summary

**Completed Phases**:
- ✅ Phase 0: Analysis & Planning
- ✅ Phase 1: Foundation Stabilization (Critical Fixes)
- ✅ Phase 1: Infrastructure Setup
- ✅ Phase 1: Database & Event Infrastructure

**Completed Deliverables**:
- ✅ Product Tree API Implementation
- ✅ Agile Backlog Generation
- ✅ Event Schemas (Avro)
- ✅ Dead Letter Queues
- ✅ PostgreSQL Read Replicas
- ✅ Connection Pooling (PgBouncer)
- ✅ Automated Failover (Patroni)
- ✅ Auth Service Go Migration (Started)
- ✅ Entity Relationship Diagrams
- ✅ API Documentation
- ✅ Dependency Diagrams
- ✅ Monitoring Dashboards

**In Progress**:
- 🔄 Phase 2: Microservices Polyglot Optimization
- 🔄 Auth Service Go Migration

**Pending**:
- ⏳ API Gateway Go Migration
- ⏳ Matching Service Go Migration
- ⏳ Notification Service Go Migration
- ⏳ Feature Management Go Migration
- ⏳ AI Services (Python)
- ⏳ Financial Services (Rust)
- ⏳ Product Tree Frontend Integration
- ⏳ CI/CD Pipeline Configuration
- ⏳ Kubernetes Orchestration
- ⏳ Self-Healing AI Implementation
- ⏳ Subscription & Payment Systems
- ⏳ Country of Origin Compliance

**Files Created**: 15 documentation files
**Services Migrated**: 1/11 (auth-service-go)
**Infrastructure Ready**: Yes (Kafka, RabbitMQ, PostgreSQL, Redis, Elasticsearch, PgBouncer, Patroni)
