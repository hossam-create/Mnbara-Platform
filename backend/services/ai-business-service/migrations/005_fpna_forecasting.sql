-- Sprint 4: FP&A + Forecast Engine
-- Financial assumptions, forecasting, and multi-year projections

-- Financial Assumptions Table
CREATE TABLE IF NOT EXISTS financial_assumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_account(id) ON DELETE CASCADE,
    assumption_category VARCHAR(50) NOT NULL, -- 'REVENUE', 'EXPENSE', 'BALANCE_SHEET', 'CASH_FLOW'
    assumption_name VARCHAR(100) NOT NULL,
    assumption_key VARCHAR(100) NOT NULL,
    assumption_value DECIMAL(20,4) NOT NULL,
    assumption_type VARCHAR(20) NOT NULL, -- 'PERCENTAGE', 'AMOUNT', 'GROWTH_RATE', 'DAYS'
    unit_of_measure VARCHAR(20), -- 'PERCENT', 'DOLLARS', 'DAYS', 'RATIO'
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_editable BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    version INTEGER DEFAULT 1,
    UNIQUE(business_account_id, assumption_key, version)
);

-- Forecast Scenarios Table
CREATE TABLE IF NOT EXISTS forecast_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_account(id) ON DELETE CASCADE,
    scenario_name VARCHAR(100) NOT NULL,
    scenario_type VARCHAR(20) NOT NULL DEFAULT 'CUSTOM', -- 'BASE', 'OPTIMISTIC', 'PESSIMISTIC', 'CUSTOM'
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    UNIQUE(business_account_id, scenario_name)
);

-- Forecast Periods Table
CREATE TABLE IF NOT EXISTS forecast_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_account(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES forecast_scenarios(id) ON DELETE CASCADE,
    period_type VARCHAR(20) NOT NULL, -- 'MONTHLY', 'QUARTERLY', 'YEARLY'
    fiscal_year INTEGER NOT NULL,
    fiscal_quarter INTEGER,
    fiscal_month INTEGER,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    is_actual BOOLEAN DEFAULT false,
    is_forecast BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_account_id, scenario_id, period_type, fiscal_year, fiscal_quarter, fiscal_month)
);

-- Forecast Income Statements Table
CREATE TABLE IF NOT EXISTS forecast_income_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_account(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES forecast_scenarios(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES forecast_periods(id) ON DELETE CASCADE,
    revenue DECIMAL(20,2) NOT NULL DEFAULT 0,
    cost_of_goods_sold DECIMAL(20,2) NOT NULL DEFAULT 0,
    gross_profit DECIMAL(20,2) NOT NULL DEFAULT 0,
    operating_expenses DECIMAL(20,2) NOT NULL DEFAULT 0,
    operating_income DECIMAL(20,2) NOT NULL DEFAULT 0,
    interest_expense DECIMAL(20,2) NOT NULL DEFAULT 0,
    tax_expense DECIMAL(20,2) NOT NULL DEFAULT 0,
    net_income DECIMAL(20,2) NOT NULL DEFAULT 0,
    gross_profit_margin DECIMAL(10,4) NOT NULL DEFAULT 0,
    operating_margin DECIMAL(10,4) NOT NULL DEFAULT 0,
    net_profit_margin DECIMAL(10,4) NOT NULL DEFAULT 0,
    forecast_method VARCHAR(50), -- 'PERCENTAGE_OF_SALES', 'GROWTH_BASED', 'TREND_BASED'
    confidence_score DECIMAL(5,2), -- 0-100
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    UNIQUE(business_account_id, scenario_id, period_id)
);

-- Forecast Balance Sheets Table
CREATE TABLE IF NOT EXISTS forecast_balance_sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_account(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES forecast_scenarios(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES forecast_periods(id) ON DELETE CASCADE,
    cash_and_equivalents DECIMAL(20,2) NOT NULL DEFAULT 0,
    accounts_receivable DECIMAL(20,2) NOT NULL DEFAULT 0,
    inventory DECIMAL(20,2) NOT NULL DEFAULT 0,
    current_assets DECIMAL(20,2) NOT NULL DEFAULT 0,
    fixed_assets DECIMAL(20,2) NOT NULL DEFAULT 0,
    intangible_assets DECIMAL(20,2) NOT NULL DEFAULT 0,
    total_assets DECIMAL(20,2) NOT NULL DEFAULT 0,
    accounts_payable DECIMAL(20,2) NOT NULL DEFAULT 0,
    current_liabilities DECIMAL(20,2) NOT NULL DEFAULT 0,
    long_term_debt DECIMAL(20,2) NOT NULL DEFAULT 0,
    total_liabilities DECIMAL(20,2) NOT NULL DEFAULT 0,
    retained_earnings DECIMAL(20,2) NOT NULL DEFAULT 0,
    common_stock DECIMAL(20,2) NOT NULL DEFAULT 0,
    total_equity DECIMAL(20,2) NOT NULL DEFAULT 0,
    working_capital DECIMAL(20,2) NOT NULL DEFAULT 0,
    debt_to_equity_ratio DECIMAL(10,4) NOT NULL DEFAULT 0,
    current_ratio DECIMAL(10,4) NOT NULL DEFAULT 0,
    forecast_method VARCHAR(50),
    confidence_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    UNIQUE(business_account_id, scenario_id, period_id)
);

-- Forecast Cash Flow Statements Table
CREATE TABLE IF NOT EXISTS forecast_cash_flow_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_account(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES forecast_scenarios(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES forecast_periods(id) ON DELETE CASCADE,
    net_income DECIMAL(20,2) NOT NULL DEFAULT 0,
    depreciation_amortization DECIMAL(20,2) NOT NULL DEFAULT 0,
    changes_in_working_capital DECIMAL(20,2) NOT NULL DEFAULT 0,
    operating_cash_flow DECIMAL(20,2) NOT NULL DEFAULT 0,
    capital_expenditures DECIMAL(20,2) NOT NULL DEFAULT 0,
    acquisitions_dispositions DECIMAL(20,2) NOT NULL DEFAULT 0,
    investing_cash_flow DECIMAL(20,2) NOT NULL DEFAULT 0,
    debt_issuance_repayment DECIMAL(20,2) NOT NULL DEFAULT 0,
    equity_issuance_repurchase DECIMAL(20,2) NOT NULL DEFAULT 0,
    dividends_paid DECIMAL(20,2) NOT NULL DEFAULT 0,
    financing_cash_flow DECIMAL(20,2) NOT NULL DEFAULT 0,
    net_cash_flow DECIMAL(20,2) NOT NULL DEFAULT 0,
    beginning_cash DECIMAL(20,2) NOT NULL DEFAULT 0,
    ending_cash DECIMAL(20,2) NOT NULL DEFAULT 0,
    cash_conversion_cycle DECIMAL(10,2) NOT NULL DEFAULT 0,
    forecast_method VARCHAR(50),
    confidence_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    UNIQUE(business_account_id, scenario_id, period_id)
);

-- Forecast Assumptions History Table
CREATE TABLE IF NOT EXISTS forecast_assumptions_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_account(id) ON DELETE CASCADE,
    assumption_id UUID REFERENCES financial_assumptions(id) ON DELETE CASCADE,
    scenario_id UUID REFERENCES forecast_scenarios(id) ON DELETE CASCADE,
    assumption_key VARCHAR(100) NOT NULL,
    old_value DECIMAL(20,4),
    new_value DECIMAL(20,4) NOT NULL,
    change_reason TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    changed_by UUID REFERENCES users(id)
);

-- Forecast Validation Rules Table
CREATE TABLE IF NOT EXISTS forecast_validation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_account(id) ON DELETE CASCADE,
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'BALANCE_SHEET', 'CASH_FLOW', 'RATIO', 'TREND'
    rule_expression TEXT NOT NULL, -- SQL expression or formula
    error_message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    severity VARCHAR(20) DEFAULT 'ERROR', -- 'ERROR', 'WARNING', 'INFO'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Forecast Validation Results Table
CREATE TABLE IF NOT EXISTS forecast_validation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_account_id UUID NOT NULL REFERENCES business_account(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES forecast_scenarios(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES forecast_periods(id) ON DELETE CASCADE,
    rule_id UUID NOT NULL REFERENCES forecast_validation_rules(id) ON DELETE CASCADE,
    validation_status VARCHAR(20) NOT NULL, -- 'PASSED', 'FAILED', 'WARNING'
    actual_value DECIMAL(20,4),
    expected_value DECIMAL(20,4),
    variance DECIMAL(20,4),
    variance_percentage DECIMAL(10,4),
    error_details TEXT,
    validated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_account_id, scenario_id, period_id, rule_id)
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_financial_assumptions_business_account ON financial_assumptions(business_account_id);
CREATE INDEX IF NOT EXISTS idx_financial_assumptions_category ON financial_assumptions(assumption_category);
CREATE INDEX IF NOT EXISTS idx_financial_assumptions_key ON financial_assumptions(assumption_key);

CREATE INDEX IF NOT EXISTS idx_forecast_scenarios_business_account ON forecast_scenarios(business_account_id);
CREATE INDEX IF NOT EXISTS idx_forecast_scenarios_type ON forecast_scenarios(scenario_type);
CREATE INDEX IF NOT EXISTS idx_forecast_scenarios_active ON forecast_scenarios(is_active);

CREATE INDEX IF NOT EXISTS idx_forecast_periods_business_account ON forecast_periods(business_account_id);
CREATE INDEX IF NOT EXISTS idx_forecast_periods_scenario ON forecast_periods(scenario_id);
CREATE INDEX IF NOT EXISTS idx_forecast_periods_period ON forecast_periods(period_type, fiscal_year, fiscal_quarter, fiscal_month);
CREATE INDEX IF NOT EXISTS idx_forecast_periods_dates ON forecast_periods(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_forecast_income_statements_business_account ON forecast_income_statements(business_account_id);
CREATE INDEX IF NOT EXISTS idx_forecast_income_statements_scenario ON forecast_income_statements(scenario_id);
CREATE INDEX IF NOT EXISTS idx_forecast_income_statements_period ON forecast_income_statements(period_id);

CREATE INDEX IF NOT EXISTS idx_forecast_balance_sheets_business_account ON forecast_balance_sheets(business_account_id);
CREATE INDEX IF NOT EXISTS idx_forecast_balance_sheets_scenario ON forecast_balance_sheets(scenario_id);
CREATE INDEX IF NOT EXISTS idx_forecast_balance_sheets_period ON forecast_balance_sheets(period_id);

CREATE INDEX IF NOT EXISTS idx_forecast_cash_flow_statements_business_account ON forecast_cash_flow_statements(business_account_id);
CREATE INDEX IF NOT EXISTS idx_forecast_cash_flow_statements_scenario ON forecast_cash_flow_statements(scenario_id);
CREATE INDEX IF NOT EXISTS idx_forecast_cash_flow_statements_period ON forecast_cash_flow_statements(period_id);

CREATE INDEX IF NOT EXISTS idx_forecast_assumptions_history_business_account ON forecast_assumptions_history(business_account_id);
CREATE INDEX IF NOT EXISTS idx_forecast_assumptions_history_assumption ON forecast_assumptions_history(assumption_id);
CREATE INDEX IF NOT EXISTS idx_forecast_assumptions_history_scenario ON forecast_assumptions_history(scenario_id);
CREATE INDEX IF NOT EXISTS idx_forecast_assumptions_history_changed_at ON forecast_assumptions_history(changed_at);

CREATE INDEX IF NOT EXISTS idx_forecast_validation_rules_business_account ON forecast_validation_rules(business_account_id);
CREATE INDEX IF NOT EXISTS idx_forecast_validation_rules_type ON forecast_validation_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_forecast_validation_rules_active ON forecast_validation_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_forecast_validation_results_business_account ON forecast_validation_results(business_account_id);
CREATE INDEX IF NOT EXISTS idx_forecast_validation_results_scenario ON forecast_validation_results(scenario_id);
CREATE INDEX IF NOT EXISTS idx_forecast_validation_results_period ON forecast_validation_results(period_id);
CREATE INDEX IF NOT EXISTS idx_forecast_validation_results_rule ON forecast_validation_results(rule_id);

-- Create Materialized Views for Forecast Performance
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_forecast_summary AS
SELECT 
    fs.business_account_id,
    fs.id as scenario_id,
    fs.scenario_name,
    fs.scenario_type,
    COUNT(DISTINCT fp.id) as total_periods,
    COUNT(DISTINCT CASE WHEN fp.is_actual = true THEN fp.id END) as actual_periods,
    COUNT(DISTINCT CASE WHEN fp.is_forecast = true THEN fp.id END) as forecast_periods,
    COALESCE(SUM(fis.revenue), 0) as total_forecast_revenue,
    COALESCE(SUM(fis.net_income), 0) as total_forecast_net_income,
    COALESCE(AVG(fis.net_profit_margin), 0) as avg_forecast_net_margin,
    COALESCE(SUM(fbs.total_assets), 0) as total_forecast_assets,
    COALESCE(SUM(fcs.ending_cash), 0) as total_forecast_ending_cash,
    MAX(fp.period_end) as latest_period_end,
    MIN(fp.period_start) as earliest_period_start
FROM forecast_scenarios fs
LEFT JOIN forecast_periods fp ON fs.id = fp.scenario_id
LEFT JOIN forecast_income_statements fis ON fp.id = fis.period_id
LEFT JOIN forecast_balance_sheets fbs ON fp.id = fbs.period_id
LEFT JOIN forecast_cash_flow_statements fcs ON fp.id = fcs.period_id
WHERE fs.is_active = true
GROUP BY fs.business_account_id, fs.id, fs.scenario_name, fs.scenario_type;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_forecast_vs_actual AS
SELECT 
    fs.business_account_id,
    fs.id as scenario_id,
    fs.scenario_name,
    fp.fiscal_year,
    fp.fiscal_quarter,
    fp.fiscal_month,
    fp.period_start,
    fp.period_end,
    -- Income Statement Variance
    COALESCE(fis.revenue, 0) as forecast_revenue,
    COALESCE(actual_fis.revenue, 0) as actual_revenue,
    COALESCE(fis.revenue, 0) - COALESCE(actual_fis.revenue, 0) as revenue_variance,
    CASE WHEN COALESCE(actual_fis.revenue, 0) != 0 
         THEN ((COALESCE(fis.revenue, 0) - COALESCE(actual_fis.revenue, 0)) / COALESCE(actual_fis.revenue, 0)) * 100 
         ELSE 0 END as revenue_variance_pct,
    COALESCE(fis.net_income, 0) as forecast_net_income,
    COALESCE(actual_fis.net_income, 0) as actual_net_income,
    COALESCE(fis.net_income, 0) - COALESCE(actual_fis.net_income, 0) as net_income_variance,
    CASE WHEN COALESCE(actual_fis.net_income, 0) != 0 
         THEN ((COALESCE(fis.net_income, 0) - COALESCE(actual_fis.net_income, 0)) / COALESCE(actual_fis.net_income, 0)) * 100 
         ELSE 0 END as net_income_variance_pct,
    -- Balance Sheet Variance
    COALESCE(fbs.total_assets, 0) as forecast_total_assets,
    COALESCE(actual_fbs.total_assets, 0) as actual_total_assets,
    COALESCE(fbs.total_assets, 0) - COALESCE(actual_fbs.total_assets, 0) as assets_variance,
    CASE WHEN COALESCE(actual_fbs.total_assets, 0) != 0 
         THEN ((COALESCE(fbs.total_assets, 0) - COALESCE(actual_fbs.total_assets, 0)) / COALESCE(actual_fbs.total_assets, 0)) * 100 
         ELSE 0 END as assets_variance_pct
FROM forecast_scenarios fs
JOIN forecast_periods fp ON fs.id = fp.scenario_id
LEFT JOIN forecast_income_statements fis ON fp.id = fis.period_id
LEFT JOIN forecast_balance_sheets fbs ON fp.id = fbs.period_id
LEFT JOIN forecast_periods actual_fp ON fp.business_account_id = actual_fp.business_account_id 
    AND fp.period_type = actual_fp.period_type 
    AND fp.fiscal_year = actual_fp.fiscal_year 
    AND COALESCE(fp.fiscal_quarter, 0) = COALESCE(actual_fp.fiscal_quarter, 0)
    AND COALESCE(fp.fiscal_month, 0) = COALESCE(actual_fp.fiscal_month, 0)
    AND actual_fp.is_actual = true
LEFT JOIN forecast_income_statements actual_fis ON actual_fp.id = actual_fis.period_id
LEFT JOIN forecast_balance_sheets actual_fbs ON actual_fp.id = actual_fbs.period_id
WHERE fs.is_active = true
  AND fp.is_forecast = true;

-- Create Functions for Forecast Calculations

-- Function to create default financial assumptions
CREATE OR REPLACE FUNCTION create_default_financial_assumptions(p_business_account_id UUID, p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    assumption_count INTEGER := 0;
BEGIN
    -- Revenue Assumptions
    INSERT INTO financial_assumptions (business_account_id, assumption_category, assumption_name, assumption_key, assumption_value, assumption_type, unit_of_measure, description, created_by)
    VALUES 
        (p_business_account_id, 'REVENUE', 'Revenue Growth Rate', 'revenue_growth_rate', 10.0, 'GROWTH_RATE', 'PERCENT', 'Annual revenue growth rate assumption', p_user_id),
        (p_business_account_id, 'REVENUE', 'Seasonality Factor Q1', 'seasonality_q1', 0.85, 'PERCENTAGE', 'PERCENT', 'Q1 seasonality factor relative to average', p_user_id),
        (p_business_account_id, 'REVENUE', 'Seasonality Factor Q2', 'seasonality_q2', 0.95, 'PERCENTAGE', 'PERCENT', 'Q2 seasonality factor relative to average', p_user_id),
        (p_business_account_id, 'REVENUE', 'Seasonality Factor Q3', 'seasonality_q3', 1.05, 'PERCENTAGE', 'PERCENT', 'Q3 seasonality factor relative to average', p_user_id),
        (p_business_account_id, 'REVENUE', 'Seasonality Factor Q4', 'seasonality_q4', 1.15, 'PERCENTAGE', 'PERCENT', 'Q4 seasonality factor relative to average', p_user_id)
    ON CONFLICT (business_account_id, assumption_key, version) DO NOTHING;
    
    GET DIAGNOSTICS assumption_count = ROW_COUNT;
    
    -- Expense Assumptions
    INSERT INTO financial_assumptions (business_account_id, assumption_category, assumption_name, assumption_key, assumption_value, assumption_type, unit_of_measure, description, created_by)
    VALUES 
        (p_business_account_id, 'EXPENSE', 'COGS as % of Revenue', 'cogs_percentage', 65.0, 'PERCENTAGE', 'PERCENT', 'Cost of goods sold as percentage of revenue', p_user_id),
        (p_business_account_id, 'EXPENSE', 'Operating Expense Growth Rate', 'opex_growth_rate', 5.0, 'GROWTH_RATE', 'PERCENT', 'Annual operating expense growth rate', p_user_id),
        (p_business_account_id, 'EXPENSE', 'SG&A as % of Revenue', 'sga_percentage', 15.0, 'PERCENTAGE', 'PERCENT', 'SG&A expenses as percentage of revenue', p_user_id),
        (p_business_account_id, 'EXPENSE', 'R&D as % of Revenue', 'rd_percentage', 8.0, 'PERCENTAGE', 'PERCENT', 'R&D expenses as percentage of revenue', p_user_id),
        (p_business_account_id, 'EXPENSE', 'Marketing as % of Revenue', 'marketing_percentage', 10.0, 'PERCENTAGE', 'PERCENT', 'Marketing expenses as percentage of revenue', p_user_id)
    ON CONFLICT (business_account_id, assumption_key, version) DO NOTHING;
    
    GET DIAGNOSTICS assumption_count = ROW_COUNT + assumption_count;
    
    -- Balance Sheet Assumptions
    INSERT INTO financial_assumptions (business_account_id, assumption_category, assumption_name, assumption_key, assumption_value, assumption_type, unit_of_measure, description, created_by)
    VALUES 
        (p_business_account_id, 'BALANCE_SHEET', 'Days Sales Outstanding', 'dso', 45.0, 'DAYS', 'DAYS', 'Average days to collect accounts receivable', p_user_id),
        (p_business_account_id, 'BALANCE_SHEET', 'Days Inventory Outstanding', 'dio', 60.0, 'DAYS', 'DAYS', 'Average days inventory is held', p_user_id),
        (p_business_account_id, 'BALANCE_SHEET', 'Days Payable Outstanding', 'dpo', 30.0, 'DAYS', 'DAYS', 'Average days to pay accounts payable', p_user_id),
        (p_business_account_id, 'BALANCE_SHEET', 'Fixed Asset Turnover', 'fixed_asset_turnover', 3.0, 'RATIO', 'RATIO', 'Fixed asset turnover ratio', p_user_id),
        (p_business_account_id, 'BALANCE_SHEET', 'Debt to Equity Ratio', 'debt_to_equity', 0.5, 'RATIO', 'RATIO', 'Target debt to equity ratio', p_user_id)
    ON CONFLICT (business_account_id, assumption_key, version) DO NOTHING;
    
    GET DIAGNOSTICS assumption_count = ROW_COUNT + assumption_count;
    
    -- Cash Flow Assumptions
    INSERT INTO financial_assumptions (business_account_id, assumption_category, assumption_name, assumption_key, assumption_value, assumption_type, unit_of_measure, description, created_by)
    VALUES 
        (p_business_account_id, 'CASH_FLOW', 'Depreciation as % of Fixed Assets', 'depreciation_percentage', 10.0, 'PERCENTAGE', 'PERCENT', 'Annual depreciation as percentage of fixed assets', p_user_id),
        (p_business_account_id, 'CASH_FLOW', 'Capital Expenditure Growth Rate', 'capex_growth_rate', 8.0, 'GROWTH_RATE', 'PERCENT', 'Annual capital expenditure growth rate', p_user_id),
        (p_business_account_id, 'CASH_FLOW', 'Dividend Payout Ratio', 'dividend_payout_ratio', 30.0, 'PERCENTAGE', 'PERCENT', 'Dividend payout as percentage of net income', p_user_id),
        (p_business_account_id, 'CASH_FLOW', 'Tax Rate', 'tax_rate', 21.0, 'PERCENTAGE', 'PERCENT', 'Corporate tax rate', p_user_id),
        (p_business_account_id, 'CASH_FLOW', 'Interest Rate on Debt', 'interest_rate', 6.0, 'PERCENTAGE', 'PERCENT', 'Average interest rate on debt', p_user_id)
    ON CONFLICT (business_account_id, assumption_key, version) DO NOTHING;
    
    GET DIAGNOSTICS assumption_count = ROW_COUNT + assumption_count;
    
    RAISE NOTICE 'Created % default financial assumptions for business account %', assumption_count, p_business_account_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate forecast periods
CREATE OR REPLACE FUNCTION generate_forecast_periods(p_business_account_id UUID, p_scenario_id UUID, p_start_date DATE, p_end_date DATE, p_period_type VARCHAR(20))
RETURNS INTEGER AS $$
DECLARE
    current_date DATE := p_start_date;
    period_count INTEGER := 0;
    fiscal_year INTEGER;
    fiscal_quarter INTEGER;
    fiscal_month INTEGER;
BEGIN
    WHILE current_date <= p_end_date LOOP
        fiscal_year := EXTRACT(YEAR FROM current_date);
        fiscal_quarter := CEIL(EXTRACT(MONTH FROM current_date) / 3.0);
        fiscal_month := EXTRACT(MONTH FROM current_date);
        
        INSERT INTO forecast_periods (business_account_id, scenario_id, period_type, fiscal_year, fiscal_quarter, fiscal_month, period_start, period_end)
        VALUES (p_business_account_id, p_scenario_id, p_period_type, fiscal_year, fiscal_quarter, fiscal_month, current_date, current_date)
        ON CONFLICT (business_account_id, scenario_id, period_type, fiscal_year, fiscal_quarter, fiscal_month) DO NOTHING;
        
        GET DIAGNOSTICS period_count = ROW_COUNT;
        
        -- Move to next period
        IF p_period_type = 'MONTHLY' THEN
            current_date := current_date + INTERVAL '1 month';
        ELSIF p_period_type = 'QUARTERLY' THEN
            current_date := current_date + INTERVAL '3 months';
        ELSIF p_period_type = 'YEARLY' THEN
            current_date := current_date + INTERVAL '1 year';
        END IF;
    END LOOP;
    
    RETURN period_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate percentage of sales forecast
CREATE OR REPLACE FUNCTION calculate_percentage_of_sales_forecast(p_business_account_id UUID, p_scenario_id UUID, p_base_revenue DECIMAL(20,2))
RETURNS VOID AS $$
DECLARE
    period_record RECORD;
    cogs_percentage DECIMAL(10,4);
    sga_percentage DECIMAL(10,4);
    rd_percentage DECIMAL(10,4);
    marketing_percentage DECIMAL(10,4);
    tax_rate DECIMAL(10,4);
    forecast_revenue DECIMAL(20,2);
    forecast_cogs DECIMAL(20,2);
    forecast_sga DECIMAL(20,2);
    forecast_rd DECIMAL(20,2);
    forecast_marketing DECIMAL(20,2);
    forecast_opex DECIMAL(20,2);
    forecast_gross_profit DECIMAL(20,2);
    forecast_operating_income DECIMAL(20,2);
    forecast_tax_expense DECIMAL(20,2);
    forecast_net_income DECIMAL(20,2);
BEGIN
    -- Get assumption values
    SELECT assumption_value INTO cogs_percentage FROM financial_assumptions 
    WHERE business_account_id = p_business_account_id AND assumption_key = 'cogs_percentage' AND is_active = true;
    
    SELECT assumption_value INTO sga_percentage FROM financial_assumptions 
    WHERE business_account_id = p_business_account_id AND assumption_key = 'sga_percentage' AND is_active = true;
    
    SELECT assumption_value INTO rd_percentage FROM financial_assumptions 
    WHERE business_account_id = p_business_account_id AND assumption_key = 'rd_percentage' AND is_active = true;
    
    SELECT assumption_value INTO marketing_percentage FROM financial_assumptions 
    WHERE business_account_id = p_business_account_id AND assumption_key = 'marketing_percentage' AND is_active = true;
    
    SELECT assumption_value INTO tax_rate FROM financial_assumptions 
    WHERE business_account_id = p_business_account_id AND assumption_key = 'tax_rate' AND is_active = true;
    
    -- Process each forecast period
    FOR period_record IN 
        SELECT fp.* FROM forecast_periods fp 
        WHERE fp.business_account_id = p_business_account_id AND fp.scenario_id = p_scenario_id 
        ORDER BY fp.period_start
    LOOP
        -- Calculate forecast values based on percentage of sales
        forecast_revenue := p_base_revenue;
        forecast_cogs := forecast_revenue * (cogs_percentage / 100.0);
        forecast_sga := forecast_revenue * (sga_percentage / 100.0);
        forecast_rd := forecast_revenue * (rd_percentage / 100.0);
        forecast_marketing := forecast_revenue * (marketing_percentage / 100.0);
        forecast_opex := forecast_sga + forecast_rd + forecast_marketing;
        
        forecast_gross_profit := forecast_revenue - forecast_cogs;
        forecast_operating_income := forecast_gross_profit - forecast_opex;
        forecast_tax_expense := forecast_operating_income * (tax_rate / 100.0);
        forecast_net_income := forecast_operating_income - forecast_tax_expense;
        
        -- Insert or update forecast income statement
        INSERT INTO forecast_income_statements (
            business_account_id, scenario_id, period_id, revenue, cost_of_goods_sold, 
            gross_profit, operating_expenses, operating_income, tax_expense, net_income,
            gross_profit_margin, operating_margin, net_profit_margin, forecast_method
        ) VALUES (
            p_business_account_id, p_scenario_id, period_record.id, forecast_revenue, forecast_cogs,
            forecast_gross_profit, forecast_opex, forecast_operating_income, forecast_tax_expense, forecast_net_income,
            CASE WHEN forecast_revenue != 0 THEN (forecast_gross_profit / forecast_revenue) * 100 ELSE 0 END,
            CASE WHEN forecast_revenue != 0 THEN (forecast_operating_income / forecast_revenue) * 100 ELSE 0 END,
            CASE WHEN forecast_revenue != 0 THEN (forecast_net_income / forecast_revenue) * 100 ELSE 0 END,
            'PERCENTAGE_OF_SALES'
        )
        ON CONFLICT (business_account_id, scenario_id, period_id) DO UPDATE SET
            revenue = EXCLUDED.revenue,
            cost_of_goods_sold = EXCLUDED.cost_of_goods_sold,
            gross_profit = EXCLUDED.gross_profit,
            operating_expenses = EXCLUDED.operating_expenses,
            operating_income = EXCLUDED.operating_income,
            tax_expense = EXCLUDED.tax_expense,
            net_income = EXCLUDED.net_income,
            gross_profit_margin = EXCLUDED.gross_profit_margin,
            operating_margin = EXCLUDED.operating_margin,
            net_profit_margin = EXCLUDED.net_profit_margin,
            forecast_method = EXCLUDED.forecast_method,
            updated_at = CURRENT_TIMESTAMP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_forecast_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_forecast_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_forecast_vs_actual;
END;
$$ LANGUAGE plpgsql;

-- Create Triggers for Updated Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_financial_assumptions_updated_at
    BEFORE UPDATE ON financial_assumptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forecast_scenarios_updated_at
    BEFORE UPDATE ON forecast_scenarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forecast_periods_updated_at
    BEFORE UPDATE ON forecast_periods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forecast_income_statements_updated_at
    BEFORE UPDATE ON forecast_income_statements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forecast_balance_sheets_updated_at
    BEFORE UPDATE ON forecast_balance_sheets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forecast_cash_flow_statements_updated_at
    BEFORE UPDATE ON forecast_cash_flow_statements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_assumptions TO ai_business_service;
GRANT SELECT, INSERT, UPDATE, DELETE ON forecast_scenarios TO ai_business_service;
GRANT SELECT, INSERT, UPDATE, DELETE ON forecast_periods TO ai_business_service;
GRANT SELECT, INSERT, UPDATE, DELETE ON forecast_income_statements TO ai_business_service;
GRANT SELECT, INSERT, UPDATE, DELETE ON forecast_balance_sheets TO ai_business_service;
GRANT SELECT, INSERT, UPDATE, DELETE ON forecast_cash_flow_statements TO ai_business_service;
GRANT SELECT, INSERT, UPDATE, DELETE ON forecast_assumptions_history TO ai_business_service;
GRANT SELECT, INSERT, UPDATE, DELETE ON forecast_validation_rules TO ai_business_service;
GRANT SELECT, INSERT, UPDATE, DELETE ON forecast_validation_results TO ai_business_service;

GRANT SELECT ON mv_forecast_summary TO ai_business_service;
GRANT SELECT ON mv_forecast_vs_actual TO ai_business_service;

GRANT EXECUTE ON FUNCTION create_default_financial_assumptions TO ai_business_service;
GRANT EXECUTE ON FUNCTION generate_forecast_periods TO ai_business_service;
GRANT EXECUTE ON FUNCTION calculate_percentage_of_sales_forecast TO ai_business_service;
GRANT EXECUTE ON FUNCTION refresh_forecast_views TO ai_business_service;

-- Add comments
COMMENT ON TABLE financial_assumptions IS 'Financial assumptions for forecasting with editable parameters';
COMMENT ON TABLE forecast_scenarios IS 'Forecast scenarios (base, optimistic, pessimistic, custom)';
COMMENT ON TABLE forecast_periods IS 'Forecast periods for different time horizons';
COMMENT ON TABLE forecast_income_statements IS 'Forecasted income statements by scenario and period';
COMMENT ON TABLE forecast_balance_sheets IS 'Forecasted balance sheets by scenario and period';
COMMENT ON TABLE forecast_cash_flow_statements IS 'Forecasted cash flow statements by scenario and period';
COMMENT ON TABLE forecast_assumptions_history IS 'History of changes to financial assumptions';
COMMENT ON TABLE forecast_validation_rules IS 'Validation rules for forecast accuracy';
COMMENT ON TABLE forecast_validation_results IS 'Results of forecast validation checks';

COMMENT ON MATERIALIZED VIEW mv_forecast_summary IS 'Summary of forecast scenarios and performance';
COMMENT ON MATERIALIZED VIEW mv_forecast_vs_actual IS 'Comparison of forecast vs actual results';
