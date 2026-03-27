-- Migration: Add Consents and KYC Tables
-- Description: Initial database migrations for consents and kyc_uploads tables
-- GDPR compliant consent tracking and KYC document management

-- CreateEnum: ConsentSource
CREATE TYPE "ConsentSource" AS ENUM ('WEB', 'MOBILE_IOS', 'MOBILE_ANDROID', 'API');

-- CreateEnum: KycDocumentType
CREATE TYPE "KycDocumentType" AS ENUM ('PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE', 'RESIDENCE_PERMIT', 'SELFIE', 'PROOF_OF_ADDRESS', 'OTHER');

-- CreateEnum: KycVerificationStatus
CREATE TYPE "KycVerificationStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'RESUBMISSION_REQUIRED');

-- CreateEnum: KycLevel
CREATE TYPE "KycLevel" AS ENUM ('NONE', 'BASIC', 'STANDARD', 'ENHANCED');

-- CreateTable: Consent
CREATE TABLE "Consent" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "essentialData" BOOLEAN NOT NULL DEFAULT true,
    "analyticsConsent" BOOLEAN NOT NULL DEFAULT false,
    "personalizationConsent" BOOLEAN NOT NULL DEFAULT false,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "termsVersion" TEXT,
    "termsAcceptedAt" TIMESTAMP(3),
    "privacyPolicyAccepted" BOOLEAN NOT NULL DEFAULT false,
    "privacyPolicyVersion" TEXT,
    "privacyPolicyAcceptedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "consentSource" "ConsentSource" NOT NULL DEFAULT 'WEB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ConsentHistory
CREATE TABLE "ConsentHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "consentType" TEXT NOT NULL,
    "previousValue" BOOLEAN NOT NULL,
    "newValue" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "source" "ConsentSource" NOT NULL DEFAULT 'WEB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable: KycUpload
CREATE TABLE "KycUpload" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "documentType" "KycDocumentType" NOT NULL,
    "documentNumber" TEXT,
    "documentCountry" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileHash" TEXT,
    "issuedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "status" "KycVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" INTEGER,
    "rejectionReason" TEXT,
    "rejectionNotes" TEXT,
    "uploadIpAddress" TEXT,
    "uploadUserAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable: KycVerification
CREATE TABLE "KycVerification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "level" "KycLevel" NOT NULL DEFAULT 'BASIC',
    "status" "KycVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "fullLegalName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT,
    "address" TEXT,
    "reviewedBy" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Consent
CREATE UNIQUE INDEX "Consent_userId_key" ON "Consent"("userId");
CREATE INDEX "Consent_userId_idx" ON "Consent"("userId");
CREATE INDEX "Consent_marketingConsent_idx" ON "Consent"("marketingConsent");

-- CreateIndex: ConsentHistory
CREATE INDEX "ConsentHistory_userId_idx" ON "ConsentHistory"("userId");
CREATE INDEX "ConsentHistory_consentType_idx" ON "ConsentHistory"("consentType");
CREATE INDEX "ConsentHistory_createdAt_idx" ON "ConsentHistory"("createdAt");

-- CreateIndex: KycUpload
CREATE INDEX "KycUpload_userId_idx" ON "KycUpload"("userId");
CREATE INDEX "KycUpload_documentType_idx" ON "KycUpload"("documentType");
CREATE INDEX "KycUpload_status_idx" ON "KycUpload"("status");
CREATE INDEX "KycUpload_expiryDate_idx" ON "KycUpload"("expiryDate");

-- CreateIndex: KycVerification
CREATE UNIQUE INDEX "KycVerification_userId_key" ON "KycVerification"("userId");
CREATE INDEX "KycVerification_userId_idx" ON "KycVerification"("userId");
CREATE INDEX "KycVerification_status_idx" ON "KycVerification"("status");
CREATE INDEX "KycVerification_level_idx" ON "KycVerification"("level");

-- AddForeignKey: Consent
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: KycUpload
ALTER TABLE "KycUpload" ADD CONSTRAINT "KycUpload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: KycVerification
ALTER TABLE "KycVerification" ADD CONSTRAINT "KycVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
