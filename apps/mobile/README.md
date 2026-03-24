# Mobile Application - Mnbara Platform

## Overview

The mobile application is a Flutter 3.x application that serves as the mobile client for the Mnbara Platform. It's now integrated into the monorepo structure under `apps/mobile/`.

## Structure

```
apps/mobile/
├── src/                          # Flutter source code
│   ├── config/                   # Configuration files
│   │   └── shared-packages.ts    # Shared package integration
│   ├── screens/                  # Screen/page components
│   ├── widgets/                  # Reusable widgets
│   ├── services/                 # Business logic services
│   ├── models/                   # Data models
│   ├── utils/                    # Utility functions
│   └── main.dart                 # Application entry point
├── ios/                          # iOS-specific code
├── android/                      # Android-specific code
├── pubspec.yaml                  # Flutter dependencies
├── pubspec.lock                  # Locked dependency versions
├── analysis_options.yaml         # Dart analysis configuration
├── Dockerfile                    # Docker configuration
├── .env.example                  # Environment variables template
└── README.md                     # This file
```

## Getting Started

### Prerequisites

- Flutter 3.x installed
- Dart SDK 3.x
- iOS development tools (for iOS builds)
- Android SDK (for Android builds)
- Node.js 20+ (for shared package integration)

### Installation

1. Navigate to the mobile app directory:
```bash
cd apps/mobile
```

2. Install Flutter dependencies:
```bash
flutter pub get
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Configure shared packages:
```bash
npm install
```

## Development

### Running the Application

**Development mode:**
```bash
flutter run
```

**With specific device:**
```bash
flutter run -d <device-id>
```

**Web preview:**
```bash
flutter run -d chrome
```

### Building

**iOS:**
```bash
flutter build ios
```

**Android:**
```bash
flutter build apk
flutter build appbundle
```

**Web:**
```bash
flutter build web
```

## Shared Packages Integration

The mobile application integrates with shared packages from the monorepo:

- **@mnbara/types** - TypeScript type definitions (used for API contracts)
- **@mnbara/api-client** - API client library
- **@mnbara/validation** - Validation schemas
- **@mnbara/utils** - Utility functions

See `src/config/shared-packages.ts` for integration details.

## Environment Configuration

Environment variables are managed through `.env` file:

```env
API_BASE_URL=http://localhost:3000
API_TIMEOUT=30000
LOG_LEVEL=info
ENABLE_ANALYTICS=true
```

See `.env.example` for all available options.

## Navigation Structure

The mobile application uses a hierarchical navigation structure:

- **Authentication Flow** - Login, registration, password reset
- **Main Navigation** - Tab-based navigation for core features
- **Feature Screens** - Specific feature implementations
- **Modal Dialogs** - Overlay screens for actions

See `NAVIGATION_PRESERVATION_REPORT.md` for detailed navigation structure.

## Native Modules

The application uses native modules for platform-specific functionality:

- **Location Services** - GPS and location tracking
- **Camera** - Image capture and processing
- **Notifications** - Push notifications
- **Storage** - Secure local storage

See `NATIVE_MODULES_VERIFICATION_REPORT.md` for configuration details.

## Testing

### Unit Tests
```bash
flutter test
```

### Integration Tests
```bash
flutter test integration_test/
```

### E2E Tests
```bash
flutter drive --target=test_driver/app.dart
```

## Build Verification

Before deploying, verify the build:

```bash
# Run all checks
flutter analyze
flutter test
flutter build ios --analyze-size
flutter build apk --analyze-size
```

See `BUILD_VERIFICATION_REPORT.md` for detailed verification steps.

## Deployment

### Development Environment
```bash
flutter run --debug
```

### Staging Environment
```bash
flutter build apk --release
flutter build ios --release
```

### Production Environment
```bash
flutter build appbundle --release
flutter build ios --release
```

## Troubleshooting

### Common Issues

**Issue: Shared packages not found**
- Solution: Run `npm install` in the mobile app directory
- Verify `src/config/shared-packages.ts` configuration

**Issue: Native module compilation errors**
- Solution: Check `NATIVE_MODULES_VERIFICATION_REPORT.md`
- Ensure iOS/Android SDKs are properly installed

**Issue: Environment variables not loading**
- Solution: Verify `.env` file exists and is properly formatted
- Check `ENVIRONMENT_PRESERVATION_REPORT.md`

## Documentation

- **NAVIGATION_PRESERVATION_REPORT.md** - Navigation structure details
- **NATIVE_MODULES_VERIFICATION_REPORT.md** - Native module configuration
- **ENVIRONMENT_PRESERVATION_REPORT.md** - Environment setup
- **BUILD_VERIFICATION_REPORT.md** - Build process details
- **SHARED_PACKAGES_INTEGRATION.md** - Shared package integration
- **SHARED_PACKAGES_VERIFICATION.md** - Verification steps

## Contributing

When contributing to the mobile application:

1. Follow Flutter best practices
2. Maintain the existing directory structure
3. Update documentation for new features
4. Write tests for new functionality
5. Ensure builds pass verification

## Performance Considerations

- Use lazy loading for screens
- Optimize image assets
- Implement efficient state management
- Monitor memory usage
- Profile performance regularly

## Security

- Store sensitive data securely
- Validate all user input
- Use HTTPS for API communication
- Implement proper authentication
- Follow platform security guidelines

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review related documentation files
3. Check the main README.md in the project root
4. Consult the CONTRIBUTING.md guide

## Related Documentation

- [Main README](../../README.md)
- [Contributing Guide](../../CONTRIBUTING.md)
- [Architecture Documentation](../../docs/architecture/NEW_STRUCTURE.md)
- [Migration Guide](../../docs/MIGRATION_GUIDE.md)

---

**Last Updated:** March 15, 2026  
**Status:** Active  
**Monorepo Version:** 1.0
