import { RiskInput, RiskScoreResult, RiskLevel, RiskConfig, RiskExplanation, RiskComponentResult } from '../types/ai-trust-risk.types';

export class AITrustRiskService {
  private config: RiskConfig = {
    accountAgeWeight: 0.15,
    orderVelocityWeight: 0.20,
    disputeRateWeight: 0.25,
    refundRatioWeight: 0.20,
    escrowBehaviorWeight: 0.20,
    riskThresholds: {
      low: 0.3,
      medium: 0.5,
      high: 0.7,
      critical: 0.9
    },
    minOrdersForConfidence: 5,
    minDaysForConfidence: 30
  };

  calculateRiskScore(input: RiskInput): RiskScoreResult {
    const components = this.calculateComponents(input);
    
    const riskScore = this.calculateWeightedScore(components);
    const riskLevel = this.determineRiskLevel(riskScore);
    const confidence = this.calculateConfidence(input);
    
    return {
      sellerId: input.sellerId,
      riskScore,
      riskLevel,
      confidence,
      components,
      explanation: this.generateExplanation(input, riskScore, riskLevel, components),
      timestamp: new Date()
    };
  }

  private calculateComponents(input: RiskInput): RiskComponentResult {
    return {
      accountAge: this.calculateAccountAgeRisk(input.accountAgeDays),
      orderVelocity: this.calculateOrderVelocityRisk(input.totalOrders, input.ordersLast30Days),
      disputeRate: this.calculateDisputeRateRisk(input.totalOrders, input.totalDisputes, input.disputesLast30Days),
      refundRatio: this.calculateRefundRatioRisk(input.totalOrders, input.totalRefunds, input.refundsLast30Days),
      escrowBehavior: this.calculateEscrowBehaviorRisk(input.escrowTransactions, input.escrowDisputes, input.escrollSuccessRate)
    };
  }

  private calculateAccountAgeRisk(accountAgeDays: number): any {
    const rawScore = Math.max(0, Math.min(1, accountAgeDays / 365));
    const normalizedScore = 1 - rawScore;
    
    return {
      weight: this.config.accountAgeWeight,
      rawScore,
      normalizedScore,
      explanation: `Account age: ${accountAgeDays} days (${Math.round(rawScore * 100)}% maturity)`
    };
  }

  private calculateOrderVelocityRisk(totalOrders: number, ordersLast30Days: number): any {
    const orderRate = totalOrders > 0 ? ordersLast30Days / totalOrders : 0;
    const rawScore = Math.min(1, orderRate * 3);
    
    return {
      weight: this.config.orderVelocityWeight,
      rawScore,
      normalizedScore: rawScore,
      explanation: `Order velocity: ${ordersLast30Days} orders in 30 days (${Math.round(orderRate * 100)}% of total)`
    };
  }

  private calculateDisputeRateRisk(totalOrders: number, totalDisputes: number, disputesLast30Days: number): any {
    const disputeRate = totalOrders > 0 ? totalDisputes / totalOrders : 0;
    const recentDisputeRate = totalOrders > 0 ? disputesLast30Days / totalOrders : 0;
    const rawScore = Math.min(1, disputeRate * 10 + recentDisputeRate * 5);
    
    return {
      weight: this.config.disputeRateWeight,
      rawScore,
      normalizedScore: rawScore,
      explanation: `Dispute rate: ${totalDisputes} disputes (${Math.round(disputeRate * 100)}% rate)`
    };
  }

  private calculateRefundRatioRisk(totalOrders: number, totalRefunds: number, refundsLast30Days: number): any {
    const refundRate = totalOrders > 0 ? totalRefunds / totalOrders : 0;
    const recentRefundRate = totalOrders > 0 ? refundsLast30Days / totalOrders : 0;
    const rawScore = Math.min(1, refundRate * 8 + recentRefundRate * 4);
    
    return {
      weight: this.config.refundRatioWeight,
      rawScore,
      normalizedScore: rawScore,
      explanation: `Refund ratio: ${totalRefunds} refunds (${Math.round(refundRate * 100)}% rate)`
    };
  }

  private calculateEscrowBehaviorRisk(escrowTransactions: number, escrowDisputes: number, escrowSuccessRate: number): any {
    const disputeRate = escrowTransactions > 0 ? escrowDisputes / escrowTransactions : 0;
    const successFactor = escrowSuccessRate / 100;
    const rawScore = Math.min(1, disputeRate * 6 + (1 - successFactor) * 4);
    
    return {
      weight: this.config.escrowBehaviorWeight,
      rawScore,
      normalizedScore: rawScore,
      explanation: `Escrow behavior: ${escrowTransactions} transactions, ${Math.round(escrowSuccessRate)}% success rate`
    };
  }

  private calculateWeightedScore(components: RiskComponentResult): number {
    let totalScore = 0;
    let totalWeight = 0;

    Object.values(components).forEach(component => {
      totalScore += component.normalizedScore * component.weight;
      totalWeight += component.weight;
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private determineRiskLevel(riskScore: number): RiskLevel {
    if (riskScore <= this.config.riskThresholds.low) return RiskLevel.LOW;
    if (riskScore <= this.config.riskThresholds.medium) return RiskLevel.MEDIUM;
    if (riskScore <= this.config.riskThresholds.high) return RiskLevel.HIGH;
    return RiskLevel.CRITICAL;
  }

  private calculateConfidence(input: RiskInput): number {
    const orderConfidence = Math.min(1, input.totalOrders / this.config.minOrdersForConfidence);
    const ageConfidence = Math.min(1, input.accountAgeDays / this.config.minDaysForConfidence);
    
    return (orderConfidence * 0.6) + (ageConfidence * 0.4);
  }

  private generateExplanation(input: RiskInput, riskScore: number, riskLevel: RiskLevel, components: RiskComponentResult): string {
    return `Risk assessment for seller ${input.sellerId}: ${riskLevel} risk (${Math.round(riskScore * 100)}%). ` +
           `Based on account age (${input.accountAgeDays} days), order history (${input.totalOrders} orders), ` +
           `dispute rate (${input.totalDisputes} disputes), refund ratio (${input.totalRefunds} refunds), ` +
           `and escrow behavior (${input.escrowTransactions} transactions).`;
  }

  getRiskExplanation(input: RiskInput): RiskExplanation {
    const result = this.calculateRiskScore(input);
    
    return {
      sellerId: input.sellerId,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      componentBreakdown: {
        accountAge: components.accountAge.explanation,
        orderVelocity: components.orderVelocity.explanation,
        disputeRate: components.disputeRate.explanation,
        refundRatio: components.refundRatio.explanation,
        escrowBehavior: components.escrowBehavior.explanation
      },
      overallExplanation: result.explanation,
      recommendations: this.generateRecommendations(result.riskLevel, result.components)
    };
  }

  private generateRecommendations(riskLevel: RiskLevel, components: RiskComponentResult): string[] {
    const recommendations: string[] = [];
    
    if (riskLevel === RiskLevel.CRITICAL || riskLevel === RiskLevel.HIGH) {
      recommendations.push('Immediate account review required');
      recommendations.push('Consider temporary suspension pending investigation');
    }
    
    if (components.disputeRate.normalizedScore > 0.6) {
      recommendations.push('High dispute rate detected - implement additional verification');
    }
    
    if (components.refundRatio.normalizedScore > 0.5) {
      recommendations.push('Elevated refund ratio - review product quality and customer service');
    }
    
    if (components.escrowBehavior.normalizedScore > 0.4) {
      recommendations.push('Escrow performance issues - monitor transaction completion rates');
    }
    
    return recommendations;
  }

  getConfig(): RiskConfig {
    return { ...this.config };
  }

  healthCheck(): { status: string; timestamp: Date } {
    return {
      status: 'healthy',
      timestamp: new Date()
    };
  }
}