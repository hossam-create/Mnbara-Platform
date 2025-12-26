// Order Routes - Wholesale B2B
// مسارات الطلبات - البيع بالجملة

import { Router } from 'express';
import { orderController } from '../controllers/order.controller';

const router = Router();

// Order CRUD
router.post('/', orderController.create.bind(orderController));
router.get('/', orderController.list.bind(orderController));
router.get('/number/:orderNumber', orderController.getByNumber.bind(orderController));
router.get('/:id', orderController.getById.bind(orderController));

// Status updates
router.put('/:id/status', orderController.updateStatus.bind(orderController));
router.put('/:id/payment', orderController.updatePaymentStatus.bind(orderController));
router.put('/:id/tracking', orderController.addTracking.bind(orderController));

// Analytics
router.get('/supplier/:supplierId/stats', orderController.getSupplierStats.bind(orderController));
router.get('/buyer/:buyerId/history', orderController.getBuyerHistory.bind(orderController));

export default router;
