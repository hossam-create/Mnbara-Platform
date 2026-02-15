import { SettlementService } from '../services/Settlement.service';
import { AuctionSettlementState, AppealStatus, AppealReason } from '../types/Settlement.types';
import { settlementConfig } from '../config/settlement.config';

describe('Settlement Service', () => {
  let settlementService: SettlementService;

  beforeEach(() => {
    settlementService = new SettlementService();
  });

  afterEach(() => {
    settlementService.reset();
  });

  describe('Settlement Creation', () => {
    it('should create a valid settlement', async () => {
      const request = {
        auctionId: 'auction-1',
        sellerId: 'seller-1',
        winnerId: 'buyer-1',
        winningBidId: 'bid-1',
        winningAmount: 1000,
        settlementMethod: 'ESCROW'
      };

      const result = settlementService.createSettlement(request);

      expect(result.success).toBe(true);
      expect(result.settlement).toBeDefined();
      expect(result.settlement?.auctionId).toBe('auction-1');
      expect(result.settlement?.sellerId).toBe('seller-1');
      expect(result.settlement?.winnerId).toBe('buyer-1');
      expect(result.settlement?.winningAmount).toBe(1000);
      expect(result.settlement?.state).toBe(AuctionSettlementState.SETTLED);
      expect(result.settlement?.settledAt).toBeDefined();
      expect(result.appealWindow).toBeDefined();
      expect(result.appealWindow?.isActive).toBe(true);
    });

    it('should reject invalid settlement requests', async () => {
      const invalidRequest = {
        auctionId: '',
        sellerId: '',
        winningAmount: -100,
        settlementMethod: ''
      };

      const result = settlementService.createSettlement(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
    });

    it('should prevent duplicate settlements for same auction', async () => {
      const request = {
        auctionId: 'auction-1',
        sellerId: 'seller-1',
        winnerId: 'buyer-1',
        winningBidId: 'bid-1',
        winningAmount: 1000,
        settlementMethod: 'ESCROW'
      };

      // First settlement should succeed
      const firstResult = settlementService.createSettlement(request);
      expect(firstResult.success).toBe(true);

      // Second settlement should fail
      const secondResult = settlementService.createSettlement(request);
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toContain('already exists');
    });
  });

  describe('Appeal Creation', () => {
    let settlementId: string;

    beforeEach(() => {
      const settlementRequest = {
        auctionId: 'auction-1',
        sellerId: 'seller-1',
        winnerId: 'buyer-1',
        winningBidId: 'bid-1',
        winningAmount: 1000,
        settlementMethod: 'ESCROW'
      };

      const settlementResult = settlementService.createSettlement(settlementRequest);
      settlementId = settlementResult.settlement!.id;
    });

    it('should create a valid appeal', async () => {
      const appealRequest = {
        settlementId,
        appellantId: 'buyer-1',
        appellantRole: 'BUYER' as const,
        reason: AppealReason.WINNING_BID_INVALID,
        description: 'The winning bid was invalid due to technical issues',
        evidence: ['screenshot1.png', 'log.txt']
      };

      const result = settlementService.createAppeal(appealRequest);

      expect(result.success).toBe(true);
      expect(result.appeal).toBeDefined();
      expect(result.appeal?.settlementId).toBe(settlementId);
      expect(result.appeal?.appellantId).toBe('buyer-1');
      expect(result.appeal?.reason).toBe(AppealReason.WINNING_BID_INVALID);
      expect(result.appeal?.status).toBe(AppealStatus.PENDING);
      expect(result.canAppeal).toBe(true);
    });

    it('should reject appeals for non-existent settlements', async () => {
      const appealRequest = {
        settlementId: 'non-existent',
        appellantId: 'buyer-1',
        appellantRole: 'BUYER' as const,
        reason: AppealReason.WINNING_BID_INVALID,
        description: 'Invalid settlement'
      };

      const result = settlementService.createAppeal(appealRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Settlement not found');
      expect(result.canAppeal).toBe(false);
    });

    it('should reject appeals for finalized settlements', async () => {
      // Finalize settlement first
      settlementService.finalizeSettlement(settlementId);

      const appealRequest = {
        settlementId,
        appellantId: 'buyer-1',
        appellantRole: 'BUYER' as const,
        reason: AppealReason.WINNING_BID_INVALID,
        description: 'Appeal after finalization'
      };

      const result = settlementService.createAppeal(appealRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('finalized');
      expect(result.canAppeal).toBe(false);
    });

    it('should prevent duplicate appeals from same user', async () => {
      const appealRequest = {
        settlementId,
        appellantId: 'buyer-1',
        appellantRole: 'BUYER' as const,
        reason: AppealReason.WINNING_BID_INVALID,
        description: 'First appeal'
      };

      // First appeal should succeed
      const firstResult = settlementService.createAppeal(appealRequest);
      expect(firstResult.success).toBe(true);

      // Second appeal should fail
      const secondResult = settlementService.createAppeal(appealRequest);
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toContain('already appealed');
    });

    it('should validate appeal description length', async () => {
      const longDescription = 'a'.repeat(settlementConfig.maxAppealDescriptionLength + 1);
      const appealRequest = {
        settlementId,
        appellantId: 'buyer-1',
        appellantRole: 'BUYER' as const,
        reason: AppealReason.OTHER,
        description: longDescription
      };

      const result = settlementService.createAppeal(appealRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('description cannot exceed');
    });
  });

  describe('Appeal Eligibility', () => {
    let settlementId: string;

    beforeEach(() => {
      const settlementRequest = {
        auctionId: 'auction-1',
        sellerId: 'seller-1',
        winnerId: 'buyer-1',
        winningBidId: 'bid-1',
        winningAmount: 1000,
        settlementMethod: 'ESCROW'
      };

      const settlementResult = settlementService.createSettlement(settlementRequest);
      settlementId = settlementResult.settlement!.id;
    });

    it('should allow appeal for eligible user', async () => {
      const eligibility = settlementService.checkAppealEligibility(settlementId, 'buyer-1', 'BUYER');

      expect(eligibility.canAppeal).toBe(true);
      expect(eligibility.appealWindow).toBeDefined();
      expect(eligibility.deadline).toBeDefined();
    });

    it('should reject appeal for ineligible role', async () => {
      // Mock config to exclude OBSERVER role
      const originalRoles = settlementConfig.allowedAppealRoles;
      settlementConfig.allowedAppealRoles = ['BUYER', 'SELLER'];

      const eligibility = settlementService.checkAppealEligibility(settlementId, 'observer-1', 'OBSERVER');

      expect(eligibility.canAppeal).toBe(false);
      expect(eligibility.reason).toContain('role not allowed');

      // Restore original config
      settlementConfig.allowedAppealRoles = originalRoles;
    });

    it('should reject appeal after window expiry', async () => {
      // Manually expire the appeal window
      const appealWindow = settlementService.getAppealWindow(settlementId);
      if (appealWindow) {
        appealWindow.expiresAt = new Date(Date.now() - 1000); // 1 second ago
      }

      const eligibility = settlementService.checkAppealEligibility(settlementId, 'buyer-1', 'BUYER');

      expect(eligibility.canAppeal).toBe(false);
      expect(eligibility.reason).toContain('window has expired');
    });

    it('should reject appeal for finalized settlement', async () => {
      // Finalize settlement
      settlementService.finalizeSettlement(settlementId);

      const eligibility = settlementService.checkAppealEligibility(settlementId, 'buyer-1', 'BUYER');

      expect(eligibility.canAppeal).toBe(false);
      expect(eligibility.reason).toContain('finalized');
    });
  });

  describe('Settlement Finalization', () => {
    let settlementId: string;

    beforeEach(() => {
      const settlementRequest = {
        auctionId: 'auction-1',
        sellerId: 'seller-1',
        winnerId: 'buyer-1',
        winningBidId: 'bid-1',
        winningAmount: 1000,
        settlementMethod: 'ESCROW'
      };

      const settlementResult = settlementService.createSettlement(settlementRequest);
      settlementId = settlementResult.settlement!.id;
    });

    it('should finalize a valid settlement', async () => {
      const result = settlementService.finalizeSettlement(settlementId);

      expect(result.success).toBe(true);

      const settlement = settlementService.getSettlement(settlementId);
      expect(settlement?.state).toBe(AuctionSettlementState.SETTLEMENT_FINAL);
      expect(settlement?.finalizedAt).toBeDefined();

      const appealWindow = settlementService.getAppealWindow(settlementId);
      expect(appealWindow?.isActive).toBe(false);
      expect(appealWindow?.appealsAllowed).toBe(false);
    });

    it('should prevent finalizing already finalized settlement', async () => {
      // Finalize once
      settlementService.finalizeSettlement(settlementId);

      // Try to finalize again
      const result = settlementService.finalizeSettlement(settlementId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already finalized');
    });

    it('should reject finalization for non-existent settlement', async () => {
      const result = settlementService.finalizeSettlement('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Event Logging', () => {
    it('should log settlement creation events', async () => {
      const request = {
        auctionId: 'auction-1',
        sellerId: 'seller-1',
        winnerId: 'buyer-1',
        winningBidId: 'bid-1',
        winningAmount: 1000,
        settlementMethod: 'ESCROW'
      };

      settlementService.createSettlement(request);

      const events = settlementService.getEventLog();
      const settlementEvent = events.find(e => e.type === 'AUCTION_SETTLED');

      expect(settlementEvent).toBeDefined();
      expect(settlementEvent?.category).toBe('AUCTION_SETTLEMENT');
      expect(settlementEvent?.data.auctionId).toBe('auction-1');
      expect(settlementEvent?.data.sellerId).toBe('seller-1');
      expect(settlementEvent?.data.winnerId).toBe('buyer-1');
    });

    it('should log appeal creation events', async () => {
      const settlementRequest = {
        auctionId: 'auction-1',
        sellerId: 'seller-1',
        winnerId: 'buyer-1',
        winningBidId: 'bid-1',
        winningAmount: 1000,
        settlementMethod: 'ESCROW'
      };

      const settlementResult = settlementService.createSettlement(settlementRequest);
      const settlementId = settlementResult.settlement!.id;

      const appealRequest = {
        settlementId,
        appellantId: 'buyer-1',
        appellantRole: 'BUYER' as const,
        reason: AppealReason.WINNING_BID_INVALID,
        description: 'Test appeal'
      };

      settlementService.createAppeal(appealRequest);

      const events = settlementService.getEventLog();
      const appealEvent = events.find(e => e.type === 'APPEAL_OPENED');

      expect(appealEvent).toBeDefined();
      expect(appealEvent?.category).toBe('AUCTION_SETTLEMENT');
      expect(appealEvent?.data.settlementId).toBe(settlementId);
      expect(appealEvent?.data.reason).toBe(AppealReason.WINNING_BID_INVALID);
    });

    it('should log settlement finalization events', async () => {
      const settlementRequest = {
        auctionId: 'auction-1',
        sellerId: 'seller-1',
        winnerId: 'buyer-1',
        winningBidId: 'bid-1',
        winningAmount: 1000,
        settlementMethod: 'ESCROW'
      };

      const settlementResult = settlementService.createSettlement(settlementRequest);
      const settlementId = settlementResult.settlement!.id;

      settlementService.finalizeSettlement(settlementId);

      const events = settlementService.getEventLog();
      const finalizationEvent = events.find(e => e.type === 'SETTLEMENT_FINALIZED');

      expect(finalizationEvent).toBeDefined();
      expect(finalizationEvent?.category).toBe('AUCTION_SETTLEMENT');
      expect(finalizationEvent?.data.settlementId).toBe(settlementId);
    });
  });

  describe('Statistics', () => {
    it('should track settlement statistics correctly', async () => {
      const request = {
        auctionId: 'auction-1',
        sellerId: 'seller-1',
        winnerId: 'buyer-1',
        winningBidId: 'bid-1',
        winningAmount: 1000,
        settlementMethod: 'ESCROW'
      };

      settlementService.createSettlement(request);

      const stats = settlementService.getStatistics();

      expect(stats.totalSettlements).toBe(1);
      expect(stats.settledSettlements).toBe(1);
      expect(stats.finalizedSettlements).toBe(0);
    });

    it('should track appeal statistics correctly', async () => {
      const settlementRequest = {
        auctionId: 'auction-1',
        sellerId: 'seller-1',
        winnerId: 'buyer-1',
        winningBidId: 'bid-1',
        winningAmount: 1000,
        settlementMethod: 'ESCROW'
      };

      const settlementResult = settlementService.createSettlement(settlementRequest);
      const settlementId = settlementResult.settlement!.id;

      const appealRequest = {
        settlementId,
        appellantId: 'buyer-1',
        appellantRole: 'BUYER' as const,
        reason: AppealReason.WINNING_BID_INVALID,
        description: 'Test appeal'
      };

      settlementService.createAppeal(appealRequest);

      const stats = settlementService.getStatistics();

      expect(stats.totalAppeals).toBe(1);
      expect(stats.pendingAppeals).toBe(1);
      expect(stats.topAppealReasons).toHaveLength(1);
      expect(stats.topAppealReasons[0].reason).toBe(AppealReason.WINNING_BID_INVALID);
      expect(stats.topAppealReasons[0].count).toBe(1);
    });
  });

  describe('Appeal Window Processing', () => {
    it('should process expired appeal windows', async () => {
      const settlementRequest = {
        auctionId: 'auction-1',
        sellerId: 'seller-1',
        winnerId: 'buyer-1',
        winningBidId: 'bid-1',
        winningAmount: 1000,
        settlementMethod: 'ESCROW'
      };

      const settlementResult = settlementService.createSettlement(settlementRequest);
      const settlementId = settlementResult.settlement!.id;

      // Manually expire the appeal window
      const appealWindow = settlementService.getAppealWindow(settlementId);
      if (appealWindow) {
        appealWindow.expiresAt = new Date(Date.now() - 1000); // 1 second ago
      }

      settlementService.processExpiredAppealWindows();

      // Check that window is closed
      const updatedWindow = settlementService.getAppealWindow(settlementId);
      expect(updatedWindow?.isActive).toBe(false);
      expect(updatedWindow?.appealsAllowed).toBe(false);

      // Check that expiration event was logged
      const events = settlementService.getEventLog();
      const expirationEvent = events.find(e => e.type === 'APPEAL_WINDOW_EXPIRED');
      expect(expirationEvent).toBeDefined();
    });
  });

  describe('Data Retrieval', () => {
    let settlementId: string;
    let appealId: string;

    beforeEach(() => {
      const settlementRequest = {
        auctionId: 'auction-1',
        sellerId: 'seller-1',
        winnerId: 'buyer-1',
        winningBidId: 'bid-1',
        winningAmount: 1000,
        settlementMethod: 'ESCROW'
      };

      const settlementResult = settlementService.createSettlement(settlementRequest);
      settlementId = settlementResult.settlement!.id;

      const appealRequest = {
        settlementId,
        appellantId: 'buyer-1',
        appellantRole: 'BUYER' as const,
        reason: AppealReason.WINNING_BID_INVALID,
        description: 'Test appeal'
      };

      const appealResult = settlementService.createAppeal(appealRequest);
      appealId = appealResult.appeal!.id;
    });

    it('should retrieve settlement by ID', async () => {
      const settlement = settlementService.getSettlement(settlementId);

      expect(settlement).toBeDefined();
      expect(settlement?.id).toBe(settlementId);
      expect(settlement?.auctionId).toBe('auction-1');
    });

    it('should retrieve settlement by auction ID', async () => {
      const settlement = settlementService.getSettlementByAuctionId('auction-1');

      expect(settlement).toBeDefined();
      expect(settlement?.auctionId).toBe('auction-1');
    });

    it('should retrieve appeal by ID', async () => {
      const appeal = settlementService.getAppeal(appealId);

      expect(appeal).toBeDefined();
      expect(appeal?.id).toBe(appealId);
      expect(appeal?.settlementId).toBe(settlementId);
    });

    it('should retrieve appeals for settlement', async () => {
      const appeals = settlementService.getAppealsForSettlement(settlementId);

      expect(appeals).toHaveLength(1);
      expect(appeals[0].settlementId).toBe(settlementId);
    });

    it('should retrieve appeal window for settlement', async () => {
      const appealWindow = settlementService.getAppealWindow(settlementId);

      expect(appealWindow).toBeDefined();
      expect(appealWindow?.settlementId).toBe(settlementId);
      expect(appealWindow?.isActive).toBe(true);
    });

    it('should return null for non-existent records', async () => {
      const nonExistentSettlement = settlementService.getSettlement('non-existent');
      const nonExistentAppeal = settlementService.getAppeal('non-existent');
      const nonExistentWindow = settlementService.getAppealWindow('non-existent');

      expect(nonExistentSettlement).toBeNull();
      expect(nonExistentAppeal).toBeNull();
      expect(nonExistentWindow).toBeNull();
    });
  });

  describe('Configuration', () => {
    it('should use configuration values correctly', () => {
      expect(settlementConfig.appealWindowHours).toBeGreaterThan(0);
      expect(settlementConfig.maxAppealDescriptionLength).toBeGreaterThan(0);
      expect(settlementConfig.maxEvidenceFiles).toBeGreaterThanOrEqual(0);
      expect(settlementConfig.allowedAppealRoles.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      const malformedRequest = {
        auctionId: '',
        sellerId: '',
        winnerId: '',
        winningAmount: -100,
        settlementMethod: ''
      };

      const result = settlementService.createSettlement(malformedRequest);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle missing settlement in appeals gracefully', async () => {
      const appealRequest = {
        settlementId: 'non-existent',
        appellantId: 'buyer-1',
        appellantRole: 'BUYER' as const,
        reason: AppealReason.OTHER,
        description: 'Test appeal'
      };

      const result = settlementService.createAppeal(appealRequest);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Multiple Settlements and Appeals', () => {
    it('should handle multiple settlements independently', async () => {
      const request1 = {
        auctionId: 'auction-1',
        sellerId: 'seller-1',
        winnerId: 'buyer-1',
        winningBidId: 'bid-1',
        winningAmount: 1000,
        settlementMethod: 'ESCROW'
      };

      const request2 = {
        auctionId: 'auction-2',
        sellerId: 'seller-2',
        winnerId: 'buyer-2',
        winningBidId: 'bid-2',
        winningAmount: 2000,
        settlementMethod: 'ESCROW'
      };

      const result1 = settlementService.createSettlement(request1);
      const result2 = settlementService.createSettlement(request2);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.settlement?.id).not.toBe(result2.settlement?.id);

      const stats = settlementService.getStatistics();
      expect(stats.totalSettlements).toBe(2);
    });

    it('should handle appeals for different settlements independently', async () => {
      // Create two settlements
      const settlement1Result = settlementService.createSettlement({
        auctionId: 'auction-1',
        sellerId: 'seller-1',
        winnerId: 'buyer-1',
        winningBidId: 'bid-1',
        winningAmount: 1000,
        settlementMethod: 'ESCROW'
      });

      const settlement2Result = settlementService.createSettlement({
        auctionId: 'auction-2',
        sellerId: 'seller-2',
        winnerId: 'buyer-2',
        winningBidId: 'bid-2',
        winningAmount: 2000,
        settlementMethod: 'ESCROW'
      });

      // Create appeals for both
      const appeal1Result = settlementService.createAppeal({
        settlementId: settlement1Result.settlement!.id,
        appellantId: 'buyer-1',
        appellantRole: 'BUYER',
        reason: AppealReason.OTHER,
        description: 'Appeal for settlement 1'
      });

      const appeal2Result = settlementService.createAppeal({
        settlementId: settlement2Result.settlement!.id,
        appellantId: 'buyer-2',
        appellantRole: 'BUYER',
        reason: AppealReason.OTHER,
        description: 'Appeal for settlement 2'
      });

      expect(appeal1Result.success).toBe(true);
      expect(appeal2Result.success).toBe(true);
      expect(appeal1Result.appeal?.id).not.toBe(appeal2Result.appeal?.id);

      const stats = settlementService.getStatistics();
      expect(stats.totalAppeals).toBe(2);
    });
  });
});
