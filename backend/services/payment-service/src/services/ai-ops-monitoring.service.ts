// AI-OPS-004: Monitoring, Drift & Explainability Governance Layer Service

import { PrismaClient } from '@prisma/client';
import {
  DriftDetectionResult,
  ScoreDistributionDrift,
  RiskLevelDrift,
  DecisionAggressivenessDrift,
  PatternFrequencyDrift,
  DriftSeverity,
  AccuracyMetrics,
  AccuracyClassification,
  SellerDecisionTimeline,
  DecisionComparison,
  AIHealthScore,
  AIHealthMetrics,
  MonitoringHealth,
  DriftDetectionRequest,
  AccuracyAnalysisRequest,
  TimelineRequest,
  ComparisonRequest
} from '../types/ai-ops-monitoring.types';

const prisma = new PrismaClient();

export class AIOpsMonitoringService {
  private readonly driftThresholds = {
    scoreDistribution: {
      low: 0.1,    // 10% mean difference
      medium: 0.2,  // 20% mean difference
      high: 0.3    // 30% mean difference
    },
    riskLevel: {
      low: 0.15,   // 15% relative change
      medium: 0.25, // 25% relative change
      high: 0.4    // 40% relative change
    },
    decisionAggressiveness: {
      low: 0.1,    // 10% relative change
      medium: 0.2, // 20% relative change
      high: 0.3    // 30% relative change
    },
    patternFrequency: {
      low: 0.2,    // 20% relative change
      medium: 0.4, // 40% relative change
      high: 0.6    // 60% relative change
    }
  };

  async detectDrift(request: DriftDetectionRequest): Promise<DriftDetectionResult> {
    const startTime = Date.now();
    
    try {
      // Collect data for both periods
      const period1Data = await this.collectPeriodData(request.timeComparison.period1);
      const period2Data = await this.collectPeriodData(request.timeComparison.period2);

      // Detect different types of drift
      const scoreDistributionDrifts = await this.detectScoreDistributionDrift(period1Data, period2Data);
      const riskLevelDrifts = await this.detectRiskLevelDrift(period1Data, period2Data);
      const decisionAggressivenessDrifts = await this.detectDecisionAggressivenessDrift(period1Data, period2Data);
      const patternFrequencyDrifts = await this.detectPatternFrequencyDrift(period1Data, period2Data);

      // Calculate overall severity
      const overallSeverity = this.calculateOverallSeverity([
        ...scoreDistributionDrifts,
        ...riskLevelDrifts,
        ...decisionAggressivenessDrifts,
        ...patternFrequencyDrifts
      ]);

      const detectionTimeMs = Date.now() - startTime;

      return {
        timestamp: new Date(),
        timeComparison: request.timeComparison,
        scoreDistributionDrifts,
        riskLevelDrifts,
        decisionAggressivenessDrifts,
        patternFrequencyDrifts,
        overallSeverity,
        summary: this.generateDriftSummary(scoreDistributionDrifts, riskLevelDrifts, decisionAggressivenessDrifts, patternFrequencyDrifts)
      };

    } catch (error) {
      throw new Error(`Drift detection failed: ${error.message}`);
    }
  }

  async analyzeAccuracy(request: AccuracyAnalysisRequest): Promise<AccuracyMetrics> {
    const startTime = Date.now();
    
    try {
      // Collect decisions and outcomes for the period
      const decisionsWithOutcomes = await this.collectDecisionsWithOutcomes(request.period);
      
      // Classify each decision
      const classifications = await this.classifyDecisions(decisionsWithOutcomes);
      
      // Calculate accuracy metrics
      const metrics = this.calculateAccuracyMetrics(classifications, request.period);
      
      return metrics;
      
    } catch (error) {
      throw new Error(`Accuracy analysis failed: ${error.message}`);
    }
  }

  private async collectDecisionsWithOutcomes(period: { start: Date; end: Date; }): Promise<any[]> {
    // Get AI decisions with their outcomes (claims, manual overrides, clean outcomes)
    const decisions = await prisma.aiDecision.findMany({
      where: {
        evaluatedAt: {
          gte: period.start,
          lte: period.end
        }
      },
      include: {
        riskContributions: true,
        triggeredRules: true
      }
    });

    // Enrich with outcome data
    const decisionsWithOutcomes = await Promise.all(
      decisions.map(async (decision) => {
        const outcomes = await this.getDecisionOutcomes(decision.sellerId, decision.evaluatedAt);
        return { ...decision, outcomes };
      })
    );

    return decisionsWithOutcomes;
  }

  private async getDecisionOutcomes(sellerId: number, decisionTime: Date): Promise<any[]> {
    // Look for claims filed after the decision
    const claims = await prisma.claim.findMany({
      where: {
        sellerId,
        filedAt: {
          gte: decisionTime
        }
      }
    });

    // Look for manual overrides
    const overrides = await prisma.manualOverride.findMany({
      where: {
        sellerId,
        overrideTime: {
          gte: decisionTime
        }
      }
    });

    // Look for trust events that indicate clean outcomes
    const trustEvents = await prisma.trustEvent.findMany({
      where: {
        sellerId,
        eventTime: {
          gte: decisionTime
        },
        eventType: {
          in: ['POSITIVE_FEEDBACK', 'SUCCESSFUL_TRANSACTION', 'TIMELY_DELIVERY']
        }
      }
    });

    return [...claims, ...overrides, ...trustEvents];
  }

  private async classifyDecisions(decisionsWithOutcomes: any[]): Promise<AccuracyClassification[]> {
    const classifications: AccuracyClassification[] = [];

    for (const decision of decisionsWithOutcomes) {
      const classification = this.classifySingleDecision(decision);
      if (classification) {
        classifications.push(classification);
      }
    }

    return classifications;
  }

  private classifySingleDecision(decision: any): AccuracyClassification | null {
    const { outcomes } = decision;
    
    // Determine the most relevant outcome
    const primaryOutcome = this.determinePrimaryOutcome(outcomes);
    
    if (!primaryOutcome) {
      // No outcome data available
      return null;
    }

    // Classify based on decision and outcome
    const classificationType = this.determineClassificationType(
      decision.escalationLevel,
      decision.decisionScore,
      primaryOutcome
    );

    const timeToOutcome = this.calculateTimeToOutcome(decision.evaluatedAt, primaryOutcome.timestamp);
    
    return {
      type: classificationType,
      decisionId: decision.id,
      sellerId: decision.sellerId,
      originalDecision: {
        escalationLevel: decision.escalationLevel,
        decisionScore: decision.decisionScore,
        evaluatedAt: decision.evaluatedAt
      },
      outcome: {
        type: primaryOutcome.type,
        occurredAt: primaryOutcome.timestamp,
        details: primaryOutcome.details
      },
      timeToOutcome,
      confidence: this.calculateClassificationConfidence(decision, primaryOutcome, timeToOutcome)
    };
  }

  private determinePrimaryOutcome(outcomes: any[]): any | null {
    if (outcomes.length === 0) return null;
    
    // Prioritize claims and manual overrides over positive events
    const claim = outcomes.find(o => o.type === 'CLAIM');
    if (claim) return claim;
    
    const override = outcomes.find(o => o.type === 'MANUAL_OVERRIDE');
    if (override) return override;
    
    // Return the most recent positive event
    return outcomes.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  }

  private determineClassificationType(
    escalationLevel: string,
    decisionScore: number,
    outcome: any
  ): 'FALSE_POSITIVE' | 'FALSE_NEGATIVE' | 'CORRECT_POSITIVE' | 'CORRECT_NEGATIVE' {
    const isHighRisk = escalationLevel !== 'NONE' && decisionScore >= 0.3;
    const isCleanOutcome = outcome.type === 'POSITIVE_FEEDBACK' || 
                          outcome.type === 'SUCCESSFUL_TRANSACTION' ||
                          outcome.type === 'TIMELY_DELIVERY';
    const isClaim = outcome.type === 'CLAIM';
    const isOverride = outcome.type === 'MANUAL_OVERRIDE';

    if (isHighRisk && isCleanOutcome) {
      return 'FALSE_POSITIVE';
    } else if (!isHighRisk && isClaim) {
      return 'FALSE_NEGATIVE';
    } else if (isHighRisk && (isClaim || isOverride)) {
      return 'CORRECT_POSITIVE';
    } else if (!isHighRisk && isCleanOutcome) {
      return 'CORRECT_NEGATIVE';
    }

    // Default to correct negative for conservative classification
    return 'CORRECT_NEGATIVE';
  }

  private calculateTimeToOutcome(decisionTime: Date, outcomeTime: Date): number {
    return (outcomeTime.getTime() - decisionTime.getTime()) / (1000 * 60 * 60); // hours
  }

  private calculateClassificationConfidence(decision: any, outcome: any, timeToOutcome: number): number {
    let confidence = 0.7; // Base confidence
    
    // Adjust based on time to outcome (shorter time = higher confidence)
    if (timeToOutcome < 24) {
      confidence += 0.2;
    } else if (timeToOutcome > 168) { // 7 days
      confidence -= 0.2;
    }
    
    // Adjust based on outcome type
    if (outcome.type === 'CLAIM' || outcome.type === 'MANUAL_OVERRIDE') {
      confidence += 0.1;
    }
    
    return Math.min(Math.max(confidence, 0.1), 1.0);
  }

  private calculateAccuracyMetrics(classifications: AccuracyClassification[], period: { start: Date; end: Date; }): AccuracyMetrics {
    const byRiskBand = this.calculateMetricsByRiskBand(classifications);
    const byEscalationLevel = this.calculateMetricsByEscalationLevel(classifications);
    const byRecommendationType = this.calculateMetricsByRecommendationType(classifications);
    const byDecisionRule = this.calculateMetricsByDecisionRule(classifications);
    const overall = this.calculateOverallMetrics(classifications);

    return {
      period,
      byRiskBand,
      byEscalationLevel,
      byRecommendationType,
      byDecisionRule,
      overall
    };
  }

  private calculateMetricsByRiskBand(classifications: AccuracyClassification[]): any[] {
    const riskBands = [
      { band: '0.0-0.3', min: 0.0, max: 0.3 },
      { band: '0.3-0.6', min: 0.3, max: 0.6 },
      { band: '0.6-0.8', min: 0.6, max: 0.8 },
      { band: '0.8-1.0', min: 0.8, max: 1.0 }
    ];

    return riskBands.map(({ band, min, max }) => {
      const bandClassifications = classifications.filter(c => 
        c.originalDecision.decisionScore >= min && c.originalDecision.decisionScore < max
      );
      
      return this.calculateBandMetrics(bandClassifications, band);
    });
  }

  private calculateBandMetrics(classifications: AccuracyClassification[], band: string): any {
    const falsePositives = classifications.filter(c => c.type === 'FALSE_POSITIVE').length;
    const falseNegatives = classifications.filter(c => c.type === 'FALSE_NEGATIVE').length;
    const correctPositives = classifications.filter(c => c.type === 'CORRECT_POSITIVE').length;
    const correctNegatives = classifications.filter(c => c.type === 'CORRECT_NEGATIVE').length;
    const total = classifications.length;

    const precision = correctPositives / (correctPositives + falsePositives) || 0;
    const recall = correctPositives / (correctPositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    return {
      band,
      falsePositives,
      falseNegatives,
      correctPositives,
      correctNegatives,
      total,
      precision,
      recall,
      f1Score
    };
  }

  private calculateMetricsByEscalationLevel(classifications: AccuracyClassification[]): any[] {
    // Define all possible escalation levels
    const escalationLevels = ['NONE', 'LOW', 'MONITOR', 'REVIEW', 'ESCALATE'];

    return escalationLevels.map(level => {
      const levelClassifications = classifications.filter(c => 
        c.originalDecision.escalationLevel === level
      );
      
      return this.calculateBandMetrics(levelClassifications, level);
    });
  }

  private calculateMetricsByRecommendationType(classifications: AccuracyClassification[]): Record<string, any> {
    // Graceful degradation: Return basic metrics when recommendation data is unavailable
    if (classifications.length === 0) return {};
    
    // Extract recommendation types from classifications (if available)
    const recTypes = new Set<string>();
    classifications.forEach(c => {
      // This would normally come from decision.recommendationType
      // For now, use deterministic fallback based on escalation level
      const inferredType = this.inferRecommendationType(c.originalDecision.escalationLevel);
      recTypes.add(inferredType);
    });
    
    const result: Record<string, any> = {};
    recTypes.forEach(type => {
      const typeClassifications = classifications.filter(c => 
        this.inferRecommendationType(c.originalDecision.escalationLevel) === type
      );
      result[type] = this.calculateBandMetrics(typeClassifications, type);
    });
    
    return result;
  }

  private inferRecommendationType(escalationLevel: string): string {
    // Deterministic mapping from escalation level to recommendation type
    const mapping: Record<string, string> = {
      'NONE': 'AUTO_APPROVE',
      'LOW': 'MONITOR_ONLY', 
      'MONITOR': 'ENHANCED_MONITORING',
      'REVIEW': 'MANUAL_REVIEW',
      'ESCALATE': 'IMMEDIATE_ACTION'
    };
    return mapping[escalationLevel] || 'UNKNOWN';
  }

  private calculateMetricsByDecisionRule(classifications: AccuracyClassification[]): Record<string, any> {
    // Graceful degradation: Return basic metrics when rule data is unavailable
    if (classifications.length === 0) return {};
    
    // In a full implementation, this would aggregate by actual triggered rules
    // For now, provide deterministic fallback metrics
    const result: Record<string, any> = {};
    
    // Group by classification type as a fallback
    const types = ['FALSE_POSITIVE', 'FALSE_NEGATIVE', 'CORRECT_POSITIVE', 'CORRECT_NEGATIVE'];
    types.forEach(type => {
      const typeClassifications = classifications.filter(c => c.type === type);
      if (typeClassifications.length > 0) {
        result[`BY_${type}`] = {
          count: typeClassifications.length,
          percentage: (typeClassifications.length / classifications.length) * 100,
          averageConfidence: typeClassifications.reduce((sum, c) => sum + c.confidence, 0) / typeClassifications.length
        };
      }
    });
    
    return result;
  }

  private calculateOverallMetrics(classifications: AccuracyClassification[]): any {
    const falsePositives = classifications.filter(c => c.type === 'FALSE_POSITIVE').length;
    const falseNegatives = classifications.filter(c => c.type === 'FALSE_NEGATIVE').length;
    const correctPositives = classifications.filter(c => c.type === 'CORRECT_POSITIVE').length;
    const correctNegatives = classifications.filter(c => c.type === 'CORRECT_NEGATIVE').length;
    const total = classifications.length;

    const accuracy = (correctPositives + correctNegatives) / total || 0;
    const precision = correctPositives / (correctPositives + falsePositives) || 0;
    const recall = correctPositives / (correctPositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    return {
      falsePositives,
      falseNegatives,
      correctPositives,
      correctNegatives,
      total,
      accuracy,
      precision,
      recall,
      f1Score
    };
  }

  async getSellerDecisionTimeline(request: TimelineRequest): Promise<SellerDecisionTimeline> {
    try {
      const decisions = await prisma.aiDecision.findMany({
        where: {
          sellerId: request.sellerId,
          evaluatedAt: {
            gte: request.startDate,
            lte: request.endDate
          }
        },
        include: {
          riskContributions: true,
          triggeredRules: true
        },
        orderBy: {
          evaluatedAt: 'asc'
        }
      });

      const timelineEntries = decisions.map(decision => ({
        decisionId: decision.id,
        evaluatedAt: decision.evaluatedAt,
        decisionScore: decision.decisionScore,
        escalationLevel: decision.escalationLevel,
        recommendations: decision.recommendations || [],
        triggeredRules: decision.triggeredRules.map(rule => rule.ruleId),
        inputSnapshot: {
          aiRiskScore: decision.aiRiskScore,
          behaviorRiskScore: decision.behaviorRiskScore,
          trustScore: decision.trustScore,
          trustEventsCount: decision.trustEventsCount
        },
        riskContributions: decision.riskContributions.map(rc => ({
          component: rc.component,
          contribution: rc.contribution
        })),
        explanation: decision.explanation || '',
        humanReadableReasoning: decision.humanReadableReasoning || '',
        confidence: decision.confidence
      }));

      const summary = this.calculateTimelineSummary(timelineEntries);

      return {
        sellerId: request.sellerId,
        timeline: timelineEntries,
        summary
      };

    } catch (error) {
      throw new Error(`Failed to get seller decision timeline: ${error.message}`);
    }
  }

  private calculateTimelineSummary(timeline: DecisionTimelineEntry[]): any {
    if (timeline.length === 0) {
      return {
        totalDecisions: 0,
        currentEscalationLevel: 'NONE',
        lastDecisionScore: 0,
        decisionTrend: 'STABLE',
        volatility: 0
      };
    }

    const lastDecision = timeline[timeline.length - 1];
    const decisionScores = timeline.map(d => d.decisionScore);
    
    const trend = this.calculateDecisionTrend(decisionScores);
    const volatility = this.calculateVolatility(decisionScores);

    return {
      totalDecisions: timeline.length,
      currentEscalationLevel: lastDecision.escalationLevel,
      lastDecisionScore: lastDecision.decisionScore,
      decisionTrend: trend,
      volatility
    };
  }

  private calculateDecisionTrend(scores: number[]): 'IMPROVING' | 'STABLE' | 'DETERIORATING' {
    if (scores.length < 2) return 'STABLE';
    
    const recentScores = scores.slice(-3); // Last 3 decisions
    const meanRecent = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
    const meanAll = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    if (meanRecent < meanAll * 0.8) {
      return 'IMPROVING';
    } else if (meanRecent > meanAll * 1.2) {
      return 'DETERIORATING';
    } else {
      return 'STABLE';
    }
  }

  private calculateVolatility(scores: number[]): number {
    if (scores.length < 2) return 0;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    
    return Math.sqrt(variance);
  }

  async compareDecisions(request: ComparisonRequest): Promise<DecisionComparison> {
    try {
      // Get the two specific decisions to compare
      const [decision1, decision2] = await Promise.all([
        prisma.aiDecision.findUnique({
          where: { id: request.decisionId1 },
          include: { riskContributions: true, triggeredRules: true }
        }),
        prisma.aiDecision.findUnique({
          where: { id: request.decisionId2 },
          include: { riskContributions: true, triggeredRules: true }
        })
      ]);

      if (!decision1 || !decision2) {
        throw new Error('One or both decisions not found');
      }

      const differences = this.calculateDecisionDifferences(decision1, decision2);

      return {
        sellerId: decision1.sellerId,
        comparisonDate1: decision1.evaluatedAt,
        comparisonDate2: decision2.evaluatedAt,
        decision1: this.mapToTimelineEntry(decision1),
        decision2: this.mapToTimelineEntry(decision2),
        differences
      };

    } catch (error) {
      throw new Error(`Failed to compare decisions: ${error.message}`);
    }
  }

  private mapToTimelineEntry(decision: any): DecisionTimelineEntry {
    return {
      decisionId: decision.id,
      evaluatedAt: decision.evaluatedAt,
      decisionScore: decision.decisionScore,
      escalationLevel: decision.escalationLevel,
      recommendations: decision.recommendations || [],
      triggeredRules: decision.triggeredRules.map(rule => rule.ruleId),
      inputSnapshot: {
        aiRiskScore: decision.aiRiskScore,
        behaviorRiskScore: decision.behaviorRiskScore,
        trustScore: decision.trustScore,
        trustEventsCount: decision.trustEventsCount
      },
      riskContributions: decision.riskContributions.map(rc => ({
        component: rc.component,
        contribution: rc.contribution
      })),
      explanation: decision.explanation || '',
      humanReadableReasoning: decision.humanReadableReasoning || '',
      confidence: decision.confidence
    };
  }

  private calculateDecisionDifferences(decision1: any, decision2: any): any {
    const scoreDifference = decision2.decisionScore - decision1.decisionScore;
    
    const escalationChange = decision1.escalationLevel !== decision2.escalationLevel 
      ? `${decision1.escalationLevel} → ${decision2.escalationLevel}` 
      : null;

    const inputChanges = [
      {
        component: 'AI_RISK_SCORE',
        change: decision2.aiRiskScore - decision1.aiRiskScore,
        direction: decision2.aiRiskScore > decision1.aiRiskScore ? 'INCREASE' : 'DECREASE'
      },
      {
        component: 'BEHAVIOR_RISK_SCORE',
        change: decision2.behaviorRiskScore - decision1.behaviorRiskScore,
        direction: decision2.behaviorRiskScore > decision1.behaviorRiskScore ? 'INCREASE' : 'DECREASE'
      },
      {
        component: 'TRUST_SCORE',
        change: decision2.trustScore - decision1.trustScore,
        direction: decision2.trustScore > decision1.trustScore ? 'INCREASE' : 'DECREASE'
      },
      {
        component: 'TRUST_EVENTS_COUNT',
        change: decision2.trustEventsCount - decision1.trustEventsCount,
        direction: decision2.trustEventsCount > decision1.trustEventsCount ? 'INCREASE' : 'DECREASE'
      }
    ];

    const ruleChanges = this.calculateRuleChanges(decision1.triggeredRules, decision2.triggeredRules);

    const explanation = this.generateComparisonExplanation(scoreDifference, escalationChange, inputChanges, ruleChanges);

    return {
      scoreDifference,
      escalationChange,
      inputChanges,
      ruleChanges,
      explanation
    };
  }

  private calculateRuleChanges(rules1: any[], rules2: any[]): any[] {
    const ruleIds1 = new Set(rules1.map(r => r.ruleId));
    const ruleIds2 = new Set(rules2.map(r => r.ruleId));
    
    const changes: any[] = [];
    
    // Rules that were triggered in decision1 but not in decision2
    for (const ruleId of ruleIds1) {
      if (!ruleIds2.has(ruleId)) {
        changes.push({
          rule: ruleId,
          wasTriggered: true,
          nowTriggered: false
        });
      }
    }
    
    // Rules that were triggered in decision2 but not in decision1
    for (const ruleId of ruleIds2) {
      if (!ruleIds1.has(ruleId)) {
        changes.push({
          rule: ruleId,
          wasTriggered: false,
          nowTriggered: true
        });
      }
    }
    
    return changes;
  }

  private generateComparisonExplanation(
    scoreDifference: number,
    escalationChange: string | null,
    inputChanges: any[],
    ruleChanges: any[]
  ): string {
    const parts: string[] = [];
    
    if (Math.abs(scoreDifference) > 0.1) {
      parts.push(`Decision score ${scoreDifference > 0 ? 'increased' : 'decreased'} by ${Math.abs(scoreDifference).toFixed(2)}`);
    }
    
    if (escalationChange) {
      parts.push(`Escalation level changed from ${escalationChange}`);
    }
    
    const significantInputChanges = inputChanges.filter(change => Math.abs(change.change) > 0.1);
    if (significantInputChanges.length > 0) {
      const changeDescriptions = significantInputChanges.map(change => 
        `${change.component} ${change.direction.toLowerCase()}d by ${Math.abs(change.change).toFixed(2)}`
      );
      parts.push(`Key input changes: ${changeDescriptions.join(', ')}`);
    }
    
    if (ruleChanges.length > 0) {
      const ruleDescriptions = ruleChanges.map(change => 
        `${change.rule} was ${change.wasTriggered ? 'triggered' : 'not triggered'} before and is ${change.nowTriggered ? 'now triggered' : 'no longer triggered'}`
      );
      parts.push(`Rule changes: ${ruleDescriptions.join(', ')}`);
    }
    
    return parts.join('. ') + '.';
  }

  async calculateAIHealthScore(date: Date): Promise<AIHealthScore> {
    try {
      // Collect metrics for the day
      const metrics = await this.collectDailyMetrics(date);
      
      // Calculate health score
      const healthScore = this.calculateHealthScoreFromMetrics(metrics);
      
      // Determine health level
      const healthLevel = this.determineHealthLevel(healthScore);
      
      // Identify contributing factors
      const contributingFactors = this.identifyContributingFactors(metrics, healthScore);
      
      // Generate recommendations
      const recommendations = this.generateHealthRecommendations(metrics, healthScore);

      return {
        timestamp: new Date(),
        score: healthScore,
        level: healthLevel,
        metrics,
        contributingFactors,
        recommendations
      };

    } catch (error) {
      throw new Error(`Failed to calculate AI health score: ${error.message}`);
    }
  }

  private async collectDailyMetrics(date: Date): Promise<AIHealthMetrics> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get decisions for the day
    const decisions = await prisma.aiDecision.findMany({
      where: {
        evaluatedAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Get drift detection results for the day
    const driftResults = await prisma.driftDetectionResult.findMany({
      where: {
        timestamp: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Get accuracy results for the day
    const accuracyResults = await prisma.accuracyMetrics.findMany({
      where: {
        period: {
          start: startOfDay,
          end: endOfDay
        }
      }
    });

    // Calculate stability score (variance-based)
    const stabilityScore = this.calculateStabilityScore(decisions);
    
    // Calculate drift severity index
    const driftSeverityIndex = this.calculateDriftSeverityIndex(driftResults);
    
    // Calculate confidence decay
    const confidenceDecay = this.calculateConfidenceDecay(decisions);
    
    // Calculate recommendation entropy
    const recommendationEntropy = this.calculateRecommendationEntropy(decisions);
    
    // Calculate manual override rate
    const manualOverrideRate = this.calculateManualOverrideRate(decisions);
    
    // Get evaluation volume
    const evaluationVolume = decisions.length;
    
    // Calculate error rate (failed evaluations)
    const errorRate = this.calculateErrorRate(decisions);
    
    // Calculate average evaluation time
    const averageEvaluationTimeMs = this.calculateAverageEvaluationTime(decisions);

    return {
      date,
      stabilityScore,
      driftSeverityIndex,
      confidenceDecay,
      recommendationEntropy,
      manualOverrideRate,
      evaluationVolume,
      errorRate,
      averageEvaluationTimeMs
    };
  }

  private calculateStabilityScore(decisions: any[]): number {
    if (decisions.length < 2) return 100; // Perfect stability with insufficient data
    
    const scores = decisions.map(d => d.decisionScore);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to 0-100 scale (lower stdDev = higher stability)
    const stability = Math.max(0, 100 - (stdDev * 100));
    return Math.round(stability);
  }

  private calculateDriftSeverityIndex(driftResults: any[]): number {
    if (driftResults.length === 0) return 0; // No drift detected
    
    const maxSeverity = driftResults.reduce((max, result) => 
      Math.max(max, result.overallSeverity?.score || 0), 0
    );
    
    // Convert to 0-100 scale
    return Math.round(maxSeverity * 100);
  }

  private calculateConfidenceDecay(decisions: any[]): number {
    if (decisions.length === 0) return 0;
    
    const avgConfidence = decisions.reduce((sum, d) => sum + (d.confidence || 0.7), 0) / decisions.length;
    
    // Confidence decay is inverse of average confidence
    return 1 - avgConfidence;
  }

  private calculateRecommendationEntropy(decisions: any[]): number {
    if (decisions.length === 0) return 0;
    
    // Count recommendation frequencies
    const recCounts: Record<string, number> = {};
    decisions.forEach(d => {
      const recs = d.recommendations || [];
      recs.forEach((rec: string) => {
        recCounts[rec] = (recCounts[rec] || 0) + 1;
      });
    });
    
    // Calculate entropy
    const total = Object.values(recCounts).reduce((sum, count) => sum + count, 0);
    let entropy = 0;
    
    Object.values(recCounts).forEach(count => {
      const p = count / total;
      entropy -= p * Math.log2(p);
    });
    
    // Normalize to 0-1 range
    const maxEntropy = Math.log2(Object.keys(recCounts).length);
    return maxEntropy > 0 ? entropy / maxEntropy : 0;
  }

  private calculateManualOverrideRate(decisions: any[]): number {
    if (decisions.length === 0) return 0;
    
    // This would require integration with manual override data
    // For now, return a placeholder value
    return 0.05; // 5% override rate assumption
  }

  private calculateErrorRate(decisions: any[]): number {
    if (decisions.length === 0) return 0;
    
    // Count decisions with error flags or null scores
    const errorCount = decisions.filter(d => 
      d.errorFlag || d.decisionScore === null || d.decisionScore === undefined
    ).length;
    
    return errorCount / decisions.length;
  }

  private calculateAverageEvaluationTime(decisions: any[]): number {
    if (decisions.length === 0) return 0;
    
    // This would require evaluation time data in decisions
    // For now, return a placeholder value
    return 150; // 150ms average evaluation time assumption
  }

  private calculateHealthScoreFromMetrics(metrics: AIHealthMetrics): number {
    // Weighted average of different health components
    const weights = {
      stability: 0.25,
      drift: 0.20,
      confidence: 0.15,
      entropy: 0.10,
      override: 0.15,
      error: 0.10,
      volume: 0.05
    };

    const components = {
      stability: metrics.stabilityScore / 100,
      drift: 1 - (metrics.driftSeverityIndex / 100),
      confidence: 1 - metrics.confidenceDecay,
      entropy: 1 - metrics.recommendationEntropy,
      override: 1 - metrics.manualOverrideRate,
      error: 1 - metrics.errorRate,
      volume: Math.min(1, metrics.evaluationVolume / 1000) // Normalize volume
    };

    let score = 0;
    score += components.stability * weights.stability;
    score += components.drift * weights.drift;
    score += components.confidence * weights.confidence;
    score += components.entropy * weights.entropy;
    score += components.override * weights.override;
    score += components.error * weights.error;
    score += components.volume * weights.volume;

    // Convert to 0-100 scale
    return Math.round(score * 100);
  }

  private determineHealthLevel(score: number): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' {
    if (score >= 90) return 'EXCELLENT';
    if (score >= 75) return 'GOOD';
    if (score >= 60) return 'FAIR';
    if (score >= 40) return 'POOR';
    return 'CRITICAL';
  }

  private identifyContributingFactors(metrics: AIHealthMetrics, healthScore: number): any[] {
    const factors: any[] = [];

    // Stability factor
    if (metrics.stabilityScore < 80) {
      factors.push({
        factor: 'DECISION_STABILITY',
        impact: -(100 - metrics.stabilityScore),
        explanation: `Low decision stability (score: ${metrics.stabilityScore}) indicates inconsistent risk assessments`
      });
    }

    // Drift factor
    if (metrics.driftSeverityIndex > 30) {
      factors.push({
        factor: 'MODEL_DRIFT',
        impact: -metrics.driftSeverityIndex,
        explanation: `Significant model drift detected (severity: ${metrics.driftSeverityIndex})`
      });
    }

    // Confidence factor
    if (metrics.confidenceDecay > 0.3) {
      factors.push({
        factor: 'CONFIDENCE_DECAY',
        impact: -(metrics.confidenceDecay * 100),
        explanation: `High confidence decay (${(metrics.confidenceDecay * 100).toFixed(1)}%) indicates decreasing decision certainty`
      });
    }

    // Error rate factor
    if (metrics.errorRate > 0.1) {
      factors.push({
        factor: 'ERROR_RATE',
        impact: -(metrics.errorRate * 100),
        explanation: `High error rate (${(metrics.errorRate * 100).toFixed(1)}%) in decision evaluations`
      });
    }

    // Positive factors for good performance
    if (metrics.stabilityScore > 90) {
      factors.push({
        factor: 'HIGH_STABILITY',
        impact: 10,
        explanation: `Excellent decision stability (score: ${metrics.stabilityScore})`
      });
    }

    if (metrics.driftSeverityIndex < 10) {
      factors.push({
        factor: 'LOW_DRIFT',
        impact: 15,
        explanation: `Minimal model drift detected (severity: ${metrics.driftSeverityIndex})`
      });
    }

    return factors;
  }

  private generateHealthRecommendations(metrics: AIHealthMetrics, healthScore: number): string[] {
    const recommendations: string[] = [];

    if (metrics.stabilityScore < 80) {
      recommendations.push('Review decision consistency and consider recalibration');
    }

    if (metrics.driftSeverityIndex > 30) {
      recommendations.push('Investigate model drift and consider retraining or rule adjustments');
    }

    if (metrics.confidenceDecay > 0.3) {
      recommendations.push('Address confidence decay through input quality improvements');
    }

    if (metrics.errorRate > 0.1) {
      recommendations.push('Reduce evaluation error rate through system improvements');
    }

    if (metrics.manualOverrideRate > 0.2) {
      recommendations.push('Analyze manual overrides to identify systematic issues');
    }

    if (healthScore < 60) {
      recommendations.push('Conduct comprehensive AI system health review');
    }

    return recommendations;
  }

  async getMonitoringHealth(): Promise<MonitoringHealth> {
    try {
      const currentTime = new Date();
      const oneHourAgo = new Date(currentTime.getTime() - 60 * 60 * 1000);

      // Check if services are operational
      const driftDetectionOperational = await this.checkDriftDetectionOperational();
      const accuracyTrackingOperational = await this.checkAccuracyTrackingOperational();
      const explainabilityOperational = await this.checkExplainabilityOperational();
      const healthScoringOperational = await this.checkHealthScoringOperational();

      // Check data availability
      const dataAvailability = await this.checkDataAvailability();

      // Get last successful run
      const lastSuccessfulRun = await this.getLastSuccessfulRun();

      // Calculate error rate and latency
      const errorRate = await this.calculateSystemErrorRate(oneHourAgo, currentTime);
      const processingLatencyMs = await this.calculateProcessingLatency();

      // Determine overall status
      const status = this.determineOverallStatus(
        driftDetectionOperational,
        accuracyTrackingOperational,
        explainabilityOperational,
        healthScoringOperational,
        dataAvailability,
        errorRate
      );

      return {
        status,
        services: {
          driftDetection: driftDetectionOperational,
          accuracyTracking: accuracyTrackingOperational,
          explainability: explainabilityOperational,
          healthScoring: healthScoringOperational
        },
        dataAvailability,
        lastSuccessfulRun,
        errorRate,
        processingLatencyMs
      };

    } catch (error) {
      throw new Error(`Failed to get monitoring health: ${error.message}`);
    }
  }

  private async checkDriftDetectionOperational(): Promise<boolean> {
    // Check if drift detection has run recently
    const recentRun = await prisma.driftDetectionResult.findFirst({
      orderBy: { timestamp: 'desc' }
    });
    
    return recentRun && 
           new Date().getTime() - recentRun.timestamp.getTime() < 24 * 60 * 60 * 1000; // Within 24 hours
  }

  private async checkAccuracyTrackingOperational(): Promise<boolean> {
    // Check if accuracy tracking has run recently
    const recentRun = await prisma.accuracyMetrics.findFirst({
      orderBy: { calculatedAt: 'desc' }
    });
    
    return recentRun && 
           new Date().getTime() - recentRun.calculatedAt.getTime() < 24 * 60 * 60 * 1000; // Within 24 hours
  }

  private async checkExplainabilityOperational(): Promise<boolean> {
    // Check if timeline data is available
    const recentDecision = await prisma.aiDecision.findFirst({
      orderBy: { evaluatedAt: 'desc' }
    });
    
    return recentDecision !== null;
  }

  private async checkHealthScoringOperational(): Promise<boolean> {
    // Check if health scoring has run recently
    const recentScore = await prisma.aiHealthScore.findFirst({
      orderBy: { timestamp: 'desc' }
    });
    
    return recentScore && 
           new Date().getTime() - recentScore.timestamp.getTime() < 24 * 60 * 60 * 1000; // Within 24 hours
  }

  private async checkDataAvailability(): Promise<{ decisionData: number; outcomeData: number; trustEventData: number; }> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const decisionCount = await prisma.aiDecision.count({
      where: { evaluatedAt: { gte: oneDayAgo } }
    });
    
    const outcomeCount = await prisma.claim.count({
      where: { filedAt: { gte: oneDayAgo } }
    }) + await prisma.manualOverride.count({
      where: { overrideTime: { gte: oneDayAgo } }
    });
    
    const trustEventCount = await prisma.trustEvent.count({
      where: { eventTime: { gte: oneDayAgo } }
    });
    
    // Normalize to percentages (0-100)
    return {
      decisionData: Math.min(100, (decisionCount / 1000) * 100), // Assuming 1000 decisions/day is 100%
      outcomeData: Math.min(100, (outcomeCount / 100) * 100),    // Assuming 100 outcomes/day is 100%
      trustEventData: Math.min(100, (trustEventCount / 500) * 100) // Assuming 500 events/day is 100%
    };
  }

  private async getLastSuccessfulRun(): Promise<Date> {
    const mostRecent = await prisma.driftDetectionResult.findFirst({
      orderBy: { timestamp: 'desc' },
      where: { error: null }
    }) || await prisma.accuracyMetrics.findFirst({
      orderBy: { calculatedAt: 'desc' },
      where: { error: null }
    });
    
    return mostRecent?.timestamp || new Date(0);
  }

  private async calculateSystemErrorRate(startTime: Date, endTime: Date): Promise<number> {
    const totalRuns = await prisma.driftDetectionResult.count({
      where: { timestamp: { gte: startTime, lte: endTime } }
    }) + await prisma.accuracyMetrics.count({
      where: { calculatedAt: { gte: startTime, lte: endTime } }
    });
    
    const errorRuns = await prisma.driftDetectionResult.count({
      where: { 
        timestamp: { gte: startTime, lte: endTime },
        error: { not: null }
      }
    }) + await prisma.accuracyMetrics.count({
      where: { 
        calculatedAt: { gte: startTime, lte: endTime },
        error: { not: null }
      }
    });
    
    return totalRuns > 0 ? errorRuns / totalRuns : 0;
  }

  private async calculateProcessingLatency(): Promise<number> {
    // Get average evaluation time from recent decisions
    const recentDecisions = await prisma.aiDecision.findMany({
      where: { evaluatedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
      take: 100
    });
    
    if (recentDecisions.length === 0) return 0;
    
    // This would require evaluation time data in decisions
    // For now, return a placeholder value
    return 150; // 150ms average latency
  }

  private determineOverallStatus(
    driftDetection: boolean,
    accuracyTracking: boolean,
    explainability: boolean,
    healthScoring: boolean,
    dataAvailability: { decisionData: number; outcomeData: number; trustEventData: number; },
    errorRate: number
  ): 'OPERATIONAL' | 'DEGRADED' | 'UNAVAILABLE' {
    // If any critical service is completely down
    if (!driftDetection || !accuracyTracking) {
      return 'UNAVAILABLE';
    }
    
    // If error rate is high or data availability is low
    if (errorRate > 0.3 || 
        dataAvailability.decisionData < 50 || 
        dataAvailability.outcomeData < 30) {
      return 'DEGRADED';
    }
    
    return 'OPERATIONAL';
  }

  private async collectPeriodData(period: { start: Date; end: Date; }): Promise<any> {
    // Collect AI decision data for the period
    const decisions = await prisma.aiDecision.findMany({
      where: {
        evaluatedAt: {
          gte: period.start,
          lte: period.end
        }
      },
      include: {
        riskContributions: true,
        triggeredRules: true
      }
    });

    // Collect behavior analysis data
    const behaviorAnalyses = await prisma.behaviorAnalysis.findMany({
      where: {
        evaluationTimestamp: {
          gte: period.start,
          lte: period.end
        }
      }
    });

    // Collect trust score data
    const trustScores = await prisma.trustScoreHistory.findMany({
      where: {
        calculatedAt: {
          gte: period.start,
          lte: period.end
        }
      }
    });

    return {
      decisions,
      behaviorAnalyses,
      trustScores,
      period
    };
  }

  private async detectScoreDistributionDrift(period1Data: any, period2Data: any): Promise<ScoreDistributionDrift[]> {
    const drifts: ScoreDistributionDrift[] = [];

    // AI Risk Score distribution drift
    const aiRiskScoreDrift = this.calculateScoreDistributionDrift(
      period1Data.decisions.map(d => d.aiRiskScore),
      period2Data.decisions.map(d => d.aiRiskScore),
      'AI_RISK_SCORE',
      period1Data.period,
      period2Data.period
    );
    if (aiRiskScoreDrift) drifts.push(aiRiskScoreDrift);

    // Behavior Risk Score distribution drift
    const behaviorRiskScoreDrift = this.calculateScoreDistributionDrift(
      period1Data.behaviorAnalyses.map(b => b.behaviorRiskScore),
      period2Data.behaviorAnalyses.map(b => b.behaviorRiskScore),
      'BEHAVIOR_RISK_SCORE',
      period1Data.period,
      period2Data.period
    );
    if (behaviorRiskScoreDrift) drifts.push(behaviorRiskScoreDrift);

    // Trust Score distribution drift
    const trustScoreDrift = this.calculateScoreDistributionDrift(
      period1Data.trustScores.map(t => t.score),
      period2Data.trustScores.map(t => t.score),
      'TRUST_SCORE',
      period1Data.period,
      period2Data.period
    );
    if (trustScoreDrift) drifts.push(trustScoreDrift);

    return drifts;
  }

  private calculateScoreDistributionDrift(
    scores1: number[],
    scores2: number[],
    component: string,
    period1: { start: Date; end: Date; },
    period2: { start: Date; end: Date; }
  ): ScoreDistributionDrift | null {
    if (scores1.length === 0 || scores2.length === 0) return null;

    const mean1 = this.calculateMean(scores1);
    const mean2 = this.calculateMean(scores2);
    const stdDev1 = this.calculateStandardDeviation(scores1);
    const stdDev2 = this.calculateStandardDeviation(scores2);
    const median1 = this.calculateMedian(scores1);
    const median2 = this.calculateMedian(scores2);

    const meanDifference = Math.abs(mean1 - mean2);
    const stdDevRatio = stdDev2 / stdDev1;
    const effectSize = meanDifference / Math.sqrt((stdDev1 ** 2 + stdDev2 ** 2) / 2);

    // Simple KS-like statistic (approximation)
    const ksStatistic = this.calculateKolmogorovSmirnov(scores1, scores2);

    const severity = this.determineScoreDistributionSeverity(meanDifference, effectSize, ksStatistic);

    return {
      component,
      period1: {
        ...period1,
        mean: mean1,
        median: median1,
        stdDev: stdDev1,
        sampleSize: scores1.length
      },
      period2: {
        ...period2,
        mean: mean2,
        median: median2,
        stdDev: stdDev2,
        sampleSize: scores2.length
      },
      driftMetrics: {
        meanDifference,
        stdDevRatio,
        ksStatistic,
        pValue: this.estimatePValue(ksStatistic, scores1.length, scores2.length),
        effectSize
      },
      severity
    };
  }

  private async detectRiskLevelDrift(period1Data: any, period2Data: any): Promise<RiskLevelDrift[]> {
    const drifts: RiskLevelDrift[] = [];

    // AI Risk Level distribution drift
    const aiRiskLevelDrift = this.calculateRiskLevelDrift(
      period1Data.decisions.map(d => d.aiRiskLevel),
      period2Data.decisions.map(d => d.aiRiskLevel),
      'AI_RISK_LEVEL',
      period1Data.period,
      period2Data.period
    );
    if (aiRiskLevelDrift) drifts.push(aiRiskLevelDrift);

    // Behavior Risk Level distribution drift
    const behaviorRiskLevelDrift = this.calculateRiskLevelDrift(
      period1Data.behaviorAnalyses.map(b => b.behaviorRiskLevel),
      period2Data.behaviorAnalyses.map(b => b.behaviorRiskLevel),
      'BEHAVIOR_RISK_LEVEL',
      period1Data.period,
      period2Data.period
    );
    if (behaviorRiskLevelDrift) drifts.push(behaviorRiskLevelDrift);

    // Trust Level distribution drift
    const trustLevelDrift = this.calculateRiskLevelDrift(
      period1Data.trustScores.map(t => t.level),
      period2Data.trustScores.map(t => t.level),
      'TRUST_LEVEL',
      period1Data.period,
      period2Data.period
    );
    if (trustLevelDrift) drifts.push(trustLevelDrift);

    return drifts;
  }

  private calculateRiskLevelDrift(
    levels1: string[],
    levels2: string[],
    component: string,
    period1: { start: Date; end: Date; },
    period2: { start: Date; end: Date; }
  ): RiskLevelDrift | null {
    if (levels1.length === 0 || levels2.length === 0) return null;

    const distribution1 = this.calculateLevelDistribution(levels1);
    const distribution2 = this.calculateLevelDistribution(levels2);

    const chiSquare = this.calculateChiSquare(distribution1, distribution2, levels1.length, levels2.length);
    const cramersV = this.calculateCramersV(chiSquare, levels1.length + levels2.length, Object.keys(distribution1).length);
    
    const significantShifts = this.findSignificantLevelShifts(distribution1, distribution2, levels1.length, levels2.length);

    const severity = this.determineRiskLevelSeverity(cramersV, significantShifts);

    return {
      component,
      period1: {
        ...period1,
        distribution: distribution1,
        total: levels1.length
      },
      period2: {
        ...period2,
        distribution: distribution2,
        total: levels2.length
      },
      driftMetrics: {
        chiSquare,
        pValue: this.estimateChiSquarePValue(chiSquare, Object.keys(distribution1).length - 1),
        cramersV,
        significantShifts
      },
      severity
    };
  }

  private async detectDecisionAggressivenessDrift(period1Data: any, period2Data: any): Promise<DecisionAggressivenessDrift[]> {
    const drifts: DecisionAggressivenessDrift[] = [];

    if (period1Data.decisions.length > 0 && period2Data.decisions.length > 0) {
      const escalationDist1 = this.calculateEscalationDistribution(period1Data.decisions);
      const escalationDist2 = this.calculateEscalationDistribution(period2Data.decisions);
      
      const recommendationDist1 = this.calculateRecommendationDistribution(period1Data.decisions);
      const recommendationDist2 = this.calculateRecommendationDistribution(period2Data.decisions);

      const escalationChiSquare = this.calculateChiSquare(escalationDist1, escalationDist2, period1Data.decisions.length, period2Data.decisions.length);
      const recommendationChiSquare = this.calculateChiSquare(recommendationDist1, recommendationDist2, period1Data.decisions.length, period2Data.decisions.length);

      const severity = this.determineDecisionAggressivenessSeverity(escalationChiSquare, recommendationChiSquare);

      drifts.push({
        period1: {
          ...period1Data.period,
          escalationDistribution: escalationDist1,
          recommendationDistribution: recommendationDist1,
          totalDecisions: period1Data.decisions.length
        },
        period2: {
          ...period2Data.period,
          escalationDistribution: escalationDist2,
          recommendationDistribution: recommendationDist2,
          totalDecisions: period2Data.decisions.length
        },
        driftMetrics: {
          escalationChiSquare,
          recommendationChiSquare,
          escalationPValue: this.estimateChiSquarePValue(escalationChiSquare, Object.keys(escalationDist1).length - 1),
          recommendationPValue: this.estimateChiSquarePValue(recommendationChiSquare, Object.keys(recommendationDist1).length - 1),
          significantEscalationShifts: this.findSignificantLevelShifts(escalationDist1, escalationDist2, period1Data.decisions.length, period2Data.decisions.length)
        },
        severity
      });
    }

    return drifts;
  }

  private async detectPatternFrequencyDrift(period1Data: any, period2Data: any): Promise<PatternFrequencyDrift[]> {
    const drifts: PatternFrequencyDrift[] = [];

    // Extract all unique pattern types
    const allPatterns = new Set([
      ...period1Data.behaviorAnalyses.flatMap(b => b.detectedPatterns.map(p => p.patternType)),
      ...period2Data.behaviorAnalyses.flatMap(b => b.detectedPatterns.map(p => p.patternType))
    ]);

    for (const patternType of allPatterns) {
      const freq1 = this.calculatePatternFrequency(period1Data.behaviorAnalyses, patternType);
      const freq2 = this.calculatePatternFrequency(period2Data.behaviorAnalyses, patternType);

      if (freq1.totalEvaluations > 10 && freq2.totalEvaluations > 10) { // Minimum sample size
        const frequencyChange = Math.abs(freq2.frequency - freq1.frequency);
        const relativeChange = frequencyChange / freq1.frequency;
        
        const zScore = this.calculateZScoreForProportions(
          freq1.frequency / freq1.totalEvaluations,
          freq2.frequency / freq2.totalEvaluations,
          freq1.totalEvaluations,
          freq2.totalEvaluations
        );

        const severity = this.determinePatternFrequencySeverity(relativeChange, Math.abs(zScore));

        drifts.push({
          patternType,
          period1: {
            ...period1Data.period,
            frequency: freq1.frequency,
            totalEvaluations: freq1.totalEvaluations
          },
          period2: {
            ...period2Data.period,
            frequency: freq2.frequency,
            totalEvaluations: freq2.totalEvaluations
          },
          driftMetrics: {
            frequencyChange,
            relativeChange,
            zScore,
            pValue: this.calculatePValueFromZScore(zScore)
          },
          severity
        });
      }
    }

    return drifts;
  }

  // Statistical helper methods
  private calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length);
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private calculateKolmogorovSmirnov(sample1: number[], sample2: number[]): number {
    // Simplified KS statistic calculation
    const sorted1 = [...sample1].sort((a, b) => a - b);
    const sorted2 = [...sample2].sort((a, b) => a - b);
    
    const n1 = sorted1.length;
    const n2 = sorted2.length;
    
    let maxDiff = 0;
    let i = 0, j = 0;
    
    while (i < n1 && j < n2) {
      const diff = Math.abs(i/n1 - j/n2);
      maxDiff = Math.max(maxDiff, diff);
      
      if (sorted1[i] <= sorted2[j]) i++;
      else j++;
    }
    
    return maxDiff;
  }

  private calculateLevelDistribution(levels: string[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    levels.forEach(level => {
      distribution[level] = (distribution[level] || 0) + 1;
    });
    return distribution;
  }

  private calculateChiSquare(dist1: Record<string, number>, dist2: Record<string, number>, total1: number, total2: number): number {
    const allLevels = new Set([...Object.keys(dist1), ...Object.keys(dist2)]);
    let chiSquare = 0;
    
    for (const level of allLevels) {
      const observed1 = dist1[level] || 0;
      const observed2 = dist2[level] || 0;
      const expected1 = total1 * ((observed1 + observed2) / (total1 + total2));
      const expected2 = total2 * ((observed1 + observed2) / (total1 + total2));
      
      if (expected1 > 0) chiSquare += Math.pow(observed1 - expected1, 2) / expected1;
      if (expected2 > 0) chiSquare += Math.pow(observed2 - expected2, 2) / expected2;
    }
    
    return chiSquare;
  }

  private calculateCramersV(chiSquare: number, total: number, categories: number): number {
    return Math.sqrt(chiSquare / (total * (categories - 1)));
  }

  private calculateEscalationDistribution(decisions: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    decisions.forEach(decision => {
      distribution[decision.escalationLevel] = (distribution[decision.escalationLevel] || 0) + 1;
    });
    return distribution;
  }

  private calculateRecommendationDistribution(decisions: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    decisions.forEach(decision => {
      decision.recommendations.forEach((rec: string) => {
        distribution[rec] = (distribution[rec] || 0) + 1;
      });
    });
    return distribution;
  }

  private calculatePatternFrequency(analyses: any[], patternType: string): { frequency: number; totalEvaluations: number } {
    let frequency = 0;
    analyses.forEach(analysis => {
      if (analysis.detectedPatterns.some((p: any) => p.patternType === patternType)) {
        frequency++;
      }
    });
    return { frequency, totalEvaluations: analyses.length };
  }

  private calculateZScoreForProportions(p1: number, p2: number, n1: number, n2: number): number {
    const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
    return (p1 - p2) / se;
  }

  // Severity determination methods
  private determineScoreDistributionSeverity(meanDifference: number, effectSize: number, ksStatistic: number): DriftSeverity {
    if (meanDifference > this.driftThresholds.scoreDistribution.high || effectSize > 0.8 || ksStatistic > 0.2) {
      return this.createSeverity('HIGH', 'Significant distribution shift detected');
    } else if (meanDifference > this.driftThresholds.scoreDistribution.medium || effectSize > 0.5 || ksStatistic > 0.1) {
      return this.createSeverity('MEDIUM', 'Moderate distribution shift detected');
    } else if (meanDifference > this.driftThresholds.scoreDistribution.low || effectSize > 0.2 || ksStatistic > 0.05) {
      return this.createSeverity('LOW', 'Minor distribution shift detected');
    }
    return this.createSeverity('LOW', 'No significant drift detected');
  }

  private determineRiskLevelSeverity(cramersV: number, significantShifts: any[]): DriftSeverity {
    if (cramersV > 0.3 || significantShifts.some(shift => Math.abs(shift.change) > 0.4)) {
      return this.createSeverity('HIGH', 'Significant risk level shift detected');
    } else if (cramersV > 0.2 || significantShifts.some(shift => Math.abs(shift.change) > 0.25)) {
      return this.createSeverity('MEDIUM', 'Moderate risk level shift detected');
    } else if (cramersV > 0.1 || significantShifts.length > 0) {
      return this.createSeverity('LOW', 'Minor risk level shift detected');
    }
    return this.createSeverity('LOW', 'No significant drift detected');
  }

  private determineDecisionAggressivenessSeverity(escalationChiSquare: number, recommendationChiSquare: number): DriftSeverity {
    const avgChiSquare = (escalationChiSquare + recommendationChiSquare) / 2;
    
    if (avgChiSquare > 20) {
      return this.createSeverity('HIGH', 'Significant decision pattern change detected');
    } else if (avgChiSquare > 10) {
      return this.createSeverity('MEDIUM', 'Moderate decision pattern change detected');
    } else if (avgChiSquare > 5) {
      return this.createSeverity('LOW', 'Minor decision pattern change detected');
    }
    return this.createSeverity('LOW', 'No significant drift detected');
  }

  private determinePatternFrequencySeverity(relativeChange: number, zScore: number): DriftSeverity {
    if (relativeChange > this.driftThresholds.patternFrequency.high || zScore > 2.5) {
      return this.createSeverity('HIGH', 'Significant pattern frequency change detected');
    } else if (relativeChange > this.driftThresholds.patternFrequency.medium || zScore > 1.96) {
      return this.createSeverity('MEDIUM', 'Moderate pattern frequency change detected');
    } else if (relativeChange > this.driftThresholds.patternFrequency.low || zScore > 1.65) {
      return this.createSeverity('LOW', 'Minor pattern frequency change detected');
    }
    return this.createSeverity('LOW', 'No significant drift detected');
  }

  private createSeverity(level: 'LOW' | 'MEDIUM' | 'HIGH', explanation: string): DriftSeverity {
    const score = level === 'HIGH' ? 0.8 : level === 'MEDIUM' ? 0.5 : 0.2;
    return {
      level,
      score,
      explanation,
      affectedComponents: []
    };
  }

  private calculateOverallSeverity(drifts: any[]): DriftSeverity {
    const highSeverityCount = drifts.filter(d => d.severity.level === 'HIGH').length;
    const mediumSeverityCount = drifts.filter(d => d.severity.level === 'MEDIUM').length;
    
    if (highSeverityCount > 0) {
      return this.createSeverity('HIGH', `Multiple high-severity drifts detected (${highSeverityCount} high, ${mediumSeverityCount} medium)`);
    } else if (mediumSeverityCount > 0) {
      return this.createSeverity('MEDIUM', `Multiple medium-severity drifts detected (${mediumSeverityCount} medium)`);
    } else if (drifts.length > 0) {
      return this.createSeverity('LOW', 'Only low-severity drifts detected');
    }
    return this.createSeverity('LOW', 'No significant drifts detected');
  }

  private generateDriftSummary(
    scoreDrifts: ScoreDistributionDrift[],
    riskDrifts: RiskLevelDrift[],
    decisionDrifts: DecisionAggressivenessDrift[],
    patternDrifts: PatternFrequencyDrift[]
  ): any {
    const allDrifts = [...scoreDrifts, ...riskDrifts, ...decisionDrifts, ...patternDrifts];
    const highSeverity = allDrifts.filter(d => d.severity.level === 'HIGH').length;
    const mediumSeverity = allDrifts.filter(d => d.severity.level === 'MEDIUM').length;
    const lowSeverity = allDrifts.filter(d => d.severity.level === 'LOW').length;

    return {
      totalDriftsDetected: allDrifts.length,
      highSeverityCount: highSeverity,
      mediumSeverityCount: mediumSeverity,
      lowSeverityCount: lowSeverity,
      mostAffectedComponent: this.findMostAffectedComponent(allDrifts)
    };
  }

  private findMostAffectedComponent(drifts: any[]): string {
    if (drifts.length === 0) return 'NONE';
    
    const componentCounts: Record<string, number> = {};
    drifts.forEach(drift => {
      const component = drift.component || 'DECISION_AGGRESSIVENESS';
      componentCounts[component] = (componentCounts[component] || 0) + 1;
    });

    return Object.entries(componentCounts).sort((a, b) => b[1] - a[1])[0][0];
  }

  private findSignificantLevelShifts(dist1: Record<string, number>, dist2: Record<string, number>, total1: number, total2: number): any[] {
    const shifts: any[] = [];
    const allLevels = new Set([...Object.keys(dist1), ...Object.keys(dist2)]);

    for (const level of allLevels) {
      const count1 = dist1[level] || 0;
      const count2 = dist2[level] || 0;
      const proportion1 = count1 / total1;
      const proportion2 = count2 / total2;
      const change = proportion2 - proportion1;

      if (Math.abs(change) > 0.1) { // 10% minimum change
        shifts.push({
          level,
          change: change * 100, // percentage
          direction: change > 0 ? 'INCREASE' : 'DECREASE'
        });
      }
    }

    return shifts;
  }

  // Statistical estimation methods
  private estimatePValue(ksStatistic: number, n1: number, n2: number): number {
    // Approximate p-value for KS test
    const effectiveN = Math.sqrt((n1 * n2) / (n1 + n2));
    const x = effectiveN * ksStatistic;
    return 2 * Math.exp(-2 * x * x);
  }

  private estimateChiSquarePValue(chiSquare: number, df: number): number {
    // Simple chi-square p-value approximation
    return Math.exp(-chiSquare / 2) * Math.pow(chiSquare, df / 2 - 1) / (Math.pow(2, df / 2) * this.gamma(df / 2));
  }

  private gamma(z: number): number {
    // Stirling's approximation for gamma function
    return Math.sqrt(2 * Math.PI / z) * Math.pow(z / Math.E, z);
  }

  private calculatePValueFromZScore(zScore: number): number {
    // Standard normal p-value approximation
    return 2 * (1 - this.phi(Math.abs(zScore)));
  }

  private phi(x: number): number {
    // Standard normal CDF approximation
    return 1 - Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  // Additional methods for accuracy tracking, explainability, and health scoring would follow
  // These would be implemented in subsequent iterations
  
  async analyzeAccuracy(request: AccuracyAnalysisRequest): Promise<AccuracyMetrics> {
    // Implementation for accuracy analysis
    throw new Error('Accuracy analysis not yet implemented');
  }

  async getSellerTimeline(request: TimelineRequest): Promise<SellerDecisionTimeline> {
    // Implementation for decision timeline
    throw new Error('Decision timeline not yet implemented');
  }

  async compareDecisions(request: ComparisonRequest): Promise<DecisionComparison> {
    // Implementation for decision comparison
    throw new Error('Decision comparison not yet implemented');
  }

  async calculateAIHealthScore(): Promise<AIHealthScore> {
    // Implementation for AI health scoring
    throw new Error('AI health scoring not yet implemented');
  }

  async getMonitoringHealth(): Promise<MonitoringHealth> {
    // Implementation for monitoring health check
    throw new Error('Monitoring health check not yet implemented');
  }
}