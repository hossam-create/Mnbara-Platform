# MNBARA Platform Monitoring Stack

This directory contains the complete monitoring infrastructure for the MNBARA platform, including metrics collection, distributed tracing, log aggregation, and alerting.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MNBARA Monitoring Stack                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Grafana   │    │   Kibana    │    │   Jaeger    │    │ Alertmanager│  │
│  │  Dashboards │    │  Log Search │    │   Traces    │    │   Alerts    │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                  │                  │                  │          │
│         ▼                  ▼                  ▼                  ▼          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │ Prometheus  │    │Elasticsearch│    │    OTEL     │    │ Prometheus  │  │
│  │   Metrics   │    │    Logs     │    │  Collector  │    │   Rules     │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └─────────────┘  │
│         │                  │                  │                             │
│         ▼                  ▼                  ▼                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    ServiceMonitors / Fluentd / OTEL SDK              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      MNBARA Backend Services                         │   │
│  │  api-gateway | auth | auction | payment | notification | matching   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Prometheus Operator (`prometheus-operator/`)

- **prometheus-operator.yaml**: Deploys the Prometheus Operator
- **prometheus-instance.yaml**: Prometheus server configuration
- **servicemonitors.yaml**: ServiceMonitors for all backend services
- **custom-metrics-rules.yaml**: Recording rules for business KPIs

### 2. Grafana (`grafana/`)

- **grafana-deployment.yaml**: Grafana server with datasources
- **dashboards/**: Pre-built dashboards
  - `service-health.json`: Service health overview
  - `auction-activity.json`: Real-time auction monitoring
  - `payment-transactions.json`: Payment and escrow metrics
  - `crowdship-delivery.json`: Traveler and delivery tracking

### 3. Jaeger & OpenTelemetry (`jaeger/`)

- **jaeger-deployment.yaml**: Jaeger collector, query, and agent
- **otel-collector.yaml**: OpenTelemetry Collector with sampling

### 4. ELK Stack (`elk/`)

- **elasticsearch-logs.yaml**: Elasticsearch for log storage
- **fluentd-daemonset.yaml**: Log collection from all pods
- **kibana-deployment.yaml**: Log search and visualization

### 5. Alertmanager (`alertmanager/`)

- **alertmanager-deployment.yaml**: Alert routing and notifications
- **prometheus-alert-rules.yaml**: Alert definitions

## Quick Start

### Deploy the monitoring stack

```bash
# Create monitoring namespace
kubectl apply -f prometheus-operator/namespace.yaml

# Deploy Prometheus Operator
kubectl apply -f prometheus-operator/

# Deploy Grafana
kubectl apply -f grafana/

# Deploy Jaeger and OTEL Collector
kubectl apply -f jaeger/

# Deploy ELK Stack
kubectl apply -f elk/

# Deploy Alertmanager
kubectl apply -f alertmanager/
```

### Access the UIs

```bash
# Grafana (default: admin/changeme-in-production)
kubectl port-forward -n monitoring svc/grafana 3000:3000

# Prometheus
kubectl port-forward -n monitoring svc/prometheus-mnbara 9090:9090

# Jaeger
kubectl port-forward -n monitoring svc/jaeger-query 16686:16686

# Kibana
kubectl port-forward -n monitoring svc/kibana 5601:5601

# Alertmanager
kubectl port-forward -n monitoring svc/alertmanager-mnbara 9093:9093
```

## Alert Configuration

### PagerDuty Integration

1. Create a PagerDuty service and get the integration key
2. Update the secret in `alertmanager/alertmanager-deployment.yaml`:
   ```yaml
   pagerduty-service-key: "your-actual-key"
   ```

### Slack Integration

1. Create Slack incoming webhooks for `#mnbara-alerts` and `#mnbara-critical`
2. Update the secrets:
   ```yaml
   slack-webhook-url: "https://hooks.slack.com/services/YOUR/WEBHOOK"
   slack-webhook-url-critical: "https://hooks.slack.com/services/YOUR/CRITICAL/WEBHOOK"
   ```

## Key Alerts

| Alert | Severity | Description |
|-------|----------|-------------|
| PaymentFailureRateHigh | Critical | Payment failure rate > 5% |
| AuctionTimerDrift | Critical | Auction timer drift > 1 second |
| ServiceDown | Critical | Any service unreachable |
| HighErrorRate | Warning | Error rate > 5% |
| HighLatency | Warning | P99 latency > 2 seconds |
| DatabaseConnectionPoolExhausted | Warning | Connection pool > 90% |

## Dashboards

### Service Health Dashboard
- Service availability status
- Request rate by service
- Error rate by service
- P99/P50 latency
- CPU and memory usage

### Auction Activity Dashboard
- Active auctions count
- Bids per minute
- WebSocket connections
- Timer drift monitoring
- Bid processing latency

### Payment Transactions Dashboard
- GMV (Gross Merchandise Volume)
- Payment success/failure rates
- Escrow flow monitoring
- Transactions by provider
- Payment failures by reason

### Crowdship Delivery Dashboard
- Active trips and travelers
- Delivery completion rate
- Match success rate
- Geographic distribution

## Tracing Integration

Backend services should initialize tracing at startup:

```typescript
// First import in your service
import { initTracing } from '@mnbara/shared/tracing';

initTracing({
  serviceName: 'your-service-name',
  serviceVersion: '1.0.0',
});
```

See `backend/services/shared/tracing/README.md` for detailed instructions.

## Log Format

Services should output JSON logs with these fields:

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "info",
  "message": "Request processed",
  "service": "payment-service",
  "traceId": "abc123",
  "spanId": "def456",
  "userId": "user-123",
  "requestId": "req-789"
}
```

## Retention Policies

| Data Type | Retention |
|-----------|-----------|
| Prometheus metrics | 15 days |
| Jaeger traces | 7 days |
| Elasticsearch logs | 30 days |

## Troubleshooting

### Prometheus not scraping targets

1. Check ServiceMonitor labels match service labels
2. Verify service exposes `/metrics` endpoint
3. Check Prometheus targets: `http://prometheus:9090/targets`

### Traces not appearing in Jaeger

1. Verify OTEL Collector is running
2. Check service tracing initialization
3. Review OTEL Collector logs for export errors

### Logs not appearing in Kibana

1. Check Fluentd DaemonSet is running on all nodes
2. Verify Elasticsearch is healthy
3. Check Fluentd logs for parsing errors

### Alerts not firing

1. Verify Prometheus rules are loaded: `http://prometheus:9090/rules`
2. Check Alertmanager is receiving alerts: `http://alertmanager:9093`
3. Verify webhook URLs are correct
