-- Migration: Stress and Load Validation - Sprint 11
-- Purpose: Create infrastructure for stress testing, load validation, and performance monitoring

-- ========================================
-- STRESS TEST CONFIGURATION
-- ========================================

-- Stress Test Scenarios
CREATE TABLE stress_test_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_name VARCHAR(255) NOT NULL,
    scenario_type VARCHAR(50) NOT NULL, -- FINANCIAL_CLOSE, WHATSAPP_COMMANDS, FORECAST_CALCULATION
    description TEXT,
    
    -- Test Configuration
    concurrent_users INTEGER NOT NULL DEFAULT 1,
    iterations_per_user INTEGER NOT NULL DEFAULT 1,
    duration_seconds INTEGER NOT NULL DEFAULT 60,
    ramp_up_seconds INTEGER DEFAULT 10,
    
    -- Load Parameters
    target_transactions_per_second INTEGER,
    target_response_time_ms INTEGER DEFAULT 1000,
    acceptable_error_rate DECIMAL(5,2) DEFAULT 1.0, -- percentage
    
    -- Test Data
    test_parameters JSONB DEFAULT '{}'::jsonb,
    test_data_config JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, RUNNING, COMPLETED, FAILED, CANCELLED
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stress Test Results
CREATE TABLE stress_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES stress_test_scenarios(id) ON DELETE CASCADE,
    
    -- Test Execution Details
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    
    -- Performance Metrics
    total_requests INTEGER NOT NULL,
    successful_requests INTEGER NOT NULL,
    failed_requests INTEGER NOT NULL,
    error_rate DECIMAL(5,2),
    
    -- Response Time Metrics
    avg_response_time_ms DECIMAL(10,2),
    min_response_time_ms INTEGER,
    max_response_time_ms INTEGER,
    p50_response_time_ms INTEGER,
    p95_response_time_ms INTEGER,
    p99_response_time_ms INTEGER,
    
    -- Throughput Metrics
    requests_per_second DECIMAL(10,2),
    peak_concurrent_users INTEGER,
    
    -- System Metrics
    cpu_usage_avg DECIMAL(5,2),
    memory_usage_avg DECIMAL(5,2),
    database_connections_avg INTEGER,
    
    -- Error Analysis
    error_breakdown JSONB, -- breakdown of error types
    timeout_count INTEGER DEFAULT 0,
    deadlock_count INTEGER DEFAULT 0,
    
    -- Data Integrity
    data_consistency_check BOOLEAN DEFAULT true,
    integrity_issues JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- FINANCIAL CLOSE STRESS TEST
-- ========================================

-- Financial Close Test Configuration
CREATE TABLE financial_close_test_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES stress_test_scenarios(id) ON DELETE CASCADE,
    
    -- Period Configuration
    test_period_count INTEGER NOT NULL DEFAULT 1,
    periods_per_batch INTEGER DEFAULT 10,
    concurrent_periods INTEGER DEFAULT 5,
    
    -- Close Operations
    include_journal_entries BOOLEAN DEFAULT true,
    include_financial_statements BOOLEAN DEFAULT true,
    include_period_locking BOOLEAN DEFAULT true,
    include_audit_logging BOOLEAN DEFAULT true,
    
    -- Data Volume
    journal_entries_per_period INTEGER DEFAULT 1000,
    accounts_per_chart INTEGER DEFAULT 100,
    users_per_close INTEGER DEFAULT 5,
    
    -- Validation Checks
    validate_double_entry BOOLEAN DEFAULT true,
    validate_period_locking BOOLEAN DEFAULT true,
    validate_audit_trail BOOLEAN DEFAULT true,
    validate_data_integrity BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Close Test Results
CREATE TABLE financial_close_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES stress_test_scenarios(id) ON DELETE CASCADE,
    
    -- Test Execution
    periods_closed INTEGER NOT NULL,
    periods_failed INTEGER NOT NULL,
    total_journal_entries_processed INTEGER NOT NULL,
    
    -- Performance Metrics
    avg_close_time_per_period_ms DECIMAL(10,2),
    max_close_time_per_period_ms INTEGER,
    total_close_time_ms INTEGER,
    
    -- Data Integrity
    double_entry_violations INTEGER DEFAULT 0,
    period_locking_violations INTEGER DEFAULT 0,
    audit_trail_gaps INTEGER DEFAULT 0,
    data_inconsistencies JSONB DEFAULT '[]'::jsonb,
    
    -- Concurrency Issues
    deadlock_count INTEGER DEFAULT 0,
    timeout_count INTEGER DEFAULT 0,
    lock_contention_count INTEGER DEFAULT 0,
    
    -- Resource Usage
    peak_database_connections INTEGER,
    peak_memory_usage_mb INTEGER,
    peak_cpu_usage DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- WHATSAPP COMMAND STRESS TEST
-- ========================================

-- WhatsApp Command Test Configuration
CREATE TABLE whatsapp_command_test_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES stress_test_scenarios(id) ON DELETE CASCADE,
    
    -- Command Configuration
    command_types JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of command types to test
    commands_per_second INTEGER DEFAULT 10,
    concurrent_sessions INTEGER DEFAULT 50,
    
    -- Message Configuration
    message_complexity VARCHAR(20) DEFAULT 'MEDIUM', -- SIMPLE, MEDIUM, COMPLEX
    include_attachments BOOLEAN DEFAULT false,
    include_multilingual BOOLEAN DEFAULT true,
    
    -- Processing Configuration
    include_n8n_workflows BOOLEAN DEFAULT true,
    include_ai_processing BOOLEAN DEFAULT true,
    include_database_operations BOOLEAN DEFAULT true,
    
    -- Validation
    validate_command_parsing BOOLEAN DEFAULT true,
    validate_permission_checks BOOLEAN DEFAULT true,
    validate_workflow_execution BOOLEAN DEFAULT true,
    validate_response_delivery BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Command Test Results
CREATE TABLE whatsapp_command_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES stress_test_scenarios(id) ON DELETE CASCADE,
    
    -- Test Execution
    commands_processed INTEGER NOT NULL,
    commands_failed INTEGER NOT NULL,
    commands_successful INTEGER NOT NULL,
    
    -- Performance Metrics
    avg_processing_time_ms DECIMAL(10,2),
    max_processing_time_ms INTEGER,
    min_processing_time_ms INTEGER,
    
    -- Command Breakdown
    command_performance JSONB, -- Performance by command type
    error_breakdown JSONB, -- Errors by command type
    
    -- System Metrics
    peak_concurrent_sessions INTEGER,
    queue_depth_max INTEGER,
    n8n_workflow_executions INTEGER,
    ai_processing_time_avg_ms DECIMAL(10,2),
    
    -- Quality Metrics
    command_parsing_accuracy DECIMAL(5,2),
    permission_check_accuracy DECIMAL(5,2),
    response_delivery_success_rate DECIMAL(5,2),
    
    -- Issues
    timeout_count INTEGER DEFAULT 0,
    parsing_errors INTEGER DEFAULT 0,
    permission_denied_count INTEGER DEFAULT 0,
    workflow_failures INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- FORECAST CALCULATION STRESS TEST
-- ========================================

-- Forecast Test Configuration
CREATE TABLE forecast_test_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES stress_test_scenarios(id) ON DELETE CASCADE,
    
    -- Forecast Configuration
    forecast_scenarios_per_test INTEGER DEFAULT 10,
    periods_per_forecast INTEGER DEFAULT 12,
    assumptions_per_scenario INTEGER DEFAULT 20,
    
    -- Calculation Complexity
    include_monte_carlo BOOLEAN DEFAULT false,
    monte_carlo_iterations INTEGER DEFAULT 1000,
    include_sensitivity_analysis BOOLEAN DEFAULT true,
    include_scenario_comparison BOOLEAN DEFAULT true,
    
    -- Data Volume
    historical_periods_per_forecast INTEGER DEFAULT 24,
    accounts_per_forecast INTEGER DEFAULT 50,
    ratios_per_forecast INTEGER DEFAULT 15,
    
    -- Concurrency
    concurrent_calculations INTEGER DEFAULT 5,
    calculation_timeout_seconds INTEGER DEFAULT 300,
    
    -- Validation
    validate_calculation_accuracy BOOLEAN DEFAULT true,
    validate_data_consistency BOOLEAN DEFAULT true,
    validate_result_integrity BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forecast Test Results
CREATE TABLE forecast_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES stress_test_scenarios(id) ON DELETE CASCADE,
    
    -- Test Execution
    forecasts_calculated INTEGER NOT NULL,
    forecasts_failed INTEGER NOT NULL,
    total_calculations_performed INTEGER NOT NULL,
    
    -- Performance Metrics
    avg_calculation_time_ms DECIMAL(10,2),
    max_calculation_time_ms INTEGER,
    min_calculation_time_ms INTEGER,
    total_calculation_time_ms INTEGER,
    
    -- Calculation Breakdown
    calculation_performance JSONB, -- Performance by calculation type
    complexity_performance JSONB, -- Performance by complexity level
    
    -- Resource Usage
    peak_concurrent_calculations INTEGER,
    peak_memory_usage_mb INTEGER,
    peak_cpu_usage DECIMAL(5,2),
    database_query_time_avg_ms DECIMAL(10,2),
    
    -- Accuracy and Integrity
    calculation_accuracy_score DECIMAL(5,2),
    data_consistency_violations INTEGER DEFAULT 0,
    result_integrity_issues JSONB DEFAULT '[]'::jsonb,
    
    -- Issues
    timeout_count INTEGER DEFAULT 0,
    memory_errors INTEGER DEFAULT 0,
    calculation_errors INTEGER DEFAULT 0,
    data_validation_errors INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- SYSTEM PERFORMANCE MONITORING
-- ========================================

-- Performance Metrics History
CREATE TABLE performance_metrics_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES stress_test_results(id),
    
    -- Timestamp
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- System Metrics
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(5,2),
    disk_usage DECIMAL(5,2),
    network_io DECIMAL(10,2),
    
    -- Database Metrics
    active_connections INTEGER,
    query_avg_time_ms DECIMAL(10,2),
    slow_queries_count INTEGER,
    lock_wait_time_ms INTEGER,
    
    -- Application Metrics
    active_users INTEGER,
    response_time_avg_ms DECIMAL(10,2),
    error_rate DECIMAL(5,2),
    throughput_rps DECIMAL(10,2),
    
    -- Queue Metrics
    queue_depth INTEGER,
    queue_processing_rate DECIMAL(10,2),
    queue_avg_wait_time_ms DECIMAL(10,2),
    
    -- Cache Metrics
    cache_hit_rate DECIMAL(5,2),
    cache_size_mb INTEGER,
    cache_evictions INTEGER,
    
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Data Integrity Validation Log
CREATE TABLE data_integrity_validation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES stress_test_results(id),
    
    validation_type VARCHAR(50) NOT NULL, -- DOUBLE_ENTRY, PERIOD_LOCKING, AUDIT_TRAIL, REFERENTIAL_INTEGRITY
    validation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Validation Results
    validation_status VARCHAR(20) NOT NULL, -- PASSED, FAILED, WARNING
    issues_found INTEGER DEFAULT 0,
    issues_fixed INTEGER DEFAULT 0,
    
    -- Issue Details
    issue_details JSONB DEFAULT '[]'::jsonb,
    fix_actions JSONB DEFAULT '[]'::jsonb,
    
    -- Performance Impact
    validation_time_ms INTEGER,
    system_impact VARCHAR(20), -- LOW, MEDIUM, HIGH
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- STRESS TEST AUTOMATION
-- ========================================

-- Automated Test Schedules
CREATE TABLE stress_test_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES stress_test_scenarios(id) ON DELETE CASCADE,
    
    schedule_name VARCHAR(255) NOT NULL,
    schedule_type VARCHAR(20) NOT NULL, -- DAILY, WEEKLY, MONTHLY, ON_DEMAND
    
    -- Schedule Configuration
    cron_expression VARCHAR(100), -- For complex scheduling
    run_time TIME, -- For daily scheduling
    run_day INTEGER, -- Day of week (0-6) for weekly
    run_date INTEGER, -- Day of month (1-31) for monthly
    
    -- Notification Settings
    notify_on_success BOOLEAN DEFAULT false,
    notify_on_failure BOOLEAN DEFAULT true,
    notification_emails JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stress Test Execution Log
CREATE TABLE stress_test_execution_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES stress_test_schedules(id),
    scenario_id UUID NOT NULL REFERENCES stress_test_scenarios(id) ON DELETE CASCADE,
    
    execution_status VARCHAR(20) NOT NULL, -- SCHEDULED, RUNNING, COMPLETED, FAILED, CANCELLED
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    
    -- Results Reference
    test_result_id UUID REFERENCES stress_test_results(id),
    
    -- Execution Context
    triggered_by VARCHAR(50), -- SCHEDULE, MANUAL, API
    triggered_by_user UUID REFERENCES users(id),
    execution_environment VARCHAR(50), -- PRODUCTION, STAGING, DEVELOPMENT
    
    -- Notifications
    notifications_sent JSONB DEFAULT '[]'::jsonb,
    notification_errors JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- MATERIALIZED VIEWS FOR MONITORING
-- ========================================

-- Stress Test Summary Dashboard
CREATE MATERIALIZED VIEW mv_stress_test_summary AS
SELECT 
    sts.scenario_type,
    COUNT(*) as total_scenarios,
    COUNT(*) FILTER (WHERE sts.status = 'COMPLETED') as completed_scenarios,
    COUNT(*) FILTER (WHERE sts.status = 'FAILED') as failed_scenarios,
    COUNT(*) FILTER (WHERE sts.status = 'RUNNING') as running_scenarios,
    
    AVG(str.duration_seconds) as avg_duration_seconds,
    MAX(str.duration_seconds) as max_duration_seconds,
    
    AVG(str.requests_per_second) as avg_throughput,
    MAX(str.requests_per_second) as max_throughput,
    
    AVG(str.error_rate) as avg_error_rate,
    MAX(str.error_rate) as max_error_rate,
    
    AVG(str.avg_response_time_ms) as avg_response_time,
    MAX(str.max_response_time_ms) as worst_response_time,
    
    MAX(str.created_at) as last_test_date
FROM stress_test_scenarios sts
LEFT JOIN stress_test_results str ON sts.id = str.scenario_id
GROUP BY sts.scenario_type;

-- Performance Trend Analysis
CREATE MATERIALIZED VIEW mv_performance_trends AS
SELECT 
    DATE_TRUNC('hour', pmh.recorded_at) as hour_bucket,
    AVG(pmh.cpu_usage) as avg_cpu_usage,
    MAX(pmh.cpu_usage) as max_cpu_usage,
    AVG(pmh.memory_usage) as avg_memory_usage,
    MAX(pmh.memory_usage) as max_memory_usage,
    AVG(pmh.response_time_avg_ms) as avg_response_time,
    MAX(pmh.active_users) as max_concurrent_users,
    AVG(pmh.throughput_rps) as avg_throughput,
    SUM(pmh.slow_queries_count) as total_slow_queries
FROM performance_metrics_history pmh
WHERE pmh.recorded_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', pmh.recorded_at)
ORDER BY hour_bucket DESC;

-- ========================================
-- DATABASE FUNCTIONS FOR STRESS TESTING
-- ========================================

-- Generate Test Data for Financial Close
CREATE OR REPLACE FUNCTION generate_financial_close_test_data(
    p_business_account_id UUID,
    p_period_count INTEGER DEFAULT 1,
    p_entries_per_period INTEGER DEFAULT 1000
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_generated_periods JSONB := '[]'::jsonb;
    v_generated_entries JSONB := '[]'::jsonb;
    v_period_counter INTEGER := 0;
    v_entry_counter INTEGER := 0;
    v_period_id UUID;
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    -- Generate test periods
    FOR v_period_counter IN 1..p_period_count LOOP
        v_start_date := CURRENT_DATE - (v_period_counter || ' months')::INTERVAL;
        v_end_date := v_start_date + INTERVAL '1 month' - INTERVAL '1 day';
        
        -- Create period
        INSERT INTO fiscal_periods (
            business_account_id, name, start_date, end_date, 
            period_type, status, is_current
        ) VALUES (
            p_business_account_id,
            'Test Period ' || v_period_counter,
            v_start_date,
            v_end_date,
            'MONTHLY',
            'OPEN',
            false
        ) RETURNING id INTO v_period_id;
        
        -- Generate journal entries for this period
        FOR v_entry_counter IN 1..p_entries_per_period LOOP
            INSERT INTO journal_entries (
                business_account_id, fiscal_period_id, entry_number,
                entry_date, description, status, total_debit, total_credit
            ) VALUES (
                p_business_account_id,
                v_period_id,
                'JE-TEST-' || v_period_counter || '-' || v_entry_counter,
                v_start_date + (v_entry_counter || ' days')::INTERVAL,
                'Test journal entry ' || v_entry_counter,
                'POSTED',
                (random() * 10000)::DECIMAL(10,2),
                (random() * 10000)::DECIMAL(10,2)
            );
        END LOOP;
        
        v_generated_periods := v_generated_periods || jsonb_build_object(
            'period_id', v_period_id,
            'period_number', v_period_counter,
            'entries_count', p_entries_per_period
        );
    END LOOP;
    
    v_result := jsonb_build_object(
        'business_account_id', p_business_account_id,
        'periods_generated', p_period_count,
        'entries_per_period', p_entries_per_period,
        'total_entries', p_period_count * p_entries_per_period,
        'periods', v_generated_periods,
        'generated_at', NOW()
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Simulate Concurrent Financial Close
CREATE OR REPLACE FUNCTION simulate_concurrent_financial_close(
    p_business_account_id UUID,
    p_concurrent_periods INTEGER DEFAULT 5,
    p_close_timeout_seconds INTEGER DEFAULT 300
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_start_time TIMESTAMP WITH TIME ZONE := NOW();
    v_close_results JSONB := '[]'::jsonb;
    v_period_record RECORD;
    v_close_success BOOLEAN := true;
    v_error_message TEXT;
BEGIN
    -- Get open periods to close
    FOR v_period_record IN 
        SELECT id, name 
        FROM fiscal_periods 
        WHERE business_account_id = p_business_account_id 
        AND status = 'OPEN'
        LIMIT p_concurrent_periods
    LOOP
        BEGIN
            -- Attempt to close period
            PERFORM lock_fiscal_period(v_period_record.id, 'Test User', 'Stress test close');
            
            -- Generate financial statements
            PERFORM generate_financial_statements(v_period_record.id);
            
            -- Mark as closed
            UPDATE fiscal_periods 
            SET status = 'CLOSED', closed_at = NOW() 
            WHERE id = v_period_record.id;
            
            v_close_results := v_close_results || jsonb_build_object(
                'period_id', v_period_record.id,
                'period_name', v_period_record.name,
                'status', 'CLOSED',
                'closed_at', NOW(),
                'success', true
            );
            
        EXCEPTION WHEN OTHERS THEN
            v_close_success := false;
            v_error_message := SQLERRM;
            
            v_close_results := v_close_results || jsonb_build_object(
                'period_id', v_period_record.id,
                'period_name', v_period_record.name,
                'status', 'FAILED',
                'error', v_error_message,
                'success', false
            );
        END;
    END LOOP;
    
    v_result := jsonb_build_object(
        'business_account_id', p_business_account_id,
        'concurrent_periods', p_concurrent_periods,
        'start_time', v_start_time,
        'end_time', NOW(),
        'duration_seconds', EXTRACT(EPOCH FROM (NOW() - v_start_time)),
        'success', v_close_success,
        'results', v_close_results
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Simulate WhatsApp Command Load
CREATE OR REPLACE FUNCTION simulate_whatsapp_command_load(
    p_business_account_id UUID,
    p_commands_per_second INTEGER DEFAULT 10,
    p_duration_seconds INTEGER DEFAULT 60,
    p_command_types JSONB DEFAULT '["balance", "report", "alerts"]'::jsonb
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_start_time TIMESTAMP WITH TIME ZONE := NOW();
    v_end_time TIMESTAMP WITH TIME ZONE := v_start_time + (p_duration_seconds || ' seconds')::INTERVAL;
    v_command_counter INTEGER := 0;
    v_total_commands INTEGER := p_commands_per_second * p_duration_seconds;
    v_processed_commands INTEGER := 0;
    v_failed_commands INTEGER := 0;
    v_command_results JSONB := '[]'::jsonb;
    v_command_type TEXT;
    v_processing_time_ms INTEGER;
    v_success BOOLEAN;
BEGIN
    -- Simulate command processing
    WHILE NOW() < v_end_time AND v_command_counter < v_total_commands LOOP
        -- Select random command type
        v_command_type := (p_command_types -> (floor(random() * array_length(p_command_types::text[], 1)) + 1))::text;
        
        BEGIN
            -- Simulate command processing time
            v_processing_time_ms := (random() * 500 + 50)::INTEGER; -- 50-550ms
            
            -- Simulate command execution
            IF random() > 0.05 THEN -- 95% success rate
                v_success := true;
                v_processed_commands := v_processed_commands + 1;
            ELSE
                v_success := false;
                v_failed_commands := v_failed_commands + 1;
            END IF;
            
            v_command_results := v_command_results || jsonb_build_object(
                'command_number', v_command_counter + 1,
                'command_type', v_command_type,
                'processing_time_ms', v_processing_time_ms,
                'success', v_success,
                'timestamp', NOW()
            );
            
        EXCEPTION WHEN OTHERS THEN
            v_failed_commands := v_failed_commands + 1;
            v_success := false;
        END;
        
        v_command_counter := v_command_counter + 1;
        
        -- Rate limiting - wait to maintain commands per second
        PERFORM pg_sleep(1.0 / p_commands_per_second);
    END LOOP;
    
    v_result := jsonb_build_object(
        'business_account_id', p_business_account_id,
        'commands_per_second', p_commands_per_second,
        'duration_seconds', p_duration_seconds,
        'total_commands', v_command_counter,
        'processed_commands', v_processed_commands,
        'failed_commands', v_failed_commands,
        'success_rate', CASE 
            WHEN v_command_counter > 0 THEN (v_processed_commands::DECIMAL / v_command_counter::DECIMAL) * 100
            ELSE 0
        END,
        'avg_processing_time_ms', CASE 
            WHEN v_command_counter > 0 THEN (
                SELECT AVG((result->>'processing_time_ms')::INTEGER) 
                FROM jsonb_array_elements(v_command_results) AS result
            )
            ELSE 0
        END,
        'start_time', v_start_time,
        'end_time', NOW(),
        'actual_duration_seconds', EXTRACT(EPOCH FROM (NOW() - v_start_time)),
        'results', v_command_results
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Stress Test Forecast Recalculation
CREATE OR REPLACE FUNCTION stress_test_forecast_recalculation(
    p_business_account_id UUID,
    p_concurrent_calculations INTEGER DEFAULT 5,
    p_scenarios_per_calculation INTEGER DEFAULT 10,
    p_periods_per_scenario INTEGER DEFAULT 12
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_start_time TIMESTAMP WITH TIME ZONE := NOW();
    v_calculation_counter INTEGER := 0;
    v_total_calculations INTEGER := p_concurrent_calculations * p_scenarios_per_calculation;
    v_successful_calculations INTEGER := 0;
    v_failed_calculations INTEGER := 0;
    v_calculation_results JSONB := '[]'::jsonb;
    v_calculation_time_ms INTEGER;
    v_success BOOLEAN;
BEGIN
    -- Simulate forecast calculations
    FOR v_calculation_counter IN 1..v_total_calculations LOOP
        BEGIN
            -- Simulate calculation time (complex calculations take longer)
            v_calculation_time_ms := (random() * 2000 + 500)::INTEGER; -- 500-2500ms
            
            -- Simulate forecast calculation
            IF random() > 0.02 THEN -- 98% success rate
                v_success := true;
                v_successful_calculations := v_successful_calculations + 1;
                
                -- Simulate complex calculation steps
                PERFORM pg_sleep(v_calculation_time_ms / 1000.0);
                
            ELSE
                v_success := false;
                v_failed_calculations := v_failed_calculations + 1;
            END IF;
            
            v_calculation_results := v_calculation_results || jsonb_build_object(
                'calculation_number', v_calculation_counter,
                'calculation_time_ms', v_calculation_time_ms,
                'success', v_success,
                'scenarios_calculated', p_scenarios_per_calculation,
                'periods_per_scenario', p_periods_per_scenario,
                'timestamp', NOW()
            );
            
        EXCEPTION WHEN OTHERS THEN
            v_failed_calculations := v_failed_calculations + 1;
            v_success := false;
        END;
    END LOOP;
    
    v_result := jsonb_build_object(
        'business_account_id', p_business_account_id,
        'concurrent_calculations', p_concurrent_calculations,
        'scenarios_per_calculation', p_scenarios_per_calculation,
        'periods_per_scenario', p_periods_per_scenario,
        'total_calculations', v_calculation_counter,
        'successful_calculations', v_successful_calculations,
        'failed_calculations', v_failed_calculations,
        'success_rate', CASE 
            WHEN v_calculation_counter > 0 THEN (v_successful_calculations::DECIMAL / v_calculation_counter::DECIMAL) * 100
            ELSE 0
        END,
        'avg_calculation_time_ms', CASE 
            WHEN v_calculation_counter > 0 THEN (
                SELECT AVG((result->>'calculation_time_ms')::INTEGER) 
                FROM jsonb_array_elements(v_calculation_results) AS result
            )
            ELSE 0
        END,
        'start_time', v_start_time,
        'end_time', NOW(),
        'duration_seconds', EXTRACT(EPOCH FROM (NOW() - v_start_time)),
        'results', v_calculation_results
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Validate Data Integrity After Stress Test
CREATE OR REPLACE FUNCTION validate_data_integrity(
    p_test_id UUID,
    p_business_account_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_integrity_checks JSONB := '[]'::jsonb;
    v_total_issues INTEGER := 0;
    v_check_passed BOOLEAN := true;
    
    -- Double-entry validation
    v_double_entry_issues INTEGER;
    v_period_locking_issues INTEGER;
    v_audit_trail_issues INTEGER;
    v_referential_integrity_issues INTEGER;
BEGIN
    -- Check double-entry balance
    SELECT COUNT(*) INTO v_double_entry_issues
    FROM (
        SELECT je.id
        FROM journal_entries je
        WHERE je.business_account_id = p_business_account_id
        AND ABS(je.total_debit - je.total_credit) > 0.01
    ) AS unbalanced_entries;
    
    v_integrity_checks := v_integrity_checks || jsonb_build_object(
        'check_type', 'DOUBLE_ENTRY_BALANCE',
        'issues_found', v_double_entry_issues,
        'passed', v_double_entry_issues = 0
    );
    
    -- Check period locking consistency
    SELECT COUNT(*) INTO v_period_locking_issues
    FROM (
        SELECT fp.id
        FROM fiscal_periods fp
        JOIN journal_entries je ON fp.id = je.fiscal_period_id
        WHERE fp.business_account_id = p_business_account_id
        AND fp.status = 'LOCKED'
        AND je.created_at > fp.locked_at
    ) AS locked_period_violations;
    
    v_integrity_checks := v_integrity_checks || jsonb_build_object(
        'check_type', 'PERIOD_LOCKING_CONSISTENCY',
        'issues_found', v_period_locking_issues,
        'passed', v_period_locking_issues = 0
    );
    
    -- Check audit trail completeness
    SELECT COUNT(*) INTO v_audit_trail_issues
    FROM (
        SELECT je.id
        FROM journal_entries je
        LEFT JOIN accounting_audit_log aal ON 
            aal.entity_type = 'JOURNAL_ENTRY' 
            AND aal.entity_id = je.id::TEXT
        WHERE je.business_account_id = p_business_account_id
        AND je.status = 'POSTED'
        AND aal.id IS NULL
    ) AS missing_audit_entries;
    
    v_integrity_checks := v_integrity_checks || jsonb_build_object(
        'check_type', 'AUDIT_TRAIL_COMPLETENESS',
        'issues_found', v_audit_trail_issues,
        'passed', v_audit_trail_issues = 0
    );
    
    -- Check referential integrity
    SELECT COUNT(*) INTO v_referential_integrity_issues
    FROM (
        SELECT jel.id
        FROM journal_entry_lines jel
        LEFT JOIN chart_of_accounts coa ON jel.account_id = coa.id
        WHERE coa.id IS NULL
    ) AS orphaned_lines;
    
    v_integrity_checks := v_integrity_checks || jsonb_build_object(
        'check_type', 'REFERENTIAL_INTEGRITY',
        'issues_found', v_referential_integrity_issues,
        'passed', v_referential_integrity_issues = 0
    );
    
    v_total_issues := v_double_entry_issues + v_period_locking_issues + 
                    v_audit_trail_issues + v_referential_integrity_issues;
    v_check_passed := v_total_issues = 0;
    
    -- Log validation results
    INSERT INTO data_integrity_validation_log (
        test_id, validation_type, validation_status, issues_found, issue_details
    ) VALUES (
        p_test_id,
        'COMPREHENSIVE_INTEGRITY',
        CASE WHEN v_check_passed THEN 'PASSED' ELSE 'FAILED' END,
        v_total_issues,
        v_integrity_checks
    );
    
    v_result := jsonb_build_object(
        'test_id', p_test_id,
        'business_account_id', p_business_account_id,
        'validation_timestamp', NOW(),
        'total_issues', v_total_issues,
        'validation_passed', v_check_passed,
        'integrity_checks', v_integrity_checks,
        'validation_time_ms', EXTRACT(EPOCH FROM (NOW() - NOW()) * 1000) -- Placeholder
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Refresh Stress Test Views Function
CREATE OR REPLACE FUNCTION refresh_stress_test_views() RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stress_test_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_performance_trends;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Stress Test Tables Indexes
CREATE INDEX idx_stress_test_scenarios_type_status ON stress_test_scenarios(scenario_type, status);
CREATE INDEX idx_stress_test_scenarios_created_by ON stress_test_scenarios(created_by);
CREATE INDEX idx_stress_test_results_scenario_id ON stress_test_results(scenario_id);
CREATE INDEX idx_stress_test_results_started_at ON stress_test_results(started_at);

-- Financial Close Test Indexes
CREATE INDEX idx_financial_close_test_config_scenario ON financial_close_test_config(scenario_id);
CREATE INDEX idx_financial_close_test_results_scenario ON financial_close_test_results(scenario_id);

-- WhatsApp Command Test Indexes
CREATE INDEX idx_whatsapp_command_test_config_scenario ON whatsapp_command_test_config(scenario_id);
CREATE INDEX idx_whatsapp_command_test_results_scenario ON whatsapp_command_test_results(scenario_id);

-- Forecast Test Indexes
CREATE INDEX idx_forecast_test_config_scenario ON forecast_test_config(scenario_id);
CREATE INDEX idx_forecast_test_results_scenario ON forecast_test_results(scenario_id);

-- Performance Monitoring Indexes
CREATE INDEX idx_performance_metrics_history_test_id ON performance_metrics_history(test_id);
CREATE INDEX idx_performance_metrics_history_recorded_at ON performance_metrics_history(recorded_at);
CREATE INDEX idx_data_integrity_validation_log_test_id ON data_integrity_validation_log(test_id);

-- Automation Indexes
CREATE INDEX idx_stress_test_schedules_active_next_run ON stress_test_schedules(is_active, next_run_at);
CREATE INDEX idx_stress_test_execution_log_scenario ON stress_test_execution_log(scenario_id);
CREATE INDEX idx_stress_test_execution_log_status ON stress_test_execution_log(execution_status);

-- ========================================
-- TRIGGERS
-- ========================================

-- Update updated_at timestamp
CREATE TRIGGER update_stress_test_scenarios_updated_at 
    BEFORE UPDATE ON stress_test_scenarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stress_test_schedules_updated_at 
    BEFORE UPDATE ON stress_test_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- DEFAULT DATA
-- ========================================

-- Default Stress Test Scenarios
INSERT INTO stress_test_scenarios (scenario_name, scenario_type, description, concurrent_users, iterations_per_user, duration_seconds, created_by) VALUES
('Financial Close Load Test', 'FINANCIAL_CLOSE', 'Test concurrent financial close operations under load', 10, 5, 300, '00000000-0000-0000-0000-000000000000'),
('WhatsApp Command Stress Test', 'WHATSAPP_COMMANDS', 'High-volume WhatsApp command processing test', 100, 50, 120, '00000000-0000-0000-0000-000000000000'),
('Forecast Calculation Stress Test', 'FORECAST_CALCULATION', 'Stress test forecast recalculation performance', 20, 10, 180, '00000000-0000-0000-0000-000000000000'),
('Mixed Load Test', 'MIXED_LOAD', 'Combined stress test with all operations', 50, 20, 300, '00000000-0000-0000-0000-000000000000');

-- ========================================
-- PERMISSIONS
-- ========================================

-- Grant permissions to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON stress_test_scenarios TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON stress_test_results TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_close_test_config TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_close_test_results TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_command_test_config TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_command_test_results TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON forecast_test_config TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON forecast_test_results TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON performance_metrics_history TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON data_integrity_validation_log TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON stress_test_schedules TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON stress_test_execution_log TO app_user;

-- Grant permissions on materialized views
GRANT SELECT ON mv_stress_test_summary TO app_user;
GRANT SELECT ON mv_performance_trends TO app_user;

-- Grant usage on functions
GRANT EXECUTE ON FUNCTION generate_financial_close_test_data TO app_user;
GRANT EXECUTE ON FUNCTION simulate_concurrent_financial_close TO app_user;
GRANT EXECUTE ON FUNCTION simulate_whatsapp_command_load TO app_user;
GRANT EXECUTE ON FUNCTION stress_test_forecast_recalculation TO app_user;
GRANT EXECUTE ON FUNCTION validate_data_integrity TO app_user;
GRANT EXECUTE ON FUNCTION refresh_stress_test_views TO app_user;

COMMIT;
