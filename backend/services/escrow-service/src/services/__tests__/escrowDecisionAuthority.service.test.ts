/**
 * Escrow Decision Authority Service Tests
 * Tests decision authority integration for escrow operations
 * CRITICAL: Escrow NEVER releases funds without APPROVED decision
 */

import { PrismaClient, DispositionStatus } from '@prisma/client';
import { EscrowDecisionAuthorityService } from '../escrowDecisionAuthority.service';
import { DecisionAuthorityClient, DecisionStatus } from '../../../../shared/clients/DecisionAuthorityClient';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    escrowHold: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// Mock DecisionAuthorityClient
jest.mock('../../../../shared/clients/DecisionAuthorityClient', () => {
  return {
    DecisionAuthorityClient: jest.fn(),
    AssetType: {
      AUCTION: 'AUCTION',
      LISTING: 'LISTING',
      ESCROW_RELEASE: 'ESCROW_RELEASE',
    },
    DecisionStatus: {
      PENDING: 'PENDING',
      APPROVED: 'APPROVED',
      REJECTED: 'REJECTED',
      EXPIRED: 'EXPIRED',
      CANCELLED: 'CANCELLED',
    },
  };
});

// Mock config
jest.mock('../../config/decisionAuthority.config', () => {
  return {
    getDecisionAuthorityConfig: jest.fn(() => ({
      enabled: true,
      url: 'http://localhost:3010',
    })),
  };
});

describe('EscrowDecisionAuthorityService', () => {
  let service: EscrowDecisionAuthorityService;
  let mockPrisma: any;
  let mockDecisionClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = (require('@prisma/client').PrismaClient as any)();
    mockDecisionClient = new (require('../../../../shared/clients/DecisionAuthorityClient').DecisionAuthorityClient as any)();
    service = new EscrowDecisionAuthorityService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestEscrowReleaseDecision', () => {
    it('should request decision when enabled', async () => {
      const escrowId = 1;
      const metadata = {
        amount: 1000,
        buyerId: 1,
        sellerId: 2,
      };

      const mockDecision = {
        id: 1,
        decisionRef: 'DEC-001',
        status: DecisionStatus.APPROVED,
        decidedAt: new Date(),
      };

      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockDecisionClient.requestDecision = jest.fn().mockResolvedValue(mockDecision);
      mockPrisma.escrowHold.update = jest.fn().mockResolvedValue({
        id: escrowId,
        dispositionStatus: 'APPROVED',
      });

      const result = await service.requestEscrowReleaseDecision(escrowId, metadata);

      expect(mockDecisionClient.requestDecision).toHaveBeenCalledWith({
        assetType: 'ESCROW_RELEASE',
        assetId: escrowId,
        metadata,
      });

      expect(mockPrisma.escrowHold.update).toHaveBeenCalledWith({
        where: { id: escrowId },
        data: expect.objectContaining({
          decisionId: 1,
          decisionRef: 'DEC-001',
          dispositionStatus: 'APPROVED',
        }),
      });

      expect(result).toEqual(mockDecision);
    });

    it('should return null when disabled', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(false);

      const result = await service.requestEscrowReleaseDecision(1, {});

      expect(result).toBeNull();
      expect(mockDecisionClient.requestDecision).not.toHaveBeenCalled();
    });

    it('should handle decision request errors gracefully', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockDecisionClient.requestDecision = jest.fn().mockRejectedValue(new Error('API Error'));

      const result = await service.requestEscrowReleaseDecision(1, {});

      expect(result).toBeNull();
    });
  });

  describe('isEscrowApprovedForRelease', () => {
    it('should return true when decision authority disabled', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(false);

      const result = await service.isEscrowApprovedForRelease(1);

      expect(result).toBe(true);
      expect(mockPrisma.escrowHold.findUnique).not.toHaveBeenCalled();
    });

    it('should return true when escrow is APPROVED', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockPrisma.escrowHold.findUnique = jest.fn().mockResolvedValue({
        dispositionStatus: 'APPROVED',
      });

      const result = await service.isEscrowApprovedForRelease(1);

      expect(result).toBe(true);
    });

    it('should return false when escrow is PENDING', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockPrisma.escrowHold.findUnique = jest.fn().mockResolvedValue({
        dispositionStatus: 'PENDING',
      });

      const result = await service.isEscrowApprovedForRelease(1);

      expect(result).toBe(false);
    });

    it('should return false when escrow is REJECTED', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockPrisma.escrowHold.findUnique = jest.fn().mockResolvedValue({
        dispositionStatus: 'REJECTED',
      });

      const result = await service.isEscrowApprovedForRelease(1);

      expect(result).toBe(false);
    });

    it('should return false when escrow not found', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockPrisma.escrowHold.findUnique = jest.fn().mockResolvedValue(null);

      const result = await service.isEscrowApprovedForRelease(999);

      expect(result).toBe(false);
    });
  });

  describe('updateDispositionStatus', () => {
    it('should update disposition status when enabled', async () => {
      const mockDecision = {
        id: 1,
        status: DecisionStatus.APPROVED,
        decidedAt: new Date(),
      };

      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockDecisionClient.getDecision = jest.fn().mockResolvedValue(mockDecision);
      mockPrisma.escrowHold.update = jest.fn().mockResolvedValue({});

      await service.updateDispositionStatus(1, 1);

      expect(mockDecisionClient.getDecision).toHaveBeenCalledWith(1);
      expect(mockPrisma.escrowHold.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          dispositionStatus: 'APPROVED',
        }),
      });
    });

    it('should return null when disabled', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(false);

      const result = await service.updateDispositionStatus(1, 1);

      expect(result).toBeNull();
    });

    it('should return null when decision not found', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockDecisionClient.getDecision = jest.fn().mockResolvedValue(null);

      const result = await service.updateDispositionStatus(1, 999);

      expect(result).toBeNull();
    });
  });

  describe('autoApproveEscrow', () => {
    it('should auto-approve escrow', async () => {
      mockPrisma.escrowHold.update = jest.fn().mockResolvedValue({
        id: 1,
        dispositionStatus: 'APPROVED',
      });

      const result = await service.autoApproveEscrow(1);

      expect(mockPrisma.escrowHold.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          dispositionStatus: 'APPROVED',
        }),
      });

      expect(result.dispositionStatus).toBe('APPROVED');
    });
  });

  describe('getEscrowDecisionStatus', () => {
    it('should return escrow decision status', async () => {
      const mockStatus = {
        dispositionStatus: 'APPROVED',
        decisionId: 1,
        decisionRef: 'DEC-001',
        decisionRequestedAt: new Date(),
        decisionDecidedAt: new Date(),
      };

      mockPrisma.escrowHold.findUnique = jest.fn().mockResolvedValue(mockStatus);

      const result = await service.getEscrowDecisionStatus(1);

      expect(result).toEqual(mockStatus);
    });

    it('should return null when escrow not found', async () => {
      mockPrisma.escrowHold.findUnique = jest.fn().mockResolvedValue(null);

      const result = await service.getEscrowDecisionStatus(999);

      expect(result).toBeNull();
    });
  });

  describe('getPendingEscrowReleases', () => {
    it('should return pending escrow releases when enabled', async () => {
      const mockPending = [
        { id: 1, dispositionStatus: 'PENDING' },
        { id: 2, dispositionStatus: 'PENDING' },
      ];

      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockPrisma.escrowHold.findMany = jest.fn().mockResolvedValue(mockPending);

      const result = await service.getPendingEscrowReleases();

      expect(result).toEqual(mockPending);
    });

    it('should return empty array when disabled', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(false);

      const result = await service.getPendingEscrowReleases();

      expect(result).toEqual([]);
    });
  });

  describe('getRejectedEscrowReleases', () => {
    it('should return rejected escrow releases when enabled', async () => {
      const mockRejected = [
        { id: 1, dispositionStatus: 'REJECTED' },
        { id: 2, dispositionStatus: 'REJECTED' },
      ];

      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockPrisma.escrowHold.findMany = jest.fn().mockResolvedValue(mockRejected);

      const result = await service.getRejectedEscrowReleases();

      expect(result).toEqual(mockRejected);
    });

    it('should return empty array when disabled', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(false);

      const result = await service.getRejectedEscrowReleases();

      expect(result).toEqual([]);
    });
  });

  describe('isEnabled', () => {
    it('should return true when decision authority enabled', () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);

      const result = service.isEnabled();

      expect(result).toBe(true);
    });

    it('should return false when decision authority disabled', () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(false);

      const result = service.isEnabled();

      expect(result).toBe(false);
    });
  });

  describe('CRITICAL: Escrow Release Protection', () => {
    it('should BLOCK release when decision authority enabled but not APPROVED', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockPrisma.escrowHold.findUnique = jest.fn().mockResolvedValue({
        dispositionStatus: 'PENDING',
      });

      const isApproved = await service.isEscrowApprovedForRelease(1);

      expect(isApproved).toBe(false);
      // This should prevent the escrow release in the calling code
    });

    it('should BLOCK release when decision authority enabled and REJECTED', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockPrisma.escrowHold.findUnique = jest.fn().mockResolvedValue({
        dispositionStatus: 'REJECTED',
      });

      const isApproved = await service.isEscrowApprovedForRelease(1);

      expect(isApproved).toBe(false);
      // This should prevent the escrow release in the calling code
    });

    it('should ALLOW release only when APPROVED', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockPrisma.escrowHold.findUnique = jest.fn().mockResolvedValue({
        dispositionStatus: 'APPROVED',
      });

      const isApproved = await service.isEscrowApprovedForRelease(1);

      expect(isApproved).toBe(true);
      // This allows the escrow release in the calling code
    });
  });
});
