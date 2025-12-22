# Data Encryption at Rest Configuration

This directory contains configurations for encrypting data at rest across all MNBARA platform storage systems.

## Overview

Data encryption at rest protects sensitive data stored in:
- **PostgreSQL** - Database encryption using TDE and pgcrypto
- **MinIO** - Object storage server-side encryption (SSE)
- **Redis** - In-memory data encryption

## Requirements

- Requirement 19.1: API Gateway Security - Data protection

## Components

### 1. PostgreSQL Encryption
- Transparent Data Encryption (TDE) via pgcrypto extension
- Field-level encryption for sensitive data
- See `backend/services/shared/database/encryption.config.ts`

### 2. MinIO Server-Side Encryption
- SSE-S3 (Server-Side Encryption with S3-managed keys)
- SSE-KMS (Server-Side Encryption with KMS)
- Automatic encryption for all uploaded objects

### 3. Redis Encryption
- TLS encryption for data in transit
- RDB/AOF file encryption at rest
- Memory encryption via encrypted swap

## Configuration Files

- `minio-encryption.yaml` - MinIO SSE configuration
- `redis-encryption.yaml` - Redis encryption settings
- `postgres-tde-config.yaml` - PostgreSQL TDE configuration

## Deployment

```bash
# Apply MinIO encryption
kubectl apply -f minio-encryption.yaml

# Apply Redis encryption
kubectl apply -f redis-encryption.yaml

# PostgreSQL TDE is configured via Helm values
helm upgrade mnbara ./infrastructure/k8s/mnbara -f values-encryption.yaml
```

## Key Management

All encryption keys are managed through HashiCorp Vault:
- Keys are rotated automatically every 90 days
- Key access is audited
- See `infrastructure/k8s/vault/` for Vault configuration
