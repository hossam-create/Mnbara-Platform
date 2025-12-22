# MNBARA Platform Kubernetes Deployment

This directory contains Helm charts for deploying the MNBARA e-commerce platform to Kubernetes.

## Prerequisites

- Kubernetes 1.25+
- Helm 3.10+
- kubectl configured to access your cluster
- cert-manager (for TLS certificates)
- nginx-ingress controller
- Metrics Server (for HPA)

## Features

- **Horizontal Pod Autoscaling (HPA)**: CPU and memory-based autoscaling with configurable behavior
- **Pod Disruption Budgets (PDB)**: Ensures high availability during cluster maintenance
- **Resource Quotas**: Namespace-level resource limits for production environments
- **Limit Ranges**: Default resource constraints for containers
- **Priority Classes**: Critical, high, and normal priority scheduling
- **Network Policies**: Service-to-service communication restrictions
- **Security Contexts**: Non-root containers with read-only filesystems
- **Topology Spread**: Zone-aware pod distribution

## Quick Start

### Development Environment

```bash
# Add Bitnami repo for dependencies
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Update dependencies
cd infrastructure/k8s/mnbara
helm dependency update

# Install in development mode
helm install mnbara . -f values-dev.yaml --create-namespace
```

### Staging Environment

```bash
# Create secrets first
kubectl create secret generic mnbara-secrets \
  --from-literal=postgres-password=<password> \
  --from-literal=redis-password=<password> \
  --from-literal=jwt-secret=<secret> \
  -n mnbara-staging

# Install
helm install mnbara . -f values-staging.yaml --create-namespace
```

### Production Environment

```bash
# Create secrets (use external secrets manager in production)
kubectl create secret generic mnbara-database \
  --from-literal=postgres-password=<password> \
  --from-literal=password=<password> \
  -n mnbara-prod

kubectl create secret generic mnbara-redis \
  --from-literal=redis-password=<password> \
  -n mnbara-prod

kubectl create secret generic mnbara-jwt \
  --from-literal=jwt-secret=<secret> \
  -n mnbara-prod

kubectl create secret generic mnbara-stripe \
  --from-literal=secret-key=<stripe-key> \
  --from-literal=webhook-secret=<webhook-secret> \
  -n mnbara-prod

# Install
helm install mnbara . -f values-prod.yaml --create-namespace
```

## Chart Structure

```
mnbara/
├── Chart.yaml              # Chart metadata and dependencies
├── values.yaml             # Default values
├── values-dev.yaml         # Development overrides
├── values-staging.yaml     # Staging overrides
├── values-prod.yaml        # Production overrides
└── templates/
    ├── _helpers.tpl        # Template helpers
    ├── namespace.yaml      # Namespace
    ├── serviceaccount.yaml # Service account
    ├── configmap.yaml      # Common configuration
    ├── secrets.yaml        # Secrets (if not using external)
    ├── ingress.yaml        # Ingress configuration
    ├── networkpolicy.yaml  # Network policies
    ├── pdb.yaml            # Pod disruption budgets
    ├── servicemonitor.yaml # Prometheus ServiceMonitors
    ├── NOTES.txt           # Post-install notes
    └── <service>/          # Per-service templates
        ├── deployment.yaml
        ├── service.yaml
        └── hpa.yaml
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| api-gateway | 8080 | API Gateway / Load Balancer |
| auth-service | 3001 | Authentication & Authorization |
| listing-service | 3002 | Product Listings |
| auction-service | 3003 | Real-time Auctions |
| payment-service | 3004 | Payment Processing |
| crowdship-service | 3005 | Crowdshipping |
| notification-service | 3006 | Notifications |
| recommendation-service | 3007 | AI Recommendations |
| rewards-service | 3008 | Loyalty Program |
| orders-service | 3009 | Order Management |
| trips-service | 3010 | Traveler Trips |
| matching-service | 3011 | Geo-spatial Matching |
| admin-service | 3012 | Admin Operations |
| web-frontend | 80 | Web Application |
| admin-dashboard | 80 | Admin Dashboard |

## Configuration

### External Secrets Operator

For production environments, use the External Secrets Operator to sync secrets from external providers:

```yaml
externalSecrets:
  enabled: true
  provider: "aws"  # Options: aws, vault, azure, gcp
  refreshInterval: "1h"
  
  # AWS Secrets Manager
  aws:
    region: "us-east-1"
    role: "arn:aws:iam::123456789:role/mnbara-secrets"
    serviceAccountRef: "mnbara-sa"
  
  # HashiCorp Vault
  vault:
    server: "http://vault.vault:8200"
    path: "secret"
    role: "mnbara"
  
  # Secret paths
  secretPaths:
    database: "mnbara/database"
    redis: "mnbara/redis"
    jwt: "mnbara/jwt"
    stripe: "mnbara/stripe"
```

#### Prerequisites for External Secrets

1. Install External Secrets Operator:
```bash
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets -n external-secrets --create-namespace
```

2. Configure IAM/RBAC for your provider (AWS example):
```bash
# Create IAM policy for Secrets Manager access
aws iam create-policy --policy-name MNBARASecretsAccess --policy-document file://secrets-policy.json

# Associate with service account (EKS)
eksctl create iamserviceaccount \
  --name mnbara-sa \
  --namespace mnbara-prod \
  --cluster your-cluster \
  --attach-policy-arn arn:aws:iam::123456789:policy/MNBARASecretsAccess
```

### Legacy Secrets (Non-External)

For development or when not using external secrets:

```yaml
secrets:
  database:
    existingSecret: "my-external-db-secret"
  redis:
    existingSecret: "my-external-redis-secret"
  jwt:
    existingSecret: "my-external-jwt-secret"
```

### Service-Specific ConfigMaps

Each service has its own ConfigMap with environment-specific settings:

```yaml
# API Gateway configuration
apiGateway:
  config:
    rateLimiting:
      enabled: true
      windowMs: 60000
      maxRequests: 100
    circuitBreaker:
      enabled: true
      threshold: 5
      timeout: 30000

# Auction Service configuration
auctionService:
  config:
    websocket:
      maxConnections: 10000
    auction:
      autoExtendEnabled: true
      autoExtendThresholdSeconds: 120

# Payment Service configuration
paymentService:
  config:
    escrow:
      enabled: true
      holdDurationDays: 14
    stripe:
      enabled: true
```

### Autoscaling

The chart supports multiple autoscaling mechanisms:

#### Horizontal Pod Autoscaler (HPA)

Each service supports HPA configuration:

```yaml
authService:
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70
```

#### Enhanced HPA with Custom Metrics

Enable custom metrics for more intelligent scaling:

```yaml
autoscaling:
  hpa:
    enhanced: true
    customMetrics:
      enabled: true

auctionService:
  autoscaling:
    targetWebsocketConnections: "500"
    targetBidsPerSecond: "100"
```

Requires Prometheus Adapter for custom metrics:
```bash
helm install prometheus-adapter prometheus-community/prometheus-adapter
```

#### Vertical Pod Autoscaler (VPA)

Automatically adjust CPU and memory requests:

```yaml
autoscaling:
  vpa:
    enabled: true
    updateMode: "Auto"  # Off, Initial, Recreate, Auto
    minAllowed:
      cpu: "50m"
      memory: "128Mi"
    maxAllowed:
      cpu: "4"
      memory: "8Gi"
```

Install VPA:
```bash
git clone https://github.com/kubernetes/autoscaler.git
cd autoscaler/vertical-pod-autoscaler
./hack/vpa-up.sh
```

#### Cluster Autoscaler

Configure cluster-level node scaling:

```yaml
autoscaling:
  clusterAutoscaler:
    enabled: true
    expander: "least-waste"
    scaleDown:
      enabled: true
      unneededTime: "10m"
      utilizationThreshold: "0.5"
    nodePools:
      general:
        minNodes: 2
        maxNodes: 10
      highMemory:
        minNodes: 1
        maxNodes: 5
```

### Resource Limits

Configure per-service resources:

```yaml
auctionService:
  resources:
    limits:
      cpu: 1000m
      memory: 1Gi
    requests:
      cpu: 200m
      memory: 512Mi
```

## Monitoring

When monitoring is enabled, ServiceMonitors are created for Prometheus:

```yaml
monitoring:
  enabled: true
  prometheus:
    enabled: true
    serviceMonitor:
      enabled: true
      interval: 30s
```

## Upgrading

```bash
# Update dependencies
helm dependency update

# Upgrade release
helm upgrade mnbara . -f values-prod.yaml
```

## Uninstalling

```bash
helm uninstall mnbara -n mnbara-prod
```

## Service Mesh

The chart supports both Istio and Linkerd service meshes for mTLS and traffic management.

### Enabling Istio

```yaml
serviceMesh:
  enabled: true
  provider: "istio"
  istio:
    mtls:
      mode: "STRICT"
    loadBalancer: "ROUND_ROBIN"
    timeout: "30s"
    retries:
      attempts: 3
      perTryTimeout: "10s"
    outlierDetection:
      consecutive5xxErrors: 5
      interval: "30s"
```

#### Prerequisites for Istio

```bash
# Install Istio
istioctl install --set profile=production

# Enable sidecar injection for namespace
kubectl label namespace mnbara-prod istio-injection=enabled
```

### Enabling Linkerd

```yaml
serviceMesh:
  enabled: true
  provider: "linkerd"
  linkerd:
    timeout: "30s"
    retryBudget:
      retryRatio: 0.2
      minRetriesPerSecond: 10
```

#### Prerequisites for Linkerd

```bash
# Install Linkerd
linkerd install | kubectl apply -f -

# Inject sidecars
kubectl get deploy -n mnbara-prod -o yaml | linkerd inject - | kubectl apply -f -
```

### Service Mesh Features

- **mTLS**: Automatic mutual TLS between all services
- **Traffic Management**: Retries, timeouts, circuit breakers
- **Load Balancing**: Round-robin, least-request, random
- **Outlier Detection**: Automatic ejection of unhealthy pods
- **Rate Limiting**: Per-service rate limits (Istio only)

## Validation Tests

The chart includes deployment validation tests to ensure proper configuration of rolling updates and pod disruption budgets.

### Running Tests

```bash
# Bash (Linux/macOS)
chmod +x infrastructure/k8s/tests/deployment-validation.test.sh
./infrastructure/k8s/tests/deployment-validation.test.sh

# PowerShell (Windows)
.\infrastructure\k8s\tests\deployment-validation.test.ps1
```

### Test Coverage

- **Rolling Update Strategy**: Validates zero-downtime deployment configuration
- **Pod Disruption Budgets**: Ensures high availability during cluster maintenance

See [tests/README.md](tests/README.md) for detailed test documentation.

## Troubleshooting

### Check pod status
```bash
kubectl get pods -n mnbara-prod
```

### View logs
```bash
kubectl logs -f deployment/auction-service -n mnbara-prod
```

### Describe pod for events
```bash
kubectl describe pod <pod-name> -n mnbara-prod
```

### Check HPA status
```bash
kubectl get hpa -n mnbara-prod
```
