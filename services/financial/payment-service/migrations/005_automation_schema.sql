-- Automation and Smart Escrow Release Schema
-- This migration adds tables for automated payouts, intelligent escrow release, and PSP integration

-- Automated Payout Rules
CREATE TABLE automated_payout_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES users(id),
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('threshold', 'schedule', 'instant', 'conditional')),
    trigger_conditions JSONB NOT NULL,
    payout_settings JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    auto_approve BOOLEAN DEFAULT false,
    risk_threshold INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automated Payout Executions
CREATE TABLE automated_payout_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES automated_payout_rules(id),
    seller_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(20,2) NOT NULL,
    fee_amount DECIMAL(20,2) NOT NULL,
    net_amount DECIMAL(20,2) NOT NULL,
    execution_status VARCHAR(50) NOT NULL CHECK (execution_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    trigger_reason TEXT NOT NULL,
    execution_details JSONB,
    error_message TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Smart Escrow Release Rules
CREATE TABLE escrow_release_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('delivery_confirmation', 'time_based', 'quality_check', 'hybrid')),
    trigger_conditions JSONB NOT NULL,
    release_conditions JSONB NOT NULL,
    verification_methods JSONB,
    is_active BOOLEAN DEFAULT true,
    auto_release BOOLEAN DEFAULT false,
    cooldown_period_hours INTEGER DEFAULT 24,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Escrow Release Executions
CREATE TABLE escrow_release_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escrow_transaction_id UUID NOT NULL REFERENCES escrow_kenya_transactions(id),
    rule_id UUID NOT NULL REFERENCES escrow_release_rules(id),
    release_status VARCHAR(50) NOT NULL CHECK (release_status IN ('triggered', 'verifying', 'approved', 'released', 'failed', 'cancelled')),
    trigger_reason TEXT NOT NULL,
    verification_data JSONB,
    release_details JSONB,
    risk_score INTEGER,
    requires_manual_review BOOLEAN DEFAULT false,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    released_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PSP Integration Configurations
CREATE TABLE psp_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    psp_name VARCHAR(100) NOT NULL,
    psp_type VARCHAR(50) NOT NULL CHECK (psp_type IN ('stripe', 'paypal', 'adyen', 'square', 'razorpay', 'paystack', 'flutterwave')),
    region VARCHAR(50) NOT NULL,
    api_credentials JSONB NOT NULL,
    webhook_endpoints JSONB,
    supported_currencies TEXT[] NOT NULL,
    supported_methods TEXT[] NOT NULL,
    fee_structure JSONB NOT NULL,
    rate_limits JSONB,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PSP Transaction Mappings
CREATE TABLE psp_transaction_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internal_transaction_id UUID NOT NULL REFERENCES escrow_kenya_transactions(id),
    psp_id UUID NOT NULL REFERENCES psp_configurations(id),
    psp_transaction_id VARCHAR(255) NOT NULL,
    psp_status VARCHAR(100) NOT NULL,
    psp_response JSONB,
    routing_reason VARCHAR(255),
    fallback_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PSP Health Monitoring
CREATE TABLE psp_health_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    psp_id UUID NOT NULL REFERENCES psp_configurations(id),
    status VARCHAR(50) NOT NULL CHECK (status IN ('healthy', 'degraded', 'down', 'maintenance')),
    response_time_ms INTEGER,
    success_rate DECIMAL(5,2),
    error_rate DECIMAL(5,2),
    last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    consecutive_failures INTEGER DEFAULT 0,
    uptime_percentage DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation Audit Log
CREATE TABLE automation_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_type VARCHAR(50) NOT NULL CHECK (automation_type IN ('payout', 'escrow_release', 'psp_routing')),
    entity_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    execution_details JSONB,
    error_message TEXT,
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation Settings
CREATE TABLE automation_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(50) NOT NULL CHECK (setting_type IN ('boolean', 'integer', 'decimal', 'string', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_automated_payout_rules_seller_id ON automated_payout_rules(seller_id);
CREATE INDEX idx_automated_payout_rules_active ON automated_payout_rules(is_active);
CREATE INDEX idx_automated_payout_executions_seller_id ON automated_payout_executions(seller_id);
CREATE INDEX idx_automated_payout_executions_status ON automated_payout_executions(execution_status);
CREATE INDEX idx_automated_payout_executions_executed_at ON automated_payout_executions(executed_at);

CREATE INDEX idx_escrow_release_rules_active ON escrow_release_rules(is_active);
CREATE INDEX idx_escrow_release_executions_transaction_id ON escrow_release_executions(escrow_transaction_id);
CREATE INDEX idx_escrow_release_executions_status ON escrow_release_executions(release_status);
CREATE INDEX idx_escrow_release_executions_triggered_at ON escrow_release_executions(triggered_at);

CREATE INDEX idx_psp_configurations_active ON psp_configurations(is_active);
CREATE INDEX idx_psp_configurations_region ON psp_configurations(region);
CREATE INDEX idx_psp_configurations_priority ON psp_configurations(priority DESC);

CREATE INDEX idx_psp_transaction_mappings_internal_id ON psp_transaction_mappings(internal_transaction_id);
CREATE INDEX idx_psp_transaction_mappings_psp_id ON psp_transaction_mappings(psp_id);
CREATE INDEX idx_psp_transaction_mappings_psp_tx_id ON psp_transaction_mappings(psp_transaction_id);

CREATE INDEX idx_psp_health_status_psp_id ON psp_health_status(psp_id);
CREATE INDEX idx_psp_health_status_last_check ON psp_health_status(last_check);

CREATE INDEX idx_automation_audit_log_type ON automation_audit_log(automation_type);
CREATE INDEX idx_automation_audit_log_entity_id ON automation_audit_log(entity_id);
CREATE INDEX idx_automation_audit_log_performed_at ON automation_audit_log(performed_at);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_automated_payout_rules_updated_at BEFORE UPDATE ON automated_payout_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escrow_release_rules_updated_at BEFORE UPDATE ON escrow_release_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_psp_configurations_updated_at BEFORE UPDATE ON psp_configurations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_psp_transaction_mappings_updated_at BEFORE UPDATE ON psp_transaction_mappings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_settings_updated_at BEFORE UPDATE ON automation_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for automation logic

-- Function to check if seller qualifies for automated payout
CREATE OR REPLACE FUNCTION check_automated_payout_eligibility(seller_uuid UUID, amount DECIMAL)
RETURNS BOOLEAN AS $$
DECLARE
    risk_score INTEGER;
    successful_payouts INTEGER;
    total_payout_amount DECIMAL;
    last_payout_date TIMESTAMP WITH TIME ZONE;
    days_since_last_payout INTEGER;
    is_verified BOOLEAN;
BEGIN
    -- Get seller's risk score and verification status
    SELECT 
        COALESCE(risk_score, 0),
        COALESCE(is_verified, false)
    INTO risk_score, is_verified
    FROM seller_payout_profiles
    WHERE seller_id = seller_uuid;
    
    -- Check if seller is verified and has acceptable risk score
    IF NOT is_verified OR risk_score > 30 THEN
        RETURN FALSE;
    END IF;
    
    -- Count successful payouts
    SELECT COUNT(*), COALESCE(SUM(net_amount), 0), MAX(paid_at)
    INTO successful_payouts, total_payout_amount, last_payout_date
    FROM payout_requests
    WHERE seller_id = seller_uuid AND status = 'paid';
    
    -- Minimum successful payouts required
    IF successful_payouts < 3 THEN
        RETURN FALSE;
    END IF;
    
    -- Check minimum total payout amount
    IF total_payout_amount < 1000 THEN
        RETURN FALSE;
    END IF;
    
    -- Check cooldown period (at least 7 days since last payout)
    IF last_payout_date IS NOT NULL THEN
        days_since_last_payout := EXTRACT(DAYS FROM NOW() - last_payout_date);
        IF days_since_last_payout < 7 THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    -- Check amount limits
    IF amount > 5000 THEN -- Maximum for automated payout
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to determine best PSP for transaction
CREATE OR REPLACE FUNCTION select_best_psp(region VARCHAR, amount DECIMAL, currency VARCHAR, method VARCHAR)
RETURNS UUID AS $$
DECLARE
    best_psp_id UUID;
BEGIN
    SELECT id INTO best_psp_id
    FROM psp_configurations
    WHERE is_active = true
      AND region = region
      AND currency = ANY(supported_currencies)
      AND method = ANY(supported_methods)
      AND (amount >= (fee_structure->>'min_amount')::DECIMAL OR (fee_structure->>'min_amount') IS NULL)
      AND (amount <= (fee_structure->>'max_amount')::DECIMAL OR (fee_structure->>'max_amount') IS NULL)
    ORDER BY priority DESC, 
             (fee_structure->>'fee_percentage')::DECIMAL ASC,
             (fee_structure->>'fixed_fee')::DECIMAL ASC
    LIMIT 1;
    
    RETURN best_psp_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check escrow release conditions
CREATE OR REPLACE FUNCTION check_escrow_release_conditions(escrow_tx_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    transaction_status VARCHAR;
    days_since_creation INTEGER;
    delivery_confirmed BOOLEAN;
    buyer_satisfied BOOLEAN;
    dispute_exists BOOLEAN;
BEGIN
    -- Get current transaction status
    SELECT status, created_at
    INTO transaction_status, days_since_creation
    FROM escrow_kenya_transactions
    WHERE id = escrow_tx_id;
    
    -- Check if transaction is in funded status
    IF transaction_status != 'funded' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if there are active disputes
    SELECT EXISTS(
        SELECT 1 FROM disputes 
        WHERE escrow_transaction_id = escrow_tx_id 
        AND status IN ('open', 'investigating')
    ) INTO dispute_exists;
    
    IF dispute_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Check delivery confirmation (this would come from tracking system)
    SELECT COALESCE(delivery_confirmed, false)
    INTO delivery_confirmed
    FROM order_tracking
    WHERE escrow_transaction_id = escrow_tx_id;
    
    -- Check buyer satisfaction (this would come from rating system)
    SELECT COALESCE(satisfied, false)
    INTO buyer_satisfied
    FROM buyer_satisfaction
    WHERE escrow_transaction_id = escrow_tx_id;
    
    -- Release conditions
    days_since_creation := EXTRACT(DAYS FROM NOW() - (SELECT created_at FROM escrow_kenya_transactions WHERE id = escrow_tx_id));
    
    -- Auto-release if 14 days passed and no disputes
    IF days_since_creation >= 14 AND NOT dispute_exists THEN
        RETURN TRUE;
    END IF;
    
    -- Auto-release if delivery confirmed and buyer satisfied
    IF delivery_confirmed AND buyer_satisfied AND NOT dispute_exists THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Views for automation monitoring

CREATE VIEW automation_dashboard AS
SELECT 
    'automated_payouts' as automation_type,
    COUNT(*) as total_executions,
    COUNT(CASE WHEN execution_status = 'completed' THEN 1 END) as successful,
    COUNT(CASE WHEN execution_status = 'failed' THEN 1 END) as failed,
    SUM(amount) as total_amount_processed,
    AVG(EXTRACT(EPOCH FROM (completed_at - executed_at))/3600) as avg_processing_hours,
    DATE_TRUNC('day', executed_at) as execution_date
FROM automated_payout_executions
WHERE executed_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', executed_at)

UNION ALL

SELECT 
    'escrow_releases' as automation_type,
    COUNT(*) as total_executions,
    COUNT(CASE WHEN release_status = 'released' THEN 1 END) as successful,
    COUNT(CASE WHEN release_status = 'failed' THEN 1 END) as failed,
    0 as total_amount_processed,
    AVG(EXTRACT(EPOCH FROM (released_at - triggered_at))/3600) as avg_processing_hours,
    DATE_TRUNC('day', triggered_at) as execution_date
FROM escrow_release_executions
WHERE triggered_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', triggered_at);

-- Insert default automation settings
INSERT INTO automation_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('automated_payouts_enabled', 'true', 'boolean', 'Enable automated payout processing', false),
('automated_payout_max_amount', '5000.00', 'decimal', 'Maximum amount for automated payouts', false),
('automated_payout_cooldown_days', '7', 'integer', 'Cooldown days between automated payouts', false),
('escrow_auto_release_enabled', 'true', 'boolean', 'Enable automatic escrow release', false),
('escrow_auto_release_days', '14', 'integer', 'Days after which escrow is auto-released', false),
('psp_health_check_interval', '300', 'integer', 'PSP health check interval in seconds', false),
('psp_failure_threshold', '3', 'integer', 'Consecutive failures before PSP is marked as down', false),
('automation_audit_retention_days', '365', 'integer', 'Days to retain automation audit logs', false);

-- Insert default PSP configurations (example)
INSERT INTO psp_configurations (psp_name, psp_type, region, api_credentials, webhook_endpoints, supported_currencies, supported_methods, fee_structure, is_active, priority) VALUES
('Stripe Connect', 'stripe', 'global', 
 '{"publishable_key": "pk_test_...", "secret_key": "sk_test_..."}',
 '{"payment": "https://webhook.site/stripe", "payout": "https://webhook.site/stripe-payout"}',
 ARRAY['USD', 'EUR', 'GBP'], ARRAY['card', 'bank_transfer'],
 '{"fee_percentage": 2.9, "fixed_fee": 0.30, "min_amount": 0.50, "max_amount": 100000}',
 true, 1),
('PayPal Business', 'paypal', 'global',
 '{"client_id": "...", "client_secret": "..."}',
 '{"payment": "https://webhook.site/paypal", "payout": "https://webhook.site/paypal-payout"}',
 ARRAY['USD', 'EUR', 'GBP'], ARRAY['paypal', 'bank_transfer'],
 '{"fee_percentage": 2.9, "fixed_fee": 0.30, "min_amount": 0.50, "max_amount": 100000}',
 true, 2);

-- Create default escrow release rules
INSERT INTO escrow_release_rules (rule_name, rule_type, trigger_conditions, release_conditions, verification_methods, is_active, auto_release, cooldown_period_hours) VALUES
('Delivery Confirmation', 'delivery_confirmation',
 '{"delivery_required": true, "tracking_verified": true}',
 '{"buyer_satisfied": true, "no_disputes": true}',
 '{"tracking_api": true, "delivery_confirmation": true}',
 true, true, 24),
('Time-Based Release', 'time_based',
 '{"days_since_funding": 14}',
 '{"no_disputes": true, "transaction_complete": true}',
 '{"time_check": true, "dispute_check": true}',
 true, true, 0),
('Quality Check', 'quality_check',
 '{"rating_received": true, "minimum_rating": 4}',
 '{"buyer_satisfied": true, "quality_verified": true}',
 '{"rating_system": true, "quality_check": true}',
 true, false, 48);

COMMIT;
