/**
 * SECURITY-COMPLIANT ROLE GUARDS
 * ACCESS CONTROL & AUTHORITY POLICY IMPLEMENTATION
 * 
 * CRITICAL SECURITY NOTICE:
 * - Frontend UI has ZERO authority over access control
 * - All security decisions enforced EXCLUSIVELY in Backend
 * - UI guards are COSMETIC ONLY (visibility control)
 * - X-User-Role header is INFORMATIONAL ONLY
 * - Backend rejects unauthorized access regardless of UI state
 * 
 * VIOLATION OF THIS POLICY COMPROMISES SYSTEM SECURITY
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
  auditLog?: {
    component: string;
    timestamp: string;
  };
}

interface PermissionGuardProps extends RoleGuardProps {
  permission: Permission;
}

interface RoleBasedGuardProps extends RoleGuardProps {
  allowedRoles: UserRole[];
}

/**
 * ⚠️ SECURITY WARNING: AdminGuard is COSMETIC ONLY
 * Backend must validate ALL admin access independently
 * This component provides ZERO security enforcement
 */
export const AdminGuard: React.FC<RoleGuardProps> = ({
  children,
  fallback = null,
  className,
  auditLog
}) => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  
  // COSMETIC CHECK ONLY - Backend validates independently
  const hasAccess = isAdmin(user);
  
  // SECURITY AUDIT LOGGING
  if (auditLog && process.env.NODE_ENV === 'development') {
    console.log('[AUDIT] AdminGuard check:', {
      userRole: user?.role,
      hasAccess,
      component: auditLog.component,
      timestamp: auditLog.timestamp,
      warning: 'Frontend check is cosmetic - Backend validates independently',
      security: 'VIOLATION: Frontend has ZERO authority over access control'
    });
  }
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return (
    <div 
      className={className} 
      data-role-guard="admin" 
      data-cosmetic-only="true"
      data-security-warning="frontend-has-zero-authority"
    >
      {children}
    </div>
  );
};

/**
 * ⚠️ SECURITY WARNING: OpsGuard is COSMETIC ONLY
 * Backend must validate ALL operations access independently
 * This component provides ZERO security enforcement
 */
export const OpsGuard: React.FC<RoleGuardProps> = ({
  children,
  fallback = null,
  className,
  auditLog
}) => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  
  // COSMETIC CHECK ONLY - Backend validates independently
  const hasAccess = isOps(user);
  
  // SECURITY AUDIT LOGGING
  if (auditLog && process.env.NODE_ENV === 'development') {
    console.log('[AUDIT] OpsGuard check:', {
      userRole: user?.role,
      hasAccess,
      component: auditLog.component,
      timestamp: auditLog.timestamp,
      warning: 'Frontend check is cosmetic - Backend validates independently',
      security: 'VIOLATION: Frontend has ZERO authority over access control'
    });
  }
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return (
    <div 
      className={className} 
      data-role-guard="ops" 
      data-cosmetic-only="true"
      data-security-warning="frontend-has-zero-authority"
    >
      {children}
    </div>
  );
};

/**
 * ⚠️ SECURITY WARNING: PermissionGuard is COSMETIC ONLY
 * Backend must validate ALL permissions independently
 * This component provides ZERO security enforcement
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback = null,
  className,
  auditLog
}) => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  
  // COSMETIC CHECK ONLY - Backend validates independently
  const hasAccess = hasPermission(user, permission);
  
  // SECURITY AUDIT LOGGING
  if (auditLog && process.env.NODE_ENV === 'development') {
    console.log('[AUDIT] PermissionGuard check:', {
      userRole: user?.role,
      requestedPermission: permission,
      hasAccess,
      component: auditLog.component,
      timestamp: auditLog.timestamp,
      warning: 'Frontend check is cosmetic - Backend validates independently',
      security: 'VIOLATION: Frontend has ZERO authority over access control',
      policy: 'All security decisions enforced EXCLUSIVELY in Backend'
    });
  }
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return (
    <div 
      className={className} 
      data-permission-guard={permission} 
      data-cosmetic-only="true"
      data-security-warning="frontend-has-zero-authority"
    >
      {children}
    </div>
  );
};

/**
 * ⚠️ SECURITY WARNING: RoleGuard is COSMETIC ONLY
 * Backend must validate ALL role access independently
 * This component provides ZERO security enforcement
 */
export const RoleGuard: React.FC<RoleBasedGuardProps> = ({
  allowedRoles,
  children,
  fallback = null,
  className,
  auditLog
}) => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  
  // COSMETIC CHECK ONLY - Backend validates independently
  const hasAccess = hasAnyRole(user, allowedRoles);
  
  // SECURITY AUDIT LOGGING
  if (auditLog && process.env.NODE_ENV === 'development') {
    console.log('[AUDIT] RoleGuard check:', {
      userRole: user?.role,
      allowedRoles,
      hasAccess,
      component: auditLog.component,
      timestamp: auditLog.timestamp,
      warning: 'Frontend check is cosmetic - Backend validates independently',
      security: 'VIOLATION: Frontend has ZERO authority over access control',
      policy: 'All security decisions enforced EXCLUSIVELY in Backend'
    });
  }
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return (
    <div 
      className={className} 
      data-role-guard={allowedRoles.join(',')} 
      data-cosmetic-only="true"
      data-security-warning="frontend-has-zero-authority"
    >
      {children}
    </div>
  );
};

/**
 * ⚠️ SECURITY WARNING: NonUserGuard is COSMETIC ONLY
 * Backend must validate ALL non-user access independently
 * This component provides ZERO security enforcement
 */
export const NonUserGuard: React.FC<RoleGuardProps> = ({
  children,
  fallback = null,
  className,
  auditLog
}) => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  
  // COSMETIC CHECK ONLY - Backend validates independently
  const hasAccess = user && (isAdmin(user) || isOps(user));
  
  // SECURITY AUDIT LOGGING
  if (auditLog && process.env.NODE_ENV === 'development') {
    console.log('[AUDIT] NonUserGuard check:', {
      userRole: user?.role,
      hasAccess,
      component: auditLog.component,
      timestamp: auditLog.timestamp,
      warning: 'Frontend check is cosmetic - Backend validates independently',
      security: 'VIOLATION: Frontend has ZERO authority over access control'
    });
  }
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return (
    <div 
      className={className} 
      data-role-guard="non-user" 
      data-cosmetic-only="true"
      data-security-warning="frontend-has-zero-authority"
    >
      {children}
    </div>
  );
};

/**
 * ⚠️ SECURITY WARNING: All hooks are COSMETIC ONLY
 * Backend must validate ALL permissions independently
 * These hooks provide ZERO security enforcement
 */

/**
 * Hook to check if current user has a specific role - COSMETIC ONLY
 */
export const useRoleCheck = (role: UserRole): boolean => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  const hasRole = hasRole(user, role);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT] useRoleCheck - COSMETIC ONLY:', {
      requestedRole: role,
      userRole: user?.role,
      hasRole,
      securityWarning: 'Frontend has ZERO authority over access control'
    });
  }
  
  return hasRole;
};

/**
 * Hook to check if current user has a specific permission - COSMETIC ONLY
 */
export const usePermissionCheck = (permission: Permission): boolean => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  const hasPermission = hasPermission(user, permission);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT] usePermissionCheck - COSMETIC ONLY:', {
      requestedPermission: permission,
      userRole: user?.role,
      hasPermission,
      securityWarning: 'Frontend has ZERO authority over access control'
    });
  }
  
  return hasPermission;
};

/**
 * Hook to check if current user is admin - COSMETIC ONLY
 */
export const useIsAdmin = (): boolean => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  const isAdmin = isAdmin(user);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT] useIsAdmin - COSMETIC ONLY:', {
      userRole: user?.role,
      isAdmin,
      securityWarning: 'Frontend has ZERO authority over access control'
    });
  }
  
  return isAdmin;
};

/**
 * Hook to check if current user is ops - COSMETIC ONLY
 */
export const useIsOps = (): boolean => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  const isOps = isOps(user);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT] useIsOps - COSMETIC ONLY:', {
      userRole: user?.role,
      isOps,
      securityWarning: 'Frontend has ZERO authority over access control'
    });
  }
  
  return isOps;
};

/**
 * Hook to get current user's role - COSMETIC ONLY
 */
export const useUserRole = (): UserRole | null => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  const role = user?.role || null;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT] useUserRole - COSMETIC ONLY:', {
      userRole: role,
      securityWarning: 'Frontend has ZERO authority over access control'
    });
  }
  
  return role;
};

/**
 * Hook to get current user's permissions - COSMETIC ONLY
 */
export const useUserPermissions = (): Permission[] => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  const permissions = user ? ROLE_PERMISSIONS[user.role] || [] : [];
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT] useUserPermissions - COSMETIC ONLY:', {
      userRole: user?.role,
      permissions,
      securityWarning: 'Frontend has ZERO authority over access control'
    });
  }
  
  return permissions;
};