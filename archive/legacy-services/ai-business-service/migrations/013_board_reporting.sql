-- Sprint 13: Board-Level Reporting Mode
-- Migration for Board Dashboard, Board Pack Generator, Strategic KPIs, Risk & Outlook Summary

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Board-level KPI snapshots (immutable)
CREATE TABLE board_kpi_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    business_account_id UUID NOT NULL,
    
    -- Revenue KPIs
    revenue_current DECIMAL(15,2) NOT NULL DEFAULT 0,
    revenue_previous_period DECIMAL(15,2) NOT NULL DEFAULT 0,
    revenue_previous_year DECIMAL(15,2) NOT NULL DEFAULT 0,
    revenue_growth_qoq DECIMAL(5,2) NOT NULL DEFAULT 0,
    revenue_growth_yoy DECIMAL(5,2) NOT NULL DEFAULT 0,
    
    -- Profitability KPIs
    ebitda_current DECIMAL(15,2) NOT NULL DEFAULT 0,
    ebitda_previous_period DECIMAL(15,2) NOT NULL DEFAULT 0,
    ebitda_previous_year DECIMAL(15,2) NOT NULL DEFAULT 0,
    ebitda_margin_current DECIMAL(5,2) NOT NULL DEFAULT 0,
    net_profit_current DECIMAL(15,2) NOT NULL DEFAULT 0,
    net_profit_previous_period DECIMAL(15,2) NOT NULL DEFAULT 0,
    net_profit_previous_year DECIMAL(15,2) NOT NULL DEFAULT 0,
    net_profit_margin_current DECIMAL(5,2) NOT NULL DEFAULT 0,
    
    -- Cash Position KPIs
    cash_position_current DECIMAL(15,2) NOT NULL DEFAULT 0,
    cash_position_previous_period DECIMAL(15,2) NOT NULL DEFAULT 0,
    monthly_burn_rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    cash_runway_months INTEGER NOT NULL DEFAULT 0,
    
    -- Forecast Confidence
    forecast_confidence_score DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (forecast_confidence_score >= 0 AND forecast_confidence_score <= 1),
    forecast_accuracy_historical DECIMAL(5,2) NOT NULL DEFAULT 0,
    
    -- Strategic Metrics
    customer_acquisition_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
    customer_lifetime_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    ltv_cac_ratio DECIMAL(5,2) NOT NULL DEFAULT 0,
    
    -- Operational KPIs
    gross_margin_current DECIMAL(5,2) NOT NULL DEFAULT 0,
    operating_margin_current DECIMAL(5,2) NOT NULL DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    snapshot_hash VARCHAR(64) NOT NULL UNIQUE, -- For immutability verification
    data_sources JSONB NOT NULL DEFAULT '[]', -- Track data sources used
    
    -- Constraints
    CONSTRAINT unique_board_kpi_snapshot UNIQUE (business_account_id, period_type, period_start_date, period_end_date)
);

-- Board Risk Assessments
CREATE TABLE board_risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES board_kpi_snapshots(id) ON DELETE CASCADE,
    business_account_id UUID NOT NULL,
    
    -- Risk Categories
    risk_category VARCHAR(50) NOT NULL CHECK (risk_category IN ('financial', 'operational', 'strategic', 'compliance', 'market')),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    risk_title VARCHAR(200) NOT NULL,
    risk_description TEXT NOT NULL,
    
    -- Risk Metrics
    probability_score DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (probability_score >= 0 AND probability_score <= 1),
    impact_score DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (impact_score >= 0 AND impact_score <= 1),
    risk_score DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 1),
    
    -- Mitigation
    mitigation_strategy TEXT,
    mitigation_status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (mitigation_status IN ('not_started', 'in_progress', 'completed', 'monitored')),
    owner_role VARCHAR(100),
    
    -- Timeline
    identified_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_resolution_date DATE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID
);

-- Board Strategic Alerts
CREATE TABLE board_strategic_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES board_kpi_snapshots(id) ON DELETE CASCADE,
    business_account_id UUID NOT NULL,
    
    -- Alert Details
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('kpi_deviation', 'trend_change', 'risk_escalation', 'opportunity', 'compliance')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    
    -- Alert Context
    kpi_category VARCHAR(50),
    current_value DECIMAL(15,2),
    target_value DECIMAL(15,2),
    variance_percentage DECIMAL(5,2),
    trend_direction VARCHAR(20) CHECK (trend_direction IN ('improving', 'declining', 'stable', 'volatile')),
    
    -- Action Required
    action_required BOOLEAN NOT NULL DEFAULT false,
    action_description TEXT,
    responsible_role VARCHAR(100),
    due_date DATE,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'in_progress', 'resolved', 'closed')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID
);

-- Board Pack Documents
CREATE TABLE board_pack_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES board_kpi_snapshots(id) ON DELETE CASCADE,
    business_account_id UUID NOT NULL,
    
    -- Document Details
    document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('pdf', 'docx', 'html')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Content
    executive_summary TEXT NOT NULL,
    financial_highlights JSONB NOT NULL DEFAULT '{}',
    risk_summary JSONB NOT NULL DEFAULT '{}',
    strategic_recommendations JSONB NOT NULL DEFAULT '{}',
    
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
    CONSTRAINT unique_board_pack_document UNIQUE (snapshot_id, document_type, language)
);

-- Board Narrative Templates
CREATE TABLE board_narrative_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(100) NOT NULL UNIQUE,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('executive_summary', 'financial_analysis', 'risk_assessment', 'strategic_outlook')),
    
    -- Template Content
    template_content TEXT NOT NULL,
    variables JSONB NOT NULL DEFAULT '{}', -- Available template variables
    
    -- Language Support
    language VARCHAR(10) NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ar')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Board Access Control
CREATE TABLE board_access_control (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- Access Level
    access_level VARCHAR(20) NOT NULL CHECK (access_level IN ('board_member', 'chairman', 'secretary', 'observer')),
    
    -- Permissions
    can_view_kpis BOOLEAN NOT NULL DEFAULT true,
    can_view_risks BOOLEAN NOT NULL DEFAULT true,
    can_view_alerts BOOLEAN NOT NULL DEFAULT true,
    can_download_reports BOOLEAN NOT NULL DEFAULT true,
    can_generate_reports BOOLEAN NOT NULL DEFAULT false,
    
    -- Access Restrictions
    access_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    access_end_date DATE,
    
    -- Metadata
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID,
    
    -- Constraints
    CONSTRAINT unique_board_access UNIQUE (business_account_id, user_id, access_level),
    CONSTRAINT valid_access_dates CHECK (access_end_date IS NULL OR access_end_date >= access_start_date)
);

-- Board Audit Log
CREATE TABLE board_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL,
    
    -- Action Details
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('snapshot_created', 'report_generated', 'access_granted', 'access_revoked', 'alert_acknowledged')),
    action_description TEXT NOT NULL,
    
    -- Entity References
    entity_type VARCHAR(50),
    entity_id UUID,
    
    -- User Context
    performed_by UUID NOT NULL,
    user_role VARCHAR(50),
    
    -- System Context
    ip_address INET,
    user_agent TEXT,
    
    -- Metadata
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    additional_data JSONB NOT NULL DEFAULT '{}'
);

-- Materialized Views for Board Analytics

-- Board KPI Trends (Quarter-over-Quarter)
CREATE MATERIALIZED VIEW board_kpi_trends AS
SELECT 
    business_account_id,
    period_type,
    DATE_TRUNC('quarter', period_start_date) as quarter,
    AVG(revenue_growth_qoq) as avg_revenue_growth_qoq,
    AVG(ebitda_margin_current) as avg_ebitda_margin,
    AVG(net_profit_margin_current) as avg_net_profit_margin,
    AVG(forecast_confidence_score) as avg_forecast_confidence,
    AVG(cash_runway_months) as avg_cash_runway,
    COUNT(*) as snapshot_count
FROM board_kpi_snapshots
WHERE period_type = 'quarterly'
GROUP BY business_account_id, period_type, DATE_TRUNC('quarter', period_start_date)
ORDER BY quarter DESC;

-- Board Risk Summary
CREATE MATERIALIZED VIEW board_risk_summary AS
SELECT 
    bra.business_account_id,
    bra.risk_category,
    bra.risk_level,
    COUNT(*) as risk_count,
    AVG(bra.risk_score) as avg_risk_score,
    MAX(bra.identified_date) as latest_identification
FROM board_risk_assments bra
JOIN board_kpi_snapshots bks ON bra.snapshot_id = bks.id
WHERE bks.period_end_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY bra.business_account_id, bra.risk_category, bra.risk_level
ORDER BY bra.risk_level DESC, bra.risk_category;

-- Board Alert Trends
CREATE MATERIALIZED VIEW board_alert_trends AS
SELECT 
    bsa.business_account_id,
    bsa.alert_type,
    bsa.severity,
    DATE_TRUNC('month', bsa.created_at) as month,
    COUNT(*) as alert_count,
    COUNT(CASE WHEN bsa.status = 'resolved' THEN 1 END) as resolved_count,
    AVG(EXTRACT(EPOCH FROM (CASE WHEN bsa.status = 'resolved' THEN bsa.updated_at ELSE CURRENT_TIMESTAMP END - bsa.created_at))/86400) as avg_resolution_days
FROM board_strategic_alerts bsa
WHERE bsa.created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY bsa.business_account_id, bsa.alert_type, bsa.severity, DATE_TRUNC('month', bsa.created_at)
ORDER BY month DESC, bsa.severity DESC;

-- Indexes for Performance
CREATE INDEX idx_board_kpi_snapshots_business_period ON board_kpi_snapshots(business_account_id, period_type, period_start_date);
CREATE INDEX idx_board_kpi_snapshots_date_range ON board_kpi_snapshots(period_start_date, period_end_date);
CREATE INDEX idx_board_risk_assessments_snapshot ON board_risk_assessments(snapshot_id);
CREATE INDEX idx_board_risk_assessments_business_level ON board_risk_assessments(business_account_id, risk_level);
CREATE INDEX idx_board_strategic_alerts_snapshot ON board_strategic_alerts(snapshot_id);
CREATE INDEX idx_board_strategic_alerts_business_severity ON board_strategic_alerts(business_account_id, severity, status);
CREATE INDEX idx_board_pack_documents_snapshot ON board_pack_documents(snapshot_id);
CREATE INDEX idx_board_access_control_user ON board_access_control(user_id);
CREATE INDEX idx_board_audit_log_business_date ON board_audit_log(business_account_id, performed_at);

-- Functions for Board KPI Calculations

-- Calculate Revenue Growth
CREATE OR REPLACE FUNCTION calculate_revenue_growth(
    p_current_revenue DECIMAL,
    p_previous_revenue DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    IF p_previous_revenue = 0 THEN
        RETURN 0;
    END IF;
    RETURN ROUND(((p_current_revenue - p_previous_revenue) / p_previous_revenue) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Calculate Cash Runway
CREATE OR REPLACE FUNCTION calculate_cash_runway(
    p_cash_position DECIMAL,
    p_monthly_burn_rate DECIMAL
) RETURNS INTEGER AS $$
BEGIN
    IF p_monthly_burn_rate <= 0 THEN
        RETURN 999; -- Infinite runway
    END IF;
    RETURN FLOOR(p_cash_position / p_monthly_burn_rate);
END;
$$ LANGUAGE plpgsql;

-- Calculate Risk Score
CREATE OR REPLACE FUNCTION calculate_risk_score(
    p_probability DECIMAL,
    p_impact DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    RETURN ROUND(p_probability * p_impact, 2);
END;
$$ LANGUAGE plpgsql;

-- Generate Board KPI Snapshot
CREATE OR REPLACE FUNCTION generate_board_kpi_snapshot(
    p_business_account_id UUID,
    p_period_type VARCHAR,
    p_period_start_date DATE,
    p_period_end_date,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_snapshot_id UUID;
    v_revenue_current DECIMAL;
    v_revenue_previous DECIMAL;
    v_revenue_previous_year DECIMAL;
    v_ebitda_current DECIMAL;
    v_ebitda_previous DECIMAL;
    v_ebitda_previous_year DECIMAL;
    v_net_profit_current DECIMAL;
    v_net_profit_previous DECIMAL;
    v_net_profit_previous_year DECIMAL;
    v_cash_position DECIMAL;
    v_cash_previous DECIMAL;
    v_monthly_burn_rate DECIMAL;
    v_snapshot_hash VARCHAR(64);
BEGIN
    -- Get financial data from existing statements
    SELECT 
        COALESCE(SUM(CASE WHEN fs.statement_type = 'income_statement' AND fs.period_type = p_period_type 
            AND fs.period_start_date = p_period_start_date AND fs.period_end_date = p_period_end_date
            THEN fsc.total_revenue ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN fs.statement_type = 'income_statement' AND fs.period_type = p_period_type 
            AND fs.period_end_date = p_period_start_date - INTERVAL '1 day'
            THEN fsc.total_revenue ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN fs.statement_type = 'income_statement' AND fs.period_type = p_period_type 
            AND fs.period_end_date = p_period_start_date - INTERVAL '1 year'
            THEN fsc.total_revenue ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN fs.statement_type = 'income_statement' AND fs.period_type = p_period_type 
            AND fs.period_start_date = p_period_start_date AND fs.period_end_date = p_period_end_date
            THEN fsc.ebitda ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN fs.statement_type = 'income_statement' AND fs.period_type = p_period_type 
            AND fs.period_end_date = p_period_start_date - INTERVAL '1 day'
            THEN fsc.ebitda ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN fs.statement_type = 'income_statement' AND fs.period_type = p_period_type 
            AND fs.period_end_date = p_period_start_date - INTERVAL '1 year'
            THEN fsc.ebitda ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN fs.statement_type = 'income_statement' AND fs.period_type = p_period_type 
            AND fs.period_start_date = p_period_start_date AND fs.period_end_date = p_period_end_date
            THEN fsc.net_income ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN fs.statement_type = 'income_statement' AND fs.period_type = p_period_type 
            AND fs.period_end_date = p_period_start_date - INTERVAL '1 day'
            THEN fsc.net_income ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN fs.statement_type = 'income_statement' AND fs.period_type = p_period_type 
            AND fs.period_end_date = p_period_start_date - INTERVAL '1 year'
            THEN fsc.net_income ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN fs.statement_type = 'balance_sheet' AND fs.period_type = p_period_type 
            AND fs.period_start_date = p_period_start_date AND fs.period_end_date = p_period_end_date
            THEN fsc.cash_and_equivalents ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN fs.statement_type = 'balance_sheet' AND fs.period_type = p_period_type 
            AND fs.period_end_date = p_period_start_date - INTERVAL '1 day'
            THEN fsc.cash_and_equivalents ELSE 0 END), 0)
    INTO 
        v_revenue_current, v_revenue_previous, v_revenue_previous_year,
        v_ebitda_current, v_ebitda_previous, v_ebitda_previous_year,
        v_net_profit_current, v_net_profit_previous, v_net_profit_previous_year,
        v_cash_position, v_cash_previous
    FROM financial_statements fs
    LEFT JOIN financial_statement_calculations fsc ON fs.id = fsc.statement_id
    WHERE fs.business_account_id = p_business_account_id;
    
    -- Calculate monthly burn rate (simplified calculation)
    v_monthly_burn_rate := GREATEST(0, v_ebitda_current * -1 / 12);
    
    -- Generate snapshot hash for immutability
    v_snapshot_hash := md5(
        p_business_account_id::text || 
        p_period_type || 
        p_period_start_date::text || 
        p_period_end_date::text ||
        v_revenue_current::text ||
        v_ebitda_current::text ||
        v_net_profit_current::text ||
        v_cash_position::text
    );
    
    -- Insert snapshot
    INSERT INTO board_kpi_snapshots (
        business_account_id,
        period_type,
        period_start_date,
        period_end_date,
        revenue_current,
        revenue_previous_period,
        revenue_previous_year,
        revenue_growth_qoq,
        revenue_growth_yoy,
        ebitda_current,
        ebitda_previous_period,
        ebitda_previous_year,
        ebitda_margin_current,
        net_profit_current,
        net_profit_previous_period,
        net_profit_previous_year,
        net_profit_margin_current,
        cash_position_current,
        cash_position_previous_period,
        monthly_burn_rate,
        cash_runway_months,
        created_by,
        snapshot_hash,
        data_sources
    ) VALUES (
        p_business_account_id,
        p_period_type,
        p_period_start_date,
        p_period_end_date,
        v_revenue_current,
        v_revenue_previous,
        v_revenue_previous_year,
        calculate_revenue_growth(v_revenue_current, v_revenue_previous),
        calculate_revenue_growth(v_revenue_current, v_revenue_previous_year),
        v_ebitda_current,
        v_ebitda_previous,
        v_ebitda_previous_year,
        CASE WHEN v_revenue_current > 0 THEN ROUND((v_ebitda_current / v_revenue_current) * 100, 2) ELSE 0 END,
        v_net_profit_current,
        v_net_profit_previous,
        v_net_profit_previous_year,
        CASE WHEN v_revenue_current > 0 THEN ROUND((v_net_profit_current / v_revenue_current) * 100, 2) ELSE 0 END,
        v_cash_position,
        v_cash_previous,
        v_monthly_burn_rate,
        calculate_cash_runway(v_cash_position, v_monthly_burn_rate),
        p_created_by,
        v_snapshot_hash,
        '["financial_statements", "forecast_engine"]'::jsonb
    ) RETURNING id INTO v_snapshot_id;
    
    RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- Refresh Materialized Views Function
CREATE OR REPLACE FUNCTION refresh_board_materialized_views() RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY board_kpi_trends;
    REFRESH MATERIALIZED VIEW CONCURRENTLY board_risk_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY board_alert_trends;
END;
$$ LANGUAGE plpgsql;

-- Triggers for Audit Logging
CREATE OR REPLACE FUNCTION board_audit_trigger() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO board_audit_log (
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
        'Board ' || TG_OP || ' on ' || TG_TABLE_NAME,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        COALESCE(NEW.created_by, NEW.updated_by, OLD.updated_by),
        jsonb_build_object(
            'old_values', row_to_json(OLD),
            'new_values', row_to_json(NEW)
        )
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers
CREATE TRIGGER board_kpi_snapshots_audit
    AFTER INSERT OR UPDATE OR DELETE ON board_kpi_snapshots
    FOR EACH ROW EXECUTE FUNCTION board_audit_trigger();

CREATE TRIGGER board_risk_assessments_audit
    AFTER INSERT OR UPDATE OR DELETE ON board_risk_assessments
    FOR EACH ROW EXECUTE FUNCTION board_audit_trigger();

CREATE TRIGGER board_strategic_alerts_audit
    AFTER INSERT OR UPDATE OR DELETE ON board_strategic_alerts
    FOR EACH ROW EXECUTE FUNCTION board_audit_trigger();

-- Insert default board narrative templates
INSERT INTO board_narrative_templates (template_name, template_type, template_content, language, created_by) VALUES
(
    'Executive Summary - English',
    'executive_summary',
    'The Board of Directors is pleased to present the {{period_type}} report for the period ending {{period_end_date}}. 

**Financial Performance:**
Revenue for the period reached {{revenue_current}}, representing a {{revenue_growth_qoq}}% change from the previous period. EBITDA margin stands at {{ebitda_margin_current}}%, with net profit margin at {{net_profit_margin_current}}%.

**Cash Position:**
The company maintains a strong cash position of {{cash_position_current}}, providing {{cash_runway_months}} months of operational runway at current burn rates.

**Strategic Highlights:**
{{strategic_highlights}}

**Key Risks:**
{{key_risks}}

**Outlook:**
{{forecast_outlook}}

The Board remains confident in the company''s strategic direction and financial trajectory.',
    'en',
    uuid_generate_v4()
),
(
    'Executive Summary - Arabic',
    'executive_summary',
    'يسر مجلس الإدارة تقديم التقرير {{period_type}} للفترة المنتهية في {{period_end_date}}.

**الأداء المالي:**
بلغت الإيرادات للفترة {{revenue_current}}، ممثلة تغييرًا بنسبة {{revenue_growth_qoq}}% عن الفترة السابقة. تبلغ هامش EBITDA {{ebitda_margin_current}}%، مع هامش صافي الربح يبلغ {{net_profit_margin_current}}%.

**المركز النقدي:**
تحافظ الشركة على مركز نقدي قوي يبلغ {{cash_position_current}}، مما يوفر {{cash_runway_months}} شهرًا من المدة التشغيلية بمعدلات الحرق الحالية.

**النقاط الاستراتيجية:**
{{strategic_highlights}}

**المخاطر الرئيسية:**
{{key_risks}}

**التوقعات:**
{{forecast_outlook}}

يظل مجلس الإدارة واثقًا في الاتجاه الاستراتيجي والمالي للشركة.',
    'ar',
    uuid_generate_v4()
),
(
    'Financial Analysis - English',
    'financial_analysis',
    '**Revenue Analysis:**
- Current Period: {{revenue_current}}
- Previous Period: {{revenue_previous_period}}
- Growth Rate: {{revenue_growth_qoq}}%
- Year-over-Year Growth: {{revenue_growth_yoy}}%

**Profitability Analysis:**
- EBITDA: {{ebitda_current}} (Margin: {{ebitda_margin_current}}%)
- Net Profit: {{net_profit_current}} (Margin: {{net_profit_margin_current}}%)
- Gross Margin: {{gross_margin_current}}%
- Operating Margin: {{operating_margin_current}}%

**Cash Flow Analysis:**
- Cash Position: {{cash_position_current}}
- Monthly Burn Rate: {{monthly_burn_rate}}
- Cash Runway: {{cash_runway_months}} months

**Key Performance Indicators:**
- Customer Acquisition Cost: {{customer_acquisition_cost}}
- Customer Lifetime Value: {{customer_lifetime_value}}
- LTV/CAC Ratio: {{ltv_cac_ratio}}',
    'en',
    uuid_generate_v4()
),
(
    'Risk Assessment - English',
    'risk_assessment',
    '**Risk Overview:**
The following key risks have been identified and are being actively monitored:

{{risk_details}}

**Risk Mitigation Strategies:**
{{mitigation_strategies}}

**Risk Governance:**
All risks are reviewed quarterly by the Board Risk Committee. High and critical risks require immediate attention and regular reporting to the Board.

**Emerging Risks:**
{{emerging_risks}}

**Risk Appetite:**
The company maintains a moderate risk appetite, balancing growth opportunities with financial stability and operational resilience.',
    'en',
    uuid_generate_v4()
);

-- Grant permissions to app_user
GRANT SELECT, INSERT, UPDATE, DELETE ON board_kpi_snapshots TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON board_risk_assessments TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON board_strategic_alerts TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON board_pack_documents TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON board_narrative_templates TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON board_access_control TO app_user;
GRANT SELECT, INSERT ON board_audit_log TO app_user;

GRANT SELECT ON board_kpi_trends TO app_user;
GRANT SELECT ON board_risk_summary TO app_user;
GRANT SELECT ON board_alert_trends TO app_user;

GRANT EXECUTE ON FUNCTION calculate_revenue_growth TO app_user;
GRANT EXECUTE ON FUNCTION calculate_cash_runway TO app_user;
GRANT EXECUTE ON FUNCTION calculate_risk_score TO app_user;
GRANT EXECUTE ON FUNCTION generate_board_kpi_snapshot TO app_user;
GRANT EXECUTE ON FUNCTION refresh_board_materialized_views TO app_user;

-- Create indexes for materialized views
CREATE INDEX idx_board_kpi_trends_business_quarter ON board_kpi_trends(business_account_id, quarter);
CREATE INDEX idx_board_risk_summary_business_level ON board_risk_summary(business_account_id, risk_level);
CREATE INDEX idx_board_alert_trends_business_month ON board_alert_trends(business_account_id, month);

-- Add comments for documentation
COMMENT ON TABLE board_kpi_snapshots IS 'Immutable snapshots of board-level KPIs for strategic reporting';
COMMENT ON TABLE board_risk_assessments IS 'Risk assessments and mitigation strategies for board oversight';
COMMENT ON TABLE board_strategic_alerts IS 'Strategic alerts and notifications requiring board attention';
COMMENT ON TABLE board_pack_documents IS 'Generated board pack documents (PDF, DOCX, HTML)';
COMMENT ON TABLE board_narrative_templates IS 'Templates for generating board narratives in multiple languages';
COMMENT ON TABLE board_access_control IS 'Role-based access control for board-level features';
COMMENT ON TABLE board_audit_log IS 'Comprehensive audit trail for all board-level activities';

COMMENT ON MATERIALIZED VIEW board_kpi_trends IS 'Quarterly KPI trends analysis for board reporting';
COMMENT ON MATERIALIZED VIEW board_risk_summary IS 'Summary of risk assessments by category and level';
COMMENT ON MATERIALIZED VIEW board_alert_trends IS 'Monthly trends in strategic alerts and resolutions';
