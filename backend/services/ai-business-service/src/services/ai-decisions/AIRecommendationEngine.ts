import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Types for AI Recommendations
export interface RecommendationRequest {
  businessAccountId: string;
  recommendationType?: 'COST_REDUCTION' | 'PRICING_OPTIMIZATION' | 'CASH_FLOW_IMPROVEMENT' | 'WORKING_CAPITAL' | 'REVENUE_GROWTH';
  category?: 'IMMEDIATE' | 'SHORT_TERM' | 'STRATEGIC';
  limit?: number;
}

export interface RecommendationResponse {
  recommendations: AIRecommendation[];
  analysisData: {
    financialData: any[];
    ratios: any[];
  };
  generatedAt: Date;
}

export interface AIRecommendation {
  type: string;
  category: string;
  title: string;
  description: string;
  actionSteps: string[];
  confidenceScore: number;
  impactEstimation: {
    dollarValue: number;
    percentage: number;
    timeframe: string;
  };
  implementationEffort: 'LOW' | 'MEDIUM' | 'HIGH';
  priority: number;
}

export interface CreateRecommendationRequest {
  businessAccountId: string;
  recommendationType: string;
  category: string;
  title: string;
  description: string;
  actionSteps: string[];
  confidenceScore: number;
  impactEstimation: {
    dollarValue: number;
    percentage: number;
    timeframe: string;
  };
  implementationEffort: 'LOW' | 'MEDIUM' | 'HIGH';
  priority: number;
}

// Validation schemas
const CreateRecommendationSchema = z.object({
  businessAccountId: z.string().uuid(),
  recommendationType: z.enum(['COST_REDUCTION', 'PRICING_OPTIMIZATION', 'CASH_FLOW_IMPROVEMENT', 'WORKING_CAPITAL', 'REVENUE_GROWTH']),
  category: z.enum(['IMMEDIATE', 'SHORT_TERM', 'STRATEGIC']),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  actionSteps: z.array(z.string().min(1)),
  confidenceScore: z.number().min(0).max(100),
  impactEstimation: z.object({
    dollarValue: z.number(),
    percentage: z.number(),
    timeframe: z.string()
  }),
  implementationEffort: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  priority: z.number().min(1).max(10)
});

const AcceptRecommendationSchema = z.object({
  recommendationId: z.string().uuid(),
  notes: z.string().optional()
});

const UpdateRecommendationStatusSchema = z.object({
  recommendationId: z.string().uuid(),
  status: z.enum(['ACCEPTED', 'REJECTED', 'IMPLEMENTED', 'COMPLETED']),
  notes: z.string().optional(),
  actualImpact: z.object({
    dollarValue: z.number().optional(),
    percentage: z.number().optional(),
    timeframe: z.string().optional()
  }).optional()
});

export class AIRecommendationEngine {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate AI recommendations based on financial data analysis
   */
  async generateRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    try {
      // Call database function to generate recommendations
      const result = await this.prisma.$queryRaw`
        SELECT * FROM generate_ai_recommendations(
          ${request.businessAccountId},
          ${request.recommendationType || null}
        )
      ` as any[];

      const recommendationData = result[0];
      
      // Save recommendations to database if they don't exist
      if (recommendationData?.recommendations?.length > 0) {
        await this.saveRecommendations(request.businessAccountId, recommendationData.recommendations);
      }

      return {
        recommendations: recommendationData?.recommendations || [],
        analysisData: recommendationData?.analysisData || { financialData: [], ratios: [] },
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error('Failed to generate AI recommendations');
    }
  }

  /**
   * Save generated recommendations to database
   */
  private async saveRecommendations(businessAccountId: string, recommendations: any[]): Promise<void> {
    try {
      for (const rec of recommendations) {
        // Check if recommendation already exists
        const existing = await this.prisma.$queryRaw`
          SELECT id FROM ai_recommendations 
          WHERE business_account_id = ${businessAccountId}
          AND title = ${rec.title}
          AND status = 'PENDING'
          LIMIT 1
        ` as any[];

        if (existing.length === 0) {
          await this.prisma.$queryRaw`
            INSERT INTO ai_recommendations (
              business_account_id, recommendation_type, category, title, description,
              action_steps, confidence_score, impact_estimation, implementation_effort,
              priority, status, created_at, updated_at, metadata
            ) VALUES (
              ${businessAccountId},
              ${rec.type},
              ${rec.category},
              ${rec.title},
              ${rec.description},
              ${JSON.stringify(rec.actionSteps)},
              ${rec.confidenceScore},
              ${JSON.stringify(rec.impactEstimation)},
              ${rec.implementationEffort},
              ${rec.priority},
              'PENDING',
              NOW(),
              NOW(),
              ${JSON.stringify({ generated: 'ai' })}
            )
          `;
        }
      }
    } catch (error) {
      console.error('Error saving recommendations:', error);
      // Don't throw here as this is a background operation
    }
  }

  /**
   * Get recommendations for a business account
   */
  async getRecommendations(businessAccountId: string, filters: {
    type?: string;
    category?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<any[]> {
    try {
      let query = `
        SELECT 
          id, recommendation_type, category, title, description,
          action_steps, confidence_score, impact_estimation, implementation_effort,
          priority, status, accepted_by, accepted_at, implemented_by, implemented_at,
          completed_at, actual_impact, created_at, updated_at, metadata
        FROM ai_recommendations 
        WHERE business_account_id = $1
      `;

      const params: any[] = [businessAccountId];
      let paramIndex = 2;

      if (filters.type) {
        query += ` AND recommendation_type = $${paramIndex++}`;
        params.push(filters.type);
      }

      if (filters.category) {
        query += ` AND category = $${paramIndex++}`;
        params.push(filters.category);
      }

      if (filters.status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(filters.status);
      }

      query += ` ORDER BY priority DESC, created_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      const recommendations = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

      // Parse JSON fields
      return recommendations.map(rec => ({
        ...rec,
        actionSteps: typeof rec.action_steps === 'string' ? JSON.parse(rec.action_steps) : rec.action_steps,
        impactEstimation: typeof rec.impact_estimation === 'string' ? JSON.parse(rec.impact_estimation) : rec.impact_estimation,
        actualImpact: typeof rec.actual_impact === 'string' ? JSON.parse(rec.actual_impact) : rec.actual_impact,
        metadata: typeof rec.metadata === 'string' ? JSON.parse(rec.metadata) : rec.metadata
      }));
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw new Error('Failed to retrieve recommendations');
    }
  }

  /**
   * Create a manual recommendation
   */
  async createRecommendation(request: CreateRecommendationRequest, userId: string): Promise<any> {
    try {
      const validated = CreateRecommendationSchema.parse(request);

      const result = await this.prisma.$queryRaw`
        INSERT INTO ai_recommendations (
          business_account_id, recommendation_type, category, title, description,
          action_steps, confidence_score, impact_estimation, implementation_effort,
          priority, status, created_at, updated_at, metadata
        ) VALUES (
          ${validated.businessAccountId},
          ${validated.recommendationType},
          ${validated.category},
          ${validated.title},
          ${validated.description},
          ${JSON.stringify(validated.actionSteps)},
          ${validated.confidenceScore},
          ${JSON.stringify(validated.impactEstimation)},
          ${validated.implementationEffort},
          ${validated.priority},
          'PENDING',
          NOW(),
          NOW(),
          ${JSON.stringify({ created_by: userId, manual: true })}
        )
        RETURNING id, created_at
      ` as any[];

      return result[0];
    } catch (error) {
      console.error('Error creating recommendation:', error);
      throw new Error('Failed to create recommendation');
    }
  }

  /**
   * Accept a recommendation
   */
  async acceptRecommendation(recommendationId: string, userId: string, notes?: string): Promise<any> {
    try {
      const validated = AcceptRecommendationSchema.parse({ recommendationId, notes });

      const result = await this.prisma.$queryRaw`
        UPDATE ai_recommendations 
        SET 
          status = 'ACCEPTED',
          accepted_by = ${userId},
          accepted_at = NOW(),
          updated_at = NOW(),
          metadata = COALESCE(metadata, '{}')::jsonb || ${JSON.stringify({ accepted_notes: notes })}::jsonb
        WHERE id = ${validated.recommendationId}
        RETURNING id, status, accepted_at
      ` as any[];

      if (result.length === 0) {
        throw new Error('Recommendation not found');
      }

      return result[0];
    } catch (error) {
      console.error('Error accepting recommendation:', error);
      throw new Error('Failed to accept recommendation');
    }
  }

  /**
   * Update recommendation status
   */
  async updateRecommendationStatus(
    recommendationId: string, 
    status: string, 
    userId: string, 
    notes?: string,
    actualImpact?: any
  ): Promise<any> {
    try {
      const validated = UpdateRecommendationStatusSchema.parse({
        recommendationId,
        status,
        notes,
        actualImpact
      });

      let updateFields = `
        status = ${validated.status},
        updated_at = NOW()
      `;

      const metadataUpdates: any = {};

      if (validated.status === 'IMPLEMENTED') {
        updateFields += `, implemented_by = ${userId}, implemented_at = NOW()`;
      }

      if (validated.status === 'COMPLETED') {
        updateFields += `, completed_at = NOW()`;
        if (validated.actualImpact) {
          updateFields += `, actual_impact = ${JSON.stringify(validated.actualImpact)}`;
        }
      }

      if (validated.notes) {
        metadataUpdates.status_notes = validated.notes;
      }

      if (Object.keys(metadataUpdates).length > 0) {
        updateFields += `, metadata = COALESCE(metadata, '{}')::jsonb || ${JSON.stringify(metadataUpdates)}::jsonb`;
      }

      const result = await this.prisma.$queryRawUnsafe(`
        UPDATE ai_recommendations 
        SET ${updateFields}
        WHERE id = $1
        RETURNING id, status, updated_at
      `, validated.recommendationId) as any[];

      if (result.length === 0) {
        throw new Error('Recommendation not found');
      }

      return result[0];
    } catch (error) {
      console.error('Error updating recommendation status:', error);
      throw new Error('Failed to update recommendation status');
    }
  }

  /**
   * Get recommendation categories
   */
  async getRecommendationCategories(): Promise<any[]> {
    try {
      const categories = await this.prisma.$queryRaw`
        SELECT id, name, description, icon, color, sort_order, is_active
        FROM recommendation_categories 
        WHERE is_active = true
        ORDER BY sort_order ASC
      ` as any[];

      return categories;
    } catch (error) {
      console.error('Error getting recommendation categories:', error);
      throw new Error('Failed to retrieve recommendation categories');
    }
  }

  /**
   * Get recommendation impact tracking
   */
  async getRecommendationImpact(recommendationId: string): Promise<any[]> {
    try {
      const impact = await this.prisma.$queryRaw`
        SELECT 
          id, metric_name, baseline_value, target_value, actual_value,
          measurement_date, variance_percentage, notes, created_at, updated_at
        FROM recommendation_impact_tracking 
        WHERE recommendation_id = ${recommendationId}
        ORDER BY measurement_date DESC
      ` as any[];

      return impact;
    } catch (error) {
      console.error('Error getting recommendation impact:', error);
      throw new Error('Failed to retrieve recommendation impact');
    }
  }

  /**
   * Track recommendation impact
   */
  async trackRecommendationImpact(
    recommendationId: string,
    metricName: string,
    baselineValue: number,
    targetValue: number,
    actualValue?: number,
    notes?: string
  ): Promise<any> {
    try {
      const variancePercentage = actualValue && targetValue ? 
        ((actualValue - targetValue) / targetValue * 100) : null;

      const result = await this.prisma.$queryRaw`
        INSERT INTO recommendation_impact_tracking (
          recommendation_id, metric_name, baseline_value, target_value, actual_value,
          measurement_date, variance_percentage, notes, created_at, updated_at
        ) VALUES (
          ${recommendationId},
          ${metricName},
          ${baselineValue},
          ${targetValue},
          ${actualValue || null},
          CURRENT_DATE,
          ${variancePercentage},
          ${notes || null},
          NOW(),
          NOW()
        )
        RETURNING id, measurement_date, variance_percentage
      ` as any[];

      return result[0];
    } catch (error) {
      console.error('Error tracking recommendation impact:', error);
      throw new Error('Failed to track recommendation impact');
    }
  }

  /**
   * Get recommendation summary for dashboard
   */
  async getRecommendationSummary(businessAccountId: string): Promise<any> {
    try {
      const summary = await this.prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_recommendations,
          COUNT(*) FILTER (WHERE category = 'IMMEDIATE') as immediate_count,
          COUNT(*) FILTER (WHERE category = 'SHORT_TERM') as short_term_count,
          COUNT(*) FILTER (WHERE category = 'STRATEGIC') as strategic_count,
          COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
          COUNT(*) FILTER (WHERE status = 'ACCEPTED') as accepted_count,
          COUNT(*) FILTER (WHERE status = 'IMPLEMENTED') as implemented_count,
          COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_count,
          AVG(confidence_score) as avg_confidence,
          SUM((impact_estimation->>'dollarValue')::DECIMAL) FILTER (WHERE status = 'COMPLETED') as total_impact_value
        FROM ai_recommendations 
        WHERE business_account_id = ${businessAccountId}
      ` as any[];

      return summary[0] || {};
    } catch (error) {
      console.error('Error getting recommendation summary:', error);
      throw new Error('Failed to retrieve recommendation summary');
    }
  }
}
