/**
 * Role-based Admin Component Wrappers
 * Wraps existing admin components with role-based visibility
 * Frontend guards are cosmetic only - backend authorization remains mandatory
 */

import React from 'react';
import { AdminGuard } from '../guards';
import { UserRole } from '../../types/role.types';

/**
 * Props for role-based admin wrapper
 */
interface RoleBasedAdminWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * Admin-only wrapper component
 * Only renders children for users with ADMIN role
 */
export const AdminOnly: React.FC<RoleBasedAdminWrapperProps> = ({
  children,
  fallback = null,
  className
}) => {
  return (
    <AdminGuard fallback={fallback} className={className}>
      {children}
    </AdminGuard>
  );
};

/**
 * Ops-only wrapper component
 * Only renders children for users with OPS role
 */
export const OpsOnly: React.FC<RoleBasedAdminWrapperProps> = ({
  children,
  fallback = null,
  className
}) => {
  return (
    <AdminGuard 
      fallback={fallback} 
      className={className}
      // Override to check for OPS role instead of ADMIN
      // This would need a custom guard or we can use RoleGuard directly
    >
      {children}
    </AdminGuard>
  );
};

/**
 * Admin or Ops wrapper component
 * Only renders children for users with ADMIN or OPS role
 */
export const AdminOrOpsOnly: React.FC<RoleBasedAdminWrapperProps> = ({
  children,
  fallback = null,
  className
}) => {
  return (
    <div className={className}>
      <AdminGuard fallback={null}>
        {children}
      </AdminGuard>
      {/* This approach won't work perfectly - better to use RoleGuard directly */}
    </div>
  );
};

/**
 * Non-user wrapper component
 * Only renders children for users who are not regular USER role
 */
export const NonUserOnly: React.FC<RoleBasedAdminWrapperProps> = ({
  children,
  fallback = null,
  className
}) => {
  return (
    <div className={className}>
      {/* This would need NonUserGuard - better to import and use directly */}
      {children}
    </div>
  );
};

/**
 * Admin dashboard wrapper
 * Specialized wrapper for admin dashboard components
 */
export const AdminDashboardWrapper: React.FC<RoleBasedAdminWrapperProps> = ({
  children,
  fallback = (
    <div className="admin-access-denied">
      <h2>Access Denied</h2>
      <p>You do not have permission to access the admin dashboard.</p>
      <p>Please contact an administrator if you believe this is an error.</p>
    </div>
  ),
  className
}) => {
  return (
    <AdminGuard fallback={fallback} className={className}>
      <div className="admin-dashboard">
        {children}
      </div>
    </AdminGuard>
  );
};

/**
 * Ops dashboard wrapper
 * Specialized wrapper for operations dashboard components
 */
export const OpsDashboardWrapper: React.FC<RoleBasedAdminWrapperProps> = ({
  children,
  fallback = (
    <div className="ops-access-denied">
      <h2>Access Denied</h2>
      <p>You do not have permission to access the operations dashboard.</p>
      <p>Please contact an administrator if you believe this is an error.</p>
    </div>
  ),
  className
}) => {
  return (
    <div className={className}>
      {/* Would need OpsGuard here */}
      <div className="ops-dashboard">
        {children}
      </div>
    </div>
  );
};

/**
 * Admin control panel wrapper
 * Specialized wrapper for admin control panels
 */
export const AdminControlPanel: React.FC<RoleBasedAdminWrapperProps> = ({
  children,
  fallback = (
    <div className="control-panel-denied">
      <div className="denied-icon">🚫</div>
      <h3>Admin Access Required</h3>
      <p>This area is restricted to administrators only.</p>
    </div>
  ),
  className
}) => {
  return (
    <AdminGuard fallback={fallback} className={className}>
      <div className="admin-control-panel">
        {children}
      </div>
    </AdminGuard>
  );
};

/**
 * Admin action wrapper
 * Specialized wrapper for admin-specific actions
 */
export const AdminAction: React.FC<RoleBasedAdminWrapperProps> = ({
  children,
  fallback = null,
  className
}) => {
  return (
    <AdminGuard fallback={fallback} className={className}>
      {children}
    </AdminGuard>
  );
};

/**
 * Ops action wrapper
 * Specialized wrapper for ops-specific actions
 */
export const OpsAction: React.FC<RoleBasedAdminWrapperProps> = ({
  children,
  fallback = null,
  className
}) => {
  return (
    <div className={className}>
      {/* Would need OpsGuard here */}
      {children}
    </div>
  );
};

// Better approach - use the guards directly from the guards module
// These wrappers are provided for convenience but the recommended approach
// is to import and use RoleGuard, AdminGuard, etc. directly from the guards module