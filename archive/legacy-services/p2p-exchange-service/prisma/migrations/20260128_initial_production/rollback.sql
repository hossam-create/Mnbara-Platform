-- P2P Exchange Service - Rollback Migration
-- Date: 2026-01-28
-- Description: Rollback script for initial production migration

-- Drop foreign keys
ALTER TABLE "ExternalEscrow" DROP CONSTRAINT IF EXISTS "ExternalEscrow_providerId_fkey";
ALTER TABLE "CommunicationLog" DROP CONSTRAINT IF EXISTS "CommunicationLog_matchId_fkey";
ALTER TABLE "ProofOfPayment" DROP CONSTRAINT IF EXISTS "ProofOfPayment_requestId_fkey";
ALTER TABLE "Settlement" DROP CONSTRAINT IF EXISTS "Settlement_matchId_fkey";
ALTER TABLE "ExchangeMatch" DROP CONSTRAINT IF EXISTS "ExchangeMatch_counterRequestId_fkey";
ALTER TABLE "ExchangeMatch" DROP CONSTRAINT IF EXISTS "ExchangeMatch_requestId_fkey";

-- Drop tables
DROP TABLE IF EXISTS "ExternalEscrow";
DROP TABLE IF EXISTS "ExternalEscrowProvider";
DROP TABLE IF EXISTS "CommunicationLog";
DROP TABLE IF EXISTS "TrustLevel";
DROP TABLE IF EXISTS "SecurityDeposit";
DROP TABLE IF EXISTS "ProofOfPayment";
DROP TABLE IF EXISTS "Settlement";
DROP TABLE IF EXISTS "ExchangeMatch";
DROP TABLE IF EXISTS "ExchangeRequest";

-- Drop enums
DROP TYPE IF EXISTS "ProviderType";
DROP TYPE IF EXISTS "DepositStatus";
DROP TYPE IF EXISTS "DepositSource";
DROP TYPE IF EXISTS "VerificationStatus";
DROP TYPE IF EXISTS "SettlementStatus";
DROP TYPE IF EXISTS "SettlementMethod";
DROP TYPE IF EXISTS "MatchStatus";
DROP TYPE IF EXISTS "MatchType";
DROP TYPE IF EXISTS "ExchangeStatus";
