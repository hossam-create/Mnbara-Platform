import { apiClient } from './client';
import { User, UserRole } from '../../domain/entities/user.entity';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  phone: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface OTPVerification {
  email?: string;
  phone?: string;
  otp: string;
}

class AuthApiService {
  private static instance: AuthApiService;

  public static getInstance(): AuthApiService {
    if (!AuthApiService.instance) {
      AuthApiService.instance = new AuthApiService();
    }
    return AuthApiService.instance;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials);
    return response;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', data);
    return response;
  }

  async logout(): Promise<void> {
    await apiClient.post('/api/auth/logout');
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await apiClient.post<{ accessToken: string; refreshToken: string }>('/api/auth/refresh', { refreshToken });
    return response;
  }

  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    await apiClient.post('/api/auth/password-reset/request', data);
  }

  async confirmPasswordReset(data: PasswordResetConfirm): Promise<void> {
    await apiClient.post('/api/auth/password-reset/confirm', data);
  }

  async verifyOTP(data: OTPVerification): Promise<{ verified: boolean }> {
    const response = await apiClient.post<{ verified: boolean }>('/api/auth/verify-otp', data);
    return response;
  }

  async resendOTP(email?: string, phone?: string): Promise<void> {
    await apiClient.post('/api/auth/resend-otp', { email, phone });
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/api/auth/me');
    return response;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.patch<User>('/api/auth/profile', data);
    return response;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/api/auth/change-password', { currentPassword, newPassword });
  }
}

export const authApi = AuthApiService.getInstance();
