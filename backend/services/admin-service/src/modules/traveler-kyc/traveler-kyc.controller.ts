import { Controller, Get, Post, Body, Param, Query, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { TravelerKycService } from './traveler-kyc.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

@Controller('traveler/kyc')
@UseGuards(JwtAuthGuard)
export class TravelerKycController {
  constructor(private readonly travelerKycService: TravelerKycService) {}

  @Post('submit')
  @UseInterceptors(FilesInterceptor('files'))
  async submitKyc(
    @CurrentUser() user: any,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    try {
      return await this.travelerKycService.submitKyc(user.id, body, files);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('status')
  async getKycStatus(@CurrentUser() user: any) {
    return await this.travelerKycService.getKycStatus(user.id);
  }

  @Get('status/:userId')
  async getKycStatusByUserId(@Param('userId') userId: string) {
    return await this.travelerKycService.getKycStatus(parseInt(userId));
  }

  @Post('document')
  @UseInterceptors(FilesInterceptor('file'))
  async uploadDocument(
    @CurrentUser() user: any,
    @Body() body: { type: string },
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No file uploaded');
    }
    
    return await this.travelerKycService.uploadDocument(user.id, body.type, files[0]);
  }

  @Get('profile')
  async getKycProfile(@CurrentUser() user: any) {
    return await this.travelerKycService.getKycProfile(user.id);
  }

  @Get('profiles')
  async getAllKycProfiles(
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    return await this.travelerKycService.getAllKycProfiles({ status, page, limit });
  }

  @Post('verify/:userId')
  async verifyKyc(
    @Param('userId') userId: string,
    @Body() body: { riskLevel?: string; notes?: string }
  ) {
    return await this.travelerKycService.verifyKyc(parseInt(userId), body.riskLevel, body.notes);
  }

  @Post('reject/:userId')
  async rejectKyc(
    @Param('userId') userId: string,
    @Body() body: { reason: string; notes?: string }
  ) {
    return await this.travelerKycService.rejectKyc(parseInt(userId), body.reason, body.notes);
  }
}