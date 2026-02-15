/**
 * RuleEvaluationService - Rule Evaluation Pipeline
 * SECURITY-CRITICAL: Bank-facing infrastructure
 * 
 * ABSOLUTE RULES:
 * - Evaluation is DETERMINISTIC (same input = same output)
 * - Results are IMMUTABLE (append-only logs)
 * - NO auto-enforcement (flags only, no actions)
 * - Trigger modes: SCHEDULED (cron) or ON_DEMAND (admin only)
 * - All evaluations logged for audit trail
 */

import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { RulesEngineService } from './rules-engine.service';
import {
  EvaluationResult,
  RuleEvaluationContext,
  RuleBatchEvaluationResult,
} from '../types/rule.types';

/**
 * Trigger mode for rule evaluation
 */
export enum RuleEvaluationTriggerMode {
  SCHEDULED = 'SCHEDULED',
  ON_DEMAND = 'ON_DEMAND',
}

/**
 * Evaluation batch status
 */
export enum EvaluationBatchStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Schedule run status
 */
export enum ScheduleRunStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Rule evaluation log entry
 */
export interface RuleEvaluationLogEntry {
  evaluation_id: string;
  trigger_mode: RuleEvaluationTriggerMode;
  trigger_source: string;
  rule_id: string;
  rule_name: string;
  matched: boolean;
  output_type?: string;
  severity?: string;
  reason?: string;
  user_id?: string;
  actor_type?: string;
  auction_id?: string;
  traveler_id?: string;
  conditions_evaluated: number;
  conditions_matched: number;
  evaluation_duration_ms: number;
  created_at: Date;
}

/**
 * Evaluation batch result
 */
export interface EvaluationBatchResult {
  batch_id: string;
  trigger_mode: RuleEvaluationTriggerMode;
  trigger_source: string;
  total_rules_evaluated: number;
  total_flags_produced: number;
  evaluation_duration_ms: number;
  status: EvaluationBatchStatus;
  error_message?: string;
  created_at: Date;
}

/**
 * Schedule configuration
 */
export interface EvaluationScheduleConfig {
  name: string;
  description?: string;
  cron_expression: string;
  enabled: boolean;
  evaluation_scope: 'ALL_USERS' | 'ALL_AUCTIONS' | 'CUSTOM';
  scope_filters?: Record<string, any>;
  created_by: string;
}

/**
 * Simple logger for Express environment
 */
class Logger {
  constructor(private context: string) {}

  debug(message: string) {
    console.debug(`[${this.context}] ${message}`);
  }

  info(message: string) {
    console.info(`[${this.context}] ${message}`);
  }

  error(message: string) {
    console.error(`[${this.context}] ${message}`);
  }
}

/**
 * RuleEvaluationService - Manages rule evaluation pipeline
 * Supports scheduled (cron) and on-demand (admin) evaluation modes
 */
export class RuleEvaluationService {
  private readonly logger = new Logger(RuleEvaluationService.name);

  constructor(
    private prisma: PrismaService,
    private rulesEngine: RulesEngineService
  ) {}

  /**
   * Evaluate rules on-demand (admin only)
   * Deterministic: same input always produces same output
   * Immutable: results logged and cannot be modified
   * 
   * @param context - Evaluation context
   * @param adminUserId - Admin user ID (for audit trail)
   * @returns Batch evaluation result
   */
  async evaluateOnDemand(
    context: RuleEvaluationContext,
    adminUserId: string
  ): Promise<EvaluationBatchResult> {
    const batchId = uuidv4();
    const startTime = Date.now();

    try {
      this.logger.info(
        `Starting on-demand rule evaluation (batch: ${batchId}, admin: ${adminUserId})`
      );

      // Validate admin user ID
      if (!adminUserId || adminUserId.trim().length === 0) {
        throw new Error('Admin user ID is required for on-demand evaluation');
      }

      // Evaluate rules
      const results = await this.rulesEngine.evaluateRules(context);

      // Log evaluation results
      await this.logEvaluationResults(
        batchId,
        results,
        context,
        RuleEvaluationTriggerMode.ON_DEMAND,
        adminUserId
      );

      // Create batch record
      const duration = Date.now() - startTime;
      const batchResult = await this.createBatchRecord(
        batchId,
        RuleEvaluationTriggerMode.ON_DEMAND,
        adminUserId,
        results.length,
        results.length, // All results are flags
        duration,
        EvaluationBatchStatus.COMPLETED
      );

      this.logger.info(
        `On-demand evaluation completed (batch: ${batchId}, flags: ${results.length}, duration: ${duration}ms)`
      );

      return batchResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `On-demand evaluation failed (batch: ${batchId}): ${error.message}`
      );

      // Log failure
      await this.createBatchRecord(
        batchId,
        RuleEvaluationTriggerMode.ON_DEMAND,
        adminUserId,
        0,
        0,
        duration,
        EvaluationBatchStatus.FAILED,
        error.message
      );

      throw error;
    }
  }

  /**
   * Evaluate rules on schedule (cron job)
   * Deterministic: same input always produces same output
   * Immutable: results logged and cannot be modified
   * 
   * @param scheduleId - Schedule ID
   * @returns Batch evaluation result
   */
  async evaluateScheduled(scheduleId: string): Promise<EvaluationBatchResult> {
    const batchId = uuidv4();
    const runId = uuidv4();
    const startTime = Date.now();

    try {
      this.logger.info(
        `Starting scheduled rule evaluation (schedule: ${scheduleId}, batch: ${batchId})`
      );

      // Get schedule configuration
      const schedule = await this.prisma.ruleEvaluationSchedule.findUnique({
        where: { schedule_id: scheduleId },
      });

      if (!schedule) {
        throw new Error(`Schedule not found: ${scheduleId}`);
      }

      if (!schedule.enabled) {
        throw new Error(`Schedule is disabled: ${scheduleId}`);
      }

      // Build evaluation contexts based on scope
      const contexts = await this.buildEvaluationContexts(schedule);

      // Evaluate rules for each context
      let totalRulesEvaluated = 0;
      let totalFlagsProduced = 0;

      for (const context of contexts) {
        const results = await this.rulesEngine.evaluateRules(context);

        // Log evaluation results
        await this.logEvaluationResults(
          batchId,
          results,
          context,
          RuleEvaluationTriggerMode.SCHEDULED,
          scheduleId
        );

        totalRulesEvaluated += results.length;
        totalFlagsProduced += results.length;
      }

      // Create batch record
      const duration = Date.now() - startTime;
      const batchResult = await this.createBatchRecord(
        batchId,
        RuleEvaluationTriggerMode.SCHEDULED,
        scheduleId,
        totalRulesEvaluated,
        totalFlagsProduced,
        duration,
        EvaluationBatchStatus.COMPLETED
      );

      // Create schedule run record
      await this.createScheduleRunRecord(
        scheduleId,
        runId,
        ScheduleRunStatus.COMPLETED,
        totalRulesEvaluated,
        totalFlagsProduced,
        duration
      );

      this.logger.info(
        `Scheduled evaluation completed (schedule: ${scheduleId}, batch: ${batchId}, flags: ${totalFlagsProduced}, duration: ${duration}ms)`
      );

      return batchResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Scheduled evaluation failed (schedule: ${scheduleId}, batch: ${batchId}): ${error.message}`
      );

      // Log failure
      await this.createBatchRecord(
        batchId,
        RuleEvaluationTriggerMode.SCHEDULED,
        scheduleId,
        0,
        0,
        duration,
        EvaluationBatchStatus.FAILED,
        error.message
      );

      // Create failed schedule run record
      await this.createScheduleRunRecord(
        scheduleId,
        runId,
        ScheduleRunStatus.FAILED,
        0,
        0,
        duration,
        error.message
      );

      throw error;
    }
  }

  /**
   * Create evaluation schedule
   * 
   * @param config - Schedule configuration
   * @returns Created schedule
   */
  async createSchedule(config: EvaluationScheduleConfig): Promise<any> {
    try {
      this.logger.info(`Creating evaluation schedule: ${config.name}`);

      const schedule = await this.prisma.ruleEvaluationSchedule.create({
        data: {
          schedule_id: uuidv4(),
          name: config.name,
          description: config.description,
          cron_expression: config.cron_expression,
          enabled: config.enabled,
          evaluation_scope: config.evaluation_scope,
          scope_filters: config.scope_filters || {},
          created_by: config.created_by,
        },
      });

      this.logger.info(`Schedule created: ${schedule.schedule_id}`);

      return schedule;
    } catch (error) {
      this.logger.error(`Failed to create schedule: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get evaluation schedule
   * 
   * @param scheduleId - Schedule ID
   * @returns Schedule configuration
   */
  async getSchedule(scheduleId: string): Promise<any> {
    try {
      const schedule = await this.prisma.ruleEvaluationSchedule.findUnique({
        where: { schedule_id: scheduleId },
      });

      if (!schedule) {
        throw new Error(`Schedule not found: ${scheduleId}`);
      }

      return schedule;
    } catch (error) {
      this.logger.error(`Failed to get schedule: ${error.message}`);
      throw error;
    }
  }

  /**
   * List evaluation schedules
   * 
   * @param enabledOnly - Only return enabled schedules
   * @returns List of schedules
   */
  async listSchedules(enabledOnly: boolean = false): Promise<any[]> {
    try {
      const schedules = await this.prisma.ruleEvaluationSchedule.findMany({
        where: enabledOnly ? { enabled: true } : {},
        orderBy: { created_at: 'desc' },
      });

      return schedules;
    } catch (error) {
      this.logger.error(`Failed to list schedules: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get evaluation logs for a batch
   * 
   * @param batchId - Batch ID
   * @returns List of evaluation logs
   */
  async getBatchLogs(batchId: string): Promise<RuleEvaluationLogEntry[]> {
    try {
      const logs = await this.prisma.ruleEvaluationLog.findMany({
        where: { batch_id: batchId },
        orderBy: { created_at: 'asc' },
      });

      return logs;
    } catch (error) {
      this.logger.error(`Failed to get batch logs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get evaluation logs for a user
   * 
   * @param userId - User ID
   * @param limit - Maximum number of logs to return
   * @returns List of evaluation logs
   */
  async getUserLogs(userId: string, limit: number = 100): Promise<RuleEvaluationLogEntry[]> {
    try {
      const logs = await this.prisma.ruleEvaluationLog.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: limit,
      });

      return logs;
    } catch (error) {
      this.logger.error(`Failed to get user logs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get evaluation logs for an auction
   * 
   * @param auctionId - Auction ID
   * @param limit - Maximum number of logs to return
   * @returns List of evaluation logs
   */
  async getAuctionLogs(auctionId: string, limit: number = 100): Promise<RuleEvaluationLogEntry[]> {
    try {
      const logs = await this.prisma.ruleEvaluationLog.findMany({
        where: { auction_id: auctionId },
        orderBy: { created_at: 'desc' },
        take: limit,
      });

      return logs;
    } catch (error) {
      this.logger.error(`Failed to get auction logs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get evaluation statistics
   * 
   * @param timeWindowMinutes - Time window for statistics
   * @returns Evaluation statistics
   */
  async getStatistics(timeWindowMinutes: number = 1440): Promise<any> {
    try {
      const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

      const [
        totalEvaluations,
        totalFlags,
        evaluationsByTrigger,
        flagsByOutput,
      ] = await Promise.all([
        this.prisma.ruleEvaluationLog.count({
          where: { created_at: { gte: since } },
        }),
        this.prisma.ruleEvaluationLog.count({
          where: {
            created_at: { gte: since },
            matched: true,
          },
        }),
        this.prisma.ruleEvaluationLog.groupBy({
          by: ['trigger_mode'],
          where: { created_at: { gte: since } },
          _count: true,
        }),
        this.prisma.ruleEvaluationLog.groupBy({
          by: ['output_type'],
          where: {
            created_at: { gte: since },
            matched: true,
          },
          _count: true,
        }),
      ]);

      return {
        time_window_minutes: timeWindowMinutes,
        total_evaluations: totalEvaluations,
        total_flags: totalFlags,
        evaluations_by_trigger: evaluationsByTrigger,
        flags_by_output: flagsByOutput,
        since,
      };
    } catch (error) {
      this.logger.error(`Failed to get statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Log evaluation results (APPEND-ONLY)
   * 
   * @param batchId - Batch ID
   * @param results - Evaluation results
   * @param context - Evaluation context
   * @param triggerMode - Trigger mode
   * @param triggerSource - Trigger source (schedule ID or admin user ID)
   */
  private async logEvaluationResults(
    batchId: string,
    results: EvaluationResult[],
    context: RuleEvaluationContext,
    triggerMode: RuleEvaluationTriggerMode,
    triggerSource: string
  ): Promise<void> {
    try {
      for (const result of results) {
        await this.prisma.ruleEvaluationLog.create({
          data: {
            evaluation_id: uuidv4(),
            batch_id: batchId,
            trigger_mode: triggerMode,
            trigger_source: triggerSource,
            rule_id: result.rule_id,
            rule_name: result.rule_name,
            matched: true,
            output_type: result.output_type,
            severity: result.severity,
            reason: result.reason,
            user_id: context.user_id,
            actor_type: context.actor_type,
            auction_id: context.auction_id,
            traveler_id: context.traveler_id,
            conditions_evaluated: result.matched_conditions.length,
            conditions_matched: result.matched_conditions.length,
            evaluation_duration_ms: 0, // Will be calculated at batch level
          },
        });
      }

      this.logger.debug(
        `Logged ${results.length} evaluation results for batch ${batchId}`
      );
    } catch (error) {
      this.logger.error(`Failed to log evaluation results: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create batch record (APPEND-ONLY)
   * 
   * @param batchId - Batch ID
   * @param triggerMode - Trigger mode
   * @param triggerSource - Trigger source
   * @param totalRulesEvaluated - Total rules evaluated
   * @param totalFlagsProduced - Total flags produced
   * @param duration - Evaluation duration in milliseconds
   * @param status - Batch status
   * @param errorMessage - Error message (if failed)
   * @returns Batch result
   */
  private async createBatchRecord(
    batchId: string,
    triggerMode: RuleEvaluationTriggerMode,
    triggerSource: string,
    totalRulesEvaluated: number,
    totalFlagsProduced: number,
    duration: number,
    status: EvaluationBatchStatus,
    errorMessage?: string
  ): Promise<EvaluationBatchResult> {
    try {
      const batch = await this.prisma.ruleEvaluationBatch.create({
        data: {
          batch_id: batchId,
          trigger_mode: triggerMode,
          trigger_source: triggerSource,
          total_rules_evaluated: totalRulesEvaluated,
          total_flags_produced: totalFlagsProduced,
          evaluation_duration_ms: duration,
          status,
          error_message: errorMessage,
        },
      });

      return {
        batch_id: batch.batch_id,
        trigger_mode: batch.trigger_mode as RuleEvaluationTriggerMode,
        trigger_source: batch.trigger_source,
        total_rules_evaluated: batch.total_rules_evaluated,
        total_flags_produced: batch.total_flags_produced,
        evaluation_duration_ms: batch.evaluation_duration_ms,
        status: batch.status as EvaluationBatchStatus,
        error_message: batch.error_message || undefined,
        created_at: batch.created_at,
      };
    } catch (error) {
      this.logger.error(`Failed to create batch record: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create schedule run record (APPEND-ONLY)
   * 
   * @param scheduleId - Schedule ID
   * @param runId - Run ID
   * @param status - Run status
   * @param totalRulesEvaluated - Total rules evaluated
   * @param totalFlagsProduced - Total flags produced
   * @param duration - Evaluation duration in milliseconds
   * @param errorMessage - Error message (if failed)
   */
  private async createScheduleRunRecord(
    scheduleId: string,
    runId: string,
    status: ScheduleRunStatus,
    totalRulesEvaluated: number,
    totalFlagsProduced: number,
    duration: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      await this.prisma.ruleEvaluationScheduleRun.create({
        data: {
          schedule_id: scheduleId,
          run_id: runId,
          status,
          total_rules_evaluated: totalRulesEvaluated,
          total_flags_produced: totalFlagsProduced,
          evaluation_duration_ms: duration,
          error_message: errorMessage,
          completed_at: new Date(),
        },
      });

      this.logger.debug(`Schedule run record created: ${runId}`);
    } catch (error) {
      this.logger.error(`Failed to create schedule run record: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build evaluation contexts based on schedule scope
   * 
   * @param schedule - Schedule configuration
   * @returns Array of evaluation contexts
   */
  private async buildEvaluationContexts(schedule: any): Promise<RuleEvaluationContext[]> {
    try {
      if (schedule.evaluation_scope === 'ALL_USERS') {
        // Get all users and create contexts
        const users = await this.prisma.user.findMany({
          select: { id: true },
        });

        return users.map((user) => ({
          user_id: user.id.toString(),
          time_window_minutes: 60,
        }));
      } else if (schedule.evaluation_scope === 'ALL_AUCTIONS') {
        // Get all active auctions and create contexts
        const auctions = await this.prisma.listing.findMany({
          where: { isAuction: true, isActive: true },
          select: { id: true },
        });

        return auctions.map((auction) => ({
          auction_id: auction.id.toString(),
          time_window_minutes: 60,
        }));
      } else if (schedule.evaluation_scope === 'CUSTOM') {
        // Use custom filters from schedule
        const filters = schedule.scope_filters || {};

        if (filters.user_ids && Array.isArray(filters.user_ids)) {
          return filters.user_ids.map((userId: string) => ({
            user_id: userId,
            time_window_minutes: filters.time_window_minutes || 60,
          }));
        }

        if (filters.auction_ids && Array.isArray(filters.auction_ids)) {
          return filters.auction_ids.map((auctionId: string) => ({
            auction_id: auctionId,
            time_window_minutes: filters.time_window_minutes || 60,
          }));
        }

        // Default to empty context if no filters
        return [{ time_window_minutes: 60 }];
      }

      return [];
    } catch (error) {
      this.logger.error(`Failed to build evaluation contexts: ${error.message}`);
      throw error;
    }
  }
}
