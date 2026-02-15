import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';
import { validateRequest } from '../middleware/validation.middleware';

/**
 * Search Routes - eBay-Level Search APIs
 * 
 * Features:
 * - Advanced product search with NLP
 * - Autocomplete and suggestions
 * - Trending searches
 * - Personalized search
 * - Search analytics
 * - Saved searches
 */

const router = Router();
const searchController = new SearchController();

// Public search routes

/**
 * GET /api/search
 * Advanced product search with filtering and facets
 * Query params: q, category, minPrice, maxPrice, condition, brand, location, freeShipping, listingType, sortBy, page, size, facets
 */
router.get('/',
  rateLimitMiddleware({ windowMs: 60000, max: 200 }), // 200 searches per minute
  searchController.searchProducts.bind(searchController)
);

/**
 * GET /api/search/autocomplete
 * Get autocomplete suggestions for search queries
 * Query params: q, limit
 */
router.get('/autocomplete',
  rateLimitMiddleware({ windowMs: 60000, max: 300 }), // 300 autocomplete requests per minute
  searchController.getAutocompleteSuggestions.bind(searchController)
);

/**
 * GET /api/search/trending
 * Get trending search queries
 * Query params: limit, period (1h, 24h, 7d, 30d)
 */
router.get('/trending',
  rateLimitMiddleware({ windowMs: 300000, max: 100 }), // 100 requests per 5 minutes
  searchController.getTrendingSearches.bind(searchController)
);

/**
 * GET /api/search/popular
 * Get popular search terms by category
 * Query params: categoryId, limit
 */
router.get('/popular',
  rateLimitMiddleware({ windowMs: 300000, max: 100 }),
  searchController.getPopularSearches.bind(searchController)
);

/**
 * GET /api/search/categories
 * Search categories
 * Query params: q, limit
 */
router.get('/categories',
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  searchController.searchCategories.bind(searchController)
);

/**
 * GET /api/search/brands
 * Search brands
 * Query params: q, limit
 */
router.get('/brands',
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  searchController.searchBrands.bind(searchController)
);

/**
 * GET /api/search/sellers
 * Search sellers
 * Query params: q, limit
 */
router.get('/sellers',
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  searchController.searchSellers.bind(searchController)
);

// Protected search routes (authentication required)

/**
 * GET /api/search/suggestions
 * Get personalized search suggestions based on user history
 * Query params: limit
 */
router.get('/suggestions',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  searchController.getPersonalizedSuggestions.bind(searchController)
);

/**
 * GET /api/search/history
 * Get user's search history
 * Query params: page, limit
 */
router.get('/history',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  searchController.getSearchHistory.bind(searchController)
);

/**
 * DELETE /api/search/history
 * Clear user's search history
 */
router.delete('/history',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 10 }), // 10 clear operations per hour
  searchController.clearSearchHistory.bind(searchController)
);

/**
 * DELETE /api/search/history/:id
 * Delete specific search from history
 */
router.delete('/history/:id',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 100 }),
  searchController.deleteSearchFromHistory.bind(searchController)
);

/**
 * POST /api/search/save
 * Save search query for later
 * Body: { query, name?, filters? }
 */
router.post('/save',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 50 }), // 50 saved searches per hour
  validateRequest({
    body: {
      query: { type: 'string', required: true },
      name: { type: 'string', required: false },
      filters: { type: 'object', required: false }
    }
  }),
  searchController.saveSearch.bind(searchController)
);

/**
 * GET /api/search/saved
 * Get user's saved searches
 * Query params: page, limit
 */
router.get('/saved',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  searchController.getSavedSearches.bind(searchController)
);

/**
 * PUT /api/search/saved/:id
 * Update saved search
 * Body: { name?, query?, filters? }
 */
router.put('/saved/:id',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 100 }),
  validateRequest({
    body: {
      name: { type: 'string', required: false },
      query: { type: 'string', required: false },
      filters: { type: 'object', required: false }
    }
  }),
  searchController.updateSavedSearch.bind(searchController)
);

/**
 * DELETE /api/search/saved/:id
 * Delete saved search
 */
router.delete('/saved/:id',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 100 }),
  searchController.deleteSavedSearch.bind(searchController)
);

/**
 * POST /api/search/saved/:id/execute
 * Execute saved search
 * Query params: page, size
 */
router.post('/saved/:id/execute',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  searchController.executeSavedSearch.bind(searchController)
);

/**
 * POST /api/search/alerts
 * Create search alert (notify when new items match criteria)
 * Body: { query, filters?, frequency, isActive? }
 */
router.post('/alerts',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 20 }), // 20 alerts per hour
  validateRequest({
    body: {
      query: { type: 'string', required: true },
      filters: { type: 'object', required: false },
      frequency: { 
        type: 'string', 
        enum: ['immediate', 'daily', 'weekly'], 
        required: true 
      },
      isActive: { type: 'boolean', required: false }
    }
  }),
  searchController.createSearchAlert.bind(searchController)
);

/**
 * GET /api/search/alerts
 * Get user's search alerts
 * Query params: page, limit
 */
router.get('/alerts',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  searchController.getSearchAlerts.bind(searchController)
);

/**
 * PUT /api/search/alerts/:id
 * Update search alert
 * Body: { query?, filters?, frequency?, isActive? }
 */
router.put('/alerts/:id',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 100 }),
  searchController.updateSearchAlert.bind(searchController)
);

/**
 * DELETE /api/search/alerts/:id
 * Delete search alert
 */
router.delete('/alerts/:id',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 100 }),
  searchController.deleteSearchAlert.bind(searchController)
);

// Advanced search features

/**
 * POST /api/search/visual
 * Visual search using image
 * Body: multipart/form-data with image file
 */
router.post('/visual',
  rateLimitMiddleware({ windowMs: 3600000, max: 50 }), // 50 visual searches per hour
  // multer middleware would be added here for image upload
  searchController.visualSearch.bind(searchController)
);

/**
 * GET /api/search/filters
 * Get available search filters for a category
 * Query params: categoryId
 */
router.get('/filters',
  rateLimitMiddleware({ windowMs: 300000, max: 100 }),
  searchController.getSearchFilters.bind(searchController)
);

/**
 * POST /api/search/feedback
 * Provide feedback on search results
 * Body: { query, resultId?, feedback, rating? }
 */
router.post('/feedback',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 3600000, max: 100 }),
  validateRequest({
    body: {
      query: { type: 'string', required: true },
      resultId: { type: 'string', required: false },
      feedback: { 
        type: 'string', 
        enum: ['relevant', 'not_relevant', 'spam', 'inappropriate'], 
        required: true 
      },
      rating: { type: 'number', min: 1, max: 5, required: false }
    }
  }),
  searchController.submitSearchFeedback.bind(searchController)
);

// Analytics and admin routes

/**
 * GET /api/search/analytics
 * Get search analytics (admin only)
 * Query params: period, metric
 */
router.get('/analytics',
  authMiddleware,
  // Add admin role check middleware here
  rateLimitMiddleware({ windowMs: 300000, max: 50 }),
  searchController.getSearchAnalytics.bind(searchController)
);

/**
 * GET /api/search/performance
 * Get search performance metrics (admin only)
 * Query params: period
 */
router.get('/performance',
  authMiddleware,
  // Add admin role check middleware here
  rateLimitMiddleware({ windowMs: 300000, max: 50 }),
  searchController.getSearchPerformance.bind(searchController)
);

/**
 * POST /api/search/reindex
 * Trigger search index rebuild (admin only)
 */
router.post('/reindex',
  authMiddleware,
  // Add admin role check middleware here
  rateLimitMiddleware({ windowMs: 3600000, max: 1 }), // 1 reindex per hour
  searchController.reindexProducts.bind(searchController)
);

/**
 * GET /api/search/health
 * Check search service health
 */
router.get('/health',
  rateLimitMiddleware({ windowMs: 60000, max: 100 }),
  searchController.getSearchHealth.bind(searchController)
);

export default router;