import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { SubscriptionGate } from '../subscription-service/src/SubscriptionGate';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(compression());
app.use(express.json());

// In-memory product storage for MVP
interface Product {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  price: number;
  originCountry: string;
  purchaseCountry: string;
  deliveryCountry: string;
  status: 'draft' | 'published' | 'sold' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

const products: Product[] = [];

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Product Service Running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    products: products.length
  });
});

// Get all products (public)
app.get('/products', (req, res) => {
  try {
    const { country, status = 'published', page = 1, limit = 20 } = req.query;

    let filteredProducts = products.filter(p => p.status === status);
    
    if (country) {
      filteredProducts = filteredProducts.filter(p => p.originCountry === country);
    }

    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / Number(limit))
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

// Create product - SELLER SUBSCRIPTION REQUIRED
app.post('/products', 
  SubscriptionGate.requireSubscription('create-product'),
  (req, res) => {
    try {
      const sellerId = (req as any).subscription.userId;
      const { name, description, price, originCountry, purchaseCountry, deliveryCountry } = req.body;

      // Validate input
      if (!name || !price || !originCountry) {
        return res.status(400).json({
          success: false,
          error: 'Name, price, and origin country are required'
        });
      }

      const product: Product = {
        id: 'product-' + Math.random().toString(36).substr(2, 9),
        sellerId,
        name,
        description: description || '',
        price,
        originCountry,
        purchaseCountry: purchaseCountry || originCountry,
        deliveryCountry: deliveryCountry || 'US',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      products.push(product);

      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully (draft status)'
      });

    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create product'
      });
    }
  }
);

// Publish product - SELLER SUBSCRIPTION REQUIRED
app.post('/products/:id/publish',
  SubscriptionGate.requireSubscription('publish-product'),
  (req, res) => {
    try {
      const sellerId = (req as any).subscription.userId;
      const { id } = req.params;

      const productIndex = products.findIndex(p => p.id === id && p.sellerId === sellerId);
      
      if (productIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Product not found or not owned by you'
        });
      }

      const product = products[productIndex];

      if (product.status !== 'draft') {
        return res.status(400).json({
          success: false,
          error: 'Only draft products can be published'
        });
      }

      product.status = 'published';
      product.publishedAt = new Date();
      product.updatedAt = new Date();

      res.json({
        success: true,
        data: product,
        message: 'Product published successfully!'
      });

    } catch (error) {
      console.error('Publish product error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to publish product'
      });
    }
  }
);

// Get seller's products
app.get('/seller/products', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Simple token parsing - in production, use proper JWT verification
    const sellerId = JSON.parse(atob(token.split('.')[1])).id;

    const sellerProducts = products.filter(p => p.sellerId === sellerId);

    res.json({
      success: true,
      data: sellerProducts
    });

  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid authentication'
    });
  }
});

// Admin endpoint to get all products
app.get('/admin/products', (req, res) => {
  try {
    // Simple admin check - in production, use proper auth middleware
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = JSON.parse(atob(token.split('.')[1]));
    
    // Check if user is admin (simplified)
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid authentication'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🛍️ Product Service running on port ${PORT}`);
  console.log(`📦 Create Product: POST /products (requires seller subscription)`);
  console.log(`🚀 Publish Product: POST /products/:id/publish (requires seller subscription)`);
  console.log(`📋 Get Products: GET /products (public)`);
  console.log(`🏪 Seller Products: GET /seller/products`);
});

export default app;