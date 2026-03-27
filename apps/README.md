# Applications

This directory contains all user-facing applications for the Mnbara Platform.

## 📱 Applications

### web/
**Next.js 15 Web Application**

The main web interface for the Mnbara Platform, providing:
- User authentication and authorization
- Product browsing and search
- Order management
- Payment processing
- User profile and settings
- Admin dashboard

**Getting Started:**
```bash
cd apps/web
npm install
npm run dev
```

**Key Features:**
- Server-side rendering with Next.js
- TypeScript for type safety
- Tailwind CSS for styling
- Integration with shared packages
- API routes for backend communication

**Documentation:**
- [apps/web/README.md](./web/README.md)

### mobile/
**Flutter 3.x Mobile Application**

Native mobile app for iOS and Android, providing:
- User authentication
- Product browsing
- Order management
- Payment processing
- Real-time notifications
- Offline support

**Getting Started:**
```bash
cd apps/mobile
flutter pub get
flutter run
```

**Key Features:**
- Cross-platform development
- Native performance
- Offline support with local storage
- Push notifications
- Biometric authentication

**Documentation:**
- [apps/mobile/README.md](./mobile/README.md)

## 🔗 Shared Dependencies

All applications use shared packages from `packages/`:

- **@mnbara/types** - Shared type definitions
- **@mnbara/ui-components** - UI component library
- **@mnbara/utils** - Utility functions
- **@mnbara/api-client** - API client
- **@mnbara/validation** - Validation schemas

## 🚀 Development

### Running All Applications

```bash
# From root directory
npm run dev
```

This starts:
- Web app on http://localhost:3000
- Mobile app in emulator/simulator
- All backend services

### Building Applications

```bash
# Build all applications
npm run build

# Build specific application
nx build apps/web
nx build apps/mobile
```

### Testing Applications

```bash
# Test all applications
npm run test

# Test specific application
nx test apps/web
nx test apps/mobile
```

### Linting Applications

```bash
# Lint all applications
npm run lint

# Lint specific application
nx lint apps/web
nx lint apps/mobile
```

## 📁 Structure

Each application follows a consistent structure:

```
app-name/
├── src/
│   ├── components/       # React/Flutter components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom hooks
│   ├── services/        # API services
│   ├── types/           # Local type definitions
│   ├── styles/          # Styling
│   └── utils/           # Utility functions
├── public/              # Static assets
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
├── README.md            # Application documentation
└── [app-specific files]
```

## 🔄 Communication

Applications communicate with backend services through:

1. **API Gateway** - Central entry point for all API requests
2. **REST API** - Standard HTTP endpoints
3. **WebSockets** - Real-time communication
4. **Message Queue** - Asynchronous messaging

### Example API Call

```typescript
import { ApiClient } from '@mnbara/api-client';

const client = new ApiClient(process.env.API_BASE_URL);

// Get products
const products = await client.get('/products');

// Create order
const order = await client.post('/orders', {
  items: [...],
  shippingAddress: {...}
});
```

## 🔐 Authentication

Both applications use JWT-based authentication:

1. User logs in with credentials
2. Backend returns JWT token
3. Token stored in secure storage
4. Token included in all API requests
5. Token refreshed automatically when expired

### Web App Authentication

```typescript
// Login
const response = await apiClient.post('/auth/login', {
  email: 'user@example.com',
  password: 'password'
});

// Store token
localStorage.setItem('token', response.token);

// Use token in requests
apiClient.setAuthToken(response.token);
```

### Mobile App Authentication

```dart
// Login
final response = await apiClient.post('/auth/login', {
  'email': 'user@example.com',
  'password': 'password'
});

// Store token securely
await secureStorage.write(key: 'token', value: response.token);

// Use token in requests
apiClient.setAuthToken(response.token);
```

## 🎨 Styling

### Web App (Tailwind CSS)

```typescript
// Use Tailwind classes
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  Click me
</button>
```

### Mobile App (Flutter)

```dart
// Use Flutter widgets
ElevatedButton(
  onPressed: () {},
  child: Text('Click me'),
)
```

## 📦 Deployment

### Web App Deployment

```bash
# Build for production
npm run build

# Deploy to hosting
npm run deploy:prod
```

### Mobile App Deployment

```bash
# Build for iOS
flutter build ios

# Build for Android
flutter build apk

# Upload to app stores
# iOS: Use Xcode or fastlane
# Android: Use Google Play Console
```

## 🧪 Testing

### Web App Testing

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

### Mobile App Testing

```bash
# Run unit tests
flutter test

# Run integration tests
flutter drive --target=test_driver/app.dart
```

## 📚 Documentation

- [Web App Documentation](./web/README.md)
- [Mobile App Documentation](./mobile/README.md)
- [Shared Packages Documentation](../packages/README.md)
- [Architecture Documentation](../docs/architecture/NEW_STRUCTURE.md)

## 🔗 Related Directories

- [packages/](../packages/) - Shared packages
- [services/](../services/) - Backend services
- [infrastructure/](../infrastructure/) - Infrastructure as Code
- [docs/](../docs/) - Documentation

---

**Last Updated:** March 2026  
**Version:** 1.0
