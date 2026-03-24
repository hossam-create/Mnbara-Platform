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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from '../dto/create-wallet.dto';
import { DepositDto } from '../dto/deposit.dto';
import { WithdrawDto } from '../dto/withdraw.dto';
import { ConvertDto } from '../dto/convert.dto';
import { Currency } from '@prisma/client';

@ApiTags('wallet')
@Controller('wallet')
@ApiBearerAuth()
export class WalletController {
  private readonly logger = new Logger(WalletController.name);

  constructor(private readonly walletService: WalletService) {}

  @Post()
  @ApiOperation({ summary: 'Create wallet - إنشاء محفظة' })
  @ApiResponse({ status: 201, description: 'Wallet created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or wallet already exists' })
  async createWallet(@Body() createWalletDto: CreateWalletDto) {
    try {
      const wallet = await this.walletService.createWallet(
        createWalletDto.userId,
        createWalletDto.primaryCurrency as Currency,
      );

      return {
        success: true,
        message: 'Wallet created successfully',
        messageAr: 'تم إنشاء المحفظة بنجاح',
        data: wallet,
      };
    } catch (error: any) {
      this.logger.error('Create wallet error:', error);
      throw error;
    }
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get wallet - الحصول على المحفظة' })
  @ApiResponse({ status: 200, description: 'Wallet retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getWallet(@Param('userId') userId: string) {
    try {
      const wallet = await this.walletService.getWallet(userId);

      return {
        success: true,
        data: wallet,
      };
    } catch (error: any) {
      this.logger.error('Get wallet error:', error);
      throw error;
    }
  }

  @Get(':userId/balance')
  @ApiOperation({ summary: 'Get total balance - الحصول على الرصيد الإجمالي' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  async getTotalBalance(
    @Param('userId') userId: string,
    @Query('displayCurrency') displayCurrency?: string,
  ) {
    try {
      const balance = await this.walletService.getTotalBalance(
        userId,
        (displayCurrency as Currency) || 'USD',
      );

      return {
        success: true,
        data: balance,
      };
    } catch (error: any) {
      this.logger.error('Get balance error:', error);
      throw error;
    }
  }

  @Post('deposit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deposit funds - إيداع' })
  @ApiResponse({ status: 200, description: 'Deposit successful' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async deposit(@Body() depositDto: DepositDto) {
    try {
      const result = await this.walletService.deposit(
        depositDto.userId,
        depositDto.currency as Currency,
        depositDto.amount,
        depositDto.referenceId,
      );

      return {
        success: true,
        message: 'Deposit successful',
        messageAr: 'تم الإيداع بنجاح',
        data: result,
      };
    } catch (error: any) {
      this.logger.error('Deposit error:', error);
      throw error;
    }
  }

  @Post('withdraw')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw funds - سحب' })
  @ApiResponse({ status: 200, description: 'Withdrawal successful' })
  @ApiResponse({ status: 400, description: 'Insufficient balance or invalid input' })
  async withdraw(@Body() withdrawDto: WithdrawDto) {
    try {
      const result = await this.walletService.withdraw(
        withdrawDto.userId,
        withdrawDto.currency as Currency,
        withdrawDto.amount,
        withdrawDto.referenceId,
      );

      return {
        success: true,
        message: 'Withdrawal successful',
        messageAr: 'تم السحب بنجاح',
        data: result,
      };
    } catch (error: any) {
      this.logger.error('Withdrawal error:', error);
      throw error;
    }
  }

  @Post('convert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert between currencies - تحويل بين العملات' })
  @ApiResponse({ status: 200, description: 'Conversion successful' })
  @ApiResponse({ status: 400, description: 'Insufficient balance or invalid currencies' })
  async convert(@Body() convertDto: ConvertDto) {
    try {
      const result = await this.walletService.convert(
        convertDto.userId,
        convertDto.fromCurrency as Currency,
        convertDto.toCurrency as Currency,
        convertDto.amount,
      );

      return {
        success: true,
        message: 'Conversion successful',
        messageAr: 'تم التحويل بنجاح',
        data: result,
      };
    } catch (error: any) {
      this.logger.error('Conversion error:', error);
      throw error;
    }
  }

  @Get(':userId/transactions')
  @ApiOperation({ summary: 'Get transaction history - الحصول على تاريخ المعاملات' })
  @ApiResponse({ status: 200, description: 'Transaction history retrieved' })
  async getTransactionHistory(
    @Param('userId') userId: string,
    @Query('currency') currency?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const result = await this.walletService.getTransactionHistory(userId, {
        currency: currency as Currency,
        type: type as any,
        limit: limit ? parseInt(limit) : 20,
        offset: offset ? parseInt(offset) : 0,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      this.logger.error('Get transaction history error:', error);
      throw error;
    }
  }
}
