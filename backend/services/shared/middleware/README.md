# Shared Permission Middleware

This directory contains reusable permission and authorization middleware that can be used across all MNBARA microservices.

## Overview

The permission middleware provides role-based access control (RBAC) and resource-level permissions for protecting API endpoints.

## Features

- **Role-Based Access Control**: Check if a user's role has permission for specific actions
- **Resource-Level Permissions**: Verify ownership of resources before allowing access
- **Combined Checks**: Combine role and ownership checks in a single middleware chain
- **Admin Shortcuts**: Quick middleware for admin-only and super-admin-only routes
- **KYC Verification**: Ensure users have completed KYC before accessing traveler features

## Installation

Since this is a shared module within the monorepo, import it directly:

```typescript
import {
    checkPermission,
    checkOwnership,
    authorizeRoles,
    adminOnly,
    UserRole,
    ResourceType,
    PermissionAction,
} from '../shared/middleware';
```

## Usage

### 1. Basic Permission Check

Check if the authenticated user has permission to perform an action on a resource:

```typescript
import { Router } from 'express';
import { authenticate } from './middleware/auth.middleware';
import { checkPermission } from '../shared/middleware';

const router = Router();

// Only users with 'create' permission on 'listing' resource can access
router.post(
    '/listings',
    authenticate,
    checkPermission('listing', 'create'),
    listingController.create
);

// Only users with 'read' permission on 'analytics' can access
router.get(
    '/analytics',
    authenticate,
    checkPermission('analytics', 'read'),
    analyticsController.getStats
);
```

### 2. Role-Based Authorization

Restrict access to specific roles:

```typescript
import { authorizeRoles, adminOnly, superAdminOnly } from '../shared/middleware';

// Allow only SELLER and ADMIN roles
router.post(
    '/listings',
    authenticate,
    authorizeRoles('SELLER', 'ADMIN'),
    listingController.create
);

// Admin only (ADMIN or SUPER_ADMIN)
router.get(
    '/admin/users',
    authenticate,
    adminOnly,
    adminController.getUsers
);

// Super admin only
router.delete(
    '/admin/users/:id',
    authenticate,
    superAdminOnly,
    adminController.deleteUser
);
```

### 3. Resource Ownership Check

Ensure users can only access their own resources:

```typescript
import { checkOwnership } from '../shared/middleware';
import { prisma } from './prisma';

// Users can only update their own listings (admins can bypass)
router.patch(
    '/listings/:id',
    authenticate,
    checkOwnership({
        paramName: 'id',
        ownerField: 'sellerId',
        getResource: async (id) => {
            return await prisma.listing.findUnique({
                where: { id: parseInt(id as string) },
            });
        },
        allowAdmin: true, // Admins can access any listing
    }),
    listingController.update
);
```

### 4. Combined Permission and Ownership

Check both role permission and resource ownership:

```typescript
import { checkPermissionAndOwnership } from '../shared/middleware';

// User must have 'update' permission on 'order' AND own the order
router.patch(
    '/orders/:id',
    authenticate,
    ...checkPermissionAndOwnership('order', 'update', {
        paramName: 'id',
        ownerField: 'buyerId',
        getResource: async (id) => {
            return await prisma.order.findUnique({
                where: { id: parseInt(id as string) },
            });
        },
    }),
    orderController.update
);
```

### 5. Self or Admin Access

Allow users to access their own resources or admins to access any:

```typescript
import { selfOrAdmin } from '../shared/middleware';

// Users can view their own profile, admins can view any profile
router.get(
    '/users/:userId',
    authenticate,
    selfOrAdmin('userId'),
    userController.getProfile
);
```

### 6. KYC Verification

Require KYC verification for traveler features:

```typescript
import { kycVerified } from '../shared/middleware';
import { checkKycStatus } from './services/kyc.service';

// Only KYC-verified users can create trips
router.post(
    '/trips',
    authenticate,
    authorizeRoles('TRAVELER'),
    kycVerified(checkKycStatus),
    tripController.create
);
```

## Permission Matrix

The system defines permissions for the following roles:

- **USER**: Basic read access to own profile and listings
- **BUYER**: Can browse, bid, purchase, and create disputes
- **SELLER**: Can create/manage listings, view orders and analytics
- **TRAVELER**: Can create trips, accept delivery requests, requires KYC
- **ADMIN**: Can manage users, disputes, KYC approvals, view analytics
- **SUPER_ADMIN**: Full access to all resources and system settings

### Resources

- `user`, `listing`, `auction`, `order`, `payment`
- `trip`, `delivery`, `dispute`, `kyc`
- `reward`, `notification`, `analytics`, `settings`

### Actions

- `create`: Create new resources
- `read`: View resources
- `update`: Modify existing resources
- `delete`: Remove resources
- `manage`: Full control (implies all other actions)

## Type Definitions

```typescript
type UserRole = 'USER' | 'SELLER' | 'TRAVELER' | 'BUYER' | 'ADMIN' | 'SUPER_ADMIN';

type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage';

type ResourceType =
    | 'user' | 'listing' | 'auction' | 'order' | 'payment'
    | 'trip' | 'delivery' | 'dispute' | 'kyc'
    | 'reward' | 'notification' | 'analytics' | 'settings';

interface OwnershipCheckOptions {
    paramName?: string;           // Default: 'id'
    ownerField?: string;          // Default: 'userId'
    getResource: (id: string | number) => Promise<any | null>;
    allowAdmin?: boolean;         // Default: true
}
```

## Utility Functions

```typescript
import { hasPermission, getRolePermissions, isAdmin, isSuperAdmin } from '../shared/middleware';

// Check if a role has permission
const canCreate = hasPermission('SELLER', 'listing', 'create'); // true

// Get all permissions for a role
const sellerPerms = getRolePermissions('SELLER');

// Check if role is admin
const isAdminRole = isAdmin('ADMIN'); // true
const isSuperAdminRole = isSuperAdmin('SUPER_ADMIN'); // true
```

## Error Responses

The middleware returns standardized error responses:

### 401 Unauthorized
```json
{
    "success": false,
    "message": "Authentication required",
    "code": "AUTH_REQUIRED"
}
```

### 403 Forbidden (Permission Denied)
```json
{
    "success": false,
    "message": "You do not have permission to create listing",
    "code": "PERMISSION_DENIED"
}
```

### 403 Forbidden (Ownership Required)
```json
{
    "success": false,
    "message": "You do not have permission to access this resource",
    "code": "OWNERSHIP_REQUIRED"
}
```

### 403 Forbidden (Role Required)
```json
{
    "success": false,
    "message": "Insufficient role permissions",
    "code": "ROLE_REQUIRED",
    "requiredRoles": ["SELLER", "ADMIN"]
}
```

### 404 Not Found
```json
{
    "success": false,
    "message": "Resource not found",
    "code": "RESOURCE_NOT_FOUND"
}
```

## Best Practices

1. **Always authenticate first**: Use `authenticate` middleware before permission checks
2. **Order matters**: Place permission checks before controller logic
3. **Use specific permissions**: Prefer `checkPermission` over broad role checks
4. **Combine when needed**: Use `checkPermissionAndOwnership` for resource-specific operations
5. **Document requirements**: Add comments explaining why specific permissions are needed
6. **Test thoroughly**: Ensure permission checks work for all roles and edge cases

## Example Service Integration

```typescript
// listing-service/src/routes/listing.routes.ts
import { Router } from 'express';
import { authenticate } from './middleware/auth.middleware';
import {
    checkPermission,
    checkOwnership,
    authorizeRoles,
} from '../shared/middleware';
import { ListingController } from './controllers/listing.controller';
import { prisma } from './prisma';

const router = Router();
const controller = new ListingController();

// Public routes
router.get('/listings', controller.getAll);
router.get('/listings/:id', controller.getById);

// Seller routes
router.post(
    '/listings',
    authenticate,
    authorizeRoles('SELLER', 'ADMIN'),
    checkPermission('listing', 'create'),
    controller.create
);

router.patch(
    '/listings/:id',
    authenticate,
    checkPermission('listing', 'update'),
    checkOwnership({
        paramName: 'id',
        ownerField: 'sellerId',
        getResource: async (id) => {
            return await prisma.listing.findUnique({
                where: { id: parseInt(id as string) },
            });
        },
    }),
    controller.update
);

router.delete(
    '/listings/:id',
    authenticate,
    checkPermission('listing', 'delete'),
    checkOwnership({
        paramName: 'id',
        ownerField: 'sellerId',
        getResource: async (id) => {
            return await prisma.listing.findUnique({
                where: { id: parseInt(id as string) },
            });
        },
    }),
    controller.delete
);

export default router;
```

## Testing

When testing routes with permission middleware, ensure you:

1. Test with different user roles
2. Test ownership scenarios (own resource vs. others')
3. Test admin bypass functionality
4. Test error responses for unauthorized access
5. Test edge cases (missing user, invalid resource ID, etc.)

```typescript
// Example test
describe('Listing Routes', () => {
    it('should allow seller to create listing', async () => {
        const token = generateToken({ userId: 1, role: 'SELLER' });
        const response = await request(app)
            .post('/listings')
            .set('Authorization', `Bearer ${token}`)
            .send(listingData);
        
        expect(response.status).toBe(201);
    });

    it('should deny buyer from creating listing', async () => {
        const token = generateToken({ userId: 2, role: 'BUYER' });
        const response = await request(app)
            .post('/listings')
            .set('Authorization', `Bearer ${token}`)
            .send(listingData);
        
        expect(response.status).toBe(403);
        expect(response.body.code).toBe('PERMISSION_DENIED');
    });
});
```
