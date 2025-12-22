# Mnbara Platform - API Design Standards

**Version:** 1.0  
**Last Updated:** 2025-12-22  
**Status:** 🔴 IN PROGRESS

---

## 📋 Table of Contents

1. [API Principles](#api-principles)
2. [RESTful Conventions](#restful-conventions)
3. [Request/Response Format](#requestresponse-format)
4. [Error Handling](#error-handling)
5. [Authentication & Authorization](#authentication--authorization)
6. [Versioning](#versioning)
7. [Rate Limiting](#rate-limiting)
8. [Pagination](#pagination)
9. [Filtering & Sorting](#filtering--sorting)
10. [Documentation](#documentation)

---

## 🎯 API Principles

### 1. Consistency
- All APIs follow the same patterns
- Consistent naming conventions
- Consistent response formats
- Consistent error handling

### 2. Simplicity
- Easy to understand and use
- Minimal learning curve
- Clear documentation
- Intuitive endpoints

### 3. Security
- Authentication required
- Authorization enforced
- Input validation
- Rate limiting

### 4. Performance
- Fast response times
- Efficient queries
- Caching strategies
- Pagination for large datasets

### 5. Scalability
- Stateless design
- Horizontal scaling
- Load balancing
- Database optimization

---

## 🔄 RESTful Conventions

### HTTP Methods

| Method | Purpose | Idempotent | Safe |
|--------|---------|-----------|------|
| GET | Retrieve resource | Yes | Yes |
| POST | Create resource | No | No |
| PUT | Replace resource | Yes | No |
| PATCH | Partial update | No | No |
| DELETE | Delete resource | Yes | No |

### Endpoint Naming

```
GET    /api/v1/users                    # List all users
POST   /api/v1/users                    # Create new user
GET    /api/v1/users/:id                # Get specific user
PUT    /api/v1/users/:id                # Replace user
PATCH  /api/v1/users/:id                # Update user
DELETE /api/v1/users/:id                # Delete user

GET    /api/v1/users/:id/orders         # Get user's orders
POST   /api/v1/users/:id/orders         # Create order for user
GET    /api/v1/users/:id/orders/:orderId # Get specific order
```

### Resource Naming

- Use **plural nouns** for collections: `/users`, `/orders`, `/products`
- Use **lowercase** with hyphens: `/user-profiles`, `/payment-methods`
- Use **hierarchical structure** for relationships: `/users/:id/orders`
- Avoid **verbs** in URLs: ❌ `/getUser`, ✅ `/users/:id`

---

## 📤 Request/Response Format

### Request Format

```json
{
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "metadata": {
    "timestamp": "2025-12-22T10:00:00Z",
    "version": "1.0"
  }
}
```

### Success Response Format

```json
{
  "status": "success",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2025-12-22T10:00:00Z",
    "updatedAt": "2025-12-22T10:00:00Z"
  },
  "metadata": {
    "timestamp": "2025-12-22T10:00:00Z",
    "version": "1.0"
  }
}
```

### List Response Format

```json
{
  "status": "success",
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "John Doe",
      "email": "john@example.com"
    },
    {
      "id": "223e4567-e89b-12d3-a456-426614174001",
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  },
  "metadata": {
    "timestamp": "2025-12-22T10:00:00Z",
    "version": "1.0"
  }
}
```

### Field Naming

- Use **camelCase** for field names: `firstName`, `lastName`, `createdAt`
- Use **ISO 8601** for dates: `2025-12-22T10:00:00Z`
- Use **UUID** for IDs: `123e4567-e89b-12d3-a456-426614174000`
- Use **lowercase** for enums: `role: "admin"`, `status: "active"`

---

## ❌ Error Handling

### Error Response Format

```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "age",
        "message": "Must be at least 18"
      }
    ]
  },
  "metadata": {
    "timestamp": "2025-12-22T10:00:00Z",
    "version": "1.0",
    "requestId": "req-123456"
  }
}
```

### HTTP Status Codes

#### 2xx Success
- `200 OK` - Request succeeded
- `201 Created` - Resource created
- `202 Accepted` - Request accepted for processing
- `204 No Content` - Request succeeded, no content to return

#### 3xx Redirection
- `301 Moved Permanently` - Resource moved
- `302 Found` - Temporary redirect
- `304 Not Modified` - Resource not modified

#### 4xx Client Error
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `422 Unprocessable Entity` - Validation failed
- `429 Too Many Requests` - Rate limit exceeded

#### 5xx Server Error
- `500 Internal Server Error` - Server error
- `502 Bad Gateway` - Gateway error
- `503 Service Unavailable` - Service unavailable
- `504 Gateway Timeout` - Gateway timeout

### Error Codes

```
VALIDATION_ERROR        - Input validation failed
AUTHENTICATION_ERROR    - Authentication failed
AUTHORIZATION_ERROR     - Permission denied
NOT_FOUND_ERROR        - Resource not found
CONFLICT_ERROR         - Resource conflict
RATE_LIMIT_ERROR       - Rate limit exceeded
INTERNAL_SERVER_ERROR  - Server error
SERVICE_UNAVAILABLE    - Service unavailable
```

---

## 🔐 Authentication & Authorization

### Authentication Methods

#### JWT (JSON Web Token)
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### OAuth 2.0
```
Authorization: Bearer <access_token>
```

### Authorization

```
Authorization: Bearer <token>
X-User-Role: admin
X-User-Permissions: read,write,delete
```

### Token Refresh

```
POST /api/v1/auth/refresh
{
  "refreshToken": "..."
}

Response:
{
  "status": "success",
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 3600
  }
}
```

---

## 📦 Versioning

### URL Versioning (Recommended)

```
/api/v1/users
/api/v2/users
```

### Header Versioning

```
GET /api/users
Accept: application/vnd.mnbara.v1+json
```

### Version Lifecycle

- **Current:** Latest version, fully supported
- **Deprecated:** Old version, will be removed in 6 months
- **Sunset:** Version being removed, 1 month notice

### Breaking Changes

- Major version increment (v1 → v2)
- 6-month deprecation period
- Clear migration guide
- Support for both versions during transition

---

## 🚦 Rate Limiting

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640169600
```

### Rate Limit Tiers

| Tier | Requests/Hour | Requests/Day |
|------|---------------|--------------|
| Free | 100 | 1,000 |
| Basic | 1,000 | 10,000 |
| Pro | 10,000 | 100,000 |
| Enterprise | Unlimited | Unlimited |

### Rate Limit Response

```json
{
  "status": "error",
  "error": {
    "code": "RATE_LIMIT_ERROR",
    "message": "Rate limit exceeded",
    "retryAfter": 60
  }
}
```

---

## 📄 Pagination

### Query Parameters

```
GET /api/v1/users?page=1&pageSize=20&sort=createdAt&order=desc
```

### Pagination Response

```json
{
  "status": "success",
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Cursor-Based Pagination (for large datasets)

```
GET /api/v1/users?cursor=abc123&limit=20

Response:
{
  "status": "success",
  "data": [...],
  "pagination": {
    "cursor": "def456",
    "hasMore": true
  }
}
```

---

## 🔍 Filtering & Sorting

### Filtering

```
GET /api/v1/users?role=admin&status=active&createdAfter=2025-01-01
```

### Filtering Operators

```
?field=value              # Exact match
?field[gte]=value         # Greater than or equal
?field[lte]=value         # Less than or equal
?field[gt]=value          # Greater than
?field[lt]=value          # Less than
?field[ne]=value          # Not equal
?field[in]=value1,value2  # In list
?field[contains]=value    # Contains (for strings)
```

### Sorting

```
GET /api/v1/users?sort=createdAt&order=desc
GET /api/v1/users?sort=name,createdAt&order=asc,desc
```

### Search

```
GET /api/v1/users/search?q=john&fields=name,email
```

---

## 📚 Documentation

### OpenAPI Specification

```yaml
openapi: 3.0.0
info:
  title: Mnbara Platform API
  version: 1.0.0
  description: API for Mnbara Platform

servers:
  - url: https://api.mnbara.com/api/v1
    description: Production

paths:
  /users:
    get:
      summary: List all users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: pageSize
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserList'
        '401':
          description: Unauthorized
        '500':
          description: Server error

    post:
      summary: Create new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          description: Bad request
        '401':
          description: Unauthorized

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        email:
          type: string
          format: email
        role:
          type: string
          enum: [admin, user, guest]
        createdAt:
          type: string
          format: date-time
      required:
        - id
        - name
        - email
        - role

    CreateUserRequest:
      type: object
      properties:
        name:
          type: string
        email:
          type: string
          format: email
        role:
          type: string
          enum: [admin, user, guest]
      required:
        - name
        - email
        - role
```

### API Documentation Best Practices

- Document all endpoints
- Include request/response examples
- Document error cases
- Include authentication requirements
- Include rate limiting information
- Include pagination information
- Include filtering/sorting options

---

## 🔗 API Contracts

### Service-to-Service Communication

All service-to-service APIs must be documented and versioned.

```
Internal API: /internal/v1/users
External API: /api/v1/users
```

### API Contract Template

```markdown
# Service Name API Contract

## Version
1.0

## Base URL
https://service.mnbara.com/api/v1

## Authentication
JWT Bearer token required

## Endpoints

### GET /users/:id
Get user by ID

**Request:**
```
GET /users/123
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "123",
    "name": "John Doe"
  }
}
```

**Errors:**
- 404: User not found
- 401: Unauthorized
```

---

## ✅ API Review Checklist

- [ ] Follows RESTful conventions
- [ ] Uses consistent naming
- [ ] Proper HTTP methods
- [ ] Proper status codes
- [ ] Consistent response format
- [ ] Error handling implemented
- [ ] Authentication required
- [ ] Rate limiting configured
- [ ] Pagination implemented
- [ ] Filtering/sorting available
- [ ] Documented in OpenAPI
- [ ] Examples provided
- [ ] Performance optimized
- [ ] Security reviewed

---

**Status:** 🔴 IN PROGRESS  
**Last Updated:** 2025-12-22  
**Next Review:** 2025-12-29
