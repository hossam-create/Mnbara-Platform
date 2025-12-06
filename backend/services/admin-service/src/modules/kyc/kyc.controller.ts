import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { KycService } from './kyc.service';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get()
  async getAllVerifications(
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.kycService.getAllVerifications({ status, page, limit });
  }

  @Get(':id')
  async getVerificationById(@Param('id') id: string) {
    return this.kycService.getVerificationById(parseInt(id));
  }

  @Get('user/:userId')
  async getUserVerifications(@Param('userId') userId: string) {
    return this.kycService.getUserVerifications(parseInt(userId));
  }

  @Post('verify/:id')
  async approveVerification(
    @Param('id') id: string,
    @Body() body: { adminNotes?: string },
  ) {
    return this.kycService.approveVerification(parseInt(id), body.adminNotes);
  }

  @Post('reject/:id')
  async rejectVerification(
    @Param('id') id: string,
    @Body() body: { reason: string; adminNotes?: string },
  ) {
    return this.kycService.rejectVerification(parseInt(id), body.reason, body.adminNotes);
  }

  @Put(':id/request-resubmit')
  async requestResubmit(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.kycService.requestResubmit(parseInt(id), body.reason);
  }
}
