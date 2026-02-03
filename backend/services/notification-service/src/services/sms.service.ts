/**
 * SMS Service (Twilio)
 * Handles SMS sending via Twilio
 */

import twilio from 'twilio';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

const prisma = new PrismaClient();

export class SMSService {
  /**
   * Send SMS
   */
  async sendSMS(to: string, message: string, metadata?: any) {
    try {
      // Send via Twilio
      const result = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      });

      // Store in database
      const notification = await prisma.notification.create({
        data: {
          type: 'SMS',
          recipient: to,
          content: message,
          status: 'SENT',
          provider: 'TWILIO',
          providerId: result.sid,
          metadata,
        },
      });

      logger.info(`SMS sent to ${to}: ${result.sid}`);
      return notification;
    } catch (error: any) {
      logger.error('SMS send error:', error);

      // Store failed notification
      await prisma.notification.create({
        data: {
          type: 'SMS',
          recipient: to,
          content: message,
          status: 'FAILED',
          provider: 'TWILIO',
          error: error.message,
          metadata,
        },
      });

      throw error;
    }
  }

  /**
   * Send OTP
   */
  async sendOTP(to: string, code: string) {
    const message = `Your verification code is: ${code}. Valid for 10 minutes.`;
    return await this.sendSMS(to, message, { type: 'OTP', code });
  }

  /**
   * Send order notification
   */
  async sendOrderNotification(to: string, orderId: string, status: string) {
    const message = `Order #${orderId} status: ${status}`;
    return await this.sendSMS(to, message, { type: 'ORDER', orderId, status });
  }

  /**
   * Send auction notification
   */
  async sendAuctionNotification(to: string, auctionId: string, message: string) {
    return await this.sendSMS(to, message, { type: 'AUCTION', auctionId });
  }

  /**
   * Get SMS status
   */
  async getSMSStatus(sid: string) {
    try {
      const message = await client.messages(sid).fetch();
      return {
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
      };
    } catch (error) {
      logger.error('Get SMS status error:', error);
      throw error;
    }
  }
}
