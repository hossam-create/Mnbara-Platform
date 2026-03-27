# Mnbara Platform - Monorepo

A unified, scalable monorepo structure for the Mnbara Platform using Nx, organizing applications, services, and shared packages.

## 📁 Project Structure

```
mnbara-platform/
├── apps/                          # Applications
│   ├── web/                       # Web Application (Next.js 15)
│   └── mobile/                    # Mobile Application (Flutter 3.x)
├── services/                      # Microservices
│   ├── core/                      # Core services (auth, user, notification)
│   ├── marketplace/               # E-commerce services (product, order, cart)
│   ├── crowdshipping/             # Delivery services (trips, matching)
│   └── financial/                 # Financial services (payment, wallet, escrow, settlement)
├── packages/                      # Shared packages
│   ├── @mnbara/types/            # TypeScript type definitions
│   ├── @mnbara/ui-components/    # React UI component library
│   ├── @mnbara/utils/            # Utility functions
│   ├── @mnbara/api-client/       # API client library
│   └── @mnbara/validation/       # Validation schemas (Zod)
├── infrastructure/                # Infrastructure as Code
│   ├── docker/                    # Docker configurations
│   ├── kubernetes/                # Kubernetes manifests
│   ├── terraform/                 # Terraform modules
│   └── database-migrations/       # Database migration scripts
├── docs/                          # Documentation
├── scripts/                       # Build and utility scripts
└── archive/                       # Archived services (read-only)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm 10+
- Nx CLI (installed globally or via npx)

### Installation

```bash
# Install dependencies
npm install

# Verify setup
npm run verify-setup
```

### Development

```bash
# Start development server for web app
npm run dev:web

# Start development server for mobile app
npm run dev:mobile

# Start all services
npm run dev:services

# Run all services in development mode
npm run dev
```

### Building

```bash
# Build all packages and applications
npm run build

# Build specific package
npm run build @mnbara/types

# Build with Nx
nx build @mnbara/types
nx build apps/web
```

### Testing

```bash
# Run all tests
npm run test

# Run tests for specific package
npm run test @mnbara/types

# Run tests with coverage
npm run test:coverage

# Run property-based tests
npm run test:pbt
```

### Linting

```bash
# Lint all code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📦 Shared Packages

### @mnbara/types
Shared TypeScript type definitions used across all applications and services.

```typescript
import { User, Order, Payment } from '@mnbara/types';
```

**Key Types:**
- User-related types (User, UserRole, UserProfile)
- Order-related types (Order, OrderItem, OrderStatus)
- Payment-related types (Payment, PaymentStatus, Currency)
- Delivery-related types (Delivery, Trip, Location)

### @mnbara/ui-components
Reusable React components for consistent UI across applications.

```typescript
import { Button, Input, Card, Modal, Badge } from '@mnbara/ui-components';
```

**Available Components:**
- Button (with variants: primary, secondary, danger)
- Input (with validation support)
- Card (with slots for flexible layouts)
- Modal (with portal support)
- Badge (with status colors)
- Spinner (loading indicator)
- Skeleton (loading placeholder)

### @mnbara/utils
Utility functions for common operations.

```typescript
import { formatCurrency, formatDate, validateEmail } from '@mnbara/utils';
```

**Available Utilities:**
- Currency formatting and conversion
- Date manipulation and formatting
- Input validation helpers
- General utility functions

### @mnbara/api-client
Type-safe API client for backend communication.

```typescript
import { ApiClient } from '@mnbara/api-client';

const client = new ApiClient(process.env.API_BASE_URL);
const users = await client.get('/users');
```

**Features:**
- Axios-based HTTP client
- Request/response interceptors
- Error handling and retry logic
- TypeScript types for all endpoints

### @mnbara/validation
Data validation schemas using Zod.

```typescript
import { userSchema, orderSchema } from '@mnbara/validation';

const result = userSchema.parse(userData);
```

**Available Schemas:**
- User validation schema
- Order validation schema
- Payment validation schema
- Delivery validation schema

## 🏗️ Applications

### apps/web
Next.js 15 web application for the Mnbara Platform.

```bash
cd apps/web
npm run dev
```

**Features:**
- Server-side rendering with Next.js
- Tailwind CSS for styling
- TypeScript for type safety
- Integration with shared packages

### apps/mobile
Flutter 3.x mobile application for iOS and Android.

```bash
cd apps/mobile
flutter pub get
flutter run
```

**Features:**
- Cross-platform mobile development
- Native performance
- Integration with backend services

## 🔧 Services

### Core Services (services/core/)
- **auth-service**: Authentication and authorization
- **user-service**: User management
- **notification-service**: Notifications and alerts

### Marketplace Services (services/marketplace/)
- **product-service**: Product catalog management
- **order-service**: Order management
- **cart-service**: Shopping cart management

### Crowdshipping Services (services/crowdshipping/)
- **trips-service**: Delivery trip management
- **matching-service**: Trip-driver matching algorithm

### Financial Services (services/financial/)
- **payment-service**: Payment processing
- **wallet-service**: Digital wallet management
- **escrow-service**: Escrow account management
- **settlement-service**: Financial settlements

## 📚 Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development workflow and guidelines
- [docs/architecture/NEW_STRUCTURE.md](./docs/architecture/NEW_STRUCTURE.md) - Detailed architecture documentation
- [docs/DEVELOPMENT_SCRIPTS.md](./docs/DEVELOPMENT_SCRIPTS.md) - Available npm scripts
- [docs/IDE_SETUP.md](./docs/IDE_SETUP.md) - IDE configuration guide
- [docs/ENVIRONMENT_CHECKLIST.md](./docs/ENVIRONMENT_CHECKLIST.md) - Environment setup checklist

## 🔄 Nx Commands

### Build
```bash
nx build <project>              # Build a specific project
nx run-many --target=build      # Build all projects
nx affected --target=build      # Build affected projects
```

### Test
```bash
nx test <project>               # Test a specific project
nx run-many --target=test       # Test all projects
nx affected --target=test       # Test affected projects
```

### Lint
```bash
nx lint <project>               # Lint a specific project
nx run-many --target=lint       # Lint all projects
```

### Dependency Graph
```bash
nx graph                         # Visualize project dependencies
nx graph --file=graph.html       # Save graph to file
```

## 🐳 Docker

### Build Docker Images
```bash
docker-compose -f infrastructure/docker/docker-compose.dev.yml build
```

### Run Services
```bash
docker-compose -f infrastructure/docker/docker-compose.dev.yml up
```

## 🚢 Deployment

### Development
```bash
npm run deploy:dev
```

### Staging
```bash
npm run deploy:staging
```

### Production
```bash
npm run deploy:prod
```

## 📊 Monitoring

- **Prometheus**: Metrics collection at `http://localhost:9090`
- **Grafana**: Dashboards at `http://localhost:3000`
- **Logs**: Centralized logging with Fluent Bit

## 🔐 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Encrypted data at rest and in transit
- Regular security audits

## 📝 Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables:
- `NODE_ENV`: Development, staging, or production
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: JWT signing secret
- `API_BASE_URL`: Backend API base URL

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Code standards
- Commit conventions
- Pull request process
- Testing requirements

## 📄 License

Proprietary - Mnbara Platform

## 📞 Support

For issues or questions:
1. Check existing documentation
2. Review GitHub issues
3. Contact the platform team

---

**Last Updated:** March 2026  
**Monorepo Version:** 1.0
