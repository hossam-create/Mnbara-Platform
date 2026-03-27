# Shared Packages Integration Guide - Core Services

This guide explains how to use the shared packages in the core services (auth-service, user-service, notification-service).

## Overview

All core services have been configured to use the following shared packages:

- **@mnbara/types** - Shared TypeScript type definitions
- **@mnbara/utils** - Utility functions (currency, date, validation helpers)
- **@mnbara/validation** - Zod validation schemas
- **@mnbara/api-client** - HTTP API client for inter-service communication

## Configuration

### 1. Package Dependencies

Each service's `package.json` includes the shared packages as workspace dependencies:

```json
{
  "dependencies": {
    "@mnbara/types": "workspace:*",
    "@mnbara/utils": "workspace:*",
    "@mnbara/validation": "workspace:*",
    "@mnbara/api-client": "workspace:*"
  }
}
```

### 2. TypeScript Path Mappings

Each service's `tsconfig.json` includes path mappings for the shared packages:

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@mnbara/types": ["../../packages/types/src/index.ts"],
      "@mnbara/types/*": ["../../packages/types/src/*"],
      "@mnbara/utils": ["../../packages/utils/src/index.ts"],
      "@mnbara/utils/*": ["../../packages/utils/src/*"],
      "@mnbara/validation": ["../../packages/validation/src/index.ts"],
      "@mnbara/validation/*": ["../../packages/validation/src/*"],
      "@mnbara/api-client": ["../../packages/api-client/src/index.ts"],
      "@mnbara/api-client/*": ["../../packages/api-client/src/*"]
    }
  }
}
```

## Usage Examples

### Using @mnbara/types

Import shared type definitions:

```typescript
import type { User, UserRole, UserProfile } from '@mnbara/types/user';
import type { Order, OrderStatus } from '@mnbara/types/order';
import type { Payment, PaymentStatus } from '@mnbara/types/payment';

// Use in your service
const user: User = {
  id: 'user-123',
  email: 'user@example.com',
  roles: ['user'],
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    avatar: null,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### Using @mnbara/utils

Import utility functions:

```typescript
import {
  formatCurrency,
  formatDate,
  validateEmail,
  validatePassword,
} from '@mnbara/utils';

// Format currency
const price = formatCurrency(1234.56, 'USD'); // "$1,234.56"

// Format date
const date = formatDate(new Date(), 'YYYY-MM-DD'); // "2026-03-15"

// Validate email
const isValid = validateEmail('user@example.com'); // true

// Validate password
const isStrong = validatePassword('SecurePass123!'); // true
```

### Using @mnbara/validation

Import validation schemas:

```typescript
import {
  userSchema,
  orderSchema,
  paymentSchema,
  deliverySchema,
} from '@mnbara/validation';

// Validate user data
const userData = {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
};

const validatedUser = userSchema.parse(userData);

// Validate with error handling
try {
  const validatedOrder = orderSchema.parse(orderData);
} catch (error) {
  console.error('Validation failed:', error);
}
```

### Using @mnbara/api-client

Import and use the API client:

```typescript
import { ApiClient } from '@mnbara/api-client';

// Initialize client
const apiClient = new ApiClient('http://localhost:3000');

// Make requests
const user = await apiClient.get('/users/123');
const users = await apiClient.get('/users?role=admin');

// POST request
const newUser = await apiClient.post('/users', {
  email: 'new@example.com',
  firstName: 'Jane',
  lastName: 'Smith',
});

// PUT request
const updated = await apiClient.put('/users/123', {
  firstName: 'Janet',
});

// DELETE request
await apiClient.delete('/users/123');
```

## Service-Specific Examples

### Auth Service

See `src/config/shared-packages.ts` for examples of:
- Using types for auth requests/responses
- Validating authentication data
- Formatting user information
- Inter-service API communication

### User Service

See `src/config/shared-packages.ts` for examples of:
- Creating user profiles with shared types
- Validating user data
- Building service responses
- Using utilities for formatting

### Notification Service

See `src/config/shared-packages.ts` for examples of:
- Building notification payloads with shared types
- Formatting order and payment notifications
- Validating notification data
- Inter-service communication

## Best Practices

### 1. Always Use Shared Types

Instead of defining your own types, use the shared types from `@mnbara/types`:

```typescript
// ✅ Good
import type { User } from '@mnbara/types/user';

// ❌ Avoid
interface User {
  id: string;
  email: string;
  // ...
}
```

### 2. Use Validation Schemas

Always validate external input using shared schemas:

```typescript
// ✅ Good
import { userSchema } from '@mnbara/validation';

const validatedUser = userSchema.parse(userData);

// ❌ Avoid
const user = userData as User; // No validation
```

### 3. Use Utility Functions

Reuse utility functions instead of reimplementing:

```typescript
// ✅ Good
import { formatCurrency, formatDate } from '@mnbara/utils';

const formatted = formatCurrency(100, 'USD');

// ❌ Avoid
const formatted = `$${(100).toFixed(2)}`; // Reimplemented
```

### 4. Use API Client for Inter-Service Communication

Use the shared API client for service-to-service calls:

```typescript
// ✅ Good
import { ApiClient } from '@mnbara/api-client';

const client = new ApiClient(process.env.USER_SERVICE_URL);
const user = await client.get(`/users/${userId}`);

// ❌ Avoid
const response = await fetch(`${process.env.USER_SERVICE_URL}/users/${userId}`);
const user = await response.json();
```

## Troubleshooting

### Import Errors

If you get import errors, ensure:

1. The package is listed in `package.json` dependencies
2. The path mapping is correct in `tsconfig.json`
3. You've run `npm install` in the workspace root
4. The shared package has been built: `npm run build`

### Type Errors

If you get type errors:

1. Ensure you're importing from the correct path
2. Check that the type is exported from the shared package
3. Verify the TypeScript version matches (5.7+)

### Runtime Errors

If you get runtime errors:

1. Ensure the shared package is installed: `npm install`
2. Check that the shared package is built: `npm run build`
3. Verify the import path is correct

## Adding New Shared Packages

To add a new shared package:

1. Create the package in `packages/new-package/`
2. Add to `package.json` dependencies in each service
3. Add path mappings to each service's `tsconfig.json`
4. Update this documentation

## Related Documentation

- [Shared Packages README](../../packages/README.md)
- [Types Package](../../packages/types/README.md)
- [Utils Package](../../packages/utils/README.md)
- [Validation Package](../../packages/validation/README.md)
- [API Client Package](../../packages/api-client/README.md)

## Support

For questions or issues with shared packages integration, refer to:
- Individual package READMEs
- Example configuration files in each service
- Root workspace documentation
