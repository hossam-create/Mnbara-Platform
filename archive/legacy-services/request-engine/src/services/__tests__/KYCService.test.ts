import { Pool } from 'pg';
import { KYCService } from '../KYCService';
import { FileStorageService } from '../storage/FileStorageService';
import {
  VerificationLevel,
  DocumentType,
  VerificationStatus,
  VERIFICATION_LIMITS,
} from '../../types/kyc.types';

// Mock dependencies
jest.mock('pg');
jest.mock('../storage/FileStorageService');
jest.mock('../../utils/logger');

describe('KYCService', () => {
  let service: KYCService;
  let mockDb: jest.Mocked<Pool>;
  let mockStorage: jest.Mocked<FileStorageService>;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
      connect: jest.fn(),
    } as any;

    mockStorage = {
      uploadFile: jest.fn(),
    } as any;

    service = new KYCService(mockDb, mockStorage);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserVerificationStatus', () => {
    it('should return user verification status', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          {
            verification_level: VerificationLevel.EMAIL_VERIFIED,
            email_verified: true,
            phone_verified: false,
            id_verified: false,
          },
        ],
      } as any);

      const status = await service.getUserVerificationStatus(1);

      expect(status.userId).toBe(1);
      expect(status.verificationLevel).toBe(VerificationLevel.EMAIL_VERIFIED);
      expect(status.emailVerified).toBe(true);
      expect(status.phoneVerified).toBe(false);
      expect(status.idVerified).toBe(false);
      expect(status.transactionLimit).toBe(VERIFICATION_LIMITS[VerificationLevel.EMAIL_VERIFIED]);
      expect(status.canRequestPayout).toBe(true);
    });

    it('should throw error if user not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      await expect(service.getUserVerificationStatus(999)).rejects.toThrow('User not found');
    });
  });

  describe('checkTransactionLimit', () => {
    it('should allow transaction within limit', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          {
            verification_level: VerificationLevel.EMAIL_VERIFIED,
            email_verified: true,
            phone_verified: false,
            id_verified: false,
          },
        ],
      } as any);

      const result = await service.checkTransactionLimit(1, 400);

      expect(result.allowed).toBe(true);
      expect(result.currentLevel).toBe(VerificationLevel.EMAIL_VERIFIED);
      expect(result.currentLimit).toBe(500);
      expect(result.requestedAmount).toBe(400);
    });

    it('should reject transaction exceeding limit', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          {
            verification_level: VerificationLevel.EMAIL_VERIFIED,
            email_verified: true,
            phone_verified: false,
            id_verified: false,
          },
        ],
      } as any);

      const result = await service.checkTransactionLimit(1, 600);

      expect(result.allowed).toBe(false);
      expect(result.currentLevel).toBe(VerificationLevel.EMAIL_VERIFIED);
      expect(result.currentLimit).toBe(500);
      expect(result.requestedAmount).toBe(600);
      expect(result.requiredLevel).toBe(VerificationLevel.PHONE_VERIFIED);
      expect(result.message).toContain('exceeds your current limit');
    });

    it('should require ID verification for high amounts', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          {
            verification_level: VerificationLevel.PHONE_VERIFIED,
            email_verified: true,
            phone_verified: true,
            id_verified: false,
          },
        ],
      } as any);

      const result = await service.checkTransactionLimit(1, 2000);

      expect(result.allowed).toBe(false);
      expect(result.requiredLevel).toBe(VerificationLevel.ID_VERIFIED);
    });
  });

  describe('checkPayoutEligibility', () => {
    it('should reject payout for unverified users', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          {
            verification_level: VerificationLevel.UNVERIFIED,
            email_verified: false,
            phone_verified: false,
            id_verified: false,
          },
        ],
      } as any);

      const result = await service.checkPayoutEligibility(1, 50);

      expect(result.allowed).toBe(false);
      expect(result.requiredLevel).toBe(VerificationLevel.EMAIL_VERIFIED);
      expect(result.message).toContain('verify your email');
    });

    it('should require ID verification for payouts > $100', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          {
            verification_level: VerificationLevel.EMAIL_VERIFIED,
            email_verified: true,
            phone_verified: false,
            id_verified: false,
          },
        ],
      } as any);

      const result = await service.checkPayoutEligibility(1, 150);

      expect(result.allowed).toBe(false);
      expect(result.requiredLevel).toBe(VerificationLevel.ID_VERIFIED);
      expect(result.message).toContain('ID verification');
    });

    it('should allow payout for verified users within limit', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          {
            verification_level: VerificationLevel.ID_VERIFIED,
            email_verified: true,
            phone_verified: true,
            id_verified: true,
          },
        ],
      } as any);

      const result = await service.checkPayoutEligibility(1, 200);

      expect(result.allowed).toBe(true);
    });
  });

  describe('uploadIdDocument', () => {
    it('should upload ID document successfully', async () => {
      const frontImage = {
        originalname: 'front.jpg',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      mockStorage.uploadFile
        .mockResolvedValueOnce('https://storage.com/front.jpg')
        .mockResolvedValueOnce('https://storage.com/back.jpg');

      mockDb.query.mockResolvedValue({
        rows: [
          {
            id: 1,
            user_id: 1,
            document_type: DocumentType.ID,
            front_image_url: 'https://storage.com/front.jpg',
            back_image_url: 'https://storage.com/back.jpg',
            status: VerificationStatus.PENDING,
            uploaded_at: new Date(),
          },
        ],
      } as any);

      const backImage = {
        originalname: 'back.jpg',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const document = await service.uploadIdDocument(1, DocumentType.ID, frontImage, backImage);

      expect(document.userId).toBe(1);
      expect(document.documentType).toBe(DocumentType.ID);
      expect(document.status).toBe(VerificationStatus.PENDING);
      expect(mockStorage.uploadFile).toHaveBeenCalledTimes(2);
      expect(mockDb.query).toHaveBeenCalled();
    });
  });

  describe('approveIdVerification', () => {
    it('should approve verification and update user level', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };

      mockDb.connect = jest.fn().mockResolvedValue(mockClient);

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({
          // UPDATE document
          rows: [
            {
              id: 1,
              user_id: 1,
              document_type: DocumentType.ID,
              front_image_url: 'url',
              status: VerificationStatus.APPROVED,
              reviewed_at: new Date(),
              reviewed_by: 2,
            },
          ],
        })
        .mockResolvedValueOnce(undefined) // UPDATE user
        .mockResolvedValueOnce(undefined); // COMMIT

      const document = await service.approveIdVerification(1, 2);

      expect(document.status).toBe(VerificationStatus.APPROVED);
      expect(document.reviewedBy).toBe(2);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };

      mockDb.connect = jest.fn().mockResolvedValue(mockClient);

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockRejectedValueOnce(new Error('Database error'));

      await expect(service.approveIdVerification(1, 2)).rejects.toThrow();

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('verifyPhoneOTP', () => {
    it('should verify correct OTP', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };

      mockDb.connect = jest.fn().mockResolvedValue(mockClient);

      const futureDate = new Date(Date.now() + 10 * 60 * 1000);

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({
          // SELECT verification
          rows: [
            {
              id: 1,
              user_id: 1,
              phone_number: '+1234567890',
              otp: '123456',
              expires_at: futureDate,
              attempts: 0,
              verified: false,
            },
          ],
        })
        .mockResolvedValueOnce(undefined) // UPDATE attempts
        .mockResolvedValueOnce(undefined) // UPDATE verified
        .mockResolvedValueOnce({
          // SELECT user
          rows: [{ verification_level: VerificationLevel.EMAIL_VERIFIED }],
        })
        .mockResolvedValueOnce(undefined) // UPDATE user
        .mockResolvedValueOnce(undefined); // COMMIT

      const verified = await service.verifyPhoneOTP(1, '+1234567890', '123456');

      expect(verified).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should reject incorrect OTP', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };

      mockDb.connect = jest.fn().mockResolvedValue(mockClient);

      const futureDate = new Date(Date.now() + 10 * 60 * 1000);

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({
          // SELECT verification
          rows: [
            {
              id: 1,
              user_id: 1,
              phone_number: '+1234567890',
              otp: '123456',
              expires_at: futureDate,
              attempts: 0,
              verified: false,
            },
          ],
        })
        .mockResolvedValueOnce(undefined) // UPDATE attempts
        .mockResolvedValueOnce(undefined); // COMMIT

      const verified = await service.verifyPhoneOTP(1, '+1234567890', '999999');

      expect(verified).toBe(false);
    });

    it('should reject expired OTP', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };

      mockDb.connect = jest.fn().mockResolvedValue(mockClient);

      const pastDate = new Date(Date.now() - 10 * 60 * 1000);

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({
          // SELECT verification
          rows: [
            {
              id: 1,
              user_id: 1,
              phone_number: '+1234567890',
              otp: '123456',
              expires_at: pastDate,
              attempts: 0,
              verified: false,
            },
          ],
        });

      await expect(service.verifyPhoneOTP(1, '+1234567890', '123456')).rejects.toThrow(
        'OTP has expired'
      );

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});
