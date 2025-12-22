/**
 * Search API Controller
 * Express router for search endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { SearchService, SearchOptions, SearchFilters } from './search.service';

const router = Router();
const searchService = new SearchService();

/**
 * Parse search filters from query parameters
 */
function parseFilters(query: Record<string, unknown>): SearchFilters {
  const filters: SearchFilters = {};

  if (query.categoryId) {
    filters.categoryId = String(query.categoryId);
  }

  if (query.categoryPath) {
    filters.categoryPath = String(query.categoryPath);
  }

  if (query.priceMin) {
    filters.priceMin = Number(query.priceMin);
  }

  if (query.priceMax) {
    filters.priceMax = Number(query.priceMax);
  }

  if (query.condition) {
    filters.condition = Array.isArray(query.condition)
      ? query.condition.map(String)
      : [String(query.condition)];
  }

  if (query.status) {
    filters.status = Array.isArray(query.status)
      ? query.status.map(String)
      : [String(query.status)];
  }

  if (query.lat && query.lon && query.radius) {
    filters.location = {
      lat: Number(query.lat),
      lon: Number(query.lon),
      radiusKm: Number(query.radius),
    };
  }

  if (query.city) {
    filters.city = String(query.city);
  }

  if (query.country) {
    filters.country = String(query.country);
  }

  if (query.sellerId) {
    filters.sellerId = String(query.sellerId);
  }

  if (query.featured !== undefined) {
    filters.featured = query.featured === 'true';
  }

  if (query.type) {
    filters.type = query.type as 'fixed' | 'auction';
  }

  return filters;
}

/**
 * GET /search/products
 * Search products with full-text search and filters
 */
router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const options: SearchOptions = {
      query: String(req.query.q || ''),
      filters: parseFilters(req.query),
      page: Number(req.query.page) || 1,
      pageSize: Math.min(Number(req.query.pageSize) || 20, 100),
      sortBy: (req.query.sortBy as SearchOptions['sortBy']) || 'relevance',
    };

    const results = await searchService.searchProducts(options);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /search/listings
 * Search active listings (fixed price + auctions)
 */
router.get('/listings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const options: SearchOptions = {
      query: String(req.query.q || ''),
      filters: parseFilters(req.query),
      page: Number(req.query.page) || 1,
      pageSize: Math.min(Number(req.query.pageSize) || 20, 100),
      sortBy: (req.query.sortBy as SearchOptions['sortBy']) || 'relevance',
    };

    const results = await searchService.searchListings(options);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /search/auctions
 * Search auctions with auction-specific filters
 */
router.get('/auctions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const options = {
      query: String(req.query.q || ''),
      filters: parseFilters(req.query),
      page: Number(req.query.page) || 1,
      pageSize: Math.min(Number(req.query.pageSize) || 20, 100),
      sortBy: (req.query.sortBy as SearchOptions['sortBy']) || 'ending_soon',
      endingSoon: req.query.endingSoon === 'true',
      reserveMet: req.query.reserveMet !== undefined
        ? req.query.reserveMet === 'true'
        : undefined,
    };

    const results = await searchService.searchAuctions(options);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /search/autocomplete
 * Get autocomplete suggestions for search
 */
router.get('/autocomplete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = String(req.query.q || '');
    const limit = Math.min(Number(req.query.limit) || 10, 20);

    if (query.length < 2) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const suggestions = await searchService.autocomplete(query, limit);

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /search/suggestions
 * Get search suggestions based on popular searches
 */
router.get('/suggestions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = String(req.query.q || '');
    const limit = Math.min(Number(req.query.limit) || 5, 10);

    if (query.length < 2) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const suggestions = await searchService.getSuggestions(query, limit);

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /search/facets
 * Get available filter facets for a search query
 */
router.get('/facets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const options: SearchOptions = {
      query: String(req.query.q || ''),
      filters: parseFilters(req.query),
      page: 1,
      pageSize: 0, // We only want aggregations
    };

    const results = await searchService.searchProducts(options);

    res.json({
      success: true,
      data: {
        categories: results.aggregations?.categories,
        conditions: results.aggregations?.conditions,
        priceRanges: results.aggregations?.price_ranges,
        avgPrice: results.aggregations?.avg_price,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as searchRouter };
