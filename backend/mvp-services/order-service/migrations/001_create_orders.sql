-- MVP Order Service Database Schema
-- Simple eBay + Hitchhikers order flow

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId VARCHAR(255) NOT NULL,
    travelerId VARCHAR(255),
    itemName VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    maxPrice DECIMAL(10,2),
    description TEXT,
    weight DECIMAL(5,2) DEFAULT 1,
    urgency VARCHAR(20) DEFAULT 'NORMAL',
    serviceFee DECIMAL(10,2) DEFAULT 2.99,
    totalAmount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'PENDING',
    createdAt TIMESTAMP DEFAULT NOW(),
    acceptedAt TIMESTAMP,
    estimatedDelivery TIMESTAMP,
    travelerMessage TEXT
);

CREATE TABLE itemRequests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId VARCHAR(255) NOT NULL,
    travelerId VARCHAR(255),
    orderId VARCHAR(255),
    productId VARCHAR(255),
    message TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    responseMessage TEXT,
    createdAt TIMESTAMP DEFAULT NOW(),
    respondedAt TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_orders_userId ON orders(userId);
CREATE INDEX idx_orders_travelerId ON orders(travelerId);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_country ON orders(country);
CREATE INDEX idx_orders_createdAt ON orders(createdAt DESC);

CREATE INDEX idx_itemRequests_userId ON itemRequests(userId);
CREATE INDEX idx_itemRequests_travelerId ON itemRequests(travelerId);
CREATE INDEX idx_itemRequests_status ON itemRequests(status);

-- Insert sample data
INSERT INTO orders (userId, itemName, country, maxPrice, description, weight, urgency, totalAmount) VALUES
('user-123', 'iPhone 15 Pro Max', 'USA', 1200.00, 'Latest iPhone model, unlocked', 0.5, 'HIGH', 1202.99),
('user-456', 'MacBook Air M2', 'UK', 1100.00, 'Space gray, 256GB', 1.2, 'NORMAL', 1102.99),
('user-789', 'Nike Air Jordan', 'China', 200.00, 'Size 42, black/red', 0.8, 'LOW', 202.99);