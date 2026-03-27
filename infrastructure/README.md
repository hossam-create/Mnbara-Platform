# Mnbara Platform - Infrastructure Configuration

This directory contains all infrastructure configuration for the Mnbara Platform, including Docker, Kubernetes, Terraform, and monitoring setups.

## Directory Structure

```
infrastructure/
├── docker/                  # Docker configurations
│   ├── Dockerfile.template
│   ├── Dockerfile.node.template
│   ├── docker-compose.dev.yml
│   ├── docker-compose.prod.yml
│   └── docker-compose.test.yml
│
├── kubernetes/              # Kubernetes manifests
│   ├── base/               # Base resources
│   │   ├── namespace.yaml
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── configmap.yaml
│   ├── overlays/           # Environment-specific overlays
│   │   ├── dev/
│   │   ├── staging/
│   │   └── prod/
│   └── kustomization.yaml
│
├── terraform/               # Terraform modules
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── providers.tf
│   └── modules/
│       ├── ecs/
│       ├── rds/
│       └── s3/
│
├── monitoring/              # Monitoring & logging
│   ├── prometheus/
│   │   ├── prometheus.yml
│   │   └── alerts.yml
│   ├── grafana/
│   │   ├── dashboards/
│   │   └── grafana.ini
│   └── logging/
│       └── fluent-bit.conf
│
└── README.md
```

## Quick Start

### Docker Development

```bash
# Start development environment
cd infrastructure/docker
docker-compose -f docker-compose.dev.yml up --build

# Run tests
docker-compose -f docker-compose.test.yml up --build
```

### Kubernetes Deployment

```bash
# Install kubectl and kustomize
# Build and apply Kubernetes manifests
kustomize build kubernetes/overlays/dev | kubectl apply -f -
kustomize build kubernetes/overlays/staging | kubectl apply -f -
kustomize build kubernetes/overlays/prod | kubectl apply -f -
```

### Terraform Infrastructure

```bash
# Initialize Terraform
cd infrastructure/terraform
terraform init

# Plan and apply
terraform plan -var-file=environments/dev.tfvars
terraform apply -var-file=environments/dev.tfvars
```

### Monitoring Stack

```bash
# Start Prometheus and Grafana
cd infrastructure/monitoring
docker-compose up -d prometheus grafana

# Access dashboards
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin)
```

## Environment Configuration

### Docker Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables:
- `NODE_VERSION`: Node.js version (default: 20)
- `POSTGRES_USER`: Database username
- `POSTGRES_PASSWORD`: Database password
- `REDIS_PORT`: Redis port
- `API_GATEWAY_PORT`: API Gateway port

### Kubernetes Secrets

Create secrets before deployment:

```bash
kubectl create secret generic db-credentials \
  --from-literal=username=mnbara \
  --from-literal=password=your-password
```

### Terraform Variables

Create environment-specific `.tfvars` files:

```hcl
# environments/dev.tfvars
environment          = "dev"
aws_region          = "us-east-1"
rds_instance_class  = "db.t3.micro"
redis_node_type     = "cache.t3.micro"
```

## Best Practices

### Docker
- Use multi-stage builds for smaller images
- Never store secrets in Dockerfiles
- Use `.dockerignore` to exclude unnecessary files
- Tag images with semantic versioning

### Kubernetes
- Use namespaces for environment isolation
- Set resource requests and limits for all containers
- Configure liveness and readiness probes
- Use ConfigMaps for non-sensitive configuration
- Use Secrets for sensitive data
- Enable pod disruption budgets for production

### Terraform
- Use remote state with locking (S3 + DynamoDB)
- Version control all Terraform files
- Use modules for reusability
- Apply security best practices (encryption, least privilege)
- Use workspaces or separate state files for environments

### Monitoring
- Set up alerts for critical metrics
- Use dashboards for quick insights
- Configure log aggregation
- Set up distributed tracing
- Monitor both infrastructure and application metrics

## Security Considerations

### Container Security
- Run containers as non-root users
- Use read-only filesystem where possible
- Scan images for vulnerabilities
- Use minimal base images

### Kubernetes Security
- Enable RBAC
- Use network policies
- Encrypt secrets at rest
- Regularly update cluster

### Cloud Security
- Use IAM roles with least privilege
- Encrypt data at rest and in transit
- Enable audit logging
- Use VPC security groups

## Troubleshooting

### Docker Issues

```bash
# View logs
docker-compose logs -f

# Rebuild without cache
docker-compose build --no-cache

# Reset environment
docker-compose down -v
```

### Kubernetes Issues

```bash
# Check pod status
kubectl get pods -n mnbara-dev

# View pod logs
kubectl logs -f deployment/api-gateway -n mnbara-dev

# Describe resource
kubectl describe deployment/api-gateway -n mnbara-dev
```

### Terraform Issues

```bash
# View state
terraform state list

# Refresh state
terraform refresh

# Taint resource
terraform taint aws_instance.web
```

## Contributing

1. Create environment-specific overlays instead of modifying base files
2. Document all new variables
3. Follow naming conventions
4. Test changes in dev before staging
5. Use pull requests for reviews

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Terraform Documentation](https://www.terraform.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
