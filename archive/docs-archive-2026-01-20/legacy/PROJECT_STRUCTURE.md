# MNBARH Platform - Project Structure Documentation

## Overview

This document provides a comprehensive overview of the MNBARH platform project structure, explaining the purpose of each directory and key files.

## Root Directory

```
mnbarh-platform/
â”œâ”€â”€ .github/                 # GitHub configuration and CI/CD
â”œâ”€â”€ .kiro/                   # Kiro IDE specifications
â”œâ”€â”€ backend/                 # Backend microservices
â”œâ”€â”€ contracts/               # Solidity smart contracts
â”œâ”€â”€ docs/                    # Documentation
â”œâ”€â”€ frontend/                # Frontend applications
â”œâ”€â”€ infrastructure/          # Infrastructure as Code
â”œâ”€â”€ scripts/                 # Utility scripts
â”œâ”€â”€ monitoring/              # Monitoring configuration
â””â”€â”€ [config files]           # Root configuration files
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
â”œâ”€â”€ audit/                   # Audit logging service
â”‚   â”œâ”€â”€ audit.service.ts     # Core audit functionality
â”‚   â”œâ”€â”€ audit.middleware.ts  # Express middleware
â”‚   â””â”€â”€ README.md
â”œâ”€â”€ database/                # Database utilities
â”‚   â”œâ”€â”€ encryption.config.ts # Encryption configuration
â”‚   â”œâ”€â”€ prisma-encryption.middleware.ts
â”‚   â””â”€â”€ migrations/          # Shared SQL migrations
â”œâ”€â”€ media/                   # Media protection
â”‚   â”œâ”€â”€ watermark.service.ts # Image watermarking
â”‚   â”œâ”€â”€ fingerprint.repository.ts
â”‚   â”œâ”€â”€ media-protection.service.ts
â”‚   â””â”€â”€ README.md
â””â”€â”€ middleware/              # Shared middleware
    â”œâ”€â”€ permission.middleware.ts
    â””â”€â”€ permission.types.ts
```

## Frontend Applications (`frontend/`)

### Web Application (`frontend/web/`)

```
web/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ components/          # Reusable UI components
â”‚   â”‚   â”œâ”€â”€ auth/            # Authentication components
â”‚   â”‚   â”œâ”€â”€ auctions/        # Auction-related components
â”‚   â”‚   â”œâ”€â”€ checkout/        # Checkout flow components
â”‚   â”‚   â”œâ”€â”€ layout/          # Layout components
â”‚   â”‚   â”œâ”€â”€ notifications/   # Notification components
â”‚   â”‚   â”œâ”€â”€ products/        # Product display components
â”‚   â”‚   â”œâ”€â”€ search/          # Search components
â”‚   â”‚   â”œâ”€â”€ seller/          # Seller dashboard components
â”‚   â”‚   â””â”€â”€ wallet/          # Blockchain wallet components
â”‚   â”œâ”€â”€ context/             # React contexts
â”‚   â”‚   â”œâ”€â”€ AuthContext.tsx
â”‚   â”‚   â”œâ”€â”€ NotificationContext.tsx
â”‚   â”‚   â”œâ”€â”€ ToastContext.tsx
â”‚   â”‚   â””â”€â”€ WalletContext.tsx
â”‚   â”œâ”€â”€ hooks/               # Custom React hooks
â”‚   â”‚   â”œâ”€â”€ useApiError.ts
â”‚   â”‚   â”œâ”€â”€ useInfiniteScroll.ts
â”‚   â”‚   â”œâ”€â”€ usePerformance.ts
â”‚   â”‚   â””â”€â”€ useRateLimit.ts
â”‚   â”œâ”€â”€ pages/               # Page components
â”‚   â”‚   â”œâ”€â”€ auth/            # Login, Register pages
â”‚   â”‚   â”œâ”€â”€ auctions/        # Auction pages
â”‚   â”‚   â”œâ”€â”€ cart/            # Cart and checkout pages
â”‚   â”‚   â”œâ”€â”€ products/        # Product pages
â”‚   â”‚   â”œâ”€â”€ rewards/         # Rewards pages
â”‚   â”‚   â”œâ”€â”€ seller/          # Seller dashboard pages
â”‚   â”‚   â””â”€â”€ settings/        # Settings pages
â”‚   â”œâ”€â”€ services/            # API service layer
â”‚   â”‚   â”œâ”€â”€ api.ts           # Axios instance
â”‚   â”‚   â”œâ”€â”€ auth.service.ts
â”‚   â”‚   â”œâ”€â”€ notification.service.ts
â”‚   â”‚   â”œâ”€â”€ rewards.service.ts
â”‚   â”‚   â”œâ”€â”€ seller.service.ts
â”‚   â”‚   â””â”€â”€ wallet.service.ts
â”‚   â”œâ”€â”€ utils/               # Utility functions
â”‚   â”‚   â”œâ”€â”€ errors.ts        # Error handling
â”‚   â”‚   â”œâ”€â”€ performance.ts   # Performance monitoring
â”‚   â”‚   â”œâ”€â”€ rateLimiter.ts   # Rate limiting
â”‚   â”‚   â””â”€â”€ retry.ts         # Retry logic
â”‚   â”œâ”€â”€ config/              # Configuration
â”‚   â”‚   â””â”€â”€ sentry.ts        # Sentry setup
â”‚   â””â”€â”€ router/              # React Router setup
â”‚       â””â”€â”€ index.tsx
â””â”€â”€ package.json
```

### Admin Dashboard (`frontend/admin-dashboard/`)

```
admin-dashboard/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â””â”€â”€ DashboardLayout.tsx
â”‚   â”œâ”€â”€ pages/
â”‚   â”‚   â”œâ”€â”€ Dashboard.tsx    # Main dashboard
â”‚   â”‚   â”œâ”€â”€ Analytics.tsx    # Analytics charts
â”‚   â”‚   â”œâ”€â”€ Reports.tsx      # Report generation
â”‚   â”‚   â”œâ”€â”€ Users.tsx        # User management
â”‚   â”‚   â”œâ”€â”€ UserDetail.tsx   # User details
â”‚   â”‚   â”œâ”€â”€ KYCManagement.tsx # KYC approval
â”‚   â”‚   â”œâ”€â”€ Disputes.tsx     # Dispute list
â”‚   â”‚   â””â”€â”€ DisputeDetail.tsx # Dispute resolution
â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â””â”€â”€ admin.service.ts
â”‚   â”œâ”€â”€ config/
â”‚   â”‚   â””â”€â”€ sentry.ts
â”‚   â””â”€â”€ App.tsx
â””â”€â”€ package.json
```

### Mobile Application (`frontend/mobile/mnbarh-app/`)

```
mnbarh-app/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ ErrorBoundary.tsx
â”‚   â”‚   â””â”€â”€ notifications/
â”‚   â”‚       â”œâ”€â”€ InAppNotification.tsx
â”‚   â”‚       â””â”€â”€ NotificationProvider.tsx
â”‚   â”œâ”€â”€ hooks/
â”‚   â”‚   â”œâ”€â”€ useApiError.ts
â”‚   â”‚   â”œâ”€â”€ useLocationTracking.ts
â”‚   â”‚   â”œâ”€â”€ useNetworkStatus.ts
â”‚   â”‚   â”œâ”€â”€ usePushNotifications.ts
â”‚   â”‚   â””â”€â”€ useRateLimit.ts
â”‚   â”œâ”€â”€ navigation/
â”‚   â”‚   â”œâ”€â”€ RootNavigator.tsx
â”‚   â”‚   â”œâ”€â”€ AuthNavigator.tsx
â”‚   â”‚   â”œâ”€â”€ MainTabNavigator.tsx
â”‚   â”‚   â”œâ”€â”€ ProfileNavigator.tsx
â”‚   â”‚   â””â”€â”€ TravelerNavigator.tsx
â”‚   â”œâ”€â”€ screens/
â”‚   â”‚   â”œâ”€â”€ auth/            # Login, Register, MFA
â”‚   â”‚   â”œâ”€â”€ auctions/        # Auction screens
â”‚   â”‚   â”œâ”€â”€ home/            # Home screen
â”‚   â”‚   â”œâ”€â”€ notifications/   # Notification list
â”‚   â”‚   â”œâ”€â”€ onboarding/      # Consent screens
â”‚   â”‚   â”œâ”€â”€ orders/          # Checkout
â”‚   â”‚   â”œâ”€â”€ products/        # Product screens
â”‚   â”‚   â”œâ”€â”€ profile/         # Profile, Settings, KYC
â”‚   â”‚   â”œâ”€â”€ search/          # Search screen
â”‚   â”‚   â””â”€â”€ traveler/        # Traveler features
â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â”œâ”€â”€ api.ts
â”‚   â”‚   â”œâ”€â”€ blockchain.ts
â”‚   â”‚   â”œâ”€â”€ pushNotifications.ts
â”‚   â”‚   â”œâ”€â”€ secureStorage.ts
â”‚   â”‚   â””â”€â”€ websocket.ts
â”‚   â”œâ”€â”€ store/
â”‚   â”‚   â”œâ”€â”€ authStore.tsx
â”‚   â”‚   â”œâ”€â”€ notificationStore.ts
â”‚   â”‚   â””â”€â”€ travelerStore.ts
â”‚   â”œâ”€â”€ utils/
â”‚   â”‚   â”œâ”€â”€ errors.ts
â”‚   â”‚   â”œâ”€â”€ offlineQueue.ts
â”‚   â”‚   â”œâ”€â”€ performance.ts
â”‚   â”‚   â”œâ”€â”€ rateLimiter.ts
â”‚   â”‚   â””â”€â”€ retry.ts
â”‚   â””â”€â”€ config/
â”‚       â””â”€â”€ sentry.ts
â”œâ”€â”€ App.tsx
â””â”€â”€ package.json
```

## Infrastructure (`infrastructure/`)

### Kubernetes (`infrastructure/k8s/mnbarh/`)

```
mnbarh/
â”œâ”€â”€ Chart.yaml               # Helm chart metadata
â”œâ”€â”€ values.yaml              # Default values
â”œâ”€â”€ values-dev.yaml          # Development overrides
â”œâ”€â”€ values-staging.yaml      # Staging overrides
â”œâ”€â”€ values-prod.yaml         # Production overrides
â””â”€â”€ templates/
    â”œâ”€â”€ _helpers.tpl         # Template helpers
    â”œâ”€â”€ namespace.yaml       # Namespace definition
    â”œâ”€â”€ serviceaccount.yaml  # Service account
    â”œâ”€â”€ configmap.yaml       # Common configuration
    â”œâ”€â”€ secrets.yaml         # Secret templates
    â”œâ”€â”€ ingress.yaml         # Ingress rules
    â”œâ”€â”€ networkpolicy.yaml   # Network policies
    â”œâ”€â”€ pdb.yaml             # Pod disruption budgets
    â”œâ”€â”€ resourcequota.yaml   # Resource quotas
    â”œâ”€â”€ priorityclass.yaml   # Priority classes
    â”œâ”€â”€ servicemonitor.yaml  # Prometheus monitors
    â””â”€â”€ [service]/           # Per-service templates
        â”œâ”€â”€ deployment.yaml
        â”œâ”€â”€ service.yaml
        â””â”€â”€ hpa.yaml
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
â”œâ”€â”€ api/                     # API documentation
â”œâ”€â”€ architecture/            # Architecture diagrams
â”œâ”€â”€ database/                # Database schemas
â”‚   â”œâ”€â”€ DATABASE_SCHEMA.md
â”‚   â””â”€â”€ complete_schema.sql
â”œâ”€â”€ deployment/              # Deployment guides
â”œâ”€â”€ payments/                # Payment integration docs
â””â”€â”€ security/                # Security documentation
    â””â”€â”€ TDE_SETUP_GUIDE.md
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

