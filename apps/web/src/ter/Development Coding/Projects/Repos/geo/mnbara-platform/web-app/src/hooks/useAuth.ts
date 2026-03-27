import { useState, useCallback, useEffect, createContext, useContext, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'buyer' | 'seller' | 'admin';
  mfaEnabled: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaRequired: boolean;
  mfaVerified: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
  enableMfa: () => Promise<void>;
  disableMfa: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    mfaRequired: false,
    mfaVerified: false,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          const mockUser: User = {
            id: '1',
            email: 'user@example.com',
            name: 'John Doe',
            role: 'buyer',
            mfaEnabled: true,
            createdAt: new Date().toISOString(),
          };

          setState({
            user: mockUser,
            isAuthenticated: true,
            isLoading: false,
            mfaRequired: false,
            mfaVerified: true,
          });
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mfaRequired = true;

      if (mfaRequired) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          mfaRequired: true,
        }));
      } else {
        const mockUser: User = {
          id: '1',
          email,
          name: 'John Doe',
          role: 'buyer',
          mfaEnabled: false,
          createdAt: new Date().toISOString(),
        };

        localStorage.setItem('auth_token', 'mock_token');
        setState({
          user: mockUser,
          isAuthenticated: true,
          isLoading: false,
          mfaRequired: false,
          mfaVerified: true,
        });
      }
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockUser: User = {
        id: '1',
        email: data.email,
        name: data.name,
        role: 'buyer',
        mfaEnabled: false,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('auth_token', 'mock_token');
      setState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        mfaRequired: false,
        mfaVerified: true,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      localStorage.removeItem('auth_token');
      localStorage.removeItem('mfa_verified');
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        mfaRequired: false,
        mfaVerified: false,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const verifyMfa = useCallback(async (code: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (code === '000000') {
        throw new Error('Invalid MFA code');
      }

      localStorage.setItem('mfa_verified', 'true');
      setState((prev) => ({
        ...prev,
        isLoading: false,
        mfaRequired: false,
        mfaVerified: true,
      }));
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const enableMfa = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      setState((prev) => ({
        ...prev,
        isLoading: false,
        user: prev.user ? { ...prev.user, mfaEnabled: true } : null,
      }));
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const disableMfa = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      setState((prev) => ({
        ...prev,
        isLoading: false,
        user: prev.user ? { ...prev.user, mfaEnabled: false } : null,
      }));
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!state.isAuthenticated) return;

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, [state.isAuthenticated]);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    verifyMfa,
    enableMfa,
    disableMfa,
    forgotPassword,
    resetPassword,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
