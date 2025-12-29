# 🟡 HOURS 2-6: MVP Marketplace Implementation

**START TIME:** Hour 2 (after CI/CD complete)  
**DURATION:** 4 hours (2:00 - 6:00)  
**TEAM:** 3 Backend Engineers + 2 Frontend Engineers  
**STATUS:** 🚀 READY TO START

---

## 📋 Overview

This phase builds the core marketplace functionality:
- Product display and management
- Search and filtering
- Shopping cart
- Payment integration (Stripe test mode)
- Basic checkout flow

---

## ⏱️ Detailed Timeline

### HOUR 2:00 - 2:30: Environment Setup & Database Initialization

**STEP 1: Start Infrastructure**
```bash
# Start Docker Compose
docker-compose up -d

# Verify services are running
docker-compose ps

# Expected output:
# postgres - UP
# redis - UP
# rabbitmq - UP
# elasticsearch - UP
```

**STEP 2: Initialize Databases**
```bash
# Run database migrations
npm run migrate --workspace=backend

# Seed initial data
npm run seed --workspace=backend

# Verify databases
# Connect to postgres:
# psql -U mnbarh -d mnbarh -h localhost
# \dt (list tables)
```

**STEP 3: Verify Elasticsearch**
```bash
# Check Elasticsearch health
curl http://localhost:9200/_cluster/health

# Expected response:
# {"status":"green","number_of_nodes":1,...}

# Create indices
npm run elasticsearch:init --workspace=backend
```

**STEP 4: Test Connections**
```bash
# Test Redis
redis-cli ping
# Expected: PONG

# Test RabbitMQ
# Go to: http://localhost:15672
# Login: mnbarh / mnbarh_dev_password

# Test PostgreSQL
psql -U mnbarh -d mnbarh -h localhost -c "SELECT version();"
```

---

### HOUR 2:30 - 3:30: Product Display & API

**BACKEND TASKS (2 engineers):**

**STEP 1: Verify Product Service**
```bash
# Check listing service
type backend\services\listing-service-node\src\index.ts

# Verify routes
type backend\services\listing-service-node\src\routes\product.routes.ts

# Expected endpoints:
# GET /api/products - List all products
# GET /api/products/:id - Get product details
# POST /api/products - Create product (seller)
# PUT /api/products/:id - Update product (seller)
# DELETE /api/products/:id - Delete product (seller)
```

**STEP 2: Seed Product Data**
```bash
# Create seed script
cat > backend/services/listing-service-node/prisma/seed-products.ts << 'EOF'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create 100+ products for MVP
  const products = [];
  
  for (let i = 1; i <= 100; i++) {
    products.push({
      title: `Product ${i}`,
      description: `High-quality product ${i}`,
      price: Math.floor(Math.random() * 1000) + 10,
      category: ['Electronics', 'Fashion', 'Home', 'Sports'][i % 4],
      stock: Math.floor(Math.random() * 100) + 1,
      sellerId: 'seller-1',
      images: [`https://via.placeholder.com/300?text=Product+${i}`],
      rating: Math.random() * 5,
      reviews: Math.floor(Math.random() * 100),
    });
  }
  
  await prisma.product.createMany({ data: products });
  console.log('✅ Seeded 100 products');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
EOF

# Run seed
npm run prisma:seed --workspace=backend/services/listing-service-node
```

**STEP 3: Test Product APIs**
```bash
# Start listing service
npm run dev --workspace=backend/services/listing-service-node

# In another terminal, test endpoints
curl http://localhost:3001/api/products
curl http://localhost:3001/api/products/1

# Expected: 200 OK with product data
```

**FRONTEND TASKS (2 engineers):**

**STEP 1: Create Product Display Component**
```bash
# Check existing component
type frontend\web-app\src\components\product\ProductCard.tsx

# Create product list page
cat > frontend/web-app/src/pages/ProductsPage.tsx << 'EOF'
import React, { useEffect, useState } from 'react';
import { ProductCard } from '../components/product/ProductCard';
import { productAPI } from '../services/api/productAPI';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productAPI.getProducts();
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="products-page">
      <h1>Products</h1>
      <div className="products-grid">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};
EOF
```

**STEP 2: Update Product API Client**
```bash
# Check API client
type frontend\web-app\src\services\api\productAPI.ts

# Ensure it has:
# - getProducts()
# - getProductById(id)
# - searchProducts(query)
```

**STEP 3: Test Frontend**
```bash
# Start frontend dev server
npm run dev --workspace=frontend/web-app

# Go to: http://localhost:5173/products
# Expected: Product list displayed
```

---

### HOUR 3:30 - 4:30: Search & Filtering

**BACKEND TASKS (1 engineer):**

**STEP 1: Verify Elasticsearch Integration**
```bash
# Check search service
type backend\services\listing-service-node\src\services\elasticsearch.service.ts

# Verify search endpoint
type backend\services\listing-service-node\src\routes\search.routes.ts

# Expected endpoints:
# GET /api/search?q=query - Search products
# GET /api/search/filters - Get available filters
```

**STEP 2: Index Products in Elasticsearch**
```bash
# Create indexing script
cat > backend/services/listing-service-node/src/scripts/index-products.ts << 'EOF'
import { ElasticsearchService } from '../services/elasticsearch.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const es = new ElasticsearchService();

async function main() {
  const products = await prisma.product.findMany();
  
  for (const product of products) {
    await es.indexProduct(product);
  }
  
  console.log(`✅ Indexed ${products.length} products`);
}

main().catch(console.error);
EOF

# Run indexing
npm run ts-node -- backend/services/listing-service-node/src/scripts/index-products.ts
```

**STEP 3: Test Search**
```bash
# Test search endpoint
curl "http://localhost:3001/api/search?q=electronics"

# Expected: Products matching query
```

**FRONTEND TASKS (1 engineer):**

**STEP 1: Create Search Component**
```bash
# Check existing search
type frontend\web-app\src\components\search\SearchBar.tsx

# Create search results page
cat > frontend/web-app/src/pages/SearchResultsPage.tsx << 'EOF'
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/product/ProductCard';
import { searchAPI } from '../services/api/searchAPI';

export const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const query = searchParams.get('q') || '';

  useEffect(() => {
    const search = async () => {
      try {
        const data = await searchAPI.search(query);
        setResults(data);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    if (query) search();
  }, [query]);

  if (loading) return <div>Searching...</div>;

  return (
    <div className="search-results">
      <h1>Results for \"{query}\"</h1>
      <div className="results-grid">
        {results.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};
EOF
```

**STEP 2: Create Filters Component**
```bash
# Create filters
cat > frontend/web-app/src/components/search/SearchFilters.tsx << 'EOF'
import React from 'react';

interface SearchFiltersProps {
  onFilterChange: (filters: any) => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ onFilterChange }) => {
  return (
    <div className="search-filters">
      <div className="filter-group">
        <label>Category</label>
        <select onChange={(e) => onFilterChange({ category: e.target.value })}>
          <option value="">All</option>
          <option value="electronics">Electronics</option>
          <option value="fashion">Fashion</option>
          <option value="home">Home</option>
          <option value="sports">Sports</option>
        </select>
      </div>
      
      <div className="filter-group">
        <label>Price Range</label>
        <input type="range" min="0" max="1000" onChange={(e) => onFilterChange({ maxPrice: e.target.value })} />
      </div>
      
      <div className="filter-group">
        <label>Rating</label>
        <select onChange={(e) => onFilterChange({ minRating: e.target.value })}>
          <option value="">All</option>
          <option value="4">4+ Stars</option>
          <option value="3">3+ Stars</option>
        </select>
      </div>
    </div>
  );
};
EOF
```

**STEP 3: Test Search**
```bash
# Go to: http://localhost:5173/search?q=electronics
# Expected: Search results displayed with filters
```

---

### HOUR 4:30 - 5:30: Shopping Cart & Checkout

**BACKEND TASKS (1 engineer):**

**STEP 1: Verify Cart Service**
```bash
# Check cart endpoints
type backend\services\orders-service\src\routes\cart.routes.ts

# Expected endpoints:
# GET /api/cart - Get cart
# POST /api/cart/items - Add to cart
# PUT /api/cart/items/:id - Update cart item
# DELETE /api/cart/items/:id - Remove from cart
# POST /api/cart/checkout - Checkout
```

**STEP 2: Verify Payment Service**
```bash
# Check payment service
type backend\services\payment-service\src\index.js

# Expected endpoints:
# POST /api/payments/create-intent - Create payment intent
# POST /api/payments/confirm - Confirm payment
# POST /api/payments/webhook - Stripe webhook
```

**STEP 3: Setup Stripe Test Mode**
```bash
# Create Stripe configuration
cat > backend/services/payment-service/.env.local << 'EOF'
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_WEBHOOK_SECRET
EOF

# Get test keys from: https://dashboard.stripe.com/test/apikeys
```

**FRONTEND TASKS (1 engineer):**

**STEP 1: Create Cart Component**
```bash
# Check existing cart
type frontend\web-app\src\pages\CartPage.tsx

# Verify cart functionality:
# - Add to cart
# - Remove from cart
# - Update quantity
# - Calculate total
```

**STEP 2: Create Checkout Component**
```bash
# Create checkout page
cat > frontend/web-app/src/pages/CheckoutPage.tsx << 'EOF'
import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { cartAPI } from '../services/api/cartAPI';

export const CheckoutPage: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create payment intent
      const { clientSecret } = await cartAPI.createPaymentIntent();

      // Confirm payment
      const result = await stripe!.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements!.getElement(CardElement)!,
        },
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
      } else {
        // Payment successful
        window.location.href = '/order-success';
      }
    } catch (err) {
      setError('Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      <form onSubmit={handleCheckout}>
        <CardElement />
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
};
EOF
```

**STEP 3: Test Checkout**
```bash
# Use Stripe test card: 4242 4242 4242 4242
# Expiry: 12/25
# CVC: 123

# Go to: http://localhost:5173/checkout
# Expected: Payment form displayed and working
```

---

### HOUR 5:30 - 6:00: Testing & Performance Optimization

**QA TASKS (2 engineers):**

**STEP 1: End-to-End Testing**
```bash
# Create e2e test
cat > test/integration/marketplace.test.ts << 'EOF'
describe('Marketplace MVP', () => {
  it('should display products', async () => {
    const response = await fetch('http://localhost:3001/api/products');
    expect(response.status).toBe(200);
    const products = await response.json();
    expect(products.length).toBeGreaterThan(0);
  });

  it('should search products', async () => {
    const response = await fetch('http://localhost:3001/api/search?q=electronics');
    expect(response.status).toBe(200);
    const results = await response.json();
    expect(results.length).toBeGreaterThan(0);
  });

  it('should add to cart', async () => {
    const response = await fetch('http://localhost:3001/api/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId: 1, quantity: 1 }),
    });
    expect(response.status).toBe(200);
  });

  it('should create payment intent', async () => {
    const response = await fetch('http://localhost:3001/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ amount: 1000 }),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.clientSecret).toBeDefined();
  });
});
EOF

# Run tests
npm test -- test/integration/marketplace.test.ts
```

**STEP 2: Performance Testing**
```bash
# Create k6 load test
cat > test/performance/marketplace.js << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 100,
  duration: '5m',
};

export default function () {
  // Test product listing
  let res = http.get('http://localhost:3001/api/products');
  check(res, { 'products status 200': (r) => r.status === 200 });

  // Test search
  res = http.get('http://localhost:3001/api/search?q=electronics');
  check(res, { 'search status 200': (r) => r.status === 200 });

  // Test cart
  res = http.post('http://localhost:3001/api/cart/items', {
    productId: 1,
    quantity: 1,
  });
  check(res, { 'cart status 200': (r) => r.status === 200 });
}
EOF

# Run load test
k6 run test/performance/marketplace.js
```

**STEP 3: Document Results**
```bash
# Create test report
cat > MARKETPLACE_TEST_REPORT.md << 'EOF'
# Marketplace MVP Test Report

## E2E Tests
- ✅ Product Display: PASS
- ✅ Search: PASS
- ✅ Cart: PASS
- ✅ Payment: PASS

## Performance Tests
- ✅ P99 Latency: < 500ms
- ✅ Error Rate: < 0.1%
- ✅ Throughput: 1000+ req/s

## Status: READY FOR HOUR 6
EOF
```

---

## ✅ Completion Checklist

### Before Moving to Hour 6:

- [ ] Docker services running
- [ ] Databases initialized
- [ ] 100+ products seeded
- [ ] Product API working
- [ ] Search working
- [ ] Cart working
- [ ] Payment integration working
- [ ] All e2e tests passing
- [ ] Performance acceptable
- [ ] No errors in logs

---

## 📊 Success Criteria

✅ **PASS** if:
- All services running
- 100+ products displayed
- Search returns results
- Cart operations work
- Payment intent created
- All tests pass
- P99 latency < 500ms

❌ **FAIL** if:
- Services not running
- Products not displayed
- Search fails
- Cart operations fail
- Payment fails
- Tests fail
- Performance poor

---

## 🚨 Troubleshooting

### Services not starting:
```bash
docker-compose logs
docker-compose restart
```

### Database issues:
```bash
npm run migrate --workspace=backend
npm run seed --workspace=backend
```

### API errors:
```bash
npm run dev --workspace=backend/services/listing-service-node
# Check logs for errors
```

### Frontend issues:
```bash
npm run dev --workspace=frontend/web-app
# Check browser console
```

---

## 🎯 Next Steps (Hour 6)

After Hour 2-6 completion:
1. ✅ Security sweep complete
2. ✅ CI/CD setup complete
3. ✅ MVP Marketplace complete
4. ➡️ Move to Hour 6: Seller Dashboard Setup
5. ➡️ Then: Escrow & Payment (Hour 10-14)

---

**HOURS 2-6 STATUS:** 🚀 Ready to Execute

**ESTIMATED COMPLETION:** 4 hours from Hour 2 start

**NEXT MILESTONE:** Hour 6 - Seller Dashboard Setup Complete

