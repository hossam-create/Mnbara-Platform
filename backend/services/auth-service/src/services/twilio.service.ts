import twilio from 'twilio';
import { logger } from '../utils/logger';

export interface OTPSendResult {
  success: boolean;
  sid?: string;
  error?: string;
}

export interface OTPVerifyResult {
  success: boolean;
  verified: boolean;
  error?: string;
}

export class TwilioService {
  private client: twilio.Twilio;
  private serviceSid: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID || '';

    if (!accountSid || !authToken || !this.serviceSid) {
      throw new Error('Missing Twilio configuration');
    }

    this.client = twilio(accountSid, authToken);
  }

  /**
   * Send OTP to phone number
   * Requirements: SEC-001
   */
  async sendOTP(phoneNumber: string): Promise<OTPSendResult> {
    try {
      logger.info(`Sending OTP to ${phoneNumber}`);

      const verification = await this.client.verify.v2
        .services(this.serviceSid)
        .verifications.create({
          to: phoneNumber,
          channel: 'sms',
        });

      logger.info(`OTP sent successfully. SID: ${verification.sid}`);

      return {
        success: true,
        sid: verification.sid,
      };
    } catch (error) {
      logger.error(`Failed to send OTP: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify OTP code
   * Requirements: SEC-001
   */
  async verifyOTP(phoneNumber: string, code: string): Promise<OTPVerifyResult> {
    try {
      logger.info(`Verifying OTP for ${phoneNumber}`);

      const verificationCheck = await this.client.verify.v2
        .services(this.serviceSid)
        .verificationChecks.create({
          to: phoneNumber,
          code: code,
        });

      const verified = verificationCheck.status === 'approved';

      logger.info(
        `OTP verification ${verified ? 'successful' : 'failed'} for ${phoneNumber}`
      );

      return {
        success: true,
        verified,
      };
    } catch (error) {
      logger.error(`Failed to verify OTP: ${error}`);
      return {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send SMS message (generic)
   * Requirements: SEC-001
   */
  async sendSMS(phoneNumber: string, message: string): Promise<OTPSendResult> {
    try {
      logger.info(`Sending SMS to ${phoneNumber}`);

      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });

      logger.info(`SMS sent successfully. SID: ${result.sid}`);

      return {
        success: true,
        sid: result.sid,
      };
    } catch (error) {
      logger.error(`Failed to send SMS: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const twilioService = new TwilioService();
