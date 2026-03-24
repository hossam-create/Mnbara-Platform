/**
 * Role-based Access Control Types
 * Defines user roles and permissions for UI guards
 * Frontend guards are cosmetic only - backend authorization remains mandatory
 */

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN', 
  OPS = 'OPS'
}

export enum Permission {
  // User permissions
  VIEW_ORDERS = 'VIEW_ORDERS',
  CREATE_ORDER = 'CREATE_ORDER',
  CANCEL_ORDER = 'CANCEL_ORDER',
  VIEW_PROFILE = 'VIEW_PROFILE',
  EDIT_PROFILE = 'EDIT_PROFILE',
  
  // Admin permissions
  VIEW_ADMIN_DASHBOARD = 'VIEW_ADMIN_DASHBOARD',
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_ORDERS = 'MANAGE_ORDERS',
  MANAGE_PAYMENTS = 'MANAGE_PAYMENTS',
  MANAGE_DISPUTES = 'MANAGE_DISPUTES',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
  
  // Ops permissions
  VIEW_OPS_DASHBOARD = 'VIEW_OPS_DASHBOARD',
  MONITOR_SYSTEMS = 'MONITOR_SYSTEMS',
  MANAGE_ESCROW = 'MANAGE_ESCROW',
  PROCESS_REFUNDS = 'PROCESS_REFUNDS',
  HANDLE_DISPUTES = 'HANDLE_DISPUTES',
  VIEW_FINANCIAL_DATA = 'VIEW_FINANCIAL_DATA',
  MANAGE_GUARANTEES = 'MANAGE_GUARANTEES'
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

export interface UserWithRole {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  isVerified: boolean;
  preferences: {
    language: string;
    currency: string;
    notifications: boolean;
  };
}

/**
 * Role-based permission mapping
 * Defines which permissions each role has
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.VIEW_ORDERS,
    Permission.CREATE_ORDER,
    Permission.CANCEL_ORDER,
    Permission.VIEW_PROFILE,
    Permission.EDIT_PROFILE
  ],
  
  [UserRole.ADMIN]: [
    // All user permissions
    Permission.VIEW_ORDERS,
    Permission.CREATE_ORDER,
    Permission.CANCEL_ORDER,
    Permission.VIEW_PROFILE,
    Permission.EDIT_PROFILE,
    
    // Admin-specific permissions
    Permission.VIEW_ADMIN_DASHBOARD,
    Permission.MANAGE_USERS,
    Permission.MANAGE_ORDERS,
    Permission.MANAGE_PAYMENTS,
    Permission.MANAGE_DISPUTES,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_SETTINGS
  ],
  
  [UserRole.OPS]: [
    // All user permissions
    Permission.VIEW_ORDERS,
    Permission.CREATE_ORDER,
    Permission.CANCEL_ORDER,
    Permission.VIEW_PROFILE,
    Permission.EDIT_PROFILE,
    
    // Ops-specific permissions
    Permission.VIEW_OPS_DASHBOARD,
    Permission.MONITOR_SYSTEMS,
    Permission.MANAGE_ESCROW,
    Permission.PROCESS_REFUNDS,
    Permission.HANDLE_DISPUTES,
    Permission.VIEW_FINANCIAL_DATA,
    Permission.MANAGE_GUARANTEES
  ]
};

/**
 * Check if a user has a specific permission
 * @param user - User with role information
 * @param permission - Permission to check
 * @returns boolean indicating if user has permission
 */
export function hasPermission(user: UserWithRole | null, permission: Permission): boolean {
  if (!user) return false;
  
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 * @param user - User with role information
 * @param permissions - Array of permissions to check
 * @returns boolean indicating if user has any of the permissions
 */
export function hasAnyPermission(user: UserWithRole | null, permissions: Permission[]): boolean {
  if (!user) return false;
  
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.some(permission => userPermissions.includes(permission));
}

/**
 * Check if a user has all of the specified permissions
 * @param user - User with role information
 * @param permissions - Array of permissions to check
 * @returns boolean indicating if user has all of the permissions
 */
export function hasAllPermissions(user: UserWithRole | null, permissions: Permission[]): boolean {
  if (!user) return false;
  
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.every(permission => userPermissions.includes(permission));
}

/**
 * Check if a user has a specific role
 * @param user - User with role information
 * @param role - Role to check
 * @returns boolean indicating if user has role
 */
export function hasRole(user: UserWithRole | null, role: UserRole): boolean {
  if (!user) return false;
  return user.role === role;
}

/**
 * Check if a user has any of the specified roles
 * @param user - User with role information
 * @param roles - Array of roles to check
 * @returns boolean indicating if user has any of the roles
 */
export function hasAnyRole(user: UserWithRole | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Check if a user is an admin (has ADMIN role)
 * @param user - User with role information
 * @returns boolean indicating if user is admin
 */
export function isAdmin(user: UserWithRole | null): boolean {
  return hasRole(user, UserRole.ADMIN);
}

/**
 * Check if a user is an ops user (has OPS role)
 * @param user - User with role information
 * @returns boolean indicating if user is ops
 */
export function isOps(user: UserWithRole | null): boolean {
  return hasRole(user, UserRole.OPS);
}

/**
 * Check if a user is a regular user (has USER role)
 * @param user - User with role information
 * @returns boolean indicating if user is regular user
 */
export function isUser(user: UserWithRole | null): boolean {
  return hasRole(user, UserRole.USER);
}