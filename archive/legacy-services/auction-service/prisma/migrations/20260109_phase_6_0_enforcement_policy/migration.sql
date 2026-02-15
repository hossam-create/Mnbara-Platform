-- ============================================================
-- PHASE 6.0 — Enforcement Policy Models Migration
-- ============================================================

-- Create EnforcementPolicyVersion table (IMMUTABLE)
CREATE TABLE "EnforcementPolicyVersion" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "version" TEXT NOT NULL UNIQUE,
  "rules" JSONB NOT NULL,
  "description" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create EnforcementPolicyEvaluationLog table (APPEND-ONLY)
CREATE TABLE "EnforcementPolicyEvaluationLog" (
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
CREATE INDEX "EnforcementPolicyVersion_version_idx" ON "EnforcementPolicyVersion"("version");
CREATE INDEX "EnforcementPolicyVersion_isActive_idx" ON "EnforcementPolicyVersion"("isActive");
CREATE INDEX "EnforcementPolicyVersion_createdAt_idx" ON "EnforcementPolicyVersion"("createdAt");

CREATE INDEX "EnforcementPolicyEvaluationLog_targetUserId_idx" ON "EnforcementPolicyEvaluationLog"("targetUserId");
CREATE INDEX "EnforcementPolicyEvaluationLog_targetAuctionId_idx" ON "EnforcementPolicyEvaluationLog"("targetAuctionId");
CREATE INDEX "EnforcementPolicyEvaluationLog_targetSellerId_idx" ON "EnforcementPolicyEvaluationLog"("targetSellerId");
CREATE INDEX "EnforcementPolicyEvaluationLog_policyVersion_idx" ON "EnforcementPolicyEvaluationLog"("policyVersion");
CREATE INDEX "EnforcementPolicyEvaluationLog_createdAt_idx" ON "EnforcementPolicyEvaluationLog"("createdAt");
