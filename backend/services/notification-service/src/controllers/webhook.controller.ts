/**
 * Webhook Controller
 * Handles incoming webhook events from external services
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { eventWorkerService } from '../services/event-worker.service';

/**
 * Handle FCM delivery receipts
 * POST /webhooks/fcm/delivery
 */
export const handleFCMDelivery = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { messageId, event, timestamp, data } = req.body;

    logger.info(`FCM delivery webhook: ${event} for message ${messageId}`);

    // TODO: Update notification status based on delivery event
    // This would typically update the notification status to DELIVERED, FAILED, etc.

    res.json({ success: true });
  } catch (error) {
    logger.error('Error handling FCM delivery webhook:', error);
    next(error);
  }
};

/**
 * Handle SendGrid email events
 * POST /webhooks/sendgrid/event
 */
export const handleSendGridEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const events = req.body;

    if (Array.isArray(events)) {
      for (const event of events) {
        logger.info(`SendGrid event: ${event.event} for ${event.email}`);
        // Process each event - update email delivery status, track opens/clicks, etc.
      }
    }

    res.json({ success: true, processed: Array.isArray(events) ? events.length : 1 });
  } catch (error) {
    logger.error('Error handling SendGrid webhook:', error);
    next(error);
  }
};

/**
 * Handle Twilio SMS status callbacks
 * POST /webhooks/twilio/sms
 */
export const handleTwilioSMS = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { MessageStatus, MessageSid, To, From } = req.body;

    logger.info(`Twilio SMS callback: ${MessageStatus} for ${MessageSid}`);

    // TODO: Update SMS notification status based on Twilio callback
    // Status values: queued, sending, sent, delivered, failed, undelivered

    res.status(200).send('OK');
  } catch (error) {
    logger.error('Error handling Twilio webhook:', error);
    next(error);
  }
};

/**
 * Generic event webhook handler
 * POST /webhooks/events
 */
export const handleGenericEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { source, event, data, timestamp } = req.body;

    logger.info(`Generic webhook event from ${source}: ${event}`);

    // Route events to appropriate handlers
    switch (source) {
      case 'auction-service':
        await eventWorkerService.publishEvent('mnbara:events:auction', {
          event,
          data,
          source,
        });
        break;
      case 'order-service':
        await eventWorkerService.publishEvent('mnbara:events:order', {
          event,
          data,
          source,
        });
        break;
      case 'payment-service':
        await eventWorkerService.publishEvent('mnbara:events:payment', {
          event,
          data,
          source,
        });
        break;
      case 'chat-service':
        await eventWorkerService.publishEvent('mnbara:events:chat', {
          event,
          data,
          source,
        });
        break;
      default:
        await eventWorkerService.publishEvent('mnbara:events:system', {
          event,
          data,
          source,
        });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error handling generic webhook:', error);
    next(error);
  }
};
