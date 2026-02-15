-- ============================================================
-- Phase 6.3: Appeals & Review Workflow (Controlled Reversal)
-- APPEND-ONLY appeal submission and decision logs
-- ============================================================

-- Create TrustAppealReason enum
CREATE TYPE "TrustAppealReason" AS ENUM (
  'INCORRECT_ENFORCEMENT',
  'EVIDENCE_MISUNDERSTOOD',
  'CIRCUMSTANCES_CHANGED',
  'TECHNICAL_ERROR',
  'DISPUTE_RESOLVED',
  'OTHER'
);

-- Create TrustAppealStatus enum
CREATE TYPE "TrustAppealStatus" AS ENUM (
  'PENDING',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED'
);

-- Create TrustAppealSubjectType enum
CREATE TYPE "TrustAppealSubjectType" AS ENUM (
  'USER',
  'WALLET',
  'AUCTION'
);

-- Create Appeal table (APPEND-ONLY)
CREATE TABLE "Appeal" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "trustActionId" INTEGER NOT NULL,
  "subjectType" "TrustAppealSubjectType" NOT NULL,
  "subjectId" INTEGER NOT NULL,
  "appealReason" "TrustAppealReason" NOT NULL,
  "userStatement" TEXT NOT NULL,
  "evidence" JSONB,
  "status" "TrustAppealStatus" NOT NULL DEFAULT 'PENDING',
  "assignedTo" TEXT,
  "assignedAt" TIMESTAMP(3),
  "decidedBy" TEXT,
  "decidedAt" TIMESTAMP(3),
  "decision" TEXT,
  "justification" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Appeal_trustActionId_key" UNIQUE ("trustActionId"),
  CONSTRAINT "Appeal_trustActionId_fkey" FOREIGN KEY ("trustActionId") REFERENCES "TrustAction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create AppealDecisionLog table (APPEND-ONLY)
CREATE TABLE "AppealDecisionLog" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "appealId" INTEGER NOT NULL,
  "action" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppealDecisionLog_appealId_fkey" FOREIGN KEY ("appealId") REFERENCES "Appeal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create indexes for Appeal
CREATE INDEX "Appeal_trustActionId_idx" ON "Appeal"("trustActionId");
CREATE INDEX "Appeal_subjectType_idx" ON "Appeal"("subjectType");
CREATE INDEX "Appeal_subjectId_idx" ON "Appeal"("subjectId");
CREATE INDEX "Appeal_status_idx" ON "Appeal"("status");
CREATE INDEX "Appeal_submittedAt_idx" ON "Appeal"("submittedAt");
CREATE INDEX "Appeal_createdAt_idx" ON "Appeal"("createdAt");

-- Create indexes for AppealDecisionLog
CREATE INDEX "AppealDecisionLog_appealId_idx" ON "AppealDecisionLog"("appealId");
CREATE INDEX "AppealDecisionLog_action_idx" ON "AppealDecisionLog"("action");
CREATE INDEX "AppealDecisionLog_createdAt_idx" ON "AppealDecisionLog"("createdAt");
