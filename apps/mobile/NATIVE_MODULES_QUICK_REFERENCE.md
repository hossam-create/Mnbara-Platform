# Native Modules Quick Reference
## React Native Mobile Application

**Last Updated:** March 2, 2026  
**Status:** ✅ VERIFIED

---

## Quick Build Commands

### iOS Development
```bash
npm run ios:dev
```

### Android Development
```bash
npm run android:dev
```

### iOS Staging
```bash
npm run ios:staging
```

### Android Staging
```bash
npm run android:staging
```

### iOS Production
```bash
npm run ios:release
```

### Android Production
```bash
npm run android:release
```

---

## Native Modules by Category

### Maps & Location
- `react-native-maps` - Maps display
- `@react-native-community/geolocation` - GPS location

### Firebase Services
- `@react-native-firebase/app` - Core Firebase
- `@react-native-firebase/auth` - Authentication
- `@react-native-firebase/messaging` - Push notifications
- `@react-native-firebase/analytics` - Analytics
- `@react-native-firebase/crashlytics` - Crash reporting

### Authentication
- `@react-native-google-signin/google-signin` - Google Sign-In
- `react-native-keychain` - Secure credential storage

### Push Notifications
- `react-native-push-notification` - Android notifications
- `@react-native-community/push-notification-ios` - iOS notifications

### UI & Animation
- `react-native-reanimated` - Smooth animations
- `react-native-gesture-handler` - Gesture recognition
- `react-native-screens` - Screen optimization
- `react-native-safe-area-context` - Safe area handling
- `lottie-react-native` - Lottie animations
- `react-native-vector-icons` - Vector icons

### Media & Files
- `react-native-image-picker` - Image selection
- `react-native-document-picker` - Document selection
- `react-native-fast-image` - Optimized image loading
- `react-native-share` - Share functionality

### Storage & Config
- `@react-native-async-storage/async-storage` - Local storage
- `react-native-config` - Environment configuration

---

## Environment Setup

### 1. Copy Environment Template
```bash
cp apps/mobile/.env.example apps/mobile/.env.development
```

### 2. Edit Environment File
```bash
nano apps/mobile/.env.development
```

### 3. Add Your API Keys
```
FIREBASE_API_KEY=your_key
FIREBASE_PROJECT_ID=your_project
GOOGLE_MAPS_IOS_API_KEY=your_key
GOOGLE_MAPS_ANDROID_API_KEY=your_key
GOOGLE_SIGN_IN_IOS_CLIENT_ID=your_id
GOOGLE_SIGN_IN_ANDROID_CLIENT_ID=your_id
STRIPE_PUBLISHABLE_KEY=your_key
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
EXPO_PUBLIC_SOCKET_URL=http://localhost:3001
```

---

## Build Prerequisites

### iOS
- Xcode 14+
- CocoaPods
- iOS 12+ deployment target
- Apple Developer account (for device builds)

### Android
- Android SDK 21+
- Android NDK
- Gradle 7+
- Java 11+

---

## Troubleshooting

### iOS Build Issues
```bash
# Clear iOS build cache
rm -rf ios/Pods
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Reinstall pods
cd ios && pod install && cd ..

# Run development build
npm run ios:dev
```

### Android Build Issues
```bash
# Clear Android build cache
cd android && ./gradlew clean && cd ..

# Run development build
npm run android:dev
```

### Metro Bundler Issues
```bash
# Clear Metro cache
npm run start -- --reset-cache
```

---

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and build scripts |
| `tsconfig.json` | TypeScript configuration |
| `babel.config.js` | Babel transpilation |
| `metro.config.js` | Metro bundler |
| `react-native.config.js` | React Native config |
| `.env.example` | Environment template |
| `src/config/env.ts` | Environment access |

---

## Verification Status

✅ All native modules configured  
✅ iOS build ready  
✅ Android build ready  
✅ Environment configuration ready  
✅ TypeScript configuration ready  
✅ Babel configuration ready  
✅ Metro configuration ready  

---

## Related Documentation

- **Full Report:** `NATIVE_MODULES_VERIFICATION_REPORT.md`
- **Environment Setup:** `ENVIRONMENT_SETUP.md`
- **Shared Packages:** `SHARED_PACKAGES_INTEGRATION.md`
- **Project README:** `README.md`

---

**Status:** ✅ READY FOR NATIVE BUILDS

