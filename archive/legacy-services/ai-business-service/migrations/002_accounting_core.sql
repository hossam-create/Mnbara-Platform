-- Sprint 1 - Accounting Core Migration
-- Chart of Accounts, Double-entry Accounting, Journal Entries, Fiscal Periods, Audit Log

-- Chart of Accounts Tables
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id TEXT PRIMARY KEY,
    business_account_id TEXT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE', 'CONTRA_ASSET', 'CONTRA_REVENUE')),
    account_subtype VARCHAR(100),
    normal_balance VARCHAR(10) NOT NULL CHECK (normal_balance IN ('DEBIT', 'CREDIT')),
    is_active BOOLEAN DEFAULT true,
    is_contra BOOLEAN DEFAULT false,
    parent_account_id TEXT REFERENCES chart_of_accounts(id),
    level INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(business_account_id, account_code),
    UNIQUE(business_account_id, account_name)
);

-- Fiscal Periods Table
CREATE TABLE IF NOT EXISTS fiscal_periods (
    id TEXT PRIMARY KEY,
    business_account_id TEXT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('MONTHLY', 'QUARTERLY', 'YEARLY')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    fiscal_year INTEGER NOT NULL,
    fiscal_quarter INTEGER,
    fiscal_month INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'LOCKED', 'CLOSED')),
    is_current BOOLEAN DEFAULT false,
    locked_at TIMESTAMP,
    locked_by TEXT REFERENCES users(id),
    closing_entries_posted BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(business_account_id, period_start, period_end),
    CHECK (period_end >= period_start)
);

-- Journal Entries Table
CREATE TABLE IF NOT EXISTS journal_entries (
    id TEXT PRIMARY KEY,
    business_account_id TEXT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    fiscal_period_id TEXT NOT NULL REFERENCES fiscal_periods(id) ON DELETE RESTRICT,
    entry_number VARCHAR(50) NOT NULL,
    entry_date DATE NOT NULL,
    reference_type VARCHAR(50),
    reference_id TEXT,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'POSTED', 'REVERSED')),
    total_debits DECIMAL(20,2) NOT NULL DEFAULT 0,
    total_credits DECIMAL(20,2) NOT NULL DEFAULT 0,
    is_adjusting_entry BOOLEAN DEFAULT false,
    is_closing_entry BOOLEAN DEFAULT false,
    reversal_entry_id TEXT REFERENCES journal_entries(id),
    posted_at TIMESTAMP,
    posted_by TEXT REFERENCES users(id),
    approved_at TIMESTAMP,
    approved_by TEXT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(business_account_id, entry_number),
    CHECK (total_debits = total_credits),
    CHECK (entry_date <= CURRENT_DATE)
);

-- Journal Entry Lines Table
CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id TEXT PRIMARY KEY,
    journal_entry_id TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    line_number INTEGER NOT NULL,
    description TEXT,
    debit_amount DECIMAL(20,2) NOT NULL DEFAULT 0,
    credit_amount DECIMAL(20,2) NOT NULL DEFAULT 0,
    balance_after DECIMAL(20,2),
    reference_type VARCHAR(50),
    reference_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(journal_entry_id, line_number),
    CHECK ((debit_amount > 0 AND credit_amount = 0) OR (credit_amount > 0 AND debit_amount = 0)),
    CHECK (debit_amount >= 0 AND credit_amount >= 0)
);

-- Trial Balance Table (Materialized View for Performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_trial_balance AS
SELECT 
    coa.business_account_id,
    fp.id as fiscal_period_id,
    fp.period_start,
    fp.period_end,
    coa.id as account_id,
    coa.account_code,
    coa.account_name,
    coa.account_type,
    coa.normal_balance,
    COALESCE(SUM(jel.debit_amount), 0) as total_debits,
    COALESCE(SUM(jel.credit_amount), 0) as total_credits,
    CASE 
        WHEN coa.normal_balance = 'DEBIT' THEN 
            COALESCE(SUM(jel.debit_amount), 0) - COALESCE(SUM(jel.credit_amount), 0)
        ELSE 
            COALESCE(SUM(jel.credit_amount), 0) - COALESCE(SUM(jel.debit_amount), 0)
    END as balance
FROM chart_of_accounts coa
CROSS JOIN fiscal_periods fp
LEFT JOIN journal_entries je ON je.business_account_id = coa.business_account_id 
    AND je.fiscal_period_id = fp.id 
    AND je.status = 'POSTED'
LEFT JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id 
    AND jel.account_id = coa.id
WHERE coa.business_account_id = fp.business_account_id
    AND coa.is_active = true
GROUP BY coa.business_account_id, fp.id, coa.id, coa.account_code, coa.account_name, coa.account_type, coa.normal_balance, fp.period_start, fp.period_end;

-- Accounting Audit Log Table
CREATE TABLE IF NOT EXISTS accounting_audit_log (
    id TEXT PRIMARY KEY,
    business_account_id TEXT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    record_id TEXT NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'POST', 'REVERSE', 'LOCK', 'UNLOCK')),
    old_values JSONB,
    new_values JSONB,
    user_id TEXT REFERENCES users(id),
    user_email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    INDEX idx_accounting_audit_business (business_account_id),
    INDEX idx_accounting_audit_table (table_name),
    INDEX idx_accounting_audit_record (table_name, record_id),
    INDEX idx_accounting_audit_timestamp (timestamp),
    INDEX idx_accounting_audit_user (user_id)
);

-- Account Balances Table (for performance)
CREATE TABLE IF NOT EXISTS account_balances (
    id TEXT PRIMARY KEY,
    business_account_id TEXT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL REFERENCES chart_of_accounts(id) ON DELETE CASCADE,
    fiscal_period_id TEXT NOT NULL REFERENCES fiscal_periods(id) ON DELETE CASCADE,
    opening_balance DECIMAL(20,2) NOT NULL DEFAULT 0,
    net_change DECIMAL(20,2) NOT NULL DEFAULT 0,
    closing_balance DECIMAL(20,2) NOT NULL DEFAULT 0,
    debit_total DECIMAL(20,2) NOT NULL DEFAULT 0,
    credit_total DECIMAL(20,2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(business_account_id, account_id, fiscal_period_id),
    INDEX idx_account_balances_business (business_account_id),
    INDEX idx_account_balances_account (account_id),
    INDEX idx_account_balances_period (fiscal_period_id)
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_business ON chart_of_accounts(business_account_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_code ON chart_of_accounts(account_code);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_type ON chart_of_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_parent ON chart_of_accounts(parent_account_id);

CREATE INDEX IF NOT EXISTS idx_fiscal_periods_business ON fiscal_periods(business_account_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_dates ON fiscal_periods(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_status ON fiscal_periods(status);
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_current ON fiscal_periods(is_current);

CREATE INDEX IF NOT EXISTS idx_journal_entries_business ON journal_entries(business_account_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_period ON journal_entries(fiscal_period_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_number ON journal_entries(entry_number);
CREATE INDEX IF NOT EXISTS idx_journal_entries_reference ON journal_entries(reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_journal_lines_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON journal_entry_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_amounts ON journal_entry_lines(debit_amount, credit_amount);

-- Create Functions for Accounting Logic

-- Function to validate journal entry balance
CREATE OR REPLACE FUNCTION validate_journal_entry_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if debits equal credits
    IF (SELECT COALESCE(SUM(debit_amount), 0) FROM journal_entry_lines WHERE journal_entry_id = NEW.id) != 
       (SELECT COALESCE(SUM(credit_amount), 0) FROM journal_entry_lines WHERE journal_entry_id = NEW.id) THEN
        RAISE EXCEPTION 'Journal entry must balance: debits must equal credits';
    END IF;
    
    -- Update totals
    UPDATE journal_entries 
    SET 
        total_debits = (SELECT COALESCE(SUM(debit_amount), 0) FROM journal_entry_lines WHERE journal_entry_id = NEW.id),
        total_credits = (SELECT COALESCE(SUM(credit_amount), 0) FROM journal_entry_lines WHERE journal_entry_id = NEW.id)
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent editing posted entries
CREATE OR REPLACE FUNCTION prevent_posted_entry_edit()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'POSTED' AND NEW.status = 'POSTED' THEN
        -- Allow limited updates to posted entries (only notes, etc.)
        IF (OLD.description IS DISTINCT FROM NEW.description) OR
           (OLD.reference_type IS DISTINCT FROM NEW.reference_type) OR
           (OLD.reference_id IS DISTINCT FROM NEW.reference_id) THEN
            RAISE EXCEPTION 'Cannot modify posted journal entry';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update account balances
CREATE OR REPLACE FUNCTION update_account_balances()
RETURNS TRIGGER AS $$
BEGIN
    -- Update account balances for the affected fiscal period
    INSERT INTO account_balances (id, business_account_id, account_id, fiscal_period_id, opening_balance, net_change, closing_balance, debit_total, credit_total)
    SELECT 
        gen_random_uuid()::text,
        je.business_account_id,
        jel.account_id,
        je.fiscal_period_id,
        0, -- Opening balance (calculated separately)
        COALESCE(SUM(CASE WHEN jel.debit_amount > 0 THEN jel.debit_amount ELSE -jel.credit_amount END), 0),
        0, -- Closing balance (calculated separately)
        COALESCE(SUM(jel.debit_amount), 0),
        COALESCE(SUM(jel.credit_amount), 0)
    FROM journal_entries je
    JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id
    WHERE je.id = NEW.id
    GROUP BY je.business_account_id, jel.account_id, je.fiscal_period_id
    ON CONFLICT (business_account_id, account_id, fiscal_period_id)
    DO UPDATE SET
        net_change = account_balances.net_change + EXCLUDED.net_change,
        debit_total = account_balances.debit_total + EXCLUDED.debit_total,
        credit_total = account_balances.credit_total + EXCLUDED.credit_total,
        closing_balance = account_balances.opening_balance + account_balances.net_change + EXCLUDED.net_change,
        last_updated = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_accounting_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    audit_id TEXT;
    action_type VARCHAR(20);
    description_text TEXT;
BEGIN
    audit_id := gen_random_uuid()::text;
    
    IF TG_OP = 'INSERT' THEN
        action_type := 'INSERT';
        description_text := 'Record created in ' || TG_TABLE_NAME;
        INSERT INTO accounting_audit_log (id, business_account_id, table_name, record_id, action, new_values, timestamp, description)
        VALUES (audit_id, NEW.business_account_id, TG_TABLE_NAME, NEW.id, action_type, row_to_json(NEW), CURRENT_TIMESTAMP, description_text);
        RETURN NEW;
    
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'UPDATE';
        description_text := 'Record updated in ' || TG_TABLE_NAME;
        INSERT INTO accounting_audit_log (id, business_account_id, table_name, record_id, action, old_values, new_values, timestamp, description)
        VALUES (audit_id, NEW.business_account_id, TG_TABLE_NAME, NEW.id, action_type, row_to_json(OLD), row_to_json(NEW), CURRENT_TIMESTAMP, description_text);
        RETURN NEW;
    
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'DELETE';
        description_text := 'Record deleted from ' || TG_TABLE_NAME;
        INSERT INTO accounting_audit_log (id, business_account_id, table_name, record_id, action, old_values, timestamp, description)
        VALUES (audit_id, OLD.business_account_id, TG_TABLE_NAME, OLD.id, action_type, row_to_json(OLD), CURRENT_TIMESTAMP, description_text);
        RETURN OLD;
    
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create Triggers

-- Journal entry validation trigger
CREATE TRIGGER trigger_validate_journal_entry_balance
    AFTER INSERT OR UPDATE ON journal_entry_lines
    FOR EACH ROW
    EXECUTE FUNCTION validate_journal_entry_balance();

-- Prevent editing posted entries
CREATE TRIGGER trigger_prevent_posted_entry_edit
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION prevent_posted_entry_edit();

-- Update account balances
CREATE TRIGGER trigger_update_account_balances
    AFTER INSERT OR UPDATE ON journal_entry_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_account_balances();

-- Audit log triggers
CREATE TRIGGER trigger_journal_entries_audit
    AFTER INSERT OR UPDATE OR DELETE ON journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION create_accounting_audit_log();

CREATE TRIGGER trigger_journal_entry_lines_audit
    AFTER INSERT OR UPDATE OR DELETE ON journal_entry_lines
    FOR EACH ROW
    EXECUTE FUNCTION create_accounting_audit_log();

CREATE TRIGGER trigger_chart_of_accounts_audit
    AFTER INSERT OR UPDATE OR DELETE ON chart_of_accounts
    FOR EACH ROW
    EXECUTE FUNCTION create_accounting_audit_log();

CREATE TRIGGER trigger_fiscal_periods_audit
    AFTER INSERT OR UPDATE OR DELETE ON fiscal_periods
    FOR EACH ROW
    EXECUTE FUNCTION create_accounting_audit_log();

-- Function to refresh trial balance
CREATE OR REPLACE FUNCTION refresh_trial_balance()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trial_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to get next journal entry number
CREATE OR REPLACE FUNCTION get_next_journal_entry_number(p_business_id TEXT, p_date DATE)
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    entry_number TEXT;
BEGIN
    -- Get the next sequence number for the date
    SELECT COALESCE(MAX(CAST(SUBSTRING(entry_number FROM 'JE-' || to_char(p_date, 'YYYY-MM-DD') || '-(\d+)') AS INTEGER)), 0) + 1
    INTO next_number
    FROM journal_entries
    WHERE business_account_id = p_business_id 
        AND entry_date = p_date;
    
    entry_number := 'JE-' || to_char(p_date, 'YYYY-MM-DD') || '-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN entry_number;
END;
$$ LANGUAGE plpgsql;

-- Insert default chart of accounts for demo business
INSERT INTO chart_of_accounts (id, business_account_id, account_code, account_name, account_type, normal_balance, description) VALUES
-- Assets
(gen_random_uuid()::text, 'demo-business', '1000', 'Cash and Cash Equivalents', 'ASSET', 'DEBIT', 'Liquid funds including checking and savings accounts'),
(gen_random_uuid()::text, 'demo-business', '1010', 'Business Checking Account', 'ASSET', 'DEBIT', 'Primary business checking account'),
(gen_random_uuid()::text, 'demo-business', '1020', 'Business Savings Account', 'ASSET', 'DEBIT', 'Business savings and reserve funds'),
(gen_random_uuid()::text, 'demo-business', '1100', 'Accounts Receivable', 'ASSET', 'DEBIT', 'Money owed by customers'),
(gen_random_uuid()::text, 'demo-business', '1200', 'Inventory', 'ASSET', 'DEBIT', 'Goods held for sale'),
(gen_random_uuid()::text, 'demo-business', '1300', 'Prepaid Expenses', 'ASSET', 'DEBIT', 'Expenses paid in advance'),
(gen_random_uuid()::text, 'demo-business', '1400', 'Fixed Assets', 'ASSET', 'DEBIT', 'Long-term tangible assets'),
(gen_random_uuid()::text, 'demo-business', '1410', 'Equipment', 'ASSET', 'DEBIT', 'Business equipment and machinery'),
(gen_random_uuid()::text, 'demo-business', '1420', 'Furniture and Fixtures', 'ASSET', 'DEBIT', 'Office furniture and fixtures'),
(gen_random_uuid()::text, 'demo-business', '1500', 'Accumulated Depreciation', 'CONTRA_ASSET', 'CREDIT', 'Accumulated depreciation on fixed assets'),

-- Liabilities
(gen_random_uuid()::text, 'demo-business', '2000', 'Accounts Payable', 'LIABILITY', 'CREDIT', 'Money owed to vendors'),
(gen_random_uuid()::text, 'demo-business', '2100', 'Accrued Expenses', 'LIABILITY', 'CREDIT', 'Expenses incurred but not yet paid'),
(gen_random_uuid()::text, 'demo-business', '2200', 'Taxes Payable', 'LIABILITY', 'CREDIT', 'Taxes owed to government'),
(gen_random_uuid()::text, 'demo-business', '2210', 'Sales Tax Payable', 'LIABILITY', 'CREDIT', 'Sales tax collected from customers'),
(gen_random_uuid()::text, 'demo-business', '2220', 'Income Tax Payable', 'LIABILITY', 'CREDIT', 'Income taxes owed'),
(gen_random_uuid()::text, 'demo-business', '2300', 'Short-term Debt', 'LIABILITY', 'CREDIT', 'Debts due within one year'),
(gen_random_uuid()::text, 'demo-business', '2400', 'Long-term Debt', 'LIABILITY', 'CREDIT', 'Debts due after one year'),

-- Equity
(gen_random_uuid()::text, 'demo-business', '3000', 'Owner''s Equity', 'EQUITY', 'CREDIT', 'Owner''s investment in business'),
(gen_random_uuid()::text, 'demo-business', '3100', 'Common Stock', 'EQUITY', 'CREDIT', 'Common shares issued'),
(gen_random_uuid()::text, 'demo-business', '3200', 'Retained Earnings', 'EQUITY', 'CREDIT', 'Accumulated profits retained in business'),
(gen_random_uuid()::text, 'demo-business', '3300', 'Dividends Paid', 'EQUITY', 'DEBIT', 'Dividends distributed to owners'),

-- Revenue
(gen_random_uuid()::text, 'demo-business', '4000', 'Sales Revenue', 'REVENUE', 'CREDIT', 'Revenue from primary business operations'),
(gen_random_uuid()::text, 'demo-business', '4100', 'Service Revenue', 'REVENUE', 'CREDIT', 'Revenue from services provided'),
(gen_random_uuid()::text, 'demo-business', '4200', 'Interest Income', 'REVENUE', 'CREDIT', 'Interest earned on investments'),
(gen_random_uuid()::text, 'demo-business', '4300', 'Other Revenue', 'REVENUE', 'CREDIT', 'Miscellaneous revenue streams'),

-- Expenses
(gen_random_uuid()::text, 'demo-business', '5000', 'Cost of Goods Sold', 'EXPENSE', 'DEBIT', 'Direct costs of goods sold'),
(gen_random_uuid()::text, 'demo-business', '5100', 'Salaries and Wages', 'EXPENSE', 'DEBIT', 'Employee compensation'),
(gen_random_uuid()::text, 'demo-business', '5200', 'Rent Expense', 'EXPENSE', 'DEBIT', 'Office and facility rent'),
(gen_random_uuid()::text, 'demo-business', '5300', 'Utilities Expense', 'EXPENSE', 'DEBIT', 'Electricity, water, internet, etc.'),
(gen_random_uuid()::text, 'demo-business', '5400', 'Marketing Expense', 'EXPENSE', 'DEBIT', 'Marketing and advertising costs'),
(gen_random_uuid()::text, 'demo-business', '5500', 'Office Supplies', 'EXPENSE', 'DEBIT', 'Office supplies and materials'),
(gen_random_uuid()::text, 'demo-business', '5600', 'Professional Services', 'EXPENSE', 'DEBIT', 'Legal, accounting, consulting fees'),
(gen_random_uuid()::text, 'demo-business', '5700', 'Insurance Expense', 'EXPENSE', 'DEBIT', 'Business insurance premiums'),
(gen_random_uuid()::text, 'demo-business', '5800', 'Depreciation Expense', 'EXPENSE', 'DEBIT', 'Depreciation of fixed assets'),
(gen_random_uuid()::text, 'demo-business', '5900', 'Other Expenses', 'EXPENSE', 'DEBIT', 'Miscellaneous business expenses')
ON CONFLICT (business_account_id, account_code) DO NOTHING;

-- Create default fiscal periods for demo business (current year)
INSERT INTO fiscal_periods (id, business_account_id, period_type, period_start, period_end, fiscal_year, fiscal_month, status, is_current) VALUES
-- Monthly periods for current year
(gen_random_uuid()::text, 'demo-business', 'MONTHLY', '2024-01-01', '2024-01-31', 2024, 1, 'CLOSED', false),
(gen_random_uuid()::text, 'demo-business', 'MONTHLY', '2024-02-01', '2024-02-29', 2024, 2, 'CLOSED', false),
(gen_random_uuid()::text, 'demo-business', 'MONTHLY', '2024-03-01', '2024-03-31', 2024, 3, 'CLOSED', false),
(gen_random_uuid()::text, 'demo-business', 'MONTHLY', '2024-04-01', '2024-04-30', 2024, 4, 'CLOSED', false),
(gen_random_uuid()::text, 'demo-business', 'MONTHLY', '2024-05-01', '2024-05-31', 2024, 5, 'CLOSED', false),
(gen_random_uuid()::text, 'demo-business', 'MONTHLY', '2024-06-01', '2024-06-30', 2024, 6, 'CLOSED', false),
(gen_random_uuid()::text, 'demo-business', 'MONTHLY', '2024-07-01', '2024-07-31', 2024, 7, 'CLOSED', false),
(gen_random_uuid()::text, 'demo-business', 'MONTHLY', '2024-08-01', '2024-08-31', 2024, 8, 'CLOSED', false),
(gen_random_uuid()::text, 'demo-business', 'MONTHLY', '2024-09-01', '2024-09-30', 2024, 9, 'CLOSED', false),
(gen_random_uuid()::text, 'demo-business', 'MONTHLY', '2024-10-01', '2024-10-31', 2024, 10, 'CLOSED', false),
(gen_random_uuid()::text, 'demo-business', 'MONTHLY', '2024-11-01', '2024-11-30', 2024, 11, 'CLOSED', false),
(gen_random_uuid()::text, 'demo-business', 'MONTHLY', '2024-12-01', '2024-12-31', 2024, 12, 'OPEN', true)
ON CONFLICT (business_account_id, period_start, period_end) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON chart_of_accounts TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON fiscal_periods TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON journal_entries TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON journal_entry_lines TO PUBLIC;
GRANT SELECT ON mv_trial_balance TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON accounting_audit_log TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON account_balances TO PUBLIC;

COMMIT;
