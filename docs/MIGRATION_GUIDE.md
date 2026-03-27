# Migration Guide: Old Structure to New Monorepo

**Document Version:** 1.0  
**Last Updated:** March 2026  
**Status:** Active

## 📋 Overview

This guide helps developers transition from the old fragmented structure to the new Nx monorepo structure.

## 🗂️ Structure Mapping

### Old Structure → New Structure

#### Frontend Applications

| Old Location | New Location | Notes |
|---|---|---|
| `frontend/web-app/` | `apps/web/` | Main web application |
| `frontend/mobile-app/` | `apps/mobile/` | Mobile application |
| Other frontend apps | `apps/` | Consolidated into single web app |

#### Backend Services

| Old Location | New Location | Category |
|---|---|---|
| `backend/services/auth-service/` | `services/core/auth-service/` | Core |
| `backend/services/user-service/` | `services/core/user-service/` | Core |
| `backend/services/notification-service/` | `services/core/notification-service/` | Core |
| `backend/services/product-service/` | `services/marketplace/product-service/` | Marketplace |
| `backend/services/order-service/` | `services/marketplace/order-service/` | Marketplace |
| `backend/services/cart-service/` | `services/marketplace/cart-service/` | Marketplace |
| `backend/services/trips-service/` | `services/crowdshipping/trips-service/` | Crowdshipping |
| `backend/services/matching-service/` | `services/crowdshipping/matching-service/` | Crowdshipping |
| `backend/services/payment-service/` | `services/financial/payment-service/` | Financial |
| `backend/services/wallet-service/` | `services/financial/wallet-service/` | Financial |
| `backend/services/escrow-service/` | `services/financial/escrow-service/` | Financial |

#### Shared Code

| Old Location | New Location | Package Name |
|---|---|---|
| Various type definitions | `packages/types/src/` | `@mnbara/types` |
| UI components | `packages/ui-components/src/` | `@mnbara/ui-components` |
| Utility functions | `packages/utils/src/` | `@mnbara/utils` |
| API client code | `packages/api-client/src/` | `@mnbara/api-client` |
| Validation schemas | `packages/validation/src/` | `@mnbara/validation` |

#### Infrastructure

| Old Location | New Location | Notes |
|---|---|---|
| `infrastructure/` | `infrastructure/` | Preserved as-is |
| `docs/` | `docs/` | Preserved as-is |
| `archive/` | `archive/` | Preserved as-is |

## 🔄 Import Path Changes

### Type Imports

**Before:**
```typescript
import { User, Order } from '../../../backend/shared/types';
import { User } from '../types/user.types';
```

**After:**
```typescript
import { User, Order } from '@mnbara/types';
```

### UI Component Imports

**Before:**
```typescript
import { Button } from '../components/Button';
import { Button } from '../../web-app/src/components/Button';
```

**After:**
```typescript
import { Button, Input, Card } from '@mnbara/ui-components';
```

### Utility Imports

**Before:**
```typescript
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../../shared/utils/date';
```

**After:**
```typescript
import { formatCurrency, formatDate } from '@mnbara/utils';
```

### API Client Imports

**Before:**
```typescript
import { ApiClient } from '../api/client';
import axios from 'axios';
```

**After:**
```typescript
import { ApiClient } from '@mnbara/api-client';
```

### Validation Imports

**Before:**
```typescript
import { validateUser } from '../validation/user';
import { z } from 'zod';
```

**After:**
```typescript
import { userSchema } from '@mnbara/validation';
```

## 📦 Package Installation

### Using Shared Packages

All shared packages are installed in the root `package.json`:

```bash
# Install dependencies
npm install

# Packages are automatically available
import { Button } from '@mnbara/ui-components';
```

### Path Aliases

TypeScript path aliases are configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@mnbara/types": ["packages/types/src"],
      "@mnbara/ui-components": ["packages/ui-components/src"],
      "@mnbara/utils": ["packages/utils/src"],
      "@mnbara/api-client": ["packages/api-client/src"],
      "@mnbara/validation": ["packages/validation/src"]
    }
  }
}
```

## 🚀 Development Workflow Changes

### Starting Development

**Before:**
```bash
# Start web app
cd frontend/web-app
npm run dev

# Start service in another terminal
cd backend/services/auth-service
npm run dev
```

**After:**
```bash
# Start all services
npm run dev

# Or start specific service
nx serve apps/web
nx serve services/core/auth-service
```

### Building

**Before:**
```bash
# Build web app
cd frontend/web-app
npm run build

# Build service
cd backend/services/auth-service
npm run build
```

**After:**
```bash
# Build all
npm run build

# Build specific project
nx build apps/web
nx build @mnbara/types
```

### Testing

**Before:**
```bash
# Test web app
cd frontend/web-app
npm run test

# Test service
cd backend/services/auth-service
npm run test
```

**After:**
```bash
# Test all
npm run test

# Test specific project
nx test apps/web
nx test @mnbara/types
```

### Linting

**Before:**
```bash
# Lint web app
cd frontend/web-app
npm run lint

# Lint service
cd backend/services/auth-service
npm run lint
```

**After:**
```bash
# Lint all
npm run lint

# Lint specific project
nx lint apps/web
nx lint @mnbara/types
```

## 📝 File Organization

### Web Application

**Before:**
```
frontend/web-app/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   └── types/
```

**After:**
```
apps/web/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   └── types/
```

### Service

**Before:**
```
backend/services/auth-service/
├── src/
│   ├── controllers/
│   ├── services/
│   ├── middleware/
│   └── types/
```

**After:**
```
services/core/auth-service/
├── src/
│   ├── controllers/
│   ├── services/
│   ├── middleware/
│   └── types/
```

## 🔗 Dependency Management

### Shared Package Dependencies

All shared packages are listed in root `package.json`:

```json
{
  "dependencies": {
    "@mnbara/types": "workspace:*",
    "@mnbara/ui-components": "workspace:*",
    "@mnbara/utils": "workspace:*",
    "@mnbara/api-client": "workspace:*",
    "@mnbara/validation": "workspace:*"
  }
}
```

### Service Dependencies

Services can depend on shared packages:

```json
{
  "dependencies": {
    "@mnbara/types": "workspace:*",
    "@mnbara/validation": "workspace:*",
    "@mnbara/utils": "workspace:*"
  }
}
```

## 🔍 Finding Code

### Locating a Service

**Before:**
```bash
# Search in backend directory
find backend/services -name "*auth*"
```

**After:**
```bash
# Services are organized by category
services/core/auth-service/
services/marketplace/product-service/
services/crowdshipping/trips-service/
services/financial/payment-service/
```

### Locating Shared Code

**Before:**
```bash
# Search across multiple locations
find . -name "*.types.ts"
find . -name "Button.tsx"
```

**After:**
```bash
# All shared code in packages/
packages/types/src/
packages/ui-components/src/
packages/utils/src/
packages/api-client/src/
packages/validation/src/
```

## 🐛 Troubleshooting

### Import Errors

**Problem:** `Cannot find module '@mnbara/types'`

**Solution:**
1. Verify package exists in `packages/`
2. Check `tsconfig.json` path aliases
3. Run `npm install`
4. Restart IDE

### Build Errors

**Problem:** `nx build` fails with module not found

**Solution:**
1. Check import paths use `@mnbara/*` format
2. Verify package is listed in `package.json`
3. Run `npm install` to ensure dependencies installed
4. Check for circular dependencies: `nx graph`

### Type Errors

**Problem:** TypeScript errors for imported types

**Solution:**
1. Verify types are exported from package `index.ts`
2. Check `tsconfig.json` includes package path
3. Ensure package is built: `nx build @mnbara/types`
4. Restart TypeScript server in IDE

## 📚 Common Tasks

### Adding a New Service

```bash
# Generate new NestJS service
nx generate @nx/nest:application --name=my-service --directory=services/core

# Or manually create structure
mkdir -p services/core/my-service/src
cd services/core/my-service
npm init -y
```

### Adding a New Shared Package

```bash
# Generate new library
nx generate @nx/node:library --name=my-package --directory=packages

# Or manually create structure
mkdir -p packages/my-package/src
cd packages/my-package
npm init -y
```

### Updating Shared Package

```bash
# Make changes to package
cd packages/my-package/src
# ... edit files ...

# Build package
nx build @mnbara/my-package

# Test package
nx test @mnbara/my-package
```

### Using Shared Package in Service

```typescript
// In service code
import { MyType } from '@mnbara/types';
import { MyComponent } from '@mnbara/ui-components';
import { myUtil } from '@mnbara/utils';

// Use imported items
const item: MyType = { /* ... */ };
```

## 🔄 Git Workflow

### Cloning Repository

```bash
# Clone monorepo
git clone <repository-url>
cd mnbara-platform

# Install all dependencies
npm install

# Verify setup
npm run verify-setup
```

### Creating Feature Branch

```bash
# Create feature branch
git checkout -b feat/add-user-authentication

# Make changes across multiple packages
# Edit apps/web/src/...
# Edit services/core/auth-service/src/...
# Edit packages/types/src/...

# Commit changes
git add .
git commit -m "feat(auth): add JWT token refresh"

# Push branch
git push origin feat/add-user-authentication
```

### Creating Pull Request

```bash
# PR should include changes across monorepo
# Example: Adding authentication feature

# Changes in:
# - apps/web/src/pages/login.tsx
# - services/core/auth-service/src/controllers/auth.controller.ts
# - packages/types/src/auth.types.ts
# - packages/validation/src/auth.schema.ts

# All changes in single PR for atomic feature
```

## 📖 Documentation References

- [README.md](../../README.md) - Project overview
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Development guidelines
- [docs/architecture/NEW_STRUCTURE.md](./architecture/NEW_STRUCTURE.md) - Architecture details
- [docs/DEVELOPMENT_SCRIPTS.md](./DEVELOPMENT_SCRIPTS.md) - Available scripts

## ❓ FAQ

**Q: Can I still access old code?**
A: Yes, old code is preserved in the `archive/` directory for reference.

**Q: Do I need to update all imports immediately?**
A: No, but new code should use the new import paths. Update old code as you work on it.

**Q: How do I know which package to use?**
A: Check the package README in `packages/*/README.md` for usage examples.

**Q: What if I need a new shared package?**
A: Create it in `packages/` following the same structure as existing packages.

**Q: How do I debug services?**
A: Use `nx serve` with `--debug` flag or attach debugger to running process.

---

**Last Updated:** March 2026  
**Version:** 1.0
