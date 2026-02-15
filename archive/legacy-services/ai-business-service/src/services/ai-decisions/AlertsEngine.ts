import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Types for Alerts Engine
export interface AlertRule {
  id: string;
  businessAccountId: string;
  ruleName: string;
  description?: string;
  metricName: string;
  conditionOperator: 'LT' | 'GT' | 'LTE' | 'GTE' | 'EQ' | 'NE';
  thresholdValue: number;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  frequency: 'REAL_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  notificationChannels: string[];
  isActive: boolean;
  createdBy: string;
}

export interface CreateAlertRuleRequest {
  businessAccountId: string;
  ruleName: string;
  description?: string;
  metricName: string;
  conditionOperator: 'LT' | 'GT' | 'LTE' | 'GTE' | 'EQ' | 'NE';
  thresholdValue: number;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  frequency: 'REAL_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  notificationChannels: string[];
}

export interface AlertNotification {
  id: string;
  ruleId: string;
  businessAccountId: string;
  alertTitle: string;
  alertMessage: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  metricValue: number;
  thresholdValue: number;
  variancePercentage?: number;
  notificationChannels: string[];
  sentAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface AlertCheckResult {
  alertsTriggered: Array<{
    ruleId: string;
    businessName: string;
    metric: string;
    currentValue: number;
    threshold: number;
    severity: string;
  }>;
  checkedAt: Date;
}

// Validation schemas
const CreateAlertRuleSchema = z.object({
  businessAccountId: z.string().uuid(),
  ruleName: z.string().min(1).max(255),
  description: z.string().optional(),
  metricName: z.string().min(1),
  conditionOperator: z.enum(['LT', 'GT', 'LTE', 'GTE', 'EQ', 'NE']),
  thresholdValue: z.number(),
  severity: z.enum(['CRITICAL', 'WARNING', 'INFO']),
  frequency: z.enum(['REAL_TIME', 'DAILY', 'WEEKLY', 'MONTHLY']),
  notificationChannels: z.array(z.string()).min(1)
});

const AcknowledgeAlertSchema = z.object({
  notificationId: z.string().uuid(),
  acknowledgmentType: z.enum(['ACKNOWLEDGED', 'DISMISSED', 'ESCALATED']),
  notes: z.string().optional()
});

const ResolveAlertSchema = z.object({
  notificationId: z.string().uuid(),
  resolutionNotes: z.string().optional()
});

export class AlertsEngine {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new alert rule
   */
  async createAlertRule(request: CreateAlertRuleRequest, userId: string): Promise<AlertRule> {
    try {
      const validated = CreateAlertRuleSchema.parse(request);

      const result = await this.prisma.$queryRaw`
        INSERT INTO alert_rules (
          business_account_id, rule_name, description, metric_name,
          condition_operator, threshold_value, severity, frequency,
          notification_channels, is_active, created_by, created_at, updated_at
        ) VALUES (
          ${validated.businessAccountId},
          ${validated.ruleName},
          ${validated.description || null},
          ${validated.metricName},
          ${validated.conditionOperator},
          ${validated.thresholdValue},
          ${validated.severity},
          ${validated.frequency},
          ${JSON.stringify(validated.notificationChannels)},
          true,
          ${userId},
          NOW(),
          NOW()
        )
        RETURNING id, rule_name, metric_name, severity, created_at
      ` as any[];

      // Get the full rule details
      const rule = await this.getAlertRuleById(result[0].id);
      return rule;
    } catch (error) {
      console.error('Error creating alert rule:', error);
      throw new Error('Failed to create alert rule');
    }
  }

  /**
   * Get alert rule by ID
   */
  private async getAlertRuleById(ruleId: string): Promise<AlertRule> {
    try {
      const rules = await this.prisma.$queryRaw`
        SELECT 
          id, business_account_id, rule_name, description, metric_name,
          condition_operator, threshold_value, severity, frequency,
          notification_channels, is_active, created_by, created_at, updated_at
        FROM alert_rules 
        WHERE id = ${ruleId}
      ` as any[];

      if (rules.length === 0) {
        throw new Error('Alert rule not found');
      }

      const rule = rules[0];
      return {
        ...rule,
        notificationChannels: typeof rule.notification_channels === 'string' 
          ? JSON.parse(rule.notification_channels) 
          : rule.notification_channels
      };
    } catch (error) {
      console.error('Error getting alert rule:', error);
      throw new Error('Failed to retrieve alert rule');
    }
  }

  /**
   * Get all alert rules for a business account
   */
  async getAlertRules(businessAccountId: string, filters: {
    severity?: string;
    isActive?: boolean;
    metricName?: string;
  } = {}): Promise<AlertRule[]> {
    try {
      let query = `
        SELECT 
          id, business_account_id, rule_name, description, metric_name,
          condition_operator, threshold_value, severity, frequency,
          notification_channels, is_active, created_by, created_at, updated_at
        FROM alert_rules 
        WHERE business_account_id = $1
      `;

      const params: any[] = [businessAccountId];
      let paramIndex = 2;

      if (filters.severity) {
        query += ` AND severity = $${paramIndex++}`;
        params.push(filters.severity);
      }

      if (filters.isActive !== undefined) {
        query += ` AND is_active = $${paramIndex++}`;
        params.push(filters.isActive);
      }

      if (filters.metricName) {
        query += ` AND metric_name = $${paramIndex++}`;
        params.push(filters.metricName);
      }

      query += ` ORDER BY severity DESC, created_at DESC`;

      const rules = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

      // Parse JSON fields
      return rules.map(rule => ({
        ...rule,
        notificationChannels: typeof rule.notification_channels === 'string' 
          ? JSON.parse(rule.notification_channels) 
          : rule.notificationChannels
      }));
    } catch (error) {
      console.error('Error getting alert rules:', error);
      throw new Error('Failed to retrieve alert rules');
    }
  }

  /**
   * Update alert rule
   */
  async updateAlertRule(ruleId: string, updates: Partial<CreateAlertRuleRequest>, userId: string): Promise<AlertRule> {
    try {
      const setClause: string[] = [];
      const params: any[] = [ruleId];
      let paramIndex = 2;

      if (updates.ruleName) {
        setClause.push(`rule_name = $${paramIndex++}`);
        params.push(updates.ruleName);
      }

      if (updates.description !== undefined) {
        setClause.push(`description = $${paramIndex++}`);
        params.push(updates.description);
      }

      if (updates.thresholdValue) {
        setClause.push(`threshold_value = $${paramIndex++}`);
        params.push(updates.thresholdValue);
      }

      if (updates.severity) {
        setClause.push(`severity = $${paramIndex++}`);
        params.push(updates.severity);
      }

      if (updates.frequency) {
        setClause.push(`frequency = $${paramIndex++}`);
        params.push(updates.frequency);
      }

      if (updates.notificationChannels) {
        setClause.push(`notification_channels = $${paramIndex++}`);
        params.push(JSON.stringify(updates.notificationChannels));
      }

      if (updates.isActive !== undefined) {
        setClause.push(`is_active = $${paramIndex++}`);
        params.push(updates.isActive);
      }

      if (setClause.length === 0) {
        throw new Error('No valid updates provided');
      }

      setClause.push(`updated_at = NOW()`);

      await this.prisma.$queryRawUnsafe(`
        UPDATE alert_rules 
        SET ${setClause.join(', ')}
        WHERE id = $1
      `, ...params);

      const updatedRule = await this.getAlertRuleById(ruleId);
      return updatedRule;
    } catch (error) {
      console.error('Error updating alert rule:', error);
      throw new Error('Failed to update alert rule');
    }
  }

  /**
   * Delete alert rule
   */
  async deleteAlertRule(ruleId: string, businessAccountId: string): Promise<void> {
    try {
      // Verify ownership
      const rule = await this.prisma.$queryRaw`
        SELECT id FROM alert_rules 
        WHERE id = ${ruleId} AND business_account_id = ${businessAccountId}
      ` as any[];

      if (rule.length === 0) {
        throw new Error('Alert rule not found or access denied');
      }

      await this.prisma.$queryRaw`
        DELETE FROM alert_rules 
        WHERE id = ${ruleId}
      `;
    } catch (error) {
      console.error('Error deleting alert rule:', error);
      throw new Error('Failed to delete alert rule');
    }
  }

  /**
   * Check alert conditions for all businesses or specific business
   */
  async checkAlertConditions(businessAccountId?: string): Promise<AlertCheckResult> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT * FROM check_alert_conditions(${businessAccountId || null})
      ` as any[];

      return result[0] || { alertsTriggered: [], checkedAt: new Date() };
    } catch (error) {
      console.error('Error checking alert conditions:', error);
      throw new Error('Failed to check alert conditions');
    }
  }

  /**
   * Get current metric value for alert checking
   */
  private async getCurrentMetricValue(businessAccountId: string, metricName: string): Promise<number> {
    try {
      let value = 0;

      // Map metric names to actual database queries
      switch (metricName) {
        case 'current_ratio':
          const currentRatio = await this.prisma.$queryRaw`
            SELECT ratio_value 
            FROM financial_ratios 
            WHERE business_account_id = ${businessAccountId}
            AND ratio_name = 'current_ratio'
            ORDER BY created_at DESC 
            LIMIT 1
          ` as any[];
          value = currentRatio[0]?.ratio_value || 0;
          break;

        case 'cash_flow':
          const cashFlow = await this.prisma.$queryRaw`
            SELECT cash_flow 
            FROM financial_statements 
            WHERE business_account_id = ${businessAccountId}
            ORDER BY created_at DESC 
            LIMIT 1
          ` as any[];
          value = cashFlow[0]?.cash_flow || 0;
          break;

        case 'profit_margin':
          const profitMargin = await this.prisma.$queryRaw`
            SELECT ratio_value 
            FROM financial_ratios 
            WHERE business_account_id = ${businessAccountId}
            AND ratio_name = 'net_profit_margin'
            ORDER BY created_at DESC 
            LIMIT 1
          ` as any[];
          value = profitMargin[0]?.ratio_value || 0;
          break;

        case 'revenue_growth':
          // Calculate revenue growth from last two periods
          const revenueGrowth = await this.prisma.$queryRaw`
            WITH revenue_data AS (
              SELECT 
                revenue,
                created_at,
                ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
              FROM financial_statements 
              WHERE business_account_id = ${businessAccountId}
              AND revenue IS NOT NULL
              ORDER BY created_at DESC
              LIMIT 2
            )
            SELECT 
              CASE 
                WHEN COUNT(*) = 2 THEN 
                  ((MAX(CASE WHEN rn = 1 THEN revenue END) - MAX(CASE WHEN rn = 2 THEN revenue END)) / 
                   MAX(CASE WHEN rn = 2 THEN revenue END)) * 100
                ELSE 0 
              END as growth_rate
            FROM revenue_data
          ` as any[];
          value = revenueGrowth[0]?.growth_rate || 0;
          break;

        default:
          // Try to get from financial_ratios table
          const genericRatio = await this.prisma.$queryRaw`
            SELECT ratio_value 
            FROM financial_ratios 
            WHERE business_account_id = ${businessAccountId}
            AND ratio_name = ${metricName}
            ORDER BY created_at DESC 
            LIMIT 1
          ` as any[];
          value = genericRatio[0]?.ratio_value || 0;
          break;
      }

      return Number(value);
    } catch (error) {
      console.error('Error getting current metric value:', error);
      return 0;
    }
  }

  /**
   * Get active alert notifications
   */
  async getActiveAlerts(businessAccountId: string, filters: {
    severity?: string;
    acknowledged?: boolean;
    limit?: number;
  } = {}): Promise<AlertNotification[]> {
    try {
      let query = `
        SELECT 
          an.*,
          ar.rule_name,
          ar.metric_name
        FROM alert_notifications an
        JOIN alert_rules ar ON an.rule_id = ar.id
        WHERE an.business_account_id = $1
        AND an.resolved_at IS NULL
      `;

      const params: any[] = [businessAccountId];
      let paramIndex = 2;

      if (filters.severity) {
        query += ` AND an.severity = $${paramIndex++}`;
        params.push(filters.severity);
      }

      if (filters.acknowledged !== undefined) {
        if (filters.acknowledged) {
          query += ` AND an.acknowledged_at IS NOT NULL`;
        } else {
          query += ` AND an.acknowledged_at IS NULL`;
        }
      }

      query += ` ORDER BY an.severity DESC, an.sent_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      const alerts = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

      // Parse JSON fields
      return alerts.map(alert => ({
        ...alert,
        notificationChannels: typeof alert.notification_channels === 'string' 
          ? JSON.parse(alert.notification_channels) 
          : alert.notification_channels
      }));
    } catch (error) {
      console.error('Error getting active alerts:', error);
      throw new Error('Failed to retrieve active alerts');
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    notificationId: string, 
    userId: string, 
    acknowledgmentType: 'ACKNOWLEDGED' | 'DISMISSED' | 'ESCALATED',
    notes?: string
  ): Promise<void> {
    try {
      const validated = AcknowledgeAlertSchema.parse({
        notificationId,
        acknowledgmentType,
        notes
      });

      // Update notification
      await this.prisma.$queryRaw`
        UPDATE alert_notifications 
        SET 
          acknowledged_at = NOW(),
          acknowledged_by = ${userId}
        WHERE id = ${validated.notificationId}
      `;

      // Add acknowledgment record
      await this.prisma.$queryRaw`
        INSERT INTO alert_acknowledgments (
          notification_id, user_id, acknowledgment_type, notes, created_at
        ) VALUES (
          ${validated.notificationId},
          ${userId},
          ${validated.acknowledgmentType},
          ${validated.notes || null},
          NOW()
        )
      `;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw new Error('Failed to acknowledge alert');
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(notificationId: string, userId: string, resolutionNotes?: string): Promise<void> {
    try {
      const validated = ResolveAlertSchema.parse({
        notificationId,
        resolutionNotes
      });

      await this.prisma.$queryRaw`
        UPDATE alert_notifications 
        SET 
          resolved_at = NOW(),
          resolved_by = ${userId},
          resolution_notes = ${validated.resolutionNotes || null}
        WHERE id = ${validated.notificationId}
      `;
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw new Error('Failed to resolve alert');
    }
  }

  /**
   * Get alert history
   */
  async getAlertHistory(businessAccountId: string, filters: {
    startDate?: Date;
    endDate?: Date;
    severity?: string;
    limit?: number;
  } = {}): Promise<AlertNotification[]> {
    try {
      let query = `
        SELECT 
          an.*,
          ar.rule_name,
          ar.metric_name
        FROM alert_notifications an
        JOIN alert_rules ar ON an.rule_id = ar.id
        WHERE an.business_account_id = $1
      `;

      const params: any[] = [businessAccountId];
      let paramIndex = 2;

      if (filters.startDate) {
        query += ` AND an.created_at >= $${paramIndex++}`;
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ` AND an.created_at <= $${paramIndex++}`;
        params.push(filters.endDate);
      }

      if (filters.severity) {
        query += ` AND an.severity = $${paramIndex++}`;
        params.push(filters.severity);
      }

      query += ` ORDER BY an.created_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      const alerts = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

      // Parse JSON fields
      return alerts.map(alert => ({
        ...alert,
        notificationChannels: typeof alert.notification_channels === 'string' 
          ? JSON.parse(alert.notification_channels) 
          : alert.notification_channels
      }));
    } catch (error) {
      console.error('Error getting alert history:', error);
      throw new Error('Failed to retrieve alert history');
    }
  }

  /**
   * Get alert summary for dashboard
   */
  async getAlertSummary(businessAccountId: string): Promise<any> {
    try {
      const summary = await this.prisma.$queryRaw`
        SELECT 
          COUNT(*) FILTER (WHERE severity = 'CRITICAL' AND resolved_at IS NULL) as critical_alerts,
          COUNT(*) FILTER (WHERE severity = 'WARNING' AND resolved_at IS NULL) as warning_alerts,
          COUNT(*) FILTER (WHERE severity = 'INFO' AND resolved_at IS NULL) as info_alerts,
          COUNT(*) FILTER (WHERE resolved_at IS NULL) as total_active_alerts,
          COUNT(*) FILTER (WHERE acknowledged_at IS NULL AND resolved_at IS NULL) as unacknowledged_alerts,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as alerts_this_week,
          COUNT(*) FILTER (WHERE resolved_at >= CURRENT_DATE - INTERVAL '7 days') as resolved_this_week
        FROM alert_notifications 
        WHERE business_account_id = ${businessAccountId}
      ` as any[];

      return summary[0] || {};
    } catch (error) {
      console.error('Error getting alert summary:', error);
      throw new Error('Failed to retrieve alert summary');
    }
  }

  /**
   * Create default alert rules for a business
   */
  async createDefaultAlertRules(businessAccountId: string, userId: string): Promise<void> {
    try {
      const defaultRules = [
        {
          ruleName: 'Low Current Ratio',
          description: 'Alert when current ratio falls below 1.5',
          metricName: 'current_ratio',
          conditionOperator: 'LT' as const,
          thresholdValue: 1.5,
          severity: 'CRITICAL' as const,
          frequency: 'REAL_TIME' as const,
          notificationChannels: ['WHATSAPP', 'EMAIL']
        },
        {
          ruleName: 'Negative Cash Flow',
          description: 'Alert when cash flow becomes negative',
          metricName: 'cash_flow',
          conditionOperator: 'LT' as const,
          thresholdValue: 0,
          severity: 'CRITICAL' as const,
          frequency: 'REAL_TIME' as const,
          notificationChannels: ['WHATSAPP']
        },
        {
          ruleName: 'Low Profit Margin',
          description: 'Alert when profit margin falls below 5%',
          metricName: 'profit_margin',
          conditionOperator: 'LT' as const,
          thresholdValue: 5,
          severity: 'WARNING' as const,
          frequency: 'DAILY' as const,
          notificationChannels: ['WHATSAPP']
        },
        {
          ruleName: 'Revenue Decline',
          description: 'Alert when revenue growth is negative',
          metricName: 'revenue_growth',
          conditionOperator: 'LT' as const,
          thresholdValue: 0,
          severity: 'WARNING' as const,
          frequency: 'WEEKLY' as const,
          notificationChannels: ['EMAIL']
        }
      ];

      for (const rule of defaultRules) {
        await this.createAlertRule(
          { ...rule, businessAccountId },
          userId
        );
      }
    } catch (error) {
      console.error('Error creating default alert rules:', error);
      throw new Error('Failed to create default alert rules');
    }
  }
}
