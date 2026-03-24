/**
 * Role-based UI Guard Components
 * Frontend guards are cosmetic only - backend authorization remains mandatory
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { 
  UserRole, 
  Permission, 
  hasRole, 
  hasPermission, 
  hasAnyRole, 
  hasAnyPermission,
  isAdmin,
  isOps,
  UserWithRole
} from '@/types/role.types';

interface RoleGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

interface PermissionGuardProps extends RoleGuardProps {
  permission: Permission;
}

interface RoleBasedGuardProps extends RoleGuardProps {
  allowedRoles: UserRole[];
}

/**
 * Component that only renders its children if the user has the specified role
 * @param allowedRoles - Array of roles that are allowed to see the content
 * @param children - Content to render if user has required role
 * @param fallback - Optional content to render if user doesn't have required role
 * @param className - Optional CSS class
 */
export const RoleGuard: React.FC<RoleBasedGuardProps> = ({
  allowedRoles,
  children,
  fallback = null,
  className
}) => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  
  const hasAccess = hasAnyRole(user, allowedRoles);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return (
    <div className={className}>
      {children}
    </div>
  );
};

/**
 * Component that only renders its children if the user has the specified permission
 * @param permission - Permission required to see the content
 * @param children - Content to render if user has required permission
 * @param fallback - Optional content to render if user doesn't have required permission
 * @param className - Optional CSS class
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback = null,
  className
}) => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  
  const hasAccess = hasPermission(user, permission);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return (
    <div className={className}>
      {children}
    </div>
  );
};

/**
 * Component that only renders its children if the user is an admin
 * @param children - Content to render if user is admin
 * @param fallback - Optional content to render if user is not admin
 * @param className - Optional CSS class
 */
export const AdminGuard: React.FC<RoleGuardProps> = ({
  children,
  fallback = null,
  className
}) => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  
  const hasAccess = isAdmin(user);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return (
    <div className={className}>
      {children}
    </div>
  );
};

/**
 * Component that only renders its children if the user is an ops user
 * @param children - Content to render if user is ops
 * @param fallback - Optional content to render if user is not ops
 * @param className - Optional CSS class
 */
export const OpsGuard: React.FC<RoleGuardProps> = ({
  children,
  fallback = null,
  className
}) => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  
  const hasAccess = isOps(user);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return (
    <div className={className}>
      {children}
    </div>
  );
};

/**
 * Component that only renders its children if the user is NOT a regular user (admin or ops)
 * @param children - Content to render if user is admin or ops
 * @param fallback - Optional content to render if user is regular user
 * @param className - Optional CSS class
 */
export const NonUserGuard: React.FC<RoleGuardProps> = ({
  children,
  fallback = null,
  className
}) => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  
  const hasAccess = user && (isAdmin(user) || isOps(user));
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return (
    <div className={className}>
      {children}
    </div>
  );
};

/**
 * Hook to check if current user has a specific role
 * @param role - Role to check
 * @returns boolean indicating if user has the role
 */
export const useRoleCheck = (role: UserRole): boolean => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  return hasRole(user, role);
};

/**
 * Hook to check if current user has a specific permission
 * @param permission - Permission to check
 * @returns boolean indicating if user has the permission
 */
export const usePermissionCheck = (permission: Permission): boolean => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  return hasPermission(user, permission);
};

/**
 * Hook to check if current user is admin
 * @returns boolean indicating if user is admin
 */
export const useIsAdmin = (): boolean => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  return isAdmin(user);
};

/**
 * Hook to check if current user is ops
 * @returns boolean indicating if user is ops
 */
export const useIsOps = (): boolean => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  return isOps(user);
};

/**
 * Hook to get current user's role
 * @returns UserRole or null if not authenticated
 */
export const useUserRole = (): UserRole | null => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  return user?.role || null;
};

/**
 * Hook to get current user's permissions
 * @returns array of permissions or empty array if not authenticated
 */
export const useUserPermissions = (): Permission[] => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  if (!user) return [];
  
  return ROLE_PERMISSIONS[user.role] || [];
};