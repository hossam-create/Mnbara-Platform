// ============================================
// 🔐 Auth Context - Authentication Provider
// ============================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authApi } from '../services/api';
import { wsService } from '../services/websocket';
import type { User } from '../types';

// ============================================
// Types
// ============================================

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaRequired: boolean;
  mfaPendingUserId: string | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  socialLogin: (provider: 'google' | 'apple', token: string) => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateUser: (data: Partial<User>) => void;
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: string;
}

interface LoginResult {
  success: boolean;
  mfaRequired?: boolean;
  error?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  mfaRequired: boolean;
  mfaPendingUserId: string | null;
}

// ============================================
// Constants
// ============================================

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';
const TOKEN_REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutes

// ============================================
// Context
// ============================================

const AuthContext = createContext<AuthContextType | null>(null);

// ============================================
// Provider
// ============================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    refreshToken: null,
    isLoading: true,
    mfaRequired: false,
    mfaPendingUserId: null,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const userData = localStorage.getItem(USER_KEY);

      if (token && userData) {
        try {
          const user = JSON.parse(userData) as User;
          setState((prev) => ({
            ...prev,
            user,
            token,
            refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
            isLoading: false,
          }));

          // Connect WebSocket
          wsService.connect(token);

          // Verify token is still valid by fetching profile
          const response = await authApi.getProfile();
          if (response.data.data) {
            const freshUser = response.data.data;
            localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
            setState((prev) => ({ ...prev, user: freshUser }));
          }
        } catch (error) {
          // Token invalid, clear session
          clearSession();
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (!state.token) return;

    const refreshInterval = setInterval(async () => {
      await refreshTokenFn();
    }, TOKEN_REFRESH_INTERVAL);

    return () => clearInterval(refreshInterval);
  }, [state.token]);

  // Helper: Set session data
  const setSession = useCallback(
    (token: string, user: User, refresh?: string) => {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      if (refresh) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
      }

      setState((prev) => ({
        ...prev,
        user,
        token,
        refreshToken: refresh || prev.refreshToken,
        isLoading: false,
        mfaRequired: false,
        mfaPendingUserId: null,
      }));

      // Connect WebSocket
      wsService.connect(token);
    },
    []
  );

  // Helper: Clear session data
  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    setState({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      mfaRequired: false,
      mfaPendingUserId: null,
    });

    // Disconnect WebSocket
    wsService.disconnect();
  }, []);

  // Login with email/password
  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }));

        const response = await authApi.login(email, password);
        const data = response.data.data;

        if (!data) {
          throw new Error('Invalid response from server');
        }

        // Check if MFA is required
        if ('mfaRequired' in data && data.mfaRequired) {
          const mfaData = data as unknown as { mfaRequired: boolean; userId: string };
          setState((prev) => ({
            ...prev,
            isLoading: false,
            mfaRequired: true,
            mfaPendingUserId: mfaData.userId,
          }));
          return { success: false, mfaRequired: true };
        }

        // Normal login success
        const { token, user, refreshToken: refresh } = data as {
          token: string;
          user: User;
          refreshToken?: string;
        };
        setSession(token, user, refresh);

        return { success: true };
      } catch (error: unknown) {
        setState((prev) => ({ ...prev, isLoading: false }));
        const message =
          error instanceof Error ? error.message : 'Login failed';
        return { success: false, error: message };
      }
    },
    [setSession]
  );

  // Register new user
  const register = useCallback(
    async (data: RegisterData): Promise<void> => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const response = await authApi.register(data);
        const result = response.data.data;

        if (result?.token && result?.user) {
          setSession(result.token, result.user);
        }
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [setSession]
  );

  // Social login (Google/Apple)
  const socialLogin = useCallback(
    async (provider: 'google' | 'apple', token: string): Promise<void> => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const apiCall =
          provider === 'google' ? authApi.loginWithGoogle : authApi.loginWithApple;
        const response = await apiCall(token);
        const data = response.data.data;

        if (data?.token && data?.user) {
          setSession(data.token, data.user);
        }
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [setSession]
  );

  // Verify MFA code
  const verifyMfa = useCallback(
    async (code: string): Promise<void> => {
      if (!state.mfaPendingUserId) {
        throw new Error('No MFA verification pending');
      }

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        // Call MFA verification endpoint
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/mfa/verify`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: state.mfaPendingUserId,
              code,
            }),
          }
        );

        const data = await response.json();

        if (data.data?.token && data.data?.user) {
          setSession(data.data.token, data.data.user);
        } else {
          throw new Error('Invalid MFA code');
        }
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [state.mfaPendingUserId, setSession]
  );

  // Refresh token
  const refreshTokenFn = useCallback(async (): Promise<boolean> => {
    try {
      const response = await authApi.refreshToken();
      const data = response.data.data;

      if (data?.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setState((prev) => ({ ...prev, token: data.token }));
        return true;
      }
      return false;
    } catch (error) {
      // Token refresh failed, clear session
      clearSession();
      return false;
    }
  }, [clearSession]);

  // Logout
  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      console.warn('Logout API failed, clearing local state anyway');
    } finally {
      clearSession();
    }
  }, [clearSession]);

  // Update user data locally
  const updateUser = useCallback((data: Partial<User>): void => {
    setState((prev) => {
      if (!prev.user) return prev;
      const updatedUser = { ...prev.user, ...data };
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      return { ...prev, user: updatedUser };
    });
  }, []);

  const value: AuthContextType = {
    user: state.user,
    isAuthenticated: !!state.user && !!state.token,
    isLoading: state.isLoading,
    mfaRequired: state.mfaRequired,
    mfaPendingUserId: state.mfaPendingUserId,
    login,
    register,
    logout,
    socialLogin,
    verifyMfa,
    refreshToken: refreshTokenFn,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================
// Hook
// ============================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export default AuthContext;
