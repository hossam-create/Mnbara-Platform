-- ============================================================
-- PHASE 6.1 — Automated Safeguards Migration
-- ============================================================

-- Create SafeguardType enum
CREATE TYPE "SafeguardType" AS ENUM (
  'BID_RATE_LIMIT',
  'BID_COOLDOWN',
  'MAX_BID_AMOUNT_CAP',
  'DAILY_BID_COUNT_CAP',
  'AUCTION_JOIN_LIMIT',
  'TEMP_BID_DELAY',
  'MAX_CONCURRENT_BIDDERS_SOFT_CAP',
  'EXTENSION_THROTTLE',
  'LISTING_CREATION_RATE_LIMIT',
  'MAX_ACTIVE_AUCTIONS_SOFT_CAP'
);

-- Create SafeguardScope enum
CREATE TYPE "SafeguardScope" AS ENUM (
  'USER',
  'AUCTION',
  'SELLER'
);

-- Create SafeguardStatus enum
CREATE TYPE "SafeguardStatus" AS ENUM (
  'ACTIVE',
  'LIFTED',
  'ESCALATED'
);

-- Create SafeguardActivation table (APPEND-ONLY)
CREATE TABLE "SafeguardActivation" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "targetUserId" INTEGER,
  "targetAuctionId" INTEGER,
  "targetSellerId" INTEGER,
  "safeguardType" "SafeguardType" NOT NULL,
  "scope" "SafeguardScope" NOT NULL,
  "status" "SafeguardStatus" NOT NULL DEFAULT 'ACTIVE',
  "durationMinutes" INTEGER NOT NULL,
  "parameters" JSONB NOT NULL,
  "reason" TEXT NOT NULL,
  "confidence" DECIMAL(10, 2) NOT NULL,
  "activatedAt" TIMESTAMP(3) NOT NULL,
  "liftAt" TIMESTAMP(3) NOT NULL,
  "liftedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create SafeguardAuditLog table (APPEND-ONLY)
CREATE TABLE "SafeguardAuditLog" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "activationId" INTEGER NOT NULL REFERENCES "SafeguardActivation"("id"),
  "action" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create SafeguardLiftEvent table (APPEND-ONLY)
CREATE TABLE "SafeguardLiftEvent" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "activationId" INTEGER NOT NULL UNIQUE REFERENCES "SafeguardActivation"("id"),
  "reason" TEXT NOT NULL,
  "liftedAt" TIMESTAMP(3) NOT NULL
);

-- Create SafeguardPolicyVersion table (IMMUTABLE)
CREATE TABLE "SafeguardPolicyVersion" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "version" TEXT NOT NULL UNIQUE,
  "rules" JSONB NOT NULL,
  "description" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create SafeguardPolicyEvaluationLog table (APPEND-ONLY)
CREATE TABLE "SafeguardPolicyEvaluationLog" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "targetUserId" INTEGER,
  "targetAuctionId" INTEGER,
  "targetSellerId" INTEGER,
  "policyVersion" TEXT NOT NULL,
  "signals" JSONB NOT NULL,
  "recommendation" JSONB NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX "SafeguardActivation_targetUserId_idx" ON "SafeguardActivation"("targetUserId");
CREATE INDEX "SafeguardActivation_targetAuctionId_idx" ON "SafeguardActivation"("targetAuctionId");
CREATE INDEX "SafeguardActivation_targetSellerId_idx" ON "SafeguardActivation"("targetSellerId");
CREATE INDEX "SafeguardActivation_safeguardType_idx" ON "SafeguardActivation"("safeguardType");
CREATE INDEX "SafeguardActivation_status_idx" ON "SafeguardActivation"("status");
CREATE INDEX "SafeguardActivation_liftAt_idx" ON "SafeguardActivation"("liftAt");
CREATE INDEX "SafeguardActivation_createdAt_idx" ON "SafeguardActivation"("createdAt");

CREATE INDEX "SafeguardAuditLog_activationId_idx" ON "SafeguardAuditLog"("activationId");
CREATE INDEX "SafeguardAuditLog_action_idx" ON "SafeguardAuditLog"("action");
CREATE INDEX "SafeguardAuditLog_createdAt_idx" ON "SafeguardAuditLog"("createdAt");

CREATE INDEX "SafeguardLiftEvent_activationId_idx" ON "SafeguardLiftEvent"("activationId");
CREATE INDEX "SafeguardLiftEvent_liftedAt_idx" ON "SafeguardLiftEvent"("liftedAt");

CREATE INDEX "SafeguardPolicyVersion_version_idx" ON "SafeguardPolicyVersion"("version");
CREATE INDEX "SafeguardPolicyVersion_isActive_idx" ON "SafeguardPolicyVersion"("isActive");
CREATE INDEX "SafeguardPolicyVersion_createdAt_idx" ON "SafeguardPolicyVersion"("createdAt");

CREATE INDEX "SafeguardPolicyEvaluationLog_targetUserId_idx" ON "SafeguardPolicyEvaluationLog"("targetUserId");
CREATE INDEX "SafeguardPolicyEvaluationLog_targetAuctionId_idx" ON "SafeguardPolicyEvaluationLog"("targetAuctionId");
CREATE INDEX "SafeguardPolicyEvaluationLog_targetSellerId_idx" ON "SafeguardPolicyEvaluationLog"("targetSellerId");
CREATE INDEX "SafeguardPolicyEvaluationLog_policyVersion_idx" ON "SafeguardPolicyEvaluationLog"("policyVersion");
CREATE INDEX "SafeguardPolicyEvaluationLog_createdAt_idx" ON "SafeguardPolicyEvaluationLog"("createdAt");
