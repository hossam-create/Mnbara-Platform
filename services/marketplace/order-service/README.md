# Order Service

Order Management Service for the Mnbara Platform. Handles order creation, retrieval, updates, and deletion.

## Overview

The Order Service is a microservice responsible for managing all order-related operations in the Mnbara marketplace. It provides RESTful APIs for order management and integrates with the shared packages for types, validation, and utilities.

## Features

- Order creation and management
- Order status tracking
- Order history and retrieval
- Integration with shared packages (@mnbara/*)
- Health check endpoints
- Docker support

## Technology Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript 5.1+
- **Framework:** Express.js 4.18+
- **Database:** PostgreSQL with Prisma ORM
- **Package Manager:** npm

## Project Structure

```
order-service/
├── src/
│   ├── index.ts              # Main application entry point
│   ├── controllers/          # Request handlers (TODO)
│   ├── services/             # Business logic (TODO)
│   ├── routes/               # API routes (TODO)
│   ├── middleware/           # Express middleware (TODO)
│   ├── types/                # TypeScript types (TODO)
│   └── utils/                # Utility functions (TODO)
├── prisma/
│   └── schema.prisma         # Database schema (TODO)
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript configuration
├── Dockerfile                # Docker image definition
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm 10 or higher
- PostgreSQL 14 or higher

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Configure your database connection in `.env`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/mnbara_orders
```

### Development

Start the development server:
```bash
npm run dev
```

The service will run on `http://localhost:3003` by default.

### Building

Build the TypeScript code:
```bash
npm run build
```

### Production

Start the production server:
```bash
npm start
```

## API Endpoints

### Health Check
- **GET** `/health` - Service health status

### Orders
- **GET** `/api/orders` - List all orders
- **POST** `/api/orders` - Create a new order
- **GET** `/api/orders/:id` - Get order details
- **PUT** `/api/orders/:id` - Update an order
- **DELETE** `/api/orders/:id` - Delete an order

## Database

### Setup

Generate Prisma client:
```bash
npm run prisma:generate
```

Run migrations:
```bash
npm run prisma:migrate
```

### Schema

The database schema is defined in `prisma/schema.prisma`. It includes:
- Orders table with order details
- Order items table for line items
- Order status tracking
- Timestamps for audit trails

## Testing

Run tests:
```bash
npm test
```

## Docker

### Build Image

```bash
docker build -t mnbara/order-service:latest .
```

### Run Container

```bash
docker run -p 3003:3003 \
  -e DATABASE_URL=postgresql://user:password@host:5432/mnbara_orders \
  mnbara/order-service:latest
```

### Docker Compose

See the root `docker-compose.yml` for running the service with other services.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Service port | 3003 |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `SERVICE_NAME` | Service identifier | order-service |
| `LOG_LEVEL` | Logging level | info |
| `CORS_ORIGIN` | CORS allowed origin | http://localhost:3000 |
| `API_GATEWAY_URL` | API Gateway URL | http://localhost:3000/api |

## Shared Packages

This service uses the following shared packages:

- **@mnbara/types** - Shared TypeScript type definitions
- **@mnbara/utils** - Utility functions (currency, date, validation)
- **@mnbara/validation** - Zod validation schemas
- **@mnbara/api-client** - API client for service-to-service communication

## Integration

### Service-to-Service Communication

The Order Service communicates with other services through the API Gateway:

- **Product Service** - For product information
- **Payment Service** - For payment processing
- **User Service** - For user information
- **Notification Service** - For order notifications

### Database Connections

The service maintains its own PostgreSQL database for order data. Connection details are configured via the `DATABASE_URL` environment variable.

## Monitoring

### Health Checks

The service exposes a health check endpoint at `/health` that returns:
```json
{
  "status": "ok",
  "service": "order-service",
  "timestamp": "2024-03-02T10:30:00.000Z"
}
```

### Logging

Logs are output to stdout and can be collected by container orchestration platforms.

## Development Workflow

1. Create a feature branch
2. Make changes to the code
3. Run tests: `npm test`
4. Build: `npm run build`
5. Commit and push
6. Create a pull request

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:
1. Verify PostgreSQL is running
2. Check the `DATABASE_URL` environment variable
3. Ensure the database exists
4. Run migrations: `npm run prisma:migrate`

### Port Already in Use

If port 3003 is already in use:
1. Change the `PORT` environment variable
2. Or kill the process using the port

## Contributing

See the root `CONTRIBUTING.md` for contribution guidelines.

## License

Proprietary - Mnbara Platform

## Support

For issues or questions, contact the platform team.
