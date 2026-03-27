import { Request, Response } from 'express';
import { HealthController } from '../HealthController';
import { HealthChecker } from '../../../observability/health';

jest.mock('../../../observability/health');
jest.mock('../../../observability/metrics', () => ({
  metricsCollector: {
    getMetrics: jest.fn()
  }
}));

import { metricsCollector } from '../../../observability/metrics';

describe('HealthController', () => {
  let healthController: HealthController;
  let mockHealthChecker: jest.Mocked<HealthChecker>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockHealthChecker = {
      checkLiveness: jest.fn(),
      checkReadiness: jest.fn()
    } as any;

    healthController = new HealthController(mockHealthChecker);

    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  describe('liveness', () => {
    it('should return 200 when healthy', async () => {
      const healthStatus = {
        status: 'healthy' as const,
        checks: {
          process: {
            status: 'pass' as const,
            timestamp: '2026-01-21T00:00:00.000Z'
          }
        }
      };

      mockHealthChecker.checkLiveness.mockResolvedValue(healthStatus);

      await healthController.liveness(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(healthStatus);
    });

    it('should return 503 when unhealthy', async () => {
      const healthStatus = {
        status: 'unhealthy' as const,
        checks: {
          process: {
            status: 'fail' as const,
            message: 'Process check failed',
            timestamp: '2026-01-21T00:00:00.000Z'
          }
        }
      };

      mockHealthChecker.checkLiveness.mockResolvedValue(healthStatus);

      await healthController.liveness(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith(healthStatus);
    });

    it('should handle errors gracefully', async () => {
      mockHealthChecker.checkLiveness.mockRejectedValue(new Error('Check failed'));

      await healthController.liveness(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
          checks: expect.objectContaining({
            error: expect.objectContaining({
              status: 'fail',
              message: 'Check failed'
            })
          })
        })
      );
    });
  });

  describe('readiness', () => {
    it('should return 200 when ready', async () => {
      const healthStatus = {
        status: 'healthy' as const,
        checks: {
          database: {
            status: 'pass' as const,
            timestamp: '2026-01-21T00:00:00.000Z'
          }
        }
      };

      mockHealthChecker.checkReadiness.mockResolvedValue(healthStatus);

      await healthController.readiness(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(healthStatus);
    });

    it('should return 503 when not ready', async () => {
      const healthStatus = {
        status: 'unhealthy' as const,
        checks: {
          database: {
            status: 'fail' as const,
            message: 'Database connection failed',
            timestamp: '2026-01-21T00:00:00.000Z'
          }
        }
      };

      mockHealthChecker.checkReadiness.mockResolvedValue(healthStatus);

      await healthController.readiness(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith(healthStatus);
    });
  });

  describe('metrics', () => {
    it('should return metrics in text format', () => {
      const metricsOutput = 'decisions_requested_total 100\ncircuit_breaker_state 0';
      (metricsCollector.getMetrics as jest.Mock).mockReturnValue(metricsOutput);

      healthController.metrics(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.set).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(mockResponse.send).toHaveBeenCalledWith(metricsOutput);
    });

    it('should handle metrics collection errors', () => {
      (metricsCollector.getMetrics as jest.Mock).mockImplementation(() => {
        throw new Error('Metrics collection failed');
      });

      healthController.metrics(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Metrics collection failed'
      });
    });
  });
});
