import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  async check() {
    const dbHealthy = await this.checkDatabase();
    
    return {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      service: 'user-service',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealthy ? 'ok' : 'failed',
      },
    };
  }

  async live() {
    return {
      status: 'alive',
      service: 'user-service',
      timestamp: new Date().toISOString(),
    };
  }

  async ready() {
    const dbHealthy = await this.checkDatabase();
    
    return {
      status: dbHealthy ? 'ready' : 'not-ready',
      service: 'user-service',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealthy ? 'ok' : 'failed',
      },
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }
}
