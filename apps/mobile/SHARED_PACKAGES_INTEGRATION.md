# Mobile App - Shared Packages Integration Guide

**Status:** Configured for Phase 2  
**Last Updated:** March 2, 2026  
**Task:** 3.2.2 Configure application to use shared packages where applicable

---

## Overview

The Mnbara mobile application (React Native) has been configured to use shared packages from the monorepo. This document describes the integration, available packages, and usage patterns.

## Shared Packages Available

### 1. @mnbara/types
**Purpose:** Shared TypeScript type definitions  
**Location:** `packages/types/src/`

#### Available Types:
- **User Types:** `UserRole`, `UserStatus`, `KYCStatus`, `AccountType`, `UserProfile`
- **Order Types:** `OrderStatus`, `OrderType`, `PaymentStatus`, `FulfillmentStatus`, `DeliveryMethod`
- **Payment Types:** `PaymentMethodType`, `PaymentStatus`, `PaymentProvider`, `CardType`, `Currency`
- **Delivery Types:** `DeliveryStatus`, `DeliveryType`, `DeliveryPriority`, `PackageSize`, `DeliveryMethod`
- **Common Types:** `BaseEntity`, `GeoLocation`, `Address`, `DeliveryAddress`, `PaginationParams`

#### Usage Example:
```typescript
import { UserRole, DeliveryStatus, PaymentStatus } from '@mnbara/types';

interface Delivery {
  id: string;
  status: DeliveryStatus;
  priority: DeliveryPriority;
}
```

#### Integration Points:
- `apps/mobile/src/domain/entities/` - Use shared types for domain models
- `apps/mobile/src/features/*/store/` - Use shared types in Redux slices
- `apps/mobile/src/services/api/` - Use shared types for API responses

---

### 2. @mnbara/utils
**Purpose:** Shared utility functions  
**Location:** `packages/utils/src/`

#### Available Utilities:

##### Currency Formatting
```typescript
import { formatCurrency, formatCompactCurrency, parseCurrency } from '@mnbara/utils';

// Format currency for display
const price = formatCurrency(1234.56, 'USD'); // "$1,234.56"
const compact = formatCompactCurrency(1000000, 'USD'); // "$1M"

// Parse currency string
const amount = parseCurrency('$1,234.56'); // 1234.56
```

##### Date Formatting
```typescript
import { formatDate, formatRelativeTime, formatCalendarDate } from '@mnbara/utils';

// Format date
const date = formatDate(new Date(), 'medium'); // "Mar 2, 2026"
const relative = formatRelativeTime(new Date()); // "2 hours ago"
const calendar = formatCalendarDate(new Date()); // "Today at 2:30 PM"
```

##### Validation Helpers
```typescript
import { isValidEmail, isValidPhone, validatePassword } from '@mnbara/utils';

// Validate email
if (isValidEmail('user@example.com')) {
  // Valid email
}

// Validate phone
if (isValidPhone('+1234567890')) {
  // Valid phone
}

// Validate password
const result = validatePassword('MyPassword123!');
if (result.valid) {
  // Valid password
} else {
  console.log(result.errors); // Array of validation errors
}
```

##### Type Helpers
```typescript
import { isDefined, isString, isNumber, isInteger, isBoolean } from '@mnbara/utils';

// Type guards
if (isDefined(value)) {
  // Value is not null or undefined
}

if (isString(value)) {
  // Value is a string
}
```

#### Integration Points:
- `apps/mobile/src/services/api/` - Use currency formatting for API responses
- `apps/mobile/src/components/` - Use date formatting in UI components
- `apps/mobile/src/features/auth/` - Use validation helpers in authentication
- `apps/mobile/src/hooks/` - Use utilities in custom hooks

---

### 3. @mnbara/api-client
**Purpose:** Shared API client with interceptors  
**Location:** `packages/api-client/src/`

#### Features:
- Axios-based HTTP client
- Request/response interceptors
- Authentication interceptor
- Error handling
- Retry logic

#### Note on Mobile Integration:
The mobile app has a **custom API client** (`apps/mobile/src/services/api/client.ts`) that wraps the shared client with React Native-specific features:
- Redux integration for token management
- Mobile-specific error handling
- React Native configuration support

#### Usage in Mobile App:
```typescript
import { apiClient } from '@/services/api/client';

// Use the mobile-specific client
const user = await apiClient.get<User>('/api/users/me');
const updated = await apiClient.put<User>('/api/users/me', userData);
```

#### Shared Client Usage (if needed):
```typescript
import { ApiClient } from '@mnbara/api-client';

const client = new ApiClient({
  baseURL: 'https://api.mnbara.com',
  timeout: 30000,
});

const data = await client.get('/endpoint');
```

---

### 4. @mnbara/validation
**Purpose:** Shared validation schemas (Zod)  
**Location:** `packages/validation/src/`

#### Available Schemas:
- User validation schemas
- Order validation schemas
- Payment validation schemas
- Delivery validation schemas

#### Usage Example:
```typescript
import { userSchema, orderSchema } from '@mnbara/validation';

// Validate user data
const userData = { email: 'user@example.com', password: 'secure123' };
const result = userSchema.safeParse(userData);

if (result.success) {
  // Data is valid
  const validUser = result.data;
} else {
  // Data is invalid
  console.log(result.error.errors);
}
```

#### Integration with React Hook Form:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema } from '@mnbara/validation';

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(userSchema),
});
```

#### Integration Points:
- `apps/mobile/src/features/auth/screens/` - Use validation in authentication forms
- `apps/mobile/src/features/*/screens/` - Use validation in feature forms
- `apps/mobile/src/services/api/` - Use validation for API request/response data

---

## Configuration Files

### Package.json
The mobile app's `package.json` has been updated to include shared packages:

```json
{
  "dependencies": {
    "@mnbara/api-client": "workspace:*",
    "@mnbara/types": "workspace:*",
    "@mnbara/utils": "workspace:*",
    "@mnbara/validation": "workspace:*"
  }
}
```

### TypeScript Configuration
The mobile app's `tsconfig.json` has been updated with path mappings:

```json
{
  "compilerOptions": {
    "paths": {
      "@mnbara/types": ["../../packages/types/src/index.ts"],
      "@mnbara/utils": ["../../packages/utils/src/index.ts"],
      "@mnbara/api-client": ["../../packages/api-client/src/index.ts"],
      "@mnbara/validation": ["../../packages/validation/src/index.ts"]
    }
  }
}
```

### Shared Packages Configuration
A new configuration file has been created at `apps/mobile/src/config/shared-packages.ts` that documents the integration and provides constants for package references.

---

## Preserved Features

### Navigation Structure
✅ **Preserved** - All navigation configuration remains in `apps/mobile/src/navigation/`
- React Navigation setup
- Navigation stacks and screens
- Deep linking configuration

### Environment Variables
✅ **Preserved** - All environment configuration remains in `apps/mobile/src/config/`
- `api.config.ts` - API configuration
- `env.ts` - Environment variables
- `constants.ts` - Application constants
- `.env.example` - Environment template

### State Management
✅ **Preserved** - Redux store remains in `apps/mobile/src/store/`
- Redux slices for each feature
- Redux middleware
- Redux persist configuration

### Mobile-Specific Services
✅ **Preserved** - Mobile-specific services remain in `apps/mobile/src/services/`
- Custom API client with Redux integration
- Push notification service
- Mobile-specific API endpoints

---

## Migration Path

### Phase 1: Type Definitions (Current)
- ✅ Import shared types from `@mnbara/types`
- ✅ Replace local type definitions with shared ones
- ✅ Update domain entities to use shared types

### Phase 2: Utilities (Recommended Next)
- Replace local utility functions with `@mnbara/utils`
- Update currency formatting in components
- Update date formatting in components
- Update validation helpers in forms

### Phase 3: Validation (Recommended Next)
- Integrate `@mnbara/validation` schemas
- Update form validation with Zod schemas
- Replace local validation rules with shared schemas

### Phase 4: API Client (Optional)
- Consider using `@mnbara/api-client` as base
- Keep mobile-specific wrapper for Redux integration
- Gradually migrate to shared client features

---

## Import Patterns

### Correct Import Patterns
```typescript
// ✅ Correct - Import from shared packages
import { UserRole, DeliveryStatus } from '@mnbara/types';
import { formatCurrency, isValidEmail } from '@mnbara/utils';
import { userSchema } from '@mnbara/validation';

// ✅ Correct - Import from mobile app
import { apiClient } from '@/services/api/client';
import { useAuth } from '@/hooks/useAuth';
import { AuthScreen } from '@/features/auth/screens/AuthScreen';
```

### Incorrect Import Patterns
```typescript
// ❌ Incorrect - Don't import from packages/*/src directly
import { UserRole } from '../../../packages/types/src/user.types';

// ❌ Incorrect - Don't duplicate types locally
interface User {
  id: string;
  role: 'admin' | 'user'; // Use UserRole from @mnbara/types instead
}
```

---

## Troubleshooting

### Issue: Module not found errors
**Solution:** Ensure `npm install` has been run in the workspace root to install all dependencies.

```bash
cd mnbara-platform
npm install
```

### Issue: TypeScript errors with shared packages
**Solution:** Verify that `tsconfig.json` path mappings are correct and point to the right locations.

```bash
# Check TypeScript compilation
npx tsc --noEmit
```

### Issue: Shared package changes not reflected
**Solution:** Rebuild the shared packages and clear the mobile app's cache.

```bash
# Rebuild shared packages
npm run build

# Clear mobile app cache
cd apps/mobile
npm run clean
npm install
```

---

## Best Practices

### 1. Use Shared Types Consistently
- Always import types from `@mnbara/types`
- Don't create duplicate type definitions
- Keep domain models aligned with shared types

### 2. Leverage Shared Utilities
- Use `@mnbara/utils` for common operations
- Avoid reimplementing utility functions
- Contribute mobile-specific utilities back to shared packages

### 3. Maintain Mobile-Specific Code
- Keep navigation in `apps/mobile/src/navigation/`
- Keep Redux store in `apps/mobile/src/store/`
- Keep mobile-specific services in `apps/mobile/src/services/`

### 4. Document Custom Implementations
- Document why mobile-specific implementations exist
- Link to shared package documentation
- Keep comments explaining mobile-specific behavior

---

## Next Steps

1. **Update Domain Entities** - Replace local type definitions with shared types
2. **Integrate Utilities** - Replace local utility functions with shared utilities
3. **Add Validation** - Integrate Zod schemas for form validation
4. **Test Integration** - Run tests to verify shared package integration
5. **Update Documentation** - Document any mobile-specific customizations

---

## References

- **Shared Packages:** `packages/`
- **Mobile App:** `apps/mobile/`
- **Design Document:** `.kiro/specs/platform-restructure-phase2/design.md`
- **Requirements:** `.kiro/specs/platform-restructure-phase2/requirements.md`
- **Tasks:** `.kiro/specs/platform-restructure-phase2/tasks.md`

---

## Support

For questions or issues with shared package integration:
1. Check the shared package README files in `packages/*/README.md`
2. Review the integration guide in this document
3. Check the design document for architecture details
4. Consult the team for mobile-specific concerns

---

**Document Version:** 1.0  
**Status:** Ready for Implementation  
**Last Updated:** March 2, 2026
