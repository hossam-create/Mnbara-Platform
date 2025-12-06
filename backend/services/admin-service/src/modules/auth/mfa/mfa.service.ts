import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

@Injectable()
export class MfaService {
  constructor(private db: DatabaseService) {}

  async generateSecret(userId: number, email: string) {
    const secret = speakeasy.generateSecret({
      name: `Mnbara Admin (${email})`,
    });

    const otpauthUrl = secret.otpauth_url;
    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);

    // Store secret temporarily or update existing record (but don't enable yet)
    // We'll store it in user_mfa table but with enabled=false
    const existingMfa = await this.db.findOne('user_mfa', { user_id: userId });

    if (existingMfa) {
      await this.db.update(
        'user_mfa',
        { user_id: userId },
        {
          secret: secret.base32,
          enabled: false, // Not enabled until verified
          updated_at: new Date(),
        },
      );
    } else {
      await this.db.insert('user_mfa', {
        user_id: userId,
        secret: secret.base32,
        enabled: false,
        created_at: new Date(),
      });
    }

    return {
      secret: secret.base32,
      qrCodeUrl,
    };
  }

  async verifyAndEnable(userId: number, token: string) {
    const mfaRecord = await this.db.findOne('user_mfa', { user_id: userId });

    if (!mfaRecord || !mfaRecord.secret) {
      throw new BadRequestException('MFA setup not initiated');
    }

    const verified = speakeasy.totp.verify({
      secret: mfaRecord.secret,
      encoding: 'base32',
      token: token,
    });

    if (!verified) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    // In a real app, you should hash these backup codes before storing
    // For simplicity here, we store them as is (but array of strings)

    await this.db.update(
      'user_mfa',
      { user_id: userId },
      {
        enabled: true,
        backup_codes: backupCodes,
        last_used_at: new Date(),
        updated_at: new Date(),
      },
    );

    return {
      success: true,
      backupCodes,
    };
  }

  async validateToken(userId: number, token: string): Promise<boolean> {
    const mfaRecord = await this.db.findOne('user_mfa', { user_id: userId });

    if (!mfaRecord || !mfaRecord.enabled) {
      return true; // MFA not enabled, so technically valid (or handled by caller)
    }

    const verified = speakeasy.totp.verify({
      secret: mfaRecord.secret,
      encoding: 'base32',
      token: token,
    });

    if (verified) {
      await this.db.update(
        'user_mfa',
        { user_id: userId },
        { last_used_at: new Date() },
      );
      return true;
    }

    return false;
  }

  async disableMfa(userId: number, token: string) {
    const isValid = await this.validateToken(userId, token);
    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    await this.db.update(
      'user_mfa',
      { user_id: userId },
      {
        enabled: false,
        secret: null,
        backup_codes: null,
        updated_at: new Date(),
      },
    );

    return { success: true, message: 'MFA disabled' };
  }

  private generateBackupCodes(count = 10): string[] {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(speakeasy.generateSecret({ length: 10 }).base32.slice(0, 10));
    }
    return codes;
  }
}
