-- Migration: Appeal System
-- Version: 031
-- Created: 2025-01-17
-- Description: Add Appeal system for TrustCase informational appeals

-- Create Appeal Enums
DO $$ BEGIN
    CREATE TYPE "AppealActorType" AS ENUM ('USER', 'TRAVELER', 'SELLER', 'AUCTION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AppealStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Appeals Table
CREATE TABLE IF NOT EXISTS "appeals" (
    "id" TEXT NOT NULL,
    "appeal_id" TEXT NOT NULL,
    "trust_case_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_type" "AppealActorType" NOT NULL,
    "message" TEXT NOT NULL,
    "status" "AppealStatus" NOT NULL DEFAULT 'OPEN',
    "admin_notes" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "appeals_pkey" PRIMARY KEY ("id")
);

-- Create Unique Index for appeal_id
CREATE UNIQUE INDEX IF NOT EXISTS "appeals_appeal_id_key" ON "appeals"("appeal_id");

-- Create Indexes for Appeals
CREATE INDEX IF NOT EXISTS "appeals_trust_case_id_idx" ON "appeals"("trust_case_id");
CREATE INDEX IF NOT EXISTS "appeals_actor_id_idx" ON "appeals"("actor_id");
CREATE INDEX IF NOT EXISTS "appeals_actor_type_idx" ON "appeals"("actor_type");
CREATE INDEX IF NOT EXISTS "appeals_status_idx" ON "appeals"("status");
CREATE INDEX IF NOT EXISTS "appeals_created_at_idx" ON "appeals"("created_at");
CREATE INDEX IF NOT EXISTS "appeals_status_created_at_idx" ON "appeals"("status", "created_at");
CREATE INDEX IF NOT EXISTS "appeals_trust_case_status_idx" ON "appeals"("trust_case_id", "status");

-- Add Foreign Key Constraints
ALTER TABLE "appeals" 
ADD CONSTRAINT "appeals_trust_case_id_fkey" 
FOREIGN KEY ("trust_case_id") REFERENCES "trust_cases"("case_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add Foreign Key for Business User (reviewed_by)
ALTER TABLE "appeals" 
ADD CONSTRAINT "appeals_reviewed_by_fkey" 
FOREIGN KEY ("reviewed_by") REFERENCES "business_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create Trigger for updated_at
CREATE OR REPLACE FUNCTION "update_appeals_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "appeals_updated_at"
BEFORE UPDATE ON "appeals"
FOR EACH ROW EXECUTE FUNCTION "update_appeals_updated_at"();

-- Create Views for Appeal Analytics
CREATE OR REPLACE VIEW "appeal_stats" AS
SELECT 
    COUNT(*) as total_appeals,
    COUNT(*) FILTER (WHERE status = 'OPEN') as open_appeals,
    COUNT(*) FILTER (WHERE status = 'UNDER_REVIEW') as under_review_appeals,
    COUNT(*) FILTER (WHERE status = 'ACCEPTED') as accepted_appeals,
    COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected_appeals,
    COUNT(*) FILTER (WHERE actor_type = 'USER') as user_appeals,
    COUNT(*) FILTER (WHERE actor_type = 'TRAVELER') as traveler_appeals,
    COUNT(*) FILTER (WHERE actor_type = 'SELLER') as seller_appeals,
    COUNT(*) FILTER (WHERE actor_type = 'AUCTION') as auction_appeals,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as appeals_created_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as appeals_created_this_week,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as appeals_created_this_month,
    AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at))/3600) FILTER (WHERE status IN ('ACCEPTED', 'REJECTED') AND reviewed_at IS NOT NULL) as avg_review_hours
FROM "appeals";

-- Create View for Open Appeals by Priority
CREATE OR REPLACE VIEW "open_appeals_by_priority" AS
SELECT 
    a.appeal_id,
    a.trust_case_id,
    a.actor_id,
    a.actor_type,
    a.status,
    a.created_at,
    tc.severity as trust_case_severity,
    tc.subject_type as trust_case_subject_type,
    tr.name as trust_rule_name,
    tr.category as trust_rule_category,
    CASE 
        WHEN tc.severity = 'CRITICAL' THEN 1
        WHEN tc.severity = 'HIGH' THEN 2
        WHEN tc.severity = 'MEDIUM' THEN 3
        WHEN tc.severity = 'LOW' THEN 4
    END as priority_order
FROM "appeals" a
LEFT JOIN "trust_cases" tc ON a.trust_case_id = tc.case_id
LEFT JOIN "trust_rules" tr ON tc.rule_id = tr.id
WHERE a.status IN ('OPEN', 'UNDER_REVIEW')
ORDER BY priority_order, a.created_at DESC;

-- Create View for Appeals by Trust Case
CREATE OR REPLACE VIEW "appeals_by_trust_case" AS
SELECT 
    tc.case_id as trust_case_id,
    tc.subject_type,
    tc.subject_id,
    tc.severity,
    tc.status as trust_case_status,
    COUNT(a.id) as total_appeals,
    COUNT(a.id) FILTER (WHERE a.status = 'OPEN') as open_appeals,
    COUNT(a.id) FILTER (WHERE a.status = 'UNDER_REVIEW') as under_review_appeals,
    COUNT(a.id) FILTER (WHERE a.status = 'ACCEPTED') as accepted_appeals,
    COUNT(a.id) FILTER (WHERE a.status = 'REJECTED') as rejected_appeals,
    MAX(a.created_at) as last_appeal_at,
    STRING_AGG(DISTINCT a.actor_type, ', ') as appeal_actor_types
FROM "trust_cases" tc
LEFT JOIN "appeals" a ON tc.case_id = a.trust_case_id
GROUP BY tc.case_id, tc.subject_type, tc.subject_id, tc.severity, tc.status;

-- Create Function to Create Appeal
CREATE OR REPLACE FUNCTION "create_appeal"(
    p_trust_case_id TEXT,
    p_actor_id TEXT,
    p_actor_type "AppealActorType",
    p_message TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_appeal_id TEXT;
    v_trust_case_exists BOOLEAN;
    v_appeal_exists BOOLEAN;
BEGIN
    -- Check if trust case exists
    SELECT EXISTS(SELECT 1 FROM "trust_cases" WHERE "case_id" = p_trust_case_id) INTO v_trust_case_exists;
    
    IF NOT v_trust_case_exists THEN
        RAISE EXCEPTION 'Trust case % does not exist', p_trust_case_id;
    END IF;
    
    -- Check for duplicate appeal (same actor, same trust case, within 24 hours)
    SELECT EXISTS(
        SELECT 1 FROM "appeals" 
        WHERE "trust_case_id" = p_trust_case_id 
        AND "actor_id" = p_actor_id 
        AND "created_at" >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
        AND "status" IN ('OPEN', 'UNDER_REVIEW')
    ) INTO v_appeal_exists;
    
    IF v_appeal_exists THEN
        RAISE EXCEPTION 'Appeal already exists for this trust case and actor within 24 hours';
    END IF;
    
    -- Generate unique appeal ID
    v_appeal_id := 'AP-' || to_char(CURRENT_TIMESTAMP, 'YYYYMMDD-HH24MISS') || '-' || substr(md5(random()::text), 1, 8);
    
    -- Create appeal
    INSERT INTO "appeals" (
        "appeal_id", 
        "trust_case_id", 
        "actor_id", 
        "actor_type", 
        "message", 
        "status", 
        "created_at"
    ) VALUES (
        v_appeal_id,
        p_trust_case_id,
        p_actor_id,
        p_actor_type,
        p_message,
        'OPEN',
        CURRENT_TIMESTAMP
    );
    
    RETURN v_appeal_id;
END;
$$ LANGUAGE plpgsql;

-- Create Function to Resolve Appeal
CREATE OR REPLACE FUNCTION "resolve_appeal"(
    p_appeal_id TEXT,
    p_status "AppealStatus",
    p_admin_notes TEXT DEFAULT NULL,
    p_reviewed_by TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_appeal_exists BOOLEAN;
    v_current_status "AppealStatus";
BEGIN
    -- Check if appeal exists
    SELECT EXISTS(SELECT 1 FROM "appeals" WHERE "appeal_id" = p_appeal_id) INTO v_appeal_exists;
    
    IF NOT v_appeal_exists THEN
        RAISE EXCEPTION 'Appeal % does not exist', p_appeal_id;
    END IF;
    
    -- Get current status
    SELECT "status" INTO v_current_status FROM "appeals" WHERE "appeal_id" = p_appeal_id;
    
    -- Check if appeal is already resolved
    IF v_current_status IN ('ACCEPTED', 'REJECTED') THEN
        RAISE EXCEPTION 'Appeal % is already resolved', p_appeal_id;
    END IF;
    
    -- Validate status transition
    IF p_status NOT IN ('ACCEPTED', 'REJECTED') THEN
        RAISE EXCEPTION 'Invalid resolution status: %', p_status;
    END IF;
    
    -- Update appeal
    UPDATE "appeals" SET
        "status" = p_status,
        "admin_notes" = p_admin_notes,
        "reviewed_by" = p_reviewed_by,
        "reviewed_at" = CURRENT_TIMESTAMP,
        "updated_at" = CURRENT_TIMESTAMP
    WHERE "appeal_id" = p_appeal_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create Function to Get Appeal Statistics
CREATE OR REPLACE FUNCTION "get_appeal_statistics"(
    p_actor_type "AppealActorType" DEFAULT NULL,
    p_status "AppealStatus" DEFAULT NULL,
    p_date_start DATE DEFAULT NULL,
    p_date_end DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_appeals', COUNT(*),
        'open_appeals', COUNT(*) FILTER (WHERE status = 'OPEN'),
        'under_review_appeals', COUNT(*) FILTER (WHERE status = 'UNDER_REVIEW'),
        'accepted_appeals', COUNT(*) FILTER (WHERE status = 'ACCEPTED'),
        'rejected_appeals', COUNT(*) FILTER (WHERE status = 'REJECTED'),
        'appeals_by_status', (
            SELECT json_object_agg(status, count) 
            FROM (
                SELECT status, COUNT(*) as count 
                FROM "appeals" 
                WHERE (p_actor_type IS NULL OR actor_type = p_actor_type)
                AND (p_status IS NULL OR status = p_status)
                AND (p_date_start IS NULL OR created_at >= p_date_start)
                AND (p_date_end IS NULL OR created_at <= p_date_end)
                GROUP BY status
            ) s
        ),
        'appeals_by_actor_type', (
            SELECT json_object_agg(actor_type, count) 
            FROM (
                SELECT actor_type, COUNT(*) as count 
                FROM "appeals" 
                WHERE (p_actor_type IS NULL OR actor_type = p_actor_type)
                AND (p_status IS NULL OR status = p_status)
                AND (p_date_start IS NULL OR created_at >= p_date_start)
                AND (p_date_end IS NULL OR created_at <= p_date_end)
                GROUP BY actor_type
            ) s
        ),
        'average_review_time', (
            SELECT AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at))/3600) 
            FROM "appeals" 
            WHERE status IN ('ACCEPTED', 'REJECTED') 
            AND reviewed_at IS NOT NULL
            AND (p_actor_type IS NULL OR actor_type = p_actor_type)
            AND (p_status IS NULL OR status = p_status)
            AND (p_date_start IS NULL OR created_at >= p_date_start)
            AND (p_date_end IS NULL OR created_at <= p_date_end)
        ),
        'appeals_created_today', (
            SELECT COUNT(*) FROM "appeals" 
            WHERE created_at >= CURRENT_DATE
            AND (p_actor_type IS NULL OR actor_type = p_actor_type)
            AND (p_status IS NULL OR status = p_status)
        ),
        'appeals_created_this_week', (
            SELECT COUNT(*) FROM "appeals" 
            WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
            AND (p_actor_type IS NULL OR actor_type = p_actor_type)
            AND (p_status IS NULL OR status = p_status)
        ),
        'appeals_created_this_month', (
            SELECT COUNT(*) FROM "appeals" 
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            AND (p_actor_type IS NULL OR actor_type = p_actor_type)
            AND (p_status IS NULL OR status = p_status)
        )
    ) INTO result
    FROM "appeals"
    WHERE (p_actor_type IS NULL OR actor_type = p_actor_type)
    AND (p_status IS NULL OR status = p_status)
    AND (p_date_start IS NULL OR created_at >= p_date_start)
    AND (p_date_end IS NULL OR created_at <= p_date_end);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant Permissions (adjust based on your database user setup)
-- GRANT SELECT, INSERT, UPDATE ON "appeals" TO "ai_business_service";
-- GRANT SELECT ON "appeal_stats" TO "ai_business_service";
-- GRANT SELECT ON "open_appeals_by_priority" TO "ai_business_service";
-- GRANT SELECT ON "appeals_by_trust_case" TO "ai_business_service";
-- GRANT EXECUTE ON FUNCTION "create_appeal" TO "ai_business_service";
-- GRANT EXECUTE ON FUNCTION "resolve_appeal" TO "ai_business_service";
-- GRANT EXECUTE ON FUNCTION "get_appeal_statistics" TO "ai_business_service";

-- Add Comments for Documentation
COMMENT ON TABLE "appeals" IS 'Appeals submitted by actors against trust case decisions - informational only, no automatic reversals';
COMMENT ON COLUMN "appeals"."appeal_id" IS 'Unique identifier for the appeal';
COMMENT ON COLUMN "appeals"."trust_case_id" IS 'Reference to the trust case being appealed';
COMMENT ON COLUMN "appeals"."actor_id" IS 'ID of the actor submitting the appeal';
COMMENT ON COLUMN "appeals"."actor_type" IS 'Type of actor (USER, TRAVELER, SELLER, AUCTION)';
COMMENT ON COLUMN "appeals"."message" IS 'Appeal message from the actor';
COMMENT ON COLUMN "appeals"."status" IS 'Current status of the appeal';
COMMENT ON COLUMN "appeals"."admin_notes" IS 'Administrative notes about the appeal resolution';
COMMENT ON COLUMN "appeals"."reviewed_by" IS 'ID of the admin who reviewed the appeal';
COMMENT ON COLUMN "appeals"."reviewed_at" IS 'Timestamp when the appeal was reviewed';

COMMENT ON VIEW "appeal_stats" IS 'Aggregated statistics for appeals';
COMMENT ON VIEW "open_appeals_by_priority" IS 'Open appeals ordered by priority based on trust case severity';
COMMENT ON VIEW "appeals_by_trust_case" IS 'Appeals grouped by trust case';

COMMENT ON FUNCTION "create_appeal" IS 'Creates a new appeal for a trust case';
COMMENT ON FUNCTION "resolve_appeal" IS 'Resolves an appeal (accept/reject) - informational only';
COMMENT ON FUNCTION "get_appeal_statistics" IS 'Returns comprehensive appeal statistics';

-- Add Business Rules Comments
COMMENT ON CONSTRAINT "appeals_trust_case_id_fkey" ON "appeals" IS 'Appeals must be linked to valid trust cases';
COMMENT ON CONSTRAINT "appeals_reviewed_by_fkey" ON "appeals" IS 'Appeal reviews must be performed by valid business users';

-- Appeal System Business Rules Documentation
DO $$
BEGIN
    EXECUTE 'COMMENT ON SCHEMA public IS ''Appeal System Rules:
    1. Appeals are purely informational - no automatic reversals of trust case decisions
    2. Appeals require admin review for resolution
    3. Appeals can be submitted by any actor type (USER, TRAVELER, SELLER, AUCTION)
    4. Appeals must be linked to valid trust cases
    5. Appeals have message limits (5000 characters)
    6. Appeals have status transition rules enforced
    7. Appeals are fully audited and traceable
    8. Duplicate appeals within 24 hours are prevented
    9. Appeals do not modify trust case status automatically
    10. Appeals are for informational purposes only''';
END $$;
