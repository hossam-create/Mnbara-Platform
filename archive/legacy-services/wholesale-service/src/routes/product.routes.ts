// Product Routes - Wholesale B2B
// مسارات المنتجات - البيع بالجملة

import { Router } from 'express';
import { productController } from '../controllers/product.controller';

const router = Router();

// Product CRUD
router.post('/', productController.create.bind(productController));
router.get('/', productController.list.bind(productController));
router.get('/search', productController.search.bind(productController));
router.get('/categories', productController.getCategories.bind(productController));
router.get('/:id', productController.getById.bind(productController));
router.put('/:id', productController.update.bind(productController));
router.delete('/:id', productController.delete.bind(productController));

// Pricing
router.get('/:id/price', productController.getPrice.bind(productController));
router.post('/:id/pricing-tiers', productController.addPricingTier.bind(productController));

// Inventory
router.put('/:id/stock', productController.updateStock.bind(productController));
router.get('/:id/availability', productController.checkAvailability.bind(productController));

export default router;
