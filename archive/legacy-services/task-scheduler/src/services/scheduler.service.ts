// Scheduler Service - Core scheduling engine inspired by xyOps
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { Task, Trigger } from '../types/task.types';
import { ExecutorService } from './executor.service';
import logger from '../utils/logger';

export class SchedulerService {
  private prisma: PrismaClient;
  private executor: ExecutorService;
  private scheduledTasks: Map<string, cron.ScheduledTask | NodeJS.Timeout>;
  private isRunning: boolean = false;

  constructor() {
    this.prisma = new PrismaClient();
    this.executor = new ExecutorService();
    this.scheduledTasks = new Map();
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Scheduler already running');
      return;
    }

    logger.info('Starting Task Scheduler...');
    this.isRunning = true;

    // Load all enabled tasks
    const tasks = await this.loadEnabledTasks();
    logger.info(`Loaded ${tasks.length} enabled tasks`);

    // Schedule each task
    for (const task of tasks) {
      await this.scheduleTask(task);
    }

    logger.info('Task Scheduler started successfully');
  }

  async stop() {
    logger.info('Stopping Task Scheduler...');
    this.isRunning = false;

    // Stop all scheduled tasks
    for (const [taskId, scheduled] of this.scheduledTasks.entries()) {
      this.stopScheduledTask(taskId, scheduled);
    }

    this.scheduledTasks.clear();
    await this.prisma.$disconnect();

    logger.info('Task Scheduler stopped');
  }

  async scheduleTask(task: Task) {
    logger.info(`Scheduling task: ${task.title} (${task.id})`);

    // Remove existing schedules for this task
    await this.unscheduleTask(task.id);

    if (!task.enabled) {
      logger.info(`Task ${task.id} is disabled, skipping`);
      return;
    }

    // Schedule each enabled trigger
    for (const trigger of task.triggers) {
      if (!trigger.enabled) continue;

      try {
        if (trigger.type === 'schedule') {
          await this.scheduleWithCron(task, trigger);
        } else if (trigger.type === 'interval') {
          await this.scheduleWithInterval(task, trigger);
        }
      } catch (error: any) {
        logger.error(`Failed to schedule task ${task.id}: ${error.message}`);
      }
    }
  }

  async unscheduleTask(taskId: string) {
    const keys = Array.from(this.scheduledTasks.keys()).filter(k => k.startsWith(taskId));
    
    for (const key of keys) {
      const scheduled = this.scheduledTasks.get(key);
      if (scheduled) {
        this.stopScheduledTask(key, scheduled);
        this.scheduledTasks.delete(key);
      }
    }
  }

  private async scheduleWithCron(task: Task, trigger: Trigger) {
    const cronExpression = this.buildCronExpression(trigger);
    
    if (!cron.validate(cronExpression)) {
      logger.error(`Invalid cron expression for task ${task.id}: ${cronExpression}`);
      return;
    }

    logger.info(`Scheduling task ${task.id} with cron: ${cronExpression}`);

    const scheduled = cron.schedule(cronExpression, async () => {
      logger.info(`Cron trigger fired for task: ${task.title}`);
      await this.executor.execute(task, 'schedule');
    });

    this.scheduledTasks.set(`${task.id}-cron`, scheduled);
  }

  private async scheduleWithInterval(task: Task, trigger: Trigger) {
    const intervalMinutes = trigger.interval || 60;
    const intervalMs = intervalMinutes * 60 * 1000;

    logger.info(`Scheduling task ${task.id} with interval: ${intervalMinutes} minutes`);

    const intervalId = setInterval(async () => {
      logger.info(`Interval trigger fired for task: ${task.title}`);
      await this.executor.execute(task, 'interval');
    }, intervalMs);

    this.scheduledTasks.set(`${task.id}-interval`, intervalId);
  }

  private buildCronExpression(trigger: Trigger): string {
    // Build cron expression from trigger
    // Format: minute hour day month weekday
    const minutes = trigger.minutes?.join(',') || '*';
    const hours = trigger.hours?.join(',') || '*';
    const days = trigger.days?.join(',') || '*';
    const months = trigger.months?.join(',') || '*';
    const weekdays = trigger.weekdays?.join(',') || '*';

    return `${minutes} ${hours} ${days} ${months} ${weekdays}`;
  }

  private stopScheduledTask(key: string, scheduled: cron.ScheduledTask | NodeJS.Timeout) {
    if ('stop' in scheduled && typeof scheduled.stop === 'function') {
      // It's a cron.ScheduledTask
      scheduled.stop();
    } else {
      // It's a NodeJS.Timeout
      clearInterval(scheduled as NodeJS.Timeout);
    }
    logger.info(`Stopped scheduled task: ${key}`);
  }

  private async loadEnabledTasks(): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: { enabled: true }
    });

    return tasks.map(task => ({
      ...task,
      params: task.params as Record<string, any>,
      triggers: task.triggers as any[]
    }));
  }

  // Public API for manual task execution
  async runTaskManually(taskId: string, overrideParams?: Record<string, any>) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const taskData: Task = {
      ...task,
      params: overrideParams || (task.params as Record<string, any>),
      triggers: task.triggers as any[]
    };

    return await this.executor.execute(taskData, 'manual');
  }
}
