-- Sprint 22: AI Strategy Simulator (10-Year Horizon) Migration
-- Creates comprehensive AI-driven strategy simulation infrastructure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Strategy Scenarios
CREATE TABLE strategy_scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    scenario_name VARCHAR(200) NOT NULL,
    scenario_description TEXT,
    scenario_type VARCHAR(50) NOT NULL CHECK (scenario_type IN ('growth', 'expansion', 'cost_optimization', 'funding', 'market_entry', 'product_launch', 'acquisition', 'ipo_preparation', 'risk_assessment', 'custom')),
    time_horizon_years INTEGER NOT NULL DEFAULT 10 CHECK (time_horizon_years BETWEEN 1 AND 20),
    base_year INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    is_locked BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Strategy Assumptions
CREATE TABLE strategy_assumptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID NOT NULL REFERENCES strategy_scenarios(id) ON DELETE CASCADE,
    assumption_category VARCHAR(100) NOT NULL CHECK (assumption_category IN ('revenue_growth', 'cost_structure', 'pricing', 'market_size', 'customer_acquisition', 'operational_efficiency', 'capital_expenditure', 'working_capital', 'funding', 'macro_economic', 'competitive', 'regulatory', 'technology', 'custom')),
    assumption_name VARCHAR(200) NOT NULL,
    assumption_value DECIMAL(20,4) NOT NULL,
    assumption_unit VARCHAR(50),
    assumption_range_min DECIMAL(20,4),
    assumption_range_max DECIMAL(20,4),
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
    data_source VARCHAR(100),
    justification TEXT,
    sensitivity_analysis JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Financial Projections
CREATE TABLE financial_projections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID NOT NULL REFERENCES strategy_scenarios(id) ON DELETE CASCADE,
    projection_year INTEGER NOT NULL,
    projection_quarter INTEGER CHECK (projection_quarter BETWEEN 1 AND 4),
    revenue DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    cost_of_goods_sold DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    gross_profit DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    operating_expenses DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    operating_income DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    ebitda DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    net_income DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    earnings_per_share DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
    total_assets DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    working_capital DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    capital_expenditures DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    free_cash_flow DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    cash_at_end DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    projection_type VARCHAR(50) NOT NULL CHECK (projection_type IN ('pessimistic', 'base', 'optimistic', 'stretch')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Decision Impact Models
CREATE TABLE decision_impact_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID NOT NULL REFERENCES strategy_scenarios(id) ON DELETE CASCADE,
    decision_type VARCHAR(100) NOT NULL CHECK (decision_type IN ('pricing', 'investment', 'expansion', 'hiring', 'technology', 'product', 'market', 'funding', 'acquisition', 'exit_strategy', 'custom')),
    decision_name VARCHAR(200) NOT NULL,
    decision_description TEXT,
    financial_impact DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    strategic_impact_score INTEGER CHECK (strategic_impact_score BETWEEN 1 AND 100),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
    time_to_impact_months INTEGER,
    dependencies JSONB DEFAULT '[]',
    success_metrics JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Insights
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID NOT NULL REFERENCES strategy_scenarios(id) ON DELETE CASCADE,
    insight_type VARCHAR(100) NOT NULL CHECK (insight_type IN ('opportunity', 'risk', 'trend', 'recommendation', 'competitive', 'market', 'financial', 'operational', 'strategic', 'custom')),
    insight_title VARCHAR(300) NOT NULL,
    insight_description TEXT NOT NULL,
    insight_data JSONB NOT NULL DEFAULT '{}',
    confidence_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    priority_level INTEGER CHECK (priority_level BETWEEN 1 AND 10),
    actionability_level INTEGER CHECK (actionability_level BETWEEN 1 AND 10),
    time_horizon_months INTEGER,
    potential_impact DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    generated_by VARCHAR(50) DEFAULT 'ai_engine'
);

-- Scenario Comparisons
CREATE TABLE scenario_comparisons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    comparison_name VARCHAR(200) NOT NULL,
    comparison_description TEXT,
    scenario_ids JSONB NOT NULL DEFAULT '[]',
    comparison_metrics JSONB NOT NULL DEFAULT '{}',
    comparison_results JSONB NOT NULL DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scenario Snapshots
CREATE TABLE scenario_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID NOT NULL REFERENCES strategy_scenarios(id) ON DELETE CASCADE,
    snapshot_name VARCHAR(200) NOT NULL,
    snapshot_description TEXT,
    snapshot_data JSONB NOT NULL DEFAULT '{}',
    is_read_only BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Executive Dashboards
CREATE TABLE executive_dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    dashboard_name VARCHAR(200) NOT NULL,
    dashboard_config JSONB NOT NULL DEFAULT '{}',
    dashboard_data JSONB NOT NULL DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Materialized Views for Analytics
CREATE MATERIALIZED VIEW strategy_summary_dashboard AS
SELECT 
    ba.id as business_account_id,
    ba.name as business_name,
    COUNT(DISTINCT ss.id) as total_scenarios,
    COUNT(DISTINCT CASE WHEN ss.status = 'active' THEN ss.id END) as active_scenarios,
    COUNT(DISTINCT CASE WHEN ss.status = 'completed' THEN ss.id END) as completed_scenarios,
    COUNT(DISTINCT ai.id) as total_insights,
    COUNT(DISTINCT ed.id) as total_decisions,
    COUNT(DISTINCT sc.id) as total_comparisons,
    COUNT(DISTINCT es.id) as total_snapshots,
    MAX(ss.created_at) as last_scenario_created,
    MAX(ai.created_at) as last_insight_generated
FROM business_accounts ba
LEFT JOIN strategy_scenarios ss ON ba.id = ss.business_account_id
LEFT JOIN ai_insights ai ON ss.id = ai.scenario_id
LEFT JOIN decision_impact_models ed ON ss.id = ed.scenario_id
LEFT JOIN scenario_comparisons sc ON ba.id = sc.business_account_id
LEFT JOIN scenario_snapshots es ON ss.id = es.scenario_id
GROUP BY ba.id, ba.name;

CREATE MATERIALIZED VIEW scenario_performance_comparison AS
SELECT 
    ss.id as scenario_id,
    ss.scenario_name,
    ss.scenario_type,
    ss.time_horizon_years,
    fp.base_year + fp.projection_year as year,
    fp.revenue,
    fp.net_income,
    fp.ebitda,
    fp.earnings_per_share,
    fp.free_cash_flow,
    RANK() OVER (PARTITION BY ss.id ORDER BY (fp.net_income) DESC) as profitability_rank,
    RANK() OVER (PARTITION BY ss.id ORDER BY (fp.revenue) DESC) as revenue_rank,
    RANK() OVER (PARTITION BY ss.id ORDER BY (fp.free_cash_flow) DESC) as cash_flow_rank,
    CASE 
        WHEN fp.free_cash_flow > 0 THEN 'positive'
        WHEN fp.free_cash_flow < 0 THEN 'negative'
        ELSE 'neutral'
    END as cash_flow_status,
    ROUND((fp.net_income / NULLIF(fp.revenue, 0)) * 100, 2) as profit_margin,
    ROUND((fp.ebitda / NULLIF(fp.revenue, 0)) * 100, 2) as ebitda_margin
FROM strategy_scenarios ss
JOIN financial_projections fp ON ss.id = fp.scenario_id
WHERE fp.projection_quarter = 4 OR fp.projection_year = ss.base_year + ss.time_horizon_years - 1;

-- Database Functions
CREATE OR REPLACE FUNCTION create_strategy_scenario(
    p_business_account_id UUID,
    p_scenario_name VARCHAR,
    p_scenario_description TEXT DEFAULT NULL,
    p_scenario_type VARCHAR,
    p_time_horizon_years INTEGER DEFAULT 10,
    p_base_year INTEGER,
    p_currency VARCHAR DEFAULT 'USD',
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_scenario_id UUID;
BEGIN
    INSERT INTO strategy_scenarios (
        business_account_id,
        scenario_name,
        scenario_description,
        scenario_type,
        time_horizon_years,
        base_year,
        currency,
        created_by
    ) VALUES (
        p_business_account_id,
        p_scenario_name,
        p_scenario_description,
        p_scenario_type,
        p_time_horizon_years,
        p_base_year,
        p_currency,
        p_created_by
    ) RETURNING id INTO v_scenario_id;
    
    RETURN v_scenario_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_strategy_assumption(
    p_scenario_id UUID,
    p_assumption_category VARCHAR,
    p_assumption_name VARCHAR,
    p_assumption_value DECIMAL,
    p_assumption_unit VARCHAR,
    p_assumption_range_min DECIMAL DEFAULT NULL,
    p_assumption_range_max DECIMAL DEFAULT NULL,
    p_confidence_level INTEGER DEFAULT 3,
    p_data_source VARCHAR DEFAULT NULL,
    p_justification TEXT DEFAULT NULL,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_assumption_id UUID;
BEGIN
    INSERT INTO strategy_assumptions (
        scenario_id,
        assumption_category,
        assumption_name,
        assumption_value,
        assumption_unit,
        assumption_range_min,
        assumption_range_max,
        confidence_level,
        data_source,
        justification,
        created_by
    ) VALUES (
        p_scenario_id,
        p_assumption_category,
        p_assumption_name,
        p_assumption_value,
        p_assumption_unit,
        p_assumption_range_min,
        p_assumption_range_max,
        p_confidence_level,
        p_data_source,
        p_justification,
        p_created_by
    ) RETURNING id INTO v_assumption_id;
    
    RETURN v_assumption_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_financial_projection(
    p_scenario_id UUID,
    p_projection_year INTEGER,
    p_projection_quarter INTEGER,
    p_projection_type VARCHAR DEFAULT 'base',
    p_revenue DECIMAL DEFAULT 0.00,
    p_cost_of_goods_sold DECIMAL DEFAULT 0.00,
    p_gross_profit DECIMAL DEFAULT 0.00,
    p_operating_expenses DECIMAL DEFAULT 0.00,
    p_operating_income DECIMAL DEFAULT 0.00,
    p_ebitda DECIMAL DEFAULT 0.00,
    p_net_income DECIMAL DEFAULT 0.00,
    p_earnings_per_share DECIMAL DEFAULT 0.0000,
    p_total_assets DECIMAL DEFAULT 0.00,
    p_working_capital DECIMAL DEFAULT 0.00,
    p_capital_expenditures DECIMAL DEFAULT 0.00,
    p_free_cash_flow DECIMAL DEFAULT 0.00,
    p_cash_at_end DECIMAL DEFAULT 0.00,
    p_currency VARCHAR DEFAULT 'USD',
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_projection_id UUID;
BEGIN
    INSERT INTO financial_projections (
        scenario_id,
        projection_year,
        projection_quarter,
        revenue,
        cost_of_goods_sold,
        gross_profit,
        operating_expenses,
        operating_income,
        ebitda,
        net_income,
        earnings_per_share,
        total_assets,
        working_capital,
        capital_expenditures,
        free_cash_flow,
        cash_at_end,
        currency,
        projection_type,
        created_by
    ) VALUES (
        p_scenario_id,
        p_projection_year,
        p_projection_quarter,
        p_revenue,
        p_cost_of_goods_sold,
        p_gross_profit,
        p_operating_expenses,
        p_operating_income,
        p_ebitda,
        p_net_income,
        p_earnings_per_share,
        p_total_assets,
        p_working_capital,
        p_capital_expenditures,
        p_free_cash_flow,
        p_cash_at_end,
        p_currency,
        p_projection_type,
        p_created_by
    ) RETURNING id INTO v_projection_id;
    
    RETURN v_projection_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_decision_impact_model(
    p_scenario_id UUID,
    p_decision_type VARCHAR,
    p_decision_name VARCHAR,
    p_decision_description TEXT,
    p_financial_impact DECIMAL DEFAULT 0.00,
    p_strategic_impact_score INTEGER DEFAULT 50,
    p_risk_level VARCHAR DEFAULT 'medium',
    p_confidence_level INTEGER DEFAULT 3,
    p_time_to_impact_months INTEGER DEFAULT 12,
    p_dependencies JSONB DEFAULT '[]',
    p_success_metrics JSONB DEFAULT '{}',
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_decision_id UUID;
BEGIN
    INSERT INTO decision_impact_models (
        scenario_id,
        decision_type,
        decision_name,
        decision_description,
        financial_impact,
        strategic_impact_score,
        risk_level,
        confidence_level,
        time_to_impact_months,
        dependencies,
        success_metrics,
        created_by
    ) VALUES (
        p_scenario_id,
        p_decision_type,
        p_decision_name,
        p_decision_description,
        p_financial_impact,
        p_strategic_impact_score,
        p_risk_level,
        p_confidence_level,
        p_time_to_impact_months,
        p_dependencies,
        p_success_metrics,
        p_created_by
    ) RETURNING id INTO v_decision_id;
    
    RETURN v_decision_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_strategy_materialized_views() RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY strategy_summary_dashboard;
    REFRESH MATERIALIZED VIEW CONCURRENTLY scenario_performance_comparison;
END;
$$ LANGUAGE plpgsql;

-- Indexes for Performance
CREATE INDEX idx_strategy_scenarios_business_account ON strategy_scenarios(business_account_id);
CREATE INDEX idx_strategy_scenarios_status ON strategy_scenarios(status);
CREATE INDEX idx_strategy_scenarios_type ON strategy_scenarios(scenario_type);
CREATE INDEX idx_strategy_assumptions_scenario ON strategy_assumptions(scenario_id);
CREATE INDEX idx_strategy_assumptions_category ON strategy_assumptions(assumption_category);
CREATE INDEX idx_financial_projections_scenario ON financial_projections(scenario_id);
CREATE INDEX idx_financial_projections_year_quarter ON financial_projections(projection_year, projection_quarter);
CREATE INDEX idx_decision_impact_models_scenario ON decision_impact_models(scenario_id);
CREATE INDEX idx_decision_impact_models_type ON decision_impact_models(decision_type);
CREATE INDEX idx_ai_insights_scenario ON ai_insights(scenario_id);
CREATE INDEX idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX idx_scenario_comparisons_business_account ON scenario_comparisons(business_account_id);
CREATE INDEX idx_scenario_snapshots_scenario ON scenario_snapshots(scenario_id);
CREATE INDEX idx_executive_dashboards_business_account ON executive_dashboards(business_account_id);

-- Row Level Security (RLS) Policies
ALTER TABLE strategy_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_impact_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_dashboards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI Strategy Simulator
CREATE POLICY strategy_scenarios_policy ON strategy_scenarios
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY strategy_assumptions_policy ON strategy_assumptions
    FOR ALL TO authenticated_users
    USING (scenario_id IN (
        SELECT id FROM strategy_scenarios ss
        WHERE ss.business_account_id IN (
            SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
        )
    ));

CREATE POLICY financial_projections_policy ON financial_projections
    FOR ALL TO authenticated_users
    USING (scenario_id IN (
        SELECT id FROM strategy_scenarios ss
        WHERE ss.business_account_id IN (
            SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
        )
    ));

CREATE POLICY decision_impact_models_policy ON decision_impact_models
    FOR ALL TO authenticated_users
    USING (scenario_id IN (
        SELECT id FROM strategy_scenarios ss
        WHERE ss.business_account_id IN (
            SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
        )
    ));

CREATE POLICY ai_insights_policy ON ai_insights
    FOR ALL TO authenticated_users
    USING (scenario_id IN (
        SELECT id FROM strategy_scenarios ss
        WHERE ss.business_account_id IN (
            SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
        )
    ));

CREATE POLICY scenario_comparisons_policy ON scenario_comparisons
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

CREATE POLICY scenario_snapshots_policy ON scenario_snapshots
    FOR ALL TO authenticated_users
    USING (scenario_id IN (
        SELECT id FROM strategy_scenarios ss
        WHERE ss.business_account_id IN (
            SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
        )
    ));

CREATE POLICY executive_dashboards_policy ON executive_dashboards
    FOR ALL TO authenticated_users
    USING (business_account_id IN (
        SELECT business_account_id FROM user_business_accounts WHERE user_id = current_user_id()
    ));

-- Triggers for Updated At
CREATE TRIGGER update_strategy_scenarios_updated_at
    BEFORE UPDATE ON strategy_scenarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategy_assumptions_updated_at
    BEFORE UPDATE ON strategy_assumptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_projections_updated_at
    BEFORE UPDATE ON financial_projections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decision_impact_models_updated_at
    BEFORE UPDATE ON decision_impact_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_executive_dashboards_updated_at
    BEFORE UPDATE ON executive_dashboards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
