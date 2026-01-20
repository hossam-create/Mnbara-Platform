-- Phase 6.0: Trust & Safety Enforcement
-- APPEND-ONLY enforcement and appeal logs

-- Enforcement Action Type Enum
CREATE TYPE "EnforcementActionType" AS ENUM (
  'BID_THROTTLE',
  'TEMP_SUSPENSION',
  'AUCTION_PARTICIPATION_BLOCK',
  'PAYOUT_DELAY',
  'TRUST_BADGE_REMOVAL',
  'AUCTION_FREEZE',
  'BID_INVALIDATION',
  'AUCTION_CANCEL',
  'AUTO_RELIST_DISABLE',
  'LISTING_CREATION_LIMIT',
  'SELLER_REVIEW_FLAG'
);

-- Enforcement Status Enum
CREATE TYPE "EnforcementStatus" AS ENUM (
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'EXECUTED',
  'REVERTED',
  'APPEALED'
);

-- Enforcement Tier Enum
CREATE TYPE "EnforcementTier" AS ENUM (
  'TIER_1_SOFT',
  'TIER_2_TEMPORARY',
  'TIER_3_SEVERE'
);

-- Appeal Status Enum
CREATE TYPE "AppealStatus" AS ENUM (
  'OPEN',
  'APPROVED',
  'REJECTED',
  'CLOSED'
);

-- Enforcement Action (APPEND-ONLY)
CREATE TABLE "EnforcementAction" (
  "id" SERIAL PRIMARY KEY,
  "targetUserId" INTEGER,
  "targetAuctionId" INTEGER,
  "targetSellerId" INTEGER,
  "actionType" "EnforcementActionType" NOT NULL,
  "tier" "EnforcementTier" NOT NULL,
  "status" "EnforcementStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "durationMinutes" INTEGER,
  "justification" TEXT NOT NULL,
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "rejectedBy" TEXT,
  "rejectedAt" TIMESTAMP(3),
  "executedBy" TEXT,
  "executedAt" TIMESTAMP(3),
  "revertedBy" TEXT,
  "revertedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "EnforcementAction_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "EnforcementAction_targetAuctionId_fkey" FOREIGN KEY ("targetAuctionId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Enforcement Evidence (APPEND-ONLY)
CREATE TABLE "EnforcementEvidence" (
  "id" SERIAL PRIMARY KEY,
  "actionId" INTEGER NOT NULL,
  "evidenceType" TEXT NOT NULL,
  "evidence" JSONB NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "EnforcementEvidence_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "EnforcementAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Enforcement Audit Log (APPEND-ONLY)
CREATE TABLE "EnforcementAuditLog" (
  "id" SERIAL PRIMARY KEY,
  "actionId" INTEGER NOT NULL,
  "action" TEXT NOT NULL,
  "executedBy" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "EnforcementAuditLog_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "EnforcementAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Enforcement Appeal (APPEND-ONLY)
CREATE TABLE "EnforcementAppeal" (
  "id" SERIAL PRIMARY KEY,
  "actionId" INTEGER NOT NULL UNIQUE,
  "userId" INTEGER NOT NULL,
  "status" "AppealStatus" NOT NULL DEFAULT 'OPEN',
  "appealWindowEndsAt" TIMESTAMP(3) NOT NULL,
  "submittedAt" TIMESTAMP(3),
  "decidedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "EnforcementAppeal_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "EnforcementAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EnforcementAppeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Enforcement Appeal Submission (APPEND-ONLY)
CREATE TABLE "EnforcementAppealSubmission" (
  "id" SERIAL PRIMARY KEY,
  "appealId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "evidence" JSONB,
  "submittedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "EnforcementAppealSubmission_appealId_fkey" FOREIGN KEY ("appealId") REFERENCES "EnforcementAppeal"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EnforcementAppealSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Enforcement Appeal Decision (APPEND-ONLY)
CREATE TABLE "EnforcementAppealDecision" (
  "id" SERIAL PRIMARY KEY,
  "appealId" INTEGER NOT NULL,
  "decision" TEXT NOT NULL,
  "decidedBy" TEXT NOT NULL,
  "justification" TEXT NOT NULL,
  "metadata" JSONB,
  "decidedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "EnforcementAppealDecision_appealId_fkey" FOREIGN KEY ("appealId") REFERENCES "EnforcementAppeal"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Indexes for performance
CREATE INDEX "EnforcementAction_targetUserId_idx" ON "EnforcementAction"("targetUserId");
CREATE INDEX "EnforcementAction_targetAuctionId_idx" ON "EnforcementAction"("targetAuctionId");
CREATE INDEX "EnforcementAction_targetSellerId_idx" ON "EnforcementAction"("targetSellerId");
CREATE INDEX "EnforcementAction_status_idx" ON "EnforcementAction"("status");
CREATE INDEX "EnforcementAction_tier_idx" ON "EnforcementAction"("tier");
CREATE INDEX "EnforcementAction_createdAt_idx" ON "EnforcementAction"("createdAt");

CREATE INDEX "EnforcementEvidence_actionId_idx" ON "EnforcementEvidence"("actionId");
CREATE INDEX "EnforcementEvidence_createdAt_idx" ON "EnforcementEvidence"("createdAt");

CREATE INDEX "EnforcementAuditLog_actionId_idx" ON "EnforcementAuditLog"("actionId");
CREATE INDEX "EnforcementAuditLog_createdAt_idx" ON "EnforcementAuditLog"("createdAt");

CREATE INDEX "EnforcementAppeal_actionId_idx" ON "EnforcementAppeal"("actionId");
CREATE INDEX "EnforcementAppeal_userId_idx" ON "EnforcementAppeal"("userId");
CREATE INDEX "EnforcementAppeal_status_idx" ON "EnforcementAppeal"("status");
CREATE INDEX "EnforcementAppeal_appealWindowEndsAt_idx" ON "EnforcementAppeal"("appealWindowEndsAt");

CREATE INDEX "EnforcementAppealSubmission_appealId_idx" ON "EnforcementAppealSubmission"("appealId");
CREATE INDEX "EnforcementAppealSubmission_userId_idx" ON "EnforcementAppealSubmission"("userId");

CREATE INDEX "EnforcementAppealDecision_appealId_idx" ON "EnforcementAppealDecision"("appealId");
