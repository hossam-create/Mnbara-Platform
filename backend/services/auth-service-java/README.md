# Mnbara Auth Service - eBay-Level Authentication

**Enterprise-grade authentication service built with Java/Spring Boot**

## 🎯 Overview

This authentication service provides eBay-level security features including:

- **Multi-Factor Authentication (MFA)** with TOTP
- **OAuth 2.0** social login (Google, Facebook, Apple)
- **JWT** token management with refresh tokens
- **Role-Based Access Control (RBAC)** and **Attribute-Based Access Control (ABAC)**
- **Account security** with lockout protection
- **Session management** with Redis
- **Email verification** and password reset
- **Enterprise monitoring** and logging

## 🏗️ Architecture

### Technology Stack
- **Java 17** - Modern Java features
- **Spring Boot 3.2** - Enterprise framework
- **Spring Security** - Authentication and authorization
- **PostgreSQL** - Primary database
- **Redis** - Session management and caching
- **JWT** - Stateless authentication
- **Maven** - Dependency management

### Security Features
- **Password encryption** with BCrypt (strength 12)
- **JWT tokens** with blacklisting support
- **Rate limiting** for login attempts
- **Account lockout** after failed attempts
- **CORS protection** with configurable origins
- **Security headers** (HSTS, X-Frame-Options, etc.)
- **Input validation** with Bean Validation

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Maven 3.6+
- PostgreSQL 15+
- Redis 7+

### Local Development

1. **Clone and navigate to service:**
   ```bash
   cd backend/services/auth-service-java
   ```

2. **Configure database:**
   ```bash
   # Create PostgreSQL database
   createdb auth_db
   
   # Run migrations (handled by Spring Boot)
   ```

3. **Set environment variables:**
   ```bash
   export DB_HOST=localhost
   export DB_PORT=5432
   export DB_NAME=auth_db
   export DB_USER=mnbara
   export DB_PASSWORD=your_password
   export REDIS_HOST=localhost
   export REDIS_PORT=6379
   export JWT_SECRET=your-256-bit-secret-key
   export JWT_REFRESH_SECRET=your-256-bit-refresh-secret-key
   ```

4. **Run the service:**
   ```bash
   mvn spring-boot:run
   ```

5. **Verify service is running:**
   ```bash
   curl http://localhost:3001/api/auth/health
   ```

### Docker Development

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up auth-service-java
   ```

2. **Check logs:**
   ```bash
   docker-compose logs -f auth-service-java
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "termsAccepted": true,
  "privacyPolicyAccepted": true
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePass123!",
  "deviceId": "device-uuid",
  "rememberMe": true
}
```

#### MFA Verification
```http
POST /api/auth/verify-mfa
Content-Type: application/json

{
  "userId": "123",
  "totpCode": "123456",
  "deviceId": "device-uuid",
  "trustDevice": false
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "refreshToken": "your-refresh-token",
  "logoutAllDevices": false
}
```

### Profile Management

#### Get User Profile
```http
GET /api/auth/profile
Authorization: Bearer your-access-token
```

#### Change Password
```http
POST /api/auth/change-password
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

### MFA Management

#### Enable MFA
```http
POST /api/auth/enable-mfa
Authorization: Bearer your-access-token
```

#### Confirm MFA Setup
```http
POST /api/auth/confirm-mfa
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "totpCode": "123456"
}
```

#### Disable MFA
```http
POST /api/auth/disable-mfa
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "totpCode": "123456",
  "password": "YourPassword123!"
}
```

## 🔧 Configuration

### Application Properties

Key configuration options in `application.yml`:

```yaml
# Database Configuration
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/auth_db
    username: mnbara
    password: your_password
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5

# JWT Configuration
jwt:
  secret: your-256-bit-secret-key
  refresh-secret: your-256-bit-refresh-secret-key
  expiration: 3600000  # 1 hour
  refresh-expiration: 604800000  # 7 days

# MFA Configuration
mfa:
  enabled: true
  issuer: Mnbara Platform
  totp:
    window: 1
    period: 30

# Rate Limiting
rate-limit:
  login:
    requests: 5
    window: 300  # 5 minutes
  registration:
    requests: 3
    window: 3600  # 1 hour
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | auth_db |
| `DB_USER` | Database user | mnbara |
| `DB_PASSWORD` | Database password | - |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_REFRESH_SECRET` | Refresh token secret | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `FACEBOOK_CLIENT_ID` | Facebook OAuth client ID | - |
| `APPLE_CLIENT_ID` | Apple OAuth client ID | - |

## 🧪 Testing

### Unit Tests
```bash
mvn test
```

### Integration Tests
```bash
mvn test -Dtest=**/*IntegrationTest
```

### Test Coverage
```bash
mvn jacoco:report
```

### API Testing with curl

```bash
# Health check
curl http://localhost:3001/api/auth/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User",
    "termsAccepted": true,
    "privacyPolicyAccepted": true
  }'

# Login user
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPass123!"
  }'
```

## 📊 Monitoring

### Health Checks
- **Application health:** `/api/auth/health`
- **Actuator health:** `/actuator/health`
- **Database connectivity:** Included in health checks
- **Redis connectivity:** Included in health checks

### Metrics
- **Prometheus metrics:** `/actuator/prometheus`
- **Custom metrics:** Login attempts, registration counts, MFA usage
- **Performance metrics:** Response times, error rates

### Logging
- **Structured logging** with JSON format
- **Security events** logging
- **Performance logging** for slow queries
- **Error tracking** with stack traces

## 🔒 Security

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Account Security
- **Account lockout** after 5 failed login attempts
- **Lockout duration** of 15 minutes
- **Password expiration** after 90 days
- **Session timeout** after 1 hour of inactivity

### Token Security
- **JWT tokens** with short expiration (1 hour)
- **Refresh tokens** with longer expiration (7 days)
- **Token blacklisting** on logout
- **Device tracking** for security monitoring

## 🚀 Deployment

### Production Configuration

1. **Environment-specific properties:**
   ```yaml
   spring:
     profiles:
       active: production
   
   logging:
     level:
       com.mnbara.auth: INFO
       org.springframework.security: WARN
   ```

2. **Security hardening:**
   - Use strong JWT secrets (256-bit)
   - Enable HTTPS only
   - Configure proper CORS origins
   - Set up rate limiting
   - Enable security headers

3. **Database optimization:**
   - Connection pooling
   - Read replicas for scaling
   - Database monitoring
   - Regular backups

### Docker Production

```dockerfile
# Use production-optimized image
FROM eclipse-temurin:17-jre-alpine

# Security: non-root user
USER mnbara

# Health checks
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:3001/api/auth/health || exit 1

# JVM optimization
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"
```

## 📈 Performance

### Benchmarks
- **Login requests:** >1000 RPS
- **Token validation:** >5000 RPS
- **Database queries:** <100ms (p95)
- **Memory usage:** <512MB under load

### Optimization
- **Connection pooling** for database
- **Redis caching** for sessions
- **JWT stateless** authentication
- **Async processing** for emails

## 🤝 Contributing

1. Follow Java coding standards
2. Write comprehensive tests
3. Update documentation
4. Security review required for auth changes

## 📄 License

Proprietary - Mnbara Platform

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** 2025-12-22