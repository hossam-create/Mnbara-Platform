-- Migration: 004_create_deliveries.sql
-- Description: Creates the deliveries table and related delivery management tables
-- Created: 2024-01-01
-- Author: Mnbara Platform Team

-- UP Migration
-- ============

-- Deliveries Table
CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_number VARCHAR(100) NOT NULL UNIQUE,
    delivery_number VARCHAR(50) NOT NULL UNIQUE,
    order_id UUID NOT NULL REFERENCES orders(id),
    user_id UUID NOT NULL REFERENCES users(id),
    vendor_id UUID REFERENCES users(id),
    driver_id UUID REFERENCES users(id),
    driver_name VARCHAR(200),
    driver_phone VARCHAR(50),
    driver_photo_url VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed_delivery', 'returned', 'cancelled', 'on_hold')),
    sub_status VARCHAR(50),
    status_reason TEXT,
    status_history JSONB DEFAULT '[]'::jsonb,
    pickup_address JSONB NOT NULL,
    delivery_address JSONB NOT NULL,
    delivery_instructions TEXT,
    scheduled_pickup_at TIMESTAMP WITH TIME ZONE,
    scheduled_delivery_at TIMESTAMP WITH TIME ZONE,
    estimated_delivery_at TIMESTAMP WITH TIME ZONE,
    actual_pickup_at TIMESTAMP WITH TIME ZONE,
    actual_delivery_at TIMESTAMP WITH TIME ZONE,
    package_count INTEGER NOT NULL DEFAULT 1,
    weight DECIMAL(10, 2),
    weight_unit VARCHAR(10) DEFAULT 'kg',
    dimensions JSONB DEFAULT '{"length": 0, "width": 0, "height": 0, "unit": "cm"}'::jsonb,
    carrier_id VARCHAR(100),
    carrier_name VARCHAR(100),
    carrier_tracking_url VARCHAR(500),
    service_type VARCHAR(100),
    route_id UUID,
    route_sequence INTEGER,
    distance_remaining_km DECIMAL(10, 2),
    eta_update_count INTEGER DEFAULT 0,
    signature_required BOOLEAN DEFAULT FALSE,
    signature_data TEXT,
    signature_image_url VARCHAR(500),
    photo_proof_url VARCHAR(500),
    proof_of_delivery JSONB DEFAULT '{}'::jsonb,
    delivery_otp VARCHAR(10),
    otp_verified_at TIMESTAMP WITH TIME ZONE,
    otp_attempts INTEGER DEFAULT 0,
    attempt_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    attempt_history JSONB DEFAULT '[]'::jsonb,
    is_fragile BOOLEAN DEFAULT FALSE,
    is_hazardous BOOLEAN DEFAULT FALSE,
    requires_cooling BOOLEAN DEFAULT FALSE,
    temperature_min DECIMAL(5, 2),
    temperature_max DECIMAL(5, 2),
    handling_instructions TEXT,
    shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    insurance_amount DECIMAL(10, 2) DEFAULT 0,
    insurance_cost DECIMAL(10, 2) DEFAULT 0,
    cod_amount DECIMAL(10, 2) DEFAULT 0,
    cod_collected BOOLEAN DEFAULT FALSE,
    cod_collected_amount DECIMAL(10, 2),
    customer_notified BOOLEAN DEFAULT FALSE,
    customer_notified_at TIMESTAMP WITH TIME ZONE,
    notification_history JSONB DEFAULT '[]'::jsonb,
    driver_notes TEXT,
    has_issue BOOLEAN DEFAULT FALSE,
    issue_type VARCHAR(50),
    issue_description TEXT,
    issue_reported_at TIMESTAMP WITH TIME ZONE,
    issue_resolved_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_user ON deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_tracking_number ON deliveries(tracking_number);
CREATE INDEX IF NOT EXISTS idx_deliveries_carrier ON deliveries(carrier_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_scheduled ON deliveries(scheduled_delivery_at);
CREATE INDEX IF NOT EXISTS idx_deliveries_estimated ON deliveries(estimated_delivery_at);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON deliveries(created_at DESC);

-- Delivery Routes Table
CREATE TABLE IF NOT EXISTS delivery_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_code VARCHAR(50) NOT NULL UNIQUE,
    driver_id UUID REFERENCES users(id),
    driver_name VARCHAR(200),
    vehicle_id UUID,
    vehicle_type VARCHAR(50),
    vehicle_plate_number VARCHAR(20),
    route_date DATE NOT NULL,
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled', 'abandoned')),
    total_stops INTEGER DEFAULT 0,
    completed_stops INTEGER DEFAULT 0,
    failed_stops INTEGER DEFAULT 0,
    total_distance_km DECIMAL(10, 2),
    actual_distance_km DECIMAL(10, 2),
    optimized_at TIMESTAMP WITH TIME ZONE,
    optimization_score DECIMAL(5, 2),
    route_geometry TEXT,
    notes TEXT,
    dispatch_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_delivery_routes_driver ON delivery_routes(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_routes_date ON delivery_routes(route_date);
CREATE INDEX IF NOT EXISTS idx_delivery_routes_status ON delivery_routes(status);
CREATE INDEX IF NOT EXISTS idx_delivery_routes_vehicle ON delivery_routes(vehicle_id);

-- Delivery Stops Table
CREATE TABLE IF NOT EXISTS delivery_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES delivery_routes(id) ON DELETE CASCADE,
    delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    stop_type VARCHAR(20) DEFAULT 'delivery' CHECK (stop_type IN ('pickup', 'delivery', 'break', 'refuel')),
    address JSONB NOT NULL,
    instructions TEXT,
    scheduled_arrival TIMESTAMP WITH TIME ZONE,
    scheduled_departure TIMESTAMP WITH TIME ZONE,
    actual_arrival TIMESTAMP WITH TIME ZONE,
    actual_departure TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'arrived', 'completed', 'skipped', 'failed')),
    service_duration_minutes INTEGER DEFAULT 5,
    driver_notes TEXT,
    customer_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_delivery_stops_route ON delivery_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_delivery_stops_delivery ON delivery_stops(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_stops_sequence ON delivery_stops(route_id, sequence_number);

-- Delivery Events Table
CREATE TABLE IF NOT EXISTS delivery_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    event_code VARCHAR(50) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    event_description TEXT,
    location_name VARCHAR(200),
    location_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country_code VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    source VARCHAR(50) DEFAULT 'carrier' CHECK (source IN ('carrier', 'driver', 'system', 'manual')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_delivery_events_delivery ON delivery_events(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_events_code ON delivery_events(event_code);
CREATE INDEX IF NOT EXISTS idx_delivery_events_timestamp ON delivery_events(event_timestamp DESC);

-- Delivery Issues Table
CREATE TABLE IF NOT EXISTS delivery_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    issue_type VARCHAR(50) NOT NULL CHECK (issue_type IN ('damaged_package', 'wrong_address', 'recipient_unavailable', 'weather_delay', 'traffic_delay', 'vehicle_breakdown', 'package_lost', 'package_stolen', 'customs_delay', 'refused_delivery', 'incorrect_items', 'other')),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'pending_customer', 'pending_carrier', 'resolved', 'escalated', 'closed')),
    resolution TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    customer_notified BOOLEAN DEFAULT FALSE,
    customer_refund_required BOOLEAN DEFAULT FALSE,
    refund_amount DECIMAL(10, 2),
    photos JSONB DEFAULT '[]'::jsonb,
    carrier_claim_id VARCHAR(100),
    insurance_claim_id VARCHAR(100),
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_delivery_issues_delivery ON delivery_issues(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_issues_type ON delivery_issues(issue_type);
CREATE INDEX IF NOT EXISTS idx_delivery_issues_status ON delivery_issues(status);

-- Delivery Vehicles Table
CREATE TABLE IF NOT EXISTS delivery_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_code VARCHAR(50) NOT NULL UNIQUE,
    vehicle_type VARCHAR(50) NOT NULL CHECK (vehicle_type IN ('bicycle', 'motorcycle', 'car', 'van', 'truck', 'large_truck')),
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    color VARCHAR(50),
    plate_number VARCHAR(20) NOT NULL,
    vin VARCHAR(17),
    max_weight_kg DECIMAL(10, 2),
    max_volume_cm3 DECIMAL(12, 2),
    passenger_capacity INTEGER DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'out_of_service', 'retired')),
    insurance_provider VARCHAR(200),
    insurance_policy_number VARCHAR(100),
    insurance_expiry DATE,
    registration_expiry DATE,
    permit_type VARCHAR(50),
    permit_expiry DATE,
    assigned_driver_id UUID REFERENCES users(id),
    assigned_since TIMESTAMP WITH TIME ZONE,
    has_gps BOOLEAN DEFAULT TRUE,
    last_gps_update TIMESTAMP WITH TIME ZONE,
    last_latitude DECIMAL(10, 8),
    last_longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_delivery_vehicles_type ON delivery_vehicles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_delivery_vehicles_status ON delivery_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_delivery_vehicles_driver ON delivery_vehicles(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_vehicles_plate ON delivery_vehicles(plate_number);

-- Delivery Zones Table
CREATE TABLE IF NOT EXISTS delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_code VARCHAR(50) NOT NULL UNIQUE,
    zone_name VARCHAR(100) NOT NULL,
    description TEXT,
    coverage_type VARCHAR(20) DEFAULT 'polygon' CHECK (coverage_type IN ('circle', 'polygon', 'postal_codes')),
    coverage_data JSONB NOT NULL,
    postal_codes JSONB DEFAULT '[]'::jsonb,
    base_rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
    rate_per_km DECIMAL(10, 2) DEFAULT 0,
    min_rate DECIMAL(10, 2) DEFAULT 0,
    max_rate DECIMAL(10, 2)),
    min_delivery_hours INTEGER DEFAULT 1,
    max_delivery_hours INTEGER DEFAULT 24,
    express_available BOOLEAN DEFAULT FALSE,
    express_multiplier DECIMAL(4, 2) DEFAULT 1.5,
    is_active BOOLEAN DEFAULT TRUE,
    operating_hours JSONB DEFAULT '{"monday": {"start": "00:00", "end": "23:59"}, "tuesday": {"start": "00:00", "end": "23:59"}, "wednesday": {"start": "00:00", "end": "23:59"}, "thursday": {"start": "00:00", "end": "23:59"}, "friday": {"start": "00:00", "end": "23:59"}, "saturday": {"start": "00:00", "end": "23:59"}, "sunday": {"start": "00:00", "end": "23:59"}}'::jsonb,
    available_carriers JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_delivery_zones_active ON delivery_zones(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_code ON delivery_zones(zone_code);

-- Generate delivery number function
CREATE OR REPLACE FUNCTION generate_delivery_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    date_part VARCHAR;
    sequence_num INTEGER;
    delivery_num VARCHAR(50);
BEGIN
    date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    SELECT COALESCE(MAX(CAST(SUBSTRING(delivery_number FROM 9) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM deliveries
    WHERE SUBSTRING(delivery_number FROM 1 FOR 8) = 'DEL-' || date_part;
    delivery_num := 'DEL-' || date_part || '-' || LPAD(sequence_num::VARCHAR, 6, '0');
    RETURN delivery_num;
END;
$$ LANGUAGE plpgsql;

-- Generate route code function
CREATE OR REPLACE FUNCTION generate_route_code()
RETURNS VARCHAR(50) AS $$
DECLARE
    date_part VARCHAR;
    sequence_num INTEGER;
    route_code VARCHAR(50);
BEGIN
    date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    SELECT COALESCE(MAX(CAST(SUBSTRING(route_code FROM 9) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM delivery_routes
    WHERE SUBSTRING(route_code FROM 1 FOR 8) = 'RTE-' || date_part;
    route_code := 'RTE-' || date_part || '-' || LPAD(sequence_num::VARCHAR, 4, '0');
    RETURN route_code;
END;
$$ LANGUAGE plpgsql;

-- Update triggers
CREATE TRIGGER deliveries_updated_at
    BEFORE UPDATE ON deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_user_timestamp();

CREATE TRIGGER delivery_routes_updated_at
    BEFORE UPDATE ON delivery_routes
    FOR EACH ROW
    EXECUTE FUNCTION update_user_timestamp();

CREATE TRIGGER delivery_issues_updated_at
    BEFORE UPDATE ON delivery_issues
    FOR EACH ROW
    EXECUTE FUNCTION update_user_timestamp();

CREATE TRIGGER delivery_vehicles_updated_at
    BEFORE UPDATE ON delivery_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_timestamp();

CREATE TRIGGER delivery_zones_updated_at
    BEFORE UPDATE ON delivery_zones
    FOR EACH ROW
    EXECUTE FUNCTION update_user_timestamp();


-- DOWN Migration
-- =============
DROP TABLE IF EXISTS delivery_zones CASCADE;
DROP TABLE IF EXISTS delivery_vehicles CASCADE;
DROP TABLE IF EXISTS delivery_issues CASCADE;
DROP TABLE IF EXISTS delivery_events CASCADE;
DROP TABLE IF EXISTS delivery_stops CASCADE;
DROP TABLE IF EXISTS delivery_routes CASCADE;
DROP TABLE IF EXISTS deliveries CASCADE;
DROP FUNCTION IF EXISTS generate_delivery_number() CASCADE;
DROP FUNCTION IF EXISTS generate_route_code() CASCADE;
