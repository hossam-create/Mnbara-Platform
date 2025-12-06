import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class TwoFactorAuthService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Generate 2FA secret for user
   */
  async generateSecret(userId: number, email: string): Promise<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  }> {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Mnbara (${email})`,
      issuer: 'Mnbara Platform',
      length: 32,
    });

    // Generate backup codes
    const backupCodes = this.generateBackupCodes(8);

    // Store secret in database
    await this.db.upsert(
      'user_2fa',
      { user_id: userId },
      {
        user_id: userId,
        secret: secret.base32,
        backup_codes: JSON.stringify(backupCodes),
        enabled: false,
        created_at: new Date(),
      }
    );

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode,
      backupCodes,
    };
  }

  /**
   * Verify 2FA token
   */
  async verifyToken(userId: number, token: string): Promise<boolean> {
    const user2fa = await this.db.findOne('user_2fa', { user_id: userId });

    if (!user2fa || !user2fa.enabled) {
      return false;
    }

    // Verify TOTP token
    const isValid = speakeasy.totp.verify({
      secret: user2fa.secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after
    });

    return isValid;
  }

  /**
   * Enable 2FA for user
   */
  async enable2FA(userId: number, token: string): Promise<boolean> {
    const user2fa = await this.db.findOne('user_2fa', { user_id: userId });

    if (!user2fa) {
      return false;
    }

    // Verify token before enabling
    const isValid = speakeasy.totp.verify({
      secret: user2fa.secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!isValid) {
      return false;
    }

    // Enable 2FA
    await this.db.update(
      'user_2fa',
      { user_id: userId },
      {
        enabled: true,
        enabled_at: new Date(),
      }
    );

    return true;
  }

  /**
   * Disable 2FA for user
   */
  async disable2FA(userId: number, token: string): Promise<boolean> {
    const isValid = await this.verifyToken(userId, token);

    if (!isValid) {
      return false;
    }

    await this.db.update(
      'user_2fa',
      { user_id: userId },
      { enabled: false }
    );

    return true;
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId: number, backupCode: string): Promise<boolean> {
    const user2fa = await this.db.findOne('user_2fa', { user_id: userId });

    if (!user2fa || !user2fa.enabled) {
      return false;
    }

    const backupCodes = JSON.parse(user2fa.backup_codes || '[]');
    const index = backupCodes.indexOf(backupCode);

    if (index === -1) {
      return false;
    }

    // Remove used backup code
    backupCodes.splice(index, 1);

    await this.db.update(
      'user_2fa',
      { user_id: userId },
      { backup_codes: JSON.stringify(backupCodes) }
    );

    return true;
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: number, token: string): Promise<string[]> {
    const isValid = await this.verifyToken(userId, token);

    if (!isValid) {
      throw new Error('Invalid 2FA token');
    }

    const backupCodes = this.generateBackupCodes(8);

    await this.db.update(
      'user_2fa',
      { user_id: userId },
      { backup_codes: JSON.stringify(backupCodes) }
    );

    return backupCodes;
  }

  /**
   * Check if 2FA is enabled for user
   */
  async is2FAEnabled(userId: number): Promise<boolean> {
    const user2fa = await this.db.findOne('user_2fa', { user_id: userId });
    return user2fa?.enabled || false;
  }

  /**
   * Generate random backup codes
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}
