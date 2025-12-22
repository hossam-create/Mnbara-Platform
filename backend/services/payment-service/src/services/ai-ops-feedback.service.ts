// AI-OPS-005: Human Feedback Loop & Continuous Improvement Service

import { PrismaClient } from '@prisma/client';
import { 
  HumanFeedback, 
  AlignmentMetrics, 
  ImprovementSignal, 
  FeedbackTimeline,
  FeedbackSubmissionRequest,
  AlignmentAnalysisRequest,
  FeedbackMetricsRequest,
  ImprovementSignalsRequest,
  FeedbackTimelineRequest
} from '../types/ai-ops-feedback.types';

const prisma = new PrismaClient();

export class AIOpsFeedbackService {
  
  /**
   * Capture human feedback for AI decisions
   */
  async captureFeedback(request: FeedbackSubmissionRequest): Promise<HumanFeedback> {
    try {
      // Validate the decision exists and get context
      const decision = await prisma.aiDecision.findUnique({
        where: { id: request.decisionId },
        include: {
          seller: true,
          riskAssessment: true
        }
      });

      if (!decision) {
        throw new Error(`Decision not found: ${request.decisionId}`);
      }

      // Create feedback record with full audit trail
      const feedback = await prisma.humanFeedback.create({
        data: {
          decisionId: request.decisionId,
          sellerId: decision.sellerId,
          actorId: request.actorId,
          actorRole: request.actorRole,
          processingTimeMs: 0, // Will be calculated based on timestamps
          overrideAction: request.overrideAction,
          overrideReason: request.overrideReason,
          confidenceAgreement: request.confidenceAgreement,
          comments: request.comments,
          evidenceReferences: request.evidenceReferences,
          auditTrail: {
            create: [
              {
                timestamp: new Date(),
                action: 'FEEDBACK_CREATED',
                actorId: request.actorId,
                details: { request }
              }
            ]
          }
        },
        include: {
          auditTrail: true
        }
      });

      // Calculate processing time if decision has timestamps
      if (decision.createdAt && decision.reviewedAt) {
        const processingTimeMs = new Date().getTime() - decision.reviewedAt.getTime();
        await prisma.humanFeedback.update({
          where: { id: feedback.id },
          data: { processingTimeMs }
        });
      }

      return this.mapToHumanFeedback(feedback);

    } catch (error) {
      throw new Error(`Failed to capture feedback: ${error.message}`);
    }
  }

  /**
   * Analyze AI vs Human alignment metrics
   */
  async analyzeAlignment(request: AlignmentAnalysisRequest): Promise<AlignmentMetrics> {
    try {
      const period = this.parsePeriod(request.period || '30d');
      
      // Get all feedback and decisions in the period
      const [feedbacks, decisions] = await Promise.all([
        prisma.humanFeedback.findMany({
          where: {
            createdAt: {
              gte: period.start,
              lte: period.end
            }
          },
          include: {
            decision: {
              include: {
                seller: true,
                riskAssessment: true
              }
            }
          }
        }),
        prisma.aiDecision.findMany({
          where: {
            createdAt: {
              gte: period.start,
              lte: period.end
            }
          },
          include: {
            seller: true,
            riskAssessment: true
          }
        })
      ]);

      // Calculate base metrics
      const totalDecisions = decisions.length;
      const totalFeedbacks = feedbacks.length;
      const agreementRate = this.calculateAgreementRate(feedbacks);
      const overrideFrequency = totalFeedbacks / totalDecisions;

      // Calculate detailed metrics
      const metrics: AlignmentMetrics = {
        period,
        agreementRate,
        overrideFrequency,
        averageProcessingTimeMs: this.calculateAverageProcessingTime(feedbacks),
        escalationMismatches: this.countEscalationMismatches(feedbacks),
        recommendationRejections: this.countRecommendationRejections(feedbacks),
        confidenceMisalignments: this.countConfidenceMisalignments(feedbacks),
        byRiskBand: this.analyzeByRiskBand(feedbacks, decisions),
        byRule: this.analyzeByRule(feedbacks, decisions),
        byRecommendationType: this.analyzeByRecommendationType(feedbacks, decisions),
        bySellerSegment: this.analyzeBySellerSegment(feedbacks, decisions),
        byTimeWindow: this.analyzeByTimeWindow(feedbacks, period),
        totalDecisions,
        totalFeedbacks,
        overallAlignmentScore: this.calculateOverallAlignmentScore(agreementRate, overrideFrequency)
      };

      return metrics;

    } catch (error) {
      throw new Error(`Failed to analyze alignment: ${error.message}`);
    }
  }

  /**
   * Generate improvement signals from feedback data
   */
  async generateImprovementSignals(request: ImprovementSignalsRequest): Promise<ImprovementSignal[]> {
    try {
      const period = this.parsePeriod('30d'); // Always analyze last 30 days
      
      const feedbacks = await prisma.humanFeedback.findMany({
        where: {
          createdAt: {
            gte: period.start,
            lte: period.end
          }
        },
        include: {
          decision: {
            include: {
              riskAssessment: true,
              triggeredRules: true
            }
          }
        }
      });

      const signals: ImprovementSignal[] = [];

      // 1. Frequently overridden rules
      signals.push(...this.identifyOverriddenRules(feedbacks));
      
      // 2. False negative clusters
      signals.push(...this.identifyFalseNegativeClusters(feedbacks));
      
      // 3. Over-conservative paths
      signals.push(...this.identifyOverConservativePaths(feedbacks));
      
      // 4. Confidence calibration issues
      signals.push(...this.identifyConfidenceCalibrationIssues(feedbacks));

      // Filter by confidence and limit
      const filteredSignals = signals
        .filter(signal => signal.confidence >= (request.minConfidence || 0.7))
        .sort((a, b) => b.impactScore - a.impactScore || b.confidence - a.confidence)
        .slice(0, request.limit || 20);

      // Add ranking positions
      return filteredSignals.map((signal, index) => ({
        ...signal,
        rankedPosition: index + 1
      }));

    } catch (error) {
      throw new Error(`Failed to generate improvement signals: ${error.message}`);
    }
  }

  /**
   * Get feedback timeline for a specific seller
   */
  async getFeedbackTimeline(request: FeedbackTimelineRequest): Promise<FeedbackTimeline> {
    try {
      const period = request.period ? this.parsePeriod(request.period) : undefined;
      
      const [feedbacks, decisions] = await Promise.all([
        prisma.humanFeedback.findMany({
          where: {
            sellerId: request.sellerId,
            ...(period && {
              createdAt: {
                gte: period.start,
                lte: period.end
              }
            })
          },
          include: {
            decision: {
              include: {
                riskAssessment: true,
                triggeredRules: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: request.limit || 100,
          skip: request.offset || 0
        }),
        prisma.aiDecision.findMany({
          where: {
            sellerId: request.sellerId,
            ...(period && {
              createdAt: {
                gte: period.start,
                lte: period.end
              }
            })
          },
          include: {
            riskAssessment: true,
            triggeredRules: true,
            outcomes: true
          },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      // Create timeline entries
      const timelineEntries = decisions.map(decision => {
        const feedback = feedbacks.find(f => f.decisionId === decision.id);
        const outcome = decision.outcomes?.[0];

        return {
          timestamp: decision.createdAt,
          decisionId: decision.id,
          aiDecision: {
            escalationLevel: decision.escalationLevel,
            decisionScore: decision.decisionScore,
            confidence: decision.confidence,
            recommendations: decision.recommendations
          },
          humanAction: feedback ? {
            actorId: feedback.actorId,
            action: feedback.overrideAction,
            processingTimeMs: feedback.processingTimeMs,
            overrideReason: feedback.overrideReason
          } : undefined,
          outcome: outcome ? {
            type: outcome.type,
            timestamp: outcome.createdAt,
            success: outcome.success
          } : undefined,
          alignment: feedback ? 
            (feedback.confidenceAgreement.includes('AGREE') ? 'AGREEMENT' : 'DISAGREEMENT') : 
            'NO_FEEDBACK'
        };
      });

      // Calculate summary
      const summary = this.calculateTimelineSummary(timelineEntries, feedbacks);

      return {
        sellerId: request.sellerId,
        timeline: timelineEntries,
        summary
      };

    } catch (error) {
      throw new Error(`Failed to get feedback timeline: ${error.message}`);
    }
  }

  // Helper methods for alignment analysis
  private calculateAgreementRate(feedbacks: any[]): number {
    const agreeingFeedbacks = feedbacks.filter(f => 
      f.confidenceAgreement.includes('AGREE')
    ).length;
    return feedbacks.length > 0 ? agreeingFeedbacks / feedbacks.length : 0;
  }

  private calculateAverageProcessingTime(feedbacks: any[]): number {
    const validTimes = feedbacks.filter(f => f.processingTimeMs > 0).map(f => f.processingTimeMs);
    return validTimes.length > 0 ? 
      validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length : 0;
  }

  private countEscalationMismatches(feedbacks: any[]): number {
    return feedbacks.filter(f => 
      f.overrideAction === 'ESCALATE' && 
      f.decision?.escalationLevel === 'NONE'
    ).length;
  }

  private countRecommendationRejections(feedbacks: any[]): number {
    return feedbacks.filter(f => 
      f.overrideAction === 'REJECT'
    ).length;
  }

  private countConfidenceMisalignments(feedbacks: any[]): number {
    return feedbacks.filter(f => 
      f.confidenceAgreement.includes('DISAGREE')
    ).length;
  }

  // Additional helper methods for segmented analysis...
  private analyzeByRiskBand(feedbacks: any[], decisions: any[]): Record<string, any> {
    // Implementation for risk band analysis
    return {};
  }

  private analyzeByRule(feedbacks: any[], decisions: any[]): Record<string, any> {
    // Implementation for rule analysis
    return {};
  }

  private analyzeByRecommendationType(feedbacks: any[], decisions: any[]): Record<string, any> {
    // Implementation for recommendation type analysis
    return {};
  }

  private analyzeBySellerSegment(feedbacks: any[], decisions: any[]): Record<string, any> {
    // Implementation for seller segment analysis
    return {};
  }

  private analyzeByTimeWindow(feedbacks: any[], period: any): Record<string, any> {
    // Implementation for time window analysis
    return {};
  }

  private calculateOverallAlignmentScore(agreementRate: number, overrideFrequency: number): number {
    // Higher agreement and lower override frequency = better alignment
    return Math.round((agreementRate * (1 - overrideFrequency)) * 100);
  }

  // Helper methods for improvement signals...
  private identifyOverriddenRules(feedbacks: any[]): ImprovementSignal[] {
    // Implementation for overridden rules detection
    return [];
  }

  private identifyFalseNegativeClusters(feedbacks: any[]): ImprovementSignal[] {
    // Implementation for false negative detection
    return [];
  }

  private identifyOverConservativePaths(feedbacks: any[]): ImprovementSignal[] {
    // Implementation for over-conservative detection
    return [];
  }

  private identifyConfidenceCalibrationIssues(feedbacks: any[]): ImprovementSignal[] {
    // Implementation for confidence calibration
    return [];
  }

  // Helper methods for timeline...
  private calculateTimelineSummary(entries: any[], feedbacks: any[]): any {
    const totalDecisions = entries.length;
    const totalFeedbacks = feedbacks.length;
    const agreementRate = this.calculateAgreementRate(feedbacks);
    const averageProcessingTime = this.calculateAverageProcessingTime(feedbacks);

    return {
      totalDecisions,
      totalFeedbacks,
      agreementRate,
      averageProcessingTimeMs: averageProcessingTime,
      trend: this.determineTrend(entries)
    };
  }

  private determineTrend(entries: any[]): 'IMPROVING' | 'DETERIORATING' | 'STABLE' {
    // Simple trend analysis based on recent alignment
    return 'STABLE';
  }

  // Utility methods
  private parsePeriod(periodStr: string): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;

    switch (periodStr) {
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { start, end: now };
  }

  private mapToHumanFeedback(dbFeedback: any): HumanFeedback {
    return {
      id: dbFeedback.id,
      decisionId: dbFeedback.decisionId,
      sellerId: dbFeedback.sellerId,
      timestamp: dbFeedback.createdAt,
      actorId: dbFeedback.actorId,
      actorRole: dbFeedback.actorRole,
      processingTimeMs: dbFeedback.processingTimeMs,
      overrideAction: dbFeedback.overrideAction,
      overrideReason: dbFeedback.overrideReason,
      confidenceAgreement: dbFeedback.confidenceAgreement,
      comments: dbFeedback.comments,
      evidenceReferences: dbFeedback.evidenceReferences,
      createdAt: dbFeedback.createdAt,
      updatedAt: dbFeedback.updatedAt,
      auditTrail: dbFeedback.auditTrail?.map((audit: any) => ({
        timestamp: audit.timestamp,
        action: audit.action,
        actorId: audit.actorId,
        details: audit.details
      })) || []
    };
  }
}