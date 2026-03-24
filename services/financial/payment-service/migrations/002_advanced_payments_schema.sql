-- Advanced Payments Schema for Mnbarh Marketplace
-- Payouts, Escrow, Disputes, Subscriptions, Multi-currency, Saved Payment Methods

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== PAYOUTS SYSTEM ====================

-- Bank accounts for sellers
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(255) NOT NULL, -- Last 4 digits only for security
    routing_number VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('checking', 'savings')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
    stripe_account_id VARCHAR(255),
    stripe_external_account_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_user_bank_account UNIQUE (user_id, account_number, routing_number)
);

-- Seller Stripe Connect accounts
CREATE TABLE IF NOT EXISTS seller_stripe_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    stripe_account_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'restricted', 'disabled')),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    capabilities_payouts BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Payouts to sellers
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL,
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
    amount_cents INTEGER NOT NULL,
    fee_cents INTEGER NOT NULL DEFAULT 0,
    net_amount_cents INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'canceled')),
    currency VARCHAR(3) DEFAULT 'USD',
    stripe_transfer_id VARCHAR(255),
    escrow_id UUID REFERENCES escrow_holdings(id),
    release_reason TEXT,
    error_message TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT positive_payout_amounts CHECK (amount_cents > 0 AND net_amount_cents >= 0)
);

-- Payout batches for automated processing
CREATE TABLE IF NOT EXISTS payout_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    total_amount_cents INTEGER NOT NULL,
    total_fees_cents INTEGER NOT NULL,
    payout_count INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==================== ESCROW SYSTEM ====================

-- Escrow holdings
CREATE TABLE IF NOT EXISTS escrow_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id),
    buyer_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    amount_cents INTEGER NOT NULL,
    stripe_hold_id VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'cancelled', 'expired')),
    auto_release_date TIMESTAMP,
    released_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    release_reason TEXT,
    cancellation_reason TEXT,
    initiated_by VARCHAR(20) CHECK (initiated_by IN ('buyer', 'seller', 'admin')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT positive_escrow_amount CHECK (amount_cents > 0)
);

-- Escrow release conditions
CREATE TABLE IF NOT EXISTS escrow_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escrow_id UUID NOT NULL REFERENCES escrow_holdings(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('delivery_confirmation', 'tracking_update', 'time_based', 'manual')),
    value TEXT,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_escrow_condition UNIQUE (escrow_id, type)
);

-- ==================== DISPUTE SYSTEM ====================

-- Disputes
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id),
    initiator_id UUID NOT NULL,
    respondent_id UUID NOT NULL,
    dispute_type VARCHAR(50) NOT NULL CHECK (dispute_type IN (
        'item_not_received', 'item_not_as_described', 'damaged_item', 'wrong_item', 'other'
    )),
    description TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    requested_resolution VARCHAR(50) NOT NULL CHECK (requested_resolution IN ('refund', 'partial_refund', 'return', 'exchange')),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'escalated', 'resolved', 'dismissed')),
    winner VARCHAR(20) CHECK (winner IN ('buyer', 'seller', 'split')),
    refund_amount_cents INTEGER DEFAULT 0,
    refund_id VARCHAR(255),
    resolution_reason TEXT,
    resolved_by UUID,
    resolved_at TIMESTAMP,
    escalated_at TIMESTAMP,
    escalated_by UUID,
    escalation_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Dispute evidence
CREATE TABLE IF NOT EXISTS dispute_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID NOT NULL REFERENCES disputes(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('photo', 'video', 'document', 'message', 'tracking_info')),
    url TEXT NOT NULL,
    description TEXT,
    uploaded_by VARCHAR(20) NOT NULL CHECK (uploaded_by IN ('buyer', 'seller')),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_dispute_evidence UNIQUE (dispute_id, type, url)
);

-- Dispute messages
CREATE TABLE IF NOT EXISTS dispute_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID NOT NULL REFERENCES disputes(id),
    sender_id UUID NOT NULL,
    message TEXT NOT NULL,
    attachments TEXT[], -- Array of file URLs
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==================== SUBSCRIPTIONS ====================

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL,
    interval VARCHAR(20) NOT NULL CHECK (interval IN ('month', 'year')),
    features JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    stripe_product_id VARCHAR(255),
    stripe_price_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT positive_plan_price CHECK (price_cents > 0)
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'canceled_at_period_end')),
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    canceled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_user_active_subscription UNIQUE (user_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- ==================== SAVED PAYMENT METHODS ====================

-- User Stripe customers
CREATE TABLE IF NOT EXISTS user_stripe_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Saved payment methods
CREATE TABLE IF NOT EXISTS saved_payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('card', 'bank_account')),
    last4 VARCHAR(4) NOT NULL,
    brand VARCHAR(50), -- For cards (visa, mastercard, etc.)
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default BOOLEAN DEFAULT FALSE,
    stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ==================== MULTI-CURRENCY ====================

-- Currency exchange rates
CREATE TABLE IF NOT EXISTS currency_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(10,6) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_currency_pair UNIQUE (from_currency, to_currency),
    CONSTRAINT positive_rate CHECK (rate > 0)
);

-- Supported currencies
CREATE TABLE IF NOT EXISTS supported_currencies (
    code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    stripe_supported BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==================== INSTALLMENTS ====================

-- Installment plans
CREATE TABLE IF NOT EXISTS installment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    total_amount_cents INTEGER NOT NULL,
    installment_amount_cents INTEGER NOT NULL,
    installment_count INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'canceled')),
    stripe_subscription_id VARCHAR(255),
    completed_installments INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT positive_installment_amounts CHECK (total_amount_cents > 0 AND installment_amount_cents > 0)
);

-- ==================== INDEXES ====================

-- Payouts indexes
CREATE INDEX IF NOT EXISTS idx_payouts_seller_id ON payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_created_at ON payouts(created_at);
CREATE INDEX IF NOT EXISTS idx_payouts_stripe_transfer_id ON payouts(stripe_transfer_id);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_status ON bank_accounts(status);

CREATE INDEX IF NOT EXISTS idx_seller_stripe_accounts_user_id ON seller_stripe_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_stripe_accounts_status ON seller_stripe_accounts(status);

-- Escrow indexes
CREATE INDEX IF NOT EXISTS idx_escrow_holdings_payment_id ON escrow_holdings(payment_id);
CREATE INDEX IF NOT EXISTS idx_escrow_holdings_buyer_id ON escrow_holdings(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_holdings_seller_id ON escrow_holdings(seller_id);
CREATE INDEX IF NOT EXISTS idx_escrow_holdings_status ON escrow_holdings(status);
CREATE INDEX IF NOT EXISTS idx_escrow_holdings_auto_release ON escrow_holdings(auto_release_date);

CREATE INDEX IF NOT EXISTS idx_escrow_conditions_escrow_id ON escrow_conditions(escrow_id);
CREATE INDEX IF NOT EXISTS idx_escrow_conditions_completed ON escrow_conditions(completed);

-- Dispute indexes
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_initiator_id ON disputes(initiator_id);
CREATE INDEX IF NOT EXISTS idx_disputes_respondent_id ON disputes(respondent_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at);

CREATE INDEX IF NOT EXISTS idx_dispute_evidence_dispute_id ON dispute_evidence(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute_id ON dispute_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_sender_id ON dispute_messages(sender_id);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_id ON user_subscriptions(stripe_subscription_id);

-- Payment method indexes
CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_user_id ON saved_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_is_default ON saved_payment_methods(is_default);
CREATE INDEX IF NOT EXISTS idx_user_stripe_customers_user_id ON user_stripe_customers(user_id);

-- Currency indexes
CREATE INDEX IF NOT EXISTS idx_currency_rates_timestamp ON currency_rates(timestamp);
CREATE INDEX IF NOT EXISTS idx_supported_currencies_is_active ON supported_currencies(is_active);

-- Installment indexes
CREATE INDEX IF NOT EXISTS idx_installment_plans_user_id ON installment_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_installment_plans_status ON installment_plans(status);

-- ==================== TRIGGERS AND FUNCTIONS ====================

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seller_stripe_accounts_updated_at BEFORE UPDATE ON seller_stripe_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escrow_holdings_updated_at BEFORE UPDATE ON escrow_holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_payment_methods_updated_at BEFORE UPDATE ON saved_payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stripe_customers_updated_at BEFORE UPDATE ON user_stripe_customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_installment_plans_updated_at BEFORE UPDATE ON installment_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ensure only one default payment method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE saved_payment_methods SET is_default = FALSE 
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_payment_method_trigger
    BEFORE INSERT OR UPDATE ON saved_payment_methods
    FOR EACH ROW EXECUTE FUNCTION ensure_single_default_payment_method();

-- ==================== VIEWS ====================

-- Payout summary view
CREATE OR REPLACE VIEW payout_summary AS
SELECT 
    p.seller_id,
    COUNT(*) as total_payouts,
    SUM(p.amount_cents) as total_amount,
    SUM(p.fee_cents) as total_fees,
    SUM(p.net_amount_cents) as total_net,
    COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_payouts,
    COUNT(CASE WHEN p.status = 'processing' THEN 1 END) as processing_payouts,
    COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_payouts,
    COUNT(CASE WHEN p.status = 'failed' THEN 1 END) as failed_payouts,
    MAX(p.created_at) as last_payout_date
FROM payouts p
GROUP BY p.seller_id;

-- Escrow summary view
CREATE OR REPLACE VIEW escrow_summary AS
SELECT 
    e.seller_id,
    COUNT(*) as total_escrows,
    SUM(e.amount_cents) as total_held,
    COUNT(CASE WHEN e.status = 'held' THEN 1 END) as currently_held,
    COUNT(CASE WHEN e.status = 'released' THEN 1 END) as released,
    COUNT(CASE WHEN e.status = 'cancelled' THEN 1 END) as cancelled,
    SUM(CASE WHEN e.status = 'held' THEN e.amount_cents ELSE 0 END) as currently_held_amount
FROM escrow_holdings e
GROUP BY e.seller_id;

-- Dispute summary view
CREATE OR REPLACE VIEW dispute_summary AS
SELECT 
    d.initiator_id,
    COUNT(*) as total_disputes_initiated,
    COUNT(CASE WHEN d.winner = 'buyer' THEN 1 END) as buyer_wins,
    COUNT(CASE WHEN d.winner = 'seller' THEN 1 END) as seller_wins,
    COUNT(CASE WHEN d.winner = 'split' THEN 1 END) as split_resolutions,
    SUM(CASE WHEN d.refund_amount_cents > 0 THEN d.refund_amount_cents ELSE 0 END) as total_refunds_received
FROM disputes d
WHERE d.status = 'resolved'
GROUP BY d.initiator_id;

-- Payment analytics view
CREATE OR REPLACE VIEW payment_analytics AS
SELECT 
    DATE_TRUNC('day', p.created_at) as date,
    COUNT(*) as total_transactions,
    SUM(p.amount_cents) as total_volume,
    AVG(p.amount_cents) as avg_transaction_value,
    COUNT(DISTINCT p.buyer_id) as unique_buyers,
    COUNT(DISTINCT p.seller_id) as unique_sellers,
    SUM(p.marketplace_fee_cents) as total_fees,
    p.currency
FROM payments p
WHERE p.status = 'succeeded'
GROUP BY DATE_TRUNC('day', p.created_at), p.currency
ORDER BY date DESC;

-- ==================== INITIAL DATA ====================

-- Insert supported currencies
INSERT INTO supported_currencies (code, name, symbol, stripe_supported) VALUES
('USD', 'United States Dollar', '$', TRUE),
('EUR', 'Euro', '€', TRUE),
('GBP', 'British Pound', '£', TRUE),
('CAD', 'Canadian Dollar', 'C$', TRUE),
('AUD', 'Australian Dollar', 'A$', TRUE),
('JPY', 'Japanese Yen', '¥', TRUE),
('SAR', 'Saudi Riyal', '﷼', TRUE),
('AED', 'UAE Dirham', 'د.إ', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price_cents, interval, features, is_active) VALUES
('Basic Seller', 'Start selling with basic features', 0, 'month', '["List up to 10 items", "Basic analytics", "Standard support"]', TRUE),
('Professional Seller', 'Advanced features for growing businesses', 999, 'month', '["Unlimited listings", "Advanced analytics", "Priority support", "Promoted listings"]', TRUE),
('Enterprise Seller', 'Full-featured solution for large businesses', 4999, 'month', '["Everything in Professional", "Dedicated account manager", "Custom branding", "API access", "Advanced insights"]', TRUE)
ON CONFLICT DO NOTHING;

COMMIT;
