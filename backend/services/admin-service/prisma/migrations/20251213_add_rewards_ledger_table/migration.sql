-- Migration: Add RewardsLedger Table
-- Description: Rewards transaction schema with points calculation logic
-- Requirements: 15.1, 15.2 - Award points based on transaction value, display balance and history

-- ========================================
-- REWARDS SYSTEM ENUMS
-- ========================================

-- Reward action types
CREATE TYPE "RewardAction" AS ENUM (
    'DELIVERY_COMPLETED',
    'PURCHASE_MADE',
    'FIRST_ORDER',
    'REFERRAL',
    'REVIEW_SUBMITTED',
    'AUCTION_WON',
    'LISTING_SOLD',
    'BONUS',
    'ADJUSTMENT',
    'EXPIRED'
);

-- Reward transaction types
CREATE TYPE "RewardTransactionType" AS ENUM (
    'EARNED',
    'REDEEMED',
    'EXPIRED',
    'ADJUSTED',
    'BONUS',
    'TRANSFERRED'
);

-- Redemption types
CREATE TYPE "RedemptionType" AS ENUM (
    'WALLET',
    'DISCOUNT',
    'GIFT_CARD',
    'MNB_TOKEN'
);

-- ========================================
-- REWARDS ACCOUNT TABLE
-- ========================================

-- Main rewards account for each user
CREATE TABLE "Rewards" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL UNIQUE,
    
    -- Points balances
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "availablePoints" INTEGER NOT NULL DEFAULT 0,
    "redeemedPoints" INTEGER NOT NULL DEFAULT 0,
    "expiredPoints" INTEGER NOT NULL DEFAULT 0,
    
    -- Tier system (for future gamification)
    "tier" VARCHAR(50) DEFAULT 'BRONZE',
    "tierPoints" INTEGER NOT NULL DEFAULT 0,
    "tierExpiresAt" TIMESTAMP(3),
    
    -- Lifetime stats
    "lifetimeEarned" INTEGER NOT NULL DEFAULT 0,
    "lifetimeRedeemed" INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key
    CONSTRAINT "Rewards_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for rewards account
CREATE INDEX "Rewards_userId_idx" ON "Rewards"("userId");
CREATE INDEX "Rewards_totalPoints_idx" ON "Rewards"("totalPoints" DESC);
CREATE INDEX "Rewards_tier_idx" ON "Rewards"("tier");
CREATE INDEX "Rewards_availablePoints_idx" ON "Rewards"("availablePoints" DESC);

-- ========================================
-- REWARD TRANSACTION TABLE (LEDGER)
-- ========================================

-- Immutable ledger of all reward transactions
CREATE TABLE "RewardTransaction" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "rewardsId" INTEGER,
    
    -- Transaction details
    "points" INTEGER NOT NULL,
    "type" "RewardTransactionType" NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    
    -- Description and metadata
    "description" TEXT,
    "metadata" JSONB,
    
    -- Reference to source transaction (order, listing, etc.)
    "referenceType" VARCHAR(50),
    "referenceId" INTEGER,
    
    -- Balance snapshot (for audit trail)
    "balanceBefore" INTEGER,
    "balanceAfter" INTEGER,
    
    -- Expiry tracking
    "expiresAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    
    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT "RewardTransaction_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RewardTransaction_rewardsId_fkey" FOREIGN KEY ("rewardsId") 
        REFERENCES "Rewards"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes for reward transactions
CREATE INDEX "RewardTransaction_userId_idx" ON "RewardTransaction"("userId");
CREATE INDEX "RewardTransaction_rewardsId_idx" ON "RewardTransaction"("rewardsId");
CREATE INDEX "RewardTransaction_type_idx" ON "RewardTransaction"("type");
CREATE INDEX "RewardTransaction_action_idx" ON "RewardTransaction"("action");
CREATE INDEX "RewardTransaction_createdAt_idx" ON "RewardTransaction"("createdAt" DESC);
CREATE INDEX "RewardTransaction_referenceType_referenceId_idx" ON "RewardTransaction"("referenceType", "referenceId");
CREATE INDEX "RewardTransaction_expiresAt_idx" ON "RewardTransaction"("expiresAt") WHERE "expiresAt" IS NOT NULL;

-- ========================================
-- REWARD REDEMPTION TABLE
-- ========================================

-- Tracks redemption requests and their status
CREATE TABLE "RewardRedemption" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "rewardsId" INTEGER,
    "transactionId" INTEGER,
    
    -- Redemption details
    "pointsRedeemed" INTEGER NOT NULL,
    "redemptionType" "RedemptionType" NOT NULL,
    "cashValue" DECIMAL(10, 2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Status
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    
    -- Applied to (order, wallet, etc.)
    "appliedToType" VARCHAR(50),
    "appliedToId" INTEGER,
    
    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT "RewardRedemption_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RewardRedemption_rewardsId_fkey" FOREIGN KEY ("rewardsId") 
        REFERENCES "Rewards"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RewardRedemption_transactionId_fkey" FOREIGN KEY ("transactionId") 
        REFERENCES "RewardTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes for redemptions
CREATE INDEX "RewardRedemption_userId_idx" ON "RewardRedemption"("userId");
CREATE INDEX "RewardRedemption_status_idx" ON "RewardRedemption"("status");
CREATE INDEX "RewardRedemption_redemptionType_idx" ON "RewardRedemption"("redemptionType");
CREATE INDEX "RewardRedemption_createdAt_idx" ON "RewardRedemption"("createdAt" DESC);

-- ========================================
-- POINTS CALCULATION RULES TABLE
-- ========================================

-- Configurable points rules (admin-managed)
CREATE TABLE "RewardPointsRule" (
    "id" SERIAL PRIMARY KEY,
    "action" VARCHAR(100) NOT NULL UNIQUE,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    
    -- Points configuration
    "basePoints" INTEGER NOT NULL,
    "multiplier" DECIMAL(5, 2) DEFAULT 1.0,
    "maxPoints" INTEGER,
    "minTransactionValue" DECIMAL(10, 2),
    
    -- Percentage-based calculation (for transaction value)
    "percentageOfValue" DECIMAL(5, 2),
    "pointsPerDollar" DECIMAL(5, 2),
    
    -- Validity
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    
    -- Tier multipliers (JSON: { "BRONZE": 1.0, "SILVER": 1.2, "GOLD": 1.5 })
    "tierMultipliers" JSONB,
    
    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for points rules
CREATE INDEX "RewardPointsRule_action_idx" ON "RewardPointsRule"("action");
CREATE INDEX "RewardPointsRule_isActive_idx" ON "RewardPointsRule"("isActive");

-- ========================================
-- INSERT DEFAULT POINTS RULES
-- ========================================

INSERT INTO "RewardPointsRule" ("action", "name", "description", "basePoints", "pointsPerDollar", "isActive") VALUES
    ('DELIVERY_COMPLETED', 'Delivery Completed', 'Points earned when traveler completes a delivery', 100, NULL, true),
    ('PURCHASE_MADE', 'Purchase Made', 'Points earned on each purchase', 50, 1.0, true),
    ('FIRST_ORDER', 'First Order Bonus', 'Bonus points for first-time buyers', 200, NULL, true),
    ('REFERRAL', 'Referral Bonus', 'Points for referring a new user', 150, NULL, true),
    ('REVIEW_SUBMITTED', 'Review Submitted', 'Points for leaving a product review', 25, NULL, true),
    ('AUCTION_WON', 'Auction Won', 'Points for winning an auction', 75, 0.5, true),
    ('LISTING_SOLD', 'Listing Sold', 'Points for sellers when item sells', 50, 0.5, true);

-- ========================================
-- TRIGGER: Update timestamps
-- ========================================

CREATE OR REPLACE FUNCTION update_rewards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rewards_updated_at_trigger
    BEFORE UPDATE ON "Rewards"
    FOR EACH ROW
    EXECUTE FUNCTION update_rewards_updated_at();

CREATE TRIGGER reward_redemption_updated_at_trigger
    BEFORE UPDATE ON "RewardRedemption"
    FOR EACH ROW
    EXECUTE FUNCTION update_rewards_updated_at();

CREATE TRIGGER reward_points_rule_updated_at_trigger
    BEFORE UPDATE ON "RewardPointsRule"
    FOR EACH ROW
    EXECUTE FUNCTION update_rewards_updated_at();

-- ========================================
-- FUNCTION: Calculate points for transaction
-- ========================================

CREATE OR REPLACE FUNCTION calculate_reward_points(
    p_action VARCHAR(100),
    p_transaction_value DECIMAL(10, 2) DEFAULT NULL,
    p_user_tier VARCHAR(50) DEFAULT 'BRONZE'
)
RETURNS INTEGER AS $$
DECLARE
    v_rule RECORD;
    v_points INTEGER;
    v_tier_multiplier DECIMAL(5, 2);
BEGIN
    -- Get the rule for this action
    SELECT * INTO v_rule FROM "RewardPointsRule" 
    WHERE "action" = p_action AND "isActive" = true
    AND (("validFrom" IS NULL OR "validFrom" <= CURRENT_TIMESTAMP)
    AND ("validUntil" IS NULL OR "validUntil" >= CURRENT_TIMESTAMP));
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Calculate base points
    v_points := v_rule."basePoints";
    
    -- Add transaction value based points if applicable
    IF p_transaction_value IS NOT NULL AND v_rule."pointsPerDollar" IS NOT NULL THEN
        v_points := v_points + FLOOR(p_transaction_value * v_rule."pointsPerDollar");
    END IF;
    
    -- Apply multiplier
    v_points := FLOOR(v_points * COALESCE(v_rule."multiplier", 1.0));
    
    -- Apply tier multiplier if configured
    IF v_rule."tierMultipliers" IS NOT NULL THEN
        v_tier_multiplier := COALESCE(
            (v_rule."tierMultipliers"->>p_user_tier)::DECIMAL(5,2),
            1.0
        );
        v_points := FLOOR(v_points * v_tier_multiplier);
    END IF;
    
    -- Apply max points cap if set
    IF v_rule."maxPoints" IS NOT NULL AND v_points > v_rule."maxPoints" THEN
        v_points := v_rule."maxPoints";
    END IF;
    
    RETURN v_points;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNCTION: Award points to user
-- ========================================

CREATE OR REPLACE FUNCTION award_reward_points(
    p_user_id INTEGER,
    p_action VARCHAR(100),
    p_description TEXT DEFAULT NULL,
    p_transaction_value DECIMAL(10, 2) DEFAULT NULL,
    p_reference_type VARCHAR(50) DEFAULT NULL,
    p_reference_id INTEGER DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(
    transaction_id INTEGER,
    points_awarded INTEGER,
    new_balance INTEGER
) AS $$
DECLARE
    v_rewards_id INTEGER;
    v_user_tier VARCHAR(50);
    v_points INTEGER;
    v_balance_before INTEGER;
    v_balance_after INTEGER;
    v_transaction_id INTEGER;
BEGIN
    -- Get or create rewards account
    INSERT INTO "Rewards" ("userId", "totalPoints", "availablePoints", "redeemedPoints")
    VALUES (p_user_id, 0, 0, 0)
    ON CONFLICT ("userId") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP
    RETURNING "id", "tier", "availablePoints" INTO v_rewards_id, v_user_tier, v_balance_before;
    
    -- Calculate points
    v_points := calculate_reward_points(p_action, p_transaction_value, COALESCE(v_user_tier, 'BRONZE'));
    
    IF v_points <= 0 THEN
        RETURN QUERY SELECT 0, 0, v_balance_before;
        RETURN;
    END IF;
    
    -- Update rewards balance
    UPDATE "Rewards"
    SET "totalPoints" = "totalPoints" + v_points,
        "availablePoints" = "availablePoints" + v_points,
        "lifetimeEarned" = "lifetimeEarned" + v_points,
        "tierPoints" = "tierPoints" + v_points
    WHERE "id" = v_rewards_id
    RETURNING "availablePoints" INTO v_balance_after;
    
    -- Create transaction record
    INSERT INTO "RewardTransaction" (
        "userId", "rewardsId", "points", "type", "action",
        "description", "metadata", "referenceType", "referenceId",
        "balanceBefore", "balanceAfter", "expiresAt"
    ) VALUES (
        p_user_id, v_rewards_id, v_points, 'EARNED', p_action,
        COALESCE(p_description, 'Earned ' || v_points || ' points for ' || p_action),
        p_metadata, p_reference_type, p_reference_id,
        v_balance_before, v_balance_after,
        CURRENT_TIMESTAMP + INTERVAL '365 days'  -- Points expire after 1 year
    )
    RETURNING "id" INTO v_transaction_id;
    
    RETURN QUERY SELECT v_transaction_id, v_points, v_balance_after;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE "Rewards" IS 'User rewards account with points balances and tier information';
COMMENT ON TABLE "RewardTransaction" IS 'Immutable ledger of all reward point transactions';
COMMENT ON TABLE "RewardRedemption" IS 'Tracks reward redemption requests and their processing status';
COMMENT ON TABLE "RewardPointsRule" IS 'Configurable rules for calculating reward points per action';
COMMENT ON FUNCTION calculate_reward_points IS 'Calculates reward points based on action, transaction value, and user tier';
COMMENT ON FUNCTION award_reward_points IS 'Awards points to a user and creates transaction record';
