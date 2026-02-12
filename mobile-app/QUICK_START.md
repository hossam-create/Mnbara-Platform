# Mnbara Mobile App - Quick Start Guide

## Prerequisites

Before starting, ensure you have:
- Node.js 18+ installed
- npm or yarn package manager
- Git for version control
- VS Code or similar IDE
- iOS: Xcode 14+ (for iOS development)
- Android: Android Studio with SDK 33+ (for Android development)

---

## Installation Steps

### 1. Install Dependencies

```bash
cd mobile-app
npm install
```

This will install all dependencies defined in [`package.json`](package.json) including:
- React Native 0.75.0
- React Navigation 6.x
- Redux Toolkit
- Firebase
- Socket.IO Client
- And all other required packages

### 2. iOS Setup

```bash
cd ios
pod install
cd ..
```

Then open the project in Xcode:
```bash
open ios/mnbara.xcworkspace
```

### 3. Android Setup

```bash
cd android
./gradlew clean
cd ..
```

Then open the project in Android Studio:
```bash
open android
```

---

## Running the App

### Development Mode

**iOS:**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

### With Metro Bundler

If Metro bundler is not running:
```bash
npm start
```

---

## Environment Configuration

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with your configuration:

```env
# API Configuration
API_BASE_URL=https://api.mnbara.com/v1
SOCKET_URL=wss://socket.mnbara.com

# Firebase
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=mnbara.firebaseapp.com
FIREBASE_PROJECT_ID=mnbara-xxx
FIREBASE_STORAGE_BUCKET=mnbara-xxx.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Google Maps
GOOGLE_MAPS_IOS_API_KEY=your_ios_api_key
GOOGLE_MAPS_ANDROID_API_KEY=your_android_api_key

# App Configuration
APP_ENV=development
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

---

## Project Structure Overview

```
mobile-app/
├── src/
│   ├── components/           # Reusable UI components
│   ├── config/              # App configuration
│   ├── core/                # Core utilities & services
│   ├── domain/              # Domain entities & business logic
│   ├── features/            # Feature-based modules
│   │   ├── auth/          # Authentication feature ✅
│   │   ├── home/          # Home screens
│   │   ├── delivery/       # Delivery management
│   │   ├── trips/          # Trip management
│   │   ├── matching/       # Traveler matching
│   │   ├── chat/          # Messaging
│   │   ├── profile/        # User profile
│   │   ├── wallet/         # Wallet & payments
│   │   └── notifications/   # Push notifications
│   ├── navigation/          # Navigation setup ✅
│   ├── store/              # Redux store ✅
│   └── theme/             # Theme system ✅
├── android/               # Android native code
├── ios/                   # iOS native code
├── .env                   # Environment variables
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
└── (config files)        # Babel, Metro, etc.
```

---

## Current Implementation Status

### ✅ Completed (Phase 1 - Authentication & Navigation)

1. **Navigation System**
   - ✅ AuthNavigator - Authentication flow
   - ✅ MainNavigator - Bottom tab navigation
   - ✅ AppNavigator - Root navigation
   - ✅ Navigation types defined

2. **Authentication Screens**
   - ✅ SplashScreen - App launch screen
   - ✅ OnboardingScreen - 3-slide intro
   - ✅ LoginScreen - Email/password login
   - ✅ RegisterScreen - User registration
   - ✅ ForgotPasswordScreen - Password reset
   - ✅ OTPVerificationScreen - Code verification
   - ✅ ProfileSetupScreen - Profile completion

3. **State Management**
   - ✅ Redux store configured
   - ✅ Auth slice with actions/selectors
   - ✅ Redux Persist for data persistence

4. **Theme System**
   - ✅ Color palette
   - ✅ Typography styles
   - ✅ Spacing constants
   - ✅ Shadow styles

### 🚧 In Progress

- [ ] Common UI components (Button, Input, Card, etc.)
- [ ] App.tsx entry point
- [ ] Configuration files (babel, metro, react-native.config)

### ⏳ To Be Implemented

See [`IMPLEMENTATION_PROGRESS.md`](IMPLEMENTATION_PROGRESS.md) for detailed roadmap.

---

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/feature-name
```

### 2. Make Changes

- Edit/create files
- Test changes
- Commit frequently

### 3. Test Changes

```bash
# iOS
npm run ios

# Android
npm run android
```

### 4. Commit Changes

```bash
git add .
git commit -m "feat: add feature description"
```

### 5. Push and Create PR

```bash
git push origin feature/feature-name
# Create pull request on GitHub/GitLab
```

---

## Common Issues & Solutions

### Issue: Metro bundler not starting

**Solution:**
```bash
npm start -- --reset-cache
```

### Issue: iOS build fails

**Solution:**
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

### Issue: Android build fails

**Solution:**
```bash
cd android
./gradlew clean
./gradlew build
```

### Issue: TypeScript errors

**Solution:**
```bash
npm install
# Restart TypeScript server in VS Code
```

---

## Testing

### Run Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:coverage
```

---

## Building for Production

### iOS

```bash
npm run ios:release
```

### Android

```bash
npm run android:release
```

---

## Useful Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Build iOS release
npm run build:ios:release

# Build Android release
npm run build:android:release
```

---

## Documentation

- [Architecture Plan](../plans/PHASE_6_MOBILE_APP_ARCHITECTURE.md)
- [Implementation Progress](IMPLEMENTATION_PROGRESS.md)
- [API Documentation](../backend/API_DOCUMENTATION.md) (if available)

---

## Support

For issues or questions:
1. Check the [Architecture Plan](../plans/PHASE_6_MOBILE_APP_ARCHITECTURE.md)
2. Review [Implementation Progress](IMPLEMENTATION_PROGRESS.md)
3. Check existing backend services for API integration
4. Refer to React Native documentation

---

**Last Updated**: 2026-02-06
**Version**: 1.0.0
