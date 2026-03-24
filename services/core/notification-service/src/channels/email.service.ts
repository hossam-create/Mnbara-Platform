import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailChannelService {
  private readonly logger = new Logger(EmailChannelService.name);
  private fromEmail: string;
  private fromName: string;
  private sgMail: any = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.fromEmail = this.configService.get<string>('FROM_EMAIL') || 'noreply@mnbara.com';
    this.fromName = this.configService.get<string>('FROM_NAME') || 'Mnbara';
    this.initializeSendGrid();
  }

  private initializeSendGrid() {
    try {
      const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
      if (apiKey) {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(apiKey);
        this.sgMail = sgMail;
        this.logger.log('SendGrid initialized');
      } else {
        this.logger.warn('SendGrid not configured - missing API key');
      }
    } catch (err) {
      this.logger.warn('SendGrid module not available');
    }
  }

  async sendEmail(to: string, subject: string, html: string, text?: string, metadata?: any) {
    if (!this.sgMail) {
      this.logger.warn(`Email skipped (no provider): ${to} - ${subject}`);
      return null;
    }

    try {
      const msg = { to, from: { email: this.fromEmail, name: this.fromName }, subject, text: text || '', html };
      const result = await this.sgMail.send(msg);

      const notification = await this.prisma.notification.create({
        data: {
          type: 'EMAIL', recipient: to, subject, content: html,
          status: 'SENT', provider: 'SENDGRID',
          providerId: result[0].headers['x-message-id'], metadata,
        },
      });

      this.logger.log(`Email sent to ${to}: ${subject}`);
      return notification;
    } catch (error: any) {
      this.logger.error('Email send error:', error);
      await this.prisma.notification.create({
        data: {
          type: 'EMAIL', recipient: to, subject, content: html,
          status: 'FAILED', provider: 'SENDGRID', error: error.message, metadata,
        },
      });
      throw error;
    }
  }

  async sendBulkEmails(recipients: string[], subject: string, html: string) {
    if (!this.sgMail) return null;
    const messages = recipients.map((to) => ({
      to, from: { email: this.fromEmail, name: this.fromName }, subject, html,
    }));
    return this.sgMail.send(messages);
  }
}
