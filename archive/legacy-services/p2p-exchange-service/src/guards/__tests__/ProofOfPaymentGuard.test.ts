import { ProofOfPaymentGuard } from '../ProofOfPaymentGuard';
import { ProofOfPaymentService } from '../../services/proof-of-payment.service';
import { UploadProofInput } from '../../types/proof-of-payment.types';

// Mock the service
jest.mock('../../services/proof-of-payment.service');

describe('ProofOfPaymentGuard', () => {
  let guard: ProofOfPaymentGuard;
  let mockService: jest.Mocked<ProofOfPaymentService>;

  beforeEach(() => {
    mockService = {
      getProofByMatch: jest.fn(),
      getProofById: jest.fn(),
      flagProof: jest.fn(),
    } as any;
    guard = new ProofOfPaymentGuard(mockService);
    jest.clearAllMocks();
  });

  describe('validateProof', () => {
    it('should pass validation for valid proof', async () => {
      const proof: UploadProofInput = {
        matchId: 1,
        userId: 1,
        file: {
          filename: 'proof.jpg',
          mimetype: 'image/jpeg',
          size: 1024 * 1024,
        } as Express.Multer.File,
        description: 'Payment proof for transaction',
      };

      mockService.getProofByMatch = jest.fn().mockResolvedValue(null);

      await expect(guard.validateProof(proof)).resolves.not.toThrow();
    });

    it('should throw error when file is missing', async () => {
      const proof: UploadProofInput = {
        matchId: 1,
        userId: 1,
        file: null as any,
        description: 'Payment proof for transaction',
      };

      await expect(guard.validateProof(proof)).rejects.toThrow('Proof file is required');
    });

    it('should throw error when description is too short', async () => {
      const proof: UploadProofInput = {
        matchId: 1,
        userId: 1,
        file: {
          filename: 'proof.jpg',
          mimetype: 'image/jpeg',
          size: 1024 * 1024,
        } as Express.Multer.File,
        description: 'Short',
      };

      await expect(guard.validateProof(proof)).rejects.toThrow(
        'Proof description must be at least 10 characters'
      );
    });

    it('should throw error when proof already exists', async () => {
      const proof: UploadProofInput = {
        matchId: 1,
        userId: 1,
        file: {
          filename: 'proof.jpg',
          mimetype: 'image/jpeg',
          size: 1024 * 1024,
        } as Express.Multer.File,
        description: 'Payment proof for transaction',
      };

      mockService.getProofByMatch = jest.fn().mockResolvedValue({
        id: 1,
        matchId: 1,
        uploadedBy: 1,
        fileUrl: 'https://example.com/proof.jpg',
        fileName: 'proof.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
        status: 'PENDING',
        uploadedAt: new Date(),
      });

      await expect(guard.validateProof(proof)).rejects.toThrow('Proof already exists');
    });
  });

  describe('detectFraud', () => {
    it('should return 0 fraud score for valid proof', async () => {
      const proofId = 1;

      mockService.getProofById = jest.fn().mockResolvedValue({
        id: proofId,
        matchId: 1,
        uploadedBy: 1,
        fileUrl: 'https://example.com/proof.jpg',
        fileName: 'payment_proof_123.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
        description: 'Payment confirmation screenshot',
        status: 'PENDING',
        uploadedAt: new Date(),
      });

      const score = await guard.detectFraud(proofId);

      expect(score).toBe(0);
    });

    it('should detect suspicious file name', async () => {
      const proofId = 1;

      mockService.getProofById = jest.fn().mockResolvedValue({
        id: proofId,
        matchId: 1,
        uploadedBy: 1,
        fileUrl: 'https://example.com/proof.jpg',
        fileName: 'test_proof.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
        description: 'Payment confirmation',
        status: 'PENDING',
        uploadedAt: new Date(),
      });

      const score = await guard.detectFraud(proofId);

      expect(score).toBeGreaterThanOrEqualTo(0.5);
    });

    it('should detect suspicious description', async () => {
      const proofId = 1;

      mockService.getProofById = jest.fn().mockResolvedValue({
        id: proofId,
        matchId: 1,
        uploadedBy: 1,
        fileUrl: 'https://example.com/proof.jpg',
        fileName: 'proof.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
        description: 'fake payment proof',
        status: 'PENDING',
        uploadedAt: new Date(),
      });

      const score = await guard.detectFraud(proofId);

      expect(score).toBeGreaterThanOrEqualTo(0.3);
    });

    it('should flag proof when fraud score is high', async () => {
      const proofId = 1;

      mockService.getProofById = jest.fn().mockResolvedValue({
        id: proofId,
        matchId: 1,
        uploadedBy: 1,
        fileUrl: 'https://example.com/proof.jpg',
        fileName: 'fake_proof.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
        description: 'dummy payment',
        status: 'PENDING',
        uploadedAt: new Date(),
      });
      mockService.flagProof = jest.fn().mockResolvedValue(undefined);

      const score = await guard.detectFraud(proofId);

      expect(score).toBeGreaterThan(0.7);
      expect(mockService.flagProof).toHaveBeenCalledWith({
        proofId,
        userId: 1,
        reason: 'High fraud score detected',
      });
    });

    it('should return 0 when proof not found', async () => {
      const proofId = 999;

      mockService.getProofById = jest.fn().mockResolvedValue(null);

      const score = await guard.detectFraud(proofId);

      expect(score).toBe(0);
    });
  });

  describe('isValidImageType', () => {
    it('should accept valid image types', () => {
      expect(guard.isValidImageType('image/jpeg')).toBe(true);
      expect(guard.isValidImageType('image/png')).toBe(true);
      expect(guard.isValidImageType('image/jpg')).toBe(true);
    });

    it('should reject invalid image types', () => {
      expect(guard.isValidImageType('image/gif')).toBe(false);
      expect(guard.isValidImageType('application/pdf')).toBe(false);
      expect(guard.isValidImageType('text/plain')).toBe(false);
    });
  });

  describe('isValidVideoType', () => {
    it('should accept valid video types', () => {
      expect(guard.isValidVideoType('video/mp4')).toBe(true);
      expect(guard.isValidVideoType('video/quicktime')).toBe(true);
      expect(guard.isValidVideoType('video/x-msvideo')).toBe(true);
    });

    it('should reject invalid video types', () => {
      expect(guard.isValidVideoType('video/webm')).toBe(false);
      expect(guard.isValidVideoType('application/pdf')).toBe(false);
    });
  });

  describe('isValidFileSize', () => {
    it('should accept valid image sizes', () => {
      expect(guard.isValidFileSize(5 * 1024 * 1024, 'image')).toBe(true); // 5MB
      expect(guard.isValidFileSize(10 * 1024 * 1024, 'image')).toBe(true); // 10MB
    });

    it('should reject oversized images', () => {
      expect(guard.isValidFileSize(15 * 1024 * 1024, 'image')).toBe(false); // 15MB
    });

    it('should accept valid video sizes', () => {
      expect(guard.isValidFileSize(30 * 1024 * 1024, 'video')).toBe(true); // 30MB
      expect(guard.isValidFileSize(50 * 1024 * 1024, 'video')).toBe(true); // 50MB
    });

    it('should reject oversized videos', () => {
      expect(guard.isValidFileSize(60 * 1024 * 1024, 'video')).toBe(false); // 60MB
    });
  });
});
