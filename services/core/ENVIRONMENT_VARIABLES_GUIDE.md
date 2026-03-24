# Environment Variables Guide - Core Services

**Task:** 4.1.6 - Preserve existing environment variables  
**Status:** Completed  
**Last Updated:** March 2, 2026

---

## Overview

This document describes how environment variables are preserved and configured for the three core services in the Mnbara Platform monorepo:

1. **auth-service** - Authentication and authorization service
2. **user-service** - User management service
3. **notification-service** - Notification and communication service

All services are located in `services/core/` and follow a consistent environment configuration pattern.

---

## Environment Variable Hierarchy

Environment variables are configured at multiple levels:

### 1. Root Level (`.env.example`)
The root `.env.example` file contains workspace-wide environment variables that apply to all services and applications. This includes:
- General configuration (NODE_ENV, APP_NAME)
- Database configuration (DATABASE_URL, Redis)
- API Gateway configuration
- Authentication & security settings
- Service discovery URLs
- External integrations
- Feature flags

**Location:** `/.env.example`

### 2. Service Level (`.env.example`)
Each service has its own `.env.example` file that documents service-specific environment variables. These override or extend the root configuration.

**Locations:**
- `services/core/auth-service/.env.example`
- `services/core/user-service/.env.example`
- `services/core/notification-service/.env.example`

### 3. Runtime Level (`.env`)
The actual `.env` file (not committed to version control) contains the runtime values for the current environment.

---

## Auth Service Environment Variables

**Service Port:** 3004  
**Database:** PostgreSQL (mnbara_auth)

### Required Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3004 | Service port |
| `NODE_ENV` | development | Environment (development, staging, production) |
| `DATABASE_URL` | postgresql://mnbara:password@localhost:5432/mnbara_auth | PostgreSQL connection string |
| `JWT_SECRET` | (required) | JWT signing secret (min 32 chars) |
| `JWT_EXPIRY` | 24h | JWT token expiration time |
| `REFRESH_TOKEN_SECRET` | (required) | Refresh token signing secret (min 32 chars) |
| `REFRESH_TOKEN_EXPIRY` | 7d | Refresh token expiration time |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | info | Logging level (debug, info, warn, error) |
| `CORS_ORIGIN` | http://localhost:3000 | CORS allowed origins |
| `ALLOWED_ORIGINS` | http://localhost:3000,http://localhost:5173 | Comma-separated allowed origins |
| `BCRYPT_ROUNDS` | 10 | Password hashing rounds |
| `SESSION_SECRET` | (required) | Session secret for cookies |
| `ENCRYPTION_KEY` | (required) | Encryption key for sensitive data |
| `RATE_LIMIT_WINDOW_MS` | 900000 | Rate limit window in milliseconds |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |

### Service Discovery

| Variable | Default | Description |
|----------|---------|-------------|
| `USER_SERVICE_URL` | http://localhost:3002 | User service endpoint |
| `NOTIFICATION_SERVICE_URL` | http://localhost:3003 | Notification service endpoint |
| `API_GATEWAY_URL` | http://localhost:3000 | API gateway endpoint |

---

## User Service Environment Variables

**Service Port:** 3002  
**Database:** PostgreSQL (mnbara_user_service)

### Required Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3002 | Service port |
| `NODE_ENV` | development | Environment (development, staging, production) |
| `DATABASE_URL` | postgresql://mnbara:password@localhost:5432/mnbara_user_service | PostgreSQL connection string |
| `JWT_SECRET` | (required) | JWT signing secret (min 32 chars) |
| `JWT_EXPIRATION` | 24h | JWT token expiration time |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | info | Logging level (debug, info, warn, error) |
| `CORS_ORIGIN` | http://localhost:3000,http://localhost:5173 | CORS allowed origins |
| `ALLOWED_ORIGINS` | http://localhost:3000,http://localhost:5173 | Comma-separated allowed origins |
| `BCRYPT_ROUNDS` | 10 | Password hashing rounds |
| `SESSION_SECRET` | (required) | Session secret for cookies |
| `ENCRYPTION_KEY` | (required) | Encryption key for sensitive data |
| `RATE_LIMIT_WINDOW_MS` | 900000 | Rate limit window in milliseconds |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |
| `MAX_AVATAR_SIZE` | 5242880 | Max avatar upload size in bytes |
| `ALLOWED_AVATAR_FORMATS` | jpg,jpeg,png,webp | Allowed avatar formats |

### Service Discovery

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_SERVICE_URL` | http://localhost:3004 | Auth service endpoint |
| `NOTIFICATION_SERVICE_URL` | http://localhost:3003 | Notification service endpoint |
| `API_GATEWAY_URL` | http://localhost:3000 | API gateway endpoint |

### External Integrations

| Variable | Default | Description |
|----------|---------|-------------|
| `AWS_ACCESS_KEY_ID` | (optional) | AWS access key for S3 |
| `AWS_SECRET_ACCESS_KEY` | (optional) | AWS secret key for S3 |
| `AWS_REGION` | us-east-1 | AWS region |
| `AWS_S3_BUCKET` | mnbara-uploads | S3 bucket name |
| `SENDGRID_API_KEY` | (optional) | SendGrid API key for email |
| `SENDGRID_FROM_EMAIL` | noreply@mnbara.com | SendGrid from email |

---

## Notification Service Environment Variables

**Service Port:** 3003  
**Database:** PostgreSQL (mnbara_notification_service)

### Required Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3003 | Service port |
| `NODE_ENV` | development | Environment (development, staging, production) |
| `DATABASE_URL` | postgresql://mnbara:password@localhost:5432/mnbara_notification_service | PostgreSQL connection string |
| `JWT_SECRET` | (required) | JWT signing secret (min 32 chars) |
| `JWT_EXPIRATION` | 24h | JWT token expiration time |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | info | Logging level (debug, info, warn, error) |
| `CORS_ORIGIN` | http://localhost:3000,http://localhost:5173 | CORS allowed origins |
| `ALLOWED_ORIGINS` | http://localhost:3000,http://localhost:5173 | Comma-separated allowed origins |
| `SESSION_SECRET` | (required) | Session secret for cookies |
| `ENCRYPTION_KEY` | (required) | Encryption key for sensitive data |
| `RATE_LIMIT_WINDOW_MS` | 900000 | Rate limit window in milliseconds |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |
| `NOTIFICATION_RETENTION_DAYS` | 30 | Days to retain notifications |
| `BATCH_NOTIFICATIONS_ENABLED` | true | Enable batch notifications |
| `BATCH_NOTIFICATION_DELAY_MS` | 5000 | Batch notification delay |
| `BATCH_NOTIFICATION_SIZE` | 10 | Batch notification size |

### Service Discovery

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_SERVICE_URL` | http://localhost:3004 | Auth service endpoint |
| `USER_SERVICE_URL` | http://localhost:3002 | User service endpoint |
| `API_GATEWAY_URL` | http://localhost:3000 | API gateway endpoint |

### Email Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SMTP_HOST` | smtp.gmail.com | SMTP server host |
| `SMTP_PORT` | 587 | SMTP server port |
| `SMTP_USER` | (optional) | SMTP username |
| `SMTP_PASSWORD` | (optional) | SMTP password |
| `SMTP_FROM` | noreply@mnbara.com | From email address |
| `SMTP_FROM_NAME` | Mnbara Platform | From name |
| `SENDGRID_API_KEY` | (optional) | SendGrid API key (alternative to SMTP) |
| `SENDGRID_FROM_EMAIL` | noreply@mnbara.com | SendGrid from email |
| `SENDGRID_FROM_NAME` | Mnbara Platform | SendGrid from name |

### SMS Configuration (Twilio)

| Variable | Default | Description |
|----------|---------|-------------|
| `TWILIO_ACCOUNT_SID` | (optional) | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | (optional) | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | (optional) | Twilio phone number |

### Push Notifications (Firebase)

| Variable | Default | Description |
|----------|---------|-------------|
| `FIREBASE_PROJECT_ID` | (optional) | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | (optional) | Firebase private key |
| `FIREBASE_CLIENT_EMAIL` | (optional) | Firebase client email |

### WebSocket Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `WEBSOCKET_ENABLED` | true | Enable WebSocket support |
| `WEBSOCKET_PORT` | 3003 | WebSocket port |
| `WEBSOCKET_PATH` | /socket.io | WebSocket path |

### Feature Flags

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_EMAIL_NOTIFICATIONS` | true | Enable email notifications |
| `ENABLE_SMS_NOTIFICATIONS` | false | Enable SMS notifications |
| `ENABLE_PUSH_NOTIFICATIONS` | false | Enable push notifications |
| `ENABLE_WEBSOCKET_NOTIFICATIONS` | true | Enable WebSocket notifications |

### Message Queue (RabbitMQ)

| Variable | Default | Description |
|----------|---------|-------------|
| `RABBITMQ_URL` | amqp://guest:guest@localhost:5672 | RabbitMQ connection URL |
| `RABBITMQ_HOST` | localhost | RabbitMQ host |
| `RABBITMQ_PORT` | 5672 | RabbitMQ port |
| `RABBITMQ_USER` | guest | RabbitMQ username |
| `RABBITMQ_PASSWORD` | guest | RabbitMQ password |
| `RABBITMQ_VHOST` | / | RabbitMQ virtual host |

---

## Environment Setup Instructions

### Development Environment

1. **Copy the root .env.example to .env:**
   ```bash
   cp .env.example .env
   ```

2. **Update the root .env with your development values:**
   ```bash
   # Edit .env and update:
   - DATABASE_URL (PostgreSQL connection)
   - JWT_SECRET (generate a random string)
   - STRIPE_SECRET_KEY (if using Stripe)
   - etc.
   ```

3. **Copy service-specific .env.example files:**
   ```bash
   cp services/core/auth-service/.env.example services/core/auth-service/.env
   cp services/core/user-service/.env.example services/core/user-service/.env
   cp services/core/notification-service/.env.example services/core/notification-service/.env
   ```

4. **Update service-specific .env files:**
   Each service's .env file should contain service-specific overrides and additional configuration.

### Production Environment

1. **Use environment-specific .env files:**
   ```bash
   .env.production
   .env.staging
   .env.development
   ```

2. **Use secure secret management:**
   - Use AWS Secrets Manager, HashiCorp Vault, or similar
   - Never commit actual secrets to version control
   - Rotate secrets regularly

3. **Use environment variables in deployment:**
   - Docker: Pass via `--env-file` or `-e` flags
   - Kubernetes: Use ConfigMaps and Secrets
   - CI/CD: Use GitHub Secrets or similar

---

## Security Best Practices

### 1. Secret Management
- Never commit `.env` files to version control
- Use `.env.example` to document required variables
- Rotate secrets regularly in production
- Use strong, unique secrets (min 32 characters for JWT/encryption keys)

### 2. Environment-Specific Configuration
- Use different secrets for each environment
- Never use production secrets in development
- Use feature flags to control behavior per environment

### 3. Access Control
- Limit who can access production secrets
- Use role-based access control (RBAC)
- Audit secret access and changes

### 4. Encryption
- Encrypt sensitive data at rest
- Use HTTPS/TLS for all communications
- Use secure algorithms (AES-256-GCM for encryption)

---

## Validation Checklist

Before deploying services, verify:

- [ ] All required environment variables are set
- [ ] Database URLs are correct and accessible
- [ ] JWT secrets are strong (min 32 characters)
- [ ] CORS origins are properly configured
- [ ] Service discovery URLs are correct
- [ ] External integrations are configured (if needed)
- [ ] Feature flags are set appropriately
- [ ] Logging level is appropriate for environment
- [ ] Rate limiting is configured
- [ ] Encryption keys are set

---

## Troubleshooting

### Service Won't Start
1. Check that all required environment variables are set
2. Verify DATABASE_URL is correct and database is accessible
3. Check logs for specific error messages
4. Verify port is not already in use

### Database Connection Errors
1. Verify DATABASE_URL format is correct
2. Check that PostgreSQL is running
3. Verify database user has correct permissions
4. Check network connectivity to database

### JWT/Authentication Errors
1. Verify JWT_SECRET is set and consistent
2. Check that JWT_EXPIRY format is correct (e.g., "24h")
3. Verify CORS_ORIGIN includes your frontend URL
4. Check that tokens are being sent correctly

### Service Discovery Errors
1. Verify service URLs are correct
2. Check that services are running on specified ports
3. Verify network connectivity between services
4. Check firewall rules

---

## References

- [Root Environment Configuration](.env.example)
- [Auth Service README](auth-service/README.md)
- [User Service README](user-service/README.md)
- [Notification Service README](notification-service/README.md)
- [Mnbara Platform Documentation](../../docs/)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-02 | Initial environment variables documentation |

---

**Document Status:** Complete  
**Last Updated:** March 2, 2026  
**Maintained By:** Platform Team
