// ============================================================
// Proof of Payment Service Tests
// ============================================================

import { PrismaClient } from '@prisma/client';
import { ProofOfPaymentService } from '../proof-of-payment.service';
import { FileStorageService } from '../storage/FileStorageService';
import {
  ProofStatus,
  MatchStatus,
  ExchangeStatus,
} from '../../types/enums';
import {
  ProofNotFoundError,
  InvalidProofStatusError,
  UnauthorizedProofAccessError,
} from '../../errors/ExchangeErrors';

// Mock Prisma Client
const mockPrisma = {
  proofOfPayment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  exchangeMatch: {
    findUnique: jest.fn(),
  },
} as unknown as PrismaClient;

// Mock File Storage Service
const mockStorageService = {
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  getFileUrl: jest.fn(),
  fileExists: jest.fn(),
} as unknown as FileStorageService;

describe('ProofOfPaymentService', () => {
  let service: ProofOfPaymentService;

  beforeEach(() => {
    service = new ProofOfPaymentService(mockPrisma, mockStorageService);
    jest.clearAllMocks();
  });

  describe('uploadProof', () => {
    const mockFile = {
      originalname: 'receipt.jpg',
      size: 1024 * 1024, // 1MB
      mimetype: 'image/jpeg',
      buffer: Buffer.from('mock'),
    } as Express.Multer.File;

    const mockMatch = {
      id: 1,
      status: MatchStatus.SETTLING,
      request: { id: 1, userId: 100 },
      counterRequest: { id: 2, userId: 200 },
    };

    it('should upload proof successfully', async () => {
      (mockPrisma.exchangeMatch.findUnique as jest.Mock).mockResolvedValue(mockMatch);
      (mockStorageService.uploadFile as jest.Mock).mockResolvedValue(
        'https://storage.mnbara.com/proofs/1/receipt.jpg'
      );
      (mockPrisma.proofOfPayment.create as jest.Mock).mockResolvedValue({
        id: 1,
        matchId: 1,
        uploadedBy: 100,
        fileUrl: 'https://storage.mnbara.com/proofs/1/receipt.jpg',
        fileName: 'receipt.jpg',
        fileSize: 1024 * 1024,
        mimeType: 'image/jpeg',
        description: 'Payment receipt',
        status: ProofStatus.PENDING,
        uploadedAt: new Date(),
      });

      const result = await service.uploadProof({
        matchId: 1,
        userId: 100,
        file: mockFile,
        description: 'Payment receipt',
      });

      expect(result.status).toBe(ProofStatus.PENDING);
      expect(result.fileName).toBe('receipt.jpg');
      expect(mockStorageService.uploadFile).toHaveBeenCalled();
      expect(mockPrisma.proofOfPayment.create).toHaveBeenCalled();
    });

    it('should reject unauthorized user', async () => {
      (mockPrisma.exchangeMatch.findUnique as jest.Mock).mockResolvedValue(mockMatch);

      await expect(
        service.uploadProof({
          matchId: 1,
          userId: 999, // Not part of match
          file: mockFile,
          description: 'Payment receipt',
        })
      ).rejects.toThrow(UnauthorizedProofAccessError);
    });

    it('should reject if match not in SETTLING status', async () => {
      (mockPrisma.exchangeMatch.findUnique as jest.Mock).mockResolvedValue({
        ...mockMatch,
        status: MatchStatus.PENDING,
      });

      await expect(
        service.uploadProof({
          matchId: 1,
          userId: 100,
          file: mockFile,
          description: 'Payment receipt',
        })
      ).rejects.toThrow('must be in SETTLING status');
    });

    it('should reject invalid file type', async () => {
      (mockPrisma.exchangeMatch.findUnique as jest.Mock).mockResolvedValue(mockMatch);

      const invalidFile = {
        ...mockFile,
        mimetype: 'application/exe',
      } as Express.Multer.File;

      await expect(
        service.uploadProof({
          matchId: 1,
          userId: 100,
          file: invalidFile,
          description: 'Payment receipt',
        })
      ).rejects.toThrow('Invalid file type');
    });

    it('should reject file exceeding size limit', async () => {
      (mockPrisma.exchangeMatch.findUnique as jest.Mock).mockResolvedValue(mockMatch);

      const largeFile = {
        ...mockFile,
        size: 11 * 1024 * 1024, // 11MB
      } as Express.Multer.File;

      await expect(
        service.uploadProof({
          matchId: 1,
          userId: 100,
          file: largeFile,
          description: 'Payment receipt',
        })
      ).rejects.toThrow('exceeds maximum allowed size');
    });
  });

  describe('getProof', () => {
    it('should get proof by ID', async () => {
      const mockProof = {
        id: 1,
        matchId: 1,
        uploadedBy: 100,
        fileUrl: 'https://storage.mnbara.com/proofs/1/receipt.jpg',
        fileName: 'receipt.jpg',
        fileSize: 1024 * 1024,
        mimeType: 'image/jpeg',
        status: ProofStatus.PENDING,
        uploadedAt: new Date(),
        match: {
          request: { userId: 100 },
          counterRequest: { userId: 200 },
        },
      };

      (mockPrisma.proofOfPayment.findUnique as jest.Mock).mockResolvedValue(mockProof);

      const result = await service.getProof(1, 100);

      expect(result.id).toBe(1);
      expect(result.fileName).toBe('receipt.jpg');
    });

    it('should throw error if proof not found', async () => {
      (mockPrisma.proofOfPayment.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getProof(999, 100)).rejects.toThrow(ProofNotFoundError);
    });

    it('should reject unauthorized access', async () => {
      const mockProof = {
        id: 1,
        matchId: 1,
        uploadedBy: 100,
        match: {
          request: { userId: 100 },
          counterRequest: { userId: 200 },
        },
      };

      (mockPrisma.proofOfPayment.findUnique as jest.Mock).mockResolvedValue(mockProof);

      await expect(service.getProof(1, 999)).rejects.toThrow(
        UnauthorizedProofAccessError
      );
    });
  });

  describe('getMatchProofs', () => {
    it('should get all proofs for a match', async () => {
      const mockMatch = {
        id: 1,
        request: { userId: 100 },
        counterRequest: { userId: 200 },
      };

      const mockProofs = [
        {
          id: 1,
          matchId: 1,
          uploadedBy: 100,
          fileName: 'receipt1.jpg',
          status: ProofStatus.VERIFIED,
          uploadedAt: new Date(),
        },
        {
          id: 2,
          matchId: 1,
          uploadedBy: 200,
          fileName: 'receipt2.jpg',
          status: ProofStatus.PENDING,
          uploadedAt: new Date(),
        },
      ];

      (mockPrisma.exchangeMatch.findUnique as jest.Mock).mockResolvedValue(mockMatch);
      (mockPrisma.proofOfPayment.findMany as jest.Mock).mockResolvedValue(mockProofs);

      const result = await service.getMatchProofs(1, 100);

      expect(result).toHaveLength(2);
      expect(result[0].fileName).toBe('receipt1.jpg');
      expect(result[1].fileName).toBe('receipt2.jpg');
    });

    it('should reject unauthorized access', async () => {
      const mockMatch = {
        id: 1,
        request: { userId: 100 },
        counterRequest: { userId: 200 },
      };

      (mockPrisma.exchangeMatch.findUnique as jest.Mock).mockResolvedValue(mockMatch);

      await expect(service.getMatchProofs(1, 999)).rejects.toThrow(
        UnauthorizedProofAccessError
      );
    });
  });

  describe('verifyProof', () => {
    it('should verify proof (approve)', async () => {
      const mockProof = {
        id: 1,
        matchId: 1,
        status: ProofStatus.PENDING,
        match: { settlementId: 1 },
      };

      (mockPrisma.proofOfPayment.findUnique as jest.Mock).mockResolvedValue(mockProof);
      (mockPrisma.proofOfPayment.update as jest.Mock).mockResolvedValue({
        ...mockProof,
        status: ProofStatus.VERIFIED,
        verifiedBy: 1,
        verifiedAt: new Date(),
      });

      const result = await service.verifyProof({
        proofId: 1,
        adminId: 1,
        approved: true,
      });

      expect(result.status).toBe(ProofStatus.VERIFIED);
      expect(result.verifiedBy).toBe(1);
    });

    it('should verify proof (reject)', async () => {
      const mockProof = {
        id: 1,
        matchId: 1,
        status: ProofStatus.PENDING,
        match: { settlementId: 1 },
      };

      (mockPrisma.proofOfPayment.findUnique as jest.Mock).mockResolvedValue(mockProof);
      (mockPrisma.proofOfPayment.update as jest.Mock).mockResolvedValue({
        ...mockProof,
        status: ProofStatus.REJECTED,
        verifiedBy: 1,
        verifiedAt: new Date(),
        rejectionReason: 'Invalid receipt',
      });

      const result = await service.verifyProof({
        proofId: 1,
        adminId: 1,
        approved: false,
        rejectionReason: 'Invalid receipt',
      });

      expect(result.status).toBe(ProofStatus.REJECTED);
      expect(result.rejectionReason).toBe('Invalid receipt');
    });

    it('should throw error if proof not in PENDING status', async () => {
      const mockProof = {
        id: 1,
        matchId: 1,
        status: ProofStatus.VERIFIED,
        match: { settlementId: 1 },
      };

      (mockPrisma.proofOfPayment.findUnique as jest.Mock).mockResolvedValue(mockProof);

      await expect(
        service.verifyProof({
          proofId: 1,
          adminId: 1,
          approved: true,
        })
      ).rejects.toThrow(InvalidProofStatusError);
    });
  });

  describe('flagProof', () => {
    it('should flag proof as suspicious', async () => {
      const mockProof = {
        id: 1,
        matchId: 1,
        status: ProofStatus.PENDING,
        match: {
          request: { userId: 100 },
          counterRequest: { userId: 200 },
        },
      };

      (mockPrisma.proofOfPayment.findUnique as jest.Mock).mockResolvedValue(mockProof);
      (mockPrisma.proofOfPayment.update as jest.Mock).mockResolvedValue({
        ...mockProof,
        status: ProofStatus.FLAGGED,
        flaggedBy: 200,
        flaggedAt: new Date(),
        flagReason: 'Suspicious document',
      });

      const result = await service.flagProof({
        proofId: 1,
        userId: 200,
        reason: 'Suspicious document',
      });

      expect(result.status).toBe(ProofStatus.FLAGGED);
      expect(result.flagReason).toBe('Suspicious document');
    });

    it('should reject unauthorized flagging', async () => {
      const mockProof = {
        id: 1,
        matchId: 1,
        match: {
          request: { userId: 100 },
          counterRequest: { userId: 200 },
        },
      };

      (mockPrisma.proofOfPayment.findUnique as jest.Mock).mockResolvedValue(mockProof);

      await expect(
        service.flagProof({
          proofId: 1,
          userId: 999,
          reason: 'Suspicious document',
        })
      ).rejects.toThrow(UnauthorizedProofAccessError);
    });
  });

  describe('getPendingProofs', () => {
    it('should get pending proofs for admin review', async () => {
      const mockProofs = [
        {
          id: 1,
          matchId: 1,
          status: ProofStatus.PENDING,
          uploadedAt: new Date('2026-01-25T10:00:00Z'),
          match: {
            request: { userId: 100 },
            counterRequest: { userId: 200 },
          },
        },
        {
          id: 2,
          matchId: 2,
          status: ProofStatus.PENDING,
          uploadedAt: new Date('2026-01-25T11:00:00Z'),
          match: {
            request: { userId: 101 },
            counterRequest: { userId: 201 },
          },
        },
      ];

      (mockPrisma.proofOfPayment.findMany as jest.Mock).mockResolvedValue(mockProofs);

      const result = await service.getPendingProofs(50);

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe(ProofStatus.PENDING);
    });
  });

  describe('getFlaggedProofs', () => {
    it('should get flagged proofs for admin review', async () => {
      const mockProofs = [
        {
          id: 1,
          matchId: 1,
          status: ProofStatus.FLAGGED,
          flaggedAt: new Date('2026-01-25T10:00:00Z'),
          match: {
            request: { userId: 100 },
            counterRequest: { userId: 200 },
          },
        },
      ];

      (mockPrisma.proofOfPayment.findMany as jest.Mock).mockResolvedValue(mockProofs);

      const result = await service.getFlaggedProofs(50);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(ProofStatus.FLAGGED);
    });
  });

  describe('deleteProof', () => {
    it('should delete proof within 5 minutes', async () => {
      const recentDate = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago
      const mockProof = {
        id: 1,
        matchId: 1,
        uploadedBy: 100,
        fileUrl: 'https://storage.mnbara.com/proofs/1/receipt.jpg',
        uploadedAt: recentDate,
      };

      (mockPrisma.proofOfPayment.findUnique as jest.Mock).mockResolvedValue(mockProof);
      (mockStorageService.deleteFile as jest.Mock).mockResolvedValue(undefined);
      (mockPrisma.proofOfPayment.delete as jest.Mock).mockResolvedValue(mockProof);

      await service.deleteProof(1, 100);

      expect(mockStorageService.deleteFile).toHaveBeenCalledWith(mockProof.fileUrl);
      expect(mockPrisma.proofOfPayment.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should reject deletion after 5 minutes', async () => {
      const oldDate = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      const mockProof = {
        id: 1,
        matchId: 1,
        uploadedBy: 100,
        uploadedAt: oldDate,
      };

      (mockPrisma.proofOfPayment.findUnique as jest.Mock).mockResolvedValue(mockProof);

      await expect(service.deleteProof(1, 100)).rejects.toThrow(
        'Only uploader can delete proof within 5 minutes'
      );
    });

    it('should reject deletion by non-uploader', async () => {
      const recentDate = new Date(Date.now() - 2 * 60 * 1000);
      const mockProof = {
        id: 1,
        matchId: 1,
        uploadedBy: 100,
        uploadedAt: recentDate,
      };

      (mockPrisma.proofOfPayment.findUnique as jest.Mock).mockResolvedValue(mockProof);

      await expect(service.deleteProof(1, 999)).rejects.toThrow(
        'Only uploader can delete proof within 5 minutes'
      );
    });
  });
});
