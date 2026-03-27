# API Documentation

OpenAPI specification for all Mnbara Platform services.

---

## Overview

Complete API documentation for all 16 active services with endpoints, request/response schemas, and authentication requirements.

---

## Authentication

All API endpoints (except `/health` and `/auth/*`) require JWT authentication:

```
Authorization: Bearer <token>
```

---

## API Gateway (Port 3000)

### Health Check
```
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "service": "api-gateway",
  "version": "1.0.0"
}
```

---

## Auth Service (Port 3001)

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

## Product Service (Port 3006)

### Get Product Tree
```
GET /api/products/tree
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "cat_1",
      "name": "Electronics",
      "nameAr": "الإلكترونيات",
      "slug": "electronics",
      "level": 1,
      "productCount": 500,
      "isLeaf": false,
      "children": [
        {
          "id": "cat_2",
          "name": "Smartphones",
          "nameAr": "الهواتف الذكية",
          "slug": "electronics-smartphones",
          "level": 2,
          "productCount": 150,
          "isLeaf": true,
          "children": []
        }
      ]
    }
  ]
}
```

### Get Category Subtree
```
GET /api/products/tree/:categoryId
```

**Parameters**:
- `categoryId`: Category ID

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "cat_1",
    "name": "Electronics",
    "nameAr": "الإلكترونيات",
    "slug": "electronics",
    "level": 1,
    "productCount": 500,
    "isLeaf": false,
    "children": [...]
  }
}
```

### Get Products in Category
```
GET /api/products/tree/:categoryId/products?page=1&limit=20&country=US
```

**Parameters**:
- `categoryId`: Category ID
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `country`: Filter by country (optional)

**Response**:
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_123",
        "title": "iPhone 15 Pro",
        "titleAr": "آيفون 15 برو",
        "price": 999.99,
        "currency": "USD",
        "originCountry": "US",
        "purchaseCountry": "US",
        "deliveryCountry": "UK",
        "condition": "NEW",
        "status": "PUBLISHED",
        "seller": {
          "id": "seller_456",
          "name": "Tech Store",
          "email": "tech@store.com"
        },
        "images": [
          {
            "id": "img_789",
            "url": "https://example.com/image.jpg",
            "thumbnailUrl": "https://example.com/thumb.jpg",
            "isPrimary": true
          }
        ]
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### Search Categories and Products
```
GET /api/products/tree/search?query=iphone&country=US
```

**Parameters**:
- `query`: Search query
- `country`: Filter by country (optional)

**Response**:
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "cat_2",
        "name": "Smartphones",
        "nameAr": "الهواتف الذكية",
        "slug": "electronics-smartphones",
        "level": 2,
        "productCount": 150
      }
    ],
    "products": [
      {
        "id": "prod_123",
        "title": "iPhone 15 Pro",
        "titleAr": "آيفون 15 برو",
        "price": 999.99,
        "currency": "USD",
        "seller": {...}
      }
    ]
  }
}
```

### Filter by Country
```
GET /api/products/tree/filter?country=US&minPrice=100&maxPrice=1000
```

**Parameters**:
- `country`: Country code (ISO 3166-1 alpha-2)
- `minPrice`: Minimum price (optional)
- `maxPrice`: Maximum price (optional)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "cat_1",
      "name": "Electronics",
      "nameAr": "الإلكترونيات",
      "slug": "electronics",
      "level": 1,
      "productCount": 50,
      "isLeaf": false,
      "children": [
        {
          "id": "cat_2",
          "name": "Smartphones",
          "nameAr": "الهواتف الذكية",
          "slug": "electronics-smartphones",
          "level": 2,
          "productCount": 25,
          "isLeaf": true,
          "children": []
        }
      ]
    }
  ]
}
```

---

## Order Service (Port 3006)

### Create Order
```
POST /api/orders
```

**Request**:
```json
{
  "productId": "prod_123",
  "quantity": 1,
  "totalAmount": 999.99,
  "currency": "USD",
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "orderId": "order_456",
    "status": "PENDING",
    "totalAmount": 999.99,
    "currency": "USD",
    "createdAt": "2026-02-20T00:00:00Z"
  }
}
```

### Get Order
```
GET /api/orders/:orderId
```

**Parameters**:
- `orderId`: Order ID

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "order_456",
    "buyerId": "user_123",
    "productId": "prod_123",
    "quantity": 1,
    "totalAmount": 999.99,
    "currency": "USD",
    "status": "PENDING",
    "createdAt": "2026-02-20T00:00:00Z",
    "updatedAt": "2026-02-20T00:00:00Z"
  }
}
```

### Update Order Status
```
PUT /api/orders/:orderId/status
```

**Request**:
```json
{
  "status": "CONFIRMED"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "order_456",
    "status": "CONFIRMED",
    "updatedAt": "2026-02-20T01:00:00Z"
  }
}
```

---

## Payment Service (Port 3003)

### Create Payment Intent
```
POST /api/payments/intent
```

**Request**:
```json
{
  "orderId": "order_456",
  "amount": 999.99,
  "currency": "USD",
  "paymentMethod": "stripe"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "paymentIntentId": "pi_123456789",
    "clientSecret": "pi_123456789_secret_abc123",
    "amount": 999.99,
    "currency": "USD",
    "status": "REQUIRES_ACTION"
  }
}
```

### Confirm Payment
```
POST /api/payments/confirm
```

**Request**:
```json
{
  "paymentIntentId": "pi_123456789",
  "paymentMethodId": "pm_123456789"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_789",
    "status": "SUCCEEDED",
    "amount": 999.99,
    "currency": "USD",
    "createdAt": "2026-02-20T00:00:00Z"
  }
}
```

### Get Payment Status
```
GET /api/payments/status/:paymentIntentId
```

**Parameters**:
- `paymentIntentId`: Stripe Payment Intent ID

**Response**:
```json
{
  "success": true,
  "data": {
    "paymentIntentId": "pi_123456789",
    "status": "SUCCEEDED",
    "amount": 999.99,
    "currency": "USD",
    "createdAt": "2026-02-20T00:00:00Z",
    "updatedAt": "2026-02-20T00:05:00Z"
  }
}
```

---

## Wallet Service (Port 3005)

### Get Wallet Balance
```
GET /api/wallets/:walletId/balance
```

**Parameters**:
- `walletId`: Wallet ID

**Response**:
```json
{
  "success": true,
  "data": {
    "walletId": "wallet_123",
    "balance": 1500.00,
    "currency": "USD",
    "status": "ACTIVE"
  }
}
```

### Create Transaction
```
POST /api/wallets/:walletId/transactions
```

**Request**:
```json
{
  "type": "CREDIT",
  "amount": 100.00,
  "currency": "USD",
  "description": "Payment received"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "transactionId": "txn_789",
    "walletId": "wallet_123",
    "type": "CREDIT",
    "amount": 100.00,
    "currency": "USD",
    "description": "Payment received",
    "status": "COMPLETED",
    "createdAt": "2026-02-20T00:00:00Z"
  }
}
```

### Get Transaction History
```
GET /api/wallets/:walletId/transactions?page=1&limit=20
```

**Parameters**:
- `walletId`: Wallet ID
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response**:
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_789",
        "type": "CREDIT",
        "amount": 100.00,
        "currency": "USD",
        "description": "Payment received",
        "status": "COMPLETED",
        "createdAt": "2026-02-20T00:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

## Matching Service (Port 3010)

### Get Matches for Order
```
GET /api/matching/orders/:orderId/matches
```

**Parameters**:
- `orderId`: Order ID

**Response**:
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": "match_123",
        "orderId": "order_456",
        "tripId": "trip_789",
        "score": 95.5,
        "status": "PENDING",
        "productOriginCountry": "US",
        "productPurchaseCountry": "US",
        "productDeliveryCountry": "UK",
        "tripOriginCountry": "US",
        "tripDestinationCountry": "UK",
        "countryMatchValid": true,
        "pickupDeviation": 5.2,
        "dropoffDeviation": 3.1,
        "createdAt": "2026-02-20T00:00:00Z"
      }
    ]
  }
}
```

### Accept Match
```
POST /api/matching/matches/:matchId/accept
```

**Request**:
```json
{
  "travelerId": "user_123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "matchId": "match_123",
    "status": "ACCEPTED",
    "acceptedAt": "2026-02-20T01:00:00Z"
  }
}
```

---

## Notification Service (Port 3011)

### Send Notification
```
POST /api/notifications/send
```

**Request**:
```json
{
  "userId": "user_123",
  "type": "ORDER_UPDATE",
  "title": "Order Status Update",
  "message": "Your order has been confirmed",
  "data": {
    "orderId": "order_456",
    "status": "CONFIRMED"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "notificationId": "notif_123",
    "status": "SENT",
    "sentAt": "2026-02-20T00:00:00Z"
  }
}
```

---

## Feature Management Service (Port 3014)

### Get Feature Flags
```
GET /api/features/flags
```

**Response**:
```json
{
  "success": true,
  "data": {
    "flags": [
      {
        "name": "NEW_CHECKOUT_FLOW",
        "isEnabled": true,
        "metadata": {
          "rolloutPercentage": 100
        }
      }
    ]
  }
}
```

### Set Feature Flag
```
PUT /api/features/flags/:flagName
```

**Request**:
```json
{
  "isEnabled": true,
  "metadata": {
    "rolloutPercentage": 50
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "name": "NEW_CHECKOUT_FLOW",
    "isEnabled": true,
    "metadata": {
      "rolloutPercentage": 50
    },
    "updatedAt": "2026-02-20T00:00:00Z"
  }
}
```

---

## Common Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request",
  "details": "..."
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "details": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden",
  "details": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Not found",
  "details": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Too many requests",
  "details": "Rate limit exceeded"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "details": "..."
}
```

---

**Status**: ✅ API Documentation Complete
**Next**: Dependency Diagrams
