import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'SYSTEM_ADMIN' | 'DEVOPS_ENGINEER' | 'OPERATIONS_MANAGER' | 'SECURITY_OFFICER';
  permissions: string[];
  department: string;
  clearanceLevel: 'L1' | 'L2' | 'L3' | 'L4' | 'L5'; // L5 = Highest clearance
  lastLogin: string;
  mfaEnabled: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, mfaCode?: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasClearanceLevel: (level: 'L1' | 'L2' | 'L3' | 'L4' | 'L5') => boolean;
  canAccessEmergencyControls: () => boolean;
  canAccessAIProblemSolver: () => boolean;
  canAccessSystemHealth: () => boolean;
  sessionTimeRemaining: number;
  extendSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(3600); // 1 hour

  // Session timeout management
  useEffect(() => {
    if (user && sessionTimeRemaining > 0) {
      const sessionTimeout = setInterval(() => {
        setSessionTimeRemaining(prev => {
          if (prev <= 1) {
            logout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(sessionTimeout);
    }
  }, [user, sessionTimeRemaining]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing session
        const token = localStorage.getItem('system_control_token');
        const userData = localStorage.getItem('system_control_user');
        
        if (token && userData) {
          // Verify token with backend
          const response = await fetch('/api/system-auth/verify', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setSessionTimeRemaining(data.sessionTimeRemaining || 3600);
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('system_control_token');
            localStorage.removeItem('system_control_user');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid session data
        localStorage.removeItem('system_control_token');
        localStorage.removeItem('system_control_user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string, mfaCode?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/system-auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          mfaCode,
          systemType: 'CONTROL_DASHBOARD'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store secure tokens
        localStorage.setItem('system_control_token', data.token);
        localStorage.setItem('system_control_user', JSON.stringify(data.user));
        
        setUser(data.user);
        setSessionTimeRemaining(3600);
        
        // Log security event
        await logSecurityEvent('LOGIN_SUCCESS', data.user.id);
        
        return true;
      } else {
        const error = await response.json();
        
        // Log failed login attempt
        await logSecurityEvent('LOGIN_FAILED', email);
        
        throw new Error(error.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('system_control_token');
      
      if (token && user) {
        // Notify backend of logout
        await fetch('/api/system-auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Log security event
        await logSecurityEvent('LOGOUT', user.id);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('system_control_token');
      localStorage.removeItem('system_control_user');
      
      setUser(null);
      setSessionTimeRemaining(0);
    }
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions.includes(permission) || false;
  };

  const hasClearanceLevel = (requiredLevel: 'L1' | 'L2' | 'L3' | 'L4' | 'L5'): boolean => {
    if (!user) return false;
    
    const levels = { L1: 1, L2: 2, L3: 3, L4: 4, L5: 5 };
    const userLevel = levels[user.clearanceLevel];
    const required = levels[requiredLevel];
    
    return userLevel >= required;
  };

  const canAccessEmergencyControls = (): boolean => {
    return hasClearanceLevel('L4') && (
      user?.role === 'SYSTEM_ADMIN' || 
      user?.role === 'OPERATIONS_MANAGER'
    ) && hasPermission('EMERGENCY_CONTROLS');
  };

  const canAccessAIProblemSolver = (): boolean => {
    return hasClearanceLevel('L2') && hasPermission('AI_PROBLEM_SOLVER');
  };

  const canAccessSystemHealth = (): boolean => {
    return hasClearanceLevel('L1') && hasPermission('SYSTEM_MONITORING');
  };

  const extendSession = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('system_control_token');
      
      if (token) {
        const response = await fetch('/api/system-auth/extend-session', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setSessionTimeRemaining(3600); // Reset to 1 hour
        }
      }
    } catch (error) {
      console.error('Session extension error:', error);
    }
  };

  // Security event logging
  const logSecurityEvent = async (event: string, userId: string): Promise<void> => {
    try {
      await fetch('/api/system-auth/security-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          userId,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          ipAddress: 'CLIENT_IP', // Will be filled by backend
          systemType: 'CONTROL_DASHBOARD'
        }),
      });
    } catch (error) {
      console.error('Security logging error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    hasPermission,
    hasClearanceLevel,
    canAccessEmergencyControls,
    canAccessAIProblemSolver,
    canAccessSystemHealth,
    sessionTimeRemaining,
    extendSession
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

// Security Guard Hook
export const useSecurityGuard = (requiredClearance?: 'L1' | 'L2' | 'L3' | 'L4' | 'L5', requiredPermissions?: string[]) => {
  const auth = useAuth();
  
  const hasAccess = () => {
    if (!auth.isAuthenticated) return false;
    
    const hasClearance = !requiredClearance || auth.hasClearanceLevel(requiredClearance);
    const hasPerms = !requiredPermissions || requiredPermissions.every(perm => auth.hasPermission(perm));
    
    return hasClearance && hasPerms;
  };
  
  return {
    hasAccess: hasAccess(),
    user: auth.user,
    sessionTimeRemaining: auth.sessionTimeRemaining,
    extendSession: auth.extendSession
  };
};