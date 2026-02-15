import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';

const router = Router();
const controller = new OrderController();

// Store routes
router.get('/store/orders/:id', controller.get.bind(controller));

// Admin routes
router.get('/admin/orders', controller.list.bind(controller));
router.get('/admin/orders/:id', controller.get.bind(controller));
router.put('/admin/orders/:id/status', controller.updateStatus.bind(controller));
router.put('/admin/orders/:id/fulfillment', controller.updateFulfillment.bind(controller));
router.put('/admin/orders/:id/payment', controller.updatePayment.bind(controller));
router.post('/admin/orders/:id/cancel', controller.cancel.bind(controller));
router.get('/admin/orders/:id/total', controller.getTotal.bind(controller));

export default router;
