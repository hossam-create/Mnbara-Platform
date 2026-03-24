import { Controller, Get, Post, Param, Query, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ModerationService } from './moderation.service';

@ApiTags('Moderation')
@Controller('api/moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get moderation statistics' })
  async getStats() {
    const stats = await this.moderationService.getModerationStats();
    return { success: true, data: stats };
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get products pending moderation' })
  async getPending(@Query('page') page?: string, @Query('limit') limit?: string) {
    const products = await this.moderationService.getPendingProducts(parseInt(page || '1'), parseInt(limit || '20'));
    return { success: true, data: products, pagination: { page: parseInt(page || '1'), limit: parseInt(limit || '20') } };
  }

  @Post(':productId/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve product' })
  async approve(@Param('productId') productId: string, @Headers('x-moderator-id') moderatorId?: string) {
    await this.moderationService.approveProduct(productId, moderatorId || 'system');
    return { success: true, message: 'Product approved', data: { productId, moderatorId } };
  }

  @Post(':productId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject product' })
  async reject(@Param('productId') productId: string, @Body() body: any, @Headers('x-moderator-id') moderatorId?: string) {
    await this.moderationService.rejectProduct(productId, body.reason, moderatorId || 'system');
    return { success: true, message: 'Product rejected', data: { productId, reason: body.reason, moderatorId } };
  }

  @Post(':productId/flag')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Flag product for review' })
  async flag(@Param('productId') productId: string, @Body() body: any) {
    await this.moderationService.flagProduct(productId, body.reason);
    return { success: true, message: 'Product flagged', data: { productId, reason: body.reason } };
  }

  @Get(':productId/logs')
  @ApiOperation({ summary: 'Get moderation logs for product' })
  async getLogs(@Param('productId') productId: string) {
    const logs = await this.moderationService.getProductLogs(productId);
    return { success: true, data: logs };
  }
}
