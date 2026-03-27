# 🔧 Local Testing Environment Configuration
# This file contains test data and configuration for local MVP testing

# Test User Credentials (for automated testing)
TEST_USERS = {
    "buyers": [
        {"email": "buyer1@test.com", "password": "test123", "role": "buyer"},
        {"email": "buyer2@test.com", "password": "test123", "role": "buyer"},
        {"email": "buyer3@test.com", "password": "test123", "role": "buyer"},
        {"email": "buyer4@test.com", "password": "test123", "role": "buyer"},
        {"email": "buyer5@test.com", "password": "test123", "role": "buyer"}
    ],
    "sellers": [
        {"email": "seller1@test.com", "password": "test123", "role": "seller"},
        {"email": "seller2@test.com", "password": "test123", "role": "seller"},
        {"email": "seller3@test.com", "password": "test123", "role": "seller"},
        {"email": "seller4@test.com", "password": "test123", "role": "seller"},
        {"email": "seller5@test.com", "password": "test123", "role": "seller"}
    ],
    "travelers": [
        {"email": "traveler1@test.com", "password": "test123", "role": "traveler"},
        {"email": "traveler2@test.com", "password": "test123", "role": "traveler"},
        {"email": "traveler3@test.com", "password": "test123", "role": "traveler"},
        {"email": "traveler4@test.com", "password": "test123", "role": "traveler"},
        {"email": "traveler5@test.com", "password": "test123", "role": "traveler"}
    ]
}

# Test Products (for seller testing)
TEST_PRODUCTS = [
    {"name": "Colombian Coffee Beans", "price": 29.99, "originCountry": "Colombia", "description": "Premium single-origin coffee"},
    {"name": "Swiss Chocolate", "price": 45.50, "originCountry": "Switzerland", "description": "Luxury Swiss chocolate"},
    {"name": "Italian Leather Bag", "price": 199.99, "originCountry": "Italy", "description": "Handcrafted Italian leather"},
    {"name": "Japanese Green Tea", "price": 35.75, "originCountry": "Japan", "description": "Authentic matcha green tea"},
    {"name": "French Perfume", "price": 89.99, "originCountry": "France", "description": "Designer French fragrance"},
    {"name": "German Watch", "price": 299.00, "originCountry": "Germany", "description": "Precision German timepiece"},
    {"name": "Belgian Waffles", "price": 24.50, "originCountry": "Belgium", "description": "Authentic Belgian waffles"},
    {"name": "Dutch Cheese", "price": 67.25, "originCountry": "Netherlands", "description": "Aged Dutch cheese"},
    {"name": "Spanish Wine", "price": 156.99, "originCountry": "Spain", "description": "Premium Spanish Rioja"},
    {"name": "UK Whiskey", "price": 189.75, "originCountry": "United Kingdom", "description": "Single malt Scottish whiskey"}
]

# Test Order Requests (for buyer testing)
TEST_ORDERS = [
    {"itemName": "Coffee from Colombia", "itemPrice": 35.00, "originCountry": "Colombia", "deliveryCountry": "US"},
    {"itemName": "Chocolate from Switzerland", "itemPrice": 50.00, "originCountry": "Switzerland", "deliveryCountry": "US"},
    {"itemName": "Leather bag from Italy", "itemPrice": 220.00, "originCountry": "Italy", "deliveryCountry": "US"},
    {"itemName": "Green tea from Japan", "itemPrice": 40.00, "originCountry": "Japan", "deliveryCountry": "US"},
    {"itemName": "Perfume from France", "itemPrice": 95.00, "originCountry": "France", "deliveryCountry": "US"},
    {"itemName": "Watch from Germany", "itemPrice": 320.00, "originCountry": "Germany", "deliveryCountry": "US"},
    {"itemName": "Waffles from Belgium", "itemPrice": 30.00, "originCountry": "Belgium", "deliveryCountry": "US"},
    {"itemName": "Cheese from Netherlands", "itemPrice": 75.00, "originCountry": "Netherlands", "deliveryCountry": "US"},
    {"itemName": "Wine from Spain", "itemPrice": 170.00, "originCountry": "Spain", "deliveryCountry": "US"},
    {"itemName": "Whiskey from UK", "itemPrice": 200.00, "originCountry": "United Kingdom", "deliveryCountry": "US"}
]

# Test Wallet Balances (for payment testing)
TEST_WALLET_BALANCES = {
    "buyer1@test.com": 500.00,
    "buyer2@test.com": 750.00,
    "buyer3@test.com": 300.00,
    "buyer4@test.com": 1000.00,
    "buyer5@test.com": 450.00,
    "seller1@test.com": 800.00,
    "seller2@test.com": 1200.00,
    "seller3@test.com": 600.00,
    "seller4@test.com": 900.00,
    "seller5@test.com": 1100.00,
    "traveler1@test.com": 350.00,
    "traveler2@test.com": 650.00,
    "traveler3@test.com": 400.00,
    "traveler4@test.com": 550.00,
    "traveler5@test.com": 700.00
}

# Service Endpoints
SERVICE_ENDPOINTS = {
    "auth": "http://localhost:3001",
    "subscription": "http://localhost:3016",
    "country": "http://localhost:3015",
    "order": "http://localhost:3000",
    "product": "http://localhost:3006",
    "payment": "http://localhost:3003",
    "wallet": "http://localhost:3005"
}

# Performance Benchmarks
PERFORMANCE_BENCHMARKS = {
    "max_response_time_ms": 500,
    "min_success_rate_percent": 95,
    "max_concurrent_users": 50,
    "database_query_time_ms": 100
}

# Subscription Plans
SUBSCRIPTION_PLANS = {
    "free": {"price": 0, "features": ["browse", "view_products"]},
    "basic": {"price": 4.99, "features": ["browse", "view_products", "send_messages"]},
    "premium": {"price": 9.99, "features": ["browse", "view_products", "send_messages", "request_items"]},
    "seller-basic": {"price": 19.99, "features": ["browse", "view_products", "send_messages", "create_products", "publish_products"]},
    "seller-pro": {"price": 49.99, "features": ["all_features", "priority_support", "advanced_analytics"]}
}

# Test Execution Plan
TEST_EXECUTION_PLAN = {
    "phase1": {"name": "User Registration", "users_per_type": 5},
    "phase2": {"name": "Subscription Activation", "sellers_to_activate": 5},
    "phase3": {"name": "Product Creation", "products_per_seller": 2},
    "phase4": {"name": "Product Publishing", "publish_all": True},
    "phase5": {"name": "Order Creation", "orders_per_buyer": 2},
    "phase6": {"name": "Order Acceptance", "acceptance_rate": 0.8},
    "phase7": {"name": "Payment Processing", "payment_rate": 0.95},
    "phase8": {"name": "Wallet Operations", "test_escrow": True},
    "phase9": {"name": "Performance Testing", "concurrent_requests": 10},
    "phase10": {"name": "System Validation", "health_checks": True}
}

# Error Scenarios to Test
ERROR_SCENARIOS = [
    "seller_without_subscription",
    "buyer_with_insufficient_balance",
    "invalid_country_code",
    "expired_authentication_token",
    "duplicate_product_creation",
    "order_acceptance_by_wrong_traveler",
    "payment_processing_failure",
    "wallet_hold_insufficient_funds"
]

print("🧪 Local Testing Environment Configuration Loaded")
print(f"📊 Test Users: {len(TEST_USERS['buyers'])} buyers, {len(TEST_USERS['sellers'])} sellers, {len(TEST_USERS['travelers'])} travelers")
print(f"🛍️ Test Products: {len(TEST_PRODUCTS)} products")
print(f"📦 Test Orders: {len(TEST_ORDERS)} orders")
print(f"💰 Test Wallets: {len(TEST_WALLET_BALANCES)} wallets configured")
print("✅ Ready for local reality validation testing")