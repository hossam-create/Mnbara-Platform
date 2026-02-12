# Mnbara Platform API Gateway

## Overview

The API Gateway is the single entry point for all client requests in the Mnbara Platform. It handles request routing, authentication, rate limiting, logging, and error handling across all backend microservices.

## Features

- **Request Routing**: Forward requests to appropriate backend services
- **JWT Authentication**: Verify tokens with auth-service
- **Rate Limiting**: Prevent abuse and protect backend services
- **Request Logging**: Track all incoming requests
- **Error Handling**: Consistent error responses across all services
- **CORS Support**: Enable cross-origin requests for frontend apps
- **Health Check**: Monitor gateway health at `/health`

## Architecture

```
                    ┌─────────────────┐
                    │   API Gateway   │
                    │   (Express)     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  Auth Service  │  │  User Service │  │ Order Service │
└───────────────┘  └───────────────┘  └───────────────┘
```

## Services

| Route Prefix | Service | Port |
|--------------|---------|------|
| `/api/auth` | auth-service | 3001 |
| `/api/users` | user-service | 3002 |
| `/api/orders` | order-service | 3003 |
| `/api/payments` | payment-service | 3004 |
| `/api/delivery` | delivery-service | 3005 |

## Configuration

Configure the gateway using environment variables:

```env
# Server
PORT=3000
NODE_ENV=development

# Auth Service
AUTH_SERVICE_URL=http://auth-service:3001

# User Service
USER_SERVICE_URL=http://user-service:3002

# Order Service
ORDER_SERVICE_URL=http://order-service:3003

# Payment Service
PAYMENT_SERVICE_URL=http://payment-service:3004

# Delivery Service
DELIVERY_SERVICE_URL=http://delivery-service:3005

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# JWT
JWT_SECRET=your-jwt-secret
JWT_ALGORITHM=RS256

# Redis (for distributed rate limiting)
REDIS_URL=redis://redis:6379

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development
npm run dev

# Run in production
npm start
```

## Docker

```bash
# Build image
docker build -t api-gateway .

# Run container
docker run -p 3000:3000 api-gateway
```

## API Endpoints

### Health Check
- `GET /health` - Gateway health status

### Auth Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/profile` - Get user profile (auth required)

### User Routes
- `GET /api/users` - List users (auth required)
- `GET /api/users/:id` - Get user by ID (auth required)
- `PUT /api/users/:id` - Update user (auth required)
- `DELETE /api/users/:id` - Delete user (auth required)

### Order Routes
- `POST /api/orders` - Create order (auth required)
- `GET /api/orders` - List orders (auth required)
- `GET /api/orders/:id` - Get order by ID (auth required)
- `PUT /api/orders/:id` - Update order (auth required)
- `DELETE /api/orders/:id` - Cancel order (auth required)

### Payment Routes
- `POST /api/payments` - Create payment (auth required)
- `GET /api/payments` - List payments (auth required)
- `GET /api/payments/:id` - Get payment by ID (auth required)
- `POST /api/payments/:id/refund` - Refund payment (auth required)

### Delivery Routes
- `POST /api/delivery` - Create delivery (auth required)
- `GET /api/delivery` - List deliveries (auth required)
- `GET /api/delivery/:id` - Get delivery by ID (auth required)
- `PUT /api/delivery/:id` - Update delivery status (auth required)

## Middleware

### Auth Middleware
Validates JWT tokens with the auth service. Extracts user information and adds it to the request.

### Rate Limit Middleware
Uses Redis-backed rate limiting to prevent abuse. Configurable window and max requests.

### Logging Middleware
Logs all incoming requests including method, path, headers, and body (with sensitive data redacted).

### Error Handling Middleware
Catches all errors and returns consistent JSON responses.

## Development

```bash
# Run with hot reload
npm run dev

# Run tests
npm test

# Run linting
npm run lint
```

## License

MIT
