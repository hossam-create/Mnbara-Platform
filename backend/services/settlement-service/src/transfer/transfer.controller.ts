import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TransferService } from './transfer.service';
import { CreateTransferDto, EstimateTransferDto, CancelTransferDto } from './dto/create-transfer.dto';

@ApiTags('Transfers')
@Controller('api/transfers')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new transfer request' })
  async createTransfer(@Body() dto: CreateTransferDto) {
    const transfer = await this.transferService.createTransfer(dto);
    return { success: true, data: transfer, message: 'تم إنشاء طلب التحويل بنجاح' };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user transfers' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getUserTransfers(
    @Param('userId') userId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.transferService.getUserTransfers(
      userId,
      status,
      Number(page) || 1,
      Number(limit) || 20,
    );
    return { success: true, data };
  }

  @Get('corridors/available')
  @ApiOperation({ summary: 'Get available corridors' })
  @ApiQuery({ name: 'fromCountry', required: false })
  async getAvailableCorridors(@Query('fromCountry') fromCountry?: string) {
    const data = await this.transferService.getAvailableCorridors(fromCountry);
    return { success: true, data };
  }

  @Get(':transferId')
  @ApiOperation({ summary: 'Get transfer details' })
  async getTransferDetails(@Param('transferId') transferId: string) {
    const transfer = await this.transferService.getTransferDetails(transferId);
    if (!transfer) throw new NotFoundException('Transfer not found');
    return { success: true, data: transfer };
  }

  @Post(':transferId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a transfer' })
  async cancelTransfer(@Param('transferId') transferId: string, @Body() dto: CancelTransferDto) {
    const result = await this.transferService.cancelTransfer(transferId, dto.userId, dto.reason);
    return { success: true, data: result, message: 'تم إلغاء طلب التحويل' };
  }

  @Post('estimate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Estimate transfer cost' })
  async estimateTransfer(@Body() dto: EstimateTransferDto) {
    const data = await this.transferService.estimateTransfer(dto);
    return { success: true, data };
  }
}
