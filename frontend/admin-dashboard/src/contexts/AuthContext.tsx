/**
 * AuthContext - React Context for authentication state management
 * Requirements: SEC-004, SEC-005
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, authService, UserRole, Permissions } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canAccess: (feature: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is already logged in (e.g., from localStorage)
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const user = await authService.login(email, password);
      if (user) {
        setUser(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    authService.logout();
    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    return authService.hasPermission(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return authService.hasAnyPermission(permissions);
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return authService.hasAllPermissions(permissions);
  };

  const canAccess = (feature: string): boolean => {
    return authService.canAccess(feature);
  };

  const hasRole = (role: UserRole): boolean => {
    return authService.hasRole(role);
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return authService.hasAnyRole(roles);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    hasRole,
    hasAnyRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher Order Component for role-based access
interface WithAuthProps {
  requiredPermissions?: string[];
  requiredRole?: UserRole;
  requiredAnyRole?: UserRole[];
  fallback?: React.ReactElement;
}

export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthProps = {}
): React.FC<P> => {
  const {
    requiredPermissions = [],
    requiredRole,
    requiredAnyRole,
    fallback = <div>Access Denied</div>
  } = options;

  return (props: P) => {
    const auth = useAuth();

    // Check permissions
    const hasRequiredPermissions = requiredPermissions.length === 0 || 
      auth.hasAllPermissions(requiredPermissions);

    // Check role requirements
    const hasRequiredRole = !requiredRole || auth.hasRole(requiredRole);
    const hasAnyRequiredRole = !requiredAnyRole || auth.hasAnyRole(requiredAnyRole);

    const canAccess = hasRequiredPermissions && hasRequiredRole && hasAnyRequiredRole;

    if (auth.isLoading) {
      return <div>Loading...</div>;
    }

    if (!canAccess) {
      return fallback;
    }

    return <WrappedComponent {...props} />;
  };
};

// Hook for route protection
export const useRouteGuard = (requiredPermissions?: string[], requiredRole?: UserRole): boolean => {
  const auth = useAuth();
  
  if (auth.isLoading) return false;
  
  const hasPermissions = !requiredPermissions || auth.hasAllPermissions(requiredPermissions);
  const hasRole = !requiredRole || auth.hasRole(requiredRole);
  
  return hasPermissions && hasRole;
};