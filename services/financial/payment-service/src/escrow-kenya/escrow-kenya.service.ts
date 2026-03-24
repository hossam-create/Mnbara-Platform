import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EscrowKenyaService {
  private readonly logger = new Logger(EscrowKenyaService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createEscrowTransaction(data: { amount: number; currency?: string; buyerId: string; sellerId: string; description: string; orderId: string }) {
    if (!data.amount || !data.buyerId || !data.sellerId || !data.description || !data.orderId) {
      throw new BadRequestException('Missing required fields');
    }
    const transaction = await this.prisma.escrowTransaction.create({
      data: { ...data, currency: data.currency || 'KES', status: 'PENDING' } as any,
    });
    this.logger.log(`Escrow transaction created: ${transaction.id}`);
    return transaction;
  }

  async fundEscrowTransaction(transactionId: string, paymentDetails: any) {
    return this.prisma.escrowTransaction.update({
      where: { id: transactionId }, data: { status: 'FUNDED', fundedAt: new Date(), paymentMethod: paymentDetails.type } as any,
    });
  }

  async processMpesaPayment(data: { phoneNumber: string; amount: number; transactionId: string; callbackUrl: string }) {
    this.logger.log(`M-Pesa payment initiated for ${data.transactionId}`);
    return { checkoutRequestId: `mpesa_${Date.now()}`, merchantRequestId: `mr_${Date.now()}`, responseCode: '0', responseDescription: 'Success', customerMessage: 'STK push sent' };
  }

  async fundTransactionWithCard(transactionId: string, cardDetails: any) {
    return this.prisma.escrowTransaction.update({
      where: { id: transactionId }, data: { status: 'FUNDED', fundedAt: new Date(), paymentMethod: 'card' } as any,
    });
  }

  async releaseFunds(transactionId: string) {
    return this.prisma.escrowTransaction.update({
      where: { id: transactionId }, data: { status: 'RELEASED', releasedAt: new Date() } as any,
    });
  }

  async refundTransaction(transactionId: string) {
    return this.prisma.escrowTransaction.update({
      where: { id: transactionId }, data: { status: 'REFUNDED', refundedAt: new Date() } as any,
    });
  }

  async getTransactionStatus(transactionId: string) {
    return this.prisma.escrowTransaction.findUnique({ where: { id: transactionId } });
  }

  async getUserTransactionHistory(userId: string) {
    return this.prisma.escrowTransaction.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] } as any, orderBy: { createdAt: 'desc' },
    });
  }

  async createPayout(data: any) {
    return this.prisma.payout.create({ data: { ...data, status: 'PENDING' } as any });
  }

  async getPayoutStatus(payoutId: string) {
    return this.prisma.payout.findUnique({ where: { id: payoutId } });
  }

  async getSellerPayoutHistory(sellerId: string) {
    return this.prisma.payout.findMany({ where: { sellerId } as any, orderBy: { createdAt: 'desc' } });
  }

  async handleWebhook(event: any) { this.logger.log('Webhook received', event?.type); return { received: true }; }
  async handleMpesaCallback(data: any) { this.logger.log('M-Pesa callback', data); return { received: true }; }

  async getEscrowStats() {
    const [total, funded, released, refunded] = await Promise.all([
      this.prisma.escrowTransaction.count(),
      this.prisma.escrowTransaction.count({ where: { status: 'FUNDED' } as any }),
      this.prisma.escrowTransaction.count({ where: { status: 'RELEASED' } as any }),
      this.prisma.escrowTransaction.count({ where: { status: 'REFUNDED' } as any }),
    ]);
    return { total, funded, released, refunded };
  }

  async getMpesaStats() { return { totalTransactions: 0, successRate: 0, averageAmount: 0 }; }
}
