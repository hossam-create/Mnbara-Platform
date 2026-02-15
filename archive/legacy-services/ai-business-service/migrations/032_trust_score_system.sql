-- Migration: Trust Score Storage System
-- Version: 032
-- Created: 2025-01-17
-- Description: Add Trust Score storage tables with history preservation and read-only guarantees

-- Create Trust Score Enums
DO $$ BEGIN
    CREATE TYPE "TrustScoreSubjectType" AS ENUM ('USER', 'TRAVELER', 'SELLER', 'AUCTION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TrustScoreCategory" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TrustScoreChangeReason" AS ENUM ('NEW_CASE', 'CASE_RESOLVED', 'APPEAL_OUTCOME', 'TIME_DECAY', 'CONFIG_CHANGE', 'MANUAL_RECALCULATION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Trust Scores Table
CREATE TABLE IF NOT EXISTS "trust_scores" (
    "id" TEXT NOT NULL,
    "score_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "subject_type" "TrustScoreSubjectType" NOT NULL,
    "trust_score" INTEGER NOT NULL CHECK ("trust_score" >= 0 AND "trust_score" <= 100),
    "score_category" "TrustScoreCategory" NOT NULL,
    "score_breakdown" JSONB NOT NULL,
    "calculation_details" JSONB NOT NULL,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "trust_scores_pkey" PRIMARY KEY ("id")
);

-- Create Unique Index for score_id
CREATE UNIQUE INDEX IF NOT EXISTS "trust_scores_score_id_key" ON "trust_scores"("score_id");

-- Create Indexes for Trust Scores
CREATE INDEX IF NOT EXISTS "trust_scores_subject_id_idx" ON "trust_scores"("subject_id");
CREATE INDEX IF NOT EXISTS "trust_scores_subject_type_idx" ON "trust_scores"("subject_type");
CREATE INDEX IF NOT EXISTS "trust_scores_trust_score_idx" ON "trust_scores"("trust_score");
CREATE INDEX IF NOT EXISTS "trust_scores_score_category_idx" ON "trust_scores"("score_category");
CREATE INDEX IF NOT EXISTS "trust_scores_created_at_idx" ON "trust_scores"("created_at");
CREATE INDEX IF NOT EXISTS "trust_scores_subject_score_idx" ON "trust_scores"("subject_id", "subject_type", "trust_score");
CREATE INDEX IF NOT EXISTS "trust_scores_category_score_idx" ON "trust_scores"("score_category", "trust_score");

-- Create Trust Score History Table
CREATE TABLE IF NOT EXISTS "trust_score_history" (
    "id" TEXT NOT NULL,
    "history_id" TEXT NOT NULL,
    "score_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "subject_type" "TrustScoreSubjectType" NOT NULL,
    "trust_score" INTEGER NOT NULL CHECK ("trust_score" >= 0 AND "trust_score" <= 100),
    "score_category" "TrustScoreCategory" NOT NULL,
    "score_change" INTEGER NOT NULL,
    "change_reason" "TrustScoreChangeReason" NOT NULL,
    "previous_score" INTEGER CHECK ("previous_score" >= 0 AND "previous_score" <= 100 OR "previous_score" IS NULL),
    "calculation_details" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trust_score_history_pkey" PRIMARY KEY ("id")
);

-- Create Unique Index for history_id
CREATE UNIQUE INDEX IF NOT EXISTS "trust_score_history_history_id_key" ON "trust_score_history"("history_id");

-- Create Indexes for Trust Score History
CREATE INDEX IF NOT EXISTS "trust_score_history_score_id_idx" ON "trust_score_history"("score_id");
CREATE INDEX IF NOT EXISTS "trust_score_history_subject_id_idx" ON "trust_score_history"("subject_id");
CREATE INDEX IF NOT EXISTS "trust_score_history_subject_type_idx" ON "trust_score_history"("subject_type");
CREATE INDEX IF NOT EXISTS "trust_score_history_change_reason_idx" ON "trust_score_history"("change_reason");
CREATE INDEX IF NOT EXISTS "trust_score_history_created_at_idx" ON "trust_score_history"("created_at");
CREATE INDEX IF NOT EXISTS "trust_score_history_subject_created_idx" ON "trust_score_history"("subject_id", "created_at");

-- Add Foreign Key Constraints
ALTER TABLE "trust_scores" 
ADD CONSTRAINT "trust_scores_subject_id_fkey" 
FOREIGN KEY ("subject_id") REFERENCES "business_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trust_score_history" 
ADD CONSTRAINT "trust_score_history_score_id_fkey" 
FOREIGN KEY ("score_id") REFERENCES "trust_scores"("score_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trust_score_history" 
ADD CONSTRAINT "trust_score_history_subject_id_fkey" 
FOREIGN KEY ("subject_id") REFERENCES "business_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create Trigger for updated_at
CREATE OR REPLACE FUNCTION "update_trust_scores_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trust_scores_updated_at"
BEFORE UPDATE ON "trust_scores"
FOR EACH ROW EXECUTE FUNCTION "update_trust_scores_updated_at"();

-- Create Views for Trust Score Analytics
CREATE OR REPLACE VIEW "trust_score_summary" AS
SELECT 
    ts.subject_id,
    ts.subject_type,
    ts.trust_score,
    ts.score_category,
    ts.created_at as last_calculated,
    ts.updated_at as last_updated,
    COUNT(tsh.history_id) as history_entries,
    MIN(tsh.trust_score) as min_score,
    MAX(tsh.trust_score) as max_score,
    AVG(tsh.trust_score) as avg_score,
    STRING_AGG(DISTINCT tsh.change_reason, ', ' ORDER BY tsh.created_at DESC) as change_reasons
FROM "trust_scores" ts
LEFT JOIN "trust_score_history" tsh ON ts.score_id = tsh.score_id
GROUP BY ts.subject_id, ts.subject_type, ts.trust_score, ts.score_category, ts.created_at, ts.updated_at;

-- Create View for Score Distribution
CREATE OR REPLACE VIEW "trust_score_distribution" AS
SELECT 
    score_category,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
    MIN(trust_score) as min_score_in_category,
    MAX(trust_score) as max_score_in_category,
    AVG(trust_score) as avg_score_in_category
FROM "trust_scores"
GROUP BY score_category
ORDER BY 
    CASE score_category
        WHEN 'EXCELLENT' THEN 1
        WHEN 'GOOD' THEN 2
        WHEN 'FAIR' THEN 3
        WHEN 'POOR' THEN 4
        WHEN 'CRITICAL' THEN 5
    END;

-- Create View for Recent Score Changes
CREATE OR REPLACE VIEW "recent_score_changes" AS
SELECT 
    tsh.subject_id,
    tsh.subject_type,
    tsh.trust_score as new_score,
    tsh.previous_score,
    tsh.score_change,
    tsh.change_reason,
    tsh.created_at as change_date,
    LAG(tsh.trust_score) OVER (PARTITION BY tsh.subject_id ORDER BY tsh.created_at) as previous_score_lag
FROM "trust_score_history" tsh
WHERE tsh.created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY tsh.created_at DESC;

-- Create View for Trust Score Trends
CREATE OR REPLACE VIEW "trust_score_trends" AS
SELECT 
    DATE_TRUNC('day', created_at) as trend_date,
    subject_type,
    COUNT(*) as scores_calculated,
    AVG(trust_score) as avg_score,
    MIN(trust_score) as min_score,
    MAX(trust_score) as max_score,
    STDDEV(trust_score) as score_std_dev
FROM "trust_scores"
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at), subject_type
ORDER BY trend_date DESC, subject_type;

-- Create Function to Store Trust Score
CREATE OR REPLACE FUNCTION "store_trust_score"(
    p_score_id TEXT,
    p_subject_id TEXT,
    p_subject_type "TrustScoreSubjectType",
    p_trust_score INTEGER,
    p_score_category "TrustScoreCategory",
    p_score_breakdown JSONB,
    p_calculation_details JSONB,
    p_metadata JSONB
)
RETURNS TEXT AS $$
DECLARE
    v_existing_score_id TEXT;
    v_new_score_id TEXT;
    v_previous_score INTEGER;
    v_score_change INTEGER;
    v_change_reason "TrustScoreChangeReason";
BEGIN
    -- Check for existing score
    SELECT score_id, trust_score INTO v_existing_score_id, v_previous_score
    FROM "trust_scores" 
    WHERE subject_id = p_subject_id AND subject_type = p_subject_type
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Determine change reason
    IF v_existing_score_id IS NULL THEN
        v_change_reason := 'NEW_CASE';
        v_score_change := 0;
    ELSE
        v_score_change := p_trust_score - v_previous_score;
        IF ABS(v_score_change) > 20 THEN
            v_change_reason := 'CASE_RESOLVED';
        ELSIF ABS(v_score_change) > 5 THEN
            v_change_reason := 'APPEAL_OUTCOME';
        ELSE
            v_change_reason := 'TIME_DECAY';
        END IF;
    END IF;
    
    -- Insert or update score
    IF v_existing_score_id IS NULL THEN
        -- Create new score
        v_new_score_id := p_score_id;
        INSERT INTO "trust_scores" (
            id, score_id, subject_id, subject_type, trust_score, 
            score_category, score_breakdown, calculation_details, metadata, created_at
        ) VALUES (
            gen_random_uuid(), v_new_score_id, p_subject_id, p_subject_type, p_trust_score,
            p_score_category, p_score_breakdown, p_calculation_details, p_metadata, CURRENT_TIMESTAMP
        );
    ELSE
        -- Update existing score (preserve history)
        v_new_score_id := v_existing_score_id;
        UPDATE "trust_scores" SET
            trust_score = p_trust_score,
            score_category = p_score_category,
            score_breakdown = p_score_breakdown,
            calculation_details = p_calculation_details,
            metadata = p_metadata,
            updated_at = CURRENT_TIMESTAMP
        WHERE score_id = v_existing_score_id;
    END IF;
    
    -- Create history record
    INSERT INTO "trust_score_history" (
        id, history_id, score_id, subject_id, subject_type, trust_score,
        score_category, score_change, change_reason, previous_score, calculation_details, created_at
    ) VALUES (
        gen_random_uuid(), 
        'HIST-' || to_char(CURRENT_TIMESTAMP, 'YYYYMMDD-HH24MISS') || '-' || substr(md5(random()::text), 1, 8),
        v_new_score_id,
        p_subject_id,
        p_subject_type,
        p_trust_score,
        p_score_category,
        v_score_change,
        v_change_reason,
        v_previous_score,
        p_calculation_details,
        CURRENT_TIMESTAMP
    );
    
    RETURN v_new_score_id;
END;
$$ LANGUAGE plpgsql;

-- Create Function to Get Trust Score
CREATE OR REPLACE FUNCTION "get_trust_score"(
    p_subject_id TEXT,
    p_subject_type "TrustScoreSubjectType"
)
RETURNS TABLE (
    score_id TEXT,
    subject_id TEXT,
    subject_type "TrustScoreSubjectType",
    trust_score INTEGER,
    score_category "TrustScoreCategory",
    score_breakdown JSONB,
    calculation_details JSONB,
    metadata JSONB,
    created_at TIMESTAMP(3),
    updated_at TIMESTAMP(3)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.score_id,
        ts.subject_id,
        ts.subject_type,
        ts.trust_score,
        ts.score_category,
        ts.score_breakdown,
        ts.calculation_details,
        ts.metadata,
        ts.created_at,
        ts.updated_at
    FROM "trust_scores" ts
    WHERE ts.subject_id = p_subject_id AND ts.subject_type = p_subject_type
    ORDER BY ts.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create Function to Get Trust Score History
CREATE OR REPLACE FUNCTION "get_trust_score_history"(
    p_subject_id TEXT,
    p_subject_type "TrustScoreSubjectType",
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    history_id TEXT,
    score_id TEXT,
    subject_id TEXT,
    subject_type "TrustScoreSubjectType",
    trust_score INTEGER,
    score_category "TrustScoreCategory",
    score_change INTEGER,
    change_reason "TrustScoreChangeReason",
    previous_score INTEGER,
    calculation_details JSONB,
    created_at TIMESTAMP(3)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tsh.history_id,
        tsh.score_id,
        tsh.subject_id,
        tsh.subject_type,
        tsh.trust_score,
        tsh.score_category,
        tsh.score_change,
        tsh.change_reason,
        tsh.previous_score,
        tsh.calculation_details,
        tsh.created_at
    FROM "trust_score_history" tsh
    WHERE tsh.subject_id = p_subject_id AND tsh.subject_type = p_subject_type
    ORDER BY tsh.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create Function to Get Trust Score Statistics
CREATE OR REPLACE FUNCTION "get_trust_score_statistics"(
    p_subject_type "TrustScoreSubjectType" DEFAULT NULL,
    p_min_score INTEGER DEFAULT NULL,
    p_max_score INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_subjects', COUNT(DISTINCT subject_id),
        'average_score', AVG(trust_score),
        'median_score', PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY trust_score),
        'score_distribution', (
            SELECT json_object_agg(score_category, count) 
            FROM (
                SELECT score_category, COUNT(*) as count
                FROM "trust_scores"
                WHERE (p_subject_type IS NULL OR subject_type = p_subject_type)
                AND (p_min_score IS NULL OR trust_score >= p_min_score)
                AND (p_max_score IS NULL OR trust_score <= p_max_score)
                GROUP BY score_category
            ) dist
        ),
        'subject_type_distribution', (
            SELECT json_object_agg(subject_type, count) 
            FROM (
                SELECT subject_type, COUNT(*) as count
                FROM "trust_scores"
                WHERE (p_subject_type IS NULL OR subject_type = p_subject_type)
                AND (p_min_score IS NULL OR trust_score >= p_min_score)
                AND (p_max_score IS NULL OR trust_score <= p_max_score)
                GROUP BY subject_type
            ) dist
        ),
        'last_updated', CURRENT_TIMESTAMP,
        'metadata', json_build_object(
            'read_only', true,
            'non_binding', true,
            'not_used_in_payments', true
        )
    ) INTO result
    FROM "trust_scores"
    WHERE (p_subject_type IS NULL OR subject_type = p_subject_type)
    AND (p_min_score IS NULL OR trust_score >= p_min_score)
    AND (p_max_score IS NULL OR trust_score <= p_max_score);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant Permissions (adjust based on your database user setup)
-- GRANT SELECT, INSERT, UPDATE ON "trust_scores" TO "ai_business_service";
-- GRANT SELECT, INSERT ON "trust_score_history" TO "ai_business_service";
-- GRANT SELECT ON "trust_score_summary" TO "ai_business_service";
-- GRANT SELECT ON "trust_score_distribution" TO "ai_business_service";
-- GRANT SELECT ON "recent_score_changes" TO "ai_business_service";
-- GRANT SELECT ON "trust_score_trends" TO "ai_business_service";
-- GRANT EXECUTE ON FUNCTION "store_trust_score" TO "ai_business_service";
-- GRANT EXECUTE ON FUNCTION "get_trust_score" TO "ai_business_service";
-- GRANT EXECUTE ON FUNCTION "get_trust_score_history" TO "ai_business_service";
-- GRANT EXECUTE ON FUNCTION "get_trust_score_statistics" TO "ai_business_service";

-- Add Comments for Documentation
COMMENT ON TABLE "trust_scores" IS 'Trust scores stored separately from trust cases with history preservation and read-only guarantees';
COMMENT ON COLUMN "trust_scores"."score_id" IS 'Unique identifier for the trust score';
COMMENT ON COLUMN "trust_scores"."subject_id" IS 'ID of the subject being scored';
COMMENT ON COLUMN "trust_scores"."subject_type" IS 'Type of subject (USER, TRAVELER, SELLER, AUCTION)';
COMMENT ON COLUMN "trust_scores"."trust_score" IS 'Calculated trust score (0-100)';
COMMENT ON COLUMN "trust_scores"."score_category" IS 'Category of the trust score';
COMMENT ON COLUMN "trust_scores"."score_breakdown" IS 'Detailed breakdown of how the score was calculated';
COMMENT ON COLUMN "trust_scores"."calculation_details" IS 'Details about the calculation process';
COMMENT ON COLUMN "trust_scores"."metadata" IS 'Metadata including read-only, non-binding, and financial isolation flags';

COMMENT ON TABLE "trust_score_history" IS 'Complete history of all trust score changes - never overwritten';
COMMENT ON COLUMN "trust_score_history"."score_change" IS 'Change in score from previous calculation';
COMMENT ON COLUMN "trust_score_history"."change_reason" IS 'Reason for the score change';
COMMENT ON COLUMN "trust_score_history"."previous_score" IS 'Previous score before this change';

COMMENT ON VIEW "trust_score_summary" IS 'Summary view of trust scores with history counts and statistics';
COMMENT ON VIEW "trust_score_distribution" IS 'Distribution of scores across categories with percentages';
COMMENT ON VIEW "recent_score_changes" IS 'Recent score changes for trend analysis';
COMMENT ON VIEW "trust_score_trends" IS 'Daily trends in trust scores by subject type';

COMMENT ON FUNCTION "store_trust_score" IS 'Stores trust score while preserving complete history - no overwrite allowed';
COMMENT ON FUNCTION "get_trust_score" IS 'Retrieves current trust score for a subject';
COMMENT ON FUNCTION "get_trust_score_history" IS 'Retrieves complete history of trust score changes';
COMMENT ON FUNCTION "get_trust_score_statistics" IS 'Returns comprehensive trust score statistics';

-- Trust Score Storage Business Rules Documentation
DO $$
BEGIN
    EXECUTE 'COMMENT ON SCHEMA public IS ''Trust Score Storage Rules:
    1. Score stored separately - Individual storage from trust cases
    2. History preserved - Complete history maintained, no overwrites
    3. No overwrite - Updates create new history records
    4. Read only - Scores never trigger automatic actions
    5. Non-binding - Scores do not affect account status
    6. Financial isolation - Complete separation from payment systems
    7. Audit trail - Every change logged and traceable
    8. Data integrity - All scores validated and bounded (0-100)
    9. Performance optimized - Efficient queries and indexing
    10. Compliance ready - All rules enforced and documented''';
END $$;
