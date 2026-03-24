/**
 * Notification Service
 * Integrates Twilio, SendGrid, Firebase, Vonage
 */

import { BaseApiClient } from './base-client';
import { config } from './config';
import { ApiResponse, SmsMessage, EmailMessage, PushNotification } from './types';

export class SmsService extends BaseApiClient {
  private provider: 'twilio' | 'vonage';

  constructor(provider: 'twilio' | 'vonage' = 'twilio') {
    const providerConfig = config.getServiceConfig(provider);
    
    if (!providerConfig) {
      throw new Error(`SMS provider ${provider} not configured`);
    }

    super(`sms-${provider}`, providerConfig);
    this.provider = provider;
  }

  async sendSms(message: SmsMessage): Promise<ApiResponse<any>> {
    switch (this.provider) {
      case 'twilio':
        return this.sendTwilioSms(message);
      case 'vonage':
        return this.sendVonageSms(message);
      default:
        throw new Error(`SMS not supported for ${this.provider}`);
    }
  }

  private async sendTwilioSms(message: SmsMessage): Promise<ApiResponse<any>> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const from = message.from || process.env.TWILIO_PHONE_NUMBER;

    return this.post<any>(
      `/Accounts/${accountSid}/Messages.json`,
      {
        To: message.to,
        From: from,
        Body: message.body,
      }
    );
  }

  private async sendVonageSms(message: SmsMessage): Promise<ApiResponse<any>> {
    const from = message.from || 'Mnbara';

    return this.post<any>('/sms/json', {
      api_key: this.config.apiKey,
      api_secret: process.env.VONAGE_API_SECRET,
      to: message.to,
      from,
      text: message.body,
    });
  }
}

export class EmailService extends BaseApiClient {
  constructor() {
    const emailConfig = config.getServiceConfig('sendgrid');
    
    if (!emailConfig) {
      throw new Error('Email service not configured');
    }

    super('email', emailConfig);
  }

  async sendEmail(message: EmailMessage): Promise<ApiResponse<any>> {
    const from = message.from || process.env.SENDGRID_FROM_EMAIL || 'noreply@mnbara.com';

    const data = {
      personalizations: [{
        to: Array.isArray(message.to) 
          ? message.to.map(email => ({ email }))
          : [{ email: message.to }],
        subject: message.subject,
      }],
      from: { email: from },
      content: [
        {
          type: message.html ? 'text/html' : 'text/plain',
          value: message.html || message.body,
        },
      ],
    };

    if (message.attachments && message.attachments.length > 0) {
      (data as any).attachments = message.attachments.map(att => ({
        filename: att.filename,
        content: Buffer.isBuffer(att.content) 
          ? att.content.toString('base64')
          : att.content,
        type: att.contentType || 'application/octet-stream',
      }));
    }

    return this.post<any>('/mail/send', data);
  }

  async sendBulkEmail(messages: EmailMessage[]): Promise<ApiResponse<any[]>> {
    const results = await Promise.all(
      messages.map(msg => this.sendEmail(msg))
    );

    const allSuccess = results.every(r => r.success);

    return {
      success: allSuccess,
      data: results,
      timestamp: new Date(),
    };
  }
}

export class PushNotificationService extends BaseApiClient {
  constructor() {
    const firebaseConfig = config.getServiceConfig('firebase');
    
    if (!firebaseConfig) {
      throw new Error('Push notification service not configured');
    }

    super('push', firebaseConfig);
  }

  async sendPushNotification(notification: PushNotification): Promise<ApiResponse<any>> {
    const tokens = Array.isArray(notification.token) 
      ? notification.token 
      : [notification.token];

    const data = {
      registration_ids: tokens,
      notification: {
        title: notification.title,
        body: notification.body,
        image: notification.imageUrl,
      },
      data: notification.data || {},
    };

    return this.post<any>('/send', data);
  }

  async sendToTopic(topic: string, notification: Omit<PushNotification, 'token'>): Promise<ApiResponse<any>> {
    const data = {
      to: `/topics/${topic}`,
      notification: {
        title: notification.title,
        body: notification.body,
        image: notification.imageUrl,
      },
      data: notification.data || {},
    };

    return this.post<any>('/send', data);
  }
}
