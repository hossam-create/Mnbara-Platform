// Risk Assessment Scoring Service
// خدمة تقييم المخاطر - Comprehensive risk scoring combining all fraud detection signals

import { PrismaClient } from '@prisma/client';
import { deviceFingerprintingService } from './device-fingerprint.service';
import { behavioralAnalysisService } from './behavioral-analysis.service';
import { velocityTrackingService } from './velocity-tracking.service';

const prisma = new PrismaClient();

export interface ComprehensiveRiskInput {
  userId: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  type?: string;
  paymentMethod?: string;
  deviceFingerprint?: {
    userAgent?: string;
    acceptLanguage?: string;
    timezone?: string;
    screenWidth?: number;
    screenHeight?: number;
    colorDepth?: number;
    pixelRatio?: number;
    canvasHash?: string;
    webglVendor?: string;
    webglRenderer?: string;
    platform?: string;
  };
  location?: {
    ipAddress?: string;
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  behavioral?: {
    sessionId?: string;
    pageViews?: number;
    pagesVisited?: string[];
    avgTimePerPage?: number;
    totalSessionDuration?: number;
    mouseMovements?: number;
    mouseSpeed?: number;
    clickCount?: number;
    scrollDepth?: number;
    scrollBehavior?: 'smooth' | 'jumpy' | 'normal';
    touchEvents?: number;
    typingSpeed?: number;
    pasteEvents?: number;
    backspaceRatio?: number;
    hourOfDay?: number;
    dayOfWeek?: number;
    deviceType?: string;
    country?: string;
  };
}

export interface ComprehensiveRiskResult {
  riskScore: number;
  riskLevel: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'CRITICAL';
  riskCategory: string;
  recommendation: 'APPROVE' | 'REVIEW' | 'CHALLENGE' | 'DECLINE';
  requiresReview: boolean;
  requiresChallenge: boolean;
  challengeType?: 'BIOMETRIC' | '2FA' | 'EMAIL_VERIFICATION' | 'PHONE_VERIFICATION' | 'MANUAL_REVIEW';
  componentScores: {
    transactionRisk: number;
    deviceRisk: number;
    behavioralRisk: number;
    velocityRisk: number;
    locationRisk: number;
    historicalRisk: number;
  };
  riskFactors: {
    type: string;
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    description: string;
    score: number;
  }[];
  signals: {
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
  }[];
  recommendations: string[];
  flags: {
    isNewUser: boolean;
    isTrustedUser: boolean;
    isBlacklisted: boolean;
    isWhitelisted: boolean;
    hasOpenCases: boolean;
  };
  analysisId: string;
  analyzedAt: Date;
  processingTime: number;
}

export interface UserRiskProfileSummary {
  userId: string;
  overallRiskScore: number;
  riskLevel: string;
  trustScore: number;
  verificationLevel: string;
  kycLevel: number;
  accountAgeDays: number;
  totalTransactions: number;
  totalSpent: number;
  chargebackCount: number;
  refundCount: number;
  disputeCount: number;
  isBlacklisted: boolean;
  isWhitelisted: boolean;
  isTrustedSeller: boolean;
  isTrustedBuyer: boolean;
  knownDevices: string[];
  knownCountries: string[];
  recentAnomalyCount: number;
  openCaseCount: number;
}

export class RiskAssessmentService {
  private readonly THRESHOLDS = {
    approve: 30,
    challenge: 50,
    review: 40,
    decline: 75,
    critical: 90
  };

  private readonly WEIGHTS = {
    transaction: 0.25,
    device: 0.15,
    behavioral: 0.20,
    velocity: 0.15,
    location: 0.10,
    historical: 0.15
  };

  async assessRisk(input: ComprehensiveRiskInput): Promise<ComprehensiveRiskResult> {
    const startTime = Date.now();
    const analysisId = `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const componentScores = {
      transactionRisk: 0,
      deviceRisk: 0,
      behavioralRisk: 0,
      velocityRisk: 0,
      locationRisk: 0,
      historicalRisk: 0
    };

    const riskFactors: ComprehensiveRiskResult['riskFactors'] = [];
    const signals: ComprehensiveRiskResult['signals'] = [];
    const recommendations: string[] = [];

    // Get user historical risk profile
    const userProfile = await this.getUserRiskProfile(input.userId);
    componentScores.historicalRisk = userProfile?.overallRiskScore || 0;
    
    if (userProfile) {
      if (userProfile.chargebackCount > 0) {
        riskFactors.push({
          type: 'CHARGEBACK_HISTORY',
          impact: 'NEGATIVE',
          description: `User has ${userProfile.chargebackCount} chargebacks`,
          score: Math.min(userProfile.chargebackCount * 15, 50)
        });
      }

      if (userProfile.isBlacklisted) {
        riskFactors.push({
          type: 'BLACKLISTED',
          impact: 'NEGATIVE',
          description: 'User is on blacklist',
          score: 100
        });
        signals.push({
          type: 'BLACKLIST_USER',
          severity: 'CRITICAL',
          description: 'User appears on internal blacklist'
        });
      }

      if (userProfile.isWhitelisted) {
        riskFactors.push({
          type: 'WHITELISTED',
          impact: 'POSITIVE',
          description: 'User is on whitelist',
          score: -30
        });
      }

      if (userProfile.isTrustedSeller || userProfile.isTrustedBuyer) {
        riskFactors.push({
          type: 'TRUSTED_USER',
          impact: 'POSITIVE',
          description: 'Trusted user status',
          score: -20
        });
      }

      if (userProfile.accountAgeDays < 7) {
        riskFactors.push({
          type: 'NEW_ACCOUNT',
          impact: 'NEGATIVE',
          description: 'Account less than 7 days old',
          score: 15
        });
        signals.push({
          type: 'NEW_ACCOUNT',
          severity: 'LOW',
          description: 'New account detected'
        });
      }
    }

    // Check for open cases
    const openCases = await this.getUserOpenCases(input.userId);
    if (openCases.length > 0) {
      componentScores.historicalRisk += 20;
      riskFactors.push({
        type: 'OPEN_CASES',
        impact: 'NEGATIVE',
        description: `User has ${openCases.length} open fraud case(s)`,
        score: openCases.length * 20
      });
      signals.push({
        type: 'OPEN_FRAUD_CASE',
        severity: 'HIGH',
        description: `User has ${openCases.length} open fraud case(s)`
      });
    }

    // Device fingerprinting risk
    if (input.deviceFingerprint) {
      const deviceResult = await deviceFingerprintingService.getOrCreateFingerprint(
        input.deviceFingerprint,
        input.userId
      );
      componentScores.deviceRisk = deviceResult.riskScore;

      if (deviceResult.isSuspicious) {
        riskFactors.push({
          type: 'SUSPICIOUS_DEVICE',
          impact: 'NEGATIVE',
          description: 'Device fingerprint flagged as suspicious',
          score: 30
        });
        signals.push({
          type: 'SUSPICIOUS_DEVICE',
          severity: 'MEDIUM',
          description: deviceResult.riskReasons.join('; ')
        });
      }

      recommendations.push(...deviceResult.recommendations);
    }

    // Behavioral analysis
    if (input.behavioral) {
      const behaviorResult = await behavioralAnalysisService.analyzeBehavior({
        userId: input.userId,
        sessionId: input.behavioral.sessionId || input.transactionId || 'unknown',
        pageViews: input.behavioral.pageViews || 0,
        pagesVisited: input.behavioral.pagesVisited || [],
        avgTimePerPage: input.behavioral.avgTimePerPage || 0,
        totalSessionDuration: input.behavioral.totalSessionDuration || 0,
        mouseMovements: input.behavioral.mouseMovements || 0,
        mouseSpeed: input.behavioral.mouseSpeed || 0,
        clickCount: input.behavioral.clickCount || 0,
        scrollDepth: input.behavioral.scrollDepth || 0,
        scrollBehavior: input.behavioral.scrollBehavior || 'normal',
        touchEvents: input.behavioral.touchEvents || 0,
        typingSpeed: input.behavioral.typingSpeed || 0,
        pasteEvents: input.behavioral.pasteEvents || 0,
        backspaceRatio: input.behavioral.backspaceRatio || 0,
        keystrokeTiming: [],
        cartInteractions: 0,
        wishlistInteractions: 0,
        searchQueries: 0,
        filterUsage: [],
        hourOfDay: input.behavioral.hourOfDay || new Date().getHours(),
        dayOfWeek: input.behavioral.dayOfWeek || new Date().getDay(),
        timezone: input.deviceFingerprint?.timezone || 'UTC',
        deviceType: input.behavioral.deviceType || 'desktop',
        country: input.behavioral.country || input.location?.country || 'Unknown'
      });

      componentScores.behavioralRisk = behaviorResult.anomalyScore;

      for (const anomaly of behaviorResult.anomalies) {
        signals.push({
          type: anomaly.type,
          severity: anomaly.severity > 50 ? 'HIGH' : anomaly.severity > 30 ? 'MEDIUM' : 'LOW',
          description: anomaly.description
        });
      }

      if (!behaviorResult.isHuman) {
        riskFactors.push({
          type: 'NON_HUMAN_BEHAVIOR',
          impact: 'NEGATIVE',
          description: 'Behavioral patterns suggest non-human activity',
          score: 50
        });
        signals.push({
          type: 'BOT_ACTIVITY',
          severity: 'CRITICAL',
          description: 'Bot-like behavior detected'
        });
      }

      recommendations.push(...behaviorResult.recommendations);
    }

    // Velocity check
    if (input.type) {
      const velocityResult = await velocityTrackingService.checkVelocity({
        userId: input.userId,
        entityType: 'TRANSACTION',
        amount: input.amount
      });

      if (velocityResult.violations.length > 0) {
        componentScores.velocityRisk = 50 + velocityResult.violations.length * 10;
        riskFactors.push({
          type: 'VELOCITY_VIOLATION',
          impact: 'NEGATIVE',
          description: `Velocity limits exceeded: ${velocityResult.violations.length} violations`,
          score: velocityResult.violations.length * 20
        });

        for (const violation of velocityResult.violations) {
          signals.push({
            type: 'VELOCITY_VIOLATION',
            severity: violation.severity === 'CRITICAL' ? 'CRITICAL' : violation.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
            description: violation.ruleName
          });
        }

        if (velocityResult.recommendedAction === 'BLOCK') {
          recommendations.push('Transaction blocked due to velocity limits');
        }
      }
    }

    // Location risk
    if (input.location && userProfile) {
      const isNewCountry = !userProfile.knownCountries.includes(input.location.country || 'Unknown');
      componentScores.locationRisk = isNewCountry ? 30 : 10;

      if (isNewCountry) {
        riskFactors.push({
          type: 'NEW_COUNTRY',
          impact: 'NEUTRAL',
          description: `First transaction from ${input.location.country}`,
          score: 15
        });
        signals.push({
          type: 'NEW_LOCATION',
          severity: 'LOW',
          description: `Activity from new country: ${input.location.country}`
        });
      }
    }

    // Transaction risk
    if (input.amount && userProfile) {
      const transactionRisk = this.assessTransactionRisk(input.amount, userProfile);
      componentScores.transactionRisk = transactionRisk;

      if (transactionRisk > 50) {
        riskFactors.push({
          type: 'HIGH_VALUE_TRANSACTION',
          impact: 'NEGATIVE',
          description: `Transaction amount significantly above user's average`,
          score: transactionRisk / 2
        });
        signals.push({
          type: 'HIGH_VALUE',
          severity: transactionRisk > 70 ? 'HIGH' : 'MEDIUM',
          description: `High transaction amount: ${input.amount}`
        });
      }
    }

    // Calculate weighted overall score
    let overallScore = 
      componentScores.transactionRisk * this.WEIGHTS.transaction +
      componentScores.deviceRisk * this.WEIGHTS.device +
      componentScores.behavioralRisk * this.WEIGHTS.behavioral +
      componentScores.velocityRisk * this.WEIGHTS.velocity +
      componentScores.locationRisk * this.WEIGHTS.location +
      componentScores.historicalRisk * this.WEIGHTS.historical;

    // Apply KYC reduction
    if (userProfile && userProfile.kycLevel >= 2) {
      overallScore *= 0.85;
    }
    if (userProfile && userProfile.kycLevel >= 3) {
      overallScore *= 0.8;
    }

    overallScore = Math.min(100, Math.max(0, overallScore));

    const riskLevel = this.determineRiskLevel(overallScore);
    const { recommendation, requiresReview, requiresChallenge, challengeType } = 
      this.determineRecommendation(overallScore, signals, userProfile);

    const finalRecommendations = this.generateRecommendations(overallScore, signals);

    const flags = {
      isNewUser: userProfile ? userProfile.accountAgeDays < 7 : true,
      isTrustedUser: userProfile ? (userProfile.isTrustedSeller || userProfile.isTrustedBuyer) : false,
      isBlacklisted: userProfile?.isBlacklisted || false,
      isWhitelisted: userProfile?.isWhitelisted || false,
      hasOpenCases: openCases.length > 0
    };

    const processingTime = Date.now() - startTime;

    return {
      riskScore: Math.round(overallScore),
      riskLevel,
      riskCategory: this.categorizeRisk(overallScore, flags),
      recommendation,
      requiresReview,
      requiresChallenge,
      challengeType,
      componentScores: {
        transactionRisk: Math.round(componentScores.transactionRisk),
        deviceRisk: Math.round(componentScores.deviceRisk),
        behavioralRisk: Math.round(componentScores.behavioralRisk),
        velocityRisk: Math.round(componentScores.velocityRisk),
        locationRisk: Math.round(componentScores.locationRisk),
        historicalRisk: Math.round(componentScores.historicalRisk)
      },
      riskFactors,
      signals,
      recommendations: finalRecommendations,
      flags,
      analysisId,
      analyzedAt: new Date(),
      processingTime
    };
  }

  private async getUserRiskProfile(userId: string): Promise<UserRiskProfileSummary | null> {
    try {
      const profile = await (prisma as any).userRiskProfile?.findUnique({
        where: { userId }
      });

      if (!profile) {
        return {
          userId,
          overallRiskScore: 50,
          riskLevel: 'MEDIUM',
          trustScore: 50,
          verificationLevel: 'NONE',
          kycLevel: 0,
          accountAgeDays: 0,
          totalTransactions: 0,
          totalSpent: 0,
          chargebackCount: 0,
          refundCount: 0,
          disputeCount: 0,
          isBlacklisted: false,
          isWhitelisted: false,
          isTrustedSeller: false,
          isTrustedBuyer: false,
          knownDevices: [],
          knownCountries: [],
          recentAnomalyCount: 0,
          openCaseCount: 0
        };
      }

      return {
        userId: profile.userId,
        overallRiskScore: profile.overallRiskScore || 50,
        riskLevel: this.determineRiskLevel(profile.overallRiskScore || 50).toString(),
        trustScore: profile.trustScore || 50,
        verificationLevel: profile.verificationLevel || 'NONE',
        kycLevel: profile.kycLevel || 0,
        accountAgeDays: profile.accountAgeDays || 0,
        totalTransactions: profile.totalOrders || 0,
        totalSpent: profile.totalSpent || 0,
        chargebackCount: profile.chargebackCount || 0,
        refundCount: profile.refundCount || 0,
        disputeCount: profile.disputeCount || 0,
        isBlacklisted: profile.isBlacklisted || false,
        isWhitelisted: profile.isWhitelisted || false,
        isTrustedSeller: profile.isTrustedSeller || false,
        isTrustedBuyer: profile.isTrustedBuyer || false,
        knownDevices: profile.knownDevices || [],
        knownCountries: profile.knownLocations || [],
        recentAnomalyCount: 0,
        openCaseCount: 0
      };
    } catch {
      return null;
    }
  }

  private async getUserOpenCases(userId: string): Promise<any[]> {
    try {
      const cases = await (prisma as any).fraudCase?.findMany({
        where: {
          userId,
          status: { notIn: ['RESOLVED', 'CLOSED'] }
        }
      });
      return cases || [];
    } catch {
      return [];
    }
  }

  private assessTransactionRisk(amount: number, profile: UserRiskProfileSummary): number {
    if (profile.totalTransactions < 5) {
      if (amount > 100) return 40;
      if (amount > 500) return 60;
      return 30;
    }

    const avgAmount = profile.totalSpent / profile.totalTransactions;
    const amountRatio = amount / avgAmount;

    if (amountRatio > 5) return 80;
    if (amountRatio > 3) return 60;
    if (amountRatio > 2) return 40;
    if (amountRatio > 1.5) return 25;

    return 15;
  }

  private determineRiskLevel(score: number): 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'CRITICAL' {
    if (score < 15) return 'VERY_LOW';
    if (score < 30) return 'LOW';
    if (score < 50) return 'MEDIUM';
    if (score < 70) return 'HIGH';
    if (score < 85) return 'VERY_HIGH';
    return 'CRITICAL';
  }

  private determineRecommendation(
    score: number,
    signals: any[],
    profile: UserRiskProfileSummary | null
  ): {
    recommendation: 'APPROVE' | 'REVIEW' | 'CHALLENGE' | 'DECLINE';
    requiresReview: boolean;
    requiresChallenge: boolean;
    challengeType?: 'BIOMETRIC' | '2FA' | 'EMAIL_VERIFICATION' | 'PHONE_VERIFICATION' | 'MANUAL_REVIEW';
  } {
    const hasCriticalSignal = signals.some(s => s.severity === 'CRITICAL');
    const hasHighSignal = signals.some(s => s.severity === 'HIGH');
    const isBlacklisted = profile?.isBlacklisted;

    if (isBlacklisted || (hasCriticalSignal && score > this.THRESHOLDS.decline)) {
      return { recommendation: 'DECLINE', requiresReview: true, requiresChallenge: false };
    }

    if (score > this.THRESHOLDS.decline) {
      return { recommendation: 'DECLINE', requiresReview: true, requiresChallenge: false };
    }

    if (hasCriticalSignal || (hasHighSignal && score > this.THRESHOLDS.challenge)) {
      return { recommendation: 'CHALLENGE', requiresReview: false, requiresChallenge: true, challengeType: 'MANUAL_REVIEW' };
    }

    if (score > this.THRESHOLDS.challenge) {
      return { 
        recommendation: 'CHALLENGE', 
        requiresReview: false, 
        requiresChallenge: true, 
        challengeType: profile?.verificationLevel === 'FULL' ? 'BIOMETRIC' : '2FA'
      };
    }

    if (score > this.THRESHOLDS.review) {
      return { recommendation: 'REVIEW', requiresReview: true, requiresChallenge: false };
    }

    return { recommendation: 'APPROVE', requiresReview: false, requiresChallenge: false };
  }

  private categorizeRisk(score: number, flags: any): string {
    if (flags.isBlacklisted) return 'BLACKLISTED';
    if (flags.hasOpenCases) return 'UNDER_INVESTIGATION';
    if (score < 15) return 'TRUSTED';
    if (score < 30) return 'LOW_RISK';
    if (score < 50) return 'MEDIUM_RISK';
    if (score < 70) return 'ELEVATED_RISK';
    if (score < 85) return 'HIGH_RISK';
    return 'CRITICAL_RISK';
  }

  private generateRecommendations(score: number, signals: any[]): string[] {
    const recommendations: string[] = [];

    if (score > this.THRESHOLDS.decline) {
      recommendations.push('Decline transaction');
      recommendations.push('Flag for fraud team review');
    } else if (score > this.THRESHOLDS.challenge) {
      recommendations.push('Require additional verification');
      recommendations.push('Send confirmation to registered contact');
    } else if (score > this.THRESHOLDS.review) {
      recommendations.push('Add to review queue');
      recommendations.push('Monitor closely');
    }

    if (signals.some(s => s.type === 'BOT_ACTIVITY')) {
      recommendations.push('Implement CAPTCHA verification');
    }

    if (signals.some(s => s.type === 'NEW_LOCATION')) {
      recommendations.push('Send location verification email');
    }

    return recommendations;
  }

  async getUserRiskSummary(userId: string): Promise<UserRiskProfileSummary> {
    return this.getUserRiskProfile(userId) as Promise<UserRiskProfileSummary>;
  }
}

export const riskAssessmentService = new RiskAssessmentService();
