import {
  SellerProtection,
  SellerProtectionRequest,
  SellerProtectionResult,
  AutoRelistRequest,
  AutoRelistResult,
  SellerProtectionEvent,
  SellerProtectionTrigger,
  SellerProtectionStatus,
  AutoRelistStatus,
  SellerProtectionEventType,
  SellerProtectionEligibility,
  AutoRelistEligibility,
  SellerProtectionStatistics,
  SellerProtectionValidation
} from '../types/SellerProtection.types';
import { 
  sellerProtectionConfig, 
  getConfirmationDeadlineDuration, 
  getAutoRelistCooldownDuration,
  isAutoRelistEnabled,
  requiresSellerConfirmation,
  allowsAutoRelistAfterAppeal,
  validateAutoRelistRequest
} from '../config/sellerProtection.config';
import { settlementService } from './Settlement.service';

/**
 * Seller Protection & Auto-Relist Service
 * 
 * Protects sellers from buyer abuse, failed settlements, and no-shows
 * WITHOUT breaking settlement finality or escrow safety
 * 
 * ABSOLUTE RULES:
 * - Frontend has ZERO authority
 * - Seller protection logic is BACKEND ONLY
 * - No automatic wallet or escrow mutations
 * - Auto-relist NEVER happens from frontend
 * - Auto-relist NEVER reuses previous bids
 */
export class SellerProtectionService {
  private protections: Map<string, SellerProtection> = new Map();
  private eventLog: SellerProtectionEvent[] = [];
  private statistics: SellerProtectionStatistics = {
    totalProtections: 0,
    activeProtections: 0,
    autoRelistEligible: 0,
    autoRelisted: 0,
    cancelled: 0,
    triggerBreakdown: {
      [SellerProtectionTrigger.PAYMENT_FAILURE]: 0,
      [SellerProtectionTrigger.SETTLEMENT_EXPIRED]: 0,
      [SellerProtectionTrigger.BUYER_BLOCKED]: 0,
      [SellerProtectionTrigger.APPEAL_AGAINST_BUYER]: 0
    },
    averageProcessingTime: 0,
    topProtectedSellers: [],
    autoRelistSuccessRate: 0
  };

  /**
   * Create seller protection for a seller
   * 
   * @param request Seller protection request data
   * @returns Seller protection result
   */
  createSellerProtection(request: SellerProtectionRequest): SellerProtectionResult {
    try {
      // Validate request
      const validation = this.validateSellerProtectionRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Check eligibility
      const eligibility = this.checkSellerProtectionEligibility(request);
      if (!eligibility.eligible) {
        return {
          success: false,
          error: eligibility.reason || 'Not eligible for seller protection'
        };
      }

      // Create protection
      const protectionId = `seller_protection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      
      const protection: SellerProtection = {
        id: protectionId,
        originalAuctionId: request.originalAuctionId,
        sellerId: request.sellerId,
        buyerId: request.buyerId,
        trigger: request.trigger,
        status: SellerProtectionStatus.PROTECTED,
        protectionData: {
          originalAuctionData: request.originalAuctionData,
          settlementId: request.triggerData.settlementId,
          appealId: request.triggerData.appealId,
          paymentFailureReason: request.triggerData.paymentFailureReason,
          settlementExpiryReason: request.triggerData.settlementExpiryReason,
          buyerBlockReason: request.triggerData.buyerBlockReason,
          appealResolutionDetails: request.triggerData.appealResolutionDetails
        },
        metadata: {
          triggeredAt: now,
          processedAt: now,
          processedBy: 'seller-protection-service',
          trustScoreImpact: sellerProtectionConfig.protectedSellerTrustScoreImpact,
          escrowStatus: 'HELD'
        },
        createdAt: now,
        updatedAt: now
      };

      // Store protection
      this.protections.set(protectionId, protection);

      // Update statistics
      this.statistics.totalProtections++;
      this.statistics.activeProtections++;
      this.statistics.triggerBreakdown[request.trigger]++;

      // Log protection event
      this.logSellerProtectionEvent(SellerProtectionEventType.SELLER_PROTECTED, {
        sellerProtectionId: protectionId,
        originalAuctionId: request.originalAuctionId,
        sellerId: request.sellerId,
        buyerId: request.buyerId,
        trigger: request.trigger
      });

      // Check auto-relist eligibility
      const autoRelistEligibility = this.checkAutoRelistEligibility(protectionId);
      
      if (autoRelistEligibility.eligible) {
        // Update protection status
        protection.status = SellerProtectionStatus.AUTO_RELIST_ELIGIBLE;
        protection.autoRelistStatus = AutoRelistStatus.ELIGIBLE;
        protection.metadata.autoRelistEligibleAt = now;
        
        // Update statistics
        this.statistics.autoRelistEligible++;
        
        // Log auto-relist eligible event
        this.logSellerProtectionEvent(SellerProtectionEventType.AUTO_RELIST_ELIGIBLE, {
          sellerProtectionId: protectionId,
          originalAuctionId: request.originalAuctionId,
          sellerId: request.sellerId
        });
      }

      console.log(`[SellerProtection] Created protection ${protectionId} for seller ${request.sellerId}`);

      return {
        success: true,
        sellerProtection: protection,
        autoRelistEligible: autoRelistEligibility.eligible,
        autoRelistEligibility
      };

    } catch (error) {
      console.error('[SellerProtection] Error creating protection:', error);
      return {
        success: false,
        error: 'Internal server error during protection creation'
      };
    }
  }

  /**
   * Process auto-relist request
   * 
   * @param request Auto-relist request data
   * @returns Auto-relist result
   */
  processAutoRelist(request: AutoRelistRequest): AutoRelistResult {
    try {
      // Validate request
      const validation = validateAutoRelistRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Get protection
      const protection = this.protections.get(request.sellerProtectionId);
      if (!protection) {
        return {
          success: false,
          error: 'Seller protection not found'
        };
      }

      // Check auto-relist eligibility
      const eligibility = this.checkAutoRelistEligibility(request.sellerProtectionId);
      if (!eligibility.eligible) {
        return {
          success: false,
          error: eligibility.reason || 'Not eligible for auto-relist'
        };
      }

      // Check if confirmation is required
      if (requiresSellerConfirmation() && !request.requireConfirmation) {
        // Set to pending confirmation
        protection.autoRelistStatus = AutoRelistStatus.PENDING_CONFIRMATION;
        protection.updatedAt = new Date();

        const confirmationDeadline = new Date(Date.now() + getConfirmationDeadlineDuration());

        return {
          success: true,
          sellerProtection: protection,
          requiresConfirmation: true,
          confirmationDeadline
        };
      }

      // Create new auction (copy metadata only)
      const newAuctionId = this.createNewAuction(protection, request);

      // Update protection
      protection.status = SellerProtectionStatus.AUTO_RELISTED;
      protection.autoRelistStatus = AutoRelistStatus.RELISTED;
      protection.metadata.autoRelistedAt = new Date();
      protection.updatedAt = new Date();

      // Update statistics
      this.statistics.autoRelisted++;

      // Log auto-relist event
      this.logSellerProtectionEvent(SellerProtectionEventType.AUCTION_AUTO_RELISTED, {
        sellerProtectionId: request.sellerProtectionId,
        originalAuctionId: protection.originalAuctionId,
        sellerId: protection.sellerId,
        newAuctionId
      });

      console.log(`[SellerProtection] Auto-relisted auction ${protection.originalAuctionId} as ${newAuctionId}`);

      return {
        success: true,
        sellerProtection: protection,
        newAuctionId,
        newAuctionData: {
          id: newAuctionId,
          ...protection.protectionData.originalAuctionData
        }
      };

    } catch (error) {
      console.error('[SellerProtection] Error processing auto-relist:', error);
      return {
        success: false,
        error: 'Internal server error during auto-relist processing'
      };
    }
  }

  /**
   * Cancel auto-relist
   * 
   * @param sellerProtectionId Protection ID
   * @returns Success status
   */
  cancelAutoRelist(sellerProtectionId: string): { success: boolean; error?: string } {
    try {
      const protection = this.protections.get(sellerProtectionId);
      if (!protection) {
        return {
          success: false,
          error: 'Seller protection not found'
        };
      }

      // Check if can be cancelled
      if (protection.autoRelistStatus === AutoRelistStatus.RELISTED) {
        return {
          success: false,
          error: 'Cannot cancel auto-relist: already relisted'
        };
      }

      // Update protection
      protection.autoRelistStatus = AutoRelistStatus.CANCELLED;
      protection.metadata.cancelledAt = new Date();
      protection.updatedAt = new Date();

      // Update statistics
      this.statistics.cancelled++;

      // Log cancellation event
      this.logSellerProtectionEvent(SellerProtectionEventType.AUTO_RELIST_CANCELLED, {
        sellerProtectionId,
        originalAuctionId: protection.originalAuctionId,
        sellerId: protection.sellerId
      });

      console.log(`[SellerProtection] Cancelled auto-relist for protection ${sellerProtectionId}`);

      return { success: true };

    } catch (error) {
      console.error('[SellerProtection] Error cancelling auto-relist:', error);
      return {
        success: false,
        error: 'Internal server error during auto-relist cancellation'
      };
    }
  }

  /**
   * Check seller protection eligibility
   * 
   * @param request Protection request
   * @returns Eligibility result
   */
  checkSellerProtectionEligibility(request: SellerProtectionRequest): SellerProtectionEligibility {
    // Check if protection already exists for this auction
    const existingProtection = Array.from(this.protections.values()).find(
      p => p.originalAuctionId === request.originalAuctionId
    );
    if (existingProtection) {
      return {
        eligible: false,
        reason: 'Protection already exists for this auction'
      };
    }

    // Check trigger-specific eligibility
    switch (request.trigger) {
      case SellerProtectionTrigger.APPEAL_AGAINST_BUYER:
        if (!allowsAutoRelistAfterAppeal()) {
          return {
            eligible: false,
            reason: 'Auto-relist after appeal is not allowed'
          };
        }
        break;

      case SellerProtectionTrigger.PAYMENT_FAILURE:
        if (!request.triggerData.paymentFailureReason) {
          return {
            eligible: false,
            reason: 'Payment failure reason is required'
          };
        }
        break;

      case SellerProtectionTrigger.SETTLEMENT_EXPIRED:
        if (!request.triggerData.settlementExpiryReason) {
          return {
            eligible: false,
            reason: 'Settlement expiry reason is required'
          };
        }
        break;

      case SellerProtectionTrigger.BUYER_BLOCKED:
        if (!request.triggerData.buyerBlockReason) {
          return {
            eligible: false,
            reason: 'Buyer block reason is required'
          };
        }
        break;
    }

    return {
      eligible: true,
      trigger: request.trigger
    };
  }

  /**
   * Check auto-relist eligibility
   * 
   * @param sellerProtectionId Protection ID
   * @returns Auto-relist eligibility
   */
  checkAutoRelistEligibility(sellerProtectionId: string): AutoRelistEligibility {
    const protection = this.protections.get(sellerProtectionId);
    if (!protection) {
      return {
        eligible: false,
        reason: 'Seller protection not found',
        requiresConfirmation: requiresSellerConfirmation(),
        cooldownActive: false,
        remainingAutoRelists: 0
      };
    }

    // Check if auto-relist is enabled
    if (!isAutoRelistEnabled()) {
      return {
        eligible: false,
        reason: 'Auto-relist is disabled',
        requiresConfirmation: requiresSellerConfirmation(),
        cooldownActive: false,
        remainingAutoRelists: 0
      };
    }

    // Check if already relisted
    if (protection.autoRelistStatus === AutoRelistStatus.RELISTED) {
      return {
        eligible: false,
        reason: 'Auction already relisted',
        requiresConfirmation: requiresSellerConfirmation(),
        cooldownActive: false,
        remainingAutoRelists: 0
      };
    }

    // Check cooldown period
    const sellerProtections = Array.from(this.protections.values()).filter(
      p => p.sellerId === protection.sellerId && p.metadata.autoRelistedAt
    );

    if (sellerProtections.length >= sellerProtectionConfig.maxAutoRelistPerSeller) {
      return {
        eligible: false,
        reason: 'Maximum auto-relist limit reached for seller',
        requiresConfirmation: requiresSellerConfirmation(),
        cooldownActive: false,
        remainingAutoRelists: 0
      };
    }

    // Check cooldown
    const lastRelisted = sellerProtections
      .sort((a, b) => (b.metadata.autoRelistedAt?.getTime() || 0) - (a.metadata.autoRelistedAt?.getTime() || 0))[0];

    if (lastRelisted && lastRelisted.metadata.autoRelistedAt) {
      const cooldownEnd = new Date(
        lastRelisted.metadata.autoRelistedAt.getTime() + getAutoRelistCooldownDuration()
      );
      
      if (new Date() < cooldownEnd) {
        return {
          eligible: false,
          reason: 'Auto-relist cooldown period active',
          requiresConfirmation: requiresSellerConfirmation(),
          cooldownActive: true,
          cooldownEndsAt: cooldownEnd,
          remainingAutoRelists: Math.max(0, sellerProtectionConfig.maxAutoRelistPerSeller - sellerProtections.length)
        };
      }
    }

    return {
      eligible: true,
      requiresConfirmation: requiresSellerConfirmation(),
      confirmationDeadline: requiresSellerConfirmation() 
        ? new Date(Date.now() + getConfirmationDeadlineDuration())
        : undefined,
      cooldownActive: false,
      remainingAutoRelists: Math.max(0, sellerProtectionConfig.maxAutoRelistPerSeller - sellerProtections.length)
    };
  }

  /**
   * Get seller protection by ID
   */
  getSellerProtection(protectionId: string): SellerProtection | null {
    return this.protections.get(protectionId) || null;
  }

  /**
   * Get protections for seller
   */
  getProtectionsForSeller(sellerId: string): SellerProtection[] {
    return Array.from(this.protections.values()).filter(
      protection => protection.sellerId === sellerId
    );
  }

  /**
   * Get protection for original auction
   */
  getProtectionForAuction(originalAuctionId: string): SellerProtection | null {
    return Array.from(this.protections.values()).find(
      protection => protection.originalAuctionId === originalAuctionId
    ) || null;
  }

  /**
   * Get seller protection statistics
   */
  getStatistics(): SellerProtectionStatistics {
    return { ...this.statistics };
  }

  /**
   * Get event log
   */
  getEventLog(limit?: number): SellerProtectionEvent[] {
    if (limit) {
      return this.eventLog.slice(-limit);
    }
    return [...this.eventLog];
  }

  /**
   * Validate seller protection request
   */
  private validateSellerProtectionRequest(request: SellerProtectionRequest): SellerProtectionValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!request.originalAuctionId) {
      errors.push('Original auction ID is required');
    }

    if (!request.sellerId) {
      errors.push('Seller ID is required');
    }

    if (!Object.values(SellerProtectionTrigger).includes(request.trigger)) {
      errors.push('Invalid trigger type');
    }

    if (!request.originalAuctionData) {
      errors.push('Original auction data is required');
    }

    const requiredFields = ['title', 'description', 'images', 'category', 'condition'];
    for (const field of requiredFields) {
      if (!request.originalAuctionData[field as keyof typeof request.originalAuctionData]) {
        errors.push(`Original auction data missing required field: ${field}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create new auction from protection data
   */
  private createNewAuction(protection: SellerProtection, request: AutoRelistRequest): string {
    const newAuctionId = `auction_auto_relist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Copy only metadata (NOT bids, watchers, or bid history)
    const auctionData = {
      id: newAuctionId,
      sellerId: protection.sellerId,
      title: protection.protectionData.originalAuctionData.title,
      description: protection.protectionData.originalAuctionData.description,
      images: protection.protectionData.originalAuctionData.images,
      category: protection.protectionData.originalAuctionData.category,
      condition: protection.protectionData.originalAuctionData.condition,
      // Optional data based on config
      ...(sellerProtectionConfig.copyReservePrice && protection.protectionData.originalAuctionData.reservePrice && {
        reservePrice: protection.protectionData.originalAuctionData.reservePrice
      }),
      ...(sellerProtectionConfig.copyShippingInfo && protection.protectionData.originalAuctionData.shippingInfo && {
        shippingInfo: protection.protectionData.originalAuctionData.shippingInfo
      }),
      // Auto-relist metadata
      metadata: {
        autoRelistedFrom: protection.originalAuctionId,
        sellerProtectionId: protection.id,
        autoRelistedAt: new Date().toISOString(),
        originalTrigger: protection.trigger
      },
      // Status based on configuration
      status: request.startStatus || sellerProtectionConfig.autoRelistStartStatus,
      // No bids, watchers, or history
      currentBid: 0,
      bidCount: 0,
      watcherCount: 0,
      bidHistory: [],
      watchers: [],
      // Timing
      createdAt: new Date(),
      updatedAt: new Date(),
      scheduledAt: request.scheduledAt || new Date()
    };

    // In a real implementation, this would save to database
    // For now, we'll just log the auction creation
    console.log(`[SellerProtection] Created new auction ${newAuctionId} from protection ${protection.id}`);
    console.log('[SellerProtection] New auction data:', JSON.stringify(auctionData, null, 2));

    return newAuctionId;
  }

  /**
   * Log seller protection event
   */
  private logSellerProtectionEvent(type: SellerProtectionEventType, data: any): void {
    const event: SellerProtectionEvent = {
      id: `seller_protection_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category: 'SELLER_PROTECTION',
      type,
      timestamp: new Date(),
      data,
      severity: this.getEventSeverity(type)
    };

    this.eventLog.push(event);
    console.log(`[SellerProtection] Event: ${type} for protection ${data.sellerProtectionId}`);
  }

  /**
   * Get event severity based on type
   */
  private getEventSeverity(type: SellerProtectionEventType): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    switch (type) {
      case SellerProtectionEventType.SELLER_PROTECTED:
        return 'MEDIUM';
      case SellerProtectionEventType.AUTO_RELIST_ELIGIBLE:
        return 'LOW';
      case SellerProtectionEventType.AUCTION_AUTO_RELISTED:
        return 'LOW';
      case SellerProtectionEventType.AUTO_RELIST_CANCELLED:
        return 'LOW';
      default:
        return 'LOW';
    }
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
   * Handle buyer blocked event (for Trust & Safety integration)
   * 
   * @param settlementId Settlement ID
   * @param buyerBlockReason Reason for buyer block
   */
  handleBuyerBlocked(settlementId: string, buyerBlockReason: string): { success: boolean; error?: string } {
    try {
      const settlement = settlementService.getSettlement(settlementId);
      if (!settlement) {
        return {
          success: false,
          error: 'Settlement not found'
        };
      }

      // Create seller protection request
      const protectionRequest: SellerProtectionRequest = {
        originalAuctionId: settlement.auctionId,
        sellerId: settlement.sellerId,
        buyerId: settlement.winnerId,
        trigger: SellerProtectionTrigger.BUYER_BLOCKED,
        triggerData: {
          settlementId: settlement.id,
          buyerBlockReason
        },
        originalAuctionData: this.extractAuctionData(settlement)
      };

      this.createSellerProtection(protectionRequest);

      console.log(`[SellerProtection] Processed buyer blocked for settlement ${settlementId}`);
      return { success: true };

    } catch (error) {
      console.error('[SellerProtection] Error handling buyer blocked:', error);
      return {
        success: false,
        error: 'Internal server error during buyer blocked processing'
      };
    }
  }

  /**
   * Reset all data (for testing)
   */
  reset(): void {
    this.protections.clear();
    this.eventLog = [];
    this.statistics = {
      totalProtections: 0,
      activeProtections: 0,
      autoRelistEligible: 0,
      autoRelisted: 0,
      cancelled: 0,
      triggerBreakdown: {
        [SellerProtectionTrigger.PAYMENT_FAILURE]: 0,
        [SellerProtectionTrigger.SETTLEMENT_EXPIRED]: 0,
        [SellerProtectionTrigger.BUYER_BLOCKED]: 0,
        [SellerProtectionTrigger.APPEAL_AGAINST_BUYER]: 0
      },
      averageProcessingTime: 0,
      topProtectedSellers: [],
      autoRelistSuccessRate: 0
    };
  }
}

// Singleton instance
export const sellerProtectionService = new SellerProtectionService();
