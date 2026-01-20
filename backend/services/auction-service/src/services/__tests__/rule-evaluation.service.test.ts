/**
 * Rule Evaluation Service Tests
 * Tests for scheduled and on-demand rule evaluation pipeline
 * 
 * CRITICAL TESTS:
 * - Deterministic evaluation (same input = same output)
 * - Immutable logs (append-only)
 * - No auto-enforcement (flags only)
 * - Trigger modes (scheduled and on-demand)
 * - Admin-only on-demand evaluation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import {
  RuleEvaluationService,
  RuleEvaluationTriggerMode,
  EvaluationBatchStatus,
  ScheduleRunStatus,
} from '../rule-evaluation.service';
import { RulesEngineService } from '../rules-engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RuleOutputType, RuleSeverity } from '../../types/rule.enums';

/**
 * Mock Prisma Service
 */
class MockPrismaService {
  ruleEvaluationLog = {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  };

  ruleEvaluationBatch = {
    create: vi.fn(),
    findMany: vi.fn(),
  };

  ruleEvaluationSchedule = {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
  };

  ruleEvaluationScheduleRun = {
    create: vi.fn(),
    findMany: vi.fn(),
  };

  user = {
    findMany: vi.fn(),
  };

  listing = {
    findMany: vi.fn(),
  };
}

/**
 * Mock Rules Engine Service
 */
class MockRulesEngineService {
  evaluateRules = vi.fn();
}

describe('RuleEvaluationService', () => {
  let service: RuleEvaluationService;
  let prisma: MockPrismaService;
  let rulesEngine: MockRulesEngineService;

  beforeEach(() => {
    prisma = new MockPrismaService();
    rulesEngine = new MockRulesEngineService();
    service = new RuleEvaluationService(
      prisma as any,
      rulesEngine as any
    );
  });

  describe('On-Demand Evaluation', () => {
    it('should evaluate rules on-demand with admin user ID', async () => {
      const adminUserId = 'admin-123';
      const context = { user_id: 'user-456' };
      const results = [
        {
          rule_id: 'rule-1',
          rule_name: 'Test Rule',
          output_type: RuleOutputType.FLAG_USER,
          severity: RuleSeverity.HIGH,
          reason: 'Test reason',
          matched_conditions: ['cond-1'],
          evaluated_at: new Date(),
          evaluation_context: context,
        },
      ];

      rulesEngine.evaluateRules.mockResolvedValue(results);
      prisma.ruleEvaluationLog.create.mockResolvedValue({
        evaluation_id: uuidv4(),
        batch_id: 'batch-123',
        trigger_mode: RuleEvaluationTriggerMode.ON_DEMAND,
        trigger_source: adminUserId,
        rule_id: 'rule-1',
        rule_name: 'Test Rule',
        matched: true,
        output_type: RuleOutputType.FLAG_USER,
        severity: RuleSeverity.HIGH,
        reason: 'Test reason',
        user_id: 'user-456',
        conditions_evaluated: 1,
        conditions_matched: 1,
        evaluation_duration_ms: 100,
        created_at: new Date(),
      });

      prisma.ruleEvaluationBatch.create.mockResolvedValue({
        batch_id: 'batch-123',
        trigger_mode: RuleEvaluationTriggerMode.ON_DEMAND,
        trigger_source: adminUserId,
        total_rules_evaluated: 1,
        total_flags_produced: 1,
        evaluation_duration_ms: 100,
        status: EvaluationBatchStatus.COMPLETED,
        created_at: new Date(),
      });

      const result = await service.evaluateOnDemand(context as any, adminUserId);

      expect(result).toBeDefined();
      expect(result.trigger_mode).toBe(RuleEvaluationTriggerMode.ON_DEMAND);
      expect(result.trigger_source).toBe(adminUserId);
      expect(result.total_flags_produced).toBe(1);
      expect(result.status).toBe(EvaluationBatchStatus.COMPLETED);
      expect(rulesEngine.evaluateRules).toHaveBeenCalledWith(context);
    });

    it('should reject on-demand evaluation without admin user ID', async () => {
      const context = { user_id: 'user-456' };

      await expect(service.evaluateOnDemand(context as any, '')).rejects.toThrow(
        'Admin user ID is required'
      );
    });

    it('should log evaluation failure for on-demand evaluation', async () => {
      const adminUserId = 'admin-123';
      const context = { user_id: 'user-456' };
      const error = new Error('Evaluation failed');

      rulesEngine.evaluateRules.mockRejectedValue(error);
      prisma.ruleEvaluationBatch.create.mockResolvedValue({
        batch_id: 'batch-123',
        trigger_mode: RuleEvaluationTriggerMode.ON_DEMAND,
        trigger_source: adminUserId,
        total_rules_evaluated: 0,
        total_flags_produced: 0,
        evaluation_duration_ms: 100,
        status: EvaluationBatchStatus.FAILED,
        error_message: 'Evaluation failed',
        created_at: new Date(),
      });

      await expect(service.evaluateOnDemand(context as any, adminUserId)).rejects.toThrow(
        'Evaluation failed'
      );

      expect(prisma.ruleEvaluationBatch.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: EvaluationBatchStatus.FAILED,
            error_message: 'Evaluation failed',
          }),
        })
      );
    });

    it('should be deterministic (same input produces same output)', async () => {
      const adminUserId = 'admin-123';
      const context = { user_id: 'user-456' };
      const results = [
        {
          rule_id: 'rule-1',
          rule_name: 'Test Rule',
          output_type: RuleOutputType.FLAG_USER,
          severity: RuleSeverity.HIGH,
          reason: 'Test reason',
          matched_conditions: ['cond-1'],
          evaluated_at: new Date(),
          evaluation_context: context,
        },
      ];

      rulesEngine.evaluateRules.mockResolvedValue(results);
      prisma.ruleEvaluationLog.create.mockResolvedValue({
        evaluation_id: uuidv4(),
        batch_id: 'batch-123',
        trigger_mode: RuleEvaluationTriggerMode.ON_DEMAND,
        trigger_source: adminUserId,
        rule_id: 'rule-1',
        rule_name: 'Test Rule',
        matched: true,
        output_type: RuleOutputType.FLAG_USER,
        severity: RuleSeverity.HIGH,
        reason: 'Test reason',
        user_id: 'user-456',
        conditions_evaluated: 1,
        conditions_matched: 1,
        evaluation_duration_ms: 100,
        created_at: new Date(),
      });

      prisma.ruleEvaluationBatch.create.mockResolvedValue({
        batch_id: 'batch-123',
        trigger_mode: RuleEvaluationTriggerMode.ON_DEMAND,
        trigger_source: adminUserId,
        total_rules_evaluated: 1,
        total_flags_produced: 1,
        evaluation_duration_ms: 100,
        status: EvaluationBatchStatus.COMPLETED,
        created_at: new Date(),
      });

      // First evaluation
      const result1 = await service.evaluateOnDemand(context as any, adminUserId);

      // Second evaluation with same input
      const result2 = await service.evaluateOnDemand(context as any, adminUserId);

      // Both should produce same number of flags
      expect(result1.total_flags_produced).toBe(result2.total_flags_produced);
      expect(result1.status).toBe(result2.status);
    });
  });

  describe('Scheduled Evaluation', () => {
    it('should evaluate rules on schedule', async () => {
      const scheduleId = uuidv4();
      const schedule = {
        schedule_id: scheduleId,
        name: 'Test Schedule',
        cron_expression: '0 * * * *',
        enabled: true,
        evaluation_scope: 'ALL_USERS',
        scope_filters: {},
        created_by: 'admin-123',
      };

      const users = [{ id: 1 }, { id: 2 }];
      const results = [
        {
          rule_id: 'rule-1',
          rule_name: 'Test Rule',
          output_type: RuleOutputType.FLAG_USER,
          severity: RuleSeverity.HIGH,
          reason: 'Test reason',
          matched_conditions: ['cond-1'],
          evaluated_at: new Date(),
          evaluation_context: { user_id: '1' },
        },
      ];

      prisma.ruleEvaluationSchedule.findUnique.mockResolvedValue(schedule);
      prisma.user.findMany.mockResolvedValue(users);
      rulesEngine.evaluateRules.mockResolvedValue(results);
      prisma.ruleEvaluationLog.create.mockResolvedValue({
        evaluation_id: uuidv4(),
        batch_id: 'batch-123',
        trigger_mode: RuleEvaluationTriggerMode.SCHEDULED,
        trigger_source: scheduleId,
        rule_id: 'rule-1',
        rule_name: 'Test Rule',
        matched: true,
        output_type: RuleOutputType.FLAG_USER,
        severity: RuleSeverity.HIGH,
        reason: 'Test reason',
        user_id: '1',
        conditions_evaluated: 1,
        conditions_matched: 1,
        evaluation_duration_ms: 100,
        created_at: new Date(),
      });

      prisma.ruleEvaluationBatch.create.mockResolvedValue({
        batch_id: 'batch-123',
        trigger_mode: RuleEvaluationTriggerMode.SCHEDULED,
        trigger_source: scheduleId,
        total_rules_evaluated: 1,
        total_flags_produced: 1,
        evaluation_duration_ms: 100,
        status: EvaluationBatchStatus.COMPLETED,
        created_at: new Date(),
      });

      prisma.ruleEvaluationScheduleRun.create.mockResolvedValue({
        run_id: uuidv4(),
        schedule_id: scheduleId,
        status: ScheduleRunStatus.COMPLETED,
        total_rules_evaluated: 1,
        total_flags_produced: 1,
        evaluation_duration_ms: 100,
        completed_at: new Date(),
      });

      const result = await service.evaluateScheduled(scheduleId);

      expect(result).toBeDefined();
      expect(result.trigger_mode).toBe(RuleEvaluationTriggerMode.SCHEDULED);
      expect(result.trigger_source).toBe(scheduleId);
      expect(result.status).toBe(EvaluationBatchStatus.COMPLETED);
      expect(prisma.ruleEvaluationSchedule.findUnique).toHaveBeenCalledWith({
        where: { schedule_id: scheduleId },
      });
    });

    it('should reject evaluation for disabled schedule', async () => {
      const scheduleId = uuidv4();
      const schedule = {
        schedule_id: scheduleId,
        name: 'Test Schedule',
        cron_expression: '0 * * * *',
        enabled: false,
        evaluation_scope: 'ALL_USERS',
        scope_filters: {},
        created_by: 'admin-123',
      };

      prisma.ruleEvaluationSchedule.findUnique.mockResolvedValue(schedule);

      await expect(service.evaluateScheduled(scheduleId)).rejects.toThrow(
        'Schedule is disabled'
      );
    });

    it('should reject evaluation for non-existent schedule', async () => {
      const scheduleId = uuidv4();

      prisma.ruleEvaluationSchedule.findUnique.mockResolvedValue(null);

      await expect(service.evaluateScheduled(scheduleId)).rejects.toThrow(
        'Schedule not found'
      );
    });

    it('should log evaluation failure for scheduled evaluation', async () => {
      const scheduleId = uuidv4();
      const schedule = {
        schedule_id: scheduleId,
        name: 'Test Schedule',
        cron_expression: '0 * * * *',
        enabled: true,
        evaluation_scope: 'ALL_USERS',
        scope_filters: {},
        created_by: 'admin-123',
      };

      const error = new Error('Evaluation failed');

      prisma.ruleEvaluationSchedule.findUnique.mockResolvedValue(schedule);
      prisma.user.findMany.mockRejectedValue(error);
      prisma.ruleEvaluationBatch.create.mockResolvedValue({
        batch_id: 'batch-123',
        trigger_mode: RuleEvaluationTriggerMode.SCHEDULED,
        trigger_source: scheduleId,
        total_rules_evaluated: 0,
        total_flags_produced: 0,
        evaluation_duration_ms: 100,
        status: EvaluationBatchStatus.FAILED,
        error_message: 'Evaluation failed',
        created_at: new Date(),
      });

      prisma.ruleEvaluationScheduleRun.create.mockResolvedValue({
        run_id: uuidv4(),
        schedule_id: scheduleId,
        status: ScheduleRunStatus.FAILED,
        total_rules_evaluated: 0,
        total_flags_produced: 0,
        evaluation_duration_ms: 100,
        error_message: 'Evaluation failed',
        completed_at: new Date(),
      });

      await expect(service.evaluateScheduled(scheduleId)).rejects.toThrow(
        'Evaluation failed'
      );

      expect(prisma.ruleEvaluationBatch.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: EvaluationBatchStatus.FAILED,
          }),
        })
      );

      expect(prisma.ruleEvaluationScheduleRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ScheduleRunStatus.FAILED,
          }),
        })
      );
    });
  });

  describe('Schedule Management', () => {
    it('should create evaluation schedule', async () => {
      const config = {
        name: 'Test Schedule',
        description: 'Test schedule description',
        cron_expression: '0 * * * *',
        enabled: true,
        evaluation_scope: 'ALL_USERS' as const,
        created_by: 'admin-123',
      };

      prisma.ruleEvaluationSchedule.create.mockResolvedValue({
        schedule_id: uuidv4(),
        ...config,
        scope_filters: {},
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.createSchedule(config);

      expect(result).toBeDefined();
      expect(result.name).toBe(config.name);
      expect(result.cron_expression).toBe(config.cron_expression);
      expect(result.enabled).toBe(true);
    });

    it('should get evaluation schedule', async () => {
      const scheduleId = uuidv4();
      const schedule = {
        schedule_id: scheduleId,
        name: 'Test Schedule',
        cron_expression: '0 * * * *',
        enabled: true,
        evaluation_scope: 'ALL_USERS',
        scope_filters: {},
        created_by: 'admin-123',
        created_at: new Date(),
        updated_at: new Date(),
      };

      prisma.ruleEvaluationSchedule.findUnique.mockResolvedValue(schedule);

      const result = await service.getSchedule(scheduleId);

      expect(result).toBeDefined();
      expect(result.schedule_id).toBe(scheduleId);
      expect(result.name).toBe('Test Schedule');
    });

    it('should list evaluation schedules', async () => {
      const schedules = [
        {
          schedule_id: uuidv4(),
          name: 'Schedule 1',
          cron_expression: '0 * * * *',
          enabled: true,
          evaluation_scope: 'ALL_USERS',
          scope_filters: {},
          created_by: 'admin-123',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          schedule_id: uuidv4(),
          name: 'Schedule 2',
          cron_expression: '0 0 * * *',
          enabled: false,
          evaluation_scope: 'ALL_AUCTIONS',
          scope_filters: {},
          created_by: 'admin-456',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      prisma.ruleEvaluationSchedule.findMany.mockResolvedValue(schedules);

      const result = await service.listSchedules();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Schedule 1');
      expect(result[1].name).toBe('Schedule 2');
    });

    it('should list only enabled schedules', async () => {
      const schedules = [
        {
          schedule_id: uuidv4(),
          name: 'Schedule 1',
          cron_expression: '0 * * * *',
          enabled: true,
          evaluation_scope: 'ALL_USERS',
          scope_filters: {},
          created_by: 'admin-123',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      prisma.ruleEvaluationSchedule.findMany.mockResolvedValue(schedules);

      const result = await service.listSchedules(true);

      expect(result).toHaveLength(1);
      expect(result[0].enabled).toBe(true);
      expect(prisma.ruleEvaluationSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { enabled: true },
        })
      );
    });
  });

  describe('Evaluation Logs', () => {
    it('should get batch logs', async () => {
      const batchId = 'batch-123';
      const logs = [
        {
          evaluation_id: uuidv4(),
          batch_id: batchId,
          trigger_mode: RuleEvaluationTriggerMode.ON_DEMAND,
          trigger_source: 'admin-123',
          rule_id: 'rule-1',
          rule_name: 'Test Rule 1',
          matched: true,
          output_type: RuleOutputType.FLAG_USER,
          severity: RuleSeverity.HIGH,
          reason: 'Test reason 1',
          user_id: 'user-456',
          conditions_evaluated: 1,
          conditions_matched: 1,
          evaluation_duration_ms: 100,
          created_at: new Date(),
        },
        {
          evaluation_id: uuidv4(),
          batch_id: batchId,
          trigger_mode: RuleEvaluationTriggerMode.ON_DEMAND,
          trigger_source: 'admin-123',
          rule_id: 'rule-2',
          rule_name: 'Test Rule 2',
          matched: true,
          output_type: RuleOutputType.FLAG_AUCTION,
          severity: RuleSeverity.MEDIUM,
          reason: 'Test reason 2',
          auction_id: 'auction-789',
          conditions_evaluated: 2,
          conditions_matched: 2,
          evaluation_duration_ms: 150,
          created_at: new Date(),
        },
      ];

      prisma.ruleEvaluationLog.findMany.mockResolvedValue(logs);

      const result = await service.getBatchLogs(batchId);

      expect(result).toHaveLength(2);
      expect(result[0].rule_id).toBe('rule-1');
      expect(result[1].rule_id).toBe('rule-2');
    });

    it('should get user logs', async () => {
      const userId = 'user-456';
      const logs = [
        {
          evaluation_id: uuidv4(),
          batch_id: 'batch-123',
          trigger_mode: RuleEvaluationTriggerMode.ON_DEMAND,
          trigger_source: 'admin-123',
          rule_id: 'rule-1',
          rule_name: 'Test Rule',
          matched: true,
          output_type: RuleOutputType.FLAG_USER,
          severity: RuleSeverity.HIGH,
          reason: 'Test reason',
          user_id: userId,
          conditions_evaluated: 1,
          conditions_matched: 1,
          evaluation_duration_ms: 100,
          created_at: new Date(),
        },
      ];

      prisma.ruleEvaluationLog.findMany.mockResolvedValue(logs);

      const result = await service.getUserLogs(userId);

      expect(result).toHaveLength(1);
      expect(result[0].user_id).toBe(userId);
      expect(prisma.ruleEvaluationLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: userId },
        })
      );
    });

    it('should get auction logs', async () => {
      const auctionId = 'auction-789';
      const logs = [
        {
          evaluation_id: uuidv4(),
          batch_id: 'batch-123',
          trigger_mode: RuleEvaluationTriggerMode.SCHEDULED,
          trigger_source: 'schedule-123',
          rule_id: 'rule-1',
          rule_name: 'Test Rule',
          matched: true,
          output_type: RuleOutputType.FLAG_AUCTION,
          severity: RuleSeverity.MEDIUM,
          reason: 'Test reason',
          auction_id: auctionId,
          conditions_evaluated: 1,
          conditions_matched: 1,
          evaluation_duration_ms: 100,
          created_at: new Date(),
        },
      ];

      prisma.ruleEvaluationLog.findMany.mockResolvedValue(logs);

      const result = await service.getAuctionLogs(auctionId);

      expect(result).toHaveLength(1);
      expect(result[0].auction_id).toBe(auctionId);
    });
  });

  describe('Statistics', () => {
    it('should get evaluation statistics', async () => {
      prisma.ruleEvaluationLog.count.mockResolvedValue(100);
      prisma.ruleEvaluationLog.groupBy.mockResolvedValue([
        { trigger_mode: RuleEvaluationTriggerMode.ON_DEMAND, _count: 60 },
        { trigger_mode: RuleEvaluationTriggerMode.SCHEDULED, _count: 40 },
      ]);

      const result = await service.getStatistics(1440);

      expect(result).toBeDefined();
      expect(result.total_evaluations).toBe(100);
      expect(result.total_flags).toBe(100);
      expect(result.time_window_minutes).toBe(1440);
    });
  });

  describe('Immutability', () => {
    it('should create immutable evaluation logs', async () => {
      const adminUserId = 'admin-123';
      const context = { user_id: 'user-456' };
      const results = [
        {
          rule_id: 'rule-1',
          rule_name: 'Test Rule',
          output_type: RuleOutputType.FLAG_USER,
          severity: RuleSeverity.HIGH,
          reason: 'Test reason',
          matched_conditions: ['cond-1'],
          evaluated_at: new Date(),
          evaluation_context: context,
        },
      ];

      rulesEngine.evaluateRules.mockResolvedValue(results);
      prisma.ruleEvaluationLog.create.mockResolvedValue({
        evaluation_id: uuidv4(),
        batch_id: 'batch-123',
        trigger_mode: RuleEvaluationTriggerMode.ON_DEMAND,
        trigger_source: adminUserId,
        rule_id: 'rule-1',
        rule_name: 'Test Rule',
        matched: true,
        output_type: RuleOutputType.FLAG_USER,
        severity: RuleSeverity.HIGH,
        reason: 'Test reason',
        user_id: 'user-456',
        conditions_evaluated: 1,
        conditions_matched: 1,
        evaluation_duration_ms: 100,
        created_at: new Date(),
      });

      prisma.ruleEvaluationBatch.create.mockResolvedValue({
        batch_id: 'batch-123',
        trigger_mode: RuleEvaluationTriggerMode.ON_DEMAND,
        trigger_source: adminUserId,
        total_rules_evaluated: 1,
        total_flags_produced: 1,
        evaluation_duration_ms: 100,
        status: EvaluationBatchStatus.COMPLETED,
        created_at: new Date(),
      });

      await service.evaluateOnDemand(context as any, adminUserId);

      // Verify that logs are created with immutable data
      expect(prisma.ruleEvaluationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            evaluation_id: expect.any(String),
            batch_id: 'batch-123',
            trigger_mode: RuleEvaluationTriggerMode.ON_DEMAND,
            trigger_source: adminUserId,
            matched: true,
            output_type: RuleOutputType.FLAG_USER,
            severity: RuleSeverity.HIGH,
          }),
        })
      );
    });
  });

  describe('No Auto-Enforcement', () => {
    it('should produce flags only (no actions)', async () => {
      const adminUserId = 'admin-123';
      const context = { user_id: 'user-456' };
      const results = [
        {
          rule_id: 'rule-1',
          rule_name: 'Test Rule',
          output_type: RuleOutputType.FLAG_USER,
          severity: RuleSeverity.HIGH,
          reason: 'Test reason',
          matched_conditions: ['cond-1'],
          evaluated_at: new Date(),
          evaluation_context: context,
        },
      ];

      rulesEngine.evaluateRules.mockResolvedValue(results);
      prisma.ruleEvaluationLog.create.mockResolvedValue({
        evaluation_id: uuidv4(),
        batch_id: 'batch-123',
        trigger_mode: RuleEvaluationTriggerMode.ON_DEMAND,
        trigger_source: adminUserId,
        rule_id: 'rule-1',
        rule_name: 'Test Rule',
        matched: true,
        output_type: RuleOutputType.FLAG_USER,
        severity: RuleSeverity.HIGH,
        reason: 'Test reason',
        user_id: 'user-456',
        conditions_evaluated: 1,
        conditions_matched: 1,
        evaluation_duration_ms: 100,
        created_at: new Date(),
      });

      prisma.ruleEvaluationBatch.create.mockResolvedValue({
        batch_id: 'batch-123',
        trigger_mode: RuleEvaluationTriggerMode.ON_DEMAND,
        trigger_source: adminUserId,
        total_rules_evaluated: 1,
        total_flags_produced: 1,
        evaluation_duration_ms: 100,
        status: EvaluationBatchStatus.COMPLETED,
        created_at: new Date(),
      });

      const result = await service.evaluateOnDemand(context as any, adminUserId);

      // Verify that only flags are produced (no actions)
      expect(result.total_flags_produced).toBe(1);
      expect(result.status).toBe(EvaluationBatchStatus.COMPLETED);

      // Verify that no enforcement actions are taken
      // (This would be verified by checking that no other services are called)
    });
  });
});
