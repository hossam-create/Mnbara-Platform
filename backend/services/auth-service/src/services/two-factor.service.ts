import { PrismaClient } from '@prisma/client';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface TwoFactorSetupResult {
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
}

export interface TwoFactorEnableResult {
    success: boolean;
    backupCodes: string[];
}

export class TwoFactorService {
    /**
     * Generate a new TOTP secret for a user
     */
    async generateSecret(userId: number, email: string): Promise<TwoFactorSetupResult> {
        // Generate TOTP secret
        const secret = speakeasy.generateSecret({
            name: `MNBARA (${email})`,
            issuer: 'MNBARA',
            length: 32,
        });

        // Generate backup recovery codes (10 codes)
        const backupCodes = this.generateBackupCodes(10);

        // Hash backup codes before storing
        const hashedBackupCodes = await Promise.all(
            backupCodes.map(code => bcrypt.hash(code, 10))
        );

        // Store or update the 2FA record (not enabled yet)
        await prisma.userTwoFactor.upsert({
            where: { userId },
            create: {
                userId,
                secret: secret.base32,
                enabled: false,
                backupCodes: JSON.stringify(hashedBackupCodes),
            },
            update: {
                secret: secret.base32,
                backupCodes: JSON.stringify(hashedBackupCodes),
                enabled: false,
            },
        });

        // Generate QR code URL
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

        return {
            secret: secret.base32!,
            qrCodeUrl,
            backupCodes, // Return plain codes only once
        };
    }

    /**
     * Verify TOTP token and enable 2FA
     */
    async verifyAndEnable(userId: number, token: string): Promise<TwoFactorEnableResult> {
        const twoFactor = await prisma.userTwoFactor.findUnique({
            where: { userId },
        });

        if (!twoFactor || !twoFactor.secret) {
            throw new Error('2FA setup not initiated. Please generate a secret first.');
        }

        if (twoFactor.enabled) {
            throw new Error('2FA is already enabled for this account.');
        }

        // Verify the token
        const isValid = speakeasy.totp.verify({
            secret: twoFactor.secret,
            encoding: 'base32',
            token,
            window: 2, // Allow 2 time steps before/after current time
        });

        if (!isValid) {
            throw new Error('Invalid 2FA code. Please try again.');
        }

        // Enable 2FA
        await prisma.userTwoFactor.update({
            where: { userId },
            data: {
                enabled: true,
                enabledAt: new Date(),
            },
        });

        // Get backup codes (they were already generated during setup)
        const hashedBackupCodes = JSON.parse(twoFactor.backupCodes || '[]');
        // We can't return the original codes, but we can generate new ones
        const newBackupCodes = this.generateBackupCodes(10);
        const newHashedBackupCodes = await Promise.all(
            newBackupCodes.map(code => bcrypt.hash(code, 10))
        );

        // Update with new backup codes
        await prisma.userTwoFactor.update({
            where: { userId },
            data: {
                backupCodes: JSON.stringify(newHashedBackupCodes),
            },
        });

        return {
            success: true,
            backupCodes: newBackupCodes, // Return plain codes only once
        };
    }

    /**
     * Validate 2FA token (for login or sensitive actions)
     */
    async validateToken(userId: number, token: string): Promise<boolean> {
        const twoFactor = await prisma.userTwoFactor.findUnique({
            where: { userId },
        });

        if (!twoFactor || !twoFactor.enabled || !twoFactor.secret) {
            return false;
        }

        // First try TOTP verification
        const isValidTotp = speakeasy.totp.verify({
            secret: twoFactor.secret,
            encoding: 'base32',
            token,
            window: 2,
        });

        if (isValidTotp) {
            return true;
        }

        // If TOTP fails, try backup codes
        if (twoFactor.backupCodes) {
            const hashedBackupCodes = JSON.parse(twoFactor.backupCodes);
            
            for (let i = 0; i < hashedBackupCodes.length; i++) {
                const isValid = await bcrypt.compare(token, hashedBackupCodes[i]);
                if (isValid) {
                    // Remove used backup code
                    hashedBackupCodes.splice(i, 1);
                    await prisma.userTwoFactor.update({
                        where: { userId },
                        data: {
                            backupCodes: JSON.stringify(hashedBackupCodes),
                        },
                    });
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if 2FA is enabled for a user
     */
    async isEnabled(userId: number): Promise<boolean> {
        const twoFactor = await prisma.userTwoFactor.findUnique({
            where: { userId },
            select: { enabled: true },
        });

        return twoFactor?.enabled || false;
    }

    /**
     * Disable 2FA for a user (requires valid token)
     */
    async disable(userId: number, token: string): Promise<boolean> {
        // Verify token before disabling
        const isValid = await this.validateToken(userId, token);
        if (!isValid) {
            throw new Error('Invalid 2FA code. Cannot disable 2FA without valid verification.');
        }

        // Disable 2FA
        await prisma.userTwoFactor.update({
            where: { userId },
            data: {
                enabled: false,
                secret: null,
                backupCodes: null,
                enabledAt: null,
            },
        });

        return true;
    }

    /**
     * Generate backup recovery codes
     */
    private generateBackupCodes(count: number): string[] {
        const codes: string[] = [];
        for (let i = 0; i < count; i++) {
            // Generate 8-character alphanumeric codes
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            codes.push(code);
        }
        return codes;
    }

    /**
     * Regenerate backup codes (requires 2FA verification)
     */
    async regenerateBackupCodes(userId: number, token: string): Promise<string[]> {
        // Verify token first
        const isValid = await this.validateToken(userId, token);
        if (!isValid) {
            throw new Error('Invalid 2FA code. Cannot regenerate backup codes without valid verification.');
        }

        // Generate new backup codes
        const newBackupCodes = this.generateBackupCodes(10);
        const hashedBackupCodes = await Promise.all(
            newBackupCodes.map(code => bcrypt.hash(code, 10))
        );

        // Update backup codes
        await prisma.userTwoFactor.update({
            where: { userId },
            data: {
                backupCodes: JSON.stringify(hashedBackupCodes),
            },
        });

        return newBackupCodes; // Return plain codes only once
    }
}





