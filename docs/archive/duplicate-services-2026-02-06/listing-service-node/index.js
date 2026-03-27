const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'mnbarh-listing-service',
    timestamp: new Date().toISOString()
  });
});

// Mock products data
const mockProducts = [
  {
    id: 1,
    title: 'iPhone 14 Pro Max 256GB',
    price: 1099,
    image: 'https://via.placeholder.com/300x300',
    category: 'Electronics',
    description: 'Latest iPhone with advanced camera system',
    seller: 'TechStore',
    rating: 4.8,
    reviews: 234,
    inStock: true
  },
  {
    id: 2,
    title: 'Nike Air Jordan 1 Retro',
    price: 189,
    image: 'https://via.placeholder.com/300x300',
    category: 'Fashion',
    description: 'Classic basketball shoes in premium leather',
    seller: 'SneakerWorld',
    rating: 4.6,
    reviews: 156,
    inStock: true
  },
  {
    id: 3,
    title: 'Sony PlayStation 5 Console',
    price: 499,
    image: 'https://via.placeholder.com/300x300',
    category: 'Gaming',
    description: 'Next-gen gaming console with 4K support',
    seller: 'GameHub',
    rating: 4.9,
    reviews: 892,
    inStock: false
  },
  {
    id: 4,
    title: 'MacBook Pro 14" M2',
    price: 1999,
    image: 'https://via.placeholder.com/300x300',
    category: 'Electronics',
    description: 'Professional laptop with M2 chip',
    seller: 'AppleStore',
    rating: 4.7,
    reviews: 445,
    inStock: true
  }
];

// API Routes
app.get('/api/products', (req, res) => {
  const { category, search, limit = 20, page = 1 } = req.query;
  let filteredProducts = [...mockProducts];

  // Filter by category
  if (category && category !== 'all') {
    filteredProducts = filteredProducts.filter(p => 
      p.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Search functionality
  if (search) {
    const searchTerm = search.toLowerCase();
    filteredProducts = filteredProducts.filter(p =>
      p.title.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm)
    );
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  res.json({
    products: paginatedProducts,
    total: filteredProducts.length,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(filteredProducts.length / limit)
  });
});

app.get('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const product = mockProducts.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  res.json(product);
});

app.get('/api/categories', (req, res) => {
  const categories = [
    { id: 'electronics', name: 'Electronics', icon: '📱', count: 2 },
    { id: 'fashion', name: 'Fashion', icon: '👗', count: 1 },
    { id: 'gaming', name: 'Gaming', icon: '🎮', count: 1 },
    { id: 'home', name: 'Home & Garden', icon: '🏡', count: 0 },
    { id: 'sports', name: 'Sports', icon: '⚽', count: 0 },
    { id: 'auto', name: 'Auto Parts', icon: '🚗', count: 0 }
  ];
  
  res.json(categories);
});

app.get('/api/search', (req, res) => {
  const { q, category } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  let results = mockProducts.filter(p =>
    p.title.toLowerCase().includes(q.toLowerCase()) ||
    p.description.toLowerCase().includes(q.toLowerCase())
  );
  
  if (category && category !== 'all') {
    results = results.filter(p => 
      p.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  res.json({
    query: q,
    category: category || 'all',
    results: results,
    count: results.length
  });
});

// Featured products endpoint
app.get('/api/featured', (req, res) => {
  const featured = mockProducts.filter(p => p.rating >= 4.7);
  res.json(featured);
});

// Trending searches endpoint
app.get('/api/trending', (req, res) => {
  const trending = [
    'iPhone 15 Pro',
    'Nike Dunks',
    'PS5 Console',
    'MacBook Air',
    'AirPods Pro',
    'Samsung TV'
  ];
  res.json(trending);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 mnbarh Listing Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🛍️  Products API: http://localhost:${PORT}/api/products`);
});