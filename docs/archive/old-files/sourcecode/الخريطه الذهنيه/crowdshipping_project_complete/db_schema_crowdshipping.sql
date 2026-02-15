
-- Users table
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  full_name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  password_hash VARCHAR(512),
  roles TEXT[], -- e.g. ['buyer','traveler']
  rating NUMERIC(3,2) DEFAULT 0,
  join_date TIMESTAMP DEFAULT now(),
  kyc_status BOOLEAN DEFAULT FALSE,
  preferred_categories TEXT[],
  preferred_languages TEXT[]
);

-- Products table
CREATE TABLE products (
  product_id UUID PRIMARY KEY,
  seller_id UUID REFERENCES users(user_id),
  name TEXT,
  description TEXT,
  category TEXT,
  origin_country TEXT,
  price NUMERIC(12,2),
  listing_type TEXT, -- 'buy_now' | 'auction' | 'make_offer'
  auction BOOLEAN DEFAULT FALSE,
  auction_end_time TIMESTAMP,
  location_hint TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Bids table
CREATE TABLE bids (
  bid_id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(product_id),
  bidder_id UUID REFERENCES users(user_id),
  bid_amount NUMERIC(12,2),
  bid_time TIMESTAMP DEFAULT now()
);

-- Transactions table
CREATE TABLE transactions (
  transaction_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  amount NUMERIC(12,2),
  method TEXT,
  status TEXT, -- 'pending'|'success'|'failed'
  created_at TIMESTAMP DEFAULT now()
);

-- Traveler location & availability
CREATE TABLE traveler_locations (
  traveler_id UUID REFERENCES users(user_id),
  last_lat DOUBLE PRECISION,
  last_lon DOUBLE PRECISION,
  country TEXT,
  airport_code TEXT,
  last_seen_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (traveler_id)
);

CREATE TABLE traveler_availability (
  availability_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  origin TEXT,
  destination TEXT,
  depart_time TIMESTAMP,
  arrive_time TIMESTAMP,
  allowed_categories TEXT[],
  max_weight NUMERIC(8,2),
  max_volume NUMERIC(8,2)
);
