import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fraud Detection Service
 * خدمة كشف الاحتيال - Advanced fraud detection with ML-like scoring
 */

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum FraudSignalType {
  VELOCITY_ANOMALY = 'VELOCITY_ANOMALY',
  AMOUNT_ANOMALY = 'AMOUNT_ANOMALY',
  GEO_ANOMALY = 'GEO_ANOMALY',
  DEVICE_ANOMALY = 'DEVICE_ANOMALY',
  TIME_ANOMALY = 'TIME_ANOMALY',
  ADDRESS_MISMATCH = 'ADDRESS_MISMATCH',
  NEW_DEVICE = 'NEW_DEVICE',
  ACCOUNT_AGE = 'ACCOUNT_AGE',
  REFUND_PATTERN = 'REFUND_PATTERN',
  FAILED_ATTEMPTS = 'FAILED_ATTEMPTS',
  IP_REPUTATION = 'IP_REPUTATION',
  CARD_BIN_RISK = 'CARD_BIN_RISK'
}

export interface FraudSignal {
  type: FraudSignalType;
  severity: number; // 0-1
  description: string;
  descriptionAr: string;
  metadata?: Record<string, any>;
}

export interface TransactionRiskInput {
  userId: string;
  amount: number;
  currency: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'PAYMENT';
  ipAddress?: string;
  deviceId?: string;
  deviceFingerprint?: string;
  location?: {
    country: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  paymentMethod?: {
    type: string;
    cardBin?: string;
    last4?: string;
  };
  shippingAddress?: string;
  billingAddress?: string;
  metadata?: Record<string, any>;
}

export interface FraudAnalysisResult {
  riskScore: number; // 0-1
  riskLevel: RiskLevel;
  signals: FraudSignal[];
  isApproved: boolean;
  requiresReview: boolean;
  recommendation: 'APPROVE' | 'MANUAL_REVIEW' | 'DECLINE' | 'CHALLENGE';
  challengeType?: 'BIOMETRIC' | '2FA' | 'EMAIL_VERIFICATION' | 'PHONE_VERIFICATION';
  declineReason?: string;
  declineReasonAr?: string;
}

export interface UserRiskProfile {
  userId: string;
  baselineRiskScore: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  refundCount: number;
  refundRate: number;
  averageTransactionAmount: number;
  maxTransactionAmount: number;
  knownDevices: string[];
  knownIpAddresses: string[];
  knownCountries: string[];
  lastTransactionAt: Date | null;
  accountCreatedAt: Date;
  isVerified: boolean;
  kycLevel: number;
}

// In-memory cache for risk profiles (use Redis in production)
const riskProfileCache = new Map<string, { profile: UserRiskProfile; cachedAt: Date }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class FraudDetectionService {
  private velocityWindow = 60 * 60 * 1000; // 1 hour
  private maxVelocityCount = 10;
  private suspiciousAmountMultiplier = 5;
  private newAccountDays = 7;

  /**
   * Analyze a transaction for fraud risk
   * تحليل المعاملة لمخاطر الاحتيال
   */
  async analyzeTransaction(input: TransactionRiskInput): Promise<FraudAnalysisResult> {
    const signals: FraudSignal[] = [];
    let totalScore = 0;

    // Get user's risk profile
    const profile = await this.getUserRiskProfile(input.userId);

    // 1. Velocity Check - سرعة المعاملات
    const velocitySignal = await this.checkVelocity(input.userId, input.type);
    if (velocitySignal) {
      signals.push(velocitySignal);
      totalScore += velocitySignal.severity;
    }

    // 2. Amount Anomaly - شذوذ المبلغ
    const amountSignal = this.checkAmountAnomaly(input.amount, profile);
    if (amountSignal) {
      signals.push(amountSignal);
      totalScore += amountSignal.severity;
    }

    // 3. Geographic Anomaly - شذوذ جغرافي
    if (input.location) {
      const geoSignal = this.checkGeoAnomaly(input.location.country, profile);
      if (geoSignal) {
        signals.push(geoSignal);
        totalScore += geoSignal.severity;
      }
    }

    // 4. Device Check - فحص الجهاز
    if (input.deviceId) {
      const deviceSignal = this.checkDeviceAnomaly(input.deviceId, profile);
      if (deviceSignal) {
        signals.push(deviceSignal);
        totalScore += deviceSignal.severity;
      }
    }

    // 5. Time-based Check - فحص الوقت
    const timeSignal = this.checkTimeAnomaly();
    if (timeSignal) {
      signals.push(timeSignal);
      totalScore += timeSignal.severity;
    }

    // 6. Address Mismatch - عدم تطابق العنوان
    if (input.shippingAddress && input.billingAddress) {
      const addressSignal = this.checkAddressMismatch(input.shippingAddress, input.billingAddress);
      if (addressSignal) {
        signals.push(addressSignal);
        totalScore += addressSignal.severity;
      }
    }

    // 7. Account Age Check - عمر الحساب
    const accountAgeSignal = this.checkAccountAge(profile, input.amount);
    if (accountAgeSignal) {
      signals.push(accountAgeSignal);
      totalScore += accountAgeSignal.severity;
    }

    // 8. Refund Pattern Check - نمط الاسترداد
    const refundSignal = this.checkRefundPattern(profile);
    if (refundSignal) {
      signals.push(refundSignal);
      totalScore += refundSignal.severity;
    }

    // 9. IP Reputation (simplified) - سمعة IP
    if (input.ipAddress) {
      const ipSignal = await this.checkIpReputation(input.ipAddress);
      if (ipSignal) {
        signals.push(ipSignal);
        totalScore += ipSignal.severity;
      }
    }

    // Apply KYC level reduction
    if (profile.kycLevel >= 2) {
      totalScore *= 0.8; // 20% reduction for verified users
    }
    if (profile.kycLevel >= 3) {
      totalScore *= 0.7; // Additional reduction for fully verified
    }

    // Normalize score
    const normalizedScore = Math.min(1, totalScore);
    const riskLevel = this.mapScoreToLevel(normalizedScore);

    // Determine action
    const { isApproved, requiresReview, recommendation, challengeType } = 
      this.determineAction(normalizedScore, signals, profile);

    const result: FraudAnalysisResult = {
      riskScore: normalizedScore,
      riskLevel,
      signals,
      isApproved,
      requiresReview,
      recommendation,
      challengeType
    };

    if (!isApproved && recommendation === 'DECLINE') {
      result.declineReason = 'Transaction blocked due to high fraud risk';
      result.declineReasonAr = 'تم حظر المعاملة بسبب مخاطر احتيال عالية';
    }

    // Log for audit
    console.log(`[Fraud] User ${input.userId}: Score ${normalizedScore.toFixed(2)}, Level ${riskLevel}, Action ${recommendation}`);

    return result;
  }

  /**
   * Get or build user risk profile
   */
  private async getUserRiskProfile(userId: string): Promise<UserRiskProfile> {
    // Check cache first
    const cached = riskProfileCache.get(userId);
    if (cached && Date.now() - cached.cachedAt.getTime() < CACHE_TTL_MS) {
      return cached.profile;
    }

    // Build profile from database (mock implementation)
    const profile: UserRiskProfile = {
      userId,
      baselineRiskScore: 0.1,
      totalTransactions: Math.floor(Math.random() * 100),
      successfulTransactions: Math.floor(Math.random() * 95),
      failedTransactions: Math.floor(Math.random() * 5),
      refundCount: Math.floor(Math.random() * 3),
      refundRate: Math.random() * 0.1,
      averageTransactionAmount: 150 + Math.random() * 300,
      maxTransactionAmount: 500 + Math.random() * 1500,
      knownDevices: ['device-1', 'device-2'],
      knownIpAddresses: ['192.168.1.1'],
      knownCountries: ['SA', 'AE', 'EG'],
      lastTransactionAt: new Date(Date.now() - Math.random() * 86400000),
      accountCreatedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      isVerified: true,
      kycLevel: 2
    };

    // Cache the profile
    riskProfileCache.set(userId, { profile, cachedAt: new Date() });

    return profile;
  }

  /**
   * Check transaction velocity
   */
  private async checkVelocity(userId: string, type: string): Promise<FraudSignal | null> {
    // In production, query actual transaction count from database
    const recentCount = Math.floor(Math.random() * 15);

    if (recentCount > this.maxVelocityCount) {
      return {
        type: FraudSignalType.VELOCITY_ANOMALY,
        severity: Math.min(0.8, (recentCount - this.maxVelocityCount) * 0.1),
        description: `High transaction velocity: ${recentCount} transactions in the last hour`,
        descriptionAr: `سرعة معاملات عالية: ${recentCount} معاملة في الساعة الأخيرة`,
        metadata: { count: recentCount, window: 'hour' }
      };
    }

    return null;
  }

  /**
   * Check for amount anomalies
   */
  private checkAmountAnomaly(amount: number, profile: UserRiskProfile): FraudSignal | null {
    if (amount > profile.averageTransactionAmount * this.suspiciousAmountMultiplier) {
      const ratio = amount / profile.averageTransactionAmount;
      return {
        type: FraudSignalType.AMOUNT_ANOMALY,
        severity: Math.min(0.7, ratio * 0.1),
        description: `Transaction amount ${ratio.toFixed(1)}x higher than user's average`,
        descriptionAr: `مبلغ المعاملة أعلى ${ratio.toFixed(1)} مرة من متوسط المستخدم`,
        metadata: { amount, average: profile.averageTransactionAmount, ratio }
      };
    }

    if (amount > profile.maxTransactionAmount * 1.5) {
      return {
        type: FraudSignalType.AMOUNT_ANOMALY,
        severity: 0.5,
        description: 'Transaction exceeds user\'s historical maximum',
        descriptionAr: 'المعاملة تتجاوز الحد الأقصى التاريخي للمستخدم',
        metadata: { amount, max: profile.maxTransactionAmount }
      };
    }

    return null;
  }

  /**
   * Check for geographic anomalies
   */
  private checkGeoAnomaly(country: string, profile: UserRiskProfile): FraudSignal | null {
    if (!profile.knownCountries.includes(country)) {
      return {
        type: FraudSignalType.GEO_ANOMALY,
        severity: 0.4,
        description: `Transaction from new country: ${country}`,
        descriptionAr: `معاملة من بلد جديد: ${country}`,
        metadata: { country, knownCountries: profile.knownCountries }
      };
    }
    return null;
  }

  /**
   * Check for device anomalies
   */
  private checkDeviceAnomaly(deviceId: string, profile: UserRiskProfile): FraudSignal | null {
    if (!profile.knownDevices.includes(deviceId)) {
      return {
        type: FraudSignalType.NEW_DEVICE,
        severity: 0.3,
        description: 'Transaction from unrecognized device',
        descriptionAr: 'معاملة من جهاز غير معروف',
        metadata: { deviceId }
      };
    }
    return null;
  }

  /**
   * Check for suspicious timing
   */
  private checkTimeAnomaly(): FraudSignal | null {
    const hour = new Date().getHours();
    // Flag transactions between 2 AM and 5 AM local time
    if (hour >= 2 && hour <= 5) {
      return {
        type: FraudSignalType.TIME_ANOMALY,
        severity: 0.2,
        description: 'Transaction during unusual hours',
        descriptionAr: 'معاملة في أوقات غير اعتيادية',
        metadata: { hour }
      };
    }
    return null;
  }

  /**
   * Check address mismatch
   */
  private checkAddressMismatch(shipping: string, billing: string): FraudSignal | null {
    const normalizedShipping = shipping.toLowerCase().replace(/\s+/g, '');
    const normalizedBilling = billing.toLowerCase().replace(/\s+/g, '');

    if (normalizedShipping !== normalizedBilling) {
      // Calculate similarity
      const similarity = this.calculateStringSimilarity(normalizedShipping, normalizedBilling);
      
      if (similarity < 0.5) {
        return {
          type: FraudSignalType.ADDRESS_MISMATCH,
          severity: 0.4,
          description: 'Significant mismatch between shipping and billing addresses',
          descriptionAr: 'اختلاف كبير بين عنوان الشحن وعنوان الفواتير',
          metadata: { similarity }
        };
      }
    }
    return null;
  }

  /**
   * Check account age for high-value transactions
   */
  private checkAccountAge(profile: UserRiskProfile, amount: number): FraudSignal | null {
    const accountAgeDays = (Date.now() - profile.accountCreatedAt.getTime()) / (24 * 60 * 60 * 1000);

    if (accountAgeDays < this.newAccountDays && amount > 500) {
      return {
        type: FraudSignalType.ACCOUNT_AGE,
        severity: 0.5,
        description: `High-value transaction from new account (${Math.floor(accountAgeDays)} days old)`,
        descriptionAr: `معاملة عالية القيمة من حساب جديد (${Math.floor(accountAgeDays)} يوم)`,
        metadata: { accountAgeDays, amount }
      };
    }
    return null;
  }

  /**
   * Check refund patterns
   */
  private checkRefundPattern(profile: UserRiskProfile): FraudSignal | null {
    if (profile.refundRate > 0.2) {
      return {
        type: FraudSignalType.REFUND_PATTERN,
        severity: 0.4,
        description: `High refund rate: ${(profile.refundRate * 100).toFixed(1)}%`,
        descriptionAr: `معدل استرداد مرتفع: ${(profile.refundRate * 100).toFixed(1)}%`,
        metadata: { refundRate: profile.refundRate, refundCount: profile.refundCount }
      };
    }
    return null;
  }

  /**
   * Check IP reputation (simplified)
   */
  private async checkIpReputation(ipAddress: string): Promise<FraudSignal | null> {
    // In production, use an IP reputation service like MaxMind, IPQualityScore, etc.
    const knownBadPrefixes = ['185.220', '23.129', '104.36'];
    
    for (const prefix of knownBadPrefixes) {
      if (ipAddress.startsWith(prefix)) {
        return {
          type: FraudSignalType.IP_REPUTATION,
          severity: 0.6,
          description: 'Transaction from suspicious IP address',
          descriptionAr: 'معاملة من عنوان IP مشبوه',
          metadata: { ipAddress }
        };
      }
    }
    return null;
  }

  /**
   * Map risk score to risk level
   */
  private mapScoreToLevel(score: number): RiskLevel {
    if (score < 0.25) return RiskLevel.LOW;
    if (score < 0.5) return RiskLevel.MEDIUM;
    if (score < 0.75) return RiskLevel.HIGH;
    return RiskLevel.CRITICAL;
  }

  /**
   * Determine action based on risk analysis
   */
  private determineAction(
    score: number,
    signals: FraudSignal[],
    profile: UserRiskProfile
  ): {
    isApproved: boolean;
    requiresReview: boolean;
    recommendation: 'APPROVE' | 'MANUAL_REVIEW' | 'DECLINE' | 'CHALLENGE';
    challengeType?: 'BIOMETRIC' | '2FA' | 'EMAIL_VERIFICATION' | 'PHONE_VERIFICATION';
  } {
    // Critical risk - decline
    if (score >= 0.8) {
      return {
        isApproved: false,
        requiresReview: true,
        recommendation: 'DECLINE'
      };
    }

    // High risk - challenge
    if (score >= 0.5) {
      return {
        isApproved: false,
        requiresReview: false,
        recommendation: 'CHALLENGE',
        challengeType: profile.kycLevel >= 2 ? 'BIOMETRIC' : '2FA'
      };
    }

    // Medium risk - manual review for high amounts
    if (score >= 0.3) {
      return {
        isApproved: true,
        requiresReview: true,
        recommendation: 'MANUAL_REVIEW'
      };
    }

    // Low risk - approve
    return {
      isApproved: true,
      requiresReview: false,
      recommendation: 'APPROVE'
    };
  }

  /**
   * Calculate string similarity (Jaccard index)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1.split(''));
    const set2 = new Set(str2.split(''));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * Report a fraudulent transaction (for ML training)
   */
  async reportFraud(transactionId: string, reportedBy: string, reason: string): Promise<void> {
    console.log(`[Fraud] Transaction ${transactionId} reported as fraudulent by ${reportedBy}: ${reason}`);
    // In production, this would update the database and trigger model retraining
  }

  /**
   * Clear risk profile cache for a user
   */
  clearProfileCache(userId: string): void {
    riskProfileCache.delete(userId);
  }
}

// Singleton instance
export const fraudDetectionService = new FraudDetectionService();
