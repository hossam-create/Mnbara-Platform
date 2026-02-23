import { Controller, Get, Post, Body, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LocationNotificationService } from './location-notification.service';

@ApiTags('Location')
@Controller('api/v1/location')
export class LocationController {
  constructor(private readonly locationService: LocationNotificationService) {}

  @Post('check')
  @ApiOperation({ summary: 'Check user location and send notifications' })
  async checkLocation(@Body() body: { userId: string; lat: number; lon: number }) {
    if (!body.userId || body.lat === undefined || body.lon === undefined) {
      throw new BadRequestException('userId, lat, and lon are required');
    }

    const notifications = await this.locationService.checkLocationAndNotify(
      body.userId, parseFloat(String(body.lat)), parseFloat(String(body.lon)),
    );

    return { success: true, data: { notifications, count: notifications.length } };
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby transfer offices' })
  @ApiQuery({ name: 'lat', required: true })
  @ApiQuery({ name: 'lon', required: true })
  @ApiQuery({ name: 'radius', required: false })
  async findNearby(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
    @Query('radius') radius?: string,
  ) {
    if (!lat || !lon) {
      throw new BadRequestException('lat and lon are required');
    }

    const nearbyLocations = await this.locationService.findNearbyWesternUnion(
      parseFloat(lat), parseFloat(lon), radius ? parseFloat(radius) : 2,
    );

    return { success: true, data: { locations: nearbyLocations, count: nearbyLocations.length, searchRadius: radius || 2 } };
  }

  @Post('compare-prices')
  @ApiOperation({ summary: 'Compare prices with competitors' })
  async comparePrices(@Body() body: { fromCurrency: string; toCurrency: string; amount: number }) {
    if (!body.fromCurrency || !body.toCurrency || !body.amount) {
      throw new BadRequestException('fromCurrency, toCurrency, and amount are required');
    }

    const comparison = await this.locationService.getPriceComparison(
      body.fromCurrency, body.toCurrency, parseFloat(String(body.amount)),
    );

    return {
      success: true,
      data: {
        comparison,
        message: `Save ${comparison.savingsPercent.toFixed(1)}% with Mnbara!`,
        messageAr: `وفر ${comparison.savingsPercent.toFixed(1)}% مع منبرة!`,
      },
    };
  }

  @Post('generate-alternative')
  @ApiOperation({ summary: 'Generate alternative notification for user' })
  async generateAlternative(@Body() body: {
    userId: string; lat: number; lon: number;
    fromCurrency?: string; toCurrency?: string; amount?: number;
  }) {
    if (!body.userId || body.lat === undefined || body.lon === undefined) {
      throw new BadRequestException('userId, lat, and lon are required');
    }

    const notification = await this.locationService.generateAlternativeNotification(
      body.userId, parseFloat(String(body.lat)), parseFloat(String(body.lon)),
      body.fromCurrency || 'USD', body.toCurrency || 'EGP', body.amount ? parseFloat(String(body.amount)) : 100,
    );

    if (!notification) {
      return { success: true, data: null, message: 'No nearby Western Union offices found', messageAr: 'لم يتم العثور على مكاتب ويسترن يونيون قريبة' };
    }

    return { success: true, data: notification };
  }
}
