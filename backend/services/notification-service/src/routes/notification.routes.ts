/**
 * Notification Routes
 */

import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';

const router = Router();
const controller = new NotificationController();

// Email
router.post('/email', controller.sendEmail.bind(controller));
router.post('/email/template', controller.sendTemplatedEmail.bind(controller));

// SMS
router.post('/sms', controller.sendSMS.bind(controller));
router.post('/otp', controller.sendOTP.bind(controller));
router.get('/sms/:sid/status', controller.getSMSStatus.bind(controller));

// Convenience endpoints
router.post('/welcome', controller.sendWelcome.bind(controller));
router.post('/order-confirmation', controller.sendOrderConfirmation.bind(controller));

export default router;
