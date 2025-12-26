import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spin, Alert } from 'antd';
import { ShieldOutlined, LockOutlined } from '@ant-design/icons';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredClearance?: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  requiredPermissions?: string[];
  emergencyAccess?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredClearance,
  requiredPermissions = [],
  emergencyAccess = false
}) => {
  const auth = useAuth();

  // Show loading spinner while checking authentication
  if (auth.isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)'
      }}>
        <Spin size="large" />
        <div style={{ color: '#fff', marginTop: 16, fontSize: '16px' }}>
          Verifying Security Clearance...
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check clearance level
  if (requiredClearance && !auth.hasClearanceLevel(requiredClearance)) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
        padding: '20px'
      }}>
        <Alert
          message="Access Denied - Insufficient Clearance Level"
          description={
            <div>
              <p>Your clearance level: <strong>{auth.user?.clearanceLevel}</strong></p>
              <p>Required clearance level: <strong>{requiredClearance}</strong></p>
              <p>Contact your system administrator to request access.</p>
            </div>
          }
          type="error"
          icon={<ShieldOutlined />}
          style={{ 
            maxWidth: '500px',
            background: 'rgba(245, 34, 45, 0.1)',
            border: '1px solid rgba(245, 34, 45, 0.3)'
          }}
        />
      </div>
    );
  }

  // Check permissions
  const missingPermissions = requiredPermissions.filter(perm => !auth.hasPermission(perm));
  if (missingPermissions.length > 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
        padding: '20px'
      }}>
        <Alert
          message="Access Denied - Missing Permissions"
          description={
            <div>
              <p>Missing required permissions:</p>
              <ul>
                {missingPermissions.map(perm => (
                  <li key={perm}><strong>{perm}</strong></li>
                ))}
              </ul>
              <p>Contact your system administrator to request these permissions.</p>
            </div>
          }
          type="error"
          icon={<LockOutlined />}
          style={{ 
            maxWidth: '500px',
            background: 'rgba(245, 34, 45, 0.1)',
            border: '1px solid rgba(245, 34, 45, 0.3)'
          }}
        />
      </div>
    );
  }

  // Check emergency access for critical controls
  if (emergencyAccess && !auth.canAccessEmergencyControls()) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #2d0a0a 0%, #4a1a1a 100%)',
        padding: '20px'
      }}>
        <Alert
          message="RESTRICTED ACCESS - Emergency Controls"
          description={
            <div>
              <p><strong>This area requires L4+ clearance and emergency authorization.</strong></p>
              <p>Your current access level: {auth.user?.clearanceLevel}</p>
              <p>Role: {auth.user?.role}</p>
              <p>Only System Administrators and Operations Managers with L4+ clearance can access emergency controls.</p>
            </div>
          }
          type="error"
          icon={<ShieldOutlined />}
          style={{ 
            maxWidth: '600px',
            background: 'rgba(245, 34, 45, 0.2)',
            border: '2px solid rgba(245, 34, 45, 0.5)'
          }}
        />
      </div>
    );
  }

  // All checks passed, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;