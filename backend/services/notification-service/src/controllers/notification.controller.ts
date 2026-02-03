/**
 * Notification Controller
 */

import { Request, Response } from 'express';
import { EmailService } from '../services/email.service';
import { SMSService } from '../services/sms.service';
import { logger } from '../utils/logger';

const emailService = new EmailService();
const smsService = new SMSService();

export class NotificationController {
  /**
   * POST /notifications/email
   * Send email
   */
  async sendEmail(req: Request, res: Response) {
    try {
      const { to, subject, html, text, metadata } = req.body;

      const notification = await emailService.sendEmail(
        to,
        subject,
        html,
        text,
        metadata,
      );

      res.json({
        success: true,
        data: notification,
      });
    } catch (error: any) {
      logger.error('Send email error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /notifications/email/template
   * Send templated email
   */
  async sendTemplatedEmail(req: Request, res: Response) {
    try {
      const { to, template, data, metadata } = req.body;

      const notification = await emailService.sendTemplatedEmail(
        to,
        template,
        data,
        metadata,
      );

      res.json({
        success: true,
        data: notification,
      });
    } catch (error: any) {
      logger.error('Send templated email error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /notifications/sms
   * Send SMS
   */
  async sendSMS(req: Request, res: Response) {
    try {
      const { to, message, metadata } = req.body;

      const notification = await smsService.sendSMS(to, message, metadata);

      res.json({
        success: true,
        data: notification,
      });
    } catch (error: any) {
      logger.error('Send SMS error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /notifications/otp
   * Send OTP
   */
  async sendOTP(req: Request, res: Response) {
    try {
      const { to, code } = req.body;

      const notification = await smsService.sendOTP(to, code);

      res.json({
        success: true,
        data: notification,
      });
    } catch (error: any) {
      logger.error('Send OTP error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /notifications/welcome
   * Send welcome email
   */
  async sendWelcome(req: Request, res: Response) {
    try {
      const { to, name } = req.body;

      const notification = await emailService.sendWelcomeEmail(to, name);

      res.json({
        success: true,
        data: notification,
      });
    } catch (error: any) {
      logger.error('Send welcome error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /notifications/order-confirmation
   * Send order confirmation
   */
  async sendOrderConfirmation(req: Request, res: Response) {
    try {
      const { to, orderId, orderDetails } = req.body;

      const notification = await emailService.sendOrderConfirmation(
        to,
        orderId,
        orderDetails,
      );

      res.json({
        success: true,
        data: notification,
      });
    } catch (error: any) {
      logger.error('Send order confirmation error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /notifications/sms/:sid/status
   * Get SMS status
   */
  async getSMSStatus(req: Request, res: Response) {
    try {
      const { sid } = req.params;

      const status = await smsService.getSMSStatus(sid);

      res.json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      logger.error('Get SMS status error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}
