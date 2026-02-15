-- P2P Exchange Service - Initial Production Migration
-- Date: 2026-01-28
-- Description: Complete database schema for P2P Exchange Marketplace

-- Create enums
CREATE TYPE "ExchangeStatus" AS ENUM (
  'OPEN',
  'MATCHED',
  'PAYMENT_INITIATED',
  'PROOF_UPLOADED',
  'CONFIRMING',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
  'DISPUTED',
  'REFUNDED'
);

CREATE TYPE "MatchType" AS ENUM (
  'AUTOMATIC',
  'MANUAL'
);

CREATE TYPE "MatchStatus" AS ENUM (
  'PENDING',
  'ESCROWED',
  'SETTLING',
  'COMPLETED',
  'FAILED',
  'DISPUTED'
);

CREATE TYPE "SettlementMethod" AS ENUM (
  'INTERNAL',
  'EXTERNAL_OPTIONAL',
  'EXTERNAL_MANDATORY'
);

CREATE TYPE "SettlementStatus" AS ENUM (
  'PENDING',
  'PSP_PROCESSING',
  'ESCROW_RELEASING',
  'COMPLETED',
  'FAILED',
  'TIMEOUT'
);

CREATE TYPE "VerificationStatus" AS ENUM (
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'FLAGGED'
);

CREATE TYPE "DepositSource" AS ENUM (
  'TRANSACTION_HISTORY',
  'PLATFORM_FEES',
  'CASH_DEPOSIT',
  'INITIAL_DEPOSIT'
);

CREATE TYPE "DepositStatus" AS ENUM (
  'ACTIVE',
  'FROZEN',
  'DEDUCTED',
  'REFUNDED'
);

CREATE TYPE "ProviderType" AS ENUM (
  'BLOCKCHAIN',
  'MOBILE_WALLET',
  'BANK',
  'PAYMENT_PROCESSOR'
);

-- Create tables
CREATE TABLE "ExchangeRequest" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "fromCurrency" TEXT NOT NULL,
  "toCurrency" TEXT NOT NULL,
  "fromAmount" DECIMAL(18,2) NOT NULL,
  "toAmount" DECIMAL(18,2) NOT NULL,
  "desiredRate" DECIMAL(18,6) NOT NULL,
  "actualRate" DECIMAL(18,6),
  "platformFee" DECIMAL(18,2) NOT NULL,
  "protectionFee" DECIMAL(18,2),
  "status" "ExchangeStatus" NOT NULL DEFAULT 'OPEN',
  "trustLevel" INTEGER NOT NULL DEFAULT 1,
  "securityDeposit" DECIMAL(18,2) NOT NULL,
  "useExternalEscrow" BOOLEAN NOT NULL DEFAULT false,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "matchedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "ExchangeMatch" (
  "id" SERIAL PRIMARY KEY,
  "requestId" INTEGER NOT NULL UNIQUE,
  "counterRequestId" INTEGER NOT NULL UNIQUE,
  "matchType" "MatchType" NOT NULL DEFAULT 'AUTOMATIC',
  "matchScore" DECIMAL(5,2) NOT NULL,
  "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
  "escrowHoldId" INTEGER UNIQUE,
  "externalEscrowId" TEXT,
  "settlementMethod" "SettlementMethod" NOT NULL DEFAULT 'INTERNAL',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Settlement" (
  "id" SERIAL PRIMARY KEY,
  "matchId" INTEGER NOT NULL UNIQUE,
  "method" "SettlementMethod" NOT NULL,
  "pspProvider" TEXT,
  "pspTransactionId" TEXT,
  "pspStatus" TEXT,
  "externalEscrowProvider" TEXT,
  "externalEscrowId" TEXT,
  "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
  "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "failureReason" TEXT,
  "retryCount" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE "ProofOfPayment" (
  "id" SERIAL PRIMARY KEY,
  "requestId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "photoUrl" TEXT NOT NULL,
  "videoUrl" TEXT,
  "timestamp" TIMESTAMP(3) NOT NULL,
  "referenceId" TEXT NOT NULL,
  "recipientName" TEXT NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  "metadata" JSONB,
  "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
  "verifiedBy" INTEGER,
  "verifiedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "SecurityDeposit" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "source" "DepositSource" NOT NULL,
  "status" "DepositStatus" NOT NULL DEFAULT 'ACTIVE',
  "frozenAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "frozenReason" TEXT,
  "frozenAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE("userId", "currency")
);

CREATE TABLE "TrustLevel" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL UNIQUE,
  "level" INTEGER NOT NULL DEFAULT 1,
  "maxTransactionAmount" DECIMAL(18,2) NOT NULL,
  "successfulExchanges" INTEGER NOT NULL DEFAULT 0,
  "totalVolume" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "disputeCount" INTEGER NOT NULL DEFAULT 0,
  "timeoutCount" INTEGER NOT NULL DEFAULT 0,
  "lastLevelUpAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "CommunicationLog" (
  "id" SERIAL PRIMARY KEY,
  "matchId" INTEGER NOT NULL,
  "senderId" INTEGER NOT NULL,
  "recipientId" INTEGER NOT NULL,
  "message" TEXT NOT NULL,
  "flagged" BOOLEAN NOT NULL DEFAULT false,
  "flagReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ExternalEscrowProvider" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "type" "ProviderType" NOT NULL,
  "country" TEXT,
  "supportedCurrencies" TEXT[],
  "minAmount" DECIMAL(18,2),
  "maxAmount" DECIMAL(18,2),
  "feePercentage" DECIMAL(5,2) NOT NULL,
  "feeFixed" DECIMAL(18,2),
  "settlementTime" INTEGER NOT NULL,
  "apiEndpoint" TEXT NOT NULL,
  "apiKey" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "ExternalEscrow" (
  "id" SERIAL PRIMARY KEY,
  "matchId" INTEGER NOT NULL,
  "providerId" INTEGER NOT NULL,
  "externalEscrowId" TEXT NOT NULL UNIQUE,
  "amount" DECIMAL(18,2) NOT NULL,
  "currency" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "releasedAt" TIMESTAMP(3),
  "refundedAt" TIMESTAMP(3)
);

-- Create indexes
CREATE INDEX "ExchangeRequest_userId_idx" ON "ExchangeRequest"("userId");
CREATE INDEX "ExchangeRequest_status_idx" ON "ExchangeRequest"("status");
CREATE INDEX "ExchangeRequest_fromCurrency_toCurrency_idx" ON "ExchangeRequest"("fromCurrency", "toCurrency");
CREATE INDEX "ExchangeRequest_expiresAt_idx" ON "ExchangeRequest"("expiresAt");
CREATE INDEX "ExchangeRequest_status_fromCurrency_toCurrency_idx" ON "ExchangeRequest"("status", "fromCurrency", "toCurrency");

CREATE INDEX "ExchangeMatch_status_idx" ON "ExchangeMatch"("status");
CREATE INDEX "ExchangeMatch_createdAt_idx" ON "ExchangeMatch"("createdAt");
CREATE INDEX "ExchangeMatch_settlementMethod_idx" ON "ExchangeMatch"("settlementMethod");

CREATE INDEX "Settlement_status_idx" ON "Settlement"("status");
CREATE INDEX "Settlement_pspProvider_idx" ON "Settlement"("pspProvider");
CREATE INDEX "Settlement_externalEscrowProvider_idx" ON "Settlement"("externalEscrowProvider");

CREATE INDEX "ProofOfPayment_requestId_idx" ON "ProofOfPayment"("requestId");
CREATE INDEX "ProofOfPayment_verificationStatus_idx" ON "ProofOfPayment"("verificationStatus");
CREATE INDEX "ProofOfPayment_userId_idx" ON "ProofOfPayment"("userId");

CREATE INDEX "SecurityDeposit_userId_idx" ON "SecurityDeposit"("userId");
CREATE INDEX "SecurityDeposit_status_idx" ON "SecurityDeposit"("status");

CREATE INDEX "TrustLevel_userId_idx" ON "TrustLevel"("userId");
CREATE INDEX "TrustLevel_level_idx" ON "TrustLevel"("level");

CREATE INDEX "CommunicationLog_matchId_idx" ON "CommunicationLog"("matchId");
CREATE INDEX "CommunicationLog_flagged_idx" ON "CommunicationLog"("flagged");
CREATE INDEX "CommunicationLog_senderId_idx" ON "CommunicationLog"("senderId");
CREATE INDEX "CommunicationLog_recipientId_idx" ON "CommunicationLog"("recipientId");

CREATE INDEX "ExternalEscrowProvider_country_idx" ON "ExternalEscrowProvider"("country");
CREATE INDEX "ExternalEscrowProvider_isActive_idx" ON "ExternalEscrowProvider"("isActive");
CREATE INDEX "ExternalEscrowProvider_enabled_idx" ON "ExternalEscrowProvider"("enabled");
CREATE INDEX "ExternalEscrowProvider_type_idx" ON "ExternalEscrowProvider"("type");

CREATE INDEX "ExternalEscrow_matchId_idx" ON "ExternalEscrow"("matchId");
CREATE INDEX "ExternalEscrow_providerId_idx" ON "ExternalEscrow"("providerId");
CREATE INDEX "ExternalEscrow_status_idx" ON "ExternalEscrow"("status");
CREATE INDEX "ExternalEscrow_externalEscrowId_idx" ON "ExternalEscrow"("externalEscrowId");

-- Add foreign keys
ALTER TABLE "ExchangeMatch" ADD CONSTRAINT "ExchangeMatch_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ExchangeRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExchangeMatch" ADD CONSTRAINT "ExchangeMatch_counterRequestId_fkey" FOREIGN KEY ("counterRequestId") REFERENCES "ExchangeRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "ExchangeMatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProofOfPayment" ADD CONSTRAINT "ProofOfPayment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ExchangeRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CommunicationLog" ADD CONSTRAINT "CommunicationLog_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "ExchangeMatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExternalEscrow" ADD CONSTRAINT "ExternalEscrow_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ExternalEscrowProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
