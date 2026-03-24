import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransferStatus } from '@prisma/client';
import { RatesService } from '../rates/rates.service';

@Injectable()
export class TransferService {
  private readonly logger = new Logger(TransferService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ratesService: RatesService,
  ) {}

  async createTransfer(input: {
    senderId: string;
    senderCountry: string;
    senderCurrency: string;
    sendAmount: number;
    recipientCountry: string;
    recipientCurrency: string;
    recipientId?: string;
  }) {
    const rate = await this.ratesService.getExchangeRate(
      input.senderCurrency,
      input.recipientCurrency,
    );

    if (!rate) {
      throw new Error('Exchange rate not available');
    }

    const exchangeRate = Number(rate.midRate);
    const spreadPercent = 0.005;
    const effectiveRate = exchangeRate * (1 - spreadPercent);
    const receiveAmount = input.sendAmount * effectiveRate;

    const platformFee = this.calculateFee(input.sendAmount, input.senderCountry, input.recipientCountry);
    const totalCost = input.sendAmount + platformFee;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const transfer = await this.prisma.transferRequest.create({
      data: {
        senderId: input.senderId,
        senderCountry: input.senderCountry,
        senderCurrency: input.senderCurrency,
        sendAmount: input.sendAmount,
        recipientId: input.recipientId,
        recipientCountry: input.recipientCountry,
        recipientCurrency: input.recipientCurrency,
        receiveAmount,
        exchangeRate: effectiveRate,
        marketRate: exchangeRate,
        spreadPercent,
        platformFee,
        totalCost,
        status: TransferStatus.PENDING,
        expiresAt,
      },
    });

    return {
      ...transfer,
      estimatedMatchTime: await this.getEstimatedMatchTime(input.senderCountry, input.recipientCountry),
    };
  }

  private calculateFee(amount: number, _fromCountry?: string, _toCountry?: string): number {
    const feePercent = 0.005;
    const minFee = 1;
    const maxFee = 50;

    let fee = amount * feePercent;
    fee = Math.max(fee, minFee);
    fee = Math.min(fee, maxFee);

    return Math.round(fee * 100) / 100;
  }

  private async getEstimatedMatchTime(fromCountry: string, toCountry: string): Promise<string> {
    const corridor = await this.prisma.transferCorridor.findUnique({
      where: { fromCountry_toCountry: { fromCountry, toCountry } },
    });

    if (corridor?.avgMatchTime) {
      return `${corridor.avgMatchTime} دقيقة`;
    }

    return '30-60 دقيقة';
  }

  async getUserTransfers(userId: string, status?: string, page: number = 1, limit: number = 20) {
    const where: any = { senderId: userId };
    if (status) where.status = status;

    const [transfers, total] = await Promise.all([
      this.prisma.transferRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { matches: { where: { status: { not: 'REJECTED' } }, take: 1 } },
      }),
      this.prisma.transferRequest.count({ where }),
    ]);

    return {
      transfers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getTransferDetails(transferId: string) {
    return this.prisma.transferRequest.findUnique({
      where: { id: transferId },
      include: { matches: { include: { counterRequest: true } } },
    });
  }

  async cancelTransfer(transferId: string, userId: string, _reason?: string) {
    const transfer = await this.prisma.transferRequest.findUnique({
      where: { id: transferId },
    });

    if (!transfer) throw new Error('Transfer not found');
    if (transfer.senderId !== userId) throw new Error('Unauthorized');
    if (!['PENDING', 'MATCHING'].includes(transfer.status)) {
      throw new Error('Cannot cancel transfer in current status');
    }

    return this.prisma.transferRequest.update({
      where: { id: transferId },
      data: { status: TransferStatus.CANCELLED },
    });
  }

  async estimateTransfer(input: {
    senderCurrency: string;
    recipientCurrency: string;
    sendAmount: number;
    senderCountry?: string;
    recipientCountry?: string;
  }) {
    const rate = await this.ratesService.getExchangeRate(input.senderCurrency, input.recipientCurrency);
    if (!rate) throw new Error('Exchange rate not available');

    const exchangeRate = Number(rate.midRate);
    const spreadPercent = 0.005;
    const effectiveRate = exchangeRate * (1 - spreadPercent);
    const receiveAmount = input.sendAmount * effectiveRate;
    const platformFee = this.calculateFee(input.sendAmount);
    const totalCost = input.sendAmount + platformFee;

    const westernUnionFee = input.sendAmount * 0.05;
    const savings = westernUnionFee - platformFee;

    return {
      sendAmount: input.sendAmount,
      senderCurrency: input.senderCurrency,
      receiveAmount: Math.round(receiveAmount * 100) / 100,
      recipientCurrency: input.recipientCurrency,
      exchangeRate: effectiveRate,
      marketRate: exchangeRate,
      spreadPercent: spreadPercent * 100,
      platformFee,
      totalCost,
      comparison: {
        westernUnionFee,
        savings: Math.round(savings * 100) / 100,
        savingsPercent: Math.round((savings / westernUnionFee) * 100),
      },
    };
  }

  async getAvailableCorridors(fromCountry?: string) {
    const where: any = { isActive: true };
    if (fromCountry) where.fromCountry = fromCountry;

    return this.prisma.transferCorridor.findMany({
      where,
      orderBy: { totalVolume: 'desc' },
    });
  }
}
