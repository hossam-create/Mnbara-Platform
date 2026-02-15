import { HealthChecker } from '../health';
import { PrismaClient } from '@prisma/client';
import { IDecisionSource } from '../../interfaces/IDecisionSource';

jest.mock('@prisma/client');

jest.mock('../logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

describe('HealthChecker', () => {
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockDecisionSource: jest.Mocked<IDecisionSource>;
  let healthChecker: HealthChecker;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPrisma = {
      $queryRaw: jest.fn()
    } as any;

    mockDecisionSource = {} as any;

    healthChecker = new HealthChecker(mockPrisma, mockDecisionSource);
  });

  describe('checkLiveness', () => {
    it('should return healthy status', async () => {
      const result = await healthChecker.checkLiveness();

      expect(result.status).toBe('healthy');
      expect(result.checks.process.status).toBe('pass');
      expect(result.checks.process.timestamp).toBeDefined();
    });
  });

  describe('checkReadiness', () => {
    it('should return healthy when database is accessible', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const result = await healthChecker.checkReadiness();

      expect(result.status).toBe('healthy');
      expect(result.checks.database.status).toBe('pass');
      expect(result.checks.database.timestamp).toBeDefined();
    });

    it('should return unhealthy when database is not accessible', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection failed'));

      const result = await healthChecker.checkReadiness();

      expect(result.status).toBe('unhealthy');
      expect(result.checks.database.status).toBe('fail');
      expect(result.checks.database.message).toBe('Connection failed');
    });

    it('should check decision source when provided', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const result = await healthChecker.checkReadiness();

      expect(result.checks.decision_source).toBeDefined();
      expect(result.checks.decision_source.status).toBe('pass');
    });

    it('should return unhealthy if any check fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('DB error'));

      const result = await healthChecker.checkReadiness();

      expect(result.status).toBe('unhealthy');
    });
  });
});
