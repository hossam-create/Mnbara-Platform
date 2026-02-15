import { Request, Response } from 'express';
import { SearchService } from '../services/search.service';
import { logger } from '../utils/logger';

const searchService = new SearchService();

export class SearchController {
  // Search products
  static async searchProducts(req: Request, res: Response) {
    try {
      const { q, category, minPrice, maxPrice, inStock, sellerId, sort, limit, offset } = req.query;

      const filters: any = {};
      if (category) filters.category = category as string;
      if (minPrice) filters.minPrice = parseFloat(minPrice as string);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
      if (inStock !== undefined) filters.inStock = inStock === 'true';
      if (sellerId) filters.sellerId = sellerId as string;

      const results = await searchService.searchProducts(
        (q as string) || '',
        filters,
        {
          limit: limit ? parseInt(limit as string) : 20,
          offset: offset ? parseInt(offset as string) : 0,
          sort: sort ? (sort as string).split(',') : undefined
        }
      );

      res.json(results);
    } catch (error) {
      logger.error('Search products error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  }

  // Search auctions
  static async searchAuctions(req: Request, res: Response) {
    try {
      const { q, category, status, minBid, maxBid, sort, limit, offset } = req.query;

      const filters: any = {};
      if (category) filters.category = category as string;
      if (status) filters.status = status as string;
      if (minBid) filters.minBid = parseFloat(minBid as string);
      if (maxBid) filters.maxBid = parseFloat(maxBid as string);

      const results = await searchService.searchAuctions(
        (q as string) || '',
        filters,
        {
          limit: limit ? parseInt(limit as string) : 20,
          offset: offset ? parseInt(offset as string) : 0,
          sort: sort ? (sort as string).split(',') : undefined
        }
      );

      res.json(results);
    } catch (error) {
      logger.error('Search auctions error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  }

  // Get suggestions (autocomplete)
  static async getSuggestions(req: Request, res: Response) {
    try {
      const { q, type } = req.query;

      if (!q) {
        return res.status(400).json({ error: 'Query parameter required' });
      }

      const suggestions = await searchService.getSuggestions(
        q as string,
        (type as 'products' | 'auctions') || 'products'
      );

      res.json({ suggestions });
    } catch (error) {
      logger.error('Get suggestions error:', error);
      res.status(500).json({ error: 'Failed to get suggestions' });
    }
  }

  // Get facets (for filters UI)
  static async getFacets(req: Request, res: Response) {
    try {
      const { type } = req.query;

      const facets = await searchService.getFacets(
        (type as 'products' | 'auctions') || 'products'
      );

      res.json({ facets });
    } catch (error) {
      logger.error('Get facets error:', error);
      res.status(500).json({ error: 'Failed to get facets' });
    }
  }

  // Index product (webhook from product service)
  static async indexProduct(req: Request, res: Response) {
    try {
      const product = req.body;

      await searchService.indexProduct(product);

      res.json({ success: true, message: 'Product indexed' });
    } catch (error) {
      logger.error('Index product error:', error);
      res.status(500).json({ error: 'Failed to index product' });
    }
  }

  // Update product
  static async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      await searchService.updateProduct(id, updates);

      res.json({ success: true, message: 'Product updated' });
    } catch (error) {
      logger.error('Update product error:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  }

  // Delete product
  static async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await searchService.deleteProduct(id);

      res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
      logger.error('Delete product error:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  }

  // Bulk index products
  static async bulkIndexProducts(req: Request, res: Response) {
    try {
      const { products } = req.body;

      if (!Array.isArray(products)) {
        return res.status(400).json({ error: 'Products must be an array' });
      }

      await searchService.indexProducts(products);

      res.json({ success: true, message: `${products.length} products indexed` });
    } catch (error) {
      logger.error('Bulk index products error:', error);
      res.status(500).json({ error: 'Failed to bulk index products' });
    }
  }

  // Bulk index auctions
  static async bulkIndexAuctions(req: Request, res: Response) {
    try {
      const { auctions } = req.body;

      if (!Array.isArray(auctions)) {
        return res.status(400).json({ error: 'Auctions must be an array' });
      }

      await searchService.indexAuctions(auctions);

      res.json({ success: true, message: `${auctions.length} auctions indexed` });
    } catch (error) {
      logger.error('Bulk index auctions error:', error);
      res.status(500).json({ error: 'Failed to bulk index auctions' });
    }
  }

  // Get stats
  static async getStats(req: Request, res: Response) {
    try {
      const { type } = req.query;

      const stats = await searchService.getStats(
        (type as 'products' | 'auctions') || 'products'
      );

      res.json({ stats });
    } catch (error) {
      logger.error('Get stats error:', error);
      res.status(500).json({ error: 'Failed to get stats' });
    }
  }

  // Clear index (admin only)
  static async clearIndex(req: Request, res: Response) {
    try {
      const { type } = req.params;

      if (type !== 'products' && type !== 'auctions') {
        return res.status(400).json({ error: 'Invalid type' });
      }

      await searchService.clearIndex(type);

      res.json({ success: true, message: `${type} index cleared` });
    } catch (error) {
      logger.error('Clear index error:', error);
      res.status(500).json({ error: 'Failed to clear index' });
    }
  }
}
