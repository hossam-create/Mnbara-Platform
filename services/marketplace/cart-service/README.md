# Cart Service

Shopping Cart Service for the Mnbara platform. Manages user shopping carts with Redis-backed storage and Prisma ORM for persistence.

## Overview

The Cart Service provides RESTful APIs for managing shopping carts, including:
- Add items to cart
- Remove items from cart
- Update item quantities
- Get cart contents
- Clear cart
- Calculate cart totals with tax

## Technology Stack

- **Framework:** NestJS 10.x
- **Language:** TypeScript 5.x
- **Database:** PostgreSQL with Prisma ORM
- **Cache:** Redis (ioredis)
- **API Documentation:** Swagger/OpenAPI
- **Security:** Helmet, JWT authentication

## Project Structure

```
src/
├── controllers/          # API request handlers
├── services/            # Business logic
├── routes/              # Route definitions
└── common/              # Shared utilities and middleware
prisma/
├── schema.prisma        # Database schema
└── migrations/          # Database migrations
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+
- Redis 7+

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Database Setup

Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

### Development

Start the service in watch mode:

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run start:prod
```

## API Endpoints

### Get Cart
```
GET /api/cart/:userId
```

### Add Item to Cart
```
POST /api/cart/:userId/add
Body: { productId, quantity, price }
```

### Update Cart Item
```
PUT /api/cart/:userId/update
Body: { productId, quantity }
```

### Remove Item from Cart
```
DELETE /api/cart/:userId/remove/:productId
```

### Clear Cart
```
DELETE /api/cart/:userId/clear
```

## Testing

Run unit tests:

```bash
npm run test
```

## Linting & Formatting

Lint code:

```bash
npm run lint
```

Format code:

```bash
npm run format
```

## Docker

Build Docker image:

```bash
docker build -t cart-service:latest .
```

Run container:

```bash
docker run -p 3002:3002 cart-service:latest
```

## Configuration

Key environment variables:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Service port (default: 3002)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret

## Dependencies

### Core Dependencies
- `@nestjs/common` - NestJS core
- `@nestjs/core` - NestJS framework
- `@nestjs/platform-express` - Express adapter
- `@prisma/client` - Database ORM
- `ioredis` - Redis client
- `helmet` - Security headers
- `jsonwebtoken` - JWT handling

### Development Dependencies
- `@nestjs/cli` - NestJS CLI
- `@nestjs/testing` - Testing utilities
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution

## Contributing

Follow the project's code standards:
- Use TypeScript strict mode
- Write unit tests for new features
- Follow NestJS best practices
- Use Prettier for formatting
- Use ESLint for linting

## License

Proprietary - Mnbara Platform
