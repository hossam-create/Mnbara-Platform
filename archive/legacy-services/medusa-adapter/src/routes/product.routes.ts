import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';

const router = Router();
const controller = new ProductController();

// Store routes (public)
router.get('/store/products', controller.list.bind(controller));
router.get('/store/products/:id', controller.get.bind(controller));
router.get('/store/products/handle/:handle', controller.getByHandle.bind(controller));

// Admin routes
router.post('/admin/products', controller.create.bind(controller));
router.put('/admin/products/:id', controller.update.bind(controller));
router.delete('/admin/products/:id', controller.delete.bind(controller));
router.post('/admin/products/:id/variants', controller.addVariant.bind(controller));
router.put('/admin/products/variants/:variantId/inventory', controller.updateInventory.bind(controller));

export default router;
