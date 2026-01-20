import { settlementService } from './Settlement.service';
import { sellerProtectionService } from './SellerProtection.service';
import { SellerProtectionTrigger } from '../types/SellerProtection.types';
import { AppealStatus, AppealReason } from '../types/Settlement.types';

/**
 * Settlement Integration Service
 * 
 * Integrates Seller Protection with Settlement Finality system
 * Monitors settlement events and triggers seller protection when needed
 */

export class SettlementIntegrationService {
  /**
   * Handle settlement finalization
   * Checks if seller protection should be triggered
   */
  handleSettlementFinalized(settlementId: string): void {
    try {
      const settlement = settlementService.getSettlement(settlementId);
      if (!settlement) {
        console.log(`[SettlementIntegration] Settlement ${settlementId} not found`);
        return;
      }

      // Check if settlement expired without completion
      if (this.shouldTriggerProtectionForExpiredSettlement(settlement)) {
        this.triggerSellerProtection({
          originalAuctionId: settlement.auctionId,
          sellerId: settlement.sellerId,
          buyerId: settlement.winnerId,
          trigger: SellerProtectionTrigger.SETTLEMENT_EXPIRED,
          triggerData: {
            settlementId: settlement.id,
            settlementExpiryReason: 'Settlement expired without completion'
          },
          originalAuctionData: this.extractAuctionData(settlement)
        });
      }

      console.log(`[SettlementIntegration] Processed settlement finalization for ${settlementId}`);

    } catch (error) {
      console.error('[SettlementIntegration] Error handling settlement finalization:', error);
    }
  }

  /**
   * Handle appeal resolution
   * Triggers seller protection if appeal resolves against buyer
   */
  handleAppealResolved(appealId: string, resolution: 'AGAINST_BUYER' | 'AGAINST_SELLER' | 'INCONCLUSIVE'): void {
    try {
      const appeal = settlementService.getAppeal(appealId);
      if (!appeal) {
        console.log(`[SettlementIntegration] Appeal ${appealId} not found`);
        return;
      }

      // Only trigger protection if appeal resolves against buyer
      if (resolution === 'AGAINST_BUYER' && appeal.status === AppealStatus.RESOLVED) {
        const settlement = settlementService.getSettlement(appeal.settlementId);
        if (settlement) {
          this.triggerSellerProtection({
            originalAuctionId: appeal.auctionId,
            sellerId: settlement.sellerId,
            buyerId: appeal.appellantId === settlement.sellerId ? settlement.winnerId : appeal.appellantId,
            trigger: SellerProtectionTrigger.APPEAL_AGAINST_BUYER,
            triggerData: {
              settlementId: appeal.settlementId,
              appealId: appeal.id,
              appealResolutionDetails: {
                reason: appeal.reason,
                description: appeal.description,
                resolution: resolution
              }
            },
            originalAuctionData: this.extractAuctionData(settlement)
          });
        }
      }

      console.log(`[SettlementIntegration] Processed appeal resolution for ${appealId}`);

    } catch (error) {
      console.error('[SettlementIntegration] Error handling appeal resolution:', error);
    }
  }

  /**
   * Handle payment failure
   * Triggers seller protection for payment failures
   */
  handlePaymentFailure(settlementId: string, paymentFailureReason: string): void {
    try {
      const settlement = settlementService.getSettlement(settlementId);
      if (!settlement) {
        console.log(`[SettlementIntegration] Settlement ${settlementId} not found`);
        return;
      }

      this.triggerSellerProtection({
        originalAuctionId: settlement.auctionId,
        sellerId: settlement.sellerId,
        buyerId: settlement.winnerId,
        trigger: SellerProtectionTrigger.PAYMENT_FAILURE,
        triggerData: {
          settlementId: settlement.id,
          paymentFailureReason
        },
        originalAuctionData: this.extractAuctionData(settlement)
      });

      console.log(`[SettlementIntegration] Processed payment failure for settlement ${settlementId}`);

    } catch (error) {
      console.error('[SettlementIntegration] Error handling payment failure:', error);
    }
  }

  /**
   * Handle buyer blocked during settlement
   * Triggers seller protection when buyer is blocked
   */
  handleBuyerBlocked(settlementId: string, buyerBlockReason: string): void {
    try {
      const settlement = settlementService.getSettlement(settlementId);
      if (!settlement) {
        console.log(`[SettlementIntegration] Settlement ${settlementId} not found`);
        return;
      }

      this.triggerSellerProtection({
        originalAuctionId: settlement.auctionId,
        sellerId: settlement.sellerId,
        buyerId: settlement.winnerId,
        trigger: SellerProtectionTrigger.BUYER_BLOCKED,
        triggerData: {
          settlementId: settlement.id,
          buyerBlockReason
        },
        originalAuctionData: this.extractAuctionData(settlement)
      });

      console.log(`[SettlementIntegration] Processed buyer blocked for settlement ${settlementId}`);

    } catch (error) {
      console.error('[SettlementIntegration] Error handling buyer blocked:', error);
    }
  }

  /**
   * Check if settlement should trigger protection for expiry
   */
  private shouldTriggerProtectionForExpiredSettlement(settlement: any): boolean {
    // Check if settlement has been in SETTLED state for too long without completion
    const settledAt = settlement.settledAt;
    const now = new Date();
    const hoursSinceSettled = (now.getTime() - settledAt.getTime()) / (1000 * 60 * 60);
    
    // Trigger protection if settled for more than 72 hours without completion
    return hoursSinceSettled > 72 && !settlement.finalizedAt;
  }

  /**
   * Extract auction data from settlement
   */
  private extractAuctionData(settlement: any): any {
    // In a real implementation, this would fetch the original auction data
    // For now, we'll return basic structure
    return {
      title: `Auction ${settlement.auctionId}`,
      description: 'Original auction description would be here',
      images: [],
      category: 'general',
      condition: 'used',
      reservePrice: settlement.metadata?.finalBidAmount,
      shippingInfo: {
        method: 'standard',
        cost: 0
      }
    };
  }

  /**
   * Trigger seller protection
   */
  private triggerSellerProtection(protectionRequest: any): void {
    try {
      const result = sellerProtectionService.createSellerProtection(protectionRequest);
      
      if (result.success) {
        console.log(`[SettlementIntegration] Seller protection triggered: ${result.sellerProtection?.id}`);
        
        // If auto-relist is eligible and doesn't require confirmation, process it
        if (result.autoRelistEligible && result.autoRelistEligibility?.eligible && 
            !result.autoRelistEligibility.requiresConfirmation) {
          
          const autoRelistResult = sellerProtectionService.processAutoRelist({
            sellerProtectionId: result.sellerProtection!.id,
            requireConfirmation: false,
            startStatus: 'PENDING_REVIEW'
          });
          
          if (autoRelistResult.success) {
            console.log(`[SettlementIntegration] Auto-relist processed: ${autoRelistResult.newAuctionId}`);
          }
        }
      } else {
        console.log(`[SettlementIntegration] Seller protection failed: ${result.error}`);
      }

    } catch (error) {
      console.error('[SettlementIntegration] Error triggering seller protection:', error);
    }
  }

  /**
   * Initialize integration listeners
   * This would be called when the service starts
   */
  initialize(): void {
    console.log('[SettlementIntegration] Initializing settlement integration service');
    
    // In a real implementation, this would set up event listeners
    // For now, we'll just log that initialization occurred
    console.log('[SettlementIntegration] Settlement integration service initialized');
  }

  /**
   * Shutdown integration service
   */
  shutdown(): void {
    console.log('[SettlementIntegration] Shutting down settlement integration service');
    
    // In a real implementation, this would clean up event listeners
    console.log('[SettlementIntegration] Settlement integration service shut down');
  }
}

// Singleton instance
export const settlementIntegrationService = new SettlementIntegrationService();
