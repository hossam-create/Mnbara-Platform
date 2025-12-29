import { Router } from 'express';
import { CartController } from '../controllers/cart.controller';

const router = Router();
const cartController = new CartController();

router.get('/cart', cartController.getCart.bind(cartController));
router.post('/cart/items', cartController.addToCart.bind(cartController));
router.delete('/cart/items/:productId', cartController.removeFromCart.bind(cartController));
router.put('/cart/items/:productId', cartController.updateQuantity.bind(cartController));
router.delete('/cart', cartController.clearCart.bind(cartController));

export default router;
