import { PrismaClient } from '@prisma/client';
import { twilioService } from './twilio.service';
import { logger } from '../utils/logger';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

const prisma = new PrismaClient();

export interface TwoFactorSetupResult {
  success: boolean;
  secret?: string;
  qrCode?: string;
  backupCodes?: string[];
  error?: string;
}

export interface TwoFactorVerifyResult {
  success: boolean;
  verified: boolean;
  error?: string;
}

export class TwoFactorAuthService {
  /**
   * Enable SMS-based 2FA for user
   * Requirements: SEC-002
   */
  async enableSMS2FA(userId: string, phoneNumber: string): Promise<TwoFactorSetupResult> {
    try {
      logger.info(`Enabling SMS 2FA for user ${userId}`);

      // Send verification code
      const otpResult = await twilioService.sendOTP(phoneNumber);

      if (!otpResult.success) {
        return {
          success: false,
          error: 'Failed to send verification code',
        };
      }

      // Update user with pending 2FA
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorMethod: 'SMS',
          twoFactorPhoneNumber: phoneNumber,
          twoFactorEnabled: false, // Not enabled until verified
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      logger.error(`Failed to enable SMS 2FA: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify SMS 2FA setup
   * Requirements: SEC-002
   */
  async verifySMS2FA(userId: string, code: string): Promise<TwoFactorVerifyResult> {
    try {
      logger.info(`Verifying SMS 2FA for user ${userId}`);

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.twoFactorPhoneNumber) {
        return {
          success: false,
          verified: false,
          error: 'User not found or phone number not set',
        };
      }

      // Verify OTP
      const verifyResult = await twilioService.verifyOTP(
        user.twoFactorPhoneNumber,
        code
      );

      if (!verifyResult.verified) {
        return {
          success: false,
          verified: false,
          error: 'Invalid verification code',
        };
      }

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Enable 2FA
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
          twoFactorBackupCodes: backupCodes,
        },
      });

      logger.info(`SMS 2FA enabled for user ${userId}`);

      return {
        success: true,
        verified: true,
      };
    } catch (error) {
      logger.error(`Failed to verify SMS 2FA: ${error}`);
      return {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Enable TOTP (authenticator app) 2FA
   * Requirements: SEC-003
   */
  async enableTOTP2FA(userId: string): Promise<TwoFactorSetupResult> {
    try {
      logger.info(`Enabling TOTP 2FA for user ${userId}`);

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `MNBARA (${user.email})`,
        issuer: 'MNBARA',
        length: 32,
      });

      // Generate QR code
      const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Store secret temporarily (not enabled until verified)
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorSecret: secret.base32,
          twoFactorMethod: 'TOTP',
        },
      });

      return {
        success: true,
        secret: secret.base32,
        qrCode,
        backupCodes,
      };
    } catch (error) {
      logger.error(`Failed to enable TOTP 2FA: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify TOTP code
   * Requirements: SEC-003
   */
  async verifyTOTP(userId: string, code: string): Promise<TwoFactorVerifyResult> {
    try {
      logger.info(`Verifying TOTP for user ${userId}`);

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.twoFactorSecret) {
        return {
          success: false,
          verified: false,
          error: 'User not found or TOTP not configured',
        };
      }

      // Verify token
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: code,
        window: 2, // Allow 2 time windows (±30 seconds)
      });

      if (!verified) {
        return {
          success: false,
          verified: false,
          error: 'Invalid TOTP code',
        };
      }

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Enable 2FA
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
          twoFactorBackupCodes: backupCodes,
        },
      });

      logger.info(`TOTP 2FA enabled for user ${userId}`);

      return {
        success: true,
        verified: true,
      };
    } catch (error) {
      logger.error(`Failed to verify TOTP: ${error}`);
      return {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify 2FA during login
   * Requirements: SEC-002, SEC-003
   */
  async verify2FA(userId: string, code: string): Promise<TwoFactorVerifyResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.twoFactorEnabled) {
        return {
          success: false,
          verified: false,
          error: '2FA not enabled',
        };
      }

      // Check backup codes first
      if (user.twoFactorBackupCodes?.includes(code)) {
        // Remove used backup code
        const updatedCodes = user.twoFactorBackupCodes.filter((c) => c !== code);
        await prisma.user.update({
          where: { id: userId },
          data: { twoFactorBackupCodes: updatedCodes },
        });

        return {
          success: true,
          verified: true,
        };
      }

      // Verify based on method
      if (user.twoFactorMethod === 'SMS') {
        return await twilioService.verifyOTP(user.twoFactorPhoneNumber || '', code);
      } else if (user.twoFactorMethod === 'TOTP') {
        const verified = speakeasy.totp.verify({
          secret: user.twoFactorSecret || '',
          encoding: 'base32',
          token: code,
          window: 2,
        });

        return {
          success: true,
          verified,
        };
      }

      return {
        success: false,
        verified: false,
        error: 'Unknown 2FA method',
      };
    } catch (error) {
      logger.error(`Failed to verify 2FA: ${error}`);
      return {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Disable 2FA
   * Requirements: SEC-002, SEC-003
   */
  async disable2FA(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info(`Disabling 2FA for user ${userId}`);

      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorMethod: null,
          twoFactorSecret: null,
          twoFactorPhoneNumber: null,
          twoFactorBackupCodes: [],
        },
      });

      return { success: true };
    } catch (error) {
      logger.error(`Failed to disable 2FA: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate backup codes
   * Requirements: SEC-009
   */
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}

export const twoFactorAuthService = new TwoFactorAuthService();
