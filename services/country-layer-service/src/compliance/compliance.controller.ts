import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';

@ApiTags('Compliance')
@Controller('api/v1/countries')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('rules')
  @ApiOperation({ summary: 'Get all rules' })
  async getAllRules(@Query('page') page?: string, @Query('limit') limit?: string, @Query('countryCode') countryCode?: string) {
    const rules = await this.complianceService.getAllRules({
      page: parseInt(page || '1'),
      limit: parseInt(limit || '50'),
      ...(countryCode && { countryCode }),
    });
    return { success: true, data: rules, pagination: { page: parseInt(page || '1'), limit: parseInt(limit || '50'), total: rules.length } };
  }

  @Get('rules/:ruleId')
  @ApiOperation({ summary: 'Get rule by ID' })
  async getRuleById(@Param('ruleId') ruleId: string) {
    return { success: true, data: await this.complianceService.getRuleById(ruleId) };
  }

  @Post('rules')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create rule' })
  async createRule(@Body() body: any) {
    return { success: true, data: await this.complianceService.createRule(body), message: 'Rule created successfully' };
  }

  @Put('rules/:ruleId')
  @ApiOperation({ summary: 'Update rule' })
  async updateRule(@Param('ruleId') ruleId: string, @Body() body: any) {
    const rule = await this.complianceService.updateRule(ruleId, body);
    if (!rule) throw new NotFoundException('Rule not found');
    return { success: true, data: rule, message: 'Rule updated successfully' };
  }

  @Delete('rules/:ruleId')
  @ApiOperation({ summary: 'Delete rule' })
  async deleteRule(@Param('ruleId') ruleId: string) {
    const deleted = await this.complianceService.deleteRule(ruleId);
    if (!deleted) throw new NotFoundException('Rule not found');
    return { success: true, message: 'Rule deleted successfully' };
  }

  @Post('validate-route')
  @ApiOperation({ summary: 'Validate route compliance' })
  async validateRoute(@Body() body: any) {
    return { success: true, data: await this.complianceService.validateRoute(body) };
  }

  @Post('validate-product-route')
  @ApiOperation({ summary: 'Validate product route compliance' })
  async validateProductRoute(@Body() body: any) {
    return { success: true, data: await this.complianceService.validateProductRoute(body.productId, body.destinationCountry) };
  }

  @Get('compliance-logs')
  @ApiOperation({ summary: 'Get compliance logs' })
  async getComplianceLogs(@Query('page') page?: string, @Query('limit') limit?: string, @Query('productId') productId?: string, @Query('countryCode') countryCode?: string) {
    const logs = await this.complianceService.getComplianceLogs({
      page: parseInt(page || '1'),
      limit: parseInt(limit || '50'),
      ...(productId && { productId }),
      ...(countryCode && { countryCode }),
    });
    return { success: true, data: logs, pagination: { page: parseInt(page || '1'), limit: parseInt(limit || '50'), total: logs.length } };
  }

  @Get('compliance-logs/:logId')
  @ApiOperation({ summary: 'Get compliance log by ID' })
  async getComplianceLogById(@Param('logId') logId: string) {
    return { success: true, data: await this.complianceService.getComplianceLogById(logId) };
  }
}
