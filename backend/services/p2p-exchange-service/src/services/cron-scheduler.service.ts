/**
 * Cron Scheduler Service
 * Manages all scheduled jobs for the P2P Exchange service
 * 
 * Task: Phase 3.1.8 - Setup matching engine cron job
 */

import { Logger } from '../utils/logger';
import { MatchingEngineJob } from '../jobs/matching-engine.job';
import { MatchingEngineService } from './matching-engine.service';

export class CronSchedulerService {
  private matchingEngineJob: MatchingEngineJob | null = null;
  private isInitialized = false;

  constructor(
    private matchingEngineService: MatchingEngineService,
    private logger: Logger
  ) {}

  /**
   * Initialize all scheduled jobs
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Cron scheduler already initialized');
      return;
    }

    try {
      this.logger.info('Initializing cron scheduler');

      // Initialize matching engine job
      this.matchingEngineJob = new MatchingEngineJob(
        this.matchingEngineService,
        this.logger
      );

      this.isInitialized = true;
      this.logger.info('Cron scheduler initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize cron scheduler', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Start all scheduled jobs
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Cron scheduler not initialized. Call initialize() first.');
    }

    try {
      this.logger.info('Starting all scheduled jobs');

      if (this.matchingEngineJob) {
        this.matchingEngineJob.start();
      }

      this.logger.info('All scheduled jobs started');
    } catch (error) {
      this.logger.error('Failed to start scheduled jobs', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Stop all scheduled jobs
   */
  async stop(): Promise<void> {
    try {
      this.logger.info('Stopping all scheduled jobs');

      if (this.matchingEngineJob) {
        this.matchingEngineJob.stop();
      }

      this.logger.info('All scheduled jobs stopped');
    } catch (error) {
      this.logger.error('Failed to stop scheduled jobs', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get status of all scheduled jobs
   */
  getStatus(): {
    isInitialized: boolean;
    matchingEngine: any;
  } {
    return {
      isInitialized: this.isInitialized,
      matchingEngine: this.matchingEngineJob?.getStatus() || null,
    };
  }

  /**
   * Get matching engine job
   */
  getMatchingEngineJob(): MatchingEngineJob | null {
    return this.matchingEngineJob;
  }

  /**
   * Health check for cron scheduler
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    message: string;
    details: any;
  }> {
    const status = this.getStatus();

    const healthy = status.isInitialized && status.matchingEngine?.isScheduled;

    return {
      healthy,
      message: healthy ? 'Cron scheduler is healthy' : 'Cron scheduler is not healthy',
      details: status,
    };
  }
}
