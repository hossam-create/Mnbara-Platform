import { BaseEntity, Address } from './common.types';

// User Role Enum
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  SELLER = 'seller',
  TRAVELER = 'traveler',
  MODERATOR = 'moderator',
  SUPPORT = 'support'
}

// User Status Enum
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
  BANNED = 'banned'
}

// KYC Status Enum
export enum KYCStatus {
  NOT_STARTED = 'not_started',
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

// Account Type Enum
export enum AccountType {
  PERSONAL = 'personal',
  BUSINESS = 'business'
}

// User Profile Interface
export interface UserProfile {
  firstName: string;
  lastName: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  language?: string;
  timezone?: string;
  address?: Address;
}

// User Preferences Interface
export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  newsletter: boolean;
  language: string;
  currency: string;
  theme?: 'light' | 'dark' | 'auto';
}

// User Statistics Interface
export interface UserStatistics {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSpent: number;
  totalEarned: number;
  totalDeliveries: number;
  completedDeliveries: number;
  averageRating: number;
  totalReviews: number;
  trustScore: number;
  memberSince: Date;
}

// KYC Document Interface
export interface KYCDocument {
  id: string;
  type: 'passport' | 'national_id' | 'drivers_license' | 'utility_bill' | 'bank_statement';
  documentNumber?: string;
  frontImage: string;
  backImage?: string;
  selfieImage?: string;
  status: KYCStatus;
  uploadedAt: Date;
  verifiedAt?: Date;
  expiryDate?: Date;
  rejectionReason?: string;
}

// KYC Verification Interface
export interface KYCVerification {
  status: KYCStatus;
  level: 'basic' | 'intermediate' | 'advanced';
  documents: KYCDocument[];
  verifiedAt?: Date;
  expiresAt?: Date;
  verifiedBy?: string;
  notes?: string;
}

// User Authentication Interface
export interface UserAuthentication {
  email: string;
  emailVerified: boolean;
  phoneNumber?: string;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  passwordChangedAt?: Date;
}

// User Security Settings Interface
export interface UserSecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'sms' | 'email' | 'authenticator';
  loginAlerts: boolean;
  sessionTimeout: number;
  trustedDevices: TrustedDevice[];
}

// Trusted Device Interface
export interface TrustedDevice {
  id: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser?: string;
  os?: string;
  lastUsedAt: Date;
  addedAt: Date;
  ipAddress?: string;
}

// User Social Links Interface
export interface UserSocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  website?: string;
}

// User Business Profile Interface
export interface UserBusinessProfile {
  businessName: string;
  businessType: string;
  taxId?: string;
  registrationNumber?: string;
  businessAddress: Address;
  businessPhone: string;
  businessEmail: string;
  website?: string;
  description?: string;
  logo?: string;
}

// User Main Interface
export interface User extends BaseEntity {
  email: string;
  roles: UserRole[];
  status: UserStatus;
  accountType: AccountType;
  profile: UserProfile;
  authentication: UserAuthentication;
  preferences: UserPreferences;
  statistics: UserStatistics;
  kycVerification?: KYCVerification;
  businessProfile?: UserBusinessProfile;
  socialLinks?: UserSocialLinks;
  securitySettings?: UserSecuritySettings;
  metadata?: Record<string, unknown>;
}

// User Create DTO
export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  accountType?: AccountType;
  roles?: UserRole[];
  acceptedTerms: boolean;
}

// User Update DTO
export interface UpdateUserDto {
  profile?: Partial<UserProfile>;
  preferences?: Partial<UserPreferences>;
  socialLinks?: Partial<UserSocialLinks>;
  businessProfile?: Partial<UserBusinessProfile>;
}

// User Login DTO
export interface UserLoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: {
    deviceName: string;
    deviceType: string;
    browser?: string;
    os?: string;
  };
}

// User Registration DTO
export interface UserRegistrationDto extends CreateUserDto {
  confirmPassword: string;
  referralCode?: string;
}

// User Password Reset DTO
export interface UserPasswordResetDto {
  email: string;
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

// User Email Verification DTO
export interface UserEmailVerificationDto {
  email: string;
  verificationToken: string;
}

// User Search Filters
export interface UserSearchFilters {
  roles?: UserRole[];
  status?: UserStatus[];
  kycStatus?: KYCStatus[];
  accountType?: AccountType[];
  createdAfter?: Date;
  createdBefore?: Date;
  searchQuery?: string;
}

// User List Response
export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

// User Session Interface
export interface UserSession {
  userId: string;
  sessionId: string;
  token: string;
  refreshToken?: string;
  expiresAt: Date;
  deviceInfo?: {
    deviceName: string;
    deviceType: string;
    browser?: string;
    os?: string;
    ipAddress?: string;
  };
  createdAt: Date;
}

// User Activity Log Interface
export interface UserActivityLog {
  id: string;
  userId: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// User Notification Settings Interface
export interface UserNotificationSettings {
  email: {
    orderUpdates: boolean;
    deliveryUpdates: boolean;
    paymentUpdates: boolean;
    messages: boolean;
    marketing: boolean;
    newsletter: boolean;
  };
  push: {
    orderUpdates: boolean;
    deliveryUpdates: boolean;
    paymentUpdates: boolean;
    messages: boolean;
    promotions: boolean;
  };
  sms: {
    orderUpdates: boolean;
    deliveryUpdates: boolean;
    securityAlerts: boolean;
  };
}

// User Wallet Summary Interface
export interface UserWalletSummary {
  balance: number;
  currency: string;
  pendingBalance: number;
  totalEarned: number;
  totalSpent: number;
  lastTransactionAt?: Date;
}

// User Public Profile Interface (for display to other users)
export interface UserPublicProfile {
  id: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  memberSince: Date;
  statistics: {
    averageRating: number;
    totalReviews: number;
    completedOrders: number;
    completedDeliveries: number;
    trustScore: number;
  };
  kycVerified: boolean;
  badges?: string[];
}
