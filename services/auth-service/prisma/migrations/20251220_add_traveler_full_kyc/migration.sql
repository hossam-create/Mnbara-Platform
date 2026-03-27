-- Traveler Full KYC Migration
-- Purpose: Trust, fraud prevention, dispute resolution ONLY
-- NO payments, NO wallets, NO FX, NO financial execution

-- ============================================
-- TRAVELER KYC STATUS ENUM
-- ============================================
CREATE TYPE "TravelerKycStatus" AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'VERIFIED',
  'REJECTED'
);

-- ============================================
-- TRAVELER KYC APPLICATION TABLE
-- Main application tracking with state machine
-- ============================================
CREATE TABLE "TravelerKycApplication" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL UNIQUE,
  "applicationNumber" VARCHAR(50) NOT NULL UNIQUE,
  
  -- Status (state machine: DRAFT → SUBMITTED → UNDER_REVIEW → VERIFIED/REJECTED)
  "status" "TravelerKycStatus" NOT NULL DEFAULT 'DRAFT',
  "statusReason" TEXT,
  
  -- Personal Information (encrypted at rest)
  "fullLegalName" VARCHAR(255),
  "dateOfBirth" DATE,
  "nationality" VARCHAR(3),  -- ISO 3166-1 alpha-3
  
  -- Contact Information
  "email" VARCHAR(255) NOT NULL,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "emailVerifiedAt" TIMESTAMP,
  
  -- Phone Numbers (OTP verified)
  "localPhone" VARCHAR(50),
  "localPhoneCountry" VARCHAR(3),
  "localPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
  "localPhoneVerifiedAt" TIMESTAMP,
  
  "foreignPhone" VARCHAR(50),
  "foreignPhoneCountry" VARCHAR(3),
  "foreignPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
  "foreignPhoneVerifiedAt" TIMESTAMP,
  
  -- Address (home country)
  "addressLine1" TEXT,
  "addressLine2" TEXT,
  "city" VARCHAR(100),
  "stateProvince" VARCHAR(100),
  "postalCode" VARCHAR(20),
  "country" VARCHAR(3),  -- ISO 3166-1 alpha-3
  
  -- Emergency Contact
  "emergencyContactName" VARCHAR(255),
  "emergencyContactPhone" VARCHAR(50),
  "emergencyContactRelation" VARCHAR(100),
  
  -- Travel Information
  "travelDateFrom" DATE,
  "travelDateTo" DATE,
  "departureDate" DATE,
  "returnDate" DATE,
  
  -- Device & Security Fingerprint
  "ipAddress" VARCHAR(45),  -- IPv6 compatible
  "deviceFingerprint" TEXT,
  "userAgent" TEXT,
  "geoLocation" VARCHAR(255),
  
  -- Review Information
  "reviewedBy" INTEGER,
  "reviewedAt" TIMESTAMP,
  "reviewNotes" TEXT,
  "rejectionReason" TEXT,
  
  -- Timestamps
  "submittedAt" TIMESTAMP,
  "verifiedAt" TIMESTAMP,
  "expiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Foreign Keys
  CONSTRAINT "fk_traveler_kyc_user" FOREIGN KEY ("userId") 
    REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_traveler_kyc_reviewer" FOREIGN KEY ("reviewedBy") 
    REFERENCES "User"("id") ON DELETE SET NULL
);

-- Indexes for TravelerKycApplication
CREATE INDEX "idx_traveler_kyc_user" ON "TravelerKycApplication"("userId");
CREATE INDEX "idx_traveler_kyc_status" ON "TravelerKycApplication"("status");
CREATE INDEX "idx_traveler_kyc_app_number" ON "TravelerKycApplication"("applicationNumber");
CREATE INDEX "idx_traveler_kyc_submitted" ON "TravelerKycApplication"("submittedAt");
CREATE INDEX "idx_traveler_kyc_verified" ON "TravelerKycApplication"("verifiedAt");


-- ============================================
-- TRAVELER KYC DOCUMENT TABLE
-- Encrypted file storage for sensitive documents
-- ============================================
CREATE TYPE "TravelerDocumentType" AS ENUM (
  'PASSPORT',
  'BIOMETRIC_SELFIE',
  'FLIGHT_TICKET',
  'PROOF_OF_ADDRESS'
);

CREATE TYPE "TravelerDocumentStatus" AS ENUM (
  'PENDING',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED'
);

CREATE TABLE "TravelerKycDocument" (
  "id" SERIAL PRIMARY KEY,
  "applicationId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  
  -- Document Type
  "documentType" "TravelerDocumentType" NOT NULL,
  
  -- File Storage (encrypted at rest)
  "fileUrl" TEXT NOT NULL,  -- Encrypted S3/MinIO path
  "fileName" VARCHAR(255) NOT NULL,
  "fileSize" INTEGER NOT NULL,  -- bytes
  "mimeType" VARCHAR(100) NOT NULL,
  "fileHash" VARCHAR(64),  -- SHA-256 for integrity
  
  -- Encryption metadata
  "encryptionKeyId" VARCHAR(100),
  "encryptedAt" TIMESTAMP,
  
  -- Document metadata (for passport)
  "documentNumber" TEXT,  -- Encrypted
  "documentCountry" VARCHAR(3),
  "issuedDate" DATE,
  "expiryDate" DATE,
  
  -- Biometric selfie metadata (liveness-ready, NO ML inference)
  "livenessReady" BOOLEAN DEFAULT false,
  "captureTimestamp" TIMESTAMP,
  
  -- Flight ticket metadata
  "flightNumber" VARCHAR(20),
  "departureAirport" VARCHAR(10),
  "arrivalAirport" VARCHAR(10),
  "flightDate" DATE,
  
  -- Verification Status
  "status" "TravelerDocumentStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedBy" INTEGER,
  "reviewedAt" TIMESTAMP,
  "reviewNotes" TEXT,
  "rejectionReason" TEXT,
  
  -- Upload metadata
  "uploadIpAddress" VARCHAR(45),
  "uploadUserAgent" TEXT,
  
  -- GDPR: Retention & Deletion
  "retentionExpiresAt" TIMESTAMP,
  "deletedAt" TIMESTAMP,
  "deletionReason" TEXT,
  
  -- Timestamps
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Foreign Keys
  CONSTRAINT "fk_traveler_doc_application" FOREIGN KEY ("applicationId") 
    REFERENCES "TravelerKycApplication"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_traveler_doc_user" FOREIGN KEY ("userId") 
    REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_traveler_doc_reviewer" FOREIGN KEY ("reviewedBy") 
    REFERENCES "User"("id") ON DELETE SET NULL
);

-- Indexes for TravelerKycDocument
CREATE INDEX "idx_traveler_doc_application" ON "TravelerKycDocument"("applicationId");
CREATE INDEX "idx_traveler_doc_user" ON "TravelerKycDocument"("userId");
CREATE INDEX "idx_traveler_doc_type" ON "TravelerKycDocument"("documentType");
CREATE INDEX "idx_traveler_doc_status" ON "TravelerKycDocument"("status");
CREATE INDEX "idx_traveler_doc_retention" ON "TravelerKycDocument"("retentionExpiresAt");

-- ============================================
-- TRAVELER KYC AUDIT LOG TABLE
-- Immutable audit trail for every action
-- ============================================
CREATE TYPE "TravelerKycAuditAction" AS ENUM (
  'APPLICATION_CREATED',
  'APPLICATION_UPDATED',
  'APPLICATION_SUBMITTED',
  'APPLICATION_UNDER_REVIEW',
  'APPLICATION_VERIFIED',
  'APPLICATION_REJECTED',
  'DOCUMENT_UPLOADED',
  'DOCUMENT_REVIEWED',
  'DOCUMENT_APPROVED',
  'DOCUMENT_REJECTED',
  'DOCUMENT_DELETED',
  'PHONE_VERIFICATION_SENT',
  'PHONE_VERIFIED',
  'EMAIL_VERIFICATION_SENT',
  'EMAIL_VERIFIED',
  'ADMIN_NOTE_ADDED',
  'STATUS_CHANGED'
);

CREATE TABLE "TravelerKycAuditLog" (
  "id" SERIAL PRIMARY KEY,
  "applicationId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  
  -- Action
  "action" "TravelerKycAuditAction" NOT NULL,
  "description" TEXT NOT NULL,
  
  -- Actor (who performed the action)
  "actorId" INTEGER,  -- NULL for system actions
  "actorRole" VARCHAR(50),
  "actorIp" VARCHAR(45),
  "actorUserAgent" TEXT,
  
  -- State change
  "previousState" JSONB,
  "newState" JSONB,
  
  -- Metadata
  "metadata" JSONB,
  
  -- Timestamp (immutable)
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Foreign Keys
  CONSTRAINT "fk_traveler_audit_application" FOREIGN KEY ("applicationId") 
    REFERENCES "TravelerKycApplication"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_traveler_audit_user" FOREIGN KEY ("userId") 
    REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_traveler_audit_actor" FOREIGN KEY ("actorId") 
    REFERENCES "User"("id") ON DELETE SET NULL
);

-- Indexes for TravelerKycAuditLog
CREATE INDEX "idx_traveler_audit_application" ON "TravelerKycAuditLog"("applicationId");
CREATE INDEX "idx_traveler_audit_user" ON "TravelerKycAuditLog"("userId");
CREATE INDEX "idx_traveler_audit_action" ON "TravelerKycAuditLog"("action");
CREATE INDEX "idx_traveler_audit_created" ON "TravelerKycAuditLog"("createdAt");
CREATE INDEX "idx_traveler_audit_actor" ON "TravelerKycAuditLog"("actorId");

-- ============================================
-- TRAVELER KYC PHONE VERIFICATION TABLE
-- OTP tracking for local and foreign phones
-- ============================================
CREATE TABLE "TravelerPhoneOtp" (
  "id" SERIAL PRIMARY KEY,
  "applicationId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  
  -- Phone details
  "phoneNumber" VARCHAR(50) NOT NULL,
  "phoneType" VARCHAR(20) NOT NULL,  -- 'local' or 'foreign'
  "countryCode" VARCHAR(3) NOT NULL,
  
  -- OTP (hashed)
  "otpHash" VARCHAR(255) NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  
  -- Attempts tracking
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "lastAttemptAt" TIMESTAMP,
  
  -- Rate limiting
  "sentCount" INTEGER NOT NULL DEFAULT 0,
  "lastSentAt" TIMESTAMP,
  "blockedUntil" TIMESTAMP,
  
  -- Verification
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt" TIMESTAMP,
  "verifiedIp" VARCHAR(45),
  
  -- Timestamps
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Foreign Keys
  CONSTRAINT "fk_traveler_otp_application" FOREIGN KEY ("applicationId") 
    REFERENCES "TravelerKycApplication"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_traveler_otp_user" FOREIGN KEY ("userId") 
    REFERENCES "User"("id") ON DELETE CASCADE
);

-- Indexes for TravelerPhoneOtp
CREATE INDEX "idx_traveler_otp_application" ON "TravelerPhoneOtp"("applicationId");
CREATE INDEX "idx_traveler_otp_user" ON "TravelerPhoneOtp"("userId");
CREATE INDEX "idx_traveler_otp_phone" ON "TravelerPhoneOtp"("phoneNumber");
CREATE INDEX "idx_traveler_otp_expires" ON "TravelerPhoneOtp"("expiresAt");

-- ============================================
-- ADD TRAVELER KYC STATUS TO USER TABLE
-- Hard-block unverified travelers
-- ============================================
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "travelerKycStatus" "TravelerKycStatus" DEFAULT 'DRAFT';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "travelerKycVerifiedAt" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "travelerKycApplicationId" INTEGER;

CREATE INDEX IF NOT EXISTS "idx_user_traveler_kyc_status" ON "User"("travelerKycStatus");

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE "TravelerKycApplication" IS 'Traveler Full KYC application - Trust, fraud prevention, dispute resolution ONLY. NO payments.';
COMMENT ON TABLE "TravelerKycDocument" IS 'Encrypted document storage for traveler KYC. Files encrypted at rest.';
COMMENT ON TABLE "TravelerKycAuditLog" IS 'Immutable audit trail for all traveler KYC actions. Human review required.';
COMMENT ON TABLE "TravelerPhoneOtp" IS 'OTP verification tracking for local and foreign phone numbers.';

COMMENT ON COLUMN "TravelerKycApplication"."status" IS 'State machine: DRAFT → SUBMITTED → UNDER_REVIEW → VERIFIED/REJECTED';
COMMENT ON COLUMN "TravelerKycDocument"."livenessReady" IS 'Biometric selfie ready for liveness check - NO ML inference performed';
COMMENT ON COLUMN "TravelerKycDocument"."fileUrl" IS 'Encrypted S3/MinIO path - files encrypted at rest';
