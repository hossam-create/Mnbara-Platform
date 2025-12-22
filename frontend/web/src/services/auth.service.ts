import { authApi } from './api';
import type { User } from '../types';

class AuthService {
  // Login with email/password
  async login(email: string, password: string) {
    const response = await authApi.login(email, password);
    if (response.data.data?.token) {
      this.setSession(response.data.data.token, response.data.data.user);
    }
    return response.data;
  }

  // Register new user
  async register(data: { email: string; password: string; fullName: string; phone?: string }) {
    const response = await authApi.register(data);
    if (response.data.data?.token) {
      this.setSession(response.data.data.token, response.data.data.user);
    }
    return response.data;
  }

  // Social Login (Google/Apple)
  async socialLogin(provider: 'google' | 'apple', token: string) {
    const apiCall = provider === 'google' ? authApi.loginWithGoogle : authApi.loginWithApple;
    const response = await apiCall(token);
    if (response.data.data?.token) {
      this.setSession(response.data.data.token, response.data.data.user);
    }
    return response.data;
  }

  // Logout
  async logout() {
    try {
      await authApi.logout();
    } catch (e) {
      console.warn('Logout API failed, clearing local state anyway');
    } finally {
      this.clearSession();
    }
  }

  // Session Management
  setSession(token: string, user: User) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  clearSession() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '/login';
  }

  getCurrentUser(): User | null {
    const data = localStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  // Profile Ops
  async getProfile() {
    return (await authApi.getProfile()).data;
  }

  async updateProfile(data: Partial<User>) {
    const response = await authApi.updateProfile(data);
    if (response.data.data) {
      // Update local cache
      localStorage.setItem('user_data', JSON.stringify(response.data.data));
    }
    return response.data;
  }
}

export const authService = new AuthService();
export default authService;
