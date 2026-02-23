import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GatewayHealth, HealthService } from './health.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  @ApiOperation({ summary: 'Basic health check' })
  health() {
    return {
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('health/detailed')
  @ApiOperation({ summary: 'Detailed health check with downstream services' })
  async detailedHealth(): Promise<GatewayHealth> {
    return this.healthService.getGatewayHealth();
  }

  @Get('api/v1')
  @ApiOperation({ summary: 'API documentation endpoint' })
  apiDocs() {
    return this.healthService.getApiDocs();
  }
}
