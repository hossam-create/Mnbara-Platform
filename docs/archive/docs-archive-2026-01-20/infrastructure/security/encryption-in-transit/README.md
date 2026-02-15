# Data Encryption in Transit Configuration

This directory contains configurations for encrypting data in transit across all MNBARA platform communications.

## Overview

Data encryption in transit protects data as it moves between:
- Client applications and API Gateway
- Microservices within the cluster
- Services and databases
- Mobile apps and backend services

## Requirements

- Requirement 19.1: API Gateway Security - Data protection

## Components

### 1. TLS 1.3 Configuration
- All service-to-service communication uses TLS 1.3
- Strong cipher suites only
- Perfect Forward Secrecy (PFS) enabled

### 2. Certificate Rotation
- Automated certificate rotation via cert-manager
- Certificates renewed 30 days before expiry
- Zero-downtime rotation

### 3. Certificate Pinning (Mobile)
- Public key pinning for mobile apps
- Backup pins for rotation
- Pin validation in React Native

## Configuration Files

- `tls-config.yaml` - TLS 1.3 configuration for all services
- `cert-rotation.yaml` - Automated certificate rotation
- `mobile-cert-pinning.ts` - Certificate pinning for mobile apps

## Deployment

```bash
# Apply TLS configuration
kubectl apply -f tls-config.yaml

# Apply certificate rotation
kubectl apply -f cert-rotation.yaml
```

## Mobile App Integration

Copy the certificate pinning configuration to your mobile app:
```bash
cp mobile-cert-pinning.ts frontend/mobile/mnbara-app/src/config/
```

## Key Management

All certificates are managed through:
- cert-manager for Kubernetes certificates
- HashiCorp Vault PKI for service certificates
- Let's Encrypt for public-facing certificates
