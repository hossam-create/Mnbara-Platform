-- MVP Order Service Database Schema - Updated with Payments
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
    paidAt TIMESTAMP,
    acceptedAt TIMESTAMP,
    estimatedDelivery TIMESTAMP,
    travelerMessage TEXT
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId VARCHAR(255) NOT NULL,
    orderId VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    paymentMethod VARCHAR(50) DEFAULT 'card',
    status VARCHAR(20) DEFAULT 'PENDING',
    transactionId VARCHAR(255),
    description TEXT,
    createdAt TIMESTAMP DEFAULT NOW()
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

CREATE INDEX idx_payments_userId ON payments(userId);
CREATE INDEX idx_payments_orderId ON payments(orderId);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_createdAt ON payments(createdAt DESC);

CREATE INDEX idx_itemRequests_userId ON itemRequests(userId);
CREATE INDEX idx_itemRequests_travelerId ON itemRequests(travelerId);
CREATE INDEX idx_itemRequests_status ON itemRequests(status);

-- Insert sample data
INSERT INTO orders (userId, itemName, country, maxPrice, description, weight, urgency, totalAmount, status) VALUES
('user-123', 'iPhone 15 Pro Max', 'USA', 1200.00, 'Latest iPhone model, unlocked', 0.5, 'HIGH', 1202.99, 'PENDING'),
('user-456', 'MacBook Air M2', 'UK', 1100.00, 'Space gray, 256GB', 1.2, 'NORMAL', 1102.99, 'PENDING'),
('user-789', 'Nike Air Jordan', 'China', 200.00, 'Size 42, black/red', 0.8, 'LOW', 202.99, 'PENDING');

-- Create sample payments
INSERT INTO payments (userId, orderId, amount, currency, paymentMethod, status, transactionId, description) VALUES
('user-123', (SELECT id FROM orders WHERE itemName = 'iPhone 15 Pro Max' LIMIT 1), 2.99, 'USD', 'card', 'COMPLETED', 'txn_123456789', 'Service fee for iPhone order'),
('user-456', (SELECT id FROM orders WHERE itemName = 'MacBook Air M2' LIMIT 1), 2.99, 'USD', 'card', 'COMPLETED', 'txn_987654321', 'Service fee for MacBook order');