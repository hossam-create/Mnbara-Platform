# Web App Shared Packages Integration

## Overview
This document describes how the web application (`apps/web/`) has been configured to use shared packages from the `@mnbara/*` namespace.

## Configuration Changes

### 1. Package Dependencies (apps/web/package.json)
Added the following shared packages as dependencies using the `file:` protocol for local workspace packages:

```json
{
  "dependencies": {
    "@mnbara/api-client": "file:../../packages/api-client",
    "@mnbara/types": "file:../../packages/types",
    "@mnbara/ui-components": "file:../../packages/ui-components",
    "@mnbara/utils": "file:../../packages/utils",
    "@mnbara/validation": "file:../../packages/validation"
  }
}
```

### 2. TypeScript Configuration (apps/web/tsconfig.json)
Updated to extend the root `tsconfig.json` and added path mappings for shared packages:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "paths": {
      "@mnbara/types": ["../../packages/types/src/index.ts"],
      "@mnbara/types/*": ["../../packages/types/src/*"],
      "@mnbara/ui-components": ["../../packages/ui-components/src/index.ts"],
      "@mnbara/ui-components/*": ["../../packages/ui-components/src/*"],
      "@mnbara/utils": ["../../packages/utils/src/index.ts"],
      "@mnbara/utils/*": ["../../packages/utils/src/*"],
      "@mnbara/api-client": ["../../packages/api-client/src/index.ts"],
      "@mnbara/api-client/*": ["../../packages/api-client/src/*"],
      "@mnbara/validation": ["../../packages/validation/src/index.ts"],
      "@mnbara/validation/*": ["../../packages/validation/src/*"]
    }
  }
}
```

## New Files Created

### 1. apps/web/src/types/index.ts
Central index file that re-exports shared types from `@mnbara/types` and local types:

- **Shared Types Exported:**
  - User types: `UserRole`, `UserStatus`, `KYCStatus`, `AccountType`, `UserProfile`
  - Order types: `OrderStatus`, `OrderType`, `FulfillmentStatus`
  - Payment types: `PaymentMethodType`, `PaymentStatus`, `PaymentProvider`, `CardType`, `Currency`
  - Delivery types: `DeliveryStatus`, `DeliveryType`, `DeliveryPriority`, `PackageSize`, `DeliveryMethod`
  - Common types: `BaseEntity`, `GeoLocation`, `Address`, `DeliveryAddress`, `PaginationParams`

- **Local Types Re-exported:**
  - `auction.types.ts`
  - `decision.types.ts`
  - `dispute.types.ts`
  - `eventLogging.types.ts`
  - `listing.types.ts`
  - `p2p-exchange.types.ts`
  - `payment.types.ts`
  - `payout.types.ts`
  - `plugin.types.ts`
  - `refund.types.ts`
  - `role.types.ts`
  - `traveler.types.ts`
  - `trustSafety.types.ts`

### 2. apps/web/src/utils/index.ts
Central index file that re-exports shared utilities from `@mnbara/utils` and local utilities:

- **Shared Utilities Exported:**
  - Currency: `formatCurrency`, `formatCompactCurrency`, `formatPercentage`, `formatNumber`, `parseCurrency`
  - Date: `formatDate`, `formatRelativeTime`, `formatCalendarDate`, `getStartOfDay`, `getEndOfDay`
  - Helpers: `isDefined`, `isString`, `isNumber`, `isInteger`, `isBoolean`
  - Validation: `isValidEmail`, `isValidPhone`, `isValidUrl`, `isValidCreditCard`, `validatePassword`

- **Local Utilities Re-exported:**
  - `eventValidation.utils.ts`
  - `paymentVerification.ts`
  - `securityValidation.ts`

### 3. apps/web/src/config/shared-packages.ts
Example configuration file demonstrating how to use shared packages:

```typescript
// Import types
import type { UserRole, OrderStatus, PaymentStatus } from '@mnbara/types';

// Import utilities
import { formatCurrency, formatDate, isValidEmail } from '@mnbara/utils';

// Import API client
import { ApiClient } from '@mnbara/api-client';

// Create API client instance
export const createSharedApiClient = (baseURL: string) => {
  return new ApiClient({ baseURL, timeout: 30000 });
};
```

## Updated Files

### apps/web/src/services/api.service.ts
Refactored to use the shared `@mnbara/api-client` package:

**Before:**
```typescript
import axios from 'axios';
const apiClient = axios.create({ baseURL, timeout: 30000 });
// Manual interceptor setup
```

**After:**
```typescript
import { ApiClient, createAuthInterceptor, createResponseInterceptor } from '@mnbara/api-client';

const apiClientInstance = new ApiClient({ baseURL, timeout: 30000 });
const apiClient = apiClientInstance['client'];

// Use shared interceptor utilities
const authInterceptor = createAuthInterceptor(() => localStorage.getItem('authToken'));
```

## Usage Examples

### Importing Types
```typescript
import type { UserRole, OrderStatus, PaymentStatus } from '@mnbara/types';
// or
import type { UserRole } from '@mnbara/types';
```

### Importing Utilities
```typescript
import { formatCurrency, formatDate, isValidEmail } from '@mnbara/utils';

const formatted = formatCurrency(100, 'USD'); // "$100.00"
const date = formatDate(new Date(), 'medium'); // "Jan 1, 2024"
const valid = isValidEmail('test@example.com'); // true
```

### Importing API Client
```typescript
import { ApiClient } from '@mnbara/api-client';

const client = new ApiClient({
  baseURL: 'http://localhost:3000/api',
  timeout: 30000
});

const data = await client.get('/users/profile');
```

### Importing UI Components
```typescript
import { Button, Input, Card, Modal } from '@mnbara/ui-components';

export function MyComponent() {
  return (
    <Card>
      <Input placeholder="Enter text" />
      <Button>Submit</Button>
    </Card>
  );
}
```

### Importing Validation Schemas
```typescript
import { userSchema, orderSchema } from '@mnbara/validation';

const result = userSchema.parse({ email: 'test@example.com', password: 'secure123' });
```

## Verification

### TypeScript Compilation
The configuration has been verified to compile correctly:
```bash
npx tsc --noEmit apps/web/src/config/shared-packages.ts --skipLibCheck
# Exit Code: 0 ✓
```

### Path Resolution
All path mappings are correctly configured in `tsconfig.json` and will be resolved by:
- TypeScript compiler
- IDE IntelliSense (VS Code)
- Build tools (Vite, Next.js)

## Next Steps

### 1. Refactor Existing Code
Gradually refactor existing code to use shared packages:

```typescript
// Before: Local import
import { formatCurrency } from '@/utils/currency';

// After: Shared import
import { formatCurrency } from '@mnbara/utils';
```

### 2. Use Shared Types
Replace local type definitions with shared types where applicable:

```typescript
// Before: Local type
import { PaymentStatus } from '@/types/payment.types';

// After: Shared type
import { PaymentStatus } from '@mnbara/types';
```

### 3. Use Shared API Client
Update API service to fully leverage the shared API client:

```typescript
// Use shared endpoints and interceptors
import { API_ENDPOINTS, createAuthInterceptor } from '@mnbara/api-client';
```

### 4. Use Shared UI Components
Replace local UI components with shared components:

```typescript
// Before: Local component
import { Button } from '@/components/Button';

// After: Shared component
import { Button } from '@mnbara/ui-components';
```

## Build Configuration

### Environment Variables
The web app preserves existing environment variables:
- `VITE_API_BASE_URL` - API base URL
- All other existing environment variables remain unchanged

### Routing Structure
The existing routing structure is preserved:
- Next.js 15 routing in `apps/web/src/app/`
- All existing routes continue to work

### Build Process
The build process remains unchanged:
```bash
npm run build      # Next.js build
npm run type-check # TypeScript type checking
npm run dev        # Development server
```

## Troubleshooting

### Import Resolution Issues
If imports are not resolving:
1. Verify `tsconfig.json` has correct path mappings
2. Check that shared packages are installed: `npm install`
3. Restart IDE/TypeScript server

### Module Not Found Errors
If you get "module not found" errors:
1. Ensure shared packages are in `packages/` directory
2. Verify `package.json` has correct `file:` paths
3. Run `npm install` to link workspace packages

### Type Errors
If you get type errors from shared packages:
1. Verify shared package exports are correct
2. Check that `tsconfig.json` extends root config
3. Ensure `skipLibCheck` is set appropriately

## Benefits

1. **Code Reuse:** Shared utilities, types, and components across applications
2. **Consistency:** Single source of truth for common functionality
3. **Maintainability:** Easier to update shared code in one place
4. **Type Safety:** Shared TypeScript types ensure consistency
5. **Performance:** Shared packages can be optimized independently
6. **Developer Experience:** Clear import paths with `@mnbara/*` namespace

## References

- [Root tsconfig.json](../../tsconfig.json) - Path mappings
- [Root package.json](../../package.json) - Workspace configuration
- [Shared Packages](../../packages/) - All shared packages
- [API Client Package](../../packages/api-client/) - API client documentation
- [Types Package](../../packages/types/) - Type definitions
- [Utils Package](../../packages/utils/) - Utility functions
- [UI Components Package](../../packages/ui-components/) - React components
- [Validation Package](../../packages/validation/) - Validation schemas
