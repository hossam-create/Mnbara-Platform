# Mnbara Platform - New Monorepo Architecture

**Document Version:** 1.0  
**Last Updated:** March 2026  
**Status:** Active

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [Directory Structure](#directory-structure)
4. [Applications](#applications)
5. [Services](#services)
6. [Shared Packages](#shared-packages)
7. [Communication Patterns](#communication-patterns)
8. [Deployment Architecture](#deployment-architecture)
9. [Monitoring & Observability](#monitoring--observability)
10. [Security Architecture](#security-architecture)

## 🎯 Overview

The Mnbara Platform has been restructured into a modern monorepo using Nx, organizing code into:

- **2 Applications**: Web (Next.js) and Mobile (Flutter)
- **11 Microservices**: Organized into 4 categories
- **5 Shared Packages**: Reusable code across all projects
- **Unified Infrastructure**: Docker, Kubernetes, Terraform

### Key Benefits

- **Unified Codebase**: Single repository for all code
- **Code Reuse**: Shared packages reduce duplication
- **Consistent Tooling**: Same build, test, and lint tools
- **Efficient Builds**: Nx caching and incremental builds
- **Clear Dependencies**: Explicit package relationships
- **Scalability**: Easy to add new services and packages

## 🏗️ Architecture Principles

### 1. Separation of Concerns
Each service has a single responsibility:
- **Auth Service**: Authentication and authorization
- **User Service**: User management
- **Product Service**: Product catalog
- **Order Service**: Order management
- **Payment Service**: Payment processing

### 2. Shared Packages
Common functionality is extracted into shared packages:
- **@mnbara/types**: Type definitions
- **@mnbara/ui-components**: UI components
- **@mnbara/utils**: Utility functions
- **@mnbara/api-client**: API client
- **@mnbara/validation**: Validation schemas

### 3. Clear Dependencies
```
Applications (apps/)
    ↓
Shared Packages (packages/)
    ↓
Services (services/)
    ↓
Infrastructure (infrastructure/)
```

### 4. Consistent Structure
All services follow the same structure:
```
service-name/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── services/
│   ├── controllers/
│   └── middleware/
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

## 📁 Directory Structure

### Root Level

```
mnbara-platform/
├── apps/                    # Applications
├── services/                # Microservices
├── packages/                # Shared packages
├── infrastructure/          # Infrastructure as Code
├── docs/                    # Documentation
├── scripts/                 # Build and utility scripts
├── archive/                 # Archived services (read-only)
├── package.json             # Root package.json
├── nx.json                  # Nx configuration
├── tsconfig.json            # Root TypeScript config
├── .eslintrc.json           # ESLint configuration
├── .prettierrc               # Prettier configuration
└── README.md                # Project README
```

### apps/ - Applications

```
apps/
├── web/                     # Next.js 15 web application
│   ├── src/
│   │   ├── app/            # Next.js app directory
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── types/          # Local types
│   │   └── styles/         # Global styles
│   ├── public/             # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   └── README.md
│
└── mobile/                  # Flutter 3.x mobile application
    ├── lib/
    │   ├── main.dart
    │   ├── screens/
    │   ├── widgets/
    │   ├── services/
    │   └── models/
    ├── pubspec.yaml
    ├── android/
    ├── ios/
    └── README.md
```

### services/ - Microservices

```
services/
├── core/                    # Core services
│   ├── auth-service/       # Authentication & Authorization
│   ├── user-service/       # User management
│   └── notification-service/ # Notifications
│
├── marketplace/             # E-commerce services
│   ├── product-service/    # Product catalog
│   ├── order-service/      # Order management
│   └── cart-service/       # Shopping cart
│
├── crowdshipping/           # Delivery services
│   ├── trips-service/      # Delivery trips
│   └── matching-service/   # Trip-driver matching
│
└── financial/               # Financial services
    ├── payment-service/    # Payment processing
    ├── wallet-service/     # Digital wallet
    ├── escrow-service/     # Escrow management
    └── settlement-service/ # Financial settlements
```

### packages/ - Shared Packages

```
packages/
├── types/                   # @mnbara/types
│   ├── src/
│   │   ├── user.types.ts
│   │   ├── order.types.ts
│   │   ├── payment.types.ts
│   │   ├── delivery.types.ts
│   │   ├── common.types.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── ui-components/           # @mnbara/ui-components
│   ├── src/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── Spinner.tsx
│   │   ├── Skeleton.tsx
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── utils/                   # @mnbara/utils
│   ├── src/
│   │   ├── currency.ts
│   │   ├── date.ts
│   │   ├── validation.ts
│   │   ├── helpers.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── api-client/              # @mnbara/api-client
│   ├── src/
│   │   ├── api-client.ts
│   │   ├── endpoints.ts
│   │   ├── interceptors.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
└── validation/              # @mnbara/validation
    ├── src/
    │   ├── user.schema.ts
    │   ├── order.schema.ts
    │   ├── payment.schema.ts
    │   ├── delivery.schema.ts
    │   └── index.ts
    ├── package.json
    └── tsconfig.json
```

### infrastructure/ - Infrastructure as Code

```
infrastructure/
├── docker/                  # Docker configurations
│   ├── Dockerfile.template
│   ├── docker-compose.dev.yml
│   ├── docker-compose.prod.yml
│   └── README.md
│
├── kubernetes/              # Kubernetes manifests
│   ├── base/
│   │   ├── namespace.yaml
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── configmap.yaml
│   ├── overlays/
│   │   ├── dev/
│   │   ├── staging/
│   │   └── prod/
│   └── kustomization.yaml
│
├── terraform/               # Terraform modules
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── modules/
│   │   ├── ecs/
│   │   ├── rds/
│   │   └── s3/
│   └── README.md
│
├── database-migrations/     # Database migrations
│   ├── migrations/
│   ├── seeds/
│   ├── scripts/
│   └── README.md
│
└── monitoring/              # Monitoring setup
    ├── prometheus/
    ├── grafana/
    └── logging/
```

## 🎨 Applications

### Web Application (apps/web)

**Technology:** Next.js 15, TypeScript, Tailwind CSS

**Purpose:** Main web interface for the Mnbara Platform

**Key Features:**
- Server-side rendering
- API routes for backend communication
- Authentication with JWT
- Responsive design
- Real-time updates with WebSockets

**Structure:**
```
apps/web/src/
├── app/                    # Next.js app directory
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (auth)/            # Auth routes
│   ├── (dashboard)/       # Dashboard routes
│   └── api/               # API routes
├── components/            # React components
├── hooks/                 # Custom hooks
├── services/              # API services
├── types/                 # Local types
└── styles/                # Global styles
```

**Dependencies:**
- @mnbara/types
- @mnbara/ui-components
- @mnbara/utils
- @mnbara/api-client
- @mnbara/validation

### Mobile Application (apps/mobile)

**Technology:** Flutter 3.x, Dart

**Purpose:** Native mobile app for iOS and Android

**Key Features:**
- Cross-platform development
- Native performance
- Offline support
- Push notifications
- Biometric authentication

**Structure:**
```
apps/mobile/lib/
├── main.dart
├── screens/               # Screen widgets
├── widgets/               # Reusable widgets
├── services/              # API and local services
├── models/                # Data models
├── providers/             # State management
└── utils/                 # Utility functions
```

## 🔧 Services

### Core Services (services/core/)

#### Auth Service
- JWT token generation and validation
- OAuth2 integration
- Session management
- Password reset and recovery

#### User Service
- User profile management
- User preferences
- KYC verification
- Trust score calculation

#### Notification Service
- Email notifications
- SMS notifications
- Push notifications
- Notification templates

### Marketplace Services (services/marketplace/)

#### Product Service
- Product catalog management
- Product search and filtering
- Product reviews and ratings
- Inventory management

#### Order Service
- Order creation and management
- Order status tracking
- Order history
- Order cancellation and refunds

#### Cart Service
- Shopping cart management
- Cart persistence
- Cart item validation
- Cart checkout

### Crowdshipping Services (services/crowdshipping/)

#### Trips Service
- Trip creation and management
- Trip scheduling
- Trip status tracking
- Trip history

#### Matching Service
- Trip-driver matching algorithm
- Match scoring
- Match acceptance/rejection
- Match history

### Financial Services (services/financial/)

#### Payment Service
- Payment processing
- Payment gateway integration
- Payment status tracking
- Payment reconciliation

#### Wallet Service
- Digital wallet management
- Balance tracking
- Transaction history
- Wallet top-up

#### Escrow Service
- Escrow account management
- Escrow release conditions
- Dispute handling
- Escrow reconciliation

#### Settlement Service
- Financial settlement processing
- Settlement scheduling
- Settlement reconciliation
- Settlement reporting

## 📦 Shared Packages

### @mnbara/types
Centralized TypeScript type definitions used across all projects.

**Exports:**
```typescript
export * from './user.types';
export * from './order.types';
export * from './payment.types';
export * from './delivery.types';
export * from './common.types';
```

### @mnbara/ui-components
Reusable React components with consistent styling.

**Components:**
- Button (primary, secondary, danger variants)
- Input (text, email, password, number)
- Card (with header, body, footer slots)
- Modal (with backdrop and animations)
- Badge (with status colors)
- Spinner (loading indicator)
- Skeleton (loading placeholder)

### @mnbara/utils
Utility functions for common operations.

**Utilities:**
- `formatCurrency(amount, currency)` - Format currency values
- `formatDate(date, format)` - Format dates
- `validateEmail(email)` - Validate email addresses
- `validatePhone(phone)` - Validate phone numbers
- `debounce(fn, delay)` - Debounce function calls
- `throttle(fn, delay)` - Throttle function calls

### @mnbara/api-client
Type-safe API client for backend communication.

**Features:**
- Axios-based HTTP client
- Request/response interceptors
- Error handling and retry logic
- TypeScript types for all endpoints
- Automatic token refresh

### @mnbara/validation
Data validation schemas using Zod.

**Schemas:**
- `userSchema` - User data validation
- `orderSchema` - Order data validation
- `paymentSchema` - Payment data validation
- `deliverySchema` - Delivery data validation

## 🔄 Communication Patterns

### Service-to-Service Communication

```
┌─────────────────────────────────────────────────────┐
│                  API Gateway                         │
│              (services/api-gateway)                  │
└─────────────────────────────────────────────────────┘
                        ↓
    ┌───────────────────┼───────────────────┐
    ↓                   ↓                   ↓
┌─────────┐      ┌─────────┐      ┌─────────────┐
│  Auth   │      │  User   │      │ Notification│
│ Service │      │ Service │      │  Service    │
└─────────┘      └─────────┘      └─────────────┘
    ↓                   ↓                   ↓
    └───────────────────┼───────────────────┘
                        ↓
            ┌───────────────────────┐
            │   Message Queue       │
            │   (RabbitMQ/Redis)    │
            └───────────────────────┘
```

### Application-to-Service Communication

```
┌──────────────────────────────────────┐
│         Web Application              │
│         (apps/web)                   │
└──────────────────────────────────────┘
                ↓
        ┌───────────────┐
        │  API Client   │
        │ (@mnbara/api) │
        └───────────────┘
                ↓
        ┌───────────────┐
        │  API Gateway  │
        └───────────────┘
                ↓
        ┌───────────────┐
        │  Services     │
        └───────────────┘
```

## 🚀 Deployment Architecture

### Development Environment

```
Local Machine
├── Docker Compose
│   ├── PostgreSQL
│   ├── Redis
│   ├── RabbitMQ
│   └── Services (containerized)
└── npm run dev
    ├── Web app (localhost:3000)
    ├── Mobile app (emulator)
    └── Services (localhost:3001-3010)
```

### Production Environment

```
AWS/Cloud Infrastructure
├── Load Balancer (ALB)
├── ECS Cluster
│   ├── Web Application (Next.js)
│   ├── API Gateway
│   └── Microservices
├── RDS (PostgreSQL)
├── ElastiCache (Redis)
├── S3 (File Storage)
└── CloudFront (CDN)
```

## 📊 Monitoring & Observability

### Metrics Collection

**Prometheus** collects metrics from all services:
- Request count and latency
- Error rates
- Database query performance
- Memory and CPU usage

### Visualization

**Grafana** dashboards display:
- Application performance
- Business metrics
- Infrastructure health
- Service dependencies

### Logging

**Fluent Bit** aggregates logs from:
- Application logs
- Service logs
- Infrastructure logs
- Error logs

### Tracing

**OpenTelemetry** traces requests across services:
- Request flow visualization
- Performance bottleneck identification
- Service dependency mapping

## 🔐 Security Architecture

### Authentication

- JWT tokens for API authentication
- OAuth2 for third-party integrations
- Session management for web app
- Biometric authentication for mobile

### Authorization

- Role-based access control (RBAC)
- Permission-based access control (PBAC)
- Resource-level authorization
- API key management

### Data Protection

- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Secure password hashing (bcrypt)
- Secrets management (AWS Secrets Manager)

### API Security

- Rate limiting
- CORS configuration
- CSRF protection
- Input validation and sanitization
- SQL injection prevention

## 📈 Scalability

### Horizontal Scaling

- Stateless services for easy scaling
- Load balancing across instances
- Database connection pooling
- Cache layer for performance

### Vertical Scaling

- Resource allocation per service
- Memory and CPU limits
- Auto-scaling policies
- Performance monitoring

## 🔄 CI/CD Pipeline

```
Git Push
    ↓
GitHub Actions
    ├── Lint
    ├── Test
    ├── Build
    ├── Security Scan
    └── Deploy
        ├── Dev
        ├── Staging
        └── Production
```

## 📚 Related Documentation

- [README.md](../../README.md) - Project overview
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Development guidelines
- [docs/DEVELOPMENT_SCRIPTS.md](../DEVELOPMENT_SCRIPTS.md) - Available scripts
- [docs/IDE_SETUP.md](../IDE_SETUP.md) - IDE configuration

---

**Last Updated:** March 2026  
**Architecture Version:** 1.0
