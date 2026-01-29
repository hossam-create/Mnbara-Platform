/**
 * Matching Engine Cron Job
 * Runs every 30 seconds to automatically match compatible exchange requests
 * 
 * Task: Phase 3.1.8 - Setup matching engine cron job
 */

import * as cron from 'node-cron';
import { Logger } from '../utils/logger';
import { MatchingEngineService } from '../services/matching-engine.service';

export class MatchingEngineJob {
  private task: cron.ScheduledTask | null = null;
  private isRunning = false;
  private lastRunTime: Date | null = null;
  private runCount = 0;
  private errorCount = 0;

  constructor(
    private matchingEngineService: MatchingEngineService,
    private logger: Logger
  ) {}

  /**
   * Start the matching engine cron job
   * Runs every 30 seconds
   */
  start(): void {
    if (this.task) {
      this.logger.warn('Matching engine job already running');
      return;
    }

    // Schedule to run every 30 seconds
    // Cron format: second minute hour day month dayOfWeek
    // */30 * * * * * = every 30 seconds
    this.task = cron.schedule('*/30 * * * * *', async () => {
      await this.execute();
    });

    this.logger.info('Matching engine job started (every 30 seconds)');
  }

  /**
   * Stop the matching engine cron job
   */
  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      this.logger.info('Matching engine job stopped');
    }
  }

  /**
   * Execute the matching engine
   * This is called every 30 seconds
   */
  private async execute(): Promise<void> {
    // Prevent concurrent executions
    if (this.isRunning) {
      this.logger.debug('Matching engine already running, skipping this cycle');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    this.lastRunTime = new Date();

    try {
      this.logger.debug('Starting matching engine cycle');

      // Run the matching algorithm
      const result = await this.matchingEngineService.runMatching();

      const duration = Date.now() - startTime;
      this.runCount++;

      this.logger.info('Matching engine cycle completed', {
        duration: `${duration}ms`,
        matchesCreated: result.matchesCreated,
        requestsProcessed: result.requestsProcessed,
        cycleNumber: this.runCount,
      });

      // Log metrics
      this.logMetrics(result, duration);
    } catch (error) {
      this.errorCount++;
      const duration = Date.now() - startTime;

      this.logger.error('Matching engine cycle failed', {
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`,
        errorCount: this.errorCount,
        cycleNumber: this.runCount,
      });

      // Alert if error rate is too high
      if (this.errorCount > 5) {
        this.logger.error('Matching engine error rate too high', {
          errorCount: this.errorCount,
          totalRuns: this.runCount,
          errorRate: `${((this.errorCount / this.runCount) * 100).toFixed(2)}%`,
        });
      }
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Log metrics for monitoring
   */
  private logMetrics(
    result: {
      matchesCreated: number;
      requestsProcessed: number;
      [key: string]: any;
    },
    duration: number
  ): void {
    // Emit metrics for Prometheus/monitoring
    // This would be integrated with your monitoring system
    const metrics = {
      'matching_engine_cycle_duration_ms': duration,
      'matching_engine_matches_created': result.matchesCreated,
      'matching_engine_requests_processed': result.requestsProcessed,
      'matching_engine_total_cycles': this.runCount,
      'matching_engine_total_errors': this.errorCount,
    };

    // Log for external monitoring systems
    this.logger.debug('Matching engine metrics', metrics);
  }

  /**
   * Get job status
   */
  getStatus(): {
    isRunning: boolean;
    isScheduled: boolean;
    lastRunTime: Date | null;
    runCount: number;
    errorCount: number;
    errorRate: string;
  } {
    return {
      isRunning: this.isRunning,
      isScheduled: this.task !== null,
      lastRunTime: this.lastRunTime,
      runCount: this.runCount,
      errorCount: this.errorCount,
      errorRate: this.runCount > 0 
        ? `${((this.errorCount / this.runCount) * 100).toFixed(2)}%`
        : 'N/A',
    };
  }

  /**
   * Reset job statistics
   */
  resetStats(): void {
    this.runCount = 0;
    this.errorCount = 0;
    this.lastRunTime = null;
    this.logger.info('Matching engine job statistics reset');
  }
}
