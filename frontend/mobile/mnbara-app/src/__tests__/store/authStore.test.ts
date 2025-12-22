/**
 * Auth Store Tests
 * Tests for login flow and authentication state management
 * Requirements: 6.1, 6.2, 6.3
 */

import { useAuthStore } from '../../store/authStore';
import * as secureStorage from '../../services/secureStorage';
import { authService } from '../../services/api';

// Mock secure storage
jest.mock('../../services/secureStorage', () => ({
  getAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
  getUser: jest.fn(),
  storeTokens: jest.fn(),
  storeUser: jest.fn(),
  clearAllSecureStorage: jest.fn(),
}));

// Mock auth service
jest.mock('../../services/api', () => ({
  authService: {
    login: jest.fn(),
    logout: jest.fn(),
    validateToken: jest.fn(),
    refreshToken: jest.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ApiError';
    }
  },
  AuthenticationError: class AuthenticationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthenticationError';
    }
  },
}));

describe('AuthStore', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    fullName: 'Test User',
    role: 'buyer' as const,
  };

  const mockToken = 'mock-access-token';
  const mockRefreshToken = 'mock-refresh-token';

  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      token: null,
      refreshToken: null,
      error: null,
    });
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should update state with user and tokens on login', () => {
      const { login } = useAuthStore.getState();

      login(mockUser, mockToken, mockRefreshToken);

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(state.refreshToken).toBe(mockRefreshToken);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle login without refresh token', () => {
      const { login } = useAuthStore.getState();

      login(mockUser, mockToken);

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.token).toBe(mockToken);
      expect(state.refreshToken).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear state and secure storage on logout', async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        isAuthenticated: true,
        user: mockUser,
        token: mockToken,
        refreshToken: mockRefreshToken,
      });

      (authService.logout as jest.Mock).mockResolvedValue(undefined);
      (secureStorage.clearAllSecureStorage as jest.Mock).mockResolvedValue(undefined);

      const { logout } = useAuthStore.getState();
      await logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(secureStorage.clearAllSecureStorage).toHaveBeenCalled();
    });

    it('should clear local state even if server logout fails', async () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: mockUser,
        token: mockToken,
      });

      (authService.logout as jest.Mock).mockRejectedValue(new Error('Network error'));
      (secureStorage.clearAllSecureStorage as jest.Mock).mockResolvedValue(undefined);

      const { logout } = useAuthStore.getState();
      await logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(secureStorage.clearAllSecureStorage).toHaveBeenCalled();
    });
  });

  describe('checkAuthState', () => {
    it('should restore session from stored tokens', async () => {
      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue(mockToken);
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue(mockRefreshToken);
      (secureStorage.getUser as jest.Mock).mockResolvedValue(mockUser);
      (authService.validateToken as jest.Mock).mockResolvedValue({
        valid: true,
        user: mockUser,
        token: mockToken,
        refreshToken: mockRefreshToken,
      });

      const { checkAuthState } = useAuthStore.getState();
      await checkAuthState();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.isLoading).toBe(false);
    });

    it('should set unauthenticated when no token stored', async () => {
      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue(null);

      const { checkAuthState } = useAuthStore.getState();
      await checkAuthState();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('should allow offline access with stored user data', async () => {
      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue(mockToken);
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue(mockRefreshToken);
      (secureStorage.getUser as jest.Mock).mockResolvedValue(mockUser);
      (authService.validateToken as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { checkAuthState } = useAuthStore.getState();
      await checkAuthState();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const newToken = 'new-access-token';
      const newRefreshToken = 'new-refresh-token';

      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue(mockRefreshToken);
      (authService.refreshToken as jest.Mock).mockResolvedValue({
        token: newToken,
        refreshToken: newRefreshToken,
        user: mockUser,
      });
      (secureStorage.storeTokens as jest.Mock).mockResolvedValue(undefined);
      (secureStorage.storeUser as jest.Mock).mockResolvedValue(undefined);

      const { refreshTokens } = useAuthStore.getState();
      const result = await refreshTokens();

      expect(result).toBe(true);
      expect(secureStorage.storeTokens).toHaveBeenCalledWith(newToken, newRefreshToken);

      const state = useAuthStore.getState();
      expect(state.token).toBe(newToken);
      expect(state.refreshToken).toBe(newRefreshToken);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should return false when no refresh token available', async () => {
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue(null);

      const { refreshTokens } = useAuthStore.getState();
      const result = await refreshTokens();

      expect(result).toBe(false);
    });

    it('should clear state on refresh failure', async () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: mockUser,
        token: mockToken,
      });

      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue(mockRefreshToken);
      (authService.refreshToken as jest.Mock).mockRejectedValue(
        new (jest.requireMock('../../services/api').AuthenticationError)('Token expired')
      );
      (secureStorage.clearAllSecureStorage as jest.Mock).mockResolvedValue(undefined);

      const { refreshTokens } = useAuthStore.getState();
      const result = await refreshTokens();

      expect(result).toBe(false);
      expect(secureStorage.clearAllSecureStorage).toHaveBeenCalled();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe('setters', () => {
    it('should set loading state', () => {
      const { setLoading } = useAuthStore.getState();
      
      setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);
      
      setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should set user', () => {
      const { setUser } = useAuthStore.getState();
      
      setUser(mockUser);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('should set error', () => {
      const { setError } = useAuthStore.getState();
      
      setError('Test error');
      expect(useAuthStore.getState().error).toBe('Test error');
      
      setError(null);
      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
