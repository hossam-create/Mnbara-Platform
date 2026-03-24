-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('GOOGLE', 'FACEBOOK', 'APPLE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_CREATED', 'USER_UPDATED', 'USER_SUSPENDED', 'USER_BANNED', 'USER_REACTIVATED', 'USER_DELETED', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGED', 'PASSWORD_RESET', 'MFA_ENABLED', 'MFA_DISABLED', 'KYC_SUBMITTED', 'KYC_APPROVED', 'KYC_REJECTED', 'KYC_DOCUMENT_UPLOADED', 'KYC_DOCUMENT_DELETED', 'DISPUTE_CREATED', 'DISPUTE_ASSIGNED', 'DISPUTE_RESOLVED', 'DISPUTE_CLOSED', 'ESCROW_CREATED', 'ESCROW_HELD', 'ESCROW_RELEASED', 'ESCROW_REFUNDED', 'ORDER_CREATED', 'ORDER_CANCELLED', 'ORDER_COMPLETED', 'ORDER_REFUNDED', 'TRANSACTION_CREATED', 'TRANSACTION_COMPLETED', 'TRANSACTION_FAILED', 'WITHDRAWAL_REQUESTED', 'WITHDRAWAL_APPROVED', 'WITHDRAWAL_REJECTED', 'ADMIN_ACCESS_GRANTED', 'ADMIN_ACCESS_REVOKED', 'SETTINGS_CHANGED', 'SUSPICIOUS_ACTIVITY_DETECTED', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'IP_BLOCKED', 'IP_UNBLOCKED', 'DATA_EXPORT_REQUESTED', 'DATA_EXPORT_COMPLETED', 'DATA_DELETION_REQUESTED', 'DATA_DELETION_COMPLETED', 'CONSENT_UPDATED', 'LIVE_STREAM_STARTED', 'LIVE_STREAM_ENDED', 'LIVE_STREAM_CANCELLED', 'LIVE_STREAM_VIEWER_JOINED', 'LIVE_STREAM_VIEWER_LEFT', 'LIVE_STREAM_CHAT_MESSAGE_SENT', 'LIVE_STREAM_CHAT_MESSAGE_DELETED', 'LIVE_STREAM_USER_BANNED', 'LIVE_STREAM_USER_UNBANNED', 'LIVE_STREAM_PRODUCT_PINNED', 'LIVE_STREAM_PRODUCT_UNPINNED', 'LIVE_AUCTION_STARTED', 'LIVE_AUCTION_ENDED', 'LIVE_AUCTION_BID_PLACED', 'LIVE_AUCTION_BID_CANCELLED', 'LIVE_AUCTION_WINNER_DETERMINED', 'LIVE_AUCTION_PAYMENT_CAPTURED', 'LIVE_STREAM_TECHNICAL_ERROR', 'LIVE_STREAM_QUALITY_DEGRADED', 'LIVE_STREAM_RECORDING_STARTED', 'LIVE_STREAM_RECORDING_ENDED', 'LIVE_STREAM_RECORDING_UPLOADED', 'LIVE_STREAM_THUMBNAIL_UPDATED', 'LIVE_STREAM_METADATA_UPDATED', 'LIVE_STREAM_RTMP_CONNECTION_ESTABLISHED', 'LIVE_STREAM_RTMP_CONNECTION_LOST', 'LIVE_STREAM_HLS_SEGMENT_CREATED', 'LIVE_STREAM_WEBRTC_CONNECTION_ESTABLISHED', 'LIVE_STREAM_WEBRTC_CONNECTION_LOST', 'LIVE_STREAM_MODERATION_ACTION_TAKEN', 'LIVE_STREAM_ANALYTICS_DATA_COLLECTED');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT,
    "name" TEXT,
    "avatar" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "OAuthProvider" NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "profile" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
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

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_providerId_key" ON "oauth_accounts"("provider", "providerId");

-- CreateIndex
CREATE INDEX "oauth_accounts_userId_idx" ON "oauth_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_targetId_targetType_idx" ON "audit_logs"("targetId", "targetType");

-- CreateIndex
CREATE INDEX "audit_logs_severity_idx" ON "audit_logs"("severity");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorIp_idx" ON "audit_logs"("actorIp");

-- CreateIndex
CREATE INDEX "audit_logs_success_idx" ON "audit_logs"("success");

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
