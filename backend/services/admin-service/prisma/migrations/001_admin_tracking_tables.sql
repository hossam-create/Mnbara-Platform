-- CreateTable: user_sessions
-- Track user login/logout activity
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    device_type VARCHAR(50), -- mobile, desktop, tablet
    device_info JSONB, -- browser, OS, device model
    ip_address VARCHAR(45),
    country VARCHAR(100),
    city VARCHAR(100),
    login_at TIMESTAMP DEFAULT NOW(),
    logout_at TIMESTAMP,
    session_duration INTEGER, -- seconds
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX idx_user_sessions_login ON user_sessions(login_at DESC);

-- CreateTable: user_activity_logs
-- Track all user actions
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- VIEW_PRODUCT, PLACE_BID, CREATE_ORDER, etc.
    resource_type VARCHAR(50), -- LISTING, ORDER, AUCTION
    resource_id INTEGER,
    metadata JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_user ON user_activity_logs(user_id);
CREATE INDEX idx_activity_type ON user_activity_logs(action_type);
CREATE INDEX idx_activity_created ON user_activity_logs(created_at DESC);
CREATE INDEX idx_activity_resource ON user_activity_logs(resource_type, resource_id);

-- CreateTable: kyc_verifications
-- Track KYC verification process
CREATE TABLE IF NOT EXISTS kyc_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    provider VARCHAR(50), -- JUMIO, TRULIOO
    verification_id VARCHAR(255), -- Provider's verification ID
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, EXPIRED
    document_type VARCHAR(50), -- PASSPORT, DRIVERS_LICENSE, ID_CARD
    document_number VARCHAR(255),
    country VARCHAR(100),
    verification_data JSONB, -- Provider response
    submitted_at TIMESTAMP DEFAULT NOW(),
    verified_at TIMESTAMP,
    expires_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_kyc_user ON kyc_verifications(user_id);
CREATE INDEX idx_kyc_status ON kyc_verifications(status);
CREATE INDEX idx_kyc_provider ON kyc_verifications(provider);

-- CreateTable: auction_events
-- Track real-time auction activity
CREATE TABLE IF NOT EXISTS auction_events (
    id SERIAL PRIMARY KEY,
    auction_id INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- BID_PLACED, AUTO_EXTEND, AUCTION_ENDED, WINNER_DETERMINED
    bidder_id INTEGER,
    bid_amount DECIMAL(12,2),
    previous_amount DECIMAL(12,2),
    time_remaining INTEGER, -- seconds
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_auction_events_auction ON auction_events(auction_id);
CREATE INDEX idx_auction_events_type ON auction_events(event_type);
CREATE INDEX idx_auction_events_bidder ON auction_events(bidder_id);
CREATE INDEX idx_auction_events_created ON auction_events(created_at DESC);

-- CreateTable: traveler_flights
-- Track traveler flight information
CREATE TABLE IF NOT EXISTS traveler_flights (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL,
    traveler_id INTEGER NOT NULL,
    flight_number VARCHAR(20),
    airline VARCHAR(100),
    departure_airport VARCHAR(10),
    arrival_airport VARCHAR(10),
    scheduled_departure TIMESTAMP,
    scheduled_arrival TIMESTAMP,
    actual_departure TIMESTAMP,
    actual_arrival TIMESTAMP,
    flight_status VARCHAR(50) DEFAULT 'SCHEDULED', -- SCHEDULED, DELAYED, IN_FLIGHT, LANDED, CANCELLED
    tracking_data JSONB, -- FlightStats/FlightAware response
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_flights_trip ON traveler_flights(trip_id);
CREATE INDEX idx_flights_traveler ON traveler_flights(traveler_id);
CREATE INDEX idx_flights_status ON traveler_flights(flight_status);
CREATE INDEX idx_flights_departure ON traveler_flights(scheduled_departure);

-- CreateTable: escrow_transactions
-- Track escrow payment lifecycle
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    transaction_id INTEGER,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'HELD', -- HELD, RELEASED, REFUNDED, DISPUTED
    held_at TIMESTAMP DEFAULT NOW(),
    released_at TIMESTAMP,
    release_trigger VARCHAR(100), -- DELIVERY_CONFIRMED, ADMIN_APPROVED, AUTO_RELEASE
    refund_reason TEXT,
    provider_reference VARCHAR(255), -- Stripe/PayPal reference
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_escrow_order ON escrow_transactions(order_id);
CREATE INDEX idx_escrow_status ON escrow_transactions(status);
CREATE INDEX idx_escrow_held ON escrow_transactions(held_at DESC);

-- CreateTable: system_metrics
-- Store system performance data
CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    metric_type VARCHAR(50) NOT NULL, -- API_RESPONSE_TIME, DB_QUERY_TIME, ERROR_RATE
    service_name VARCHAR(50) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    metadata JSONB,
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_metrics_type ON system_metrics(metric_type);
CREATE INDEX idx_metrics_service ON system_metrics(service_name);
CREATE INDEX idx_metrics_time ON system_metrics(recorded_at DESC);
CREATE INDEX idx_metrics_composite ON system_metrics(service_name, metric_type, recorded_at DESC);

-- Add tracking fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_country VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_login_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP;

-- CreateTable: traveler_kyc_profiles
-- Full KYC profiles for travelers
CREATE TABLE IF NOT EXISTS traveler_kyc_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'submitted', -- submitted, under_review, verified, rejected
    risk_level VARCHAR(20) DEFAULT 'low', -- low, medium, high
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    nationality VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20),
    email VARCHAR(255),
    local_phone VARCHAR(50),
    foreign_phone VARCHAR(50),
    from_country VARCHAR(100),
    to_country VARCHAR(100),
    from_city VARCHAR(100),
    to_city VARCHAR(100),
    departure_date DATE,
    return_date DATE,
    permanent_address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    emergency_contact_name VARCHAR(100),
    emergency_contact_relation VARCHAR(50),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_country VARCHAR(100),
    digital_signature VARCHAR(255),
    terms_accepted BOOLEAN DEFAULT FALSE,
    privacy_accepted BOOLEAN DEFAULT FALSE,
    data_processing_accepted BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_traveler_kyc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- CreateTable: traveler_documents
-- KYC document storage for travelers
CREATE TABLE IF NOT EXISTS traveler_documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL, -- passport, selfie, flight_ticket, boarding_pass
    file_hash VARCHAR(255) NOT NULL,
    encrypted_path TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    verified BOOLEAN DEFAULT FALSE,
    verification_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_traveler_docs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- CreateTable: traveler_travel_data
-- Verified travel information for KYC
CREATE TABLE IF NOT EXISTS traveler_travel_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    from_country VARCHAR(100),
    to_country VARCHAR(100),
    from_city VARCHAR(100),
    to_city VARCHAR(100),
    departure_date DATE,
    return_date DATE,
    verified_ticket BOOLEAN DEFAULT FALSE,
    verified_boarding_pass BOOLEAN DEFAULT FALSE,
    flight_number VARCHAR(50),
    airline VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_traveler_data_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_traveler_kyc_user ON traveler_kyc_profiles(user_id);
CREATE INDEX idx_traveler_kyc_status ON traveler_kyc_profiles(status);
CREATE INDEX idx_traveler_kyc_risk ON traveler_kyc_profiles(risk_level);
CREATE INDEX idx_traveler_docs_user ON traveler_documents(user_id);
CREATE INDEX idx_traveler_docs_type ON traveler_documents(type);
CREATE INDEX idx_traveler_data_user ON traveler_travel_data(user_id);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS set_updated_at_user_sessions ON user_sessions;
CREATE TRIGGER set_updated_at_user_sessions
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_kyc ON kyc_verifications;
CREATE TRIGGER set_updated_at_kyc
    BEFORE UPDATE ON kyc_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_escrow ON escrow_transactions;
CREATE TRIGGER set_updated_at_escrow
    BEFORE UPDATE ON escrow_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add triggers for new traveler tables
DROP TRIGGER IF EXISTS set_updated_at_traveler_kyc ON traveler_kyc_profiles;
CREATE TRIGGER set_updated_at_traveler_kyc
    BEFORE UPDATE ON traveler_kyc_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_traveler_data ON traveler_travel_data;
CREATE TRIGGER set_updated_at_traveler_data
    BEFORE UPDATE ON traveler_travel_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE user_sessions IS 'Tracks user login/logout sessions for analytics';
COMMENT ON TABLE user_activity_logs IS 'Logs all user actions for behavior analysis';
COMMENT ON TABLE kyc_verifications IS 'KYC verification records from Jumio/Trulioo';
COMMENT ON TABLE auction_events IS 'Real-time auction activity tracking';
COMMENT ON TABLE traveler_flights IS 'Flight tracking for travelers';
COMMENT ON TABLE escrow_transactions IS 'Escrow payment lifecycle management';
COMMENT ON TABLE system_metrics IS 'System performance metrics';
COMMENT ON TABLE traveler_kyc_profiles IS 'Full KYC profiles for traveler verification';
COMMENT ON TABLE traveler_documents IS 'KYC document storage for traveler verification';
COMMENT ON TABLE traveler_travel_data IS 'Verified travel information for KYC compliance';
