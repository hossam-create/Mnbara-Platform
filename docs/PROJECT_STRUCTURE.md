# MNBARA Platform - Project Structure Documentation

## Overview

This document provides a comprehensive overview of the MNBARA platform project structure, explaining the purpose of each directory and key files.

## Root Directory

```
mnbara-platform/
├── .github/                 # GitHub configuration and CI/CD
├── .kiro/                   # Kiro IDE specifications
├── backend/                 # Backend microservices
├── contracts/               # Solidity smart contracts
├── docs/                    # Documentation
├── frontend/                # Frontend applications
├── infrastructure/          # Infrastructure as Code
├── scripts/                 # Utility scripts
├── monitoring/              # Monitoring configuration
└── [config files]           # Root configuration files
```

## Backend Services (`backend/services/`)

### Core Services

| Service | Port | Description |
|---------|------|-------------|
| `api-gateway` | 8080 | Central API gateway with routing, rate limiting, auth |
| `auth-service` | 3001 | Authentication, OAuth2, JWT, MFA |
| `listing-service` | 3002 | Product listings and catalog management |
| `auction-service` | 3003 | Real-time auctions with WebSocket |
| `payment-service` | 3004 | Payments, escrow, wallet management |
| `crowdship-service` | 3005 | Crowdshipping logistics |
| `notification-service` | 3006 | Push, email, SMS notifications |
| `recommendation-service` | 3007 | AI-powered recommendations (Python) |
| `rewards-service` | 3008 | Loyalty program and points |
| `orders-service` | 3009 | Order management |
| `trips-service` | 3010 | Traveler trip management |
| `matching-service` | 3011 | Geo-spatial matching with PostGIS |
| `admin-service` | 3012 | Admin operations and reporting |

### Shared Utilities (`backend/services/shared/`)

```
shared/
├── audit/                   # Audit logging service
│   ├── audit.service.ts     # Core audit functionality
│   ├── audit.middleware.ts  # Express middleware
│   └── README.md
├── database/                # Database utilities
│   ├── encryption.config.ts # Encryption configuration
│   ├── prisma-encryption.middleware.ts
│   └── migrations/          # Shared SQL migrations
├── media/                   # Media protection
│   ├── watermark.service.ts # Image watermarking
│   ├── fingerprint.repository.ts
│   ├── media-protection.service.ts
│   └── README.md
└── middleware/              # Shared middleware
    ├── permission.middleware.ts
    └── permission.types.ts
```

## Frontend Applications (`frontend/`)

### Web Application (`frontend/web/`)

```
web/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── auth/            # Authentication components
│   │   ├── auctions/        # Auction-related components
│   │   ├── checkout/        # Checkout flow components
│   │   ├── layout/          # Layout components
│   │   ├── notifications/   # Notification components
│   │   ├── products/        # Product display components
│   │   ├── search/          # Search components
│   │   ├── seller/          # Seller dashboard components
│   │   └── wallet/          # Blockchain wallet components
│   ├── context/             # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── NotificationContext.tsx
│   │   ├── ToastContext.tsx
│   │   └── WalletContext.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useApiError.ts
│   │   ├── useInfiniteScroll.ts
│   │   ├── usePerformance.ts
│   │   └── useRateLimit.ts
│   ├── pages/               # Page components
│   │   ├── auth/            # Login, Register pages
│   │   ├── auctions/        # Auction pages
│   │   ├── cart/            # Cart and checkout pages
│   │   ├── products/        # Product pages
│   │   ├── rewards/         # Rewards pages
│   │   ├── seller/          # Seller dashboard pages
│   │   └── settings/        # Settings pages
│   ├── services/            # API service layer
│   │   ├── api.ts           # Axios instance
│   │   ├── auth.service.ts
│   │   ├── notification.service.ts
│   │   ├── rewards.service.ts
│   │   ├── seller.service.ts
│   │   └── wallet.service.ts
│   ├── utils/               # Utility functions
│   │   ├── errors.ts        # Error handling
│   │   ├── performance.ts   # Performance monitoring
│   │   ├── rateLimiter.ts   # Rate limiting
│   │   └── retry.ts         # Retry logic
│   ├── config/              # Configuration
│   │   └── sentry.ts        # Sentry setup
│   └── router/              # React Router setup
│       └── index.tsx
└── package.json
```

### Admin Dashboard (`frontend/admin-dashboard/`)

```
admin-dashboard/
├── src/
│   ├── components/
│   │   └── DashboardLayout.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── Analytics.tsx    # Analytics charts
│   │   ├── Reports.tsx      # Report generation
│   │   ├── Users.tsx        # User management
│   │   ├── UserDetail.tsx   # User details
│   │   ├── KYCManagement.tsx # KYC approval
│   │   ├── Disputes.tsx     # Dispute list
│   │   └── DisputeDetail.tsx # Dispute resolution
│   ├── services/
│   │   └── admin.service.ts
│   ├── config/
│   │   └── sentry.ts
│   └── App.tsx
└── package.json
```

### Mobile Application (`frontend/mobile/mnbara-app/`)

```
mnbara-app/
├── src/
│   ├── components/
│   │   ├── ErrorBoundary.tsx
│   │   └── notifications/
│   │       ├── InAppNotification.tsx
│   │       └── NotificationProvider.tsx
│   ├── hooks/
│   │   ├── useApiError.ts
│   │   ├── useLocationTracking.ts
│   │   ├── useNetworkStatus.ts
│   │   ├── usePushNotifications.ts
│   │   └── useRateLimit.ts
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── MainTabNavigator.tsx
│   │   ├── ProfileNavigator.tsx
│   │   └── TravelerNavigator.tsx
│   ├── screens/
│   │   ├── auth/            # Login, Register, MFA
│   │   ├── auctions/        # Auction screens
│   │   ├── home/            # Home screen
│   │   ├── notifications/   # Notification list
│   │   ├── onboarding/      # Consent screens
│   │   ├── orders/          # Checkout
│   │   ├── products/        # Product screens
│   │   ├── profile/         # Profile, Settings, KYC
│   │   ├── search/          # Search screen
│   │   └── traveler/        # Traveler features
│   ├── services/
│   │   ├── api.ts
│   │   ├── blockchain.ts
│   │   ├── pushNotifications.ts
│   │   ├── secureStorage.ts
│   │   └── websocket.ts
│   ├── store/
│   │   ├── authStore.tsx
│   │   ├── notificationStore.ts
│   │   └── travelerStore.ts
│   ├── utils/
│   │   ├── errors.ts
│   │   ├── offlineQueue.ts
│   │   ├── performance.ts
│   │   ├── rateLimiter.ts
│   │   └── retry.ts
│   └── config/
│       └── sentry.ts
├── App.tsx
└── package.json
```

## Infrastructure (`infrastructure/`)

### Kubernetes (`infrastructure/k8s/mnbara/`)

```
mnbara/
├── Chart.yaml               # Helm chart metadata
├── values.yaml              # Default values
├── values-dev.yaml          # Development overrides
├── values-staging.yaml      # Staging overrides
├── values-prod.yaml         # Production overrides
└── templates/
    ├── _helpers.tpl         # Template helpers
    ├── namespace.yaml       # Namespace definition
    ├── serviceaccount.yaml  # Service account
    ├── configmap.yaml       # Common configuration
    ├── secrets.yaml         # Secret templates
    ├── ingress.yaml         # Ingress rules
    ├── networkpolicy.yaml   # Network policies
    ├── pdb.yaml             # Pod disruption budgets
    ├── resourcequota.yaml   # Resource quotas
    ├── priorityclass.yaml   # Priority classes
    ├── servicemonitor.yaml  # Prometheus monitors
    └── [service]/           # Per-service templates
        ├── deployment.yaml
        ├── service.yaml
        └── hpa.yaml
```

## Smart Contracts (`contracts/`)

| Contract | Description |
|----------|-------------|
| `MNBToken.sol` | ERC-20 MNB token |
| `MNBExchange.sol` | Token exchange for payments |
| `MNBAuctionEscrow.sol` | Auction escrow management |
| `MNBStaking.sol` | Token staking rewards |
| `MNBGovernance.sol` | DAO governance |
| `MNBWallet.sol` | Multi-signature wallet |

## CI/CD Workflows (`.github/workflows/`)

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR | Lint, test, security scan |
| `deploy.yml` | Push to main | Deploy to staging/production |
| `release.yml` | Tag push | Production release |
| `pr-check.yml` | PR | Targeted PR validation |
| `codeql.yml` | Schedule | Security analysis |

## Documentation (`docs/`)

```
docs/
├── api/                     # API documentation
├── architecture/            # Architecture diagrams
├── database/                # Database schemas
│   ├── DATABASE_SCHEMA.md
│   └── complete_schema.sql
├── deployment/              # Deployment guides
├── payments/                # Payment integration docs
└── security/                # Security documentation
    └── TDE_SETUP_GUIDE.md
```

## Key Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Root dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |
| `.eslintrc.json` | ESLint rules |
| `hardhat.config.js` | Hardhat for smart contracts |
| `docker-compose.yml` | Local development services |
| `.env.example` | Environment variable template |

## Adding New Features

1. **New Backend Service**: Create in `backend/services/`, add Helm templates
2. **New Frontend Page**: Add to appropriate `pages/` directory
3. **New API Endpoint**: Update service, add route, update gateway
4. **New Database Table**: Create Prisma migration, update schema
5. **New Smart Contract**: Add to `contracts/`, update deployment scripts
