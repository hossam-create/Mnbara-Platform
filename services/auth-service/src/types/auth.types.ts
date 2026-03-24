export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface OAuthProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider: 'GOOGLE' | 'FACEBOOK' | 'APPLE';
}

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      name?: string;
      avatar?: string;
      role: string;
    };
    tokens: TokenPair;
  };
  error?: string;
}
