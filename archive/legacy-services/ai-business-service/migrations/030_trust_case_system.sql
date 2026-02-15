-- Migration: Trust Case System
-- Version: 030
-- Created: 2025-01-17
-- Description: Add Trust Case system with rules and case management

-- Create Trust Case Enums
DO $$ BEGIN
    CREATE TYPE "TrustCaseSubjectType" AS ENUM ('USER', 'TRAVELER', 'SELLER', 'AUCTION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TrustCaseStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TrustCaseSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Trust Rules Table
CREATE TABLE IF NOT EXISTS "trust_rules" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "severity" "TrustCaseSeverity" NOT NULL DEFAULT 'MEDIUM',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "trust_rules_pkey" PRIMARY KEY ("id")
);

-- Create Unique Index for rule_id
CREATE UNIQUE INDEX IF NOT EXISTS "trust_rules_rule_id_key" ON "trust_rules"("rule_id");

-- Create Indexes for Trust Rules
CREATE INDEX IF NOT EXISTS "trust_rules_category_idx" ON "trust_rules"("category");
CREATE INDEX IF NOT EXISTS "trust_rules_is_active_idx" ON "trust_rules"("is_active");

-- Create Trust Cases Table
CREATE TABLE IF NOT EXISTS "trust_cases" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "subject_type" "TrustCaseSubjectType" NOT NULL,
    "subject_id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "severity" "TrustCaseSeverity" NOT NULL,
    "status" "TrustCaseStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "notes" TEXT,

    CONSTRAINT "trust_cases_pkey" PRIMARY KEY ("id")
);

-- Create Unique Index for case_id
CREATE UNIQUE INDEX IF NOT EXISTS "trust_cases_case_id_key" ON "trust_cases"("case_id");

-- Create Indexes for Trust Cases
CREATE INDEX IF NOT EXISTS "trust_cases_subject_type_subject_id_idx" ON "trust_cases"("subject_type", "subject_id");
CREATE INDEX IF NOT EXISTS "trust_cases_rule_id_idx" ON "trust_cases"("rule_id");
CREATE INDEX IF NOT EXISTS "trust_cases_status_idx" ON "trust_cases"("status");
CREATE INDEX IF NOT EXISTS "trust_cases_severity_idx" ON "trust_cases"("severity");
CREATE INDEX IF NOT EXISTS "trust_cases_created_at_idx" ON "trust_cases"("created_at");
CREATE INDEX IF NOT EXISTS "trust_cases_status_created_at_idx" ON "trust_cases"("status", "created_at");

-- Add Foreign Key Constraints
ALTER TABLE "trust_cases" 
ADD CONSTRAINT "trust_cases_rule_id_fkey" 
FOREIGN KEY ("rule_id") REFERENCES "trust_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add Foreign Key for Business Account (if subject_type is USER)
ALTER TABLE "trust_cases" 
ADD CONSTRAINT "trust_cases_business_account_fkey" 
FOREIGN KEY ("subject_id") REFERENCES "business_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add Foreign Key for Business User (resolver)
ALTER TABLE "trust_cases" 
ADD CONSTRAINT "trust_cases_resolver_fkey" 
FOREIGN KEY ("resolved_by") REFERENCES "business_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create Trigger for updated_at
CREATE OR REPLACE FUNCTION "update_trust_rules_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trust_rules_updated_at"
BEFORE UPDATE ON "trust_rules"
FOR EACH ROW EXECUTE FUNCTION "update_trust_rules_updated_at"();

CREATE OR REPLACE FUNCTION "update_trust_cases_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trust_cases_updated_at"
BEFORE UPDATE ON "trust_cases"
FOR EACH ROW EXECUTE FUNCTION "update_trust_cases_updated_at"();

-- Insert Default Trust Rules
INSERT INTO "trust_rules" ("id", "rule_id", "name", "description", "category", "severity", "is_active", "created_at") VALUES
    ('trust-rule-001', 'USER_SUSPICIOUS_ACTIVITY', 'Suspicious User Activity', 'Detects unusual patterns in user behavior', 'SECURITY', 'HIGH', true, CURRENT_TIMESTAMP),
    ('trust-rule-002', 'TRAVELER_VERIFY_ISSUES', 'Traveler Verification Issues', 'Problems with traveler identity verification', 'COMPLIANCE', 'MEDIUM', true, CURRENT_TIMESTAMP),
    ('trust-rule-003', 'SELLER_FRAUD_RISK', 'Seller Fraud Risk', 'High-risk seller behavior detected', 'FRAUD', 'CRITICAL', true, CURRENT_TIMESTAMP),
    ('trust-rule-004', 'AUCTION_MANIPULATION', 'Auction Manipulation', 'Suspicious auction bidding patterns', 'MARKET_INTEGRITY', 'HIGH', true, CURRENT_TIMESTAMP),
    ('trust-rule-005', 'USER_MULTIPLE_ACCOUNTS', 'Multiple Account Detection', 'User operating multiple accounts', 'POLICY', 'MEDIUM', true, CURRENT_TIMESTAMP),
    ('trust-rule-006', 'TRAVELER_PAYMENT_ISSUES', 'Payment Issues', 'Traveler payment verification problems', 'FINANCIAL', 'HIGH', true, CURRENT_TIMESTAMP),
    ('trust-rule-007', 'SELLER_PERFORMANCE', 'Poor Seller Performance', 'Seller performance below threshold', 'QUALITY', 'MEDIUM', true, CURRENT_TIMESTAMP),
    ('trust-rule-008', 'AUCTION_BIDDING_ANOMALY', 'Bidding Anomaly Detection', 'Unusual bidding patterns detected', 'MARKET_INTEGRITY', 'HIGH', true, CURRENT_TIMESTAMP);

-- Create Views for Trust Case Analytics
CREATE OR REPLACE VIEW "trust_case_stats" AS
SELECT 
    COUNT(*) as total_cases,
    COUNT(*) FILTER (WHERE status = 'OPEN') as open_cases,
    COUNT(*) FILTER (WHERE status = 'UNDER_REVIEW') as under_review_cases,
    COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved_cases,
    COUNT(*) FILTER (WHERE status = 'DISMISSED') as dismissed_cases,
    COUNT(*) FILTER (WHERE severity = 'LOW') as low_severity_cases,
    COUNT(*) FILTER (WHERE severity = 'MEDIUM') as medium_severity_cases,
    COUNT(*) FILTER (WHERE severity = 'HIGH') as high_severity_cases,
    COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical_severity_cases,
    COUNT(*) FILTER (WHERE subject_type = 'USER') as user_cases,
    COUNT(*) FILTER (WHERE subject_type = 'TRAVELER') as traveler_cases,
    COUNT(*) FILTER (WHERE subject_type = 'SELLER') as seller_cases,
    COUNT(*) FILTER (WHERE subject_type = 'AUCTION') as auction_cases,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as cases_created_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as cases_created_this_week,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as cases_created_this_month,
    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) FILTER (WHERE status = 'RESOLVED' AND resolved_at IS NOT NULL) as avg_resolution_hours
FROM "trust_cases";

-- Create View for Open Trust Cases by Priority
CREATE OR REPLACE VIEW "open_trust_cases_by_priority" AS
SELECT 
    tc.case_id,
    tc.subject_type,
    tc.subject_id,
    tc.severity,
    tc.status,
    tc.created_at,
    tr.name as rule_name,
    tr.category as rule_category,
    CASE 
        WHEN tc.severity = 'CRITICAL' THEN 1
        WHEN tc.severity = 'HIGH' THEN 2
        WHEN tc.severity = 'MEDIUM' THEN 3
        WHEN tc.severity = 'LOW' THEN 4
    END as priority_order
FROM "trust_cases" tc
LEFT JOIN "trust_rules" tr ON tc.rule_id = tr.id
WHERE tc.status IN ('OPEN', 'UNDER_REVIEW')
ORDER BY priority_order, tc.created_at DESC;

-- Create Function to Create Trust Case from Rule Flag
CREATE OR REPLACE FUNCTION "create_trust_case_from_rule"(
    p_subject_type "TrustCaseSubjectType",
    p_subject_id TEXT,
    p_rule_id TEXT,
    p_severity "TrustCaseSeverity" DEFAULT 'MEDIUM',
    p_notes TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_case_id TEXT;
    v_rule_exists BOOLEAN;
BEGIN
    -- Check if rule exists and is active
    SELECT EXISTS(SELECT 1 FROM "trust_rules" WHERE "rule_id" = p_rule_id AND "is_active" = true) INTO v_rule_exists;
    
    IF NOT v_rule_exists THEN
        RAISE EXCEPTION 'Trust rule % does not exist or is not active', p_rule_id;
    END IF;
    
    -- Generate unique case ID
    v_case_id := 'TC-' || to_char(CURRENT_TIMESTAMP, 'YYYYMMDD-HH24MISS') || '-' || substr(md5(random()::text), 1, 8);
    
    -- Create trust case
    INSERT INTO "trust_cases" (
        "case_id", 
        "subject_type", 
        "subject_id", 
        "rule_id", 
        "severity", 
        "status", 
        "notes", 
        "created_at"
    ) VALUES (
        v_case_id,
        p_subject_type,
        p_subject_id,
        (SELECT "id" FROM "trust_rules" WHERE "rule_id" = p_rule_id LIMIT 1),
        p_severity,
        'OPEN',
        p_notes,
        CURRENT_TIMESTAMP
    );
    
    RETURN v_case_id;
END;
$$ LANGUAGE plpgsql;

-- Create Function to Resolve Trust Case
CREATE OR REPLACE FUNCTION "resolve_trust_case"(
    p_case_id TEXT,
    p_status "TrustCaseStatus",
    p_resolved_by TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_case_exists BOOLEAN;
    v_current_status "TrustCaseStatus";
BEGIN
    -- Check if case exists
    SELECT EXISTS(SELECT 1 FROM "trust_cases" WHERE "case_id" = p_case_id) INTO v_case_exists;
    
    IF NOT v_case_exists THEN
        RAISE EXCEPTION 'Trust case % does not exist', p_case_id;
    END IF;
    
    -- Check current status
    SELECT "status" INTO v_current_status FROM "trust_cases" WHERE "case_id" = p_case_id;
    
    IF v_current_status IN ('RESOLVED', 'DISMISSED') THEN
        RAISE EXCEPTION 'Trust case % is already resolved', p_case_id;
    END IF;
    
    IF p_status NOT IN ('RESOLVED', 'DISMISSED') THEN
        RAISE EXCEPTION 'Invalid resolution status: %', p_status;
    END IF;
    
    -- Update trust case
    UPDATE "trust_cases" SET
        "status" = p_status,
        "resolved_at" = CURRENT_TIMESTAMP,
        "resolved_by" = p_resolved_by,
        "notes" = COALESCE(p_notes, "notes"),
        "updated_at" = CURRENT_TIMESTAMP
    WHERE "case_id" = p_case_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Grant Permissions (adjust based on your database user setup)
-- GRANT SELECT, INSERT, UPDATE ON "trust_rules" TO "ai_business_service";
-- GRANT SELECT, INSERT, UPDATE ON "trust_cases" TO "ai_business_service";
-- GRANT SELECT ON "trust_case_stats" TO "ai_business_service";
-- GRANT SELECT ON "open_trust_cases_by_priority" TO "ai_business_service";
-- GRANT EXECUTE ON FUNCTION "create_trust_case_from_rule" TO "ai_business_service";
-- GRANT EXECUTE ON FUNCTION "resolve_trust_case" TO "ai_business_service";

-- Add Comments for Documentation
COMMENT ON TABLE "trust_rules" IS 'Rules that can trigger trust cases when flags are raised';
COMMENT ON TABLE "trust_cases" IS 'Trust cases created from rule flags requiring human review';
COMMENT ON COLUMN "trust_cases"."subject_type" IS 'Type of subject that triggered the trust case';
COMMENT ON COLUMN "trust_cases"."subject_id" IS 'ID of the subject that triggered the trust case';
COMMENT ON COLUMN "trust_cases"."rule_id" IS 'ID of the rule that triggered this trust case';
COMMENT ON COLUMN "trust_cases"."severity" IS 'Severity level of the trust case';
COMMENT ON COLUMN "trust_cases"."status" IS 'Current status of the trust case';
COMMENT ON COLUMN "trust_cases"."resolved_by" IS 'ID of the user who resolved the trust case';
COMMENT ON COLUMN "trust_cases"."notes" IS 'Additional notes about the trust case';

COMMENT ON VIEW "trust_case_stats" IS 'Aggregated statistics for trust cases';
COMMENT ON VIEW "open_trust_cases_by_priority" IS 'Open trust cases ordered by priority';

COMMENT ON FUNCTION "create_trust_case_from_rule" IS 'Creates a new trust case from a rule flag';
COMMENT ON FUNCTION "resolve_trust_case" IS 'Resolves a trust case with human decision';
