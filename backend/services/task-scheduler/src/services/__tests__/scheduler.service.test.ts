// Scheduler Service Tests
import { SchedulerService } from '../scheduler.service';
import { Task, Trigger } from '../../types/task.types';

describe('SchedulerService', () => {
  let schedulerService: SchedulerService;

  beforeEach(() => {
    schedulerService = new SchedulerService();
  });

  afterEach(async () => {
    await schedulerService.stop();
  });

  describe('buildCronExpression', () => {
    it('should build cron expression from trigger', () => {
      const trigger: Trigger = {
        type: 'schedule',
        enabled: true,
        hours: [9, 17],
        minutes: [0, 30]
      };

      // Access private method for testing
      const expression = (schedulerService as any).buildCronExpression(trigger);
      
      expect(expression).toBe('0,30 9,17 * * *');
    });

    it('should use wildcards for undefined fields', () => {
      const trigger: Trigger = {
        type: 'schedule',
        enabled: true,
        hours: [12]
      };

      const expression = (schedulerService as any).buildCronExpression(trigger);
      
      expect(expression).toBe('* 12 * * *');
    });
  });

  describe('scheduleTask', () => {
    it('should schedule a task with cron trigger', async () => {
      const task: Task = {
        id: 'test-task-1',
        title: 'Test Task',
        plugin: 'notification',
        params: {},
        enabled: true,
        triggers: [
          {
            type: 'schedule',
            enabled: true,
            hours: [9],
            minutes: [0]
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await schedulerService.scheduleTask(task);

      // Verify task is scheduled
      const scheduledTasks = (schedulerService as any).scheduledTasks;
      expect(scheduledTasks.has('test-task-1-cron')).toBe(true);
    });

    it('should schedule a task with interval trigger', async () => {
      const task: Task = {
        id: 'test-task-2',
        title: 'Test Task',
        plugin: 'notification',
        params: {},
        enabled: true,
        triggers: [
          {
            type: 'interval',
            enabled: true,
            interval: 60
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await schedulerService.scheduleTask(task);

      // Verify task is scheduled
      const scheduledTasks = (schedulerService as any).scheduledTasks;
      expect(scheduledTasks.has('test-task-2-interval')).toBe(true);
    });

    it('should not schedule disabled task', async () => {
      const task: Task = {
        id: 'test-task-3',
        title: 'Test Task',
        plugin: 'notification',
        params: {},
        enabled: false,
        triggers: [
          {
            type: 'schedule',
            enabled: true,
            hours: [9],
            minutes: [0]
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await schedulerService.scheduleTask(task);

      // Verify task is not scheduled
      const scheduledTasks = (schedulerService as any).scheduledTasks;
      expect(scheduledTasks.size).toBe(0);
    });
  });

  describe('unscheduleTask', () => {
    it('should unschedule a task', async () => {
      const task: Task = {
        id: 'test-task-4',
        title: 'Test Task',
        plugin: 'notification',
        params: {},
        enabled: true,
        triggers: [
          {
            type: 'schedule',
            enabled: true,
            hours: [9],
            minutes: [0]
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await schedulerService.scheduleTask(task);
      await schedulerService.unscheduleTask('test-task-4');

      // Verify task is unscheduled
      const scheduledTasks = (schedulerService as any).scheduledTasks;
      expect(scheduledTasks.has('test-task-4-cron')).toBe(false);
    });
  });
});
