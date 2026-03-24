/**
 * Role-based UI Guards - Index
 * Export all role-based guard components and utilities
 * Frontend guards are cosmetic only - backend authorization remains mandatory
 */

// Role types and utilities
export {
  UserRole,
  Permission,
  type UserWithRole,
  type RolePermissions,
  ROLE_PERMISSIONS,
  hasRole,
  hasPermission,
  hasAnyRole,
  hasAnyPermission,
  hasAllPermissions,
  isAdmin,
  isOps,
  isUser
} from '../../types/role.types';

// Core guard components
export {
  RoleGuard,
  PermissionGuard,
  AdminGuard,
  OpsGuard,
  NonUserGuard
} from './RoleGuards';

// Hooks
export {
  useRoleCheck,
  usePermissionCheck,
  useIsAdmin,
  useIsOps,
  useUserRole,
  useUserPermissions
} from './RoleGuards';

// Navigation components
export {
  RoleBasedNavigation,
  RoleBasedNavItem,
  RoleBasedMenu
} from './RoleBasedNavigation';

// UI components
export {
  RoleBasedButton,
  RoleBasedCard,
  RoleBasedSection,
  RoleBasedMenuItem,
  RoleBasedBadge,
  AdminButton,
  OpsButton,
  AdminCard,
  OpsCard,
  AdminSection,
  OpsSection
} from './RoleBasedComponents';

// Re-export for convenience
export { default } from './RoleGuards';