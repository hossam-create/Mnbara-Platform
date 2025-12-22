/**
 * Payment Advisory Service
 * READ-ONLY - Intelligence Only
 *
 * HARD RULES:
 * - No calls to banks
 * - No PSP SDKs
 * - No payment APIs
 * - No side effects
 * - Read-only services only
 *
 * This service provides:
 * - Payment method comparison (static rules + config)
 * - FX advisory (rates from external snapshot)
 * - Risk flags generation
 * - Explanation builder
 */

import { v4 as uuidv4 } from 'uuid';
import { getFeatureFlags } from '../config/feature-flags';
import {
  PaymentMethodComparison,
  PaymentMethodOption,
  FXAdvisoryResult,
  FXRateComparison,
  PaymentRiskAssessment,
  PaymentRiskWarning,
  PaymentRiskType,
  AdvisoryDisclaimer,
  PaymentAdvisoryRequest,
  PaymentAdvisorySnapshot,
  PaymentAdvisoryHealth,
  ComplianceAdvisoryResult,
  ComplianceBoundary,
  PartnerReadinessResult,
  PartnerReadinessCheck,
  FeeBreakdown,
} from '../types/payment-advisory.types';
import {
  PAYMENT_METHODS,
  FX_SNAPSHOT,
  getMethodsForCorridor,
  calculateFee,
  getFXRate,
} from '../config/payment-methods.config';

// ===========================================
// Audit Snapshot Store (in-memory for demo)
// ===========================================

const auditSnapshots: Map<string, PaymentAdvisorySnapshot> = new Map();
const MAX_SNAPSHOTS = 1000;

// ===========================================
// Disclaimer Generator
// ===========================================

function generateDisclaimer(): AdvisoryDisclaimer {
  return {
    type: 'PAYMENT_ADVISORY',
    text: 'This is advisory information only. No payment has been initiated or processed. Actual rates, fees, and availability may vary. This service does not execute transactions.',
    isAdvisoryOnly: true,
    noExecution: true,
    noGuarantee: true,
    timestamp: new Date().toISOString(),
  };
}

// ===========================================
// Payment Advisory Service
// ===========================================

export class PaymentAdvisoryService {
  /**
   * Compare payment methods for a corridor
   * READ-ONLY - No execution
   */
  comparePaymentMethods(request: PaymentAdvisoryRequest): PaymentMethodComparison {
    const flags = getFeatureFlags();
    const requestId = request.requestId || uuidv4();

    // Check kill switch
    if (flags.EMERGENCY_DISABLE_ALL || !flags.PAYMENT_ADVISORY_ENABLED) {
      return this.emptyMethodComparison(requestId, request.corridor, request.amountUSD);
    }

    const availableMethods = getMethodsForCorridor(request.corridor);
    const options: PaymentMethodOption[] = [];

    for (const method of PAYMENT_METHODS) {
      const isAvailable = availableMethods.some((m) => m.id === method.id);
      const fee = calculateFee(method, request.amountUSD);

      // Check limits
      const withinLimits =
        request.amountUSD >= method.limits.minAmount &&
        request.amountUSD <= method.limits.maxAmount;

      const option: PaymentMethodOption = {
        methodId: method.id,
        methodName: method.name,
        available: isAvailable && withinLimits && method.available,
        unavailableReason: !isAvailable
          ? 'Not available for this corridor'
          : !withinLimits
            ? `Amount outside limits ($${method.limits.minAmount}-$${method.limits.maxAmount})`
            : !method.available
              ? 'Temporarily unavailable'
              : undefined,
        estimatedFeeUSD: Math.round(fee * 100) / 100,
        estimatedTotal: Math.round((request.amountUSD + fee) * 100) / 100,
        processingTime: method.processingTime.typical,
        riskLevel: method.riskLevel,
        pros: this.getMethodPros(method),
        cons: this.getMethodCons(method),
        score: this.calculateMethodScore(method, request),
      };

      options.push(option);
    }

    // Sort by score (highest first)
    options.sort((a, b) => b.score - a.score);

    // Find recommended (highest score that's available)
    const recommended = options.find((o) => o.available);

    const result: PaymentMethodComparison = {
      requestId,
      timestamp: new Date().toISOString(),
      corridor: request.corridor,
      amountUSD: request.amountUSD,
      methods: options,
      recommended: recommended?.methodId || null,
      recommendationReason: recommended
        ? `${recommended.methodName} offers the best balance of fees, speed, and security for this transaction.`
        : 'No payment methods available for this corridor and amount.',
      disclaimer: generateDisclaimer(),
    };

    // Audit snapshot
    this.recordSnapshot(requestId, request, result, null, null);

    return result;
  }

  /**
   * Get FX advisory
   * READ-ONLY - Uses static snapshot, no live API calls
   */
  getFXAdvisory(
    fromCurrency: string,
    toCurrency: string,
    amount: number,
    requestId?: string
  ): FXAdvisoryResult {
    const flags = getFeatureFlags();
    const reqId = requestId || uuidv4();

    if (flags.EMERGENCY_DISABLE_ALL || !flags.PAYMENT_ADVISORY_ENABLED) {
      return this.emptyFXAdvisory(reqId, fromCurrency, toCurrency, amount);
    }

    const marketRate = getFXRate(fromCurrency, toCurrency);
    const warnings: string[] = [];

    if (!marketRate) {
      warnings.push(`Exchange rate not available for ${fromCurrency}/${toCurrency}`);
    }

    // Simulate provider rates with spreads
    const providers = [
      { name: 'Bank Transfer', spreadPercent: 3.0, fee: 25 },
      { name: 'Card Payment', spreadPercent: 2.5, fee: 0 },
      { name: 'Digital Wallet', spreadPercent: 2.0, fee: 5 },
    ];

    const rates: FXRateComparison[] = providers.map((provider) => {
      const providerRate = marketRate ? marketRate * (1 - provider.spreadPercent / 100) : 0;
      const convertedAmount = amount * providerRate;
      const totalCost = amount + provider.fee;

      return {
        provider: provider.name,
        rate: Math.round(providerRate * 10000) / 10000,
        inverseRate: providerRate ? Math.round((1 / providerRate) * 10000) / 10000 : 0,
        convertedAmount: Math.round(convertedAmount * 100) / 100,
        fee: provider.fee,
        totalCost: Math.round(totalCost * 100) / 100,
        spreadFromMarket: marketRate ? marketRate - providerRate : 0,
        spreadPercent: provider.spreadPercent,
        isRecommended: false,
      };
    });

    // Mark best rate
    if (rates.length > 0) {
      const best = rates.reduce((a, b) => (a.convertedAmount > b.convertedAmount ? a : b));
      best.isRecommended = true;
    }

    const bestRate = rates.find((r) => r.isRecommended) || null;

    // Add volatility warning if applicable
    if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
      warnings.push('Cross-currency conversion may have additional volatility');
    }

    const result: FXAdvisoryResult = {
      requestId: reqId,
      timestamp: new Date().toISOString(),
      fromCurrency,
      toCurrency,
      amount,
      rates,
      bestRate,
      marketRate: marketRate || 0,
      spread: bestRate ? marketRate! - bestRate.rate : 0,
      spreadPercent: bestRate ? bestRate.spreadPercent : 0,
      warnings,
      explanation: this.buildFXExplanation(fromCurrency, toCurrency, amount, bestRate),
      disclaimer: generateDisclaimer(),
    };

    return result;
  }

  /**
   * Assess payment risks
   * READ-ONLY - No execution
   */
  assessPaymentRisks(request: PaymentAdvisoryRequest): PaymentRiskAssessment {
    const flags = getFeatureFlags();
    const requestId = request.requestId || uuidv4();

    if (flags.EMERGENCY_DISABLE_ALL || !flags.PAYMENT_ADVISORY_ENABLED) {
      return this.emptyRiskAssessment(requestId, request.corridor, request.amountUSD);
    }

    const warnings: PaymentRiskWarning[] = [];
    let riskScore = 0;

    // High value transaction
    if (request.amountUSD > 500) {
      warnings.push({
        id: `risk-${uuidv4().slice(0, 8)}`,
        type: 'HIGH_VALUE_TRANSACTION',
        severity: request.amountUSD > 2000 ? 'CRITICAL' : 'WARNING',
        title: 'High Value Transaction',
        description: `Transaction amount ($${request.amountUSD}) exceeds standard thresholds.`,
        recommendation: 'Consider using escrow protection and verified payment methods.',
        affectedMethods: ['COD', 'WALLET_PAYPAL'],
      });
      riskScore += request.amountUSD > 2000 ? 30 : 15;
    }

    // Cross-border complexity
    if (request.corridor.includes('_')) {
      warnings.push({
        id: `risk-${uuidv4().slice(0, 8)}`,
        type: 'CROSS_BORDER_COMPLEXITY',
        severity: 'INFO',
        title: 'Cross-Border Transaction',
        description: 'International transactions may have additional processing requirements.',
        recommendation: 'Allow extra time for processing and verification.',
        affectedMethods: ['BANK_TRANSFER_SWIFT'],
      });
      riskScore += 10;
    }

    // Trust mismatch
    if (request.buyerTrustLevel === 'NEW' || request.travelerTrustLevel === 'NEW') {
      warnings.push({
        id: `risk-${uuidv4().slice(0, 8)}`,
        type: 'TRUST_MISMATCH',
        severity: 'WARNING',
        title: 'New User Involved',
        description: 'One or more parties have limited transaction history.',
        recommendation: 'Consider lower-value transactions or additional verification.',
        affectedMethods: ['COD'],
      });
      riskScore += 20;
    }

    // Corridor-specific restrictions
    if (request.corridor.includes('SA')) {
      warnings.push({
        id: `risk-${uuidv4().slice(0, 8)}`,
        type: 'CORRIDOR_RESTRICTION',
        severity: 'INFO',
        title: 'Corridor-Specific Requirements',
        description: 'Saudi Arabia has specific payment regulations.',
        recommendation: 'Ensure compliance with local payment requirements.',
        affectedMethods: ['WALLET_PAYPAL'],
      });
      riskScore += 5;
    }

    // Determine overall risk level
    let overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (riskScore >= 50) {
      overallRiskLevel = 'CRITICAL';
    } else if (riskScore >= 30) {
      overallRiskLevel = 'HIGH';
    } else if (riskScore >= 15) {
      overallRiskLevel = 'MEDIUM';
    } else {
      overallRiskLevel = 'LOW';
    }

    const mitigations = this.generateMitigations(warnings);

    const result: PaymentRiskAssessment = {
      requestId,
      timestamp: new Date().toISOString(),
      corridor: request.corridor,
      amountUSD: request.amountUSD,
      overallRiskLevel,
      riskScore: Math.min(100, riskScore),
      warnings,
      mitigations,
      explanation: this.buildRiskExplanation(overallRiskLevel, warnings),
      disclaimer: generateDisclaimer(),
    };

    // Audit snapshot
    this.recordSnapshot(requestId, request, null, null, result);

    return result;
  }

  /**
   * Get service health
   * READ-ONLY
   */
  getHealth(): PaymentAdvisoryHealth {
    const flags = getFeatureFlags();

    return {
      status: flags.EMERGENCY_DISABLE_ALL ? 'unhealthy' : 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        methodComparison: !flags.EMERGENCY_DISABLE_ALL && flags.PAYMENT_ADVISORY_ENABLED,
        fxAdvisory: !flags.EMERGENCY_DISABLE_ALL && flags.PAYMENT_ADVISORY_ENABLED,
        riskAssessment: !flags.EMERGENCY_DISABLE_ALL && flags.PAYMENT_ADVISORY_ENABLED,
      },
      featureFlags: {
        paymentAdvisoryEnabled: flags.PAYMENT_ADVISORY_ENABLED,
        emergencyDisabled: flags.EMERGENCY_DISABLE_ALL,
      },
      lastFXUpdate: FX_SNAPSHOT.timestamp,
      version: '1.0.0',
    };
  }

  /**
   * Get audit snapshot by request ID
   * READ-ONLY
   */
  getSnapshot(requestId: string): PaymentAdvisorySnapshot | null {
    return auditSnapshots.get(requestId) || null;
  }

  // ===========================================
  // Private Helper Methods
  // ===========================================

  private getMethodPros(method: typeof PAYMENT_METHODS[0]): string[] {
    const pros: string[] = [];
    if (method.processingTime.maxHours <= 24) pros.push('Fast processing');
    if (method.feeStructure.percentageFee < 2) pros.push('Low fees');
    if (method.riskLevel === 'LOW') pros.push('Low risk');
    if (!method.requiresKYC) pros.push('No KYC required');
    if (method.limits.maxAmount >= 10000) pros.push('High limits');
    return pros;
  }

  private getMethodCons(method: typeof PAYMENT_METHODS[0]): string[] {
    const cons: string[] = [];
    if (method.processingTime.maxHours > 48) cons.push('Slow processing');
    if (method.feeStructure.percentageFee > 3) cons.push('Higher fees');
    if (method.riskLevel === 'HIGH') cons.push('Higher risk');
    if (method.requiresKYC) cons.push('KYC required');
    if (method.limits.maxAmount < 1000) cons.push('Low limits');
    return cons;
  }

  private calculateMethodScore(
    method: typeof PAYMENT_METHODS[0],
    request: PaymentAdvisoryRequest
  ): number {
    let score = 50; // Base score

    // Fee impact (lower is better)
    const fee = calculateFee(method, request.amountUSD);
    const feePercent = (fee / request.amountUSD) * 100;
    score += Math.max(0, 20 - feePercent * 5);

    // Speed impact
    if (method.processingTime.maxHours <= 24) score += 15;
    else if (method.processingTime.maxHours <= 48) score += 10;
    else score += 5;

    // Risk impact
    if (method.riskLevel === 'LOW') score += 15;
    else if (method.riskLevel === 'MEDIUM') score += 10;
    else score += 0;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  private buildFXExplanation(
    from: string,
    to: string,
    amount: number,
    bestRate: FXRateComparison | null
  ): string {
    if (!bestRate) {
      return `Unable to provide FX advisory for ${from} to ${to}.`;
    }
    return `Converting ${amount} ${from} to ${to}: Best rate available is ${bestRate.rate} via ${bestRate.provider}, resulting in approximately ${bestRate.convertedAmount} ${to}. The spread from market rate is ${bestRate.spreadPercent}%.`;
  }

  private buildRiskExplanation(
    level: string,
    warnings: PaymentRiskWarning[]
  ): string {
    const warningCount = warnings.length;
    const criticalCount = warnings.filter((w) => w.severity === 'CRITICAL').length;

    if (warningCount === 0) {
      return 'No significant payment risks identified for this transaction.';
    }

    return `${warningCount} risk factor(s) identified${criticalCount > 0 ? ` including ${criticalCount} critical` : ''}. Overall risk level: ${level}. Review warnings and consider mitigations before proceeding.`;
  }

  private generateMitigations(warnings: PaymentRiskWarning[]): string[] {
    const mitigations: string[] = [];

    if (warnings.some((w) => w.type === 'HIGH_VALUE_TRANSACTION')) {
      mitigations.push('Use escrow protection for high-value transactions');
      mitigations.push('Verify identity of all parties before proceeding');
    }

    if (warnings.some((w) => w.type === 'TRUST_MISMATCH')) {
      mitigations.push('Start with smaller transactions to build trust');
      mitigations.push('Request additional verification from new users');
    }

    if (warnings.some((w) => w.type === 'CROSS_BORDER_COMPLEXITY')) {
      mitigations.push('Allow extra processing time for international transfers');
      mitigations.push('Confirm recipient details before initiating transfer');
    }

    return mitigations;
  }

  private recordSnapshot(
    requestId: string,
    request: PaymentAdvisoryRequest,
    methodComparison: PaymentMethodComparison | null,
    fxAdvisory: FXAdvisoryResult | null,
    riskAssessment: PaymentRiskAssessment | null
  ): void {
    const flags = getFeatureFlags();

    const snapshot: PaymentAdvisorySnapshot = {
      requestId,
      timestamp: new Date().toISOString(),
      request,
      methodComparison,
      fxAdvisory,
      riskAssessment,
      featureFlags: {
        paymentAdvisoryEnabled: flags.PAYMENT_ADVISORY_ENABLED,
        fxAdvisoryEnabled: flags.PAYMENT_ADVISORY_ENABLED,
        riskAdvisoryEnabled: flags.PAYMENT_ADVISORY_ENABLED,
      },
    };

    auditSnapshots.set(requestId, snapshot);

    // Cleanup old snapshots
    if (auditSnapshots.size > MAX_SNAPSHOTS) {
      const oldest = auditSnapshots.keys().next().value;
      if (oldest) auditSnapshots.delete(oldest);
    }
  }

  private emptyMethodComparison(
    requestId: string,
    corridor: string,
    amountUSD: number
  ): PaymentMethodComparison {
    return {
      requestId,
      timestamp: new Date().toISOString(),
      corridor,
      amountUSD,
      methods: [],
      recommended: null,
      recommendationReason: 'Payment advisory is currently disabled.',
      disclaimer: generateDisclaimer(),
    };
  }

  private emptyFXAdvisory(
    requestId: string,
    fromCurrency: string,
    toCurrency: string,
    amount: number
  ): FXAdvisoryResult {
    return {
      requestId,
      timestamp: new Date().toISOString(),
      fromCurrency,
      toCurrency,
      amount,
      rates: [],
      bestRate: null,
      marketRate: 0,
      spread: 0,
      spreadPercent: 0,
      warnings: ['FX advisory is currently disabled.'],
      explanation: 'FX advisory is currently disabled.',
      disclaimer: generateDisclaimer(),
    };
  }

  private emptyRiskAssessment(
    requestId: string,
    corridor: string,
    amountUSD: number
  ): PaymentRiskAssessment {
    return {
      requestId,
      timestamp: new Date().toISOString(),
      corridor,
      amountUSD,
      overallRiskLevel: 'LOW',
      riskScore: 0,
      warnings: [],
      mitigations: [],
      explanation: 'Risk assessment is currently disabled.',
      disclaimer: generateDisclaimer(),
    };
  }

  /**
   * Get compliance advisory for a corridor
   * READ-ONLY - No execution
   */
  getComplianceAdvisory(request: PaymentAdvisoryRequest): ComplianceAdvisoryResult {
    const flags = getFeatureFlags();
    const requestId = request.requestId || uuidv4();

    if (flags.EMERGENCY_DISABLE_ALL || !flags.PAYMENT_ADVISORY_ENABLED) {
      return this.emptyComplianceAdvisory(requestId, request.corridor, request.amountUSD);
    }

    const boundaries: ComplianceBoundary[] = [];
    const blockers: string[] = [];
    const recommendations: string[] = [];

    // KYC Requirements
    if (request.amountUSD > 1000) {
      boundaries.push({
        id: `comp-kyc-${requestId.slice(0, 8)}`,
        type: 'KYC_REQUIREMENT',
        jurisdiction: request.originCountry,
        requirement: 'Enhanced KYC verification required for transactions over $1000',
        status: 'PENDING',
        explanation: 'Identity verification must be completed before proceeding.',
      });
      recommendations.push('Complete KYC verification before initiating high-value transactions');
    }

    // AML Check
    boundaries.push({
      id: `comp-aml-${requestId.slice(0, 8)}`,
      type: 'AML_CHECK',
      jurisdiction: 'GLOBAL',
      requirement: 'Anti-Money Laundering screening',
      status: 'COMPLIANT',
      explanation: 'Standard AML checks will be performed on all transactions.',
    });

    // Cross-border limits
    if (request.corridor.includes('_')) {
      const [origin, dest] = request.corridor.split('_');
      
      // Check for restricted corridors
      const restrictedCorridors = ['IR', 'KP', 'SY', 'CU'];
      if (restrictedCorridors.includes(origin) || restrictedCorridors.includes(dest)) {
        boundaries.push({
          id: `comp-sanc-${requestId.slice(0, 8)}`,
          type: 'SANCTIONS_SCREENING',
          jurisdiction: 'GLOBAL',
          requirement: 'Sanctions compliance check',
          status: 'BLOCKED',
          explanation: 'This corridor is subject to international sanctions.',
        });
        blockers.push('Corridor blocked due to sanctions restrictions');
      }

      // Cross-border limits
      if (request.amountUSD > 10000) {
        boundaries.push({
          id: `comp-xborder-${requestId.slice(0, 8)}`,
          type: 'CROSS_BORDER_LIMIT',
          jurisdiction: origin,
          requirement: 'Cross-border transaction reporting threshold',
          status: 'REVIEW_REQUIRED' as any,
          explanation: 'Transactions over $10,000 require additional documentation.',
        });
        recommendations.push('Prepare source of funds documentation for large transfers');
      }
    }

    // Currency restrictions for certain corridors
    if (request.corridor.includes('EG')) {
      boundaries.push({
        id: `comp-curr-${requestId.slice(0, 8)}`,
        type: 'CURRENCY_RESTRICTION',
        jurisdiction: 'EG',
        requirement: 'Egyptian Pound conversion restrictions',
        status: 'COMPLIANT',
        explanation: 'EGP conversions subject to Central Bank of Egypt regulations.',
      });
    }

    // Determine overall status
    let overallStatus: 'CLEAR' | 'REVIEW_REQUIRED' | 'BLOCKED';
    if (blockers.length > 0) {
      overallStatus = 'BLOCKED';
    } else if (boundaries.some(b => b.status === 'PENDING')) {
      overallStatus = 'REVIEW_REQUIRED';
    } else {
      overallStatus = 'CLEAR';
    }

    return {
      requestId,
      timestamp: new Date().toISOString(),
      corridor: request.corridor,
      amountUSD: request.amountUSD,
      boundaries,
      overallStatus,
      blockers,
      recommendations,
      disclaimer: generateDisclaimer(),
    };
  }

  /**
   * Check partner/bank readiness for a corridor
   * READ-ONLY - No actual bank connections
   */
  checkPartnerReadiness(corridor: string, requestId?: string): PartnerReadinessResult {
    const flags = getFeatureFlags();
    const reqId = requestId || uuidv4();

    if (flags.EMERGENCY_DISABLE_ALL || !flags.PAYMENT_ADVISORY_ENABLED) {
      return this.emptyPartnerReadiness(reqId, corridor);
    }

    // Static partner configuration (no actual bank connections)
    const partners: PartnerReadinessCheck[] = [
      {
        partnerId: 'bank_swift',
        partnerName: 'SWIFT Network (Advisory)',
        partnerType: 'BANK',
        status: 'READY',
        corridors: ['US_EG', 'US_AE', 'UK_EG', 'UK_AE', 'DE_EG', 'FR_AE'],
        capabilities: ['International transfers', 'Multi-currency', 'High limits'],
        limitations: ['3-5 business days processing', 'Higher fees'],
        lastChecked: new Date().toISOString(),
        advisory: 'SWIFT transfers available for this corridor. No actual connection - advisory only.',
      },
      {
        partnerId: 'wallet_digital',
        partnerName: 'Digital Wallet (Advisory)',
        partnerType: 'WALLET_PROVIDER',
        status: corridor.includes('US') ? 'READY' : 'INTEGRATION_PENDING',
        corridors: ['US_EG', 'US_AE'],
        capabilities: ['Instant transfers', 'Low fees', 'Mobile-friendly'],
        limitations: ['Lower limits', 'Limited corridors'],
        lastChecked: new Date().toISOString(),
        advisory: 'Digital wallet integration status is advisory only.',
      },
      {
        partnerId: 'fx_provider',
        partnerName: 'FX Provider (Advisory)',
        partnerType: 'FX_PROVIDER',
        status: 'READY',
        corridors: ['*'],
        capabilities: ['Competitive rates', 'Real-time quotes', 'Multi-currency'],
        limitations: ['Rate validity window', 'Minimum amounts'],
        lastChecked: new Date().toISOString(),
        advisory: 'FX rates are indicative only. No live rate feed connected.',
      },
      {
        partnerId: 'local_psp',
        partnerName: 'Local PSP (Advisory)',
        partnerType: 'PSP',
        status: corridor.includes('EG') || corridor.includes('AE') ? 'TESTING' : 'NOT_AVAILABLE',
        corridors: ['US_EG', 'UK_EG', 'US_AE', 'UK_AE'],
        capabilities: ['Local payment methods', 'Local currency settlement'],
        limitations: ['Regional only', 'Integration required'],
        lastChecked: new Date().toISOString(),
        advisory: 'Local PSP availability is advisory. No SDK or API connected.',
      },
    ];

    // Filter partners for corridor
    const relevantPartners = partners.filter(
      p => p.corridors.includes('*') || p.corridors.includes(corridor)
    );

    // Find recommended partner
    const readyPartners = relevantPartners.filter(p => p.status === 'READY');
    const recommendedPartner = readyPartners.length > 0 ? readyPartners[0].partnerId : null;

    return {
      requestId: reqId,
      timestamp: new Date().toISOString(),
      corridor,
      partners: relevantPartners,
      recommendedPartner,
      explanation: recommendedPartner
        ? `${readyPartners[0].partnerName} is available for this corridor. This is advisory information only - no actual partner connection exists.`
        : 'No partners currently ready for this corridor. This is advisory information only.',
      disclaimer: generateDisclaimer(),
    };
  }

  /**
   * Get detailed fee breakdown
   * READ-ONLY - Static calculation
   */
  getFeeBreakdown(
    methodId: string,
    amountUSD: number,
    corridor: string
  ): FeeBreakdown {
    const method = PAYMENT_METHODS.find(m => m.id === methodId);
    
    if (!method) {
      return {
        baseFee: 0,
        percentageFee: 0,
        fxSpread: 0,
        networkFee: 0,
        totalFee: 0,
        currency: 'USD',
        explanation: 'Payment method not found.',
      };
    }

    const baseFee = method.feeStructure.fixedFee;
    const percentageFee = amountUSD * (method.feeStructure.percentageFee / 100);
    const fxSpread = corridor.includes('_') ? amountUSD * 0.02 : 0; // 2% FX spread for cross-border
    const networkFee = method.type === 'BANK_TRANSFER' ? 15 : 0;

    const totalFee = Math.min(
      Math.max(baseFee + percentageFee + fxSpread + networkFee, method.feeStructure.minFee),
      method.feeStructure.maxFee
    );

    return {
      baseFee: Math.round(baseFee * 100) / 100,
      percentageFee: Math.round(percentageFee * 100) / 100,
      fxSpread: Math.round(fxSpread * 100) / 100,
      networkFee,
      totalFee: Math.round(totalFee * 100) / 100,
      currency: 'USD',
      explanation: `Fee breakdown for ${method.name}: Base fee $${baseFee}, ${method.feeStructure.percentageFee}% of amount${corridor.includes('_') ? ', plus 2% FX spread' : ''}${networkFee > 0 ? `, plus $${networkFee} network fee` : ''}.`,
    };
  }

  /**
   * Get extended health with partner status
   */
  getExtendedHealth(): PaymentAdvisoryHealth {
    const flags = getFeatureFlags();

    return {
      status: flags.EMERGENCY_DISABLE_ALL ? 'unhealthy' : 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        methodComparison: !flags.EMERGENCY_DISABLE_ALL && flags.PAYMENT_ADVISORY_ENABLED,
        fxAdvisory: !flags.EMERGENCY_DISABLE_ALL && flags.PAYMENT_ADVISORY_ENABLED,
        riskAssessment: !flags.EMERGENCY_DISABLE_ALL && flags.PAYMENT_ADVISORY_ENABLED,
        complianceCheck: !flags.EMERGENCY_DISABLE_ALL && flags.PAYMENT_ADVISORY_ENABLED,
        partnerReadiness: !flags.EMERGENCY_DISABLE_ALL && flags.PAYMENT_ADVISORY_ENABLED,
      },
      featureFlags: {
        paymentAdvisoryEnabled: flags.PAYMENT_ADVISORY_ENABLED,
        emergencyDisabled: flags.EMERGENCY_DISABLE_ALL,
      },
      lastFXUpdate: FX_SNAPSHOT.timestamp,
      version: '2.0.0',
    };
  }

  private emptyComplianceAdvisory(
    requestId: string,
    corridor: string,
    amountUSD: number
  ): ComplianceAdvisoryResult {
    return {
      requestId,
      timestamp: new Date().toISOString(),
      corridor,
      amountUSD,
      boundaries: [],
      overallStatus: 'REVIEW_REQUIRED',
      blockers: ['Compliance advisory is currently disabled.'],
      recommendations: [],
      disclaimer: generateDisclaimer(),
    };
  }

  private emptyPartnerReadiness(
    requestId: string,
    corridor: string
  ): PartnerReadinessResult {
    return {
      requestId,
      timestamp: new Date().toISOString(),
      corridor,
      partners: [],
      recommendedPartner: null,
      explanation: 'Partner readiness check is currently disabled.',
      disclaimer: generateDisclaimer(),
    };
  }

  /**
   * Reset snapshots (for testing only)
   */
  static resetSnapshots(): void {
    auditSnapshots.clear();
  }
}

export const paymentAdvisoryService = new PaymentAdvisoryService();
