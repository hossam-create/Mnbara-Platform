import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Headers,
  HttpCode, HttpStatus, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FeatureService } from './feature.service';

@ApiTags('Features')
@Controller('api/v1/features')
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  async health() {
    return {
      status: 'healthy', service: 'feature-management-service', version: '2.0.0',
      name: 'Mnbara Feature Management', nameAr: 'منبرة لإدارة الميزات',
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new feature flag' })
  async create(@Body() body: any, @Headers('x-admin-id') adminId: string = 'system') {
    const feature = await this.featureService.createFeature(body, adminId);
    return { success: true, message: 'Feature created successfully', messageAr: 'تم إنشاء الميزة بنجاح', data: feature };
  }

  @Get()
  @ApiOperation({ summary: 'List features' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'service', required: false })
  @ApiQuery({ name: 'isEnabled', required: false })
  async list(
    @Query('category') category?: string,
    @Query('service') service?: string,
    @Query('isEnabled') isEnabled?: string,
  ) {
    const features = await this.featureService.listFeatures({
      category: category as any,
      service,
      isEnabled: isEnabled === 'true' ? true : isEnabled === 'false' ? false : undefined,
    });
    return { success: true, data: features, total: features.length };
  }

  @Get('client/enabled')
  @ApiOperation({ summary: 'Get enabled features for client' })
  async getClientFeatures(
    @Query('userId') userId?: string,
    @Query('region') region?: string,
    @Query('subscription') subscription?: string,
  ) {
    const features = await this.featureService.getEnabledFeaturesForClient({ userId, region, subscription });
    return { success: true, data: features };
  }

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk check features' })
  async bulkCheck(@Body() body: { keys: string[]; context?: any }) {
    const results = await this.featureService.checkFeatures(body.keys, body.context);
    return { success: true, data: results };
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get feature by key' })
  async getByKey(@Param('key') key: string) {
    const feature = await this.featureService.getFeatureByKey(key);
    if (!feature) throw new NotFoundException('Feature not found');
    return { success: true, data: feature };
  }

  @Put(':key')
  @ApiOperation({ summary: 'Update feature' })
  async update(@Param('key') key: string, @Body() body: any, @Headers('x-admin-id') adminId: string = 'system') {
    const feature = await this.featureService.updateFeature(key, body, adminId);
    return { success: true, message: 'Feature updated successfully', messageAr: 'تم تحديث الميزة بنجاح', data: feature };
  }

  @Post(':key/enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable feature' })
  async enable(@Param('key') key: string, @Body() body: { reason?: string }, @Headers('x-admin-id') adminId: string = 'system') {
    const feature = await this.featureService.enableFeature(key, adminId, body.reason);
    return { success: true, message: `Feature "${feature.name}" enabled successfully`, data: feature };
  }

  @Post(':key/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable feature' })
  async disable(@Param('key') key: string, @Body() body: { reason?: string }, @Headers('x-admin-id') adminId: string = 'system') {
    const feature = await this.featureService.disableFeature(key, adminId, body.reason);
    return { success: true, message: `Feature "${feature.name}" disabled successfully`, data: feature };
  }

  @Post(':key/rollout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set rollout percentage' })
  async setRollout(@Param('key') key: string, @Body() body: { percentage: number }, @Headers('x-admin-id') adminId: string = 'system') {
    const feature = await this.featureService.setRolloutPercentage(key, body.percentage, adminId);
    return { success: true, message: `Rollout set to ${body.percentage}%`, data: feature };
  }

  @Get(':key/check')
  @ApiOperation({ summary: 'Check single feature status' })
  async check(
    @Param('key') key: string,
    @Query('userId') userId?: string, @Query('region') region?: string,
    @Query('subscription') subscription?: string, @Query('organizationId') organizationId?: string,
  ) {
    const isEnabled = await this.featureService.isFeatureEnabled(key, { userId, region, subscription, organizationId });
    return { success: true, data: { key, isEnabled } };
  }

  @Post(':key/overrides')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add override' })
  async addOverride(
    @Param('key') key: string,
    @Body() body: { type: any; targetId: string; isEnabled: boolean; expiresAt?: string },
    @Headers('x-admin-id') adminId: string = 'system',
  ) {
    const override = await this.featureService.addOverride(
      key, body.type, body.targetId, body.isEnabled, adminId,
      body.expiresAt ? new Date(body.expiresAt) : undefined,
    );
    return { success: true, message: 'Override added successfully', data: override };
  }

  @Delete(':key/overrides')
  @ApiOperation({ summary: 'Remove override' })
  async removeOverride(
    @Param('key') key: string,
    @Body() body: { type: any; targetId: string },
    @Headers('x-admin-id') adminId: string = 'system',
  ) {
    await this.featureService.removeOverride(key, body.type, body.targetId, adminId);
    return { success: true, message: 'Override removed successfully' };
  }

  @Get(':key/metrics')
  @ApiOperation({ summary: 'Get feature metrics' })
  @ApiQuery({ name: 'days', required: false })
  async getMetrics(@Param('key') key: string, @Query('days') days?: string) {
    const metrics = await this.featureService.getFeatureMetrics(key, parseInt(days || '30'));
    return { success: true, data: metrics };
  }
}
