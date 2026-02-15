-- Sprint 24: Transfer Pricing Engine Migration
-- Creates comprehensive transfer pricing system with OECD-aligned methodologies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Intercompany Transactions
CREATE TABLE intercompany_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id),
    invoice_id UUID REFERENCES invoices(id),
    expense_id UUID REFERENCES expenses(id),
    source_entity_id UUID NOT NULL REFERENCES entities(id),
    destination_entity_id UUID NOT NULL REFERENCES entities(id),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('sale', 'service', 'loan', 'royalty', 'license', 'interest', 'rental', 'management_fee', 'other')),
    transaction_date DATE NOT NULL,
    currency VARCHAR(3) NOT NULL,
    transaction_amount DECIMAL(20,4) NOT NULL,
    transfer_price DECIMAL(20,4) NOT NULL,
    arm_length_price DECIMAL(20,4),
    pricing_method VARCHAR(50) NOT NULL CHECK (pricing_method IN ('cup', 'cost_plus', 'tnmm', 'resale_minus', 'profit_split', 'transactional_net_margin', 'cost_method', 'other')),
    adjustment_amount DECIMAL(20,4) DEFAULT 0.0000,
    adjustment_reason TEXT,
    benchmark_data JSONB DEFAULT '{}',
    justification TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'analyzed', 'adjusted', 'approved', 'rejected', 'under_review')),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    compliance_score INTEGER CHECK (compliance_score BETWEEN 0 AND 100),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transfer Pricing Methods
CREATE TABLE transfer_pricing_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    method_name VARCHAR(100) NOT NULL,
    method_type VARCHAR(50) NOT NULL CHECK (method_type IN ('cup', 'cost_plus', 'tnmm', 'resale_minus', 'profit_split', 'transactional_net_margin', 'cost_method', 'other')),
    description TEXT,
    applicable_transaction_types JSONB DEFAULT '[]',
    margin_range JSONB DEFAULT '{}',
    markup_range JSONB DEFAULT '{}',
    cost_base VARCHAR(50) CHECK (cost_base IN ('full_cost', 'variable_cost', 'standard_cost', 'actual_cost')),
    profit_level_indicator VARCHAR(100),
    benchmark_sources JSONB DEFAULT '[]',
    documentation_requirements JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Arm's Length Benchmarks
CREATE TABLE arms_length_benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    industry_code VARCHAR(20),
    country_code VARCHAR(2),
    currency VARCHAR(3) NOT NULL,
    benchmark_date DATE NOT NULL,
    price_range_low DECIMAL(20,4),
    price_range_high DECIMAL(20,4),
    price_range_median DECIMAL(20,4),
    margin_range_low DECIMAL(8,4),
    margin_range_high DECIMAL(8,4),
    margin_range_median DECIMAL(8,4),
    markup_range_low DECIMAL(8,4),
    markup_range_high DECIMAL(8,4),
    markup_range_median DECIMAL(8,4),
    sample_size INTEGER,
    data_sources JSONB DEFAULT '[]',
    reliability_score INTEGER CHECK (reliability_score BETWEEN 1 AND 5),
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transfer Pricing Adjustments
CREATE TABLE transfer_pricing_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    intercompany_transaction_id UUID NOT NULL REFERENCES intercompany_transactions(id) ON DELETE CASCADE,
    adjustment_type VARCHAR(50) NOT NULL CHECK (adjustment_type IN ('price_increase', 'price_decrease', 'margin_adjustment', 'markup_adjustment', 'method_change', 'correction')),
    original_price DECIMAL(20,4) NOT NULL,
    adjusted_price DECIMAL(20,4) NOT NULL,
    adjustment_amount DECIMAL(20,4) NOT NULL,
    adjustment_percentage DECIMAL(8,4) NOT NULL,
    adjustment_reason TEXT NOT NULL,
    justification TEXT,
    supporting_documents JSONB DEFAULT '[]',
    approved_by UUID REFERENCES users(id),
    approval_date TIMESTAMP WITH TIME ZONE,
    effective_date DATE NOT NULL,
    is_simulation BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Country-by-Country Profit Allocation
CREATE TABLE cbc_profit_allocation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    fiscal_year INTEGER NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    entity_id UUID REFERENCES entities(id),
    total_revenue DECIMAL(20,4) DEFAULT 0.0000,
    total_expenses DECIMAL(20,4) DEFAULT 0.0000,
    profit_before_tax DECIMAL(20,4) DEFAULT 0.0000,
    tax_paid DECIMAL(20,4) DEFAULT 0.0000,
    profit_after_tax DECIMAL(20,4) DEFAULT 0.0000,
    intercompany_revenue DECIMAL(20,4) DEFAULT 0.0000,
    intercompany_expenses DECIMAL(20,4) DEFAULT 0.0000,
    transfer_pricing_adjustments DECIMAL(20,4) DEFAULT 0.0000,
    allocated_profit DECIMAL(20,4) DEFAULT 0.0000,
    effective_tax_rate DECIMAL(8,4) DEFAULT 0.0000,
    employees INTEGER DEFAULT 0,
    tangible_assets DECIMAL(20,4) DEFAULT 0.0000,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transfer Pricing Documentation
CREATE TABLE transfer_pricing_documentation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    documentation_type VARCHAR(50) NOT NULL CHECK (documentation_type IN ('master_file', 'local_file', 'country_file', 'benchmark_study', 'methodology', 'adjustment_report', 'other')),
    fiscal_year INTEGER NOT NULL,
    country_code VARCHAR(2),
    entity_id UUID REFERENCES entities(id),
    document_title VARCHAR(200) NOT NULL,
    document_content TEXT,
    document_metadata JSONB DEFAULT '{}',
    supporting_documents JSONB DEFAULT '[]',
    methodology_description TEXT,
    functional_analysis TEXT,
    benchmark_analysis TEXT,
    conclusions TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'submitted', 'archived')),
    approved_by UUID REFERENCES users(id),
    approval_date TIMESTAMP WITH TIME ZONE,
    version INTEGER DEFAULT 1,
    language VARCHAR(10) DEFAULT 'en' CHECK (language IN ('en', 'ar')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transfer Pricing Snapshots
CREATE TABLE transfer_pricing_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    snapshot_name VARCHAR(200) NOT NULL,
    snapshot_description TEXT,
    snapshot_date DATE NOT NULL,
    snapshot_data JSONB NOT NULL DEFAULT '{}',
    includes_simulations BOOLEAN DEFAULT false,
    is_read_only BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transfer Pricing Compliance Indicators
CREATE TABLE transfer_pricing_compliance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    fiscal_year INTEGER NOT NULL,
    country_code VARCHAR(2),
    compliance_score INTEGER CHECK (compliance_score BETWEEN 0 AND 100),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    documentation_completeness INTEGER CHECK (documentation_completeness BETWEEN 0 AND 100),
    benchmark_adequacy INTEGER CHECK (benchmark_adequacy BETWEEN 0 AND 100),
    method_appropriateness INTEGER CHECK (method_appropriateness BETWEEN 0 AND 100),
    adjustment_frequency INTEGER DEFAULT 0,
    audit_flags JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    last_review_date DATE,
    reviewed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Materialized Views for Analytics
CREATE MATERIALIZED VIEW transfer_pricing_summary AS
SELECT 
    ba.id as business_account_id,
    ba.name as business_name,
    COUNT(it.id) as total_intercompany_transactions,
    COUNT(CASE WHEN it.status = 'approved' THEN 1 END) as approved_transactions,
    COUNT(CASE WHEN it.adjustment_amount != 0 THEN 1 END) as adjusted_transactions,
    SUM(it.transaction_amount) as total_transaction_amount,
    SUM(it.adjustment_amount) as total_adjustment_amount,
    ROUND(AVG(it.compliance_score), 2) as average_compliance_score,
    COUNT(CASE WHEN it.risk_level = 'high' THEN 1 END) as high_risk_transactions,
    COUNT(CASE WHEN it.risk_level = 'critical' THEN 1 END) as critical_risk_transactions,
    COUNT(DISTINCT it.source_entity_id) as source_entities,
    COUNT(DISTINCT it.destination_entity_id) as destination_entities,
    COUNT(DISTINCT it.pricing_method) as methods_used,
    MAX(it.transaction_date) as last_transaction_date
FROM business_accounts ba
LEFT JOIN intercompany_transactions it ON ba.id = it.business_account_id
GROUP BY ba.id, ba.name;

CREATE MATERIALIZED VIEW transfer_pricing_method_analysis AS
SELECT 
    it.business_account_id,
    it.pricing_method,
    COUNT(it.id) as transaction_count,
    SUM(it.transaction_amount) as total_amount,
    SUM(it.adjustment_amount) as total_adjustments,
    AVG(it.compliance_score) as avg_compliance_score,
    COUNT(CASE WHEN it.adjustment_amount != 0 THEN 1 END) as adjustment_count,
    ROUND(AVG(it.adjustment_amount / it.transaction_amount * 100), 2) as avg_adjustment_percentage,
    MAX(it.transaction_date) as last_used_date
FROM intercompany_transactions it
WHERE it.status IN ('approved', 'adjusted')
GROUP BY it.business_account_id, it.pricing_method;

CREATE MATERIALIZED VIEW cbc_profit_summary AS
SELECT 
    cpa.business_account_id,
    cpa.fiscal_year,
    COUNT(DISTINCT cpa.country_code) as countries_count,
    SUM(cpa.total_revenue) as total_group_revenue,
    SUM(cpa.profit_before_tax) as total_group_profit,
    SUM(cpa.tax_paid) as total_tax_paid,
    SUM(cpa.transfer_pricing_adjustments) as total_tp_adjustments,
    AVG(cpa.effective_tax_rate) as avg_effective_tax_rate,
    SUM(cpa.employees) as total_employees,
    SUM(cpa.tangible_assets) as total_tangible_assets
FROM cbc_profit_allocation cpa
WHERE cpa.status = 'approved'
GROUP BY cpa.business_account_id, cpa.fiscal_year;

-- Database Functions
CREATE OR REPLACE FUNCTION create_intercompany_transaction(
    p_business_account_id UUID,
    p_transaction_id UUID DEFAULT NULL,
    p_invoice_id UUID DEFAULT NULL,
    p_expense_id UUID DEFAULT NULL,
    p_source_entity_id UUID,
    p_destination_entity_id UUID,
    p_transaction_type VARCHAR,
    p_transaction_date DATE,
    p_currency VARCHAR,
    p_transaction_amount DECIMAL,
    p_transfer_price DECIMAL,
    p_pricing_method VARCHAR,
    p_justification TEXT DEFAULT NULL,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
BEGIN
    INSERT INTO intercompany_transactions (
        id,
        business_account_id,
        transaction_id,
        invoice_id,
        expense_id,
        source_entity_id,
        destination_entity_id,
        transaction_type,
        transaction_date,
        currency,
        transaction_amount,
        transfer_price,
        pricing_method,
        justification,
        created_by
    ) VALUES (
        uuid_generate_v4()::uuid,
        p_business_account_id::uuid,
        p_transaction_id::uuid,
        p_invoice_id::uuid,
        p_expense_id::uuid,
        p_source_entity_id::uuid,
        p_destination_entity_id::uuid,
        p_transaction_type::varchar,
        p_transaction_date::date,
        p_currency::varchar,
        p_transaction_amount::decimal,
        p_transfer_price::decimal,
        p_pricing_method::varchar,
        p_justification::text,
        p_created_by::uuid
    ) RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_arms_length_price(
    p_business_account_id UUID,
    p_transaction_type VARCHAR,
    p_industry_code VARCHAR DEFAULT NULL,
    p_country_code VARCHAR DEFAULT NULL,
    p_currency VARCHAR,
    p_transaction_date DATE
) RETURNS DECIMAL AS $$
DECLARE
    v_benchmark_price DECIMAL;
BEGIN
    SELECT price_range_median INTO v_benchmark_price
    FROM arms_length_benchmarks
    WHERE business_account_id = p_business_account_id
        AND transaction_type = p_transaction_type
        AND (p_industry_code IS NULL OR industry_code = p_industry_code)
        AND (p_country_code IS NULL OR country_code = p_country_code)
        AND currency = p_currency
        AND benchmark_date <= p_transaction_date
    ORDER BY benchmark_date DESC
    LIMIT 1;
    
    RETURN COALESCE(v_benchmark_price, 0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_transfer_pricing_adjustment(
    p_business_account_id UUID,
    p_intercompany_transaction_id UUID,
    p_adjustment_type VARCHAR,
    p_original_price DECIMAL,
    p_adjusted_price DECIMAL,
    p_adjustment_reason TEXT,
    p_justification TEXT DEFAULT NULL,
    p_effective_date DATE,
    p_is_simulation BOOLEAN DEFAULT false,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_adjustment_id UUID;
    v_adjustment_amount DECIMAL;
    v_adjustment_percentage DECIMAL;
BEGIN
    v_adjustment_amount := p_adjusted_price - p_original_price;
    v_adjustment_percentage := (v_adjustment_amount / p_original_price) * 100;
    
    INSERT INTO transfer_pricing_adjustments (
        id,
        business_account_id,
        intercompany_transaction_id,
        adjustment_type,
        original_price,
        adjusted_price,
        adjustment_amount,
        adjustment_percentage,
        adjustment_reason,
        justification,
        effective_date,
        is_simulation,
        created_by
    ) VALUES (
        uuid_generate_v4()::uuid,
        p_business_account_id::uuid,
        p_intercompany_transaction_id::uuid,
        p_adjustment_type::varchar,
        p_original_price::decimal,
        p_adjusted_price::decimal,
        v_adjustment_amount::decimal,
        v_adjustment_percentage::decimal,
        p_adjustment_reason::text,
        p_justification::text,
        p_effective_date::date,
        p_is_simulation::boolean,
        p_created_by::uuid
    ) RETURNING id INTO v_adjustment_id;
    
    RETURN v_adjustment_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_transfer_pricing_materialized_views() RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY transfer_pricing_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY transfer_pricing_method_analysis;
    REFRESH MATERIALIZED VIEW CONCURRENTLY cbc_profit_summary;
END;
$$ LANGUAGE plpgsql;

-- Indexes for Performance
CREATE INDEX idx_intercompany_transactions_business_account ON intercompany_transactions(business_account_id);
CREATE INDEX idx_intercompany_transactions_entities ON intercompany_transactions(source_entity_id, destination_entity_id);
CREATE INDEX idx_intercompany_transactions_type ON intercompany_transactions(transaction_type);
CREATE INDEX idx_intercompany_transactions_method ON intercompany_transactions(pricing_method);
CREATE INDEX idx_intercompany_transactions_date ON intercompany_transactions(transaction_date);
CREATE INDEX idx_intercompany_transactions_status ON intercompany_transactions(status);
CREATE INDEX idx_intercompany_transactions_risk ON intercompany_transactions(risk_level);
CREATE INDEX idx_transfer_pricing_methods_business_account ON transfer_pricing_methods(business_account_id);
CREATE INDEX idx_transfer_pricing_methods_type ON transfer_pricing_methods(method_type);
CREATE INDEX idx_arms_length_benchmarks_business_account ON arms_length_benchmarks(business_account_id);
CREATE INDEX idx_arms_length_benchmarks_type ON arms_length_benchmarks(transaction_type);
CREATE INDEX idx_arms_length_benchmarks_country ON arms_length_benchmarks(country_code);
CREATE INDEX idx_arms_length_benchmarks_date ON arms_length_benchmarks(benchmark_date);
CREATE INDEX idx_transfer_pricing_adjustments_business_account ON transfer_pricing_adjustments(business_account_id);
CREATE INDEX idx_transfer_pricing_adjustments_transaction ON transfer_pricing_adjustments(intercompany_transaction_id);
CREATE INDEX idx_transfer_pricing_adjustments_date ON transfer_pricing_adjustments(effective_date);
CREATE INDEX idx_cbc_profit_allocation_business_account ON cbc_profit_allocation(business_account_id);
CREATE INDEX idx_cbc_profit_allocation_year ON cbc_profit_allocation(fiscal_year);
CREATE INDEX idx_cbc_profit_allocation_country ON cbc_profit_allocation(country_code);
CREATE INDEX idx_transfer_pricing_documentation_business_account ON transfer_pricing_documentation(business_account_id);
CREATE INDEX idx_transfer_pricing_documentation_type ON transfer_pricing_documentation(documentation_type);
CREATE INDEX idx_transfer_pricing_documentation_year ON transfer_pricing_documentation(fiscal_year);
CREATE INDEX idx_transfer_pricing_snapshots_business_account ON transfer_pricing_snapshots(business_account_id);
CREATE INDEX idx_transfer_pricing_snapshots_date ON transfer_pricing_snapshots(snapshot_date);
CREATE INDEX idx_transfer_pricing_compliance_business_account ON transfer_pricing_compliance(business_account_id);
CREATE INDEX idx_transfer_pricing_compliance_year ON transfer_pricing_compliance(fiscal_year);
CREATE INDEX idx_transfer_pricing_compliance_country ON transfer_pricing_compliance(country_code);

-- Row Level Security (RLS) Policies
ALTER TABLE intercompany_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_pricing_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE arms_length_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_pricing_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbc_profit_allocation ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_pricing_documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_pricing_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_pricing_compliance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Transfer Pricing Engine
CREATE POLICY intercompany_transactions_policy ON intercompany_transactions
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY transfer_pricing_methods_policy ON transfer_pricing_methods
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY arms_length_benchmarks_policy ON arms_length_benchmarks
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY transfer_pricing_adjustments_policy ON transfer_pricing_adjustments
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY cbc_profit_allocation_policy ON cbc_profit_allocation
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY transfer_pricing_documentation_policy ON transfer_pricing_documentation
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY transfer_pricing_snapshots_policy ON transfer_pricing_snapshots
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY transfer_pricing_compliance_policy ON transfer_pricing_compliance
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

-- Triggers for Updated At
CREATE TRIGGER update_intercompany_transactions_updated_at
    BEFORE UPDATE ON intercompany_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfer_pricing_methods_updated_at
    BEFORE UPDATE ON transfer_pricing_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_arms_length_benchmarks_updated_at
    BEFORE UPDATE ON arms_length_benchmarks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfer_pricing_adjustments_updated_at
    BEFORE UPDATE ON transfer_pricing_adjustments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cbc_profit_allocation_updated_at
    BEFORE UPDATE ON cbc_profit_allocation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfer_pricing_documentation_updated_at
    BEFORE UPDATE ON transfer_pricing_documentation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
