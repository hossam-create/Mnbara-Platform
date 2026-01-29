/**
 * Matching Engine Job Tests
 * Tests for the cron job that runs the matching engine every 30 seconds
 * 
 * Task: Phase 3.1.8 - Setup matching engine cron job
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MatchingEngineJob } from '../matching-engine.job';
import { MatchingEngineService } from '../../services/matching-engine.service';
import { Logger } from '../../utils/logger';

describe('MatchingEngineJob', () => {
  let job: MatchingEngineJob;
  let mockMatchingEngineService: any;
  let mockLogger: any;

  beforeEach(() => {
    // Mock services
    mockMatchingEngineService = {
      runMatching: vi.fn().mockResolvedValue({
        matchesCreated: 5,
        requestsProcessed: 20,
      }),
    };

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    job = new MatchingEngineJob(mockMatchingEngineService, mockLogger);
  });

  afterEach(() => {
    job.stop();
    vi.clearAllMocks();
  });

  describe('start()', () => {
    it('should start the cron job', () => {
      job.start();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Matching engine job started (every 30 seconds)'
      );

      const status = job.getStatus();
      expect(status.isScheduled).toBe(true);
    });

    it('should not start if already running', () => {
      job.start();
      mockLogger.info.mockClear();

      job.start();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Matching engine job already running'
      );
    });
  });

  describe('stop()', () => {
    it('should stop the cron job', () => {
      job.start();
      mockLogger.info.mockClear();

      job.stop();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Matching engine job stopped'
      );

      const status = job.getStatus();
      expect(status.isScheduled).toBe(false);
    });

    it('should handle stopping when not started', () => {
      job.stop();

      const status = job.getStatus();
      expect(status.isScheduled).toBe(false);
    });
  });

  describe('getStatus()', () => {
    it('should return initial status', () => {
      const status = job.getStatus();

      expect(status).toEqual({
        isRunning: false,
        isScheduled: false,
        lastRunTime: null,
        runCount: 0,
        errorCount: 0,
        errorRate: 'N/A',
      });
    });

    it('should return scheduled status after start', () => {
      job.start();

      const status = job.getStatus();

      expect(status.isScheduled).toBe(true);
      expect(status.runCount).toBe(0);
      expect(status.errorCount).toBe(0);
    });
  });

  describe('resetStats()', () => {
    it('should reset statistics', () => {
      job.start();
      mockLogger.info.mockClear();

      job.resetStats();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Matching engine job statistics reset'
      );

      const status = job.getStatus();
      expect(status.runCount).toBe(0);
      expect(status.errorCount).toBe(0);
      expect(status.lastRunTime).toBeNull();
    });
  });

  describe('execute()', () => {
    it('should execute matching engine successfully', async () => {
      job.start();

      // Wait for first execution
      await new Promise(resolve => setTimeout(resolve, 100));

      const status = job.getStatus();
      expect(status.runCount).toBeGreaterThan(0);
      expect(status.errorCount).toBe(0);
      expect(mockMatchingEngineService.runMatching).toHaveBeenCalled();
    });

    it('should handle errors during execution', async () => {
      mockMatchingEngineService.runMatching.mockRejectedValueOnce(
        new Error('Matching engine error')
      );

      job.start();

      // Wait for first execution
      await new Promise(resolve => setTimeout(resolve, 100));

      const status = job.getStatus();
      expect(status.errorCount).toBeGreaterThan(0);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should prevent concurrent executions', async () => {
      // Make the matching engine slow
      mockMatchingEngineService.runMatching.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 500))
      );

      job.start();

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should only be called once despite multiple cycles
      expect(mockMatchingEngineService.runMatching).toHaveBeenCalledTimes(1);
    });

    it('should log metrics after successful execution', async () => {
      job.start();

      // Wait for first execution
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Matching engine cycle completed',
        expect.objectContaining({
          matchesCreated: 5,
          requestsProcessed: 20,
        })
      );
    });

    it('should track error rate', async () => {
      mockMatchingEngineService.runMatching
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce({ matchesCreated: 0, requestsProcessed: 0 });

      job.start();

      // Wait for multiple executions
      await new Promise(resolve => setTimeout(resolve, 200));

      const status = job.getStatus();
      expect(status.errorCount).toBeGreaterThan(0);
      expect(status.errorRate).not.toBe('N/A');
    });
  });

  describe('error handling', () => {
    it('should alert when error rate is too high', async () => {
      // Make all executions fail
      mockMatchingEngineService.runMatching.mockRejectedValue(
        new Error('Persistent error')
      );

      job.start();

      // Wait for multiple failures
      await new Promise(resolve => setTimeout(resolve, 300));

      // Should have logged high error rate alert
      const errorCalls = mockLogger.error.mock.calls;
      const hasHighErrorRateAlert = errorCalls.some(call =>
        call[0]?.includes('error rate too high')
      );

      expect(hasHighErrorRateAlert).toBe(true);
    });
  });

  describe('concurrent execution prevention', () => {
    it('should skip cycle if already running', async () => {
      let executionCount = 0;

      mockMatchingEngineService.runMatching.mockImplementation(async () => {
        executionCount++;
        // Simulate long-running operation
        await new Promise(resolve => setTimeout(resolve, 200));
        return { matchesCreated: 0, requestsProcessed: 0 };
      });

      job.start();

      // Wait for multiple cycles
      await new Promise(resolve => setTimeout(resolve, 300));

      // Should only execute once due to concurrent prevention
      expect(executionCount).toBe(1);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Matching engine already running, skipping this cycle'
      );
    });
  });
});
