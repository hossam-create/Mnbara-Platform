import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';

const router = Router();
const controller = new NotificationController();

// Device management
router.post('/devices/register', controller.registerDevice.bind(controller));
router.post('/devices/unregister', controller.unregisterDevice.bind(controller));

// Send notifications
router.post('/send', controller.sendNotification.bind(controller));
router.post('/send/bulk', controller.sendBulkNotification.bind(controller));
router.post('/send/topic', controller.sendToTopic.bind(controller));
router.post('/send/segment', controller.sendToSegment.bind(controller));

// History and stats
router.get('/history/:userId', controller.getHistory.bind(controller));
router.get('/stats/:userId', controller.getStats.bind(controller));

export default router;
