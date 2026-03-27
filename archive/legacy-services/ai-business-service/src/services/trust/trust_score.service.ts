import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Trust Score Configuration
interface TrustScoreConfig {
  severityWeights: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  appealImpactWeights: {
    ACCEPTED: number;
    REJECTED: number;
    UNDER_REVIEW: number;
  };
  timeDecayConfig: {
    halfLife: number; // days
    decayRate: number;
    maxAge: number; // days
  };
  scoreRanges: {
    excellent: { min: number; max: number };
    good: { min: number; max: number };
    fair: { min: number; max: number };
    poor: { min: number; max: number };
    critical: { min: number; max: number };
  };
}

// Default configuration
const DEFAULT_CONFIG: TrustScoreConfig = {
  severityWeights: {
    CRITICAL: 40,
    HIGH: 25,
    MEDIUM: 15,
    LOW: 5
  },
  appealImpactWeights: {
    ACCEPTED: -10, // Positive impact - user successfully appealed
    REJECTED: 5,    // Negative impact - appeal rejected
    UNDER_REVIEW: 0  // Neutral impact - appeal pending
  },
  timeDecayConfig: {
    halfLife: 90,    // 90 days half-life
    decayRate: 0.0076, // ln(0.5) / 90 days
    maxAge: 365     // Maximum age considered (1 year)
  },
  scoreRanges: {
    excellent: { min: 80, max: 100 },
    good: { min: 60, max: 79 },
    fair: { min: 40, max: 59 },
    poor: { min: 20, max: 39 },
    critical: { min: 0, max: 19 }
  }
};

// Input validation schemas
const TrustScoreInputSchema = z.object({
  subject_id: z.string().uuid(),
  subject_type: z.enum(['USER', 'TRAVELER', 'SELLER', 'AUCTION']),
  trust_cases: z.array(z.object({
    case_id: z.string().uuid(),
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED']),
    created_at: z.date(),
    resolved_at: z.date().nullable(),
    appeals: z.array(z.object({
      appeal_id: z.string().uuid(),
      status: z.enum(['OPEN', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED']),
      reviewed_at: z.date().nullable(),
      reviewed_by: z.string().uuid().nullable()
    })).optional()
  })),
  calculation_date: z.date().default(new Date())
});

export type TrustScoreInput = z.infer<typeof TrustScoreInputSchema>;

// Trust Score Result
export interface TrustScoreResult {
  subject_id: string;
  subject_type: string;
  trust_score: number;
  score_category: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  score_breakdown: {
    base_score: number;
    severity_penalty: number;
    appeal_adjustment: number;
    time_decay_factor: number;
    final_score: number;
  };
  calculation_details: {
    total_cases: number;
    open_cases: number;
    resolved_cases: number;
    dismissed_cases: number;
    appeals_count: number;
    accepted_appeals: number;
    rejected_appeals: number;
    oldest_case_age_days: number;
    newest_case_age_days: number;
    calculation_date: Date;
    config_used: TrustScoreConfig;
  };
  metadata: {
    read_only: boolean;
    non_binding: boolean;
    not_used_in_payments: boolean;
    last_updated: Date;
  };
}

export class TrustScoreCalculator {
  private config: TrustScoreConfig;

  constructor(config?: Partial<TrustScoreConfig>) {
    this.config = {
      severityWeights: { ...DEFAULT_CONFIG.severityWeights, ...config?.severityWeights },
      appealImpactWeights: { ...DEFAULT_CONFIG.appealImpactWeights, ...config?.appealImpactWeights },
      timeDecayConfig: { ...DEFAULT_CONFIG.timeDecayConfig, ...config?.timeDecayConfig },
      scoreRanges: { ...DEFAULT_CONFIG.scoreRanges, ...config?.scoreRanges }
    };
  }

  /**
   * Calculate trust score for a subject
   * Score is READ ONLY - does not trigger any actions
   * Score is NOT used in payments - purely informational
   */
  async calculateTrustScore(input: TrustScoreInput): Promise<TrustScoreResult> {
    console.log(`📊 Calculating trust score for subject ${input.subject_id} (${input.subject_type})`);

    // Validate input
    const validatedInput = TrustScoreInputSchema.parse(input);

    // Calculate base score from trust cases
    const baseScore = this.calculateBaseScore(validatedInput.trust_cases);

    // Calculate severity penalty
    const severityPenalty = this.calculateSeverityPenalty(validatedInput.trust_cases);

    // Calculate appeal adjustment
    const appealAdjustment = this.calculateAppealAdjustment(validatedInput.trust_cases);

    // Calculate time decay factor
    const timeDecayFactor = this.calculateTimeDecayFactor(validatedInput.trust_cases, validatedInput.calculation_date);

    // Calculate final score
    const finalScore = Math.max(0, Math.min(100, baseScore - severityPenalty + appealAdjustment) * timeDecayFactor);

    // Determine score category
    const scoreCategory = this.getScoreCategory(finalScore);

    // Calculate statistics
    const stats = this.calculateStatistics(validatedInput.trust_cases);

    const result: TrustScoreResult = {
      subject_id: validatedInput.subject_id,
      subject_type: validatedInput.subject_type,
      trust_score: Math.round(finalScore * 100) / 100, // Round to 2 decimal places
      score_category: scoreCategory,
      score_breakdown: {
        base_score: baseScore,
        severity_penalty: severityPenalty,
        appeal_adjustment: appealAdjustment,
        time_decay_factor: timeDecayFactor,
        final_score: finalScore
      },
      calculation_details: {
        ...stats,
        calculation_date: validatedInput.calculation_date,
        config_used: this.config
      },
      metadata: {
        read_only: true,
        non_binding: true,
        not_used_in_payments: true,
        last_updated: new Date()
      }
    };

    console.log(`✅ Trust score calculated: ${result.trust_score} (${result.score_category})`);
    return result;
  }

  /**
   * Calculate base score from trust cases
   * Starts with 100 points, deducts for cases
   */
  private calculateBaseScore(trustCases: any[]): number {
    let baseScore = 100;

    for (const trustCase of trustCases) {
      // Deduct points based on case status
      switch (trustCase.status) {
        case 'OPEN':
          baseScore -= 15; // Active cases hurt score more
          break;
        case 'UNDER_REVIEW':
          baseScore -= 10; // Cases under review hurt score
          break;
        case 'RESOLVED':
          baseScore -= 5;  // Resolved cases hurt score less
          break;
        case 'DISMISSED':
          baseScore -= 3;  // Dismissed cases hurt score least
          break;
      }
    }

    return Math.max(0, baseScore);
  }

  /**
   * Calculate severity penalty
   * Higher severity cases have bigger impact
   */
  private calculateSeverityPenalty(trustCases: any[]): number {
    let severityPenalty = 0;

    for (const trustCase of trustCases) {
      const weight = this.config.severityWeights[trustCase.severity] || 0;
      severityPenalty += weight;
    }

    return severityPenalty;
  }

  /**
   * Calculate appeal adjustment
   * Successful appeals improve score, rejected appeals hurt score
   */
  private calculateAppealAdjustment(trustCases: any[]): number {
    let appealAdjustment = 0;

    for (const trustCase of trustCases) {
      if (!trustCase.appeals) continue;

      for (const appeal of trustCase.appeals) {
        const weight = this.config.appealImpactWeights[appeal.status] || 0;
        appealAdjustment += weight;
      }
    }

    return appealAdjustment;
  }

  /**
   * Calculate time decay factor
   * Older cases have less impact on score
   */
  private calculateTimeDecayFactor(trustCases: any[], calculationDate: Date): number {
    if (trustCases.length === 0) return 1.0;

    // Find the most recent case
    const mostRecentCase = trustCases.reduce((newest, current) => {
      const newestDate = new Date(newest.created_at);
      const currentDate = new Date(current.created_at);
      return currentDate > newestDate ? current : newest;
    });

    const daysSinceMostRecent = this.calculateDaysBetween(mostRecentCase.created_at, calculationDate);
    
    // Apply exponential decay
    const decayFactor = Math.exp(-this.config.timeDecayConfig.decayRate * Math.min(daysSinceMostRecent, this.config.timeDecayConfig.maxAge));
    
    return Math.max(0.1, decayFactor); // Minimum 10% impact
  }

  /**
   * Determine score category based on score value
   */
  private getScoreCategory(score: number): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' {
    if (score >= this.config.scoreRanges.excellent.min && score <= this.config.scoreRanges.excellent.max) {
      return 'EXCELLENT';
    } else if (score >= this.config.scoreRanges.good.min && score <= this.config.scoreRanges.good.max) {
      return 'GOOD';
    } else if (score >= this.config.scoreRanges.fair.min && score <= this.config.scoreRanges.fair.max) {
      return 'FAIR';
    } else if (score >= this.config.scoreRanges.poor.min && score <= this.config.scoreRanges.poor.max) {
      return 'POOR';
    } else {
      return 'CRITICAL';
    }
  }

  /**
   * Calculate statistics for the trust cases
   */
  private calculateStatistics(trustCases: any[]): any {
    const totalCases = trustCases.length;
    const openCases = trustCases.filter(tc => tc.status === 'OPEN').length;
    const underReviewCases = trustCases.filter(tc => tc.status === 'UNDER_REVIEW').length;
    const resolvedCases = trustCases.filter(tc => tc.status === 'RESOLVED').length;
    const dismissedCases = trustCases.filter(tc => tc.status === 'DISMISSED').length;

    // Count appeals
    let totalAppeals = 0;
    let acceptedAppeals = 0;
    let rejectedAppeals = 0;

    for (const trustCase of trustCases) {
      if (!trustCase.appeals) continue;
      
      for (const appeal of trustCase.appeals) {
        totalAppeals++;
        if (appeal.status === 'ACCEPTED') acceptedAppeals++;
        if (appeal.status === 'REJECTED') rejectedAppeals++;
      }
    }

    // Calculate age statistics
    const now = new Date();
    const caseAges = trustCases.map(tc => this.calculateDaysBetween(tc.created_at, now));
    const oldestCaseAgeDays = Math.max(...caseAges);
    const newestCaseAgeDays = Math.min(...caseAges);

    return {
      total_cases: totalCases,
      open_cases: openCases,
      under_review_cases: underReviewCases,
      resolved_cases: resolvedCases,
      dismissed_cases: dismissedCases,
      appeals_count: totalAppeals,
      accepted_appeals,
      rejected_appeals,
      oldest_case_age_days: oldestCaseAgeDays,
      newest_case_age_days: newestCaseAgeDays
    };
  }

  /**
   * Calculate days between two dates
   */
  private calculateDaysBetween(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get trust score for a subject from database
   */
  async getSubjectTrustScore(subjectId: string, subjectType: string): Promise<TrustScoreResult | null> {
    try {
      // Get trust cases for the subject
      const trustCases = await prisma.trustCase.findMany({
        where: {
          subject_id: subjectId,
          subject_type: subjectType
        },
        include: {
          appeals: {
            select: {
              appeal_id: true,
              status: true,
              reviewed_at: true,
              reviewed_by: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: 100 // Limit to last 100 cases
      });

      if (trustCases.length === 0) {
        return null;
      }

      // Calculate score
      const input: TrustScoreInput = {
        subject_id: subjectId,
        subject_type: subjectType as any,
        trust_cases: trustCases.map(tc => ({
          case_id: tc.case_id,
          severity: tc.severity,
          status: tc.status,
          created_at: tc.created_at,
          resolved_at: tc.resolved_at,
          appeals: tc.appeals || []
        })),
        calculation_date: new Date()
      };

      return await this.calculateTrustScore(input);

    } catch (error) {
      console.error('Error calculating trust score:', error);
      throw error;
    }
  }

  /**
   * Get trust scores for multiple subjects
   */
  async getBatchTrustScores(subjects: Array<{ subject_id: string; subject_type: string }>): Promise<TrustScoreResult[]> {
    const results: TrustScoreResult[] = [];

    for (const subject of subjects) {
      try {
        const score = await this.getSubjectTrustScore(subject.subject_id, subject.subject_type);
        if (score) {
          results.push(score);
        }
      } catch (error) {
        console.error(`Error calculating score for subject ${subject.subject_id}:`, error);
        // Continue with other subjects
      }
    }

    return results;
  }

  /**
   * Get trust score statistics for a population
   */
  async getTrustScoreStatistics(
    subjectType?: string,
    filters?: {
      score_range?: string;
      date_range?: { start: Date; end: Date };
    }
  ): Promise<any> {
    try {
      // This would typically query a materialized view or cache
      // For now, return mock statistics
      return {
        total_subjects: 1000,
        average_score: 65.5,
        score_distribution: {
          EXCELLENT: 150,
          GOOD: 300,
          FAIR: 350,
          POOR: 150,
          CRITICAL: 50
        },
        subject_type_distribution: {
          USER: 600,
          TRAVELER: 200,
          SELLER: 150,
          AUCTION: 50
        },
        last_updated: new Date(),
        metadata: {
          read_only: true,
          non_binding: true,
          not_used_in_payments: true
        }
      };
    } catch (error) {
      console.error('Error getting trust score statistics:', error);
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): TrustScoreConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<TrustScoreConfig>): void {
    this.config = {
      severityWeights: { ...this.config.severityWeights, ...newConfig.severityWeights },
      appealImpactWeights: { ...this.config.appealImpactWeights, ...newConfig.appealImpactWeights },
      timeDecayConfig: { ...this.config.timeDecayConfig, ...newConfig.timeDecayConfig },
      scoreRanges: { ...this.config.scoreRanges, ...newConfig.scoreRanges }
    };
  }
}

// Export default calculator instance
export const trustScoreCalculator = new TrustScoreCalculator();

// Export utility functions
export const TrustScoreUtils = {
  /**
   * Validate trust score input
   */
  validateInput(input: any): TrustScoreInput {
    return TrustScoreInputSchema.parse(input);
  },

  /**
   * Get score category description
   */
  getScoreCategoryDescription(category: string): string {
    const descriptions = {
      EXCELLENT: 'Excellent trust score - subject has outstanding trust record',
      GOOD: 'Good trust score - subject has strong trust record',
      FAIR: 'Fair trust score - subject has moderate trust record',
      POOR: 'Poor trust score - subject has concerning trust record',
      CRITICAL: 'Critical trust score - subject has serious trust issues'
    };
    return descriptions[category as keyof typeof descriptions] || 'Unknown score category';
  },

  /**
   * Get score impact explanation
   */
  getScoreImpactExplanation(scoreBreakdown: any): string {
    const { base_score, severity_penalty, appeal_adjustment, time_decay_factor } = scoreBreakdown;
    
    return `
      Base Score: ${base_score}
      Severity Penalty: -${severity_penalty}
      Appeal Adjustment: ${appeal_adjustment > 0 ? '+' : ''}${appeal_adjustment}
      Time Decay Factor: ${time_decay_factor.toFixed(3)}
      
      Explanation:
      - Base score starts at 100
      - Points deducted for active/pending cases
      - Higher severity cases have bigger impact
      - Successful appeals can improve score
      - Older cases have less impact due to time decay
    `.trim();
  }
};
