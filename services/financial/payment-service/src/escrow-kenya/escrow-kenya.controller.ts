import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EscrowKenyaService } from './escrow-kenya.service';

@ApiTags('Escrow Kenya')
@Controller('api/escrow-kenya')
export class EscrowKenyaController {
  constructor(private readonly escrowKenyaService: EscrowKenyaService) {}

  @Post('transactions')
  @ApiOperation({ summary: 'Create escrow transaction' })
  async createTransaction(@Body() body: any) {
    const transaction = await this.escrowKenyaService.createEscrowTransaction(body);
    return { success: true, data: transaction, message: 'Escrow transaction created successfully' };
  }

  @Post('transactions/:transactionId/fund-mpesa')
  @ApiOperation({ summary: 'Fund with M-Pesa' })
  async fundWithMpesa(@Param('transactionId') transactionId: string, @Body() body: any) {
    await this.escrowKenyaService.fundEscrowTransaction(transactionId, { type: 'mpesa', details: body });
    const mpesaPayment = await this.escrowKenyaService.processMpesaPayment({
      phoneNumber: body.phoneNumber, amount: body.amount, transactionId,
      callbackUrl: `${process.env.WEBHOOK_BASE_URL}/api/escrow-kenya/mpesa-callback`,
    });
    return { success: true, data: mpesaPayment, message: 'M-Pesa payment initiated successfully' };
  }

  @Post('transactions/:transactionId/fund-card')
  @ApiOperation({ summary: 'Fund with card' })
  async fundWithCard(@Param('transactionId') transactionId: string, @Body() body: any) {
    const result = await this.escrowKenyaService.fundTransactionWithCard(transactionId, body);
    return { success: true, data: result };
  }

  @Post('transactions/:transactionId/release')
  @ApiOperation({ summary: 'Release escrow funds' })
  async releaseFunds(@Param('transactionId') transactionId: string) {
    const result = await this.escrowKenyaService.releaseFunds(transactionId);
    return { success: true, data: result };
  }

  @Post('transactions/:transactionId/refund')
  @ApiOperation({ summary: 'Refund escrow transaction' })
  async refundTransaction(@Param('transactionId') transactionId: string) {
    const result = await this.escrowKenyaService.refundTransaction(transactionId);
    return { success: true, data: result };
  }

  @Get('transactions/:transactionId/status')
  @ApiOperation({ summary: 'Get transaction status' })
  async getTransactionStatus(@Param('transactionId') transactionId: string) {
    const status = await this.escrowKenyaService.getTransactionStatus(transactionId);
    return { success: true, data: status };
  }

  @Get('users/:userId/transactions')
  @ApiOperation({ summary: 'Get user transaction history' })
  async getUserTransactions(@Param('userId') userId: string) {
    const transactions = await this.escrowKenyaService.getUserTransactionHistory(userId);
    return { success: true, data: transactions };
  }

  @Post('payouts')
  @ApiOperation({ summary: 'Create payout' })
  async createPayout(@Body() body: any) {
    const payout = await this.escrowKenyaService.createPayout(body);
    return { success: true, data: payout };
  }

  @Get('payouts/:payoutId/status')
  @ApiOperation({ summary: 'Get payout status' })
  async getPayoutStatus(@Param('payoutId') payoutId: string) {
    const status = await this.escrowKenyaService.getPayoutStatus(payoutId);
    return { success: true, data: status };
  }

  @Get('sellers/:sellerId/payouts')
  @ApiOperation({ summary: 'Get seller payout history' })
  async getSellerPayouts(@Param('sellerId') sellerId: string) {
    const payouts = await this.escrowKenyaService.getSellerPayoutHistory(sellerId);
    return { success: true, data: payouts };
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle webhook' })
  async handleWebhook(@Body() body: any) { return this.escrowKenyaService.handleWebhook(body); }

  @Post('mpesa-callback')
  @ApiOperation({ summary: 'Handle M-Pesa callback' })
  async handleMpesaCallback(@Body() body: any) { return this.escrowKenyaService.handleMpesaCallback(body); }

  @Get('stats/escrow')
  @ApiOperation({ summary: 'Get escrow stats' })
  async getEscrowStats() { return { success: true, data: await this.escrowKenyaService.getEscrowStats() }; }

  @Get('stats/mpesa')
  @ApiOperation({ summary: 'Get M-Pesa stats' })
  async getMpesaStats() { return { success: true, data: await this.escrowKenyaService.getMpesaStats() }; }
}
