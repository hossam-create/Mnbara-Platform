# Environment Variables Quick Reference

## Quick Setup

```bash
# 1. Copy environment template
cp .env.example .env.development

# 2. Edit with your values
nano .env.development

# 3. Run the app
npm run ios:dev
# or
npm run android:dev
```

## All Environment Variables

| Variable | Type | Required | Example |
|----------|------|----------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | URL | Yes | `https://api.mnbara.com/v1` |
| `EXPO_PUBLIC_SOCKET_URL` | WebSocket URL | Yes | `wss://socket.mnbara.com` |
| `EXPO_PUBLIC_WS_PORT` | Number | No | `443` |
| `FIREBASE_API_KEY` | String | Yes | `AIzaSyD...` |
| `FIREBASE_AUTH_DOMAIN` | Domain | Yes | `mnbara.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | String | Yes | `mnbara-prod-12345` |
| `FIREBASE_STORAGE_BUCKET` | Domain | Yes | `mnbara-prod-12345.appspot.com` |
| `FIREBASE_MESSAGING_SENDER_ID` | String | Yes | `123456789` |
| `FIREBASE_APP_ID` | String | Yes | `1:123456789:ios:abc...` |
| `GOOGLE_SIGN_IN_IOS_CLIENT_ID` | String | Yes | `123456789-abc...` |
| `GOOGLE_SIGN_IN_ANDROID_CLIENT_ID` | String | Yes | `123456789-xyz...` |
| `GOOGLE_MAPS_IOS_API_KEY` | String | Yes | `AIzaSyD...` |
| `GOOGLE_MAPS_ANDROID_API_KEY` | String | Yes | `AIzaSyD...` |
| `STRIPE_PUBLISHABLE_KEY` | String | Yes | `pk_test_xxx` |
| `APP_ENV` | Enum | No | `development` |
| `APP_NAME` | String | No | `Mnbara` |

## Environment-Specific Values

### Development
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
EXPO_PUBLIC_SOCKET_URL=ws://localhost:3002
APP_ENV=development
```

### Staging
```env
EXPO_PUBLIC_API_BASE_URL=https://api.staging.mnbara.com/v1
EXPO_PUBLIC_SOCKET_URL=wss://socket.staging.mnbara.com
APP_ENV=staging
```

### Production
```env
EXPO_PUBLIC_API_BASE_URL=https://api.mnbara.com/v1
EXPO_PUBLIC_SOCKET_URL=wss://socket.mnbara.com
APP_ENV=production
```

## Run Commands

```bash
# Development
npm run ios:dev
npm run android:dev

# Staging
npm run ios:staging
npm run android:staging

# Production
npm run ios:release
npm run android:release
```

## Access in Code

```typescript
// Method 1: Direct import
import Config from 'react-native-config';
const apiUrl = Config.EXPO_PUBLIC_API_BASE_URL;

// Method 2: Centralized config
import { API_CONFIG, FIREBASE_CONFIG } from 'src/config/env';
const baseUrl = API_CONFIG.BASE_URL;

// Method 3: API config
import apiConfig from 'src/config/api.config';
const apiUrl = apiConfig.API_BASE_URL;
```

## Get Credentials

- **Firebase:** https://console.firebase.google.com
- **Google Cloud:** https://console.cloud.google.com
- **Stripe:** https://dashboard.stripe.com

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Variables not loading | Restart Metro: `npm start -- --reset-cache` |
| API connection fails | Check `EXPO_PUBLIC_API_BASE_URL` is correct |
| Firebase errors | Verify all Firebase config values |
| Maps not showing | Check Google Maps API keys are enabled |

## Security

- ✅ Never commit `.env` files
- ✅ Use test keys for development
- ✅ Use separate projects for each environment
- ✅ Rotate keys regularly
- ✅ Keep `.env` files in `.gitignore`

---

For detailed information, see [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
