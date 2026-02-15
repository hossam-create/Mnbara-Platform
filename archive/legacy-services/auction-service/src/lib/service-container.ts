/**
 * Service Container / Dependency Injection
 * 
 * Centralized service instantiation and management.
 * Makes services easier to test and maintain.
 */

import { prisma } from './prisma';
import { AuctionService } from '../services/auction.service';
import { DisputeService } from '../services/dispute.service';
import { TrustScoreService } from '../services/trust-score.service';
import { TrustScoreCalculatorService } from '../services/trust-score-calculator.service';
import { AnalyticsService } from '../services/analytics.service';
import { AppealsWindowService } from '../services/appeals-window.service';
import { SellerProtectionService } from '../services/seller-protection.service';
import { TrustEnforcementService } from '../services/trust-enforcement.service';
import { SafeguardPolicyService } from '../services/safeguard-policy.service';
import { SafeguardExecutionService } from '../services/safeguard-execution.service';
import { SafeguardStateService } from '../services/safeguard-state.service';
import { TrustActionService } from '../services/trust-action.service';
import { TrustRuleEvaluatorService } from '../services/trust-rule-evaluator.service';
import { AppealTrustActionService } from '../services/appeal-trust-action.service';
import { AppealReviewService } from '../services/appeal-review.service';
import { AppealService } from '../services/appeal.service';
import { EnforcementPolicyService } from '../services/enforcement-policy.service';
import { BidThrottleService } from '../services/bid-throttle.service';
import { ReservePriceService } from '../services/reserve-price.service';

/**
 * Service container for dependency injection
 */
class ServiceContainer {
  private services: Map<string, unknown> = new Map();
  private singletons: Map<string, unknown> = new Map();

  /**
   * Register a service factory
   */
  register<T>(name: string, factory: () => T): void {
    this.services.set(name, factory);
  }

  /**
   * Register a singleton service
   */
  registerSingleton<T>(name: string, factory: () => T): void {
    this.register(name, () => {
      if (!this.singletons.has(name)) {
        this.singletons.set(name, factory());
      }
      return this.singletons.get(name) as T;
    });
  }

  /**
   * Get a service instance
   */
  get<T>(name: string): T {
    const factory = this.services.get(name);
    if (!factory) {
      throw new Error(`Service '${name}' not found in container`);
    }
    return (factory as () => T)();
  }

  /**
   * Clear all services
   */
  clear(): void {
    this.services.clear();
    this.singletons.clear();
  }
}

// Create and configure the service container
const container = new ServiceContainer();

// ============================================================
// REGISTER SERVICES
// ============================================================

// Core services (singletons)
container.registerSingleton('auctionService', () => new AuctionService());
container.registerSingleton('disputeService', () => new DisputeService());
container.registerSingleton('trustScoreService', () => new TrustScoreService());
container.registerSingleton('trustScoreCalculatorService', () => new TrustScoreCalculatorService());
container.registerSingleton('analyticsService', () => new AnalyticsService());
container.registerSingleton('appealsWindowService', () => new AppealsWindowService());
container.registerSingleton('sellerProtectionService', () => new SellerProtectionService());
container.registerSingleton('trustEnforcementService', () => new TrustEnforcementService());
container.registerSingleton('safeguardPolicyService', () => new SafeguardPolicyService());
container.registerSingleton('safeguardExecutionService', () => new SafeguardExecutionService());
container.registerSingleton('safeguardStateService', () => new SafeguardStateService());
container.registerSingleton('trustActionService', () => new TrustActionService());
container.registerSingleton('trustRuleEvaluatorService', () => new TrustRuleEvaluatorService());
container.registerSingleton('appealTrustActionService', () => new AppealTrustActionService());
container.registerSingleton('appealReviewService', () => new AppealReviewService());
container.registerSingleton('appealService', () => new AppealService());
container.registerSingleton('enforcementPolicyService', () => new EnforcementPolicyService());
container.registerSingleton('bidThrottleService', () => new BidThrottleService());
container.registerSingleton('reservePriceService', () => new ReservePriceService());

// ============================================================
// EXPORT CONVENIENCE FUNCTIONS
// ============================================================

export function getAuctionService(): AuctionService {
  return container.get<AuctionService>('auctionService');
}

export function getDisputeService(): DisputeService {
  return container.get<DisputeService>('disputeService');
}

export function getTrustScoreService(): TrustScoreService {
  return container.get<TrustScoreService>('trustScoreService');
}

export function getTrustScoreCalculatorService(): TrustScoreCalculatorService {
  return container.get<TrustScoreCalculatorService>('trustScoreCalculatorService');
}

export function getAnalyticsService(): AnalyticsService {
  return container.get<AnalyticsService>('analyticsService');
}

export function getAppealsWindowService(): AppealsWindowService {
  return container.get<AppealsWindowService>('appealsWindowService');
}

export function getSellerProtectionService(): SellerProtectionService {
  return container.get<SellerProtectionService>('sellerProtectionService');
}

export function getTrustEnforcementService(): TrustEnforcementService {
  return container.get<TrustEnforcementService>('trustEnforcementService');
}

export function getSafeguardPolicyService(): SafeguardPolicyService {
  return container.get<SafeguardPolicyService>('safeguardPolicyService');
}

export function getSafeguardExecutionService(): SafeguardExecutionService {
  return container.get<SafeguardExecutionService>('safeguardExecutionService');
}

export function getSafeguardStateService(): SafeguardStateService {
  return container.get<SafeguardStateService>('safeguardStateService');
}

export function getTrustActionService(): TrustActionService {
  return container.get<TrustActionService>('trustActionService');
}

export function getTrustRuleEvaluatorService(): TrustRuleEvaluatorService {
  return container.get<TrustRuleEvaluatorService>('trustRuleEvaluatorService');
}

export function getAppealTrustActionService(): AppealTrustActionService {
  return container.get<AppealTrustActionService>('appealTrustActionService');
}

export function getAppealReviewService(): AppealReviewService {
  return container.get<AppealReviewService>('appealReviewService');
}

export function getAppealService(): AppealService {
  return container.get<AppealService>('appealService');
}

export function getEnforcementPolicyService(): EnforcementPolicyService {
  return container.get<EnforcementPolicyService>('enforcementPolicyService');
}

export function getBidThrottleService(): BidThrottleService {
  return container.get<BidThrottleService>('bidThrottleService');
}

export function getReservePriceService(): ReservePriceService {
  return container.get<ReservePriceService>('reservePriceService');
}

export { container };
