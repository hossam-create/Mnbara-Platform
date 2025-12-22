/**
 * Traveler Full KYC Types
 * 
 * Purpose: Trust, fraud prevention, dispute resolution ONLY
 * NO payments, NO wallets, NO FX, NO financial execution
 * 
 * Constraints:
 * - Deterministic logic only
 * - No automation decisions
 * - Human review required for approval
 * - GDPR-style data minimization
 */

// ============================================
// ENUMS
// ============================================

/**
 * KYC Application Status - State Machine
 * DRAFT → SUBMITTED → UNDER_REVIEW → VERIFIED / REJECTED
 */
export enum TravelerKycStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

/**
 * Valid state transitions
 */
export const VALID_STATUS_TRANSITIONS: Record<TravelerKycStatus, TravelerKycStatus[]> = {
  [TravelerKycStatus.DRAFT]: [TravelerKycStatus.SUBMITTED],
  [TravelerKycStatus.SUBMITTED]: [TravelerKycStatus.UNDER_REVIEW, TravelerKycStatus.REJECTED],
  [TravelerKycStatus.UNDER_REVIEW]: [TravelerKycStatus.VERIFIED, TravelerKycStatus.REJECTED],
  [TravelerKycStatus.VERIFIED]: [], // Terminal state
  [TravelerKycStatus.REJECTED]: [TravelerKycStatus.DRAFT], // Can resubmit
};

export enum TravelerDocumentType {
  PASSPORT = 'PASSPORT',
  BIOMETRIC_SELFIE = 'BIOMETRIC_SELFIE',
  FLIGHT_TICKET = 'FLIGHT_TICKET',
  PROOF_OF_ADDRESS = 'PROOF_OF_ADDRESS',
  BOARDING_PASS = 'BOARDING_PASS',
}

export enum TravelerGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export enum LegalAcknowledgmentType {
  TERMS_OF_SERVICE = 'TERMS_OF_SERVICE',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  DATA_ACCURACY = 'DATA_ACCURACY',
  LEGAL_ACCOUNTABILITY = 'LEGAL_ACCOUNTABILITY',
  SUSPENSION_POLICY = 'SUSPENSION_POLICY',
  IDENTITY_VERIFICATION_CONSENT = 'IDENTITY_VERIFICATION_CONSENT',
}

export enum TravelerDocumentStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum TravelerKycAuditAction {
  APPLICATION_CREATED = 'APPLICATION_CREATED',
  APPLICATION_UPDATED = 'APPLICATION_UPDATED',
  APPLICATION_SUBMITTED = 'APPLICATION_SUBMITTED',
  APPLICATION_UNDER_REVIEW = 'APPLICATION_UNDER_REVIEW',
  APPLICATION_VERIFIED = 'APPLICATION_VERIFIED',
  APPLICATION_REJECTED = 'APPLICATION_REJECTED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_REVIEWED = 'DOCUMENT_REVIEWED',
  DOCUMENT_APPROVED = 'DOCUMENT_APPROVED',
  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',
  DOCUMENT_DELETED = 'DOCUMENT_DELETED',
  PHONE_VERIFICATION_SENT = 'PHONE_VERIFICATION_SENT',
  PHONE_VERIFIED = 'PHONE_VERIFIED',
  EMAIL_VERIFICATION_SENT = 'EMAIL_VERIFICATION_SENT',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  ADMIN_NOTE_ADDED = 'ADMIN_NOTE_ADDED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  LEGAL_ACKNOWLEDGMENT_SIGNED = 'LEGAL_ACKNOWLEDGMENT_SIGNED',
  DIGITAL_SIGNATURE_CAPTURED = 'DIGITAL_SIGNATURE_CAPTURED',
  BOARDING_PASS_UPLOADED = 'BOARDING_PASS_UPLOADED',
  SECURITY_LOG_CAPTURED = 'SECURITY_LOG_CAPTURED',
}

// ============================================
// INTERFACES
// ============================================

/**
 * Traveler KYC Application
 */
export interface TravelerKycApplication {
  id: number;
  userId: number;
  applicationNumber: string;
  status: TravelerKycStatus;
  statusReason?: string;

  // Section 1: Personal Identity (Enhanced)
  fullLegalName?: string;
  dateOfBirth?: Date;
  nationality?: string;
  gender?: TravelerGender;
  passportNumber?: string;
  passportCountry?: string;
  passportExpiryDate?: Date;

  // Contact
  email: string;
  emailVerified: boolean;
  emailVerifiedAt?: Date;

  // Phones
  localPhone?: string;
  localPhoneCountry?: string;
  localPhoneVerified: boolean;
  localPhoneVerifiedAt?: Date;

  foreignPhone?: string;
  foreignPhoneCountry?: string;
  foreignPhoneVerified: boolean;
  foreignPhoneVerifiedAt?: Date;

  // Section 2: Travel Information (Enhanced)
  departureCountry?: string;
  departureCity?: string;
  arrivalCountry?: string;
  arrivalCity?: string;
  travelDateFrom?: Date;
  travelDateTo?: Date;
  departureDate?: Date;
  returnDate?: Date;
  boardingPassUploaded: boolean;
  boardingPassUploadedAt?: Date;

  // Section 3: Permanent Address (Egypt-specific)
  permanentAddressLine1?: string;
  permanentAddressLine2?: string;
  permanentCity?: string;
  permanentGovernorate?: string;
  permanentPostalCode?: string;
  permanentCountry?: string;

  // Section 3: Current Address (abroad)
  currentAddressLine1?: string;
  currentAddressLine2?: string;
  currentCity?: string;
  currentStateProvince?: string;
  currentPostalCode?: string;
  currentCountry?: string;
  currentAddressSameAsPermanent: boolean;

  // Legacy address fields (for backward compatibility)
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;

  // Emergency Contact (Enhanced)
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  emergencyContactCountry?: string;

  // Section 4: Security Logs (Auto-captured)
  ipAddress?: string;
  deviceFingerprint?: string;
  userAgent?: string;
  geoLocation?: string;
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  geoCountry?: string;
  submissionTimestamp?: Date;

  // Section 5: Legal Acknowledgment
  legalAcknowledgmentCompleted: boolean;
  legalAcknowledgmentCompletedAt?: Date;
  digitalSignatureName?: string;
  digitalSignatureDate?: Date;
  digitalSignatureIp?: string;
  digitalSignatureHash?: string;

  // Contractual acknowledgments
  acknowledgedDataAccuracy: boolean;
  acknowledgedLegalAccountability: boolean;
  acknowledgedSuspensionPolicy: boolean;

  // Review
  reviewedBy?: number;
  reviewedAt?: Date;
  reviewNotes?: string;
  rejectionReason?: string;

  // Timestamps
  submittedAt?: Date;
  verifiedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  documents?: TravelerKycDocument[];
  legalAcknowledgments?: TravelerLegalAcknowledgment[];
}


/**
 * Traveler KYC Document
 */
export interface TravelerKycDocument {
  id: number;
  applicationId: number;
  userId: number;
  documentType: TravelerDocumentType;

  // File Storage
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileHash?: string;

  // Encryption
  encryptionKeyId?: string;
  encryptedAt?: Date;

  // Document metadata
  documentNumber?: string;
  documentCountry?: string;
  issuedDate?: Date;
  expiryDate?: Date;

  // Biometric selfie
  livenessReady: boolean;
  captureTimestamp?: Date;

  // Flight ticket
  flightNumber?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  flightDate?: Date;

  // Status
  status: TravelerDocumentStatus;
  reviewedBy?: number;
  reviewedAt?: Date;
  reviewNotes?: string;
  rejectionReason?: string;

  // Upload metadata
  uploadIpAddress?: string;
  uploadUserAgent?: string;

  // GDPR
  retentionExpiresAt?: Date;
  deletedAt?: Date;
  deletionReason?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Traveler KYC Audit Log Entry
 */
export interface TravelerKycAuditLog {
  id: number;
  applicationId: number;
  userId: number;
  action: TravelerKycAuditAction;
  description: string;

  // Actor
  actorId?: number;
  actorRole?: string;
  actorIp?: string;
  actorUserAgent?: string;

  // State change
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;

  // Metadata
  metadata?: Record<string, unknown>;

  // Timestamp (immutable)
  createdAt: Date;
}

/**
 * Legal Acknowledgment Entry
 */
export interface TravelerLegalAcknowledgment {
  id: number;
  applicationId: number;
  userId: number;
  acknowledgmentType: LegalAcknowledgmentType;

  // Acknowledgment details
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedIp?: string;
  acknowledgedUserAgent?: string;

  // Document version (for legal tracking)
  documentVersion: string;
  documentHash?: string;

  // Timestamp
  createdAt: Date;
}

/**
 * Security Log Entry (Immutable)
 */
export interface TravelerSecurityLog {
  id: number;
  applicationId: number;
  userId: number;

  // Device/Browser info
  ipAddress: string;
  deviceFingerprint?: string;
  userAgent?: string;
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;

  // Geo (country only for privacy)
  geoCountry?: string;

  // Activity
  activityType: string;
  activityDetails?: Record<string, unknown>;

  // Immutable timestamp
  timestamp: Date;
}

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

/**
 * Create KYC Application Request
 */
export interface CreateTravelerKycRequest {
  email: string;
  ipAddress: string;
  deviceFingerprint?: string;
  userAgent?: string;
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  geoCountry?: string;
}

/**
 * Update KYC Application Request (Enhanced)
 */
export interface UpdateTravelerKycRequest {
  // Section 1: Personal Identity
  fullLegalName?: string;
  dateOfBirth?: string; // ISO date
  nationality?: string;
  gender?: TravelerGender;
  passportNumber?: string;
  passportCountry?: string;
  passportExpiryDate?: string;

  // Section 2: Travel Information
  departureCountry?: string;
  departureCity?: string;
  arrivalCountry?: string;
  arrivalCity?: string;
  travelDateFrom?: string;
  travelDateTo?: string;
  departureDate?: string;
  returnDate?: string;

  // Section 3: Permanent Address (Egypt)
  permanentAddressLine1?: string;
  permanentAddressLine2?: string;
  permanentCity?: string;
  permanentGovernorate?: string;
  permanentPostalCode?: string;
  permanentCountry?: string;

  // Section 3: Current Address (abroad)
  currentAddressLine1?: string;
  currentAddressLine2?: string;
  currentCity?: string;
  currentStateProvince?: string;
  currentPostalCode?: string;
  currentCountry?: string;
  currentAddressSameAsPermanent?: boolean;

  // Legacy address (backward compatibility)
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;

  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  emergencyContactCountry?: string;
}

/**
 * Sign Legal Acknowledgment Request
 */
export interface SignLegalAcknowledgmentRequest {
  acknowledgmentType: LegalAcknowledgmentType;
  documentVersion: string;
  ipAddress: string;
  userAgent?: string;
}

/**
 * Capture Digital Signature Request
 */
export interface CaptureDigitalSignatureRequest {
  signatureName: string; // Full legal name as typed
  ipAddress: string;
  userAgent?: string;
}

/**
 * Capture Security Log Request
 */
export interface CaptureSecurityLogRequest {
  ipAddress: string;
  deviceFingerprint?: string;
  userAgent?: string;
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  geoCountry?: string;
  activityType: string;
  activityDetails?: Record<string, unknown>;
}

/**
 * Upload Document Request
 */
export interface UploadDocumentRequest {
  documentType: TravelerDocumentType;
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };

  // Document metadata (for passport)
  documentNumber?: string;
  documentCountry?: string;
  issuedDate?: string;
  expiryDate?: string;

  // Flight ticket metadata
  flightNumber?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  flightDate?: string;

  // Biometric selfie
  captureTimestamp?: string;

  // Client info
  ipAddress: string;
  userAgent?: string;
}

/**
 * Send Phone OTP Request
 */
export interface SendPhoneOtpRequest {
  phoneNumber: string;
  phoneType: 'local' | 'foreign';
  countryCode: string;
}

/**
 * Verify Phone OTP Request
 */
export interface VerifyPhoneOtpRequest {
  phoneNumber: string;
  phoneType: 'local' | 'foreign';
  otp: string;
  ipAddress: string;
}

/**
 * Admin Review Request
 */
export interface AdminReviewRequest {
  action: 'approve' | 'reject';
  notes?: string;
  rejectionReason?: string;
}

/**
 * Admin Document Review Request
 */
export interface AdminDocumentReviewRequest {
  action: 'approve' | 'reject';
  notes?: string;
  rejectionReason?: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

/**
 * KYC Application Response (Enhanced)
 */
export interface TravelerKycApplicationResponse {
  id: number;
  applicationNumber: string;
  status: TravelerKycStatus;
  statusReason?: string;

  // Completion status (Enhanced)
  completionStatus: {
    // Section 1: Personal Identity
    personalInfo: boolean;
    passportDetailsProvided: boolean;

    // Section 2: Contact
    localPhoneVerified: boolean;
    foreignPhoneVerified: boolean;

    // Section 3: Documents
    passportUploaded: boolean;
    selfieUploaded: boolean;
    flightTicketUploaded: boolean;
    boardingPassUploaded: boolean;

    // Section 4: Travel Info
    travelInfoProvided: boolean;

    // Section 5: Addresses
    permanentAddressProvided: boolean;
    currentAddressProvided: boolean;

    // Section 6: Emergency Contact
    emergencyContactProvided: boolean;

    // Section 7: Legal Acknowledgments
    legalAcknowledgmentsCompleted: boolean;
    digitalSignatureCaptured: boolean;
  };

  // Progress percentage
  progressPercent: number;

  // Documents summary
  documents: {
    type: TravelerDocumentType;
    status: TravelerDocumentStatus;
    uploadedAt: Date;
  }[];

  // Legal acknowledgments summary
  legalAcknowledgments: {
    type: LegalAcknowledgmentType;
    acknowledged: boolean;
    acknowledgedAt?: Date;
  }[];

  // Timestamps
  submittedAt?: Date;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * KYC Status Response (for blocking check)
 */
export interface TravelerKycStatusResponse {
  userId: number;
  status: TravelerKycStatus;
  isVerified: boolean;
  canViewRequests: boolean;
  canAcceptRequests: boolean;
  message: string;
  applicationId?: number;
}

/**
 * Admin Pending Applications Response
 */
export interface AdminPendingApplicationsResponse {
  applications: {
    id: number;
    applicationNumber: string;
    userId: number;
    userEmail: string;
    status: TravelerKycStatus;
    submittedAt: Date;
    documentsCount: number;
    documentsApproved: number;
  }[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================
// REQUIRED DOCUMENTS FOR VERIFICATION
// ============================================

export const REQUIRED_DOCUMENTS: TravelerDocumentType[] = [
  TravelerDocumentType.PASSPORT,
  TravelerDocumentType.BIOMETRIC_SELFIE,
  TravelerDocumentType.FLIGHT_TICKET,
];

export const OPTIONAL_DOCUMENTS: TravelerDocumentType[] = [
  TravelerDocumentType.PROOF_OF_ADDRESS,
  TravelerDocumentType.BOARDING_PASS,
];

/**
 * Required legal acknowledgments
 */
export const REQUIRED_LEGAL_ACKNOWLEDGMENTS: LegalAcknowledgmentType[] = [
  LegalAcknowledgmentType.TERMS_OF_SERVICE,
  LegalAcknowledgmentType.PRIVACY_POLICY,
  LegalAcknowledgmentType.DATA_ACCURACY,
  LegalAcknowledgmentType.LEGAL_ACCOUNTABILITY,
  LegalAcknowledgmentType.SUSPENSION_POLICY,
  LegalAcknowledgmentType.IDENTITY_VERIFICATION_CONSENT,
];

/**
 * Check if application has all required documents
 */
export function hasAllRequiredDocuments(documents: TravelerKycDocument[]): boolean {
  const uploadedTypes = new Set(documents.map(d => d.documentType));
  return REQUIRED_DOCUMENTS.every(type => uploadedTypes.has(type));
}

/**
 * Check if all legal acknowledgments are signed
 */
export function hasAllLegalAcknowledgments(acknowledgments: TravelerLegalAcknowledgment[]): boolean {
  const signedTypes = new Set(
    acknowledgments.filter(a => a.acknowledged).map(a => a.acknowledgmentType)
  );
  return REQUIRED_LEGAL_ACKNOWLEDGMENTS.every(type => signedTypes.has(type));
}

/**
 * Check if application is ready for submission (Enhanced)
 */
export function isReadyForSubmission(application: TravelerKycApplication): {
  ready: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  // Section 1: Personal Identity
  if (!application.fullLegalName) missing.push('Full legal name');
  if (!application.dateOfBirth) missing.push('Date of birth');
  if (!application.nationality) missing.push('Nationality');
  if (!application.gender) missing.push('Gender');

  // Phones
  if (!application.localPhoneVerified) missing.push('Local phone verification');
  if (!application.foreignPhoneVerified) missing.push('Foreign phone verification');

  // Section 2: Travel Information
  if (!application.departureCountry) missing.push('Departure country');
  if (!application.departureCity) missing.push('Departure city');
  if (!application.arrivalCountry) missing.push('Arrival country');
  if (!application.arrivalCity) missing.push('Arrival city');
  if (!application.travelDateFrom) missing.push('Travel start date');
  if (!application.travelDateTo) missing.push('Travel end date');

  // Section 3: Permanent Address (Egypt)
  if (!application.permanentAddressLine1) missing.push('Permanent address');
  if (!application.permanentCity) missing.push('Permanent city');
  if (!application.permanentGovernorate) missing.push('Governorate');

  // Section 3: Current Address (if not same as permanent)
  if (!application.currentAddressSameAsPermanent) {
    if (!application.currentAddressLine1) missing.push('Current address');
    if (!application.currentCity) missing.push('Current city');
    if (!application.currentCountry) missing.push('Current country');
  }

  // Emergency contact
  if (!application.emergencyContactName) missing.push('Emergency contact name');
  if (!application.emergencyContactPhone) missing.push('Emergency contact phone');

  // Documents
  if (!application.documents || !hasAllRequiredDocuments(application.documents)) {
    missing.push('Required documents (passport, selfie, flight ticket)');
  }

  // Legal Acknowledgments
  if (!application.legalAcknowledgmentCompleted) {
    missing.push('Legal acknowledgments');
  }

  // Digital Signature
  if (!application.digitalSignatureName || !application.digitalSignatureHash) {
    missing.push('Digital signature');
  }

  // Contractual acknowledgments
  if (!application.acknowledgedDataAccuracy) missing.push('Data accuracy acknowledgment');
  if (!application.acknowledgedLegalAccountability) missing.push('Legal accountability acknowledgment');
  if (!application.acknowledgedSuspensionPolicy) missing.push('Suspension policy acknowledgment');

  return {
    ready: missing.length === 0,
    missing,
  };
}

/**
 * Check if status transition is valid
 */
export function isValidStatusTransition(
  currentStatus: TravelerKycStatus,
  newStatus: TravelerKycStatus
): boolean {
  return VALID_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
}
