/**
 * Auction Decision Authority Service Tests
 * Tests decision authority integration for auction operations
 */

import { PrismaClient, DispositionStatus } from '@prisma/client';
import { AuctionDecisionAuthorityService } from '../auctionDecisionAuthority.service';
import { DecisionAuthorityClient, DecisionStatus } from '../../../../shared/clients/DecisionAuthorityClient';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    listing: {
      findUnique: jest.fn(),
      update: jest.fn(),
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

describe('AuctionDecisionAuthorityService', () => {
  let service: AuctionDecisionAuthorityService;
  let mockPrisma: any;
  let mockDecisionClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = (require('@prisma/client').PrismaClient as any)();
    mockDecisionClient = new (require('../../../../shared/clients/DecisionAuthorityClient').DecisionAuthorityClient as any)();
    service = new AuctionDecisionAuthorityService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestAuctionDecision', () => {
    it('should request decision when enabled', async () => {
      const auctionId = 1;
      const metadata = {
        title: 'Test Auction',
        startingBid: 100,
        sellerId: 1,
      };

      const mockDecision = {
        id: 1,
        decisionRef: 'DEC-001',
        status: DecisionStatus.APPROVED,
        decidedAt: new Date(),
      };

      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockDecisionClient.requestDecision = jest.fn().mockResolvedValue(mockDecision);
      mockPrisma.listing.update = jest.fn().mockResolvedValue({
        id: auctionId,
        dispositionStatus: 'APPROVED',
      });

      const result = await service.requestAuctionDecision(auctionId, metadata);

      expect(mockDecisionClient.requestDecision).toHaveBeenCalledWith({
        assetType: 'AUCTION',
        assetId: auctionId,
        metadata,
      });

      expect(mockPrisma.listing.update).toHaveBeenCalledWith({
        where: { id: auctionId },
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

      const result = await service.requestAuctionDecision(1, {});

      expect(result).toBeNull();
      expect(mockDecisionClient.requestDecision).not.toHaveBeenCalled();
    });

    it('should handle decision request errors gracefully', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockDecisionClient.requestDecision = jest.fn().mockRejectedValue(new Error('API Error'));

      const result = await service.requestAuctionDecision(1, {});

      expect(result).toBeNull();
    });

    it('should map PENDING decision status correctly', async () => {
      const mockDecision = {
        id: 1,
        decisionRef: 'DEC-001',
        status: DecisionStatus.PENDING,
        decidedAt: null,
      };

      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockDecisionClient.requestDecision = jest.fn().mockResolvedValue(mockDecision);
      mockPrisma.listing.update = jest.fn().mockResolvedValue({});

      await service.requestAuctionDecision(1, {});

      expect(mockPrisma.listing.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          dispositionStatus: 'PENDING',
        }),
      });
    });

    it('should map REJECTED decision status correctly', async () => {
      const mockDecision = {
        id: 1,
        decisionRef: 'DEC-001',
        status: DecisionStatus.REJECTED,
        decidedAt: new Date(),
      };

      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockDecisionClient.requestDecision = jest.fn().mockResolvedValue(mockDecision);
      mockPrisma.listing.update = jest.fn().mockResolvedValue({});

      await service.requestAuctionDecision(1, {});

      expect(mockPrisma.listing.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          dispositionStatus: 'REJECTED',
        }),
      });
    });
  });

  describe('isAuctionApprovedForBidding', () => {
    it('should return true when decision authority disabled', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(false);

      const result = await service.isAuctionApprovedForBidding(1);

      expect(result).toBe(true);
      expect(mockPrisma.listing.findUnique).not.toHaveBeenCalled();
    });

    it('should return true when auction is APPROVED', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockPrisma.listing.findUnique = jest.fn().mockResolvedValue({
        dispositionStatus: 'APPROVED',
      });

      const result = await service.isAuctionApprovedForBidding(1);

      expect(result).toBe(true);
    });

    it('should return false when auction is PENDING', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockPrisma.listing.findUnique = jest.fn().mockResolvedValue({
        dispositionStatus: 'PENDING',
      });

      const result = await service.isAuctionApprovedForBidding(1);

      expect(result).toBe(false);
    });

    it('should return false when auction is REJECTED', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockPrisma.listing.findUnique = jest.fn().mockResolvedValue({
        dispositionStatus: 'REJECTED',
      });

      const result = await service.isAuctionApprovedForBidding(1);

      expect(result).toBe(false);
    });

    it('should return false when auction not found', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockPrisma.listing.findUnique = jest.fn().mockResolvedValue(null);

      const result = await service.isAuctionApprovedForBidding(999);

      expect(result).toBe(false);
    });
  });

  describe('isAuctionApprovedForStart', () => {
    it('should return true when decision authority disabled', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(false);

      const result = await service.isAuctionApprovedForStart(1);

      expect(result).toBe(true);
    });

    it('should return true when auction is APPROVED', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockPrisma.listing.findUnique = jest.fn().mockResolvedValue({
        dispositionStatus: 'APPROVED',
      });

      const result = await service.isAuctionApprovedForStart(1);

      expect(result).toBe(true);
    });

    it('should return false when auction is PENDING', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockPrisma.listing.findUnique = jest.fn().mockResolvedValue({
        dispositionStatus: 'PENDING',
      });

      const result = await service.isAuctionApprovedForStart(1);

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
      mockPrisma.listing.update = jest.fn().mockResolvedValue({});

      await service.updateDispositionStatus(1, 1);

      expect(mockDecisionClient.getDecision).toHaveBeenCalledWith(1);
      expect(mockPrisma.listing.update).toHaveBeenCalledWith({
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

    it('should handle errors gracefully', async () => {
      mockDecisionClient.isEnabled = jest.fn().mockReturnValue(true);
      mockDecisionClient.getDecision = jest.fn().mockRejectedValue(new Error('API Error'));

      const result = await service.updateDispositionStatus(1, 1);

      expect(result).toBeNull();
    });
  });

  describe('autoApproveAuction', () => {
    it('should auto-approve auction', async () => {
      mockPrisma.listing.update = jest.fn().mockResolvedValue({
        id: 1,
        dispositionStatus: 'APPROVED',
      });

      const result = await service.autoApproveAuction(1);

      expect(mockPrisma.listing.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          dispositionStatus: 'APPROVED',
        }),
      });

      expect(result.dispositionStatus).toBe('APPROVED');
    });
  });

  describe('getAuctionDecisionStatus', () => {
    it('should return auction decision status', async () => {
      const mockStatus = {
        dispositionStatus: 'APPROVED',
        decisionId: 1,
        decisionRef: 'DEC-001',
        decisionRequestedAt: new Date(),
        decisionDecidedAt: new Date(),
      };

      mockPrisma.listing.findUnique = jest.fn().mockResolvedValue(mockStatus);

      const result = await service.getAuctionDecisionStatus(1);

      expect(result).toEqual(mockStatus);
    });

    it('should return null when auction not found', async () => {
      mockPrisma.listing.findUnique = jest.fn().mockResolvedValue(null);

      const result = await service.getAuctionDecisionStatus(999);

      expect(result).toBeNull();
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
});

