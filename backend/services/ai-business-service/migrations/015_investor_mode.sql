-- Sprint 15: Investor Mode Database Schema
-- Provides investors with clear, credible, decision-ready view
-- No operations. No internal noise. Only performance, growth, risks, and outlook.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Investor Snapshots Table
CREATE TABLE investor_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id),
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    
    -- Revenue & Growth KPIs
    current_period_revenue DECIMAL(15,2),
    previous_period_revenue DECIMAL(15,2),
    same_period_last_year_revenue DECIMAL(15,2),
    revenue_growth_qoq DECIMAL(8,4),
    revenue_growth_yoy DECIMAL(8,4),
    revenue_growth_trend VARCHAR(20) CHECK (revenue_growth_trend IN ('accelerating', 'stable', 'decelerating', 'negative')),
    
    -- Profitability Metrics
    gross_profit DECIMAL(15,2),
    gross_margin_percentage DECIMAL(8,4),
    ebitda DECIMAL(15,2),
    ebitda_margin_percentage DECIMAL(8,4),
    net_profit DECIMAL(15,2),
    net_margin_percentage DECIMAL(8,4),
    profitability_trend VARCHAR(20) CHECK (profitability_trend IN ('improving', 'stable', 'declining')),
    
    -- Cash & Runway
    cash_position DECIMAL(15,2),
    monthly_burn_rate DECIMAL(15,2),
    runway_months INTEGER,
    cash_flow_from_operations DECIMAL(15,2),
    cash_flow_trend VARCHAR(20) CHECK (cash_flow_trend IN ('positive', 'neutral', 'negative')),
    
    -- Unit Economics
    customer_acquisition_cost DECIMAL(10,2),
    lifetime_value DECIMAL(10,2),
    ltv_cac_ratio DECIMAL(8,4),
    payback_period_months INTEGER,
    unit_economics_health VARCHAR(20) CHECK (unit_economics_health IN ('excellent', 'good', 'fair', 'poor')),
    
    -- Capital Efficiency
    capital_raised DECIMAL(15,2),
    capital_deployed DECIMAL(15,2),
    capital_efficiency_ratio DECIMAL(8,4),
    return_on_invested_capital DECIMAL(8,4),
    
    -- Forecast Outlook
    forecast_revenue_next_period DECIMAL(15,2),
    forecast_growth_rate DECIMAL(8,4),
    forecast_confidence_level VARCHAR(20) CHECK (forecast_confidence_level IN ('high', 'moderate', 'low')),
    forecast_scenario VARCHAR(20) CHECK (forecast_scenario IN ('conservative', 'base', 'optimistic')),
    
    -- Overall Performance Score
    overall_performance_score INTEGER CHECK (overall_performance_score >= 0 AND overall_performance_score <= 100),
    investment_grade VARCHAR(20) CHECK (investment_grade IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    snapshot_hash VARCHAR(64) UNIQUE NOT NULL,
    data_sources JSONB,
    calculation_version VARCHAR(20) DEFAULT '1.0',
    
    -- Constraints
    CONSTRAINT investor_snapshots_unique_period UNIQUE(business_account_id, period_type, period_start_date, period_end_date),
    CONSTRAINT investor_snapshots_date_order CHECK (period_end_date >= period_start_date)
);

-- Investor Risk Disclosures Table
CREATE TABLE investor_risk_disclosures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES investor_snapshots(id) ON DELETE CASCADE,
    business_account_id UUID NOT NULL REFERENCES business_accounts(id),
    
    risk_rank INTEGER NOT NULL CHECK (risk_rank >= 1 AND risk_rank <= 5),
    risk_category VARCHAR(30) NOT NULL CHECK (risk_category IN ('market', 'financial', 'operational', 'regulatory', 'technology', 'competitive')),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    risk_title VARCHAR(200) NOT NULL,
    risk_description TEXT NOT NULL,
    potential_impact VARCHAR(100) NOT NULL,
    mitigation_strategy TEXT NOT NULL,
    mitigation_status VARCHAR(20) CHECK (mitigation_status IN ('not_started', 'in_progress', 'completed', 'monitored')),
    
    -- Investor-specific fields
    disclosure_level VARCHAR(20) CHECK (disclosure_level IN ('public', 'confidential', 'restricted')),
    regulatory_impact BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Investor Growth Scenarios Table
CREATE TABLE investor_growth_scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES investor_snapshots(id) ON DELETE CASCADE,
    business_account_id UUID NOT NULL REFERENCES business_accounts(id),
    
    scenario_type VARCHAR(20) NOT NULL CHECK (scenario_type IN ('conservative', 'base', 'optimistic')),
    time_horizon VARCHAR(20) NOT NULL CHECK (time_horizon IN ('1_year', '2_years', '3_years', '5_years')),
    
    -- Revenue Projections
    projected_revenue_year1 DECIMAL(15,2),
    projected_revenue_year2 DECIMAL(15,2),
    projected_revenue_year3 DECIMAL(15,2),
    projected_revenue_year5 DECIMAL(15,2),
    
    -- Profitability Projections
    projected_ebitda_year1 DECIMAL(15,2),
    projected_ebitda_year2 DECIMAL(15,2),
    projected_ebitda_year3 DECIMAL(15,2),
    projected_ebitda_year5 DECIMAL(15,2),
    
    -- Key Assumptions
    growth_assumptions JSONB,
    market_assumptions JSONB,
    operational_assumptions JSONB,
    
    scenario_confidence DECIMAL(3,2) CHECK (scenario_confidence >= 0 AND scenario_confidence <= 1),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Investor Unit Economics Table
CREATE TABLE investor_unit_economics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES investor_snapshots(id) ON DELETE CASCADE,
    business_account_id UUID NOT NULL REFERENCES business_accounts(id),
    
    -- Customer Metrics
    total_customers INTEGER,
    new_customers_period INTEGER,
    customer_churn_rate DECIMAL(5,4),
    customer_retention_rate DECIMAL(5,4),
    
    -- Revenue Per Customer
    average_revenue_per_customer DECIMAL(10,2),
    revenue_per_customer_growth DECIMAL(8,4),
    
    -- Cost Structure
    variable_cost_per_customer DECIMAL(10,2),
    fixed_cost_per_customer DECIMAL(10,2),
    total_cost_per_customer DECIMAL(10,2),
    
    -- Contribution Margins
    contribution_margin_per_customer DECIMAL(10,2),
    contribution_margin_percentage DECIMAL(8,4),
    
    -- Cohort Analysis
    cohort_ltv_12_months DECIMAL(10,2),
    cohort_ltv_24_months DECIMAL(10,2),
    cohort_payback_period_months INTEGER,
    
    -- Market Metrics
    market_penetration_rate DECIMAL(5,4),
    market_share_percentage DECIMAL(5,4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Investor Pack Documents Table
CREATE TABLE investor_pack_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES investor_snapshots(id) ON DELETE CASCADE,
    business_account_id UUID NOT NULL REFERENCES business_accounts(id),
    
    pack_type VARCHAR(30) NOT NULL CHECK (pack_type IN ('standard', 'detailed', 'executive', 'custom')),
    title VARCHAR(300) NOT NULL,
    executive_summary TEXT NOT NULL,
    key_highlights JSONB NOT NULL,
    financial_highlights JSONB NOT NULL,
    growth_metrics JSONB NOT NULL,
    risk_summary JSONB NOT NULL,
    
    -- Document Generation
    file_path VARCHAR(500),
    file_format VARCHAR(10) CHECK (file_format IN ('pdf', 'docx')),
    file_size_bytes INTEGER,
    download_count INTEGER DEFAULT 0,
    
    -- Language & Localization
    language VARCHAR(10) DEFAULT 'en' CHECK (language IN ('en', 'ar')),
    
    -- Generation Metadata
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    generated_by UUID REFERENCES users(id),
    generation_duration_ms INTEGER,
    template_version VARCHAR(20) DEFAULT '1.0',
    
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('generating', 'completed', 'failed')),
    
    -- Watermarking
    watermark_enabled BOOLEAN DEFAULT true,
    watermark_text VARCHAR(200),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Investor Access Control Table
CREATE TABLE investor_access_control (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id),
    user_id UUID REFERENCES users(id),
    
    -- Access Permissions
    investor_role VARCHAR(20) NOT NULL CHECK (investor_role IN ('lead_investor', 'institutional_investor', 'angel_investor', 'potential_investor')),
    can_view_dashboard BOOLEAN DEFAULT true,
    can_download_packs BOOLEAN DEFAULT true,
    can_view_detailed_metrics BOOLEAN DEFAULT true,
    can_view_unit_economics BOOLEAN DEFAULT true,
    can_view_growth_scenarios BOOLEAN DEFAULT true,
    can_view_risk_disclosures BOOLEAN DEFAULT true,
    can_share_externally BOOLEAN DEFAULT false,
    
    -- Access Restrictions
    access_start_date DATE DEFAULT CURRENT_DATE,
    access_end_date DATE,
    ip_restriction_enabled BOOLEAN DEFAULT false,
    allowed_ip_ranges INET[],
    session_timeout_minutes INTEGER DEFAULT 60,
    require_mfa BOOLEAN DEFAULT true,
    device_restriction_enabled BOOLEAN DEFAULT false,
    
    -- Data Restrictions
    max_historical_periods INTEGER DEFAULT 12,
    can_view_confidential_data BOOLEAN DEFAULT false,
    can_view_forecast_details BOOLEAN DEFAULT false,
    
    -- Grant Management
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES users(id),
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES users(id),
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    
    -- Constraints
    CONSTRAINT investor_access_unique_user UNIQUE(user_id, business_account_id),
    CONSTRAINT investor_access_date_order CHECK (access_end_date IS NULL OR access_end_date >= access_start_date)
);

-- Investor Share Links Table
CREATE TABLE investor_share_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id),
    snapshot_id UUID REFERENCES investor_snapshots(id),
    pack_document_id UUID REFERENCES investor_pack_documents(id),
    
    -- Link Configuration
    share_token VARCHAR(128) UNIQUE NOT NULL,
    share_title VARCHAR(200) NOT NULL,
    share_description TEXT,
    
    -- Access Control
    access_level VARCHAR(20) NOT NULL CHECK (access_level IN ('summary', 'standard', 'detailed')),
    password_protected BOOLEAN DEFAULT false,
    password_hash VARCHAR(255),
    
    -- Time Restrictions
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    -- Usage Tracking
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    
    -- Security
    ip_whitelist INET[],
    domain_whitelist VARCHAR[],
    watermark_enabled BOOLEAN DEFAULT true,
    
    -- Constraints
    CONSTRAINT investor_share_expires_future CHECK (expires_at > created_at)
);

-- Investor Audit Log Table
CREATE TABLE investor_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id),
    
    -- Action Details
    action_type VARCHAR(50) NOT NULL,
    action_description TEXT NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    
    -- User Context
    performed_by UUID REFERENCES users(id),
    user_role VARCHAR(20),
    session_id VARCHAR(128),
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    
    -- Access Context
    access_method VARCHAR(20) CHECK (access_method IN ('direct', 'share_link', 'api')),
    share_token VARCHAR(128),
    
    -- Security Context
    mfa_verified BOOLEAN DEFAULT false,
    access_granted BOOLEAN DEFAULT true,
    access_denied_reason VARCHAR(200),
    
    -- Performance Metrics
    action_duration_ms INTEGER,
    data_volume_bytes INTEGER,
    
    -- Data Changes
    old_values JSONB,
    new_values JSONB,
    
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    additional_data JSONB
);

-- Materialized Views for Investor Analytics

-- Investor Performance Trends
CREATE MATERIALIZED VIEW investor_performance_trends AS
SELECT 
    business_account_id,
    period_type,
    DATE_TRUNC('quarter', period_end_date) as quarter,
    AVG(overall_performance_score) as avg_performance_score,
    AVG(revenue_growth_qoq) as avg_revenue_growth_qoq,
    AVG(revenue_growth_yoy) as avg_revenue_growth_yoy,
    AVG(gross_margin_percentage) as avg_gross_margin,
    AVG(ebitda_margin_percentage) as avg_ebitda_margin,
    AVG(ltv_cac_ratio) as avg_ltv_cac_ratio,
    COUNT(*) as snapshot_count,
    MAX(period_end_date) as latest_snapshot
FROM investor_snapshots
GROUP BY business_account_id, period_type, DATE_TRUNC('quarter', period_end_date);

-- Investor Risk Summary
CREATE MATERIALIZED VIEW investor_risk_summary AS
SELECT 
    business_account_id,
    risk_category,
    risk_level,
    COUNT(*) as risk_count,
    AVG(risk_rank) as avg_risk_rank,
    MAX(created_at) as latest_identification,
    STRING_AGG(DISTINCT mitigation_status, ', ') as mitigation_statuses
FROM investor_risk_disclosures
GROUP BY business_account_id, risk_category, risk_level;

-- Investor Unit Economics Summary
CREATE MATERIALIZED VIEW investor_unit_economics_summary AS
SELECT 
    business_account_id,
    DATE_TRUNC('quarter', created_at) as quarter,
    AVG(total_customers) as avg_total_customers,
    AVG(customer_retention_rate) as avg_retention_rate,
    AVG(average_revenue_per_customer) as avg_arpu,
    AVG(contribution_margin_percentage) as avg_contribution_margin,
    AVG(ltv_cac_ratio) as avg_ltv_cac_ratio,
    COUNT(*) as snapshot_count
FROM investor_unit_economics
GROUP BY business_account_id, DATE_TRUNC('quarter', created_at);

-- Functions for Investor Mode

-- Generate Investor Snapshot Function
CREATE OR REPLACE FUNCTION generate_investor_snapshot(
    p_business_account_id UUID,
    p_period_type VARCHAR(20),
    p_period_start_date DATE,
    p_period_end_date,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_snapshot_id UUID;
    v_revenue_current DECIMAL(15,2);
    v_revenue_previous DECIMAL(15,2);
    v_revenue_last_year DECIMAL(15,2);
    v_snapshot_hash VARCHAR(64);
    v_data_sources JSONB;
BEGIN
    -- Generate UUID for snapshot
    v_snapshot_id := uuid_generate_v4();
    
    -- Calculate revenue metrics from financial statements
    SELECT 
        COALESCE(SUM(CASE WHEN fs.statement_type = 'income_statement' AND fsc.line_item_name = 'revenue' THEN fsc.amount ELSE 0 END), 0)
    INTO v_revenue_current
    FROM financial_statements fs
    JOIN financial_statement_calculations fsc ON fs.id = fsc.statement_id
    WHERE fs.business_account_id = p_business_account_id
        AND fs.period_start_date >= p_period_start_date
        AND fs.period_end_date <= p_period_end_date
        AND fs.statement_type = 'income_statement';
    
    -- Get previous period revenue
    SELECT 
        COALESCE(SUM(CASE WHEN fs.statement_type = 'income_statement' AND fsc.line_item_name = 'revenue' THEN fsc.amount ELSE 0 END), 0)
    INTO v_revenue_previous
    FROM financial_statements fs
    JOIN financial_statement_calculations fsc ON fs.id = fsc.statement_id
    WHERE fs.business_account_id = p_business_account_id
        AND fs.period_start_date >= p_period_start_date - INTERVAL '3 months'
        AND fs.period_end_date <= p_period_end_date - INTERVAL '3 months'
        AND fs.statement_type = 'income_statement';
    
    -- Get same period last year revenue
    SELECT 
        COALESCE(SUM(CASE WHEN fs.statement_type = 'income_statement' AND fsc.line_item_name = 'revenue' THEN fsc.amount ELSE 0 END), 0)
    INTO v_revenue_last_year
    FROM financial_statements fs
    JOIN financial_statement_calculations fsc ON fs.id = fsc.statement_id
    WHERE fs.business_account_id = p_business_account_id
        AND fs.period_start_date >= p_period_start_date - INTERVAL '1 year'
        AND fs.period_end_date <= p_period_end_date - INTERVAL '1 year'
        AND fs.statement_type = 'income_statement';
    
    -- Generate snapshot hash
    v_snapshot_hash := encode(sha256(
        p_business_account_id::TEXT || 
        p_period_type || 
        p_period_start_date::TEXT || 
        p_period_end_date::TEXT ||
        v_revenue_current::TEXT ||
        CURRENT_TIMESTAMP::TEXT
    ), 'hex');
    
    -- Prepare data sources
    v_data_sources := jsonb_build_object(
        'financial_statements', true,
        'board_reporting', true,
        'ai_decision_layer', true,
        'fpna_engine', true
    );
    
    -- Create investor snapshot
    INSERT INTO investor_snapshots (
        id,
        business_account_id,
        period_type,
        period_start_date,
        period_end_date,
        current_period_revenue,
        previous_period_revenue,
        same_period_last_year_revenue,
        revenue_growth_qoq,
        revenue_growth_yoy,
        created_by,
        snapshot_hash,
        data_sources
    ) VALUES (
        v_snapshot_id,
        p_business_account_id,
        p_period_type,
        p_period_start_date,
        p_period_end_date,
        v_revenue_current,
        v_revenue_previous,
        v_revenue_last_year,
        CASE WHEN v_revenue_previous > 0 THEN ((v_revenue_current - v_revenue_previous) / v_revenue_previous) * 100 ELSE 0 END,
        CASE WHEN v_revenue_last_year > 0 THEN ((v_revenue_current - v_revenue_last_year) / v_revenue_last_year) * 100 ELSE 0 END,
        p_created_by,
        v_snapshot_hash,
        v_data_sources
    );
    
    RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- Calculate Investor Performance Score Function
CREATE OR REPLACE FUNCTION calculate_investor_performance_score(
    p_snapshot_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_snapshot investor_snapshots%ROWTYPE;
    v_score INTEGER := 0;
BEGIN
    -- Get snapshot data
    SELECT * INTO v_snapshot FROM investor_snapshots WHERE id = p_snapshot_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Revenue Growth Score (30% weight)
    IF v_snapshot.revenue_growth_yoy > 50 THEN
        v_score := v_score + 30;
    ELSIF v_snapshot.revenue_growth_yoy > 25 THEN
        v_score := v_score + 25;
    ELSIF v_snapshot.revenue_growth_yoy > 10 THEN
        v_score := v_score + 20;
    ELSIF v_snapshot.revenue_growth_yoy > 0 THEN
        v_score := v_score + 15;
    END IF;
    
    -- Profitability Score (25% weight)
    IF v_snapshot.net_margin_percentage > 20 THEN
        v_score := v_score + 25;
    ELSIF v_snapshot.net_margin_percentage > 10 THEN
        v_score := v_score + 20;
    ELSIF v_snapshot.net_margin_percentage > 5 THEN
        v_score := v_score + 15;
    ELSIF v_snapshot.net_margin_percentage > 0 THEN
        v_score := v_score + 10;
    END IF;
    
    -- Cash Position Score (20% weight)
    IF v_snapshot.runway_months > 24 THEN
        v_score := v_score + 20;
    ELSIF v_snapshot.runway_months > 18 THEN
        v_score := v_score + 15;
    ELSIF v_snapshot.runway_months > 12 THEN
        v_score := v_score + 10;
    ELSIF v_snapshot.runway_months > 6 THEN
        v_score := v_score + 5;
    END IF;
    
    -- Unit Economics Score (15% weight)
    IF v_snapshot.ltv_cac_ratio > 4 THEN
        v_score := v_score + 15;
    ELSIF v_snapshot.ltv_cac_ratio > 3 THEN
        v_score := v_score + 12;
    ELSIF v_snapshot.ltv_cac_ratio > 2 THEN
        v_score := v_score + 8;
    ELSIF v_snapshot.ltv_cac_ratio > 1 THEN
        v_score := v_score + 4;
    END IF;
    
    -- Capital Efficiency Score (10% weight)
    IF v_snapshot.capital_efficiency_ratio > 2 THEN
        v_score := v_score + 10;
    ELSIF v_snapshot.capital_efficiency_ratio > 1.5 THEN
        v_score := v_score + 8;
    ELSIF v_snapshot.capital_efficiency_ratio > 1 THEN
        v_score := v_score + 5;
    END IF;
    
    -- Update snapshot with calculated score
    UPDATE investor_snapshots 
    SET overall_performance_score = v_score
    WHERE id = p_snapshot_id;
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Generate Share Token Function
CREATE OR REPLACE FUNCTION generate_investor_share_token(
    p_business_account_id UUID,
    p_snapshot_id UUID,
    p_pack_document_id UUID,
    p_access_level VARCHAR(20),
    p_expires_hours INTEGER,
    p_created_by UUID
) RETURNS VARCHAR AS $$
DECLARE
    v_share_token VARCHAR(128);
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate unique share token
    v_share_token := encode(sha256(
        p_business_account_id::TEXT || 
        p_snapshot_id::TEXT || 
        p_pack_document_id::TEXT ||
        CURRENT_TIMESTAMP::TEXT ||
        random()::TEXT
    ), 'hex');
    
    -- Calculate expiration
    v_expires_at := CURRENT_TIMESTAMP + (p_expires_hours || ' hours')::INTERVAL;
    
    -- Create share link
    INSERT INTO investor_share_links (
        business_account_id,
        snapshot_id,
        pack_document_id,
        share_token,
        share_title,
        access_level,
        expires_at,
        created_by
    ) VALUES (
        p_business_account_id,
        p_snapshot_id,
        p_pack_document_id,
        v_share_token,
        'Investor Pack - ' || TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'),
        p_access_level,
        v_expires_at,
        p_created_by
    );
    
    RETURN v_share_token;
END;
$$ LANGUAGE plpgsql;

-- Refresh Investor Materialized Views Function
CREATE OR REPLACE FUNCTION refresh_investor_materialized_views() RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY investor_performance_trends;
    REFRESH MATERIALIZED VIEW CONCURRENTLY investor_risk_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY investor_unit_economics_summary;
END;
$$ LANGUAGE plpgsql;

-- Audit Trigger for Investor Snapshots
CREATE OR REPLACE FUNCTION investor_snapshot_audit_trigger() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO investor_audit_log (
            business_account_id,
            action_type,
            action_description,
            entity_type,
            entity_id,
            performed_by,
            new_values
        ) VALUES (
            NEW.business_account_id,
            'snapshot_created',
            'Investor snapshot created for period ' || NEW.period_start_date || ' to ' || NEW.period_end_date,
            'investor_snapshot',
            NEW.id,
            NEW.created_by,
            row_to_json(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO investor_audit_log (
            business_account_id,
            action_type,
            action_description,
            entity_type,
            entity_id,
            old_values,
            new_values
        ) VALUES (
            NEW.business_account_id,
            'snapshot_updated',
            'Investor snapshot updated',
            'investor_snapshot',
            NEW.id,
            row_to_json(OLD),
            row_to_json(NEW)
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER investor_snapshot_audit
    AFTER INSERT OR UPDATE ON investor_snapshots
    FOR EACH ROW EXECUTE FUNCTION investor_snapshot_audit_trigger();

-- Indexes for Performance
CREATE INDEX idx_investor_snapshots_business_account ON investor_snapshots(business_account_id);
CREATE INDEX idx_investor_snapshots_period ON investor_snapshots(business_account_id, period_type, period_end_date);
CREATE INDEX idx_investor_snapshots_performance ON investor_snapshots(business_account_id, overall_performance_score);
CREATE INDEX idx_investor_risk_disclosures_snapshot ON investor_risk_disclosures(snapshot_id);
CREATE INDEX idx_investor_risk_disclosures_business ON investor_risk_disclosures(business_account_id, risk_level);
CREATE INDEX idx_investor_pack_documents_snapshot ON investor_pack_documents(snapshot_id);
CREATE INDEX idx_investor_access_control_user ON investor_access_control(user_id, business_account_id);
CREATE INDEX idx_investor_share_links_token ON investor_share_links(share_token);
CREATE INDEX idx_investor_share_links_expires ON investor_share_links(expires_at);
CREATE INDEX idx_investor_audit_log_business ON investor_audit_log(business_account_id, performed_at);

-- Row Level Security Policies
ALTER TABLE investor_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_risk_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_growth_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_unit_economics ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_pack_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_access_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_share_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Investor Access
CREATE POLICY investor_snapshots_access ON investor_snapshots
    FOR ALL TO authenticated_users
    USING (
        business_account_id IN (
            SELECT business_account_id FROM investor_access_control 
            WHERE user_id = current_setting('app.current_user_id')::UUID
                AND can_view_dashboard = true
                AND (revoked_at IS NULL)
                AND (access_end_date IS NULL OR access_end_date >= CURRENT_DATE)
        )
    );

CREATE POLICY investor_risk_disclosures_access ON investor_risk_disclosures
    FOR ALL TO authenticated_users
    USING (
        business_account_id IN (
            SELECT business_account_id FROM investor_access_control 
            WHERE user_id = current_setting('app.current_user_id')::UUID
                AND can_view_risk_disclosures = true
                AND (revoked_at IS NULL)
                AND (access_end_date IS NULL OR access_end_date >= CURRENT_DATE)
        )
    );

-- Grant Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON investor_snapshots TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON investor_risk_disclosures TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON investor_growth_scenarios TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON investor_unit_economics TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON investor_pack_documents TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON investor_access_control TO authenticated_users;
GRANT SELECT, INSERT, UPDATE, DELETE ON investor_share_links TO authenticated_users;
GRANT SELECT, INSERT ON investor_audit_log TO authenticated_users;

-- Grant Usage on Materialized Views
GRANT SELECT ON investor_performance_trends TO authenticated_users;
GRANT SELECT ON investor_risk_summary TO authenticated_users;
GRANT SELECT ON investor_unit_economics_summary TO authenticated_users;

COMMIT;
