import { PrismaClient } from '@prisma/client';
import { AIOpsMonitoringService } from '../ai-ops-monitoring.service';

jest.mock('@prisma/client', () => {
  const mPrisma = {
    aiDecision: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    claim: {
      findMany: jest.fn(),
    },
    manualOverride: {
      findMany: jest.fn(),
    },
    trustEvent: {
      findMany: jest.fn(),
    },
    $transaction: (fn: any) => fn(mPrisma),
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

describe('AIOpsMonitoringService', () => {
  const prisma = new PrismaClient() as any;
  const monitoringService = new AIOpsMonitoringService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Drift Detection', () => {
    it('detects drift with valid baseline comparison', async () => {
      prisma.aiDecision.findMany.mockResolvedValueOnce([
        { decisionScore: 0.2, escalationLevel: 'NONE' },
        { decisionScore: 0.8, escalationLevel: 'HIGH' }
      ]);
      prisma.aiDecision.findMany.mockResolvedValueOnce([
        { decisionScore: 0.1, escalationLevel: 'NONE' },
        { decisionScore: 0.9, escalationLevel: 'HIGH' }
      ]);

      const result = await monitoringService.detectDrift({
        period: '7d',
        baseline: 'last_week'
      });

      expect(result).toHaveProperty('scoreDistribution');
      expect(result).toHaveProperty('riskLevelDistribution');
      expect(result).toHaveProperty('decisionAggressiveness');
      expect(result).toHaveProperty('patternFrequency');
    });

    it('handles empty data gracefully', async () => {
      prisma.aiDecision.findMany.mockResolvedValue([]);
      prisma.aiDecision.findMany.mockResolvedValue([]);

      const result = await monitoringService.detectDrift({
        period: '7d',
        baseline: 'last_week'
      });

      expect(result.scoreDistribution.current).toBe(0);
      expect(result.scoreDistribution.baseline).toBe(0);
      expect(result.driftSeverity).toBe('NO_DRIFT');
    });
  });

  describe('Accuracy Analysis', () => {
    it('classifies decisions correctly with various outcomes', async () => {
      const mockDecisions = [
        {
          id: '1',
          sellerId: 123,
          decisionScore: 0.8,
          escalationLevel: 'HIGH',
          evaluatedAt: new Date('2024-01-01'),
          recommendationType: 'REVIEW',
          triggeredRules: ['rule1']
        }
      ];

      prisma.aiDecision.findMany.mockResolvedValue(mockDecisions);
      prisma.claim.findMany.mockResolvedValue([
        { decisionId: '1', sellerId: 123, createdAt: new Date('2024-01-02') }
      ]);
      prisma.manualOverride.findMany.mockResolvedValue([]);
      prisma.trustEvent.findMany.mockResolvedValue([]);

      const result = await monitoringService.analyzeAccuracy({
        period: '30d'
      });

      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('byRiskBand');
      expect(result.overall.total).toBeGreaterThan(0);
    });

    it('handles decisions without outcomes gracefully', async () => {
      prisma.aiDecision.findMany.mockResolvedValue([
        {
          id: '1',
          sellerId: 123,
          decisionScore: 0.5,
          escalationLevel: 'MEDIUM',
          evaluatedAt: new Date('2024-01-01')
        }
      ]);
      prisma.claim.findMany.mockResolvedValue([]);
      prisma.manualOverride.findMany.mockResolvedValue([]);
      prisma.trustEvent.findMany.mockResolvedValue([]);

      const result = await monitoringService.analyzeAccuracy({
        period: '30d'
      });

      expect(result.overall.total).toBe(1);
    });
  });

  describe('Seller Timeline', () => {
    it('returns chronological decision history for seller', async () => {
      const mockDecisions = [
        {
          id: '1',
          sellerId: 123,
          decisionScore: 0.3,
          escalationLevel: 'LOW',
          evaluatedAt: new Date('2024-01-01'),
          inputSnapshot: { orderValue: 100 },
          triggeredRules: ['rule1']
        },
        {
          id: '2',
          sellerId: 123,
          decisionScore: 0.7,
          escalationLevel: 'HIGH',
          evaluatedAt: new Date('2024-01-02'),
          inputSnapshot: { orderValue: 500 },
          triggeredRules: ['rule2']
        }
      ];

      prisma.aiDecision.findMany.mockResolvedValue(mockDecisions);

      const result = await monitoringService.getSellerDecisionTimeline({
        sellerId: 123,
        period: '90d',
        limit: 10,
        offset: 0
      });

      expect(result.decisions).toHaveLength(2);
      expect(result.trend).toBeDefined();
      expect(result.volatility).toBeDefined();
    });

    it('handles empty seller history', async () => {
      prisma.aiDecision.findMany.mockResolvedValue([]);

      const result = await monitoringService.getSellerDecisionTimeline({
        sellerId: 999,
        period: '90d'
      });

      expect(result.decisions).toHaveLength(0);
      expect(result.trend).toBe('STABLE');
    });
  });

  describe('Decision Comparison', () => {
    it('compares decisions between two timestamps', async () => {
      const mockDecisions1 = [
        {
          id: '1',
          sellerId: 123,
          decisionScore: 0.3,
          escalationLevel: 'LOW',
          evaluatedAt: new Date('2024-01-01')
        }
      ];

      const mockDecisions2 = [
        {
          id: '2',
          sellerId: 123,
          decisionScore: 0.7,
          escalationLevel: 'HIGH',
          evaluatedAt: new Date('2024-01-15')
        }
      ];

      prisma.aiDecision.findMany.mockResolvedValueOnce(mockDecisions1);
      prisma.aiDecision.findMany.mockResolvedValueOnce(mockDecisions2);

      const result = await monitoringService.compareDecisions({
        sellerId: 123,
        fromTimestamp: new Date('2024-01-01'),
        toTimestamp: new Date('2024-01-15')
      });

      expect(result).toHaveProperty('fromPeriod');
      expect(result).toHaveProperty('toPeriod');
      expect(result).toHaveProperty('changes');
      expect(result.changes).toHaveProperty('scoreChange');
      expect(result.changes).toHaveProperty('riskLevelChange');
    });
  });

  describe('AI Health Score', () => {
    it('calculates comprehensive health score with all metrics', async () => {
      prisma.aiDecision.findMany.mockResolvedValue([
        { decisionScore: 0.5, confidence: 0.8, evaluatedAt: new Date() }
      ]);
      prisma.aiDecision.count.mockResolvedValue(10);
      prisma.aiDecision.groupBy.mockResolvedValue([
        { recommendationType: 'REVIEW', _count: 5 }
      ]);
      prisma.manualOverride.findMany.mockResolvedValue([
        { decisionId: '1', createdAt: new Date() }
      ]);

      const result = await monitoringService.calculateAIHealthScore('7d');

      expect(result).toHaveProperty('aiHealthScore');
      expect(result).toHaveProperty('aiHealthLevel');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('contributingFactors');
      expect(result).toHaveProperty('recommendations');
      expect(result.aiHealthScore).toBeGreaterThanOrEqual(0);
      expect(result.aiHealthScore).toBeLessThanOrEqual(100);
    });

    it('handles minimal data for health calculation', async () => {
      prisma.aiDecision.findMany.mockResolvedValue([]);
      prisma.aiDecision.count.mockResolvedValue(0);
      prisma.aiDecision.groupBy.mockResolvedValue([]);
      prisma.manualOverride.findMany.mockResolvedValue([]);

      const result = await monitoringService.calculateAIHealthScore('7d');

      expect(result.aiHealthLevel).toBe('CRITICAL');
      expect(result.contributingFactors).toContain('INSUFFICIENT_DATA');
    });
  });

  describe('System Health Monitoring', () => {
    it('returns operational status with all components', async () => {
      const result = await monitoringService.getMonitoringHealth();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('components');
      expect(result).toHaveProperty('metrics');
      expect(result.components.database).toBe('OPERATIONAL');
      expect(result.metrics).toHaveProperty('errorRate');
      expect(result.metrics).toHaveProperty('latencyMs');
    });
  });

  describe('Error Handling', () => {
    it('handles database errors gracefully', async () => {
      prisma.aiDecision.findMany.mockRejectedValue(new Error('Database connection failed'));

      await expect(monitoringService.detectDrift({
        period: '7d',
        baseline: 'last_week'
      })).rejects.toThrow('Drift detection failed');
    });

    it('handles invalid period parameters', async () => {
      await expect(monitoringService.detectDrift({
        period: 'invalid',
        baseline: 'last_week'
      })).rejects.toThrow('Invalid period parameter');
    });
  });

  describe('Rule Performance', () => {
    it('returns rule performance metrics', async () => {
      prisma.aiDecision.findMany.mockResolvedValue([
        {
          id: '1',
          triggeredRules: ['rule1'],
          decisionScore: 0.6,
          escalationLevel: 'MEDIUM'
        }
      ]);
      prisma.claim.findMany.mockResolvedValue([
        { decisionId: '1', sellerId: 123 }
      ]);

      const result = await monitoringService.getRulePerformance('30d');

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('AI Metrics', () => {
    it('returns comprehensive AI performance metrics', async () => {
      prisma.aiDecision.count.mockResolvedValue(100);
      prisma.aiDecision.findMany.mockResolvedValue([
        { decisionScore: 0.5, confidence: 0.8, processingTimeMs: 100 }
      ]);

      const result = await monitoringService.getAIMetrics('30d');

      expect(result).toHaveProperty('decisionVolume');
      expect(result).toHaveProperty('confidenceLevels');
      expect(result).toHaveProperty('processingTimes');
      expect(result.decisionVolume.total).toBe(100);
    });
  });
});