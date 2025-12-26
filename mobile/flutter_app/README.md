# Mnbara - منبره

Saudi Arabia's Premier E-Commerce Marketplace Mobile App

## Features

- 🛒 Full e-commerce functionality (browse, cart, checkout)
- 🔐 Secure authentication (Email, Google, Apple, Facebook)
- 💳 Stripe payment integration
- 🌍 Bilingual support (Arabic & English)
- 🌙 Dark mode support
- 📱 Push notifications via Firebase
- 🗺️ Google Maps integration for addresses
- 👤 User profiles and order management
- 🏪 Seller dashboard and listings management
- ❤️ Wishlist functionality
- 🔍 Advanced search and filtering

## Tech Stack

- **Framework**: Flutter 3.2+
- **State Management**: Riverpod
- **Navigation**: GoRouter
- **Network**: Dio
- **Storage**: Hive, Flutter Secure Storage
- **Payments**: Stripe
- **Auth**: Firebase Auth, Google Sign-In, Apple Sign-In
- **Notifications**: Firebase Cloud Messaging
- **Analytics**: Firebase Analytics
- **Maps**: Google Maps Flutter

## Getting Started

### Prerequisites

- Flutter SDK 3.2+
- Dart SDK 3.2+
- Android Studio / Xcode
- Firebase project setup
- Stripe account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   flutter pub get
   ```

3. Configure environment:
   - Update `lib/core/config/app_config.dart` with your API keys
   - Add `google-services.json` to `android/app/`
   - Add `GoogleService-Info.plist` to `ios/Runner/`

4. Run the app:
   ```bash
   flutter run
   ```

## Project Structure

```
lib/
├── core/
│   ├── config/          # App configuration
│   ├── l10n/            # Localization
│   ├── network/         # API client
│   ├── router/          # Navigation
│   └── theme/           # App theme
├── features/
│   ├── auth/            # Authentication
│   ├── cart/            # Shopping cart
│   ├── categories/      # Product categories
│   ├── checkout/        # Checkout flow
│   ├── home/            # Home screen
│   ├── notifications/   # Push notifications
│   ├── onboarding/      # Onboarding screens
│   ├── orders/          # Order management
│   ├── products/        # Product listing & details
│   ├── profile/         # User profile
│   ├── search/          # Search functionality
│   ├── seller/          # Seller dashboard
│   ├── settings/        # App settings
│   └── wishlist/        # Wishlist
└── shared/
    └── widgets/         # Reusable widgets
```

## Building for Production

### Android

```bash
flutter build appbundle --release
```

### iOS

```bash
flutter build ipa --release
```

## Configuration

### Firebase Setup

1. Create a Firebase project
2. Enable Authentication (Email, Google, Apple)
3. Enable Cloud Messaging
4. Download and add config files

### Stripe Setup

1. Create a Stripe account
2. Get publishable and secret keys
3. Update `app_config.dart`

### Google Maps Setup

1. Enable Maps SDK in Google Cloud Console
2. Get API key
3. Add to `AndroidManifest.xml` and `Info.plist`

## License

Copyright © 2024 Mnbara. All rights reserved.
