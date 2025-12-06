import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  async getOverview(@Query('period') period: string = '7d') {
    return this.analyticsService.getOverview(period);
  }

  @Get('users')
  async getUserAnalytics(@Query('period') period: string = '30d') {
    return this.analyticsService.getUserAnalytics(period);
  }

  @Get('orders')
  async getOrderAnalytics(@Query('period') period: string = '30d') {
    return this.analyticsService.getOrderAnalytics(period);
  }

  @Get('revenue')
  async getRevenueAnalytics(@Query('period') period: string = '30d') {
    return this.analyticsService.getRevenueAnalytics(period);
  }
}
