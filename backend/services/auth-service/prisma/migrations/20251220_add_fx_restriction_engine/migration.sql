-- FX Restriction Engine - Country-Level Rules
-- This migration creates tables for managing FX restrictions, rules, and overrides

-- FX_RULE_TYPES: Defines rule types (ALLOWED, ADVISORY, BLOCKED)
CREATE TABLE "FX_RULE_TYPES" (
  "rule_type_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "rule_type_code" VARCHAR(50) NOT NULL UNIQUE,
  "rule_type_name" VARCHAR(255) NOT NULL,
  "enforcement_level" INTEGER NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- FX_COUNTRY_CAPABILITIES: Country-level FX capabilities and rules
CREATE TABLE "FX_COUNTRY_CAPABILITIES" (
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

CREATE INDEX "idx_fx_country_capabilities_country_currency" ON "FX_COUNTRY_CAPABILITIES"("country_code", "source_currency", "target_currency", "is_active");
CREATE INDEX "idx_fx_country_capabilities_dates" ON "FX_COUNTRY_CAPABILITIES"("country_code", "effective_date", "expiry_date");
CREATE INDEX "idx_fx_country_capabilities_rule_type" ON "FX_COUNTRY_CAPABILITIES"("rule_type_id", "is_active");

-- FX_COUNTRY_RESTRICTIONS: Country-level restrictions
CREATE TABLE "FX_COUNTRY_RESTRICTIONS" (
  "restriction_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "country_code" VARCHAR(2) NOT NULL,
  "restriction_type" VARCHAR(50) NOT NULL,
  "affected_currencies" TEXT NOT NULL,
  "restriction_reason" VARCHAR(255),
  "rule_type_id" UUID NOT NULL REFERENCES "FX_RULE_TYPES"("rule_type_id"),
  "requires_license" BOOLEAN DEFAULT FALSE,
  "license_type" VARCHAR(100),
  "sanctions_list_check" BOOLEAN DEFAULT TRUE,
  "aml_scoring_threshold" INTEGER,
  "effective_date" DATE NOT NULL,
  "expiry_date" DATE,
  "version" INTEGER NOT NULL DEFAULT 1,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" INTEGER REFERENCES "User"("id"),
  "updated_by" INTEGER REFERENCES "User"("id")
);

CREATE INDEX "idx_fx_country_restrictions_country" ON "FX_COUNTRY_RESTRICTIONS"("country_code", "restriction_type", "is_active");
CREATE INDEX "idx_fx_country_restrictions_dates" ON "FX_COUNTRY_RESTRICTIONS"("effective_date", "expiry_date");

-- FX_OVERRIDE_HOOKS: Manual overrides for FX rules
CREATE TABLE "FX_OVERRIDE_HOOKS" (
  "override_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "capability_id" UUID NOT NULL REFERENCES "FX_COUNTRY_CAPABILITIES"("capability_id"),
  "override_type" VARCHAR(50) NOT NULL,
  "override_reason" VARCHAR(255) NOT NULL,
  "override_action" VARCHAR(50) NOT NULL,
  "override_scope" VARCHAR(50) NOT NULL,
  "target_user_id" INTEGER REFERENCES "User"("id"),
  "target_transaction_id" INTEGER,
  "source_country" VARCHAR(2),
  "dest_country" VARCHAR(2),
  "min_amount" DECIMAL(19,4),
  "max_amount" DECIMAL(19,4),
  "approval_required" BOOLEAN DEFAULT TRUE,
  "approved_by" INTEGER REFERENCES "User"("id"),
  "approval_timestamp" TIMESTAMP,
  "approval_notes" TEXT,
  "effective_date" TIMESTAMP NOT NULL,
  "expiry_date" TIMESTAMP,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" INTEGER REFERENCES "User"("id"),
  "updated_by" INTEGER REFERENCES "User"("id")
);

CREATE INDEX "idx_fx_override_hooks_capability" ON "FX_OVERRIDE_HOOKS"("capability_id", "override_type", "is_active");
CREATE INDEX "idx_fx_override_hooks_user" ON "FX_OVERRIDE_HOOKS"("target_user_id", "effective_date", "expiry_date");
CREATE INDEX "idx_fx_override_hooks_transaction" ON "FX_OVERRIDE_HOOKS"("target_transaction_id");
CREATE INDEX "idx_fx_override_hooks_corridor" ON "FX_OVERRIDE_HOOKS"("source_country", "dest_country", "override_scope");

-- FX_RULE_VERSIONS: Immutable version history for rules
CREATE TABLE "FX_RULE_VERSIONS" (
  "version_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "capability_id" UUID NOT NULL REFERENCES "FX_COUNTRY_CAPABILITIES"("capability_id"),
  "version_number" INTEGER NOT NULL,
  "rule_type_id" UUID NOT NULL REFERENCES "FX_RULE_TYPES"("rule_type_id"),
  "min_amount" DECIMAL(19,4),
  "max_amount" DECIMAL(19,4),
  "daily_limit" DECIMAL(19,4),
  "monthly_limit" DECIMAL(19,4),
  "kyc_level_required" INTEGER,
  "psp_whitelist" TEXT,
  "psp_blacklist" TEXT,
  "requires_disclosure" BOOLEAN,
  "requires_confirmation" BOOLEAN,
  "change_reason" VARCHAR(255) NOT NULL,
  "change_type" VARCHAR(50) NOT NULL,
  "previous_version_id" UUID REFERENCES "FX_RULE_VERSIONS"("version_id"),
  "effective_date" DATE NOT NULL,
  "superseded_date" DATE,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" INTEGER REFERENCES "User"("id")
);

CREATE INDEX "idx_fx_rule_versions_capability" ON "FX_RULE_VERSIONS"("capability_id", "version_number" DESC);
CREATE INDEX "idx_fx_rule_versions_dates" ON "FX_RULE_VERSIONS"("effective_date", "superseded_date");

-- FX_RESTRICTION_AUDIT_LOG: Audit trail for all FX changes
CREATE TABLE "FX_RESTRICTION_AUDIT_LOG" (
  "audit_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "entity_type" VARCHAR(50) NOT NULL,
  "entity_id" UUID NOT NULL,
  "action" VARCHAR(50) NOT NULL,
  "old_values" JSONB,
  "new_values" JSONB,
  "change_reason" TEXT,
  "approval_status" VARCHAR(50),
  "approver_id" INTEGER REFERENCES "User"("id"),
  "approver_notes" TEXT,
  "ip_address" VARCHAR(45),
  "user_agent" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" INTEGER REFERENCES "User"("id")
);

CREATE INDEX "idx_fx_restriction_audit_log_entity" ON "FX_RESTRICTION_AUDIT_LOG"("entity_type", "entity_id", "created_at" DESC);
CREATE INDEX "idx_fx_restriction_audit_log_actor" ON "FX_RESTRICTION_AUDIT_LOG"("created_by", "created_at" DESC);
CREATE INDEX "idx_fx_restriction_audit_log_approval" ON "FX_RESTRICTION_AUDIT_LOG"("approval_status", "created_at" DESC);

-- FX_COUNTRY_RISK_MATRIX: Country risk assessment
CREATE TABLE "FX_COUNTRY_RISK_MATRIX" (
  "risk_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "country_code" VARCHAR(2) NOT NULL,
  "risk_category" VARCHAR(50) NOT NULL,
  "risk_level" INTEGER NOT NULL,
  "risk_score" INTEGER NOT NULL,
  "description" TEXT,
  "source" VARCHAR(100),
  "last_updated" DATE NOT NULL,
  "next_review_date" DATE,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_fx_country_risk_matrix_country" ON "FX_COUNTRY_RISK_MATRIX"("country_code", "risk_category", "is_active");
CREATE INDEX "idx_fx_country_risk_matrix_risk" ON "FX_COUNTRY_RISK_MATRIX"("risk_level" DESC, "risk_score" DESC);

-- FX_PSP_CORRIDOR_RULES: PSP-specific corridor rules
CREATE TABLE "FX_PSP_CORRIDOR_RULES" (
  "corridor_rule_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "psp_code" VARCHAR(50) NOT NULL,
  "source_country" VARCHAR(2) NOT NULL,
  "dest_country" VARCHAR(2) NOT NULL,
  "source_currency" VARCHAR(3) NOT NULL,
  "dest_currency" VARCHAR(3) NOT NULL,
  "rule_type_id" UUID NOT NULL REFERENCES "FX_RULE_TYPES"("rule_type_id"),
  "min_amount" DECIMAL(19,4),
  "max_amount" DECIMAL(19,4),
  "daily_limit" DECIMAL(19,4),
  "psp_fee_percent" DECIMAL(5,2),
  "psp_fee_fixed" DECIMAL(19,4),
  "effective_date" DATE NOT NULL,
  "expiry_date" DATE,
  "version" INTEGER NOT NULL DEFAULT 1,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" INTEGER REFERENCES "User"("id"),
  "updated_by" INTEGER REFERENCES "User"("id")
);

CREATE INDEX "idx_fx_psp_corridor_rules_psp" ON "FX_PSP_CORRIDOR_RULES"("psp_code", "source_country", "dest_country", "is_active");
CREATE INDEX "idx_fx_psp_corridor_rules_corridor" ON "FX_PSP_CORRIDOR_RULES"("source_country", "dest_country", "effective_date");
