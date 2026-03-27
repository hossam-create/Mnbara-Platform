-- AI Business Service Initial Schema Migration
-- Sprint 0 Foundation Setup

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_accounts_status ON business_accounts(status);
CREATE INDEX IF NOT EXISTS idx_business_accounts_type ON business_accounts(business_type);
CREATE INDEX IF NOT EXISTS idx_accounts_business_id ON accounts(business_account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
CREATE INDEX IF NOT EXISTS idx_transactions_business_id ON transactions(business_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON invoices(business_account_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_expenses_business_id ON expenses(business_account_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_business_id ON ai_analyses(business_account_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_type ON ai_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_status ON ai_analyses(status);
CREATE INDEX IF NOT EXISTS idx_business_audit_logs_business_id ON business_audit_logs(business_account_id);
CREATE INDEX IF NOT EXISTS idx_business_audit_logs_created_at ON business_audit_logs(created_at);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_transactions_search ON transactions USING gin(to_tsvector('english', description || ' ' || COALESCE(notes, '') || ' ' || COALESCE(counterparty_name, '')));
CREATE INDEX IF NOT EXISTS idx_expenses_search ON expenses USING gin(to_tsvector('english', description || ' ' || COALESCE(merchant_name, '') || ' ' || COALESCE(notes, '')));

-- Create materialized views for analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_business_summary AS
SELECT 
  ba.id as business_account_id,
  ba.name as business_name,
  ba.business_type,
  ba.status,
  COUNT(DISTINCT a.id) as account_count,
  COUNT(DISTINCT t.id) as transaction_count,
  COALESCE(SUM(a.balance), 0) as total_balance,
  COALESCE(SUM(CASE WHEN t.type IN ('DEBIT', 'PAYMENT_SENT', 'TRANSFER_OUT') THEN t.amount ELSE 0 END), 0) as total_debits,
  COALESCE(SUM(CASE WHEN t.type IN ('CREDIT', 'PAYMENT_RECEIVED', 'TRANSFER_IN') THEN t.amount ELSE 0 END), 0) as total_credits,
  MAX(t.created_at) as last_transaction_at,
  ba.created_at
FROM business_accounts ba
LEFT JOIN accounts a ON a.business_account_id = ba.id AND a.status = 'ACTIVE'
LEFT JOIN transactions t ON t.business_account_id = ba.id AND t.status = 'COMPLETED'
GROUP BY ba.id, ba.name, ba.business_type, ba.status, ba.created_at;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_monthly_financials AS
SELECT 
  ba.id as business_account_id,
  DATE_TRUNC('month', t.created_at) as month,
  COUNT(t.id) as transaction_count,
  COALESCE(SUM(t.amount), 0) as total_amount,
  COALESCE(SUM(CASE WHEN t.type IN ('DEBIT', 'PAYMENT_SENT', 'TRANSFER_OUT') THEN t.amount ELSE 0 END), 0) as total_debits,
  COALESCE(SUM(CASE WHEN t.type IN ('CREDIT', 'PAYMENT_RECEIVED', 'TRANSFER_IN') THEN t.amount ELSE 0 END), 0) as total_credits,
  COALESCE(SUM(CASE WHEN t.category = 'SALES' THEN t.amount ELSE 0 END), 0) as sales_revenue,
  COALESCE(SUM(CASE WHEN t.category = 'EXPENSES' THEN t.amount ELSE 0 END), 0) as total_expenses
FROM business_accounts ba
LEFT JOIN transactions t ON t.business_account_id = ba.id AND t.status = 'COMPLETED'
GROUP BY ba.id, DATE_TRUNC('month', t.created_at);

-- Create functions for materialized view refresh
CREATE OR REPLACE FUNCTION refresh_business_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_business_summary;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_monthly_financials()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_financials;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic updates
CREATE OR REPLACE FUNCTION update_business_account_balance()
RETURNS trigger AS $$
BEGIN
  -- Update account balance when transactions complete
  IF TG_TABLE_NAME = 'transactions' AND NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
    UPDATE accounts 
    SET 
      balance = balance + CASE 
        WHEN NEW.type IN ('CREDIT', 'PAYMENT_RECEIVED', 'TRANSFER_IN') THEN NEW.amount
        WHEN NEW.type IN ('DEBIT', 'PAYMENT_SENT', 'TRANSFER_OUT') THEN -NEW.amount
        ELSE 0
      END,
      updated_at = NOW()
    WHERE id = NEW.account_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_balance
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_business_account_balance();

-- Create RBAC base roles
INSERT INTO roles (id, name, description, permissions, is_system) VALUES
  ('admin-base', 'ADMIN', 'System Administrator', '["*:*"]', true),
  ('finance-base', 'FINANCE', 'Finance Manager', '["finance:*", "reports:*", "transactions:read", "accounts:*"]', true),
  ('ai-base', 'AI_ANALYST', 'AI Business Analyst', '["ai:*", "analytics:*", "reports:read", "transactions:read"]', true),
  ('business-owner', 'BUSINESS_OWNER', 'Business Account Owner', '["business:*", "accounts:*", "transactions:*", "invoices:*", "expenses:*", "reports:*"]', true),
  ('business-admin', 'BUSINESS_ADMIN', 'Business Administrator', '["business:read", "accounts:*", "transactions:*", "invoices:*", "expenses:*", "reports:read"]', true),
  ('business-finance', 'BUSINESS_FINANCE', 'Business Finance User', '["accounts:read", "transactions:read", "invoices:*", "expenses:*", "reports:read"]', true),
  ('business-viewer', 'BUSINESS_VIEWER', 'Business Read-only User', '["business:read", "accounts:read", "transactions:read", "invoices:read", "expenses:read", "reports:read"]', true)
ON CONFLICT (name) DO NOTHING;

-- Create default system user for AI operations
INSERT INTO users (id, email, email_verified, first_name, last_name, status) VALUES
  ('ai-system-user', 'ai-system@mnbara.internal', true, 'AI System', 'User', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

-- Assign AI role to system user
INSERT INTO user_roles (user_id, role_id, assigned_by) 
SELECT u.id, r.id, 'system'
FROM users u, roles r 
WHERE u.email = 'ai-system@mnbara.internal' AND r.name = 'ai-base'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Create default business account for demonstration
INSERT INTO business_accounts (id, name, legal_name, business_type, status, currency, onboarded_at) VALUES
  ('demo-business', 'Demo Business Account', 'Demo Business LLC', 'LLC', 'ACTIVE', 'USD', NOW())
ON CONFLICT (id) DO NOTHING;

-- Create default checking account for demo business
INSERT INTO accounts (id, business_account_id, account_number, account_type, name, currency, balance, available_balance, status) VALUES
  ('demo-checking', 'demo-business', '100000001', 'CHECKING', 'Business Checking Account', 'USD', 50000.00, 50000.00, 'ACTIVE')
ON CONFLICT (account_number) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO public;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO public;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO public;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO public;

-- Set up row-level security for business accounts
ALTER TABLE business_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic - will be enhanced in later sprints)
CREATE POLICY business_accounts_policy ON business_accounts
  FOR ALL USING (true); -- Will be replaced with proper user-based policies

CREATE POLICY accounts_policy ON accounts
  FOR ALL USING (true); -- Will be replaced with proper user-based policies

CREATE POLICY transactions_policy ON transactions
  FOR ALL USING (true); -- Will be replaced with proper user-based policies

CREATE POLICY invoices_policy ON invoices
  FOR ALL USING (true); -- Will be replaced with proper user-based policies

CREATE POLICY expenses_policy ON expenses
  FOR ALL USING (true); -- Will be replaced with proper user-based policies

CREATE POLICY ai_analyses_policy ON ai_analyses
  FOR ALL USING (true); -- Will be replaced with proper user-based policies

CREATE POLICY financial_reports_policy ON financial_reports
  FOR ALL USING (true); -- Will be replaced with proper user-based policies

CREATE POLICY business_audit_logs_policy ON business_audit_logs
  FOR ALL USING (true); -- Will be replaced with proper user-based policies

-- Create indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_business_accounts_owner ON business_accounts(id);
CREATE INDEX IF NOT EXISTS idx_accounts_owner ON accounts(business_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_owner ON transactions(business_account_id);
CREATE INDEX IF NOT EXISTS idx_invoices_owner ON invoices(business_account_id);
CREATE INDEX IF NOT EXISTS idx_expenses_owner ON expenses(business_account_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_owner ON ai_analyses(business_account_id);
CREATE INDEX IF NOT EXISTS idx_financial_reports_owner ON financial_reports(business_account_id);
CREATE INDEX IF NOT EXISTS idx_business_audit_logs_owner ON business_audit_logs(business_account_id);

COMMIT;
