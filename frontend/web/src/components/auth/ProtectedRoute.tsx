// ============================================
// 🛡️ Protected Route - Auth Guard Component
// ============================================

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
  requireKyc?: boolean;
  redirectTo?: string;
}

/**
 * ProtectedRoute component that guards routes requiring authentication.
 * 
 * Features:
 * - Redirects unauthenticated users to login
 * - Preserves the intended destination for post-login redirect
 * - Supports role-based access control
 * - Supports KYC verification requirement
 * - Shows loading state while checking auth
 */
export function ProtectedRoute({
  children,
  requiredRoles,
  requireKyc = false,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    // Save the attempted URL for redirecting after login
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  // Check role-based access
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page. This area is restricted to{' '}
              {requiredRoles.join(', ')} users.
            </p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Go Home
            </a>
          </div>
        </div>
      );
    }
  }

  // Check KYC verification requirement
  if (requireKyc && !user.kycVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">📋</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">KYC Verification Required</h1>
          <p className="text-gray-600 mb-6">
            You need to complete identity verification to access this feature.
            This helps us keep the platform safe for everyone.
          </p>
          <a
            href="/kyc"
            className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Start Verification
          </a>
        </div>
      </div>
    );
  }

  // User is authenticated and authorized
  return <>{children}</>;
}

/**
 * Higher-order component version of ProtectedRoute
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

export default ProtectedRoute;
