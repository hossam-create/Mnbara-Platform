-- Sprint 21: Multi-Country Tax Mode Migration
-- Creates comprehensive tax compliance infrastructure for multiple jurisdictions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Country Tax Configuration
CREATE TABLE country_tax_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code VARCHAR(2) NOT NULL UNIQUE,
    country_name VARCHAR(100) NOT NULL,
    tax_jurisdiction VARCHAR(100) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    tax_year_start DATE NOT NULL,
    tax_year_end DATE NOT NULL,
    corporate_tax_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
    vat_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
    gst_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
    withholding_tax_rates JSONB NOT NULL DEFAULT '{}',
    tax_treaties JSONB NOT NULL DEFAULT '{}',
    tax_holidays JSONB NOT NULL DEFAULT '{}',
    compliance_requirements JSONB NOT NULL DEFAULT '{}',
    filing_frequency VARCHAR(50) NOT NULL DEFAULT 'quarterly' CHECK (filing_frequency IN ('monthly', 'quarterly', 'annually', 'semi_annual')),
    payment_frequency VARCHAR(50) NOT NULL DEFAULT 'quarterly' CHECK (payment_frequency IN ('monthly', 'quarterly', 'annually', 'semi_annual')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tax Rules Engine
CREATE TABLE tax_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id UUID NOT NULL REFERENCES country_tax_configurations(id) ON DELETE CASCADE,
    rule_name VARCHAR(200) NOT NULL,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('corporate_tax', 'vat', 'gst', 'withholding_tax', 'custom_duty', 'excise', 'other')),
    rule_description TEXT,
    applicable_transactions JSONB NOT NULL DEFAULT '[]',
    tax_rate DECIMAL(10,6) NOT NULL DEFAULT 0.000000,
    tax_base VARCHAR(100) NOT NULL,
    calculation_method VARCHAR(50) NOT NULL DEFAULT 'percentage' CHECK (calculation_method IN ('percentage', 'fixed_amount', 'tiered', 'progressive', 'reverse_calculation')),
    tier_rates JSONB DEFAULT '[]',
    exemptions JSONB DEFAULT '[]',
    conditions JSONB NOT NULL DEFAULT '{}',
    effective_date DATE NOT NULL,
    expiry_date DATE,
    priority INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transaction Tax Mapping
CREATE TABLE transaction_tax_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    country_id UUID NOT NULL REFERENCES country_tax_configurations(id) ON DELETE CASCADE,
    tax_rule_id UUID REFERENCES tax_rules(id) ON DELETE SET NULL,
    transaction_type VARCHAR(100) NOT NULL,
    transaction_category VARCHAR(100) NOT NULL,
    tax_type VARCHAR(50) NOT NULL CHECK (tax_type IN ('corporate_tax', 'vat', 'gst', 'withholding_tax', 'custom_duty', 'excise', 'other')),
    taxable_amount DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    tax_rate DECIMAL(10,6) NOT NULL DEFAULT 0.000000,
    calculated_tax DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL,
    exchange_rate DECIMAL(15,6) NOT NULL DEFAULT 1.000000,
    is_cross_border BOOLEAN DEFAULT false,
    source_country VARCHAR(2),
    destination_country VARCHAR(2),
    tax_jurisdiction VARCHAR(100),
    calculation_details JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'calculated' CHECK (status IN ('calculated', 'pending', 'error', 'exempt', 'adjusted')),
    error_details JSONB,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cross-Border Revenue Allocation
CREATE TABLE cross_border_revenue_allocation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    total_revenue DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL,
    allocation_method VARCHAR(50) NOT NULL DEFAULT 'revenue_based' CHECK (allocation_method IN ('revenue_based', 'cost_based', 'headcount_based', 'asset_based', 'custom')),
    allocations JSONB NOT NULL DEFAULT '[]',
    source_country VARCHAR(2) NOT NULL,
    destination_countries JSONB NOT NULL DEFAULT '[]',
    allocation_date DATE NOT NULL,
    exchange_rates JSONB NOT NULL DEFAULT '{}',
    allocation_rules JSONB DEFAULT '{}',
    is_final BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tax Exposure Analysis
CREATE TABLE tax_exposure_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    country_id UUID NOT NULL REFERENCES country_tax_configurations(id) ON DELETE CASCADE,
    analysis_period_start DATE NOT NULL,
    analysis_period_end DATE NOT NULL,
    total_revenue DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    total_expenses DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    taxable_income DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    estimated_tax_liability DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    paid_tax DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    outstanding_tax_liability DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    tax_exposure_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    exposure_factors JSONB DEFAULT '{}',
    mitigation_strategies JSONB DEFAULT '[]',
    next_filing_date DATE,
    next_payment_date DATE,
    currency VARCHAR(3) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tax Compliance Reports
CREATE TABLE tax_compliance_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    country_id UUID NOT NULL REFERENCES country_tax_configurations(id) ON DELETE CASCADE,
    report_type VARCHAR(100) NOT NULL,
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    filing_date DATE,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'accepted', 'rejected', 'amended', 'overdue')),
    report_data JSONB NOT NULL DEFAULT '{}',
    calculated_tax_liability DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    balance_due DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    penalties DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    interest_charges DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    supporting_documents JSONB DEFAULT '[]',
    compliance_notes TEXT,
    audit_trail JSONB DEFAULT '[]',
    submitted_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tax Audit Logs
CREATE TABLE tax_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    country_id UUID NOT NULL REFERENCES country_tax_configurations(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    activity_description TEXT NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    entity_name VARCHAR(200),
    previous_values JSONB DEFAULT '{}',
    new_values JSONB DEFAULT '{}',
    change_reason TEXT,
    performed_by UUID REFERENCES users(id),
    user_role VARCHAR(50),
    user_email VARCHAR(255),
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    compliance_impact VARCHAR(50) CHECK (compliance_impact IN ('none', 'low', 'medium', 'high', 'critical')),
    requires_review BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES users(id),
    review_date TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tax Payment Schedules
CREATE TABLE tax_payment_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    country_id UUID NOT NULL REFERENCES country_tax_configurations(id) ON DELETE CASCADE,
    tax_type VARCHAR(50) NOT NULL CHECK (tax_type IN ('corporate_tax', 'vat', 'gst', 'withholding_tax', 'custom_duty', 'excise', 'other')),
    payment_period_start DATE NOT NULL,
    payment_period_end DATE NOT NULL,
    due_date DATE NOT NULL,
    amount_due DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    amount_paid DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    balance_due DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    payment_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'paid', 'partial', 'overdue', 'cancelled')),
    late_payment_penalty DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    interest_charges DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    auto_payment_enabled BOOLEAN DEFAULT false,
    payment_instructions JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tax Treaty Management
CREATE TABLE tax_treaties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    treaty_name VARCHAR(200) NOT NULL,
    country_1_code VARCHAR(2) NOT NULL,
    country_2_code VARCHAR(2) NOT NULL,
    treaty_type VARCHAR(100) NOT NULL,
    effective_date DATE NOT NULL,
    termination_date DATE,
    withholding_tax_rates JSONB NOT NULL DEFAULT '{}',
    double_taxation_avoidance JSONB NOT NULL DEFAULT '{}',
    special_provisions JSONB DEFAULT '{}',
    documentation_requirements JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'terminated')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(country_1_code, country_2_code, treaty_type)
);

-- Materialized Views for Analytics
CREATE MATERIALIZED VIEW tax_compliance_dashboard AS
SELECT 
    ba.id as business_account_id,
    ba.name as business_name,
    COUNT(DISTINCT ctc.country_code) as countries_covered,
    COUNT(DISTINCT ttm.id) as total_transactions,
    COUNT(DISTINCT CASE WHEN ttm.status = 'calculated' THEN ttm.id END) as calculated_transactions,
    SUM(CASE WHEN ttm.status = 'calculated' THEN ttm.calculated_tax ELSE 0 END) as total_tax_calculated,
    COUNT(DISTINCT tcr.id) as compliance_reports,
    COUNT(DISTINCT CASE WHEN tcr.status = 'submitted' THEN tcr.id END) as submitted_reports,
    SUM(CASE WHEN tcr.status = 'submitted' THEN tcr.balance_due ELSE 0 END) as total_balance_due,
    COUNT(DISTINCT tps.id) as payment_schedules,
    COUNT(DISTINCT CASE WHEN tps.status = 'overdue' THEN tps.id END) as overdue_payments,
    SUM(CASE WHEN tps.status = 'overdue' THEN tps.balance_due ELSE 0 END) as total_overdue_amount,
    MAX(tcr.due_date) as next_filing_date,
    MAX(tps.due_date) as next_payment_date,
    CASE 
        WHEN MAX(tcr.due_date) >= CURRENT_DATE - INTERVAL '30 days' THEN 'current'
        WHEN MAX(tcr.due_date) >= CURRENT_DATE - INTERVAL '90 days' THEN 'recent'
        ELSE 'overdue'
    END as compliance_status
FROM business_accounts ba
LEFT JOIN transaction_tax_mappings ttm ON ba.id = ttm.business_account_id
LEFT JOIN country_tax_configurations ctc ON ttm.country_id = ctc.id
LEFT JOIN tax_compliance_reports tcr ON ba.id = tcr.business_account_id
LEFT JOIN tax_payment_schedules tps ON ba.id = tps.business_account_id
GROUP BY ba.id, ba.name;

CREATE MATERIALIZED VIEW tax_exposure_summary AS
SELECT 
    ba.id as business_account_id,
    ba.name as business_name,
    ctc.country_code,
    ctc.country_name,
    tea.analysis_period_start,
    tea.analysis_period_end,
    tea.total_revenue,
    tea.total_expenses,
    tea.taxable_income,
    tea.estimated_tax_liability,
    tea.paid_tax,
    tea.outstanding_tax_liability,
    tea.tax_exposure_score,
    tea.risk_level,
    tea.next_filing_date,
    tea.next_payment_date,
    RANK() OVER (PARTITION BY ba.id ORDER BY tea.tax_exposure_score DESC) as exposure_rank,
    CASE 
        WHEN tea.tax_exposure_score >= 80 THEN 'critical'
        WHEN tea.tax_exposure_score >= 60 THEN 'high'
        WHEN tea.tax_exposure_score >= 40 THEN 'medium'
        ELSE 'low'
    END as overall_risk_category
FROM business_accounts ba
JOIN tax_exposure_analysis tea ON ba.id = tea.business_account_id
JOIN country_tax_configurations ctc ON tea.country_id = ctc.id
WHERE tea.analysis_period_end >= CURRENT_DATE - INTERVAL '12 months'
ORDER BY tea.analysis_period_end DESC;

CREATE MATERIALIZED VIEW cross_border_tax_summary AS
SELECT 
    ba.id as business_account_id,
    ba.name as business_name,
    cbr.source_country,
    cbr.destination_countries,
    COUNT(DISTINCT cbr.id) as cross_border_transactions,
    SUM(cbr.total_revenue) as total_cross_border_revenue,
    COUNT(DISTINCT ctc.country_code) as tax_jurisdictions,
    SUM(CASE WHEN ttm.is_cross_border = true THEN ttm.calculated_tax ELSE 0 END) as cross_border_tax,
    AVG(ttm.exchange_rate) as avg_exchange_rate,
    MAX(cbr.allocation_date) as last_allocation_date
FROM business_accounts ba
LEFT JOIN cross_border_revenue_allocation cbr ON ba.id = cbr.business_account_id
LEFT JOIN transaction_tax_mappings ttm ON ba.id = ttm.business_account_id
LEFT JOIN country_tax_configurations ctc ON ttm.country_id = ctc.id
WHERE cbr.allocation_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY ba.id, ba.name, cbr.source_country, cbr.destination_countries
ORDER BY total_cross_border_revenue DESC;

-- Database Functions
CREATE OR REPLACE FUNCTION create_country_tax_config(
    p_country_code VARCHAR,
    p_country_name VARCHAR,
    p_tax_jurisdiction VARCHAR,
    p_currency VARCHAR,
    p_tax_year_start DATE,
    p_tax_year_end DATE,
    p_corporate_tax_rate DECIMAL,
    p_vat_rate DECIMAL DEFAULT 0.0000,
    p_gst_rate DECIMAL DEFAULT 0.0000,
    p_withholding_tax_rates JSONB DEFAULT '{}',
    p_tax_treaties JSONB DEFAULT '{}',
    p_tax_holidays JSONB DEFAULT '{}',
    p_compliance_requirements JSONB DEFAULT '{}',
    p_filing_frequency VARCHAR DEFAULT 'quarterly',
    p_payment_frequency VARCHAR DEFAULT 'quarterly',
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_config_id UUID;
BEGIN
    INSERT INTO country_tax_configurations (
        country_code,
        country_name,
        tax_jurisdiction,
        currency,
        tax_year_start,
        tax_year_end,
        corporate_tax_rate,
        vat_rate,
        gst_rate,
        withholding_tax_rates,
        tax_treaties,
        tax_holidays,
        compliance_requirements,
        filing_frequency,
        payment_frequency,
        created_by
    ) VALUES (
        p_country_code,
        p_country_name,
        p_tax_jurisdiction,
        p_currency,
        p_tax_year_start,
        p_tax_year_end,
        p_corporate_tax_rate,
        p_vat_rate,
        p_gst_rate,
        p_withholding_tax_rates,
        p_tax_treaties,
        p_tax_holidays,
        p_compliance_requirements,
        p_filing_frequency,
        p_payment_frequency,
        p_created_by
    ) RETURNING id INTO v_config_id;
    
    RETURN v_config_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_tax_rule(
    p_country_id UUID,
    p_rule_name VARCHAR,
    p_rule_type VARCHAR,
    p_rule_description TEXT DEFAULT NULL,
    p_applicable_transactions JSONB DEFAULT '[]',
    p_tax_rate DECIMAL,
    p_tax_base VARCHAR,
    p_calculation_method VARCHAR DEFAULT 'percentage',
    p_tier_rates JSONB DEFAULT '[]',
    p_exemptions JSONB DEFAULT '[]',
    p_conditions JSONB DEFAULT '{}',
    p_effective_date DATE,
    p_expiry_date DATE DEFAULT NULL,
    p_priority INTEGER DEFAULT 100,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_rule_id UUID;
BEGIN
    INSERT INTO tax_rules (
        country_id,
        rule_name,
        rule_type,
        rule_description,
        applicable_transactions,
        tax_rate,
        tax_base,
        calculation_method,
        tier_rates,
        exemptions,
        conditions,
        effective_date,
        expiry_date,
        priority,
        created_by
    ) VALUES (
        p_country_id,
        p_rule_name,
        p_rule_type,
        p_rule_description,
        p_applicable_transactions,
        p_tax_rate,
        p_tax_base,
        p_calculation_method,
        p_tier_rates,
        p_exemptions,
        p_conditions,
        p_effective_date,
        p_expiry_date,
        p_priority,
        p_created_by
    ) RETURNING id INTO v_rule_id;
    
    RETURN v_rule_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_transaction_tax(
    p_business_account_id UUID,
    p_transaction_id UUID,
    p_country_id UUID,
    p_tax_type VARCHAR,
    p_taxable_amount DECIMAL,
    p_currency VARCHAR,
    p_exchange_rate DECIMAL DEFAULT 1.000000,
    p_is_cross_border BOOLEAN DEFAULT false,
    p_source_country VARCHAR DEFAULT NULL,
    p_destination_country VARCHAR DEFAULT NULL,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_mapping_id UUID;
    v_tax_rate DECIMAL;
    v_calculated_tax DECIMAL;
    v_calculation_details JSONB;
BEGIN
    -- Get applicable tax rate from tax rules
    SELECT tr.tax_rate INTO v_tax_rate
    FROM tax_rules tr
    WHERE tr.country_id = p_country_id
    AND tr.rule_type = p_tax_type
    AND tr.is_active = true
    AND tr.effective_date <= CURRENT_DATE
    AND (tr.expiry_date IS NULL OR tr.expiry_date > CURRENT_DATE)
    ORDER BY tr.priority ASC, tr.effective_date DESC
    LIMIT 1;
    
    -- Calculate tax based on method
    IF v_tax_rate IS NOT NULL THEN
        v_calculated_tax := p_taxable_amount * (v_tax_rate / 100);
        v_calculation_details := jsonb_build_object(
            'tax_rate', v_tax_rate,
            'taxable_amount', p_taxable_amount,
            'exchange_rate', p_exchange_rate,
            'calculation_method', 'percentage'
        );
    ELSE
        v_calculated_tax := 0;
        v_calculation_details := jsonb_build_object(
            'error', 'No applicable tax rule found',
            'tax_type', p_tax_type,
            'country_id', p_country_id
        );
    END IF;
    
    -- Create tax mapping record
    INSERT INTO transaction_tax_mappings (
        business_account_id,
        transaction_id,
        country_id,
        tax_type,
        transaction_type,
        transaction_category,
        taxable_amount,
        tax_rate,
        calculated_tax,
        currency,
        exchange_rate,
        is_cross_border,
        source_country,
        destination_country,
        calculation_details,
        created_by
    ) VALUES (
        p_business_account_id,
        p_transaction_id,
        p_country_id,
        p_tax_type,
        'transaction', -- Would be derived from transaction
        'general', -- Would be derived from transaction
        p_taxable_amount,
        COALESCE(v_tax_rate, 0),
        v_calculated_tax,
        p_currency,
        p_exchange_rate,
        p_is_cross_border,
        p_source_country,
        p_destination_country,
        v_calculation_details,
        p_created_by
    ) RETURNING id INTO v_mapping_id;
    
    RETURN v_mapping_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_tax_materialized_views() RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY tax_compliance_dashboard;
    REFRESH MATERIALIZED VIEW CONCURRENTLY tax_exposure_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY cross_border_tax_summary;
END;
$$ LANGUAGE plpgsql;

-- Indexes for Performance
CREATE INDEX idx_country_tax_configurations_country ON country_tax_configurations(country_code);
CREATE INDEX idx_country_tax_configurations_status ON country_tax_configurations(status);
CREATE INDEX idx_tax_rules_country ON tax_rules(country_id);
CREATE INDEX idx_tax_rules_type ON tax_rules(rule_type);
CREATE INDEX idx_tax_rules_active ON tax_rules(is_active);
CREATE INDEX idx_transaction_tax_mappings_business_account ON transaction_tax_mappings(business_account_id);
CREATE INDEX idx_transaction_tax_mappings_transaction ON transaction_tax_mappings(transaction_id);
CREATE INDEX idx_transaction_tax_mappings_country ON transaction_tax_mappings(country_id);
CREATE INDEX idx_transaction_tax_mappings_type ON transaction_tax_mappings(tax_type);
CREATE INDEX idx_transaction_tax_mappings_cross_border ON transaction_tax_mappings(is_cross_border);
CREATE INDEX idx_cross_border_revenue_allocation_business_account ON cross_border_revenue_allocation(business_account_id);
CREATE INDEX idx_cross_border_revenue_allocation_date ON cross_border_revenue_allocation(allocation_date);
CREATE INDEX idx_tax_exposure_analysis_business_account ON tax_exposure_analysis(business_account_id);
CREATE INDEX idx_tax_exposure_analysis_country ON tax_exposure_analysis(country_id);
CREATE INDEX idx_tax_exposure_analysis_period ON tax_exposure_analysis(analysis_period_start, analysis_period_end);
CREATE INDEX idx_tax_compliance_reports_business_account ON tax_compliance_reports(business_account_id);
CREATE INDEX idx_tax_compliance_reports_country ON tax_compliance_reports(country_id);
CREATE INDEX idx_tax_compliance_reports_status ON tax_compliance_reports(status);
CREATE INDEX idx_tax_compliance_reports_due_date ON tax_compliance_reports(due_date);
CREATE INDEX idx_tax_audit_logs_business_account ON tax_audit_logs(business_account_id);
CREATE INDEX idx_tax_audit_logs_country ON tax_audit_logs(country_id);
CREATE INDEX idx_tax_audit_logs_performed_at ON tax_audit_logs(performed_at);
CREATE INDEX idx_tax_payment_schedules_business_account ON tax_payment_schedules(business_account_id);
CREATE INDEX idx_tax_payment_schedules_country ON tax_payment_schedules(country_id);
CREATE INDEX idx_tax_payment_schedules_due_date ON tax_payment_schedules(due_date);
CREATE INDEX idx_tax_payment_schedules_status ON tax_payment_schedules(status);
CREATE INDEX idx_tax_treaties_countries ON tax_treaties(country_1_code, country_2_code);

-- Row Level Security (RLS) Policies
ALTER TABLE country_tax_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_tax_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_border_revenue_allocation ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_exposure_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_treaties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Multi-Country Tax Mode
CREATE POLICY country_tax_configurations_policy ON country_tax_configurations
    FOR ALL TO authenticated_users
    USING (true); -- Tax configurations are generally read-only for all authenticated users

CREATE POLICY tax_rules_policy ON tax_rules
    FOR ALL TO authenticated_users
    USING (true); -- Tax rules are generally read-only for all authenticated users

CREATE POLICY transaction_tax_mappings_policy ON transaction_tax_mappings
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY cross_border_revenue_allocation_policy ON cross_border_revenue_allocation
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY tax_exposure_analysis_policy ON tax_exposure_analysis
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY tax_compliance_reports_policy ON tax_compliance_reports
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY tax_audit_logs_policy ON tax_audit_logs
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY tax_payment_schedules_policy ON tax_payment_schedules
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY tax_treaties_policy ON tax_treaties
    FOR ALL TO authenticated_users
    USING (true); -- Tax treaties are generally read-only for all authenticated users

-- Triggers for Updated At
CREATE TRIGGER update_country_tax_configurations_updated_at
    BEFORE UPDATE ON country_tax_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_rules_updated_at
    BEFORE UPDATE ON tax_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_tax_mappings_updated_at
    BEFORE UPDATE ON transaction_tax_mappings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cross_border_revenue_allocation_updated_at
    BEFORE UPDATE ON cross_border_revenue_allocation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_exposure_analysis_updated_at
    BEFORE UPDATE ON tax_exposure_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_compliance_reports_updated_at
    BEFORE UPDATE ON tax_compliance_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_payment_schedules_updated_at
    BEFORE UPDATE ON tax_payment_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_treaties_updated_at
    BEFORE UPDATE ON tax_treaties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
