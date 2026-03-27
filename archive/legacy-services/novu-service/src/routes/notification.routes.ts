import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';

const router = Router();
const notificationController = new NotificationController();

// Trigger and broadcast
router.post('/trigger', notificationController.triggerNotification.bind(notificationController));
router.post('/broadcast', notificationController.broadcastNotification.bind(notificationController));

// Feed and history
router.get('/:subscriberId/feed', notificationController.getNotificationFeed.bind(notificationController));
router.get('/:subscriberId/history', notificationController.getNotificationHistory.bind(notificationController));

// Mark as read
router.post('/:subscriberId/:messageId/read', notificationController.markAsRead.bind(notificationController));
router.post('/:subscriberId/read-all', notificationController.markAllAsRead.bind(notificationController));

// Unseen count
router.get('/:subscriberId/unseen-count', notificationController.getUnseenCount.bind(notificationController));

// Cancel
router.delete('/:transactionId', notificationController.cancelNotification.bind(notificationController));

export default router;
