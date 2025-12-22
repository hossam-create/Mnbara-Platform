import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { authApi } from '../../services/api';
import { wsService } from '../../services/websocket';
import type { ReactNode } from 'react';

// Mock dependencies
vi.mock('../../services/api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    getProfile: vi.fn(),
    loginWithGoogle: vi.fn(),
    loginWithApple: vi.fn(),
  },
}));

vi.mock('../../services/websocket', () => ({
  wsService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
  },
}));

// Test wrapper
const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

// Mock user data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'buyer' as const,
  kycVerified: false,
  rating: 4.5,
  totalReviews: 10,
  createdAt: '2024-01-01T00:00:00Z',
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Default mock for getProfile to prevent initialization errors
    (authApi.getProfile as Mock).mockResolvedValue({
      data: { data: mockUser },
    });
  });

  describe('Initialization', () => {
    it('should initialize with unauthenticated state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should restore session from localStorage', async () => {
      localStorage.setItem('auth_token', 'valid-token');
      localStorage.setItem('user_data', JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(wsService.connect).toHaveBeenCalledWith('valid-token');
    });

    it('should clear session if profile fetch fails', async () => {
      localStorage.setItem('auth_token', 'invalid-token');
      localStorage.setItem('user_data', JSON.stringify(mockUser));
      (authApi.getProfile as Mock).mockRejectedValue(new Error('Unauthorized'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for the profile fetch to fail and session to be cleared
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.user).toBeNull();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('Login', () => {
    it('should login successfully with email and password', async () => {
      (authApi.login as Mock).mockResolvedValue({
        data: {
          data: {
            token: 'new-token',
            user: mockUser,
            refreshToken: 'refresh-token',
          },
        },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginResult: { success: boolean; mfaRequired?: boolean };
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123');
      });

      expect(loginResult!.success).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(localStorage.getItem('auth_token')).toBe('new-token');
      expect(wsService.connect).toHaveBeenCalledWith('new-token');
    });

    it('should handle MFA required response', async () => {
      (authApi.login as Mock).mockResolvedValue({
        data: {
          data: {
            mfaRequired: true,
            userId: 'user-123',
          },
        },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginResult: { success: boolean; mfaRequired?: boolean };
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123');
      });

      expect(loginResult!.success).toBe(false);
      expect(loginResult!.mfaRequired).toBe(true);
      expect(result.current.mfaRequired).toBe(true);
      expect(result.current.mfaPendingUserId).toBe('user-123');
    });

    it('should handle login failure', async () => {
      (authApi.login as Mock).mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginResult: { success: boolean; error?: string };
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'wrong-password');
      });

      expect(loginResult!.success).toBe(false);
      expect(loginResult!.error).toBe('Invalid credentials');
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Logout', () => {
    it('should logout and clear session', async () => {
      localStorage.setItem('auth_token', 'valid-token');
      localStorage.setItem('user_data', JSON.stringify(mockUser));
      (authApi.logout as Mock).mockResolvedValue({});

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('user_data')).toBeNull();
      expect(wsService.disconnect).toHaveBeenCalled();
    });

    it('should clear session even if logout API fails', async () => {
      localStorage.setItem('auth_token', 'valid-token');
      localStorage.setItem('user_data', JSON.stringify(mockUser));
      (authApi.logout as Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token successfully', async () => {
      localStorage.setItem('auth_token', 'old-token');
      localStorage.setItem('user_data', JSON.stringify(mockUser));
      (authApi.refreshToken as Mock).mockResolvedValue({
        data: { data: { token: 'new-token' } },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      let refreshResult: boolean;
      await act(async () => {
        refreshResult = await result.current.refreshToken();
      });

      expect(refreshResult!).toBe(true);
      expect(localStorage.getItem('auth_token')).toBe('new-token');
    });

    it('should clear session if token refresh fails', async () => {
      localStorage.setItem('auth_token', 'expired-token');
      localStorage.setItem('user_data', JSON.stringify(mockUser));
      (authApi.refreshToken as Mock).mockRejectedValue(new Error('Token expired'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      let refreshResult: boolean;
      await act(async () => {
        refreshResult = await result.current.refreshToken();
      });

      expect(refreshResult!).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within AuthProvider');
      
      consoleSpy.mockRestore();
    });
  });
});
