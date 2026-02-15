import { PrismaClient } from '@prisma/client';
import { IDecisionSource } from '../interfaces/IDecisionSource';
import { logger } from './logger';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  checks: {
    [key: string]: {
      status: 'pass' | 'fail';
      message?: string;
      timestamp: string;
    };
  };
}

export class HealthChecker {
  constructor(
    private prisma: PrismaClient,
    private decisionSource?: IDecisionSource
  ) {}

  async checkLiveness(): Promise<HealthStatus> {
    const checks: HealthStatus['checks'] = {};

    checks.process = {
      status: 'pass',
      timestamp: new Date().toISOString()
    };

    const allPassed = Object.values(checks).every(check => check.status === 'pass');

    return {
      status: allPassed ? 'healthy' : 'unhealthy',
      checks
    };
  }

  async checkReadiness(): Promise<HealthStatus> {
    const checks: HealthStatus['checks'] = {};

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = {
        status: 'pass',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      checks.database = {
        status: 'fail',
        message: error instanceof Error ? error.message : 'Database connection failed',
        timestamp: new Date().toISOString()
      };
      logger.error('Database health check failed', {
        operation: 'health_check',
        outcome: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    if (this.decisionSource) {
      try {
        checks.decision_source = {
          status: 'pass',
          message: 'Decision source available',
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        checks.decision_source = {
          status: 'fail',
          message: error instanceof Error ? error.message : 'Decision source check failed',
          timestamp: new Date().toISOString()
        };
      }
    }

    const allPassed = Object.values(checks).every(check => check.status === 'pass');

    return {
      status: allPassed ? 'healthy' : 'unhealthy',
      checks
    };
  }
}
