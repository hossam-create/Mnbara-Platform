# Permission Middleware Integration Guide

This guide shows how to integrate the shared permission middleware into MNBARA microservices.

## Prerequisites

1. Your service must have authentication middleware that attaches `req.user` with the following structure:
```typescript
req.user = {
    id: number;
    email: string;
    role: UserRole; // 'USER' | 'BUYER' | 'SELLER' | 'TRAVELER' | 'ADMIN' | 'SUPER_ADMIN'
}
```

2. Your service should have Prisma or another ORM set up for database access (needed for ownership checks).

## Step 1: Create Authentication Middleware

If your service doesn't have authentication middleware, create one that validates JWT tokens:

```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
    userId: number;
    email: string;
    role: string;
}

export const authenticate: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'Access token required',
            });
            return;
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'secret'
        ) as JwtPayload;

        // Attach user to request
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };

        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
        });
    }
};
```

## Step 2: Import Shared Middleware

In your route files, import the permission middleware:

```typescript
// src/routes/listing.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
    checkPermission,
    checkOwnership,
    checkPermissionAndOwnership,
    authorizeRoles,
    adminOnly,
} from '../../shared/middleware';
```

## Step 3: Apply Middleware to Routes

### Example 1: Listing Service

```typescript
// src/routes/listing.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
    checkPermission,
    checkOwnership,
    authorizeRoles,
} from '../../shared/middleware';
import { ListingController } from '../controllers/listing.controller';
import { prisma } from '../prisma';

const router = Router();
const controller = new ListingController();

// Public routes - no authentication
router.get('/listings', controller.getAll);
router.get('/listings/:id', controller.getById);
router.get('/listings/search', controller.search);

// Protected routes - require authentication and permissions

// Create listing - only SELLER and ADMIN can create
router.post(
    '/listings',
    authenticate,
    authorizeRoles('SELLER', 'ADMIN'),
    checkPermission('listing', 'create'),
    controller.create
);

// Update listing - must be owner or admin
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
        allowAdmin: true,
    }),
    controller.update
);

// Delete listing - must be owner or admin
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

// Get seller's own listings
router.get(
    '/listings/my-listings',
    authenticate,
    authorizeRoles('SELLER', 'ADMIN'),
    controller.getMyListings
);

export default router;
```

### Example 2: Order Service

```typescript
// src/routes/order.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
    checkPermission,
    checkOwnership,
    selfOrAdmin,
} from '../../shared/middleware';
import { OrderController } from '../controllers/order.controller';
import { prisma } from '../prisma';

const router = Router();
const controller = new OrderController();

// Create order - buyers only
router.post(
    '/orders',
    authenticate,
    checkPermission('order', 'create'),
    controller.create
);

// Get user's orders
router.get(
    '/orders/my-orders',
    authenticate,
    controller.getMyOrders
);

// Get specific order - must be buyer, seller, or admin
router.get(
    '/orders/:id',
    authenticate,
    checkOwnership({
        paramName: 'id',
        ownerField: 'buyerId', // Check if user is the buyer
        getResource: async (id) => {
            const order = await prisma.order.findUnique({
                where: { id: parseInt(id as string) },
            });
            return order;
        },
        allowAdmin: true,
    }),
    controller.getById
);

// Update order status - seller or admin only
router.patch(
    '/orders/:id/status',
    authenticate,
    checkPermission('order', 'update'),
    controller.updateStatus
);

export default router;
```

### Example 3: Trip Service (with KYC verification)

```typescript
// src/routes/trip.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
    checkPermission,
    checkOwnership,
    authorizeRoles,
    kycVerified,
} from '../../shared/middleware';
import { TripController } from '../controllers/trip.controller';
import { prisma } from '../prisma';
import { checkKycStatus } from '../services/kyc.service';

const router = Router();
const controller = new TripController();

// Get all trips (public)
router.get('/trips', controller.getAll);

// Create trip - travelers only, KYC required
router.post(
    '/trips',
    authenticate,
    authorizeRoles('TRAVELER', 'ADMIN'),
    checkPermission('trip', 'create'),
    kycVerified(checkKycStatus),
    controller.create
);

// Update trip - must be owner
router.patch(
    '/trips/:id',
    authenticate,
    checkPermission('trip', 'update'),
    checkOwnership({
        paramName: 'id',
        ownerField: 'travelerId',
        getResource: async (id) => {
            return await prisma.trip.findUnique({
                where: { id: parseInt(id as string) },
            });
        },
    }),
    controller.update
);

// Get traveler's trips
router.get(
    '/trips/my-trips',
    authenticate,
    authorizeRoles('TRAVELER', 'ADMIN'),
    controller.getMyTrips
);

export default router;
```

### Example 4: Admin Service

```typescript
// src/routes/admin.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
    adminOnly,
    superAdminOnly,
    checkPermission,
} from '../../shared/middleware';
import { AdminController } from '../controllers/admin.controller';

const router = Router();
const controller = new AdminController();

// All admin routes require authentication
router.use(authenticate);

// Admin dashboard - any admin
router.get('/dashboard', adminOnly, controller.getDashboard);

// User management - admin only
router.get(
    '/users',
    adminOnly,
    checkPermission('user', 'read'),
    controller.getUsers
);

router.patch(
    '/users/:id/status',
    adminOnly,
    checkPermission('user', 'update'),
    controller.updateUserStatus
);

// KYC management - admin only
router.get(
    '/kyc/pending',
    adminOnly,
    checkPermission('kyc', 'read'),
    controller.getPendingKyc
);

router.patch(
    '/kyc/:id/approve',
    adminOnly,
    checkPermission('kyc', 'manage'),
    controller.approveKyc
);

// Dispute resolution - admin only
router.get(
    '/disputes',
    adminOnly,
    checkPermission('dispute', 'read'),
    controller.getDisputes
);

router.patch(
    '/disputes/:id/resolve',
    adminOnly,
    checkPermission('dispute', 'manage'),
    controller.resolveDispute
);

// System settings - super admin only
router.get(
    '/settings',
    superAdminOnly,
    checkPermission('settings', 'read'),
    controller.getSettings
);

router.patch(
    '/settings',
    superAdminOnly,
    checkPermission('settings', 'update'),
    controller.updateSettings
);

export default router;
```

## Step 4: Implement KYC Check Function (if needed)

For services that require KYC verification (like trips-service):

```typescript
// src/services/kyc.service.ts
import { prisma } from '../prisma';

export async function checkKycStatus(userId: number): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { kycStatus: true },
    });

    return user?.kycStatus === 'VERIFIED';
}
```

## Step 5: Handle Custom Ownership Logic

For complex ownership scenarios, you can customize the ownership check:

```typescript
// Example: Order can be accessed by buyer OR seller
router.get(
    '/orders/:id',
    authenticate,
    async (req, res, next) => {
        try {
            const orderId = parseInt(req.params.id);
            const order = await prisma.order.findUnique({
                where: { id: orderId },
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found',
                });
            }

            const userRole = req.user!.role;
            const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
            const isBuyer = order.buyerId === req.user!.id;
            const isSeller = order.sellerId === req.user!.id;

            if (!isAdmin && !isBuyer && !isSeller) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to access this order',
                });
            }

            // Attach order to request for controller use
            (req as any).order = order;
            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error checking order access',
            });
        }
    },
    controller.getById
);
```

## Common Patterns

### Pattern 1: Public Read, Protected Write
```typescript
// Anyone can view, only authenticated users with permission can create/update
router.get('/resources', controller.getAll);
router.get('/resources/:id', controller.getById);
router.post('/resources', authenticate, checkPermission('resource', 'create'), controller.create);
router.patch('/resources/:id', authenticate, checkPermission('resource', 'update'), controller.update);
```

### Pattern 2: Role-Specific Access
```typescript
// Different roles have different access
router.post('/listings', authenticate, authorizeRoles('SELLER', 'ADMIN'), controller.create);
router.post('/bids', authenticate, authorizeRoles('BUYER', 'ADMIN'), controller.placeBid);
router.post('/trips', authenticate, authorizeRoles('TRAVELER', 'ADMIN'), controller.createTrip);
```

### Pattern 3: Self or Admin
```typescript
// Users can access their own resources, admins can access all
router.get('/users/:userId/profile', authenticate, selfOrAdmin('userId'), controller.getProfile);
router.patch('/users/:userId/settings', authenticate, selfOrAdmin('userId'), controller.updateSettings);
```

### Pattern 4: Ownership Required
```typescript
// Must own the resource to modify it
router.patch(
    '/listings/:id',
    authenticate,
    checkOwnership({
        paramName: 'id',
        ownerField: 'sellerId',
        getResource: async (id) => prisma.listing.findUnique({ where: { id: parseInt(id) } }),
    }),
    controller.update
);
```

## Testing

Create tests to verify permission checks work correctly:

```typescript
// __tests__/routes/listing.routes.test.ts
import request from 'supertest';
import app from '../app';
import { generateToken } from '../utils/jwt';

describe('Listing Routes - Permissions', () => {
    describe('POST /listings', () => {
        it('should allow SELLER to create listing', async () => {
            const token = generateToken({ userId: 1, role: 'SELLER', email: 'seller@test.com' });
            
            const response = await request(app)
                .post('/listings')
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Test Listing', price: 100 });
            
            expect(response.status).toBe(201);
        });

        it('should deny BUYER from creating listing', async () => {
            const token = generateToken({ userId: 2, role: 'BUYER', email: 'buyer@test.com' });
            
            const response = await request(app)
                .post('/listings')
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Test Listing', price: 100 });
            
            expect(response.status).toBe(403);
            expect(response.body.code).toBe('PERMISSION_DENIED');
        });

        it('should deny unauthenticated requests', async () => {
            const response = await request(app)
                .post('/listings')
                .send({ title: 'Test Listing', price: 100 });
            
            expect(response.status).toBe(401);
        });
    });

    describe('PATCH /listings/:id', () => {
        it('should allow owner to update their listing', async () => {
            const token = generateToken({ userId: 1, role: 'SELLER', email: 'seller@test.com' });
            
            const response = await request(app)
                .patch('/listings/1')
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Updated Title' });
            
            expect(response.status).toBe(200);
        });

        it('should deny non-owner from updating listing', async () => {
            const token = generateToken({ userId: 2, role: 'SELLER', email: 'other@test.com' });
            
            const response = await request(app)
                .patch('/listings/1')
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Updated Title' });
            
            expect(response.status).toBe(403);
            expect(response.body.code).toBe('OWNERSHIP_REQUIRED');
        });

        it('should allow admin to update any listing', async () => {
            const token = generateToken({ userId: 3, role: 'ADMIN', email: 'admin@test.com' });
            
            const response = await request(app)
                .patch('/listings/1')
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Admin Update' });
            
            expect(response.status).toBe(200);
        });
    });
});
```

## Troubleshooting

### Issue: "Property 'user' does not exist on type 'Request'"

**Solution**: Ensure you have the type declaration in your service:

```typescript
// src/types/express.d.ts
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                email: string;
                role: string;
            };
        }
    }
}

export {};
```

### Issue: Permission check passes but shouldn't

**Solution**: Verify the role in the JWT token matches the expected UserRole type exactly (case-sensitive).

### Issue: Ownership check fails for valid owner

**Solution**: Ensure the `ownerField` matches the actual field name in your database schema and that the comparison uses the correct type (number vs string).

## Summary

1. Create authentication middleware that attaches `req.user`
2. Import shared permission middleware functions
3. Apply middleware in the correct order: `authenticate` → `checkPermission` → `checkOwnership`
4. Use appropriate middleware for each route's requirements
5. Test thoroughly with different roles and scenarios

For more details, see the [README.md](./README.md) in this directory.
