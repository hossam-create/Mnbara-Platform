-- ============================================================
-- Phase 6.4: Trust Scoring Finalization (Non-Monetary)
-- READ-ONLY deterministic trust scoring system
-- ============================================================

-- Create TrustScoreLevel enum
CREATE TYPE "TrustScoreLevel" AS ENUM (
  'EXCELLENT',
  'GOOD',
  'WATCH',
  'RESTRICTED'
);

-- Create TrustScore table (APPEND-ONLY snapshots)
CREATE TABLE "TrustScore" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "score" INTEGER NOT NULL,
  "level" "TrustScoreLevel" NOT NULL,
  "breakdown" JSONB NOT NULL,
  "calculatedAt" TIMESTAMP(3) NOT NULL,
  "lastCalculatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrustScore_userId_key" UNIQUE ("userId"),
  CONSTRAINT "TrustScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create TrustScoreAuditLog table (APPEND-ONLY)
CREATE TABLE "TrustScoreAuditLog" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "scoreId" INTEGER NOT NULL,
  "action" TEXT NOT NULL,
  "previousScore" INTEGER,
  "newScore" INTEGER,
  "previousLevel" "TrustScoreLevel",
  "newLevel" "TrustScoreLevel",
  "reason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrustScoreAuditLog_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "TrustScore" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create indexes for TrustScore
CREATE INDEX "TrustScore_userId_idx" ON "TrustScore"("userId");
CREATE INDEX "TrustScore_level_idx" ON "TrustScore"("level");
CREATE INDEX "TrustScore_score_idx" ON "TrustScore"("score");
CREATE INDEX "TrustScore_calculatedAt_idx" ON "TrustScore"("calculatedAt");
CREATE INDEX "TrustScore_createdAt_idx" ON "TrustScore"("createdAt");

-- Create indexes for TrustScoreAuditLog
CREATE INDEX "TrustScoreAuditLog_scoreId_idx" ON "TrustScoreAuditLog"("scoreId");
CREATE INDEX "TrustScoreAuditLog_action_idx" ON "TrustScoreAuditLog"("action");
CREATE INDEX "TrustScoreAuditLog_createdAt_idx" ON "TrustScoreAuditLog"("createdAt");
