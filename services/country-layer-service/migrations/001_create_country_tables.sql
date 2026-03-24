-- Country Layer Database Migrations
-- Version: 1.0.0
-- Date: 2026-02-13
-- Purpose: Create tables for country tracking and compliance

-- Migration 001: Create countries table
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    iso_code VARCHAR(2) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    region VARCHAR(50),
    subregion VARCHAR(50),
    risk_level VARCHAR(20) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    customs_complexity INTEGER DEFAULT 3 CHECK (customs_complexity BETWEEN 1 AND 5),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on ISO code for fast lookups
CREATE INDEX idx_countries_iso_code ON countries(iso_code);
CREATE INDEX idx_countries_region ON countries(region);
CREATE INDEX idx_countries_risk_level ON countries(risk_level);

-- Insert sample countries (top 50 by trade volume)
INSERT INTO countries (iso_code, name, name_ar, region, subregion, risk_level, customs_complexity) VALUES
('US', 'United States', 'الولايات المتحدة', 'Americas', 'Northern America', 'low', 2),
('CN', 'China', 'الصين', 'Asia', 'Eastern Asia', 'medium', 4),
('JP', 'Japan', 'اليابان', 'Asia', 'Eastern Asia', 'low', 2),
('DE', 'Germany', 'ألمانيا', 'Europe', 'Western Europe', 'low', 1),
('GB', 'United Kingdom', 'المملكة المتحدة', 'Europe', 'Northern Europe', 'low', 2),
('FR', 'France', 'فرنسا', 'Europe', 'Western Europe', 'low', 1),
('IN', 'India', 'الهند', 'Asia', 'Southern Asia', 'medium', 3),
('IT', 'Italy', 'إيطاليا', 'Europe', 'Southern Europe', 'medium', 2),
('BR', 'Brazil', 'البرازيل', 'Americas', 'South America', 'medium', 3),
('CA', 'Canada', 'كندا', 'Americas', 'Northern America', 'low', 1),
('RU', 'Russia', 'روسيا', 'Europe', 'Eastern Europe', 'high', 4),
('KR', 'South Korea', 'كوريا الجنوبية', 'Asia', 'Eastern Asia', 'low', 2),
('ES', 'Spain', 'إسبانيا', 'Europe', 'Southern Europe', 'low', 2),
('AU', 'Australia', 'أستراليا', 'Oceania', 'Australia and New Zealand', 'low', 1),
('MX', 'Mexico', 'المكسيك', 'Americas', 'Central America', 'medium', 3),
('ID', 'Indonesia', 'إندونيسيا', 'Asia', 'South-eastern Asia', 'medium', 3),
('NL', 'Netherlands', 'هولندا', 'Europe', 'Western Europe', 'low', 1),
('SA', 'Saudi Arabia', 'السعودية', 'Asia', 'Western Asia', 'medium', 3),
('TR', 'Turkey', 'تركيا', 'Asia', 'Western Asia', 'medium', 3),
('TW', 'Taiwan', 'تايوان', 'Asia', 'Eastern Asia', 'low', 2),
('CH', 'Switzerland', 'سويسرا', 'Europe', 'Western Europe', 'low', 1),
('BE', 'Belgium', 'بلجيكا', 'Europe', 'Western Europe', 'low', 1),
('AR', 'Argentina', 'الأرجنتين', 'Americas', 'South America', 'medium', 3),
('IE', 'Ireland', 'أيرلندا', 'Europe', 'Northern Europe', 'low', 1),
('SE', 'Sweden', 'السويد', 'Europe', 'Northern Europe', 'low', 1),
('IL', 'Israel', 'إسرائيل', 'Asia', 'Western Asia', 'medium', 3),
('AT', 'Austria', 'النمسا', 'Europe', 'Western Europe', 'low', 1),
('PL', 'Poland', 'بولندا', 'Europe', 'Eastern Europe', 'low', 2),
('DK', 'Denmark', 'الدنمارك', 'Europe', 'Northern Europe', 'low', 1),
('NO', 'Norway', 'النرويج', 'Europe', 'Northern Europe', 'low', 1),
('FI', 'Finland', 'فنلندا', 'Europe', 'Northern Europe', 'low', 1),
('SG', 'Singapore', 'سنغافورة', 'Asia', 'South-eastern Asia', 'low', 2),
('MY', 'Malaysia', 'ماليزيا', 'Asia', 'South-eastern Asia', 'low', 2),
('TH', 'Thailand', 'تايلاند', 'Asia', 'South-eastern Asia', 'medium', 2),
('PH', 'Philippines', 'الفلبين', 'Asia', 'South-eastern Asia', 'medium', 3),
('VN', 'Vietnam', 'فيتنام', 'Asia', 'South-eastern Asia', 'medium', 2),
('EG', 'Egypt', 'مصر', 'Africa', 'Northern Africa', 'medium', 3),
('ZA', 'South Africa', 'جنوب أفريقيا', 'Africa', 'Southern Africa', 'medium', 3),
('NG', 'Nigeria', 'نيجيريا', 'Africa', 'Western Africa', 'high', 4),
('KE', 'Kenya', 'كينيا', 'Africa', 'Eastern Africa', 'medium', 3),
('MA', 'Morocco', 'المغرب', 'Africa', 'Northern Africa', 'medium', 3),
('UA', 'Ukraine', 'أوكرانيا', 'Europe', 'Eastern Europe', 'high', 4),
('BY', 'Belarus', 'بيلاروسيا', 'Europe', 'Eastern Europe', 'high', 4),
('KZ', 'Kazakhstan', 'كازاخستان', 'Asia', 'Central Asia', 'medium', 3),
('UZ', 'Uzbekistan', 'أوزبكستان', 'Asia', 'Central Asia', 'medium', 4);

-- Migration 002: Create product_countries table
CREATE TABLE IF NOT EXISTS product_countries (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    origin_country VARCHAR(2) NOT NULL,
    purchase_country VARCHAR(2) NOT NULL,
    delivery_country VARCHAR(2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (origin_country) REFERENCES countries(iso_code),
    FOREIGN KEY (purchase_country) REFERENCES countries(iso_code),
    FOREIGN KEY (delivery_country) REFERENCES countries(iso_code)
);

-- Create indexes for fast lookups
CREATE INDEX idx_product_countries_product_id ON product_countries(product_id);
CREATE INDEX idx_product_countries_origin ON product_countries(origin_country);
CREATE INDEX idx_product_countries_purchase ON product_countries(purchase_country);
CREATE INDEX idx_product_countries_delivery ON product_countries(delivery_country);

-- Migration 003: Create country_rules table
CREATE TABLE IF NOT EXISTS country_rules (
    id SERIAL PRIMARY KEY,
    country VARCHAR(2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    max_quantity INTEGER DEFAULT 1,
    max_value DECIMAL(10,2) DEFAULT 1000.00,
    is_restricted BOOLEAN DEFAULT false,
    requires_permit BOOLEAN DEFAULT false,
    permit_types TEXT[],
    restrictions TEXT,
    duty_rate DECIMAL(5,2) DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    effective_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (country) REFERENCES countries(iso_code)
);

-- Create unique index on country+category combination
CREATE UNIQUE INDEX idx_country_rules_country_category ON country_rules(country, category);
CREATE INDEX idx_country_rules_category ON country_rules(category);
CREATE INDEX idx_country_rules_restricted ON country_rules(is_restricted);

-- Insert sample country rules for common categories
INSERT INTO country_rules (country, category, max_quantity, max_value, is_restricted, requires_permit, duty_rate, tax_rate, restrictions) VALUES
-- Egypt Electronics Rules
('EG', 'electronics', 1, 500, false, false, 0.00, 0.14, 'One personal electronics item allowed'),
('EG', 'mobile_phones', 1, 300, false, false, 0.00, 0.14, 'One mobile phone allowed'),
('EG', 'laptops', 1, 1000, false, false, 0.00, 0.14, 'One laptop allowed'),
('EG', 'tablets', 1, 500, false, false, 0.00, 0.14, 'One tablet allowed'),

-- Egypt Fashion Rules
('EG', 'clothing', 5, 200, false, false, 0.00, 0.14, 'Personal clothing items'),
('EG', 'shoes', 3, 150, false, false, 0.00, 0.14, 'Personal footwear'),
('EG', 'watches', 2, 500, false, false, 0.00, 0.14, 'Personal watches'),

-- Egypt Cosmetics Rules
('EG', 'cosmetics', 3, 100, false, false, 0.00, 0.14, 'Personal cosmetics'),
('EG', 'perfumes', 2, 150, false, false, 0.00, 0.14, 'Personal perfumes'),

-- Egypt Books/Media Rules
('EG', 'books', 10, 100, false, false, 0.00, 0.00, 'Personal books'),
('EG', 'electronics_accessories', 5, 100, false, false, 0.00, 0.14, 'Accessories'),

-- Egypt Restricted Categories
('EG', 'medications', 1, 50, true, true, 0.00, 0.00, 'Requires medical prescription'),
('EG', 'weapons', 0, 0, true, true, 0.00, 0.00, 'Completely prohibited'),
('EG', 'alcohol', 0, 0, true, true, 0.00, 0.00, 'Religious restrictions'),
('EG', 'tobacco', 0, 0, true, true, 0.00, 0.00, 'Health restrictions');

-- Migration 004: Create traveler_routes table
CREATE TABLE IF NOT EXISTS traveler_routes (
    id SERIAL PRIMARY KEY,
    traveler_id VARCHAR(50) NOT NULL,
    from_country VARCHAR(2) NOT NULL,
    to_country VARCHAR(2) NOT NULL,
    departure_date DATE NOT NULL,
    arrival_date DATE NOT NULL,
    max_capacity_weight DECIMAL(10,2) DEFAULT 20.00, -- kg
    max_capacity_value DECIMAL(10,2) DEFAULT 2000.00, -- USD
    allowed_categories TEXT[],
    risk_tolerance VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_country) REFERENCES countries(iso_code),
    FOREIGN KEY (to_country) REFERENCES countries(iso_code)
);

-- Create indexes for fast route matching
CREATE INDEX idx_traveler_routes_traveler_id ON traveler_routes(traveler_id);
CREATE INDEX idx_traveler_routes_from_country ON traveler_routes(from_country);
CREATE INDEX idx_traveler_routes_to_country ON traveler_routes(to_country);
CREATE INDEX idx_traveler_routes_departure ON traveler_routes(departure_date);
CREATE INDEX idx_traveler_routes_status ON traveler_routes(status);

-- Migration 005: Create compliance_logs table
CREATE TABLE IF NOT EXISTS compliance_logs (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    route_id INTEGER NOT NULL,
    traveler_id VARCHAR(50) NOT NULL,
    buyer_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL, -- compliant, restricted, rejected
    risk_score INTEGER DEFAULT 0, -- 0-100
    restrictions TEXT[],
    required_documents TEXT[],
    estimated_duty DECIMAL(10,2) DEFAULT 0.00,
    estimated_tax DECIMAL(10,2) DEFAULT 0.00,
    compliance_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES traveler_routes(id)
);

-- Create indexes for compliance analytics
CREATE INDEX idx_compliance_logs_product_id ON compliance_logs(product_id);
CREATE INDEX idx_compliance_logs_route_id ON compliance_logs(route_id);
CREATE INDEX idx_compliance_logs_status ON compliance_logs(status);
CREATE INDEX idx_compliance_logs_created_at ON compliance_logs(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_countries_updated_at BEFORE UPDATE ON product_countries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_country_rules_updated_at BEFORE UPDATE ON country_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_traveler_routes_updated_at BEFORE UPDATE ON traveler_routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate compliance score
CREATE OR REPLACE FUNCTION calculate_compliance_score(
    p_country VARCHAR(2),
    p_category VARCHAR(50),
    p_quantity INTEGER,
    p_value DECIMAL(10,2)
) RETURNS INTEGER AS $$
DECLARE
    rule_record RECORD;
    score INTEGER := 100;
BEGIN
    -- Get country rule for this category
    SELECT * INTO rule_record FROM country_rules 
    WHERE country = p_country AND category = p_category 
    AND effective_date <= CURRENT_DATE 
    AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE);
    
    IF NOT FOUND THEN
        RETURN 50; -- Unknown category/country combination
    END IF;
    
    -- Check if restricted
    IF rule_record.is_restricted THEN
        score := score - 50;
    END IF;
    
    -- Check quantity limits
    IF p_quantity > rule_record.max_quantity THEN
        score := score - 30;
    END IF;
    
    -- Check value limits
    IF p_value > rule_record.max_value THEN
        score := score - 20;
    END IF;
    
    -- Check if permit required
    IF rule_record.requires_permit THEN
        score := score - 15;
    END IF;
    
    -- Ensure score doesn't go below 0
    RETURN GREATEST(score, 0);
END;
$$ LANGUAGE plpgsql;

-- Create view for country compliance analytics
CREATE OR REPLACE VIEW country_compliance_analytics AS
SELECT 
    c.iso_code,
    c.name,
    c.risk_level,
    COUNT(cr.id) as total_rules,
    COUNT(cr.id) FILTER (WHERE cr.is_restricted = true) as restricted_rules,
    AVG(cr.max_quantity) as avg_max_quantity,
    AVG(cr.max_value) as avg_max_value,
    AVG(cr.duty_rate) as avg_duty_rate,
    AVG(cr.tax_rate) as avg_tax_rate
FROM countries c
LEFT JOIN country_rules cr ON c.iso_code = cr.country
WHERE c.is_active = true
GROUP BY c.iso_code, c.name, c.risk_level;

-- Create view for traveler route analytics
CREATE OR REPLACE VIEW traveler_route_analytics AS
SELECT 
    from_country,
    to_country,
    COUNT(*) as total_routes,
    COUNT(*) FILTER (WHERE status = 'active') as active_routes,
    AVG(max_capacity_weight) as avg_max_weight,
    AVG(max_capacity_value) as avg_max_value,
    MIN(departure_date) as earliest_departure,
    MAX(arrival_date) as latest_arrival
FROM traveler_routes
GROUP BY from_country, to_country;

-- Create view for compliance violation trends
CREATE OR REPLACE VIEW compliance_violation_trends AS
SELECT 
    DATE_TRUNC('day', created_at) as violation_date,
    status,
    COUNT(*) as violation_count,
    AVG(risk_score) as avg_risk_score,
    SUM(estimated_duty + estimated_tax) as total_estimated_costs
FROM compliance_logs
WHERE status IN ('restricted', 'rejected')
GROUP BY DATE_TRUNC('day', created_at), status
ORDER BY violation_date DESC;

-- Migration completed successfully
SELECT 'Country Layer Database Migration 1.0.0 completed successfully' as message;