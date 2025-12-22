import { PrismaClient } from '@prisma/client';
import { 
  SellerActivityMetrics, 
  DetectedPattern, 
  BehaviorRiskScore, 
  PatternDetectionConfig,
  BehaviorEvaluationRequest,
  BehaviorEvaluationResponse,
  PatternEvaluationResult,
  TemporalWindow
} from '../types/behavior-analysis.types';

const prisma = new PrismaClient();

export class AIBehaviorAnalysisService {
  private readonly defaultConfig: PatternDetectionConfig = {
    volumeSpikeThreshold: 200, // 200% increase
    refundClusteringWindow: 24, // 24 hours
    disputeBurstThreshold: 3, // 3 disputes per hour
    trustScoreVolatilityThreshold: 0.15, // 15% standard deviation
    offerRejectionRateThreshold: 0.8, // 80% rejection rate
    temporalAnomalyZScore: 2.5 // 2.5 standard deviations
  };

  async evaluateSellerBehavior(request: BehaviorEvaluationRequest): Promise<BehaviorEvaluationResponse> {
    const startTime = Date.now();
    
    try {
      const config = { ...this.defaultConfig, ...request.configOverrides };
      
      // Collect seller activity metrics
      const metrics = await this.collectSellerMetrics(request.sellerId, request.timeWindows);
      
      // Detect patterns
      const patternResult = await this.detectPatterns(metrics, config);
      
      // Calculate risk score
      const riskScore = this.calculateRiskScore(patternResult.patterns);
      
      const evaluationTimeMs = Date.now() - startTime;
      
      return {
        success: true,
        data: {
          sellerId: request.sellerId,
          behaviorRiskScore: riskScore.score,
          behaviorRiskLevel: riskScore.level,
          detectedPatterns: patternResult.patterns,
          evaluationTimestamp: new Date()
        },
        evaluationTimeMs
      };
      
    } catch (error) {
      const evaluationTimeMs = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        evaluationTimeMs
      };
    }
  }

  private async collectSellerMetrics(sellerId: number, timeWindows?: Partial<TemporalWindow>): Promise<SellerActivityMetrics> {
    const now = new Date();
    const windows = timeWindows || {
      hours24: 24,
      days7: 7,
      days30: 30,
      days90: 90
    };

    // Collect order metrics
    const ordersCount = await this.getOrdersCount(sellerId, now, windows);
    const orderVelocity = await this.calculateOrderVelocity(ordersCount, windows);
    
    // Collect claim metrics
    const claimsCount = await this.getClaimsCount(sellerId, now, windows);
    const claimRate = await this.calculateClaimRate(claimsCount, ordersCount);
    
    // Collect refund metrics
    const refundsCount = await this.getRefundsCount(sellerId, now, windows);
    const refundRate = await this.calculateRefundRate(refundsCount, ordersCount);
    
    // Collect dispute metrics
    const escrowDisputesCount = await this.getDisputesCount(sellerId, now, windows);
    const disputeRate = await this.calculateDisputeRate(escrowDisputesCount, ordersCount);
    
    // Collect trust score metrics
    const trustScoreDeltas = await this.getTrustScoreDeltas(sellerId, now, windows);
    const trustScoreVolatility = this.calculateTrustScoreVolatility(trustScoreDeltas);
    
    // Collect offer metrics
    const offersMadeCount = await this.getOffersMadeCount(sellerId, now, windows);
    const offersRejectedCount = await this.getOffersRejectedCount(sellerId, now, windows);
    const offerRejectionRate = await this.calculateOfferRejectionRate(offersRejectedCount, offersMadeCount);

    return {
      sellerId,
      timestamp: now,
      ordersCount,
      orderVelocity,
      claimsCount,
      claimRate,
      refundsCount,
      refundRate,
      escrowDisputesCount,
      disputeRate,
      trustScoreDeltas,
      trustScoreVolatility,
      offersMadeCount,
      offersRejectedCount,
      offerRejectionRate
    };
  }

  private async detectPatterns(metrics: SellerActivityMetrics, config: PatternDetectionConfig): Promise<PatternEvaluationResult> {
    const patterns: DetectedPattern[] = [];

    // Volume spike detection
    patterns.push(...this.detectVolumeSpikes(metrics, config));
    
    // Refund clustering detection
    patterns.push(...this.detectRefundClustering(metrics, config));
    
    // Dispute burst detection
    patterns.push(...this.detectDisputeBursts(metrics, config));
    
    // Trust score volatility detection
    patterns.push(...this.detectTrustScoreVolatility(metrics, config));
    
    // Offer abuse detection
    patterns.push(...this.detectOfferAbuse(metrics, config));
    
    // Temporal anomaly detection
    patterns.push(...this.detectTemporalAnomalies(metrics, config));

    return { patterns, metrics };
  }

  private detectVolumeSpikes(metrics: SellerActivityMetrics, config: PatternDetectionConfig): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const { ordersCount } = metrics;

    // Check for spikes in each time window
    (Object.keys(ordersCount) as Array<keyof TemporalWindow>).forEach(window => {
      const current = ordersCount[window];
      const historicalAvg = this.calculateHistoricalAverage(ordersCount, window);
      
      if (historicalAvg > 0 && current > historicalAvg * (1 + config.volumeSpikeThreshold / 100)) {
        const severity = this.determineVolumeSpikeSeverity(current, historicalAvg, config.volumeSpikeThreshold);
        
        patterns.push({
          patternType: 'VOLUME_SPIKE',
          timeWindow: window,
          severity,
          confidence: this.calculateVolumeSpikeConfidence(current, historicalAvg),
          riskContribution: this.calculateVolumeSpikeRiskContribution(current, historicalAvg),
          explanation: `Order volume spike detected: ${current} orders in ${window} (historical average: ${historicalAvg.toFixed(1)})`,
          recommendations: [
            'Review order patterns for potential fraudulent activity',
            'Consider enhanced verification for recent orders',
            'Monitor seller activity closely for the next 48 hours'
          ],
          detectedAt: new Date(),
          metadata: { current, historicalAvg, percentageIncrease: ((current - historicalAvg) / historicalAvg) * 100 }
        });
      }
    });

    return patterns;
  }

  private detectRefundClustering(metrics: SellerActivityMetrics, config: PatternDetectionConfig): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    // Implementation for refund clustering detection
    // This would analyze refund patterns within specific time windows
    
    return patterns;
  }

  private detectDisputeBursts(metrics: SellerActivityMetrics, config: PatternDetectionConfig): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    // Implementation for dispute burst detection
    
    return patterns;
  }

  private detectTrustScoreVolatility(metrics: SellerActivityMetrics, config: PatternDetectionConfig): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    // Implementation for trust score volatility detection
    
    return patterns;
  }

  private detectOfferAbuse(metrics: SellerActivityMetrics, config: PatternDetectionConfig): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    // Implementation for offer abuse detection
    
    return patterns;
  }

  private detectTemporalAnomalies(metrics: SellerActivityMetrics, config: PatternDetectionConfig): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    // Implementation for temporal anomaly detection
    
    return patterns;
  }

  private calculateRiskScore(patterns: DetectedPattern[]): { score: number; level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' } {
    if (patterns.length === 0) {
      return { score: 0.0, level: 'LOW' };
    }

    // Calculate weighted risk score based on pattern severity and confidence
    let totalRisk = 0;
    let totalWeight = 0;

    const severityWeights = {
      LOW: 0.3,
      MEDIUM: 0.6,
      HIGH: 0.8,
      CRITICAL: 1.0
    };

    patterns.forEach(pattern => {
      const weight = severityWeights[pattern.severity] * pattern.confidence;
      totalRisk += pattern.riskContribution * weight;
      totalWeight += weight;
    });

    const score = totalWeight > 0 ? totalRisk / totalWeight : 0;
    
    // Determine risk level
    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (score >= 0.8) level = 'CRITICAL';
    else if (score >= 0.6) level = 'HIGH';
    else if (score >= 0.3) level = 'MEDIUM';

    return { score, level };
  }

  // Helper methods for metric calculations
  private calculateHistoricalAverage(metrics: TemporalWindow, currentWindow: keyof TemporalWindow): number {
    // Simple implementation - in production this would use more sophisticated historical analysis
    const values = Object.values(metrics).filter(val => val !== metrics[currentWindow]);
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private determineVolumeSpikeSeverity(current: number, historicalAvg: number, threshold: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const increaseRatio = (current - historicalAvg) / historicalAvg;
    
    if (increaseRatio > 5.0) return 'CRITICAL';
    if (increaseRatio > 3.0) return 'HIGH';
    if (increaseRatio > 2.0) return 'MEDIUM';
    return 'LOW';
  }

  private calculateVolumeSpikeConfidence(current: number, historicalAvg: number): number {
    // Higher confidence for larger deviations from historical average
    const deviation = Math.abs(current - historicalAvg) / (historicalAvg || 1);
    return Math.min(1.0, deviation * 0.8);
  }

  private calculateVolumeSpikeRiskContribution(current: number, historicalAvg: number): number {
    const ratio = current / (historicalAvg || 1);
    return Math.min(1.0, (ratio - 1) * 0.3);
  }

  // Database query methods (simplified implementations)
  private async getOrdersCount(sellerId: number, now: Date, windows: TemporalWindow): Promise<TemporalWindow> {
    // This would query the database for order counts in each time window
    return {
      hours24: await this.queryOrderCount(sellerId, now, 24),
      days7: await this.queryOrderCount(sellerId, now, 7 * 24),
      days30: await this.queryOrderCount(sellerId, now, 30 * 24),
      days90: await this.queryOrderCount(sellerId, now, 90 * 24)
    };
  }

  private async queryOrderCount(sellerId: number, now: Date, hours: number): Promise<number> {
    const since = new Date(now.getTime() - hours * 60 * 60 * 1000);
    
    // This would be a real database query
    // For now, return a mock value
    return Math.floor(Math.random() * 50);
  }

  // Similar methods would be implemented for claims, refunds, disputes, etc.
  private async getClaimsCount(sellerId: number, now: Date, windows: TemporalWindow): Promise<TemporalWindow> {
    return { hours24: 0, days7: 0, days30: 0, days90: 0 };
  }

  private async getRefundsCount(sellerId: number, now: Date, windows: TemporalWindow): Promise<TemporalWindow> {
    return { hours24: 0, days7: 0, days30: 0, days90: 0 };
  }

  private async getDisputesCount(sellerId: number, now: Date, windows: TemporalWindow): Promise<TemporalWindow> {
    return { hours24: 0, days7: 0, days30: 0, days90: 0 };
  }

  private async getTrustScoreDeltas(sellerId: number, now: Date, windows: TemporalWindow): Promise<TemporalWindow> {
    return { hours24: 0, days7: 0, days30: 0, days90: 0 };
  }

  private async getOffersMadeCount(sellerId: number, now: Date, windows: TemporalWindow): Promise<TemporalWindow> {
    return { hours24: 0, days7: 0, days30: 0, days90: 0 };
  }

  private async getOffersRejectedCount(sellerId: number, now: Date, windows: TemporalWindow): Promise<TemporalWindow> {
    return { hours24: 0, days7: 0, days30: 0, days90: 0 };
  }

  // Rate calculation methods
  private calculateOrderVelocity(ordersCount: TemporalWindow, windows: TemporalWindow): TemporalWindow {
    return {
      hours24: ordersCount.hours24 / (windows.hours24 || 24),
      days7: ordersCount.days7 / (windows.days7 || 7),
      days30: ordersCount.days30 / (windows.days30 || 30),
      days90: ordersCount.days90 / (windows.days90 || 90)
    };
  }

  private calculateClaimRate(claimsCount: TemporalWindow, ordersCount: TemporalWindow): TemporalWindow {
    return this.calculateRate(claimsCount, ordersCount);
  }

  private calculateRefundRate(refundsCount: TemporalWindow, ordersCount: TemporalWindow): TemporalWindow {
    return this.calculateRate(refundsCount, ordersCount);
  }

  private calculateDisputeRate(disputesCount: TemporalWindow, ordersCount: TemporalWindow): TemporalWindow {
    return this.calculateRate(disputesCount, ordersCount);
  }

  private calculateOfferRejectionRate(rejectedCount: TemporalWindow, madeCount: TemporalWindow): TemporalWindow {
    return this.calculateRate(rejectedCount, madeCount);
  }

  private calculateRate(numerator: TemporalWindow, denominator: TemporalWindow): TemporalWindow {
    return {
      hours24: denominator.hours24 > 0 ? numerator.hours24 / denominator.hours24 : 0,
      days7: denominator.days7 > 0 ? numerator.days7 / denominator.days7 : 0,
      days30: denominator.days30 > 0 ? numerator.days30 / denominator.days30 : 0,
      days90: denominator.days90 > 0 ? numerator.days90 / denominator.days90 : 0
    };
  }

  private calculateTrustScoreVolatility(deltas: TemporalWindow): number {
    // Calculate standard deviation of trust score deltas
    const values = Object.values(deltas).filter(val => val !== 0);
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}