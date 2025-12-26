// Alert Routes - مسارات التنبيهات

import { Router } from 'express';
import { alertController } from '../controllers/alert.controller';

const router = Router();

router.get('/', alertController.getAlerts);
router.get('/:alertId', alertController.getAlert);
router.post('/:alertId/acknowledge', alertController.acknowledgeAlert);
router.post('/:alertId/dismiss', alertController.dismissAlert);

export { router as alertRoutes };
