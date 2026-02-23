# Auth Service Go - README

Go-based authentication service for Mnbara Platform with JWT, OAuth2, and rate limiting.

---

## Overview

High-performance Go implementation of auth-service with:
- JWT token generation and validation
- OAuth2 integration (Google, Facebook, Apple)
- Rate limiting middleware
- PostgreSQL database integration
- Redis caching for sessions
- Health checks

---

## Project Structure

```
auth-service-go/
├── cmd/
│   └── server/
│       └── main.go
├── Dockerfile
├── go.mod
└── README.md
```

---

## Getting Started

### Prerequisites

- Go 1.21+
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# Install dependencies
go mod download

# Build
go build -o bin/auth-service ./cmd/server

# Run
./bin/auth-service
```

### Docker

```bash
# Build image
docker build -t mnbarh/auth-service-go .

# Run container
docker run -p 3001:3001 \
  -e DATABASE_URL=postgresql://mnbarh:mnbarh_dev_password@postgres-primary:5432/auth_db \
  -e REDIS_URL=redis:6379 \
  -e JWT_SECRET=your-super-secret-jwt-key \
  -e GOOGLE_CLIENT_ID=your-google-client-id \
  -e GOOGLE_CLIENT_SECRET=your-google-client-secret \
  mnbarh/auth-service-go
```

---

## API Endpoints

### Health Check
```
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "service": "auth-service",
  "version": "1.0.0"
}
```

### Login
```
POST /auth/login
```

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh-token-here",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```

### Register
```
POST /auth/register
```

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh-token-here",
  "user": {
    "id": "user_456",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```

### Google OAuth
```
POST /auth/google
```

**Request**:
```json
{
  "code": "google-oauth-code",
  "state": "state-string"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh-token-here",
  "user": {
    "id": "user_789",
    "email": "user@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```

### Refresh Token
```
POST /auth/refresh
```

**Request**:
```json
{
  "refreshToken": "refresh-token-here"
}
```

**Response**:
```json
{
  "token": "new-jwt-token",
  "refreshToken": "new-refresh-token"
}
```

### Verify Token
```
GET /auth/verify
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "valid": true,
  "user": {
    "sub": "user_123",
    "email": "user@example.com",
    "role": "user"
  }
}
```

---

## Environment Variables

```bash
# Server
PORT=3001

# Database
DATABASE_URL=postgresql://mnbarh:mnbarh_dev_password@postgres-primary:5432/auth_db

# Redis
REDIS_URL=redis:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key

# OAuth2
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback

FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
FACEBOOK_REDIRECT_URI=http://localhost:3001/auth/facebook/callback

APPLE_CLIENT_ID=your-apple-client-id
APPLE_CLIENT_SECRET=your-apple-client-secret
```

---

## Performance

- **Target**: < 50ms API response time
- **Target**: 10K+ concurrent connections
- **Target**: < 10ms cold start

---

## Testing

```bash
# Run tests
go test ./...

# Run tests with coverage
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out

# Run benchmarks
go test -bench=. -benchmem ./...
```

---

## Migration from TypeScript

### Key Changes

1. **Language**: TypeScript → Go
2. **Framework**: Express → Gin
3. **Database**: Prisma → pgx
4. **Cache**: Redis (same)
5. **JWT**: golang-jwt/jwt (same logic)

### API Compatibility

All API endpoints remain the same, ensuring backward compatibility with existing services.

---

**Status**: ✅ Auth Service Go Created
**Next**: Migrate api-gateway to Go
