import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';

const router = Router();
const notificationController = new NotificationController();

// Send Email
router.post('/email', notificationController.sendEmail);

// Send Push Notification
router.post('/push', notificationController.sendPush);

// Send SMS
router.post('/sms', notificationController.sendSMS);

// Get user notifications
router.get('/user/:userId', notificationController.getUserNotifications);

export default router;
