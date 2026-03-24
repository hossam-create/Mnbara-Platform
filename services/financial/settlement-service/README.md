# Settlement Service

P2P Money Transfer and Local Settlement Matching Service for the Mnbara Platform. Handles settlement processing, transfer matching, and financial reconciliation.

## Overview

The Settlement Service provides a robust system for managing peer-to-peer money transfers and settlement matching. It enables users to find settlement matches, process transfers, and manage financial settlements with location-based matching capabilities.

## Features

- **Settlement Transfer Management** - Create and manage settlement transfers
- **Match Proposal Engine** - Intelligent matching of settlement requests
- **Location-Based Matching** - Find settlement matches based on geographic proximity
- **Exchange Rate Management** - Real-time exchange rate tracking
- **Settlement Processing** - Process and confirm settlements
- **Transfer History** - Complete audit trail of all transfers
- **Notification System** - Real-time notifications for settlement events

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
cd services/financial/settlement-service
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
- `PORT` - Service port (default: 3008)

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

The service will be available at `http://localhost:3008`

API documentation: `http://localhost:3008/api/docs`

### Production Build

```bash
npm run build
npm run start:prod
```

## API Endpoints

### Create Settlement Transfer

```http
POST /api/v1/transfers
Content-Type: application/json

{
  "userId": "user-123",
  "amount": 1000,
  "currency": "USD",
  "description": "Settlement transfer",
  "location": {
    "latitude": 30.0444,
    "longitude": 31.2357
  }
}
```

### Get Transfer Details

```http
GET /api/v1/transfers/:id
```

### Get Match Proposals

```http
GET /api/v1/matches/:transferId
```

### Accept Match

```http
POST /api/v1/matches/:matchId/accept
Content-Type: application/json

{
  "userId": "user-123",
  "isRequester": true
}
```

### Reject Match

```http
POST /api/v1/matches/:matchId/reject
```

### Confirm Settlement

```http
POST /api/v1/matches/:matchId/confirm
```

### Get Match Status

```http
GET /api/v1/matches/:matchId/status
```

### Get Exchange Rates

```http
GET /api/v1/rates?from=USD&to=EGP
```

### List Transfers

```http
GET /api/v1/transfers?userId=user-123&status=PENDING
```

## Database Schema

### SettlementTransfer

Represents a settlement transfer request.

```sql
CREATE TABLE "SettlementTransfer" (
  id STRING PRIMARY KEY,
  userId STRING NOT NULL,
  amount FLOAT NOT NULL,
  currency STRING DEFAULT 'USD',
  status TransferStatus DEFAULT 'PENDING',
  description STRING,
  latitude FLOAT,
  longitude FLOAT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP,
  completedAt TIMESTAMP
);
```

### SettlementMatch

Represents a match between two settlement requests.

```sql
CREATE TABLE "SettlementMatch" (
  id STRING PRIMARY KEY,
  requestId STRING NOT NULL,
  counterRequestId STRING NOT NULL,
  matchScore FLOAT,
  status MatchStatus DEFAULT 'PROPOSED',
  requestAccepted BOOLEAN DEFAULT FALSE,
  counterAccepted BOOLEAN DEFAULT FALSE,
  acceptedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP
);
```

### ExchangeRate

Stores exchange rate information.

```sql
CREATE TABLE "ExchangeRate" (
  id STRING PRIMARY KEY,
  fromCurrency STRING NOT NULL,
  toCurrency STRING NOT NULL,
  rate FLOAT NOT NULL,
  source STRING,
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

## Service Integration

### Dependencies

The Settlement Service depends on:
- **Auth Service** - For JWT validation
- **Wallet Service** - For fund management
- **Payment Service** - For payment coordination

### Service Communication

Services communicate via HTTP REST APIs:

```typescript
// Example: Notify wallet service of settlement completion
await axios.post(`${WALLET_SERVICE_URL}/api/v1/wallet/settle`, {
  matchId: match.id,
  amount: match.amount,
  fromUserId: match.request.userId,
  toUserId: match.counterRequest.userId,
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
docker build -t settlement-service:latest .
```

Run Docker container:

```bash
docker run -p 3008:3008 \
  -e DATABASE_URL="postgresql://user:pass@db:5432/settlement_db" \
  -e JWT_SECRET="your-secret" \
  settlement-service:latest
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Service port | 3008 |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRATION` | JWT expiration time | 24h |
| `LOG_LEVEL` | Logging level | info |
| `CORS_ORIGIN` | CORS allowed origin | http://localhost:3000 |
| `REDIS_URL` | Redis connection URL (optional) | - |
| `MATCH_RADIUS_KM` | Matching radius in kilometers | 5 |
| `MATCH_TIMEOUT_MS` | Match proposal timeout (ms) | 3600000 |

## Monitoring

### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "settlement-service",
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
  "message": "Invalid transfer amount",
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

Change the `PORT` environment variable or kill the process using port 3008:

```bash
lsof -i :3008
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
