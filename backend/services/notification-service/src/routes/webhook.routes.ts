/**
 * Webhook Routes
 * Endpoints for receiving webhook events from external services
 */

import { Router } from 'express';
import {
  handleFCMDelivery,
  handleSendGridEvent,
  handleTwilioSMS,
  handleGenericEvent,
} from '../controllers/webhook.controller';

const router = Router();

/**
 * @route POST /webhooks/fcm/delivery
 * @description Handle FCM delivery receipts
 */
router.post('/fcm/delivery', handleFCMDelivery);

/**
 * @route POST /webhooks/sendgrid/event
 * @description Handle SendGrid email events (opens, clicks, etc.)
 */
router.post('/sendgrid/event', handleSendGridEvent);

/**
 * @route POST /webhooks/twilio/sms
 * @description Handle Twilio SMS status callbacks
 */
router.post('/twilio/sms', handleTwilioSMS);

/**
 * @route POST /webhooks/events
 * @description Generic event webhook for internal services
 */
router.post('/events', handleGenericEvent);

export default router;
