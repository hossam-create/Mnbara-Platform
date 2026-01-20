-- Sprint 20: Group / Holding Mode Migration
-- Creates comprehensive group consolidation infrastructure with multi-entity support

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Group Entity Structure
CREATE TABLE group_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_name VARCHAR(200) NOT NULL,
    group_description TEXT,
    group_type VARCHAR(50) NOT NULL CHECK (group_type IN ('holding', 'conglomerate', 'subsidiary_group')),
    legal_structure VARCHAR(100) NOT NULL,
    registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    headquarters_country VARCHAR(2) NOT NULL,
    headquarters_address TEXT,
    primary_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    consolidation_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    fiscal_year_start DATE NOT NULL,
    fiscal_year_end DATE NOT NULL,
    consolidation_method VARCHAR(50) NOT NULL DEFAULT 'full_consolidation' CHECK (consolidation_method IN ('full_consolidation', 'proportionate_consolidation', 'equity_method')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'in_formation', 'dissolved')),
    parent_group_id UUID REFERENCES group_entities(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Entity Mapping
CREATE TABLE entity_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES group_entities(id) ON DELETE CASCADE,
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('parent', 'subsidiary', 'associate', 'joint_venture')),
    ownership_percentage DECIMAL(5,2) NOT NULL CHECK (ownership_percentage >= 0 AND ownership_percentage <= 100),
    voting_rights_percentage DECIMAL(5,2) NOT NULL CHECK (voting_rights_percentage >= 0 AND voting_rights_percentage <= 100),
    control_percentage DECIMAL(5,2) NOT NULL CHECK (control_percentage >= 0 AND control_percentage <= 100),
    consolidation_method VARCHAR(50) NOT NULL DEFAULT 'full_consolidation' CHECK (consolidation_method IN ('full_consolidation', 'proportionate_consolidation', 'equity_method')),
    effective_date DATE NOT NULL,
    termination_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, business_account_id)
);

-- Multi-Entity Chart of Accounts
CREATE TABLE group_chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES group_entities(id) ON DELETE CASCADE,
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(200) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense', 'contra_asset', 'contra_liability', 'contra_equity', 'contra_revenue', 'contra_expense')),
    account_category VARCHAR(100) NOT NULL,
    account_subcategory VARCHAR(100),
    parent_account_id UUID REFERENCES group_chart_of_accounts(id) ON DELETE SET NULL,
    consolidation_method VARCHAR(50) NOT NULL DEFAULT 'sum' CHECK (consolidation_method IN ('sum', 'eliminate_intercompany', 'adjust_currency', 'custom_formula')),
    is_consolidation_account BOOLEAN DEFAULT false,
    is_intercompany_elimination BOOLEAN DEFAULT false,
    custom_formula TEXT,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, account_code)
);

-- Entity Account Mapping
CREATE TABLE entity_account_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_account_id UUID NOT NULL REFERENCES group_chart_of_accounts(id) ON DELETE CASCADE,
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    entity_account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE CASCADE,
    mapping_type VARCHAR(50) NOT NULL DEFAULT 'direct' CHECK (mapping_type IN ('direct', 'aggregated', 'split', 'formula')),
    mapping_formula TEXT,
    percentage_allocation DECIMAL(5,2) DEFAULT 100.00,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_account_id, business_account_id, entity_account_id)
);

-- Intercompany Transaction Tagging
CREATE TABLE intercompany_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES group_entities(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    source_entity_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    target_entity_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('sale', 'purchase', 'loan', 'dividend', 'management_fee', 'royalty', 'interest', 'other')),
    elimination_method VARCHAR(50) NOT NULL DEFAULT 'full_elimination' CHECK (elimination_method IN ('full_elimination', 'partial_elimination', 'no_elimination')),
    elimination_percentage DECIMAL(5,2) DEFAULT 100.00,
    elimination_journal_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
    is_eliminated BOOLEAN DEFAULT false,
    elimination_date TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Consolidation Rules
CREATE TABLE consolidation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES group_entities(id) ON DELETE CASCADE,
    rule_name VARCHAR(200) NOT NULL,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('account_elimination', 'intercompany_elimination', 'currency_translation', 'goodwill_amortization', 'minority_interest', 'custom_adjustment')),
    rule_description TEXT,
    rule_conditions JSONB NOT NULL DEFAULT '{}',
    rule_actions JSONB NOT NULL DEFAULT '{}',
    priority INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Consolidation Snapshots
CREATE TABLE consolidation_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES group_entities(id) ON DELETE CASCADE,
    snapshot_name VARCHAR(200) NOT NULL,
    snapshot_description TEXT,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    consolidation_date DATE NOT NULL,
    consolidation_method VARCHAR(50) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    exchange_rates JSONB NOT NULL DEFAULT '{}',
    included_entities JSONB NOT NULL DEFAULT '[]',
    excluded_entities JSONB NOT NULL DEFAULT '[]',
    elimination_journal_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed', 'archived')),
    processing_log JSONB DEFAULT '[]',
    error_details JSONB,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Consolidated Financial Statements
CREATE TABLE consolidated_financial_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES consolidation_snapshots(id) ON DELETE CASCADE,
    statement_type VARCHAR(50) NOT NULL CHECK (statement_type IN ('income_statement', 'balance_sheet', 'cash_flow', 'equity_statement')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    currency VARCHAR(3) NOT NULL,
    
    -- Consolidated Income Statement
    consolidated_revenue DECIMAL(20,2),
    consolidated_cost_of_goods_sold DECIMAL(20,2),
    consolidated_gross_profit DECIMAL(20,2),
    consolidated_operating_expenses DECIMAL(20,2),
    consolidated_operating_income DECIMAL(20,2),
    consolidated_interest_expense DECIMAL(20,2),
    consolidated_interest_income DECIMAL(20,2),
    consolidated_other_income_expense DECIMAL(20,2),
    consolidated_profit_before_tax DECIMAL(20,2),
    consolidated_tax_expense DECIMAL(20,2),
    consolidated_net_income DECIMAL(20,2),
    consolidated_earnings_per_share DECIMAL(10,4),
    minority_interest_expense DECIMAL(20,2),
    
    -- Consolidated Balance Sheet
    consolidated_cash_and_equivalents DECIMAL(20,2),
    consolidated_accounts_receivable DECIMAL(20,2),
    consolidated_inventory DECIMAL(20,2),
    consolidated_other_current_assets DECIMAL(20,2),
    consolidated_total_current_assets DECIMAL(20,2),
    consolidated_property_plant_equipment DECIMAL(20,2),
    consolidated_intangible_assets DECIMAL(20,2),
    consolidated_goodwill DECIMAL(20,2),
    consolidated_other_non_current_assets DECIMAL(20,2),
    consolidated_total_assets DECIMAL(20,2),
    consolidated_accounts_payable DECIMAL(20,2),
    consolidated_short_term_debt DECIMAL(20,2),
    consolidated_other_current_liabilities DECIMAL(20,2),
    consolidated_total_current_liabilities DECIMAL(20,2),
    consolidated_long_term_debt DECIMAL(20,2),
    consolidated_other_non_current_liabilities DECIMAL(20,2),
    consolidated_total_liabilities DECIMAL(20,2),
    consolidated_share_capital DECIMAL(20,2),
    consolidated_retained_earnings DECIMAL(20,2),
    consolidated_other_equity DECIMAL(20,2),
    consolidated_minority_interest DECIMAL(20,2),
    consolidated_total_equity DECIMAL(20,2),
    
    -- Consolidated Cash Flow
    consolidated_cash_from_operations DECIMAL(20,2),
    consolidated_cash_from_investing DECIMAL(20,2),
    consolidated_cash_from_financing DECIMAL(20,2),
    consolidated_net_change_in_cash DECIMAL(20,2),
    consolidated_cash_beginning_balance DECIMAL(20,2),
    consolidated_cash_ending_balance DECIMAL(20,2),
    
    -- Metadata
    consolidation_method VARCHAR(50) NOT NULL,
    elimination_adjustments DECIMAL(20,2) DEFAULT 0,
    currency_translation_adjustments DECIMAL(20,2) DEFAULT 0,
    goodwill_amortization DECIMAL(20,2) DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Group KPIs and Metrics
CREATE TABLE group_kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES group_entities(id) ON DELETE CASCADE,
    kpi_name VARCHAR(100) NOT NULL,
    kpi_category VARCHAR(50) NOT NULL CHECK (kpi_category IN ('profitability', 'liquidity', 'solvency', 'efficiency', 'growth', 'market', 'consolidation')),
    kpi_type VARCHAR(50) NOT NULL CHECK (kpi_type IN ('ratio', 'percentage', 'absolute', 'index')),
    calculation_formula TEXT NOT NULL,
    target_value DECIMAL(20,4),
    benchmark_value DECIMAL(20,4),
    current_value DECIMAL(20,4),
    previous_value DECIMAL(20,4),
    trend_direction VARCHAR(10) CHECK (trend_direction IN ('improving', 'stable', 'declining')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    currency VARCHAR(3),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Group Access Control
CREATE TABLE group_access_control (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES group_entities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_name VARCHAR(50) NOT NULL CHECK (role_name IN ('group_admin', 'consolidation_manager', 'entity_manager', 'financial_analyst', 'viewer')),
    entity_access JSONB NOT NULL DEFAULT '{}',
    permissions JSONB NOT NULL DEFAULT '{}',
    granted_by UUID NOT NULL REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(group_id, user_id)
);

-- Group Activity Log
CREATE TABLE group_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES group_entities(id) ON DELETE CASCADE,
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
CREATE MATERIALIZED VIEW group_consolidation_summary AS
SELECT 
    ge.id as group_id,
    ge.group_name,
    ge.consolidation_method,
    COUNT(DISTINCT em.business_account_id) as total_entities,
    COUNT(DISTINCT CASE WHEN em.entity_type = 'parent' THEN em.business_account_id END) as parent_entities,
    COUNT(DISTINCT CASE WHEN em.entity_type = 'subsidiary' THEN em.business_account_id END) as subsidiary_entities,
    COUNT(DISTINCT CASE WHEN em.entity_type = 'associate' THEN em.business_account_id END) as associate_entities,
    SUM(em.ownership_percentage) as total_ownership_percentage,
    COUNT(DISTINCT cs.id) as consolidation_snapshots,
    COUNT(DISTINCT cfs.id) as consolidated_statements,
    COUNT(DISTINCT gk.id) as group_kpis,
    MAX(cs.consolidation_date) as last_consolidation_date,
    CASE 
        WHEN MAX(cs.consolidation_date) >= CURRENT_DATE - INTERVAL '30 days' THEN 'current'
        WHEN MAX(cs.consolidation_date) >= CURRENT_DATE - INTERVAL '90 days' THEN 'recent'
        ELSE 'outdated'
    END as consolidation_status
FROM group_entities ge
LEFT JOIN entity_mappings em ON ge.id = em.group_id AND em.is_active = true
LEFT JOIN consolidation_snapshots cs ON ge.id = cs.group_id
LEFT JOIN consolidated_financial_statements cfs ON cs.id = cfs.snapshot_id
LEFT JOIN group_kpis gk ON ge.id = gk.group_id
WHERE ge.status = 'active'
GROUP BY ge.id, ge.group_name, ge.consolidation_method;

CREATE MATERIALIZED VIEW entity_performance_comparison AS
SELECT 
    ge.id as group_id,
    ge.group_name,
    em.business_account_id,
    ba.name as entity_name,
    em.entity_type,
    em.ownership_percentage,
    cfs.period_end,
    cfs.consolidated_revenue,
    cfs.consolidated_net_income,
    cfs.consolidated_total_assets,
    cfs.consolidated_total_equity,
    CASE WHEN cfs.consolidated_revenue > 0 THEN (cfs.consolidated_net_income / cfs.consolidated_revenue * 100) ELSE NULL END as net_margin,
    CASE WHEN cfs.consolidated_total_assets > 0 THEN (cfs.consolidated_net_income / cfs.consolidated_total_assets * 100) ELSE NULL END as return_on_assets,
    CASE WHEN cfs.consolidated_total_equity > 0 THEN (cfs.consolidated_net_income / cfs.consolidated_total_equity * 100) ELSE NULL END as return_on_equity,
    RANK() OVER (PARTITION BY ge.id ORDER BY cfs.consolidated_revenue DESC) as revenue_rank,
    RANK() OVER (PARTITION BY ge.id ORDER BY cfs.consolidated_net_income DESC) as profitability_rank
FROM group_entities ge
JOIN entity_mappings em ON ge.id = em.group_id AND em.is_active = true
JOIN business_accounts ba ON em.business_account_id = ba.id
LEFT JOIN (
    SELECT DISTINCT ON (business_account_id) 
        business_account_id, period_end, consolidated_revenue, consolidated_net_income, 
        consolidated_total_assets, consolidated_total_equity
    FROM consolidated_financial_statements 
    ORDER BY business_account_id, period_end DESC
) cfs ON em.business_account_id = cfs.business_account_id
WHERE ge.status = 'active';

CREATE MATERIALIZED VIEW consolidation_dashboard AS
SELECT 
    ge.id as group_id,
    ge.group_name,
    cs.id as snapshot_id,
    cs.snapshot_name,
    cs.period_start,
    cs.period_end,
    cs.status as consolidation_status,
    cs.created_at as consolidation_created_at,
    COUNT(DISTINCT cfs.id) as statement_count,
    COUNT(DISTINCT ict.id) as intercompany_transactions,
    COUNT(DISTINCT cr.id) as consolidation_rules,
    SUM(CASE WHEN ict.is_eliminated = true THEN 1 ELSE 0 END) as eliminated_transactions,
    SUM(cfs.consolidated_revenue) as total_consolidated_revenue,
    SUM(cfs.consolidated_net_income) as total_consolidated_income,
    SUM(cfs.consolidated_total_assets) as total_consolidated_assets,
    SUM(cfs.consolidated_total_equity) as total_consolidated_equity,
    ROUND((SUM(CASE WHEN ict.is_eliminated = true THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(DISTINCT ict.id), 0)), 2) as elimination_percentage
FROM group_entities ge
LEFT JOIN consolidation_snapshots cs ON ge.id = cs.group_id
LEFT JOIN consolidated_financial_statements cfs ON cs.id = cfs.snapshot_id
LEFT JOIN intercompany_transactions ict ON ge.id = ict.group_id
WHERE ge.status = 'active'
GROUP BY ge.id, ge.group_name, cs.id, cs.snapshot_name, cs.period_start, cs.period_end, cs.status, cs.created_at;

-- Database Functions
CREATE OR REPLACE FUNCTION create_group_entity(
    p_group_name VARCHAR,
    p_group_description TEXT DEFAULT NULL,
    p_group_type VARCHAR DEFAULT 'holding',
    p_legal_structure VARCHAR,
    p_registration_number VARCHAR DEFAULT NULL,
    p_tax_id VARCHAR DEFAULT NULL,
    p_headquarters_country VARCHAR,
    p_headquarters_address TEXT DEFAULT NULL,
    p_primary_currency VARCHAR DEFAULT 'USD',
    p_consolidation_currency VARCHAR DEFAULT 'USD',
    p_fiscal_year_start DATE,
    p_fiscal_year_end DATE,
    p_consolidation_method VARCHAR DEFAULT 'full_consolidation',
    p_parent_group_id UUID DEFAULT NULL,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO group_entities (
        group_name,
        group_description,
        group_type,
        legal_structure,
        registration_number,
        tax_id,
        headquarters_country,
        headquarters_address,
        primary_currency,
        consolidation_currency,
        fiscal_year_start,
        fiscal_year_end,
        consolidation_method,
        parent_group_id,
        created_by
    ) VALUES (
        p_group_name,
        p_group_description,
        p_group_type,
        p_legal_structure,
        p_registration_number,
        p_tax_id,
        p_headquarters_country,
        p_headquarters_address,
        p_primary_currency,
        p_consolidation_currency,
        p_fiscal_year_start,
        p_fiscal_year_end,
        p_consolidation_method,
        p_parent_group_id,
        p_created_by
    ) RETURNING id INTO v_group_id;
    
    RETURN v_group_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION map_entity_to_group(
    p_group_id UUID,
    p_business_account_id UUID,
    p_entity_type VARCHAR,
    p_ownership_percentage DECIMAL,
    p_voting_rights_percentage DECIMAL,
    p_control_percentage DECIMAL,
    p_consolidation_method VARCHAR DEFAULT 'full_consolidation',
    p_effective_date DATE,
    p_termination_date DATE DEFAULT NULL,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_mapping_id UUID;
BEGIN
    INSERT INTO entity_mappings (
        group_id,
        business_account_id,
        entity_type,
        ownership_percentage,
        voting_rights_percentage,
        control_percentage,
        consolidation_method,
        effective_date,
        termination_date,
        created_by
    ) VALUES (
        p_group_id,
        p_business_account_id,
        p_entity_type,
        p_ownership_percentage,
        p_voting_rights_percentage,
        p_control_percentage,
        p_consolidation_method,
        p_effective_date,
        p_termination_date,
        p_created_by
    ) RETURNING id INTO v_mapping_id;
    
    RETURN v_mapping_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tag_intercompany_transaction(
    p_group_id UUID,
    p_transaction_id UUID,
    p_source_entity_id UUID,
    p_target_entity_id UUID,
    p_transaction_type VARCHAR,
    p_elimination_method VARCHAR DEFAULT 'full_elimination',
    p_elimination_percentage DECIMAL DEFAULT 100.00,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_intercompany_id UUID;
BEGIN
    INSERT INTO intercompany_transactions (
        group_id,
        transaction_id,
        source_entity_id,
        target_entity_id,
        transaction_type,
        elimination_method,
        elimination_percentage,
        created_by
    ) VALUES (
        p_group_id,
        p_transaction_id,
        p_source_entity_id,
        p_target_entity_id,
        p_transaction_type,
        p_elimination_method,
        p_elimination_percentage,
        p_created_by
    ) RETURNING id INTO v_intercompany_id;
    
    RETURN v_intercompany_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_consolidation_snapshot(
    p_group_id UUID,
    p_snapshot_name VARCHAR,
    p_snapshot_description TEXT DEFAULT NULL,
    p_period_start DATE,
    p_period_end DATE,
    p_consolidation_date DATE,
    p_consolidation_method VARCHAR,
    p_currency VARCHAR DEFAULT 'USD',
    p_exchange_rates JSONB DEFAULT '{}',
    p_included_entities JSONB DEFAULT '[]',
    p_excluded_entities JSONB DEFAULT '[]',
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_snapshot_id UUID;
BEGIN
    INSERT INTO consolidation_snapshots (
        group_id,
        snapshot_name,
        snapshot_description,
        period_start,
        period_end,
        consolidation_date,
        consolidation_method,
        currency,
        exchange_rates,
        included_entities,
        excluded_entities,
        created_by
    ) VALUES (
        p_group_id,
        p_snapshot_name,
        p_snapshot_description,
        p_period_start,
        p_period_end,
        p_consolidation_date,
        p_consolidation_method,
        p_currency,
        p_exchange_rates,
        p_included_entities,
        p_excluded_entities,
        p_created_by
    ) RETURNING id INTO v_snapshot_id;
    
    RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_group_materialized_views() RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY group_consolidation_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY entity_performance_comparison;
    REFRESH MATERIALIZED VIEW CONCURRENTLY consolidation_dashboard;
END;
$$ LANGUAGE plpgsql;

-- Indexes for Performance
CREATE INDEX idx_group_entities_status ON group_entities(status);
CREATE INDEX idx_group_entities_parent ON group_entities(parent_group_id);
CREATE INDEX idx_entity_mappings_group ON entity_mappings(group_id);
CREATE INDEX idx_entity_mappings_business_account ON entity_mappings(business_account_id);
CREATE INDEX idx_entity_mappings_entity_type ON entity_mappings(entity_type);
CREATE INDEX idx_group_chart_of_accounts_group ON group_chart_of_accounts(group_id);
CREATE INDEX idx_group_chart_of_accounts_consolidation ON group_chart_of_accounts(is_consolidation_account);
CREATE INDEX idx_entity_account_mappings_group ON entity_account_mappings(group_account_id);
CREATE INDEX idx_entity_account_mappings_business_account ON entity_account_mappings(business_account_id);
CREATE INDEX idx_intercompany_transactions_group ON intercompany_transactions(group_id);
CREATE INDEX idx_intercompany_transactions_entities ON intercompany_transactions(source_entity_id, target_entity_id);
CREATE INDEX idx_intercompany_transactions_eliminated ON intercompany_transactions(is_eliminated);
CREATE INDEX idx_consolidation_snapshots_group ON consolidation_snapshots(group_id);
CREATE INDEX idx_consolidation_snapshots_status ON consolidation_snapshots(status);
CREATE INDEX idx_consolidated_financial_statements_snapshot ON consolidated_financial_statements(snapshot_id);
CREATE INDEX idx_consolidated_financial_statements_type ON consolidated_financial_statements(statement_type);
CREATE INDEX idx_group_kpis_group ON group_kpis(group_id);
CREATE INDEX idx_group_kpis_category ON group_kpis(kpi_category);
CREATE INDEX idx_group_access_control_group ON group_access_control(group_id);
CREATE INDEX idx_group_access_control_user ON group_access_control(user_id);
CREATE INDEX idx_group_activity_log_group ON group_activity_log(group_id);
CREATE INDEX idx_group_activity_log_performed_at ON group_activity_log(performed_at);

-- Row Level Security (RLS) Policies
ALTER TABLE group_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_account_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE intercompany_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consolidation_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE consolidated_financial_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_access_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Group/Holding Mode
CREATE POLICY group_entities_policy ON group_entities
    FOR ALL TO authenticated_users
    USING (id IN (
        SELECT group_id FROM group_access_control 
        WHERE user_id = current_user_id() AND is_active = true
    ));

CREATE POLICY entity_mappings_policy ON entity_mappings
    FOR ALL TO authenticated_users
    USING (group_id IN (
        SELECT group_id FROM group_access_control 
        WHERE user_id = current_user_id() AND is_active = true
    ));

CREATE POLICY group_chart_of_accounts_policy ON group_chart_of_accounts
    FOR ALL TO authenticated_users
    USING (group_id IN (
        SELECT group_id FROM group_access_control 
        WHERE user_id = current_user_id() AND is_active = true
    ));

CREATE POLICY entity_account_mappings_policy ON entity_account_mappings
    FOR ALL TO authenticated_users
    USING (group_account_id IN (
        SELECT gca.id FROM group_chart_of_accounts gca
        JOIN group_access_control gac ON gca.group_id = gac.group_id
        WHERE gac.user_id = current_user_id() AND gac.is_active = true
    ));

CREATE POLICY intercompany_transactions_policy ON intercompany_transactions
    FOR ALL TO authenticated_users
    USING (group_id IN (
        SELECT group_id FROM group_access_control 
        WHERE user_id = current_user_id() AND is_active = true
    ));

CREATE POLICY consolidation_snapshots_policy ON consolidation_snapshots
    FOR ALL TO authenticated_users
    USING (group_id IN (
        SELECT group_id FROM group_access_control 
        WHERE user_id = current_user_id() AND is_active = true
    ));

CREATE POLICY consolidated_financial_statements_policy ON consolidated_financial_statements
    FOR ALL TO authenticated_users
    USING (snapshot_id IN (
        SELECT cs.id FROM consolidation_snapshots cs
        JOIN group_access_control gac ON cs.group_id = gac.group_id
        WHERE gac.user_id = current_user_id() AND gac.is_active = true
    ));

CREATE POLICY group_kpis_policy ON group_kpis
    FOR ALL TO authenticated_users
    USING (group_id IN (
        SELECT group_id FROM group_access_control 
        WHERE user_id = current_user_id() AND is_active = true
    ));

CREATE POLICY group_access_control_policy ON group_access_control
    FOR ALL TO authenticated_users
    USING (user_id = current_user_id());

CREATE POLICY group_activity_log_policy ON group_activity_log
    FOR ALL TO authenticated_users
    USING (group_id IN (
        SELECT group_id FROM group_access_control 
        WHERE user_id = current_user_id() AND is_active = true
    ));

-- Triggers for Updated At
CREATE TRIGGER update_group_entities_updated_at
    BEFORE UPDATE ON group_entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entity_mappings_updated_at
    BEFORE UPDATE ON entity_mappings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_chart_of_accounts_updated_at
    BEFORE UPDATE ON group_chart_of_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entity_account_mappings_updated_at
    BEFORE UPDATE ON entity_account_mappings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intercompany_transactions_updated_at
    BEFORE UPDATE ON intercompany_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consolidation_snapshots_updated_at
    BEFORE UPDATE ON consolidation_snapshots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consolidated_financial_statements_updated_at
    BEFORE UPDATE ON consolidated_financial_statements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_kpis_updated_at
    BEFORE UPDATE ON group_kpis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
