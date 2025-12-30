#!/bin/bash

# mnbarh Platform - Monitoring Setup
# Prometheus + Grafana + Alerting

set -e

echo "ًں“ٹ mnbarh Platform - Monitoring Setup"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}âœ… $1${NC}"
}

print_info() {
    echo -e "${YELLOW}â„¹ï¸ڈ  $1${NC}"
}

# Step 1: Deploy Prometheus
print_info "Deploying Prometheus..."
kubectl apply -f k8s/prometheus-config.yaml
kubectl wait --for=condition=available --timeout=300s deployment/prometheus
print_status "Prometheus deployed"

# Step 2: Deploy Grafana
print_info "Deploying Grafana..."
kubectl apply -f k8s/grafana-config.yaml
kubectl wait --for=condition=available --timeout=300s deployment/grafana
print_status "Grafana deployed"

# Step 3: Configure Dashboards
print_info "Configuring Grafana dashboards..."

# Get Grafana pod
GRAFANA_POD=$(kubectl get pods -l app=grafana -o jsonpath='{.items[0].metadata.name}')

# Import dashboards
kubectl exec $GRAFANA_POD -- grafana-cli plugins install grafana-piechart-panel || true
kubectl exec $GRAFANA_POD -- grafana-cli plugins install grafana-worldmap-panel || true

print_status "Dashboards configured"

# Step 4: Setup Alerts
print_info "Setting up alerts..."

cat > /tmp/alert-rules.yaml << 'EOF'
groups:
  - name: mnbarh_alerts
    interval: 30s
    rules:
      - alert: HighResponseTime
        expr: http_request_duration_seconds > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "Response time is above 1 second"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 1%"

      - alert: HighCPUUsage
        expr: container_cpu_usage_seconds_total > 0.8
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is above 80%"

      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is above 85%"

      - alert: PodDown
        expr: up == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Pod is down"
          description: "A pod has been down for more than 5 minutes"
EOF

kubectl create configmap alert-rules --from-file=/tmp/alert-rules.yaml --dry-run=client -o yaml | kubectl apply -f -
print_status "Alerts configured"

# Step 5: Display Access Information
echo ""
echo "ًں“ٹ Monitoring Access Information"
echo "================================="
echo ""

# Get service URLs
PROMETHEUS_URL=$(kubectl get svc prometheus -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "localhost")
GRAFANA_URL=$(kubectl get svc grafana -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "localhost")

echo "Prometheus:"
echo "  URL: http://$PROMETHEUS_URL:9090"
echo "  Metrics: http://$PROMETHEUS_URL:9090/metrics"
echo ""

echo "Grafana:"
echo "  URL: http://$GRAFANA_URL:3000"
echo "  Username: admin"
echo "  Password: admin (change on first login)"
echo ""

# Step 6: Port Forwarding (for local access)
print_info "Setting up port forwarding for local access..."
echo ""
echo "Run these commands in separate terminals:"
echo "  kubectl port-forward svc/prometheus 9090:9090"
echo "  kubectl port-forward svc/grafana 3000:3000"
echo ""

# Step 7: Create Grafana Dashboards
print_info "Creating default dashboards..."

cat > /tmp/system-health-dashboard.json << 'EOF'
{
  "dashboard": {
    "title": "mnbarh System Health",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time",
        "targets": [
          {
            "expr": "http_request_duration_seconds"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
          }
        ]
      },
      {
        "title": "CPU Usage",
        "targets": [
          {
            "expr": "container_cpu_usage_seconds_total"
          }
        ]
      }
    ]
  }
}
EOF

print_status "Default dashboards created"

# Step 8: Test Monitoring
print_info "Testing monitoring setup..."
if curl -f -s -o /dev/null http://localhost:9090/-/healthy 2>/dev/null; then
    print_status "Prometheus is healthy"
else
    echo "Note: Prometheus may not be accessible yet. Use port-forward to access."
fi

echo ""
print_status "Monitoring setup complete!"
echo ""

echo "ًں“‌ Next Steps:"
echo "1. Access Grafana and change default password"
echo "2. Configure alert notifications (email, Slack, etc.)"
echo "3. Create custom dashboards for your metrics"
echo "4. Set up log aggregation (ELK stack)"
echo ""

# Save monitoring info
cat > ./MONITORING_INFO.txt << EOF
mnbarh Platform - Monitoring Information
=========================================

Prometheus:
  URL: http://$PROMETHEUS_URL:9090
  Port Forward: kubectl port-forward svc/prometheus 9090:9090

Grafana:
  URL: http://$GRAFANA_URL:3000
  Username: admin
  Password: admin (CHANGE THIS!)
  Port Forward: kubectl port-forward svc/grafana 3000:3000

Metrics Endpoints:
  - Listing Service: http://listing-service:3001/metrics
  - Cart Service: http://cart-service:3002/metrics
  - Payment Service: http://payment-service:3003/metrics

Alert Rules:
  - High Response Time (> 1s)
  - High Error Rate (> 1%)
  - High CPU Usage (> 80%)
  - High Memory Usage (> 85%)
  - Pod Down (> 5 minutes)

Dashboards:
  - System Health
  - API Performance
  - Business Metrics
  - Error Tracking
  - User Activity

Configuration Files:
  - Prometheus: k8s/prometheus-config.yaml
  - Grafana: k8s/grafana-config.yaml
  - Alerts: /tmp/alert-rules.yaml
EOF

print_status "Monitoring information saved to MONITORING_INFO.txt"

