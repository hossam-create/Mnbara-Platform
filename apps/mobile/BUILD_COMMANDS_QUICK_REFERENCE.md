# Build Commands Quick Reference
## React Native Mobile Application - iOS & Android

**Location:** apps/mobile/  
**Framework:** React Native 0.75.0  
**Last Updated:** March 14, 2026

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm 10+
- For iOS: Xcode 14+ (macOS only)
- For Android: Android Studio + Android SDK 31+

### Installation
```bash
# Install dependencies
npm install

# For iOS only: Install CocoaPods
cd ios && pod install && cd ..
```

---

## iOS Build Commands

### Development Build
```bash
npm run ios:dev
```
- Uses `.env.development` environment file
- Builds with mnbara-dev scheme
- Suitable for development and testing

### Staging Build
```bash
npm run ios:staging
```
- Uses `.env.staging` environment file
- Builds with mnbara-staging scheme
- Suitable for staging environment testing

### Production Build
```bash
npm run ios:release
```
- Uses production environment
- Builds with mnbara scheme
- Optimized for production release

### Direct Xcode Build (Debug)
```bash
npm run build:ios:debug
```
- Direct Xcode compilation
- Debug configuration
- Useful for CI/CD pipelines

### Direct Xcode Build (Release)
```bash
npm run build:ios:release
```
- Direct Xcode compilation
- Release configuration
- Optimized for production

### Metro Bundler (Development)
```bash
npm start
```
- Starts Metro bundler
- Watches for file changes
- Required for development builds

---

## Android Build Commands

### Development Build
```bash
npm run android:dev
```
- Uses `.env.development` environment file
- Builds debug variant
- Suitable for development and testing

### Staging Build
```bash
npm run android:staging
```
- Uses `.env.staging` environment file
- Builds debug variant
- Suitable for staging environment testing

### Production Build
```bash
npm run android:release
```
- Uses `.env.production` environment file
- Builds release variant
- Optimized for production release

### Direct Gradle Build (Debug)
```bash
npm run build:android:debug
```
- Direct Gradle compilation
- Debug variant
- Useful for CI/CD pipelines

### Direct Gradle Build (Release)
```bash
npm run build:android:release
```
- Direct Gradle compilation
- Release variant
- Optimized for production

### Metro Bundler (Development)
```bash
npm start
```
- Starts Metro bundler
- Watches for file changes
- Required for development builds

---

## Testing Commands

### Run All Tests
```bash
npm test
```
- Runs Jest test suite
- Single run mode

### Watch Mode
```bash
npm test:watch
```
- Runs tests in watch mode
- Re-runs on file changes

### Coverage Report
```bash
npm test:coverage
```
- Generates coverage report
- Shows coverage percentages

---

## Code Quality Commands

### Lint Code
```bash
npm run lint
```
- Runs ESLint
- Checks for code style issues

### Format Code
```bash
npm run format
```
- Runs Prettier
- Formats code automatically

---

## Environment Setup

### Create Development Environment
```bash
cp .env.example .env.development
# Edit .env.development with your API keys
```

### Create Staging Environment
```bash
cp .env.example .env.staging
# Edit .env.staging with staging API keys
```

### Create Production Environment
```bash
cp .env.example .env.production
# Edit .env.production with production API keys
```

---

## Build Output Locations

### iOS Build Artifacts
- **Xcode Project:** `ios/mnbara.xcworkspace`
- **Build Output:** `ios/build/`
- **IPA File:** Generated in Xcode build folder

### Android Build Artifacts
- **Gradle Project:** `android/`
- **Build Output:** `android/app/build/`
- **APK File:** `android/app/build/outputs/apk/release/app-release.apk`
- **AAB File:** `android/app/build/outputs/bundle/release/app-release.aab`

---

## Troubleshooting

### iOS Issues

**Problem:** CocoaPods not installed
```bash
sudo gem install cocoapods
```

**Problem:** Pod dependencies not installed
```bash
cd ios && pod install && cd ..
```

**Problem:** Xcode build fails
```bash
# Clean build
rm -rf ios/build
npm run ios:dev
```

### Android Issues

**Problem:** Gradle wrapper not found
```bash
# Gradle wrapper will be generated automatically
npm run android:dev
```

**Problem:** Android SDK not found
- Install Android Studio
- Install SDK via Android Studio SDK Manager
- Set ANDROID_HOME environment variable

**Problem:** Build fails
```bash
# Clean build
rm -rf android/build
npm run android:dev
```

### General Issues

**Problem:** Metro bundler crashes
```bash
# Kill existing Metro process
# Clear cache
rm -rf node_modules/.cache
npm start
```

**Problem:** Dependencies not installed
```bash
npm install --legacy-peer-deps
```

---

## Build Schemes (iOS)

| Scheme | Environment | Purpose |
|--------|-------------|---------|
| mnbara-dev | Development | Development builds |
| mnbara-staging | Staging | Staging environment testing |
| mnbara | Production | Production releases |

---

## Build Variants (Android)

| Variant | Environment | Purpose |
|---------|-------------|---------|
| debug | Development | Development builds |
| release | Production | Production releases |

---

## Environment Variables

### Required Variables
- `FIREBASE_API_KEY` - Firebase API key
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `GOOGLE_MAPS_IOS_API_KEY` - Google Maps iOS API key
- `GOOGLE_MAPS_ANDROID_API_KEY` - Google Maps Android API key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `EXPO_PUBLIC_API_BASE_URL` - Backend API URL
- `EXPO_PUBLIC_SOCKET_URL` - Socket.IO server URL

### Optional Variables
- `APP_ENV` - Environment name (development, staging, production)
- `APP_NAME` - Application name

---

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Build iOS
  run: npm run build:ios:release

- name: Build Android
  run: npm run build:android:release
```

### Build Verification
```bash
# Verify build configuration
npm run lint
npm test
npm run build:ios:debug
npm run build:android:debug
```

---

## Performance Tips

1. **Use Release Builds for Testing**
   - Release builds are optimized
   - Better performance representation

2. **Clear Cache Regularly**
   ```bash
   rm -rf node_modules/.cache
   ```

3. **Use Direct Gradle/Xcode Builds for CI/CD**
   - Faster than React Native CLI
   - Better for automation

4. **Monitor Build Times**
   - Track build performance
   - Identify bottlenecks

---

## Additional Resources

- **Full Report:** `TASK_3_2_6_BUILD_VERIFICATION_REPORT.md`
- **Native Modules:** `NATIVE_MODULES_VERIFICATION_REPORT.md`
- **Environment Setup:** `ENVIRONMENT_SETUP.md`
- **Shared Packages:** `SHARED_PACKAGES_INTEGRATION.md`
- **Project README:** `README.md`

---

**Version:** 1.0  
**Last Updated:** March 14, 2026  
**Status:** Ready for Use
