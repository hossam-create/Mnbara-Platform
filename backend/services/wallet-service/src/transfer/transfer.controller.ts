import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TransferService } from '../services/transfer.service';
import { CreateTransferDto } from '../dto/transfer.dto';

@ApiTags('transfer')
@Controller('transfer')
@ApiBearerAuth()
export class TransferController {
  private readonly logger = new Logger(TransferController.name);

  constructor(private readonly transferService: TransferService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create transfer - إنشاء تحويل' })
  @ApiResponse({ status: 201, description: 'Transfer completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or insufficient balance' })
  async createTransfer(@Body() createTransferDto: CreateTransferDto) {
    try {
      const transfer = await this.transferService.createTransfer({
        fromUserId: createTransferDto.fromUserId,
        toUserId: createTransferDto.toUserId,
        fromCurrency: createTransferDto.fromCurrency as any,
        toCurrency: createTransferDto.toCurrency as any,
        amount: createTransferDto.amount,
        note: createTransferDto.note,
      });

      return {
        success: true,
        message: 'Transfer completed',
        messageAr: 'تم التحويل بنجاح',
        data: transfer,
      };
    } catch (error: any) {
      this.logger.error('Create transfer error:', error);
      throw error;
    }
  }

  @Get(':transferId')
  @ApiOperation({ summary: 'Get transfer - الحصول على تحويل' })
  @ApiResponse({ status: 200, description: 'Transfer retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  async getTransfer(@Param('transferId') transferId: string) {
    try {
      const transfer = await this.transferService.getTransfer(transferId);

      return {
        success: true,
        data: transfer,
      };
    } catch (error: any) {
      this.logger.error('Get transfer error:', error);
      throw error;
    }
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user transfers - الحصول على تحويلات المستخدم' })
  @ApiQuery({ name: 'type', required: false, enum: ['sent', 'received', 'all'] })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Transfers retrieved successfully' })
  async getUserTransfers(
    @Param('userId') userId: string,
    @Query('type') type?: 'sent' | 'received' | 'all',
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const transfers = await this.transferService.getUserTransfers(userId, {
        type,
        status: status as any,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });

      return {
        success: true,
        data: transfers,
      };
    } catch (error: any) {
      this.logger.error('Get user transfers error:', error);
      throw error;
    }
  }

  @Get('fee/calculate')
  @ApiOperation({ summary: 'Calculate transfer fee - حساب رسوم التحويل' })
  @ApiQuery({ name: 'fromCurrency', required: true })
  @ApiQuery({ name: 'toCurrency', required: true })
  @ApiQuery({ name: 'amount', required: true, type: Number })
  @ApiResponse({ status: 200, description: 'Fee calculated successfully' })
  async calculateFee(
    @Query('fromCurrency') fromCurrency: string,
    @Query('toCurrency') toCurrency: string,
    @Query('amount') amount: string,
  ) {
    try {
      const fee = await this.transferService.calculateFee(
        fromCurrency as any,
        toCurrency as any,
        parseFloat(amount),
      );

      return {
        success: true,
        data: fee,
      };
    } catch (error: any) {
      this.logger.error('Calculate fee error:', error);
      throw error;
    }
  }
}
