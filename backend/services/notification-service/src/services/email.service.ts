/**
 * Email Service (SendGrid)
 * Handles email sending via SendGrid with templates
 */

import sgMail from '@sendgrid/mail';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { renderTemplate } from '../utils/template-renderer';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const prisma = new PrismaClient();

export class EmailService {
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@mnbara.com';
    this.fromName = process.env.FROM_NAME || 'Mnbara';
  }

  /**
   * Send email
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
    metadata?: any,
  ) {
    try {
      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject,
        text: text || '',
        html,
      };

      const result = await sgMail.send(msg);

      // Store in database
      const notification = await prisma.notification.create({
        data: {
          type: 'EMAIL',
          recipient: to,
          subject,
          content: html,
          status: 'SENT',
          provider: 'SENDGRID',
          providerId: result[0].headers['x-message-id'],
          metadata,
        },
      });

      logger.info(`Email sent to ${to}: ${subject}`);
      return notification;
    } catch (error: any) {
      logger.error('Email send error:', error);

      // Store failed notification
      await prisma.notification.create({
        data: {
          type: 'EMAIL',
          recipient: to,
          subject,
          content: html,
          status: 'FAILED',
          provider: 'SENDGRID',
          error: error.message,
          metadata,
        },
      });

      throw error;
    }
  }

  /**
   * Send templated email
   */
  async sendTemplatedEmail(
    to: string,
    templateName: string,
    data: any,
    metadata?: any,
  ) {
    const { subject, html, text } = await renderTemplate(templateName, data);
    return await this.sendEmail(to, subject, html, text, metadata);
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to: string, name: string) {
    return await this.sendTemplatedEmail(
      to,
      'welcome',
      { name },
      { type: 'WELCOME' },
    );
  }

  /**
   * Send order confirmation
   */
  async sendOrderConfirmation(to: string, orderId: string, orderDetails: any) {
    return await this.sendTemplatedEmail(
      to,
      'order-confirmation',
      { orderId, ...orderDetails },
      { type: 'ORDER_CONFIRMATION', orderId },
    );
  }

  /**
   * Send password reset
   */
  async sendPasswordReset(to: string, resetLink: string) {
    return await this.sendTemplatedEmail(
      to,
      'password-reset',
      { resetLink },
      { type: 'PASSWORD_RESET' },
    );
  }

  /**
   * Send auction won notification
   */
  async sendAuctionWon(to: string, auctionId: string, auctionDetails: any) {
    return await this.sendTemplatedEmail(
      to,
      'auction-won',
      { auctionId, ...auctionDetails },
      { type: 'AUCTION_WON', auctionId },
    );
  }

  /**
   * Send auction outbid notification
   */
  async sendAuctionOutbid(to: string, auctionId: string, auctionDetails: any) {
    return await this.sendTemplatedEmail(
      to,
      'auction-outbid',
      { auctionId, ...auctionDetails },
      { type: 'AUCTION_OUTBID', auctionId },
    );
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(recipients: string[], subject: string, html: string) {
    try {
      const messages = recipients.map((to) => ({
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject,
        html,
      }));

      const results = await sgMail.send(messages);

      logger.info(`Bulk email sent to ${recipients.length} recipients`);
      return results;
    } catch (error) {
      logger.error('Bulk email error:', error);
      throw error;
    }
  }
}
