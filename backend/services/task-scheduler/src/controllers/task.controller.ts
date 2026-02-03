// Task Controller - HTTP endpoints for task management
import { Request, Response } from 'express';
import { TaskService } from '../services/task.service';
import { ExecutorService } from '../services/executor.service';
import { SchedulerService } from '../services/scheduler.service';
import { CreateTaskDto, UpdateTaskDto } from '../types/task.types';
import logger from '../utils/logger';

export class TaskController {
  private taskService: TaskService;
  private executorService: ExecutorService;
  private schedulerService: SchedulerService;

  constructor(schedulerService: SchedulerService) {
    this.taskService = new TaskService();
    this.executorService = new ExecutorService();
    this.schedulerService = schedulerService;
  }

  async createTask(req: Request, res: Response) {
    try {
      const data: CreateTaskDto = req.body;
      const createdBy = (req as any).user?.id;

      const task = await this.taskService.createTask(data, createdBy);

      // Schedule the task if enabled
      if (task.enabled) {
        await this.schedulerService.scheduleTask(task);
      }

      res.status(201).json({
        success: true,
        data: task
      });
    } catch (error: any) {
      logger.error(`Create task failed: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const task = await this.taskService.getTask(id);

      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task not found'
        });
      }

      res.json({
        success: true,
        data: task
      });
    } catch (error: any) {
      logger.error(`Get task failed: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAllTasks(req: Request, res: Response) {
    try {
      const tasks = await this.taskService.getAllTasks();

      res.json({
        success: true,
        data: tasks
      });
    } catch (error: any) {
      logger.error(`Get all tasks failed: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateTaskDto = req.body;

      const task = await this.taskService.updateTask(id, data);

      // Reschedule the task
      await this.schedulerService.scheduleTask(task);

      res.json({
        success: true,
        data: task
      });
    } catch (error: any) {
      logger.error(`Update task failed: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteTask(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Unschedule first
      await this.schedulerService.unscheduleTask(id);

      // Then delete
      await this.taskService.deleteTask(id);

      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error: any) {
      logger.error(`Delete task failed: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async runTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { params } = req.body;

      const execution = await this.schedulerService.runTaskManually(id, params);

      res.json({
        success: true,
        data: execution
      });
    } catch (error: any) {
      logger.error(`Run task failed: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getTaskExecutions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const executions = await this.executorService.getTaskExecutions(id, limit);

      res.json({
        success: true,
        data: executions
      });
    } catch (error: any) {
      logger.error(`Get task executions failed: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getExecution(req: Request, res: Response) {
    try {
      const { executionId } = req.params;

      const execution = await this.executorService.getExecution(executionId);

      if (!execution) {
        return res.status(404).json({
          success: false,
          error: 'Execution not found'
        });
      }

      res.json({
        success: true,
        data: execution
      });
    } catch (error: any) {
      logger.error(`Get execution failed: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}
