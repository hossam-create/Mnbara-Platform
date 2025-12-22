-- Pricing & Spread Logic - Transparent Fee Architecture
-- This migration creates tables for managing fees, spreads, and pricing transparency

-- FEE_COMPONENTS: Individual fee components for transactions
CREATE TABLE "FEE_COMPONENTS" (
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

CREATE INDEX "idx_fee_components_transaction" ON "FEE_COMPONENTS"("transaction_id", "component_type");
CREATE INDEX "idx_fee_components_type" ON "FEE_COMPONENTS"("component_type", "is_visible_to_user");

-- SPREAD_CALCULATION: FX spread calculations (read-only after creation)
CREATE TABLE "SPREAD_CALCULATION" (
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

CREATE INDEX "idx_spread_calculation_transaction" ON "SPREAD_CALCULATION"("transaction_id");
CREATE INDEX "idx_spread_calculation_currency_pair" ON "SPREAD_CALCULATION"("source_currency", "dest_currency", "rate_timestamp" DESC);
CREATE INDEX "idx_spread_calculation_locked" ON "SPREAD_CALCULATION"("is_locked", "locked_at" DESC);

-- TRANSPARENCY_RULES: Rules for fee transparency enforcement
CREATE TABLE "TRANSPARENCY_RULES" (
  "rule_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "rule_type" VARCHAR(50) NOT NULL,
  "rule_name" VARCHAR(255) NOT NULL,
  "applies_to_transaction_type" VARCHAR(50),
  "applies_to_amount_range" VARCHAR(50),
  "min_amount" DECIMAL(19,4),
  "max_amount" DECIMAL(19,4),
  "rule_description" TEXT,
  "enforcement_level" INTEGER,
  "is_active" BOOLEAN DEFAULT TRUE,
  "effective_date" DATE NOT NULL,
  "expiry_date" DATE,
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" INTEGER REFERENCES "User"("id"),
  "updated_by" INTEGER REFERENCES "User"("id")
);

CREATE INDEX "idx_transparency_rules_type" ON "TRANSPARENCY_RULES"("rule_type", "applies_to_transaction_type", "is_active");
CREATE INDEX "idx_transparency_rules_dates" ON "TRANSPARENCY_RULES"("effective_date", "expiry_date");

-- TRANSPARENCY_BREAKDOWN: User-facing fee breakdown
CREATE TABLE "TRANSPARENCY_BREAKDOWN" (
  "breakdown_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "transaction_id" INTEGER NOT NULL,
  "breakdown_type" VARCHAR(50) NOT NULL,
  "source_amount" DECIMAL(19,4) NOT NULL,
  "source_currency" VARCHAR(3) NOT NULL,
  "mid_market_rate" DECIMAL(19,8),
  "psp_rate" DECIMAL(19,8),
  "spread_bps" INTEGER,
  "total_fees" DECIMAL(19,4),
  "dest_amount" DECIMAL(19,4) NOT NULL,
  "dest_currency" VARCHAR(3) NOT NULL,
  "breakdown_json" JSONB NOT NULL,
  "is_shown_to_user" BOOLEAN DEFAULT TRUE,
  "shown_at" TIMESTAMP,
  "user_acknowledged" BOOLEAN DEFAULT FALSE,
  "acknowledged_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_transparency_breakdown_transaction" ON "TRANSPARENCY_BREAKDOWN"("transaction_id");
CREATE INDEX "idx_transparency_breakdown_acknowledged" ON "TRANSPARENCY_BREAKDOWN"("user_acknowledged", "shown_at" DESC);

-- NO_HIDDEN_FEES_GUARANTEE: Tracks guarantee compliance
CREATE TABLE "NO_HIDDEN_FEES_GUARANTEE" (
  "guarantee_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "transaction_id" INTEGER NOT NULL,
  "guarantee_type" VARCHAR(50) NOT NULL,
  "quoted_amount" DECIMAL(19,4) NOT NULL,
  "quoted_currency" VARCHAR(3) NOT NULL,
  "quote_timestamp" TIMESTAMP NOT NULL,
  "quote_valid_until" TIMESTAMP NOT NULL,
  "actual_amount" DECIMAL(19,4) NOT NULL,
  "actual_currency" VARCHAR(3) NOT NULL,
  "variance_amount" DECIMAL(19,4),
  "variance_percent" DECIMAL(5,4),
  "variance_acceptable" BOOLEAN,
  "max_variance_percent" DECIMAL(5,4) NOT NULL,
  "all_fees_disclosed" BOOLEAN NOT NULL,
  "no_surprise_fees" BOOLEAN NOT NULL,
  "guarantee_honored" BOOLEAN NOT NULL,
  "guarantee_broken_reason" VARCHAR(255),
  "compensation_amount" DECIMAL(19,4),
  "compensation_status" VARCHAR(50),
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_no_hidden_fees_guarantee_transaction" ON "NO_HIDDEN_FEES_GUARANTEE"("transaction_id");
CREATE INDEX "idx_no_hidden_fees_guarantee_honored" ON "NO_HIDDEN_FEES_GUARANTEE"("guarantee_honored", "created_at" DESC);
CREATE INDEX "idx_no_hidden_fees_guarantee_variance" ON "NO_HIDDEN_FEES_GUARANTEE"("variance_acceptable", "created_at" DESC);

-- FEE_CALCULATION_AUDIT: Immutable audit trail of all fee calculations
CREATE TABLE "FEE_CALCULATION_AUDIT" (
  "audit_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "transaction_id" INTEGER NOT NULL,
  "calculation_step" INTEGER NOT NULL,
  "step_name" VARCHAR(255) NOT NULL,
  "input_values" JSONB,
  "formula_applied" TEXT,
  "output_value" DECIMAL(19,4),
  "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "calculated_by" VARCHAR(50),
  "is_correct" BOOLEAN,
  "validation_notes" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_fee_calculation_audit_transaction" ON "FEE_CALCULATION_AUDIT"("transaction_id", "calculation_step");
CREATE INDEX "idx_fee_calculation_audit_correctness" ON "FEE_CALCULATION_AUDIT"("is_correct", "created_at" DESC);
