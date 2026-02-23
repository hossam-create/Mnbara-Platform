import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SmsChannelService {
  private readonly logger = new Logger(SmsChannelService.name);
  private twilioClient: any = null;
  private phoneNumber: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.phoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER') || '';
    this.initializeTwilio();
  }

  private initializeTwilio() {
    try {
      const sid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
      const token = this.configService.get<string>('TWILIO_AUTH_TOKEN');
      if (sid && token) {
        const twilio = require('twilio');
        this.twilioClient = twilio(sid, token);
        this.logger.log('Twilio initialized');
      } else {
        this.logger.warn('Twilio not configured - missing credentials');
      }
    } catch (err) {
      this.logger.warn('Twilio module not available');
    }
  }

  async sendSMS(to: string, message: string, metadata?: any) {
    if (!this.twilioClient) {
      this.logger.warn(`SMS skipped (no provider): ${to}`);
      return null;
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message, from: this.phoneNumber, to,
      });

      const notification = await this.prisma.notification.create({
        data: {
          type: 'SMS', recipient: to, content: message,
          status: 'SENT', provider: 'TWILIO', providerId: result.sid, metadata,
        },
      });

      this.logger.log(`SMS sent to ${to}: ${result.sid}`);
      return notification;
    } catch (error: any) {
      this.logger.error('SMS send error:', error);
      await this.prisma.notification.create({
        data: {
          type: 'SMS', recipient: to, content: message,
          status: 'FAILED', provider: 'TWILIO', error: error.message, metadata,
        },
      });
      throw error;
    }
  }

  async sendOTP(to: string, code: string) {
    return this.sendSMS(to, `Your verification code is: ${code}. Valid for 10 minutes.`, { type: 'OTP', code });
  }

  async getSMSStatus(sid: string) {
    if (!this.twilioClient) return null;
    const message = await this.twilioClient.messages(sid).fetch();
    return { status: message.status, errorCode: message.errorCode, errorMessage: message.errorMessage };
  }
}
