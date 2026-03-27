/**
 * Buyer Trust Verification Types (Lightweight)
 *
 * Purpose: Fraud prevention, dispute resolution, buyer accountability
 * NOT financial verification
 *
 * DO NOT collect:
 * - Passport
 * - Biometrics
 * - Financial data
 * - Payment info
 *
 * Constraints:
 * - Deterministic logic
 * - No scoring mutation
 * - No automation decisions
 * - Read-only trust indicators
 */

// ============================================
// ENUMS
// ============================================

/**
 * Buyer verification status (simple 3-state)
 * UNVERIFIED → VERIFIED → RESTRICTED
 */
export enum BuyerVerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  VERIFIED = 'VERIFIED',
  RESTRICTED = 'RESTRICTED',
}

/**
 * Valid status transitions
 */
export const VALID_BUYER_STATUS_TRANSITIONS: Record<BuyerVerificationStatus, BuyerVerificationStatus[]> = {
  [BuyerVerificationStatus.UNVERIFIED]: [BuyerVerificationStatus.VERIFIED],
  [BuyerVerificationStatus.VERIFIED]: [BuyerVerificationStatus.RESTRICTED],
  [BuyerVerificationStatus.RESTRICTED]: [BuyerVerificationStatus.VERIFIED], // Can be lifted
};

export enum BuyerTrustAuditAction {
  PROFILE_CREATED = 'PROFILE_CREATED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  PHONE_OTP_SENT = 'PHONE_OTP_SENT',
  PHONE_VERIFIED = 'PHONE_VERIFIED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  ADDRESS_ADDED = 'ADDRESS_ADDED',
  ADDRESS_UPDATED = 'ADDRESS_UPDATED',
  ADDRESS_VALIDATED = 'ADDRESS_VALIDATED',
  EMERGENCY_CONTACT_ADDED = 'EMERGENCY_CONTACT_ADDED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  RESTRICTION_APPLIED = 'RESTRICTION_APPLIED',
  RESTRICTION_LIFTED = 'RESTRICTION_LIFTED',
  DEVICE_LOGGED = 'DEVICE_LOGGED',
  SUSPICIOUS_ACTIVITY_FLAGGED = 'SUSPICIOUS_ACTIVITY_FLAGGED',
}

// ============================================
// INTERFACES
// ============================================

/**
 * Buyer Trust Profile
 */
export interface BuyerTrustProfile {
  id: number;
  userId: number;
  status: BuyerVerificationStatus;
  statusReason?: string;

  // Personal info (minimal)
  fullName?: string;
  email: string;
  emailVerified: boolean;
  emailVerifiedAt?: Date;

  // Phone
  phoneNumber?: string;
  phoneCountryCode?: string;
  phoneVerified: boolean;
  phoneVerifiedAt?: Date;

  // Emergency contact
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;

  // Device/IP tracking
  lastIpAddress?: string;
  lastDeviceFingerprint?: string;
  lastUserAgent?: string;
  lastGeoLocation?: string;
  lastActivityAt?: Date;

  // Restriction info
  restrictedAt?: Date;
  restrictedBy?: number;
  restrictionReason?: string;
  restrictionExpiresAt?: Date;

  // Timestamps
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  addresses?: BuyerDeliveryAddress[];
}

/**
 * Buyer Delivery Address
 */
export interface BuyerDeliveryAddress {
  id: number;
  profileId: number;
  userId: number;

  // Address fields
  label?: string;
  fullName: string;
  phoneNumber?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince?: string;
  postalCode?: string;
  country: string; // ISO 2-letter code

  // Validation
  isValidated: boolean;
  validatedAt?: Date;
  validationMethod?: string;
  validationNotes?: string;

  // Flags
  isDefault: boolean;
  isActive: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Device Log Entry (read-only)
 */
export interface BuyerDeviceLog {
  id: number;
  profileId: number;
  userId: number;

  // Device info
  ipAddress: string;
  deviceFingerprint?: string;
  userAgent?: string;
  geoLocation?: string;
  geoCountry?: string;
  geoCity?: string;

  // Activity
  activityType: string;
  activityDetails?: Record<string, unknown>;

  // Risk flags (READ-ONLY - no automation)
  isNewDevice: boolean;
  isNewLocation: boolean;
  isSuspicious: boolean;
  suspiciousReason?: string;

  // Timestamp
  createdAt: Date;
}

/**
 * Audit Log Entry
 */
export interface BuyerTrustAuditLog {
  id: number;
  profileId: number;
  userId: number;
  action: BuyerTrustAuditAction;
  description: string;

  // Actor
  actorId?: number;
  actorRole?: string;
  actorIp?: string;
  actorUserAgent?: string;

  // State
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;

  // Timestamp
  createdAt: Date;
}

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

/**
 * Create buyer profile request
 */
export interface CreateBuyerProfileRequest {
  email: string;
  fullName?: string;
  ipAddress: string;
  deviceFingerprint?: string;
  userAgent?: string;
}

/**
 * Update buyer profile request
 */
export interface UpdateBuyerProfileRequest {
  fullName?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
}

/**
 * Add address request
 */
export interface AddAddressRequest {
  label?: string;
  fullName: string;
  phoneNumber?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince?: string;
  postalCode?: string;
  country: string;
  isDefault?: boolean;
}

/**
 * Send phone OTP request
 */
export interface SendBuyerOtpRequest {
  phoneNumber: string;
  countryCode: string;
}

/**
 * Verify phone OTP request
 */
export interface VerifyBuyerOtpRequest {
  phoneNumber: string;
  otp: string;
  ipAddress: string;
}

/**
 * Apply restriction request (admin)
 */
export interface ApplyRestrictionRequest {
  reason: string;
  expiresAt?: string; // ISO date, null = permanent
}

// ============================================
// RESPONSE TYPES
// ============================================

/**
 * Buyer profile response
 */
export interface BuyerProfileResponse {
  id: number;
  userId: number;
  status: BuyerVerificationStatus;

  // Completion status
  completionStatus: {
    fullNameProvided: boolean;
    phoneVerified: boolean;
    emailVerified: boolean;
    addressAdded: boolean;
    emergencyContactProvided: boolean;
  };

  // Progress
  progressPercent: number;

  // Addresses count
  addressCount: number;

  // Timestamps
  verifiedAt?: Date;
  createdAt: Date;
}

/**
 * Buyer access status (for route protection)
 */
export interface BuyerAccessStatus {
  userId: number;
  status: BuyerVerificationStatus;
  isVerified: boolean;
  canBrowse: boolean; // Always true for unverified
  canSubmitRequests: boolean; // Only verified
  message: string;
  profileId?: number;
}

/**
 * Trust indicator (read-only, no scoring)
 */
export interface BuyerTrustIndicator {
  userId: number;
  status: BuyerVerificationStatus;
  phoneVerified: boolean;
  emailVerified: boolean;
  hasValidatedAddress: boolean;
  accountAgeDays: number;
  // NO score - just facts
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Check if status transition is valid
 */
export function isValidBuyerStatusTransition(
  current: BuyerVerificationStatus,
  next: BuyerVerificationStatus
): boolean {
  return VALID_BUYER_STATUS_TRANSITIONS[current].includes(next);
}

/**
 * Check if profile is ready for verification
 */
export function isReadyForVerification(profile: BuyerTrustProfile): {
  ready: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  if (!profile.fullName) missing.push('Full name');
  if (!profile.phoneVerified) missing.push('Phone verification');
  if (!profile.addresses || profile.addresses.length === 0) missing.push('Delivery address');

  return {
    ready: missing.length === 0,
    missing,
  };
}

/**
 * Basic address validation (format check only)
 */
export function validateAddressFormat(address: AddAddressRequest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!address.fullName || address.fullName.length < 2) {
    errors.push('Full name is required');
  }
  if (!address.addressLine1 || address.addressLine1.length < 5) {
    errors.push('Address line 1 is required');
  }
  if (!address.city || address.city.length < 2) {
    errors.push('City is required');
  }
  if (!address.country || address.country.length !== 2) {
    errors.push('Valid country code is required (2 letters)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
