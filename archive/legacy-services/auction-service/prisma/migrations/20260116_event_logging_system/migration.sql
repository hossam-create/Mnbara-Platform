-- ============================================================
-- SECURITY-CRITICAL: Event Logging System Migration
-- APPEND-ONLY event log for audit and compliance
-- 
-- ABSOLUTE RULES:
-- - Events are APPEND-ONLY (no update, no delete)
-- - Events have NO business logic impact
-- - Events NEVER trigger financial actions
-- - Events are backend-authoritative only
-- ============================================================

-- Create Event Type Enum
CREATE TYPE "EventType" AS ENUM (
  -- User Events
  'USER_LOGIN',
  'USER_LOGOUT',
  'USER_REGISTERED',
  'USER_PROFILE_UPDATED',
  'USER_PASSWORD_CHANGED',
  'USER_EMAIL_VERIFIED',
  
  -- Auction Events
  'AUCTION_CREATED',
  'AUCTION_UPDATED',
  'AUCTION_STARTED',
  'AUCTION_ENDED',
  'AUCTION_CANCELLED',
  'AUCTION_EXTENDED',
  'AUCTION_SETTLED',
  'AUCTION_FINALIZED',
  
  -- Bid Events
  'BID_PLACED',
  'BID_OUTBID',
  'BID_WON',
  'BID_CANCELLED',
  'BID_INVALIDATED',
  'BID_THROTTLED',
  
  -- Proxy Bid Events
  'PROXY_BID_CREATED',
  'PROXY_BID_ACTIVATED',
  'PROXY_BID_DEACTIVATED',
  
  -- Dispute Events
  'DISPUTE_CREATED',
  'DISPUTE_RESOLVED',
  'DISPUTE_ESCALATED',
  
  -- Appeal Events
  'APPEAL_SUBMITTED',
  'APPEAL_APPROVED',
  'APPEAL_REJECTED',
  
  -- Wallet Events
  'WALLET_CREATED',
  'WALLET_BALANCE_VIEWED',
  'WALLET_TRANSACTION_VIEWED',
  
  -- Escrow Events
  'ESCROW_CREATED',
  'ESCROW_RELEASED',
  'ESCROW_REFUNDED',
  'ESCROW_VIEWED',
  
  -- Order Events
  'ORDER_CREATED',
  'ORDER_UPDATED',
  'ORDER_COMPLETED',
  'ORDER_CANCELLED',
  'ORDER_VIEWED',
  
  -- Payment Events
  'PAYMENT_INITIATED',
  'PAYMENT_COMPLETED',
  'PAYMENT_FAILED',
  'PAYMENT_REFUNDED',
  
  -- Trust & Safety Events
  'TRUST_ACTION_CREATED',
  'TRUST_ACTION_LIFTED',
  'TRUST_ACTION_EXPIRED',
  'TRUST_SCORE_CALCULATED',
  'TRUST_SCORE_UPDATED',
  
  -- Enforcement Events
  'ENFORCEMENT_ACTION_CREATED',
  'ENFORCEMENT_ACTION_APPROVED',
  'ENFORCEMENT_ACTION_REJECTED',
  'ENFORCEMENT_ACTION_EXECUTED',
  'ENFORCEMENT_ACTION_REVERTED',
  
  -- Safeguard Events
  'SAFEGUARD_ACTIVATED',
  'SAFEGUARD_LIFTED',
  'SAFEGUARD_ESCALATED',
  
  -- Settlement Events
  'SETTLEMENT_OUTCOME_LOGGED',
  'SETTLEMENT_OVERRIDE_LOGGED',
  'SETTLEMENT_FINALIZED',
  
  -- Seller Protection Events
  'SELLER_PROTECTION_TRIGGERED',
  'SELLER_RELIST_REQUESTED',
  'SELLER_RELIST_APPROVED',
  'SELLER_RELIST_EXECUTED',
  
  -- Analytics Events
  'ANALYTICS_SNAPSHOT_CREATED',
  
  -- Admin Events
  'ADMIN_LOGIN',
  'ADMIN_ACTION_PERFORMED',
  'ADMIN_REPORT_GENERATED',
  'ADMIN_CONFIG_CHANGED',
  
  -- System Events
  'SYSTEM_ERROR',
  'SYSTEM_WARNING',
  'SYSTEM_MAINTENANCE_START',
  'SYSTEM_MAINTENANCE_END',
  
  -- Security Events
  'SECURITY_SUSPICIOUS_ACTIVITY',
  'SECURITY_ACCESS_DENIED',
  'SECURITY_RATE_LIMIT_EXCEEDED',
  'SECURITY_INVALID_TOKEN',
  'SECURITY_UNAUTHORIZED_ACCESS'
);

-- Create Event Category Enum
CREATE TYPE "EventCategory" AS ENUM (
  'USER',
  'AUCTION',
  'BID',
  'DISPUTE',
  'APPEAL',
  'WALLET',
  'ESCROW',
  'ORDER',
  'PAYMENT',
  'TRUST_SAFETY',
  'ENFORCEMENT',
  'SAFEGUARD',
  'SETTLEMENT',
  'SELLER_PROTECTION',
  'ANALYTICS',
  'ADMIN',
  'SYSTEM',
  'SECURITY'
);

-- Create Actor Type Enum
CREATE TYPE "ActorType" AS ENUM (
  'USER',
  'ADMIN',
  'SYSTEM'
);

-- Create Target Type Enum
CREATE TYPE "TargetType" AS ENUM (
  'USER',
  'AUCTION',
  'BID',
  'ORDER',
  'WALLET',
  'ESCROW',
  'PAYMENT',
  'DISPUTE',
  'APPEAL',
  'TRUST_ACTION',
  'ENFORCEMENT_ACTION',
  'SAFEGUARD',
  'SETTLEMENT',
  'ANALYTICS',
  'SYSTEM'
);

-- Create Event Table (APPEND-ONLY, IMMUTABLE)
CREATE TABLE "Event" (
  "id"                  SERIAL PRIMARY KEY,
  
  -- Event identification
  "event_id"            TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  "event_type"          "EventType" NOT NULL,
  "event_category"      "EventCategory" NOT NULL,
  
  -- Actor information (who performed the action)
  "actor_type"          "ActorType" NOT NULL,
  "actor_id"            TEXT NOT NULL,
  
  -- Target information (what entity was affected)
  "target_type"         "TargetType" NOT NULL,
  "target_id"           TEXT NOT NULL,
  
  -- Context and metadata (validated JSON)
  "context"             JSONB NOT NULL DEFAULT '{}'::JSONB,
  
  -- Request metadata
  "ip_address"          TEXT,
  "user_agent"          TEXT,
  
  -- Immutable timestamp
  "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX "Event_event_type_idx" ON "Event"("event_type");
CREATE INDEX "Event_event_category_idx" ON "Event"("event_category");
CREATE INDEX "Event_actor_type_idx" ON "Event"("actor_type");
CREATE INDEX "Event_actor_id_idx" ON "Event"("actor_id");
CREATE INDEX "Event_target_type_idx" ON "Event"("target_type");
CREATE INDEX "Event_target_id_idx" ON "Event"("target_id");
CREATE INDEX "Event_created_at_idx" ON "Event"("created_at");
CREATE INDEX "Event_event_category_created_at_idx" ON "Event"("event_category", "created_at");
CREATE INDEX "Event_actor_id_created_at_idx" ON "Event"("actor_id", "created_at");
CREATE INDEX "Event_target_id_created_at_idx" ON "Event"("target_id", "created_at");

-- SECURITY: Prevent UPDATE and DELETE operations on Event table
-- This ensures APPEND-ONLY behavior at the database level
CREATE OR REPLACE FUNCTION prevent_event_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'UPDATE operations are not allowed on Event table (APPEND-ONLY)';
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'DELETE operations are not allowed on Event table (APPEND-ONLY)';
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce APPEND-ONLY behavior
CREATE TRIGGER prevent_event_update
  BEFORE UPDATE ON "Event"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_event_modification();

CREATE TRIGGER prevent_event_delete
  BEFORE DELETE ON "Event"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_event_modification();

-- Add comment to table for documentation
COMMENT ON TABLE "Event" IS 'SECURITY-CRITICAL: APPEND-ONLY event log. NO business logic impact. NO financial actions. Backend-authoritative only.';
COMMENT ON COLUMN "Event"."event_id" IS 'Unique UUID for event identification';
COMMENT ON COLUMN "Event"."event_type" IS 'Specific action that occurred';
COMMENT ON COLUMN "Event"."event_category" IS 'High-level grouping of events';
COMMENT ON COLUMN "Event"."actor_type" IS 'Who performed the action (USER/ADMIN/SYSTEM)';
COMMENT ON COLUMN "Event"."actor_id" IS 'ID of the actor';
COMMENT ON COLUMN "Event"."target_type" IS 'What entity was affected';
COMMENT ON COLUMN "Event"."target_id" IS 'ID of the target entity';
COMMENT ON COLUMN "Event"."context" IS 'Additional validated context (JSON)';
COMMENT ON COLUMN "Event"."ip_address" IS 'IP address of the actor';
COMMENT ON COLUMN "Event"."user_agent" IS 'User agent of the actor';
COMMENT ON COLUMN "Event"."created_at" IS 'Immutable timestamp (cannot be modified)';
