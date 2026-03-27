import { SignalMetrics, SignalThresholds, DEFAULT_THRESHOLDS, TimeBucket } from '../types/signal.types';
import { Logger } from '../utils/logger';

export class SignalAggregatorService {
  private thresholds: SignalThresholds;
  private logger: Logger;

  constructor(thresholds: SignalThresholds = DEFAULT_THRESHOLDS) {
    this.thresholds = thresholds;
    this.logger = new Logger('SignalAggregatorService');
  }

  // Read-only method to aggregate signals from various sources
  public async aggregateSignals(timeBucket: TimeBucket, corridor: string): Promise<SignalMetrics> {
    this.logger.info(`Aggregating signals for ${corridor} in ${timeBucket.bucketType} bucket`);
    
    // Simulate reading from various data sources (read-only)
    const rawMetrics = await this.readDataSources(timeBucket, corridor);
    
    // Calculate derived metrics (read-only transformations)
    const processedMetrics = this.calculateDerivedMetrics(rawMetrics);
    
    // Apply thresholds to determine status (advisory only)
    const statusMetrics = this.applyThresholds(processedMetrics);
    
    // Generate human-readable explanations (advisory only)
    const finalMetrics = this.generateStatusExplanation(statusMetrics);
    
    this.logger.info(`Signal aggregation completed for ${corridor}`);
    return finalMetrics;
  }

  // PRIVATE READ-ONLY METHODS - NO MUTATION

  private async readDataSources(timeBucket: TimeBucket, corridor: string): Promise<Partial<SignalMetrics>> {
    // Simulate reading from various read-only data sources
    // These would be actual database queries in production
    
    return {
      timestamp: new Date(),
      timeBucket: timeBucket.bucketType,
      corridor,
      
      // Intent volume (simulated data)
      requestCount: Math.floor(Math.random() * 100) + 50,
      requestGrowthRate: Math.random() * 0.5,
      
      // Drop-off points (simulated data)
      requestCreationStarted: Math.floor(Math.random() * 100) + 50,
      requestCreationCompleted: Math.floor(Math.random() * 80) + 40,
      
      offerReviewCount: Math.floor(Math.random() * 70) + 30,
      offerResponseRate: Math.random() * 0.7,
      
      negotiationStarted: Math.floor(Math.random() * 60) + 20,
      negotiationCompleted: Math.floor(Math.random() * 50) + 15,
      
      travelApprovalSubmitted: Math.floor(Math.random() * 40) + 10,
      travelApprovalApproved: Math.floor(Math.random() * 35) + 8,
      
      // Trust friction indicators (simulated data)
      kycStarted: Math.floor(Math.random() * 80) + 20,
      kycCompleted: Math.floor(Math.random() * 70) + 15,
      
      verifiedTravelers: Math.floor(Math.random() * 60) + 10,
      credibilityQuestions: Math.floor(Math.random() * 50) + 5,
      
      paymentIntentCreated: Math.floor(Math.random() * 40) + 8,
      paymentCompleted: Math.floor(Math.random() * 35) + 5,
      
      // Confirmation abandonment (simulated data)
      offerAccepted: Math.floor(Math.random() * 30) + 5,
      
      abandonmentReasons: {
        priceChanges: Math.floor(Math.random() * 20) + 2,
        timingIssues: Math.floor(Math.random() * 15) + 1,
        trustConcerns: Math.floor(Math.random() * 10) + 1,
        technicalIssues: Math.floor(Math.random() * 8) + 1,
        unknown: Math.floor(Math.random() * 12) + 1,
      },
      
      // Manual override frequency (simulated data)
      manualOverrides: Math.floor(Math.random() * 10) + 1,
      humanArbitrationCases: Math.floor(Math.random() * 8) + 1,
    };
  }

  private calculateDerivedMetrics(raw: Partial<SignalMetrics>): SignalMetrics {
    // Calculate abandonment rates (read-only calculations)
    const requestAbandonmentRate = raw.requestCreationStarted > 0 
      ? (raw.requestCreationStarted - raw.requestCreationCompleted) / raw.requestCreationStarted
      : 0;

    const negotiationAbandonmentRate = raw.negotiationStarted > 0
      ? (raw.negotiationStarted - raw.negotiationCompleted) / raw.negotiationStarted
      : 0;

    const travelApprovalRejectionRate = raw.travelApprovalSubmitted > 0
      ? (raw.travelApprovalSubmitted - raw.travelApprovalApproved) / raw.travelApprovalSubmitted
      : 0;

    const kycAbandonmentRate = raw.kycStarted > 0
      ? (raw.kycStarted - raw.kycCompleted) / raw.kycStarted
      : 0;

    const paymentAbandonmentRate = raw.paymentIntentCreated > 0
      ? (raw.paymentIntentCreated - raw.paymentCompleted) / raw.paymentIntentCreated
      : 0;

    const finalAbandonmentRate = raw.offerAccepted > 0 && raw.requestCreationStarted > 0
      ? (raw.requestCreationStarted - raw.offerAccepted) / raw.requestCreationStarted
      : 0;

    return {
      ...raw,
      requestAbandonmentRate,
      negotiationAbandonmentRate,
      travelApprovalRejectionRate,
      kycAbandonmentRate,
      paymentAbandonmentRate,
      finalAbandonmentRate,
      status: 'GREEN', // Temporary, will be calculated in applyThresholds
      statusExplanation: ''
    } as SignalMetrics;
  }

  private applyThresholds(metrics: SignalMetrics): SignalMetrics {
    // ADVISORY ONLY - No enforcement, just status reporting
    
    const abandonmentRate = metrics.finalAbandonmentRate;
    const kycCompletionRate = metrics.kycCompleted / Math.max(metrics.kycStarted, 1);
    const conversionRate = metrics.offerAccepted / Math.max(metrics.requestCreationStarted, 1);

    let status: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
    
    // Check red thresholds first (most critical)
    if (abandonmentRate > this.thresholds.redMinAbandonment ||
        kycCompletionRate < this.thresholds.redMaxKycCompletion ||
        conversionRate < this.thresholds.redMaxConversion) {
      status = 'RED';
    }
    // Check yellow thresholds
    else if (abandonmentRate > this.thresholds.yellowMaxAbandonment ||
             kycCompletionRate < this.thresholds.yellowMinKycCompletion ||
             conversionRate < this.thresholds.yellowMinConversion) {
      status = 'YELLOW';
    }
    // Otherwise green
    else {
      status = 'GREEN';
    }

    return {
      ...metrics,
      status
    };
  }

  private generateStatusExplanation(metrics: SignalMetrics): SignalMetrics {
    // ADVISORY ONLY - Human-readable explanations
    
    let explanation = '';
    
    switch (metrics.status) {
      case 'GREEN':
        explanation = 'All metrics within acceptable ranges. System operating normally.';
        break;
      case 'YELLOW':
        explanation = 'Moderate concerns detected. Monitor closely but no immediate action required.';
        if (metrics.finalAbandonmentRate > this.thresholds.yellowMaxAbandonment) {
          explanation += ' Elevated abandonment rate observed.';
        }
        if (metrics.kycCompleted / Math.max(metrics.kycStarted, 1) < this.thresholds.yellowMinKycCompletion) {
          explanation += ' KYC completion rate below expected levels.';
        }
        break;
      case 'RED':
        explanation = 'Critical issues detected. Immediate human review recommended.';
        if (metrics.finalAbandonmentRate > this.thresholds.redMinAbandonment) {
          explanation += ' Critical abandonment rate requires investigation.';
        }
        if (metrics.kycCompleted / Math.max(metrics.kycStarted, 1) < this.thresholds.redMaxKycCompletion) {
          explanation += ' KYC completion rate critically low.';
        }
        break;
    }

    return {
      ...metrics,
      statusExplanation: explanation
    };
  }

  // Public read-only method to get current thresholds (for transparency)
  public getThresholds(): SignalThresholds {
    return { ...this.thresholds }; // Return copy to prevent mutation
  }
}