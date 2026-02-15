-- Sprint 18: IPO Readiness Mode Migration
-- Creates comprehensive IPO readiness infrastructure with public reporting standards

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- IPO Readiness Snapshots
CREATE TABLE ipo_readiness_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    snapshot_name VARCHAR(200) NOT NULL,
    snapshot_description TEXT,
    snapshot_period_start DATE NOT NULL,
    snapshot_period_end DATE NOT NULL,
    reporting_period_type VARCHAR(50) NOT NULL CHECK (reporting_period_type IN ('quarterly', 'annual', 'interim')),
    fiscal_year INTEGER NOT NULL,
    fiscal_quarter INTEGER CHECK (fiscal_quarter BETWEEN 1 AND 4),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    exchange_rate DECIMAL(15,6) DEFAULT 1.0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'final', 'archived')),
    compliance_status VARCHAR(50) CHECK (compliance_status IN ('pending', 'in_progress', 'compliant', 'non_compliant')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Public Financial Statements
CREATE TABLE public_financial_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES ipo_readiness_snapshots(id) ON DELETE CASCADE,
    statement_type VARCHAR(50) NOT NULL CHECK (statement_type IN ('income_statement', 'balance_sheet', 'cash_flow', 'equity_statement')),
    reporting_standard VARCHAR(50) NOT NULL CHECK (reporting_standard IN ('IFRS', 'US_GAAP', 'LOCAL_GAAP')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    currency VARCHAR(3) NOT NULL,
    
    -- Income Statement Items (IFRS/US GAAP compliant)
    revenue DECIMAL(20,2),
    cost_of_goods_sold DECIMAL(20,2),
    gross_profit DECIMAL(20,2),
    operating_expenses DECIMAL(20,2),
    operating_income DECIMAL(20,2),
    interest_expense DECIMAL(20,2),
    interest_income DECIMAL(20,2),
    other_income_expense DECIMAL(20,2),
    profit_before_tax DECIMAL(20,2),
    tax_expense DECIMAL(20,2),
    net_income DECIMAL(20,2),
    earnings_per_share_basic DECIMAL(10,4),
    earnings_per_share_diluted DECIMAL(10,4),
    
    -- Balance Sheet Items
    cash_and_equivalents DECIMAL(20,2),
    accounts_receivable DECIMAL(20,2),
    inventory DECIMAL(20,2),
    other_current_assets DECIMAL(20,2),
    total_current_assets DECIMAL(20,2),
    property_plant_equipment DECIMAL(20,2),
    intangible_assets DECIMAL(20,2),
    other_non_current_assets DECIMAL(20,2),
    total_assets DECIMAL(20,2),
    accounts_payable DECIMAL(20,2),
    short_term_debt DECIMAL(20,2),
    other_current_liabilities DECIMAL(20,2),
    total_current_liabilities DECIMAL(20,2),
    long_term_debt DECIMAL(20,2),
    other_non_current_liabilities DECIMAL(20,2),
    total_liabilities DECIMAL(20,2),
    share_capital DECIMAL(20,2),
    retained_earnings DECIMAL(20,2),
    other_equity DECIMAL(20,2),
    total_equity DECIMAL(20,2),
    
    -- Cash Flow Items
    cash_from_operations DECIMAL(20,2),
    cash_from_investing DECIMAL(20,2),
    cash_from_financing DECIMAL(20,2),
    net_change_in_cash DECIMAL(20,2),
    cash_beginning_balance DECIMAL(20,2),
    cash_ending_balance DECIMAL(20,2),
    
    -- Metadata
    audit_status VARCHAR(50) DEFAULT 'pending' CHECK (audit_status IN ('pending', 'in_progress', 'completed', 'issues_found')),
    auditor_notes TEXT,
    compliance_notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Multi-Year Comparative Data
CREATE TABLE ipo_comparative_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES ipo_readiness_snapshots(id) ON DELETE CASCADE,
    comparison_year INTEGER NOT NULL,
    comparison_period VARCHAR(50) NOT NULL CHECK (comparison_period IN ('Q1', 'Q2', 'Q3', 'Q4', 'FY')),
    revenue DECIMAL(20,2),
    gross_profit DECIMAL(20,2),
    operating_income DECIMAL(20,2),
    net_income DECIMAL(20,2),
    earnings_per_share DECIMAL(10,4),
    total_assets DECIMAL(20,2),
    total_equity DECIMAL(20,2),
    cash_from_operations DECIMAL(20,2),
    operating_margin DECIMAL(8,4),
    net_margin DECIMAL(8,4),
    return_on_assets DECIMAL(8,4),
    return_on_equity DECIMAL(8,4),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Governance and Controls
CREATE TABLE ipo_governance_structure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES ipo_readiness_snapshots(id) ON DELETE CASCADE,
    board_composition JSONB NOT NULL DEFAULT '{}',
    board_independence JSONB NOT NULL DEFAULT '{}',
    committee_structure JSONB NOT NULL DEFAULT '{}',
    executive_compensation JSONB NOT NULL DEFAULT '{}',
    internal_controls JSONB NOT NULL DEFAULT '{}',
    risk_management JSONB NOT NULL DEFAULT '{}',
    compliance_framework JSONB NOT NULL DEFAULT '{}',
    audit_committee JSONB NOT NULL DEFAULT '{}',
    governance_rating VARCHAR(10) CHECK (governance_rating IN ('A', 'B', 'C', 'D')),
    control_effectiveness VARCHAR(50) CHECK (control_effectiveness IN ('effective', 'needs_improvement', 'ineffective')),
    identified_gaps JSONB DEFAULT '[]',
    remediation_plan JSONB DEFAULT '{}',
    assessment_date DATE NOT NULL,
    next_review_date DATE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Risk Factors and Disclosures
CREATE TABLE ipo_risk_disclosures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES ipo_readiness_snapshots(id) ON DELETE CASCADE,
    risk_category VARCHAR(100) NOT NULL,
    risk_description TEXT NOT NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    potential_impact TEXT,
    mitigation_strategies JSONB DEFAULT '[]',
    regulatory_references JSONB DEFAULT '[]',
    disclosure_required BOOLEAN DEFAULT true,
    disclosed_in_prospectus BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- IPO Metrics and KPIs
CREATE TABLE ipo_financial_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES ipo_readiness_snapshots(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_category VARCHAR(50) NOT NULL CHECK (metric_category IN ('profitability', 'liquidity', 'solvency', 'efficiency', 'market', 'growth')),
    current_value DECIMAL(20,4),
    previous_year_value DECIMAL(20,4),
    industry_average DECIMAL(20,4),
    target_value DECIMAL(20,4),
    trend_direction VARCHAR(10) CHECK (trend_direction IN ('improving', 'stable', 'declining')),
    calculation_method TEXT,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Disclosure Checklist
CREATE TABLE ipo_disclosure_checklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES ipo_readiness_snapshots(id) ON DELETE CASCADE,
    disclosure_category VARCHAR(100) NOT NULL,
    disclosure_item VARCHAR(200) NOT NULL,
    regulatory_requirement TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'not_applicable')),
    responsible_person VARCHAR(200),
    due_date DATE,
    completion_date DATE,
    supporting_documents JSONB DEFAULT '[]',
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- IPO Access Control
CREATE TABLE ipo_access_control (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_name VARCHAR(50) NOT NULL CHECK (role_name IN ('ipo_admin', 'financial_analyst', 'compliance_officer', 'auditor', 'viewer')),
    permissions JSONB NOT NULL DEFAULT '{}',
    granted_by UUID NOT NULL REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(business_account_id, user_id)
);

-- IPO Activity Log
CREATE TABLE ipo_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    activity_description TEXT NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    entity_name VARCHAR(200),
    performed_by UUID REFERENCES users(id),
    user_role VARCHAR(50),
    user_email VARCHAR(255),
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    activity_duration_ms INTEGER,
    data_volume_bytes INTEGER,
    additional_data JSONB DEFAULT '{}',
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Materialized Views for Analytics
CREATE MATERIALIZED VIEW ipo_readiness_summary AS
SELECT 
    ba.id as business_account_id,
    ba.name as business_name,
    COUNT(DISTINCT irs.id) as total_snapshots,
    COUNT(DISTINCT CASE WHEN irs.status = 'final' THEN irs.id END) as final_snapshots,
    COUNT(DISTINCT CASE WHEN irs.compliance_status = 'compliant' THEN irs.id END) as compliant_snapshots,
    MAX(irs.fiscal_year) as latest_fiscal_year,
    COUNT(DISTINCT pfs.id) as total_statements,
    COUNT(DISTINCT igs.id) as governance_assessments,
    COUNT(DISTINCT ird.id) as risk_disclosures,
    COUNT(DISTINCT idc.id) as disclosure_items,
    COUNT(DISTINCT ifm.id) as financial_metrics,
    AVG(CASE WHEN igs.governance_rating = 'A' THEN 4 
             WHEN igs.governance_rating = 'B' THEN 3 
             WHEN igs.governance_rating = 'C' THEN 2 
             ELSE 1 END) as avg_governance_score
FROM business_accounts ba
LEFT JOIN ipo_readiness_snapshots irs ON ba.id = irs.business_account_id
LEFT JOIN public_financial_statements pfs ON irs.id = pfs.snapshot_id
LEFT JOIN ipo_governance_structure igs ON irs.id = igs.snapshot_id
LEFT JOIN ipo_risk_disclosures ird ON irs.id = ird.snapshot_id
LEFT JOIN ipo_disclosure_checklist idc ON irs.id = idc.snapshot_id
LEFT JOIN ipo_financial_metrics ifm ON irs.id = ifm.snapshot_id
GROUP BY ba.id, ba.name;

CREATE MATERIALIZED VIEW ipo_comparative_analysis AS
SELECT 
    irs.business_account_id,
    irs.fiscal_year,
    icd.comparison_year,
    icd.comparison_period,
    icd.revenue,
    icd.operating_income,
    icd.net_income,
    icd.earnings_per_share,
    icd.total_assets,
    icd.total_equity,
    icd.operating_margin,
    icd.net_margin,
    icd.return_on_assets,
    icd.return_on_equity,
    LAG(icd.revenue) OVER (PARTITION BY irs.business_account_id ORDER BY icd.comparison_year, icd.comparison_period) as prev_revenue,
    CASE WHEN LAG(icd.revenue) OVER (PARTITION BY irs.business_account_id ORDER BY icd.comparison_year, icd.comparison_period) > 0 
         THEN ((icd.revenue - LAG(icd.revenue) OVER (PARTITION BY irs.business_account_id ORDER BY icd.comparison_year, icd.comparison_period)) / 
              LAG(icd.revenue) OVER (PARTITION BY irs.business_account_id ORDER BY icd.comparison_year, icd.comparison_period)) * 100 
         ELSE NULL END as revenue_growth_pct
FROM ipo_readiness_snapshots irs
JOIN ipo_comparative_data icd ON irs.id = icd.snapshot_id
WHERE irs.status = 'final';

CREATE MATERIALIZED VIEW ipo_governance_dashboard AS
SELECT 
    irs.business_account_id,
    irs.fiscal_year,
    igs.governance_rating,
    igs.control_effectiveness,
    COUNT(ird.id) as total_risks,
    COUNT(CASE WHEN ird.risk_level = 'critical' THEN 1 END) as critical_risks,
    COUNT(CASE WHEN ird.risk_level = 'high' THEN 1 END) as high_risks,
    COUNT(CASE WHEN ird.risk_level = 'medium' THEN 1 END) as medium_risks,
    COUNT(CASE WHEN ird.risk_level = 'low' THEN 1 END) as low_risks,
    COUNT(idc.id) as total_disclosure_items,
    COUNT(CASE WHEN idc.status = 'completed' THEN 1 END) as completed_disclosures,
    COUNT(CASE WHEN idc.status = 'pending' THEN 1 END) as pending_disclosures,
    ROUND((COUNT(CASE WHEN idc.status = 'completed' THEN 1 END) * 100.0 / NULLIF(COUNT(idc.id), 0)), 2) as disclosure_completion_pct
FROM ipo_readiness_snapshots irs
LEFT JOIN ipo_governance_structure igs ON irs.id = igs.snapshot_id
LEFT JOIN ipo_risk_disclosures ird ON irs.id = ird.snapshot_id
LEFT JOIN ipo_disclosure_checklist idc ON irs.id = idc.snapshot_id
WHERE irs.status = 'final'
GROUP BY irs.business_account_id, irs.fiscal_year, igs.governance_rating, igs.control_effectiveness;

-- Database Functions
CREATE OR REPLACE FUNCTION generate_ipo_readiness_snapshot(
    p_business_account_id UUID,
    p_snapshot_name VARCHAR,
    p_period_start DATE,
    p_period_end DATE,
    p_fiscal_year INTEGER,
    p_fiscal_quarter INTEGER DEFAULT NULL,
    p_reporting_period_type VARCHAR DEFAULT 'quarterly',
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_snapshot_id UUID;
BEGIN
    INSERT INTO ipo_readiness_snapshots (
        business_account_id,
        snapshot_name,
        snapshot_period_start,
        snapshot_period_end,
        fiscal_year,
        fiscal_quarter,
        reporting_period_type,
        created_by
    ) VALUES (
        p_business_account_id,
        p_snapshot_name,
        p_period_start,
        p_period_end,
        p_fiscal_year,
        p_fiscal_quarter,
        p_reporting_period_type,
        p_created_by
    ) RETURNING id INTO v_snapshot_id;
    
    RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_public_financial_statement(
    p_snapshot_id UUID,
    p_statement_type VARCHAR,
    p_reporting_standard VARCHAR DEFAULT 'IFRS',
    p_period_start DATE,
    p_period_end DATE,
    p_currency VARCHAR DEFAULT 'USD',
    p_revenue DECIMAL DEFAULT NULL,
    p_net_income DECIMAL DEFAULT NULL,
    p_total_assets DECIMAL DEFAULT NULL,
    p_total_equity DECIMAL DEFAULT NULL,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_statement_id UUID;
BEGIN
    INSERT INTO public_financial_statements (
        snapshot_id,
        statement_type,
        reporting_standard,
        period_start,
        period_end,
        currency,
        revenue,
        net_income,
        total_assets,
        total_equity,
        created_by
    ) VALUES (
        p_snapshot_id,
        p_statement_type,
        p_reporting_standard,
        p_period_start,
        p_period_end,
        p_currency,
        p_revenue,
        p_net_income,
        p_total_assets,
        p_total_equity,
        p_created_by
    ) RETURNING id INTO v_statement_id;
    
    RETURN v_statement_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_comparative_data(
    p_snapshot_id UUID,
    p_comparison_year INTEGER,
    p_comparison_period VARCHAR,
    p_revenue DECIMAL,
    p_net_income DECIMAL,
    p_total_assets DECIMAL,
    p_total_equity DECIMAL,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_comparative_id UUID;
BEGIN
    INSERT INTO ipo_comparative_data (
        snapshot_id,
        comparison_year,
        comparison_period,
        revenue,
        net_income,
        total_assets,
        total_equity,
        created_by
    ) VALUES (
        p_snapshot_id,
        p_comparison_year,
        p_comparison_period,
        p_revenue,
        p_net_income,
        p_total_assets,
        p_total_equity,
        p_created_by
    ) RETURNING id INTO v_comparative_id;
    
    RETURN v_comparative_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_ipo_materialized_views() RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY ipo_readiness_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY ipo_comparative_analysis;
    REFRESH MATERIALIZED VIEW CONCURRENTLY ipo_governance_dashboard;
END;
$$ LANGUAGE plpgsql;

-- Indexes for Performance
CREATE INDEX idx_ipo_readiness_snapshots_business_account ON ipo_readiness_snapshots(business_account_id);
CREATE INDEX idx_ipo_readiness_snapshots_status ON ipo_readiness_snapshots(status);
CREATE INDEX idx_ipo_readiness_snapshots_fiscal_year ON ipo_readiness_snapshots(fiscal_year);
CREATE INDEX idx_public_financial_statements_snapshot ON public_financial_statements(snapshot_id);
CREATE INDEX idx_public_financial_statements_type ON public_financial_statements(statement_type);
CREATE INDEX idx_ipo_comparative_data_snapshot ON ipo_comparative_data(snapshot_id);
CREATE INDEX idx_ipo_comparative_data_year ON ipo_comparative_data(comparison_year);
CREATE INDEX idx_ipo_governance_structure_snapshot ON ipo_governance_structure(snapshot_id);
CREATE INDEX idx_ipo_risk_disclosures_snapshot ON ipo_risk_disclosures(snapshot_id);
CREATE INDEX idx_ipo_risk_disclosures_level ON ipo_risk_disclosures(risk_level);
CREATE INDEX idx_ipo_disclosure_checklist_snapshot ON ipo_disclosure_checklist(snapshot_id);
CREATE INDEX idx_ipo_disclosure_checklist_status ON ipo_disclosure_checklist(status);
CREATE INDEX idx_ipo_financial_metrics_snapshot ON ipo_financial_metrics(snapshot_id);
CREATE INDEX idx_ipo_access_control_business_account ON ipo_access_control(business_account_id);
CREATE INDEX idx_ipo_access_control_user ON ipo_access_control(user_id);
CREATE INDEX idx_ipo_activity_log_business_account ON ipo_activity_log(business_account_id);
CREATE INDEX idx_ipo_activity_log_performed_at ON ipo_activity_log(performed_at);

-- Row Level Security (RLS) Policies
ALTER TABLE ipo_readiness_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_financial_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipo_comparative_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipo_governance_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipo_risk_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipo_disclosure_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipo_financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipo_access_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipo_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for IPO Readiness
CREATE POLICY ipo_readiness_snapshots_policy ON ipo_readiness_snapshots
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY public_financial_statements_policy ON public_financial_statements
    FOR ALL TO authenticated_users
    USING (snapshot_id IN (
        SELECT irs.id FROM ipo_readiness_snapshots irs
        WHERE irs.business_account_id IN (
            SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
        )
    ));

CREATE POLICY ipo_comparative_data_policy ON ipo_comparative_data
    FOR ALL TO authenticated_users
    USING (snapshot_id IN (
        SELECT irs.id FROM ipo_readiness_snapshots irs
        WHERE irs.business_account_id IN (
            SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
        )
    ));

CREATE POLICY ipo_governance_structure_policy ON ipo_governance_structure
    FOR ALL TO authenticated_users
    USING (snapshot_id IN (
        SELECT irs.id FROM ipo_readiness_snapshots irs
        WHERE irs.business_account_id IN (
            SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
        )
    ));

CREATE POLICY ipo_risk_disclosures_policy ON ipo_risk_disclosures
    FOR ALL TO authenticated_users
    USING (snapshot_id IN (
        SELECT irs.id FROM ipo_readiness_snapshots irs
        WHERE irs.business_account_id IN (
            SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
        )
    ));

CREATE POLICY ipo_disclosure_checklist_policy ON ipo_disclosure_checklist
    FOR ALL TO authenticated_users
    USING (snapshot_id IN (
        SELECT irs.id FROM ipo_readiness_snapshots irs
        WHERE irs.business_account_id IN (
            SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
        )
    ));

CREATE POLICY ipo_financial_metrics_policy ON ipo_financial_metrics
    FOR ALL TO authenticated_users
    USING (snapshot_id IN (
        SELECT irs.id FROM ipo_readiness_snapshots irs
        WHERE irs.business_account_id IN (
            SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
        )
    ));

CREATE POLICY ipo_access_control_policy ON ipo_access_control
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY ipo_activity_log_policy ON ipo_activity_log
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

-- Triggers for Updated At
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ipo_readiness_snapshots_updated_at
    BEFORE UPDATE ON ipo_readiness_snapshots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_public_financial_statements_updated_at
    BEFORE UPDATE ON public_financial_statements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ipo_governance_structure_updated_at
    BEFORE UPDATE ON ipo_governance_structure
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ipo_risk_disclosures_updated_at
    BEFORE UPDATE ON ipo_risk_disclosures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ipo_disclosure_checklist_updated_at
    BEFORE UPDATE ON ipo_disclosure_checklist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
