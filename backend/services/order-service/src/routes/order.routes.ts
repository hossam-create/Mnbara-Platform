import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';

const router = Router();

// Public/User routes (Protected by Gateway/Auth)
router.post('/', OrderController.create);
router.get('/', OrderController.getMyOrders);
router.get('/:id', OrderController.getOne);

// Admin/System routes
router.put('/:id/status', OrderController.updateStatus);

export default router;
