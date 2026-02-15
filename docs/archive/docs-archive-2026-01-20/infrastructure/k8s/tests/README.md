# Kubernetes Validation Tests

This directory contains validation tests for the MNBARA platform Kubernetes deployments, monitoring infrastructure, and secrets management.

## Overview

These tests validate:
- **Rolling Update Strategy**: Ensures zero-downtime deployments
- **Pod Disruption Budgets (PDB)**: Ensures high availability during cluster maintenance
- **Alert Firing Conditions**: Validates Prometheus alert rules syntax and thresholds
- **Dashboard Data Accuracy**: Validates Grafana dashboard JSON structure and queries
- **Credential Rotation**: Validates Vault dynamic database credentials configuration
- **Certificate Renewal**: Validates PKI secrets engine for service certificates

## Requirements

- Helm 3.x installed (for deployment tests)
- Access to the chart directory (`infrastructure/k8s/mnbara`)
- Python 3.x (optional, for JSON validation in bash tests)

## Running Tests

### Bash (Linux/macOS)

```bash
chmod +x infrastructure/k8s/tests/deployment-validation.test.sh
./infrastructure/k8s/tests/deployment-validation.test.sh
```

### PowerShell (Windows)

```powershell
.\infrastructure\k8s\tests\deployment-validation.test.ps1
```

### Custom Chart Path

```bash
CHART_PATH=/path/to/chart ./deployment-validation.test.sh
```

```powershell
.\deployment-validation.test.ps1 -ChartPath "C:\path\to\chart"
```

### Monitoring Validation Tests

```bash
chmod +x infrastructure/k8s/tests/monitoring-validation.test.sh
./infrastructure/k8s/tests/monitoring-validation.test.sh
```

```powershell
.\infrastructure\k8s\tests\monitoring-validation.test.ps1
```

### Custom Monitoring Path

```bash
MONITORING_PATH=/path/to/monitoring ./monitoring-validation.test.sh
```

```powershell
.\monitoring-validation.test.ps1 -MonitoringPath "C:\path\to\monitoring"
```

## Test Cases

### Rolling Update Strategy Tests

| Test | Description |
|------|-------------|
| RollingUpdate strategy | All deployments use `type: RollingUpdate` |
| maxSurge configured | All deployments have `maxSurge` set |
| maxUnavailable=0 | Zero-downtime: no pods unavailable during update |
| terminationGracePeriodSeconds | Grace period >= 30s for graceful shutdown |
| preStop lifecycle hook | All deployments have preStop hook for connection draining |

### Pod Disruption Budget Tests

| Test | Description |
|------|-------------|
| PDB exists | `pdb.yaml` file is present |
| minAvailable configured | PDBs specify minimum available pods |
| Critical service PDB | Auction service has `minAvailable: 2` |
| matchLabels selector | PDBs have proper label selectors |
| API version | PDBs use `policy/v1` (not deprecated `policy/v1beta1`) |

## Exit Codes

- `0`: All tests passed
- `1`: One or more tests failed

## Integration with CI/CD

Add to your CI pipeline:

```yaml
- name: Validate Kubernetes Deployments
  run: |
    chmod +x infrastructure/k8s/tests/deployment-validation.test.sh
    ./infrastructure/k8s/tests/deployment-validation.test.sh
```

### Monitoring Validation Tests

| Test | Description |
|------|-------------|
| Alert rules file exists | `prometheus-alert-rules.yaml` is present |
| PrometheusRule kind | Alert rules use correct Kubernetes CRD kind |
| Critical alerts severity | Critical alerts have `severity: critical` label |
| PaymentFailureRateHigh | Payment failure alert exists with 5% threshold |
| AuctionTimerDrift | Auction timer drift alert exists with 1s threshold |
| ServiceDown | Service down alert uses `up == 0` expression |
| Alerts have annotations | All alerts have summary/description annotations |
| Alerts have 'for' duration | All alerts have firing duration configured |
| Alert groups named | Expected alert groups (payment, auction, service, infrastructure) exist |
| Dashboard exists | Service health dashboard JSON file exists |
| Valid JSON | Dashboard has valid JSON structure |
| Dashboard panels | Dashboard has sufficient panels (>5) |
| Prometheus datasource | Dashboard queries use Prometheus |
| Service status panels | Dashboard includes all core services |
| Request rate metrics | Dashboard has `http_requests_total` queries |
| Error rate metrics | Dashboard has 5xx error rate queries |
| Latency metrics | Dashboard uses `histogram_quantile` for latency |
| All dashboards exist | All required dashboards are present |

### Vault Secrets Rotation Validation Tests

```bash
chmod +x infrastructure/k8s/tests/vault-secrets-rotation.test.sh
./infrastructure/k8s/tests/vault-secrets-rotation.test.sh
```

```powershell
.\infrastructure\k8s\tests\vault-secrets-rotation.test.ps1
```

### Custom Vault Path

```bash
VAULT_PATH=/path/to/vault ./vault-secrets-rotation.test.sh
```

```powershell
.\vault-secrets-rotation.test.ps1 -VaultPath "C:\path\to\vault"
```

### Credential Rotation Tests

| Test | Description |
|------|-------------|
| Database secrets file exists | `vault-database-secrets.yaml` is present |
| Database engine enabled | Database secrets engine is enabled |
| PostgreSQL plugin | PostgreSQL database plugin is configured |
| Dynamic roles defined | All roles (readonly, readwrite, admin) are defined |
| TTL configured | Default and max TTL are configured for rotation |
| Readonly role TTL | Readonly role has 1h/24h TTL |
| Admin role TTL | Admin role has shorter 30m/2h TTL for security |
| Revocation statements | Credential cleanup statements are configured |
| SCRAM-SHA-256 auth | Secure password authentication is used |
| SSL required | Database connections require SSL |

### Certificate Renewal Tests

| Test | Description |
|------|-------------|
| PKI file exists | `vault-pki.yaml` is present |
| Root PKI enabled | Root PKI secrets engine is enabled |
| Intermediate PKI enabled | Intermediate PKI secrets engine is enabled |
| Root CA TTL | Root CA has 10-year TTL (87600h) |
| Intermediate CA TTL | Intermediate CA has 5-year TTL (43800h) |
| Service role defined | mnbara-service PKI role exists |
| Internal role defined | mnbara-internal PKI role exists |
| Service cert TTL | Service certificates have 72h/720h TTL |
| Internal cert TTL | Internal certificates have 24h TTL for frequent rotation |
| CRL configured | CRL distribution points are configured |
| Issuing URL | Issuing certificates URL is configured |
| Key usage | DigitalSignature and KeyEncipherment are set |
| Extended key usage | ServerAuth and ClientAuth are configured |
| Allowed domains | Certificate issuance domains are restricted |

### Vault Agent Integration Tests

| Test | Description |
|------|-------------|
| Agent Injector exists | `vault-agent-injector.yaml` is present |
| Deployment configured | Agent Injector deployment is defined |
| Webhook configured | MutatingWebhookConfiguration for pod injection |
| Kubernetes auth exists | `vault-kubernetes-auth.yaml` is present |
| Kubernetes auth enabled | Kubernetes authentication method is enabled |
| Token TTL configured | Token TTL is set for Kubernetes auth |

## Related Requirements

- **Requirement 19.1**: API Gateway Security - THE API_Gateway SHALL enforce JWT authentication on all protected endpoints
- **Requirement 20.1**: Monitoring and Observability - THE MNBARA_System SHALL expose Prometheus metrics for all services
- **Requirement 20.3**: Monitoring and Observability - THE MNBARA_System SHALL configure alerts for payment failures, auction timer drift, and service health
