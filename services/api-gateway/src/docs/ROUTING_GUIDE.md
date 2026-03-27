# API Gateway Routing Guide

## Overview

The API Gateway implements a centralized, configuration-driven routing system that manages all service-to-service communication in the Mnbara Platform. This guide explains how routing works and how to manage it.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Request                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              API Gateway (Express)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. Request Validation                               │  │
│  │  2. Authentication Check (if required)               │  │
│  │  3. Rate Limiting (based on policy)                  │  │
│  │  4. Routing Configuration Lookup                     │  │
│  │  5. Circuit Breaker Check                            │  │
│  │  6. Request Transformation                           │  │
│  │  7. Proxy to Backend Service                         │  │
│  │  8. Response Transformation                          │  │
│  │  9. Response Logging                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────┐      ┌─────────┐      ┌─────────┐
   │ Auth    │      │ User    │      │ Payment │
   │ Service │      │ Service │      │ Service │
   └─────────┘      └─────────┘      └─────────┘
```

## Routing Configuration

All routes are defined in `src/config/routing.config.ts`. Each route has:

### Route Properties

```typescript
interface RouteConfig {
  prefix: string;              // Route prefix (e.g., '/auth')
  service: string;             // Target service name
  requiresAuth: boolean;       // Authentication required
  rateLimitPolicy: string;     // Rate limit policy
  circuitBreaker: {            // Circuit breaker settings
    enabled: boolean;
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
  };
  timeout: number;             // Request timeout (ms)
  retry: {                      // Retry policy
    enabled: boolean;
    maxAttempts: number;
    backoffMs: number;
  };
  logging: {                    // Logging settings
    enabled: boolean;
    logBody: boolean;
    redactFields: string[];
  };
  cors: {                       // CORS settings
    enabled: boolean;
    credentials: boolean;
  };
  description: string;         // Route description
}
```

## Available Routes

### Core Services

#### Authentication (`/auth`)
- **Service**: auth-service
- **Auth Required**: No
- **Rate Limit**: Public (100 req/15min)
- **Timeout**: 10s
- **Endpoints**:
  - `POST /api/auth/register` - Register new user
  - `POST /api/auth/login` - Login user
  - `POST /api/auth/logout` - Logout user
  - `POST /api/auth/refresh` - Refresh token
  - `GET /api/auth/profile` - Get user profile (auth required)

#### Users (`/users`)
- **Service**: user-service
- **Auth Required**: Yes
- **Rate Limit**: Authenticated (500 req/15min)
- **Timeout**: 10s
- **Endpoints**:
  - `GET /api/users` - List users
  - `GET /api/users/:id` - Get user by ID
  - `PUT /api/users/:id` - Update user
  - `DELETE /api/users/:id` - Delete user

#### Notifications (`/notifications`)
- **Service**: notification-service
- **Auth Required**: Yes
- **Rate Limit**: Authenticated (500 req/15min)
- **Timeout**: 10s

### Marketplace Services

#### Products (`/products`)
- **Service**: marketplace-service
- **Auth Required**: No
- **Rate Limit**: Public (100 req/15min)
- **Timeout**: 10s

#### Orders (`/orders`)
- **Service**: marketplace-service
- **Auth Required**: Yes
- **Rate Limit**: Authenticated (500 req/15min)
- **Timeout**: 15s

#### Cart (`/cart`)
- **Service**: marketplace-service
- **Auth Required**: Yes
- **Rate Limit**: Authenticated (500 req/15min)
- **Timeout**: 10s

### Financial Services

#### Payments (`/payments`)
- **Service**: payment-service
- **Auth Required**: Yes
- **Rate Limit**: Strict (10 req/1min)
- **Timeout**: 30s
- **Sensitive Fields Redacted**: cardNumber, cvv, pin, token

#### Wallet (`/wallet`)
- **Service**: payment-service
- **Auth Required**: Yes
- **Rate Limit**: Authenticated (500 req/15min)
- **Timeout**: 10s

#### Escrow (`/escrow`)
- **Service**: payment-service
- **Auth Required**: Yes
- **Rate Limit**: Strict (10 req/1min)
- **Timeout**: 15s

#### Settlement (`/settlement`)
- **Service**: payment-service
- **Auth Required**: Yes
- **Rate Limit**: Authenticated (500 req/15min)
- **Timeout**: 20s

### Delivery Services

#### Delivery (`/delivery`)
- **Service**: delivery-service
- **Auth Required**: Yes
- **Rate Limit**: Authenticated (500 req/15min)
- **Timeout**: 10s

#### Trips (`/trips`)
- **Service**: delivery-service
- **Auth Required**: Yes
- **Rate Limit**: Authenticated (500 req/15min)
- **Timeout**: 10s

#### Matching (`/matching`)
- **Service**: delivery-service
- **Auth Required**: Yes
- **Rate Limit**: Authenticated (500 req/15min)
- **Timeout**: 15s

## Rate Limiting Policies

### Public Policy
- **Window**: 15 minutes
- **Max Requests**: 100
- **Use Case**: Public endpoints (login, register, product search)

### Authenticated Policy
- **Window**: 15 minutes
- **Max Requests**: 500
- **Use Case**: Most authenticated endpoints

### Strict Policy
- **Window**: 1 minute
- **Max Requests**: 10
- **Use Case**: Sensitive operations (payments, escrow)

### None Policy
- **Window**: N/A
- **Max Requests**: Unlimited
- **Use Case**: Internal service-to-service communication

## Request Flow

### 1. Request Arrives at Gateway

```
GET /api/users/123
Authorization: Bearer <token>
X-Request-ID: gw-1234567890-abc123
```

### 2. Routing Configuration Lookup

The gateway looks up the route configuration for `/users`:

```typescript
{
  prefix: '/users',
  service: 'user',
  requiresAuth: true,
  rateLimitPolicy: 'authenticated',
  timeout: 10000,
  // ... other settings
}
```

### 3. Authentication Check

If `requiresAuth` is true, the gateway validates the JWT token with the auth service.

### 4. Rate Limiting

The gateway checks if the client has exceeded the rate limit for this route.

### 5. Circuit Breaker Check

The gateway checks if the target service is healthy using the circuit breaker.

### 6. Request Transformation

The gateway transforms the request:
- Extracts path after prefix: `/123`
- Constructs target path: `/api/users/123`
- Adds headers:
  - `X-Forwarded-For`: Client IP
  - `X-Request-ID`: Request ID
  - `X-User-ID`: User ID (if authenticated)
  - `X-User-Email`: User email (if authenticated)

### 7. Proxy Request

The gateway forwards the request to the target service:

```
GET http://user-service:3002/api/users/123
Authorization: Bearer <token>
X-Forwarded-For: 192.168.1.1
X-Request-ID: gw-1234567890-abc123
X-User-ID: user-456
```

### 8. Response Handling

The gateway receives the response and:
- Copies status code
- Forwards relevant headers
- Logs the response
- Returns to client

## Adding a New Route

### Step 1: Add Route Configuration

Edit `src/config/routing.config.ts`:

```typescript
'/new-service': {
  prefix: '/new-service',
  service: 'new-service',
  requiresAuth: true,
  rateLimitPolicy: 'authenticated',
  circuitBreaker: {
    enabled: true,
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 30000,
  },
  timeout: 10000,
  retry: {
    enabled: true,
    maxAttempts: 2,
    backoffMs: 100,
  },
  logging: {
    enabled: true,
    logBody: true,
    redactFields: [],
  },
  cors: {
    enabled: true,
    credentials: true,
  },
  description: 'New service description',
}
```

### Step 2: Register Service URL

Edit `src/config/index.ts`:

```typescript
export const config: GatewayConfig = {
  // ... existing config
  newServiceUrl: process.env.NEW_SERVICE_URL || 'http://localhost:3009',
};

export const serviceUrls = {
  // ... existing services
  newService: config.newServiceUrl,
};
```

### Step 3: Add Environment Variable

Edit `.env`:

```env
NEW_SERVICE_URL=http://new-service:3009
```

### Step 4: Register Service in Registry

The service registry automatically discovers services from the configuration.

## Service Discovery

The API Gateway includes a service registry that:

1. **Maintains Service Metadata**: Tracks all registered services
2. **Performs Health Checks**: Periodically checks service health
3. **Manages Service Status**: Tracks which services are healthy/unhealthy
4. **Provides Service Information**: Returns service details on demand

### Health Check Endpoint

```
GET /api/health/services
```

Response:

```json
{
  "status": "healthy",
  "timestamp": "2026-03-22T10:30:00Z",
  "services": {
    "auth": true,
    "user": true,
    "payment": false,
    "delivery": true
  }
}
```

### Service Registry API

```typescript
// Get service info
const service = serviceRegistry.getService('auth');

// Get all services
const services = serviceRegistry.getAllServices();

// Get healthy services
const healthy = serviceRegistry.getHealthyServices();

// Check service health
await serviceRegistry.checkServiceHealth('auth');

// Start periodic health checks
serviceRegistry.startHealthChecks(30000); // Every 30 seconds

// Get registry status
const status = serviceRegistry.getStatus();
```

## Circuit Breaker Pattern

The API Gateway uses circuit breakers to prevent cascading failures:

### States

1. **Closed**: Normal operation, requests pass through
2. **Open**: Service is failing, requests are rejected
3. **Half-Open**: Testing if service has recovered

### Configuration

```typescript
circuitBreaker: {
  enabled: true,
  failureThreshold: 5,      // Open after 5 failures
  successThreshold: 2,      // Close after 2 successes
  timeout: 30000,           // Half-open timeout (30s)
}
```

### Behavior

```
Closed ──(5 failures)──> Open ──(30s timeout)──> Half-Open
  ▲                                                   │
  └──────────(2 successes)──────────────────────────┘
```

## Retry Policy

Routes can be configured with automatic retry logic:

```typescript
retry: {
  enabled: true,
  maxAttempts: 3,
  backoffMs: 100,  // Exponential backoff
}
```

### Retry Logic

1. First attempt fails
2. Wait 100ms
3. Second attempt fails
4. Wait 200ms (exponential)
5. Third attempt succeeds
6. Return response

## Request/Response Logging

Each route can be configured with logging:

```typescript
logging: {
  enabled: true,
  logBody: true,
  redactFields: ['password', 'token', 'secret'],
}
```

### Log Output

```json
{
  "level": "debug",
  "timestamp": "2026-03-22T10:30:00Z",
  "message": "Routing request",
  "method": "POST",
  "path": "/api/auth/login",
  "service": "auth",
  "targetPath": "/api/auth/login",
  "body": {
    "email": "user@example.com",
    "password": "[REDACTED]"
  }
}
```

## Error Handling

### Authentication Errors

```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### Rate Limit Errors

```json
{
  "status": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 5 minutes."
}
```

### Service Unavailable

```json
{
  "status": 503,
  "error": "Service Unavailable",
  "message": "Target service is currently unavailable"
}
```

### Timeout

```json
{
  "status": 504,
  "error": "Gateway Timeout",
  "message": "Request to target service timed out"
}
```

## Monitoring

### Health Check Endpoint

```
GET /health
```

Returns comprehensive gateway health including:
- Gateway status
- Service health
- Circuit breaker status
- Rate limiter status
- WebSocket connections
- Kafka consumer status

### Service Health Endpoint

```
GET /api/health/services
```

Returns health status of all backend services.

### Metrics

The gateway exposes metrics for:
- Request count by route
- Response time by route
- Error rate by route
- Circuit breaker state changes
- Rate limit violations

## Best Practices

### 1. Use Appropriate Rate Limits

- Public endpoints: `public` policy
- Authenticated endpoints: `authenticated` policy
- Sensitive operations: `strict` policy

### 2. Enable Circuit Breakers

Always enable circuit breakers for external service calls to prevent cascading failures.

### 3. Set Reasonable Timeouts

- Fast endpoints: 5-10 seconds
- Slow endpoints: 15-30 seconds
- Never set timeout to 0 (infinite)

### 4. Redact Sensitive Data

Always redact sensitive fields in logs:
- Passwords
- Tokens
- Credit card numbers
- API keys

### 5. Monitor Service Health

Regularly check service health and investigate failures:

```bash
curl http://localhost:3000/api/health/services
```

### 6. Use Request IDs

Always include `X-Request-ID` header for tracing:

```
X-Request-ID: gw-1234567890-abc123
```

## Troubleshooting

### Service Not Responding

1. Check service health: `GET /api/health/services`
2. Check service logs
3. Verify service URL in configuration
4. Check network connectivity

### High Latency

1. Check circuit breaker status
2. Check service load
3. Review timeout settings
4. Check network latency

### Rate Limit Errors

1. Check rate limit policy
2. Verify client is not making too many requests
3. Consider increasing rate limit for legitimate high-volume clients

### Authentication Failures

1. Verify JWT token is valid
2. Check token expiration
3. Verify auth service is healthy
4. Check authorization headers

## Configuration Reference

### Environment Variables

```env
# Gateway
PORT=3000
NODE_ENV=development

# Services
AUTH_SERVICE_URL=http://auth-service:3001
USER_SERVICE_URL=http://user-service:3002
ORDER_SERVICE_URL=http://order-service:3003
PAYMENT_SERVICE_URL=http://payment-service:3004
DELIVERY_SERVICE_URL=http://delivery-service:3005

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# JWT
JWT_SECRET=your-jwt-secret
JWT_ALGORITHM=HS256

# Redis
REDIS_URL=redis://redis:6379

# CORS
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
```

## Related Documentation

- [API Gateway README](./README.md)
- [Authentication Middleware](./AUTHENTICATION.md)
- [Rate Limiting](./RATE_LIMITING.md)
- [Circuit Breaker Pattern](./CIRCUIT_BREAKER.md)
