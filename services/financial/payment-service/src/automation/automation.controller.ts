import { Controller, Post, Get, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AutomationService } from './automation.service';

@ApiTags('Automation')
@Controller('api/automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Post('payout-rules')
  @ApiOperation({ summary: 'Create payout rule' })
  async createRule(@Body() body: any) {
    return { success: true, data: await this.automationService.createPayoutRule(body), message: 'Automated payout rule created successfully' };
  }

  @Get('sellers/:sellerId/payout-rules')
  @ApiOperation({ summary: 'Get seller payout rules' })
  async getSellerRules(@Param('sellerId') sellerId: string) {
    return { success: true, data: await this.automationService.getSellerPayoutRules(sellerId) };
  }

  @Put('payout-rules/:ruleId')
  @ApiOperation({ summary: 'Update payout rule' })
  async updateRule(@Param('ruleId') ruleId: string, @Body() body: any) {
    return { success: true, data: await this.automationService.updatePayoutRule(ruleId, body) };
  }

  @Delete('payout-rules/:ruleId')
  @ApiOperation({ summary: 'Delete payout rule' })
  async deleteRule(@Param('ruleId') ruleId: string) {
    await this.automationService.deletePayoutRule(ruleId);
    return { success: true, message: 'Rule deleted' };
  }

  @Post('trigger/payouts')
  @ApiOperation({ summary: 'Trigger automated payouts' })
  async triggerPayouts() { return { success: true, data: await this.automationService.triggerAutomatedPayouts() }; }

  @Post('trigger/escrow-releases')
  @ApiOperation({ summary: 'Trigger escrow releases' })
  async triggerEscrow() { return { success: true, data: await this.automationService.triggerEscrowReleases() }; }

  @Post('route-transaction')
  @ApiOperation({ summary: 'Route transaction' })
  async routeTransaction(@Body() body: any) { return { success: true, data: await this.automationService.routeTransaction(body) }; }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get automation dashboard' })
  async getDashboard() { return { success: true, data: await this.automationService.getAutomationDashboard() }; }

  @Get('psp-health')
  @ApiOperation({ summary: 'Get PSP health' })
  async getPSPHealth() { return { success: true, data: await this.automationService.getPSPHealth() }; }

  @Get('stats')
  @ApiOperation({ summary: 'Get automation stats' })
  async getStats() { return { success: true, data: await this.automationService.getAutomationStats() }; }

  @Get('settings')
  @ApiOperation({ summary: 'Get automation settings' })
  async getSettings() { return { success: true, data: await this.automationService.getAutomationSettings() }; }

  @Put('settings')
  @ApiOperation({ summary: 'Update automation setting' })
  async updateSetting(@Body() body: any) {
    return { success: true, data: await this.automationService.updateAutomationSetting(body.key, body.value) };
  }

  @Get('audit-log')
  @ApiOperation({ summary: 'Get automation audit log' })
  async getAuditLog() { return { success: true, data: await this.automationService.getAutomationAuditLog() }; }
}
