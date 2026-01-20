-- Seed Homepage with default sections
-- Phase 2.5: CMS-Driven Homepage Architecture

-- Insert homepage
INSERT INTO cms_pages (id, slug, title, description, is_active)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'homepage',
    'MNbarh Homepage',
    'Main landing page with hero carousel, deals, categories, and value propositions',
    true
) ON CONFLICT (slug) DO NOTHING;

-- Insert Hero Carousel Section
INSERT INTO cms_sections (id, page_id, type, title, enabled, sort_order, config)
VALUES (
    'hero-0001-0001-0001-000000000001',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'carousel',
    'Hero Carousel',
    true,
    1,
    '{"autoplay": true, "interval": 5000, "showDots": true, "showArrows": true}'
) ON CONFLICT DO NOTHING;

-- Hero Carousel Items
INSERT INTO cms_section_items (section_id, sort_order, data) VALUES
('hero-0001-0001-0001-000000000001', 1, '{
    "title": "Buy from anywhere with trusted travelers",
    "subtitle": "Get products from any website worldwide delivered to your door",
    "ctaText": "Start Shopping",
    "ctaLink": "/search",
    "bgColor": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "textColor": "white"
}'),
('hero-0001-0001-0001-000000000001', 2, '{
    "title": "Paste a link & get it delivered",
    "subtitle": "Found something online? Paste the link and travelers will bring it to you",
    "ctaText": "Paste a Link",
    "ctaLink": "#paste-link",
    "bgColor": "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "textColor": "white"
}'),
('hero-0001-0001-0001-000000000001', 3, '{
    "title": "Travel & earn by helping buyers",
    "subtitle": "Make money on your next trip by delivering products to buyers",
    "ctaText": "Add Your Trip",
    "ctaLink": "#traveler",
    "bgColor": "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "textColor": "white"
}'),
('hero-0001-0001-0001-000000000001', 4, '{
    "title": "Deals, auctions & buyer protection",
    "subtitle": "Shop with confidence - every purchase is protected",
    "ctaText": "Explore Deals",
    "ctaLink": "/deals",
    "bgColor": "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "textColor": "white"
}');

-- Insert Deals Section
INSERT INTO cms_sections (id, page_id, type, title, enabled, sort_order, config)
VALUES (
    'deal-0002-0002-0002-000000000002',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'deals',
    'Today''s Deals',
    true,
    2,
    '{"showBadges": true, "maxItems": 10}'
) ON CONFLICT DO NOTHING;

-- Deals Section Items
INSERT INTO cms_section_items (section_id, sort_order, data) VALUES
('deal-0002-0002-0002-000000000002', 1, '{
    "id": "deal-1",
    "title": "Apple iPhone 15 Pro Max 256GB",
    "price": 949.99,
    "originalPrice": 1099.99,
    "image": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300",
    "shipping": "Free shipping",
    "condition": "New",
    "sellerRating": 4.9,
    "sellerReviews": 15234,
    "discount": 14
}'),
('deal-0002-0002-0002-000000000002', 2, '{
    "id": "deal-2",
    "title": "Sony PlayStation 5 Disc Edition",
    "price": 449.99,
    "originalPrice": 499.99,
    "image": "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=300",
    "shipping": "Free shipping",
    "condition": "New",
    "sellerRating": 4.8,
    "sellerReviews": 8921,
    "discount": 10
}'),
('deal-0002-0002-0002-000000000002', 3, '{
    "id": "deal-3",
    "title": "Samsung 65\" 4K OLED Smart TV",
    "price": 1497.99,
    "originalPrice": 1997.99,
    "image": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300",
    "shipping": "Free shipping",
    "condition": "New",
    "sellerRating": 4.7,
    "sellerReviews": 3456,
    "discount": 25
}'),
('deal-0002-0002-0002-000000000002', 4, '{
    "id": "deal-4",
    "title": "Apple MacBook Pro 14\" M3 Pro",
    "price": 1649.00,
    "originalPrice": 1799.00,
    "image": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300",
    "shipping": "Free shipping",
    "condition": "New",
    "sellerRating": 5.0,
    "sellerReviews": 2341,
    "discount": 8
}'),
('deal-0002-0002-0002-000000000002', 5, '{
    "id": "deal-5",
    "title": "Dyson V15 Detect Cordless Vacuum",
    "price": 549.99,
    "originalPrice": 649.99,
    "image": "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=300",
    "shipping": "Free shipping",
    "condition": "Refurbished",
    "sellerRating": 4.6,
    "sellerReviews": 4521,
    "discount": 15
}');

-- Insert Category Grid Section
INSERT INTO cms_sections (id, page_id, type, title, enabled, sort_order, config)
VALUES (
    'cats-0003-0003-0003-000000000003',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'categories',
    'Shop by Category',
    true,
    3,
    '{"columns": 6}'
) ON CONFLICT DO NOTHING;

-- Category Grid Items
INSERT INTO cms_section_items (section_id, sort_order, data) VALUES
('cats-0003-0003-0003-000000000003', 1, '{
    "id": "cat-1",
    "name": "Electronics",
    "slug": "electronics",
    "icon": "smartphone",
    "color": "from-blue-500 to-blue-600"
}'),
('cats-0003-0003-0003-000000000003', 2, '{
    "id": "cat-2",
    "name": "Fashion",
    "slug": "fashion",
    "icon": "shirt",
    "color": "from-pink-500 to-pink-600"
}'),
('cats-0003-0003-0003-000000000003', 3, '{
    "id": "cat-3",
    "name": "Home & Garden",
    "slug": "home-garden",
    "icon": "home",
    "color": "from-green-500 to-green-600"
}'),
('cats-0003-0003-0003-000000000003', 4, '{
    "id": "cat-4",
    "name": "Sports & Outdoors",
    "slug": "sports",
    "icon": "activity",
    "color": "from-orange-500 to-orange-600"
}'),
('cats-0003-0003-0003-000000000003', 5, '{
    "id": "cat-5",
    "name": "Collectibles",
    "slug": "collectibles",
    "icon": "star",
    "color": "from-purple-500 to-purple-600"
}'),
('cats-0003-0003-0003-000000000003', 6, '{
    "id": "cat-6",
    "name": "Travel Requests",
    "slug": "travel-requests",
    "icon": "globe",
    "color": "from-cyan-500 to-cyan-600"
}');

-- Insert Core Value Strip Section
INSERT INTO cms_sections (id, page_id, type, title, enabled, sort_order, config)
VALUES (
    'vals-0004-0004-0004-000000000004',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'values',
    'Why Choose MNbarh?',
    true,
    4,
    '{"showCTA": true, "ctaText": "Get Started Now"}'
) ON CONFLICT DO NOTHING;

-- Core Value Strip Items
INSERT INTO cms_section_items (section_id, sort_order, data) VALUES
('vals-0004-0004-0004-000000000004', 1, '{
    "id": "val-1",
    "title": "Travel & Earn",
    "description": "Make money on your next trip by delivering products to buyers",
    "icon": "globe",
    "color": "bg-blue-50 text-brand-blue"
}'),
('vals-0004-0004-0004-000000000004', 2, '{
    "id": "val-2",
    "title": "Paste Link Buying",
    "description": "Found something online? Paste the link and get it delivered",
    "icon": "link",
    "color": "bg-purple-50 text-purple-600"
}'),
('vals-0004-0004-0004-000000000004', 3, '{
    "id": "val-3",
    "title": "Auctions & Deals",
    "description": "Bid on unique items and grab amazing deals every day",
    "icon": "dollar",
    "color": "bg-green-50 text-green-600"
}'),
('vals-0004-0004-0004-000000000004', 4, '{
    "id": "val-4",
    "title": "Buyer Protection",
    "description": "Every purchase is protected with our money-back guarantee",
    "icon": "shield",
    "color": "bg-orange-50 text-orange-600"
}');
