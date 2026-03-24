# Escrow Service

Secure transaction escrow management service for the Mnbara Platform. Handles escrow account creation, fund holding, release, refunds, and dispute resolution.

## Overview

The Escrow Service provides a robust system for managing escrow accounts in secure transactions. It ensures that funds are held safely during transactions and released only when conditions are met or disputes are resolved.

## Features

- **Escrow Account Management** - Create and manage escrow accounts for transactions
- **Fund Holding** - Securely hold funds during transaction lifecycle
- **Release & Refund** - Release funds to seller or refund to buyer
- **Dispute Resolution** - Handle disputes with resolution tracking
- **Audit Logging** - Complete audit trail for compliance
- **Timeline Tracking** - Track all events in escrow lifecycle

## Technology Stack

- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **API Documentation:** Swagger/OpenAPI
- **Security:** Helmet, JWT authentication

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 14+

### Installation

```bash
cd services/financial/escrow-service
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Update the following variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `PORT` - Service port (default: 3007)

### Database Setup

Run Prisma migrations:

```bash
npm run migrate
```

### Development

Start the service in development mode:

```bash
npm run dev
```

The service will be available at `http://localhost:3007`

API documentation: `http://localhost:3007/api/docs`

### Production Build

```bash
npm run build
npm run start:prod
```

## API Endpoints

### Create Escrow

```http
POST /api/v1/escrow
Content-Type: application/json

{
  "transactionId": "txn-123",
  "buyerId": "buyer-456",
  "sellerId": "seller-789",
  "amount": 1000,
  "currency": "USD",
  "description": "Purchase of item XYZ",
  "releaseConditions": "Upon delivery confirmation"
}
```

### Get Escrow

```http
GET /api/v1/escrow/:id
```

### Get Escrow by Transaction

```http
GET /api/v1/escrow/transaction/:transactionId
```

### Release Escrow

```http
PATCH /api/v1/escrow/:id/release
Content-Type: application/json

{
  "reason": "Buyer confirmed delivery"
}
```

### Refund Escrow

```http
PATCH /api/v1/escrow/:id/refund
Content-Type: application/json

{
  "reason": "Transaction cancelled by buyer"
}
```

### Initiate Dispute

```http
POST /api/v1/escrow/:id/dispute
Content-Type: application/json

{
  "initiatedBy": "buyer-456",
  "dispute": {
    "reason": "Item not as described",
    "description": "Received damaged item",
    "evidence": "https://example.com/photo.jpg"
  }
}
```

### Resolve Dispute

```http
PATCH /api/v1/escrow/dispute/:disputeId/resolve
Content-Type: application/json

{
  "resolution": "Full refund to buyer",
  "resolutionAmount": 0,
  "resolvedBy": "admin-123"
}
```

### List Escrows

```http
GET /api/v1/escrow?buyerId=buyer-456&status=HELD
```

## Database Schema

### EscrowAccount

Represents an escrow account for a transaction.

```sql
CREATE TABLE "EscrowAccount" (
  id STRING PRIMARY KEY,
  transactionId STRING UNIQUE NOT NULL,
  buyerId STRING NOT NULL,
  sellerId STRING NOT NULL,
  amount FLOAT NOT NULL,
  currency STRING DEFAULT 'USD',
  status EscrowStatus DEFAULT 'PENDING',
  description STRING,
  releaseConditions STRING,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP,
  releasedAt TIMESTAMP,
  disputedAt TIMESTAMP
);
```

### EscrowTimeline

Tracks all events in the escrow lifecycle.

```sql
CREATE TABLE "EscrowTimeline" (
  id STRING PRIMARY KEY,
  escrowId STRING NOT NULL,
  event STRING NOT NULL,
  description STRING,
  metadata JSON,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### EscrowDispute

Manages disputes on escrow accounts.

```sql
CREATE TABLE "EscrowDispute" (
  id STRING PRIMARY KEY,
  escrowId STRING NOT NULL,
  initiatedBy STRING NOT NULL,
  reason STRING NOT NULL,
  description STRING,
  evidence STRING,
  status DisputeStatus DEFAULT 'OPEN',
  resolution STRING,
  resolvedBy STRING,
  resolutionAmount FLOAT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP,
  resolvedAt TIMESTAMP
);
```

## Service Integration

### Dependencies

The Escrow Service depends on:
- **Auth Service** - For JWT validation
- **Wallet Service** - For fund management
- **Payment Service** - For payment coordination

### Service Communication

Services communicate via HTTP REST APIs:

```typescript
// Example: Notify wallet service of escrow release
await axios.post(`${WALLET_SERVICE_URL}/api/v1/wallet/release`, {
  escrowId: escrow.id,
  amount: escrow.amount,
  recipientId: escrow.sellerId,
});
```

## Testing

Run tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:cov
```

## Docker

Build Docker image:

```bash
docker build -t escrow-service:latest .
```

Run Docker container:

```bash
docker run -p 3007:3007 \
  -e DATABASE_URL="postgresql://user:pass@db:5432/escrow_db" \
  -e JWT_SECRET="your-secret" \
  escrow-service:latest
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Service port | 3007 |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRATION` | JWT expiration time | 24h |
| `LOG_LEVEL` | Logging level | info |
| `CORS_ORIGIN` | CORS allowed origin | http://localhost:3000 |
| `REDIS_URL` | Redis connection URL (optional) | - |
| `ESCROW_HOLD_TIMEOUT` | Escrow hold timeout (ms) | 7200000 |
| `ESCROW_DISPUTE_TIMEOUT` | Dispute timeout (ms) | 604800000 |

## Monitoring

### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "escrow-service",
  "timestamp": "2024-01-18T10:30:00Z"
}
```

### Metrics

The service exposes metrics at `/metrics` (Prometheus format).

## Security

- **JWT Authentication** - All endpoints require valid JWT token
- **Input Validation** - All inputs validated with class-validator
- **Helmet** - Security headers via Helmet middleware
- **CORS** - Configurable CORS policy
- **Rate Limiting** - Implemented at API gateway level

## Error Handling

The service returns standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid JWT)
- `404` - Not Found
- `500` - Internal Server Error

Error response format:

```json
{
  "statusCode": 400,
  "message": "Cannot release escrow with status RELEASED",
  "error": "Bad Request"
}
```

## Troubleshooting

### Database Connection Error

Ensure PostgreSQL is running and `DATABASE_URL` is correct:

```bash
psql $DATABASE_URL -c "SELECT 1"
```

### JWT Validation Error

Verify `JWT_SECRET` matches the auth service configuration.

### Port Already in Use

Change the `PORT` environment variable or kill the process using port 3007:

```bash
lsof -i :3007
kill -9 <PID>
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Submit a pull request

## License

MIT

## Support

For issues or questions, contact the Mnbara Engineering Team.
