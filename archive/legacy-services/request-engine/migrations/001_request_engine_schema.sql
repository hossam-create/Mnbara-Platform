-- Request Engine Database Schema
-- Crowdshipping Marketplace Request Management System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar TEXT,
    role VARCHAR(20) NOT NULL CHECK (role IN ('REQUESTER', 'TRAVELER', 'ADMIN')),
    is_verified BOOLEAN DEFAULT false,
    verification_status VARCHAR(20) DEFAULT 'NOT_VERIFIED' CHECK (verification_status IN ('NOT_VERIFIED', 'PENDING', 'VERIFIED', 'REJECTED')),
    bio TEXT,
    country VARCHAR(100),
    city VARCHAR(100),
    notifications_enabled BOOLEAN DEFAULT true,
    language VARCHAR(10) DEFAULT 'en',
    total_requests INTEGER DEFAULT 0,
    completed_requests INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    response_time_hours INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    image TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    original_price DECIMAL(10,2),
    availability BOOLEAN DEFAULT true,
    seller_name VARCHAR(255),
    seller_rating DECIMAL(3,2),
    seller_url TEXT,
    specifications JSONB,
    extraction_source VARCHAR(100),
    extraction_confidence DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Requests table
CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    traveler_id UUID REFERENCES users(id) ON DELETE SET NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Delivery information
    origin_country VARCHAR(100) NOT NULL,
    origin_city VARCHAR(100),
    origin_address TEXT,
    origin_postal_code VARCHAR(20),
    
    destination_country VARCHAR(100) NOT NULL,
    destination_city VARCHAR(100),
    destination_address TEXT,
    destination_postal_code VARCHAR(20),
    
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    delivery_instructions TEXT,
    
    -- Status and workflow
    status VARCHAR(30) NOT NULL DEFAULT 'CREATED' CHECK (
        status IN ('CREATED', 'VISIBLE_TO_TRAVELERS', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED', 'EXPIRED')
    ),
    
    -- Preferences
    packaging VARCHAR(20) DEFAULT 'STANDARD' CHECK (packaging IN ('STANDARD', 'FRAGILE', 'ELECTRONICS')),
    insurance BOOLEAN DEFAULT false,
    tracking BOOLEAN DEFAULT false,
    urgency VARCHAR(20) DEFAULT 'STANDARD' CHECK (urgency IN ('STANDARD', 'EXPRESS', 'URGENT')),
    
    -- Metadata
    estimated_distance INTEGER, -- in kilometers
    estimated_duration INTEGER, -- in days
    difficulty VARCHAR(10) DEFAULT 'EASY' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    tags TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Request status history
CREATE TABLE request_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    from_status VARCHAR(30) NOT NULL,
    to_status VARCHAR(30) NOT NULL,
    transition VARCHAR(50) NOT NULL,
    reason TEXT,
    changed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Request timeline
CREATE TABLE request_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    data JSONB,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Traveler profiles
CREATE TABLE traveler_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_country VARCHAR(100) NOT NULL,
    current_city VARCHAR(100),
    preferred_destinations TEXT[],
    max_distance INTEGER DEFAULT 1000, -- km
    min_reward DECIMAL(10,2) DEFAULT 0.00,
    total_deliveries INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    average_delivery_days DECIMAL(5,2) DEFAULT 0.00,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Travel schedules
CREATE TABLE travel_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    traveler_id UUID NOT NULL REFERENCES traveler_profiles(id) ON DELETE CASCADE,
    from_date TIMESTAMP WITH TIME ZONE NOT NULL,
    to_date TIMESTAMP WITH TIME ZONE NOT NULL,
    route TEXT[],
    capacity_weight DECIMAL(5,2) NOT NULL, -- kg
    capacity_length DECIMAL(5,2),
    capacity_width DECIMAL(5,2),
    capacity_height DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_verified ON users(is_verified);

CREATE INDEX idx_products_url ON products(url);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_products_price ON products(price);

CREATE INDEX idx_requests_requester_id ON requests(requester_id);
CREATE INDEX idx_requests_traveler_id ON requests(traveler_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_deadline ON requests(deadline);
CREATE INDEX idx_requests_origin_country ON requests(origin_country);
CREATE INDEX idx_requests_destination_country ON requests(destination_country);
CREATE INDEX idx_requests_created_at ON requests(created_at);

CREATE INDEX idx_status_history_request_id ON request_status_history(request_id);
CREATE INDEX idx_status_history_changed_at ON request_status_history(changed_at);

CREATE INDEX idx_timeline_request_id ON request_timeline(request_id);
CREATE INDEX idx_timeline_created_at ON request_timeline(created_at);

CREATE INDEX idx_traveler_user_id ON traveler_profiles(user_id);
CREATE INDEX idx_traveler_destinations ON traveler_profiles USING GIN(preferred_destinations);

CREATE INDEX idx_travel_schedules_traveler_id ON travel_schedules(traveler_id);
CREATE INDEX idx_travel_schedules_dates ON travel_schedules(from_date, to_date);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_traveler_profiles_updated_at BEFORE UPDATE ON traveler_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO users (id, email, first_name, last_name, role, is_verified) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'john.doe@example.com', 'John', 'Doe', 'REQUESTER', true),
('550e8400-e29b-41d4-a716-446655440001', 'jane.smith@example.com', 'Jane', 'Smith', 'TRAVELER', true);

INSERT INTO products (id, url, title, image, price, currency, seller_name) VALUES
('550e8400-e29b-41d4-a716-446655440100', 'https://example.com/product/123', 'iPhone 15 Pro', 'https://example.com/image.jpg', 999.99, 'USD', 'Apple Store'),
('550e8400-e29b-41d4-a716-446655440101', 'https://example.com/product/456', 'Samsung Galaxy S24', 'https://example.com/image2.jpg', 899.99, 'USD', 'Samsung Official');

INSERT INTO requests (id, requester_id, product_id, origin_country, destination_country, deadline, status) VALUES
('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440100', 'USA', 'Kenya', NOW() + INTERVAL '7 days', 'VISIBLE_TO_TRAVELERS');
