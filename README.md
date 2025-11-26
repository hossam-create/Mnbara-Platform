# Mnbara Marketplace Platform

Modern microservices-based marketplace platform with auction capabilities, built on AWS.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- AWS Account (for deployment)

### Local Development

```bash
# Install dependencies
npm install

# Start all services with Docker
npm run dev

# Or run individual services
npm run dev:auth
npm run dev:listing
npm run dev:auction
npm run dev:payment
```
mnbara-platform/
├── services/
│   ├── auth-service/          # Authentication microservice
│   ├── listing-service/       # Listing management
│   ├── auction-service/       # Auction & bidding
│   ├── payment-service/       # Payment processing
│   ├── crowdship-service/     # Crowdshipping
│   └── notification-service/  # Notifications
├── mobile/
│   └── mnbara-app/           # React Native mobile app
├── shared/
│   ├── types/                # Shared TypeScript types
│   └── utils/                # Shared utilities
├── infrastructure/
│   └── terraform/            # AWS infrastructure
└── docker-compose.yml
```

## 🛠️ Technology Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Redis
- **Mobile**: React Native
- **Cloud**: AWS (ECS, RDS, S3, Cognito)
- **Payments**: Stripe + PayPal

## 📱 Mobile App

```bash
cd mobile/mnbara-app
npm install
npm run ios     # iOS
npm run android # Android
```

## 🧪 Testing

```bash
npm run test
```

## 📦 Deployment

See [infrastructure/README.md](infrastructure/README.md) for AWS deployment instructions.

## 📄 License

Proprietary - All Rights Reserved
