import { create } from 'zustand';
import {
  getAccessToken,
  getRefreshToken,
  getUser,
  storeTokens,
  storeUser,
  clearAllSecureStorage,
} from '../services/secureStorage';
import { authService, ApiError, AuthenticationError } from '../services/api';

export interface User {
  id: string;
  email: string;
  name: string;
  fullName?: string;
  phone?: string;
  role?: 'buyer' | 'seller' | 'traveler' | 'admin';
  kycStatus?: 'none' | 'pending' | 'verified' | 'rejected';
  avatarUrl?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  error: string | null;
  
  // Actions
  login: (user: User, token: string, refreshToken?: string) => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setUser: (user: User) => void;
  setTokens: (token: string, refreshToken?: string) => void;
  setError: (error: string | null) => void;
  checkAuthState: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  token: null,
  refreshToken: null,
  error: null,

  login: (user, token, refreshToken) => {
    set({
      isAuthenticated: true,
      user,
      token,
      refreshToken: refreshToken || null,
      isLoading: false,
      error: null,
    });
  },

  logout: async () => {
    try {
      // Try to logout on server (best effort)
      await authService.logout().catch(() => {});
    } finally {
      // Always clear local state
      await clearAllSecureStorage();
      set({
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null,
        isLoading: false,
        error: null,
      });
    }
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setUser: (user) => set({ user }),

  setTokens: (token, refreshToken) =>
    set({
      token,
      refreshToken: refreshToken || get().refreshToken,
    }),

  setError: (error) => set({ error }),

  checkAuthState: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Check for stored tokens
      const token = await getAccessToken();
      const refreshToken = await getRefreshToken();
      const storedUser = await getUser();
      
      if (!token) {
        // No token stored - user needs to login
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          refreshToken: null,
          isLoading: false,
        });
        return;
      }
      
      // Try to validate the token with the server
      try {
        const response = await authService.validateToken(token);
        
        if (response.valid) {
          // Token is valid - restore session
          const user = response.user || storedUser;
          
          // Update tokens if new ones were provided
          if (response.token) {
            await storeTokens(response.token, response.refreshToken);
          }
          
          set({
            isAuthenticated: true,
            user: user as User,
            token: response.token || token,
            refreshToken: response.refreshToken || refreshToken,
            isLoading: false,
          });
        } else {
          // Token is invalid - try to refresh
          const refreshed = await get().refreshTokens();
          if (!refreshed) {
            // Refresh failed - clear state
            await clearAllSecureStorage();
            set({
              isAuthenticated: false,
              user: null,
              token: null,
              refreshToken: null,
              isLoading: false,
            });
          }
        }
      } catch (error) {
        // Network error or server unavailable
        // If we have stored user data, allow offline access
        if (storedUser && token) {
          set({
            isAuthenticated: true,
            user: storedUser as User,
            token,
            refreshToken,
            isLoading: false,
          });
        } else {
          set({
            isAuthenticated: false,
            user: null,
            token: null,
            refreshToken: null,
            isLoading: false,
            error: 'Unable to verify session. Please check your connection.',
          });
        }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      set({
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null,
        isLoading: false,
        error: 'An error occurred while checking authentication.',
      });
    }
  },

  refreshTokens: async () => {
    try {
      const currentRefreshToken = await getRefreshToken();
      
      if (!currentRefreshToken) {
        return false;
      }
      
      const response = await authService.refreshToken();
      
      // Store new tokens
      await storeTokens(response.token, response.refreshToken);
      
      // Update store
      set({
        token: response.token,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
      });
      
      // Update user if provided
      if (response.user) {
        await storeUser(response.user);
        set({ user: response.user });
      }
      
      return true;
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof ApiError) {
        // Token refresh failed - user needs to re-authenticate
        await clearAllSecureStorage();
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          refreshToken: null,
        });
      }
      return false;
    }
  },
}));
