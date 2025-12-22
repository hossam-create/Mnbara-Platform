/**
 * RBACGuard - Component for role-based access control
 * Requirements: SEC-006, SEC-007
 */

import React from 'react';
import { useAuth, UserRole, Permissions } from '../contexts/AuthContext';

interface RBACGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRole?: UserRole;
  requiredAnyRole?: UserRole[];
  fallback?: React.ReactElement;
  showForbidden?: boolean;
}

const RBACGuard: React.FC<RBACGuardProps> = ({
  children,
  requiredPermissions = [],
  requiredRole,
  requiredAnyRole,
  fallback,
  showForbidden = true
}) => {
  const auth = useAuth();

  // Check permissions
  const hasRequiredPermissions = requiredPermissions.length === 0 || 
    auth.hasAllPermissions(requiredPermissions);

  // Check role requirements
  const hasRequiredRole = !requiredRole || auth.hasRole(requiredRole);
  const hasAnyRequiredRole = !requiredAnyRole || auth.hasAnyRole(requiredAnyRole);

  const canAccess = hasRequiredPermissions && hasRequiredRole && hasAnyRequiredRole;

  if (auth.isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px' 
      }}>
        <div>Loading permissions...</div>
      </div>
    );
  }

  if (!canAccess) {
    if (fallback) {
      return fallback;
    }

    if (!showForbidden) {
      return null;
    }

    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#ff4d4f' 
        }}>
          ⚠️ Access Denied
        </div>
        <div style={{ color: '#666', textAlign: 'center' }}>
          You don't have permission to access this page.
          <br />
          Please contact your administrator.
        </div>
        {requiredPermissions.length > 0 && (
          <div style={{ 
            fontSize: '12px', 
            color: '#999', 
            marginTop: '8px' 
          }}>
            Required permissions: {requiredPermissions.join(', ')}
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

// Pre-configured guards for specific pages
export const OperationsGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RBACGuard 
    requiredPermissions={[Permissions.VIEW_OPERATIONS]}
    fallback={
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h3>Operations Access Required</h3>
        <p>You need VIEW_OPERATIONS permission to access this page.</p>
      </div>
    }
  >
    {children}
  </RBACGuard>
);

export const DisputesGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RBACGuard 
    requiredPermissions={[Permissions.VIEW_DISPUTES]}
    fallback={
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h3>Disputes Access Required</h3>
        <p>You need VIEW_DISPUTES permission to access this page.</p>
      </div>
    }
  >
    {children}
  </RBACGuard>
);

export const LogisticsGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RBACGuard 
    requiredPermissions={[Permissions.VIEW_LOGISTICS]}
    fallback={
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h3>Logistics Access Required</h3>
        <p>You need VIEW_LOGISTICS permission to access this page.</p>
      </div>
    }
  >
    {children}
  </RBACGuard>
);

export const AnalyticsGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RBACGuard 
    requiredPermissions={[Permissions.VIEW_ANALYTICS]}
    fallback={
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h3>Analytics Access Required</h3>
        <p>You need VIEW_ANALYTICS permission to access this page.</p>
      </div>
    }
  >
    {children}
  </RBACGuard>
);

export const FeatureFlagsGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RBACGuard 
    requiredPermissions={[Permissions.VIEW_FEATURE_FLAGS]}
    fallback={
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h3>Feature Flags Access Required</h3>
        <p>You need VIEW_FEATURE_FLAGS permission to access this page.</p>
      </div>
    }
  >
    {children}
  </RBACGuard>
);

export const EngineeringGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RBACGuard 
    requiredPermissions={[Permissions.VIEW_ENGINEERING]}
    fallback={
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h3>Engineering Access Required</h3>
        <p>You need VIEW_ENGINEERING permission to access this page.</p>
      </div>
    }
  >
    {children}
  </RBACGuard>
);

export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RBACGuard 
    requiredRole={UserRole.ADMIN}
    fallback={
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h3>Admin Access Required</h3>
        <p>You need ADMIN role to access this page.</p>
      </div>
    }
  >
    {children}
  </RBACGuard>
);

export const SuperAdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RBACGuard 
    requiredRole={UserRole.SUPER_ADMIN}
    fallback={
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h3>Super Admin Access Required</h3>
        <p>You need SUPER_ADMIN role to access this page.</p>
      </div>
    }
  >
    {children}
  </RBACGuard>
);

export default RBACGuard;