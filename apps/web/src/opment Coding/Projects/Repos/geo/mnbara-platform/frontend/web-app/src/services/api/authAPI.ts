import { api } from './client'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    avatar?: string
    role: string
    isVerified: boolean
    preferences: {
      language: string
      currency: string
      notifications: boolean
    }
  }
  token: string
  refreshToken: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  avatar?: string
  preferences?: {
    language?: string
    currency?: string
    notifications?: boolean
  }
}

export const authAPI = {
  // Authentication
  login: (credentials: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', credentials),

  register: (userData: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', userData),

  logout: (token: string) =>
    api.post('/auth/logout', { token }),

  refreshToken: (refreshToken: string) =>
    api.post<{ token: string; refreshToken: string }>('/auth/refresh', { refreshToken }),

  // Password management
  forgotPassword: (data: ForgotPasswordRequest) =>
    api.post('/auth/forgot-password', data),

  resetPassword: (data: ResetPasswordRequest) =>
    api.post('/auth/reset-password', data),

  changePassword: (data: ChangePasswordRequest) =>
    api.post('/auth/change-password', data),

  // Email verification
  sendVerificationEmail: () =>
    api.post('/auth/send-verification'),

  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }),

  // Profile management
  getProfile: () =>
    api.get('/auth/profile'),

  updateProfile: (data: UpdateProfileRequest) =>
    api.patch('/auth/profile', data),

  uploadAvatar: (file: File, onProgress?: (progress: number) => void) =>
    api.uploadFile('/auth/avatar', file, onProgress),

  // Social authentication
  googleAuth: (token: string) =>
    api.post<AuthResponse>('/auth/google', { token }),

  facebookAuth: (token: string) =>
    api.post<AuthResponse>('/auth/facebook', { token }),

  appleAuth: (token: string) =>
    api.post<AuthResponse>('/auth/apple', { token }),

  // Two-factor authentication
  enableTwoFactor: () =>
    api.post('/auth/2fa/enable'),

  disableTwoFactor: (code: string) =>
    api.post('/auth/2fa/disable', { code }),

  verifyTwoFactor: (code: string) =>
    api.post('/auth/2fa/verify', { code }),

  // Account management
  deleteAccount: (password: string) =>
    api.delete('/auth/account', { data: { password } }),

  deactivateAccount: () =>
    api.post('/auth/account/deactivate'),

  reactivateAccount: (email: string) =>
    api.post('/auth/account/reactivate', { email }),
}