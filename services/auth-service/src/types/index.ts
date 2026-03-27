/**
 * User role enum (matches Prisma schema)
 */
export type UserRole = 'USER' | 'SELLER' | 'TRAVELER' | 'BUYER' | 'ADMIN' | 'SUPER_ADMIN';

/**
 * JWT Payload structure
 */
export interface JwtPayload {
    userId: number;
    role: UserRole;
    iat?: number;
    exp?: number;
}

/**
 * Token pair returned after authentication
 */
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

/**
 * User registration data
 */
export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: UserRole;
}

/**
 * User login data
 */
export interface LoginData {
    email: string;
    password: string;
}

/**
 * OAuth provider data
 */
export interface OAuthData {
    provider: 'google' | 'apple';
    providerId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
}

/**
 * Sanitized user object (without sensitive fields)
 */
export interface SafeUser {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string | null;
    phone: string | null;
    avatar: string | null;
    emailVerified: boolean;
    isActive: boolean;
    role: UserRole;
    rating: number | null;
    kycStatus: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
}

/**
 * Authentication response
 */
export interface AuthResponse {
    user: SafeUser;
    accessToken: string;
    refreshToken: string;
    isNewUser?: boolean;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: Array<{
        field?: string;
        message: string;
    }>;
}

/**
 * Password change request
 */
export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
}

/**
 * Profile update data
 */
export interface UpdateProfileData {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    preferredCategories?: string[];
    preferredLanguages?: string[];
}

/**
 * OAuth provider types
 */
export type OAuthProvider = 'google' | 'apple';

/**
 * OAuth user data from provider
 */
export interface OAuthUserData {
    provider: OAuthProvider;
    providerId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    emailVerified: boolean;
}

/**
 * Google token response
 */
export interface GoogleTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
    token_type: string;
    id_token: string;
}

/**
 * Google user info response
 */
export interface GoogleUserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture?: string;
}

/**
 * Apple ID token payload
 */
export interface AppleIdTokenPayload {
    iss: string;
    aud: string;
    exp: number;
    iat: number;
    sub: string;
    email?: string;
    email_verified?: string | boolean;
    is_private_email?: string | boolean;
    auth_time: number;
    nonce_supported: boolean;
}
