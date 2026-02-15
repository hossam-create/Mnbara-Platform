-- Sprint 2 - Platform Events Integration Migration
-- Map platform business events to accounting entries

-- Platform Events Table
CREATE TABLE IF NOT EXISTS platform_events (
    id TEXT PRIMARY KEY,
    business_account_id TEXT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('ORDER_COMPLETED', 'COMMISSION_EARNED', 'REFUND_PROCESSED', 'PAYOUT_SENT', 'PAYMENT_RECEIVED', 'EXPENSE_INCURRED')),
    event_data JSONB NOT NULL DEFAULT '{}',
    source_system VARCHAR(50) NOT NULL DEFAULT 'PLATFORM',
    source_event_id TEXT,
    reference_type VARCHAR(50),
    reference_id TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'REVERSED')),
    journal_entry_id TEXT REFERENCES journal_entries(id),
    processed_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_platform_events_business (business_account_id),
    INDEX idx_platform_events_type (event_type),
    INDEX idx_platform_events_status (status),
    INDEX idx_platform_events_reference (reference_type, reference_id),
    INDEX idx_platform_events_created (created_at)
);

-- Platform Orders Table (for order completion events)
CREATE TABLE IF NOT EXISTS platform_orders (
    id TEXT PRIMARY KEY,
    business_account_id TEXT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    order_number VARCHAR(100) NOT NULL,
    customer_id TEXT,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    total_amount DECIMAL(20,2) NOT NULL,
    commission_amount DECIMAL(20,2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(20,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    order_date TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    items JSONB DEFAULT '[]',
    shipping_address JSONB,
    billing_address JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(business_account_id, order_number),
    INDEX idx_platform_orders_business (business_account_id),
    INDEX idx_platform_orders_status (status),
    INDEX idx_platform_orders_date (order_date),
    INDEX idx_platform_orders_customer (customer_id)
);

-- Platform Commissions Table
CREATE TABLE IF NOT EXISTS platform_commissions (
    id TEXT PRIMARY KEY,
    business_account_id TEXT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    order_id TEXT REFERENCES platform_orders(id) ON DELETE CASCADE,
    commission_type VARCHAR(50) NOT NULL CHECK (commission_type IN ('PLATFORM_FEE', 'SERVICE_FEE', 'TRANSACTION_FEE', 'REFERRAL_BONUS')),
    commission_rate DECIMAL(5,4) NOT NULL,
    base_amount DECIMAL(20,2) NOT NULL,
    commission_amount DECIMAL(20,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    calculated_at TIMESTAMP NOT NULL,
    paid_at TIMESTAMP,
    due_date TIMESTAMP,
    recipient_type VARCHAR(50) NOT NULL CHECK (recipient_type IN ('PLATFORM', 'SELLER', 'REFERRER')),
    recipient_id TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_platform_commissions_business (business_account_id),
    INDEX idx_platform_commissions_order (order_id),
    INDEX idx_platform_commissions_type (commission_type),
    INDEX idx_platform_commissions_status (status),
    INDEX idx_platform_commissions_date (calculated_at)
);

-- Platform Refunds Table
CREATE TABLE IF NOT EXISTS platform_refunds (
    id TEXT PRIMARY KEY,
    business_account_id TEXT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    order_id TEXT REFERENCES platform_orders(id) ON DELETE CASCADE,
    refund_number VARCHAR(100) NOT NULL,
    original_amount DECIMAL(20,2) NOT NULL,
    refund_amount DECIMAL(20,2) NOT NULL,
    refund_reason VARCHAR(255),
    refund_type VARCHAR(50) NOT NULL CHECK (refund_type IN ('FULL_REFUND', 'PARTIAL_REFUND', 'CHARGEBACK')),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    customer_refunded_at TIMESTAMP,
    platform_processed_at TIMESTAMP,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(business_account_id, refund_number),
    INDEX idx_platform_refunds_business (business_account_id),
    INDEX idx_platform_refunds_order (order_id),
    INDEX idx_platform_refunds_status (status),
    INDEX idx_platform_refunds_date (created_at)
);

-- Platform Payouts Table
CREATE TABLE IF NOT EXISTS platform_payouts (
    id TEXT PRIMARY KEY,
    business_account_id TEXT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    payout_number VARCHAR(100) NOT NULL,
    recipient_type VARCHAR(50) NOT NULL CHECK (recipient_type IN ('SELLER', 'AFFILIATE', 'EMPLOYEE', 'VENDOR')),
    recipient_id TEXT NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255),
    payout_amount DECIMAL(20,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    payout_method VARCHAR(50) NOT NULL CHECK (payout_method IN ('BANK_TRANSFER', 'PAYPAL', 'STRIPE', 'CHECK')),
    payout_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    scheduled_date DATE,
    processed_date TIMESTAMP,
    bank_account JSONB,
    reference_number VARCHAR(255),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(business_account_id, payout_number),
    INDEX idx_platform_payouts_business (business_account_id),
    INDEX idx_platform_payouts_recipient (recipient_id),
    INDEX idx_platform_payouts_status (payout_status),
    INDEX idx_platform_payouts_date (scheduled_date)
);

-- Accounting Event Mapping Table
CREATE TABLE IF NOT EXISTS accounting_event_mappings (
    id TEXT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    business_account_id TEXT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
    debit_account_id TEXT NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    credit_account_id TEXT NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    description_template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    auto_post BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    conditions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(business_account_id, event_type),
    INDEX idx_accounting_mappings_business (business_account_id),
    INDEX idx_accounting_mappings_type (event_type)
);

-- Event Processing Queue Table
CREATE TABLE IF NOT EXISTS event_processing_queue (
    id TEXT PRIMARY KEY,
    platform_event_id TEXT NOT NULL REFERENCES platform_events(id) ON DELETE CASCADE,
    queue_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    priority INTEGER DEFAULT 1,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMP,
    next_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    processing_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_event_queue_status (queue_status),
    INDEX idx_event_queue_priority (priority DESC),
    INDEX idx_event_queue_scheduled (next_attempt_at),
    INDEX idx_event_queue_attempts (attempts, max_attempts)
);

-- Create Functions for Event Processing

-- Function to create platform event and queue for processing
CREATE OR REPLACE FUNCTION create_platform_event(
    p_business_account_id TEXT,
    p_event_type VARCHAR(50),
    p_event_data JSONB,
    p_source_system VARCHAR(50) DEFAULT 'PLATFORM',
    p_source_event_id TEXT DEFAULT NULL,
    p_reference_type VARCHAR(50) DEFAULT NULL,
    p_reference_id TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    event_id TEXT;
BEGIN
    -- Create the platform event
    INSERT INTO platform_events (
        id, business_account_id, event_type, event_data, source_system, 
        source_event_id, reference_type, reference_id
    ) VALUES (
        gen_random_uuid()::text,
        p_business_account_id,
        p_event_type,
        p_event_data,
        p_source_system,
        p_source_event_id,
        p_reference_type,
        p_reference_id
    ) RETURNING id INTO event_id;
    
    -- Queue the event for processing
    INSERT INTO event_processing_queue (platform_event_id, priority)
    VALUES (event_id, 1);
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to process platform event and create journal entry
CREATE OR REPLACE FUNCTION process_platform_event(p_event_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    event_record RECORD;
    mapping_record RECORD;
    journal_entry_id TEXT;
    entry_number TEXT;
    fiscal_period_id TEXT;
BEGIN
    -- Get the platform event
    SELECT * INTO event_record 
    FROM platform_events 
    WHERE id = p_event_id AND status = 'PENDING';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Get accounting mapping for this event type
    SELECT * INTO mapping_record
    FROM accounting_event_mappings 
    WHERE event_type = event_record.event_type 
        AND business_account_id = event_record.business_account_id 
        AND is_active = true;
    
    IF NOT FOUND THEN
        -- Update event status to failed
        UPDATE platform_events 
        SET status = 'FAILED', error_message = 'No accounting mapping found'
        WHERE id = p_event_id;
        RETURN FALSE;
    END IF;
    
    -- Get fiscal period for current date
    SELECT id INTO fiscal_period_id
    FROM fiscal_periods
    WHERE business_account_id = event_record.business_account_id
        AND status = 'OPEN'
        AND CURRENT_DATE >= period_start 
        AND CURRENT_DATE <= period_end
    LIMIT 1;
    
    IF fiscal_period_id IS NULL THEN
        UPDATE platform_events 
        SET status = 'FAILED', error_message = 'No open fiscal period found'
        WHERE id = p_event_id;
        RETURN FALSE;
    END IF;
    
    -- Generate journal entry number
    SELECT get_next_journal_entry_number(event_record.business_account_id, CURRENT_DATE) INTO entry_number;
    
    -- Create journal entry
    INSERT INTO journal_entries (
        id, business_account_id, fiscal_period_id, entry_number, entry_date,
        description, reference_type, reference_id, status, total_debits, total_credits
    ) VALUES (
        gen_random_uuid()::text,
        event_record.business_account_id,
        fiscal_period_id,
        entry_number,
        CURRENT_DATE,
        REPLACE(mapping_record.description_template, '{event_data}', event_record.event_data::text),
        event_record.reference_type,
        event_record.reference_id,
        'DRAFT',
        0, 0
    ) RETURNING id INTO journal_entry_id;
    
    -- Create journal entry lines based on event type and data
    -- This is a simplified version - in production would have more complex logic
    IF event_record.event_type = 'ORDER_COMPLETED' THEN
        INSERT INTO journal_entry_lines (
            id, journal_entry_id, account_id, line_number, description, debit_amount, credit_amount
        )
        SELECT 
            gen_random_uuid()::text,
            journal_entry_id,
            mapping_record.debit_account_id,
            1,
            'Revenue from order completion',
            (event_record.event_data->>'total_amount')::DECIMAL,
            0
        UNION ALL
        SELECT 
            gen_random_uuid()::text,
            journal_entry_id,
            mapping_record.credit_account_id,
            2,
            'Accounts receivable for order',
            0,
            (event_record.event_data->>'total_amount')::DECIMAL;
    
    ELSIF event_record.event_type = 'COMMISSION_EARNED' THEN
        INSERT INTO journal_entry_lines (
            id, journal_entry_id, account_id, line_number, description, debit_amount, credit_amount
        )
        SELECT 
            gen_random_uuid()::text,
            journal_entry_id,
            mapping_record.debit_account_id,
            1,
            'Platform commission expense',
            (event_record.event_data->>'commission_amount')::DECIMAL,
            0
        UNION ALL
        SELECT 
            gen_random_uuid()::text,
            journal_entry_id,
            mapping_record.credit_account_id,
            2,
            'Commission liability',
            0,
            (event_record.event_data->>'commission_amount')::DECIMAL;
    
    ELSIF event_record.event_type = 'REFUND_PROCESSED' THEN
        INSERT INTO journal_entry_lines (
            id, journal_entry_id, account_id, line_number, description, debit_amount, credit_amount
        )
        SELECT 
            gen_random_uuid()::text,
            journal_entry_id,
            mapping_record.debit_account_id,
            1,
            'Refund processed',
            (event_record.event_data->>'refund_amount')::DECIMAL,
            0
        UNION ALL
        SELECT 
            gen_random_uuid()::text,
            journal_entry_id,
            mapping_record.credit_account_id,
            2,
            'Revenue reversal for refund',
            0,
            (event_record.event_data->>'refund_amount')::DECIMAL;
    
    ELSIF event_record.event_type = 'PAYOUT_SENT' THEN
        INSERT INTO journal_entry_lines (
            id, journal_entry_id, account_id, line_number, description, debit_amount, credit_amount
        )
        SELECT 
            gen_random_uuid()::text,
            journal_entry_id,
            mapping_record.debit_account_id,
            1,
            'Payout to ' || (event_record.event_data->>'recipient_name'),
            (event_record.event_data->>'payout_amount')::DECIMAL,
            0
        UNION ALL
        SELECT 
            gen_random_uuid()::text,
            journal_entry_id,
            mapping_record.credit_account_id,
            2,
            'Cash reduction for payout',
            0,
            (event_record.event_data->>'payout_amount')::DECIMAL;
    END IF;
    
    -- Update journal entry totals
    UPDATE journal_entries 
    SET 
        total_debits = (SELECT COALESCE(SUM(debit_amount), 0) FROM journal_entry_lines WHERE journal_entry_id = journal_entry_id),
        total_credits = (SELECT COALESCE(SUM(credit_amount), 0) FROM journal_entry_lines WHERE journal_entry_id = journal_entry_id)
    WHERE id = journal_entry_id;
    
    -- Post the journal entry if auto_post is enabled
    IF mapping_record.auto_post THEN
        UPDATE journal_entries 
        SET status = 'POSTED', posted_at = CURRENT_TIMESTAMP
        WHERE id = journal_entry_id;
        
        -- Update account balances
        PERFORM update_account_balances();
    END IF;
    
    -- Update platform event status
    UPDATE platform_events 
    SET 
        status = 'PROCESSED',
        journal_entry_id = journal_entry_id,
        processed_at = CURRENT_TIMESTAMP
    WHERE id = p_event_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to handle order completion event
CREATE OR REPLACE FUNCTION handle_order_completion(p_order_id TEXT)
RETURNS TEXT AS $$
DECLARE
    order_record RECORD;
    event_id TEXT;
BEGIN
    -- Get order details
    SELECT * INTO order_record
    FROM platform_orders
    WHERE id = p_order_id AND status = 'COMPLETED';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found or not completed';
    END IF;
    
    -- Create platform event
    event_id := create_platform_event(
        order_record.business_account_id,
        'ORDER_COMPLETED',
        json_build_object(
            'order_id', order_record.id,
            'order_number', order_record.order_number,
            'total_amount', order_record.total_amount,
            'commission_amount', order_record.commission_amount,
            'net_amount', order_record.net_amount,
            'customer_name', order_record.customer_name,
            'completed_at', order_record.completed_at
        ),
        'PLATFORM',
        order_record.id,
        'ORDER',
        order_record.id
    );
    
    -- Process the event
    PERFORM process_platform_event(event_id);
    
    -- If commission amount > 0, create commission event
    IF order_record.commission_amount > 0 THEN
        PERFORM handle_commission_earned(order_record.id);
    END IF;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to handle commission earned event
CREATE OR REPLACE FUNCTION handle_commission_earned(p_order_id TEXT)
RETURNS TEXT AS $$
DECLARE
    order_record RECORD;
    commission_record RECORD;
    event_id TEXT;
BEGIN
    -- Get order details
    SELECT * INTO order_record
    FROM platform_orders
    WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;
    
    -- Get or create commission record
    SELECT * INTO commission_record
    FROM platform_commissions
    WHERE order_id = p_order_id AND commission_type = 'PLATFORM_FEE';
    
    IF NOT FOUND THEN
        -- Create commission record
        INSERT INTO platform_commissions (
            id, business_account_id, order_id, commission_type, commission_rate,
            base_amount, commission_amount, calculated_at, recipient_type, description
        ) VALUES (
            gen_random_uuid()::text,
            order_record.business_account_id,
            order_record.id,
            'PLATFORM_FEE',
            (order_record.commission_amount / order_record.total_amount),
            order_record.total_amount,
            order_record.commission_amount,
            CURRENT_TIMESTAMP,
            'PLATFORM',
            'Platform commission for order ' || order_record.order_number
        ) RETURNING * INTO commission_record;
    END IF;
    
    -- Create platform event
    event_id := create_platform_event(
        order_record.business_account_id,
        'COMMISSION_EARNED',
        json_build_object(
            'commission_id', commission_record.id,
            'order_id', order_record.id,
            'commission_type', commission_record.commission_type,
            'commission_amount', commission_record.commission_amount,
            'base_amount', commission_record.base_amount,
            'commission_rate', commission_record.commission_rate,
            'calculated_at', commission_record.calculated_at
        ),
        'PLATFORM',
        commission_record.id,
        'COMMISSION',
        commission_record.id
    );
    
    -- Process the event
    PERFORM process_platform_event(event_id);
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to handle refund processed event
CREATE OR REPLACE FUNCTION handle_refund_processed(p_refund_id TEXT)
RETURNS TEXT AS $$
DECLARE
    refund_record RECORD;
    event_id TEXT;
BEGIN
    -- Get refund details
    SELECT * INTO refund_record
    FROM platform_refunds
    WHERE id = p_refund_id AND status = 'PROCESSED';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Refund not found or not processed';
    END IF;
    
    -- Create platform event
    event_id := create_platform_event(
        refund_record.business_account_id,
        'REFUND_PROCESSED',
        json_build_object(
            'refund_id', refund_record.id,
            'refund_number', refund_record.refund_number,
            'original_amount', refund_record.original_amount,
            'refund_amount', refund_record.refund_amount,
            'refund_reason', refund_record.refund_reason,
            'refund_type', refund_record.refund_type,
            'customer_refunded_at', refund_record.customer_refunded_at
        ),
        'PLATFORM',
        refund_record.id,
        'REFUND',
        refund_record.id
    );
    
    -- Process the event
    PERFORM process_platform_event(event_id);
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to handle payout sent event
CREATE OR REPLACE FUNCTION handle_payout_sent(p_payout_id TEXT)
RETURNS TEXT AS $$
DECLARE
    payout_record RECORD;
    event_id TEXT;
BEGIN
    -- Get payout details
    SELECT * INTO payout_record
    FROM platform_payouts
    WHERE id = p_payout_id AND payout_status = 'PROCESSED';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payout not found or not processed';
    END IF;
    
    -- Create platform event
    event_id := create_platform_event(
        payout_record.business_account_id,
        'PAYOUT_SENT',
        json_build_object(
            'payout_id', payout_record.id,
            'payout_number', payout_record.payout_number,
            'recipient_type', payout_record.recipient_type,
            'recipient_name', payout_record.recipient_name,
            'payout_amount', payout_record.payout_amount,
            'payout_method', payout_record.payout_method,
            'processed_date', payout_record.processed_date
        ),
        'PLATFORM',
        payout_record.id,
        'PAYOUT',
        payout_record.id
    );
    
    -- Process the event
    PERFORM process_platform_event(event_id);
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Insert default accounting event mappings for demo business
INSERT INTO accounting_event_mappings (id, event_type, business_account_id, debit_account_id, credit_account_id, description_template, auto_post) VALUES
-- Order completed mappings
(gen_random_uuid()::text, 'ORDER_COMPLETED', 'demo-business', 
 (SELECT id FROM chart_of_accounts WHERE business_account_id = 'demo-business' AND account_code = '1100'), -- Accounts Receivable
 (SELECT id FROM chart_of_accounts WHERE business_account_id = 'demo-business' AND account_code = '4000'), -- Sales Revenue
 'Revenue from order completion: {event_data}', true),

-- Commission mappings
(gen_random_uuid()::text, 'COMMISSION_EARNED', 'demo-business',
 (SELECT id FROM chart_of_accounts WHERE business_account_id = 'demo-business' AND account_code = '5900'), -- Other Expenses
 (SELECT id FROM chart_of_accounts WHERE business_account_id = 'demo-business' AND account_code = '2100'), -- Accrued Expenses
 'Platform commission earned: {event_data}', true),

-- Refund mappings
(gen_random_uuid()::text, 'REFUND_PROCESSED', 'demo-business',
 (SELECT id FROM chart_of_accounts WHERE business_account_id = 'demo-business' AND account_code = '4000'), -- Sales Revenue (contra)
 (SELECT id FROM chart_of_accounts WHERE business_account_id = 'demo-business' AND account_code = '1010'), -- Business Checking
 'Refund processed: {event_data}', true),

-- Payout mappings
(gen_random_uuid()::text, 'PAYOUT_SENT', 'demo-business',
 (SELECT id FROM chart_of_accounts WHERE business_account_id = 'demo-business' AND account_code = '5900'), -- Other Expenses
 (SELECT id FROM chart_of_accounts WHERE business_account_id = 'demo-business' AND account_code = '1010'), -- Business Checking
 'Payout sent: {event_data}', true)
ON CONFLICT (business_account_id, event_type) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON platform_events TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON platform_orders TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON platform_commissions TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON platform_refunds TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON platform_payouts TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON accounting_event_mappings TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON event_processing_queue TO PUBLIC;

COMMIT;
