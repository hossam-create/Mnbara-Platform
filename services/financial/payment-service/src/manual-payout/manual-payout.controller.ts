import { Controller, Post, Get, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ManualPayoutService } from './manual-payout.service';

@ApiTags('Manual Payouts')
@Controller('api/manual-payouts')
export class ManualPayoutController {
  constructor(private readonly payoutService: ManualPayoutService) {}

  @Post('requests')
  @ApiOperation({ summary: 'Create payout request' })
  async createRequest(@Body() body: any) {
    const request = await this.payoutService.createPayoutRequest(body);
    return { success: true, data: request };
  }

  @Get('sellers/:sellerId/requests')
  @ApiOperation({ summary: 'Get seller payout requests' })
  async getSellerRequests(@Param('sellerId') sellerId: string) {
    return { success: true, data: await this.payoutService.getSellerPayoutRequests(sellerId) };
  }

  @Get('requests/:requestId')
  @ApiOperation({ summary: 'Get payout request' })
  async getRequest(@Param('requestId') requestId: string) {
    return { success: true, data: await this.payoutService.getPayoutRequest(requestId) };
  }

  @Get('sellers/:sellerId/summary')
  @ApiOperation({ summary: 'Get seller payout summary' })
  async getSummary(@Param('sellerId') sellerId: string) {
    return { success: true, data: await this.payoutService.getSellerPayoutSummary(sellerId) };
  }

  @Post('admin/batches')
  @ApiOperation({ summary: 'Create weekly batch' })
  async createBatch(@Body() body: any) {
    return { success: true, data: await this.payoutService.createWeeklyBatch(body) };
  }

  @Get('admin/batches')
  @ApiOperation({ summary: 'Get payout batches' })
  async getBatches() { return { success: true, data: await this.payoutService.getPayoutBatches() }; }

  @Get('admin/batches/:batchId/export')
  @ApiOperation({ summary: 'Export batch to CSV' })
  async exportBatch(@Param('batchId') batchId: string) {
    return { success: true, data: await this.payoutService.exportBatchToCSV(batchId) };
  }

  @Put('admin/requests/:requestId/status')
  @ApiOperation({ summary: 'Update payout status' })
  async updateStatus(@Param('requestId') requestId: string, @Body() body: any) {
    return { success: true, data: await this.payoutService.updatePayoutStatus(requestId, body.status, body.notes) };
  }

  @Get('admin/requests/pending')
  @ApiOperation({ summary: 'Get pending requests' })
  async getPending() { return { success: true, data: await this.payoutService.getPendingRequests() }; }

  @Get('admin/stats')
  @ApiOperation({ summary: 'Get payout stats' })
  async getStats() { return { success: true, data: await this.payoutService.getPayoutStats() }; }

  @Get('admin/settings')
  @ApiOperation({ summary: 'Get payout settings' })
  async getSettings() { return { success: true, data: await this.payoutService.getPayoutSettings() }; }

  @Put('admin/settings')
  @ApiOperation({ summary: 'Update payout setting' })
  async updateSetting(@Body() body: any) {
    return { success: true, data: await this.payoutService.updatePayoutSetting(body.key, body.value) };
  }

  @Get('admin/requests/:requestId/audit')
  @ApiOperation({ summary: 'Get payout audit log' })
  async getAuditLog(@Param('requestId') requestId: string) {
    return { success: true, data: await this.payoutService.getPayoutAuditLog(requestId) };
  }
}
