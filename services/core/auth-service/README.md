# Auth Service

Authentication and authorization service for the Mnbara platform.

## Overview

The Auth Service handles:
- User registration and login
- JWT token generation and validation
- OAuth integration (Google, Facebook, Apple)
- Refresh token management
- Password reset and recovery
- User role and permission management
- Audit logging for security events

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key environment variables:
- `PORT`: Service port (default: 3004)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT signing
- `JWT_EXPIRY`: JWT token expiration time
- `REFRESH_TOKEN_SECRET`: Secret for refresh tokens
- `REFRESH_TOKEN_EXPIRY`: Refresh token expiration time

## Development

Start the development server:

```bash
npm run dev
```

The service will be available at `http://localhost:3004`

## Database

### Setup

Initialize the database:

```bash
npm run prisma:migrate
```

### Seed Data

Populate with seed data:

```bash
npm run prisma:seed
```

### Generate Client

Generate Prisma client:

```bash
npm run prisma:generate
```

## Building

Build the TypeScript code:

```bash
npm run build
```

## Testing

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Linting

Check code quality:

```bash
npm run lint
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### OAuth

- `GET /api/v1/auth/oauth/:provider` - Initiate OAuth flow
- `GET /api/v1/auth/oauth/:provider/callback` - OAuth callback

### User Management

- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### Health Check

- `GET /health` - Service health status

## Database Schema

The service uses PostgreSQL with Prisma ORM. Key models:

- `User` - User accounts with authentication data
- `OAuthAccount` - OAuth provider connections
- `RefreshToken` - Refresh token storage
- `AuditLog` - Security audit trail

See `prisma/schema.prisma` for full schema.

## Docker

Build Docker image:

```bash
docker build -t mnbara-auth-service:latest .
```

Run container:

```bash
docker run -p 3004:3004 --env-file .env mnbara-auth-service:latest
```

## Architecture

```
src/
├── index.ts              # Entry point
├── controllers/          # HTTP request handlers
├── services/            # Business logic
├── routes/              # API route definitions
├── middleware/          # Express middleware
├── types/               # TypeScript interfaces
├── utils/               # Utility functions
└── errors/              # Custom error classes
```

## Security

- Passwords are hashed with bcryptjs
- JWT tokens for stateless authentication
- Refresh tokens for token rotation
- CORS protection
- Rate limiting on auth endpoints
- Comprehensive audit logging
- Input validation on all endpoints

## Monitoring

The service exposes:
- Health check endpoint: `GET /health`
- Metrics endpoint: `GET /metrics` (if enabled)
- Structured logging with Winston

## Contributing

Follow the code style and patterns established in the service. All new features should include:
- Unit tests
- Integration tests
- Documentation
- Audit logging for security events

## License

Proprietary - Mnbara Platform
