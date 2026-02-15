import { RulesEngine } from './RulesEngine.service';
import { RuleContext, RuleResult, RuleEngineEvaluationSummary } from '../types/Rule.types';
import { ruleLogger } from './RuleLogger.service';

/**
 * Integration service for Rules Engine pre-checks
 * 
 * ABSOLUTE RULES:
 * - READ ONLY operations only
 * - Rules Engine does NOT decide business logic
 * - It only advises — enforcement happens elsewhere
 * 
 * INTEGRATION LOGIC:
 * - If RuleResult = DENY → block action
 * - If FLAG → allow but mark for review
 * - If ALLOW → continue normally
 */

export interface IntegrationResult {
  decision: 'ALLOW' | 'DENY' | 'FLAG';
  shouldBlock: boolean;
  shouldReview: boolean;
  summary: RuleEngineEvaluationSummary;
  reason?: string;
}

export class RulesIntegration {
  private rulesEngine: RulesEngine;

  constructor(rulesEngine: RulesEngine) {
    this.rulesEngine = rulesEngine;
  }

  /**
   * Generic pre-check method for all integration points
   */
  private async performPreCheck(
    integrationPoint: string,
    context: RuleContext
  ): Promise<IntegrationResult> {
    try {
      // Evaluate rules
      const evaluation = await this.rulesEngine.evaluate(context);
      
      // Log the integration check
      ruleLogger.logIntegrationCheck(
        integrationPoint,
        context,
        evaluation,
        evaluation.finalDecision
      );

      // Determine decision based on final rule result
      const decision = evaluation.finalDecision;
      const shouldBlock = decision === RuleResult.DENY;
      const shouldReview = decision === RuleResult.FLAG;

      // Build result
      const result: IntegrationResult = {
        decision,
        shouldBlock,
        shouldReview,
        summary: evaluation,
        reason: this.buildReason(evaluation)
      };

      return result;
    } catch (error) {
      // Log error but never break the flow
      ruleLogger.logError('INTEGRATION_CHECK_ERROR', error as Error, { integrationPoint, context });
      
      // On error, default to ALLOW to prevent blocking legitimate actions
      return {
        decision: 'ALLOW',
        shouldBlock: false,
        shouldReview: false,
        summary: {
          context,
          results: [],
          summary: { total: 0, allow: 0, deny: 0, flag: 0 },
          finalDecision: RuleResult.ALLOW,
          evaluatedAt: new Date()
        },
        reason: 'Rules evaluation failed, allowing by default'
      };
    }
  }

  /**
   * Build human-readable reason from evaluation results
   */
  private buildReason(evaluation: RuleEngineEvaluationSummary): string {
    const denies = evaluation.results.filter(r => r.result === RuleResult.DENY);
    const flags = evaluation.results.filter(r => r.result === RuleResult.FLAG);

    if (denies.length > 0) {
      return `Action blocked: ${denies.map(d => d.reason).join('; ')}`;
    }

    if (flags.length > 0) {
      return `Action flagged for review: ${flags.map(f => f.reason).join('; ')}`;
    }

    return 'Action allowed: All rules passed';
  }

  /**
   * BID PLACEMENT Integration Point
   * READ ONLY - Does not modify any data
   */
  async checkBidPlacement(
    userId: string,
    auctionId: string,
    bidAmount: number,
    userMetadata: Record<string, any> = {}
  ): Promise<IntegrationResult> {
    const context: RuleContext = {
      actor: {
        id: userId,
        type: 'USER',
        metadata: userMetadata
      },
      target: {
        id: auctionId,
        type: 'AUCTION'
      },
      action: {
        type: 'BID',
        metadata: { amount: bidAmount }
      },
      environment: {
        timestamp: new Date()
      }
    };

    return this.performPreCheck('BID_PLACEMENT', context);
  }

  /**
   * TRAVELER REQUEST ACCEPTANCE Integration Point
   * READ ONLY - Does not modify any data
   */
  async checkTravelerRequest(
    travelerId: string,
    requestId: string,
    requestType: string,
    travelerMetadata: Record<string, any> = {}
  ): Promise<IntegrationResult> {
    const context: RuleContext = {
      actor: {
        id: travelerId,
        type: 'USER',
        metadata: travelerMetadata
      },
      target: {
        id: requestId,
        type: 'USER' // Assuming requests are user-to-user
      },
      action: {
        type: 'REGISTER', // Using REGISTER as a proxy for new requests
        metadata: { requestType }
      },
      environment: {
        timestamp: new Date()
      }
    };

    return this.performPreCheck('TRAVELER_REQUEST_ACCEPTANCE', context);
  }

  /**
   * SELLER LISTING CREATION Integration Point
   * READ ONLY - Does not modify any data
   */
  async checkSellerListing(
    sellerId: string,
    listingData: any,
    sellerMetadata: Record<string, any> = {}
  ): Promise<IntegrationResult> {
    const context: RuleContext = {
      actor: {
        id: sellerId,
        type: 'USER',
        metadata: sellerMetadata
      },
      target: {
        id: listingData.id || 'pending',
        type: 'LISTING'
      },
      action: {
        type: 'LIST',
        metadata: {
          category: listingData.category,
          price: listingData.price,
          title: listingData.title
        }
      },
      environment: {
        timestamp: new Date()
      }
    };

    return this.performPreCheck('SELLER_LISTING_CREATION', context);
  }

  /**
   * PAYMENT RETRY ATTEMPT Integration Point
   * READ ONLY - Does not modify any data
   */
  async checkPaymentRetry(
    userId: string,
    paymentId: string,
    retryCount: number,
    firstAttemptTime?: string,
    paymentMetadata: Record<string, any> = {}
  ): Promise<IntegrationResult> {
    const context: RuleContext = {
      actor: {
        id: userId,
        type: 'USER',
        metadata: paymentMetadata
      },
      target: {
        id: paymentId,
        type: 'PAYMENT'
      },
      action: {
        type: 'PAY',
        metadata: {
          retryCount,
          firstAttemptTime,
          isRetry: true
        }
      },
      environment: {
        timestamp: new Date()
      }
    };

    return this.performPreCheck('PAYMENT_RETRY_ATTEMPT', context);
  }

  /**
   * Get logging statistics
   */
  getLogStats(): { logFilePath: string; currentSize: number; maxSize: number } {
    return ruleLogger.getLogStats();
  }
}

/**
 * Factory function to create integration service with default rules engine
 */
export function createRulesIntegration(): RulesIntegration {
  const rulesEngine = new RulesEngine();
  
  // Register core rules automatically
  import('../rules/core').then(({ coreRules }) => {
    coreRules.forEach(rule => rulesEngine.registerRule(rule));
  }).catch(error => {
    ruleLogger.logError('CORE_RULES_REGISTRATION_ERROR', error);
  });

  return new RulesIntegration(rulesEngine);
}

// Default singleton instance
export const rulesIntegration = createRulesIntegration();
