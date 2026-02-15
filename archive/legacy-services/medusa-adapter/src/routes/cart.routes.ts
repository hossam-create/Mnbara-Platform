import { Router } from 'express';
import { CartController } from '../controllers/cart.controller';

const router = Router();
const controller = new CartController();

router.post('/store/carts', controller.create.bind(controller));
router.get('/store/carts/:id', controller.get.bind(controller));
router.post('/store/carts/:id/line-items', controller.addItem.bind(controller));
router.put('/store/carts/:id/line-items/:itemId', controller.updateItem.bind(controller));
router.delete('/store/carts/:id/line-items/:itemId', controller.removeItem.bind(controller));
router.delete('/store/carts/:id', controller.clear.bind(controller));
router.get('/store/carts/:id/total', controller.getTotal.bind(controller));
router.post('/store/carts/:id/complete', controller.complete.bind(controller));

export default router;
