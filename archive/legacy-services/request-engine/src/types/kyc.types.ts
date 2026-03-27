/**
 * KYC-Lite Types
 * 
 * Type definitions for simplified KYC verification system.
 */

// ============================================================================
// Enums
// ============================================================================

export enum VerificationLevel {
  UNVERIFIED = 'UNVERIFIED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  PHONE_VERIFIED = 'PHONE_VERIFIED',
  ID_VERIFIED = 'ID_VERIFIED'
}

export enum DocumentType {
  ID = 'ID',
  PASSPORT = 'PASSPORT',
  DRIVER_LICENSE = 'DRIVER_LICENSE'
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

// ============================================================================
// Transaction Limits
// ============================================================================

export const VERIFICATION_LIMITS: Record<VerificationLevel, number> = {
  [VerificationLevel.UNVERIFIED]: 100,
  [VerificationLevel.EMAIL_VERIFIED]: 500,
  [VerificationLevel.PHONE_VERIFIED]: 1000,
  [VerificationLevel.ID_VERIFIED]: 5000,
};

export const PAYOUT_VERIFICATION_THRESHOLD = 100;

// ============================================================================
// Interfaces
// ============================================================================

export interface VerificationDocument {
  id?: number;
  userId: number;
  documentType: DocumentType;
  frontImageUrl: string;
  backImageUrl?: string;
  status: VerificationStatus;
  uploadedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: number;
  rejectionReason?: string;
  metadata?: Record<string, any>;
}

export interface PhoneVerification {
  userId: number;
  phoneNumber: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
}

export interface EmailVerification {
  userId: number;
  email: string;
  token: string;
  expiresAt: Date;
  verified: boolean;
}

export interface UserVerificationStatus {
  userId: number;
  verificationLevel: VerificationLevel;
  emailVerified: boolean;
  phoneVerified: boolean;
  idVerified: boolean;
  transactionLimit: number;
  canRequestPayout: boolean;
}

export interface VerificationCheckResult {
  allowed: boolean;
  currentLevel: VerificationLevel;
  currentLimit: number;
  requestedAmount: number;
  requiredLevel?: VerificationLevel;
  message?: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface UploadIdRequest {
  documentType: DocumentType;
  frontImage: Express.Multer.File;
  backImage?: Express.Multer.File;
}

export interface VerifyPhoneRequest {
  phoneNumber: string;
}

export interface ConfirmPhoneRequest {
  phoneNumber: string;
  otp: string;
}

export interface ReviewDocumentRequest {
  approved: boolean;
  rejectionReason?: string;
}

export interface VerificationUpgradePrompt {
  currentLevel: VerificationLevel;
  requiredLevel: VerificationLevel;
  currentLimit: number;
  requiredLimit: number;
  upgradeSteps: string[];
  message: string;
}
