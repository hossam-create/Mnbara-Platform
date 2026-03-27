import {
  Controller, Get, Post, Put, Body, Param, Query, Headers,
  HttpCode, HttpStatus, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReleaseService } from './release.service';

@ApiTags('Releases')
@Controller('api/v1/releases')
export class ReleaseController {
  constructor(private readonly releaseService: ReleaseService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new release' })
  async create(@Body() body: any, @Headers('x-admin-id') adminId: string = 'system') {
    const release = await this.releaseService.create(body, adminId);
    return { success: true, message: 'Release created successfully', messageAr: 'تم إنشاء الإصدار بنجاح', data: release };
  }

  @Get('changelog/all')
  @ApiOperation({ summary: 'Get release changelog' })
  async getChangelog() {
    const data = await this.releaseService.getChangelog();
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List releases' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async list(@Query('status') status?: string, @Query('limit') limit?: string) {
    const releases = await this.releaseService.list(status, parseInt(limit || '20'));
    return { success: true, data: releases, total: releases.length };
  }

  @Get(':version')
  @ApiOperation({ summary: 'Get release by version' })
  async getByVersion(@Param('version') version: string) {
    const release = await this.releaseService.getByVersion(version);
    if (!release) throw new NotFoundException('Release not found');
    return { success: true, data: release };
  }

  @Put(':version')
  @ApiOperation({ summary: 'Update release' })
  async update(@Param('version') version: string, @Body() body: any) {
    const release = await this.releaseService.update(version, body);
    return { success: true, message: 'Release updated successfully', data: release };
  }

  @Post(':version/schedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Schedule release' })
  async schedule(@Param('version') version: string, @Body() body: { scheduledAt: string }) {
    const release = await this.releaseService.schedule(version, body.scheduledAt);
    return { success: true, message: `Release scheduled for ${body.scheduledAt}`, data: release };
  }

  @Post(':version/deploy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deploy release (enable all features)' })
  async deploy(@Param('version') version: string, @Headers('x-admin-id') adminId: string = 'system') {
    const result = await this.releaseService.deploy(version, adminId);
    if (!result) throw new NotFoundException('Release not found');
    return { success: true, message: `Release ${version} deployed successfully`, data: result };
  }

  @Post(':version/rollback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rollback release' })
  async rollback(
    @Param('version') version: string,
    @Body() body: { reason?: string },
    @Headers('x-admin-id') adminId: string = 'system',
  ) {
    const result = await this.releaseService.rollback(version, adminId, body.reason);
    if (!result) throw new NotFoundException('Release not found');
    return { success: true, message: `Release ${version} rolled back`, data: result };
  }
}
