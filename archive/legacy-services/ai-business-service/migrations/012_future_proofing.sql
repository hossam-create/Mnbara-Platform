-- Migration: Future-Proofing Infrastructure - Sprint 12
-- Purpose: Implement feature flags, read replicas, async processing, and scalability infrastructure

-- ========================================
-- FEATURE FLAGS SYSTEM
-- ========================================

-- Feature Flags Configuration
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_key VARCHAR(255) NOT NULL UNIQUE,
    flag_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Flag Configuration
    flag_type VARCHAR(50) NOT NULL, -- BOOLEAN, PERCENTAGE, TARGETED, CONDITIONAL
    is_enabled BOOLEAN DEFAULT false,
    rollout_percentage INTEGER DEFAULT 0, -- 0-100 for percentage-based flags
    
    -- Targeting Rules
    target_users JSONB DEFAULT '[]'::jsonb, -- Array of user IDs
    target_roles JSONB DEFAULT '[]'::jsonb, -- Array of role names
    target_business_accounts JSONB DEFAULT '[]'::jsonb, -- Array of business account IDs
    
    -- Conditions
    conditions JSONB DEFAULT '{}'::jsonb, -- Complex conditions JSON
    
    -- Metadata
    category VARCHAR(100) DEFAULT 'GENERAL', -- FINANCIAL, AI, REPORTING, UI, etc.
    priority INTEGER DEFAULT 0, -- Higher priority flags are evaluated first
    tags JSONB DEFAULT '[]'::jsonb,
    
    -- Lifecycle
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, ACTIVE, INACTIVE, ARCHIVED
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE -- Optional expiration
);

-- Feature Flag Evaluation Log
CREATE TABLE feature_flag_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_key VARCHAR(255) NOT NULL,
    
    -- Context
    user_id UUID,
    business_account_id UUID,
    role_name VARCHAR(100),
    session_id VARCHAR(255),
    
    -- Evaluation
    evaluation_result BOOLEAN NOT NULL,
    evaluation_time_ms INTEGER,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    request_context JSONB DEFAULT '{}'::jsonb
);

-- ========================================
-- READ REPLICA CONFIGURATION
-- ========================================

-- Read Replica Configuration
CREATE TABLE read_replica_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    replica_name VARCHAR(255) NOT NULL,
    replica_type VARCHAR(50) NOT NULL, -- ANALYTICS, REPORTING, BACKUP, HOT_STANDBY
    
    -- Connection Details
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL DEFAULT 5432,
    database_name VARCHAR(255) NOT NULL,
    
    -- Performance Configuration
    max_connections INTEGER DEFAULT 100,
    connection_timeout_seconds INTEGER DEFAULT 30,
    query_timeout_seconds INTEGER DEFAULT 60,
    
    -- Usage Configuration
    is_primary BOOLEAN DEFAULT false, -- Primary read replica
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- Lower number = higher priority
    
    -- Load Balancing
    weight INTEGER DEFAULT 1, -- Weight for load balancing
    max_load_percentage INTEGER DEFAULT 80, -- Max load before switching
    
    -- Health Check
    health_check_interval_seconds INTEGER DEFAULT 30,
    last_health_check_at TIMESTAMP WITH TIME ZONE,
    is_healthy BOOLEAN DEFAULT true,
    
    -- Metadata
    region VARCHAR(100),
    availability_zone VARCHAR(100),
    tags JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Query Routing Rules
CREATE TABLE query_routing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(255) NOT NULL,
    
    -- Rule Configuration
    query_pattern TEXT NOT NULL, -- Regex or pattern for query matching
    query_type VARCHAR(50) NOT NULL, -- SELECT, ANALYTICS, REPORTING, AGGREGATE
    
    -- Routing Configuration
    target_replica_id UUID REFERENCES read_replica_configurations(id),
    fallback_to_primary BOOLEAN DEFAULT true,
    
    -- Conditions
    conditions JSONB DEFAULT '{}'::jsonb, -- Conditions for routing
    
    -- Performance
    max_execution_time_ms INTEGER,
    priority INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ASYNC PROCESSING SYSTEM
-- ========================================

-- Async Job Queue
CREATE TABLE async_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(100) NOT NULL, -- REPORT_GENERATION, DATA_EXPORT, AI_ANALYSIS, etc.
    job_category VARCHAR(50) NOT NULL, -- FINANCIAL, ANALYTICS, AI, SYSTEM
    
    -- Job Configuration
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Priority and Scheduling
    priority INTEGER DEFAULT 0, -- Higher number = higher priority
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    max_attempts INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 300,
    
    -- Status Tracking
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, RUNNING, COMPLETED, FAILED, CANCELLED
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Results
    result JSONB, -- Job result data
    error_message TEXT,
    error_details JSONB,
    
    -- Performance
    started_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    business_account_id UUID,
    correlation_id VARCHAR(255), -- For job grouping
    tags JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Async Job Dependencies
CREATE TABLE async_job_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES async_jobs(id) ON DELETE CASCADE,
    depends_on_job_id UUID NOT NULL REFERENCES async_jobs(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'SUCCESS', -- SUCCESS, COMPLETION, FAILURE
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(job_id, depends_on_job_id)
);

-- Heavy Report Jobs
CREATE TABLE heavy_report_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES async_jobs(id) ON DELETE CASCADE,
    
    -- Report Configuration
    report_type VARCHAR(100) NOT NULL, -- FINANCIAL_STATEMENTS, FORECAST_REPORT, EXECUTIVE_REPORT
    report_format VARCHAR(20) DEFAULT 'JSON', -- JSON, PDF, EXCEL, CSV
    
    -- Data Configuration
    business_account_id UUID NOT NULL,
    period_id UUID,
    date_range_start DATE,
    date_range_end DATE,
    
    -- Processing Configuration
    include_charts BOOLEAN DEFAULT false,
    include_narratives BOOLEAN DEFAULT false,
    include_comparisons BOOLEAN DEFAULT false,
    language VARCHAR(10) DEFAULT 'en',
    
    -- Output Configuration
    output_path VARCHAR(500),
    output_size_bytes INTEGER,
    download_url VARCHAR(1000),
    
    -- Performance
    records_processed INTEGER DEFAULT 0,
    processing_time_ms INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- PERFORMANCE MONITORING
-- ========================================

-- Query Performance Log
CREATE TABLE query_performance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Query Information
    query_hash VARCHAR(64) NOT NULL, -- Hash of normalized query
    query_type VARCHAR(50) NOT NULL, -- SELECT, INSERT, UPDATE, DELETE
    query_text TEXT,
    
    -- Execution Information
    execution_time_ms INTEGER NOT NULL,
    rows_affected INTEGER,
    rows_returned INTEGER,
    
    -- Database Information
    database_name VARCHAR(255),
    schema_name VARCHAR(255),
    table_names JSONB DEFAULT '[]'::jsonb,
    
    -- Connection Information
    connection_id VARCHAR(255),
    user_id UUID,
    business_account_id UUID,
    
    -- Replica Information
    used_replica_id UUID REFERENCES read_replica_configurations(id),
    was_routed BOOLEAN DEFAULT false,
    
    -- Performance Context
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    request_context JSONB DEFAULT '{}'::jsonb,
    
    -- Indexes Used
    indexes_used JSONB DEFAULT '[]'::jsonb,
    
    -- Slow Query Flag
    is_slow_query BOOLEAN DEFAULT false,
    slow_query_threshold_ms INTEGER DEFAULT 1000
);

-- System Performance Metrics
CREATE TABLE system_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Timestamp
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Database Metrics
    active_connections INTEGER,
    idle_connections INTEGER,
    total_connections INTEGER,
    
    -- Query Performance
    queries_per_second DECIMAL(10,2),
    avg_query_time_ms DECIMAL(10,2),
    slow_queries_count INTEGER,
    
    -- Replica Metrics
    replica_lag_seconds INTEGER,
    replica_status JSONB DEFAULT '{}'::jsonb,
    
    -- System Resources
    cpu_usage_percent DECIMAL(5,2),
    memory_usage_percent DECIMAL(5,2),
    disk_usage_percent DECIMAL(5,2),
    
    -- Application Metrics
    active_jobs INTEGER,
    pending_jobs INTEGER,
    failed_jobs INTEGER,
    
    -- Feature Flag Metrics
    flag_evaluations_per_second DECIMAL(10,2),
    active_flags_count INTEGER,
    
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ========================================
-- BACKWARD COMPATIBILITY
-- ========================================

-- API Version Management
CREATE TABLE api_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(50) NOT NULL, -- v1.0.0, v1.1.0, etc.
    api_name VARCHAR(100) NOT NULL, -- accounting, financial, ai, etc.
    
    -- Version Information
    is_deprecated BOOLEAN DEFAULT false,
    deprecation_date TIMESTAMP WITH TIME ZONE,
    sunset_date TIMESTAMP WITH TIME ZONE,
    
    -- Compatibility
    min_compatible_version VARCHAR(50),
    max_compatible_version VARCHAR(50),
    
    -- Migration Information
    migration_required BOOLEAN DEFAULT false,
    migration_script_path VARCHAR(500),
    migration_notes TEXT,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, DEPRECATED, SUNSET
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data Schema Evolution
CREATE TABLE schema_evolution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Evolution Information
    evolution_name VARCHAR(255) NOT NULL,
    evolution_type VARCHAR(50) NOT NULL, -- TABLE_ADD, TABLE_MODIFY, COLUMN_ADD, etc.
    
    -- Target Information
    table_name VARCHAR(255),
    column_name VARCHAR(255),
    
    -- Evolution Details
    description TEXT,
    sql_script TEXT,
    rollback_script TEXT,
    
    -- Compatibility
    is_breaking_change BOOLEAN DEFAULT false,
    backward_compatible BOOLEAN DEFAULT true,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED', -- PLANNED, IN_PROGRESS, COMPLETED, FAILED
    applied_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- MATERIALIZED VIEWS FOR MONITORING
-- ========================================

-- Feature Flag Usage Summary
CREATE MATERIALIZED VIEW mv_feature_flag_usage AS
SELECT 
    ff.flag_key,
    ff.flag_name,
    ff.category,
    ff.is_enabled,
    COUNT(feval.id) as total_evaluations,
    COUNT(feval.id) FILTER (WHERE feval.evaluation_result = true) as enabled_evaluations,
    ROUND(
        (COUNT(feval.id) FILTER (WHERE feval.evaluation_result = true) * 100.0 / 
         NULLIF(COUNT(feval.id), 0)), 2
    ) as enablement_percentage,
    AVG(feval.evaluation_time_ms) as avg_evaluation_time_ms,
    MAX(feval.evaluated_at) as last_evaluation_at
FROM feature_flags ff
LEFT JOIN feature_flag_evaluations feval ON ff.flag_key = feval.flag_key
WHERE ff.status = 'ACTIVE'
GROUP BY ff.id, ff.flag_key, ff.flag_name, ff.category, ff.is_enabled;

-- Async Job Performance Summary
CREATE MATERIALIZED VIEW mv_async_job_performance AS
SELECT 
    job_type,
    job_category,
    status,
    COUNT(*) as job_count,
    AVG(duration_seconds) as avg_duration_seconds,
    MAX(duration_seconds) as max_duration_seconds,
    AVG(attempts) as avg_attempts,
    COUNT(*) FILTER (WHERE status = 'FAILED') as failed_count,
    ROUND(
        (COUNT(*) FILTER (WHERE status = 'FAILED') * 100.0 / 
         NULLIF(COUNT(*), 0)), 2
    ) as failure_rate_percentage,
    MAX(created_at) as last_job_at
FROM async_jobs
GROUP BY job_type, job_category, status;

-- Query Performance Summary
CREATE MATERIALIZED VIEW mv_query_performance_summary AS
SELECT 
    query_type,
    database_name,
    COUNT(*) as query_count,
    AVG(execution_time_ms) as avg_execution_time_ms,
    MAX(execution_time_ms) as max_execution_time_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms) as p95_execution_time_ms,
    COUNT(*) FILTER (WHERE is_slow_query = true) as slow_query_count,
    ROUND(
        (COUNT(*) FILTER (WHERE is_slow_query = true) * 100.0 / 
         NULLIF(COUNT(*), 0)), 2
    ) as slow_query_percentage,
    MAX(timestamp) as last_query_at
FROM query_performance_log
WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY query_type, database_name;

-- ========================================
-- DATABASE FUNCTIONS FOR FUTURE-PROOFING
-- ========================================

-- Feature Flag Evaluation Function
CREATE OR REPLACE FUNCTION evaluate_feature_flag(
    p_flag_key VARCHAR(255),
    p_user_id UUID DEFAULT NULL,
    p_business_account_id UUID DEFAULT NULL,
    p_role_name VARCHAR(100) DEFAULT NULL,
    p_context JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
    v_flag_record RECORD;
    v_result BOOLEAN := false;
    v_start_time TIMESTAMP WITH TIME ZONE := NOW();
    v_evaluation_time_ms INTEGER;
BEGIN
    -- Get flag configuration
    SELECT * INTO v_flag_record
    FROM feature_flags 
    WHERE flag_key = p_flag_key 
    AND status = 'ACTIVE'
    AND (expires_at IS NULL OR expires_at > NOW());
    
    -- Flag not found or inactive
    IF NOT FOUND THEN
        v_result := false;
    ELSIF v_flag_record.flag_type = 'BOOLEAN' THEN
        v_result := v_flag_record.is_enabled;
    ELSIF v_flag_record.flag_type = 'PERCENTAGE' THEN
        -- Use user_id hash for consistent percentage rollout
        IF p_user_id IS NOT NULL THEN
            v_result := (hashtext(p_user_id::TEXT) % 100) < v_flag_record.rollout_percentage;
        ELSE
            v_result := v_flag_record.is_enabled;
        END IF;
    ELSIF v_flag_record.flag_type = 'TARGETED' THEN
        -- Check if user is in target list
        v_result := (
            p_user_id IS NOT NULL AND p_user_id = ANY(v_flag_record.target_users)
        ) OR (
            p_role_name IS NOT NULL AND p_role_name = ANY(v_flag_record.target_roles)
        ) OR (
            p_business_account_id IS NOT NULL AND p_business_account_id = ANY(v_flag_record.target_business_accounts)
        );
    ELSIF v_flag_record.flag_type = 'CONDITIONAL' THEN
        -- Complex conditions evaluation (simplified)
        v_result := v_flag_record.is_enabled;
    ELSE
        v_result := v_flag_record.is_enabled;
    END IF;
    
    -- Calculate evaluation time
    v_evaluation_time_ms := EXTRACT(EPOCH FROM (NOW() - v_start_time)) * 1000;
    
    -- Log evaluation
    INSERT INTO feature_flag_evaluations (
        flag_key, user_id, business_account_id, role_name,
        evaluation_result, evaluation_time_ms, request_context
    ) VALUES (
        p_flag_key, p_user_id, p_business_account_id, p_role_name,
        v_result, v_evaluation_time_ms, p_context
    );
    
    RETURN jsonb_build_object(
        'flag_key', p_flag_key,
        'enabled', v_result,
        'evaluation_time_ms', v_evaluation_time_ms,
        'flag_type', v_flag_record.flag_type,
        'evaluated_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Query Routing Function
CREATE OR REPLACE FUNCTION route_query_to_replica(
    p_query_text TEXT,
    p_query_type VARCHAR(50),
    p_user_id UUID DEFAULT NULL,
    p_business_account_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_replica_record RECORD;
    v_query_hash VARCHAR(64);
BEGIN
    -- Generate query hash
    v_query_hash := md5(p_query_text);
    
    -- Find matching routing rule
    SELECT rrc.* INTO v_replica_record
    FROM query_routing_rules qrr
    JOIN read_replica_configurations rrc ON qrr.target_replica_id = rrc.id
    WHERE qrr.is_active = true
    AND rrc.is_active = true
    AND rrc.is_healthy = true
    AND (
        p_query_text ~ qrr.query_pattern OR
        qrr.query_type = p_query_type
    )
    ORDER BY qrr.priority DESC, rrc.priority ASC
    LIMIT 1;
    
    -- No matching rule, use primary
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'use_replica', false,
            'replica_id', NULL,
            'reason', 'NO_MATCHING_RULE'
        );
    END IF;
    
    -- Check load conditions
    IF v_replica_record.max_load_percentage > 0 THEN
        -- Simplified load check (in real implementation, check actual load)
        RETURN jsonb_build_object(
            'use_replica', true,
            'replica_id', v_replica_record.id,
            'replica_name', v_replica_record.replica_name,
            'reason', 'RULE_MATCHED'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'use_replica', false,
        'replica_id', NULL,
        'reason', 'REPLICA_OVERLOADED'
    );
END;
$$ LANGUAGE plpgsql;

-- Async Job Creation Function
CREATE OR REPLACE FUNCTION create_async_job(
    p_job_type VARCHAR(100),
    p_job_category VARCHAR(50),
    p_payload JSONB DEFAULT '{}'::jsonb,
    p_parameters JSONB DEFAULT '{}'::jsonb,
    p_priority INTEGER DEFAULT 0,
    p_scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    p_business_account_id UUID DEFAULT NULL,
    p_created_by UUID DEFAULT NULL,
    p_correlation_id VARCHAR(255) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_job_id UUID;
BEGIN
    -- Create the job
    INSERT INTO async_jobs (
        job_type, job_category, payload, parameters,
        priority, scheduled_at, business_account_id,
        created_by, correlation_id
    ) VALUES (
        p_job_type, p_job_category, p_payload, p_parameters,
        p_priority, p_scheduled_at, p_business_account_id,
        p_created_by, p_correlation_id
    ) RETURNING id INTO v_job_id;
    
    RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;

-- Heavy Report Job Creation Function
CREATE OR REPLACE FUNCTION create_heavy_report_job(
    p_report_type VARCHAR(100),
    p_business_account_id UUID,
    p_period_id UUID DEFAULT NULL,
    p_date_range_start DATE DEFAULT NULL,
    p_date_range_end DATE DEFAULT NULL,
    p_report_format VARCHAR(20) DEFAULT 'JSON',
    p_include_charts BOOLEAN DEFAULT false,
    p_include_narratives BOOLEAN DEFAULT false,
    p_include_comparisons BOOLEAN DEFAULT false,
    p_language VARCHAR(10) DEFAULT 'en',
    p_priority INTEGER DEFAULT 0,
    p_created_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_job_id UUID;
    v_payload JSONB;
BEGIN
    -- Create payload for heavy report
    v_payload := jsonb_build_object(
        'report_type', p_report_type,
        'report_format', p_report_format,
        'include_charts', p_include_charts,
        'include_narratives', p_include_narratives,
        'include_comparisons', p_include_comparisons,
        'language', p_language
    );
    
    -- Create async job
    v_job_id := create_async_job(
        'HEAVY_REPORT_GENERATION',
        'FINANCIAL',
        v_payload,
        jsonb_build_object(
            'business_account_id', p_business_account_id,
            'period_id', p_period_id,
            'date_range_start', p_date_range_start,
            'date_range_end', p_date_range_end
        ),
        p_priority,
        NOW(),
        p_business_account_id,
        p_created_by
    );
    
    -- Create heavy report job record
    INSERT INTO heavy_report_jobs (
        job_id, report_type, report_format, business_account_id,
        period_id, date_range_start, date_range_end,
        include_charts, include_narratives, include_comparisons,
        language
    ) VALUES (
        v_job_id, p_report_type, p_report_format, p_business_account_id,
        p_period_id, p_date_range_start, p_date_range_end,
        p_include_charts, p_include_narratives, p_include_comparisons,
        p_language
    );
    
    RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;

-- Query Performance Logging Function
CREATE OR REPLACE FUNCTION log_query_performance(
    p_query_hash VARCHAR(64),
    p_query_type VARCHAR(50),
    p_query_text TEXT,
    p_execution_time_ms INTEGER,
    p_rows_affected INTEGER DEFAULT NULL,
    p_rows_returned INTEGER DEFAULT NULL,
    p_database_name VARCHAR(255) DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_business_account_id UUID DEFAULT NULL,
    p_used_replica_id UUID DEFAULT NULL,
    p_indexes_used JSONB DEFAULT '[]'::jsonb
) RETURNS void AS $$
DECLARE
    v_is_slow_query BOOLEAN;
    v_slow_query_threshold INTEGER := 1000;
BEGIN
    -- Determine if it's a slow query
    v_is_slow_query := p_execution_time_ms > v_slow_query_threshold;
    
    -- Log the query performance
    INSERT INTO query_performance_log (
        query_hash, query_type, query_text, execution_time_ms,
        rows_affected, rows_returned, database_name, user_id,
        business_account_id, used_replica_id, was_routed,
        indexes_used, is_slow_query, slow_query_threshold_ms
    ) VALUES (
        p_query_hash, p_query_type, p_query_text, p_execution_time_ms,
        p_rows_affected, p_rows_returned, p_database_name, p_user_id,
        p_business_account_id, p_used_replica_id,
        (p_used_replica_id IS NOT NULL),
        p_indexes_used, v_is_slow_query, v_slow_query_threshold
    );
END;
$$ LANGUAGE plpgsql;

-- System Performance Metrics Collection Function
CREATE OR REPLACE FUNCTION collect_system_metrics() RETURNS void AS $$
DECLARE
    v_active_connections INTEGER;
    v_queries_per_second DECIMAL(10,2);
    v_avg_query_time DECIMAL(10,2);
    v_slow_queries_count INTEGER;
    v_active_jobs INTEGER;
    v_pending_jobs INTEGER;
    v_failed_jobs INTEGER;
    v_flag_evaluations_per_second DECIMAL(10,2);
    v_active_flags_count INTEGER;
BEGIN
    -- Get database connection metrics
    SELECT COUNT(*) INTO v_active_connections
    FROM pg_stat_activity 
    WHERE state = 'active';
    
    -- Get query performance metrics (last minute)
    SELECT 
        COUNT(*)::DECIMAL / 60.0,
        AVG(execution_time_ms),
        COUNT(*) FILTER (WHERE is_slow_query = true)
    INTO v_queries_per_second, v_avg_query_time, v_slow_queries_count
    FROM query_performance_log 
    WHERE timestamp >= NOW() - INTERVAL '1 minute';
    
    -- Get async job metrics
    SELECT 
        COUNT(*) FILTER (WHERE status = 'RUNNING'),
        COUNT(*) FILTER (WHERE status = 'PENDING'),
        COUNT(*) FILTER (WHERE status = 'FAILED')
    INTO v_active_jobs, v_pending_jobs, v_failed_jobs
    FROM async_jobs;
    
    -- Get feature flag metrics (last minute)
    SELECT 
        COUNT(*)::DECIMAL / 60.0,
        COUNT(DISTINCT flag_key)
    INTO v_flag_evaluations_per_second, v_active_flags_count
    FROM feature_flag_evaluations 
    WHERE evaluated_at >= NOW() - INTERVAL '1 minute';
    
    -- Insert system metrics
    INSERT INTO system_performance_metrics (
        active_connections, queries_per_second, avg_query_time_ms,
        slow_queries_count, active_jobs, pending_jobs, failed_jobs,
        flag_evaluations_per_second, active_flags_count
    ) VALUES (
        v_active_connections, v_queries_per_second, v_avg_query_time,
        v_slow_queries_count, v_active_jobs, v_pending_jobs, v_failed_jobs,
        v_flag_evaluations_per_second, v_active_flags_count
    );
END;
$$ LANGUAGE plpgsql;

-- Refresh Future-Proofing Views Function
CREATE OR REPLACE FUNCTION refresh_future_proofing_views() RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_feature_flag_usage;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_async_job_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_query_performance_summary;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Feature Flags Indexes
CREATE INDEX idx_feature_flags_key_status ON feature_flags(flag_key, status);
CREATE INDEX idx_feature_flags_category ON feature_flags(category);
CREATE INDEX idx_feature_flags_priority ON feature_flags(priority DESC);
CREATE INDEX idx_feature_flag_evaluations_flag_key ON feature_flag_evaluations(flag_key);
CREATE INDEX idx_feature_flag_evaluations_evaluated_at ON feature_flag_evaluations(evaluated_at);

-- Read Replica Indexes
CREATE INDEX idx_read_replica_configurations_active ON read_replica_configurations(is_active, is_healthy);
CREATE INDEX idx_read_replica_configurations_priority ON read_replica_configurations(priority ASC);
CREATE INDEX idx_query_routing_rules_active ON query_routing_rules(is_active, query_type);

-- Async Jobs Indexes
CREATE INDEX idx_async_jobs_status_priority ON async_jobs(status, priority DESC);
CREATE INDEX idx_async_jobs_scheduled_at ON async_jobs(scheduled_at) WHERE status = 'PENDING';
CREATE INDEX idx_async_jobs_job_type_status ON async_jobs(job_type, status);
CREATE INDEX idx_async_jobs_business_account ON async_jobs(business_account_id);
CREATE INDEX idx_async_jobs_correlation_id ON async_jobs(correlation_id);
CREATE INDEX idx_heavy_report_jobs_business_account ON heavy_report_jobs(business_account_id);

-- Performance Monitoring Indexes
CREATE INDEX idx_query_performance_log_timestamp ON query_performance_log(timestamp);
CREATE INDEX idx_query_performance_log_query_hash ON query_performance_log(query_hash);
CREATE INDEX idx_query_performance_log_slow_query ON query_performance_log(is_slow_query, timestamp);
CREATE INDEX idx_system_performance_metrics_recorded_at ON system_performance_metrics(recorded_at);

-- Backward Compatibility Indexes
CREATE INDEX idx_api_versions_name_status ON api_versions(api_name, status);
CREATE INDEX idx_schema_evolution_table_name ON schema_evolution(table_name);
CREATE INDEX idx_schema_evolution_status ON schema_evolution(status);

-- ========================================
-- TRIGGERS
-- ========================================

-- Update updated_at timestamp
CREATE TRIGGER update_feature_flags_updated_at 
    BEFORE UPDATE ON feature_flags 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_read_replica_configurations_updated_at 
    BEFORE UPDATE ON read_replica_configurations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_query_routing_rules_updated_at 
    BEFORE UPDATE ON query_routing_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_async_jobs_updated_at 
    BEFORE UPDATE ON async_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_versions_updated_at 
    BEFORE UPDATE ON api_versions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schema_evolution_updated_at 
    BEFORE UPDATE ON schema_evolution 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- DEFAULT DATA
-- ========================================

-- Default Feature Flags
INSERT INTO feature_flags (flag_key, flag_name, description, flag_type, is_enabled, category, created_by) VALUES
('advanced_ai_analytics', 'Advanced AI Analytics', 'Enable advanced AI-powered analytics and insights', 'BOOLEAN', false, 'AI', '00000000-0000-0000-0000-000000000000'),
('real_time_reporting', 'Real-Time Reporting', 'Enable real-time financial reporting and dashboards', 'BOOLEAN', false, 'REPORTING', '00000000-0000-0000-0000-000000000000'),
('enhanced_forecasting', 'Enhanced Forecasting', 'Enable enhanced forecasting with Monte Carlo simulations', 'BOOLEAN', false, 'FINANCIAL', '00000000-0000-0000-0000-000000000000'),
('mobile_app_features', 'Mobile App Features', 'Enable mobile-specific features and optimizations', 'BOOLEAN', false, 'UI', '00000000-0000-0000-0000-000000000000'),
('beta_features', 'Beta Features', 'Enable beta features for testing', 'TARGETED', false, 'GENERAL', '00000000-0000-0000-0000-000000000000'),
('performance_monitoring', 'Performance Monitoring', 'Enable detailed performance monitoring and logging', 'BOOLEAN', true, 'SYSTEM', '00000000-0000-0000-0000-000000000000');

-- Default Read Replica Configuration
INSERT INTO read_replica_configurations (replica_name, replica_type, host, port, database_name, is_primary, created_at) VALUES
('analytics-replica-1', 'ANALYTICS', 'analytics-replica-1.internal', 5432, 'mnbara_platform', false, NOW()),
('reporting-replica-1', 'REPORTING', 'reporting-replica-1.internal', 5432, 'mnbara_platform', false, NOW()),
('hot-standby-1', 'HOT_STANDBY', 'hot-standby-1.internal', 5432, 'mnbara_platform', false, NOW());

-- Default Query Routing Rules
INSERT INTO query_routing_rules (rule_name, query_pattern, query_type, target_replica_id, fallback_to_primary) VALUES
('Analytics Queries', '^SELECT.*COUNT\(\*\).*FROM.*GROUP BY', 'ANALYTICS', (SELECT id FROM read_replica_configurations WHERE replica_name = 'analytics-replica-1' LIMIT 1), true),
('Reporting Queries', '^SELECT.*financial_statements', 'REPORTING', (SELECT id FROM read_replica_configurations WHERE replica_name = 'reporting-replica-1' LIMIT 1), true),
('Heavy Aggregations', '^SELECT.*SUM\(.*\).*GROUP BY.*HAVING', 'AGGREGATE', (SELECT id FROM read_replica_configurations WHERE replica_name = 'analytics-replica-1' LIMIT 1), true);

-- Default API Versions
INSERT INTO api_versions (version, api_name, status, created_at) VALUES
('v1.0.0', 'accounting', 'ACTIVE', NOW()),
('v1.0.0', 'financial', 'ACTIVE', NOW()),
('v1.0.0', 'ai', 'ACTIVE', NOW()),
('v1.0.0', 'reporting', 'ACTIVE', NOW()),
('v1.0.0', 'executive', 'ACTIVE', NOW());

-- ========================================
-- PERMISSIONS
-- ========================================

-- Grant permissions to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON feature_flags TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON feature_flag_evaluations TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON read_replica_configurations TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON query_routing_rules TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON async_jobs TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON async_job_dependencies TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON heavy_report_jobs TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON query_performance_log TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON system_performance_metrics TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON api_versions TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON schema_evolution TO app_user;

-- Grant permissions on materialized views
GRANT SELECT ON mv_feature_flag_usage TO app_user;
GRANT SELECT ON mv_async_job_performance TO app_user;
GRANT SELECT ON mv_query_performance_summary TO app_user;

-- Grant usage on functions
GRANT EXECUTE ON FUNCTION evaluate_feature_flag TO app_user;
GRANT EXECUTE ON FUNCTION route_query_to_replica TO app_user;
GRANT EXECUTE ON FUNCTION create_async_job TO app_user;
GRANT EXECUTE ON FUNCTION create_heavy_report_job TO app_user;
GRANT EXECUTE ON FUNCTION log_query_performance TO app_user;
GRANT EXECUTE ON FUNCTION collect_system_metrics TO app_user;
GRANT EXECUTE ON FUNCTION refresh_future_proofing_views TO app_user;

COMMIT;
