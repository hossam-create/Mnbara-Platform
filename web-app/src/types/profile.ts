/**
 * Profile Types for Mnbara Platform
 * Comprehensive type definitions for user profiles, KYC, privacy, security, and trust scores
 */

// User Profile Types
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  country: string;
  language: string;
  timezone: string;
  memberSince: string;
  lastActiveAt: string;
  role: UserRole;
  status: UserStatus;
  kycStatus: KYCStatus;
  trustScore: TrustScore;
  stats: UserStats;
  socialLinks?: SocialLinks;
  verifiedAccounts?: VerifiedAccount[];
}

export type UserRole = 'buyer' | 'seller' | 'both' | 'admin' | 'moderator';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'banned';

export interface UserStats {
  totalPurchases: number;
  totalSales: number;
  totalListings: number;
  totalReviews: number;
  averageRating: number;
  responseRate: number;
  deliveryRate: number;
  disputeRate: number;
  memberDurationMonths: number;
  totalDisputes: number;
  resolvedDisputes: number;
}

export interface SocialLinks {
  website?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
}

export interface VerifiedAccount {
  provider: 'google' | 'facebook' | 'twitter' | 'apple' | 'phone';
  verifiedAt: string;
  email?: string;
  phoneNumber?: string;
}

// KYC Verification Types
export type KYCStatus = 'not_started' | 'pending' | 'in_review' | 'verified' | 'rejected' | 'expired';

export type KYCDocumentType = 
  | 'national_id' 
  | 'passport' 
  | 'drivers_license' 
  | 'utility_bill' 
  | 'bank_statement' 
  | 'tax_document'
  | 'selfie';

export type KYCLivenessCheck = 'pending' | 'passed' | 'failed';

export interface KYCDocument {
  id: string;
  userId: string;
  type: KYCDocumentType;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  expirationDate?: string;
}

export interface KYCVerification {
  id: string;
  userId: string;
  status: KYCStatus;
  level: 1 | 2 | 3;
  documents: KYCDocument[];
  livenessCheck?: KYCLivenessCheck;
  livenessCheckAt?: string;
  submittedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  expiresAt?: string;
  notes?: string[];
}

export interface KYCProgressStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  icon?: string;
  completedAt?: string;
}

export interface KYCProgress {
  steps: KYCProgressStep[];
  currentStep: number;
  percentage: number;
  estimatedTimeRemaining?: string;
}

export interface KYCLimits {
  level: number;
  dailyWithdrawalLimit: number;
  monthlyWithdrawalLimit: number;
  totalTransactionLimit: number;
  requiresLivenessCheck: boolean;
}

// Privacy Settings Types
export type ProfileVisibility = 'public' | 'friends_only' | 'private' | 'custom';

export interface PrivacySettings {
  profileVisibility: ProfileVisibility;
  showEmail: boolean;
  showPhoneNumber: boolean;
  showOnlineStatus: boolean;
  showLastActive: boolean;
  showPurchases: boolean;
  showSales: boolean;
  showReviews: boolean;
  allowMessagesFromStrangers: boolean;
  allowFriendRequests: boolean;
  showInSearchResults: boolean;
  allowDataAnalytics: boolean;
  personalizedAds: boolean;
  twoFactorAuth: boolean;
  loginNotifications: boolean;
  blockedUsers: BlockedUser[];
  mutedUsers: string[];
}

export interface BlockedUser {
  userId: string;
  username: string;
  avatarUrl?: string;
  blockedAt: string;
  reason?: string;
}

// Security Settings Types
export type MFAMethod = 'totp' | 'sms' | 'email' | 'none';

export interface SecuritySettings {
  passwordLastChanged: string;
  passwordExpiresIn?: number;
  mfaEnabled: boolean;
  mfaMethod: MFAMethod;
  mfaVerified: boolean;
  loginHistory: LoginSession[];
  activeSessions: LoginSession[];
  connectedAccounts: ConnectedAccount[];
  apiKeys?: APIKey[];
  securityNotifications: SecurityNotificationSettings;
}

export interface LoginSession {
  id: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  ipAddress: string;
  location?: string;
  isCurrentSession: boolean;
  createdAt: string;
  lastActiveAt: string;
  expiresAt?: string;
}

export interface ConnectedAccount {
  id: string;
  provider: 'google' | 'facebook' | 'twitter' | 'apple';
  email: string;
  connectedAt: string;
  lastSyncAt?: string;
  scope: string[];
}

export interface APIKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface SecurityNotificationSettings {
  loginAlerts: boolean;
  passwordChanges: boolean;
  mfaChanges: boolean;
  accountModifications: boolean;
  suspiciousActivity: boolean;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordChangeResponse {
  success: boolean;
  message: string;
  requiresReauth: boolean;
}

// Trust Score Types
export type TrustScoreGrade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';

export interface TrustScore {
  overall: number;
  grade: TrustScoreGrade;
  maxScore: number;
  breakdown: TrustScoreBreakdown;
  history: TrustScoreHistoryItem[];
  lastCalculatedAt: string;
  nextCalculationAt: string;
}

export interface TrustScoreBreakdown {
  transactionCompletion: {
    score: number;
    weight: number;
    value: number;
    maxValue: number;
  };
  communication: {
    score: number;
    weight: number;
    value: number;
    maxValue: number;
  };
  deliveryPerformance: {
    score: number;
    weight: number;
    value: number;
    maxValue: number;
  };
  disputeResolution: {
    score: number;
    weight: number;
    value: number;
    maxValue: number;
  };
  reviewsRating: {
    score: number;
    weight: number;
    value: number;
    maxValue: number;
  };
  accountAge: {
    score: number;
    weight: number;
    value: number;
    maxValue: number;
  };
}

export interface TrustScoreHistoryItem {
  date: string;
  score: number;
  grade: TrustScoreGrade;
  change: number;
  reason: string;
}

export interface TrustScoreImprovement {
  area: string;
  currentScore: number;
  targetScore: number;
  actions: string[];
  estimatedImpact: number;
  priority: 'high' | 'medium' | 'low';
}

export interface ReputationHistoryItem {
  id: string;
  type: 'positive' | 'negative' | 'neutral';
  category: 'transaction' | 'review' | 'dispute' | 'communication' | 'delivery';
  description: string;
  points: number;
  createdAt: string;
  relatedTransactionId?: string;
  relatedReviewId?: string;
}

// Data Export Types
export interface DataExportRequest {
  dataTypes: DataType[];
  format: 'json' | 'csv' | 'pdf';
  includeAttachments: boolean;
}

export type DataType = 
  | 'profile'
  | 'transactions'
  | 'orders'
  | 'listings'
  | 'reviews'
  | 'messages'
  | 'kyc_documents'
  | 'activity_log'
  | 'preferences';

export interface DataExportStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  completedAt?: string;
  downloadUrl?: string;
  expiresAt?: string;
  fileSize?: number;
  error?: string;
}

// API Response Types
export interface ProfileApiResponse {
  success: boolean;
  data?: UserProfile;
  error?: {
    code: string;
    message: string;
  };
}

export interface ProfileUpdateRequest {
  displayName?: string;
  bio?: string;
  phoneNumber?: string;
  country?: string;
  language?: string;
  timezone?: string;
  socialLinks?: SocialLinks;
}

export interface ProfileUpdateResponse {
  success: boolean;
  data?: UserProfile;
  error?: {
    code: string;
    message: string;
  };
}

export interface AvatarUploadResponse {
  success: boolean;
  avatarUrl?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface KYCApiResponse {
  success: boolean;
  data?: KYCVerification;
  error?: {
    code: string;
    message: string;
  };
}

export interface TrustScoreApiResponse {
  success: boolean;
  data?: TrustScore;
  error?: {
    code: string;
    message: string;
  };
}

export interface PrivacySettingsApiResponse {
  success: boolean;
  data?: PrivacySettings;
  error?: {
    code: string;
    message: string;
  };
}

export interface SecuritySettingsApiResponse {
  success: boolean;
  data?: SecuritySettings;
  error?: {
    code: string;
    message: string;
  };
}
