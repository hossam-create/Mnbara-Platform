/**
 * Shared Permission Types
 * These types can be imported by any service that needs permission checking
 */

/**
 * User role enum (matches Prisma schema)
 */
export type UserRole = 'USER' | 'SELLER' | 'TRAVELER' | 'BUYER' | 'ADMIN' | 'SUPER_ADMIN';

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
 * Authenticated user attached to request
 */
export interface AuthenticatedUser {
    id: number;
    email: string;
    role: UserRole;
}

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
 * Role-based permission matrix
 * Defines what each role can do with each resource
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    USER: [
        { resource: 'user', actions: ['read', 'update'] },
        { resource: 'listing', actions: ['read'] },
        { resource: 'auction', actions: ['read'] },
        { resource: 'order', actions: ['read'] },
        { resource: 'notification', actions: ['read', 'update'] },
    ],
    BUYER: [
        { resource: 'user', actions: ['read', 'update'] },
        { resource: 'listing', actions: ['read'] },
        { resource: 'auction', actions: ['read', 'create'] },
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
        { resource: 'analytics', actions: ['read'] },
    ],
    TRAVELER: [
        { resource: 'user', actions: ['read', 'update'] },
        { resource: 'listing', actions: ['read'] },
        { resource: 'trip', actions: ['read', 'create', 'update', 'delete'] },
        { resource: 'delivery', actions: ['read', 'update'] },
        { resource: 'order', actions: ['read', 'update'] },
        { resource: 'payment', actions: ['read'] },
        { resource: 'kyc', actions: ['read', 'create'] },
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
 * Check if user is an admin (ADMIN or SUPER_ADMIN)
 */
export function isAdmin(role: UserRole): boolean {
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

/**
 * Check if user is a super admin
 */
export function isSuperAdmin(role: UserRole): boolean {
    return role === 'SUPER_ADMIN';
}
