import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CheckAccessDto } from './dto/check-access.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { AdminOverrideDto } from './dto/admin-override.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Subscriptions')
@Controller()
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  health() {
    return {
      success: true,
      message: 'Subscription Service Running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  @Get('features')
  @ApiOperation({ summary: 'Get all features and their subscription requirements' })
  @ApiResponse({ status: 200, description: 'List of all features' })
  getFeatures() {
    const features = this.subscriptionService.getAllFeatures();
    return { success: true, data: features };
  }

  @Post('check-access')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if a user has access to a specific feature' })
  @ApiResponse({ status: 200, description: 'Access check result' })
  async checkAccess(@Body() dto: CheckAccessDto) {
    const accessCheck = await this.subscriptionService.checkFeatureAccess(
      dto.userId,
      dto.featureName,
    );
    return { success: true, data: accessCheck };
  }

  @Post('subscriptions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new subscription for a user' })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  @ApiResponse({ status: 400, description: 'Invalid request or creation failed' })
  async createSubscription(@Body() dto: CreateSubscriptionDto) {
    const result = await this.subscriptionService.createSubscription(
      dto.userId,
      dto.plan,
      dto.durationMonths ?? 1,
    );

    if (!result.success) {
      throw new BadRequestException(result.message);
    }

    return {
      success: true,
      data: result.subscription,
      message: result.message,
    };
  }

  @Post('admin/override-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin override to activate/deactivate a subscription' })
  @ApiResponse({ status: 200, description: 'Override applied' })
  @ApiResponse({ status: 400, description: 'Override failed' })
  async adminOverride(@Body() dto: AdminOverrideDto) {
    const result = await this.subscriptionService.adminOverrideSubscription(
      dto.userId,
      dto.action,
      dto.plan,
    );

    if (!result.success) {
      throw new BadRequestException(result.message);
    }

    return { success: true, message: result.message };
  }
}
