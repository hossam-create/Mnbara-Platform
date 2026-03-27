# Mobile App - Quick Start Guide

## 5-Minute Setup

### 1. Navigate to Mobile App
```bash
cd apps/mobile
```

### 2. Install Dependencies
```bash
flutter pub get
npm install
```

### 3. Set Up Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Run the App
```bash
flutter run
```

## Common Commands

### Development
```bash
# Run in debug mode
flutter run

# Run on specific device
flutter run -d <device-id>

# Run with hot reload
flutter run --hot

# Run web preview
flutter run -d chrome
```

### Building
```bash
# Build APK for Android
flutter build apk --release

# Build App Bundle for Google Play
flutter build appbundle --release

# Build iOS app
flutter build ios --release

# Build web
flutter build web
```

### Testing
```bash
# Run all tests
flutter test

# Run integration tests
flutter test integration_test/

# Run E2E tests
flutter drive --target=test_driver/app.dart
```

### Debugging
```bash
# Analyze code
flutter analyze

# Check for issues
flutter doctor

# Clean build
flutter clean
```

## Project Structure

```
apps/mobile/
├── src/                    # Flutter source code
├── ios/                    # iOS-specific code
├── android/                # Android-specific code
├── pubspec.yaml            # Dependencies
├── .env.example            # Environment template
├── README.md               # Full documentation
└── MIGRATION_GUIDE.md      # Migration details
```

## Key Files

| File | Purpose |
|------|---------|
| `pubspec.yaml` | Flutter dependencies |
| `.env` | Environment variables |
| `src/main.dart` | App entry point |
| `src/config/shared-packages.ts` | Shared package config |
| `ios/Podfile` | iOS dependencies |
| `android/build.gradle` | Android configuration |

## Environment Variables

```env
API_BASE_URL=http://localhost:3000
API_TIMEOUT=30000
LOG_LEVEL=info
ENABLE_ANALYTICS=true
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Shared packages not found | Run `npm install` |
| Build fails | Run `flutter clean` then `flutter pub get` |
| Environment not loading | Verify `.env` file exists |
| Native modules error | Check `NATIVE_MODULES_VERIFICATION_REPORT.md` |

## Documentation

- **README.md** - Full documentation
- **MIGRATION_GUIDE.md** - Migration details
- **NAVIGATION_PRESERVATION_REPORT.md** - Navigation structure
- **NATIVE_MODULES_VERIFICATION_REPORT.md** - Native modules
- **ENVIRONMENT_PRESERVATION_REPORT.md** - Environment setup
- **BUILD_VERIFICATION_REPORT.md** - Build details

## Next Steps

1. Read `README.md` for full documentation
2. Check `MIGRATION_GUIDE.md` for migration details
3. Review navigation structure in `NAVIGATION_PRESERVATION_REPORT.md`
4. Verify native modules in `NATIVE_MODULES_VERIFICATION_REPORT.md`

## Need Help?

- Check the troubleshooting section in `README.md`
- Review related documentation files
- Check the main project README
- Consult CONTRIBUTING.md

---

**Last Updated:** March 15, 2026
