# Mnbara Platform Docker Configuration
# This directory contains Docker configurations for multi-service deployment

## Files Overview

| File | Purpose |
|------|---------|
| Dockerfile.template | Base template for Node.js services |
| Dockerfile.node.template | Alternative Node.js Dockerfile with best practices |
| docker-compose.dev.yml | Development environment with hot reload |
| docker-compose.prod.yml | Production environment configuration |
| docker-compose.test.yml | Testing environment configuration |

## Usage

### Development
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Testing
```bash
docker-compose -f docker-compose.test.yml up --build
```

## Environment Variables

All environment-specific configurations use `${VAR}` placeholders.
Copy `.env.example` to `.env` and configure before running.
