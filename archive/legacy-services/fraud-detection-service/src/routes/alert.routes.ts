// Alert Routes - مسارات التنبيهات

import { Router } from 'express';
import { alertController } from '../controllers/alert.controller';

const router = Router();

// Alert Management
router.get('/', alertController.getAlerts);
router.get('/:alertId', alertController.getAlert);
router.put('/:alertId/review', alertController.reviewAlert);
router.post('/:alertId/escalate', alertController.escalateAlert);

// Bulk Operations
router.post('/bulk-review', alertController.bulkReviewAlerts);

export { router as alertRoutes };
