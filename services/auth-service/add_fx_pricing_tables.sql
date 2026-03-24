-- Add FX Restriction Engine and Pricing Spread Logic tables
-- Based on the migrations: 20251220_add_fx_restriction_engine and 20251220_add_pricing_spread_logic

-- FX_RULE_TYPES: Defines rule types (ALLOWED, ADVISORY, BLOCKED)
CREATE TABLE IF NOT EXISTS "FX_RULE_TYPES" (
  "rule_type_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "rule_type_code" VARCHAR(50) NOT NULL UNIQUE,
  "rule_type_name" VARCHAR(255) NOT NULL,
  "enforcement_level" INTEGER NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- FX_COUNTRY_CAPABILITIES: Country-level FX capabilities and rules
CREATE TABLE IF NOT EXISTS "FX_COUNTRY_CAPABILITIES" (
  "capability_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "country_code" VARCHAR(2) NOT NULL,
  "source_currency" VARCHAR(3) NOT NULL,
  "target_currency" VARCHAR(3) NOT NULL,
  "rule_type_id" UUID NOT NULL REFERENCES "FX_RULE_TYPES"("rule_type_id"),
  "min_amount" DECIMAL(19,4),
  "max_amount" DECIMAL(19,4),
  "daily_limit" DECIMAL(19,4),
  "monthly_limit" DECIMAL(19,4),
  "kyc_level_required" INTEGER,
  "psp_whitelist" TEXT,
  "psp_blacklist" TEXT,
  "requires_disclosure" BOOLEAN DEFAULT FALSE,
  "requires_confirmation" BOOLEAN DEFAULT FALSE,
  "effective_date" DATE NOT NULL,
  "expiry_date" DATE,
  "version" INTEGER NOT NULL DEFAULT 1,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" INTEGER REFERENCES "User"("id"),
  "updated_by" INTEGER REFERENCES "User"("id")
);

-- FEE_COMPONENTS: Individual fee components for transactions
CREATE TABLE IF NOT EXISTS "FEE_COMPONENTS" (
  "component_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "transaction_id" INTEGER,
  "component_type" VARCHAR(50) NOT NULL,
  "component_name" VARCHAR(255) NOT NULL,
  "base_amount" DECIMAL(19,4) NOT NULL,
  "rate_percent" DECIMAL(5,4),
  "rate_fixed" DECIMAL(19,4),
  "calculated_amount" DECIMAL(19,4),
  "min_amount" DECIMAL(19,4),
  "max_amount" DECIMAL(19,4),
  "final_amount" DECIMAL(19,4) NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "is_waived" BOOLEAN DEFAULT FALSE,
  "waiver_reason" VARCHAR(255),
  "waiver_approved_by" INTEGER REFERENCES "User"("id"),
  "is_visible_to_user" BOOLEAN DEFAULT TRUE,
  "display_order" INTEGER,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- SPREAD_CALCULATION: FX spread calculations (read-only after creation)
CREATE TABLE IF NOT EXISTS "SPREAD_CALCULATION" (
  "spread_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "transaction_id" INTEGER NOT NULL,
  "source_currency" VARCHAR(3) NOT NULL,
  "dest_currency" VARCHAR(3) NOT NULL,
  "mid_market_rate" DECIMAL(19,8) NOT NULL,
  "psp_rate" DECIMAL(19,8) NOT NULL,
  "spread_basis_points" INTEGER NOT NULL,
  "spread_percent" DECIMAL(5,4) NOT NULL,
  "spread_amount" DECIMAL(19,4) NOT NULL,
  "source_amount" DECIMAL(19,4) NOT NULL,
  "dest_amount_before_spread" DECIMAL(19,4) NOT NULL,
  "dest_amount_after_spread" DECIMAL(19,4) NOT NULL,
  "user_receives" DECIMAL(19,4) NOT NULL,
  "rate_source" VARCHAR(50) NOT NULL,
  "rate_timestamp" TIMESTAMP NOT NULL,
  "rate_validity_seconds" INTEGER,
  "is_locked" BOOLEAN DEFAULT FALSE,
  "locked_at" TIMESTAMP,
  "locked_by_user_id" INTEGER REFERENCES "User"("id"),
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for FX tables
CREATE INDEX IF NOT EXISTS "idx_fx_country_capabilities_country_currency" ON "FX_COUNTRY_CAPABILITIES"("country_code", "source_currency", "target_currency", "is_active");
CREATE INDEX IF NOT EXISTS "idx_fx_country_capabilities_dates" ON "FX_COUNTRY_CAPABILITIES"("country_code", "effective_date", "expiry_date");
CREATE INDEX IF NOT EXISTS "idx_fx_country_capabilities_rule_type" ON "FX_COUNTRY_CAPABILITIES"("rule_type_id", "is_active");

-- Create indexes for Fee Components
CREATE INDEX IF NOT EXISTS "idx_fee_components_transaction" ON "FEE_COMPONENTS"("transaction_id", "component_type");
CREATE INDEX IF NOT EXISTS "idx_fee_components_type" ON "FEE_COMPONENTS"("component_type", "is_visible_to_user");

-- Create indexes for Spread Calculation
CREATE INDEX IF NOT EXISTS "idx_spread_calculation_transaction" ON "SPREAD_CALCULATION"("transaction_id");
CREATE INDEX IF NOT EXISTS "idx_spread_calculation_currency_pair" ON "SPREAD_CALCULATION"("source_currency", "dest_currency", "rate_timestamp" DESC);
CREATE INDEX IF NOT EXISTS "idx_spread_calculation_locked" ON "SPREAD_CALCULATION"("is_locked", "locked_at" DESC);

-- Insert some basic FX rule types
INSERT INTO "FX_RULE_TYPES" ("rule_type_code", "rule_type_name", "enforcement_level", "description") VALUES
('ALLOWED', 'Allowed Transaction', 1, 'Transaction is allowed without restrictions'),
('ADVISORY', 'Advisory Warning', 2, 'Transaction allowed with user advisory'),
('BLOCKED', 'Blocked Transaction', 3, 'Transaction is blocked and not allowed')
ON CONFLICT ("rule_type_code") DO NOTHING;

-- Update migration tracking
INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "finished_at", "applied_steps_count")
VALUES (
    'fx-pricing-tables-init',
    'fx-pricing-checksum',
    'fx_pricing_tables_initialization',
    now(),
    1
) ON CONFLICT ("id") DO NOTHING;