// Cleanup Plugin - Clean old data from database
import { Plugin, ExecutionContext, PluginResult } from '../types/task.types';
import { PrismaClient } from '@prisma/client';

export class CleanupPlugin implements Plugin {
  name = 'data-cleanup';
  description = 'Clean old data from database (notifications, logs, etc.)';

  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async execute(params: any, context: ExecutionContext): Promise<PluginResult> {
    try {
      context.logger.info('Starting data cleanup');

      const olderThanDays = params.olderThan || 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      let totalDeleted = 0;

      // Clean old task executions
      if (params.cleanExecutions !== false) {
        const deletedExecutions = await this.cleanOldExecutions(cutoffDate, context);
        totalDeleted += deletedExecutions;
      }

      // Clean old notifications (if applicable)
      if (params.cleanNotifications) {
        const deletedNotifications = await this.cleanOldNotifications(cutoffDate, context);
        totalDeleted += deletedNotifications;
      }

      // Clean old logs
      if (params.cleanLogs) {
        const deletedLogs = await this.cleanOldLogs(cutoffDate, context);
        totalDeleted += deletedLogs;
      }

      context.logger.info(`Cleanup completed. Deleted ${totalDeleted} records`);

      return {
        success: true,
        data: {
          deleted: totalDeleted,
          olderThan: olderThanDays,
          cutoffDate
        }
      };

    } catch (error: any) {
      context.logger.error(`Cleanup plugin failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async cleanOldExecutions(cutoffDate: Date, context: ExecutionContext): Promise<number> {
    context.logger.info(`Cleaning task executions older than ${cutoffDate.toISOString()}`);

    const result = await this.prisma.taskExecution.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        },
        status: {
          in: ['SUCCESS', 'ERROR', 'ABORTED']
        }
      }
    });

    context.logger.info(`Deleted ${result.count} old task executions`);
    return result.count;
  }

  private async cleanOldNotifications(cutoffDate: Date, context: ExecutionContext): Promise<number> {
    context.logger.info(`Cleaning notifications older than ${cutoffDate.toISOString()}`);

    // TODO: Implement notification cleanup
    // This would call your notification service or database
    
    return 0;
  }

  private async cleanOldLogs(cutoffDate: Date, context: ExecutionContext): Promise<number> {
    context.logger.info(`Cleaning logs older than ${cutoffDate.toISOString()}`);

    // TODO: Implement log cleanup
    // This could clean log files or database log entries
    
    return 0;
  }
}
