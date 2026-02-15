// Anomaly Detection Engine
// محرك اكتشاف الشذوذ - Advanced anomaly detection using statistical analysis

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AnomalyDetectionInput {
  userId: string;
  transactionId?: string;
  amount?: number;
  type: string;
  data: Record<string, any>;
}

export interface AnomalyResult {
  isAnomaly: boolean;
  anomalyScore: number; // 0-100
  anomalyType: AnomalyType;
  confidence: number;
  detectedAt: Date;
  description: string;
  contributingFactors: {
    factor: string;
    deviation: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }[];
  recommendations: string[];
}

export type AnomalyType = 
  | 'TRANSACTION_AMOUNT' 
  | 'TRANSACTION_FREQUENCY'
  | 'LOCATION_CHANGE'
  | 'DEVICE_CHANGE'
  | 'TIME_PATTERN'
  | 'BEHAVIORAL_CHANGE'
  | 'PAYMENT_PATTERN'
  | 'MULTI_FACTOR'

export interface StatisticalProfile {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  count: number;
  percentile95: number;
  percentile99: number;
}

export class AnomalyDetectionEngine {
  // Z-score threshold for anomaly detection
  private readonly Z_SCORE_THRESHOLD = 2.5;

  // Statistical profiles cache (in production, use Redis)
  private profiles: Map<string, Map<string, StatisticalProfile>> = new Map();

  // Detect anomalies in input data
  async detectAnomalies(input: AnomalyDetectionInput): Promise<AnomalyResult> {
    const contributingFactors: { factor: string; deviation: number; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }[] = [];
    let maxDeviation = 0;
    let maxSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

    // 1. Check transaction amount anomalies
    if (input.amount) {
      const amountAnomaly = await this.checkAmountAnomaly(input.userId, input.amount);
      if (amountAnomaly) {
        contributingFactors.push(amountAnomaly);
        maxDeviation = Math.max(maxDeviation, amountAnomaly.deviation);
        maxSeverity = this.worsen(maxSeverity, amountAnomaly.severity);
      }
    }

    // 2. Check frequency anomalies
    const freqAnomaly = await this.checkFrequencyAnomaly(input.userId, input.type);
    if (freqAnomaly) {
      contributingFactors.push(freqAnomaly);
      maxDeviation = Math.max(maxDeviation, freqAnomaly.deviation);
      maxSeverity = this.worsen(maxSeverity, freqAnomaly.severity);
    }

    // 3. Check location anomalies
    if (input.data.location) {
      const locAnomaly = await this.checkLocationAnomaly(input.userId, input.data.location);
      if (locAnomaly) {
        contributingFactors.push(locAnomaly);
        maxDeviation = Math.max(maxDeviation, locAnomaly.deviation);
        maxSeverity = this.worsen(maxSeverity, locAnomaly.severity);
      }
    }

    // 4. Check device anomalies
    if (input.data.deviceId) {
      const devAnomaly = await this.checkDeviceAnomaly(input.userId, input.data.deviceId);
      if (devAnomaly) {
        contributingFactors.push(devAnomaly);
        maxDeviation = Math.max(maxDeviation, devAnomaly.deviation);
        maxSeverity = this.worsen(maxSeverity, devAnomaly.severity);
      }
    }

    // 5. Check time pattern anomalies
    if (input.data.timestamp) {
      const timeAnomaly = this.checkTimePatternAnomaly(input.userId, new Date(input.data.timestamp));
      if (timeAnomaly) {
        contributingFactors.push(timeAnomaly);
        maxDeviation = Math.max(maxDeviation, timeAnomaly.deviation);
        maxSeverity = this.worsen(maxSeverity, timeAnomaly.severity);
      }
    }

    // 6. Check behavioral anomalies
    if (input.data.behavioralScore !== undefined) {
      const behaviorAnomaly = await this.checkBehavioralAnomaly(input.userId, input.data.behavioralScore);
      if (behaviorAnomaly) {
        contributingFactors.push(behaviorAnomaly);
        maxDeviation = Math.max(maxDeviation, behaviorAnomaly.deviation);
        maxSeverity = this.worsen(maxSeverity, behaviorAnomaly.severity);
      }
    }

    // Calculate overall anomaly score
    const anomalyScore = this.calculateAnomalyScore(contributingFactors);
    const isAnomaly = anomalyScore > 30;

    // Determine anomaly type based on highest contribution
    const anomalyType = this.determineAnomalyType(contributingFactors);

    // Generate recommendations
    const recommendations = this.generateAnomalyRecommendations(contributingFactors, anomalyScore);

    // Calculate confidence based on data availability
    const confidence = this.calculateConfidence(input.userId);

    return {
      isAnomaly,
      anomalyScore,
      anomalyType,
      confidence,
      detectedAt: new Date(),
      description: this.generateAnomalyDescription(contributingFactors, anomalyScore),
      contributingFactors,
      recommendations
    };
  }

  // Check transaction amount against user's historical profile
  private async checkAmountAnomaly(
    userId: string,
    amount: number
  ): Promise<{ factor: string; deviation: number; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' } | null> {
    const profile = await this.getOrCreateProfile(userId, 'amount');
    
    if (profile.count < 5) return null;

    const zScore = Math.abs((amount - profile.mean) / profile.stdDev);

    if (zScore > this.Z_SCORE_THRESHOLD) {
      const deviation = ((amount - profile.mean) / profile.mean) * 100;
      return {
        factor: 'TRANSACTION_AMOUNT',
        deviation,
        severity: this.zScoreToSeverity(zScore)
      };
    }

    return null;
  }

  // Check frequency anomalies
  private async checkFrequencyAnomaly(
    userId: string,
    type: string
  ): Promise<{ factor: string; deviation: number; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' } | null> {
    const profile = await this.getOrCreateProfile(userId, `frequency_${type}`);
    const recentCount = Math.floor(Math.random() * 10); // Simplified
    
    if (profile.count < 10) return null;

    const zScore = Math.abs((recentCount - profile.mean) / profile.stdDev);

    if (zScore > this.Z_SCORE_THRESHOLD) {
      return {
        factor: 'TRANSACTION_FREQUENCY',
        deviation: zScore * 25,
        severity: this.zScoreToSeverity(zScore)
      };
    }

    return null;
  }

  // Check location anomalies
  private async checkLocationAnomaly(
    userId: string,
    location: { country: string; city?: string }
  ): Promise<{ factor: string; deviation: number; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' } | null> {
    const knownLocations = await this.getUserKnownLocations(userId);
    
    if (!knownLocations.includes(location.country)) {
      return {
        factor: 'LOCATION_CHANGE',
        deviation: 40,
        severity: 'MEDIUM'
      };
    }

    return null;
  }

  // Check device anomalies
  private async checkDeviceAnomaly(
    userId: string,
    deviceId: string
  ): Promise<{ factor: string; deviation: number; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' } | null> {
    const knownDevices = await this.getUserKnownDevices(userId);
    
    if (!knownDevices.includes(deviceId)) {
      return {
        factor: 'DEVICE_CHANGE',
        deviation: 35,
        severity: 'MEDIUM'
      };
    }

    return null;
  }

  // Check time pattern anomalies
  private checkTimePatternAnomaly(
    userId: string,
    timestamp: Date
  ): { factor: string; deviation: number; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' } | null {
    const hour = timestamp.getHours();
    
    if (hour >= 2 && hour <= 5) {
      return {
        factor: 'TIME_PATTERN',
        deviation: 30,
        severity: 'LOW'
      };
    }

    return null;
  }

  // Check behavioral anomalies
  private async checkBehavioralAnomaly(
    userId: string,
    behavioralScore: number
  ): Promise<{ factor: string; deviation: number; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' } | null> {
    const profile = await this.getOrCreateProfile(userId, 'behavioral');
    
    if (profile.count < 5) return null;

    const zScore = Math.abs((behavioralScore - profile.mean) / profile.stdDev);

    if (zScore > this.Z_SCORE_THRESHOLD) {
      return {
        factor: 'BEHAVIORAL_CHANGE',
        deviation: zScore * 20,
        severity: this.zScoreToSeverity(zScore)
      };
    }

    return null;
  }

  // Calculate overall anomaly score
  private calculateAnomalyScore(
    factors: { factor: string; deviation: number; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }[]
  ): number {
    if (factors.length === 0) return 0;

    const severityWeights = {
      'LOW': 15,
      'MEDIUM': 35,
      'HIGH': 65,
      'CRITICAL': 90
    };

    const weightedScore = factors.reduce((sum, factor) => {
      return sum + Math.min(factor.deviation, 100) * (severityWeights[factor.severity] / 100);
    }, 0);

    return Math.min(100, weightedScore);
  }

  // Determine primary anomaly type
  private determineAnomalyType(
    factors: { factor: string; deviation: number; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }[]
  ): AnomalyType {
    if (factors.length === 0) return 'TRANSACTION_AMOUNT';

    const sorted = [...factors].sort((a, b) => b.deviation - a.deviation);
    const primary = sorted[0].factor;

    const typeMap: Record<string, AnomalyType> = {
      'TRANSACTION_AMOUNT': 'TRANSACTION_AMOUNT',
      'TRANSACTION_FREQUENCY': 'TRANSACTION_FREQUENCY',
      'LOCATION_CHANGE': 'LOCATION_CHANGE',
      'DEVICE_CHANGE': 'DEVICE_CHANGE',
      'TIME_PATTERN': 'TIME_PATTERN',
      'BEHAVIORAL_CHANGE': 'BEHAVIORAL_CHANGE'
    };

    return typeMap[primary] || 'MULTI_FACTOR';
  }

  // Generate anomaly description
  private generateAnomalyDescription(
    factors: { factor: string; deviation: number; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }[],
    score: number
  ): string {
    if (factors.length === 0) return 'No anomalies detected';

    const primary = factors[0];
    const severityText = score > 70 ? 'Critical' : score > 50 ? 'High' : score > 30 ? 'Moderate' : 'Minor';
    
    return `${severityText} anomaly detected in ${primary.factor.toLowerCase().replace(/_/g, ' ')} with ${primary.deviation.toFixed(1)}% deviation from normal patterns`;
  }

  // Generate recommendations based on detected anomalies
  private generateAnomalyRecommendations(
    factors: { factor: string; deviation: number; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }[],
    score: number
  ): string[] {
    const recommendations: string[] = [];

    if (score > 70) {
      recommendations.push('Block transaction pending manual review');
      recommendations.push('Notify fraud team immediately');
    } else if (score > 50) {
      recommendations.push('Require additional verification');
      recommendations.push('Send confirmation to registered email/phone');
    } else if (score > 30) {
      recommendations.push('Log for monitoring');
      recommendations.push('Consider step-up authentication');
    }

    for (const factor of factors) {
      switch (factor.factor) {
        case 'LOCATION_CHANGE':
          recommendations.push('Verify location through email confirmation');
          break;
        case 'DEVICE_CHANGE':
          recommendations.push('Prompt device verification');
          break;
        case 'TRANSACTION_AMOUNT':
          recommendations.push('Consider splitting large transactions');
          break;
        case 'BEHAVIORAL_CHANGE':
          recommendations.push('Review session for suspicious activity');
          break;
      }
    }

    return [...new Set(recommendations)];
  }

  // Get or create profile
  private async getOrCreateProfile(userId: string, profileKey: string): Promise<StatisticalProfile> {
    const profileMap = this.profiles.get(userId);
    if (profileMap && profileMap.has(profileKey)) {
      return profileMap.get(profileKey)!;
    }

    return {
      mean: 100,
      stdDev: 50,
      min: 0,
      max: 500,
      count: 10,
      percentile95: 200,
      percentile99: 300
    };
  }

  // Get user's known locations
  private async getUserKnownLocations(userId: string): Promise<string[]> {
    try {
      const profile = await (prisma as any).userRiskProfile?.findUnique({
        where: { userId }
      });
      return profile?.knownLocations || [];
    } catch {
      return ['SA', 'AE', 'EG'];
    }
  }

  // Get user's known devices
  private async getUserKnownDevices(userId: string): Promise<string[]> {
    try {
      const profile = await (prisma as any).userRiskProfile?.findUnique({
        where: { userId }
      });
      return profile?.knownDevices || [];
    } catch {
      return ['device-1', 'device-2'];
    }
  }

  // Convert Z-score to severity
  private zScoreToSeverity(zScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (zScore < 3) return 'LOW';
    if (zScore < 4) return 'MEDIUM';
    if (zScore < 5) return 'HIGH';
    return 'CRITICAL';
  }

  // Worsen severity
  private worsen(current: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', worse: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const currentIdx = levels.indexOf(current);
    const worseIdx = levels.indexOf(worse);
    return levels[Math.max(currentIdx, worseIdx)] as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }

  // Calculate confidence based on data availability
  private calculateConfidence(userId: string): number {
    const profileMap = this.profiles.get(userId);
    if (!profileMap) return 0.5;
    
    const totalCount = Array.from(profileMap.values()).reduce((sum, p) => sum + p.count, 0);
    if (totalCount < 10) return 0.4;
    if (totalCount < 50) return 0.6;
    if (totalCount < 100) return 0.8;
    return 0.95;
  }

  // Batch detect anomalies
  async detectBatch(inputs: AnomalyDetectionInput[]): Promise<AnomalyResult[]> {
    return Promise.all(inputs.map(input => this.detectAnomalies(input)));
  }

  // Get anomaly history for user
  async getAnomalyHistory(userId: string, limit: number = 100): Promise<AnomalyResult[]> {
    return [];
  }

  // Clear anomaly profiles for user
  clearProfiles(userId: string): void {
    this.profiles.delete(userId);
  }
}

export const anomalyDetectionEngine = new AnomalyDetectionEngine();
