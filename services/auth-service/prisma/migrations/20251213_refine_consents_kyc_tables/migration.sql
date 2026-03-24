-- Migration: Refine Consents and KYC Tables
-- Description: Update consent schema for GDPR compliance and enhance KYC document storage
-- Requirements: 16.1, 16.2 - KYC approval workflow and document management

-- ========================================
-- GDPR CONSENT ENHANCEMENTS
-- ========================================

-- Add new consent types for GDPR compliance
ALTER TABLE "Consent" ADD COLUMN IF NOT EXISTS "dataProcessingConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Consent" ADD COLUMN IF NOT EXISTS "thirdPartyShareConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Consent" ADD COLUMN IF NOT EXISTS "cookieConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Consent" ADD COLUMN IF NOT EXISTS "locationTrackingConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Consent" ADD COLUMN IF NOT EXISTS "biometricConsent" BOOLEAN NOT NULL DEFAULT false;

-- Add consent withdrawal tracking
ALTER TABLE "Consent" ADD COLUMN IF NOT EXISTS "withdrawnAt" TIMESTAMP(3);
ALTER TABLE "Consent" ADD COLUMN IF NOT EXISTS "withdrawalReason" TEXT;

-- Add data retention preferences
ALTER TABLE "Consent" ADD COLUMN IF NOT EXISTS "dataRetentionPeriod" INTEGER DEFAULT 365;
ALTER TABLE "Consent" ADD COLUMN IF NOT EXISTS "deleteDataOnWithdrawal" BOOLEAN DEFAULT false;

-- Add age verification for GDPR (must be 16+ in EU)
ALTER TABLE "Consent" ADD COLUMN IF NOT EXISTS "ageVerified" BOOLEAN DEFAULT false;
ALTER TABLE "Consent" ADD COLUMN IF NOT EXISTS "ageVerifiedAt" TIMESTAMP(3);
ALTER TABLE "Consent" ADD COLUMN IF NOT EXISTS "dateOfBirth" DATE;

-- Add consent version tracking
ALTER TABLE "Consent" ADD COLUMN IF NOT EXISTS "consentVersion" VARCHAR(20) DEFAULT '1.0';
ALTER TABLE "Consent" ADD COLUMN IF NOT EXISTS "lastConsentReviewAt" TIMESTAMP(3);

-- Add legal basis for processing (GDPR Article 6)
CREATE TYPE "LegalBasis" AS ENUM (
    'CONSENT',
    'CONTRACT',
    'LEGAL_OBLIGATION',
    'VITAL_INTERESTS',
    'PUBLIC_TASK',
    'LEGITIMATE_INTERESTS'
);

ALTER TABLE "Consent" ADD COLUMN IF NOT EXISTS "legalBasis" "LegalBasis" DEFAULT 'CONSENT';

-- Add indexes for new consent fields
CREATE INDEX IF NOT EXISTS "Consent_dataProcessingConsent_idx" ON "Consent"("dataProcessingConsent");
CREATE INDEX IF NOT EXISTS "Consent_withdrawnAt_idx" ON "Consent"("withdrawnAt") WHERE "withdrawnAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Consent_ageVerified_idx" ON "Consent"("ageVerified");

-- ========================================
-- CONSENT HISTORY ENHANCEMENTS
-- ========================================

-- Add more context to consent history
ALTER TABLE "ConsentHistory" ADD COLUMN IF NOT EXISTS "legalBasis" "LegalBasis";
ALTER TABLE "ConsentHistory" ADD COLUMN IF NOT EXISTS "consentVersion" VARCHAR(20);
ALTER TABLE "ConsentHistory" ADD COLUMN IF NOT EXISTS "requestId" VARCHAR(100);
ALTER TABLE "ConsentHistory" ADD COLUMN IF NOT EXISTS "geoLocation" VARCHAR(100);

-- ========================================
-- KYC DOCUMENT ENHANCEMENTS
-- ========================================

-- Add document quality and verification metadata
ALTER TABLE "KycUpload" ADD COLUMN IF NOT EXISTS "qualityScore" DECIMAL(5, 2);
ALTER TABLE "KycUpload" ADD COLUMN IF NOT EXISTS "isReadable" BOOLEAN DEFAULT true;
ALTER TABLE "KycUpload" ADD COLUMN IF NOT EXISTS "isTampered" BOOLEAN DEFAULT false;
ALTER TABLE "KycUpload" ADD COLUMN IF NOT EXISTS "tamperDetails" TEXT;

-- Add OCR extracted data
ALTER TABLE "KycUpload" ADD COLUMN IF NOT EXISTS "extractedData" JSONB;
ALTER TABLE "KycUpload" ADD COLUMN IF NOT EXISTS "ocrConfidence" DECIMAL(5, 2);
ALTER TABLE "KycUpload" ADD COLUMN IF NOT EXISTS "ocrProcessedAt" TIMESTAMP(3);

-- Add face matching for selfie verification
ALTER TABLE "KycUpload" ADD COLUMN IF NOT EXISTS "faceMatchScore" DECIMAL(5, 2);
ALTER TABLE "KycUpload" ADD COLUMN IF NOT EXISTS "faceMatchedWith" INTEGER;
ALTER TABLE "KycUpload" ADD COLUMN IF NOT EXISTS "livenessScore" DECIMAL(5, 2);

-- Add document encryption info
ALTER TABLE "KycUpload" ADD COLUMN IF NOT EXISTS "encryptionKeyId" VARCHAR(100);
ALTER TABLE "KycUpload" ADD COLUMN IF NOT EXISTS "encryptedAt" TIMESTAMP(3);

-- Add retention and deletion tracking
ALTER TABLE "KycUpload" ADD COLUMN IF NOT EXISTS "retentionExpiresAt" TIMESTAMP(3);
ALTER TABLE "KycUpload" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "KycUpload" ADD COLUMN IF NOT EXISTS "deletionReason" TEXT;

-- Add third-party verification service info
ALTER TABLE "KycUpload" ADD COLUMN IF NOT EXISTS "verificationProvider" VARCHAR(100);
ALTER TABLE "KycUpload" ADD COLUMN IF NOT EXISTS "providerReferenceId" VARCHAR(255);
ALTER TABLE "KycUpload" ADD COLUMN IF NOT EXISTS "providerResponse" JSONB;

-- Add indexes for new KYC fields
CREATE INDEX IF NOT EXISTS "KycUpload_qualityScore_idx" ON "KycUpload"("qualityScore");
CREATE INDEX IF NOT EXISTS "KycUpload_retentionExpiresAt_idx" ON "KycUpload"("retentionExpiresAt") WHERE "retentionExpiresAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "KycUpload_verificationProvider_idx" ON "KycUpload"("verificationProvider");

-- ========================================
-- KYC VERIFICATION ENHANCEMENTS
-- ========================================

-- Add risk assessment
ALTER TABLE "KycVerification" ADD COLUMN IF NOT EXISTS "riskScore" DECIMAL(5, 2);
ALTER TABLE "KycVerification" ADD COLUMN IF NOT EXISTS "riskLevel" VARCHAR(20) DEFAULT 'LOW';
ALTER TABLE "KycVerification" ADD COLUMN IF NOT EXISTS "riskFactors" JSONB;

-- Add AML/PEP screening
ALTER TABLE "KycVerification" ADD COLUMN IF NOT EXISTS "amlScreened" BOOLEAN DEFAULT false;
ALTER TABLE "KycVerification" ADD COLUMN IF NOT EXISTS "amlScreenedAt" TIMESTAMP(3);
ALTER TABLE "KycVerification" ADD COLUMN IF NOT EXISTS "amlResult" VARCHAR(50);
ALTER TABLE "KycVerification" ADD COLUMN IF NOT EXISTS "pepMatch" BOOLEAN DEFAULT false;
ALTER TABLE "KycVerification" ADD COLUMN IF NOT EXISTS "sanctionsMatch" BOOLEAN DEFAULT false;

-- Add watchlist screening
ALTER TABLE "KycVerification" ADD COLUMN IF NOT EXISTS "watchlistScreened" BOOLEAN DEFAULT false;
ALTER TABLE "KycVerification" ADD COLUMN IF NOT EXISTS "watchlistMatches" JSONB;

-- Add verification expiry
ALTER TABLE "KycVerification" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "KycVerification" ADD COLUMN IF NOT EXISTS "renewalReminderSentAt" TIMESTAMP(3);

-- Add verification source tracking
ALTER TABLE "KycVerification" ADD COLUMN IF NOT EXISTS "verificationSource" VARCHAR(50) DEFAULT 'MANUAL';
ALTER TABLE "KycVerification" ADD COLUMN IF NOT EXISTS "automatedScore" DECIMAL(5, 2);

-- Add indexes for new verification fields
CREATE INDEX IF NOT EXISTS "KycVerification_riskLevel_idx" ON "KycVerification"("riskLevel");
CREATE INDEX IF NOT EXISTS "KycVerification_amlResult_idx" ON "KycVerification"("amlResult");
CREATE INDEX IF NOT EXISTS "KycVerification_expiresAt_idx" ON "KycVerification"("expiresAt") WHERE "expiresAt" IS NOT NULL;

-- ========================================
-- KYC REVIEW HISTORY TABLE
-- ========================================

-- Create table for KYC review audit trail
CREATE TABLE IF NOT EXISTS "KycReviewHistory" (
    "id" SERIAL PRIMARY KEY,
    "kycVerificationId" INTEGER NOT NULL,
    "uploadId" INTEGER,
    
    -- Review details
    "previousStatus" "KycVerificationStatus",
    "newStatus" "KycVerificationStatus" NOT NULL,
    "previousLevel" "KycLevel",
    "newLevel" "KycLevel",
    
    -- Reviewer info
    "reviewedBy" INTEGER NOT NULL,
    "reviewerRole" VARCHAR(50),
    
    -- Review context
    "action" VARCHAR(50) NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    
    -- Metadata
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "metadata" JSONB,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "KycReviewHistory_kycVerificationId_fkey" FOREIGN KEY ("kycVerificationId") 
        REFERENCES "KycVerification"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KycReviewHistory_uploadId_fkey" FOREIGN KEY ("uploadId") 
        REFERENCES "KycUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes for KYC review history
CREATE INDEX "KycReviewHistory_kycVerificationId_idx" ON "KycReviewHistory"("kycVerificationId");
CREATE INDEX "KycReviewHistory_uploadId_idx" ON "KycReviewHistory"("uploadId");
CREATE INDEX "KycReviewHistory_reviewedBy_idx" ON "KycReviewHistory"("reviewedBy");
CREATE INDEX "KycReviewHistory_action_idx" ON "KycReviewHistory"("action");
CREATE INDEX "KycReviewHistory_createdAt_idx" ON "KycReviewHistory"("createdAt" DESC);

-- ========================================
-- DATA SUBJECT REQUEST TABLE (GDPR)
-- ========================================

-- Create table for GDPR data subject requests
CREATE TYPE "DataSubjectRequestType" AS ENUM (
    'ACCESS',           -- Right to access
    'RECTIFICATION',    -- Right to rectification
    'ERASURE',          -- Right to erasure (right to be forgotten)
    'RESTRICTION',      -- Right to restriction of processing
    'PORTABILITY',      -- Right to data portability
    'OBJECTION'         -- Right to object
);

CREATE TYPE "DataSubjectRequestStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'REJECTED',
    'CANCELLED'
);

CREATE TABLE IF NOT EXISTS "DataSubjectRequest" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "requestNumber" VARCHAR(50) NOT NULL UNIQUE,
    
    -- Request details
    "requestType" "DataSubjectRequestType" NOT NULL,
    "status" "DataSubjectRequestStatus" NOT NULL DEFAULT 'PENDING',
    
    -- Request context
    "description" TEXT,
    "specificData" TEXT,
    
    -- Processing
    "assignedTo" INTEGER,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    
    -- Response
    "responseNotes" TEXT,
    "dataExportUrl" TEXT,
    "dataExportExpiresAt" TIMESTAMP(3),
    
    -- Rejection
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    
    -- Verification
    "identityVerified" BOOLEAN DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" INTEGER,
    
    -- Metadata
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "metadata" JSONB,
    
    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    
    CONSTRAINT "DataSubjectRequest_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for data subject requests
CREATE INDEX "DataSubjectRequest_userId_idx" ON "DataSubjectRequest"("userId");
CREATE INDEX "DataSubjectRequest_requestNumber_idx" ON "DataSubjectRequest"("requestNumber");
CREATE INDEX "DataSubjectRequest_requestType_idx" ON "DataSubjectRequest"("requestType");
CREATE INDEX "DataSubjectRequest_status_idx" ON "DataSubjectRequest"("status");
CREATE INDEX "DataSubjectRequest_dueDate_idx" ON "DataSubjectRequest"("dueDate") WHERE "status" = 'PENDING';
CREATE INDEX "DataSubjectRequest_createdAt_idx" ON "DataSubjectRequest"("createdAt" DESC);

-- ========================================
-- TRIGGER: Auto-log KYC status changes
-- ========================================

CREATE OR REPLACE FUNCTION log_kyc_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD."status" IS DISTINCT FROM NEW."status" OR OLD."level" IS DISTINCT FROM NEW."level" THEN
        INSERT INTO "KycReviewHistory" (
            "kycVerificationId", "previousStatus", "newStatus", 
            "previousLevel", "newLevel", "reviewedBy", "action", "reason"
        ) VALUES (
            NEW."id", OLD."status", NEW."status",
            OLD."level", NEW."level", COALESCE(NEW."reviewedBy", 0),
            'STATUS_CHANGE',
            'Status changed from ' || COALESCE(OLD."status"::TEXT, 'NULL') || ' to ' || NEW."status"::TEXT
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kyc_verification_status_change_trigger
    AFTER UPDATE ON "KycVerification"
    FOR EACH ROW
    EXECUTE FUNCTION log_kyc_status_change();

-- ========================================
-- TRIGGER: Update timestamps
-- ========================================

CREATE TRIGGER data_subject_request_updated_at_trigger
    BEFORE UPDATE ON "DataSubjectRequest"
    FOR EACH ROW
    EXECUTE FUNCTION update_rewards_updated_at();

-- ========================================
-- FUNCTION: Generate request number
-- ========================================

CREATE OR REPLACE FUNCTION generate_dsr_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    v_date_part VARCHAR(8);
    v_seq_part VARCHAR(6);
    v_count INTEGER;
BEGIN
    v_date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    SELECT COUNT(*) + 1 INTO v_count
    FROM "DataSubjectRequest"
    WHERE "createdAt"::DATE = CURRENT_DATE;
    
    v_seq_part := LPAD(v_count::TEXT, 6, '0');
    
    RETURN 'DSR-' || v_date_part || '-' || v_seq_part;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE "KycReviewHistory" IS 'Audit trail for all KYC verification status changes and reviews';
COMMENT ON TABLE "DataSubjectRequest" IS 'GDPR data subject requests (access, erasure, portability, etc.)';
COMMENT ON COLUMN "Consent"."legalBasis" IS 'GDPR Article 6 legal basis for data processing';
COMMENT ON COLUMN "KycUpload"."extractedData" IS 'OCR extracted data from document (encrypted)';
COMMENT ON COLUMN "KycVerification"."riskScore" IS 'Automated risk assessment score (0-100)';
COMMENT ON COLUMN "KycVerification"."amlResult" IS 'Anti-Money Laundering screening result';
