import { sellerProtectionService } from './SellerProtection.service';
import { SellerProtectionTrigger } from '../types/SellerProtection.types';

/**
 * Trust & Safety Integration Service
 * 
 * Integrates Seller Protection with Trust & Safety system
 * Monitors user blocks, flags, and safety events
 */

export interface TrustSafetyEvent {
  id: string;
  userId: string;
  eventType: 'USER_BLOCKED' | 'USER_FLAGGED' | 'ACCOUNT_SUSPENDED' | 'ACCOUNT_BANNED';
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
  metadata?: Record<string, any>;
  relatedAuctionId?: string;
  relatedSettlementId?: string;
}

export interface UserSafetyStatus {
  userId: string;
  isBlocked: boolean;
  isFlagged: boolean;
  isSuspended: boolean;
  isBanned: boolean;
  blockReason?: string;
  flagReasons: string[];
  suspensionReason?: string;
  banReason?: string;
  lastUpdated: Date;
}

/**
 * Trust & Safety Integration Service
 * 
 * Monitors Trust & Safety events and triggers seller protection
 * when buyers are blocked or flagged during settlement
 */
export class TrustSafetyIntegrationService {
  private safetyEvents: Map<string, TrustSafetyEvent[]> = new Map();
  private userStatuses: Map<string, UserSafetyStatus> = new Map();

  /**
   * Handle user block event
   * Triggers seller protection if buyer is blocked during settlement
   */
  handleUserBlocked(event: TrustSafetyEvent): void {
    try {
      console.log(`[TrustSafetyIntegration] Handling user blocked event for user ${event.userId}`);

      // Update user status
      this.updateUserSafetyStatus(event.userId, {
        isBlocked: true,
        blockReason: event.reason,
        lastUpdated: event.timestamp
      });

      // Store event
      this.storeSafetyEvent(event.userId, event);

      // Check if user is involved in active settlements
      this.checkAndTriggerProtectionForBlockedUser(event);

    } catch (error) {
      console.error('[TrustSafetyIntegration] Error handling user blocked:', error);
    }
  }

  /**
   * Handle user flagged event
   * Monitors flagged users during settlement
   */
  handleUserFlagged(event: TrustSafetyEvent): void {
    try {
      console.log(`[TrustSafetyIntegration] Handling user flagged event for user ${event.userId}`);

      // Update user status
      const currentStatus = this.userStatuses.get(event.userId) || {
        userId: event.userId,
        isBlocked: false,
        isFlagged: false,
        isSuspended: false,
        isBanned: false,
        flagReasons: [],
        lastUpdated: new Date()
      };

      currentStatus.isFlagged = true;
      currentStatus.flagReasons.push(event.reason);
      currentStatus.lastUpdated = event.timestamp;

      this.userStatuses.set(event.userId, currentStatus);

      // Store event
      this.storeSafetyEvent(event.userId, event);

      // Check if user is involved in active settlements
      this.checkAndTriggerProtectionForFlaggedUser(event);

    } catch (error) {
      console.error('[TrustSafetyIntegration] Error handling user flagged:', error);
    }
  }

  /**
   * Handle account suspension
   * Triggers seller protection for suspended buyers
   */
  handleAccountSuspended(event: TrustSafetyEvent): void {
    try {
      console.log(`[TrustSafetyIntegration] Handling account suspension for user ${event.userId}`);

      // Update user status
      this.updateUserSafetyStatus(event.userId, {
        isSuspended: true,
        suspensionReason: event.reason,
        lastUpdated: event.timestamp
      });

      // Store event
      this.storeSafetyEvent(event.userId, event);

      // Check if user is involved in active settlements
      this.checkAndTriggerProtectionForSuspendedUser(event);

    } catch (error) {
      console.error('[TrustSafetyIntegration] Error handling account suspension:', error);
    }
  }

  /**
   * Handle account ban
   * Triggers seller protection for banned buyers
   */
  handleAccountBanned(event: TrustSafetyEvent): void {
    try {
      console.log(`[TrustSafetyIntegration] Handling account ban for user ${event.userId}`);

      // Update user status
      this.updateUserSafetyStatus(event.userId, {
        isBanned: true,
        banReason: event.reason,
        lastUpdated: event.timestamp
      });

      // Store event
      this.storeSafetyEvent(event.userId, event);

      // Check if user is involved in active settlements
      this.checkAndTriggerProtectionForBannedUser(event);

    } catch (error) {
      console.error('[TrustSafetyIntegration] Error handling account ban:', error);
    }
  }

  /**
   * Get user safety status
   */
  getUserSafetyStatus(userId: string): UserSafetyStatus | null {
    return this.userStatuses.get(userId) || null;
  }

  /**
   * Get safety events for user
   */
  getSafetyEvents(userId: string): TrustSafetyEvent[] {
    return this.safetyEvents.get(userId) || [];
  }

  /**
   * Check if user is safe for settlement
   */
  isUserSafeForSettlement(userId: string): boolean {
    const status = this.userStatuses.get(userId);
    if (!status) {
      return true; // Assume safe if no status found
    }

    // User is not safe if blocked, suspended, or banned
    return !status.isBlocked && !status.isSuspended && !status.isBanned;
  }

  /**
   * Check and trigger protection for blocked user
   */
  private checkAndTriggerProtectionForBlockedUser(event: TrustSafetyEvent): void {
    if (event.relatedSettlementId) {
      sellerProtectionService.handleBuyerBlocked(event.relatedSettlementId, event.reason);
    }
  }

  /**
   * Check and trigger protection for flagged user
   */
  private checkAndTriggerProtectionForFlaggedUser(event: TrustSafetyEvent): void {
    // For flagged users, we might want to monitor but not immediately trigger protection
    // unless the flag severity is HIGH or CRITICAL
    if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
      if (event.relatedSettlementId) {
        sellerProtectionService.handleBuyerBlocked(
          event.relatedSettlementId, 
          `User flagged: ${event.reason} (Severity: ${event.severity})`
        );
      }
    }
  }

  /**
   * Check and trigger protection for suspended user
   */
  private checkAndTriggerProtectionForSuspendedUser(event: TrustSafetyEvent): void {
    if (event.relatedSettlementId) {
      sellerProtectionService.handleBuyerBlocked(
        event.relatedSettlementId, 
        `Account suspended: ${event.reason}`
      );
    }
  }

  /**
   * Check and trigger protection for banned user
   */
  private checkAndTriggerProtectionForBannedUser(event: TrustSafetyEvent): void {
    if (event.relatedSettlementId) {
      sellerProtectionService.handleBuyerBlocked(
        event.relatedSettlementId, 
        `Account banned: ${event.reason}`
      );
    }
  }

  /**
   * Update user safety status
   */
  private updateUserSafetyStatus(userId: string, updates: Partial<UserSafetyStatus>): void {
    const currentStatus = this.userStatuses.get(userId) || {
      userId,
      isBlocked: false,
      isFlagged: false,
      isSuspended: false,
      isBanned: false,
      flagReasons: [],
      lastUpdated: new Date()
    };

    Object.assign(currentStatus, updates);
    this.userStatuses.set(userId, currentStatus);
  }

  /**
   * Store safety event
   */
  private storeSafetyEvent(userId: string, event: TrustSafetyEvent): void {
    const events = this.safetyEvents.get(userId) || [];
    events.push(event);
    this.safetyEvents.set(userId, events);
  }

  /**
   * Initialize integration with Trust & Safety system
   */
  initialize(): void {
    console.log('[TrustSafetyIntegration] Initializing Trust & Safety integration service');
    
    // In a real implementation, this would set up event listeners
    // For now, we'll just log that initialization occurred
    console.log('[TrustSafetyIntegration] Trust & Safety integration service initialized');
  }

  /**
   * Shutdown integration service
   */
  shutdown(): void {
    console.log('[TrustSafetyIntegration] Shutting down Trust & Safety integration service');
    
    // In a real implementation, this would clean up event listeners
    console.log('[TrustSafetyIntegration] Trust & Safety integration service shut down');
  }

  /**
   * Reset all data (for testing)
   */
  reset(): void {
    this.safetyEvents.clear();
    this.userStatuses.clear();
  }
}

// Singleton instance
export const trustSafetyIntegrationService = new TrustSafetyIntegrationService();
