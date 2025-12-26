import { Router } from 'express';
import multer from 'multer';
import { ProductController } from '../controllers/product.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';
import { createProductSchema, updateProductSchema } from '../validators/product.validator';

/**
 * Product Routes - eBay-Level Product Management APIs
 * 
 * Features:
 * - CRUD operations for products
 * - Image upload and management
 * - Watchlist functionality
 * - Advanced filtering and pagination
 * - Rate limiting and validation
 */

const router = Router();
const productController = new ProductController();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Public routes (no authentication required)

/**
 * GET /api/products
 * Get all products with filtering and pagination
 * Query params: page, limit, categoryId, sellerId, status, listingType, condition, minPrice, maxPrice, location, freeShipping, hasReturns, sortBy, sortOrder, search
 */
router.get('/', 
  rateLimitMiddleware({ windowMs: 60000, max: 100 }), // 100 requests per minute
  productController.getProducts.bind(productController)
);

/**
 * GET /api/products/:id
 * Get single product by ID with full details
 */
router.get('/:id', 
  rateLimitMiddleware({ windowMs: 60000, max: 200 }), // 200 requests per minute
  productController.getProductById.bind(productController)
);

/**
 * GET /api/products/slug/:slug
 * Get product by slug (SEO-friendly URLs)
 */
router.get('/slug/:slug', 
  rateLimitMiddleware({ windowMs: 60000, max: 200 }),
  async (req, res) => {
    // Convert slug to ID lookup
    req.params.id = await productController.getProductIdBySlug(req.params.slug);
    productController.getProductById.bind(productController)(req, res);
  }
);

// Protected routes (authentication required)

/**
 * POST /api/products
 * Create new product
 * Body: CreateProductDto
 */
router.post('/',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 50 }), // 50 products per hour
  validateRequest(createProductSchema),
  productController.createProduct.bind(productController)
);

/**
 * PUT /api/products/:id
 * Update existing product
 * Body: UpdateProductDto
 */
router.put('/:id',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 100 }), // 100 updates per hour
  validateRequest(updateProductSchema),
  productController.updateProduct.bind(productController)
);

/**
 * DELETE /api/products/:id
 * Delete product (soft delete)
 */
router.delete('/:id',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 20 }), // 20 deletions per hour
  productController.deleteProduct.bind(productController)
);

/**
 * POST /api/products/:id/images
 * Upload product images
 * Body: multipart/form-data with image files
 */
router.post('/:id/images',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 30 }), // 30 image uploads per hour
  upload.array('images', 10), // Maximum 10 images
  productController.uploadImages.bind(productController)
);

/**
 * DELETE /api/products/:id/images/:imageId
 * Delete specific product image
 */
router.delete('/:id/images/:imageId',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 50 }),
  productController.deleteImage.bind(productController)
);

/**
 * PUT /api/products/:id/images/:imageId/primary
 * Set image as primary
 */
router.put('/:id/images/:imageId/primary',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 100 }),
  productController.setPrimaryImage.bind(productController)
);

/**
 * POST /api/products/:id/watch
 * Add product to user's watchlist
 */
router.post('/:id/watch',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 200 }), // 200 watch actions per hour
  productController.addToWatchlist.bind(productController)
);

/**
 * DELETE /api/products/:id/watch
 * Remove product from user's watchlist
 */
router.delete('/:id/watch',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 200 }),
  productController.removeFromWatchlist.bind(productController)
);

/**
 * GET /api/products/:id/watchers
 * Get product watchers (seller only)
 */
router.get('/:id/watchers',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 100 }),
  productController.getProductWatchers.bind(productController)
);

/**
 * POST /api/products/:id/report
 * Report product for policy violation
 */
router.post('/:id/report',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 10 }), // 10 reports per hour
  validateRequest({
    body: {
      reason: { type: 'string', required: true },
      description: { type: 'string', required: false }
    }
  }),
  productController.reportProduct.bind(productController)
);

/**
 * GET /api/products/:id/similar
 * Get similar products based on category, brand, price range
 */
router.get('/:id/similar',
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  productController.getSimilarProducts.bind(productController)
);

/**
 * GET /api/products/:id/analytics
 * Get product analytics (seller only)
 */
router.get('/:id/analytics',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 50 }),
  productController.getProductAnalytics.bind(productController)
);

/**
 * POST /api/products/:id/promote
 * Promote product (paid feature)
 */
router.post('/:id/promote',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 10 }),
  validateRequest({
    body: {
      duration: { type: 'number', required: true }, // in days
      type: { type: 'string', enum: ['featured', 'promoted', 'sponsored'], required: true }
    }
  }),
  productController.promoteProduct.bind(productController)
);

/**
 * POST /api/products/:id/duplicate
 * Duplicate product for re-listing
 */
router.post('/:id/duplicate',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 20 }),
  productController.duplicateProduct.bind(productController)
);

/**
 * PUT /api/products/:id/status
 * Update product status (activate, deactivate, end auction)
 */
router.put('/:id/status',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 100 }),
  validateRequest({
    body: {
      status: { 
        type: 'string', 
        enum: ['ACTIVE', 'INACTIVE', 'ENDED', 'CANCELLED'], 
        required: true 
      }
    }
  }),
  productController.updateProductStatus.bind(productController)
);

/**
 * GET /api/products/seller/:sellerId
 * Get products by seller
 */
router.get('/seller/:sellerId',
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  productController.getProductsBySeller.bind(productController)
);

/**
 * GET /api/products/category/:categoryId
 * Get products by category
 */
router.get('/category/:categoryId',
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  productController.getProductsByCategory.bind(productController)
);

/**
 * GET /api/products/featured
 * Get featured products
 */
router.get('/featured',
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  productController.getFeaturedProducts.bind(productController)
);

/**
 * GET /api/products/ending-soon
 * Get auctions ending soon
 */
router.get('/ending-soon',
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  productController.getAuctionsEndingSoon.bind(productController)
);

/**
 * GET /api/products/recently-viewed
 * Get user's recently viewed products
 */
router.get('/recently-viewed',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  productController.getRecentlyViewedProducts.bind(productController)
);

/**
 * GET /api/products/recommendations
 * Get personalized product recommendations
 */
router.get('/recommendations',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 60000, max: 50 }),
  productController.getRecommendedProducts.bind(productController)
);

// Bulk operations (admin/seller tools)

/**
 * POST /api/products/bulk/update
 * Bulk update products
 */
router.post('/bulk/update',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 10 }), // 10 bulk operations per hour
  validateRequest({
    body: {
      productIds: { type: 'array', items: { type: 'string' }, required: true },
      updates: { type: 'object', required: true }
    }
  }),
  productController.bulkUpdateProducts.bind(productController)
);

/**
 * POST /api/products/bulk/delete
 * Bulk delete products
 */
router.post('/bulk/delete',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 5 }), // 5 bulk deletions per hour
  validateRequest({
    body: {
      productIds: { type: 'array', items: { type: 'string' }, required: true }
    }
  }),
  productController.bulkDeleteProducts.bind(productController)
);

/**
 * POST /api/products/import
 * Import products from CSV/Excel
 */
router.post('/import',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 3 }), // 3 imports per hour
  upload.single('file'),
  productController.importProducts.bind(productController)
);

/**
 * GET /api/products/export
 * Export user's products to CSV
 */
router.get('/export',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 5 }), // 5 exports per hour
  productController.exportProducts.bind(productController)
);

export default router;