import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();
const controller = new DashboardController();

router.get('/stats', controller.getStats.bind(controller));
router.get('/component-types', controller.getComponentTypes.bind(controller));
router.get('/analytics', controller.getAnalytics.bind(controller));
router.get('/audit-logs', controller.getAuditLogs.bind(controller));
router.get('/export', controller.exportConfig.bind(controller));
router.post('/import', controller.importConfig.bind(controller));

export default router;
