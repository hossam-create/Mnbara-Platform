import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';

const router = Router();
const productController = new ProductController();

router.get('/products', productController.getProducts.bind(productController));
router.get('/products/:id', productController.getProductById.bind(productController));
router.post('/products', productController.createProduct.bind(productController));
router.put('/products/:id', productController.updateProduct.bind(productController));
router.delete('/products/:id', productController.deleteProduct.bind(productController));
router.get('/search', productController.searchProducts.bind(productController));
router.get('/products/category/:category', productController.getProductsByCategory.bind(productController));

export default router;
