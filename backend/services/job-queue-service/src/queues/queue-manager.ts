import { Queue, QueueEvents } from 'bullmq';
import { redisConnection } from '../config/redis.config';
import { JobType, JobOptions } from '../types/job.types';
import { logger } from '../utils/logger';

export class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();

  constructor() {
    this.initializeQueues();
  }

  private initializeQueues() {
    Object.values(JobType).forEach(jobType => {
      const queue = new Queue(jobType, {
        connection: redisConnection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          },
          removeOnComplete: 100,
          removeOnFail: 1000
        }
      });

      const queueEvents = new QueueEvents(jobType, {
        connection: redisConnection
      });

      // Event listeners
      queueEvents.on('completed', ({ jobId }) => {
        logger.info(`Job ${jobId} completed in queue ${jobType}`);
      });

      queueEvents.on('failed', ({ jobId, failedReason }) => {
        logger.error(`Job ${jobId} failed in queue ${jobType}: ${failedReason}`);
      });

      this.queues.set(jobType, queue);
      this.queueEvents.set(jobType, queueEvents);
    });

    logger.info('All queues initialized');
  }

  async addJob(queueName: string, data: any, options?: JobOptions) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.add(queueName, data, options);
    logger.info(`Job ${job.id} added to queue ${queueName}`);
    return job;
  }

  async getJob(queueName: string, jobId: string) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return await queue.getJob(jobId);
  }

  async getJobStatus(queueName: string, jobId: string) {
    const job = await this.getJob(queueName, jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    return {
      id: job.id!,
      name: job.name,
      data: job.data,
      progress: job.progress,
      state,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
      failedReason: job.failedReason
    };
  }

  async removeJob(queueName: string, jobId: string) {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.remove();
      logger.info(`Job ${jobId} removed from queue ${queueName}`);
    }
  }

  async getQueueStats(queueName: string) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount()
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed
    };
  }

  async getAllQueuesStats() {
    const stats: Record<string, any> = {};
    
    for (const [name, queue] of this.queues) {
      stats[name] = await this.getQueueStats(name);
    }

    return stats;
  }

  async pauseQueue(queueName: string) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
    logger.info(`Queue ${queueName} paused`);
  }

  async resumeQueue(queueName: string) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
    logger.info(`Queue ${queueName} resumed`);
  }

  async cleanQueue(queueName: string, grace: number = 0, limit: number = 1000) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.clean(grace, limit, 'completed');
    await queue.clean(grace, limit, 'failed');
    logger.info(`Queue ${queueName} cleaned`);
  }

  async close() {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    for (const queueEvents of this.queueEvents.values()) {
      await queueEvents.close();
    }
    logger.info('All queues closed');
  }
}
