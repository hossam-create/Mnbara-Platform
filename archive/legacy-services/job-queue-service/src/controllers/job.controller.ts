import { Request, Response } from 'express';
import { QueueManager } from '../queues/queue-manager';
import { logger } from '../utils/logger';

const queueManager = new QueueManager();

export class JobController {
  async addJob(req: Request, res: Response) {
    try {
      const { queue, data, options } = req.body;

      if (!queue || !data) {
        return res.status(400).json({ error: 'Queue and data required' });
      }

      const job = await queueManager.addJob(queue, data, options);

      res.json({
        id: job.id,
        queue: job.queueName,
        data: job.data,
        timestamp: job.timestamp
      });
    } catch (error: any) {
      logger.error('Add job error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getJobStatus(req: Request, res: Response) {
    try {
      const { queue, jobId } = req.params;

      const status = await queueManager.getJobStatus(queue, jobId);

      if (!status) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json(status);
    } catch (error: any) {
      logger.error('Get job status error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async removeJob(req: Request, res: Response) {
    try {
      const { queue, jobId } = req.params;

      await queueManager.removeJob(queue, jobId);

      res.json({ message: 'Job removed successfully' });
    } catch (error: any) {
      logger.error('Remove job error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getQueueStats(req: Request, res: Response) {
    try {
      const { queue } = req.params;

      const stats = await queueManager.getQueueStats(queue);

      res.json(stats);
    } catch (error: any) {
      logger.error('Get queue stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getAllQueuesStats(req: Request, res: Response) {
    try {
      const stats = await queueManager.getAllQueuesStats();

      res.json(stats);
    } catch (error: any) {
      logger.error('Get all queues stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async pauseQueue(req: Request, res: Response) {
    try {
      const { queue } = req.params;

      await queueManager.pauseQueue(queue);

      res.json({ message: `Queue ${queue} paused` });
    } catch (error: any) {
      logger.error('Pause queue error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async resumeQueue(req: Request, res: Response) {
    try {
      const { queue } = req.params;

      await queueManager.resumeQueue(queue);

      res.json({ message: `Queue ${queue} resumed` });
    } catch (error: any) {
      logger.error('Resume queue error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async cleanQueue(req: Request, res: Response) {
    try {
      const { queue } = req.params;
      const { grace, limit } = req.query;

      await queueManager.cleanQueue(
        queue,
        grace ? parseInt(grace as string) : undefined,
        limit ? parseInt(limit as string) : undefined
      );

      res.json({ message: `Queue ${queue} cleaned` });
    } catch (error: any) {
      logger.error('Clean queue error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}
