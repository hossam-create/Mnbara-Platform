# Loyalty & Rewards Service

Complete loyalty management system for the Mnbara e-commerce platform.

## Features

### 1. Points System
- **Earn Points**: Purchase rewards, reviews, referrals, daily logins
- **Redeem Points**: Convert to wallet balance or discounts
- **Points Expiration**: Automatic expiration after 12 months
- **Point Transfers**: Send points to other users

### 2. Gamification
- **Tier System**: Bronze → Silver → Gold → Platinum
- **Achievements/Badges**: 20+ unlockable achievements
- **Leaderboards**: Weekly, monthly, and all-time rankings
- **Progress Tracking**: Real-time progress to next tier

### 3. Partnerships
- **Partner Network**: Manage partner integrations
- **Partner Offers**: Discounts at partner locations
- **Cross-platform Earnings**: Earn points from partner purchases
- **API Integration**: Webhook support for partner systems

### 4. Special Offers
- **Campaign Management**: Create bonus point campaigns
- **Promo Codes**: Time-limited offers with usage limits
- **Tier Targeting**: Offer exclusive deals by tier
- **Analytics**: Track offer performance

## Quick Start

### Installation
```bash
cd backend/services/rewards-service
npm install
```

### Environment Setup
```bash
# Configure environment variables
cp .env.example .env
# Edit .env with your database and Redis credentials
```

### Database Setup
```bash
# Run migrations
npx prisma migrate dev --name loyalty_initial

# Generate Prisma client
npx prisma generate

# Open Prisma Studio (optional)
npx prisma studio
```

### Start Service
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Balance & Account
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/loyalty/balance/:userId` | Get user's loyalty balance |
| GET | `/api/loyalty/tier/:userId` | Get tier progress |
| GET | `/api/loyalty/expiring/:userId` | Get points expiring soon |

### Points Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/loyalty/earn` | Earn points for action |
| POST | `/api/loyalty/redeem` | Redeem points |
| POST | `/api/loyalty/transfer` | Transfer points to user |
| GET | `/api/loyalty/history/:userId` | Transaction history |

### Gamification
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/loyalty/achievements/:userId` | Get user achievements |
| GET | `/api/loyalty/leaderboard` | Get leaderboard |
| GET | `/api/loyalty/rank/:userId` | Get user's rank |

### Partners
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/loyalty/partners` | List partners |
| GET | `/api/loyalty/partners/:slug` | Get partner details |
| POST | `/api/loyalty/partners/earn` | Earn from partner |
| POST | `/api/loyalty/partners/:partnerId/redeem` | Redeem offer |

### Special Offers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/loyalty/offers` | Get active offers |
| POST | `/api/loyalty/offers/validate` | Validate promo code |
| POST | `/api/loyalty/offers/use` | Use special offer |

### Admin Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/loyalty/admin/process-expirations` | Process point expirations |
| POST | `/api/loyalty/admin/init-achievements` | Initialize achievements |
| POST | `/api/loyalty/admin/init-tiers` | Initialize tiers |

## Configuration

### Points Configuration
```typescript
// Points earned per action
PURCHASE: 10 points per $1
FIRST_ORDER: 500 bonus points
REVIEW: 50 points
REFERRAL_SIGNUP: 100 points
REFERRAL_PURCHASE: 200 points
DAILY_LOGIN: 5 points
PROFILE_COMPLETE: 50 points
```

### Tier Thresholds
| Tier | Lifetime Points Required | Multiplier |
|------|------------------------|------------|
| Bronze | 0 | 1.0x |
| Silver | 5,000 | 1.25x |
| Gold | 20,000 | 1.5x |
| Platinum | 50,000 | 2.0x |

### Expiration Settings
- Points expire 12 months after earning
- Notification sent 30 days before expiration
- Automatic processing via daily cron job

## Architecture

```
backend/services/rewards-service/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── index.ts               # Express app entry point
│   ├── controllers/
│   │   └── loyalty.controller.ts
│   ├── routes/
│   │   └── loyalty.routes.ts
│   └── services/
│       ├── loyalty.service.ts        # Core loyalty logic
│       ├── gamification.service.ts   # Achievements & leaderboards
│       ├── partner.service.ts        # Partner management
│       └── special-offers.service.ts # Campaign management
├── package.json
└── tsconfig.json
```

## Database Models

### LoyaltyAccount
User's loyalty account with balance and tier info

### LoyaltyTransaction
All point earning and redemption transactions

### Achievement
Predefined achievements users can unlock

### UserAchievement
User's unlocked achievements

### Partner
Partner organizations in the network

### SpecialOffer
Promotional campaigns and promo codes

## Integration with Other Services

### Order Service
When an order is completed:
```typescript
POST /api/loyalty/earn
{
  "userId": "user123",
  "action": "PURCHASE",
  "amount": 100.00,
  "referenceType": "ORDER",
  "referenceId": "order456"
}
```

### Wallet Service
When redeeming to wallet:
```typescript
POST /api/loyalty/redeem
{
  "userId": "user123",
  "points": 5000,
  "redemptionType": "WALLET"
}
```

### Notification Service
Point expiration reminders are sent 30 days before expiration.

## Scheduled Jobs

1. **Daily at Midnight**: Process point expirations
2. **On Startup**: Initialize achievements and tiers

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## Production Deployment

### Docker
```bash
docker build -t mnbara-loyalty-service .
docker run -p 3008:3008 mnbara-loyalty-service
```

### Kubernetes
See `k8s/` directory for deployment manifests.

## License

Mnbara Platform - All rights reserved
