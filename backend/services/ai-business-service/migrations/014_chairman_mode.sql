-- Sprint 14: Chairman Mode
-- Migration for Chairman Dashboard, Strategic KPI Aggregation, Confidence & Risk Signals

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Chairman Strategic Snapshots (highest level aggregation)
CREATE TABLE chairman_strategic_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    business_account_id UUID NOT NULL,
    
    -- Overall Financial Health Score (0-100)
    overall_financial_health_score DECIMAL(5,2) NOT NULL CHECK (overall_financial_health_score >= 0 AND overall_financial_health_score <= 100),
    financial_health_trend VARCHAR(20) NOT NULL CHECK (financial_health_trend IN ('improving', 'stable', 'declining', 'volatile')),
    
    -- Revenue Direction (Confirmed/At Risk)
    revenue_direction VARCHAR(20) NOT NULL CHECK (revenue_direction IN ('confirmed_growth', 'confirmed_stable', 'at_risk_decline', 'at_risk_volatile')),
    revenue_confidence_score DECIMAL(3,2) NOT NULL CHECK (revenue_confidence_score >= 0 AND revenue_confidence_score <= 1),
    revenue_growth_signal VARCHAR(20) NOT NULL CHECK (revenue_growth_signal IN ('strong_growth', 'moderate_growth', 'flat', 'declining', 'rapid_decline')),
    
    -- Profitability Direction
    profitability_direction VARCHAR(20) NOT NULL CHECK (profitability_direction IN ('improving', 'stable', 'declining', 'concerning')),
    profitability_confidence_score DECIMAL(3,2) NOT NULL CHECK (profitability_confidence_score >= 0 AND profitability_confidence_score <= 1),
    profitability_trend_signal VARCHAR(20) NOT NULL CHECK (profitability_trend_signal IN ('strong_margin', 'healthy_margin', 'thin_margin', 'negative_margin')),
    
    -- Cash & Runway Status
    cash_runway_status VARCHAR(20) NOT NULL CHECK (cash_runway_status IN ('excellent', 'healthy', 'adequate', 'concerning', 'critical')),
    cash_position_signal VARCHAR(20) NOT NULL CHECK (cash_position_signal IN ('strong_position', 'adequate_position', 'tight_position', 'critical_position')),
    runway_months INTEGER NOT NULL,
    cash_burn_trend VARCHAR(20) NOT NULL CHECK (cash_burn_trend IN ('decreasing', 'stable', 'increasing', 'accelerating')),
    
    -- Forecast Reliability Indicator
    forecast_reliability_score DECIMAL(3,2) NOT NULL CHECK (forecast_reliability_score >= 0 AND forecast_reliability_score <= 1),
    forecast_accuracy_trend VARCHAR(20) NOT NULL CHECK (forecast_accuracy_trend IN ('improving', 'stable', 'declining', 'unreliable')),
    forecast_confidence_level VARCHAR(20) NOT NULL CHECK (forecast_confidence_level IN ('high_confidence', 'moderate_confidence', 'low_confidence', 'unreliable')),
    
    -- Management Execution Confidence
    management_execution_confidence DECIMAL(3,2) NOT NULL CHECK (management_execution_confidence >= 0 AND management_execution_confidence <= 1),
    execution_trend VARCHAR(20) NOT NULL CHECK (execution_trend IN ('exceeding', 'meeting', 'below', 'failing')),
    strategic_alignment_score DECIMAL(3,2) NOT NULL CHECK (strategic_alignment_score >= 0 AND strategic_alignment_score <= 1),
    
    -- Market Position
    market_position_strength VARCHAR(20) NOT NULL CHECK (market_position_strength IN ('dominant', 'strong', 'competitive', 'challenged', 'weak')),
    competitive_trend VARCHAR(20) NOT NULL CHECK (competitive_trend IN ('gaining', 'maintaining', 'losing', 'rapidly_losing')),
    
    -- Strategic Health Indicators
    innovation_pipeline_health VARCHAR(20) NOT NULL CHECK (innovation_pipeline_health IN ('strong', 'healthy', 'adequate', 'weak', 'critical')),
    customer_satisfaction_trend VARCHAR(20) NOT NULL CHECK (customer_satisfaction_trend IN ('improving', 'stable', 'declining', 'concerning')),
    employee_engagement_signal VARCHAR(20) NOT NULL CHECK (employee_engagement_signal IN ('high', 'healthy', 'adequate', 'low', 'critical')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    snapshot_hash VARCHAR(64) NOT NULL UNIQUE, -- For immutability verification
    data_sources JSONB NOT NULL DEFAULT '[]', -- Track data sources used
    calculation_version VARCHAR(20) NOT NULL DEFAULT '1.0', -- Version of calculation logic
    
    -- Constraints
    CONSTRAINT unique_chairman_snapshot UNIQUE (business_account_id, period_type, period_start_date, period_end_date)
);

-- Chairman Strategic Risks (Top 3 only)
CREATE TABLE chairman_strategic_risks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES chairman_strategic_snapshots(id) ON DELETE CASCADE,
    business_account_id UUID NOT NULL,
    
    -- Risk Ranking (1-3)
    risk_rank INTEGER NOT NULL CHECK (risk_rank >= 1 AND risk_rank <= 3),
    
    -- Risk Details (High level only)
    risk_category VARCHAR(50) NOT NULL CHECK (risk_category IN ('strategic', 'financial', 'operational', 'market', 'technology', 'regulatory')),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    risk_title VARCHAR(200) NOT NULL, -- Chairman-level title, no operational details
    risk_impact_description TEXT NOT NULL, -- Strategic impact only
    
    -- Risk Signals
    risk_trend VARCHAR(20) NOT NULL CHECK (risk_trend IN ('improving', 'stable', 'escalating', 'rapidly_escalating')),
    mitigation_status VARCHAR(20) NOT NULL CHECK (mitigation_status IN ('on_track', 'attention_needed', 'concerning', 'critical')),
    board_oversight_required BOOLEAN NOT NULL DEFAULT false,
    
    -- Timeline
    risk_horizon VARCHAR(20) NOT NULL CHECK (risk_horizon IN ('immediate', 'short_term', 'medium_term', 'long_term')),
    expected_impact_timeline VARCHAR(50),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_chairman_risk_rank UNIQUE (snapshot_id, risk_rank)
);

-- Chairman Strategic Opportunities (Top 3 only)
CREATE TABLE chairman_strategic_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES chairman_strategic_snapshots(id) ON DELETE CASCADE,
    business_account_id UUID NOT NULL,
    
    -- Opportunity Ranking (1-3)
    opportunity_rank INTEGER NOT NULL CHECK (opportunity_rank >= 1 AND opportunity_rank <= 3),
    
    -- Opportunity Details (High level only)
    opportunity_category VARCHAR(50) NOT NULL CHECK (opportunity_category IN ('market_expansion', 'product_innovation', 'operational_excellence', 'strategic_partnership', 'technology_advantage', 'financial_optimization')),
    opportunity_level VARCHAR(20) NOT NULL CHECK (opportunity_level IN ('moderate', 'significant', 'transformational')),
    opportunity_title VARCHAR(200) NOT NULL, -- Chairman-level title
    strategic_value_description TEXT NOT NULL, -- Strategic value only
    
    -- Opportunity Signals
    readiness_level VARCHAR(20) NOT NULL CHECK (readiness_level IN ('concept', 'planning', 'execution', 'scaling')),
    confidence_level VARCHAR(20) NOT NULL CHECK (confidence_level IN ('low', 'moderate', 'high', 'very_high')),
    resource_requirement_level VARCHAR(20) NOT NULL CHECK (resource_requirement_level IN ('minimal', 'moderate', 'significant', 'substantial')),
    
    -- Timeline
    opportunity_horizon VARCHAR(20) NOT NULL CHECK (opportunity_horizon IN ('immediate', 'short_term', 'medium_term', 'long_term')),
    expected_realization_timeline VARCHAR(50),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_chairman_opportunity_rank UNIQUE (snapshot_id, opportunity_rank)
);

-- Chairman Change Summary (Major changes since last review)
CREATE TABLE chairman_change_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES chairman_strategic_snapshots(id) ON DELETE CASCADE,
    business_account_id UUID NOT NULL,
    
    -- Change Categories
    change_category VARCHAR(50) NOT NULL CHECK (change_category IN ('financial_performance', 'strategic_position', 'risk_landscape', 'opportunity_set', 'management_execution', 'market_conditions')),
    change_significance VARCHAR(20) NOT NULL CHECK (change_significance IN ('minor', 'moderate', 'significant', 'major', 'transformational')),
    
    -- Change Description (High level only)
    change_title VARCHAR(200) NOT NULL,
    strategic_impact_description TEXT NOT NULL,
    
    -- Change Metrics
    previous_period_value DECIMAL(15,2), -- Previous period value for comparison
    current_period_value DECIMAL(15,2), -- Current period value
    change_magnitude DECIMAL(5,2), -- Percentage change
    confidence_in_change DECIMAL(3,2) CHECK (confidence_in_change >= 0 AND confidence_in_change <= 1),
    
    -- Action Required
    chairman_action_required BOOLEAN NOT NULL DEFAULT false,
    action_description TEXT,
    urgency_level VARCHAR(20) CHECK (urgency_level IN ('low', 'medium', 'high', 'immediate')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL
);

-- Chairman Briefing Documents (One-page strategic briefings)
CREATE TABLE chairman_briefing_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES chairman_strategic_snapshots(id) ON DELETE CASCADE,
    business_account_id UUID NOT NULL,
    
    -- Document Details
    briefing_type VARCHAR(20) NOT NULL CHECK (briefing_type IN ('strategic_snapshot', 'risk_focus', 'opportunity_focus', 'decision_support')),
    title VARCHAR(200) NOT NULL,
    
    -- Briefing Content (Very high level)
    executive_summary TEXT NOT NULL, -- 3-4 sentence summary
    key_insights JSONB NOT NULL DEFAULT '[]', -- 3-5 key insights only
    strategic_recommendations JSONB NOT NULL DEFAULT '[]', -- 2-3 recommendations only
    
    -- Signals & Indicators
    confidence_signals JSONB NOT NULL DEFAULT '{}', -- Overall confidence indicators
    risk_signals JSONB NOT NULL DEFAULT '{}', -- Top risk signals
    opportunity_signals JSONB NOT NULL DEFAULT '{}', -- Top opportunity signals
    
    -- File Storage
    file_path VARCHAR(500),
    file_size_bytes BIGINT,
    download_count INTEGER NOT NULL DEFAULT 0,
    
    -- Generation Metadata
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    generated_by UUID NOT NULL,
    generation_duration_ms INTEGER,
    template_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    
    -- Language Support
    language VARCHAR(10) NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ar')),
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed', 'archived')),
    
    -- Constraints
    CONSTRAINT unique_chairman_briefing UNIQUE (snapshot_id, briefing_type, language)
);

-- Chairman Access Control (Ultra-restricted)
CREATE TABLE chairman_access_control (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- Chairman Role (Only one type)
    chairman_role VARCHAR(20) NOT NULL CHECK (chairman_role IN ('chairman', 'acting_chairman')),
    
    -- Ultra-restricted Permissions
    can_view_strategic_dashboard BOOLEAN NOT NULL DEFAULT true,
    can_view_risk_heatmap BOOLEAN NOT NULL DEFAULT true,
    can_view_opportunities BOOLEAN NOT NULL DEFAULT true,
    can_download_briefings BOOLEAN NOT NULL DEFAULT true,
    can_view_change_summary BOOLEAN NOT NULL DEFAULT true,
    can_view_confidence_indicators BOOLEAN NOT NULL DEFAULT true,
    
    -- Explicit Denials (No operational access)
    can_view_financial_details BOOLEAN NOT NULL DEFAULT false,
    can_view_operational_data BOOLEAN NOT NULL DEFAULT false,
    can_view_transactional_data BOOLEAN NOT NULL DEFAULT false,
    can_view_employee_data BOOLEAN NOT NULL DEFAULT false,
    can_view_customer_data BOOLEAN NOT NULL DEFAULT false,
    can_drill_down BOOLEAN NOT NULL DEFAULT false,
    can_export_raw_data BOOLEAN NOT NULL DEFAULT false,
    
    -- Access Restrictions
    access_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    access_end_date DATE,
    ip_restriction_enabled BOOLEAN NOT NULL DEFAULT false,
    allowed_ip_ranges INET[], -- Array of allowed IP ranges
    
    -- Session Security
    session_timeout_minutes INTEGER NOT NULL DEFAULT 30,
    require_mfa BOOLEAN NOT NULL DEFAULT true,
    device_restriction_enabled BOOLEAN NOT NULL DEFAULT false,
    
    -- Metadata
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER NOT NULL DEFAULT 0,
    
    -- Constraints
    CONSTRAINT unique_chairman_access UNIQUE (business_account_id, user_id),
    CONSTRAINT valid_chairman_access_dates CHECK (access_end_date IS NULL OR access_end_date >= access_start_date)
);

-- Chairman Audit Log (Enhanced for governance)
CREATE TABLE chairman_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL,
    
    -- Action Details
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('strategic_snapshot_viewed', 'briefing_downloaded', 'risk_heatmap_viewed', 'access_granted', 'access_revoked', 'session_started', 'session_ended', 'mfa_challenge', 'security_alert')),
    action_description TEXT NOT NULL,
    
    -- Entity References
    entity_type VARCHAR(50),
    entity_id UUID,
    
    -- User Context
    performed_by UUID NOT NULL,
    user_role VARCHAR(50),
    session_id VARCHAR(100),
    
    -- Security Context
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(100),
    mfa_verified BOOLEAN DEFAULT false,
    
    -- Performance Context
    action_duration_ms INTEGER,
    data_volume_bytes BIGINT,
    
    -- Metadata
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    additional_data JSONB NOT NULL DEFAULT '{}'
);

-- Materialized Views for Chairman Analytics

-- Chairman Strategic Trends (High-level trends only)
CREATE MATERIALIZED VIEW chairman_strategic_trends AS
SELECT 
    css.business_account_id,
    css.period_type,
    DATE_TRUNC('quarter', css.period_start_date) as quarter,
    AVG(css.overall_financial_health_score) as avg_financial_health,
    AVG(css.forecast_reliability_score) as avg_forecast_reliability,
    AVG(css.management_execution_confidence) as avg_execution_confidence,
    COUNT(*) as snapshot_count,
    -- Trend signals
    MODE() WITHIN GROUP (ORDER BY css.financial_health_trend) as dominant_financial_trend,
    MODE() WITHIN GROUP (ORDER BY css.revenue_direction) as dominant_revenue_direction,
    MODE() WITHIN GROUP (ORDER BY css.cash_runway_status) as dominant_cash_status
FROM chairman_strategic_snapshots css
WHERE css.period_type = 'quarterly'
GROUP BY css.business_account_id, css.period_type, DATE_TRUNC('quarter', css.period_start_date)
ORDER BY quarter DESC;

-- Chairman Risk Heatmap (Aggregated risk signals)
CREATE MATERIALIZED VIEW chairman_risk_heatmap AS
SELECT 
    csr.business_account_id,
    csr.risk_category,
    csr.risk_level,
    COUNT(*) as risk_count,
    AVG(CASE WHEN csr.risk_rank = 1 THEN 1 ELSE 0 END) * 100 as top_risk_percentage,
    MAX(csr.created_at) as latest_identification,
    -- Risk trend aggregation
    MODE() WITHIN GROUP (ORDER BY csr.risk_trend) as dominant_risk_trend,
    MODE() WITHIN GROUP (ORDER BY csr.mitigation_status) as dominant_mitigation_status
FROM chairman_strategic_risks csr
JOIN chairman_strategic_snapshots css ON csr.snapshot_id = css.id
WHERE css.period_end_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY csr.business_account_id, csr.risk_category, csr.risk_level
ORDER BY csr.risk_level DESC, risk_count DESC;

-- Chairman Opportunity Pipeline (Strategic opportunities)
CREATE MATERIALIZED VIEW chairman_opportunity_pipeline AS
SELECT 
    cso.business_account_id,
    cso.opportunity_category,
    cso.opportunity_level,
    COUNT(*) as opportunity_count,
    AVG(CASE WHEN cso.opportunity_rank = 1 THEN 1 ELSE 0 END) * 100 as top_opportunity_percentage,
    MAX(cso.created_at) as latest_identification,
    -- Opportunity readiness aggregation
    MODE() WITHIN GROUP (ORDER BY cso.readiness_level) as dominant_readiness,
    MODE() WITHIN GROUP (ORDER BY cso.confidence_level) as dominant_confidence,
    AVG(CASE WHEN cso.resource_requirement_level = 'minimal' THEN 1 
             WHEN cso.resource_requirement_level = 'moderate' THEN 2 
             WHEN cso.resource_requirement_level = 'significant' THEN 3 
             ELSE 4 END) as avg_resource_intensity
FROM chairman_strategic_opportunities cso
JOIN chairman_strategic_snapshots css ON cso.snapshot_id = css.id
WHERE css.period_end_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY cso.business_account_id, cso.opportunity_category, cso.opportunity_level
ORDER BY cso.opportunity_level DESC, opportunity_count DESC;

-- Indexes for Performance
CREATE INDEX idx_chairman_strategic_snapshots_business_period ON chairman_strategic_snapshots(business_account_id, period_type, period_start_date);
CREATE INDEX idx_chairman_strategic_snapshots_date_range ON chairman_strategic_snapshots(period_start_date, period_end_date);
CREATE INDEX idx_chairman_strategic_snapshots_health_score ON chairman_strategic_snapshots(overall_financial_health_score);
CREATE INDEX idx_chairman_strategic_risks_snapshot ON chairman_strategic_risks(snapshot_id);
CREATE INDEX idx_chairman_strategic_risks_business_rank ON chairman_strategic_risks(business_account_id, risk_rank);
CREATE INDEX idx_chairman_strategic_opportunities_snapshot ON chairman_strategic_opportunities(snapshot_id);
CREATE INDEX idx_chairman_strategic_opportunities_business_rank ON chairman_strategic_opportunities(business_account_id, opportunity_rank);
CREATE INDEX idx_chairman_change_summary_snapshot ON chairman_change_summary(snapshot_id);
CREATE INDEX idx_chairman_briefing_documents_snapshot ON chairman_briefing_documents(snapshot_id);
CREATE INDEX idx_chairman_access_control_user ON chairman_access_control(user_id);
CREATE INDEX idx_chairman_audit_log_business_date ON chairman_audit_log(business_account_id, performed_at);

-- Functions for Chairman Calculations

-- Calculate Overall Financial Health Score
CREATE OR REPLACE FUNCTION calculate_overall_financial_health(
    p_revenue_growth_score DECIMAL,
    p_profitability_score DECIMAL,
    p_cash_position_score DECIMAL,
    p_forecast_reliability_score DECIMAL,
    p_execution_confidence_score DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    -- Weighted calculation for overall financial health
    RETURN ROUND(
        (p_revenue_growth_score * 0.25 + 
         p_profitability_score * 0.25 + 
         p_cash_position_score * 0.25 + 
         p_forecast_reliability_score * 0.15 + 
         p_execution_confidence_score * 0.10) * 100, 2
    );
END;
$$ LANGUAGE plpgsql;

-- Calculate Revenue Direction Signal
CREATE OR REPLACE FUNCTION calculate_revenue_direction(
    p_revenue_growth_qoq DECIMAL,
    p_revenue_growth_yoy DECIMAL,
    p_forecast_confidence DECIMAL
) RETURNS VARCHAR AS $$
DECLARE
    v_growth_trend VARCHAR;
    v_confidence_level VARCHAR;
BEGIN
    -- Determine growth trend
    IF p_revenue_growth_qoq > 10 AND p_revenue_growth_yoy > 15 THEN
        v_growth_trend := 'strong_growth';
    ELSIF p_revenue_growth_qoq > 0 AND p_revenue_growth_yoy > 0 THEN
        v_growth_trend := 'moderate_growth';
    ELSIF ABS(p_revenue_growth_qoq) <= 5 AND ABS(p_revenue_growth_yoy) <= 5 THEN
        v_growth_trend := 'flat';
    ELSIF p_revenue_growth_qoq < -10 OR p_revenue_growth_yoy < -10 THEN
        v_growth_trend := 'rapid_decline';
    ELSE
        v_growth_trend := 'declining';
    END IF;
    
    -- Determine confidence level
    IF p_forecast_confidence > 0.8 THEN
        v_confidence_level := 'high_confidence';
    ELSIF p_forecast_confidence > 0.6 THEN
        v_confidence_level := 'moderate_confidence';
    ELSE
        v_confidence_level := 'low_confidence';
    END IF;
    
    -- Combine for final direction
    IF v_growth_trend IN ('strong_growth', 'moderate_growth') AND v_confidence_level = 'high_confidence' THEN
        RETURN 'confirmed_growth';
    ELSIF v_growth_trend = 'flat' AND v_confidence_level IN ('high_confidence', 'moderate_confidence') THEN
        RETURN 'confirmed_stable';
    ELSIF v_growth_trend IN ('declining', 'rapid_decline') OR v_confidence_level = 'low_confidence' THEN
        RETURN 'at_risk_decline';
    ELSE
        RETURN 'at_risk_volatile';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Calculate Cash Runway Status
CREATE OR REPLACE FUNCTION calculate_cash_runway_status(
    p_runway_months INTEGER,
    p_burn_trend VARCHAR
) RETURNS VARCHAR AS $$
BEGIN
    IF p_runway_months > 24 THEN
        RETURN 'excellent';
    ELSIF p_runway_months > 18 THEN
        RETURN 'healthy';
    ELSIF p_runway_months > 12 THEN
        RETURN 'adequate';
    ELSIF p_runway_months > 6 THEN
        RETURN 'concerning';
    ELSE
        RETURN 'critical';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Generate Chairman Strategic Snapshot
CREATE OR REPLACE FUNCTION generate_chairman_strategic_snapshot(
    p_business_account_id UUID,
    p_period_type VARCHAR,
    p_period_start_date DATE,
    p_period_end_date,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_snapshot_id UUID;
    v_board_snapshot_id UUID;
    v_revenue_growth_qoq DECIMAL;
    v_revenue_growth_yoy DECIMAL;
    v_ebitda_margin DECIMAL;
    v_net_profit_margin DECIMAL;
    v_cash_runway_months INTEGER;
    v_monthly_burn_rate DECIMAL;
    v_forecast_confidence DECIMAL;
    v_forecast_accuracy DECIMAL;
    v_execution_confidence DECIMAL;
    v_financial_health_score DECIMAL;
    v_revenue_direction VARCHAR;
    v_cash_runway_status VARCHAR;
    v_snapshot_hash VARCHAR(64);
BEGIN
    -- Get latest board KPI snapshot
    SELECT id INTO v_board_snapshot_id
    FROM board_kpi_snapshots
    WHERE business_account_id = p_business_account_id
      AND period_type = p_period_type
      AND period_start_date = p_period_start_date
      AND period_end_date = p_period_end_date
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_board_snapshot_id IS NULL THEN
        RAISE EXCEPTION 'Board KPI snapshot not found for the specified period';
    END IF;
    
    -- Extract KPI data from board snapshot
    SELECT 
        revenue_growth_qoq,
        revenue_growth_yoy,
        ebitda_margin_current,
        net_profit_margin_current,
        cash_runway_months,
        monthly_burn_rate,
        forecast_confidence_score,
        forecast_accuracy_historical
    INTO 
        v_revenue_growth_qoq,
        v_revenue_growth_yoy,
        v_ebitda_margin,
        v_net_profit_margin,
        v_cash_runway_months,
        v_monthly_burn_rate,
        v_forecast_confidence,
        v_forecast_accuracy
    FROM board_kpi_snapshots
    WHERE id = v_board_snapshot_id;
    
    -- Calculate scores and directions
    v_financial_health_score := calculate_overall_financial_health(
        GREATEST(0, LEAST(1, v_revenue_growth_qoq / 20)), -- Normalize to 0-1
        GREATEST(0, LEAST(1, v_ebitda_margin / 20)), -- Normalize to 0-1
        GREATEST(0, LEAST(1, v_cash_runway_months / 36)), -- Normalize to 0-1 (3 years)
        v_forecast_confidence,
        0.8 -- Default execution confidence (would come from AI layer)
    );
    
    v_revenue_direction := calculate_revenue_direction(v_revenue_growth_qoq, v_revenue_growth_yoy, v_forecast_confidence);
    v_cash_runway_status := calculate_cash_runway_status(v_cash_runway_months, 'stable');
    
    -- Generate snapshot hash for immutability
    v_snapshot_hash := md5(
        p_business_account_id::text || 
        p_period_type || 
        p_period_start_date::text || 
        p_period_end_date::text ||
        v_financial_health_score::text ||
        v_revenue_direction::text ||
        v_cash_runway_status::text
    );
    
    -- Insert chairman strategic snapshot
    INSERT INTO chairman_strategic_snapshots (
        business_account_id,
        period_type,
        period_start_date,
        period_end_date,
        overall_financial_health_score,
        financial_health_trend,
        revenue_direction,
        revenue_confidence_score,
        revenue_growth_signal,
        profitability_direction,
        profitability_confidence_score,
        profitability_trend_signal,
        cash_runway_status,
        cash_position_signal,
        runway_months,
        cash_burn_trend,
        forecast_reliability_score,
        forecast_accuracy_trend,
        forecast_confidence_level,
        management_execution_confidence,
        execution_trend,
        strategic_alignment_score,
        market_position_strength,
        competitive_trend,
        innovation_pipeline_health,
        customer_satisfaction_trend,
        employee_engagement_signal,
        created_by,
        snapshot_hash,
        data_sources
    ) VALUES (
        p_business_account_id,
        p_period_type,
        p_period_start_date,
        p_period_end_date,
        v_financial_health_score,
        CASE WHEN v_financial_health_score > 75 THEN 'improving'
             WHEN v_financial_health_score > 50 THEN 'stable'
             WHEN v_financial_health_score > 25 THEN 'declining'
             ELSE 'volatile' END,
        v_revenue_direction,
        v_forecast_confidence,
        CASE WHEN v_revenue_growth_qoq > 10 THEN 'strong_growth'
             WHEN v_revenue_growth_qoq > 0 THEN 'moderate_growth'
             WHEN ABS(v_revenue_growth_qoq) <= 5 THEN 'flat'
             WHEN v_revenue_growth_qoq < -10 THEN 'rapid_decline'
             ELSE 'declining' END,
        CASE WHEN v_ebitda_margin > 15 THEN 'improving'
             WHEN v_ebitda_margin > 10 THEN 'stable'
             WHEN v_ebitda_margin > 5 THEN 'declining'
             ELSE 'concerning' END,
        v_forecast_confidence,
        CASE WHEN v_ebitda_margin > 20 THEN 'strong_margin'
             WHEN v_ebitda_margin > 15 THEN 'healthy_margin'
             WHEN v_ebitda_margin > 5 THEN 'thin_margin'
             ELSE 'negative_margin' END,
        v_cash_runway_status,
        CASE WHEN v_cash_runway_months > 24 THEN 'strong_position'
             WHEN v_cash_runway_months > 12 THEN 'adequate_position'
             WHEN v_cash_runway_months > 6 THEN 'tight_position'
             ELSE 'critical_position' END,
        v_cash_runway_months,
        CASE WHEN v_monthly_burn_rate < 0 THEN 'decreasing'
             WHEN v_monthly_burn_rate = 0 THEN 'stable'
             ELSE 'increasing' END,
        v_forecast_confidence,
        CASE WHEN v_forecast_accuracy > 85 THEN 'improving'
             WHEN v_forecast_accuracy > 70 THEN 'stable'
             WHEN v_forecast_accuracy > 50 THEN 'declining'
             ELSE 'unreliable' END,
        CASE WHEN v_forecast_confidence > 0.8 THEN 'high_confidence'
             WHEN v_forecast_confidence > 0.6 THEN 'moderate_confidence'
             WHEN v_forecast_confidence > 0.4 THEN 'low_confidence'
             ELSE 'unreliable' END,
        0.8, -- Default execution confidence
        'meeting', -- Default execution trend
        0.8, -- Default strategic alignment
        'competitive', -- Default market position
        'maintaining', -- Default competitive trend
        'healthy', -- Default innovation pipeline
        'stable', -- Default customer satisfaction
        'healthy', -- Default employee engagement
        p_created_by,
        v_snapshot_hash,
        '["board_kpi_snapshots", "ai_decision_layer", "forecast_engine"]'::jsonb
    ) RETURNING id INTO v_snapshot_id;
    
    RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- Refresh Materialized Views Function
CREATE OR REPLACE FUNCTION refresh_chairman_materialized_views() RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY chairman_strategic_trends;
    REFRESH MATERIALIZED VIEW CONCURRENTLY chairman_risk_heatmap;
    REFRESH MATERIALIZED VIEW CONCURRENTLY chairman_opportunity_pipeline;
END;
$$ LANGUAGE plpgsql;

-- Triggers for Audit Logging
CREATE OR REPLACE FUNCTION chairman_audit_trigger() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO chairman_audit_log (
        business_account_id,
        action_type,
        action_description,
        entity_type,
        entity_id,
        performed_by,
        additional_data
    ) VALUES (
        COALESCE(NEW.business_account_id, OLD.business_account_id),
        TG_OP,
        'Chairman ' || TG_OP || ' on ' || TG_TABLE_NAME,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        COALESCE(NEW.created_by, NEW.generated_by, OLD.generated_by),
        jsonb_build_object(
            'old_values', row_to_json(OLD),
            'new_values', row_to_json(NEW)
        )
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers
CREATE TRIGGER chairman_strategic_snapshots_audit
    AFTER INSERT OR UPDATE OR DELETE ON chairman_strategic_snapshots
    FOR EACH ROW EXECUTE FUNCTION chairman_audit_trigger();

CREATE TRIGGER chairman_strategic_risks_audit
    AFTER INSERT OR UPDATE OR DELETE ON chairman_strategic_risks
    FOR EACH ROW EXECUTE FUNCTION chairman_audit_trigger();

CREATE TRIGGER chairman_strategic_opportunities_audit
    AFTER INSERT OR UPDATE OR DELETE ON chairman_strategic_opportunities
    FOR EACH ROW EXECUTE FUNCTION chairman_audit_trigger();

CREATE TRIGGER chairman_briefing_documents_audit
    AFTER INSERT OR UPDATE OR DELETE ON chairman_briefing_documents
    FOR EACH ROW EXECUTE FUNCTION chairman_audit_trigger();

-- Grant permissions to app_user
GRANT SELECT, INSERT, UPDATE, DELETE ON chairman_strategic_snapshots TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON chairman_strategic_risks TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON chairman_strategic_opportunities TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON chairman_change_summary TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON chairman_briefing_documents TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON chairman_access_control TO app_user;
GRANT SELECT, INSERT ON chairman_audit_log TO app_user;

GRANT SELECT ON chairman_strategic_trends TO app_user;
GRANT SELECT ON chairman_risk_heatmap TO app_user;
GRANT SELECT ON chairman_opportunity_pipeline TO app_user;

GRANT EXECUTE ON FUNCTION calculate_overall_financial_health TO app_user;
GRANT EXECUTE ON FUNCTION calculate_revenue_direction TO app_user;
GRANT EXECUTE ON FUNCTION calculate_cash_runway_status TO app_user;
GRANT EXECUTE ON FUNCTION generate_chairman_strategic_snapshot TO app_user;
GRANT EXECUTE ON FUNCTION refresh_chairman_materialized_views TO app_user;

-- Create indexes for materialized views
CREATE INDEX idx_chairman_strategic_trends_business_quarter ON chairman_strategic_trends(business_account_id, quarter);
CREATE INDEX idx_chairman_risk_heatmap_business_level ON chairman_risk_heatmap(business_account_id, risk_level);
CREATE INDEX idx_chairman_opportunity_pipeline_business_level ON chairman_opportunity_pipeline(business_account_id, opportunity_level);

-- Add comments for documentation
COMMENT ON TABLE chairman_strategic_snapshots IS 'Highest-level strategic snapshots for Chairman with aggregated KPIs and confidence indicators';
COMMENT ON TABLE chairman_strategic_risks IS 'Top 3 strategic risks only, Chairman-level visibility';
COMMENT ON TABLE chairman_strategic_opportunities IS 'Top 3 strategic opportunities only, Chairman-level visibility';
COMMENT ON TABLE chairman_change_summary IS 'Major changes since last Chairman review, strategic impact only';
COMMENT ON TABLE chairman_briefing_documents IS 'One-page strategic briefings for Chairman with ultra-high-level content';
COMMENT ON TABLE chairman_access_control IS 'Ultra-restricted access control for Chairman role with explicit denials';
COMMENT ON TABLE chairman_audit_log IS 'Enhanced audit trail for Chairman activities with security context';

COMMENT ON MATERIALIZED VIEW chairman_strategic_trends IS 'High-level strategic trends for Chairman dashboard';
COMMENT ON MATERIALIZED VIEW chairman_risk_heatmap IS 'Aggregated risk heatmap for Chairman strategic overview';
COMMENT ON MATERIALIZED VIEW chairman_opportunity_pipeline IS 'Strategic opportunity pipeline for Chairman decision support';
