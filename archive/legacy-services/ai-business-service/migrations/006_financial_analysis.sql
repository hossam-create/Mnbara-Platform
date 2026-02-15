-- Migration: Financial Analysis Engine
-- Sprint 5: Financial Analysis with Common Size Statements, Ratios, and Trend Analysis

-- Create financial analysis results table
CREATE TABLE IF NOT EXISTS financial_analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL, -- 'COMMON_SIZE', 'RATIOS', 'TREND', 'COMPARISON'
    analysis_period_type VARCHAR(20) NOT NULL, -- 'MONTHLY', 'QUARTERLY', 'YEARLY'
    fiscal_year INTEGER NOT NULL,
    fiscal_quarter INTEGER,
    fiscal_month INTEGER,
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_source VARCHAR(20) NOT NULL, -- 'ACTUAL', 'FORECAST', 'BOTH'
    scenario_id UUID REFERENCES forecast_scenarios(id) ON DELETE SET NULL,
    
    -- Common size data (JSON)
    common_size_income_statement JSONB,
    common_size_balance_sheet JSONB,
    
    -- Financial ratios (JSON)
    profitability_ratios JSONB,
    liquidity_ratios JSONB,
    asset_turnover_ratios JSONB,
    leverage_ratios JSONB,
    
    -- Trend analysis data (JSON)
    trend_data JSONB,
    
    -- Comparison data (JSON)
    forecast_vs_actual JSONB,
    
    -- AI interpretation data (JSON)
    ai_insights JSONB,
    ai_recommendations JSONB,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_analysis_type CHECK (analysis_type IN ('COMMON_SIZE', 'RATIOS', 'TREND', 'COMPARISON')),
    CONSTRAINT valid_period_type CHECK (analysis_period_type IN ('MONTHLY', 'QUARTERLY', 'YEARLY')),
    CONSTRAINT valid_data_source CHECK (data_source IN ('ACTUAL', 'FORECAST', 'BOTH')),
    CONSTRAINT valid_quarter CHECK (fiscal_quarter IS NULL OR (fiscal_quarter >= 1 AND fiscal_quarter <= 4)),
    CONSTRAINT valid_month CHECK (fiscal_month IS NULL OR (fiscal_month >= 1 AND fiscal_month <= 12))
);

-- Create financial ratios definitions table
CREATE TABLE IF NOT EXISTS financial_ratio_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ratio_name VARCHAR(100) NOT NULL UNIQUE,
    ratio_category VARCHAR(50) NOT NULL, -- 'PROFITABILITY', 'LIQUIDITY', 'ASSET_TURNOVER', 'LEVERAGE'
    ratio_formula TEXT NOT NULL,
    description TEXT,
    numerator_accounts TEXT[], -- Chart of account names for numerator
    denominator_accounts TEXT[], -- Chart of account names for denominator
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_category CHECK (ratio_category IN ('PROFITABILITY', 'LIQUIDITY', 'ASSET_TURNOVER', 'LEVERAGE'))
);

-- Create trend analysis periods table
CREATE TABLE IF NOT EXISTS trend_analysis_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL, -- 'MONTHLY', 'QUARTERLY', 'YEARLY'
    metric_name VARCHAR(100) NOT NULL,
    metric_values DECIMAL(20,4)[] NOT NULL, -- Array of values over time
    period_labels TEXT[] NOT NULL, -- Array of period labels
    trend_direction VARCHAR(20), -- 'INCREASING', 'DECREASING', 'STABLE', 'VOLATILE'
    trend_strength DECIMAL(5,4), -- Correlation coefficient or similar
    growth_rate DECIMAL(10,4), -- Average growth rate
    volatility DECIMAL(10,4), -- Standard deviation or similar
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_period_type CHECK (period_type IN ('MONTHLY', 'QUARTERLY', 'YEARLY')),
    CONSTRAINT valid_trend_direction CHECK (trend_direction IN ('INCREASING', 'DECREASING', 'STABLE', 'VOLATILE')),
    CONSTRAINT end_after_start CHECK (end_date >= start_date)
);

-- Create forecast vs actual comparison table
CREATE TABLE IF NOT EXISTS forecast_actual_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES forecast_scenarios(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES forecast_periods(id) ON DELETE CASCADE,
    fiscal_year INTEGER NOT NULL,
    fiscal_quarter INTEGER,
    fiscal_month INTEGER,
    
    -- Revenue comparisons
    actual_revenue DECIMAL(20,4),
    forecast_revenue DECIMAL(20,4),
    revenue_variance DECIMAL(20,4),
    revenue_variance_percentage DECIMAL(10,4),
    
    -- Expense comparisons
    actual_expenses DECIMAL(20,4),
    forecast_expenses DECIMAL(20,4),
    expense_variance DECIMAL(20,4),
    expense_variance_percentage DECIMAL(10,4),
    
    -- Net income comparisons
    actual_net_income DECIMAL(20,4),
    forecast_net_income DECIMAL(20,4),
    net_income_variance DECIMAL(20,4),
    net_income_variance_percentage DECIMAL(10,4),
    
    -- Balance sheet comparisons
    actual_total_assets DECIMAL(20,4),
    forecast_total_assets DECIMAL(20,4),
    assets_variance DECIMAL(20,4),
    assets_variance_percentage DECIMAL(10,4),
    
    actual_total_liabilities DECIMAL(20,4),
    forecast_total_liabilities DECIMAL(20,4),
    liabilities_variance DECIMAL(20,4),
    liabilities_variance_percentage DECIMAL(10,4),
    
    -- Accuracy metrics
    mean_absolute_percentage_error DECIMAL(10,4),
    mean_squared_error DECIMAL(20,4),
    forecast_accuracy_score DECIMAL(5,4), -- 0-1 scale
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_quarter CHECK (fiscal_quarter IS NULL OR (fiscal_quarter >= 1 AND fiscal_quarter <= 4)),
    CONSTRAINT valid_month CHECK (fiscal_month IS NULL OR (fiscal_month >= 1 AND fiscal_month <= 12))
);

-- Create AI analysis insights table
CREATE TABLE IF NOT EXISTS ai_analysis_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    analysis_result_id UUID NOT NULL REFERENCES financial_analysis_results(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL, -- 'PERFORMANCE', 'TREND', 'RISK', 'OPPORTUNITY'
    insight_category VARCHAR(50) NOT NULL, -- 'PROFITABILITY', 'LIQUIDITY', 'EFFICIENCY', 'GROWTH'
    insight_title TEXT NOT NULL,
    insight_description TEXT NOT NULL,
    confidence_score DECIMAL(5,4), -- 0-1 scale
    impact_level VARCHAR(20), -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    actionable_recommendations TEXT[],
    supporting_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_insight_type CHECK (insight_type IN ('PERFORMANCE', 'TREND', 'RISK', 'OPPORTUNITY')),
    CONSTRAINT valid_impact_level CHECK (impact_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

-- Create materialized view for financial analysis summaries
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_financial_analysis_summary AS
SELECT 
    ba.id as business_account_id,
    ba.name as business_name,
    far.analysis_type,
    far.analysis_period_type,
    far.fiscal_year,
    far.fiscal_quarter,
    far.fiscal_month,
    far.data_source,
    fs.scenario_name,
    
    -- Extract key ratios from JSON
    (far.profitability_ratios->>'gross_profit_margin')::DECIMAL(10,4) as gross_profit_margin,
    (far.profitability_ratios->>'net_profit_margin')::DECIMAL(10,4) as net_profit_margin,
    (far.profitability_ratios->>'return_on_assets')::DECIMAL(10,4) as return_on_assets,
    (far.profitability_ratios->>'return_on_equity')::DECIMAL(10,4) as return_on_equity,
    
    -- Liquidity ratios
    (far.liquidity_ratios->>'current_ratio')::DECIMAL(10,4) as current_ratio,
    (far.liquidity_ratios->>'quick_ratio')::DECIMAL(10,4) as quick_ratio,
    (far.liquidity_ratios->>'cash_ratio')::DECIMAL(10,4) as cash_ratio,
    
    -- Asset turnover ratios
    (far.asset_turnover_ratios->>'asset_turnover')::DECIMAL(10,4) as asset_turnover,
    (far.asset_turnover_ratios->>'inventory_turnover')::DECIMAL(10,4) as inventory_turnover,
    (far.asset_turnover_ratios->>'receivables_turnover')::DECIMAL(10,4) as receivables_turnover,
    
    -- Leverage ratios
    (far.leverage_ratios->>'debt_to_equity')::DECIMAL(10,4) as debt_to_equity,
    (far.leverage_ratios->>'debt_to_assets')::DECIMAL(10,4) as debt_to_assets,
    (far.leverage_ratios->>'interest_coverage')::DECIMAL(10,4) as interest_coverage,
    
    -- AI insights summary
    (SELECT COUNT(*) FROM ai_analysis_insights aai WHERE aai.analysis_result_id = far.id) as insight_count,
    (SELECT MAX(confidence_score) FROM ai_analysis_insights aai WHERE aai.analysis_result_id = far.id) as max_confidence,
    
    far.created_at,
    far.updated_at
    
FROM financial_analysis_results far
JOIN business_accounts ba ON far.business_account_id = ba.id
LEFT JOIN forecast_scenarios fs ON far.scenario_id = fs.id
WHERE far.created_at = (
    SELECT MAX(created_at) 
    FROM financial_analysis_results far2 
    WHERE far2.business_account_id = far.business_account_id 
    AND far2.analysis_type = far.analysis_type
    AND far2.fiscal_year = far.fiscal_year
    AND COALESCE(far2.fiscal_quarter, 0) = COALESCE(far.fiscal_quarter, 0)
);

-- Create materialized view for trend analysis summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_trend_analysis_summary AS
SELECT 
    business_account_id,
    metric_name,
    period_type,
    trend_direction,
    trend_strength,
    growth_rate,
    volatility,
    COUNT(*) as data_points,
    MIN(start_date) as earliest_date,
    MAX(end_date) as latest_date
FROM trend_analysis_periods
GROUP BY business_account_id, metric_name, period_type, trend_direction, trend_strength, growth_rate, volatility;

-- Create materialized view for forecast accuracy summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_forecast_accuracy_summary AS
SELECT 
    fac.business_account_id,
    fs.scenario_name,
    fac.fiscal_year,
    COUNT(*) as period_count,
    
    -- Accuracy metrics
    AVG(fac.forecast_accuracy_score) as avg_accuracy_score,
    AVG(fac.mean_absolute_percentage_error) as avg_mape,
    AVG(fac.revenue_variance_percentage) as avg_revenue_variance,
    AVG(fac.net_income_variance_percentage) as avg_income_variance,
    
    -- Variance ranges
    MIN(fac.revenue_variance_percentage) as min_revenue_variance,
    MAX(fac.revenue_variance_percentage) as max_revenue_variance,
    
    fac.created_at as last_updated
    
FROM forecast_actual_comparisons fac
JOIN forecast_scenarios fs ON fac.scenario_id = fs.id
GROUP BY fac.business_account_id, fs.scenario_name, fac.fiscal_year, fac.created_at;

-- Database Functions

-- Function to calculate common size statements
CREATE OR REPLACE FUNCTION calculate_common_size_statements(
    p_business_account_id UUID,
    p_fiscal_year INTEGER,
    p_fiscal_quarter INTEGER DEFAULT NULL,
    p_fiscal_month INTEGER DEFAULT NULL,
    p_data_source VARCHAR DEFAULT 'ACTUAL'
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_total_revenue DECIMAL(20,4);
    v_total_assets DECIMAL(20,4);
    v_total_liabilities_equity DECIMAL(20,4);
BEGIN
    -- Get total revenue for common size income statement
    IF p_data_source = 'ACTUAL' THEN
        SELECT COALESCE(SUM(CASE WHEN ca.account_type = 'REVENUE' THEN ft.amount ELSE 0 END), 0)
        INTO v_total_revenue
        FROM financial_transactions ft
        JOIN chart_of_accounts ca ON ft.account_id = ca.id
        JOIN fiscal_periods fp ON ft.fiscal_period_id = fp.id
        WHERE ft.business_account_id = p_business_account_id
        AND fp.fiscal_year = p_fiscal_year
        AND (p_fiscal_quarter IS NULL OR fp.fiscal_quarter = p_fiscal_quarter)
        AND (p_fiscal_month IS NULL OR fp.fiscal_month = p_fiscal_month);
    ELSE
        -- Use forecast data
        SELECT COALESCE(SUM(fis.revenue), 0)
        INTO v_total_revenue
        FROM forecast_income_statements fis
        JOIN forecast_periods fp ON fis.period_id = fp.id
        WHERE fis.business_account_id = p_business_account_id
        AND fp.fiscal_year = p_fiscal_year
        AND (p_fiscal_quarter IS NULL OR fp.fiscal_quarter = p_fiscal_quarter)
        AND (p_fiscal_month IS NULL OR fp.fiscal_month = p_fiscal_month);
    END IF;
    
    -- Get total assets for common size balance sheet
    IF p_data_source = 'ACTUAL' THEN
        -- Calculate from actual balance sheet
        SELECT COALESCE(MAX(total_assets), 0)
        INTO v_total_assets
        FROM balance_sheets bs
        JOIN fiscal_periods fp ON bs.fiscal_period_id = fp.id
        WHERE bs.business_account_id = p_business_account_id
        AND fp.fiscal_year = p_fiscal_year
        AND (p_fiscal_quarter IS NULL OR fp.fiscal_quarter = p_fiscal_quarter)
        AND (p_fiscal_month IS NULL OR fp.fiscal_month = p_fiscal_month);
    ELSE
        -- Use forecast data
        SELECT COALESCE(SUM(fbs.total_assets), 0)
        INTO v_total_assets
        FROM forecast_balance_sheets fbs
        JOIN forecast_periods fp ON fbs.period_id = fp.id
        WHERE fbs.business_account_id = p_business_account_id
        AND fp.fiscal_year = p_fiscal_year
        AND (p_fiscal_quarter IS NULL OR fp.fiscal_quarter = p_fiscal_quarter)
        AND (p_fiscal_month IS NULL OR fp.fiscal_month = p_fiscal_month);
    END IF;
    
    -- Build common size income statement
    v_result := jsonb_build_object(
        'income_statement', jsonb_build_object(
            'revenue', CASE WHEN v_total_revenue > 0 THEN 100.0 ELSE 0 END,
            'cost_of_goods_sold', CASE WHEN v_total_revenue > 0 THEN 
                (SELECT COALESCE(SUM(CASE WHEN ca.account_type = 'EXPENSE' AND ca.name LIKE '%COGS%' THEN ft.amount ELSE 0 END), 0) * 100.0 / v_total_revenue) ELSE 0 END,
            'gross_profit', CASE WHEN v_total_revenue > 0 THEN 
                (v_total_revenue - COALESCE(SUM(CASE WHEN ca.account_type = 'EXPENSE' AND ca.name LIKE '%COGS%' THEN ft.amount ELSE 0 END), 0)) * 100.0 / v_total_revenue ELSE 0 END,
            'operating_expenses', CASE WHEN v_total_revenue > 0 THEN 
                (SELECT COALESCE(SUM(CASE WHEN ca.account_type = 'EXPENSE' AND ca.name NOT LIKE '%COGS%' THEN ft.amount ELSE 0 END), 0) * 100.0 / v_total_revenue) ELSE 0 END,
            'operating_income', CASE WHEN v_total_revenue > 0 THEN 
                (v_total_revenue - COALESCE(SUM(CASE WHEN ca.account_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0)) * 100.0 / v_total_revenue ELSE 0 END,
            'net_income', CASE WHEN v_total_revenue > 0 THEN 
                (v_total_revenue - COALESCE(SUM(CASE WHEN ca.account_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0)) * 100.0 / v_total_revenue ELSE 0 END
        ),
        'balance_sheet', jsonb_build_object(
            'total_assets', CASE WHEN v_total_assets > 0 THEN 100.0 ELSE 0 END,
            'current_assets', CASE WHEN v_total_assets > 0 THEN 
                (SELECT COALESCE(SUM(CASE WHEN ca.account_category = 'CURRENT_ASSET' THEN ft.amount ELSE 0 END), 0) * 100.0 / v_total_assets) ELSE 0 END,
            'fixed_assets', CASE WHEN v_total_assets > 0 THEN 
                (SELECT COALESCE(SUM(CASE WHEN ca.account_category = 'FIXED_ASSET' THEN ft.amount ELSE 0 END), 0) * 100.0 / v_total_assets) ELSE 0 END,
            'current_liabilities', CASE WHEN v_total_assets > 0 THEN 
                (SELECT COALESCE(SUM(CASE WHEN ca.account_category = 'CURRENT_LIABILITY' THEN ft.amount ELSE 0 END), 0) * 100.0 / v_total_assets) ELSE 0 END,
            'long_term_liabilities', CASE WHEN v_total_assets > 0 THEN 
                (SELECT COALESCE(SUM(CASE WHEN ca.account_category = 'LONG_TERM_LIABILITY' THEN ft.amount ELSE 0 END), 0) * 100.0 / v_total_assets) ELSE 0 END,
            'equity', CASE WHEN v_total_assets > 0 THEN 
                (SELECT COALESCE(SUM(CASE WHEN ca.account_category = 'EQUITY' THEN ft.amount ELSE 0 END), 0) * 100.0 / v_total_assets) ELSE 0 END
        )
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate financial ratios
CREATE OR REPLACE FUNCTION calculate_financial_ratios(
    p_business_account_id UUID,
    p_fiscal_year INTEGER,
    p_fiscal_quarter INTEGER DEFAULT NULL,
    p_fiscal_month INTEGER DEFAULT NULL,
    p_data_source VARCHAR DEFAULT 'ACTUAL'
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_revenue DECIMAL(20,4);
    v_cogs DECIMAL(20,4);
    v_gross_profit DECIMAL(20,4);
    v_operating_income DECIMAL(20,4);
    v_net_income DECIMAL(20,4);
    v_current_assets DECIMAL(20,4);
    v_current_liabilities DECIMAL(20,4);
    v_total_assets DECIMAL(20,4);
    v_total_equity DECIMAL(20,4);
    v_total_liabilities DECIMAL(20,4);
    v_inventory DECIMAL(20,4);
    v_receivables DECIMAL(20,4);
    v_interest_expense DECIMAL(20,4);
BEGIN
    -- Get financial data based on source
    IF p_data_source = 'ACTUAL' THEN
        -- Get from actual financial statements
        SELECT 
            COALESCE(SUM(CASE WHEN ca.account_type = 'REVENUE' THEN ft.amount ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN ca.account_type = 'EXPENSE' AND ca.name LIKE '%COGS%' THEN ft.amount ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN ca.account_type = 'EXPENSE' AND ca.name LIKE '%INTEREST%' THEN ft.amount ELSE 0 END), 0)
        INTO v_revenue, v_cogs, v_interest_expense
        FROM financial_transactions ft
        JOIN chart_of_accounts ca ON ft.account_id = ca.id
        JOIN fiscal_periods fp ON ft.fiscal_period_id = fp.id
        WHERE ft.business_account_id = p_business_account_id
        AND fp.fiscal_year = p_fiscal_year
        AND (p_fiscal_quarter IS NULL OR fp.fiscal_quarter = p_fiscal_quarter)
        AND (p_fiscal_month IS NULL OR fp.fiscal_month = p_fiscal_month);
        
        -- Get balance sheet data
        SELECT 
            COALESCE(MAX(current_assets), 0),
            COALESCE(MAX(current_liabilities), 0),
            COALESCE(MAX(total_assets), 0),
            COALESCE(MAX(total_equity), 0),
            COALESCE(MAX(total_liabilities), 0),
            COALESCE(MAX(inventory), 0),
            COALESCE(MAX(accounts_receivable), 0)
        INTO v_current_assets, v_current_liabilities, v_total_assets, v_total_equity, v_total_liabilities, v_inventory, v_receivables
        FROM balance_sheets bs
        JOIN fiscal_periods fp ON bs.fiscal_period_id = fp.id
        WHERE bs.business_account_id = p_business_account_id
        AND fp.fiscal_year = p_fiscal_year
        AND (p_fiscal_quarter IS NULL OR fp.fiscal_quarter = p_fiscal_quarter)
        AND (p_fiscal_month IS NULL OR fp.fiscal_month = p_fiscal_month);
    ELSE
        -- Get from forecast data
        SELECT 
            COALESCE(SUM(fis.revenue), 0),
            COALESCE(SUM(fis.costOfGoodsSold), 0),
            COALESCE(SUM(fis.interestExpense), 0)
        INTO v_revenue, v_cogs, v_interest_expense
        FROM forecast_income_statements fis
        JOIN forecast_periods fp ON fis.period_id = fp.id
        WHERE fis.business_account_id = p_business_account_id
        AND fp.fiscal_year = p_fiscal_year
        AND (p_fiscal_quarter IS NULL OR fp.fiscal_quarter = p_fiscal_quarter)
        AND (p_fiscal_month IS NULL OR fp.fiscal_month = p_fiscal_month);
        
        SELECT 
            COALESCE(SUM(fbs.currentAssets), 0),
            COALESCE(SUM(fbs.currentLiabilities), 0),
            COALESCE(SUM(fbs.totalAssets), 0),
            COALESCE(SUM(fbs.totalEquity), 0),
            COALESCE(SUM(fbs.totalLiabilities), 0),
            COALESCE(SUM(fbs.inventory), 0),
            COALESCE(SUM(fbs.accountsReceivable), 0)
        INTO v_current_assets, v_current_liabilities, v_total_assets, v_total_equity, v_total_liabilities, v_inventory, v_receivables
        FROM forecast_balance_sheets fbs
        JOIN forecast_periods fp ON fbs.period_id = fp.id
        WHERE fbs.business_account_id = p_business_account_id
        AND fp.fiscal_year = p_fiscal_year
        AND (p_fiscal_quarter IS NULL OR fp.fiscal_quarter = p_fiscal_quarter)
        AND (p_fiscal_month IS NULL OR fp.fiscal_month = p_fiscal_month);
    END IF;
    
    -- Calculate derived values
    v_gross_profit := v_revenue - v_cogs;
    v_operating_income := v_gross_profit - (v_cogs * 0.3); -- Simplified operating expenses
    
    -- Build ratios JSON
    v_result := jsonb_build_object(
        'profitability_ratios', jsonb_build_object(
            'gross_profit_margin', CASE WHEN v_revenue > 0 THEN (v_gross_profit / v_revenue) * 100 ELSE 0 END,
            'net_profit_margin', CASE WHEN v_revenue > 0 THEN (v_net_income / v_revenue) * 100 ELSE 0 END,
            'return_on_assets', CASE WHEN v_total_assets > 0 THEN (v_net_income / v_total_assets) * 100 ELSE 0 END,
            'return_on_equity', CASE WHEN v_total_equity > 0 THEN (v_net_income / v_total_equity) * 100 ELSE 0 END
        ),
        'liquidity_ratios', jsonb_build_object(
            'current_ratio', CASE WHEN v_current_liabilities > 0 THEN v_current_assets / v_current_liabilities ELSE 0 END,
            'quick_ratio', CASE WHEN v_current_liabilities > 0 THEN (v_current_assets - v_inventory) / v_current_liabilities ELSE 0 END,
            'cash_ratio', CASE WHEN v_current_liabilities > 0 THEN (v_current_assets - v_inventory - v_receivables) / v_current_liabilities ELSE 0 END
        ),
        'asset_turnover_ratios', jsonb_build_object(
            'asset_turnover', CASE WHEN v_total_assets > 0 THEN v_revenue / v_total_assets ELSE 0 END,
            'inventory_turnover', CASE WHEN v_inventory > 0 THEN v_cogs / v_inventory ELSE 0 END,
            'receivables_turnover', CASE WHEN v_receivables > 0 THEN v_revenue / v_receivables ELSE 0 END
        ),
        'leverage_ratios', jsonb_build_object(
            'debt_to_equity', CASE WHEN v_total_equity > 0 THEN v_total_liabilities / v_total_equity ELSE 0 END,
            'debt_to_assets', CASE WHEN v_total_assets > 0 THEN v_total_liabilities / v_total_assets ELSE 0 END,
            'interest_coverage', CASE WHEN v_interest_expense > 0 THEN v_operating_income / v_interest_expense ELSE 0 END
        )
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh financial analysis views
CREATE OR REPLACE FUNCTION refresh_financial_analysis_views() RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_analysis_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trend_analysis_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_forecast_accuracy_summary;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_financial_analysis_results_updated_at
    BEFORE UPDATE ON financial_analysis_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_financial_analysis_results_business_account ON financial_analysis_results(business_account_id);
CREATE INDEX IF NOT EXISTS idx_financial_analysis_results_type_period ON financial_analysis_results(analysis_type, analysis_period_type);
CREATE INDEX IF NOT EXISTS idx_financial_analysis_results_fiscal ON financial_analysis_results(fiscal_year, fiscal_quarter, fiscal_month);
CREATE INDEX IF NOT EXISTS idx_trend_analysis_periods_business_metric ON trend_analysis_periods(business_account_id, metric_name);
CREATE INDEX IF NOT EXISTS idx_forecast_actual_comparisons_business_scenario ON forecast_actual_comparisons(business_account_id, scenario_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_insights_result ON ai_analysis_insights(analysis_result_id);

-- Insert default ratio definitions
INSERT INTO financial_ratio_definitions (ratio_name, ratio_category, ratio_formula, description, numerator_accounts, denominator_accounts) VALUES
('Gross Profit Margin', 'PROFITABILITY', '(Revenue - COGS) / Revenue * 100', 'Measures the proportion of revenue left after accounting for the cost of goods sold', ARRAY['Revenue'], ARRAY['Cost of Goods Sold']),
('Net Profit Margin', 'PROFITABILITY', 'Net Income / Revenue * 100', 'Measures how much of each dollar of revenue is converted into profit', ARRAY['Net Income'], ARRAY['Revenue']),
('Return on Assets', 'PROFITABILITY', 'Net Income / Total Assets * 100', 'Measures how efficiently a company uses its assets to generate earnings', ARRAY['Net Income'], ARRAY['Total Assets']),
('Return on Equity', 'PROFITABILITY', 'Net Income / Total Equity * 100', 'Measures the rate of return on the ownership interest', ARRAY['Net Income'], ARRAY['Total Equity']),
('Current Ratio', 'LIQUIDITY', 'Current Assets / Current Liabilities', 'Measures the ability to pay short-term obligations', ARRAY['Current Assets'], ARRAY['Current Liabilities']),
('Quick Ratio', 'LIQUIDITY', '(Current Assets - Inventory) / Current Liabilities', 'Measures the ability to pay short-term obligations without relying on inventory', ARRAY['Current Assets', 'Inventory'], ARRAY['Current Liabilities']),
('Cash Ratio', 'LIQUIDITY', 'Cash and Cash Equivalents / Current Liabilities', 'Measures the ability to pay short-term obligations with cash only', ARRAY['Cash and Cash Equivalents'], ARRAY['Current Liabilities']),
('Asset Turnover', 'ASSET_TURNOVER', 'Revenue / Total Assets', 'Measures how efficiently a company uses its assets to generate revenue', ARRAY['Revenue'], ARRAY['Total Assets']),
('Inventory Turnover', 'ASSET_TURNOVER', 'Cost of Goods Sold / Inventory', 'Measures how many times a company''s inventory is sold over a period', ARRAY['Cost of Goods Sold'], ARRAY['Inventory']),
('Receivables Turnover', 'ASSET_TURNOVER', 'Revenue / Accounts Receivable', 'Measures how efficiently a company collects its receivables', ARRAY['Revenue'], ARRAY['Accounts Receivable']),
('Debt to Equity', 'LEVERAGE', 'Total Liabilities / Total Equity', 'Measures a company''s financial leverage', ARRAY['Total Liabilities'], ARRAY['Total Equity']),
('Debt to Assets', 'LEVERAGE', 'Total Liabilities / Total Assets', 'Measures the proportion of a company''s assets that are financed by debt', ARRAY['Total Liabilities'], ARRAY['Total Assets']),
('Interest Coverage', 'LEVERAGE', 'Operating Income / Interest Expense', 'Measures a company''s ability to pay interest on its debt', ARRAY['Operating Income'], ARRAY['Interest Expense'])
ON CONFLICT (ratio_name) DO NOTHING;

-- Set permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_analysis_results TO ai_business_service_role;
GRANT SELECT ON financial_ratio_definitions TO ai_business_service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON trend_analysis_periods TO ai_business_service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON forecast_actual_comparisons TO ai_business_service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_analysis_insights TO ai_business_service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ai_business_service_role;
GRANT EXECUTE ON FUNCTION calculate_common_size_statements TO ai_business_service_role;
GRANT EXECUTE ON FUNCTION calculate_financial_ratios TO ai_business_service_role;
GRANT EXECUTE ON FUNCTION refresh_financial_analysis_views TO ai_business_service_role;
