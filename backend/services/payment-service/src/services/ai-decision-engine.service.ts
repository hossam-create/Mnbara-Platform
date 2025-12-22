// AI-TRUST-003: Trust Decision & Recommendation Engine

import {
  DecisionEngineRequest,
  DecisionEngineResult,
  DecisionEngineConfig,
  EscalationLevel,
  RecommendationType,
  RiskContribution,
  BulkEvaluationRequest,
  BulkEvaluationResult,
  DecisionRule,
  DecisionEngineHealth,
  AIRiskScoreInput,
  BehaviorRiskScoreInput,
  TrustScoreInput,
  TrustEventInput,
  OrderContextInput
} from '../types/ai-decision-engine.types';

export class AIDecisionEngineService {
  private readonly defaultConfig: DecisionEngineConfig = {
    weights: {
      aiRiskScore: 0.35,
      behaviorRiskScore: 0.30,
      trustScore: 0.20, // Inverse weight (higher trust = lower risk)
      trustEvents: 0.15
    },
    escalationThresholds: {
      monitor: 0.3,
      review: 0.6,
      escalate: 0.8
    },
    orderContextModifiers: {
      highValueMultiplier: 1.5,
      firstTimeBuyerMultiplier: 1.3,
      velocityPenalty: 0.1
    },
    timeWindows: {
      trustEvents: 30, // days
      recentPatterns: 7 // days
    }
  };

  private readonly decisionRules: DecisionRule[] = [
    {
      id: 'RULE_001',
      name: 'Critical AI Risk',
      description: 'Trigger when AI risk score is critical',
      condition: 'aiRiskScore.riskLevel === "CRITICAL"',
      action: ['ESCROW_ENFORCEMENT_SUGGESTED', 'TEMPORARY_GATING_SUGGESTED'],
      severity: 'CRITICAL',
      weight: 0.9
    },
    {
      id: 'RULE_002',
      name: 'High Behavior Risk',
      description: 'Trigger when behavior risk is high with multiple patterns',
      condition: 'behaviorRiskScore.behaviorRiskLevel === "HIGH" && behaviorRiskScore.detectedPatterns.length >= 2',
      action: ['MANUAL_REVIEW_SUGGESTED', 'ENHANCED_MONITORING'],
      severity: 'HIGH',
      weight: 0.7
    },
    {
      id: 'RULE_003',
      name: 'Trust Score Decline',
      description: 'Trigger when trust score is declining significantly',
      condition: 'trustScore.trend === "DECLINING" && trustScore.volatility > 0.5',
      action: ['MANUAL_REVIEW_SUGGESTED'],
      severity: 'MEDIUM',
      weight: 0.5
    },
    {
      id: 'RULE_004',
      name: 'Multiple Negative Events',
      description: 'Trigger when multiple negative trust events occur',
      condition: 'recentTrustEvents.filter(e => e.impact < 0).length >= 3',
      action: ['ENHANCED_MONITORING'],
      severity: 'MEDIUM',
      weight: 0.4
    },
    {
      id: 'RULE_005',
      name: 'High Value Order Risk',
      description: 'Trigger for high value orders with elevated risk',
      condition: 'orderContext?.isHighValue && decisionScore > 0.4',
      action: ['ESCROW_ENFORCEMENT_SUGGESTED'],
      severity: 'HIGH',
      weight: 0.6
    }
  ];

  async evaluateDecision(request: DecisionEngineRequest): Promise<DecisionEngineResult> {
    const startTime = Date.now();
    const config = { ...this.defaultConfig, ...request.configOverrides };
    
    try {
      // Calculate weighted decision score
      const decisionScore = this.calculateDecisionScore(request, config);
      
      // Apply order context modifiers
      const modifiedScore = this.applyOrderContextModifiers(decisionScore, request.orderContext, config);
      
      // Determine escalation level
      const escalationLevel = this.determineEscalationLevel(modifiedScore, config);
      
      // Generate recommendations based on triggered rules
      const { recommendations, triggeredRules } = this.generateRecommendations(request, modifiedScore);
      
      // Calculate confidence
      const confidence = this.calculateConfidence(request, modifiedScore);
      
      // Generate risk contributions breakdown
      const riskContributions = this.calculateRiskContributions(request, config);
      
      // Generate explanations
      const { explanation, humanReadableReasoning } = this.generateExplanations(
        request,
        modifiedScore,
        escalationLevel,
        riskContributions,
        triggeredRules
      );

      const result: DecisionEngineResult = {
        sellerId: request.sellerId,
        decisionScore: modifiedScore,
        escalationLevel,
        confidence,
        recommendations,
        riskContributions,
        triggeredRules,
        explanation,
        humanReadableReasoning,
        inputSnapshot: {
          aiRiskScore: request.aiRiskScore.riskScore,
          behaviorRiskScore: request.behaviorRiskScore.behaviorRiskScore,
          trustScore: request.trustScore.score / 100, // Normalize to 0-1
          trustEventsCount: request.recentTrustEvents.length,
          orderContextPresent: !!request.orderContext
        },
        evaluatedAt: new Date(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // Valid for 24 hours
      };

      // Log decision for audit purposes
      this.logDecision(result);

      return result;

    } catch (error) {
      throw new Error(`Failed to evaluate decision for seller ${request.sellerId}: ${error.message}`);
    }
  }

  private calculateDecisionScore(request: DecisionEngineRequest, config: DecisionEngineConfig): number {
    const {
      aiRiskScore,
      behaviorRiskScore,
      trustScore,
      recentTrustEvents
    } = request;

    // Calculate component scores
    const aiRiskComponent = aiRiskScore.riskScore * config.weights.aiRiskScore;
    const behaviorRiskComponent = behaviorRiskScore.behaviorRiskScore * config.weights.behaviorRiskScore;
    
    // Trust score is inverse (higher trust = lower risk)
    const trustRiskComponent = (1 - (trustScore.score / 100)) * config.weights.trustScore;
    
    // Trust events component (average impact normalized to 0-1)
    const trustEventsImpact = recentTrustEvents.reduce((sum, event) => sum + Math.max(0, -event.impact), 0);
    const maxPossibleImpact = recentTrustEvents.length * 100;
    const trustEventsComponent = (trustEventsImpact / Math.max(1, maxPossibleImpact)) * config.weights.trustEvents;

    return aiRiskComponent + behaviorRiskComponent + trustRiskComponent + trustEventsComponent;
  }

  private applyOrderContextModifiers(
    baseScore: number,
    orderContext: OrderContextInput | undefined,
    config: DecisionEngineConfig
  ): number {
    if (!orderContext) return baseScore;

    let modifiedScore = baseScore;

    // Apply multipliers for high-risk scenarios
    if (orderContext.isHighValue) {
      modifiedScore *= config.orderContextModifiers.highValueMultiplier;
    }
    
    if (orderContext.isFirstTimeBuyer) {
      modifiedScore *= config.orderContextModifiers.firstTimeBuyerMultiplier;
    }
    
    // Apply velocity penalty
    if (orderContext.orderVelocity && orderContext.orderVelocity > 10) {
      const velocityExcess = orderContext.orderVelocity - 10;
      modifiedScore += velocityExcess * config.orderContextModifiers.velocityPenalty;
    }

    return Math.min(1, Math.max(0, modifiedScore)); // Clamp between 0-1
  }

  private determineEscalationLevel(score: number, config: DecisionEngineConfig): EscalationLevel {
    if (score >= config.escalationThresholds.escalate) return 'ESCALATE';
    if (score >= config.escalationThresholds.review) return 'REVIEW';
    if (score >= config.escalationThresholds.monitor) return 'MONITOR';
    return 'NONE';
  }

  private generateRecommendations(
    request: DecisionEngineRequest,
    decisionScore: number
  ): { recommendations: RecommendationType[]; triggeredRules: string[] } {
    const triggeredRules: string[] = [];
    const recommendations = new Set<RecommendationType>();

    // Evaluate all rules
    this.decisionRules.forEach(rule => {
      if (this.evaluateRule(rule, request, decisionScore)) {
        triggeredRules.push(rule.id);
        rule.action.forEach(action => recommendations.add(action));
      }
    });

    // Add baseline recommendations based on escalation level
    const escalationLevel = this.determineEscalationLevel(decisionScore, this.defaultConfig);
    
    switch (escalationLevel) {
      case 'MONITOR':
        recommendations.add('ENHANCED_MONITORING');
        break;
      case 'REVIEW':
        recommendations.add('MANUAL_REVIEW_SUGGESTED');
        break;
      case 'ESCALATE':
        recommendations.add('ESCROW_ENFORCEMENT_SUGGESTED');
        recommendations.add('TEMPORARY_GATING_SUGGESTED');
        break;
    }

    return {
      recommendations: Array.from(recommendations),
      triggeredRules
    };
  }

  private evaluateRule(rule: DecisionRule, request: DecisionEngineRequest, decisionScore: number): boolean {
    // Simple rule evaluation - in production this would use a proper rule engine
    try {
      const {
        aiRiskScore,
        behaviorRiskScore,
        trustScore,
        recentTrustEvents,
        orderContext
      } = request;

      // Evaluate rule conditions
      const conditions: Record<string, any> = {
        aiRiskScore,
        behaviorRiskScore,
        trustScore,
        recentTrustEvents,
        orderContext,
        decisionScore
      };

      // Simple condition evaluation (in production, use a proper rule engine)
      if (rule.condition.includes('aiRiskScore.riskLevel === "CRITICAL"') && 
          aiRiskScore.riskLevel === 'CRITICAL') {
        return true;
      }

      if (rule.condition.includes('behaviorRiskScore.behaviorRiskLevel === "HIGH"') && 
          behaviorRiskScore.behaviorRiskLevel === 'HIGH' &&
          behaviorRiskScore.detectedPatterns.length >= 2) {
        return true;
      }

      if (rule.condition.includes('trustScore.trend === "DECLINING"') && 
          trustScore.trend === 'DECLINING' &&
          trustScore.volatility > 0.5) {
        return true;
      }

      if (rule.condition.includes('recentTrustEvents.filter') && 
          recentTrustEvents.filter(e => e.impact < 0).length >= 3) {
        return true;
      }

      if (rule.condition.includes('orderContext?.isHighValue') && 
          orderContext?.isHighValue &&
          decisionScore > 0.4) {
        return true;
      }

      return false;

    } catch (error) {
      console.warn(`Failed to evaluate rule ${rule.id}: ${error.message}`);
      return false;
    }
  }

  private calculateConfidence(request: DecisionEngineRequest, decisionScore: number): number {
    const {
      aiRiskScore,
      behaviorRiskScore,
      trustScore,
      recentTrustEvents
    } = request;

    // Confidence factors
    const dataCompleteness = this.calculateDataCompleteness(request);
    const inputConsistency = this.calculateInputConsistency(aiRiskScore, behaviorRiskScore, trustScore);
    const signalStrength = this.calculateSignalStrength(decisionScore, recentTrustEvents);

    // Weighted average of confidence factors
    return (dataCompleteness * 0.4) + (inputConsistency * 0.3) + (signalStrength * 0.3);
  }

  private calculateDataCompleteness(request: DecisionEngineRequest): number {
    let completeness = 1.0;

    // Penalize for missing data
    if (!request.aiRiskScore) completeness -= 0.3;
    if (!request.behaviorRiskScore) completeness -= 0.3;
    if (!request.trustScore) completeness -= 0.2;
    if (request.recentTrustEvents.length === 0) completeness -= 0.1;

    return Math.max(0, completeness);
  }

  private calculateInputConsistency(
    aiRiskScore: AIRiskScoreInput,
    behaviorRiskScore: BehaviorRiskScoreInput,
    trustScore: TrustScoreInput
  ): number {
    // Check if risk assessments are consistent
    const riskScores = [aiRiskScore.riskScore, behaviorRiskScore.behaviorRiskScore, 1 - (trustScore.score / 100)];
    const averageRisk = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
    
    // Calculate variance from average
    const variance = riskScores.reduce((sum, score) => sum + Math.pow(score - averageRisk, 2), 0) / riskScores.length;
    
    // Higher variance = lower consistency
    return Math.max(0, 1 - (variance * 2));
  }

  private calculateSignalStrength(decisionScore: number, trustEvents: TrustEventInput[]): number {
    // Strong signal if score is very high or very low
    const scoreStrength = Math.abs(decisionScore - 0.5) * 2;
    
    // Event-based signal strength
    const eventStrength = trustEvents.length > 0 ? 0.8 : 0.5;
    
    return (scoreStrength * 0.6) + (eventStrength * 0.4);
  }

  private calculateRiskContributions(request: DecisionEngineRequest, config: DecisionEngineConfig): RiskContribution[] {
    const contributions: RiskContribution[] = [];

    contributions.push({
      component: 'AI Risk Score',
      contribution: request.aiRiskScore.riskScore * config.weights.aiRiskScore,
      explanation: `AI risk assessment contributed ${(request.aiRiskScore.riskScore * config.weights.aiRiskScore * 100).toFixed(1)}% to the decision score`
    });

    contributions.push({
      component: 'Behavior Risk',
      contribution: request.behaviorRiskScore.behaviorRiskScore * config.weights.behaviorRiskScore,
      explanation: `Behavior patterns contributed ${(request.behaviorRiskScore.behaviorRiskScore * config.weights.behaviorRiskScore * 100).toFixed(1)}% to the decision score`
    });

    contributions.push({
      component: 'Trust Score',
      contribution: (1 - (request.trustScore.score / 100)) * config.weights.trustScore,
      explanation: `Trust score (inverse) contributed ${((1 - (request.trustScore.score / 100)) * config.weights.trustScore * 100).toFixed(1)}% to the decision score`
    });

    const trustEventsImpact = request.recentTrustEvents.reduce((sum, event) => sum + Math.max(0, -event.impact), 0);
    const maxPossibleImpact = request.recentTrustEvents.length * 100;
    const trustEventsContribution = (trustEventsImpact / Math.max(1, maxPossibleImpact)) * config.weights.trustEvents;
    
    contributions.push({
      component: 'Trust Events',
      contribution: trustEventsContribution,
      explanation: `Recent trust events contributed ${(trustEventsContribution * 100).toFixed(1)}% to the decision score`
    });

    return contributions;
  }

  private generateExplanations(
    request: DecisionEngineRequest,
    decisionScore: number,
    escalationLevel: EscalationLevel,
    riskContributions: RiskContribution[],
    triggeredRules: string[]
  ): { explanation: string; humanReadableReasoning: string } {
    const explanationParts: string[] = [];
    const reasoningParts: string[] = [];

    // Basic score explanation
    explanationParts.push(`Decision Score: ${(decisionScore * 100).toFixed(1)}/100`);
    explanationParts.push(`Escalation Level: ${escalationLevel}`);

    // Add risk contributions
    riskContributions.forEach(contribution => {
      if (contribution.contribution > 0.1) {
        explanationParts.push(`${contribution.component}: ${(contribution.contribution * 100).toFixed(1)}%`);
      }
    });

    // Add triggered rules
    if (triggeredRules.length > 0) {
      explanationParts.push(`Triggered Rules: ${triggeredRules.join(', ')}`);
    }

    // Human readable reasoning
    reasoningParts.push('Based on the comprehensive risk assessment:');
    
    if (request.aiRiskScore.riskLevel === 'CRITICAL') {
      reasoningParts.push(`- Critical AI risk detected (score: ${(request.aiRiskScore.riskScore * 100).toFixed(1)}%)`);
    }
    
    if (request.behaviorRiskScore.detectedPatterns.length > 0) {
      reasoningParts.push(`- ${request.behaviorRiskScore.detectedPatterns.length} suspicious behavior patterns identified`);
    }
    
    if (request.trustScore.trend === 'DECLINING') {
      reasoningParts.push(`- Trust score is declining (current: ${request.trustScore.score}, trend: ${request.trustScore.trend})`);
    }
    
    if (request.recentTrustEvents.length > 0) {
      const negativeEvents = request.recentTrustEvents.filter(e => e.impact < 0).length;
      if (negativeEvents > 0) {
        reasoningParts.push(`- ${negativeEvents} negative trust events in the last 30 days`);
      }
    }

    reasoningParts.push(`This results in a ${escalationLevel} escalation level with ${(decisionScore * 100).toFixed(1)}% risk score.`);

    return {
      explanation: explanationParts.join(' | '),
      humanReadableReasoning: reasoningParts.join(' ')
    };
  }

  private logDecision(result: DecisionEngineResult): void {
    // In production, this would log to a proper audit system
    console.log('AI Decision Engine - Decision Log:', {
      sellerId: result.sellerId,
      decisionScore: result.decisionScore,
      escalationLevel: result.escalationLevel,
      confidence: result.confidence,
      evaluatedAt: result.evaluatedAt,
      triggeredRules: result.triggeredRules
    });
  }

  async evaluateBulk(request: BulkEvaluationRequest): Promise<BulkEvaluationResult> {
    const startTime = Date.now();
    const results: DecisionEngineResult[] = [];

    for (const evaluation of request.evaluations) {
      try {
        const decisionRequest: DecisionEngineRequest = {
          sellerId: evaluation.sellerId,
          aiRiskScore: evaluation.aiRiskScore,
          behaviorRiskScore: evaluation.behaviorRiskScore,
          trustScore: evaluation.trustScore,
          recentTrustEvents: evaluation.recentTrustEvents,
          orderContext: evaluation.orderContext,
          configOverrides: request.configOverrides
        };

        const result = await this.evaluateDecision(decisionRequest);
        results.push(result);
      } catch (error) {
        console.error(`Failed to evaluate seller ${evaluation.sellerId}: ${error.message}`);
      }
    }

    const evaluationTimeMs = Date.now() - startTime;

    return {
      results,
      summary: {
        totalEvaluated: results.length,
        byEscalationLevel: this.countByEscalationLevel(results),
        averageConfidence: this.calculateAverageConfidence(results),
        evaluationTimeMs
      }
    };
  }

  private countByEscalationLevel(results: DecisionEngineResult[]): Record<EscalationLevel, number> {
    const counts: Record<EscalationLevel, number> = {
      NONE: 0,
      MONITOR: 0,
      REVIEW: 0,
      ESCALATE: 0
    };

    results.forEach(result => {
      counts[result.escalationLevel]++;
    });

    return counts;
  }

  private calculateAverageConfidence(results: DecisionEngineResult[]): number {
    if (results.length === 0) return 0;
    
    const totalConfidence = results.reduce((sum, result) => sum + result.confidence, 0);
    return totalConfidence / results.length;
  }

  getDecisionRules(): DecisionRule[] {
    return this.decisionRules;
  }

  getConfiguration(): DecisionEngineConfig {
    return this.defaultConfig;
  }

  async healthCheck(): Promise<DecisionEngineHealth> {
    // Simple health check - in production would check dependencies
    return {
      status: 'OPERATIONAL',
      service: 'ai-decision-engine',
      version: '1.0.0',
      lastEvaluation: new Date(),
      totalEvaluations: 0, // Would track actual count in production
      averageEvaluationTimeMs: 50,
      errorRate: 0.01,
      ruleCount: this.decisionRules.length,
      dependencies: {
        aiRiskScoring: true, // Would check actual service health
        behaviorAnalysis: true,
        trustScoring: true,
        trustEvents: true
      }
    };
  }
}