-- Sprint 3 - Financial Statements Migration
-- Generate real financial statements from data

-- Financial Statements Table
CREATE TABLE IF NOT EXISTS financial_statements (
    id TEXT PRIMARY KEY,
    business_account_id TEXT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    statement_type VARCHAR(50) NOT NULL CHECK (statement_type IN ('INCOME_STATEMENT', 'BALANCE_SHEET', 'CASH_FLOW')),
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('MONTHLY', 'QUARTERLY', 'YEARLY')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    fiscal_year INTEGER NOT NULL,
    fiscal_quarter INTEGER,
    fiscal_month INTEGER,
    statement_data JSONB NOT NULL DEFAULT '{}',
    calculations JSONB NOT NULL DEFAULT '{}',
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    generated_by TEXT REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'GENERATED' CHECK (status IN ('GENERATED', 'REVIEWED', 'FINALIZED', 'ARCHIVED')),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(business_account_id, statement_type, period_type, period_start, period_end),
    INDEX idx_financial_statements_business (business_account_id),
    INDEX idx_financial_statements_type (statement_type),
    INDEX idx_financial_statements_period (period_start, period_end),
    INDEX idx_financial_statements_status (status)
);

-- Financial Statement Calculations Table (for detailed breakdown)
CREATE TABLE IF NOT EXISTS financial_statement_calculations (
    id TEXT PRIMARY KEY,
    financial_statement_id TEXT NOT NULL REFERENCES financial_statements(id) ON DELETE CASCADE,
    calculation_type VARCHAR(100) NOT NULL,
    calculation_name VARCHAR(255) NOT NULL,
    account_id TEXT REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
    account_code VARCHAR(20),
    account_name VARCHAR(255),
    amount DECIMAL(20,2) NOT NULL,
    percentage DECIMAL(10,4),
    formula TEXT,
    calculation_order INTEGER DEFAULT 1,
    is_subtotal BOOLEAN DEFAULT false,
    is_total BOOLEAN DEFAULT false,
    parent_calculation_id TEXT REFERENCES financial_statement_calculations(id),
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_statement_calculations_statement (financial_statement_id),
    INDEX idx_statement_calculations_type (calculation_type),
    INDEX idx_statement_calculations_account (account_id),
    INDEX idx_statement_calculations_order (calculation_order)
);

-- Financial Statement Comparisons Table (for period-over-period analysis)
CREATE TABLE IF NOT EXISTS financial_statement_comparisons (
    id TEXT PRIMARY KEY,
    business_account_id TEXT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    statement_type VARCHAR(50) NOT NULL,
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    comparison_period_start DATE NOT NULL,
    comparison_period_end DATE NOT NULL,
    comparison_type VARCHAR(20) NOT NULL CHECK (comparison_type IN ('PERIOD_OVER_PERIOD', 'YEAR_OVER_YEAR')),
    current_data JSONB NOT NULL DEFAULT '{}',
    comparison_data JSONB NOT NULL DEFAULT '{}',
    variance_data JSONB NOT NULL DEFAULT '{}',
    percentage_changes JSONB NOT NULL DEFAULT '{}',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by TEXT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_statement_comparisons_business (business_account_id),
    INDEX idx_statement_comparisons_type (statement_type),
    INDEX idx_statement_comparisons_periods (current_period_start, current_period_end)
);

-- Financial Ratios Table
CREATE TABLE IF NOT EXISTS financial_ratios (
    id TEXT PRIMARY KEY,
    business_account_id TEXT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    ratio_type VARCHAR(50) NOT NULL,
    ratio_name VARCHAR(100) NOT NULL,
    ratio_value DECIMAL(20,4),
    ratio_formula TEXT,
    benchmark_value DECIMAL(20,4),
    industry_average DECIMAL(20,4),
    performance_rating VARCHAR(20) CHECK (performance_rating IN ('EXCELLENT', 'GOOD', 'AVERAGE', 'BELOW_AVERAGE', 'POOR')),
    calculation_data JSONB DEFAULT '{}',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_financial_ratios_business (business_account_id),
    INDEX idx_financial_ratios_type (ratio_type),
    INDEX idx_financial_ratios_period (period_start, period_end)
);

-- Materialized Views for Financial Statement Calculations

-- Income Statement View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_income_statement AS
SELECT 
    je.business_account_id,
    DATE_TRUNC('month', je.entry_date) as period_month,
    DATE_TRUNC('quarter', je.entry_date) as period_quarter,
    DATE_TRUNC('year', je.entry_date) as period_year,
    coa.account_type,
    coa.account_subtype,
    COALESCE(SUM(CASE WHEN coa.account_type = 'REVENUE' THEN jel.credit_amount - jel.debit_amount ELSE 0 END), 0) as revenue,
    COALESCE(SUM(CASE WHEN coa.account_type = 'EXPENSE' THEN jel.debit_amount - jel.credit_amount ELSE 0 END), 0) as expenses,
    COALESCE(SUM(CASE WHEN coa.account_type = 'EXPENSE' AND coa.account_subtype = 'COST_OF_GOODS_SOLD' THEN jel.debit_amount - jel.credit_amount ELSE 0 END), 0) as cost_of_goods_sold,
    COALESCE(SUM(CASE WHEN coa.account_type = 'EXPENSE' AND coa.account_subtype = 'OPERATING_EXPENSES' THEN jel.debit_amount - jel.credit_amount ELSE 0 END), 0) as operating_expenses,
    COALESCE(SUM(CASE WHEN coa.account_type = 'EXPENSE' AND coa.account_subtype = 'INTEREST_EXPENSE' THEN jel.debit_amount - jel.credit_amount ELSE 0 END), 0) as interest_expense,
    COALESCE(SUM(CASE WHEN coa.account_type = 'EXPENSE' AND coa.account_subtype = 'TAX_EXPENSE' THEN jel.debit_amount - jel.credit_amount ELSE 0 END), 0) as tax_expense,
    COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) as net_change
FROM journal_entries je
JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
JOIN chart_of_accounts coa ON jel.account_id = coa.id
WHERE je.status = 'POSTED'
    AND je.business_account_id IS NOT NULL
    AND je.entry_date IS NOT NULL
GROUP BY je.business_account_id, 
         DATE_TRUNC('month', je.entry_date),
         DATE_TRUNC('quarter', je.entry_date),
         DATE_TRUNC('year', je.entry_date),
         coa.account_type,
         coa.account_subtype;

-- Balance Sheet View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_balance_sheet AS
SELECT 
    je.business_account_id,
    DATE_TRUNC('month', je.entry_date) as period_month,
    DATE_TRUNC('quarter', je.entry_date) as period_quarter,
    DATE_TRUNC('year', je.entry_date) as period_year,
    coa.account_type,
    coa.account_subtype,
    COALESCE(SUM(CASE WHEN coa.account_type = 'ASSET' THEN jel.debit_amount - jel.credit_amount ELSE 0 END), 0) as assets,
    COALESCE(SUM(CASE WHEN coa.account_type = 'ASSET' AND coa.account_subtype = 'CURRENT_ASSETS' THEN jel.debit_amount - jel.credit_amount ELSE 0 END), 0) as current_assets,
    COALESCE(SUM(CASE WHEN coa.account_type = 'ASSET' AND coa.account_subtype = 'FIXED_ASSETS' THEN jel.debit_amount - jel.credit_amount ELSE 0 END), 0) as fixed_assets,
    COALESCE(SUM(CASE WHEN coa.account_type = 'ASSET' AND coa.account_subtype = 'INTANGIBLE_ASSETS' THEN jel.debit_amount - jel.credit_amount ELSE 0 END), 0) as intangible_assets,
    COALESCE(SUM(CASE WHEN coa.account_type = 'LIABILITY' THEN jel.credit_amount - jel.debit_amount ELSE 0 END), 0) as liabilities,
    COALESCE(SUM(CASE WHEN coa.account_type = 'LIABILITY' AND coa.account_subtype = 'CURRENT_LIABILITIES' THEN jel.credit_amount - jel.debit_amount ELSE 0 END), 0) as current_liabilities,
    COALESCE(SUM(CASE WHEN coa.account_type = 'LIABILITY' AND coa.account_subtype = 'LONG_TERM_LIABILITIES' THEN jel.credit_amount - jel.debit_amount ELSE 0 END), 0) as long_term_liabilities,
    COALESCE(SUM(CASE WHEN coa.account_type = 'EQUITY' THEN jel.credit_amount - jel.debit_amount ELSE 0 END), 0) as equity,
    COALESCE(SUM(CASE WHEN coa.account_type = 'EQUITY' AND coa.account_subtype = 'RETAINED_EARNINGS' THEN jel.credit_amount - jel.debit_amount ELSE 0 END), 0) as retained_earnings,
    COALESCE(SUM(CASE WHEN coa.account_type = 'EQUITY' AND coa.account_subtype = 'COMMON_STOCK' THEN jel.credit_amount - jel.debit_amount ELSE 0 END), 0) as common_stock,
    COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) as net_change
FROM journal_entries je
JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
JOIN chart_of_accounts coa ON jel.account_id = coa.id
WHERE je.status = 'POSTED'
    AND je.business_account_id IS NOT NULL
    AND je.entry_date IS NOT NULL
GROUP BY je.business_account_id, 
         DATE_TRUNC('month', je.entry_date),
         DATE_TRUNC('quarter', je.entry_date),
         DATE_TRUNC('year', je.entry_date),
         coa.account_type,
         coa.account_subtype;

-- Cash Flow View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_cash_flow AS
SELECT 
    je.business_account_id,
    DATE_TRUNC('month', je.entry_date) as period_month,
    DATE_TRUNC('quarter', je.entry_date) as period_quarter,
    DATE_TRUNC('year', je.entry_date) as period_year,
    coa.account_type,
    coa.account_subtype,
    COALESCE(SUM(CASE 
        WHEN coa.account_type = 'ASSET' AND coa.account_subtype = 'CASH_AND_EQUIVALENTS' 
        THEN jel.debit_amount - jel.credit_amount 
        ELSE 0 
    END), 0) as cash_change,
    COALESCE(SUM(CASE 
        WHEN coa.account_type = 'ASSET' AND coa.account_subtype = 'CASH_AND_EQUIVALENTS' 
        AND jel.reference_type = 'OPERATING_ACTIVITY'
        THEN jel.debit_amount - jel.credit_amount 
        ELSE 0 
    END), 0) as operating_cash_flow,
    COALESCE(SUM(CASE 
        WHEN coa.account_type = 'ASSET' AND coa.account_subtype = 'CASH_AND_EQUIVALENTS' 
        AND jel.reference_type = 'INVESTING_ACTIVITY'
        THEN jel.debit_amount - jel.credit_amount 
        ELSE 0 
    END), 0) as investing_cash_flow,
    COALESCE(SUM(CASE 
        WHEN coa.account_type = 'ASSET' AND coa.account_subtype = 'CASH_AND_EQUIVALENTS' 
        AND jel.reference_type = 'FINANCING_ACTIVITY'
        THEN jel.debit_amount - jel.credit_amount 
        ELSE 0 
    END), 0) as financing_cash_flow,
    COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) as net_change
FROM journal_entries je
JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
JOIN chart_of_accounts coa ON jel.account_id = coa.id
WHERE je.status = 'POSTED'
    AND je.business_account_id IS NOT NULL
    AND je.entry_date IS NOT NULL
GROUP BY je.business_account_id, 
         DATE_TRUNC('month', je.entry_date),
         DATE_TRUNC('quarter', je.entry_date),
         DATE_TRUNC('year', je.entry_date),
         coa.account_type,
         coa.account_subtype;

-- Create Functions for Financial Statement Generation

-- Function to generate income statement
CREATE OR REPLACE FUNCTION generate_income_statement(
    p_business_account_id TEXT,
    p_period_start DATE,
    p_period_end DATE,
    p_period_type VARCHAR(20) DEFAULT 'MONTHLY'
)
RETURNS TEXT AS $$
DECLARE
    statement_id TEXT;
    fiscal_year INTEGER;
    fiscal_quarter INTEGER;
    fiscal_month INTEGER;
    revenue_total DECIMAL(20,2);
    expense_total DECIMAL(20,2);
    gross_profit DECIMAL(20,2);
    operating_income DECIMAL(20,2);
    net_income DECIMAL(20,2);
    statement_data JSONB;
BEGIN
    -- Calculate fiscal period information
    fiscal_year := EXTRACT(YEAR FROM p_period_start);
    fiscal_quarter := EXTRACT(QUARTER FROM p_period_start);
    fiscal_month := EXTRACT(MONTH FROM p_period_start);
    
    -- Calculate totals from journal entries
    SELECT 
        COALESCE(SUM(CASE WHEN coa.account_type = 'REVENUE' THEN jel.credit_amount - jel.debit_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN coa.account_type = 'EXPENSE' THEN jel.debit_amount - jel.credit_amount ELSE 0 END), 0)
    INTO revenue_total, expense_total
    FROM journal_entries je
    JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
    JOIN chart_of_accounts coa ON jel.account_id = coa.id
    WHERE je.business_account_id = p_business_account_id
        AND je.status = 'POSTED'
        AND je.entry_date BETWEEN p_period_start AND p_period_end;
    
    -- Calculate derived values
    gross_profit := revenue_total - expense_total;
    operating_income := gross_profit; -- Simplified, would include operating expenses
    net_income := operating_income; -- Simplified, would include interest and taxes
    
    -- Create statement data
    statement_data := json_build_object(
        'revenue', revenue_total,
        'expenses', expense_total,
        'gross_profit', gross_profit,
        'operating_income', operating_income,
        'net_income', net_income,
        'period_start', p_period_start,
        'period_end', p_period_end,
        'generated_at', CURRENT_TIMESTAMP
    );
    
    -- Create financial statement record
    INSERT INTO financial_statements (
        id, business_account_id, statement_type, period_type, period_start, period_end,
        fiscal_year, fiscal_quarter, fiscal_month, statement_data, calculations
    ) VALUES (
        gen_random_uuid()::text,
        p_business_account_id,
        'INCOME_STATEMENT',
        p_period_type,
        p_period_start,
        p_period_end,
        fiscal_year,
        fiscal_quarter,
        fiscal_month,
        statement_data,
        json_build_object(
            'revenue_total', revenue_total,
            'expense_total', expense_total,
            'gross_profit', gross_profit,
            'operating_income', operating_income,
            'net_income', net_income
        )
    ) RETURNING id INTO statement_id;
    
    -- Create detailed calculations
    INSERT INTO financial_statement_calculations (
        id, financial_statement_id, calculation_type, calculation_name, amount, calculation_order, is_total
    )
    SELECT 
        gen_random_uuid()::text,
        statement_id,
        'REVENUE',
        'Total Revenue',
        revenue_total,
        1,
        true
    UNION ALL
    SELECT 
        gen_random_uuid()::text,
        statement_id,
        'EXPENSE',
        'Total Expenses',
        expense_total,
        2,
        true
    UNION ALL
    SELECT 
        gen_random_uuid()::text,
        statement_id,
        'PROFIT',
        'Gross Profit',
        gross_profit,
        3,
        true
    UNION ALL
    SELECT 
        gen_random_uuid()::text,
        statement_id,
        'INCOME',
        'Operating Income',
        operating_income,
        4,
        true
    UNION ALL
    SELECT 
        gen_random_uuid()::text,
        statement_id,
        'INCOME',
        'Net Income',
        net_income,
        5,
        true;
    
    RETURN statement_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate balance sheet
CREATE OR REPLACE FUNCTION generate_balance_sheet(
    p_business_account_id TEXT,
    p_period_start DATE,
    p_period_end DATE,
    p_period_type VARCHAR(20) DEFAULT 'MONTHLY'
)
RETURNS TEXT AS $$
DECLARE
    statement_id TEXT;
    fiscal_year INTEGER;
    fiscal_quarter INTEGER;
    fiscal_month INTEGER;
    total_assets DECIMAL(20,2);
    total_liabilities DECIMAL(20,2);
    total_equity DECIMAL(20,2);
    current_assets DECIMAL(20,2);
    current_liabilities DECIMAL(20,2);
    working_capital DECIMAL(20,2);
    statement_data JSONB;
BEGIN
    -- Calculate fiscal period information
    fiscal_year := EXTRACT(YEAR FROM p_period_start);
    fiscal_quarter := EXTRACT(QUARTER FROM p_period_start);
    fiscal_month := EXTRACT(MONTH FROM p_period_start);
    
    -- Calculate totals from journal entries
    SELECT 
        COALESCE(SUM(CASE WHEN coa.account_type = 'ASSET' THEN jel.debit_amount - jel.credit_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN coa.account_type = 'LIABILITY' THEN jel.credit_amount - jel.debit_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN coa.account_type = 'EQUITY' THEN jel.credit_amount - jel.debit_amount ELSE 0 END), 0)
    INTO total_assets, total_liabilities, total_equity
    FROM journal_entries je
    JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
    JOIN chart_of_accounts coa ON jel.account_id = coa.id
    WHERE je.business_account_id = p_business_account_id
        AND je.status = 'POSTED'
        AND je.entry_date <= p_period_end;
    
    -- Calculate working capital
    SELECT 
        COALESCE(SUM(CASE WHEN coa.account_type = 'ASSET' AND coa.account_subtype = 'CURRENT_ASSETS' THEN jel.debit_amount - jel.credit_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN coa.account_type = 'LIABILITY' AND coa.account_subtype = 'CURRENT_LIABILITIES' THEN jel.credit_amount - jel.debit_amount ELSE 0 END), 0)
    INTO current_assets, current_liabilities
    FROM journal_entries je
    JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
    JOIN chart_of_accounts coa ON jel.account_id = coa.id
    WHERE je.business_account_id = p_business_account_id
        AND je.status = 'POSTED'
        AND je.entry_date <= p_period_end;
    
    working_capital := current_assets - current_liabilities;
    
    -- Create statement data
    statement_data := json_build_object(
        'total_assets', total_assets,
        'total_liabilities', total_liabilities,
        'total_equity', total_equity,
        'current_assets', current_assets,
        'current_liabilities', current_liabilities,
        'working_capital', working_capital,
        'period_start', p_period_start,
        'period_end', p_period_end,
        'generated_at', CURRENT_TIMESTAMP
    );
    
    -- Create financial statement record
    INSERT INTO financial_statements (
        id, business_account_id, statement_type, period_type, period_start, period_end,
        fiscal_year, fiscal_quarter, fiscal_month, statement_data, calculations
    ) VALUES (
        gen_random_uuid()::text,
        p_business_account_id,
        'BALANCE_SHEET',
        p_period_type,
        p_period_start,
        p_period_end,
        fiscal_year,
        fiscal_quarter,
        fiscal_month,
        statement_data,
        json_build_object(
            'total_assets', total_assets,
            'total_liabilities', total_liabilities,
            'total_equity', total_equity,
            'current_assets', current_assets,
            'current_liabilities', current_liabilities,
            'working_capital', working_capital
        )
    ) RETURNING id INTO statement_id;
    
    -- Create detailed calculations
    INSERT INTO financial_statement_calculations (
        id, financial_statement_id, calculation_type, calculation_name, amount, calculation_order, is_total
    )
    SELECT 
        gen_random_uuid()::text,
        statement_id,
        'ASSET',
        'Total Assets',
        total_assets,
        1,
        true
    UNION ALL
    SELECT 
        gen_random_uuid()::text,
        statement_id,
        'LIABILITY',
        'Total Liabilities',
        total_liabilities,
        2,
        true
    UNION ALL
    SELECT 
        gen_random_uuid()::text,
        statement_id,
        'EQUITY',
        'Total Equity',
        total_equity,
        3,
        true
    UNION ALL
    SELECT 
        gen_random_uuid()::text,
        statement_id,
        'METRIC',
        'Working Capital',
        working_capital,
        4,
        false;
    
    RETURN statement_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate cash flow statement
CREATE OR REPLACE FUNCTION generate_cash_flow_statement(
    p_business_account_id TEXT,
    p_period_start DATE,
    p_period_end DATE,
    p_period_type VARCHAR(20) DEFAULT 'MONTHLY'
)
RETURNS TEXT AS $$
DECLARE
    statement_id TEXT;
    fiscal_year INTEGER;
    fiscal_quarter INTEGER;
    fiscal_month INTEGER;
    operating_cash_flow DECIMAL(20,2);
    investing_cash_flow DECIMAL(20,2);
    financing_cash_flow DECIMAL(20,2);
    net_cash_flow DECIMAL(20,2);
    beginning_cash DECIMAL(20,2);
    ending_cash DECIMAL(20,2);
    statement_data JSONB;
BEGIN
    -- Calculate fiscal period information
    fiscal_year := EXTRACT(YEAR FROM p_period_start);
    fiscal_quarter := EXTRACT(QUARTER FROM p_period_start);
    fiscal_month := EXTRACT(MONTH FROM p_period_start);
    
    -- Calculate cash flows from journal entries
    SELECT 
        COALESCE(SUM(CASE 
            WHEN coa.account_type = 'ASSET' AND coa.account_subtype = 'CASH_AND_EQUIVALENTS' 
            AND jel.reference_type = 'OPERATING_ACTIVITY'
            THEN jel.debit_amount - jel.credit_amount 
            ELSE 0 
        END), 0),
        COALESCE(SUM(CASE 
            WHEN coa.account_type = 'ASSET' AND coa.account_subtype = 'CASH_AND_EQUIVALENTS' 
            AND jel.reference_type = 'INVESTING_ACTIVITY'
            THEN jel.debit_amount - jel.credit_amount 
            ELSE 0 
        END), 0),
        COALESCE(SUM(CASE 
            WHEN coa.account_type = 'ASSET' AND coa.account_subtype = 'CASH_AND_EQUIVALENTS' 
            AND jel.reference_type = 'FINANCING_ACTIVITY'
            THEN jel.debit_amount - jel.credit_amount 
            ELSE 0 
        END), 0)
    INTO operating_cash_flow, investing_cash_flow, financing_cash_flow
    FROM journal_entries je
    JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
    JOIN chart_of_accounts coa ON jel.account_id = coa.id
    WHERE je.business_account_id = p_business_account_id
        AND je.status = 'POSTED'
        AND je.entry_date BETWEEN p_period_start AND p_period_end;
    
    -- Calculate net cash flow
    net_cash_flow := operating_cash_flow + investing_cash_flow + financing_cash_flow;
    
    -- Calculate beginning and ending cash
    SELECT 
        COALESCE(SUM(CASE 
            WHEN coa.account_type = 'ASSET' AND coa.account_subtype = 'CASH_AND_EQUIVALENTS' 
            THEN jel.debit_amount - jel.credit_amount 
            ELSE 0 
        END), 0)
    INTO beginning_cash
    FROM journal_entries je
    JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
    JOIN chart_of_accounts coa ON jel.account_id = coa.id
    WHERE je.business_account_id = p_business_account_id
        AND je.status = 'POSTED'
        AND je.entry_date < p_period_start;
    
    ending_cash := beginning_cash + net_cash_flow;
    
    -- Create statement data
    statement_data := json_build_object(
        'operating_cash_flow', operating_cash_flow,
        'investing_cash_flow', investing_cash_flow,
        'financing_cash_flow', financing_cash_flow,
        'net_cash_flow', net_cash_flow,
        'beginning_cash', beginning_cash,
        'ending_cash', ending_cash,
        'period_start', p_period_start,
        'period_end', p_period_end,
        'generated_at', CURRENT_TIMESTAMP
    );
    
    -- Create financial statement record
    INSERT INTO financial_statements (
        id, business_account_id, statement_type, period_type, period_start, period_end,
        fiscal_year, fiscal_quarter, fiscal_month, statement_data, calculations
    ) VALUES (
        gen_random_uuid()::text,
        p_business_account_id,
        'CASH_FLOW',
        p_period_type,
        p_period_start,
        p_period_end,
        fiscal_year,
        fiscal_quarter,
        fiscal_month,
        statement_data,
        json_build_object(
            'operating_cash_flow', operating_cash_flow,
            'investing_cash_flow', investing_cash_flow,
            'financing_cash_flow', financing_cash_flow,
            'net_cash_flow', net_cash_flow,
            'beginning_cash', beginning_cash,
            'ending_cash', ending_cash
        )
    ) RETURNING id INTO statement_id;
    
    -- Create detailed calculations
    INSERT INTO financial_statement_calculations (
        id, financial_statement_id, calculation_type, calculation_name, amount, calculation_order, is_total
    )
    SELECT 
        gen_random_uuid()::text,
        statement_id,
        'CASH_FLOW',
        'Operating Cash Flow',
        operating_cash_flow,
        1,
        false
    UNION ALL
    SELECT 
        gen_random_uuid()::text,
        statement_id,
        'CASH_FLOW',
        'Investing Cash Flow',
        investing_cash_flow,
        2,
        false
    UNION ALL
    SELECT 
        gen_random_uuid()::text,
        statement_id,
        'CASH_FLOW',
        'Financing Cash Flow',
        financing_cash_flow,
        3,
        false
    UNION ALL
    SELECT 
        gen_random_uuid()::text,
        statement_id,
        'CASH_FLOW',
        'Net Cash Flow',
        net_cash_flow,
        4,
        true
    UNION ALL
    SELECT 
        gen_random_uuid()::text,
        statement_id,
        'CASH_BALANCE',
        'Beginning Cash',
        beginning_cash,
        5,
        false
    UNION ALL
    SELECT 
        gen_random_uuid()::text,
        statement_id,
        'CASH_BALANCE',
        'Ending Cash',
        ending_cash,
        6,
        true;
    
    RETURN statement_id;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh financial statement views
CREATE OR REPLACE FUNCTION refresh_financial_statement_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_income_statement;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_balance_sheet;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_cash_flow;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_statements TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_statement_calculations TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_statement_comparisons TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_ratios TO PUBLIC;
GRANT SELECT ON mv_income_statement TO PUBLIC;
GRANT SELECT ON mv_balance_sheet TO PUBLIC;
GRANT SELECT ON mv_cash_flow TO PUBLIC;

COMMIT;
