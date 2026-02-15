-- Sprint 25: Global Treasury Mode Migration
-- Creates comprehensive global treasury management system with centralized cash visibility and liquidity optimization

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Global Cash Positions
CREATE TABLE global_cash_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id),
    country_code VARCHAR(2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    cash_balance DECIMAL(20,4) NOT NULL DEFAULT 0.0000,
    available_balance DECIMAL(20,4) NOT NULL DEFAULT 0.0000,
    restricted_balance DECIMAL(20,4) NOT NULL DEFAULT 0.0000,
    bank_accounts_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    balance_date DATE NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Multi-Currency Cash Positioning
CREATE TABLE multi_currency_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id),
    currency VARCHAR(3) NOT NULL,
    total_balance DECIMAL(20,4) NOT NULL DEFAULT 0.0000,
    fx_rate_base DECIMAL(15,8) NOT NULL,
    fx_rate_to_usd DECIMAL(15,8) NOT NULL,
    balance_in_usd DECIMAL(20,4) NOT NULL DEFAULT 0.0000,
    balance_in_base DECIMAL(20,4) NOT NULL DEFAULT 0.0000,
    currency_risk_score DECIMAL(5,2) DEFAULT 0.00,
    concentration_risk DECIMAL(5,2) DEFAULT 0.00,
    position_date DATE NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Liquidity Forecasts
CREATE TABLE liquidity_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id),
    currency VARCHAR(3) NOT NULL,
    forecast_type VARCHAR(20) NOT NULL CHECK (forecast_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
    forecast_date DATE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    opening_balance DECIMAL(20,4) NOT NULL DEFAULT 0.0000,
    inflows DECIMAL(20,4) NOT NULL DEFAULT 0.0000,
    outflows DECIMAL(20,4) NOT NULL DEFAULT 0.0000,
    net_cash_flow DECIMAL(20,4) NOT NULL DEFAULT 0.0000,
    closing_balance DECIMAL(20,4) NOT NULL DEFAULT 0.0000,
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
    forecast_model VARCHAR(100),
    assumptions JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- FX Risk Exposure
CREATE TABLE fx_risk_exposure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id),
    currency VARCHAR(3) NOT NULL,
    base_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    exposure_type VARCHAR(20) NOT NULL CHECK (exposure_type IN ('transactional', 'translation', 'economic')),
    exposure_amount DECIMAL(20,4) NOT NULL DEFAULT 0.0000,
    current_rate DECIMAL(15,8) NOT NULL,
    average_rate DECIMAL(15,8),
    unrealized_gain_loss DECIMAL(20,4) DEFAULT 0.0000,
    hedge_percentage DECIMAL(5,2) DEFAULT 0.00,
    hedge_instrument VARCHAR(100),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    volatility_30d DECIMAL(8,4) DEFAULT 0.0000,
    volatility_90d DECIMAL(8,4) DEFAULT 0.0000,
    var_95_1d DECIMAL(20,4) DEFAULT 0.0000,
    exposure_date DATE NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Intercompany Funding
CREATE TABLE intercompany_funding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    funding_reference VARCHAR(100) NOT NULL UNIQUE,
    source_entity_id UUID NOT NULL REFERENCES entities(id),
    destination_entity_id UUID NOT NULL REFERENCES entities(id),
    funding_type VARCHAR(50) NOT NULL CHECK (funding_type IN ('loan', 'credit_line', 'guarantee', 'cash_pool', 'equity', 'other')),
    currency VARCHAR(3) NOT NULL,
    original_amount DECIMAL(20,4) NOT NULL,
    outstanding_amount DECIMAL(20,4) NOT NULL,
    interest_rate DECIMAL(8,4) DEFAULT 0.0000,
    maturity_date DATE,
    start_date DATE NOT NULL,
    end_date DATE,
    repayment_schedule JSONB DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'matured', 'cancelled', 'restructured', 'default')),
    collateral JSONB DEFAULT '{}',
    covenants JSONB DEFAULT '[]',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Debt and Credit Facilities
CREATE TABLE debt_credit_facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id),
    facility_type VARCHAR(50) NOT NULL CHECK (facility_type IN ('revolving_credit', 'term_loan', 'bridge_loan', 'syndicated_loan', 'bond', 'other')),
    facility_name VARCHAR(200) NOT NULL,
    lender VARCHAR(200),
    currency VARCHAR(3) NOT NULL,
    total_commitment DECIMAL(20,4) NOT NULL,
    amount_drawn DECIMAL(20,4) NOT NULL DEFAULT 0.0000,
    amount_available DECIMAL(20,4) NOT NULL,
    interest_rate DECIMAL(8,4) DEFAULT 0.0000,
    margin_over_libor DECIMAL(8,4) DEFAULT 0.0000,
    arrangement_fee DECIMAL(8,4) DEFAULT 0.0000,
    maturity_date DATE,
    start_date DATE NOT NULL,
    end_date DATE,
    renewal_date DATE,
    covenants JSONB DEFAULT '[]',
    collateral_requirements JSONB DEFAULT '{}',
    rating VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'matured', 'cancelled', 'restructured', 'default')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cash Pooling Arrangements
CREATE TABLE cash_pooling_arrangements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    pool_name VARCHAR(200) NOT NULL,
    pool_type VARCHAR(20) NOT NULL CHECK (pool_type IN ('physical', 'notional', 'hybrid')),
    currency VARCHAR(3) NOT NULL,
    participating_entities JSONB DEFAULT '[]',
    pooling_structure JSONB DEFAULT '{}',
    sweep_frequency VARCHAR(20) CHECK (sweep_frequency IN ('daily', 'weekly', 'monthly', 'on_demand')),
    interest_calculation_method VARCHAR(50),
    zero_balance_accounting BOOLEAN DEFAULT false,
    cross_currency_enabled BOOLEAN DEFAULT false,
    fx_hedge_mechanism VARCHAR(100),
    regulatory_constraints JSONB DEFAULT '{}',
    tax_implications JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'terminated')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Treasury Alerts and KPIs
CREATE TABLE treasury_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('liquidity_shortfall', 'fx_risk', 'concentration_risk', 'debt_maturity', 'credit_utilization', 'compliance', 'other')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    entity_id UUID REFERENCES entities(id),
    currency VARCHAR(3),
    threshold_value DECIMAL(20,4),
    current_value DECIMAL(20,4),
    variance_percentage DECIMAL(8,2),
    alert_data JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Treasury KPIs
CREATE TABLE treasury_kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    kpi_name VARCHAR(100) NOT NULL,
    kpi_category VARCHAR(50) NOT NULL CHECK (kpi_category IN ('liquidity', 'fx_risk', 'debt_management', 'cash_efficiency', 'profitability', 'other')),
    kpi_value DECIMAL(20,4) NOT NULL,
    kpi_unit VARCHAR(50),
    target_value DECIMAL(20,4),
    benchmark_value DECIMAL(20,4),
    variance_from_target DECIMAL(8,2),
    trend_direction VARCHAR(10) CHECK (trend_direction IN ('up', 'down', 'stable')),
    performance_rating VARCHAR(20) CHECK (performance_rating IN ('excellent', 'good', 'average', 'poor', 'critical')),
    measurement_date DATE NOT NULL,
    period_type VARCHAR(20) CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Treasury Snapshots
CREATE TABLE treasury_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    snapshot_name VARCHAR(200) NOT NULL,
    snapshot_description TEXT,
    snapshot_date DATE NOT NULL,
    snapshot_data JSONB NOT NULL DEFAULT '{}',
    includes_forecasts BOOLEAN DEFAULT false,
    includes_alerts BOOLEAN DEFAULT false,
    is_read_only BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Treasury Audit Logs
CREATE TABLE treasury_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    previous_values JSONB DEFAULT '{}',
    new_values JSONB DEFAULT '{}',
    reason TEXT,
    user_id UUID NOT NULL REFERENCES users(id),
    user_email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Materialized Views for Analytics
CREATE MATERIALIZED VIEW global_cash_summary AS
SELECT 
    ba.id as business_account_id,
    ba.name as business_name,
    COUNT(DISTINCT gcp.entity_id) as entities_count,
    COUNT(DISTINCT gcp.country_code) as countries_count,
    COUNT(DISTINCT gcp.currency) as currencies_count,
    SUM(gcp.cash_balance) as total_cash_balance,
    SUM(gcp.available_balance) as total_available_balance,
    SUM(gcp.restricted_balance) as total_restricted_balance,
    AVG(gcp.cash_balance) as avg_entity_balance,
    MAX(gcp.cash_balance) as max_entity_balance,
    MIN(gcp.cash_balance) as min_entity_balance,
    COUNT(DISTINCT gcp.bank_accounts_count) as total_bank_accounts,
    MAX(gcp.last_updated) as last_updated
FROM business_accounts ba
LEFT JOIN global_cash_positions gcp ON ba.id = gcp.business_account_id
GROUP BY ba.id, ba.name;

CREATE MATERIALIZED VIEW liquidity_forecast_summary AS
SELECT 
    lf.business_account_id,
    lf.forecast_type,
    lf.currency,
    COUNT(*) as forecast_count,
    SUM(lf.opening_balance) as total_opening_balance,
    SUM(lf.inflows) as total_inflows,
    SUM(lf.outflows) as total_outflows,
    SUM(lf.net_cash_flow) as total_net_flow,
    SUM(lf.closing_balance) as total_closing_balance,
    AVG(lf.confidence_level) as avg_confidence_level,
    MAX(lf.period_end) as latest_period_end
FROM liquidity_forecasts lf
GROUP BY lf.business_account_id, lf.forecast_type, lf.currency;

CREATE MATERIALIZED VIEW fx_risk_summary AS
SELECT 
    fx.business_account_id,
    fx.currency,
    fx.exposure_type,
    COUNT(*) as exposure_count,
    SUM(fx.exposure_amount) as total_exposure,
    SUM(fx.unrealized_gain_loss) as total_unrealized_gl,
    AVG(fx.volatility_30d) as avg_volatility_30d,
    AVG(fx.volatility_90d) as avg_volatility_90d,
    SUM(fx.var_95_1d) as total_var_95_1d,
    COUNT(CASE WHEN fx.risk_level = 'high' THEN 1 END) as high_risk_count,
    COUNT(CASE WHEN fx.risk_level = 'critical' THEN 1 END) as critical_risk_count
FROM fx_risk_exposure fx
GROUP BY fx.business_account_id, fx.currency, fx.exposure_type;

CREATE MATERIALIZED VIEW debt_facility_summary AS
SELECT 
    dcf.business_account_id,
    dcf.facility_type,
    dcf.currency,
    COUNT(*) as facility_count,
    SUM(dcf.total_commitment) as total_commitment,
    SUM(dcf.amount_drawn) as total_drawn,
    SUM(dcf.amount_available) as total_available,
    AVG(dcf.interest_rate) as avg_interest_rate,
    AVG(dcf.margin_over_libor) as avg_margin,
    SUM(CASE WHEN dcf.status = 'active' THEN dcf.amount_drawn ELSE 0 END) as active_drawn,
    COUNT(CASE WHEN dcf.maturity_date <= CURRENT_DATE + INTERVAL '90 days' THEN 1 END) as maturing_soon_count
FROM debt_credit_facilities dcf
GROUP BY dcf.business_account_id, dcf.facility_type, dcf.currency;

-- Database Functions
CREATE OR REPLACE FUNCTION update_global_cash_position(
    p_business_account_id UUID,
    p_entity_id UUID,
    p_country_code VARCHAR,
    p_currency VARCHAR,
    p_cash_balance DECIMAL,
    p_available_balance DECIMAL,
    p_restricted_balance DECIMAL,
    p_bank_accounts_count INTEGER,
    p_balance_date DATE,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_position_id UUID;
BEGIN
    INSERT INTO global_cash_positions (
        id,
        business_account_id,
        entity_id,
        country_code,
        currency,
        cash_balance,
        available_balance,
        restricted_balance,
        bank_accounts_count,
        balance_date,
        created_by
    ) VALUES (
        uuid_generate_v4()::uuid,
        p_business_account_id::uuid,
        p_entity_id::uuid,
        p_country_code::varchar,
        p_currency::varchar,
        p_cash_balance::decimal,
        p_available_balance::decimal,
        p_restricted_balance::decimal,
        p_bank_accounts_count::integer,
        p_balance_date::date,
        p_created_by::uuid
    ) RETURNING id INTO v_position_id;
    
    RETURN v_position_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_liquidity_forecast(
    p_business_account_id UUID,
    p_entity_id UUID DEFAULT NULL,
    p_currency VARCHAR,
    p_forecast_type VARCHAR,
    p_period_start DATE,
    p_period_end DATE,
    p_opening_balance DECIMAL,
    p_confidence_level INTEGER DEFAULT 3,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_forecast_id UUID;
    v_inflows DECIMAL := 0;
    v_outflows DECIMAL := 0;
BEGIN
    -- Calculate projected inflows and outflows based on historical patterns
    -- This would integrate with actual transaction data
    v_inflows := p_opening_balance * 0.1; -- Placeholder calculation
    v_outflows := p_opening_balance * 0.08; -- Placeholder calculation
    
    INSERT INTO liquidity_forecasts (
        id,
        business_account_id,
        entity_id,
        currency,
        forecast_type,
        forecast_date,
        period_start,
        period_end,
        opening_balance,
        inflows,
        outflows,
        net_cash_flow,
        closing_balance,
        confidence_level,
        created_by
    ) VALUES (
        uuid_generate_v4()::uuid,
        p_business_account_id::uuid,
        p_entity_id::uuid,
        p_currency::varchar,
        p_forecast_type::varchar,
        CURRENT_DATE::date,
        p_period_start::date,
        p_period_end::date,
        p_opening_balance::decimal,
        v_inflows::decimal,
        v_outflows::decimal,
        v_inflows - v_outflows::decimal,
        p_opening_balance + (v_inflows - v_outflows)::decimal,
        p_confidence_level::integer,
        p_created_by::uuid
    ) RETURNING id INTO v_forecast_id;
    
    RETURN v_forecast_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_treasury_alert(
    p_business_account_id UUID,
    p_alert_type VARCHAR,
    p_severity VARCHAR,
    p_title VARCHAR,
    p_description TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_currency VARCHAR DEFAULT NULL,
    p_threshold_value DECIMAL DEFAULT NULL,
    p_current_value DECIMAL DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_alert_id UUID;
    v_variance_percentage DECIMAL := 0;
BEGIN
    IF p_threshold_value IS NOT NULL AND p_current_value IS NOT NULL AND p_threshold_value != 0 THEN
        v_variance_percentage := ((p_current_value - p_threshold_value) / p_threshold_value) * 100;
    END IF;
    
    INSERT INTO treasury_alerts (
        id,
        business_account_id,
        alert_type,
        severity,
        title,
        description,
        entity_id,
        currency,
        threshold_value,
        current_value,
        variance_percentage
    ) VALUES (
        uuid_generate_v4()::uuid,
        p_business_account_id::uuid,
        p_alert_type::varchar,
        p_severity::varchar,
        p_title::varchar,
        p_description::text,
        p_entity_id::uuid,
        p_currency::varchar,
        p_threshold_value::decimal,
        p_current_value::decimal,
        v_variance_percentage::decimal
    ) RETURNING id INTO v_alert_id;
    
    RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_treasury_materialized_views() RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY global_cash_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY liquidity_forecast_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY fx_risk_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY debt_facility_summary;
END;
$$ LANGUAGE plpgsql;

-- Indexes for Performance
CREATE INDEX idx_global_cash_positions_business_account ON global_cash_positions(business_account_id);
CREATE INDEX idx_global_cash_positions_entity ON global_cash_positions(entity_id);
CREATE INDEX idx_global_cash_positions_country ON global_cash_positions(country_code);
CREATE INDEX idx_global_cash_positions_currency ON global_cash_positions(currency);
CREATE INDEX idx_global_cash_positions_date ON global_cash_positions(balance_date);
CREATE INDEX idx_multi_currency_positions_business_account ON multi_currency_positions(business_account_id);
CREATE INDEX idx_multi_currency_positions_currency ON multi_currency_positions(currency);
CREATE INDEX idx_multi_currency_positions_date ON multi_currency_positions(position_date);
CREATE INDEX idx_liquidity_forecasts_business_account ON liquidity_forecasts(business_account_id);
CREATE INDEX idx_liquidity_forecasts_entity ON liquidity_forecasts(entity_id);
CREATE INDEX idx_liquidity_forecasts_type ON liquidity_forecasts(forecast_type);
CREATE INDEX idx_liquidity_forecasts_currency ON liquidity_forecasts(currency);
CREATE INDEX idx_liquidity_forecasts_date ON liquidity_forecasts(forecast_date);
CREATE INDEX idx_fx_risk_exposure_business_account ON fx_risk_exposure(business_account_id);
CREATE INDEX idx_fx_risk_exposure_currency ON fx_risk_exposure(currency);
CREATE INDEX idx_fx_risk_exposure_type ON fx_risk_exposure(exposure_type);
CREATE INDEX idx_fx_risk_exposure_risk_level ON fx_risk_exposure(risk_level);
CREATE INDEX idx_intercompany_funding_business_account ON intercompany_funding(business_account_id);
CREATE INDEX idx_intercompany_funding_entities ON intercompany_funding(source_entity_id, destination_entity_id);
CREATE INDEX idx_intercompany_funding_type ON intercompany_funding(funding_type);
CREATE INDEX idx_intercompany_funding_status ON intercompany_funding(status);
CREATE INDEX idx_debt_credit_facilities_business_account ON debt_credit_facilities(business_account_id);
CREATE INDEX idx_debt_credit_facilities_entity ON debt_credit_facilities(entity_id);
CREATE INDEX idx_debt_credit_facilities_type ON debt_credit_facilities(facility_type);
CREATE INDEX idx_debt_credit_facilities_status ON debt_credit_facilities(status);
CREATE INDEX idx_cash_pooling_arrangements_business_account ON cash_pooling_arrangements(business_account_id);
CREATE INDEX idx_cash_pooling_arrangements_type ON cash_pooling_arrangements(pool_type);
CREATE INDEX idx_cash_pooling_arrangements_status ON cash_pooling_arrangements(status);
CREATE INDEX idx_treasury_alerts_business_account ON treasury_alerts(business_account_id);
CREATE INDEX idx_treasury_alerts_type ON treasury_alerts(alert_type);
CREATE INDEX idx_treasury_alerts_severity ON treasury_alerts(severity);
CREATE INDEX idx_treasury_alerts_status ON treasury_alerts(status);
CREATE INDEX idx_treasury_kpis_business_account ON treasury_kpis(business_account_id);
CREATE INDEX idx_treasury_kpis_category ON treasury_kpis(kpi_category);
CREATE INDEX idx_treasury_kpis_date ON treasury_kpis(measurement_date);
CREATE INDEX idx_treasury_snapshots_business_account ON treasury_snapshots(business_account_id);
CREATE INDEX idx_treasury_snapshots_date ON treasury_snapshots(snapshot_date);
CREATE INDEX idx_treasury_audit_logs_business_account ON treasury_audit_logs(business_account_id);
CREATE INDEX idx_treasury_audit_logs_entity ON treasury_audit_logs(entity_type, entity_id);
CREATE INDEX idx_treasury_audit_logs_timestamp ON treasury_audit_logs(timestamp);

-- Row Level Security (RLS) Policies
ALTER TABLE global_cash_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_currency_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidity_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fx_risk_exposure ENABLE ROW LEVEL SECURITY;
ALTER TABLE intercompany_funding ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_credit_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_pooling_arrangements ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Global Treasury Mode
CREATE POLICY global_cash_positions_policy ON global_cash_positions
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY multi_currency_positions_policy ON multi_currency_positions
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY liquidity_forecasts_policy ON liquidity_forecasts
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY fx_risk_exposure_policy ON fx_risk_exposure
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY intercompany_funding_policy ON intercompany_funding
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY debt_credit_facilities_policy ON debt_credit_facilities
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY cash_pooling_arrangements_policy ON cash_pooling_arrangements
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY treasury_alerts_policy ON treasury_alerts
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY treasury_kpis_policy ON treasury_kpis
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY treasury_snapshots_policy ON treasury_snapshots
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY treasury_audit_logs_policy ON treasury_audit_logs
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

-- Triggers for Updated At
CREATE TRIGGER update_global_cash_positions_updated_at
    BEFORE UPDATE ON global_cash_positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_multi_currency_positions_updated_at
    BEFORE UPDATE ON multi_currency_positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_liquidity_forecasts_updated_at
    BEFORE UPDATE ON liquidity_forecasts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fx_risk_exposure_updated_at
    BEFORE UPDATE ON fx_risk_exposure
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intercompany_funding_updated_at
    BEFORE UPDATE ON intercompany_funding
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debt_credit_facilities_updated_at
    BEFORE UPDATE ON debt_credit_facilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_pooling_arrangements_updated_at
    BEFORE UPDATE ON cash_pooling_arrangements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
