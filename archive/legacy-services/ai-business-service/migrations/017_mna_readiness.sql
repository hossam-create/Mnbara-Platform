-- Sprint 17: M&A Readiness Mode Migration
-- Creates tables for M&A readiness, financial normalization, and scenario analysis

-- M&A Readiness Snapshots
CREATE TABLE mna_readiness_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id),
    snapshot_name VARCHAR(200) NOT NULL,
    snapshot_description TEXT,
    snapshot_period_start DATE NOT NULL,
    snapshot_period_end DATE NOT NULL,
    valuation_date DATE NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    exchange_rate DECIMAL(12,6) DEFAULT 1.0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'archived')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_account_id, snapshot_name)
);

-- Normalized Financial Statements
CREATE TABLE mna_normalized_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id UUID NOT NULL REFERENCES mna_readiness_snapshots(id),
    statement_type VARCHAR(20) NOT NULL CHECK (statement_type IN ('income_statement', 'balance_sheet', 'cash_flow')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Revenue normalization
    reported_revenue DECIMAL(15,2) NOT NULL,
    normalized_revenue DECIMAL(15,2) NOT NULL,
    revenue_adjustments JSONB DEFAULT '[]',
    
    -- Expense normalization
    reported_expenses DECIMAL(15,2) NOT NULL,
    normalized_expenses DECIMAL(15,2) NOT NULL,
    expense_adjustments JSONB DEFAULT '[]',
    
    -- EBITDA normalization
    reported_ebitda DECIMAL(15,2) NOT NULL,
    adjusted_ebitda DECIMAL(15,2) NOT NULL,
    ebitda_adjustments JSONB DEFAULT '[]',
    
    -- Net income normalization
    reported_net_income DECIMAL(15,2) NOT NULL,
    normalized_net_income DECIMAL(15,2) NOT NULL,
    net_income_adjustments JSONB DEFAULT '[]',
    
    -- Balance sheet items
    total_assets DECIMAL(15,2),
    total_liabilities DECIMAL(15,2),
    equity DECIMAL(15,2),
    working_capital DECIMAL(15,2),
    
    -- Cash flow
    operating_cash_flow DECIMAL(15,2),
    investing_cash_flow DECIMAL(15,2),
    financing_cash_flow DECIMAL(15,2),
    free_cash_flow DECIMAL(15,2),
    
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Non-Recurring Items Classification
CREATE TABLE mna_non_recurring_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id UUID NOT NULL REFERENCES mna_readiness_snapshots(id),
    item_name VARCHAR(200) NOT NULL,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('revenue', 'expense', 'gain', 'loss')),
    item_category VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    description TEXT,
    justification TEXT,
    supporting_documents JSONB DEFAULT '[]',
    classification VARCHAR(20) NOT NULL CHECK (classification IN ('one_time', 'extraordinary', 'discontinued', 'restructuring', 'other')),
    impact_on_ebitda DECIMAL(15,2) NOT NULL,
    impact_on_net_income DECIMAL(15,2) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Historical Performance Packs
CREATE TABLE mna_historical_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id),
    snapshot_id UUID REFERENCES mna_readiness_snapshots(id),
    pack_name VARCHAR(200) NOT NULL,
    pack_type VARCHAR(20) NOT NULL CHECK (pack_type IN ('financial_summary', 'operational_metrics', 'growth_analysis', 'profitability_analysis')),
    years_covered INTEGER[] NOT NULL,
    period_type VARCHAR(10) NOT NULL CHECK (period_type IN ('annual', 'quarterly', 'monthly')),
    data_points JSONB NOT NULL,
    trend_analysis JSONB DEFAULT '{}',
    key_insights JSONB DEFAULT '[]',
    pack_format VARCHAR(10) DEFAULT 'json' CHECK (pack_format IN ('json', 'pdf', 'excel')),
    pack_file_path VARCHAR(500),
    pack_size_bytes INTEGER,
    generated_by UUID NOT NULL REFERENCES users(id),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP,
    download_count INTEGER DEFAULT 0
);

-- Scenario Analysis
CREATE TABLE mna_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id UUID NOT NULL REFERENCES mna_readiness_snapshots(id),
    scenario_name VARCHAR(200) NOT NULL,
    scenario_type VARCHAR(20) NOT NULL CHECK (scenario_type IN ('base_case', 'optimistic', 'conservative', 'custom')),
    scenario_description TEXT,
    time_horizon_years INTEGER NOT NULL DEFAULT 5,
    
    -- Revenue assumptions
    revenue_growth_rates JSONB NOT NULL,
    revenue_drivers JSONB DEFAULT '{}',
    
    -- Expense assumptions
    expense_growth_rates JSONB NOT NULL,
    expense_efficiency_improvements JSONB DEFAULT '{}',
    
    -- Capital assumptions
    capex_assumptions JSONB DEFAULT '{}',
    working_capital_assumptions JSONB DEFAULT '{}',
    
    -- Valuation assumptions
    discount_rate DECIMAL(5,4),
    terminal_growth_rate DECIMAL(5,4),
    multiples JSONB DEFAULT '{}',
    
    -- Results
    projected_revenue JSONB NOT NULL,
    projected_ebitda JSONB NOT NULL,
    projected_cash_flow JSONB NOT NULL,
    valuation_results JSONB NOT NULL,
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Synergy Analysis
CREATE TABLE mna_synergy_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id UUID NOT NULL REFERENCES mna_readiness_snapshots(id),
    analysis_name VARCHAR(200) NOT NULL,
    target_company_profile JSONB DEFAULT '{}',
    synergy_categories JSONB NOT NULL,
    
    -- Revenue synergies
    cross_selling_opportunities JSONB DEFAULT '[]',
    market_expansion_opportunities JSONB DEFAULT '[]',
    pricing_power_improvements JSONB DEFAULT '[]',
    revenue_synergy_value DECIMAL(15,2) DEFAULT 0,
    
    -- Cost synergies
    operational_efficiencies JSONB DEFAULT '[]',
    procurement_savings JSONB DEFAULT '[]',
    overhead_reduction JSONB DEFAULT '[]',
    cost_synergy_value DECIMAL(15,2) DEFAULT 0,
    
    -- Implementation timeline
    implementation_timeline JSONB DEFAULT '{}',
    realization_rates JSONB DEFAULT '{}',
    total_synergy_value DECIMAL(15,2) NOT NULL,
    npv_of_synergies DECIMAL(15,2),
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buyer-Ready Documentation
CREATE TABLE mna_buyer_ready_docs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id UUID NOT NULL REFERENCES mna_readiness_snapshots(id),
    doc_name VARCHAR(200) NOT NULL,
    doc_type VARCHAR(30) NOT NULL CHECK (doc_type IN ('financial_summary', 'business_overview', 'operational_metrics', 'market_analysis', 'risk_assessment', 'due_diligence_checklist')),
    doc_content JSONB NOT NULL,
    doc_format VARCHAR(10) DEFAULT 'json' CHECK (doc_format IN ('json', 'pdf', 'word', 'excel')),
    file_path VARCHAR(500),
    file_size_bytes INTEGER,
    
    -- Document metadata
    target_audience VARCHAR(20) CHECK (target_audience IN ('strategic_buyer', 'financial_buyer', 'private_equity', 'family_office')),
    confidentiality_level VARCHAR(20) DEFAULT 'confidential' CHECK (confidential_level IN ('public', 'confidential', 'restricted', 'classified')),
    language VARCHAR(2) DEFAULT 'en' CHECK (language IN ('en', 'ar')),
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'final')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- M&A Access Control
CREATE TABLE mna_access_control (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id),
    user_id UUID NOT NULL REFERENCES users(id),
    access_role VARCHAR(20) NOT NULL CHECK (access_role IN ('mna_admin', 'financial_analyst', 'strategic_advisor', 'legal_counsel', 'viewer')),
    
    -- Permissions
    can_view_snapshots BOOLEAN DEFAULT false,
    can_create_snapshots BOOLEAN DEFAULT false,
    can_edit_snapshots BOOLEAN DEFAULT false,
    can_view_normalized_statements BOOLEAN DEFAULT false,
    can_edit_normalizations BOOLEAN DEFAULT false,
    can_view_scenarios BOOLEAN DEFAULT false,
    can_create_scenarios BOOLEAN DEFAULT false,
    can_view_synergies BOOLEAN DEFAULT false,
    can_create_synergies BOOLEAN DEFAULT false,
    can_view_buyer_docs BOOLEAN DEFAULT false,
    can_create_buyer_docs BOOLEAN DEFAULT false,
    can_export_data BOOLEAN DEFAULT false,
    can_share_externally BOOLEAN DEFAULT false,
    
    access_start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    access_end_date TIMESTAMP,
    
    granted_by UUID NOT NULL REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_by UUID REFERENCES users(id),
    revoked_at TIMESTAMP,
    
    last_accessed_at TIMESTAMP,
    access_count INTEGER DEFAULT 0,
    
    UNIQUE(business_account_id, user_id)
);

-- M&A Activity Log
CREATE TABLE mna_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id),
    activity_type VARCHAR(30) NOT NULL,
    activity_description TEXT NOT NULL,
    
    -- Entity references
    entity_type VARCHAR(20),
    entity_id UUID,
    entity_name VARCHAR(200),
    
    -- User information
    performed_by UUID REFERENCES users(id),
    user_role VARCHAR(20),
    user_email VARCHAR(255),
    
    -- Session information
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    
    -- Activity details
    activity_duration_ms INTEGER,
    data_volume_bytes INTEGER,
    
    -- Additional metadata
    additional_data JSONB DEFAULT '{}',
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Materialized Views for Analytics
CREATE MATERIALIZED VIEW mna_readiness_summary AS
SELECT 
    s.business_account_id,
    COUNT(*) as total_snapshots,
    COUNT(CASE WHEN s.status = 'final' THEN 1 END) as final_snapshots,
    MAX(s.created_at) as latest_snapshot,
    AVG(CASE WHEN ns.adjusted_ebitda > 0 THEN ns.adjusted_ebitda END) as avg_adjusted_ebitda,
    COUNT(DISTINCT nri.id) as non_recurring_items_count,
    COUNT(DISTINCT hp.id) as historical_packs_count,
    COUNT(DISTINCT sc.id) as scenarios_count,
    COUNT(DISTINCT sa.id) as synergy_analyses_count
FROM mna_readiness_snapshots s
LEFT JOIN mna_normalized_statements ns ON s.id = ns.snapshot_id
LEFT JOIN mna_non_recurring_items nri ON s.id = nri.snapshot_id
LEFT JOIN mna_historical_packs hp ON s.id = hp.snapshot_id OR hp.business_account_id = s.business_account_id
LEFT JOIN mna_scenarios sc ON s.id = sc.snapshot_id
LEFT JOIN mna_synergy_analysis sa ON s.id = sa.snapshot_id
GROUP BY s.business_account_id;

CREATE MATERIALIZED VIEW mna_normalization_summary AS
SELECT 
    ns.snapshot_id,
    s.snapshot_name,
    s.business_account_id,
    ns.statement_type,
    ns.period_start,
    ns.period_end,
    ns.reported_revenue,
    ns.normalized_revenue,
    (ns.normalized_revenue - ns.reported_revenue) as revenue_adjustment,
    ns.reported_ebitda,
    ns.adjusted_ebitda,
    (ns.adjusted_ebitda - ns.reported_ebitda) as ebitda_adjustment,
    ns.reported_net_income,
    ns.normalized_net_income,
    (ns.normalized_net_income - ns.reported_net_income) as net_income_adjustment,
    ns.verification_status,
    ns.verified_at
FROM mna_normalized_statements ns
JOIN mna_readiness_snapshots s ON ns.snapshot_id = s.id;

CREATE MATERIALIZED VIEW mna_scenario_summary AS
SELECT 
    sc.snapshot_id,
    s.snapshot_name,
    s.business_account_id,
    sc.scenario_name,
    sc.scenario_type,
    sc.time_horizon_years,
    (sc.valuation_results->>'enterprise_value')::DECIMAL as enterprise_value,
    (sc.valuation_results->>'equity_value')::DECIMAL as equity_value,
    (sc.valuation_results->>'ev_ebitda_multiple')::DECIMAL as ev_ebitda_multiple,
    sc.discount_rate,
    sc.terminal_growth_rate,
    sc.created_at
FROM mna_scenarios sc
JOIN mna_readiness_snapshots s ON sc.snapshot_id = s.id;

-- Functions for M&A operations
CREATE OR REPLACE FUNCTION generate_mna_readiness_snapshot(
    p_business_account_id UUID,
    p_snapshot_name VARCHAR(200),
    p_period_start DATE,
    p_period_end DATE,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_snapshot_id UUID;
BEGIN
    INSERT INTO mna_readiness_snapshots (
        business_account_id,
        snapshot_name,
        snapshot_period_start,
        snapshot_period_end,
        valuation_date,
        created_by
    ) VALUES (
        p_business_account_id,
        p_snapshot_name,
        p_period_start,
        p_period_end,
        CURRENT_DATE,
        p_created_by
    ) RETURNING id INTO v_snapshot_id;
    
    RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_normalized_statement(
    p_snapshot_id UUID,
    p_statement_type VARCHAR(20),
    p_period_start DATE,
    p_period_end DATE,
    p_reported_revenue DECIMAL,
    p_normalized_revenue DECIMAL,
    p_reported_ebitda DECIMAL,
    p_adjusted_ebitda DECIMAL,
    p_reported_net_income DECIMAL,
    p_normalized_net_income DECIMAL,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_statement_id UUID;
BEGIN
    INSERT INTO mna_normalized_statements (
        snapshot_id,
        statement_type,
        period_start,
        period_end,
        reported_revenue,
        normalized_revenue,
        reported_ebitda,
        adjusted_ebitda,
        reported_net_income,
        normalized_net_income
    ) VALUES (
        p_snapshot_id,
        p_statement_type,
        p_period_start,
        p_period_end,
        p_reported_revenue,
        p_normalized_revenue,
        p_reported_ebitda,
        p_adjusted_ebitda,
        p_reported_net_income,
        p_normalized_net_income
    ) RETURNING id INTO v_statement_id;
    
    RETURN v_statement_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_mna_scenario(
    p_snapshot_id UUID,
    p_scenario_name VARCHAR(200),
    p_scenario_type VARCHAR(20),
    p_time_horizon_years INTEGER,
    p_revenue_growth_rates JSONB,
    p_expense_growth_rates JSONB,
    p_discount_rate DECIMAL,
    p_terminal_growth_rate DECIMAL,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_scenario_id UUID;
BEGIN
    INSERT INTO mna_scenarios (
        snapshot_id,
        scenario_name,
        scenario_type,
        time_horizon_years,
        revenue_growth_rates,
        expense_growth_rates,
        discount_rate,
        terminal_growth_rate,
        created_by
    ) VALUES (
        p_snapshot_id,
        p_scenario_name,
        p_scenario_type,
        p_time_horizon_years,
        p_revenue_growth_rates,
        p_expense_growth_rates,
        p_discount_rate,
        p_terminal_growth_rate,
        p_created_by
    ) RETURNING id INTO v_scenario_id;
    
    RETURN v_scenario_id;
END;
$$ LANGUAGE plpgsql;

-- Triggers for audit logging
CREATE OR REPLACE FUNCTION log_mna_activity() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO mna_activity_log (
        business_account_id,
        activity_type,
        activity_description,
        entity_type,
        entity_id,
        entity_name,
        performed_by,
        performed_at
    ) VALUES (
        COALESCE(NEW.business_account_id, OLD.business_account_id),
        TG_OP,
        CASE TG_OP
            WHEN 'INSERT' THEN 'Created ' || TG_TABLE_NAME
            WHEN 'UPDATE' THEN 'Updated ' || TG_TABLE_NAME
            WHEN 'DELETE' THEN 'Deleted ' || TG_TABLE_NAME
        END,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        COALESCE(NEW.snapshot_name, OLD.snapshot_name, NEW.doc_name, OLD.doc_name, NEW.scenario_name, OLD.scenario_name),
        COALESCE(NEW.created_by, OLD.created_by),
        CURRENT_TIMESTAMP
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to main tables
CREATE TRIGGER mna_readiness_snapshots_audit
    AFTER INSERT OR UPDATE OR DELETE ON mna_readiness_snapshots
    FOR EACH ROW EXECUTE FUNCTION log_mna_activity();

CREATE TRIGGER mna_normalized_statements_audit
    AFTER INSERT OR UPDATE OR DELETE ON mna_normalized_statements
    FOR EACH ROW EXECUTE FUNCTION log_mna_activity();

CREATE TRIGGER mna_scenarios_audit
    AFTER INSERT OR UPDATE OR DELETE ON mna_scenarios
    FOR EACH ROW EXECUTE FUNCTION log_mna_activity();

CREATE TRIGGER mna_synergy_analysis_audit
    AFTER INSERT OR UPDATE OR DELETE ON mna_synergy_analysis
    FOR EACH ROW EXECUTE FUNCTION log_mna_activity();

-- Row Level Security (RLS) Policies
ALTER TABLE mna_readiness_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE mna_normalized_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE mna_non_recurring_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mna_historical_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mna_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE mna_synergy_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE mna_buyer_ready_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mna_access_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE mna_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for M&A access control
CREATE POLICY mna_access_control_policy ON mna_access_control
    FOR ALL TO authenticated_users
    USING (
        user_id = current_setting('app.current_user_id')::UUID
        OR EXISTS (
            SELECT 1 FROM mna_access_control ac
            WHERE ac.user_id = current_setting('app.current_user_id')::UUID
            AND ac.business_account_id = mna_access_control.business_account_id
            AND ac.can_view_snapshots = true
            AND (ac.access_end_date IS NULL OR ac.access_end_date > CURRENT_TIMESTAMP)
        )
    );

CREATE POLICY mna_readiness_snapshots_policy ON mna_readiness_snapshots
    FOR SELECT TO authenticated_users
    USING (
        EXISTS (
            SELECT 1 FROM mna_access_control ac
            WHERE ac.user_id = current_setting('app.current_user_id')::UUID
            AND ac.business_account_id = mna_readiness_snapshots.business_account_id
            AND ac.can_view_snapshots = true
            AND (ac.access_end_date IS NULL OR ac.access_end_date > CURRENT_TIMESTAMP)
        )
    );

CREATE POLICY mna_normalized_statements_policy ON mna_normalized_statements
    FOR SELECT TO authenticated_users
    USING (
        EXISTS (
            SELECT 1 FROM mna_access_control ac
            WHERE ac.user_id = current_setting('app.current_user_id')::UUID
            AND ac.business_account_id = (
                SELECT business_account_id FROM mna_readiness_snapshots 
                WHERE id = mna_normalized_statements.snapshot_id
            )
            AND ac.can_view_normalized_statements = true
            AND (ac.access_end_date IS NULL OR ac.access_end_date > CURRENT_TIMESTAMP)
        )
    );

CREATE POLICY mna_scenarios_policy ON mna_scenarios
    FOR SELECT TO authenticated_users
    USING (
        EXISTS (
            SELECT 1 FROM mna_access_control ac
            WHERE ac.user_id = current_setting('app.current_user_id')::UUID
            AND ac.business_account_id = (
                SELECT business_account_id FROM mna_readiness_snapshots 
                WHERE id = mna_scenarios.snapshot_id
            )
            AND ac.can_view_scenarios = true
            AND (ac.access_end_date IS NULL OR ac.access_end_date > CURRENT_TIMESTAMP)
        )
    );

CREATE POLICY mna_synergy_analysis_policy ON mna_synergy_analysis
    FOR SELECT TO authenticated_users
    USING (
        EXISTS (
            SELECT 1 FROM mna_access_control ac
            WHERE ac.user_id = current_setting('app.current_user_id')::UUID
            AND ac.business_account_id = (
                SELECT business_account_id FROM mna_readiness_snapshots 
                WHERE id = mna_synergy_analysis.snapshot_id
            )
            AND ac.can_view_synergies = true
            AND (ac.access_end_date IS NULL OR ac.access_end_date > CURRENT_TIMESTAMP)
        )
    );

CREATE POLICY mna_buyer_ready_docs_policy ON mna_buyer_ready_docs
    FOR SELECT TO authenticated_users
    USING (
        EXISTS (
            SELECT 1 FROM mna_access_control ac
            WHERE ac.user_id = current_setting('app.current_user_id')::UUID
            AND ac.business_account_id = (
                SELECT business_account_id FROM mna_readiness_snapshots 
                WHERE id = mna_buyer_ready_docs.snapshot_id
            )
            AND ac.can_view_buyer_docs = true
            AND (ac.access_end_date IS NULL OR ac.access_end_date > CURRENT_TIMESTAMP)
        )
    );

-- Indexes for performance optimization
CREATE INDEX idx_mna_readiness_snapshots_business_account ON mna_readiness_snapshots(business_account_id);
CREATE INDEX idx_mna_readiness_snapshots_status ON mna_readiness_snapshots(status);
CREATE INDEX idx_mna_normalized_statements_snapshot ON mna_normalized_statements(snapshot_id);
CREATE INDEX idx_mna_normalized_statements_type ON mna_normalized_statements(statement_type);
CREATE INDEX idx_mna_non_recurring_items_snapshot ON mna_non_recurring_items(snapshot_id);
CREATE INDEX idx_mna_scenarios_snapshot ON mna_scenarios(snapshot_id);
CREATE INDEX idx_mna_scenarios_type ON mna_scenarios(scenario_type);
CREATE INDEX idx_mna_synergy_analysis_snapshot ON mna_synergy_analysis(snapshot_id);
CREATE INDEX idx_mna_buyer_ready_docs_snapshot ON mna_buyer_ready_docs(snapshot_id);
CREATE INDEX idx_mna_buyer_ready_docs_type ON mna_buyer_ready_docs(doc_type);
CREATE INDEX idx_mna_access_control_user_business ON mna_access_control(user_id, business_account_id);
CREATE INDEX idx_mna_activity_log_business_account ON mna_activity_log(business_account_id);
CREATE INDEX idx_mna_activity_log_performed_at ON mna_activity_log(performed_at);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_mna_materialized_views() RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mna_readiness_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mna_normalization_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mna_scenario_summary;
END;
$$ LANGUAGE plpgsql;
