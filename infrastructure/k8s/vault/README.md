# HashiCorp Vault Integration for MNBARA Platform

This directory contains the Kubernetes manifests for deploying and configuring HashiCorp Vault for the MNBARA platform.

## Overview

Vault provides centralized secrets management for all MNBARA microservices, including:
- Database credentials
- API keys (Stripe, PayPal, OAuth providers)
- JWT secrets
- Encryption keys
- Service certificates

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Vault HA Cluster (3 nodes)                    │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                         │
│  │ vault-0 │  │ vault-1 │  │ vault-2 │                         │
│  │ (leader)│  │(standby)│  │(standby)│                         │
│  └────┬────┘  └────┬────┘  └────┬────┘                         │
│       └────────────┼────────────┘                               │
│                    │                                             │
│            ┌───────┴───────┐                                    │
│            │  Raft Storage │                                    │
│            └───────────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Vault Agent Injector                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ MutatingWebhook → Injects Vault Agent sidecar into pods │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MNBARA Services                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │auth-svc  │ │payment-  │ │auction-  │ │listing-  │ ...      │
│  │+ agent   │ │svc+agent │ │svc+agent │ │svc+agent │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Files

| File | Description |
|------|-------------|
| `vault-namespace.yaml` | Vault namespace configuration |
| `vault-ha-deployment.yaml` | HA StatefulSet with Raft storage |
| `vault-auto-unseal.yaml` | Auto-unseal configuration with cloud KMS |
| `vault-tls.yaml` | TLS certificate configuration |
| `vault-audit.yaml` | Audit logging configuration |
| `vault-kubernetes-auth.yaml` | Kubernetes authentication setup |
| `vault-agent-injector.yaml` | Agent Injector deployment |
| `vault-service-policies.yaml` | Service-specific access policies |
| `vault-secrets-config.yaml` | Secrets engine and migration |
| `vault-database-secrets.yaml` | Dynamic database credentials |
| `vault-pki.yaml` | PKI secrets engine for certificates |
| `vault-integration-examples.yaml` | Example service deployments |

## Deployment Order

1. Create namespace and TLS certificates:
   ```bash
   kubectl apply -f vault-namespace.yaml
   kubectl apply -f vault-tls.yaml
   ```

2. Deploy Vault HA cluster:
   ```bash
   kubectl apply -f vault-ha-deployment.yaml
   kubectl apply -f vault-auto-unseal.yaml
   kubectl apply -f vault-audit.yaml
   ```

3. Initialize and unseal Vault (first time only):
   ```bash
   kubectl exec -n vault vault-0 -- vault operator init
   # Save the unseal keys and root token securely!
   ```

4. Configure Kubernetes authentication:
   ```bash
   kubectl apply -f vault-kubernetes-auth.yaml
   ```

5. Deploy Agent Injector:
   ```bash
   kubectl apply -f vault-agent-injector.yaml
   ```

6. Apply service policies:
   ```bash
   kubectl apply -f vault-service-policies.yaml
   ```

7. Migrate existing secrets:
   ```bash
   kubectl apply -f vault-secrets-config.yaml
   ```

## Using Vault with Services

### Enable Vault Injection for a Namespace

Add the label to enable Vault injection:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: mnbara
  labels:
    vault-injection: enabled
```

### Annotate Pods for Secret Injection

Add these annotations to your pod spec:
```yaml
metadata:
  annotations:
    vault.hashicorp.com/agent-inject: "true"
    vault.hashicorp.com/role: "auth-service"
    vault.hashicorp.com/agent-inject-secret-database.json: "secret/data/mnbara/database"
    vault.hashicorp.com/agent-inject-template-database.json: |
      {{- with secret "secret/data/mnbara/database" -}}
      {
        "host": "{{ .Data.data.host }}",
        "password": "{{ .Data.data.password }}"
      }
      {{- end -}}
```

### Reading Secrets in Application

Secrets are injected to `/vault/secrets/` directory:
```typescript
import { readFileSync } from 'fs';

const dbConfig = JSON.parse(
  readFileSync('/vault/secrets/database.json', 'utf-8')
);
```

## Service Policies

Each service has a dedicated policy with least-privilege access:

| Service | Secrets Access |
|---------|---------------|
| api-gateway | database, jwt, redis |
| auth-service | database, jwt, oauth, redis, encryption |
| payment-service | database, stripe, paypal, redis, rabbitmq, blockchain |
| auction-service | database, redis, rabbitmq |
| listing-service | database, minio, elasticsearch, redis |
| notification-service | database, notifications, rabbitmq, redis |
| recommendation-service | database, redis, rabbitmq |
| matching-service | database, redis |
| trips-service | database, redis |
| orders-service | database, redis, rabbitmq |
| rewards-service | database, redis |
| admin-service | database, all secrets (read-only) |
| crowdship-service | database, redis, rabbitmq |

## Secrets Paths

All MNBARA secrets are stored under `secret/data/mnbara/`:

- `secret/data/mnbara/database` - PostgreSQL credentials
- `secret/data/mnbara/redis` - Redis credentials
- `secret/data/mnbara/rabbitmq` - RabbitMQ credentials
- `secret/data/mnbara/jwt` - JWT signing secrets
- `secret/data/mnbara/stripe` - Stripe API keys
- `secret/data/mnbara/paypal` - PayPal credentials
- `secret/data/mnbara/oauth` - OAuth provider credentials
- `secret/data/mnbara/minio` - MinIO credentials
- `secret/data/mnbara/elasticsearch` - Elasticsearch credentials
- `secret/data/mnbara/encryption` - Encryption keys
- `secret/data/mnbara/notifications` - FCM/APNs credentials
- `secret/data/mnbara/blockchain` - Web3/Infura credentials

## Monitoring

Vault exposes Prometheus metrics at `/v1/sys/metrics`:
```yaml
prometheus.io/scrape: "true"
prometheus.io/port: "8200"
prometheus.io/path: "/v1/sys/metrics"
```

## Troubleshooting

### Check Vault Status
```bash
kubectl exec -n vault vault-0 -- vault status
```

### View Agent Injector Logs
```bash
kubectl logs -n vault -l app.kubernetes.io/name=vault-agent-injector
```

### Check Pod Injection
```bash
kubectl describe pod <pod-name> -n mnbara | grep -A 20 "Annotations"
```

### Verify Policy
```bash
kubectl exec -n vault vault-0 -- vault policy read auth-service
```

## Security Considerations

1. **Root Token**: Store securely and rotate regularly
2. **Unseal Keys**: Use Shamir's secret sharing or auto-unseal
3. **TLS**: Always enable TLS in production
4. **Audit Logs**: Enable and monitor audit logs
5. **Policies**: Follow least-privilege principle
6. **Token TTL**: Use short-lived tokens with renewal
