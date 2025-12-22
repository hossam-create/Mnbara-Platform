# MNBARA API Gateway

Central entry point for all MNBARA platform microservices. Provides routing, authentication, rate limiting, and request validation.

## Features

- **Route Management**: Centralized routing to 12+ microservices
- **Authentication**: JWT-based authentication with role-based access control
- **Rate Limiting**: Per-IP and per-user rate limiting with Redis backing
- **Request Validation**: Schema-based validation using Zod
- **Correlation IDs**: Request tracing across microservices
- **Structured Logging**: JSON logging with correlation IDs
- **Health Checks**: Service health monitoring

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway (8080)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   CORS      │  │   Helmet    │  │  Rate Limit │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Correlation │  │    Auth     │  │  Validation │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────────────────────────────────────────┐           │
│  │              Proxy Middleware                    │           │
│  └─────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Auth Service  │   │Listing Service│   │Auction Service│
│    (3001)     │   │    (3002)     │   │    (3003)     │
└───────────────┘   └───────────────┘   └───────────────┘
```

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Docker

```bash
# Build and run with docker-compose
cd infrastructure/docker
docker-compose up api-gateway
```

## Configuration

Environment variables (see `.env.example`):

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Gateway port | `8080` |
| `JWT_SECRET` | JWT signing secret | Required |
| `REDIS_URL` | Redis URL for rate limiting | `redis://localhost:6379` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |
| `LOG_LEVEL` | Logging level | `info` |

### Service URLs

Each microservice URL is configurable:

- `AUTH_SERVICE_URL` - Auth service (default: `http://auth-service:3001`)
- `LISTING_SERVICE_URL` - Listing service (default: `http://listing-service:3002`)
- `AUCTION_SERVICE_URL` - Auction service (default: `http://auction-service:3003`)
- `PAYMENT_SERVICE_URL` - Payment service (default: `http://payment-service:3004`)
- ... (see `.env.example` for full list)

## API Routes

### Public Routes (No Auth Required)

| Method | Path | Service | Description |
|--------|------|---------|-------------|
| POST | `/api/v1/auth/register` | auth-service | User registration |
| POST | `/api/v1/auth/login` | auth-service | User login |
| POST | `/api/v1/auth/refresh` | auth-service | Token refresh |
| GET | `/api/v1/listings` | listing-service | Browse listings |
| GET | `/api/v1/products` | listing-service | Browse products |
| GET | `/api/v1/categories` | listing-service | Get categories |
| GET | `/api/v1/search` | listing-service | Search products |
| GET | `/api/v1/auctions` | auction-service | Browse auctions |
| POST | `/api/v1/webhooks/*` | payment-service | Payment webhooks |

### Protected Routes (Auth Required)

| Method | Path | Service | Roles | Description |
|--------|------|---------|-------|-------------|
| * | `/api/v1/users` | auth-service | any | User management |
| * | `/api/v1/orders` | orders-service | any | Order management |
| * | `/api/v1/cart` | orders-service | any | Shopping cart |
| * | `/api/v1/bids` | auction-service | any | Place bids |
| * | `/api/v1/payments` | payment-service | any | Payments |
| * | `/api/v1/wallets` | payment-service | any | Wallet management |
| * | `/api/v1/trips` | trips-service | any | Trip management |
| * | `/api/v1/traveler` | trips-service | traveler, admin | Traveler features |
| * | `/api/v1/admin` | admin-service | admin | Admin features |
| * | `/api/v1/disputes` | admin-service | admin | Dispute resolution |

## Rate Limiting

Rate limits are configured per route:

| Route | Limit | Window |
|-------|-------|--------|
| `/api/v1/auth/register` | 5 requests | 1 minute |
| `/api/v1/auth/login` | 10 requests | 1 minute |
| `/api/v1/bids` | 30 requests | 1 minute |
| Default | 100 requests | 1 minute |
| Global | 1000 requests | 1 minute |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Health Checks

### Basic Health
```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "api-gateway",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

### Detailed Health
```bash
GET /health/detailed
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "services": [
    {
      "name": "auth-service",
      "status": "healthy",
      "responseTime": 45,
      "lastChecked": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Testing

```bash
# Run all tests
npm test

# Run integration tests
npm run test:integration

# Run with coverage
npm test -- --coverage
```

## Logging

Structured JSON logging with correlation IDs:

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "info",
  "correlationId": "abc-123",
  "requestId": "def-456",
  "method": "GET",
  "path": "/api/v1/listings",
  "statusCode": 200,
  "responseTime": 150,
  "message": "Request completed"
}
```

## Security

- JWT authentication with configurable secret
- Helmet.js for security headers
- CORS with configurable origins
- Rate limiting to prevent abuse
- Request sanitization
- Content-Type validation
