import {
  AuctionSettlement,
  Appeal,
  AppealWindow,
  SettlementEvent,
  SettlementRequest,
  AppealRequest,
  SettlementResult,
  AppealResult,
  AppealEligibility,
  AuctionSettlementState,
  AppealStatus,
  AppealReason,
  SettlementEventType,
  SettlementStatistics,
  SettlementValidation
} from '../types/Settlement.types';
import { settlementConfig, getAppealWindowDuration, canRoleAppeal, validateAppealDescription, validateEvidenceFiles } from '../config/settlement.config';

/**
 * Auction Settlement Finality & Appeals Window Service
 * 
 * Ensures auction outcomes are FINAL, auditable, and protected
 * while allowing LIMITED, time-bound appeals
 * 
 * ABSOLUTE RULES:
 * - Frontend has ZERO authority
 * - Settlement is decided ONLY by backend
 * - Settlement is IMMUTABLE once finalized
 * - Appeals NEVER reverse settlement automatically
 * - Appeals do NOT touch wallet, escrow, or payouts directly
 */
export class SettlementService {
  private settlements: Map<string, AuctionSettlement> = new Map();
  private appeals: Map<string, Appeal> = new Map();
  private appealWindows: Map<string, AppealWindow> = new Map();
  private eventLog: SettlementEvent[] = [];
  private statistics: SettlementStatistics = {
    totalSettlements: 0,
    pendingSettlements: 0,
    settledSettlements: 0,
    finalizedSettlements: 0,
    totalAppeals: 0,
    pendingAppeals: 0,
    resolvedAppeals: 0,
    rejectedAppeals: 0,
    averageAppealResolutionTime: 0,
    topAppealReasons: []
  };

  /**
   * Create a new auction settlement
   * 
   * @param request Settlement request data
   * @returns Settlement result with appeal window
   */
  createSettlement(request: SettlementRequest): SettlementResult {
    try {
      // Validate settlement request
      const validation = this.validateSettlementRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Check if settlement already exists
      const existingSettlement = this.findSettlementByAuctionId(request.auctionId);
      if (existingSettlement) {
        return {
          success: false,
          error: 'Settlement already exists for this auction'
        };
      }

      // Create settlement
      const settlementId = `settlement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      
      const settlement: AuctionSettlement = {
        id: settlementId,
        auctionId: request.auctionId,
        sellerId: request.sellerId,
        winnerId: request.winnerId,
        winningBidId: request.winningBidId,
        winningAmount: request.winningAmount,
        settlementAmount: request.winningAmount, // Can be adjusted for fees
        state: AuctionSettlementState.SETTLED,
        settledAt: now,
        appealWindowExpiresAt: new Date(now.getTime() + getAppealWindowDuration()),
        metadata: {
          totalBids: 0, // Would be populated from auction data
          finalBidAmount: request.winningAmount,
          reservePrice: request.metadata?.reservePrice,
          settlementMethod: request.settlementMethod,
          processedBy: 'settlement-service'
        },
        createdAt: now,
        updatedAt: now
      };

      // Store settlement
      this.settlements.set(settlementId, settlement);

      // Create appeal window
      const appealWindow: AppealWindow = {
        settlementId,
        opensAt: now,
        expiresAt: settlement.appealWindowExpiresAt!,
        isActive: true,
        appealsAllowed: true,
        totalAppeals: 0
      };

      this.appealWindows.set(settlementId, appealWindow);

      // Update statistics
      this.statistics.totalSettlements++;
      this.statistics.settledSettlements++;

      // Log settlement event
      this.logSettlementEvent(SettlementEventType.AUCTION_SETTLED, {
        settlementId,
        auctionId: request.auctionId,
        sellerId: request.sellerId,
        winnerId: request.winnerId,
        winningAmount: request.winningAmount
      });

      // Schedule auto-finalization if enabled
      if (settlementConfig.autoFinalizeAfterAppealWindow) {
        this.scheduleAutoFinalization(settlementId, settlement.appealWindowExpiresAt!);
      }

      console.log(`[Settlement] Created settlement ${settlementId} for auction ${request.auctionId}`);

      return {
        success: true,
        settlement,
        appealWindow
      };

    } catch (error) {
      console.error('[Settlement] Error creating settlement:', error);
      return {
        success: false,
        error: 'Internal server error during settlement creation'
      };
    }
  }

  /**
   * Create an appeal against a settlement
   * 
   * @param request Appeal request data
   * @returns Appeal result with eligibility check
   */
  createAppeal(request: AppealRequest): AppealResult {
    try {
      // Check appeal eligibility
      const eligibility = this.checkAppealEligibility(request.settlementId, request.appellantId, request.appellantRole);
      if (!eligibility.canAppeal) {
        return {
          success: false,
          error: eligibility.reason || 'Appeal not allowed',
          canAppeal: false,
          appealWindow: eligibility.appealWindow
        };
      }

      // Validate appeal request
      const descriptionValidation = validateAppealDescription(request.description);
      if (!descriptionValidation.valid) {
        return {
          success: false,
          error: descriptionValidation.error!,
          canAppeal: true
        };
      }

      const evidenceValidation = validateEvidenceFiles(request.evidence?.length || 0);
      if (!evidenceValidation.valid) {
        return {
          success: false,
          error: evidenceValidation.error!,
          canAppeal: true
        };
      }

      // Get settlement
      const settlement = this.settlements.get(request.settlementId);
      if (!settlement) {
        return {
          success: false,
          error: 'Settlement not found',
          canAppeal: false
        };
      }

      // Check if settlement is finalized
      if (settlement.state === AuctionSettlementState.SETTLEMENT_FINAL) {
        return {
          success: false,
          error: 'Cannot appeal finalized settlement',
          canAppeal: false
        };
      }

      // Create appeal
      const appealId = `appeal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      
      const appeal: Appeal = {
        id: appealId,
        settlementId: request.settlementId,
        auctionId: settlement.auctionId,
        appellantId: request.appellantId,
        appellantRole: request.appellantRole,
        reason: request.reason,
        description: request.description,
        evidence: request.evidence,
        status: AppealStatus.PENDING,
        createdAt: now,
        updatedAt: now
      };

      // Store appeal
      this.appeals.set(appealId, appeal);

      // Update appeal window
      const appealWindow = this.appealWindows.get(request.settlementId);
      if (appealWindow) {
        appealWindow.totalAppeals++;
      }

      // Update statistics
      this.statistics.totalAppeals++;
      this.statistics.pendingAppeals++;

      // Update top appeal reasons
      this.updateTopAppealReasons(request.reason);

      // Log appeal event
      this.logSettlementEvent(SettlementEventType.APPEAL_OPENED, {
        settlementId: request.settlementId,
        auctionId: settlement.auctionId,
        appealId,
        reason: request.reason
      });

      console.log(`[Settlement] Created appeal ${appealId} for settlement ${request.settlementId}`);

      return {
        success: true,
        appeal,
        canAppeal: true,
        appealWindow: appealWindow || undefined
      };

    } catch (error) {
      console.error('[Settlement] Error creating appeal:', error);
      return {
        success: false,
        error: 'Internal server error during appeal creation',
        canAppeal: false
      };
    }
  }

  /**
   * Finalize a settlement (make it immutable)
   * 
   * @param settlementId Settlement ID
   * @returns Success status
   */
  finalizeSettlement(settlementId: string): { success: boolean; error?: string } {
    try {
      const settlement = this.settlements.get(settlementId);
      if (!settlement) {
        return {
          success: false,
          error: 'Settlement not found'
        };
      }

      // Check if already finalized
      if (settlement.state === AuctionSettlementState.SETTLEMENT_FINAL) {
        return {
          success: false,
          error: 'Settlement already finalized'
        };
      }

      // Update settlement state
      settlement.state = AuctionSettlementState.SETTLEMENT_FINAL;
      settlement.finalizedAt = new Date();
      settlement.updatedAt = new Date();

      // Close appeal window
      const appealWindow = this.appealWindows.get(settlementId);
      if (appealWindow) {
        appealWindow.isActive = false;
        appealWindow.appealsAllowed = false;
      }

      // Update statistics
      this.statistics.finalizedSettlements++;
      this.statistics.pendingSettlements = Math.max(0, this.statistics.pendingSettlements - 1);

      // Log finalization event
      this.logSettlementEvent(SettlementEventType.SETTLEMENT_FINALIZED, {
        settlementId,
        auctionId: settlement.auctionId,
        sellerId: settlement.sellerId,
        winnerId: settlement.winnerId,
        winningAmount: settlement.winningAmount
      });

      console.log(`[Settlement] Finalized settlement ${settlementId}`);

      return { success: true };

    } catch (error) {
      console.error('[Settlement] Error finalizing settlement:', error);
      return {
        success: false,
        error: 'Internal server error during settlement finalization'
      };
    }
  }

  /**
   * Check if a user can appeal a settlement
   * 
   * @param settlementId Settlement ID
   * @param userId User ID
   * @param userRole User role
   * @returns Appeal eligibility
   */
  checkAppealEligibility(settlementId: string, userId: string, userRole: 'BUYER' | 'SELLER' | 'OBSERVER'): AppealEligibility {
    const settlement = this.settlements.get(settlementId);
    if (!settlement) {
      return {
        canAppeal: false,
        reason: 'Settlement not found'
      };
    }

    // Check if settlement is finalized
    if (settlement.state === AuctionSettlementState.SETTLEMENT_FINAL) {
      return {
        canAppeal: false,
        reason: 'Settlement is finalized'
      };
    }

    // Check appeal window
    const appealWindow = this.appealWindows.get(settlementId);
    if (!appealWindow || !appealWindow.isActive || !appealWindow.appealsAllowed) {
      return {
        canAppeal: false,
        reason: 'Appeal window is closed'
      };
    }

    // Check if appeal window has expired
    if (new Date() > appealWindow.expiresAt) {
      return {
        canAppeal: false,
        reason: 'Appeal window has expired'
      };
    }

    // Check if user role is allowed to appeal
    if (!canRoleAppeal(userRole)) {
      return {
        canAppeal: false,
        reason: 'User role not allowed to appeal'
      };
    }

    // Check if user has already appealed
    const existingAppeal = Array.from(this.appeals.values()).find(
      appeal => appeal.settlementId === settlementId && appeal.appellantId === userId
    );
    if (existingAppeal) {
      return {
        canAppeal: false,
        reason: 'User has already appealed this settlement'
      };
    }

    return {
      canAppeal: true,
      appealWindow,
      deadline: appealWindow.expiresAt
    };
  }

  /**
   * Get settlement by ID
   */
  getSettlement(settlementId: string): AuctionSettlement | null {
    return this.settlements.get(settlementId) || null;
  }

  /**
   * Get settlement by auction ID
   */
  getSettlementByAuctionId(auctionId: string): AuctionSettlement | null {
    return this.findSettlementByAuctionId(auctionId);
  }

  /**
   * Get appeal by ID
   */
  getAppeal(appealId: string): Appeal | null {
    return this.appeals.get(appealId) || null;
  }

  /**
   * Get appeals for a settlement
   */
  getAppealsForSettlement(settlementId: string): Appeal[] {
    return Array.from(this.appeals.values()).filter(
      appeal => appeal.settlementId === settlementId
    );
  }

  /**
   * Get appeal window for a settlement
   */
  getAppealWindow(settlementId: string): AppealWindow | null {
    return this.appealWindows.get(settlementId) || null;
  }

  /**
   * Get settlement statistics
   */
  getStatistics(): SettlementStatistics {
    return { ...this.statistics };
  }

  /**
   * Get event log
   */
  getEventLog(limit?: number): SettlementEvent[] {
    if (limit) {
      return this.eventLog.slice(-limit);
    }
    return [...this.eventLog];
  }

  /**
   * Process expired appeal windows
   */
  processExpiredAppealWindows(): void {
    const now = new Date();
    let processedCount = 0;

    for (const [settlementId, appealWindow] of this.appealWindows.entries()) {
      if (appealWindow.isActive && now > appealWindow.expiresAt) {
        // Close appeal window
        appealWindow.isActive = false;
        appealWindow.appealsAllowed = false;

        // Auto-finalize settlement if enabled
        if (settlementConfig.autoFinalizeAfterAppealWindow) {
          this.finalizeSettlement(settlementId);
        }

        // Log expiration event
        this.logSettlementEvent(SettlementEventType.APPEAL_WINDOW_EXPIRED, {
          settlementId,
          auctionId: this.settlements.get(settlementId)?.auctionId || ''
        });

        processedCount++;
      }
    }

    if (processedCount > 0) {
      console.log(`[Settlement] Processed ${processedCount} expired appeal windows`);
    }
  }

  /**
   * Validate settlement request
   */
  private validateSettlementRequest(request: SettlementRequest): SettlementValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!request.auctionId) {
      errors.push('Auction ID is required');
    }

    if (!request.sellerId) {
      errors.push('Seller ID is required');
    }

    if (!request.winningAmount || request.winningAmount <= 0) {
      errors.push('Winning amount must be greater than 0');
    }

    if (!request.settlementMethod) {
      errors.push('Settlement method is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Find settlement by auction ID
   */
  private findSettlementByAuctionId(auctionId: string): AuctionSettlement | null {
    for (const settlement of this.settlements.values()) {
      if (settlement.auctionId === auctionId) {
        return settlement;
      }
    }
    return null;
  }

  /**
   * Schedule auto-finalization
   */
  private scheduleAutoFinalization(settlementId: string, expiresAt: Date): void {
    const delay = expiresAt.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        this.finalizeSettlement(settlementId);
      }, delay);
    }
  }

  /**
   * Update top appeal reasons statistics
   */
  private updateTopAppealReasons(reason: AppealReason): void {
    const existing = this.statistics.topAppealReasons.find(r => r.reason === reason);
    if (existing) {
      existing.count++;
    } else {
      this.statistics.topAppealReasons.push({ reason, count: 1 });
    }
  }

  /**
   * Log settlement event
   */
  private logSettlementEvent(type: SettlementEventType, data: any): void {
    const event: SettlementEvent = {
      id: `settlement_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category: 'AUCTION_SETTLEMENT',
      type,
      timestamp: new Date(),
      data,
      severity: this.getEventSeverity(type)
    };

    this.eventLog.push(event);
    console.log(`[Settlement] Event: ${type} for settlement ${data.settlementId}`);
  }

  /**
   * Get event severity based on type
   */
  private getEventSeverity(type: SettlementEventType): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    switch (type) {
      case SettlementEventType.AUCTION_SETTLED:
        return 'LOW';
      case SettlementEventType.APPEAL_OPENED:
        return 'MEDIUM';
      case SettlementEventType.APPEAL_WINDOW_EXPIRED:
        return 'MEDIUM';
      case SettlementEventType.SETTLEMENT_FINALIZED:
        return 'LOW';
      default:
        return 'LOW';
    }
  }

  /**
   * Reset all data (for testing)
   */
  reset(): void {
    this.settlements.clear();
    this.appeals.clear();
    this.appealWindows.clear();
    this.eventLog = [];
    this.statistics = {
      totalSettlements: 0,
      pendingSettlements: 0,
      settledSettlements: 0,
      finalizedSettlements: 0,
      totalAppeals: 0,
      pendingAppeals: 0,
      resolvedAppeals: 0,
      rejectedAppeals: 0,
      averageAppealResolutionTime: 0,
      topAppealReasons: []
    };
  }
}

// Singleton instance
export const settlementService = new SettlementService();
