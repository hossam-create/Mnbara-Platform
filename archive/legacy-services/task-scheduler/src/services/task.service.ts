// Task Service - CRUD operations for tasks
import { PrismaClient } from '@prisma/client';
import { Task, CreateTaskDto, UpdateTaskDto } from '../types/task.types';
import logger from '../utils/logger';

export class TaskService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createTask(data: CreateTaskDto, createdBy?: string): Promise<Task> {
    logger.info(`Creating task: ${data.title}`);

    const task = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        plugin: data.plugin,
        params: data.params,
        triggers: data.triggers as any,
        enabled: data.enabled ?? true,
        createdBy
      }
    });

    logger.info(`Task created: ${task.id}`);

    return task as Task;
  }

  async getTask(id: string): Promise<Task | null> {
    const task = await this.prisma.task.findUnique({
      where: { id }
    });

    return task as Task | null;
  }

  async getAllTasks(): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return tasks as Task[];
  }

  async getEnabledTasks(): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: { enabled: true },
      orderBy: { createdAt: 'desc' }
    });

    return tasks as Task[];
  }

  async updateTask(id: string, data: UpdateTaskDto): Promise<Task> {
    logger.info(`Updating task: ${id}`);

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        params: data.params,
        triggers: data.triggers as any,
        enabled: data.enabled
      }
    });

    logger.info(`Task updated: ${id}`);

    return task as Task;
  }

  async deleteTask(id: string): Promise<void> {
    logger.info(`Deleting task: ${id}`);

    await this.prisma.task.delete({
      where: { id }
    });

    logger.info(`Task deleted: ${id}`);
  }

  async enableTask(id: string): Promise<Task> {
    return await this.updateTask(id, { enabled: true });
  }

  async disableTask(id: string): Promise<Task> {
    return await this.updateTask(id, { enabled: false });
  }

  async getTasksByPlugin(plugin: string): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: { plugin },
      orderBy: { createdAt: 'desc' }
    });

    return tasks as Task[];
  }
}
