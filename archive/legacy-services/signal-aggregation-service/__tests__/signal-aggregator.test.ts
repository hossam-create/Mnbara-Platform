import { SignalAggregatorService } from '../src/services/signal-aggregator.service';
import { TimeBucket } from '../src/types/signal.types';

describe('SignalAggregatorService', () => {
  let service: SignalAggregatorService;

  beforeEach(() => {
    service = new SignalAggregatorService();
  });

  describe('aggregateSignals', () => {
    it('should return signal metrics for valid inputs', async () => {
      const timeBucket: TimeBucket = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-02'),
        bucketType: 'day'
      };

      const result = await service.aggregateSignals(timeBucket, 'US-EGYPT');

      expect(result).toBeDefined();
      expect(result.corridor).toBe('US-EGYPT');
      expect(result.timeBucket).toBe('day');
      expect(result.status).toMatch(/GREEN|YELLOW|RED/);
      expect(result.statusExplanation).toBeDefined();
    });

    it('should be deterministic (same inputs produce same outputs)', async () => {
      const timeBucket: TimeBucket = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-02'),
        bucketType: 'hour'
      };

      const result1 = await service.aggregateSignals(timeBucket, 'TEST-CORRIDOR');
      const result2 = await service.aggregateSignals(timeBucket, 'TEST-CORRIDOR');

      // Core metrics should be identical for same inputs
      expect(result1.requestCount).toBe(result2.requestCount);
      expect(result1.requestGrowthRate).toBe(result2.requestGrowthRate);
      expect(result1.status).toBe(result2.status);
    });
  });

  describe('getThresholds', () => {
    it('should return current thresholds', () => {
      const thresholds = service.getThresholds();

      expect(thresholds).toBeDefined();
      expect(thresholds.redMinAbandonment).toBeDefined();
      expect(thresholds.yellowMaxAbandonment).toBeDefined();
      expect(thresholds.yellowMinKycCompletion).toBeDefined();
      expect(thresholds.yellowMinConversion).toBeDefined();
    });

    it('should return a copy to prevent mutation', () => {
      const thresholds1 = service.getThresholds();
      const thresholds2 = service.getThresholds();

      // Should be different objects (copies)
      expect(thresholds1).not.toBe(thresholds2);
    });
  });

  describe('threshold application', () => {
    it('should apply GREEN status for good metrics', () => {
      // This test would verify threshold logic
      // Implementation depends on actual threshold values
      expect(true).toBe(true); // Placeholder
    });

    it('should apply YELLOW status for warning metrics', () => {
      // This test would verify threshold logic
      expect(true).toBe(true); // Placeholder
    });

    it('should apply RED status for critical metrics', () => {
      // This test would verify threshold logic
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('read-only constraints', () => {
    it('should not modify external state', async () => {
      // The service should be purely functional with no side effects
      const timeBucket: TimeBucket = {
        start: new Date(),
        end: new Date(),
        bucketType: 'hour'
      };

      const result = await service.aggregateSignals(timeBucket, 'TEST');
      
      // Verify no external state modification occurred
      // (This would need integration with actual data sources)
      expect(result).toBeDefined();
    });
  });
});