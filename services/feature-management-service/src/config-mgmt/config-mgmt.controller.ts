import {
  Controller, Get, Put, Delete, Body, Param, Query, Headers,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ConfigMgmtService } from './config-mgmt.service';

@ApiTags('System Config')
@Controller('api/v1/config')
export class ConfigMgmtController {
  constructor(private readonly configMgmtService: ConfigMgmtService) {}

  @Get('categories/list')
  @ApiOperation({ summary: 'Get all config categories' })
  async getCategories() {
    const data = await this.configMgmtService.getCategories();
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List configs by category' })
  @ApiQuery({ name: 'category', required: false })
  async list(@Query('category') category?: string) {
    const data = await this.configMgmtService.list(category);
    return { success: true, data };
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get config by key' })
  async getByKey(@Param('key') key: string) {
    const config = await this.configMgmtService.getByKey(key);
    if (!config) throw new NotFoundException('Config not found');
    return { success: true, data: config };
  }

  @Put(':key')
  @ApiOperation({ summary: 'Set config value' })
  async set(
    @Param('key') key: string,
    @Body() body: { value: any; description?: string; isSecret?: boolean; category?: string },
    @Headers('x-admin-id') adminId: string = 'system',
  ) {
    const data = await this.configMgmtService.set(key, body, adminId);
    return { success: true, message: 'Config updated successfully', messageAr: 'تم تحديث الإعداد بنجاح', data };
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete config' })
  async delete(@Param('key') key: string) {
    await this.configMgmtService.delete(key);
    return { success: true, message: 'Config deleted successfully', messageAr: 'تم حذف الإعداد بنجاح' };
  }
}
