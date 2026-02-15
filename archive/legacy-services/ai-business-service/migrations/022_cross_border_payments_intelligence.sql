-- Sprint 23: Cross-Border Payments Intelligence Migration
-- Creates comprehensive cross-border payment tracking and intelligence infrastructure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cross-Border Payments
CREATE TABLE cross_border_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    payment_reference VARCHAR(100) NOT NULL UNIQUE,
    payment_direction VARCHAR(20) NOT NULL CHECK (payment_direction IN ('inbound', 'outbound')),
    source_entity_id UUID REFERENCES entities(id),
    destination_entity_id UUID REFERENCES entities(id),
    source_country_code VARCHAR(2) NOT NULL,
    destination_country_code VARCHAR(2) NOT NULL,
    source_currency VARCHAR(3) NOT NULL,
    destination_currency VARCHAR(3) NOT NULL,
    original_amount DECIMAL(20,4) NOT NULL,
    converted_amount DECIMAL(20,4) NOT NULL,
    fx_rate_applied DECIMAL(15,8) NOT NULL,
    fx_rate_at_time DECIMAL(15,8),
    fx_spread DECIMAL(10,8) NOT NULL DEFAULT 0.00000000,
    total_fees DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    fee_breakdown JSONB DEFAULT '{}',
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('swift', 'sepa', 'ach', 'wire', 'crypto', 'digital_wallet', 'card', 'other')),
    payment_rail VARCHAR(100),
    correspondent_bank VARCHAR(200),
    intermediary_banks JSONB DEFAULT '[]',
    initiated_date TIMESTAMP WITH TIME ZONE NOT NULL,
    processed_date TIMESTAMP WITH TIME ZONE,
    settled_date TIMESTAMP WITH TIME ZONE,
    expected_settlement_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed', 'under_review')),
    failure_reason TEXT,
    payment_purpose VARCHAR(100),
    compliance_screening_result JSONB DEFAULT '{}',
    risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- FX Rate Intelligence
CREATE TABLE fx_rate_intelligence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    currency_pair VARCHAR(6) NOT NULL,
    base_currency VARCHAR(3) NOT NULL,
    quote_currency VARCHAR(3) NOT NULL,
    market_rate DECIMAL(15,8) NOT NULL,
    bank_rate DECIMAL(15,8) NOT NULL,
    spread DECIMAL(10,8) NOT NULL,
    spread_percentage DECIMAL(8,4) NOT NULL,
    rate_source VARCHAR(100),
    rate_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    is_weekend BOOLEAN DEFAULT false,
    is_holiday BOOLEAN DEFAULT false,
    market_volatility DECIMAL(8,4) DEFAULT 0.0000,
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment Route Analysis
CREATE TABLE payment_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    route_name VARCHAR(200) NOT NULL,
    source_country VARCHAR(2) NOT NULL,
    destination_country VARCHAR(2) NOT NULL,
    currency_pair VARCHAR(6) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    typical_correspondent_banks JSONB DEFAULT '[]',
    average_processing_hours DECIMAL(8,2),
    success_rate DECIMAL(5,2) DEFAULT 100.00,
    average_total_cost DECIMAL(15,4),
    cost_percentage DECIMAL(8,4),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    compliance_flags JSONB DEFAULT '[]',
    last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment Efficiency Metrics
CREATE TABLE payment_efficiency_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    metric_period_start DATE NOT NULL,
    metric_period_end DATE NOT NULL,
    total_payments INTEGER NOT NULL DEFAULT 0,
    successful_payments INTEGER NOT NULL DEFAULT 0,
    failed_payments INTEGER NOT NULL DEFAULT 0,
    average_processing_time_hours DECIMAL(8,2) DEFAULT 0.00,
    average_settlement_time_hours DECIMAL(8,2) DEFAULT 0.00,
    total_volume DECIMAL(20,4) DEFAULT 0.0000,
    total_fees DECIMAL(15,4) DEFAULT 0.0000,
    average_fee_percentage DECIMAL(8,4) DEFAULT 0.0000,
    fx_savings_opportunities DECIMAL(15,4) DEFAULT 0.0000,
    compliance_flags_count INTEGER DEFAULT 0,
    risk_score_average DECIMAL(5,2) DEFAULT 0.00,
    currency VARCHAR(3),
    payment_method VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Compliance Screening Results
CREATE TABLE compliance_screening_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES cross_border_payments(id) ON DELETE CASCADE,
    screening_type VARCHAR(50) NOT NULL CHECK (screening_type IN ('sanctions', 'aml', 'kyc', 'pep', 'adverse_media', 'risk_corridor', 'high_risk_country')),
    screening_result VARCHAR(20) NOT NULL CHECK (screening_result IN ('clear', 'flagged', 'blocked', 'requires_review')),
    confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
    risk_factors JSONB DEFAULT '[]',
    matched_entities JSONB DEFAULT '[]',
    screening_rules_applied JSONB DEFAULT '[]',
    reviewer_id UUID REFERENCES users(id),
    review_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- FX Exposure Analysis
CREATE TABLE fx_exposure_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    currency VARCHAR(3) NOT NULL,
    exposure_type VARCHAR(20) NOT NULL CHECK (exposure_type IN ('transactional', 'translation', 'economic')),
    exposure_amount DECIMAL(20,4) NOT NULL,
    base_currency VARCHAR(3) NOT NULL,
    current_rate DECIMAL(15,8) NOT NULL,
    average_rate DECIMAL(15,8),
    unrealized_gain_loss DECIMAL(20,4) DEFAULT 0.0000,
    hedge_percentage DECIMAL(5,2) DEFAULT 0.00,
    hedge_instrument VARCHAR(100),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    volatility_30d DECIMAL(8,4) DEFAULT 0.0000,
    volatility_90d DECIMAL(8,4) DEFAULT 0.0000,
    correlation_risk DECIMAL(8,4) DEFAULT 0.0000,
    analysis_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment Anomalies
CREATE TABLE payment_anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES cross_border_payments(id) ON DELETE CASCADE,
    anomaly_type VARCHAR(50) NOT NULL CHECK (anomaly_type IN ('unusual_amount', 'delayed_processing', 'high_fees', 'suspicious_route', 'fx_anomaly', 'timing_anomaly', 'compliance_risk', 'other')),
    anomaly_severity VARCHAR(20) NOT NULL CHECK (anomaly_severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    detected_value DECIMAL(20,4),
    expected_value DECIMAL(20,4),
    variance_percentage DECIMAL(8,2),
    detection_rules JSONB DEFAULT '[]',
    auto_resolved BOOLEAN DEFAULT false,
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Executive Dashboards
CREATE TABLE cross_border_executive_dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    dashboard_name VARCHAR(200) NOT NULL,
    dashboard_config JSONB NOT NULL DEFAULT '{}',
    dashboard_data JSONB NOT NULL DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_read_only BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Materialized Views for Analytics
CREATE MATERIALIZED VIEW cross_border_payment_summary AS
SELECT 
    ba.id as business_account_id,
    ba.name as business_name,
    COUNT(cb.id) as total_payments,
    COUNT(CASE WHEN cb.payment_direction = 'inbound' THEN 1 END) as inbound_payments,
    COUNT(CASE WHEN cb.payment_direction = 'outbound' THEN 1 END) as outbound_payments,
    COUNT(CASE WHEN cb.status = 'completed' THEN 1 END) as successful_payments,
    COUNT(CASE WHEN cb.status = 'failed' THEN 1 END) as failed_payments,
    ROUND(AVG(EXTRACT(EPOCH FROM (cb.processed_date - cb.initiated_date))/3600), 2) as avg_processing_hours,
    ROUND(AVG(EXTRACT(EPOCH FROM (cb.settled_date - cb.initiated_date))/3600), 2) as avg_settlement_hours,
    SUM(cb.original_amount) as total_volume,
    SUM(cb.total_fees) as total_fees,
    ROUND(AVG(cb.fx_spread), 8) as avg_fx_spread,
    ROUND(AVG(cb.risk_score), 2) as avg_risk_score,
    COUNT(DISTINCT cb.source_country_code) as source_countries,
    COUNT(DISTINCT cb.destination_country_code) as destination_countries,
    COUNT(DISTINCT cb.currency_pair) as currency_pairs,
    MAX(cb.created_at) as last_payment_date
FROM business_accounts ba
LEFT JOIN cross_border_payments cb ON ba.id = cb.business_account_id
GROUP BY ba.id, ba.name;

CREATE MATERIALIZED VIEW fx_efficiency_analysis AS
SELECT 
    cb.business_account_id,
    cb.currency_pair,
    cb.payment_method,
    COUNT(cb.id) as payment_count,
    AVG(cb.fx_spread) as avg_spread,
    AVG(cb.total_fees / cb.original_amount * 100) as avg_fee_percentage,
    SUM(cb.total_fees) as total_fees,
    SUM(cb.original_amount) as total_volume,
    ROUND(AVG(EXTRACT(EPOCH FROM (cb.settled_date - cb.initiated_date))/3600), 2) as avg_settlement_hours,
    COUNT(CASE WHEN cb.status = 'failed' THEN 1 END) as failed_count,
    ROUND(COUNT(CASE WHEN cb.status = 'failed' THEN 1 END) * 100.0 / COUNT(cb.id), 2) as failure_rate,
    MAX(cb.created_at) as last_payment_date
FROM cross_border_payments cb
WHERE cb.status IN ('completed', 'failed')
GROUP BY cb.business_account_id, cb.currency_pair, cb.payment_method;

CREATE MATERIALIZED VIEW payment_route_performance AS
SELECT 
    pr.business_account_id,
    pr.route_name,
    pr.source_country,
    pr.destination_country,
    pr.currency_pair,
    pr.payment_method,
    pr.average_processing_hours,
    pr.success_rate,
    pr.average_total_cost,
    pr.cost_percentage,
    pr.risk_level,
    COUNT(cb.id) as actual_payments,
    SUM(cb.total_fees) as actual_fees,
    AVG(cb.fx_spread) as actual_fx_spread,
    ROUND(AVG(EXTRACT(EPOCH FROM (cb.settled_date - cb.initiated_date))/3600), 2) as actual_processing_hours
FROM payment_routes pr
LEFT JOIN cross_border_payments cb ON pr.business_account_id = cb.business_account_id 
    AND pr.source_country = cb.source_country_code 
    AND pr.destination_country = cb.destination_country_code 
    AND pr.currency_pair = cb.currency_pair
    AND pr.payment_method = cb.payment_method
GROUP BY pr.id, pr.business_account_id, pr.route_name, pr.source_country, pr.destination_country, pr.currency_pair, pr.payment_method, pr.average_processing_hours, pr.success_rate, pr.average_total_cost, pr.cost_percentage, pr.risk_level;

-- Database Functions
CREATE OR REPLACE FUNCTION create_cross_border_payment(
    p_business_account_id UUID,
    p_payment_reference VARCHAR,
    p_payment_direction VARCHAR,
    p_source_entity_id UUID DEFAULT NULL,
    p_destination_entity_id UUID DEFAULT NULL,
    p_source_country_code VARCHAR,
    p_destination_country_code VARCHAR,
    p_source_currency VARCHAR,
    p_destination_currency VARCHAR,
    p_original_amount DECIMAL,
    p_converted_amount DECIMAL,
    p_fx_rate_applied DECIMAL,
    p_fx_rate_at_time DECIMAL DEFAULT NULL,
    p_fx_spread DECIMAL DEFAULT 0.00000000,
    p_total_fees DECIMAL DEFAULT 0.0000,
    p_fee_breakdown JSONB DEFAULT '{}',
    p_payment_method VARCHAR,
    p_payment_rail VARCHAR DEFAULT NULL,
    p_correspondent_bank VARCHAR DEFAULT NULL,
    p_intermediary_banks JSONB DEFAULT '[]',
    p_initiated_date TIMESTAMP WITH TIME ZONE,
    p_processed_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_settled_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_expected_settlement_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_status VARCHAR DEFAULT 'pending',
    p_failure_reason TEXT DEFAULT NULL,
    p_payment_purpose VARCHAR DEFAULT NULL,
    p_compliance_screening_result JSONB DEFAULT '{}',
    p_risk_score INTEGER DEFAULT 0,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_payment_id UUID;
    v_currency_pair VARCHAR;
BEGIN
    v_currency_pair := p_source_currency || p_destination_currency;
    
    INSERT INTO cross_border_payments (
        id,
        business_account_id,
        payment_reference,
        payment_direction,
        source_entity_id,
        destination_entity_id,
        source_country_code,
        destination_country_code,
        source_currency,
        destination_currency,
        original_amount,
        converted_amount,
        fx_rate_applied,
        fx_rate_at_time,
        fx_spread,
        total_fees,
        fee_breakdown,
        payment_method,
        payment_rail,
        correspondent_bank,
        intermediary_banks,
        initiated_date,
        processed_date,
        settled_date,
        expected_settlement_date,
        status,
        failure_reason,
        payment_purpose,
        compliance_screening_result,
        risk_score,
        created_by
    ) VALUES (
        uuid_generate_v4()::uuid,
        p_business_account_id::uuid,
        p_payment_reference::varchar,
        p_payment_direction::varchar,
        p_source_entity_id::uuid,
        p_destination_entity_id::uuid,
        p_source_country_code::varchar,
        p_destination_country_code::varchar,
        p_source_currency::varchar,
        p_destination_currency::varchar,
        p_original_amount::decimal,
        p_converted_amount::decimal,
        p_fx_rate_applied::decimal,
        p_fx_rate_at_time::decimal,
        p_fx_spread::decimal,
        p_total_fees::decimal,
        p_fee_breakdown::jsonb,
        p_payment_method::varchar,
        p_payment_rail::varchar,
        p_correspondent_bank::varchar,
        p_intermediary_banks::jsonb,
        p_initiated_date::timestamptz,
        p_processed_date::timestamptz,
        p_settled_date::timestamptz,
        p_expected_settlement_date::timestamptz,
        p_status::varchar,
        p_failure_reason::text,
        p_payment_purpose::varchar,
        p_compliance_screening_result::jsonb,
        p_risk_score::integer,
        p_created_by::uuid
    ) RETURNING id INTO v_payment_id;
    
    RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION analyze_fx_rate(
    p_business_account_id UUID,
    p_currency_pair VARCHAR,
    p_base_currency VARCHAR,
    p_quote_currency VARCHAR,
    p_market_rate DECIMAL,
    p_bank_rate DECIMAL,
    p_rate_source VARCHAR,
    p_rate_timestamp TIMESTAMP WITH TIME ZONE,
    p_is_weekend BOOLEAN DEFAULT false,
    p_is_holiday BOOLEAN DEFAULT false,
    p_market_volatility DECIMAL DEFAULT 0.0000,
    p_confidence_level INTEGER DEFAULT 3
) RETURNS UUID AS $$
DECLARE
    v_fx_id UUID;
    v_spread DECIMAL;
    v_spread_percentage DECIMAL;
BEGIN
    v_spread := p_bank_rate - p_market_rate;
    v_spread_percentage := (v_spread / p_market_rate) * 100;
    
    INSERT INTO fx_rate_intelligence (
        id,
        business_account_id,
        currency_pair,
        base_currency,
        quote_currency,
        market_rate,
        bank_rate,
        spread,
        spread_percentage,
        rate_source,
        rate_timestamp,
        is_weekend,
        is_holiday,
        market_volatility,
        confidence_level
    ) VALUES (
        uuid_generate_v4()::uuid,
        p_business_account_id::uuid,
        p_currency_pair::varchar,
        p_base_currency::varchar,
        p_quote_currency::varchar,
        p_market_rate::decimal,
        p_bank_rate::decimal,
        v_spread::decimal,
        v_spread_percentage::decimal,
        p_rate_source::varchar,
        p_rate_timestamp::timestamptz,
        p_is_weekend::boolean,
        p_is_holiday::boolean,
        p_market_volatility::decimal,
        p_confidence_level::integer
    ) RETURNING id INTO v_fx_id;
    
    RETURN v_fx_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION detect_payment_anomaly(
    p_business_account_id UUID,
    p_payment_id UUID DEFAULT NULL,
    p_anomaly_type VARCHAR,
    p_anomaly_severity VARCHAR,
    p_description TEXT,
    p_detected_value DECIMAL DEFAULT NULL,
    p_expected_value DECIMAL DEFAULT NULL,
    p_variance_percentage DECIMAL DEFAULT NULL,
    p_detection_rules JSONB DEFAULT '[]'
) RETURNS UUID AS $$
DECLARE
    v_anomaly_id UUID;
BEGIN
    INSERT INTO payment_anomalies (
        id,
        business_account_id,
        payment_id,
        anomaly_type,
        anomaly_severity,
        description,
        detected_value,
        expected_value,
        variance_percentage,
        detection_rules,
        auto_resolved
    ) VALUES (
        uuid_generate_v4()::uuid,
        p_business_account_id::uuid,
        p_payment_id::uuid,
        p_anomaly_type::varchar,
        p_anomaly_severity::varchar,
        p_description::text,
        p_detected_value::decimal,
        p_expected_value::decimal,
        p_variance_percentage::decimal,
        p_detection_rules::jsonb,
        false::boolean
    ) RETURNING id INTO v_anomaly_id;
    
    RETURN v_anomaly_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_cross_border_materialized_views() RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY cross_border_payment_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY fx_efficiency_analysis;
    REFRESH MATERIALIZED VIEW CONCURRENTLY payment_route_performance;
END;
$$ LANGUAGE plpgsql;

-- Indexes for Performance
CREATE INDEX idx_cross_border_payments_business_account ON cross_border_payments(business_account_id);
CREATE INDEX idx_cross_border_payments_direction ON cross_border_payments(payment_direction);
CREATE INDEX idx_cross_border_payments_countries ON cross_border_payments(source_country_code, destination_country_code);
CREATE INDEX idx_cross_border_payments_currencies ON cross_border_payments(source_currency, destination_currency);
CREATE INDEX idx_cross_border_payments_status ON cross_border_payments(status);
CREATE INDEX idx_cross_border_payments_dates ON cross_border_payments(initiated_date, processed_date, settled_date);
CREATE INDEX idx_cross_border_payments_risk_score ON cross_border_payments(risk_score);
CREATE INDEX idx_fx_rate_intelligence_business_account ON fx_rate_intelligence(business_account_id);
CREATE INDEX idx_fx_rate_intelligence_currency_pair ON fx_rate_intelligence(currency_pair);
CREATE INDEX idx_fx_rate_intelligence_timestamp ON fx_rate_intelligence(rate_timestamp);
CREATE INDEX idx_payment_routes_business_account ON payment_routes(business_account_id);
CREATE INDEX idx_payment_routes_countries ON payment_routes(source_country, destination_country);
CREATE INDEX idx_payment_routes_currency_pair ON payment_routes(currency_pair);
CREATE INDEX idx_payment_efficiency_metrics_business_account ON payment_efficiency_metrics(business_account_id);
CREATE INDEX idx_payment_efficiency_metrics_period ON payment_efficiency_metrics(metric_period_start, metric_period_end);
CREATE INDEX idx_compliance_screening_results_payment ON compliance_screening_results(payment_id);
CREATE INDEX idx_compliance_screening_results_result ON compliance_screening_results(screening_result);
CREATE INDEX idx_fx_exposure_analysis_business_account ON fx_exposure_analysis(business_account_id);
CREATE INDEX idx_fx_exposure_analysis_currency ON fx_exposure_analysis(currency);
CREATE INDEX idx_payment_anomalies_business_account ON payment_anomalies(business_account_id);
CREATE INDEX idx_payment_anomalies_payment ON payment_anomalies(payment_id);
CREATE INDEX idx_payment_anomalies_severity ON payment_anomalies(anomaly_severity);
CREATE INDEX idx_cross_border_executive_dashboards_business_account ON cross_border_executive_dashboards(business_account_id);

-- Row Level Security (RLS) Policies
ALTER TABLE cross_border_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fx_rate_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_efficiency_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_screening_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE fx_exposure_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_border_executive_dashboards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Cross-Border Payments Intelligence
CREATE POLICY cross_border_payments_policy ON cross_border_payments
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY fx_rate_intelligence_policy ON fx_rate_intelligence
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY payment_routes_policy ON payment_routes
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY payment_efficiency_metrics_policy ON payment_efficiency_metrics
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY compliance_screening_results_policy ON compliance_screening_results
    FOR ALL TO authenticated_users
    USING (payment_id IN (
        SELECT id FROM cross_border_payments cb
        WHERE cb.business_account_id IN (
            SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
        )
    ));

CREATE POLICY fx_exposure_analysis_policy ON fx_exposure_analysis
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY payment_anomalies_policy ON payment_anomalies
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY cross_border_executive_dashboards_policy ON cross_border_executive_dashboards
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

-- Triggers for Updated At
CREATE TRIGGER update_cross_border_payments_updated_at
    BEFORE UPDATE ON cross_border_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_routes_updated_at
    BEFORE UPDATE ON payment_routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cross_border_executive_dashboards_updated_at
    BEFORE UPDATE ON cross_border_executive_dashboards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
