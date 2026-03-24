import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RatesService } from './rates.service';

@ApiTags('Exchange Rates')
@Controller('api/rates')
export class RatesController {
  constructor(private readonly ratesService: RatesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active exchange rates' })
  async getAllRates() {
    const data = await this.ratesService.getAllRates();
    return { success: true, data };
  }

  @Get(':from/:to')
  @ApiOperation({ summary: 'Get exchange rate for a currency pair' })
  async getExchangeRate(@Param('from') from: string, @Param('to') to: string) {
    const data = await this.ratesService.getExchangeRate(from, to);
    return { success: true, data };
  }

  @Get(':from/:to/history')
  @ApiOperation({ summary: 'Get rate history for a currency pair' })
  @ApiQuery({ name: 'days', required: false })
  async getRateHistory(
    @Param('from') from: string,
    @Param('to') to: string,
    @Query('days') days?: string,
  ) {
    const data = await this.ratesService.getRateHistory(from, to, Number(days) || 30);
    return { success: true, data };
  }

  @Post()
  @ApiOperation({ summary: 'Update exchange rate' })
  async updateRate(@Body() body: any) {
    const data = await this.ratesService.updateRate(body);
    return { success: true, data };
  }
}
