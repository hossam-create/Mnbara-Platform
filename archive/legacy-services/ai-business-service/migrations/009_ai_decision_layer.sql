-- Migration: AI Decision Layer - Sprint 9
-- Purpose: Build AI Recommendation Engine, What-If Simulation Engine, Proactive Alerts System, Decision Integration Layer

-- ========================================
-- AI RECOMMENDATION ENGINE
-- ========================================

-- AI Recommendations Table
CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) NOT NULL, -- COST_REDUCTION, PRICING_OPTIMIZATION, CASH_FLOW_IMPROVEMENT, WORKING_CAPITAL
    category VARCHAR(20) NOT NULL DEFAULT 'IMMEDIATE', -- IMMEDIATE, SHORT_TERM, STRATEGIC
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    action_steps JSONB NOT NULL, -- Array of action steps
    confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    impact_estimation JSONB NOT NULL, -- {dollar_value: number, percentage: number, timeframe: string}
    implementation_effort VARCHAR(10) NOT NULL CHECK (implementation_effort IN ('LOW', 'MEDIUM', 'HIGH')),
    priority INTEGER NOT NULL DEFAULT 1, -- 1-10, higher = more important
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED, IMPLEMENTED, COMPLETED
    accepted_by UUID REFERENCES users(id),
    accepted_at TIMESTAMP WITH TIME ZONE,
    implemented_by UUID REFERENCES users(id),
    implemented_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    actual_impact JSONB, -- Actual results after implementation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Recommendation Categories
CREATE TABLE recommendation_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7), -- hex color
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommendation Impact Tracking
CREATE TABLE recommendation_impact_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID NOT NULL REFERENCES ai_recommendations(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL, -- revenue, costs, cash_flow, etc.
    baseline_value DECIMAL(20,2) NOT NULL, -- Value before recommendation
    target_value DECIMAL(20,2) NOT NULL, -- Expected value after implementation
    actual_value DECIMAL(20,2), -- Actual value after implementation
    measurement_date DATE NOT NULL,
    variance_percentage DECIMAL(10,2), -- (actual - target) / target * 100
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- WHAT-IF SIMULATION ENGINE
-- ========================================

-- Simulation Scenarios
CREATE TABLE simulation_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scenario_type VARCHAR(50) NOT NULL, -- REVENUE_CHANGE, COST_STRUCTURE, PRICING_ADJUSTMENT, MARKET_CONDITION
    base_period_id UUID NOT NULL REFERENCES fiscal_periods(id), -- Base period for simulation
    simulation_parameters JSONB NOT NULL, -- Simulation input parameters
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, RUNNING, COMPLETED, ERROR
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Simulation Parameters
CREATE TABLE simulation_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES simulation_scenarios(id) ON DELETE CASCADE,
    parameter_name VARCHAR(100) NOT NULL, -- revenue_growth_rate, cost_reduction_percentage, etc.
    parameter_type VARCHAR(50) NOT NULL, -- PERCENTAGE, FIXED_AMOUNT, RATIO
    baseline_value DECIMAL(20,2) NOT NULL, -- Current value
    simulated_value DECIMAL(20,2) NOT NULL, -- Simulated value
    impact_area VARCHAR(100) NOT NULL, -- revenue, costs, cash_flow, balance_sheet
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simulation Results
CREATE TABLE simulation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES simulation_scenarios(id) ON DELETE CASCADE,
    result_type VARCHAR(50) NOT NULL, -- INCOME_STATEMENT, BALANCE_SHEET, CASH_FLOW, RATIOS
    period_id UUID REFERENCES fiscal_periods(id),
    financial_data JSONB NOT NULL, -- Complete financial statement data
    key_metrics JSONB NOT NULL, -- Key metrics like revenue, profit, cash flow
    comparison_to_baseline JSONB, -- Comparison with base period
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scenario Comparisons
CREATE TABLE scenario_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    scenario_ids UUID[] NOT NULL, -- Array of scenario IDs to compare
    comparison_metrics JSONB NOT NULL, -- Metrics to compare
    comparison_results JSONB NOT NULL, -- Comparison results
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- PROACTIVE ALERTS SYSTEM
-- ========================================

-- Alert Rules
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    description TEXT,
    metric_name VARCHAR(100) NOT NULL, -- current_ratio, cash_flow, profit_margin, etc.
    condition_operator VARCHAR(10) NOT NULL, -- LT, GT, LTE, GTE, EQ, NE
    threshold_value DECIMAL(20,2) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'WARNING', 'INFO')),
    frequency VARCHAR(20) NOT NULL DEFAULT 'REAL_TIME', -- REAL_TIME, DAILY, WEEKLY, MONTHLY
    notification_channels JSONB NOT NULL DEFAULT '["WHATSAPP"]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert Thresholds
CREATE TABLE alert_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
    threshold_type VARCHAR(50) NOT NULL, -- CRITICAL, WARNING, INFO
    threshold_value DECIMAL(20,2) NOT NULL,
    action_required TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert Notifications
CREATE TABLE alert_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    alert_title VARCHAR(255) NOT NULL,
    alert_message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    metric_value DECIMAL(20,2) NOT NULL,
    threshold_value DECIMAL(20,2) NOT NULL,
    variance_percentage DECIMAL(10,2),
    notification_channels JSONB NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert Acknowledgments
CREATE TABLE alert_acknowledgments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES alert_notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    acknowledgment_type VARCHAR(50) NOT NULL, -- ACKNOWLEDGED, DISMISSED, ESCALATED
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- DECISION INTEGRATION LAYER
-- ========================================

-- Decision Workflows
CREATE TABLE decision_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    workflow_name VARCHAR(255) NOT NULL,
    workflow_type VARCHAR(50) NOT NULL, -- RECOMMENDATION_IMPLEMENTATION, SIMULATION_ANALYSIS, ALERT_RESPONSE
    trigger_event JSONB NOT NULL, -- What triggered this workflow
    workflow_steps JSONB NOT NULL, -- Array of workflow steps
    current_step INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, CANCELLED, ERROR
    initiated_by UUID NOT NULL REFERENCES users(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Decision Outcomes
CREATE TABLE decision_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES decision_workflows(id) ON DELETE CASCADE,
    decision_type VARCHAR(50) NOT NULL, -- RECOMMENDATION_ACCEPTED, SIMULATION_CHOSEN, ALERT_RESOLVED
    decision_data JSONB NOT NULL, -- Decision details
    expected_outcome JSONB, -- Expected results
    actual_outcome JSONB, -- Actual results
    outcome_date DATE,
    success_rating INTEGER CHECK (success_rating >= 1 AND success_rating <= 5),
    lessons_learned TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Decision Impact Analysis
CREATE TABLE decision_impact_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outcome_id UUID NOT NULL REFERENCES decision_outcomes(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    baseline_value DECIMAL(20,2) NOT NULL,
    target_value DECIMAL(20,2),
    actual_value DECIMAL(20,2),
    impact_percentage DECIMAL(10,2),
    analysis_period_start DATE NOT NULL,
    analysis_period_end DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Decision Learning Data
CREATE TABLE decision_learning_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    decision_context JSONB NOT NULL, -- Context when decision was made
    decision_taken JSONB NOT NULL, -- What decision was made
    outcome_data JSONB NOT NULL, -- What happened
    success_indicators JSONB, -- Success metrics
    learning_points JSONB, -- Key learnings
    model_version VARCHAR(50), -- AI model version for future improvements
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ========================================

-- Active Recommendations Summary
CREATE MATERIALIZED VIEW mv_active_recommendations AS
SELECT 
    ba.id as business_account_id,
    ba.name as business_name,
    COUNT(*) as total_recommendations,
    COUNT(*) FILTER (WHERE category = 'IMMEDIATE') as immediate_count,
    COUNT(*) FILTER (WHERE category = 'SHORT_TERM') as short_term_count,
    COUNT(*) FILTER (WHERE category = 'STRATEGIC') as strategic_count,
    AVG(confidence_score) as avg_confidence,
    COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
    COUNT(*) FILTER (WHERE status = 'ACCEPTED') as accepted_count,
    COUNT(*) FILTER (WHERE status = 'IMPLEMENTED') as implemented_count
FROM business_accounts ba
LEFT JOIN ai_recommendations ar ON ba.id = ar.business_account_id
WHERE ar.status IN ('PENDING', 'ACCEPTED', 'IMPLEMENTED') OR ar.status IS NULL
GROUP BY ba.id, ba.name;

-- Active Alerts Summary
CREATE MATERIALIZED VIEW mv_active_alerts AS
SELECT 
    ba.id as business_account_id,
    ba.name as business_name,
    COUNT(*) FILTER (WHERE severity = 'CRITICAL' AND resolved_at IS NULL) as critical_alerts,
    COUNT(*) FILTER (WHERE severity = 'WARNING' AND resolved_at IS NULL) as warning_alerts,
    COUNT(*) FILTER (WHERE severity = 'INFO' AND resolved_at IS NULL) as info_alerts,
    COUNT(*) FILTER (WHERE resolved_at IS NULL) as total_active_alerts,
    COUNT(*) FILTER (WHERE acknowledged_at IS NULL AND resolved_at IS NULL) as unacknowledged_alerts
FROM business_accounts ba
LEFT JOIN alert_notifications an ON ba.id = an.business_account_id
WHERE an.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ba.id, ba.name;

-- Decision Success Metrics
CREATE MATERIALIZED VIEW mv_decision_success_metrics AS
SELECT 
    ba.id as business_account_id,
    ba.name as business_name,
    COUNT(do.id) as total_decisions,
    AVG(do.success_rating) as avg_success_rating,
    COUNT(*) FILTER (WHERE do.success_rating >= 4) as successful_decisions,
    COUNT(*) FILTER (WHERE do.success_rating <= 2) as unsuccessful_decisions,
    AVG(CASE WHEN do.actual_outcome IS NOT NULL THEN 
        (do.actual_outcome->>'roi')::DECIMAL(10,2) 
    END) as avg_roi
FROM business_accounts ba
LEFT JOIN decision_workflows dw ON ba.id = dw.business_account_id
LEFT JOIN decision_outcomes do ON dw.id = do.workflow_id
WHERE do.success_rating IS NOT NULL
GROUP BY ba.id, ba.name;

-- ========================================
-- DATABASE FUNCTIONS
-- ========================================

-- Generate AI Recommendations Function
CREATE OR REPLACE FUNCTION generate_ai_recommendations(
    p_business_account_id UUID,
    p_recommendation_type VARCHAR(50) DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_financial_data JSONB;
    v_ratios JSONB;
    v_recommendations JSONB[] := '{}';
BEGIN
    -- Get latest financial data
    SELECT jsonb_agg(
        jsonb_build_object(
            'period', fp.name,
            'revenue', fs.revenue,
            'expenses', fs.expenses,
            'profit', fs.profit,
            'cash_flow', fs.cash_flow
        )
    ) INTO v_financial_data
    FROM financial_statements fs
    JOIN fiscal_periods fp ON fs.fiscal_period_id = fp.id
    WHERE fs.business_account_id = p_business_account_id
    AND fp.end_date >= CURRENT_DATE - INTERVAL '12 months'
    ORDER BY fp.end_date DESC
    LIMIT 3;
    
    -- Get latest ratios
    SELECT jsonb_agg(
        jsonb_build_object(
            'ratio_name', fr.ratio_name,
            'ratio_value', fr.ratio_value,
            'ratio_type', fr.ratio_type
        )
    ) INTO v_ratios
    FROM financial_ratios fr
    WHERE fr.business_account_id = p_business_account_id
    AND fr.created_at >= CURRENT_DATE - INTERVAL '3 months'
    ORDER BY fr.created_at DESC;
    
    -- Generate recommendations based on analysis
    -- This would typically call an AI service, but for now we'll use rule-based logic
    
    -- Example: Cash flow recommendation
    IF EXISTS (
        SELECT 1 FROM financial_ratios 
        WHERE business_account_id = p_business_account_id
        AND ratio_name = 'current_ratio'
        AND ratio_value < 1.5
        AND created_at >= CURRENT_DATE - INTERVAL '1 month'
    ) THEN
        v_recommendations := array_append(v_recommendations, jsonb_build_object(
            'type', 'CASH_FLOW_IMPROVEMENT',
            'category', 'IMMEDIATE',
            'title', 'Improve Cash Flow Position',
            'description', 'Current ratio is below healthy levels. Immediate action needed to improve liquidity.',
            'action_steps', jsonb_build_array(
                'Accelerate accounts receivable collection',
                'Negotiate better payment terms with suppliers',
                'Review and reduce unnecessary expenses'
            ),
            'confidence_score', 85,
            'impact_estimation', jsonb_build_object(
                'dollar_value', 50000,
                'percentage', 15,
                'timeframe', '30 days'
            ),
            'implementation_effort', 'MEDIUM',
            'priority', 8
        ));
    END IF;
    
    -- Example: Cost reduction recommendation
    IF EXISTS (
        SELECT 1 FROM financial_statements fs
        JOIN fiscal_periods fp ON fs.fiscal_period_id = fp.id
        WHERE fs.business_account_id = p_business_account_id
        AND fp.end_date >= CURRENT_DATE - INTERVAL '3 months'
        AND fs.expenses > fs.revenue * 0.8
    ) THEN
        v_recommendations := array_append(v_recommendations, jsonb_build_object(
            'type', 'COST_REDUCTION',
            'category', 'SHORT_TERM',
            'title', 'Reduce Operating Expenses',
            'description', 'Operating expenses are high relative to revenue. Cost optimization opportunities identified.',
            'action_steps', jsonb_build_array(
                'Review subscription services and cancel unused ones',
                'Negotiate better rates with vendors',
                'Implement energy-saving measures'
            ),
            'confidence_score', 75,
            'impact_estimation', jsonb_build_object(
                'dollar_value', 25000,
                'percentage', 10,
                'timeframe', '60 days'
            ),
            'implementation_effort', 'LOW',
            'priority', 6
        ));
    END IF;
    
    v_result := jsonb_build_object(
        'recommendations', v_recommendations,
        'analysis_data', jsonb_build_object(
            'financial_data', v_financial_data,
            'ratios', v_ratios
        ),
        'generated_at', NOW()
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Create Simulation Function
CREATE OR REPLACE FUNCTION create_simulation_scenario(
    p_business_account_id UUID,
    p_name VARCHAR,
    p_scenario_type VARCHAR(50),
    p_base_period_id UUID,
    p_parameters JSONB
) RETURNS UUID AS $$
DECLARE
    v_scenario_id UUID;
    v_parameter JSONB;
    v_parameter_name TEXT;
    v_parameter_value DECIMAL;
BEGIN
    -- Create scenario
    INSERT INTO simulation_scenarios (
        business_account_id, name, scenario_type, base_period_id, 
        simulation_parameters, status, created_by
    ) VALUES (
        p_business_account_id, p_name, p_scenario_type, p_base_period_id,
        p_parameters, 'DRAFT', current_setting('app.current_user_id')::UUID
    ) RETURNING id INTO v_scenario_id;
    
    -- Extract and store parameters
    FOR v_parameter IN SELECT * FROM jsonb_each_text(p_parameters)
    LOOP
        v_parameter_name := v_parameter.key;
        v_parameter_value := v_parameter.value::DECIMAL;
        
        INSERT INTO simulation_parameters (
            scenario_id, parameter_name, parameter_type,
            baseline_value, simulated_value, impact_area
        ) VALUES (
            v_scenario_id, v_parameter_name, 'PERCENTAGE',
            0, v_parameter_value, 'REVENUE' -- This would be determined by parameter type
        );
    END LOOP;
    
    RETURN v_scenario_id;
END;
$$ LANGUAGE plpgsql;

-- Check Alert Conditions Function
CREATE OR REPLACE FUNCTION check_alert_conditions(
    p_business_account_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_alerts JSONB[] := '{}';
    v_alert_record RECORD;
    v_current_value DECIMAL;
BEGIN
    -- Check all active alert rules
    FOR v_alert_record IN 
        SELECT ar.*, ba.name as business_name
        FROM alert_rules ar
        JOIN business_accounts ba ON ar.business_account_id = ba.id
        WHERE ar.is_active = true
        AND (p_business_account_id IS NULL OR ar.business_account_id = p_business_account_id)
    LOOP
        -- Get current metric value (this would depend on the metric type)
        v_current_value := 0; -- Placeholder - would fetch actual metric value
        
        -- Check if alert condition is met
        IF (
            (v_alert_record.condition_operator = 'LT' AND v_current_value < v_alert_record.threshold_value) OR
            (v_alert_record.condition_operator = 'GT' AND v_current_value > v_alert_record.threshold_value) OR
            (v_alert_record.condition_operator = 'LTE' AND v_current_value <= v_alert_record.threshold_value) OR
            (v_alert_record.condition_operator = 'GTE' AND v_current_value >= v_alert_record.threshold_value) OR
            (v_alert_record.condition_operator = 'EQ' AND v_current_value = v_alert_record.threshold_value) OR
            (v_alert_record.condition_operator = 'NE' AND v_current_value != v_alert_record.threshold_value)
        ) THEN
            -- Create alert notification
            INSERT INTO alert_notifications (
                rule_id, business_account_id, alert_title, alert_message,
                severity, metric_value, threshold_value, notification_channels
            ) VALUES (
                v_alert_record.id,
                v_alert_record.business_account_id,
                'Alert: ' || v_alert_record.rule_name,
                v_alert_record.metric_name || ' is ' || v_current_value || 
                ' (threshold: ' || v_alert_record.threshold_value || ')',
                v_alert_record.severity,
                v_current_value,
                v_alert_record.threshold_value,
                v_alert_record.notification_channels
            );
            
            v_alerts := array_append(v_alerts, jsonb_build_object(
                'rule_id', v_alert_record.id,
                'business_name', v_alert_record.business_name,
                'metric', v_alert_record.metric_name,
                'current_value', v_current_value,
                'threshold', v_alert_record.threshold_value,
                'severity', v_alert_record.severity
            ));
        END IF;
    END LOOP;
    
    RETURN jsonb_build_object(
        'alerts_triggered', v_alerts,
        'checked_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Refresh Materialized Views Function
CREATE OR REPLACE FUNCTION refresh_decision_layer_views() RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_active_recommendations;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_active_alerts;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_decision_success_metrics;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- AI Recommendations Indexes
CREATE INDEX idx_ai_recommendations_business_account ON ai_recommendations(business_account_id);
CREATE INDEX idx_ai_recommendations_type_status ON ai_recommendations(recommendation_type, status);
CREATE INDEX idx_ai_recommendations_priority ON ai_recommendations(priority DESC);
CREATE INDEX idx_ai_recommendations_created_at ON ai_recommendations(created_at DESC);

-- Simulation Scenarios Indexes
CREATE INDEX idx_simulation_scenarios_business_account ON simulation_scenarios(business_account_id);
CREATE INDEX idx_simulation_scenarios_type_status ON simulation_scenarios(scenario_type, status);
CREATE INDEX idx_simulation_scenarios_created_at ON simulation_scenarios(created_at DESC);

-- Alert Notifications Indexes
CREATE INDEX idx_alert_notifications_business_account ON alert_notifications(business_account_id);
CREATE INDEX idx_alert_notifications_severity_resolved ON alert_notifications(severity, resolved_at);
CREATE INDEX idx_alert_notifications_created_at ON alert_notifications(created_at DESC);

-- Decision Workflows Indexes
CREATE INDEX idx_decision_workflows_business_account ON decision_workflows(business_account_id);
CREATE INDEX idx_decision_workflows_type_status ON decision_workflows(workflow_type, status);
CREATE INDEX idx_decision_workflows_created_at ON decision_workflows(created_at DESC);

-- ========================================
-- TRIGGERS
-- ========================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_ai_recommendations_updated_at 
    BEFORE UPDATE ON ai_recommendations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulation_scenarios_updated_at 
    BEFORE UPDATE ON simulation_scenarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_rules_updated_at 
    BEFORE UPDATE ON alert_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decision_workflows_updated_at 
    BEFORE UPDATE ON decision_workflows 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- DEFAULT DATA
-- ========================================

-- Default Recommendation Categories
INSERT INTO recommendation_categories (name, description, icon, color, sort_order) VALUES
('COST_REDUCTION', 'Reduce operational and overhead costs', 'trending-down', '#FF6B6B', 1),
('PRICING_OPTIMIZATION', 'Optimize pricing strategies for maximum profitability', 'dollar-sign', '#4ECDC4', 2),
('CASH_FLOW_IMPROVEMENT', 'Improve cash flow and liquidity position', 'credit-card', '#45B7D1', 3),
('WORKING_CAPITAL', 'Optimize working capital management', 'repeat', '#96CEB4', 4),
('REVENUE_GROWTH', 'Strategies to increase revenue and market share', 'trending-up', '#FECA57', 5);

-- ========================================
-- PERMISSIONS
-- ========================================

-- Grant permissions to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_recommendations TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON recommendation_categories TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON recommendation_impact_tracking TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON simulation_scenarios TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON simulation_parameters TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON simulation_results TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON scenario_comparisons TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON alert_rules TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON alert_thresholds TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON alert_notifications TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON alert_acknowledgments TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON decision_workflows TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON decision_outcomes TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON decision_impact_analysis TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON decision_learning_data TO app_user;

-- Grant permissions on materialized views
GRANT SELECT ON mv_active_recommendations TO app_user;
GRANT SELECT ON mv_active_alerts TO app_user;
GRANT SELECT ON mv_decision_success_metrics TO app_user;

-- Grant usage on functions
GRANT EXECUTE ON FUNCTION generate_ai_recommendations TO app_user;
GRANT EXECUTE ON FUNCTION create_simulation_scenario TO app_user;
GRANT EXECUTE ON FUNCTION check_alert_conditions TO app_user;
GRANT EXECUTE ON FUNCTION refresh_decision_layer_views TO app_user;

COMMIT;
