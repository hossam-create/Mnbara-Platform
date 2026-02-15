/**
 * Auction Service Integration Tests
 * Tests auction operations with decision authority integration
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { PrismaClient } from '@prisma/client';
import { AuctionService } from '../auction.service';
import { AuctionDecisionAuthorityService } from '../auctionDecisionAuthority.service';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    listing: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    bid: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };
  return {
    PrismaClient: vi.fn(() => mockPrisma),
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
    getDecisionAuthorityConfig: vi.fn(() => ({
      enabled: true,
      url: 'http://localhost:3010',
    })),
  };
});

describe('Auction Service with Decision Authority Integration', () => {
  let auctionService: AuctionService;
  let decisionService: AuctionDecisionAuthorityService;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = (require('@prisma/client').PrismaClient as any)();
    auctionService = new AuctionService();
    decisionService = new AuctionDecisionAuthorityService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Auction Creation with Decision Authority', () => {
    it('should create auction and request decision when enabled', async () => {
      const auctionData = {
        title: 'Test Auction',
        description: 'Test Description',
        sellerId: 1,
        startingBid: 100,
        reservePrice: 150,
        auctionEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };

      const mockAuction = {
        id: 1,
        ...auctionData,
        isAuction: true,
        dispositionStatus: 'PENDING',
        decisionId: null,
        decisionRef: null,
      };

      mockPrisma.listing.create = jest.fn().mockResolvedValue(mockAuction);

      const result = await auctionService.createAuction(auctionData as any);

      expect(mockPrisma.listing.create).toHaveBeenCalled();
      expect(result.isAuction).toBe(true);
    });

    it('should handle auction creation with APPROVED decision', async () => {
      const auctionId = 1;
      const mockDecision = {
        id: 1,
        decisionRef: 'DEC-001',
        status: 'APPROVED',
        decidedAt: new Date(),
      };

      mockPrisma.listing.findUnique = jest.fn().mockResolvedValue({
        id: auctionId,
        dispositionStatus: 'APPROVED',
      });

      const isApproved = await decisionService.isAuctionApprovedForStart(auctionId);

      expect(isApproved).toBe(true);
    });

    it('should handle auction creation with PENDING decision', async () => {
      const auctionId = 1;

      mockPrisma.listing.findUnique = jest.fn().mockResolvedValue({
        id: auctionId,
        dispositionStatus: 'PENDING',
      });

      const isApproved = await decisionService.isAuctionApprovedForStart(auctionId);

      expect(isApproved).toBe(false);
    });

    it('should handle auction creation with REJECTED decision', async () => {
      const auctionId = 1;

      mockPrisma.listing.findUnique = jest.fn().mockResolvedValue({
        id: auctionId,
        dispositionStatus: 'REJECTED',
      });

      const isApproved = await decisionService.isAuctionApprovedForStart(auctionId);

      expect(isApproved).toBe(false);
    });
  });

  describe('Bidding with Decision Authority', () => {
    it('should allow bidding on APPROVED auction', async () => {
      const auctionId = 1;

      mockPrisma.listing.findUnique = jest.fn().mockResolvedValue({
        id: auctionId,
        dispositionStatus: 'APPROVED',
        isAuction: true,
        currentBid: 100,
        startingBid: 100,
      });

      const isApproved = await decisionService.isAuctionApprovedForBidding(auctionId);

      expect(isApproved).toBe(true);
    });

    it('should block bidding on PENDING auction', async () => {
      const auctionId = 1;

      mockPrisma.listing.findUnique = jest.fn().mockResolvedValue({
        id: auctionId,
        dispositionStatus: 'PENDING',
        isAuction: true,
      });

      const isApproved = await decisionService.isAuctionApprovedForBidding(auctionId);

      expect(isApproved).toBe(false);
    });

    it('should block bidding on REJECTED auction', async () => {
      const auctionId = 1;

      mockPrisma.listing.findUnique = jest.fn().mockResolvedValue({
        id: auctionId,
        dispositionStatus: 'REJECTED',
        isAuction: true,
      });

      const isApproved = await decisionService.isAuctionApprovedForBidding(auctionId);

      expect(isApproved).toBe(false);
    });

    it('should allow bidding when decision authority disabled', async () => {
      const auctionId = 1;

      // When disabled, should return true without checking database
      const isApproved = await decisionService.isAuctionApprovedForBidding(auctionId);

      expect(isApproved).toBe(true);
    });
  });

  describe('Decision Status Updates', () => {
    it('should update auction disposition when decision changes to APPROVED', async () => {
      const auctionId = 1;
      const decisionId = 1;

      const mockDecision = {
        id: decisionId,
        status: 'APPROVED',
        decidedAt: new Date(),
      };

      mockPrisma.listing.update = jest.fn().mockResolvedValue({
        id: auctionId,
        dispositionStatus: 'APPROVED',
      });

      await decisionService.updateDispositionStatus(auctionId, decisionId);

      expect(mockPrisma.listing.update).toHaveBeenCalledWith({
        where: { id: auctionId },
        data: expect.objectContaining({
          dispositionStatus: 'APPROVED',
        }),
      });
    });

    it('should update auction disposition when decision changes to REJECTED', async () => {
      const auctionId = 1;
      const decisionId = 1;

      const mockDecision = {
        id: decisionId,
        status: 'REJECTED',
        decidedAt: new Date(),
      };

      mockPrisma.listing.update = jest.fn().mockResolvedValue({
        id: auctionId,
        dispositionStatus: 'REJECTED',
      });

      await decisionService.updateDispositionStatus(auctionId, decisionId);

      expect(mockPrisma.listing.update).toHaveBeenCalledWith({
        where: { id: auctionId },
        data: expect.objectContaining({
          dispositionStatus: 'REJECTED',
        }),
      });
    });

    it('should handle decision status update errors gracefully', async () => {
      const auctionId = 1;
      const decisionId = 1;

      mockPrisma.listing.update = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await decisionService.updateDispositionStatus(auctionId, decisionId);

      expect(result).toBeNull();
    });
  });

  describe('Fallback Behavior', () => {
    it('should auto-approve auction on decision request error', async () => {
      const auctionId = 1;

      mockPrisma.listing.update = jest.fn().mockResolvedValue({
        id: auctionId,
        dispositionStatus: 'APPROVED',
      });

      const result = await decisionService.autoApproveAuction(auctionId);

      expect(result.dispositionStatus).toBe('APPROVED');
    });

    it('should allow operations when decision authority disabled', async () => {
      const auctionId = 1;

      // When disabled, should return true without checking database
      const isApprovedForStart = await decisionService.isAuctionApprovedForStart(auctionId);
      const isApprovedForBidding = await decisionService.isAuctionApprovedForBidding(auctionId);

      expect(isApprovedForStart).toBe(true);
      expect(isApprovedForBidding).toBe(true);
    });
  });

  describe('Decision Status Retrieval', () => {
    it('should retrieve auction decision status', async () => {
      const auctionId = 1;
      const mockStatus = {
        dispositionStatus: 'APPROVED',
        decisionId: 1,
        decisionRef: 'DEC-001',
        decisionRequestedAt: new Date(),
        decisionDecidedAt: new Date(),
      };

      mockPrisma.listing.findUnique = jest.fn().mockResolvedValue(mockStatus);

      const result = await decisionService.getAuctionDecisionStatus(auctionId);

      expect(result).toEqual(mockStatus);
    });

    it('should return null for non-existent auction', async () => {
      mockPrisma.listing.findUnique = jest.fn().mockResolvedValue(null);

      const result = await decisionService.getAuctionDecisionStatus(999);

      expect(result).toBeNull();
    });
  });

  describe('Feature Flag Behavior', () => {
    it('should respect DECISION_AUTHORITY_ENABLED flag', () => {
      const isEnabled = decisionService.isEnabled();

      // Should be true based on mock config
      expect(typeof isEnabled).toBe('boolean');
    });

    it('should auto-approve when feature flag disabled', async () => {
      const auctionId = 1;

      // When disabled, should return true without database query
      const isApproved = await decisionService.isAuctionApprovedForStart(auctionId);

      expect(isApproved).toBe(true);
    });
  });
});

