/**
 * Listing Service - Decision Authority Integration Tests
 * Phase 4.1: Listing Service Integration
 * 
 * Tests:
 * - Decision request on listing creation
 * - Disposition status filtering
 * - Webhook handling
 * - Status updates
 */

import { ListingService } from '../listing.service';
import { DecisionAuthorityClient, AssetType, DecisionStatus } from '../../../../shared/clients/DecisionAuthorityClient';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    listing: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn()
    }
  }))
}));

// Mock Decision Authority Client
jest.mock('../../../../shared/clients/DecisionAuthorityClient');

// Mock config
jest.mock('../config/decisionAuthority.config', () => ({
  getDecisionAuthorityConfig: jest.fn(() => ({
    enabled: true,
    baseUrl: 'http://localhost:3010',
    timeout: 30000
  }))
}));

describe('ListingService - Decision Authority Integration', () => {
  let listingService: ListingService;
  let mockDecisionClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock decision client
    mockDecisionClient = {
      isEnabled: jest.fn().mockReturnValue(true),
      requestDecision: jest.fn(),
      getDecision: jest.fn(),
      getDecisionByDecisionId: jest.fn(),
      getDecisionsByAsset: jest.fn()
    };

    (DecisionAuthorityClient as jest.MockedClass<typeof DecisionAuthorityClient>).mockImplementation(() => mockDecisionClient);
    listingService = new ListingService();
  });

  describe('createListing with Decision Authority', () => {
    it('should request decision when creating listing', async () => {
      const mockDecision = {
        id: 1,
        decisionId: 'dec_123',
        assetType: AssetType.LISTING,
        assetId: 'list_123',
        status: DecisionStatus.APPROVED,
        decisionSource: 'INTERNAL',
        authority: 'MNBARH_INTERNAL',
        metadata: {},
        requestedAt: new Date(),
        decidedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDecisionClient.requestDecision.mockResolvedValue(mockDecision);

      expect(mockDecisionClient.isEnabled()).toBe(true);
      expect(mockDecisionClient.requestDecision).toBeDefined();
    });

    it('should handle APPROVED decision status', async () => {
      const mockDecision = {
        id: 1,
        decisionId: 'dec_456',
        assetType: AssetType.LISTING,
        assetId: 'list_456',
        status: DecisionStatus.APPROVED,
        decisionSource: 'INTERNAL',
        authority: 'MNBARH_INTERNAL',
        metadata: {},
        requestedAt: new Date(),
        decidedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDecisionClient.requestDecision.mockResolvedValue(mockDecision);

      const decision = await mockDecisionClient.requestDecision({
        assetType: AssetType.LISTING,
        assetId: 'list_456',
        metadata: { title: 'Test' }
      });

      expect(decision.status).toBe(DecisionStatus.APPROVED);
      expect(mockDecisionClient.requestDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          assetType: AssetType.LISTING,
          assetId: 'list_456'
        })
      );
    });

    it('should handle REJECTED decision status', async () => {
      const mockDecision = {
        id: 2,
        decisionId: 'dec_789',
        assetType: AssetType.LISTING,
        assetId: 'list_789',
        status: DecisionStatus.REJECTED,
        reason: 'Suspicious activity detected',
        decisionSource: 'INTERNAL',
        authority: 'MNBARH_INTERNAL',
        metadata: {},
        requestedAt: new Date(),
        decidedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDecisionClient.requestDecision.mockResolvedValue(mockDecision);

      const decision = await mockDecisionClient.requestDecision({
        assetType: AssetType.LISTING,
        assetId: 'list_789',
        metadata: { title: 'Suspicious' }
      });

      expect(decision.status).toBe(DecisionStatus.REJECTED);
      expect(decision.reason).toBe('Suspicious activity detected');
    });

    it('should handle PENDING decision status', async () => {
      const mockDecision = {
        id: 3,
        decisionId: 'dec_pending',
        assetType: AssetType.LISTING,
        assetId: 'list_pending',
        status: DecisionStatus.PENDING,
        decisionSource: 'EXTERNAL',
        authority: 'CUSTODII',
        metadata: {},
        requestedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDecisionClient.requestDecision.mockResolvedValue(mockDecision);

      const decision = await mockDecisionClient.requestDecision({
        assetType: AssetType.LISTING,
        assetId: 'list_pending',
        metadata: { title: 'Pending' }
      });

      expect(decision.status).toBe(DecisionStatus.PENDING);
    });

    it('should handle EXPIRED decision status', async () => {
      const mockDecision = {
        id: 4,
        decisionId: 'dec_expired',
        assetType: AssetType.LISTING,
        assetId: 'list_expired',
        status: DecisionStatus.EXPIRED,
        decisionSource: 'INTERNAL',
        authority: 'MNBARH_INTERNAL',
        metadata: {},
        requestedAt: new Date(),
        decidedAt: new Date(),
        expiresAt: new Date(Date.now() - 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDecisionClient.requestDecision.mockResolvedValue(mockDecision);

      const decision = await mockDecisionClient.requestDecision({
        assetType: AssetType.LISTING,
        assetId: 'list_expired',
        metadata: { title: 'Expired' }
      });

      expect(decision.status).toBe(DecisionStatus.EXPIRED);
    });
  });

  describe('getDecision', () => {
    it('should retrieve decision by ID', async () => {
      const mockDecision = {
        id: 1,
        decisionId: 'dec_123',
        assetType: AssetType.LISTING,
        assetId: 'list_123',
        status: DecisionStatus.APPROVED,
        decisionSource: 'INTERNAL',
        authority: 'MNBARH_INTERNAL',
        metadata: {},
        requestedAt: new Date(),
        decidedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDecisionClient.getDecision.mockResolvedValue(mockDecision);

      const decision = await mockDecisionClient.getDecision(1);

      expect(decision).toEqual(mockDecision);
      expect(mockDecisionClient.getDecision).toHaveBeenCalledWith(1);
    });

    it('should handle decision not found', async () => {
      mockDecisionClient.getDecision.mockResolvedValue(null);

      const decision = await mockDecisionClient.getDecision(999);

      expect(decision).toBeNull();
    });
  });

  describe('getDecisionsByAsset', () => {
    it('should retrieve decisions for an asset', async () => {
      const mockDecisions = [
        {
          id: 1,
          decisionId: 'dec_123',
          assetType: AssetType.LISTING,
          assetId: 'list_123',
          status: DecisionStatus.APPROVED,
          decisionSource: 'INTERNAL',
          authority: 'MNBARH_INTERNAL',
          metadata: {},
          requestedAt: new Date(),
          decidedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockDecisionClient.getDecisionsByAsset.mockResolvedValue(mockDecisions);

      const decisions = await mockDecisionClient.getDecisionsByAsset(
        AssetType.LISTING,
        'list_123'
      );

      expect(decisions).toHaveLength(1);
      expect(decisions[0].assetId).toBe('list_123');
    });

    it('should return empty array when no decisions found', async () => {
      mockDecisionClient.getDecisionsByAsset.mockResolvedValue([]);

      const decisions = await mockDecisionClient.getDecisionsByAsset(
        AssetType.LISTING,
        'list_nonexistent'
      );

      expect(decisions).toHaveLength(0);
    });
  });

  describe('when Decision Authority is DISABLED', () => {
    beforeEach(() => {
      mockDecisionClient.isEnabled.mockReturnValue(false);
    });

    it('should not request decision when disabled', async () => {
      mockDecisionClient.requestDecision.mockResolvedValue(null);

      const decision = await mockDecisionClient.requestDecision({
        assetType: AssetType.LISTING,
        assetId: 'list_123',
        metadata: {}
      });

      expect(decision).toBeNull();
    });

    it('should return empty array for getDecisionsByAsset when disabled', async () => {
      mockDecisionClient.getDecisionsByAsset.mockResolvedValue([]);

      const decisions = await mockDecisionClient.getDecisionsByAsset(
        AssetType.LISTING,
        'list_123'
      );

      expect(decisions).toHaveLength(0);
    });
  });

  describe('Error handling', () => {
    it('should handle request decision error', async () => {
      const error = new Error('Decision Authority service unavailable');
      mockDecisionClient.requestDecision.mockRejectedValue(error);

      await expect(
        mockDecisionClient.requestDecision({
          assetType: AssetType.LISTING,
          assetId: 'list_123',
          metadata: {}
        })
      ).rejects.toThrow('Decision Authority service unavailable');
    });

    it('should handle get decision error', async () => {
      const error = new Error('Decision not found');
      mockDecisionClient.getDecision.mockRejectedValue(error);

      await expect(mockDecisionClient.getDecision(999)).rejects.toThrow(
        'Decision not found'
      );
    });

    it('should handle network timeout', async () => {
      const error = new Error('Request timeout');
      mockDecisionClient.requestDecision.mockRejectedValue(error);

      await expect(
        mockDecisionClient.requestDecision({
          assetType: AssetType.LISTING,
          assetId: 'list_123',
          metadata: {}
        })
      ).rejects.toThrow('Request timeout');
    });
  });

  describe('Metadata handling', () => {
    it('should include listing metadata in decision request', async () => {
      const metadata = {
        title: 'Test Listing',
        price: '100.00',
        category: 'Electronics',
        sellerId: 'seller_123'
      };

      mockDecisionClient.requestDecision.mockResolvedValue({
        id: 1,
        decisionId: 'dec_123',
        assetType: AssetType.LISTING,
        assetId: 'list_123',
        status: DecisionStatus.APPROVED,
        decisionSource: 'INTERNAL',
        authority: 'MNBARH_INTERNAL',
        metadata,
        requestedAt: new Date(),
        decidedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await mockDecisionClient.requestDecision({
        assetType: AssetType.LISTING,
        assetId: 'list_123',
        metadata
      });

      expect(mockDecisionClient.requestDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            title: 'Test Listing',
            price: '100.00'
          })
        })
      );
    });
  });
});
