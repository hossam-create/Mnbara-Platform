-- Orders Schema Definition
-- =========================
-- This schema defines the orders table structure for the Mnbara Platform.

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Order Identification
    order_number VARCHAR(50) NOT NULL UNIQUE,
    reference_number VARCHAR(100),
    
    -- Relationships
    user_id UUID NOT NULL REFERENCES users(id),
    vendor_id UUID REFERENCES users(id),
    
    -- Order Status
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'processing', 'ready', 'shipped', 
        'delivered', 'completed', 'cancelled', 'refunded', 'disputed'
    )),
    sub_status VARCHAR(50),
    status_history JSONB DEFAULT '[]'::jsonb,
    
    -- Pricing
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    shipping_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    coupon_code VARCHAR(50),
    coupon_discount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Payment Status
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN (
        'pending', 'processing', 'paid', 'partially_refunded', 'refunded', 'failed', 'cancelled'
    )),
    payment_method VARCHAR(50),
    payment_id UUID,
    
    -- Shipping Information
    shipping_address JSONB NOT NULL,
    shipping_method VARCHAR(100),
    shipping_carrier VARCHAR(100),
    shipping_tracking_number VARCHAR(200),
    shipping_estimated_delivery DATE,
    shipping_actual_delivery DATE,
    shipping_notes TEXT,
    
    -- Billing Information
    billing_address JSONB NOT NULL,
    billing_same_as_shipping BOOLEAN DEFAULT TRUE,
    
    -- Vendor Information
    vendor_name VARCHAR(200),
    vendor_email VARCHAR(255),
    vendor_phone VARCHAR(50),
    
    -- Items Summary
    items_count INTEGER NOT NULL DEFAULT 0,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Timestamps
    ordered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    -- Notes & Communication
    customer_notes TEXT,
    internal_notes TEXT,
    
    -- Analytics & Tracking
    source VARCHAR(50) DEFAULT 'web' CHECK (source IN ('web', 'mobile', 'api', 'admin', 'pos')),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT orders_total_positive CHECK (total_amount >= 0),
    CONSTRAINT orders_items_count CHECK (items_count >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_ordered_at ON orders(ordered_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_shipped_at ON orders(shipped_at);
CREATE INDEX IF NOT EXISTS idx_orders_delivered_at ON orders(delivered_at);
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON orders(deleted_at) WHERE deleted_at IS NULL;

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    variant_id UUID,
    
    -- Item Details
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    
    -- Pricing
    unit_price DECIMAL(12, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    final_price DECIMAL(12, 2) NOT NULL,
    
    -- Vendor Information
    vendor_id UUID REFERENCES users(id),
    vendor_name VARCHAR(200),
    
    -- Fulfillment
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'processing', 'ready', 'shipped', 'delivered', 'returned', 'cancelled'
    )),
    tracking_number VARCHAR(200),
    carrier VARCHAR(100),
    
    -- Ratings & Reviews
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_vendor ON order_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);

-- Order Status History Table
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    sub_status VARCHAR(50),
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history(created_at DESC);

-- Order Timeline Table (Detailed Events)
CREATE TABLE IF NOT EXISTS order_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    description TEXT NOT NULL,
    is_visible_to_customer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_timeline_order ON order_timeline(order_id);
CREATE INDEX IF NOT EXISTS idx_order_timeline_event_type ON order_timeline(event_type);
CREATE INDEX IF NOT EXISTS idx_order_timeline_created_at ON order_timeline(created_at DESC);

-- Order Cancellations Table
CREATE TABLE IF NOT EXISTS order_cancellations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES users(id),
    reason VARCHAR(100) NOT NULL,
    reason_detail TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
    refund_amount DECIMAL(12, 2),
    refund_method VARCHAR(50),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_cancellations_order ON order_cancellations(order_id);
CREATE INDEX IF NOT EXISTS idx_order_cancellations_status ON order_cancellations(status);

-- Order Returns Table
CREATE TABLE IF NOT EXISTS order_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    return_number VARCHAR(50) NOT NULL UNIQUE,
    requested_by UUID REFERENCES users(id),
    reason VARCHAR(100) NOT NULL,
    reason_detail TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'rejected', 'label_created', 
        'in_transit', 'received', 'inspected', 
        'refunded', 'completed', 'cancelled'
    )),
    return_method VARCHAR(50) DEFAULT 'mail_in' CHECK (return_method IN ('mail_in', 'in_store', 'pickup')),
    return_address JSONB,
    shipping_label_url VARCHAR(500),
    tracking_number VARCHAR(200),
    carrier VARCHAR(100),
    refund_amount DECIMAL(12, 2),
    refund_method VARCHAR(50),
    refund_initiated_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_returns_order ON order_returns(order_id);
CREATE INDEX IF NOT EXISTS idx_order_returns_return_number ON order_returns(return_number);
CREATE INDEX IF NOT EXISTS idx_order_returns_status ON order_returns(status);
CREATE INDEX IF NOT EXISTS idx_order_returns_requested_by ON order_returns(requested_by);

-- Return Items Table
CREATE TABLE IF NOT EXISTS return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID NOT NULL REFERENCES order_returns(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    reason VARCHAR(100),
    condition VARCHAR(50) CHECK (condition IN ('unopened', 'opened', 'damaged', 'defective', 'wrong_item')),
    refund_amount DECIMAL(12, 2),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'received', 'inspected', 'refunded', 'rejected')),
    inspection_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_return_items_return ON return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_return_items_order_item ON return_items(order_item_id);

-- Generate order number function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    date_part VARCHAR;
    sequence_num INTEGER;
    order_num VARCHAR(50);
BEGIN
    date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 9) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM orders
    WHERE SUBSTRING(order_number FROM 1 FOR 8) = 'ORD-' || date_part;
    
    order_num := 'ORD-' || date_part || '-' || LPAD(sequence_num::VARCHAR, 6, '0');
    
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Generate return number function
CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    date_part VARCHAR;
    sequence_num INTEGER;
    return_num VARCHAR(50);
BEGIN
    date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(return_number FROM 9) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM order_returns
    WHERE SUBSTRING(return_number FROM 1 FOR 8) = 'RET-' || date_part;
    
    return_num := 'RET-' || date_part || '-' || LPAD(sequence_num::VARCHAR, 6, '0');
    
    RETURN return_num;
END;
$$ LANGUAGE plpgsql;

-- Update trigger for orders
DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_user_timestamp();

-- Update trigger for order_items
DROP TRIGGER IF EXISTS order_items_updated_at ON order_items;
CREATE TRIGGER order_items_updated_at
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_user_timestamp();

-- Update trigger for order_returns
DROP TRIGGER IF EXISTS order_returns_updated_at ON order_returns;
CREATE TRIGGER order_returns_updated_at
    BEFORE UPDATE ON order_returns
    FOR EACH ROW
    EXECUTE FUNCTION update_user_timestamp();
