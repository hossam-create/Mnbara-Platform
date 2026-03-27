import { PrismaClient } from '@prisma/client';
import { twilioService } from './twilio.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface PhoneVerificationResult {
  success: boolean;
  verified?: boolean;
  error?: string;
}

export class PhoneVerificationService {
  /**
   * Send phone verification code for seller registration
   * Requirements: SEC-006
   */
  async sendVerificationCode(phoneNumber: string): Promise<PhoneVerificationResult> {
    try {
      logger.info(`Sending phone verification code to ${phoneNumber}`);

      // Validate phone number format
      if (!this.isValidPhoneNumber(phoneNumber)) {
        return {
          success: false,
          error: 'Invalid phone number format',
        };
      }

      // Send OTP
      const otpResult = await twilioService.sendOTP(phoneNumber);

      if (!otpResult.success) {
        return {
          success: false,
          error: 'Failed to send verification code',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      logger.error(`Failed to send phone verification code: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify phone number with code
   * Requirements: SEC-006
   */
  async verifyPhoneNumber(
    phoneNumber: string,
    code: string
  ): Promise<PhoneVerificationResult> {
    try {
      logger.info(`Verifying phone number ${phoneNumber}`);

      // Verify OTP
      const verifyResult = await twilioService.verifyOTP(phoneNumber, code);

      if (!verifyResult.verified) {
        return {
          success: false,
          verified: false,
          error: 'Invalid verification code',
        };
      }

      return {
        success: true,
        verified: true,
      };
    } catch (error) {
      logger.error(`Failed to verify phone number: ${error}`);
      return {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Mark phone as verified for user
   * Requirements: SEC-006
   */
  async markPhoneAsVerified(userId: string, phoneNumber: string): Promise<PhoneVerificationResult> {
    try {
      logger.info(`Marking phone ${phoneNumber} as verified for user ${userId}`);

      await prisma.user.update({
        where: { id: userId },
        data: {
          phoneNumber,
          phoneNumberVerified: true,
          phoneNumberVerifiedAt: new Date(),
        },
      });

      return {
        success: true,
        verified: true,
      };
    } catch (error) {
      logger.error(`Failed to mark phone as verified: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if phone number is already verified
   * Requirements: SEC-006
   */
  async isPhoneVerified(phoneNumber: string): Promise<boolean> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          phoneNumber,
          phoneNumberVerified: true,
        },
      });

      return !!user;
    } catch (error) {
      logger.error(`Failed to check phone verification status: ${error}`);
      return false;
    }
  }

  /**
   * Validate phone number format
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // E.164 format: +[country code][number]
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }
}

export const phoneVerificationService = new PhoneVerificationService();
