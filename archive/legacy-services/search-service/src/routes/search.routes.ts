import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';

const router = Router();

// Search endpoints
router.get('/products', SearchController.searchProducts);
router.get('/auctions', SearchController.searchAuctions);
router.get('/suggestions', SearchController.getSuggestions);
router.get('/facets', SearchController.getFacets);
router.get('/stats', SearchController.getStats);

// Index management (webhooks from other services)
router.post('/products', SearchController.indexProduct);
router.put('/products/:id', SearchController.updateProduct);
router.delete('/products/:id', SearchController.deleteProduct);
router.post('/products/bulk', SearchController.bulkIndexProducts);
router.post('/auctions/bulk', SearchController.bulkIndexAuctions);

// Admin endpoints
router.delete('/admin/clear/:type', SearchController.clearIndex);

export default router;
