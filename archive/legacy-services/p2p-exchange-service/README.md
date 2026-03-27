# P2P Exchange Service

**Model**: Marketplace + Netting WITHOUT Custody

## Overview

The P2P Exchange Service enables peer-to-peer currency exchange where users exchange currencies directly with each other. The platform acts ONLY as:
- **Marketplace** (matching buyers and sellers)
- **Trust Intermediary** (reputation, verification, dispute resolution)
- **Orchestrator** (coordinating with licensed PSPs)

**Critical Constraint**: Platform NEVER holds customer funds. Licensed PSPs do.

## Features

### Core Features
- ✅ Exchange request creation and management
- ✅ Automatic matching engine (runs every 30 seconds)
- ✅ Manual offer acceptance
- ✅ Internal netting for small amounts (< $300)
- ✅ External escrow for large amounts (> $1000)
- ✅ Real-time FX rates from OpenExchangeRates
- ✅ Settlement coordination with PSPs

### Seven-Layer Anti-Scam Architecture
1. **Security Deposit** - Mandatory balance before creating requests
2. **Progressive Trust Levels** - Transaction limits based on history
3. **Proof of Payment** - Photo + video + metadata required
4. **Time-Locked Flow** - Automatic timeouts and escalation
5. **No External Communication** - In-platform chat only
6. **One-Way Identity Anchor** - Device fingerprinting, IP tracking
7. **Real Arbitration** - 48-hour SLA, permanent bans

### Dual-Layer Guarantee Model
- **Small/Medium (< $300)**: Internal netting only
- **Medium/Large ($300-$1000)**: Warning + optional external escrow
- **Large (> $1000)**: Mandatory external escrow provider

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    P2P Exchange Service                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Exchange     │  │ Matching     │  │ Settlement   │         │
│  │ Manager      │  │ Engine       │  │ Coordinator  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Existing Services (REUSE)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Internal     │  │ Trust &      │  │ User         │         │
│  │ Ledger       │  │ Safety       │  │ Service      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- OpenExchangeRates API key
- Tatum.io API key (recommended)

### Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Setup database:
```bash
npm run prisma:migrate
npm run prisma:generate
```

4. Start development server:
```bash
npm run dev
```

## API Endpoints

### Exchange Requests
- `POST /api/v1/exchange/requests` - Create exchange request
- `GET /api/v1/exchange/requests/:id` - Get request details
- `GET /api/v1/exchange/requests` - Get user's requests
- `DELETE /api/v1/exchange/requests/:id` - Cancel request

### Marketplace
- `GET /api/v1/exchange/marketplace` - Browse available offers
- `POST /api/v1/exchange/marketplace/:requestId/accept` - Accept offer

### Matches
- `GET /api/v1/exchange/matches/:id` - Get match details
- `POST /api/v1/exchange/matches/:id/initiate-payment` - Initiate payment
- `POST /api/v1/exchange/matches/:id/upload-proof` - Upload proof
- `POST /api/v1/exchange/matches/:id/confirm-receipt` - Confirm receipt

### Security & Trust
- `GET /api/v1/exchange/security-deposit` - Get security deposit
- `POST /api/v1/exchange/security-deposit/add` - Add to deposit
- `GET /api/v1/exchange/trust-level` - Get trust level
- `GET /api/v1/exchange/external-escrow-providers` - Get providers

### Admin
- `GET /api/v1/admin/exchange/requests` - Get all requests
- `GET /api/v1/admin/exchange/proofs/pending` - Get pending proofs
- `POST /api/v1/admin/exchange/proofs/:id/verify` - Verify proof

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Deployment

```bash
# Build for production
npm run build

# Run production server
npm start
```

## Revenue Model

- **P2P FX Matching**: 0.5% - 1.5% (split between both users)
  - Small amounts (< $300): 1.5%
  - Medium amounts ($300 - $1000): 1.0%
  - Large amounts (> $1000): 0.5%
- **Protection Fee**: $2-5 fixed (for security deposit management)
- **Urgent Matching**: +0.5% (for priority matching)
- **Dispute Handling**: $25 (charged to losing party)

## Success Metrics

### Technical
- 99.9% uptime for matching engine
- < 5 second match time
- < 1% failed settlements
- Zero security breaches

### Business
- $1M exchange volume by Month 3
- $10K platform revenue by Month 3
- 1000 active users by Month 3
- < 5% dispute rate

## License

MIT
