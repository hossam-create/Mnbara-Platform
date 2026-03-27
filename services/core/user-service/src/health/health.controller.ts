import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check() {
    return this.healthService.check();
  }

  @Get('live')
  async live() {
    return this.healthService.live();
  }

  @Get('ready')
  async ready() {
    return this.healthService.ready();
  }
}
