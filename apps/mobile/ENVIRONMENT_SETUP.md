# Environment Configuration Guide - Mnbara Mobile App

## Overview

The Mnbara mobile application uses environment variables to configure API endpoints, third-party services, and app-specific settings. This guide explains how to set up and manage environment variables for different deployment environments.

## Environment Files

The mobile app supports three environment configurations:

- **`.env.development`** - Local development environment
- **`.env.staging`** - Staging/testing environment
- **`.env.production`** - Production environment

### Creating Environment Files

```bash
# Copy the example file for your environment
cp .env.example .env.development
cp .env.example .env.staging
cp .env.example .env.production

# Edit each file with appropriate values
nano .env.development
```

## Environment Variables Reference

### API Configuration

#### `EXPO_PUBLIC_API_BASE_URL`
- **Description:** Base URL for all API requests to the Mnbara backend
- **Type:** URL
- **Development:** `http://localhost:3001` or `https://api.dev.mnbara.com/v1`
- **Staging:** `https://api.staging.mnbara.com/v1`
- **Production:** `https://api.mnbara.com/v1`
- **Required:** Yes

#### `EXPO_PUBLIC_SOCKET_URL`
- **Description:** WebSocket URL for real-time features (chat, notifications, live tracking)
- **Type:** WebSocket URL
- **Development:** `ws://localhost:3002` or `wss://socket.dev.mnbara.com`
- **Staging:** `wss://socket.staging.mnbara.com`
- **Production:** `wss://socket.mnbara.com`
- **Required:** Yes

#### `EXPO_PUBLIC_WS_PORT`
- **Description:** WebSocket port number
- **Type:** Number
- **Default:** `443` (for production), `3002` (for development)
- **Required:** No

### Firebase Configuration

Firebase is used for:
- Authentication (email/password, phone, social login)
- Cloud Messaging (push notifications)
- Analytics
- Crash Reporting

Get these values from [Firebase Console](https://console.firebase.google.com):

#### `FIREBASE_API_KEY`
- **Description:** Firebase API Key
- **Type:** String
- **Required:** Yes
- **Note:** This is a public key, safe to expose in client apps

#### `FIREBASE_AUTH_DOMAIN`
- **Description:** Firebase authentication domain
- **Type:** Domain
- **Example:** `mnbara.firebaseapp.com`
- **Required:** Yes

#### `FIREBASE_PROJECT_ID`
- **Description:** Firebase project ID
- **Type:** String
- **Example:** `mnbara-prod-12345`
- **Required:** Yes

#### `FIREBASE_STORAGE_BUCKET`
- **Description:** Firebase Cloud Storage bucket
- **Type:** Domain
- **Example:** `mnbara-prod-12345.appspot.com`
- **Required:** Yes

#### `FIREBASE_MESSAGING_SENDER_ID`
- **Description:** Firebase Cloud Messaging sender ID
- **Type:** String
- **Required:** Yes

#### `FIREBASE_APP_ID`
- **Description:** Firebase app ID
- **Type:** String
- **Required:** Yes

### Google Sign-In Configuration

Get these from [Google Cloud Console](https://console.cloud.google.com):

#### `GOOGLE_SIGN_IN_IOS_CLIENT_ID`
- **Description:** Google OAuth 2.0 Client ID for iOS
- **Type:** String
- **Required:** Yes (for iOS builds)
- **Note:** Must match iOS bundle identifier in Google Cloud Console

#### `GOOGLE_SIGN_IN_ANDROID_CLIENT_ID`
- **Description:** Google OAuth 2.0 Client ID for Android
- **Type:** String
- **Required:** Yes (for Android builds)
- **Note:** Must match Android package name in Google Cloud Console

### Google Maps Configuration

Get API keys from [Google Cloud Console](https://console.cloud.google.com):

#### `GOOGLE_MAPS_IOS_API_KEY`
- **Description:** Google Maps API Key for iOS
- **Type:** String
- **Required:** Yes (for map features)
- **Note:** Must have Maps SDK for iOS enabled

#### `GOOGLE_MAPS_ANDROID_API_KEY`
- **Description:** Google Maps API Key for Android
- **Type:** String
- **Required:** Yes (for map features)
- **Note:** Must have Maps SDK for Android enabled

### Stripe Configuration

Get from [Stripe Dashboard](https://dashboard.stripe.com):

#### `STRIPE_PUBLISHABLE_KEY`
- **Description:** Stripe publishable key for payment processing
- **Type:** String
- **Development:** `pk_test_xxx` (test key)
- **Production:** `pk_live_xxx` (live key)
- **Required:** Yes (for payment features)
- **Note:** This is a public key, safe to expose in client apps

### App Configuration

#### `APP_ENV`
- **Description:** Application environment identifier
- **Type:** Enum: `development`, `staging`, `production`
- **Default:** `development`
- **Required:** No
- **Usage:** Used to enable/disable debug features, logging, etc.

#### `APP_NAME`
- **Description:** Application display name
- **Type:** String
- **Default:** `Mnbara`
- **Required:** No

## How Environment Variables Are Used

### In React Native Code

Environment variables are accessed using `react-native-config`:

```typescript
import Config from 'react-native-config';

// Access environment variables
const apiUrl = Config.API_BASE_URL;
const socketUrl = Config.SOCKET_URL;
```

### In Configuration Files

The app has centralized configuration in `src/config/env.ts`:

```typescript
import Config from 'react-native-config';

export const API_CONFIG = {
  BASE_URL: Config.API_BASE_URL || 'https://api.mnbara.com/v1',
  SOCKET_URL: Config.SOCKET_URL || 'wss://socket.mnbara.com',
  TIMEOUT: 30000,
};

export const FIREBASE_CONFIG = {
  API_KEY: Config.FIREBASE_API_KEY,
  AUTH_DOMAIN: Config.FIREBASE_AUTH_DOMAIN,
  PROJECT_ID: Config.FIREBASE_PROJECT_ID,
  STORAGE_BUCKET: Config.FIREBASE_STORAGE_BUCKET,
  MESSAGING_SENDER_ID: Config.FIREBASE_MESSAGING_SENDER_ID,
  APP_ID: Config.FIREBASE_APP_ID,
};
```

## Running with Different Environments

### Development

```bash
# Copy development environment file
cp .env.example .env.development

# Edit with development values
nano .env.development

# Run on iOS
ENVFILE=.env.development npm run ios:dev

# Run on Android
ENVFILE=.env.development npm run android:dev

# Or use the shortcut scripts
npm run ios:dev
npm run android:dev
```

### Staging

```bash
# Copy staging environment file
cp .env.example .env.staging

# Edit with staging values
nano .env.staging

# Run on iOS
ENVFILE=.env.staging npm run ios:staging

# Run on Android
ENVFILE=.env.staging npm run android:staging

# Or use the shortcut scripts
npm run ios:staging
npm run android:staging
```

### Production

```bash
# Copy production environment file
cp .env.example .env.production

# Edit with production values
nano .env.production

# Build for iOS
ENVFILE=.env.production npm run build:ios:release

# Build for Android
ENVFILE=.env.production npm run build:android:release

# Or use the shortcut scripts
npm run ios:release
npm run android:release
```

## Environment-Specific Values

### Development Environment

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
EXPO_PUBLIC_SOCKET_URL=ws://localhost:3002
EXPO_PUBLIC_WS_PORT=3002
APP_ENV=development
```

### Staging Environment

```env
EXPO_PUBLIC_API_BASE_URL=https://api.staging.mnbara.com/v1
EXPO_PUBLIC_SOCKET_URL=wss://socket.staging.mnbara.com
EXPO_PUBLIC_WS_PORT=443
APP_ENV=staging
```

### Production Environment

```env
EXPO_PUBLIC_API_BASE_URL=https://api.mnbara.com/v1
EXPO_PUBLIC_SOCKET_URL=wss://socket.mnbara.com
EXPO_PUBLIC_WS_PORT=443
APP_ENV=production
```

## Security Best Practices

### Do's ✅

- ✅ Use environment-specific values for each deployment
- ✅ Keep `.env.*` files in `.gitignore` (never commit secrets)
- ✅ Use test/development keys for non-production environments
- ✅ Rotate API keys regularly
- ✅ Use strong, unique values for production
- ✅ Document which services each key is for
- ✅ Use separate Firebase projects for dev/staging/prod

### Don'ts ❌

- ❌ Never commit `.env` files to version control
- ❌ Never use production keys in development
- ❌ Never share `.env` files via email or chat
- ❌ Never hardcode secrets in source code
- ❌ Never use the same keys across environments
- ❌ Never expose private keys in client apps

## Troubleshooting

### Environment Variables Not Loading

1. **Check file exists:** Verify `.env.development` (or appropriate file) exists
2. **Check ENVFILE variable:** Ensure `ENVFILE=.env.development` is set when running
3. **Restart Metro:** Kill Metro bundler and restart: `npm start`
4. **Clear cache:** `npm start -- --reset-cache`

### API Connection Issues

1. **Verify API_BASE_URL:** Check it's correct for your environment
2. **Check network:** Ensure device/emulator can reach the API
3. **Check CORS:** Verify backend allows requests from mobile app
4. **Check SSL:** For production, ensure SSL certificates are valid

### Firebase Issues

1. **Verify credentials:** Double-check all Firebase config values
2. **Check project:** Ensure Firebase project matches the app
3. **Check permissions:** Verify Firebase rules allow your operations
4. **Check services:** Ensure required Firebase services are enabled

## Environment Variable Preservation

This configuration ensures that:

1. **All environment variables are documented** in `.env.example`
2. **Mobile app can read environment variables** via `react-native-config`
3. **Environment configuration is preserved** from the original location
4. **Different environments are supported** (dev, staging, prod)
5. **Security best practices are followed** (no secrets in version control)

## Related Files

- **Configuration:** `src/config/env.ts` - Centralized environment configuration
- **API Config:** `src/config/api.config.ts` - API endpoint configuration
- **Constants:** `src/config/constants.ts` - Application constants
- **Package.json:** Scripts for running with different environments

## Next Steps

1. Create `.env.development`, `.env.staging`, `.env.production` files
2. Fill in appropriate values for each environment
3. Test that environment variables load correctly
4. Verify API connectivity with each environment
5. Document any additional environment-specific configuration

---

**Last Updated:** 2026-03-02  
**Version:** 1.0
