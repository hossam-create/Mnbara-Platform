import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { authenticate } from '../middleware/auth';
import { validateProduct } from '../middleware/validation';

const router = Router();
const productController = new ProductController(
  {} as any // ProductExtractionService would be injected
);

// All product routes require authentication
router.use(authenticate);

// Product extraction and management
router.post('/extract', validateProduct.extractUrl, productController.extractProduct.bind(productController));
router.get('/:id', productController.getProduct.bind(productController));

export default router;
