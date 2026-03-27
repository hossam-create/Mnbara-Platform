import { Request, Response } from 'express';
import { HealthChecker } from '../../observability/health';
import { metricsCollector } from '../../observability/metrics';

export class HealthController {
  constructor(private healthChecker: HealthChecker) {}

  async liveness(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.healthChecker.checkLiveness();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        checks: {
          error: {
            status: 'fail',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          }
        }
      });
    }
  }

  async readiness(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.healthChecker.checkReadiness();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        checks: {
          error: {
            status: 'fail',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          }
        }
      });
    }
  }

  metrics(req: Request, res: Response): void {
    try {
      const metrics = metricsCollector.getMetrics();
      res.set('Content-Type', 'text/plain');
      res.send(metrics);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to collect metrics'
      });
    }
  }
}
