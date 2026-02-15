-- Sprint 28: Autonomous CFO Mode Migration
-- Provides a virtual CFO that monitors, analyzes, advises, and forecasts with minimal human intervention

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CFO Dashboard Configuration Table
CREATE TABLE IF NOT EXISTS cfo_dashboard_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    dashboard_name VARCHAR(100) NOT NULL,
    dashboard_type VARCHAR(50) NOT NULL, -- 'executive', 'operational', 'strategic', 'risk'
    layout_config JSONB NOT NULL DEFAULT '{}',
    widget_config JSONB NOT NULL DEFAULT '{}',
    kpi_config JSONB NOT NULL DEFAULT '{}',
    alert_config JSONB NOT NULL DEFAULT '{}',
    refresh_interval INTEGER NOT NULL DEFAULT 300, -- seconds
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Financial Data Aggregation Table
CREATE TABLE IF NOT EXISTS cfo_financial_aggregations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    aggregation_date DATE NOT NULL,
    aggregation_period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
    data_source VARCHAR(50) NOT NULL, -- 'financial_statements', 'fpna', 'treasury', 'ai_insights', 'dual_reporting'
    total_revenue DECIMAL(20,8) DEFAULT 0,
    total_expenses DECIMAL(20,8) DEFAULT 0,
    gross_profit DECIMAL(20,8) DEFAULT 0,
    operating_income DECIMAL(20,8) DEFAULT 0,
    net_income DECIMAL(20,8) DEFAULT 0,
    total_assets DECIMAL(20,8) DEFAULT 0,
    total_liabilities DECIMAL(20,8) DEFAULT 0,
    equity DECIMAL(20,8) DEFAULT 0,
    cash_flow DECIMAL(20,8) DEFAULT 0,
    working_capital DECIMAL(20,8) DEFAULT 0,
    ebitda DECIMAL(20,8) DEFAULT 0,
    revenue_growth_rate DECIMAL(10,4) DEFAULT 0,
    expense_growth_rate DECIMAL(10,4) DEFAULT 0,
    profit_margin DECIMAL(10,4) DEFAULT 0,
    roa DECIMAL(10,4) DEFAULT 0, -- Return on Assets
    roe DECIMAL(10,4) DEFAULT 0, -- Return on Equity
    current_ratio DECIMAL(10,4) DEFAULT 0,
    quick_ratio DECIMAL(10,4) DEFAULT 0,
    debt_to_equity DECIMAL(10,4) DEFAULT 0,
    inventory_turnover DECIMAL(10,4) DEFAULT 0,
    days_sales_outstanding DECIMAL(10,4) DEFAULT 0,
    raw_data JSONB NOT NULL DEFAULT '{}',
    calculation_methodology JSONB NOT NULL DEFAULT '{}',
    data_quality_score DECIMAL(3,2) DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_account_id, aggregation_date, aggregation_period, data_source)
);

-- KPI Analysis Table
CREATE TABLE IF NOT EXISTS cfo_kpi_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    analysis_date DATE NOT NULL,
    kpi_category VARCHAR(50) NOT NULL, -- 'profitability', 'liquidity', 'efficiency', 'solvency', 'growth', 'market'
    kpi_name VARCHAR(100) NOT NULL,
    kpi_value DECIMAL(20,8) NOT NULL,
    kpi_unit VARCHAR(20), -- 'percentage', 'ratio', 'currency', 'days', 'times'
    benchmark_value DECIMAL(20,8),
    benchmark_source VARCHAR(100),
    variance_from_benchmark DECIMAL(20,8) DEFAULT 0,
    variance_percentage DECIMAL(10,4) DEFAULT 0,
    trend_direction VARCHAR(20), -- 'improving', 'declining', 'stable', 'volatile'
    trend_strength DECIMAL(3,2), -- 0-1 scale
    historical_comparison JSONB NOT NULL DEFAULT '{}',
    industry_comparison JSONB NOT NULL DEFAULT '{}',
    risk_level VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    confidence_score DECIMAL(3,2) DEFAULT 1.00,
    analysis_details JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Insights Table
CREATE TABLE IF NOT EXISTS cfo_ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    insight_date DATE NOT NULL,
    insight_type VARCHAR(50) NOT NULL, -- 'opportunity', 'risk', 'efficiency', 'strategic', 'operational'
    insight_category VARCHAR(50) NOT NULL, -- 'cost_optimization', 'revenue_growth', 'cash_management', 'investment', 'risk_mitigation'
    insight_title VARCHAR(200) NOT NULL,
    insight_description TEXT NOT NULL,
    impact_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    urgency_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'urgent'
    confidence_score DECIMAL(3,2) DEFAULT 1.00,
    financial_impact DECIMAL(20,8), -- estimated financial impact
    time_horizon VARCHAR(50), -- 'short_term', 'medium_term', 'long_term'
    recommended_actions JSONB NOT NULL DEFAULT '[]',
    supporting_data JSONB NOT NULL DEFAULT '{}',
    related_kpis JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'new', -- 'new', 'reviewed', 'accepted', 'rejected', 'implemented'
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    implemented_by UUID REFERENCES users(id),
    implemented_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scenario Forecasting Table
CREATE TABLE IF NOT EXISTS cfo_scenario_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    scenario_name VARCHAR(100) NOT NULL,
    scenario_type VARCHAR(50) NOT NULL, -- 'baseline', 'optimistic', 'pessimistic', 'custom'
    forecast_period_start DATE NOT NULL,
    forecast_period_end DATE NOT NULL,
    time_horizon VARCHAR(50) NOT NULL, -- '3_months', '6_months', '1_year', '3_years', '5_years'
    currency VARCHAR(3) NOT NULL,
    assumptions JSONB NOT NULL DEFAULT '{}',
    key_drivers JSONB NOT NULL DEFAULT '{}',
    revenue_forecast JSONB NOT NULL DEFAULT '{}',
    expense_forecast JSONB NOT NULL DEFAULT '{}',
    cash_flow_forecast JSONB NOT NULL DEFAULT '{}',
    balance_sheet_forecast JSONB NOT NULL DEFAULT '{}',
    kpi_forecast JSONB NOT NULL DEFAULT '{}',
    risk_factors JSONB NOT NULL DEFAULT '{}',
    sensitivity_analysis JSONB NOT NULL DEFAULT '{}',
    probability_score DECIMAL(3,2) DEFAULT 0.50,
    confidence_interval JSONB NOT NULL DEFAULT '{}',
    model_version VARCHAR(20),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Executive Recommendations Table
CREATE TABLE IF NOT EXISTS cfo_executive_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    recommendation_date DATE NOT NULL,
    recommendation_type VARCHAR(50) NOT NULL, -- 'cost_optimization', 'pricing_strategy', 'investment', 'financing', 'risk_management'
    priority_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    recommendation_title VARCHAR(200) NOT NULL,
    recommendation_description TEXT NOT NULL,
    business_case TEXT NOT NULL,
    expected_outcome TEXT NOT NULL,
    financial_impact DECIMAL(20,8),
    roi_estimate DECIMAL(10,4),
    payback_period INTEGER, -- months
    implementation_timeline VARCHAR(100),
    resource_requirements JSONB NOT NULL DEFAULT '{}',
    risk_assessment JSONB NOT NULL DEFAULT '{}',
    success_metrics JSONB NOT NULL DEFAULT '[]',
    supporting_analysis JSONB NOT NULL DEFAULT '{}',
    alternatives JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'under_review', 'approved', 'rejected', 'implemented'
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    implemented_by UUID REFERENCES users(id),
    implemented_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CFO Alerts Table
CREATE TABLE IF NOT EXISTS cfo_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    alert_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    alert_type VARCHAR(50) NOT NULL, -- 'kpi_breach', 'risk_threshold', 'opportunity', 'anomaly', 'forecast_deviation'
    alert_category VARCHAR(50) NOT NULL, -- 'financial', 'operational', 'strategic', 'compliance', 'market'
    severity_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    alert_title VARCHAR(200) NOT NULL,
    alert_description TEXT NOT NULL,
    current_value DECIMAL(20,8),
    threshold_value DECIMAL(20,8),
    variance_percentage DECIMAL(10,4),
    trigger_conditions JSONB NOT NULL DEFAULT '{}',
    affected_entities JSONB NOT NULL DEFAULT '[]',
    recommended_actions JSONB NOT NULL DEFAULT '[]',
    auto_resolved BOOLEAN NOT NULL DEFAULT false,
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Narrative Reports Table
CREATE TABLE IF NOT EXISTS cfo_narrative_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    report_type VARCHAR(50) NOT NULL, -- 'daily_summary', 'weekly_insights', 'monthly_analysis', 'quarterly_review', 'annual_report'
    report_title VARCHAR(200) NOT NULL,
    executive_summary TEXT NOT NULL,
    financial_performance TEXT NOT NULL,
    operational_insights TEXT NOT NULL,
    strategic_recommendations TEXT NOT NULL,
    risk_assessment TEXT NOT NULL,
    outlook TEXT NOT NULL,
    key_highlights JSONB NOT NULL DEFAULT '[]',
    key_concerns JSONB NOT NULL DEFAULT '[]',
    action_items JSONB NOT NULL DEFAULT '[]',
    supporting_data JSONB NOT NULL DEFAULT '{}',
    language VARCHAR(10) DEFAULT 'en', -- 'en', 'ar'
    report_format VARCHAR(20) DEFAULT 'narrative', -- 'narrative', 'bullet_points', 'executive_brief'
    audience_type VARCHAR(50) DEFAULT 'executive', -- 'executive', 'board', 'investors', 'management'
    generated_by VARCHAR(50) DEFAULT 'ai_cfo',
    confidence_score DECIMAL(3,2) DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cfo_dashboard_configs_business_account ON cfo_dashboard_configs(business_account_id);
CREATE INDEX IF NOT EXISTS idx_cfo_dashboard_configs_active ON cfo_dashboard_configs(is_active);

CREATE INDEX IF NOT EXISTS idx_cfo_financial_aggregations_business_account ON cfo_financial_aggregations(business_account_id);
CREATE INDEX IF NOT EXISTS idx_cfo_financial_aggregations_date ON cfo_financial_aggregations(aggregation_date);
CREATE INDEX IF NOT EXISTS idx_cfo_financial_aggregations_period ON cfo_financial_aggregations(aggregation_period);
CREATE INDEX IF NOT EXISTS idx_cfo_financial_aggregations_source ON cfo_financial_aggregations(data_source);

CREATE INDEX IF NOT EXISTS idx_cfo_kpi_analyses_business_account ON cfo_kpi_analyses(business_account_id);
CREATE INDEX IF NOT EXISTS idx_cfo_kpi_analyses_date ON cfo_kpi_analyses(analysis_date);
CREATE INDEX IF NOT EXISTS idx_cfo_kpi_analyses_category ON cfo_kpi_analyses(kpi_category);
CREATE INDEX IF NOT EXISTS idx_cfo_kpi_analyses_risk_level ON cfo_kpi_analyses(risk_level);

CREATE INDEX IF NOT EXISTS idx_cfo_ai_insights_business_account ON cfo_ai_insights(business_account_id);
CREATE INDEX IF NOT EXISTS idx_cfo_ai_insights_date ON cfo_ai_insights(insight_date);
CREATE INDEX IF NOT EXISTS idx_cfo_ai_insights_type ON cfo_ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_cfo_ai_insights_impact ON cfo_ai_insights(impact_level);
CREATE INDEX IF NOT EXISTS idx_cfo_ai_insights_status ON cfo_ai_insights(status);

CREATE INDEX IF NOT EXISTS idx_cfo_scenario_forecasts_business_account ON cfo_scenario_forecasts(business_account_id);
CREATE INDEX IF NOT EXISTS idx_cfo_scenario_forecasts_type ON cfo_scenario_forecasts(scenario_type);
CREATE INDEX IF NOT EXISTS idx_cfo_scenario_forecasts_period ON cfo_scenario_forecasts(forecast_period_start, forecast_period_end);

CREATE INDEX IF NOT EXISTS idx_cfo_executive_recommendations_business_account ON cfo_executive_recommendations(business_account_id);
CREATE INDEX IF NOT EXISTS idx_cfo_executive_recommendations_date ON cfo_executive_recommendations(recommendation_date);
CREATE INDEX IF NOT EXISTS idx_cfo_executive_recommendations_type ON cfo_executive_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_cfo_executive_recommendations_priority ON cfo_executive_recommendations(priority_level);
CREATE INDEX IF NOT EXISTS idx_cfo_executive_recommendations_status ON cfo_executive_recommendations(status);

CREATE INDEX IF NOT EXISTS idx_cfo_alerts_business_account ON cfo_alerts(business_account_id);
CREATE INDEX IF NOT EXISTS idx_cfo_alerts_date ON cfo_alerts(alert_date);
CREATE INDEX IF NOT EXISTS idx_cfo_alerts_type ON cfo_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_cfo_alerts_severity ON cfo_alerts(severity_level);
CREATE INDEX IF NOT EXISTS idx_cfo_alerts_status ON cfo_alerts(resolved_at);

CREATE INDEX IF NOT EXISTS idx_cfo_narrative_reports_business_account ON cfo_narrative_reports(business_account_id);
CREATE INDEX IF NOT EXISTS idx_cfo_narrative_reports_date ON cfo_narrative_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_cfo_narrative_reports_type ON cfo_narrative_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_cfo_narrative_reports_language ON cfo_narrative_reports(language);

-- Materialized Views for CFO Analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS cfo_executive_summary AS
SELECT 
    fa.business_account_id,
    fa.aggregation_date,
    fa.total_revenue,
    fa.total_expenses,
    fa.net_income,
    fa.total_assets,
    fa.total_liabilities,
    fa.equity,
    fa.cash_flow,
    fa.profit_margin,
    fa.roa,
    fa.roe,
    fa.current_ratio,
    fa.debt_to_equity,
    -- Latest insights count
    (SELECT COUNT(*) FROM cfo_ai_insights ai 
     WHERE ai.business_account_id = fa.business_account_id 
       AND ai.insight_date = fa.aggregation_date
       AND ai.status = 'new') as new_insights_count,
    -- Active alerts count
    (SELECT COUNT(*) FROM cfo_alerts al 
     WHERE al.business_account_id = fa.business_account_id 
       AND al.resolved_at IS NULL
       AND al.severity_level IN ('high', 'critical')) as critical_alerts_count,
    -- Pending recommendations
    (SELECT COUNT(*) FROM cfo_executive_recommendations er 
     WHERE er.business_account_id = fa.business_account_id 
       AND er.status = 'pending') as pending_recommendations_count,
    -- Latest KPI risk assessment
    (SELECT COUNT(*) FROM cfo_kpi_analyses kp 
     WHERE kp.business_account_id = fa.business_account_id 
       AND kp.analysis_date = fa.aggregation_date
       AND kp.risk_level IN ('high', 'critical')) as high_risk_kpis_count
FROM cfo_financial_aggregations fa
WHERE fa.aggregation_period = 'monthly'
  AND fa.data_source = 'financial_statements';

CREATE MATERIALIZED VIEW IF NOT EXISTS cfo_trend_analysis AS
SELECT 
    fa.business_account_id,
    DATE_TRUNC('month', fa.aggregation_date) as month,
    AVG(fa.total_revenue) as avg_revenue,
    AVG(fa.total_expenses) as avg_expenses,
    AVG(fa.net_income) as avg_net_income,
    AVG(fa.profit_margin) as avg_profit_margin,
    AVG(fa.roa) as avg_roa,
    AVG(fa.roe) as avg_roe,
    -- Revenue growth trend
    (LAG(AVG(fa.total_revenue), 1) OVER (PARTITION BY fa.business_account_id ORDER BY DATE_TRUNC('month', fa.aggregation_date))) as prev_month_revenue,
    CASE 
        WHEN LAG(AVG(fa.total_revenue), 1) OVER (PARTITION BY fa.business_account_id ORDER BY DATE_TRUNC('month', fa.aggregation_date)) > 0
        THEN ((AVG(fa.total_revenue) - LAG(AVG(fa.total_revenue), 1) OVER (PARTITION BY fa.business_account_id ORDER BY DATE_TRUNC('month', fa.aggregation_date))) / 
             LAG(AVG(fa.total_revenue), 1) OVER (PARTITION BY fa.business_account_id ORDER BY DATE_TRUNC('month', fa.aggregation_date)) * 100
        ELSE NULL 
    END as revenue_growth_pct,
    -- Profit margin trend
    (LAG(AVG(fa.profit_margin), 1) OVER (PARTITION BY fa.business_account_id ORDER BY DATE_TRUNC('month', fa.aggregation_date))) as prev_month_margin,
    (AVG(fa.profit_margin) - LAG(AVG(fa.profit_margin), 1) OVER (PARTITION BY fa.business_account_id ORDER BY DATE_TRUNC('month', fa.aggregation_date))) as margin_change_pct
FROM cfo_financial_aggregations fa
WHERE fa.aggregation_period = 'monthly'
  AND fa.data_source = 'financial_statements'
GROUP BY fa.business_account_id, DATE_TRUNC('month', fa.aggregation_date);

CREATE MATERIALIZED VIEW IF NOT EXISTS cfo_insight_impact_analysis AS
SELECT 
    ai.business_account_id,
    ai.insight_type,
    ai.insight_category,
    ai.impact_level,
    COUNT(*) as insight_count,
    AVG(ai.confidence_score) as avg_confidence,
    SUM(ai.financial_impact) as total_financial_impact,
    AVG(ai.financial_impact) as avg_financial_impact,
    -- Implementation rate
    COUNT(CASE WHEN ai.status = 'implemented' THEN 1 END) as implemented_count,
    ROUND(COUNT(CASE WHEN ai.status = 'implemented' THEN 1 END) * 100.0 / COUNT(*), 2) as implementation_rate_pct,
    -- Time to implement
    AVG(EXTRACT(DAYS FROM ai.implemented_at - ai.created_at)) as avg_days_to_implement
FROM cfo_ai_insights ai
GROUP BY ai.business_account_id, ai.insight_type, ai.insight_category, ai.impact_level;

-- Database Functions
CREATE OR REPLACE FUNCTION generate_cfo_financial_aggregation(
    p_business_account_id UUID,
    p_aggregation_date DATE,
    p_aggregation_period VARCHAR(20),
    p_data_source VARCHAR(50),
    p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
    v_aggregation_id UUID;
    v_total_revenue DECIMAL(20,8) := 0;
    v_total_expenses DECIMAL(20,8) := 0;
    v_total_assets DECIMAL(20,8) := 0;
    v_total_liabilities DECIMAL(20,8) := 0;
    v_equity DECIMAL(20,8) := 0;
    v_cash_flow DECIMAL(20,8) := 0;
BEGIN
    -- Aggregate data based on source
    IF p_data_source = 'financial_statements' THEN
        -- Get data from financial statements
        SELECT 
            COALESCE(SUM(revenue), 0),
            COALESCE(SUM(operating_expenses), 0),
            COALESCE(SUM(total_assets), 0),
            COALESCE(SUM(total_liabilities), 0),
            COALESCE(SUM(equity), 0),
            COALESCE(SUM(net_cash_flow), 0)
        INTO v_total_revenue, v_total_expenses, v_total_assets, v_total_liabilities, v_equity, v_cash_flow
        FROM (
            SELECT revenue, operating_expenses, total_assets, total_liabilities, equity, net_cash_flow
            FROM ifrs_financial_statements
            WHERE business_account_id = p_business_account_id
              AND statement_period_start <= p_aggregation_date
              AND statement_period_end >= p_aggregation_date
              AND statement_type = 'income_statement'
            UNION ALL
            SELECT revenue, operating_expenses, total_assets, total_liabilities, equity, net_cash_flow
            FROM gaap_financial_statements
            WHERE business_account_id = p_business_account_id
              AND statement_period_start <= p_aggregation_date
              AND statement_period_end >= p_aggregation_date
              AND statement_type = 'income_statement'
        ) fs;
    ELSIF p_data_source = 'fpna' THEN
        -- Get data from FP&A forecasts
        SELECT 
            COALESCE(SUM(revenue), 0),
            COALESCE(SUM(total_expenses), 0),
            0, 0, 0, 0
        INTO v_total_revenue, v_total_expenses, v_total_assets, v_total_liabilities, v_equity, v_cash_flow
        FROM financial_forecasts
        WHERE business_account_id = p_business_account_id
          AND forecast_period_start <= p_aggregation_date
          AND forecast_period_end >= p_aggregation_date;
    END IF;
    
    -- Insert or update aggregation
    INSERT INTO cfo_financial_aggregations (
        business_account_id,
        aggregation_date,
        aggregation_period,
        data_source,
        total_revenue,
        total_expenses,
        gross_profit,
        operating_income,
        net_income,
        total_assets,
        total_liabilities,
        equity,
        cash_flow,
        working_capital,
        ebitda,
        profit_margin,
        roa,
        roe,
        current_ratio,
        quick_ratio,
        debt_to_equity,
        inventory_turnover,
        days_sales_outstanding,
        calculation_methodology
    ) VALUES (
        p_business_account_id,
        p_aggregation_date,
        p_aggregation_period,
        p_data_source,
        v_total_revenue,
        v_total_expenses,
        v_total_revenue - v_total_expenses,
        v_total_revenue - v_total_expenses,
        v_total_revenue - v_total_expenses,
        v_total_assets,
        v_total_liabilities,
        v_equity,
        v_cash_flow,
        v_total_assets - v_total_liabilities,
        v_total_revenue - v_total_expenses,
        CASE WHEN v_total_revenue > 0 THEN (v_total_revenue - v_total_expenses) / v_total_revenue * 100 ELSE 0 END,
        CASE WHEN v_total_assets > 0 THEN (v_total_revenue - v_total_expenses) / v_total_assets * 100 ELSE 0 END,
        CASE WHEN v_equity > 0 THEN (v_total_revenue - v_total_expenses) / v_equity * 100 ELSE 0 END,
        CASE WHEN v_total_liabilities > 0 THEN v_total_assets / v_total_liabilities ELSE 0 END,
        CASE WHEN v_total_liabilities > 0 THEN v_total_assets / v_total_liabilities ELSE 0 END,
        CASE WHEN v_equity > 0 THEN v_total_liabilities / v_equity ELSE 0 END,
        0, -- inventory_turnover
        0, -- days_sales_outstanding
        jsonb_build_object('source', p_data_source, 'created_by', p_created_by, 'aggregation_date', p_aggregation_date)
    ) ON CONFLICT (business_account_id, aggregation_date, aggregation_period, data_source)
    DO UPDATE SET
        total_revenue = EXCLUDED.total_revenue,
        total_expenses = EXCLUDED.total_expenses,
        gross_profit = EXCLUDED.gross_profit,
        operating_income = EXCLUDED.operating_income,
        net_income = EXCLUDED.net_income,
        total_assets = EXCLUDED.total_assets,
        total_liabilities = EXCLUDED.total_liabilities,
        equity = EXCLUDED.equity,
        cash_flow = EXCLUDED.cash_flow,
        working_capital = EXCLUDED.working_capital,
        ebitda = EXCLUDED.ebitda,
        profit_margin = EXCLUDED.profit_margin,
        roa = EXCLUDED.roa,
        roe = EXCLUDED.roe,
        current_ratio = EXCLUDED.current_ratio,
        quick_ratio = EXCLUDED.quick_ratio,
        debt_to_equity = EXCLUDED.debt_to_equity,
        calculation_methodology = EXCLUDED.calculation_methodology,
        updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_aggregation_id;
    
    RETURN v_aggregation_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_cfo_insight(
    p_business_account_id UUID,
    p_insight_type VARCHAR(50),
    p_insight_category VARCHAR(50),
    p_insight_title VARCHAR(200),
    p_insight_description TEXT,
    p_impact_level VARCHAR(20),
    p_urgency_level VARCHAR(20),
    p_financial_impact DECIMAL(20,8),
    p_recommended_actions JSONB,
    p_supporting_data JSONB,
    p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
    v_insight_id UUID;
BEGIN
    INSERT INTO cfo_ai_insights (
        business_account_id,
        insight_date,
        insight_type,
        insight_category,
        insight_title,
        insight_description,
        impact_level,
        urgency_level,
        financial_impact,
        recommended_actions,
        supporting_data,
        created_at
    ) VALUES (
        p_business_account_id,
        CURRENT_DATE,
        p_insight_type,
        p_insight_category,
        p_insight_title,
        p_insight_description,
        p_impact_level,
        p_urgency_level,
        p_financial_impact,
        p_recommended_actions,
        p_supporting_data,
        CURRENT_TIMESTAMP
    ) RETURNING id INTO v_insight_id;
    
    RETURN v_insight_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_cfo_alert(
    p_business_account_id UUID,
    p_alert_type VARCHAR(50),
    p_alert_category VARCHAR(50),
    p_severity_level VARCHAR(20),
    p_alert_title VARCHAR(200),
    p_alert_description TEXT,
    p_current_value DECIMAL(20,8),
    p_threshold_value DECIMAL(20,8),
    p_variance_percentage DECIMAL(10,4),
    p_trigger_conditions JSONB,
    p_recommended_actions JSONB,
    p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
    v_alert_id UUID;
BEGIN
    INSERT INTO cfo_alerts (
        business_account_id,
        alert_type,
        alert_category,
        severity_level,
        alert_title,
        alert_description,
        current_value,
        threshold_value,
        variance_percentage,
        trigger_conditions,
        recommended_actions,
        created_at
    ) VALUES (
        p_business_account_id,
        p_alert_type,
        p_alert_category,
        p_severity_level,
        p_alert_title,
        p_alert_description,
        p_current_value,
        p_threshold_value,
        p_variance_percentage,
        p_trigger_conditions,
        p_recommended_actions,
        CURRENT_TIMESTAMP
    ) RETURNING id INTO v_alert_id;
    
    RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_cfo_materialized_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY cfo_executive_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY cfo_trend_analysis;
    REFRESH MATERIALIZED VIEW CONCURRENTLY cfo_insight_impact_analysis;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security Policies
ALTER TABLE cfo_dashboard_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfo_financial_aggregations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfo_kpi_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfo_ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfo_scenario_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfo_executive_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfo_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfo_narrative_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business account isolation
CREATE POLICY cfo_dashboard_configs_isolation ON cfo_dashboard_configs
    FOR ALL TO authenticated_users
    USING (business_account_id = current_setting('app.current_business_account_id')::uuid);

CREATE POLICY cfo_financial_aggregations_isolation ON cfo_financial_aggregations
    FOR ALL TO authenticated_users
    USING (business_account_id = current_setting('app.current_business_account_id')::uuid);

CREATE POLICY cfo_kpi_analyses_isolation ON cfo_kpi_analyses
    FOR ALL TO authenticated_users
    USING (business_account_id = current_setting('app.current_business_account_id')::uuid);

CREATE POLICY cfo_ai_insights_isolation ON cfo_ai_insights
    FOR ALL TO authenticated_users
    USING (business_account_id = current_setting('app.current_business_account_id')::uuid);

CREATE POLICY cfo_scenario_forecasts_isolation ON cfo_scenario_forecasts
    FOR ALL TO authenticated_users
    USING (business_account_id = current_setting('app.current_business_account_id')::uuid);

CREATE POLICY cfo_executive_recommendations_isolation ON cfo_executive_recommendations
    FOR ALL TO authenticated_users
    USING (business_account_id = current_setting('app.current_business_account_id')::uuid);

CREATE POLICY cfo_alerts_isolation ON cfo_alerts
    FOR ALL TO authenticated_users
    USING (business_account_id = current_setting('app.current_business_account_id')::uuid);

CREATE POLICY cfo_narrative_reports_isolation ON cfo_narrative_reports
    FOR ALL TO authenticated_users
    USING (business_account_id = current_setting('app.current_business_account_id')::uuid);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_cfo_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cfo_dashboard_configs_updated_at
    BEFORE UPDATE ON cfo_dashboard_configs
    FOR EACH ROW EXECUTE FUNCTION update_cfo_updated_at_column();

CREATE TRIGGER update_cfo_financial_aggregations_updated_at
    BEFORE UPDATE ON cfo_financial_aggregations
    FOR EACH ROW EXECUTE FUNCTION update_cfo_updated_at_column();

CREATE TRIGGER update_cfo_kpi_analyses_updated_at
    BEFORE UPDATE ON cfo_kpi_analyses
    FOR EACH ROW EXECUTE FUNCTION update_cfo_updated_at_column();

CREATE TRIGGER update_cfo_ai_insights_updated_at
    BEFORE UPDATE ON cfo_ai_insights
    FOR EACH ROW EXECUTE FUNCTION update_cfo_updated_at_column();

CREATE TRIGGER update_cfo_scenario_forecasts_updated_at
    BEFORE UPDATE ON cfo_scenario_forecasts
    FOR EACH ROW EXECUTE FUNCTION update_cfo_updated_at_column();

CREATE TRIGGER update_cfo_executive_recommendations_updated_at
    BEFORE UPDATE ON cfo_executive_recommendations
    FOR EACH ROW EXECUTE FUNCTION update_cfo_updated_at_column();

CREATE TRIGGER update_cfo_alerts_updated_at
    BEFORE UPDATE ON cfo_alerts
    FOR EACH ROW EXECUTE FUNCTION update_cfo_updated_at_column();

CREATE TRIGGER update_cfo_narrative_reports_updated_at
    BEFORE UPDATE ON cfo_narrative_reports
    FOR EACH ROW EXECUTE FUNCTION update_cfo_updated_at_column();

-- Insert default CFO dashboard configurations
INSERT INTO cfo_dashboard_configs (
    business_account_id,
    dashboard_name,
    dashboard_type,
    layout_config,
    widget_config,
    kpi_config,
    alert_config,
    is_default,
    created_by
) VALUES
('00000000-0000-0000-0000-000000000000', 'Executive Dashboard', 'executive', 
 '{"layout": "grid", "columns": 3, "rows": 4}', 
 '{"widgets": ["kpi_summary", "revenue_trend", "profit_margin", "cash_flow", "alerts", "insights"]}',
 '{"kpis": ["revenue", "profit_margin", "cash_flow", "current_ratio", "debt_to_equity"]}',
 '{"alerts": ["kpi_breach", "risk_threshold", "opportunity"]}',
 true, '00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000000', 'Operational Dashboard', 'operational',
 '{"layout": "grid", "columns": 4, "rows": 3}',
 '{"widgets": ["daily_metrics", "expense_breakdown", "efficiency_ratios", "working_capital"]}',
 '{"kpis": ["operating_expenses", "inventory_turnover", "days_sales_outstanding", "working_capital"]}',
 '{"alerts": ["operational_anomaly", "efficiency_decline"]}',
 false, '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- Create indexes for materialized views
CREATE INDEX IF NOT EXISTS idx_cfo_executive_summary_business_account ON cfo_executive_summary(business_account_id);
CREATE INDEX IF NOT EXISTS idx_cfo_trend_analysis_business_account ON cfo_trend_analysis(business_account_id);
CREATE INDEX IF NOT EXISTS idx_cfo_insight_impact_analysis_business_account ON cfo_insight_impact_analysis(business_account_id);

COMMENT ON TABLE cfo_dashboard_configs IS 'CFO dashboard configurations with layouts and widgets';
COMMENT ON TABLE cfo_financial_aggregations IS 'Aggregated financial data from multiple sources for CFO analysis';
COMMENT ON TABLE cfo_kpi_analyses IS 'KPI analysis with benchmarks and trend analysis';
COMMENT ON TABLE cfo_ai_insights IS 'AI-generated insights and recommendations';
COMMENT ON TABLE cfo_scenario_forecasts IS 'Scenario-based financial forecasting';
COMMENT ON TABLE cfo_executive_recommendations IS 'Executive-level recommendations with business cases';
COMMENT ON TABLE cfo_alerts IS 'CFO alerts for KPI breaches and risk thresholds';
COMMENT ON TABLE cfo_narrative_reports IS 'Narrative reports for executive consumption';
