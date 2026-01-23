/**
 * Escrow Decision Authority Service Tests
 * Phase 4: Button-Style Integration
 * 
 * CRITICAL: Tests enforce HARD RULE:
 * - Escrow NEVER releases funds without APPROVED decision
 * - NO fallback auto-approve
 */

import { EscrowDecisionAuthorityService, EscrowReleaseBlockedError } from '../escrowDecisionAuthority.service';
import { DecisionAuthorityClient, AssetType, DecisionStatus } from '../../../../shared/clients/DecisionAuthorityClient';

jest.mock('../../../../shared/clients/DecisionAuthorityClient');
jest.mock('../config/decisionAuthority.config', () => ({
  getDecisionAuthorityConfig: jest.fn()
}));

const { getDecisionAuthorityConfig } = require('../config/decisionAuthority.config');

describe('EscrowDecisionAuthorityService', () => {
  let service: EscrowDecisionAuthorityService;
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
      service = new EscrowDecisionAuthorityService();
    });

    it('should allow escrow release (legacy behavior)', async () => {
      const result = await service.canReleaseEscrow('escrow_123', 'order_456');

      expect(result).toBe(true);
      expect(mockDecisionClient.getDecisionsByAsset).not.toHaveBeenCalled();
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
      service = new EscrowDecisionAuthorityService();
    });

    describe('APPROVED decision', () => {
      it('should allow escrow release', async () => {
        const mockDecision = {
          id: 1,
          decisionId: 'dec_123',
          assetType: AssetType.ESCROW_RELEASE,
          assetId: 'escrow_123',
          status: DecisionStatus.APPROVED,
          decisionSource: 'INTERNAL',
          authority: 'MNBARH_INTERNAL',
          metadata: {},
          requestedAt: new Date(),
          decidedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        mockDecisionClient.getDecisionsByAsset.mockResolvedValue([mockDecision]);

        const result = await service.canReleaseEscrow('escrow_123', 'order_456');

        expect(result).toBe(true);
        expect(mockDecisionClient.getDecisionsByAsset).toHaveBeenCalledWith(
          AssetType.ESCROW_RELEASE,
          'escrow_123'
        );
      });
    });

    describe('PENDING decision', () => {
      it('should block escrow release', async () => {
        const mockDecision = {
          id: 1,
          decisionId: 'dec_123',
          assetType: AssetType.ESCROW_RELEASE,
          assetId: 'escrow_123',
          status: DecisionStatus.PENDING,
          decisionSource: 'EXTERNAL',
          authority: 'CUSTODII',
          metadata: {},
          requestedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        mockDecisionClient.getDecisionsByAsset.mockResolvedValue([mockDecision]);

        await expect(service.canReleaseEscrow('escrow_123', 'order_456'))
          .rejects
          .toThrow(EscrowReleaseBlockedError);

        try {
          await service.canReleaseEscrow('escrow_123', 'order_456');
        } catch (error) {
          expect(error).toBeInstanceOf(EscrowReleaseBlockedError);
          expect((error as EscrowReleaseBlockedError).reason).toBe('PENDING');
          expect((error as EscrowReleaseBlockedError).decisionId).toBe(1);
        }
      });
    });

    describe('REJECTED decision', () => {
      it('should block escrow release', async () => {
        const mockDecision = {
          id: 1,
          decisionId: 'dec_123',
          assetType: AssetType.ESCROW_RELEASE,
          assetId: 'escrow_123',
          status: DecisionStatus.REJECTED,
          decisionSource: 'EXTERNAL',
          authority: 'CUSTODII',
          reason: 'Fraud suspected',
          metadata: {},
          requestedAt: new Date(),
          decidedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        mockDecisionClient.getDecisionsByAsset.mockResolvedValue([mockDecision]);

        await expect(service.canReleaseEscrow('escrow_123', 'order_456'))
          .rejects
          .toThrow(EscrowReleaseBlockedError);

        try {
          await service.canReleaseEscrow('escrow_123', 'order_456');
        } catch (error) {
          expect(error).toBeInstanceOf(EscrowReleaseBlockedError);
          expect((error as EscrowReleaseBlockedError).reason).toBe('REJECTED');
          expect(error.message).toContain('Fraud suspected');
        }
      });
    });

    describe('NO decision found', () => {
      it('should block escrow release', async () => {
        mockDecisionClient.getDecisionsByAsset.mockResolvedValue([]);

        await expect(service.canReleaseEscrow('escrow_123', 'order_456'))
          .rejects
          .toThrow(EscrowReleaseBlockedError);

        try {
          await service.canReleaseEscrow('escrow_123', 'order_456');
        } catch (error) {
          expect(error).toBeInstanceOf(EscrowReleaseBlockedError);
          expect((error as EscrowReleaseBlockedError).reason).toBe('NOT_FOUND');
        }
      });
    });

    describe('Decision Authority ERROR', () => {
      it('should block escrow release (NO fallback)', async () => {
        mockDecisionClient.getDecisionsByAsset.mockRejectedValue(new Error('Network timeout'));

        await expect(service.canReleaseEscrow('escrow_123', 'order_456'))
          .rejects
          .toThrow(EscrowReleaseBlockedError);

        try {
          await service.canReleaseEscrow('escrow_123', 'order_456');
        } catch (error) {
          expect(error).toBeInstanceOf(EscrowReleaseBlockedError);
          expect((error as EscrowReleaseBlockedError).reason).toBe('ERROR');
          expect(error.message).toContain('retriable');
        }
      });
    });

    describe('requestEscrowReleaseDecision', () => {
      it('should request decision successfully', async () => {
        const mockDecision = {
          id: 1,
          decisionId: 'dec_123',
          assetType: AssetType.ESCROW_RELEASE,
          assetId: 'escrow_123',
          status: DecisionStatus.PENDING,
          decisionSource: 'EXTERNAL',
          authority: 'CUSTODII',
          metadata: {},
          requestedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        mockDecisionClient.requestDecision.mockResolvedValue(mockDecision);

        const result = await service.requestEscrowReleaseDecision('escrow_123', { amount: 1000 });

        expect(result.decisionId).toBe(1);
        expect(result.status).toBe(DecisionStatus.PENDING);
        expect(mockDecisionClient.requestDecision).toHaveBeenCalledWith({
          assetType: AssetType.ESCROW_RELEASE,
          assetId: 'escrow_123',
          metadata: { amount: 1000 }
        });
      });

      it('should throw error if disabled', async () => {
        getDecisionAuthorityConfig.mockReturnValue({
          enabled: false,
          baseUrl: 'http://localhost:3010',
          timeout: 30000
        });

        mockDecisionClient.isEnabled.mockReturnValue(false);
        service = new EscrowDecisionAuthorityService();

        await expect(service.requestEscrowReleaseDecision('escrow_123'))
          .rejects
          .toThrow('Decision Authority is disabled');
      });
    });
  });
});
