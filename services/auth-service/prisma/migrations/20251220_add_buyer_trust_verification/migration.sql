-- Buyer Trust Verification Migration
-- Purpose: Fraud prevention, dispute resolution, buyer accountability
-- NOT financial verification - NO passport, biometrics, or payment info

-- ============================================
-- ENUMS
-- ============================================

-- Buyer verification status (simple 3-state)
CREATE TYPE "BuyerVerificationStatus" AS ENUM (
  'UNVERIFIED',
  'VERIFIED',
  'RESTRICTED'
);

-- Audit actions for buyer trust
CREATE TYPE "BuyerTrustAuditAction" AS ENUM (
  'PROFILE_CREATED',
  'PROFILE_UPDATED',
  'PHONE_OTP_SENT',
  'PHONE_VERIFIED',
  'EMAIL_VERIFIED',
  'ADDRESS_ADDED',
  'ADDRESS_UPDATED',
  'ADDRESS_VALIDATED',
  'EMERGENCY_CONTACT_ADDED',
  'STATUS_CHANGED',
  'RESTRICTION_APPLIED',
  'RESTRICTION_LIFTED',
  'DEVICE_LOGGED',
  'SUSPICIOUS_ACTIVITY_FLAGGED'
);

-- ============================================
-- TABLES
-- ============================================

-- Main buyer trust profile
CREATE TABLE "BuyerTrustProfile" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL UNIQUE,
  "status" "BuyerVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "statusReason" TEXT,
  
  -- Personal info (minimal)
  "fullName" VARCHAR(255),
  "email" VARCHAR(255) NOT NULL,
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "emailVerifiedAt" TIMESTAMP,
  
  -- Phone (OTP verified)
  "phoneNumber" VARCHAR(50),
  "phoneCountryCode" VARCHAR(10),
  "phoneVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "phoneVerifiedAt" TIMESTAMP,
  
  -- Emergency contact
  "emergencyContactName" VARCHAR(255),
  "emergencyContactPhone" VARCHAR(50),
  "emergencyContactRelation" VARCHAR(100),
  
  -- Device/IP tracking (fraud prevention)
  "lastIpAddress" VARCHAR(45),
  "lastDeviceFingerprint" TEXT,
  "lastUserAgent" TEXT,
  "lastGeoLocation" VARCHAR(255),
  "lastActivityAt" TIMESTAMP,
  
  -- Restriction info
  "restrictedAt" TIMESTAMP,
  "restrictedBy" INTEGER,
  "restrictionReason" TEXT,
  "restrictionExpiresAt" TIMESTAMP,
  
  -- Timestamps
  "verifiedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "fk_buyer_trust_user" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Buyer delivery addresses
CREATE TABLE "BuyerDeliveryAddress" (
  "id" SERIAL PRIMARY KEY,
  "profileId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  
  -- Address fields
  "label" VARCHAR(100),
  "fullName" VARCHAR(255) NOT NULL,
  "phoneNumber" VARCHAR(50),
  "addressLine1" VARCHAR(255) NOT NULL,
  "addressLine2" VARCHAR(255),
  "city" VARCHAR(100) NOT NULL,
  "stateProvince" VARCHAR(100),
  "postalCode" VARCHAR(20),
  "country" VARCHAR(2) NOT NULL,
  
  -- Validation
  "isValidated" BOOLEAN NOT NULL DEFAULT FALSE,
  "validatedAt" TIMESTAMP,
  "validationMethod" VARCHAR(50),
  "validationNotes" TEXT,
  
  -- Flags
  "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Timestamps
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "fk_buyer_address_profile" FOREIGN KEY ("profileId") REFERENCES "BuyerTrustProfile"("id") ON DELETE CASCADE
);

-- Phone OTP for buyer verification
CREATE TABLE "BuyerPhoneOtp" (
  "id" SERIAL PRIMARY KEY,
  "profileId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "phoneNumber" VARCHAR(50) NOT NULL,
  "countryCode" VARCHAR(10) NOT NULL,
  
  -- OTP data
  "otpHash" VARCHAR(64) NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "sentCount" INTEGER NOT NULL DEFAULT 1,
  "lastSentAt" TIMESTAMP,
  "lastAttemptAt" TIMESTAMP,
  
  -- Verification
  "verified" BOOLEAN NOT NULL DEFAULT FALSE,
  "verifiedAt" TIMESTAMP,
  "verifiedIp" VARCHAR(45),
  
  -- Rate limiting
  "blockedUntil" TIMESTAMP,
  
  -- Timestamps
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "fk_buyer_otp_profile" FOREIGN KEY ("profileId") REFERENCES "BuyerTrustProfile"("id") ON DELETE CASCADE,
  CONSTRAINT "uq_buyer_otp_phone" UNIQUE ("profileId", "phoneNumber")
);

-- Device/IP log for fraud detection
CREATE TABLE "BuyerDeviceLog" (
  "id" SERIAL PRIMARY KEY,
  "profileId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  
  -- Device info
  "ipAddress" VARCHAR(45) NOT NULL,
  "deviceFingerprint" TEXT,
  "userAgent" TEXT,
  "geoLocation" VARCHAR(255),
  "geoCountry" VARCHAR(2),
  "geoCity" VARCHAR(100),
  
  -- Activity
  "activityType" VARCHAR(50) NOT NULL,
  "activityDetails" JSONB,
  
  -- Risk flags (read-only indicators)
  "isNewDevice" BOOLEAN NOT NULL DEFAULT FALSE,
  "isNewLocation" BOOLEAN NOT NULL DEFAULT FALSE,
  "isSuspicious" BOOLEAN NOT NULL DEFAULT FALSE,
  "suspiciousReason" TEXT,
  
  -- Timestamp (immutable)
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "fk_buyer_device_profile" FOREIGN KEY ("profileId") REFERENCES "BuyerTrustProfile"("id") ON DELETE CASCADE
);

-- Immutable audit log
CREATE TABLE "BuyerTrustAuditLog" (
  "id" SERIAL PRIMARY KEY,
  "profileId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "action" "BuyerTrustAuditAction" NOT NULL,
  "description" TEXT NOT NULL,
  
  -- Actor info
  "actorId" INTEGER,
  "actorRole" VARCHAR(50),
  "actorIp" VARCHAR(45),
  "actorUserAgent" TEXT,
  
  -- State tracking
  "previousState" JSONB,
  "newState" JSONB,
  "metadata" JSONB,
  
  -- Immutable timestamp
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "fk_buyer_audit_profile" FOREIGN KEY ("profileId") REFERENCES "BuyerTrustProfile"("id") ON DELETE CASCADE
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX "idx_buyer_trust_user" ON "BuyerTrustProfile"("userId");
CREATE INDEX "idx_buyer_trust_status" ON "BuyerTrustProfile"("status");
CREATE INDEX "idx_buyer_trust_email" ON "BuyerTrustProfile"("email");
CREATE INDEX "idx_buyer_trust_phone" ON "BuyerTrustProfile"("phoneNumber");

CREATE INDEX "idx_buyer_address_profile" ON "BuyerDeliveryAddress"("profileId");
CREATE INDEX "idx_buyer_address_user" ON "BuyerDeliveryAddress"("userId");
CREATE INDEX "idx_buyer_address_country" ON "BuyerDeliveryAddress"("country");

CREATE INDEX "idx_buyer_otp_profile" ON "BuyerPhoneOtp"("profileId");
CREATE INDEX "idx_buyer_otp_phone" ON "BuyerPhoneOtp"("phoneNumber");

CREATE INDEX "idx_buyer_device_profile" ON "BuyerDeviceLog"("profileId");
CREATE INDEX "idx_buyer_device_ip" ON "BuyerDeviceLog"("ipAddress");
CREATE INDEX "idx_buyer_device_fingerprint" ON "BuyerDeviceLog"("deviceFingerprint");
CREATE INDEX "idx_buyer_device_created" ON "BuyerDeviceLog"("createdAt");

CREATE INDEX "idx_buyer_audit_profile" ON "BuyerTrustAuditLog"("profileId");
CREATE INDEX "idx_buyer_audit_action" ON "BuyerTrustAuditLog"("action");
CREATE INDEX "idx_buyer_audit_created" ON "BuyerTrustAuditLog"("createdAt");

-- ============================================
-- USER TABLE UPDATE
-- ============================================

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "buyerVerificationStatus" "BuyerVerificationStatus" DEFAULT 'UNVERIFIED';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "buyerVerifiedAt" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "buyerTrustProfileId" INTEGER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE "BuyerTrustProfile" IS 'Lightweight buyer verification for fraud prevention - NO financial data';
COMMENT ON TABLE "BuyerDeliveryAddress" IS 'Buyer delivery addresses with basic validation';
COMMENT ON TABLE "BuyerDeviceLog" IS 'Device/IP logging for fraud detection - read-only indicators';
COMMENT ON TABLE "BuyerTrustAuditLog" IS 'Immutable audit trail for buyer trust actions';

COMMENT ON COLUMN "BuyerTrustProfile"."status" IS 'UNVERIFIED → VERIFIED → RESTRICTED';
COMMENT ON COLUMN "BuyerDeviceLog"."isSuspicious" IS 'Read-only flag - no automation decisions';
