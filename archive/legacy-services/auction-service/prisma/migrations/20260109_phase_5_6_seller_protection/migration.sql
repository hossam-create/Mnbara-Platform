-- Phase 5.6: Seller Protections & Auto-Relist
-- APPEND-ONLY seller protection and relist logs

-- Seller Protection Decision Enum
CREATE TYPE "SellerProtectionDecision" AS ENUM (
  'ELIGIBLE_FOR_RELIST',
  'ELIGIBLE_FOR_MANUAL_REVIEW',
  'FINAL_NO_ACTION'
);

-- Seller Protection Trigger Enum
CREATE TYPE "SellerProtectionTrigger" AS ENUM (
  'NO_SALE',
  'RESERVE_NOT_MET',
  'ZERO_BIDS',
  'WINNER_INVALIDATED',
  'PAYMENT_TIMEOUT',
  'APPEAL_RESOLVED_AGAINST_BUYER'
);

-- Relist Status Enum
CREATE TYPE "RelistStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'EXECUTED',
  'REJECTED',
  'CANCELLED'
);

-- Seller Preference Type Enum
CREATE TYPE "SellerPreferenceType" AS ENUM (
  'AUTO_RELIST_ENABLED',
  'MAX_RELIST_ATTEMPTS',
  'RELIST_COOLDOWN_MS',
  'RELIST_MODE'
);

-- Seller Protection Log (APPEND-ONLY)
CREATE TABLE "SellerProtectionLog" (
  "id" SERIAL PRIMARY KEY,
  "auctionId" INTEGER NOT NULL,
  "sellerId" INTEGER NOT NULL,
  "decision" "SellerProtectionDecision" NOT NULL,
  "triggerReasons" "SellerProtectionTrigger"[] NOT NULL DEFAULT '{}',
  "reason" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "SellerProtectionLog_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Relist Audit Log (APPEND-ONLY)
CREATE TABLE "RelistAuditLog" (
  "id" SERIAL PRIMARY KEY,
  "originalAuctionId" INTEGER NOT NULL,
  "relistedAuctionId" INTEGER NOT NULL,
  "sellerId" INTEGER NOT NULL,
  "status" "RelistStatus" NOT NULL DEFAULT 'PENDING',
  "approvedBy" TEXT,
  "relistAttemptNumber" INTEGER NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "RelistAuditLog_originalAuctionId_fkey" FOREIGN KEY ("originalAuctionId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "RelistAuditLog_relistedAuctionId_fkey" FOREIGN KEY ("relistedAuctionId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Seller Preference (mutable, for seller configuration)
CREATE TABLE "SellerPreference" (
  "id" SERIAL PRIMARY KEY,
  "sellerId" INTEGER NOT NULL,
  "preferenceType" "SellerPreferenceType" NOT NULL,
  "value" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "SellerPreference_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE("sellerId", "preferenceType")
);

-- Indexes for performance
CREATE INDEX "SellerProtectionLog_auctionId_idx" ON "SellerProtectionLog"("auctionId");
CREATE INDEX "SellerProtectionLog_sellerId_idx" ON "SellerProtectionLog"("sellerId");
CREATE INDEX "SellerProtectionLog_decision_idx" ON "SellerProtectionLog"("decision");
CREATE INDEX "SellerProtectionLog_createdAt_idx" ON "SellerProtectionLog"("createdAt");

CREATE INDEX "RelistAuditLog_originalAuctionId_idx" ON "RelistAuditLog"("originalAuctionId");
CREATE INDEX "RelistAuditLog_relistedAuctionId_idx" ON "RelistAuditLog"("relistedAuctionId");
CREATE INDEX "RelistAuditLog_sellerId_idx" ON "RelistAuditLog"("sellerId");
CREATE INDEX "RelistAuditLog_status_idx" ON "RelistAuditLog"("status");
CREATE INDEX "RelistAuditLog_createdAt_idx" ON "RelistAuditLog"("createdAt");

CREATE INDEX "SellerPreference_sellerId_idx" ON "SellerPreference"("sellerId");
