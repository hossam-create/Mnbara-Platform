import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async check() {
    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'product-service',
        version: '2.0.0',
        checks: {
          database: 'ok',
        },
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'product-service',
        version: '2.0.0',
        checks: {
          database: 'failed',
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
