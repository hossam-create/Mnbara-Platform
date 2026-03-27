import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Types for Feature Flag Service
export interface FeatureFlag {
  id: string;
  flagKey: string;
  flagName: string;
  description?: string;
  flagType: 'BOOLEAN' | 'PERCENTAGE' | 'TARGETED' | 'CONDITIONAL';
  isEnabled: boolean;
  rolloutPercentage: number;
  targetUsers: string[];
  targetRoles: string[];
  targetBusinessAccounts: string[];
  conditions: any;
  category: string;
  priority: number;
  tags: string[];
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface FeatureFlagRequest {
  flagKey: string;
  flagName: string;
  description?: string;
  flagType: 'BOOLEAN' | 'PERCENTAGE' | 'TARGETED' | 'CONDITIONAL';
  isEnabled: boolean;
  rolloutPercentage?: number;
  targetUsers?: string[];
  targetRoles?: string[];
  targetBusinessAccounts?: string[];
  conditions?: any;
  category?: string;
  priority?: number;
  tags?: string[];
  expiresAt?: Date;
}

export interface FeatureFlagEvaluation {
  flagKey: string;
  enabled: boolean;
  evaluationTimeMs: number;
  flagType: string;
  evaluatedAt: Date;
}

export interface FeatureFlagEvaluationContext {
  userId?: string;
  businessAccountId?: string;
  roleName?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestContext?: any;
}

// Validation schemas
const FeatureFlagRequestSchema = z.object({
  flagKey: z.string().min(1).max(255),
  flagName: z.string().min(1).max(255),
  description: z.string().optional(),
  flagType: z.enum(['BOOLEAN', 'PERCENTAGE', 'TARGETED', 'CONDITIONAL']),
  isEnabled: z.boolean(),
  rolloutPercentage: z.number().min(0).max(100).optional(),
  targetUsers: z.array(z.string().uuid()).optional(),
  targetRoles: z.array(z.string()).optional(),
  targetBusinessAccounts: z.array(z.string().uuid()).optional(),
  conditions: z.any().optional(),
  category: z.string().optional(),
  priority: z.number().optional(),
  tags: z.array(z.string()).optional(),
  expiresAt: z.date().optional()
});

const FeatureFlagEvaluationContextSchema = z.object({
  userId: z.string().uuid().optional(),
  businessAccountId: z.string().uuid().optional(),
  roleName: z.string().optional(),
  sessionId: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  requestContext: z.any().optional()
});

export class FeatureFlagService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create feature flag
   */
  async createFeatureFlag(request: FeatureFlagRequest, userId: string): Promise<FeatureFlag> {
    try {
      const validated = FeatureFlagRequestSchema.parse(request);

      const result = await this.prisma.$queryRaw`
        INSERT INTO feature_flags (
          flag_key, flag_name, description, flag_type, is_enabled,
          rollout_percentage, target_users, target_roles, target_business_accounts,
          conditions, category, priority, tags, status, created_by, created_at, updated_at, expires_at
        ) VALUES (
          ${validated.flagKey},
          ${validated.flagName},
          ${validated.description || null},
          ${validated.flagType},
          ${validated.isEnabled},
          ${validated.rolloutPercentage || 0},
          ${JSON.stringify(validated.targetUsers || [])},
          ${JSON.stringify(validated.targetRoles || [])},
          ${JSON.stringify(validated.targetBusinessAccounts || [])},
          ${JSON.stringify(validated.conditions || {})},
          ${validated.category || 'GENERAL'},
          ${validated.priority || 0},
          ${JSON.stringify(validated.tags || [])},
          'DRAFT',
          ${userId},
          NOW(),
          NOW(),
          ${validated.expiresAt || null}
        )
        RETURNING id, flag_key, flag_name, status, created_at, updated_at
      ` as any[];

      const flag = await this.getFeatureFlagByKey(validated.flagKey);
      return flag;
    } catch (error) {
      console.error('Error creating feature flag:', error);
      throw new Error('Failed to create feature flag');
    }
  }

  /**
   * Get feature flag by key
   */
  async getFeatureFlagByKey(flagKey: string): Promise<FeatureFlag> {
    try {
      const flags = await this.prisma.$queryRaw`
        SELECT 
          id, flag_key, flag_name, description, flag_type, is_enabled,
          rollout_percentage, target_users, target_roles, target_business_accounts,
          conditions, category, priority, tags, status, created_by,
          created_at, updated_at, expires_at
        FROM feature_flags 
        WHERE flag_key = ${flagKey}
      ` as any[];

      if (flags.length === 0) {
        throw new Error('Feature flag not found');
      }

      const flag = flags[0];
      return {
        ...flag,
        targetUsers: typeof flag.target_users === 'string' 
          ? JSON.parse(flag.target_users) 
          : flag.target_users,
        targetRoles: typeof flag.target_roles === 'string' 
          ? JSON.parse(flag.target_roles) 
          : flag.target_roles,
        targetBusinessAccounts: typeof flag.target_business_accounts === 'string' 
          ? JSON.parse(flag.target_business_accounts) 
          : flag.target_business_accounts,
        conditions: typeof flag.conditions === 'string' 
          ? JSON.parse(flag.conditions) 
          : flag.conditions,
        tags: typeof flag.tags === 'string' 
          ? JSON.parse(flag.tags) 
          : flag.tags
      };
    } catch (error) {
      console.error('Error getting feature flag:', error);
      throw new Error('Failed to retrieve feature flag');
    }
  }

  /**
   * Get feature flags
   */
  async getFeatureFlags(filters: {
    category?: string;
    status?: string;
    flagType?: string;
    limit?: number;
  } = {}): Promise<FeatureFlag[]> {
    try {
      let query = `
        SELECT 
          id, flag_key, flag_name, description, flag_type, is_enabled,
          rollout_percentage, target_users, target_roles, target_business_accounts,
          conditions, category, priority, tags, status, created_by,
          created_at, updated_at, expires_at
        FROM feature_flags
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (filters.category) {
        query += ` AND category = $${paramIndex++}`;
        params.push(filters.category);
      }

      if (filters.status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(filters.status);
      }

      if (filters.flagType) {
        query += ` AND flag_type = $${paramIndex++}`;
        params.push(filters.flagType);
      }

      query += ` ORDER BY priority DESC, created_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      const flags = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

      return flags.map(flag => ({
        ...flag,
        targetUsers: typeof flag.target_users === 'string' 
          ? JSON.parse(flag.target_users) 
          : flag.target_users,
        targetRoles: typeof flag.target_roles === 'string' 
          ? JSON.parse(flag.target_roles) 
          : flag.target_roles,
        targetBusinessAccounts: typeof flag.target_business_accounts === 'string' 
          ? JSON.parse(flag.target_business_accounts) 
          : flag.target_business_accounts,
        conditions: typeof flag.conditions === 'string' 
          ? JSON.parse(flag.conditions) 
          : flag.conditions,
        tags: typeof flag.tags === 'string' 
          ? JSON.parse(flag.tags) 
          : flag.tags
      }));
    } catch (error) {
      console.error('Error getting feature flags:', error);
      throw new Error('Failed to retrieve feature flags');
    }
  }

  /**
   * Update feature flag
   */
  async updateFeatureFlag(flagKey: string, updates: Partial<FeatureFlagRequest>, userId: string): Promise<FeatureFlag> {
    try {
      const updateFields: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (updates.flagName !== undefined) {
        updateFields.push(`flag_name = $${paramIndex++}`);
        params.push(updates.flagName);
      }

      if (updates.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        params.push(updates.description);
      }

      if (updates.flagType !== undefined) {
        updateFields.push(`flag_type = $${paramIndex++}`);
        params.push(updates.flagType);
      }

      if (updates.isEnabled !== undefined) {
        updateFields.push(`is_enabled = $${paramIndex++}`);
        params.push(updates.isEnabled);
      }

      if (updates.rolloutPercentage !== undefined) {
        updateFields.push(`rollout_percentage = $${paramIndex++}`);
        params.push(updates.rolloutPercentage);
      }

      if (updates.targetUsers !== undefined) {
        updateFields.push(`target_users = $${paramIndex++}`);
        params.push(JSON.stringify(updates.targetUsers));
      }

      if (updates.targetRoles !== undefined) {
        updateFields.push(`target_roles = $${paramIndex++}`);
        params.push(JSON.stringify(updates.targetRoles));
      }

      if (updates.targetBusinessAccounts !== undefined) {
        updateFields.push(`target_business_accounts = $${paramIndex++}`);
        params.push(JSON.stringify(updates.targetBusinessAccounts));
      }

      if (updates.conditions !== undefined) {
        updateFields.push(`conditions = $${paramIndex++}`);
        params.push(JSON.stringify(updates.conditions));
      }

      if (updates.category !== undefined) {
        updateFields.push(`category = $${paramIndex++}`);
        params.push(updates.category);
      }

      if (updates.priority !== undefined) {
        updateFields.push(`priority = $${paramIndex++}`);
        params.push(updates.priority);
      }

      if (updates.tags !== undefined) {
        updateFields.push(`tags = $${paramIndex++}`);
        params.push(JSON.stringify(updates.tags));
      }

      if (updates.expiresAt !== undefined) {
        updateFields.push(`expires_at = $${paramIndex++}`);
        params.push(updates.expiresAt);
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      params.push(flagKey);

      await this.prisma.$queryRawUnsafe(`
        UPDATE feature_flags 
        SET ${updateFields.join(', ')}
        WHERE flag_key = $${paramIndex}
      `, ...params);

      const flag = await this.getFeatureFlagByKey(flagKey);
      return flag;
    } catch (error) {
      console.error('Error updating feature flag:', error);
      throw new Error('Failed to update feature flag');
    }
  }

  /**
   * Activate feature flag
   */
  async activateFeatureFlag(flagKey: string, userId: string): Promise<void> {
    try {
      await this.prisma.$queryRaw`
        UPDATE feature_flags 
        SET status = 'ACTIVE', updated_at = NOW()
        WHERE flag_key = ${flagKey}
      `;
    } catch (error) {
      console.error('Error activating feature flag:', error);
      throw new Error('Failed to activate feature flag');
    }
  }

  /**
   * Deactivate feature flag
   */
  async deactivateFeatureFlag(flagKey: string, userId: string): Promise<void> {
    try {
      await this.prisma.$queryRaw`
        UPDATE feature_flags 
        SET status = 'INACTIVE', updated_at = NOW()
        WHERE flag_key = ${flagKey}
      `;
    } catch (error) {
      console.error('Error deactivating feature flag:', error);
      throw new Error('Failed to deactivate feature flag');
    }
  }

  /**
   * Archive feature flag
   */
  async archiveFeatureFlag(flagKey: string, userId: string): Promise<void> {
    try {
      await this.prisma.$queryRaw`
        UPDATE feature_flags 
        SET status = 'ARCHIVED', updated_at = NOW()
        WHERE flag_key = ${flagKey}
      `;
    } catch (error) {
      console.error('Error archiving feature flag:', error);
      throw new Error('Failed to archive feature flag');
    }
  }

  /**
   * Evaluate feature flag
   */
  async evaluateFeatureFlag(
    flagKey: string, 
    context: FeatureFlagEvaluationContext = {}
  ): Promise<FeatureFlagEvaluation> {
    try {
      const validated = FeatureFlagEvaluationContextSchema.parse(context);

      const result = await this.prisma.$queryRaw`
        SELECT * FROM evaluate_feature_flag(
          ${flagKey},
          ${validated.userId || null},
          ${validated.businessAccountId || null},
          ${validated.roleName || null},
          ${JSON.stringify(validated.requestContext || {})}
        )
      ` as any[];

      return result[0];
    } catch (error) {
      console.error('Error evaluating feature flag:', error);
      throw new Error('Failed to evaluate feature flag');
    }
  }

  /**
   * Check if feature is enabled (simplified method)
   */
  async isFeatureEnabled(
    flagKey: string, 
    context: FeatureFlagEvaluationContext = {}
  ): Promise<boolean> {
    try {
      const evaluation = await this.evaluateFeatureFlag(flagKey, context);
      return evaluation.enabled;
    } catch (error) {
      // Return false if flag doesn't exist or evaluation fails
      return false;
    }
  }

  /**
   * Get feature flag usage statistics
   */
  async getFeatureFlagUsage(flagKey?: string): Promise<any[]> {
    try {
      let query = `
        SELECT 
          flag_key, flag_name, category, is_enabled,
          total_evaluations, enabled_evaluations, enablement_percentage,
          avg_evaluation_time_ms, last_evaluation_at
        FROM mv_feature_flag_usage
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (flagKey) {
        query += ` AND flag_key = $${paramIndex++}`;
        params.push(flagKey);
      }

      query += ` ORDER BY total_evaluations DESC`;

      const usage = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

      return usage;
    } catch (error) {
      console.error('Error getting feature flag usage:', error);
      throw new Error('Failed to retrieve feature flag usage');
    }
  }

  /**
   * Get feature flag evaluation history
   */
  async getFeatureFlagEvaluationHistory(
    flagKey: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      userId?: string;
      limit?: number;
    } = {}
  ): Promise<any[]> {
    try {
      let query = `
        SELECT 
          id, user_id, business_account_id, role_name, session_id,
          evaluation_result, evaluation_time_ms, evaluated_at,
          ip_address, user_agent, request_context
        FROM feature_flag_evaluations
        WHERE flag_key = $1
      `;

      const params: any[] = [flagKey];
      let paramIndex = 2;

      if (filters.startDate) {
        query += ` AND evaluated_at >= $${paramIndex++}`;
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ` AND evaluated_at <= $${paramIndex++}`;
        params.push(filters.endDate);
      }

      if (filters.userId) {
        query += ` AND user_id = $${paramIndex++}`;
        params.push(filters.userId);
      }

      query += ` ORDER BY evaluated_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      const history = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

      return history.map(item => ({
        ...item,
        requestContext: typeof item.request_context === 'string' 
          ? JSON.parse(item.request_context) 
          : item.request_context
      }));
    } catch (error) {
      console.error('Error getting feature flag evaluation history:', error);
      throw new Error('Failed to retrieve feature flag evaluation history');
    }
  }

  /**
   * Bulk evaluate multiple feature flags
   */
  async evaluateMultipleFeatureFlags(
    flagKeys: string[],
    context: FeatureFlagEvaluationContext = {}
  ): Promise<Record<string, FeatureFlagEvaluation>> {
    try {
      const evaluations: Record<string, FeatureFlagEvaluation> = {};

      for (const flagKey of flagKeys) {
        try {
          evaluations[flagKey] = await this.evaluateFeatureFlag(flagKey, context);
        } catch (error) {
          // Include failed evaluations as disabled
          evaluations[flagKey] = {
            flagKey,
            enabled: false,
            evaluationTimeMs: 0,
            flagType: 'UNKNOWN',
            evaluatedAt: new Date()
          };
        }
      }

      return evaluations;
    } catch (error) {
      console.error('Error evaluating multiple feature flags:', error);
      throw new Error('Failed to evaluate multiple feature flags');
    }
  }

  /**
   * Get feature flags by category
   */
  async getFeatureFlagsByCategory(category: string): Promise<FeatureFlag[]> {
    return this.getFeatureFlags({ category });
  }

  /**
   * Get active feature flags
   */
  async getActiveFeatureFlags(): Promise<FeatureFlag[]> {
    return this.getFeatureFlags({ status: 'ACTIVE' });
  }

  /**
   * Search feature flags
   */
  async searchFeatureFlags(searchTerm: string): Promise<FeatureFlag[]> {
    try {
      const flags = await this.prisma.$queryRaw`
        SELECT 
          id, flag_key, flag_name, description, flag_type, is_enabled,
          rollout_percentage, target_users, target_roles, target_business_accounts,
          conditions, category, priority, tags, status, created_by,
          created_at, updated_at, expires_at
        FROM feature_flags 
        WHERE status != 'ARCHIVED'
        AND (
          flag_key ILIKE ${'%' + searchTerm + '%'}
          OR flag_name ILIKE ${'%' + searchTerm + '%'}
          OR description ILIKE ${'%' + searchTerm + '%'}
        )
        ORDER BY priority DESC, flag_name ASC
      ` as any[];

      return flags.map(flag => ({
        ...flag,
        targetUsers: typeof flag.target_users === 'string' 
          ? JSON.parse(flag.target_users) 
          : flag.target_users,
        targetRoles: typeof flag.target_roles === 'string' 
          ? JSON.parse(flag.target_roles) 
          : flag.target_roles,
        targetBusinessAccounts: typeof flag.target_business_accounts === 'string' 
          ? JSON.parse(flag.target_business_accounts) 
          : flag.target_business_accounts,
        conditions: typeof flag.conditions === 'string' 
          ? JSON.parse(flag.conditions) 
          : flag.conditions,
        tags: typeof flag.tags === 'string' 
          ? JSON.parse(flag.tags) 
          : flag.tags
      }));
    } catch (error) {
      console.error('Error searching feature flags:', error);
      throw new Error('Failed to search feature flags');
    }
  }

  /**
   * Delete feature flag
   */
  async deleteFeatureFlag(flagKey: string): Promise<void> {
    try {
      await this.prisma.$queryRaw`
        DELETE FROM feature_flags WHERE flag_key = ${flagKey}
      `;
    } catch (error) {
      console.error('Error deleting feature flag:', error);
      throw new Error('Failed to delete feature flag');
    }
  }

  /**
   * Refresh feature flag usage views
   */
  async refreshFeatureFlagViews(): Promise<void> {
    try {
      await this.prisma.$queryRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_feature_flag_usage`;
    } catch (error) {
      console.error('Error refreshing feature flag views:', error);
      throw new Error('Failed to refresh feature flag views');
    }
  }
}
