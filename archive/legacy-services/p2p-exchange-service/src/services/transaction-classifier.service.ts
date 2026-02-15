import { Decimal } from '@prisma/client/runtime/library';
import { SettlementMethod } from '../types/enums';
import { ExchangeRequest } from '@prisma/client';
import { TrustLevelService } from './trust-level.service';

/**
 * Transaction Classifier Service
 * 
 * Classifies transactions by amount to determine the appropriate settlement method:
 * - Small amounts (< $300): Internal netting only
 * - Medium amounts ($300-$1000): Optional external escrow
 * - Large amounts (> $1000): External escrow mandatory
 * 
 * Also considers user trust level for classification decisions.
 */
export class TransactionClassifierService {
  constructor(private trustLevelService: TrustLevelService) {}

  /**
   * Classify a transaction to determine settlement method
   * 
   * @param request - Exchange request to classify
   * @returns Settlement method (INTERNAL, EXTERNAL_OPTIONAL, or EXTERNAL_MANDATORY)
   */
  async classifyTransaction(request: ExchangeRequest): Promise<SettlementMethod> {
    const amount = new Decimal(request.fromAmount);
    const trustLevel = await this.trustLevelService.getTrustLevel(request.userId);

    // Small amounts (< $300) - Internal only
    if (amount.lessThan(300)) {
      return SettlementMethod.INTERNAL;
    }

    // Large amounts (> $1000) - External mandatory
    if (amount.greaterThan(1000)) {
      return SettlementMethod.EXTERNAL_MANDATORY;
    }

    // Medium amounts ($300-$1000) - Decision based on user preference and trust level
    // Check if user explicitly requested external escrow
    if (request.useExternalEscrow) {
      return SettlementMethod.EXTERNAL_OPTIONAL;
    }

    // Low trust users (level < 3) require external escrow for medium amounts
    if (trustLevel.level < 3) {
      return SettlementMethod.EXTERNAL_MANDATORY;
    }

    // Default to internal for trusted users
    return SettlementMethod.INTERNAL;
  }

  /**
   * Get classification rules for display to users
   * 
   * @returns Array of classification rules
   */
  getClassificationRules(): Array<{
    amountRange: string;
    settlementMethod: SettlementMethod;
    description: string;
  }> {
    return [
      {
        amountRange: '< $300',
        settlementMethod: SettlementMethod.INTERNAL,
        description: 'Small amounts use internal netting for fast, low-cost settlement'
      },
      {
        amountRange: '$300 - $1000',
        settlementMethod: SettlementMethod.EXTERNAL_OPTIONAL,
        description: 'Medium amounts can optionally use external escrow for added security'
      },
      {
        amountRange: '> $1000',
        settlementMethod: SettlementMethod.EXTERNAL_MANDATORY,
        description: 'Large amounts require external escrow for maximum security'
      }
    ];
  }

  /**
   * Check if external escrow is required for a given amount and trust level
   * 
   * @param amount - Transaction amount
   * @param trustLevel - User trust level
   * @returns True if external escrow is required
   */
  isExternalEscrowRequired(amount: Decimal, trustLevel: number): boolean {
    // Large amounts always require external escrow
    if (amount.greaterThan(1000)) {
      return true;
    }

    // Medium amounts require external escrow for low trust users
    if (amount.greaterThanOrEqualTo(300) && amount.lessThanOrEqualTo(1000)) {
      return trustLevel < 3;
    }

    // Small amounts never require external escrow
    return false;
  }

  /**
   * Check if external escrow is available as an option
   * 
   * @param amount - Transaction amount
   * @returns True if external escrow can be used
   */
  isExternalEscrowAvailable(amount: Decimal): boolean {
    // External escrow is available for medium and large amounts
    return amount.greaterThanOrEqualTo(300);
  }

  /**
   * Get recommended settlement method with explanation
   * 
   * @param request - Exchange request
   * @returns Recommendation with settlement method and explanation
   */
  async getRecommendation(request: ExchangeRequest): Promise<{
    settlementMethod: SettlementMethod;
    reason: string;
    alternatives?: string[];
  }> {
    const amount = new Decimal(request.fromAmount);
    const trustLevel = await this.trustLevelService.getTrustLevel(request.userId);
    const settlementMethod = await this.classifyTransaction(request);

    if (amount.lessThan(300)) {
      return {
        settlementMethod,
        reason: 'Small amount - internal netting provides fast, low-cost settlement'
      };
    }

    if (amount.greaterThan(1000)) {
      return {
        settlementMethod,
        reason: 'Large amount - external escrow required for maximum security and protection'
      };
    }

    // Medium amounts
    if (trustLevel.level < 3) {
      return {
        settlementMethod,
        reason: 'External escrow required due to trust level - build your reputation to unlock internal netting'
      };
    }

    if (request.useExternalEscrow) {
      return {
        settlementMethod,
        reason: 'External escrow selected for added security',
        alternatives: ['You can use internal netting for faster, lower-cost settlement']
      };
    }

    return {
      settlementMethod,
      reason: 'Internal netting recommended for trusted users - fast and low-cost',
      alternatives: ['You can optionally use external escrow for added security']
    };
  }
}
