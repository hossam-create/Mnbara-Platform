import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { authService } from '../auth.service';
import { authApi } from '../api';

// Mock the API module
vi.mock('../api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    loginWithGoogle: vi.fn(),
    loginWithApple: vi.fn(),
  },
}));

// Mock window.location
const mockLocation = { href: '' };
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

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

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockLocation.href = '';
  });

  describe('login', () => {
    it('should login and store session data', async () => {
      (authApi.login as Mock).mockResolvedValue({
        data: {
          data: {
            token: 'test-token',
            user: mockUser,
          },
        },
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(authApi.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(localStorage.getItem('auth_token')).toBe('test-token');
      expect(JSON.parse(localStorage.getItem('user_data')!)).toEqual(mockUser);
      expect(result.data?.user).toEqual(mockUser);
    });

    it('should not store session if no token returned', async () => {
      (authApi.login as Mock).mockResolvedValue({
        data: { data: null },
      });

      await authService.login('test@example.com', 'password123');

      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('register', () => {
    it('should register and store session data', async () => {
      (authApi.register as Mock).mockResolvedValue({
        data: {
          data: {
            token: 'new-user-token',
            user: mockUser,
          },
        },
      });

      const registerData = {
        email: 'new@example.com',
        password: 'password123',
        fullName: 'New User',
        phone: '+1234567890',
      };

      const result = await authService.register(registerData);

      expect(authApi.register).toHaveBeenCalledWith(registerData);
      expect(localStorage.getItem('auth_token')).toBe('new-user-token');
      expect(result.data?.user).toEqual(mockUser);
    });
  });

  describe('socialLogin', () => {
    it('should login with Google and store session', async () => {
      (authApi.loginWithGoogle as Mock).mockResolvedValue({
        data: {
          data: {
            token: 'google-token',
            user: mockUser,
          },
        },
      });

      const result = await authService.socialLogin('google', 'google-oauth-token');

      expect(authApi.loginWithGoogle).toHaveBeenCalledWith('google-oauth-token');
      expect(localStorage.getItem('auth_token')).toBe('google-token');
      expect(result.data?.user).toEqual(mockUser);
    });

    it('should login with Apple and store session', async () => {
      (authApi.loginWithApple as Mock).mockResolvedValue({
        data: {
          data: {
            token: 'apple-token',
            user: mockUser,
          },
        },
      });

      const result = await authService.socialLogin('apple', 'apple-oauth-token');

      expect(authApi.loginWithApple).toHaveBeenCalledWith('apple-oauth-token');
      expect(localStorage.getItem('auth_token')).toBe('apple-token');
      expect(result.data?.user).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('should clear session and redirect to login', async () => {
      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('user_data', JSON.stringify(mockUser));
      (authApi.logout as Mock).mockResolvedValue({});

      await authService.logout();

      expect(authApi.logout).toHaveBeenCalled();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('user_data')).toBeNull();
      expect(mockLocation.href).toBe('/login');
    });

    it('should clear session even if API call fails', async () => {
      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('user_data', JSON.stringify(mockUser));
      (authApi.logout as Mock).mockRejectedValue(new Error('Network error'));

      await authService.logout();

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(mockLocation.href).toBe('/login');
    });
  });

  describe('getCurrentUser', () => {
    it('should return user from localStorage', () => {
      localStorage.setItem('user_data', JSON.stringify(mockUser));

      const user = authService.getCurrentUser();

      expect(user).toEqual(mockUser);
    });

    it('should return null if no user data', () => {
      const user = authService.getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('auth_token', 'test-token');

      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when no token', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getProfile', () => {
    it('should fetch user profile', async () => {
      (authApi.getProfile as Mock).mockResolvedValue({
        data: { data: mockUser },
      });

      const result = await authService.getProfile();

      expect(authApi.getProfile).toHaveBeenCalled();
      expect(result.data).toEqual(mockUser);
    });
  });

  describe('updateProfile', () => {
    it('should update profile and localStorage', async () => {
      const updatedUser = { ...mockUser, fullName: 'Updated Name' };
      (authApi.updateProfile as Mock).mockResolvedValue({
        data: { data: updatedUser },
      });

      const result = await authService.updateProfile({ fullName: 'Updated Name' });

      expect(authApi.updateProfile).toHaveBeenCalledWith({ fullName: 'Updated Name' });
      expect(JSON.parse(localStorage.getItem('user_data')!)).toEqual(updatedUser);
      expect(result.data).toEqual(updatedUser);
    });
  });
});
