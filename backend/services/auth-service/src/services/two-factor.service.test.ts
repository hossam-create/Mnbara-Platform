import { TwoFactorService } from './two-factor.service';
import { PrismaClient } from '@prisma/client';
import * as speakeasy from 'speakeasy';
import * as bcrypt from 'bcryptjs';

// Mock Prisma
jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => ({
            userTwoFactor: {
                findUnique: jest.fn(),
                upsert: jest.fn(),
                update: jest.fn(),
            },
        })),
    };
});

// Mock speakeasy
jest.mock('speakeasy', () => ({
    generateSecret: jest.fn(),
    totp: {
        verify: jest.fn(),
    },
}));

// Mock qrcode
jest.mock('qrcode', () => ({
    toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,test'),
}));

describe('TwoFactorService', () => {
    let service: TwoFactorService;
    let mockPrisma: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma = new PrismaClient();
        service = new TwoFactorService();
        // Replace prisma instance in service
        (service as any).prisma = mockPrisma;
    });

    describe('generateSecret', () => {
        it('should generate a secret and QR code for a user', async () => {
            const userId = 1;
            const email = 'test@example.com';

            (speakeasy.generateSecret as jest.Mock).mockReturnValue({
                base32: 'TEST_SECRET_BASE32',
                otpauth_url: 'otpauth://totp/MNBARA:test@example.com?secret=TEST_SECRET_BASE32&issuer=MNBARA',
            });

            mockPrisma.userTwoFactor.upsert.mockResolvedValue({
                userId,
                secret: 'TEST_SECRET_BASE32',
                enabled: false,
            });

            const result = await service.generateSecret(userId, email);

            expect(result).toHaveProperty('secret');
            expect(result).toHaveProperty('qrCodeUrl');
            expect(result).toHaveProperty('backupCodes');
            expect(result.backupCodes).toHaveLength(10);
            expect(mockPrisma.userTwoFactor.upsert).toHaveBeenCalled();
        });
    });

    describe('verifyAndEnable', () => {
        it('should enable 2FA after verifying token', async () => {
            const userId = 1;
            const token = '123456';

            mockPrisma.userTwoFactor.findUnique.mockResolvedValue({
                userId,
                secret: 'TEST_SECRET_BASE32',
                enabled: false,
                backupCodes: JSON.stringify(['hashed1', 'hashed2']),
            });

            (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

            mockPrisma.userTwoFactor.update.mockResolvedValue({
                userId,
                enabled: true,
            });

            const result = await service.verifyAndEnable(userId, token);

            expect(result.success).toBe(true);
            expect(result.backupCodes).toHaveLength(10);
            expect(mockPrisma.userTwoFactor.update).toHaveBeenCalledWith({
                where: { userId },
                data: { enabled: true, enabledAt: expect.any(Date) },
            });
        });

        it('should throw error if token is invalid', async () => {
            const userId = 1;
            const token = 'invalid';

            mockPrisma.userTwoFactor.findUnique.mockResolvedValue({
                userId,
                secret: 'TEST_SECRET_BASE32',
                enabled: false,
            });

            (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

            await expect(service.verifyAndEnable(userId, token)).rejects.toThrow('Invalid 2FA code');
        });
    });

    describe('validateToken', () => {
        it('should validate TOTP token successfully', async () => {
            const userId = 1;
            const token = '123456';

            mockPrisma.userTwoFactor.findUnique.mockResolvedValue({
                userId,
                secret: 'TEST_SECRET_BASE32',
                enabled: true,
            });

            (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

            const result = await service.validateToken(userId, token);

            expect(result).toBe(true);
        });

        it('should return false if 2FA is not enabled', async () => {
            const userId = 1;
            const token = '123456';

            mockPrisma.userTwoFactor.findUnique.mockResolvedValue(null);

            const result = await service.validateToken(userId, token);

            expect(result).toBe(false);
        });

        it('should validate backup code successfully', async () => {
            const userId = 1;
            const backupCode = 'ABCD1234';
            const hashedCode = await bcrypt.hash(backupCode, 10);

            mockPrisma.userTwoFactor.findUnique.mockResolvedValue({
                userId,
                secret: 'TEST_SECRET_BASE32',
                enabled: true,
                backupCodes: JSON.stringify([hashedCode]),
            });

            (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

            mockPrisma.userTwoFactor.update.mockResolvedValue({});

            const result = await service.validateToken(userId, backupCode);

            expect(result).toBe(true);
            expect(mockPrisma.userTwoFactor.update).toHaveBeenCalled();
        });
    });

    describe('disable', () => {
        it('should disable 2FA after verifying token', async () => {
            const userId = 1;
            const token = '123456';

            mockPrisma.userTwoFactor.findUnique.mockResolvedValue({
                userId,
                secret: 'TEST_SECRET_BASE32',
                enabled: true,
            });

            (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

            mockPrisma.userTwoFactor.update.mockResolvedValue({});

            const result = await service.disable(userId, token);

            expect(result).toBe(true);
            expect(mockPrisma.userTwoFactor.update).toHaveBeenCalledWith({
                where: { userId },
                data: {
                    enabled: false,
                    secret: null,
                    backupCodes: null,
                    enabledAt: null,
                },
            });
        });

        it('should throw error if token is invalid', async () => {
            const userId = 1;
            const token = 'invalid';

            mockPrisma.userTwoFactor.findUnique.mockResolvedValue({
                userId,
                secret: 'TEST_SECRET_BASE32',
                enabled: true,
            });

            (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

            await expect(service.disable(userId, token)).rejects.toThrow('Invalid 2FA code');
        });
    });

    describe('isEnabled', () => {
        it('should return true if 2FA is enabled', async () => {
            const userId = 1;

            mockPrisma.userTwoFactor.findUnique.mockResolvedValue({
                enabled: true,
            });

            const result = await service.isEnabled(userId);

            expect(result).toBe(true);
        });

        it('should return false if 2FA is not enabled', async () => {
            const userId = 1;

            mockPrisma.userTwoFactor.findUnique.mockResolvedValue(null);

            const result = await service.isEnabled(userId);

            expect(result).toBe(false);
        });
    });
});





