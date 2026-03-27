import { Request, Response, NextFunction, RequestHandler } from 'express';
import { UserRole } from '../types';

/**
 * Permission action types
 */
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage';

/**
 * Resource types in the system
 */
export type ResourceType =
    | 'user'
    | 'listing'
    | 'auction'
    | 'order'
    | 'payment'
    | 'trip'
    | 'delivery'
    | 'dispute'
    | 'kyc'
    | 'reward'
    | 'notification'
    | 'analytics'
    | 'settings';

/**
 * Permission definition
 */
export interface Permission {
    resource: ResourceType;
    actions: PermissionAction[];
}

/**
 * Role-based permission matrix
 * Defines what each role can do with each resource
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    USER: [
        { resource: 'user', actions: ['read', 'update'] }, // Own profile only
        { resource: 'listing', actions: ['read'] },
        { resource: 'auction', actions: ['read'] },
        { resource: 'order', actions: ['read'] }, // Own orders only
        { resource: 'notification', actions: ['read', 'update'] },
    ],
    BUYER: [
        { resource: 'user', actions: ['read', 'update'] },
        { resource: 'listing', actions: ['read'] },
        { resource: 'auction', actions: ['read', 'create'] }, // Can place bids
        { resource: 'order', actions: ['read', 'create'] },
        { resource: 'payment', actions: ['read', 'create'] },
        { resource: 'dispute', actions: ['read', 'create'] },
        { resource: 'reward', actions: ['read'] },
        { resource: 'notification', actions: ['read', 'update'] },
    ],
    SELLER: [
        { resource: 'user', actions: ['read', 'update'] },
        { resource: 'listing', actions: ['read', 'create', 'update', 'delete'] },
        { resource: 'auction', actions: ['read', 'create', 'update'] },
        { resource: 'order', actions: ['read', 'update'] },
        { resource: 'payment', actions: ['read'] },
        { resource: 'dispute', actions: ['read', 'update'] },
        { resource: 'reward', actions: ['read'] },
        { resource: 'notification', actions: ['read', 'update'] },
        { resource: 'analytics', actions: ['read'] }, // Own analytics
    ],
    TRAVELER: [
        { resource: 'user', actions: ['read', 'update'] },
        { resource: 'listing', actions: ['read'] },
        { resource: 'trip', actions: ['read', 'create', 'update', 'delete'] },
        { resource: 'delivery', actions: ['read', 'update'] },
        { resource: 'order', actions: ['read', 'update'] },
        { resource: 'payment', actions: ['read'] },
        { resource: 'kyc', actions: ['read', 'create'] }, // Own KYC
        { resource: 'reward', actions: ['read'] },
        { resource: 'notification', actions: ['read', 'update'] },
    ],
    ADMIN: [
        { resource: 'user', actions: ['read', 'update', 'delete'] },
        { resource: 'listing', actions: ['read', 'update', 'delete'] },
        { resource: 'auction', actions: ['read', 'update', 'delete'] },
        { resource: 'order', actions: ['read', 'update'] },
        { resource: 'payment', actions: ['read', 'update'] },
        { resource: 'trip', actions: ['read', 'update'] },
        { resource: 'delivery', actions: ['read', 'update'] },
        { resource: 'dispute', actions: ['read', 'update', 'manage'] },
        { resource: 'kyc', actions: ['read', 'update', 'manage'] },
        { resource: 'reward', actions: ['read', 'update'] },
        { resource: 'notification', actions: ['read', 'create', 'update'] },
        { resource: 'analytics', actions: ['read'] },
    ],
    SUPER_ADMIN: [
        { resource: 'user', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'listing', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'auction', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'order', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'payment', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'trip', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'delivery', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'dispute', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'kyc', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'reward', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'notification', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'analytics', actions: ['read', 'manage'] },
        { resource: 'settings', actions: ['read', 'update', 'manage'] },
    ],
};

/**
 * Check if a role has permission for a specific action on a resource
 */
export function hasPermission(
    role: UserRole,
    resource: ResourceType,
    action: PermissionAction
): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;

    const resourcePermission = permissions.find((p) => p.resource === resource);
    if (!resourcePermission) return false;

    // 'manage' permission implies all other actions
    if (resourcePermission.actions.includes('manage')) return true;

    return resourcePermission.actions.includes(action);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
}


/**
 * Permission check middleware
 * Verifies user has permission for a specific action on a resource
 */
export const checkPermission = (
    resource: ResourceType,
    action: PermissionAction
): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED',
            });
            return;
        }

        const userRole = req.user.role as UserRole;

        if (!hasPermission(userRole, resource, action)) {
            res.status(403).json({
                success: false,
                message: `You do not have permission to ${action} ${resource}`,
                code: 'PERMISSION_DENIED',
            });
            return;
        }

        next();
    };
};

/**
 * Resource ownership check options
 */
export interface OwnershipCheckOptions {
    /** Parameter name containing the resource ID (default: 'id') */
    paramName?: string;
    /** Field name in the resource that contains the owner ID (default: 'userId') */
    ownerField?: string;
    /** Function to fetch the resource by ID */
    getResource: (id: string | number) => Promise<{ [key: string]: any } | null>;
    /** Allow admins to bypass ownership check (default: true) */
    allowAdmin?: boolean;
}

/**
 * Resource ownership middleware
 * Ensures user can only access/modify their own resources
 */
export const checkOwnership = (options: OwnershipCheckOptions): RequestHandler => {
    const {
        paramName = 'id',
        ownerField = 'userId',
        getResource,
        allowAdmin = true,
    } = options;

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                });
                return;
            }

            const userRole = req.user.role as UserRole;

            // Allow admins to bypass ownership check if configured
            if (allowAdmin && (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN')) {
                next();
                return;
            }

            const resourceId = req.params[paramName];
            if (!resourceId) {
                res.status(400).json({
                    success: false,
                    message: 'Resource ID required',
                    code: 'RESOURCE_ID_REQUIRED',
                });
                return;
            }

            const resource = await getResource(resourceId);
            if (!resource) {
                res.status(404).json({
                    success: false,
                    message: 'Resource not found',
                    code: 'RESOURCE_NOT_FOUND',
                });
                return;
            }

            const ownerId = resource[ownerField];
            if (ownerId !== req.user.id) {
                res.status(403).json({
                    success: false,
                    message: 'You do not have permission to access this resource',
                    code: 'OWNERSHIP_REQUIRED',
                });
                return;
            }

            // Attach resource to request for downstream use
            (req as any).resource = resource;
            next();
        } catch (error) {
            console.error('Ownership check error:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking resource ownership',
                code: 'OWNERSHIP_CHECK_ERROR',
            });
        }
    };
};

/**
 * Combined permission and ownership check
 * First checks role permission, then verifies ownership
 */
export const checkPermissionAndOwnership = (
    resource: ResourceType,
    action: PermissionAction,
    ownershipOptions: OwnershipCheckOptions
): RequestHandler[] => {
    return [
        checkPermission(resource, action),
        checkOwnership(ownershipOptions),
    ];
};

/**
 * Multiple roles authorization middleware
 * Allows access if user has ANY of the specified roles
 */
export const authorizeRoles = (...roles: UserRole[]): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED',
            });
            return;
        }

        const userRole = req.user.role as UserRole;

        if (!roles.includes(userRole)) {
            res.status(403).json({
                success: false,
                message: 'Insufficient role permissions',
                code: 'ROLE_REQUIRED',
                requiredRoles: roles,
            });
            return;
        }

        next();
    };
};

/**
 * Admin-only middleware
 * Shorthand for authorizing admin roles
 */
export const adminOnly: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
            code: 'AUTH_REQUIRED',
        });
        return;
    }

    const userRole = req.user.role as UserRole;

    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        res.status(403).json({
            success: false,
            message: 'Admin access required',
            code: 'ADMIN_REQUIRED',
        });
        return;
    }

    next();
};

/**
 * Super admin only middleware
 */
export const superAdminOnly: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
            code: 'AUTH_REQUIRED',
        });
        return;
    }

    if (req.user.role !== 'SUPER_ADMIN') {
        res.status(403).json({
            success: false,
            message: 'Super admin access required',
            code: 'SUPER_ADMIN_REQUIRED',
        });
        return;
    }

    next();
};

/**
 * Self or admin middleware
 * Allows access if user is accessing their own resource OR is an admin
 */
export const selfOrAdmin = (userIdParam: string = 'userId'): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED',
            });
            return;
        }

        const targetUserId = parseInt(req.params[userIdParam], 10);
        const userRole = req.user.role as UserRole;
        const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
        const isSelf = req.user.id === targetUserId;

        if (!isSelf && !isAdmin) {
            res.status(403).json({
                success: false,
                message: 'You can only access your own resources',
                code: 'SELF_OR_ADMIN_REQUIRED',
            });
            return;
        }

        next();
    };
};

/**
 * KYC verified middleware
 * Ensures user has completed KYC verification (for travelers)
 */
export const kycVerified = (
    checkKycStatus: (userId: number) => Promise<boolean>
): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                });
                return;
            }

            const isVerified = await checkKycStatus(req.user.id);

            if (!isVerified) {
                res.status(403).json({
                    success: false,
                    message: 'KYC verification required',
                    code: 'KYC_REQUIRED',
                });
                return;
            }

            next();
        } catch (error) {
            console.error('KYC check error:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking KYC status',
                code: 'KYC_CHECK_ERROR',
            });
        }
    };
};
