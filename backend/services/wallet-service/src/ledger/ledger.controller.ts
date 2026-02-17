import { 
  Controller, 
  Post, 
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { LedgerService } from '../services/ledger.service';
import { CreditWalletDto, DebitWalletDto } from '../dto/ledger.dto';
import { toMinorUnits, formatMoney } from '../utils/money';

@ApiTags('ledger')
@Controller('api/v2/ledger')
@ApiBearerAuth()
export class LedgerController {
  private readonly logger = new Logger(LedgerController.name);

  constructor(private readonly ledgerService: LedgerService) {}

  @Post('credit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Credit wallet - إضافة رصيد',
    description: 'Add funds to wallet with idempotency support. Append-only operation.'
  })
  @ApiHeader({ name: 'x-request-id', required: false, description: 'Idempotency key' })
  @ApiResponse({ status: 201, description: 'Credit applied successfully' })
  @ApiResponse({ status: 200, description: 'Duplicate request - returning existing entry' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async creditWallet(
    @Body() dto: CreditWalletDto,
    @Headers('x-request-id') requestId?: string,
  ) {
    try {
      // Get user from auth (placeholder - will be replaced with JWT guard)
      const createdBy = 'system'; // TODO: Get from JWT token

      // Convert to minor units (e.g., cents for USD, piasters for EGP)
      const amountMinor = toMinorUnits(dto.amount);

      // Execute credit
      const result = await this.ledgerService.creditWallet({
        walletId: dto.walletId,
        amount: amountMinor,
        reason: dto.reason,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        description: dto.description,
        requestId: dto.requestId || requestId,
        createdBy,
      });

      // Format response
      const currency = 'EGP'; // TODO: Get from wallet

      return {
        success: true,
        data: {
          entryId: result.entryId,
          walletId: result.walletId,
          entryType: result.entryType,
          amount: result.amount,
          amountFormatted: formatMoney(BigInt(result.amount), currency),
          reason: result.reason,
          balanceBefore: result.balanceBefore,
          balanceBeforeFormatted: formatMoney(BigInt(result.balanceBefore), currency),
          balanceAfter: result.balanceAfter,
          balanceAfterFormatted: formatMoney(BigInt(result.balanceAfter), currency),
          idempotencyKey: result.idempotencyKey,
          createdAt: result.createdAt,
          isIdempotent: result.isIdempotent,
        },
        message: result.isIdempotent
          ? 'Duplicate request - returning existing entry'
          : 'Credit applied successfully',
        messageAr: result.isIdempotent
          ? 'طلب مكرر - إرجاع القيد الموجود'
          : 'تم إضافة الرصيد بنجاح',
      };
    } catch (error: any) {
      this.logger.error('Credit wallet error:', error);
      throw error;
    }
  }

  @Post('debit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Debit wallet - خصم رصيد',
    description: 'Remove funds from wallet with balance validation and idempotency support.'
  })
  @ApiHeader({ name: 'x-request-id', required: false, description: 'Idempotency key' })
  @ApiResponse({ status: 201, description: 'Debit applied successfully' })
  @ApiResponse({ status: 200, description: 'Duplicate request - returning existing entry' })
  @ApiResponse({ status: 400, description: 'Validation error or insufficient balance' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async debitWallet(
    @Body() dto: DebitWalletDto,
    @Headers('x-request-id') requestId?: string,
  ) {
    try {
      // Get user from auth (placeholder)
      const createdBy = 'system'; // TODO: Get from JWT token

      // Convert to minor units
      const amountMinor = toMinorUnits(dto.amount);

      // Execute debit
      const result = await this.ledgerService.debitWallet({
        walletId: dto.walletId,
        amount: amountMinor,
        reason: dto.reason,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        description: dto.description,
        requestId: dto.requestId || requestId,
        createdBy,
      });

      // Format response
      const currency = 'EGP'; // TODO: Get from wallet

      return {
        success: true,
        data: {
          entryId: result.entryId,
          walletId: result.walletId,
          entryType: result.entryType,
          amount: result.amount,
          amountFormatted: formatMoney(BigInt(result.amount), currency),
          reason: result.reason,
          balanceBefore: result.balanceBefore,
          balanceBeforeFormatted: formatMoney(BigInt(result.balanceBefore), currency),
          balanceAfter: result.balanceAfter,
          balanceAfterFormatted: formatMoney(BigInt(result.balanceAfter), currency),
          idempotencyKey: result.idempotencyKey,
          createdAt: result.createdAt,
          isIdempotent: result.isIdempotent,
        },
        message: result.isIdempotent
          ? 'Duplicate request - returning existing entry'
          : 'Debit applied successfully',
        messageAr: result.isIdempotent
          ? 'طلب مكرر - إرجاع القيد الموجود'
          : 'تم خصم الرصيد بنجاح',
      };
    } catch (error: any) {
      this.logger.error('Debit wallet error:', error);
      throw error;
    }
  }
}
