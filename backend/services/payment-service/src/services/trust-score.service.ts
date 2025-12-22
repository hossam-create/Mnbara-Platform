import { PrismaClient } from '@prisma/client';
import {
  TrustScoreConfig,
  TrustScoreResult,
  TrustScoreComponents,
  TrustScoreLevel,
  TrustScoreTrend,
  TrustScoreMetrics,
  TrustScoreRequest,
  TrustScoreHistory,
  TrustScoreHealth
} from '../types/trust-score.types';

const prisma = new PrismaClient();

export class TrustScoreService {
  private readonly defaultConfig: TrustScoreConfig = {
    weights: {
      accountMaturity: 20,
      transactionHistory: 30,
      disputeHistory: 25,
      behavioralStability: 15,
      trustEvents: 10
    },
    decay: {
      penaltyHalfLifeDays: 30,
      recoveryRatePerDay: 0.5,
      maxDailyRecovery: 2
    },
    thresholds: {
      highTrust: 80,
      mediumTrust: 60,
      criticalPenalty: 20
    },
    timeWindows: {
      shortTerm: 7,
      mediumTerm: 30,
      longTerm: 90,
      historical: 365
    }
  };

  async calculateTrustScore(request: TrustScoreRequest): Promise<TrustScoreResult> {
    const startTime = Date.now();
    const config = { ...this.defaultConfig, ...request.configOverrides };
    
    try {
      // Collect all metrics for this seller
      const metrics = await this.collectSellerMetrics(request.sellerId, config);
      
      // Calculate individual component scores
      const components = this.calculateComponentScores(metrics, config);
      
      // Calculate weighted final score
      const finalScore = this.calculateFinalScore(components, config);
      
      // Determine trust level
      const level = this.determineTrustLevel(finalScore, config);
      
      // Calculate trend and volatility
      const history = await this.getScoreHistory(request.sellerId, 90);
      const trend = this.calculateTrend(history);
      const volatility = this.calculateVolatility(history);
      
      // Generate explanation
      const explanation = this.generateExplanation(components, finalScore, level, trend);
      
      const result: TrustScoreResult = {
        sellerId: request.sellerId,
        score: Math.round(finalScore * 100) / 100, // Round to 2 decimal places
        level,
        components,
        trend,
        volatility,
        explanation,
        eventReferences: [], // Will be populated from metrics
        calculatedAt: new Date(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // Valid for 24 hours
      };

      // Store this score calculation for historical tracking
      await this.storeScoreSnapshot(result);

      return result;

    } catch (error) {
      throw new Error(`Failed to calculate trust score for seller ${request.sellerId}: ${error.message}`);
    }
  }

  private async collectSellerMetrics(sellerId: number, config: TrustScoreConfig): Promise<TrustScoreMetrics> {
    // Implementation to collect all relevant metrics from database
    // This is a simplified version - actual implementation would query multiple tables
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get user account information
    const user = await prisma.user.findUnique({
      where: { id: sellerId },
      include: {
        ratingsReceived: true,
        transactions: true
      }
    });

    if (!user) {
      throw new Error(`Seller with ID ${sellerId} not found`);
    }

    // Calculate account age in days
    const accountAgeDays = Math.floor((now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

    // Get order statistics (simplified - would need actual order data)
    const totalOrders = user.transactions.filter(t => t.type === 'PAYMENT').length;
    const completedOrders = user.transactions.filter(t => 
      t.type === 'PAYMENT' && t.status === 'COMPLETED'
    ).length;
    const successRate = totalOrders > 0 ? completedOrders / totalOrders : 1;

    // Get recent orders (last 30 days)
    const recentOrders = user.transactions.filter(t => 
      t.type === 'PAYMENT' && 
      t.createdAt >= thirtyDaysAgo
    ).length;

    // Get dispute and claim statistics (simplified)
    const disputes = await prisma.dispute.findMany({
      where: { 
        OR: [
          { buyerId: sellerId },
          { travelerId: sellerId }
        ]
      }
    });

    const disputesInitiated = disputes.filter(d => d.buyerId === sellerId).length;
    const disputesReceived = disputes.filter(d => d.travelerId === sellerId).length;

    // Calculate rating statistics
    const ratings = user.ratingsReceived;
    const positiveRatings = ratings.filter(r => r.score >= 4).length;
    const negativeRatings = ratings.filter(r => r.score <= 2).length;

    const metrics: TrustScoreMetrics = {
      sellerId,
      accountAgeDays,
      verificationLevel: 2, // Default verification level (would come from KYC system)
      totalOrders,
      completedOrders,
      successRate,
      claimsCount: 0, // Would come from protection system
      claimsRate: 0,
      refundsCount: 0, // Would come from refund system
      refundRate: 0,
      disputesInitiated,
      disputesReceived,
      disputeResolutionRate: 0.8, // Default resolution rate
      positiveEvents: positiveRatings,
      negativeEvents: negativeRatings + disputesReceived,
      manualFlags: 0,
      recentOrders,
      recentSuccessRate: successRate, // Simplified
      recentClaims: 0,
      recentDisputes: disputesReceived,
      calculatedAt: now
    };

    return metrics;
  }

  private calculateComponentScores(metrics: TrustScoreMetrics, config: TrustScoreConfig): TrustScoreComponents {
    // Account Maturity Score (0-100)
    const accountMaturity = Math.min(100, Math.floor(metrics.accountAgeDays / 365 * 100));

    // Transaction History Score (0-100)
    const transactionHistory = Math.min(100, metrics.successRate * 100);

    // Dispute History Score (0-100)
    const disputePenalty = metrics.disputesReceived * 10 + metrics.disputesInitiated * 15;
    const disputeHistory = Math.max(0, 100 - disputePenalty);

    // Behavioral Stability Score (0-100)
    const stabilityPenalty = metrics.negativeEvents * 5;
    const behavioralStability = Math.max(0, 100 - stabilityPenalty);

    // Trust Events Score (0-100)
    const trustEventsBonus = metrics.positiveEvents * 2;
    const trustEventsPenalty = metrics.negativeEvents * 8;
    const trustEvents = Math.min(100, Math.max(0, 50 + trustEventsBonus - trustEventsPenalty));

    // Calculate weighted contributions
    const contributions = {
      accountMaturity: (accountMaturity * config.weights.accountMaturity) / 100,
      transactionHistory: (transactionHistory * config.weights.transactionHistory) / 100,
      disputeHistory: (disputeHistory * config.weights.disputeHistory) / 100,
      behavioralStability: (behavioralStability * config.weights.behavioralStability) / 100,
      trustEvents: (trustEvents * config.weights.trustEvents) / 100
    };

    return {
      accountMaturity,
      transactionHistory,
      disputeHistory,
      behavioralStability,
      trustEvents,
      contributions
    };
  }

  private calculateFinalScore(components: TrustScoreComponents, config: TrustScoreConfig): number {
    const total = Object.values(components.contributions).reduce((sum, contribution) => sum + contribution, 0);
    return Math.max(0, Math.min(100, total)); // Clamp between 0-100
  }

  private determineTrustLevel(score: number, config: TrustScoreConfig): TrustScoreLevel {
    if (score >= config.thresholds.highTrust) return 'EXCELLENT';
    if (score >= config.thresholds.mediumTrust) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    if (score >= 20) return 'LOW';
    return 'CRITICAL';
  }

  private async getScoreHistory(sellerId: number, days: number): Promise<number[]> {
    // In a real implementation, this would query historical score snapshots
    // For now, return mock historical data
    return [75, 78, 82, 80, 85, 83, 88, 90, 92, 95];
  }

  private calculateTrend(history: number[]): TrustScoreTrend {
    if (history.length < 2) return 'STABLE';
    
    const recent = history.slice(-7); // Last 7 scores
    const older = history.slice(-14, -7); // Previous 7 scores
    
    if (recent.length === 0 || older.length === 0) return 'STABLE';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 5) return 'IMPROVING';
    if (difference < -5) return 'DECLINING';
    return 'STABLE';
  }

  private calculateVolatility(history: number[]): number {
    if (history.length < 2) return 0;
    
    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    const variance = history.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / history.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalize volatility to 0-1 scale
    return Math.min(1, stdDev / 20);
  }

  private generateExplanation(
    components: TrustScoreComponents, 
    score: number, 
    level: TrustScoreLevel, 
    trend: TrustScoreTrend
  ): string {
    const explanations: string[] = [];
    
    explanations.push(`Trust Score: ${score}/100 (${level})`);
    explanations.push(`Trend: ${trend}`);
    
    // Add component explanations
    if (components.accountMaturity < 50) {
      explanations.push('Account maturity is below average');
    } else if (components.accountMaturity > 80) {
      explanations.push('Account maturity is excellent');
    }
    
    if (components.transactionHistory < 70) {
      explanations.push('Transaction success rate could be improved');
    }
    
    if (components.disputeHistory < 60) {
      explanations.push('High dispute activity detected');
    }
    
    if (components.behavioralStability < 50) {
      explanations.push('Behavioral stability needs improvement');
    }
    
    return explanations.join('. ') + '.';
  }

  private async storeScoreSnapshot(scoreResult: TrustScoreResult): Promise<void> {
    // In a real implementation, this would store the score snapshot in a database
    // For now, we'll just log it for demonstration
    console.log('Storing trust score snapshot:', {
      sellerId: scoreResult.sellerId,
      score: scoreResult.score,
      level: scoreResult.level,
      calculatedAt: scoreResult.calculatedAt
    });
  }

  async getScoreHistory(sellerId: number): Promise<TrustScoreHistory> {
    // This would query historical score data from the database
    // For now, return mock data
    const snapshots: TrustScoreSnapshot[] = [
      { score: 85, level: 'HIGH', calculatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      { score: 82, level: 'HIGH', calculatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      { score: 78, level: 'MEDIUM', calculatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    ];

    const summary: TrustScoreHistorySummary = {
      currentScore: 85,
      score7dAgo: 82,
      score30dAgo: 78,
      score90dAgo: 75,
      delta7d: 3,
      delta30d: 7,
      delta90d: 10,
      trend: 'IMPROVING',
      volatilityIndex: 0.2,
      totalEvents: 15,
      positiveEvents: 12,
      negativeEvents: 3
    };

    return {
      sellerId,
      snapshots,
      summary
    };
  }

  async healthCheck(): Promise<TrustScoreHealth> {
    // Check database connection
    const dbHealthy = await this.checkDatabaseHealth();
    
    return {
      status: dbHealthy ? 'OPERATIONAL' : 'DEGRADED',
      service: 'trust-score',
      version: '1.0.0',
      lastCalculation: new Date(),
      totalSellersScored: 1000, // Mock data
      averageCalculationTimeMs: 150,
      errorRate: 0.01,
      dependencies: {
        database: dbHealthy,
        eventService: true, // Would check event service health
        metricsService: true // Would check metrics service health
      }
    };
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}