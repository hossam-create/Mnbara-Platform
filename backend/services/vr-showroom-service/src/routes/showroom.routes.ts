// Showroom Routes - مسارات صالة العرض

import { Router } from 'express';
import { showroomController } from '../controllers/showroom.controller';

const router = Router();

router.get('/', showroomController.getShowrooms);
router.get('/:showroomId', showroomController.getShowroom);
router.post('/', showroomController.createShowroom);
router.put('/:showroomId', showroomController.updateShowroom);
router.post('/:showroomId/publish', showroomController.publishShowroom);

// Products
router.post('/:showroomId/products', showroomController.addProduct);
router.put('/products/:productId/position', showroomController.updateProductPosition);
router.delete('/products/:productId', showroomController.removeProduct);
router.post('/products/:productId/interact', showroomController.trackInteraction);

// Analytics
router.get('/:showroomId/analytics', showroomController.getAnalytics);
router.get('/dashboard/stats', showroomController.getDashboardStats);

export { router as showroomRoutes };
