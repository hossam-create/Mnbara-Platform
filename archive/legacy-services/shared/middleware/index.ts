/**
 * Shared Middleware Exports
 * Import these types and utilities in any service that needs permission checking
 */

// Export types and utilities
export {
    UserRole,
    PermissionAction,
    ResourceType,
    Permission,
    AuthenticatedUser,
    OwnershipCheckOptions,
    ROLE_PERMISSIONS,
    hasPermission,
    getRolePermissions,
    isAdmin,
    isSuperAdmin,
} from './permission.types';

// Export middleware functions
export {
    checkPermission,
    checkOwnership,
    checkPermissionAndOwnership,
    authorizeRoles,
    adminOnly,
    superAdminOnly,
    selfOrAdmin,
    kycVerified,
} from './permission.middleware';
