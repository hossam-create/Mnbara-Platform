import { PhoneVerificationService } from './phone-verification.service';
import { PrismaClient } from '@prisma/client';
import { SmsService } from './sms.service';
import * as bcrypt from 'bcryptjs';

// Mock Prisma
jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => ({
            phoneVerification: {
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                upsert: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            user: {
                update: jest.fn(),
            },
        })),
    };
});

// Mock SMS service
jest.mock('./sms.service', () => ({
    SmsService: jest.fn().mockImplementation(() => ({
        sendOtp: jest.fn().mockResolvedValue(true),
        validatePhoneNumber: jest.fn().mockReturnValue(true),
    })),
}));

describe('PhoneVerificationService', () => {
    let service: PhoneVerificationService;
    let mockPrisma: any;
    let mockSmsService: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma = new PrismaClient();
        mockSmsService = new SmsService();
        service = new PhoneVerificationService();
        // Replace instances in service
        (service as any).prisma = mockPrisma;
        (service as any).smsService = mockSmsService;
    });

    describe('addPhoneNumber', () => {
        it('should add phone number successfully', async () => {
            const userId = 1;
            const phoneNumber = '+1234567890';

            mockPrisma.phoneVerification.findFirst.mockResolvedValue(null);
            mockPrisma.phoneVerification.upsert.mockResolvedValue({
                userId,
                phoneNumber,
                verified: false,
            });
            mockPrisma.user.update.mockResolvedValue({});

            await service.addPhoneNumber(userId, phoneNumber);

            expect(mockPrisma.phoneVerification.upsert).toHaveBeenCalled();
            expect(mockPrisma.user.update).toHaveBeenCalled();
        });

        it('should throw error if phone is already verified by another user', async () => {
            const userId = 1;
            const phoneNumber = '+1234567890';

            mockPrisma.phoneVerification.findFirst.mockResolvedValue({
                userId: 2,
                verified: true,
            });

            await expect(service.addPhoneNumber(userId, phoneNumber)).rejects.toThrow(
                'already verified by another account'
            );
        });
    });

    describe('sendOtp', () => {
        it('should send OTP successfully', async () => {
            const userId = 1;

            mockPrisma.phoneVerification.findUnique.mockResolvedValue({
                userId,
                phoneNumber: '+1234567890',
                lastOtpSentAt: null,
                otpRequestCount: 0,
            });

            mockPrisma.phoneVerification.update.mockResolvedValue({});
            mockSmsService.sendOtp.mockResolvedValue(true);

            await service.sendOtp(userId);

            expect(mockSmsService.sendOtp).toHaveBeenCalled();
            expect(mockPrisma.phoneVerification.update).toHaveBeenCalled();
        });

        it('should throw error if phone number not added', async () => {
            const userId = 1;

            mockPrisma.phoneVerification.findUnique.mockResolvedValue(null);

            await expect(service.sendOtp(userId)).rejects.toThrow('Phone number not added');
        });

        it('should throw error if rate limit exceeded', async () => {
            const userId = 1;
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

            mockPrisma.phoneVerification.findUnique.mockResolvedValue({
                userId,
                phoneNumber: '+1234567890',
                lastOtpSentAt: new Date(),
                otpRequestCount: 5, // Max is 5
            });

            await expect(service.sendOtp(userId)).rejects.toThrow('Too many OTP requests');
        });
    });

    describe('verifyOtp', () => {
        it('should verify OTP successfully', async () => {
            const userId = 1;
            const otpCode = '123456';
            const hashedOtp = await bcrypt.hash(otpCode, 10);

            mockPrisma.phoneVerification.findUnique.mockResolvedValue({
                userId,
                otpCode: hashedOtp,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
                attempts: 0,
            });

            mockPrisma.phoneVerification.update.mockResolvedValue({});
            mockPrisma.user.update.mockResolvedValue({});

            const result = await service.verifyOtp(userId, otpCode);

            expect(result).toBe(true);
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: { phoneVerified: true },
            });
        });

        it('should throw error if OTP is expired', async () => {
            const userId = 1;
            const otpCode = '123456';

            mockPrisma.phoneVerification.findUnique.mockResolvedValue({
                userId,
                otpCode: 'hashed',
                expiresAt: new Date(Date.now() - 1000), // Expired
                attempts: 0,
            });

            await expect(service.verifyOtp(userId, otpCode)).rejects.toThrow('expired');
        });

        it('should throw error if OTP is invalid', async () => {
            const userId = 1;
            const otpCode = '123456';
            const wrongOtp = '999999';
            const hashedOtp = await bcrypt.hash(otpCode, 10);

            mockPrisma.phoneVerification.findUnique.mockResolvedValue({
                userId,
                otpCode: hashedOtp,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                attempts: 0,
            });

            mockPrisma.phoneVerification.update.mockResolvedValue({});

            await expect(service.verifyOtp(userId, wrongOtp)).rejects.toThrow('Invalid OTP code');
        });

        it('should throw error if too many attempts', async () => {
            const userId = 1;
            const otpCode = '123456';

            mockPrisma.phoneVerification.findUnique.mockResolvedValue({
                userId,
                otpCode: 'hashed',
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                attempts: 5, // Max is 5
            });

            await expect(service.verifyOtp(userId, otpCode)).rejects.toThrow('Too many verification attempts');
        });
    });

    describe('isPhoneVerified', () => {
        it('should return true if phone is verified', async () => {
            const userId = 1;

            mockPrisma.user.findUnique.mockResolvedValue({
                phoneVerified: true,
            });

            const result = await service.isPhoneVerified(userId);

            expect(result).toBe(true);
        });

        it('should return false if phone is not verified', async () => {
            const userId = 1;

            mockPrisma.user.findUnique.mockResolvedValue({
                phoneVerified: false,
            });

            const result = await service.isPhoneVerified(userId);

            expect(result).toBe(false);
        });
    });

    describe('getVerificationStatus', () => {
        it('should return status with verified phone', async () => {
            const userId = 1;

            mockPrisma.phoneVerification.findUnique.mockResolvedValue({
                verified: true,
                phoneNumber: '+1234567890',
                verifiedAt: new Date(),
            });

            const status = await service.getVerificationStatus(userId);

            expect(status.hasPhone).toBe(true);
            expect(status.verified).toBe(true);
            expect(status.phoneNumber).toBe('+1234567890');
        });

        it('should return status without phone', async () => {
            const userId = 1;

            mockPrisma.phoneVerification.findUnique.mockResolvedValue(null);

            const status = await service.getVerificationStatus(userId);

            expect(status.hasPhone).toBe(false);
            expect(status.verified).toBe(false);
        });
    });
});





