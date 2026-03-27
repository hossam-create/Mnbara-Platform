// Executor Service - Executes tasks using plugins
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskExecution, ExecutionStatus, ExecutionContext } from '../types/task.types';
import { PluginRegistry } from '../plugins/registry';
import logger, { createExecutionLogger } from '../utils/logger';

export class ExecutorService {
  private prisma: PrismaClient;
  private plugins: PluginRegistry;

  constructor() {
    this.prisma = new PrismaClient();
    this.plugins = new PluginRegistry();
  }

  async execute(task: Task, triggeredBy: string): Promise<TaskExecution> {
    const executionId = uuidv4();
    const executionLogger = createExecutionLogger(executionId);

    executionLogger.info(`Starting execution of task: ${task.title}`);

    // Create execution record
    const execution = await this.prisma.taskExecution.create({
      data: {
        id: executionId,
        taskId: task.id,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
        triggeredBy
      }
    });

    const startTime = Date.now();

    try {
      // Get plugin
      const plugin = this.plugins.get(task.plugin);
      
      if (!plugin) {
        throw new Error(`Plugin not found: ${task.plugin}`);
      }

      executionLogger.info(`Executing plugin: ${plugin.name}`);

      // Create execution context
      const context: ExecutionContext = {
        taskId: task.id,
        executionId,
        triggeredBy,
        logger: executionLogger
      };

      // Execute plugin
      const result = await plugin.execute(task.params, context);

      const duration = Date.now() - startTime;

      if (result.success) {
        executionLogger.info(`Task completed successfully in ${duration}ms`);

        // Update execution record
        const updated = await this.prisma.taskExecution.update({
          where: { id: executionId },
          data: {
            status: ExecutionStatus.SUCCESS,
            completedAt: new Date(),
            duration,
            result: result.data || {},
            logs: executionLogger.getLogs()
          }
        });

        return updated as TaskExecution;
      } else {
        throw new Error(result.error || 'Plugin execution failed');
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      executionLogger.error(`Task failed: ${error.message}`);

      // Update execution record
      const updated = await this.prisma.taskExecution.update({
        where: { id: executionId },
        data: {
          status: ExecutionStatus.ERROR,
          completedAt: new Date(),
          duration,
          error: error.message,
          logs: executionLogger.getLogs()
        }
      });

      logger.error(`Task execution failed: ${task.title} - ${error.message}`);

      return updated as TaskExecution;
    }
  }

  async getExecution(executionId: string): Promise<TaskExecution | null> {
    const execution = await this.prisma.taskExecution.findUnique({
      where: { id: executionId }
    });

    return execution as TaskExecution | null;
  }

  async getTaskExecutions(taskId: string, limit: number = 50): Promise<TaskExecution[]> {
    const executions = await this.prisma.taskExecution.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return executions as TaskExecution[];
  }

  async abortExecution(executionId: string): Promise<void> {
    await this.prisma.taskExecution.update({
      where: { id: executionId },
      data: {
        status: ExecutionStatus.ABORTED,
        completedAt: new Date(),
        error: 'Execution aborted by user'
      }
    });

    logger.info(`Execution aborted: ${executionId}`);
  }
}
