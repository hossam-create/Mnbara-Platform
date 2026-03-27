# Microservices

This directory contains all backend microservices for the Mnbara Platform, organized by domain.

## 📋 Overview

The platform is organized into 4 service categories with 11 total services:

- **Core Services** (3) - Authentication, user management, notifications
- **Marketplace Services** (3) - Products, orders, shopping cart
- **Crowdshipping Services** (2) - Delivery trips, trip-driver matching
- **Financial Services** (4) - Payments, wallet, escrow, settlements

## 🏗️ Service Categories

### Core Services (services/core/)

Essential services for platform operation.

#### auth-service
**Purpose:** Authentication and authorization

**Responsibilities:**
- User login and logout
- JWT token generation and validation
- OAuth2 integration
- Session management
- Password reset and recovery

**API Endpoints:**
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/register` - User registration
- `POST /auth/forgot-password` - Password reset request

**Dependencies:**
- @mnbara/types
- @mnbara/validation
- PostgreSQL
- Redis (for token blacklist)

#### user-service
**Purpose:** User profile and account management

**Responsibilities:**
- User profile management
- User preferences
- KYC verification
- Trust score calculation
- User activity tracking

**API Endpoints:**
- `GET /users/:id` - Get user profile
- `PUT /users/:id` - Update user profile
- `GET /users/:id/preferences` - Get user preferences
- `PUT /users/:id/preferences` - Update preferences
- `POST /users/:id/kyc` - Submit KYC verification

**Dependencies:**
- @mnbara/types
- @mnbara/validation
- PostgreSQL
- File storage (S3)

#### notification-service
**Purpose:** Notifications and alerts

**Responsibilities:**
- Email notifications
- SMS notifications
- Push notifications
- Notification templates
- Notification history

**API Endpoints:**
- `POST /notifications/email` - Send email
- `POST /notifications/sms` - Send SMS
- `POST /notifications/push` - Send push notification
- `GET /notifications/history` - Get notification history

**Dependencies:**
- @mnbara/types
- Email service (SendGrid)
- SMS service (Twilio)
- Push service (Firebase)
- PostgreSQL

### Marketplace Services (services/marketplace/)

E-commerce functionality.

#### product-service
**Purpose:** Product catalog management

**Responsibilities:**
- Product CRUD operations
- Product search and filtering
- Product reviews and ratings
- Inventory management
- Product categories

**API Endpoints:**
- `GET /products` - List products
- `GET /products/:id` - Get product details
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product
- `GET /products/:id/reviews` - Get product reviews

**Dependencies:**
- @mnbara/types
- @mnbara/validation
- PostgreSQL
- Elasticsearch (for search)

#### order-service
**Purpose:** Order management

**Responsibilities:**
- Order creation and management
- Order status tracking
- Order history
- Order cancellation and refunds
- Order fulfillment

**API Endpoints:**
- `POST /orders` - Create order
- `GET /orders/:id` - Get order details
- `GET /orders` - List user orders
- `PUT /orders/:id` - Update order
- `POST /orders/:id/cancel` - Cancel order
- `POST /orders/:id/refund` - Request refund

**Dependencies:**
- @mnbara/types
- @mnbara/validation
- PostgreSQL
- Message queue (RabbitMQ)

#### cart-service
**Purpose:** Shopping cart management

**Responsibilities:**
- Cart CRUD operations
- Cart item management
- Cart persistence
- Cart validation
- Cart checkout

**API Endpoints:**
- `GET /carts/:userId` - Get user cart
- `POST /carts/:userId/items` - Add item to cart
- `PUT /carts/:userId/items/:itemId` - Update cart item
- `DELETE /carts/:userId/items/:itemId` - Remove item from cart
- `POST /carts/:userId/checkout` - Checkout cart

**Dependencies:**
- @mnbara/types
- @mnbara/validation
- Redis (for cart storage)
- PostgreSQL

### Crowdshipping Services (services/crowdshipping/)

Delivery and logistics functionality.

#### trips-service
**Purpose:** Delivery trip management

**Responsibilities:**
- Trip creation and management
- Trip scheduling
- Trip status tracking
- Trip history
- Trip route optimization

**API Endpoints:**
- `POST /trips` - Create trip
- `GET /trips/:id` - Get trip details
- `GET /trips` - List trips
- `PUT /trips/:id` - Update trip
- `POST /trips/:id/start` - Start trip
- `POST /trips/:id/complete` - Complete trip

**Dependencies:**
- @mnbara/types
- @mnbara/validation
- PostgreSQL
- Maps API (Google Maps)
- Message queue (RabbitMQ)

#### matching-service
**Purpose:** Trip-driver matching

**Responsibilities:**
- Trip-driver matching algorithm
- Match scoring
- Match acceptance/rejection
- Match history
- Driver availability tracking

**API Endpoints:**
- `POST /matches` - Create match
- `GET /matches/:id` - Get match details
- `POST /matches/:id/accept` - Accept match
- `POST /matches/:id/reject` - Reject match
- `GET /drivers/available` - Get available drivers

**Dependencies:**
- @mnbara/types
- @mnbara/validation
- PostgreSQL
- Redis (for driver availability)
- Message queue (RabbitMQ)

### Financial Services (services/financial/)

Payment and financial transaction management.

#### payment-service
**Purpose:** Payment processing

**Responsibilities:**
- Payment processing
- Payment gateway integration
- Payment status tracking
- Payment reconciliation
- Payment history

**API Endpoints:**
- `POST /payments` - Create payment
- `GET /payments/:id` - Get payment details
- `GET /payments` - List payments
- `POST /payments/:id/refund` - Refund payment
- `POST /payments/webhook` - Payment gateway webhook

**Dependencies:**
- @mnbara/types
- @mnbara/validation
- PostgreSQL
- Payment gateway (Stripe/PayPal)
- Message queue (RabbitMQ)

#### wallet-service
**Purpose:** Digital wallet management

**Responsibilities:**
- Wallet CRUD operations
- Balance tracking
- Transaction history
- Wallet top-up
- Wallet withdrawal

**API Endpoints:**
- `GET /wallets/:userId` - Get wallet
- `POST /wallets/:userId/topup` - Top up wallet
- `POST /wallets/:userId/withdraw` - Withdraw from wallet
- `GET /wallets/:userId/transactions` - Get transactions

**Dependencies:**
- @mnbara/types
- @mnbara/validation
- PostgreSQL
- Redis (for balance caching)

#### escrow-service
**Purpose:** Escrow account management

**Responsibilities:**
- Escrow account management
- Escrow release conditions
- Dispute handling
- Escrow reconciliation
- Escrow history

**API Endpoints:**
- `POST /escrow` - Create escrow
- `GET /escrow/:id` - Get escrow details
- `POST /escrow/:id/release` - Release escrow
- `POST /escrow/:id/dispute` - Dispute escrow

**Dependencies:**
- @mnbara/types
- @mnbara/validation
- PostgreSQL
- Message queue (RabbitMQ)

#### settlement-service
**Purpose:** Financial settlement processing

**Responsibilities:**
- Settlement processing
- Settlement scheduling
- Settlement reconciliation
- Settlement reporting
- Settlement history

**API Endpoints:**
- `POST /settlements` - Create settlement
- `GET /settlements/:id` - Get settlement details
- `GET /settlements` - List settlements
- `POST /settlements/:id/process` - Process settlement

**Dependencies:**
- @mnbara/types
- @mnbara/validation
- PostgreSQL
- Message queue (RabbitMQ)

## 🚀 Development

### Running Services

```bash
# From root directory
npm run dev:services

# Or run specific service
nx serve services/core/auth-service
```

### Building Services

```bash
# Build all services
npm run build

# Build specific service
nx build services/core/auth-service
```

### Testing Services

```bash
# Test all services
npm run test

# Test specific service
nx test services/core/auth-service
```

### Linting Services

```bash
# Lint all services
npm run lint

# Lint specific service
nx lint services/core/auth-service
```

## 📁 Service Structure

Each service follows this structure:

```
service-name/
├── src/
│   ├── main.ts                 # Entry point
│   ├── app.module.ts           # NestJS module
│   ├── controllers/            # Request handlers
│   │   └── service.controller.ts
│   ├── services/               # Business logic
│   │   └── service.service.ts
│   ├── middleware/             # Express middleware
│   ├── guards/                 # Authorization guards
│   ├── pipes/                  # Validation pipes
│   ├── filters/                # Exception filters
│   ├── decorators/             # Custom decorators
│   ├── dto/                    # Data transfer objects
│   ├── entities/               # Database entities
│   ├── repositories/           # Data access layer
│   ├── config/                 # Configuration
│   └── utils/                  # Utility functions
├── test/
│   ├── unit/                   # Unit tests
│   └── integration/            # Integration tests
├── prisma/
│   └── schema.prisma           # Database schema
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🔄 Service Communication

### REST API

Services communicate via REST API through the API Gateway:

```
Client → API Gateway → Service
```

### Message Queue

Asynchronous communication via RabbitMQ:

```
Service A → RabbitMQ → Service B
```

### Database

Each service has its own database (database per service pattern):

```
Service A → PostgreSQL (DB A)
Service B → PostgreSQL (DB B)
```

## 🔐 Security

### Authentication

- JWT tokens for API authentication
- Token validation on each request
- Token refresh mechanism

### Authorization

- Role-based access control (RBAC)
- Permission-based access control (PBAC)
- Resource-level authorization

### Data Protection

- Encryption at rest
- Encryption in transit (TLS)
- Secure password hashing

## 📊 Monitoring

### Health Checks

Each service exposes a health endpoint:

```bash
GET /health
```

### Metrics

Services expose Prometheus metrics:

```bash
GET /metrics
```

### Logging

All services log to centralized logging system:

```typescript
logger.info('User created', { userId: user.id });
logger.error('Failed to create user', { error });
```

## 🐳 Docker

### Building Docker Image

```bash
docker build -t mnbara/auth-service:latest .
```

### Running in Docker

```bash
docker run -p 3001:3001 mnbara/auth-service:latest
```

### Docker Compose

```bash
docker-compose -f infrastructure/docker/docker-compose.dev.yml up
```

## 📚 Documentation

- [Service README Template](./core/auth-service/README.md)
- [Architecture Documentation](../docs/architecture/NEW_STRUCTURE.md)
- [Development Guide](../CONTRIBUTING.md)
- [API Documentation](../docs/API.md)

## 🔗 Related Directories

- [apps/](../apps/) - User-facing applications
- [packages/](../packages/) - Shared packages
- [infrastructure/](../infrastructure/) - Infrastructure as Code
- [docs/](../docs/) - Documentation

---

**Last Updated:** March 2026  
**Version:** 1.0
