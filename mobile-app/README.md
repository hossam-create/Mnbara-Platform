# Mnbara Mobile App - React Native

## Project Overview

Mnbara is a crowdshipping platform mobile app connecting shoppers with travelers for international package delivery.

### Technology Stack
- **Framework**: React Native 0.75+ (Cross-platform iOS & Android)
- **Language**: TypeScript 5.x
- **Navigation**: React Navigation 6.x
- **State Management**: Redux Toolkit
- **API Client**: Axios + React Query
- **Maps**: react-native-maps + Mapbox
- **Real-time**: Socket.IO

## Project Structure

```
mobile-app/
├── src/
│   ├── components/           # Reusable UI components
│   ├── config/               # App configuration
│   ├── core/                 # Core utilities, hooks, services
│   ├── domain/               # Domain entities and interfaces
│   │   └── entities/         # Domain models (User, Delivery, Trip, etc.)
│   ├── features/             # Feature modules
│   │   └── auth/             # Authentication feature
│   │       ├── screens/      # Auth screens
│   │       └── store/        # Auth Redux slice
│   ├── navigation/           # Navigation configuration
│   ├── store/                # Redux store
│   └── theme/                # Theme system
├── package.json
└── tsconfig.json
```

## Quick Start

### Prerequisites
- Node.js 18+
- React Native CLI
- Xcode (iOS)
- Android Studio (Android)

### Installation

```bash
# Navigate to mobile app directory
cd mobile-app

# Install dependencies
npm install

# Install iOS pods (if developing for iOS)
cd ios && pod install && cd ..

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Environment Setup

### Development
```bash
cp .env.example .env.development
# Edit .env.development with your API keys
```

### Staging
```bash
cp .env.example .env.staging
# Edit .env.staging with staging API keys
```

### Production
```bash
cp .env.example .env.production
# Edit .env.production with production API keys
```

## Key Features Implemented

### Phase 1: Authentication (In Progress)
- [x] Splash Screen
- [x] Onboarding Screens (3 slides)
- [x] Login Screen
- [x] Registration Screen
- [ ] OTP Verification
- [ ] Profile Setup
- [ ] Forgot Password

### Phase 2: Core Screens (Planned)
- Home Screens (Shopper & Traveler)
- Delivery Management
- Trip Management
- Matching & Search
- Real-time Tracking
- In-app Messaging
- Wallet & Payments

## Configuration Files

### Required API Keys
- Firebase (Auth, Messaging, Analytics)
- Google Maps SDK
- Stripe (Payments)
- Socket.IO Server URL
- Backend API URL

## Scripts

```bash
# Development
npm run android:dev    # Android development build
npm run ios:dev       # iOS development build

# Staging
npm run android:staging
npm run ios:staging

# Production Release
npm run android:release
npm run ios:release

# Testing
npm test              # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format with Prettier
```

## Architecture

The app follows Clean Architecture principles:

1. **Presentation Layer**: React Native screens, components, hooks
2. **Domain Layer**: Business logic, entities, use cases
3. **Data Layer**: Repository implementations, API clients
4. **Infrastructure Layer**: External services, storage

## State Management

Redux Toolkit is used for global state:
- Auth state (user, tokens, session)
- Delivery state
- Trip state
- Chat state
- App settings state

## API Integration

The app integrates with existing Mnbara backend services:
- `auth-service`: Authentication
- `crowdship-service`: Delivery management
- `trips-service`: Trip management
- `location-service`: Geolocation
- `payment-service`: Payments
- `chat-service`: Messaging

## Next Steps

1. Complete Phase 1 authentication screens
2. Implement Phase 2 core screens
3. Add real-time features (Socket.IO)
4. Integrate maps and location services
5. Implement payment flow
6. Add push notifications
7. Complete testing and polish

## Documentation

- Architecture Plan: `plans/PHASE_6_MOBILE_APP_ARCHITECTURE.md`
- API Documentation: Backend service READMEs
- Testing Guide: `__tests__/README.md`

---

**Version**: 1.0.0
**Last Updated**: 2026-02-06
