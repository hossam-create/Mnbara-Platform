import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';

const router = Router();
const controller = new ProductController();

router.post('/:sellerId/products', controller.create);
router.get('/:sellerId/products', controller.list);
router.get('/:sellerId/products/:productId', controller.get);
router.put('/:sellerId/products/:productId', controller.update);
router.delete('/:sellerId/products/:productId', controller.delete);
router.post('/:sellerId/products/:productId/publish', controller.publish);
router.post('/:sellerId/products/bulk-update', controller.bulkUpdateStatus);

export default router;
