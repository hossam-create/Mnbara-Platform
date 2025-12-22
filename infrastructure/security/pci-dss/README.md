# PCI-DSS Compliance Configuration

This directory contains configurations and documentation for PCI-DSS compliance in the MNBARA platform.

## Overview

PCI-DSS (Payment Card Industry Data Security Standard) compliance ensures secure handling of cardholder data. The MNBARA platform implements the following controls:

## Requirements

- Requirement 19.1: API Gateway Security - Data protection

## PCI-DSS Requirements Mapping

### Requirement 1: Install and maintain a firewall configuration
- Network segmentation via Kubernetes NetworkPolicies
- Firewall rules for payment service isolation
- See `network-segmentation.yaml`

### Requirement 2: Do not use vendor-supplied defaults
- Custom configurations for all services
- Secure password policies
- See Helm values files

### Requirement 3: Protect stored cardholder data
- No cardholder data stored (tokenization via Stripe)
- Encryption at rest for any sensitive data
- See `cardholder-data-protection.yaml`

### Requirement 4: Encrypt transmission of cardholder data
- TLS 1.3 for all communications
- Certificate pinning for mobile apps
- See `../encryption-in-transit/`

### Requirement 5: Protect all systems against malware
- Container image scanning
- Runtime security monitoring
- See `security-scanning.yaml`

### Requirement 6: Develop and maintain secure systems
- Secure SDLC practices
- Vulnerability management
- See `.github/workflows/`

### Requirement 7: Restrict access to cardholder data
- Role-based access control
- Least privilege principle
- See `access-control.yaml`

### Requirement 8: Identify and authenticate access
- Strong authentication (MFA)
- Unique user IDs
- See auth-service configuration

### Requirement 9: Restrict physical access
- Cloud provider responsibility (AWS/GCP)
- See cloud provider compliance documentation

### Requirement 10: Track and monitor all access
- Comprehensive audit logging
- Security monitoring
- See `security-logging.yaml`

### Requirement 11: Regularly test security systems
- Penetration testing
- Vulnerability scanning
- See `security-testing.yaml`

### Requirement 12: Maintain an information security policy
- Security policies documented
- See `COMPLIANCE_DOCUMENTATION.md`

## Configuration Files

- `network-segmentation.yaml` - Network isolation for payment services
- `cardholder-data-protection.yaml` - Data protection controls
- `security-logging.yaml` - Security logging and monitoring
- `access-control.yaml` - Access control policies
- `COMPLIANCE_DOCUMENTATION.md` - Compliance documentation

## Deployment

```bash
# Apply all PCI-DSS configurations
kubectl apply -f network-segmentation.yaml
kubectl apply -f cardholder-data-protection.yaml
kubectl apply -f security-logging.yaml
kubectl apply -f access-control.yaml
```

## Compliance Validation

Run the compliance validation script:
```bash
./validate-pci-compliance.sh
```

## Important Notes

1. **No Cardholder Data Storage**: MNBARA uses Stripe for payment processing and does not store cardholder data (PAN, CVV, etc.)

2. **Tokenization**: All payment methods are tokenized via Stripe

3. **SAQ A Eligibility**: Due to tokenization, MNBARA may qualify for SAQ A (Self-Assessment Questionnaire A)

4. **Annual Assessment**: PCI-DSS compliance must be validated annually
