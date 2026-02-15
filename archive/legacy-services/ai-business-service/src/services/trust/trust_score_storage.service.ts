import { PrismaClient } from '@prisma/client';
import { 
  TrustScoreStorage, 
  TrustScoreHistory, 
  TrustScoreQuery, 
  TrustScoreStatistics,
  TrustScoreStorageError,
  TrustScoreStorageErrorCodes,
  TrustScoreStorageRules,
  TrustScoreChangeReasons,
  ITrustScoreStorageService,
  TrustScoreStorageSchema,
  TrustScoreHistorySchema
} from '../../models/trust_score.model';

const prisma = new PrismaClient();

export class TrustScoreStorageService implements ITrustScoreStorageService {
  /**
   * Store trust score - preserves history, no overwrite
   */
  async storeTrustScore(score: TrustScoreStorage): Promise<TrustScoreStorage> {
    try {
      console.log(`💾 Storing trust score for subject ${score.subject_id} (${score.subject_type})`);

      // Validate input
      TrustScoreStorageSchema.parse(score);
      TrustScoreStorageRules.validateScoreBounds(score.trust_score);
      TrustScoreStorageRules.validateSubject(score.subject_id, score.subject_type);
      TrustScoreStorageRules.validateReadOnly(score);

      // Check for existing score
      const existingScore = await this.getTrustScore(score.subject_id, score.subject_type);

      let storedScore: TrustScoreStorage;

      if (existingScore) {
        // Update existing score (no overwrite - preserve history)
        const previousScore = existingScore.trust_score;
        const scoreChange = score.trust_score - previousScore;
        const categoryChanged = existingScore.score_category !== score.score_category;

        // Update main score record
        storedScore = await prisma.trustScore.update({
          where: { score_id: existingScore.score_id },
          data: {
            trust_score: score.trust_score,
            score_category: score.score_category,
            score_breakdown: score.score_breakdown,
            calculation_details: score.calculation_details,
            metadata: score.metadata,
            updated_at: new Date()
          }
        });

        // Create history record
        await this.createHistoryRecord({
          score_id: storedScore.score_id,
          subject_id: score.subject_id,
          subject_type: score.subject_type,
          trust_score: score.trust_score,
          score_category: score.score_category,
          score_change: scoreChange,
          previous_score: previousScore,
          change_reason: this.determineChangeReason(scoreChange, categoryChanged, previousScore, score.trust_score),
          calculation_details: {
            total_cases: score.calculation_details.total_cases,
            open_cases: score.calculation_details.open_cases,
            resolved_cases: score.calculation_details.resolved_cases,
            appeals_count: score.calculation_details.appeals_count,
            accepted_appeals: score.calculation_details.accepted_appeals,
            rejected_appeals: score.calculation_details.rejected_appeals,
            calculation_date: score.calculation_details.calculation_date
          }
        });

        console.log(`✅ Updated trust score: ${previousScore} → ${score.trust_score} (${scoreChange:+.2})`);

      } else {
        // Create new score record
        storedScore = await prisma.trustScore.create({
          data: {
            score_id: score.score_id,
            subject_id: score.subject_id,
            subject_type: score.subject_type,
            trust_score: score.trust_score,
            score_category: score.score_category,
            score_breakdown: score.score_breakdown,
            calculation_details: score.calculation_details,
            metadata: score.metadata,
            created_at: new Date()
          }
        });

        // Create initial history record
        await this.createHistoryRecord({
          score_id: storedScore.score_id,
          subject_id: score.subject_id,
          subject_type: score.subject_type,
          trust_score: score.trust_score,
          score_category: score.score_category,
          score_change: 0, // No change for initial score
          previous_score: null,
          change_reason: 'NEW_CASE',
          calculation_details: {
            total_cases: score.calculation_details.total_cases,
            open_cases: score.calculation_details.open_cases,
            resolved_cases: score.calculation_details.resolved_cases,
            appeals_count: score.calculation_details.appeals_count,
            accepted_appeals: score.calculation_details.accepted_appeals,
            rejected_appeals: score.calculation_details.rejected_appeals,
            calculation_date: score.calculation_details.calculation_date
          }
        });

        console.log(`✅ Created new trust score: ${score.trust_score}`);
      }

      return storedScore;

    } catch (error) {
      console.error('Error storing trust score:', error);
      if (error instanceof TrustScoreStorageError) {
        throw error;
      }
      throw new TrustScoreStorageError(
        'Failed to store trust score',
        TrustScoreStorageErrorCodes.STORAGE_ERROR,
        500
      );
    }
  }

  /**
   * Get trust score for subject
   */
  async getTrustScore(subjectId: string, subjectType: string): Promise<TrustScoreStorage | null> {
    try {
      const score = await prisma.trustScore.findFirst({
        where: {
          subject_id: subjectId,
          subject_type: subjectType as any
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      return score || null;

    } catch (error) {
      console.error('Error getting trust score:', error);
      throw new TrustScoreStorageError(
        'Failed to retrieve trust score',
        TrustScoreStorageErrorCodes.QUERY_ERROR,
        500
      );
    }
  }

  /**
   * Get trust score history for subject
   */
  async getTrustScoreHistory(
    subjectId: string, 
    subjectType: string, 
    limit: number = 50
  ): Promise<TrustScoreHistory[]> {
    try {
      const history = await prisma.trustScoreHistory.findMany({
        where: {
          subject_id: subjectId,
          subject_type: subjectType as any
        },
        orderBy: {
          created_at: 'desc'
        },
        take: limit
      });

      return history;

    } catch (error) {
      console.error('Error getting trust score history:', error);
      throw new TrustScoreStorageError(
        'Failed to retrieve trust score history',
        TrustScoreStorageErrorCodes.HISTORY_NOT_FOUND,
        500
      );
    }
  }

  /**
   * Query trust scores with filters
   */
  async queryTrustScores(query: TrustScoreQuery): Promise<TrustScoreStorage[]> {
    try {
      const whereClause: any = {};

      if (query.subject_id) {
        whereClause.subject_id = query.subject_id;
      }

      if (query.subject_type) {
        whereClause.subject_type = query.subject_type;
      }

      if (query.score_category) {
        whereClause.score_category = query.score_category;
      }

      if (query.min_score !== undefined || query.max_score !== undefined) {
        whereClause.trust_score = {};
        if (query.min_score !== undefined) {
          whereClause.trust_score.gte = query.min_score;
        }
        if (query.max_score !== undefined) {
          whereClause.trust_score.lte = query.max_score;
        }
      }

      if (query.created_after || query.created_before) {
        whereClause.created_at = {};
        if (query.created_after) {
          whereClause.created_at.gte = query.created_after;
        }
        if (query.created_before) {
          whereClause.created_at.lte = query.created_before;
        }
      }

      const scores = await prisma.trustScore.findMany({
        where: whereClause,
        orderBy: {
          created_at: 'desc'
        },
        skip: query.offset,
        take: query.limit
      });

      return scores;

    } catch (error) {
      console.error('Error querying trust scores:', error);
      throw new TrustScoreStorageError(
        'Failed to query trust scores',
        TrustScoreStorageErrorCodes.QUERY_ERROR,
        500
      );
    }
  }

  /**
   * Update trust score (preserves history)
   */
  async updateTrustScore(scoreId: string, updates: Partial<TrustScoreStorage>): Promise<TrustScoreStorage> {
    try {
      // Get existing score
      const existingScore = await prisma.trustScore.findUnique({
        where: { score_id: scoreId }
      });

      if (!existingScore) {
        throw new TrustScoreStorageError(
          'Trust score not found',
          TrustScoreStorageErrorCodes.SCORE_NOT_FOUND,
          404
        );
      }

      // Validate updates
      if (updates.trust_score !== undefined) {
        TrustScoreStorageRules.validateScoreBounds(updates.trust_score);
      }

      // Update score
      const updatedScore = await prisma.trustScore.update({
        where: { score_id: scoreId },
        data: {
          ...updates,
          updated_at: new Date()
        }
      });

      // Create history record if score changed
      if (updates.trust_score !== undefined && updates.trust_score !== existingScore.trust_score) {
        await this.createHistoryRecord({
          score_id: scoreId,
          subject_id: existingScore.subject_id,
          subject_type: existingScore.subject_type,
          trust_score: updates.trust_score,
          score_category: updates.score_category || existingScore.score_category,
          score_change: updates.trust_score - existingScore.trust_score,
          previous_score: existingScore.trust_score,
          change_reason: 'MANUAL_RECALCULATION',
          calculation_details: existingScore.calculation_details
        });
      }

      return updatedScore;

    } catch (error) {
      console.error('Error updating trust score:', error);
      if (error instanceof TrustScoreStorageError) {
        throw error;
      }
      throw new TrustScoreStorageError(
        'Failed to update trust score',
        TrustScoreStorageErrorCodes.STORAGE_ERROR,
        500
      );
    }
  }

  /**
   * Delete trust score (should not be used - preserves history)
   */
  async deleteTrustScore(scoreId: string): Promise<boolean> {
    try {
      // This method should not be used as it violates history preservation
      // But implemented for completeness with strict validation
      const score = await prisma.trustScore.findUnique({
        where: { score_id: scoreId }
      });

      if (!score) {
        throw new TrustScoreStorageError(
          'Trust score not found',
          TrustScoreStorageErrorCodes.SCORE_NOT_FOUND,
          404
        );
      }

      // Check if deletion is allowed (should be very rare)
      const history = await this.getTrustScoreHistory(score.subject_id, score.subject_type);
      if (history.length > 1) {
        throw new TrustScoreStorageError(
          'Cannot delete score with preserved history',
          TrustScoreStorageErrorCodes.HISTORY_DELETION_ATTEMPTED,
          403
        );
      }

      await prisma.trustScore.delete({
        where: { score_id: scoreId }
      });

      console.log(`⚠️  Deleted trust score: ${scoreId} (history preservation violated)`);
      return true;

    } catch (error) {
      console.error('Error deleting trust score:', error);
      if (error instanceof TrustScoreStorageError) {
        throw error;
      }
      throw new TrustScoreStorageError(
        'Failed to delete trust score',
        TrustScoreStorageErrorCodes.STORAGE_ERROR,
        500
      );
    }
  }

  /**
   * Get trust score statistics
   */
  async getTrustScoreStatistics(filters?: any): Promise<TrustScoreStatistics> {
    try {
      // Get basic statistics
      const totalSubjects = await prisma.trustScore.groupBy({
        by: ['subject_id', 'subject_type'],
        _count: true
      });

      const avgScore = await prisma.trustScore.aggregate({
        _avg: {
          trust_score: true
        }
      });

      // Get score distribution
      const scoreDistribution = await prisma.trustScore.groupBy({
        by: ['score_category'],
        _count: true
      });

      // Get subject type distribution
      const subjectTypeDistribution = await prisma.trustScore.groupBy({
        by: ['subject_type'],
        _count: true
      });

      // Get recent trends (simplified)
      const recentScores = await prisma.trustScore.findMany({
        where: {
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: 100
      });

      const statistics: TrustScoreStatistics = {
        total_subjects: totalSubjects.length,
        average_score: avgScore._avg.trust_score || 0,
        median_score: 0, // Would need more complex query for median
        score_distribution: scoreDistribution.reduce((acc, item) => {
          acc[item.score_category] = item._count;
          return acc;
        }, {} as Record<string, number>),
        subject_type_distribution: subjectTypeDistribution.reduce((acc, item) => {
          acc[item.subject_type] = item._count;
          return acc;
        }, {} as Record<string, number>),
        recent_trends: {
          daily_scores: [], // Would need more complex grouping
          weekly_scores: [],
          monthly_scores: []
        },
        last_updated: new Date(),
        metadata: {
          read_only: true,
          non_binding: true,
          not_used_in_payments: true
        }
      };

      return statistics;

    } catch (error) {
      console.error('Error getting trust score statistics:', error);
      throw new TrustScoreStorageError(
        'Failed to retrieve trust score statistics',
        TrustScoreStorageErrorCodes.QUERY_ERROR,
        500
      );
    }
  }

  /**
   * Create history record
   */
  private async createHistoryRecord(historyData: any): Promise<TrustScoreHistory> {
    try {
      TrustScoreHistorySchema.parse(historyData);

      const history = await prisma.trustScoreHistory.create({
        data: {
          history_id: `HIST-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
          ...historyData,
          created_at: new Date()
        }
      });

      return history;

    } catch (error) {
      console.error('Error creating history record:', error);
      throw new TrustScoreStorageError(
        'Failed to create history record',
        TrustScoreStorageErrorCodes.STORAGE_ERROR,
        500
      );
    }
  }

  /**
   * Determine change reason based on score change
   */
  private determineChangeReason(
    scoreChange: number, 
    categoryChanged: boolean, 
    previousScore: number, 
    newScore: number
  ): string {
    if (previousScore === null) {
      return 'NEW_CASE';
    }

    if (categoryChanged) {
      return 'CATEGORY_CHANGED';
    }

    if (Math.abs(scoreChange) > 20) {
      return 'CASE_RESOLVED'; // Large change likely due to case resolution
    }

    if (Math.abs(scoreChange) > 5) {
      return 'APPEAL_OUTCOME'; // Medium change likely due to appeal
    }

    return 'TIME_DECAY'; // Small change likely due to time decay
  }

  /**
   * Get score trends for dashboard
   */
  async getScoreTrends(subjectId?: string, days: number = 30): Promise<any> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const whereClause: any = {
        created_at: {
          gte: startDate
        }
      };

      if (subjectId) {
        whereClause.subject_id = subjectId;
      }

      const trends = await prisma.trustScore.findMany({
        where: whereClause,
        orderBy: {
          created_at: 'asc'
        },
        select: {
          created_at: true,
          trust_score: true,
          subject_id: true,
          subject_type: true
        }
      });

      return {
        period_days: days,
        data_points: trends.length,
        trends: trends.map(trend => ({
          date: trend.created_at,
          score: trend.trust_score,
          subject_id: trend.subject_id,
          subject_type: trend.subject_type
        }))
      };

    } catch (error) {
      console.error('Error getting score trends:', error);
      throw new TrustScoreStorageError(
        'Failed to retrieve score trends',
        TrustScoreStorageErrorCodes.QUERY_ERROR,
        500
      );
    }
  }

  /**
   * Cleanup old scores (should not be used - preserves history)
   */
  async cleanupOldScores(olderThanDays: number = 365): Promise<number> {
    try {
      // This method should not be used as it violates history preservation
      // But implemented for emergency cleanup with strict logging
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

      const deletedCount = await prisma.trustScore.deleteMany({
        where: {
          created_at: {
            lt: cutoffDate
          }
        }
      });

      console.log(`⚠️  Cleaned up ${deletedCount.count} old trust scores (history preservation violated)`);
      return deletedCount.count;

    } catch (error) {
      console.error('Error cleaning up old scores:', error);
      throw new TrustScoreStorageError(
        'Failed to cleanup old scores',
        TrustScoreStorageErrorCodes.STORAGE_ERROR,
        500
      );
    }
  }
}

// Export default instance
export const trustScoreStorageService = new TrustScoreStorageService();
