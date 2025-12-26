import { PrismaClient, TransferStatus } from '@prisma/client';
import { RatesService } from './rates.service';

const prisma = new PrismaClient();
const ratesService = new RatesService();

interface CreateTransferInput {
  senderId: string;
  senderCountry: string;
  senderCurrency: string;
  sendAmount: number;
  recipientCountry: string;
  recipientCurrency: string;
  recipientId?: string;
}

interface EstimateInput {
  senderCurrency: string;
  recipientCurrency: string;
  sendAmount: number;
  senderCountry?: string;
  recipientCountry?: string;
}

export class TransferService {
  /**
   * إنشاء طلب تحويل جديد
   */
  async createTransfer(input: CreateTransferInput) {
    // الحصول على سعر الصرف
    const rate = await ratesService.getExchangeRate(
      input.senderCurrency,
      input.recipientCurrency
    );

    if (!rate) {
      throw new Error('Exchange rate not available');
    }

    // حساب المبلغ المستلم
    const exchangeRate = Number(rate.midRate);
    const spreadPercent = 0.005; // 0.5%
    const effectiveRate = exchangeRate * (1 - spreadPercent);
    const receiveAmount = input.sendAmount * effectiveRate;

    // حساب الرسوم
    const platformFee = this.calculateFee(input.sendAmount, input.senderCountry, input.recipientCountry);
    const totalCost = input.sendAmount + platformFee;

    // تحديد وقت انتهاء الصلاحية (24 ساعة)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // إنشاء الطلب
    const transfer = await prisma.transferRequest.create({
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
        expiresAt
      }
    });

    return {
      ...transfer,
      estimatedMatchTime: await this.getEstimatedMatchTime(
        input.senderCountry,
        input.recipientCountry
      )
    };
  }

  /**
   * حساب الرسوم
   */
  private calculateFee(amount: number, fromCountry?: string, toCountry?: string): number {
    // رسوم أساسية: 0.5% مع حد أدنى 1 وحد أقصى 50
    const feePercent = 0.005;
    const minFee = 1;
    const maxFee = 50;

    let fee = amount * feePercent;
    fee = Math.max(fee, minFee);
    fee = Math.min(fee, maxFee);

    return Math.round(fee * 100) / 100;
  }

  /**
   * الحصول على الوقت المتوقع للمطابقة
   */
  private async getEstimatedMatchTime(fromCountry: string, toCountry: string): Promise<string> {
    const corridor = await prisma.transferCorridor.findUnique({
      where: {
        fromCountry_toCountry: { fromCountry, toCountry }
      }
    });

    if (corridor?.avgMatchTime) {
      return `${corridor.avgMatchTime} دقيقة`;
    }

    return '30-60 دقيقة';
  }

  /**
   * الحصول على طلبات المستخدم
   */
  async getUserTransfers(
    userId: string,
    status?: string,
    page: number = 1,
    limit: number = 20
  ) {
    const where: any = { senderId: userId };
    if (status) {
      where.status = status;
    }

    const [transfers, total] = await Promise.all([
      prisma.transferRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          matches: {
            where: { status: { not: 'REJECTED' } },
            take: 1
          }
        }
      }),
      prisma.transferRequest.count({ where })
    ]);

    return {
      transfers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * الحصول على تفاصيل طلب
   */
  async getTransferDetails(transferId: string) {
    return prisma.transferRequest.findUnique({
      where: { id: transferId },
      include: {
        matches: {
          include: {
            counterRequest: true
          }
        }
      }
    });
  }

  /**
   * إلغاء طلب تحويل
   */
  async cancelTransfer(transferId: string, userId: string, reason?: string) {
    const transfer = await prisma.transferRequest.findUnique({
      where: { id: transferId }
    });

    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.senderId !== userId) {
      throw new Error('Unauthorized');
    }

    if (!['PENDING', 'MATCHING'].includes(transfer.status)) {
      throw new Error('Cannot cancel transfer in current status');
    }

    return prisma.transferRequest.update({
      where: { id: transferId },
      data: { status: TransferStatus.CANCELLED }
    });
  }

  /**
   * حساب تكلفة التحويل
   */
  async estimateTransfer(input: EstimateInput) {
    const rate = await ratesService.getExchangeRate(
      input.senderCurrency,
      input.recipientCurrency
    );

    if (!rate) {
      throw new Error('Exchange rate not available');
    }

    const exchangeRate = Number(rate.midRate);
    const spreadPercent = 0.005;
    const effectiveRate = exchangeRate * (1 - spreadPercent);
    const receiveAmount = input.sendAmount * effectiveRate;
    const platformFee = this.calculateFee(input.sendAmount);
    const totalCost = input.sendAmount + platformFee;

    // مقارنة مع Western Union (تقريبي)
    const westernUnionFee = input.sendAmount * 0.05; // 5% تقريباً
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
        savingsPercent: Math.round((savings / westernUnionFee) * 100)
      }
    };
  }

  /**
   * الحصول على الممرات المتاحة
   */
  async getAvailableCorridors(fromCountry?: string) {
    const where: any = { isActive: true };
    if (fromCountry) {
      where.fromCountry = fromCountry;
    }

    return prisma.transferCorridor.findMany({
      where,
      orderBy: { totalVolume: 'desc' }
    });
  }
}
