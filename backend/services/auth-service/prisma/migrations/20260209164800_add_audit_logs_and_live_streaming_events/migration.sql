-- CreateEnum for Audit Actions
CREATE TYPE "AuditAction" AS ENUM (
  'USER_CREATED',
  'USER_UPDATED',
  'USER_SUSPENDED',
  'USER_BANNED',
  'USER_REACTIVATED',
  'USER_DELETED',
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'PASSWORD_CHANGED',
  'PASSWORD_RESET',
  'MFA_ENABLED',
  'MFA_DISABLED',
  'KYC_SUBMITTED',
  'KYC_APPROVED',
  'KYC_REJECTED',
  'KYC_DOCUMENT_UPLOADED',
  'KYC_DOCUMENT_DELETED',
  'DISPUTE_CREATED',
  'DISPUTE_ASSIGNED',
  'DISPUTE_RESOLVED',
  'DISPUTE_CLOSED',
  'ESCROW_CREATED',
  'ESCROW_HELD',
  'ESCROW_RELEASED',
  'ESCROW_REFUNDED',
  'ORDER_CREATED',
  'ORDER_CANCELLED',
  'ORDER_COMPLETED',
  'ORDER_REFUNDED',
  'TRANSACTION_CREATED',
  'TRANSACTION_COMPLETED',
  'TRANSACTION_FAILED',
  'WITHDRAWAL_REQUESTED',
  'WITHDRAWAL_APPROVED',
  'WITHDRAWAL_REJECTED',
  'ADMIN_ACCESS_GRANTED',
  'ADMIN_ACCESS_REVOKED',
  'SETTINGS_CHANGED',
  'SUSPICIOUS_ACTIVITY_DETECTED',
  'ACCOUNT_LOCKED',
  'ACCOUNT_UNLOCKED',
  'IP_BLOCKED',
  'IP_UNBLOCKED',
  'DATA_EXPORT_REQUESTED',
  'DATA_EXPORT_COMPLETED',
  'DATA_DELETION_REQUESTED',
  'DATA_DELETION_COMPLETED',
  'CONSENT_UPDATED',
  -- Live Streaming Events
  'LIVE_STREAM_STARTED',
  'LIVE_STREAM_ENDED',
  'LIVE_STREAM_CANCELLED',
  'LIVE_STREAM_VIEWER_JOINED',
  'LIVE_STREAM_VIEWER_LEFT',
  'LIVE_STREAM_CHAT_MESSAGE_SENT',
  'LIVE_STREAM_CHAT_MESSAGE_DELETED',
  'LIVE_STREAM_USER_BANNED',
  'LIVE_STREAM_USER_UNBANNED',
  'LIVE_STREAM_PRODUCT_PINNED',
  'LIVE_STREAM_PRODUCT_UNPINNED',
  'LIVE_AUCTION_STARTED',
  'LIVE_AUCTION_ENDED',
  'LIVE_AUCTION_BID_PLACED',
  'LIVE_AUCTION_BID_CANCELLED',
  'LIVE_AUCTION_WINNER_DETERMINED',
  'LIVE_AUCTION_PAYMENT_CAPTURED',
  'LIVE_STREAM_TECHNICAL_ERROR',
  'LIVE_STREAM_QUALITY_DEGRADED',
  'LIVE_STREAM_RECORDING_STARTED',
  'LIVE_STREAM_RECORDING_ENDED',
  'LIVE_STREAM_RECORDING_UPLOADED',
  'LIVE_STREAM_THUMBNAIL_UPDATED',
  'LIVE_STREAM_METADATA_UPDATED',
  'LIVE_STREAM_RTMP_CONNECTION_ESTABLISHED',
  'LIVE_STREAM_RTMP_CONNECTION_LOST',
  'LIVE_STREAM_HLS_SEGMENT_CREATED',
  'LIVE_STREAM_WEBRTC_CONNECTION_ESTABLISHED',
  'LIVE_STREAM_WEBRTC_CONNECTION_LOST',
  'LIVE_STREAM_MODERATION_ACTION_TAKEN',
  'LIVE_STREAM_ANALYTICS_DATA_COLLECTED'
);

-- CreateEnum for Audit Severity
CREATE TYPE "AuditSeverity" AS ENUM (
  'INFO',
  'WARNING',
  'ERROR',
  'CRITICAL'
);

-- CreateTable AuditLog
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "action" "AuditAction" NOT NULL,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO',
    "actorId" TEXT,
    "actorEmail" TEXT,
    "actorRole" "UserRole",
    "actorIp" TEXT,
    "targetId" TEXT,
    "targetType" TEXT,
    "targetEmail" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "userAgent" TEXT,
    "requestId" TEXT,
    "sessionId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_targetId_targetType_idx" ON "AuditLog"("targetId", "targetType");

-- CreateIndex
CREATE INDEX "AuditLog_severity_idx" ON "AuditLog"("severity");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorIp_idx" ON "AuditLog"("actorIp");

-- CreateIndex
CREATE INDEX "AuditLog_success_idx" ON "AuditLog"("success");

-- Add comment to table
COMMENT ON TABLE "AuditLog" IS 'Comprehensive audit trail for all important system actions. Retention: INFO (90d), WARNING (180d), ERROR/CRITICAL (365d), Compliance (7y)';

-- Add comments to key columns
COMMENT ON COLUMN "AuditLog"."action" IS 'Type of action performed';
COMMENT ON COLUMN "AuditLog"."severity" IS 'Severity level of the audit event';
COMMENT ON COLUMN "AuditLog"."actorId" IS 'User ID who performed the action (null for system actions)';
COMMENT ON COLUMN "AuditLog"."targetId" IS 'ID of the affected entity';
COMMENT ON COLUMN "AuditLog"."targetType" IS 'Type of entity affected (User, Order, Dispute, etc.)';
COMMENT ON COLUMN "AuditLog"."metadata" IS 'Additional structured data in JSON format';
COMMENT ON COLUMN "AuditLog"."oldValues" IS 'Previous state before the action (for updates)';
COMMENT ON COLUMN "AuditLog"."newValues" IS 'New state after the action (for updates)';
COMMENT ON COLUMN "AuditLog"."requestId" IS 'Correlation ID for request tracing across services';