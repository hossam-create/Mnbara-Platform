/**
 * Auction Decision Authority Service Tests
 * Phase 4: Button-Style Integration
 */

import { AuctionDecisionAuthorityService } from '../auctionDecisionAuthority.service';
import { DecisionAuthorityClient, AssetType, DecisionStatus } from '../../../../shared/clients/DecisionAuthorityClient';

jest.mock('../../../../shared/clients/DecisionAuthorityClient');
jest.mock('../config/decisionAuthority.config', () => ({
  getDecisionAuthorityConfig: jest.fn()
}));

const { getDecisionAuthorityConfig } = require('../config/decisionAuthority.config');

describe('AuctionDecisionAuthorityService', () => {
  let service: AuctionDecisionAuthorityService;
  let mockDecisionClient: jest.Mocked<DecisionAuthorityClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDecisionClient = {
      isEnabled: jest.fn(),
      requestDecision: jest.fn(),
      getDecision: jest.fn(),
      getDecisionByDecisionId: jest.fn(),
      getDecisionsByAsset: jest.fn()
    } as any;

    (DecisionAuthorityClient as jest.MockedClass<typeof DecisionAuthorityClient>).mockImplementation(() => mockDecisionClient);
  });

  describe('when Decision Authority is DISABLED', () => {
    beforeEach(() => {
      getDecisionAuthorityConfig.mockReturnValue({
        enabled: false,
        baseUrl: 'http://localhost:3010',
        timeout: 30000
      });

      mockDecisionClient.isEnabled.mockReturnValue(false);
      service = new AuctionDecisionAuthorityService();
    });

    it('should auto-approve auction activation', async () => {
      const result = await service.requestAuctionActivationDecision(1);

      expect(result.approved).toBe(true);
      expect(mockDecisionClient.requestDecision).not.toHaveBeenCalled();
    });

    it('should always return true for isAuctionApproved', async () => {
      const result = await service.isAuctionApproved(1);

      expect(result).toBe(true);
    });
  });

  describe('when Decision Authority is ENABLED', () => {
    beforeEach(() => {
      getDecisionAuthorityConfig.mockReturnValue({
        enabled: true,
        baseUrl: 'http://localhost:3010',
        timeout: 30000
      });

      mockDecisionClient.isEnabled.mockReturnValue(true);
      service = new AuctionDecisionAuthorityService();
    });

    it('should request decision for auction activation', async () => {
      const mockDecision = {
        id: 1,
        decisionId: 'dec_123',
        assetType: AssetType.AUCTION,
        assetId: '1',
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

      const result = await service.requestAuctionActivationDecision(1, { test: 'data' });

      expect(result.approved).toBe(true);
      expect(result.decisionId).toBe(1);
      expect(mockDecisionClient.requestDecision).toHaveBeenCalledWith({
        assetType: AssetType.AUCTION,
        assetId: '1',
        metadata: { test: 'data' }
      });
    });

    it('should handle PENDING decision status', async () => {
      const mockDecision = {
        id: 1,
        decisionId: 'dec_123',
        assetType: AssetType.AUCTION,
        assetId: '1',
        status: DecisionStatus.PENDING,
        decisionSource: 'EXTERNAL',
        authority: 'CUSTODII',
        metadata: {},
        requestedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDecisionClient.requestDecision.mockResolvedValue(mockDecision);

      const result = await service.requestAuctionActivationDecision(1);

      expect(result.approved).toBe(false);
      expect(result.decisionId).toBe(1);
    });

    it('should handle REJECTED decision status', async () => {
      const mockDecision = {
        id: 1,
        decisionId: 'dec_123',
        assetType: AssetType.AUCTION,
        assetId: '1',
        status: DecisionStatus.REJECTED,
        decisionSource: 'EXTERNAL',
        authority: 'CUSTODII',
        reason: 'Prohibited item',
        metadata: {},
        requestedAt: new Date(),
        decidedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDecisionClient.requestDecision.mockResolvedValue(mockDecision);

      const result = await service.requestAuctionActivationDecision(1);

      expect(result.approved).toBe(false);
      expect(result.reason).toBe('Prohibited item');
    });

    it('should fallback to auto-approve on error', async () => {
      mockDecisionClient.requestDecision.mockRejectedValue(new Error('Network error'));

      const result = await service.requestAuctionActivationDecision(1);

      expect(result.approved).toBe(true);
    });

    it('should fallback to auto-approve on null response', async () => {
      mockDecisionClient.requestDecision.mockResolvedValue(null);

      const result = await service.requestAuctionActivationDecision(1);

      expect(result.approved).toBe(true);
    });
  });
});
