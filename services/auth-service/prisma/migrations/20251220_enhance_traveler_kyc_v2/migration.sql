-- Enhanced Traveler Full KYC & Trust Verification Migration (V2)
-- Based on exact spec: Identity & Trust Verification Form
-- Mandatory, no access without completion
-- Contractual: false data = suspension + legal accountability

-- ============================================
-- NEW ENUMS
-- ============================================

-- Gender enum
DO $$ BEGIN
  CREATE TYPE "TravelerGender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Legal acknowledgment type
DO $$ BEGIN
  CREATE TYPE "LegalAcknowledgmentType" AS ENUM (
    'TERMS_OF_SERVICE',
    'PRIVACY_POLICY',
    'DATA_ACCURACY',
    'LEGAL_ACCOUNTABILITY',
    'SUSPENSION_POLICY',
    'IDENTITY_VERIFICATION_CONSENT'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add BOARDING_PASS to document types
ALTER TYPE "TravelerDocumentType" ADD VALUE IF NOT EXISTS 'BOARDING_PASS';

-- Add new audit actions
ALTER TYPE "TravelerKycAuditAction" ADD VALUE IF NOT EXISTS 'LEGAL_ACKNOWLEDGMENT_SIGNED';
ALTER TYPE "TravelerKycAuditAction" ADD VALUE IF NOT EXISTS 'DIGITAL_SIGNATURE_CAPTURED';
ALTER TYPE "TravelerKycAuditAction" ADD VALUE IF NOT EXISTS 'BOARDING_PASS_UPLOADED';
ALTER TYPE "TravelerKycAuditAction" ADD VALUE IF NOT EXISTS 'SECURITY_LOG_CAPTURED';

-- ============================================
-- ALTER EXISTING TABLE: TravelerKycApplication
-- ============================================

-- Section 1: Personal Identity (Enhanced)
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "gender" "TravelerGender";
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "passportNumber" VARCHAR(50);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "passportCountry" VARCHAR(2);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "passportExpiryDate" TIMESTAMP;

-- Section 2: Travel Information (Enhanced)
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "departureCountry" VARCHAR(2);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "departureCity" VARCHAR(100);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "arrivalCountry" VARCHAR(2);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "arrivalCity" VARCHAR(100);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "boardingPassUploaded" BOOLEAN DEFAULT FALSE;
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "boardingPassUploadedAt" TIMESTAMP;

-- Section 3: Address (Enhanced - Egypt specific)
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "permanentAddressLine1" VARCHAR(255);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "permanentAddressLine2" VARCHAR(255);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "permanentCity" VARCHAR(100);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "permanentGovernorate" VARCHAR(100);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "permanentPostalCode" VARCHAR(20);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "permanentCountry" VARCHAR(2) DEFAULT 'EG';

ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "currentAddressLine1" VARCHAR(255);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "currentAddressLine2" VARCHAR(255);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "currentCity" VARCHAR(100);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "currentStateProvince" VARCHAR(100);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "currentPostalCode" VARCHAR(20);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "currentCountry" VARCHAR(2);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "currentAddressSameAsPermanent" BOOLEAN DEFAULT FALSE;

-- Section 3: Emergency Contact (Enhanced)
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "emergencyContactCountry" VARCHAR(2);

-- Section 4: Security Logs (Auto-captured)
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "browserName" VARCHAR(100);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "browserVersion" VARCHAR(50);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "osName" VARCHAR(100);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "osVersion" VARCHAR(50);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "geoCountry" VARCHAR(2);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "submissionTimestamp" TIMESTAMP;

-- Section 5: Legal Acknowledgment
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "legalAcknowledgmentCompleted" BOOLEAN DEFAULT FALSE;
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "legalAcknowledgmentCompletedAt" TIMESTAMP;
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "digitalSignatureName" VARCHAR(255);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "digitalSignatureDate" TIMESTAMP;
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "digitalSignatureIp" VARCHAR(45);
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "digitalSignatureHash" VARCHAR(64);

-- Contractual flags
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "acknowledgedDataAccuracy" BOOLEAN DEFAULT FALSE;
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "acknowledgedLegalAccountability" BOOLEAN DEFAULT FALSE;
ALTER TABLE "TravelerKycApplication" ADD COLUMN IF NOT EXISTS "acknowledgedSuspensionPolicy" BOOLEAN DEFAULT FALSE;

-- ============================================
-- NEW TABLE: Legal Acknowledgments
-- ============================================

CREATE TABLE IF NOT EXISTS "TravelerLegalAcknowledgment" (
  "id" SERIAL PRIMARY KEY,
  "applicationId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "acknowledgmentType" "LegalAcknowledgmentType" NOT NULL,
  
  -- Acknowledgment details
  "acknowledged" BOOLEAN NOT NULL DEFAULT FALSE,
  "acknowledgedAt" TIMESTAMP,
  "acknowledgedIp" VARCHAR(45),
  "acknowledgedUserAgent" TEXT,
  
  -- Document version (for legal tracking)
  "documentVersion" VARCHAR(20) NOT NULL DEFAULT '1.0',
  "documentHash" VARCHAR(64),
  
  -- Timestamps
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "fk_legal_ack_application" FOREIGN KEY ("applicationId") 
    REFERENCES "TravelerKycApplication"("id") ON DELETE CASCADE,
  CONSTRAINT "uq_legal_ack_type" UNIQUE ("applicationId", "acknowledgmentType")
);

-- ============================================
-- NEW TABLE: Security Logs (Immutable)
-- ============================================

CREATE TABLE IF NOT EXISTS "TravelerSecurityLog" (
  "id" SERIAL PRIMARY KEY,
  "applicationId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  
  -- Device/Browser info
  "ipAddress" VARCHAR(45) NOT NULL,
  "deviceFingerprint" TEXT,
  "userAgent" TEXT,
  "browserName" VARCHAR(100),
  "browserVersion" VARCHAR(50),
  "osName" VARCHAR(100),
  "osVersion" VARCHAR(50),
  
  -- Geo (country only for privacy)
  "geoCountry" VARCHAR(2),
  
  -- Activity
  "activityType" VARCHAR(50) NOT NULL,
  "activityDetails" JSONB,
  
  -- Immutable timestamp
  "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "fk_security_log_application" FOREIGN KEY ("applicationId") 
    REFERENCES "TravelerKycApplication"("id") ON DELETE CASCADE
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS "idx_legal_ack_application" ON "TravelerLegalAcknowledgment"("applicationId");
CREATE INDEX IF NOT EXISTS "idx_legal_ack_type" ON "TravelerLegalAcknowledgment"("acknowledgmentType");

CREATE INDEX IF NOT EXISTS "idx_security_log_application" ON "TravelerSecurityLog"("applicationId");
CREATE INDEX IF NOT EXISTS "idx_security_log_ip" ON "TravelerSecurityLog"("ipAddress");
CREATE INDEX IF NOT EXISTS "idx_security_log_timestamp" ON "TravelerSecurityLog"("timestamp");

CREATE INDEX IF NOT EXISTS "idx_traveler_kyc_departure" ON "TravelerKycApplication"("departureCountry", "departureCity");
CREATE INDEX IF NOT EXISTS "idx_traveler_kyc_arrival" ON "TravelerKycApplication"("arrivalCountry", "arrivalCity");

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE "TravelerLegalAcknowledgment" IS 'Legal acknowledgments with version tracking - contractual';
COMMENT ON TABLE "TravelerSecurityLog" IS 'Immutable security logs for fraud detection';

COMMENT ON COLUMN "TravelerKycApplication"."acknowledgedDataAccuracy" IS 'User confirmed data is accurate - false data = suspension';
COMMENT ON COLUMN "TravelerKycApplication"."acknowledgedLegalAccountability" IS 'User acknowledged legal accountability for false info';
COMMENT ON COLUMN "TravelerKycApplication"."acknowledgedSuspensionPolicy" IS 'User acknowledged suspension policy';
COMMENT ON COLUMN "TravelerKycApplication"."digitalSignatureHash" IS 'SHA-256 hash of name + date + IP for verification';
