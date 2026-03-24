-- Payments Schema for Mnbarh Marketplace
-- Simple payment flow without escrow or payouts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    buyer_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    listing_id UUID NOT NULL,
    
    -- Amounts (stored in cents for precision)
    amount_cents INTEGER NOT NULL,
    marketplace_fee_cents INTEGER NOT NULL,
    seller_amount_cents INTEGER NOT NULL,
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    
    -- Metadata
    currency VARCHAR(3) DEFAULT 'USD',
    stripe_fee_cents INTEGER DEFAULT 0,
    net_amount_cents INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
    CONSTRAINT positive_amounts CHECK (amount_cents > 0 AND marketplace_fee_cents >= 0 AND seller_amount_cents >= 0)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id),
    buyer_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    listing_id UUID NOT NULL,
    
    -- Order details
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price_cents INTEGER NOT NULL,
    total_amount_cents INTEGER NOT NULL,
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    
    -- Shipping information
    shipping_address JSONB NOT NULL,
    tracking_number VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    paid_at TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_order_status CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'canceled')),
    CONSTRAINT positive_quantity CHECK (quantity > 0),
    CONSTRAINT positive_prices CHECK (unit_price_cents > 0 AND total_amount_cents > 0)
);

-- Transactions table (for accounting)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id),
    
    -- Transaction details
    type VARCHAR(50) NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Parties involved
    from_user_id UUID REFERENCES users(id),
    to_user_id UUID REFERENCES users(id),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_transaction_type CHECK (type IN ('sale', 'marketplace_fee', 'stripe_fee', 'refund')),
    CONSTRAINT valid_transaction_status CHECK (status IN ('pending', 'completed', 'failed')),
    CONSTRAINT positive_transaction_amount CHECK (amount_cents > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_stripe_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_buyer_id ON payments(buyer_id);
CREATE INDEX IF NOT EXISTS idx_payments_seller_id ON payments(seller_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

CREATE INDEX IF NOT EXISTS idx_transactions_payment_id ON transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from_user ON transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_user ON transactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create payment record with validation
CREATE OR REPLACE FUNCTION create_payment_record(
    p_stripe_payment_intent_id VARCHAR,
    p_buyer_id UUID,
    p_seller_id UUID,
    p_listing_id UUID,
    p_amount_cents INTEGER,
    p_marketplace_fee_cents INTEGER,
    p_seller_amount_cents INTEGER,
    p_currency VARCHAR DEFAULT 'USD'
)
RETURNS UUID AS $$
DECLARE
    payment_id UUID;
BEGIN
    -- Validate inputs
    IF p_amount_cents <= 0 OR p_marketplace_fee_cents < 0 OR p_seller_amount_cents < 0 THEN
        RAISE EXCEPTION 'Invalid amounts: all amounts must be positive';
    END IF;
    
    -- Insert payment record
    INSERT INTO payments (
        stripe_payment_intent_id,
        buyer_id,
        seller_id,
        listing_id,
        amount_cents,
        marketplace_fee_cents,
        seller_amount_cents,
        currency,
        status
    ) VALUES (
        p_stripe_payment_intent_id,
        p_buyer_id,
        p_seller_id,
        p_listing_id,
        p_amount_cents,
        p_marketplace_fee_cents,
        p_seller_amount_cents,
        p_currency,
        'pending'
    ) RETURNING id INTO payment_id;
    
    RETURN payment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create order record
CREATE OR REPLACE FUNCTION create_order_record(
    p_payment_intent_id VARCHAR,
    p_buyer_id UUID,
    p_seller_id UUID,
    p_listing_id UUID,
    p_quantity INTEGER,
    p_unit_price_cents INTEGER,
    p_total_amount_cents INTEGER,
    p_shipping_address JSONB
)
RETURNS UUID AS $$
DECLARE
    order_id UUID;
    payment_id UUID;
BEGIN
    -- Get payment ID
    SELECT id INTO payment_id FROM payments WHERE stripe_payment_intent_id = p_payment_intent_id;
    
    IF payment_id IS NULL THEN
        RAISE EXCEPTION 'Payment not found for intent: %', p_payment_intent_id;
    END IF;
    
    -- Insert order record
    INSERT INTO orders (
        payment_id,
        buyer_id,
        seller_id,
        listing_id,
        quantity,
        unit_price_cents,
        total_amount_cents,
        shipping_address,
        status
    ) VALUES (
        payment_id,
        p_buyer_id,
        p_seller_id,
        p_listing_id,
        p_quantity,
        p_unit_price_cents,
        p_total_amount_cents,
        p_shipping_address,
        'paid'
    ) RETURNING id INTO order_id;
    
    RETURN order_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create transaction records
CREATE OR REPLACE FUNCTION create_payment_transactions(
    p_payment_intent_id VARCHAR,
    p_item_total INTEGER,
    p_marketplace_fee INTEGER,
    p_buyer_id UUID,
    p_seller_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    payment_id UUID;
BEGIN
    -- Get payment ID
    SELECT id INTO payment_id FROM payments WHERE stripe_payment_intent_id = p_payment_intent_id;
    
    IF payment_id IS NULL THEN
        RAISE EXCEPTION 'Payment not found for intent: %', p_payment_intent_id;
    END IF;
    
    -- Create sale transaction (buyer to seller)
    INSERT INTO transactions (
        payment_id,
        type,
        amount_cents,
        currency,
        from_user_id,
        to_user_id,
        status,
        completed_at
    ) VALUES (
        payment_id,
        'sale',
        p_item_total,
        'USD',
        p_buyer_id,
        p_seller_id,
        'completed',
        NOW()
    );
    
    -- Create marketplace fee transaction (seller to platform)
    INSERT INTO transactions (
        payment_id,
        type,
        amount_cents,
        currency,
        from_user_id,
        to_user_id,
        status,
        completed_at
    ) VALUES (
        payment_id,
        'marketplace_fee',
        p_marketplace_fee,
        'USD',
        p_seller_id,
        NULL, -- Platform transactions have no specific user
        'completed',
        NOW()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- View for payment statistics
CREATE OR REPLACE VIEW payment_stats AS
SELECT 
    COUNT(*) as total_payments,
    SUM(CASE WHEN status = 'succeeded' THEN amount_cents ELSE 0 END) as total_revenue,
    SUM(CASE WHEN status = 'succeeded' THEN marketplace_fee_cents ELSE 0 END) as total_fees,
    AVG(CASE WHEN status = 'succeeded' THEN amount_cents ELSE NULL END) as avg_payment_amount,
    COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as successful_payments,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
    DATE_TRUNC('day', created_at) as date
FROM payments
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- View for seller earnings
CREATE OR REPLACE VIEW seller_earnings AS
SELECT 
    seller_id,
    COUNT(*) as total_sales,
    SUM(CASE WHEN p.status = 'succeeded' THEN p.amount_cents ELSE 0 END) as total_sales_amount,
    SUM(CASE WHEN p.status = 'succeeded' THEN p.marketplace_fee_cents ELSE 0 END) as total_fees_paid,
    SUM(CASE WHEN p.status = 'succeeded' THEN p.seller_amount_cents ELSE 0 END) as total_earnings,
    AVG(CASE WHEN p.status = 'succeeded' THEN p.amount_cents ELSE NULL END) as avg_sale_amount
FROM payments p
WHERE p.status = 'succeeded'
GROUP BY seller_id
ORDER BY total_earnings DESC;

-- View for buyer spending
CREATE OR REPLACE VIEW buyer_spending AS
SELECT 
    buyer_id,
    COUNT(*) as total_purchases,
    SUM(CASE WHEN p.status = 'succeeded' THEN p.amount_cents + p.marketplace_fee_cents ELSE 0 END) as total_spent,
    AVG(CASE WHEN p.status = 'succeeded' THEN p.amount_cents + p.marketplace_fee_cents ELSE NULL END) as avg_purchase_amount
FROM payments p
WHERE p.status = 'succeeded'
GROUP BY buyer_id
ORDER BY total_spent DESC;

-- Sample data for testing (optional)
-- INSERT INTO payments (stripe_payment_intent_id, buyer_id, seller_id, listing_id, amount_cents, marketplace_fee_cents, seller_amount_cents, status)
-- VALUES 
--     ('pi_test_123', 'buyer-uuid-1', 'seller-uuid-1', 'listing-uuid-1', 10000, 500, 9500, 'succeeded'),
--     ('pi_test_124', 'buyer-uuid-2', 'seller-uuid-1', 'listing-uuid-2', 25000, 1250, 23750, 'succeeded'),
--     ('pi_test_125', 'buyer-uuid-1', 'seller-uuid-2', 'listing-uuid-3', 5000, 250, 4750, 'failed');

COMMIT;
