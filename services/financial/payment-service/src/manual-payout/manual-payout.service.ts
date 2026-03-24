import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ManualPayoutService {
  private readonly logger = new Logger(ManualPayoutService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma as any;
  }

  async createPayoutRequest(data: any) {
    if (!data.sellerId || !data.userId || !data.amount || !data.bankAccountName || !data.bankAccountNumber || !data.bankName) {
      throw new BadRequestException('Missing required fields');
    }
    if (data.amount <= 0) throw new BadRequestException('Amount must be greater than 0');
    const request = await this.db.payoutRequest.create({
      data: { ...data, currency: data.currency || 'USD', payoutMethod: data.payoutMethod || 'bank_transfer', status: 'PENDING' } as any,
    });
    this.logger.log(`Payout request created: ${request.id}`);
    return request;
  }

  async getSellerPayoutRequests(sellerId: string) {
    return this.db.payoutRequest.findMany({ where: { sellerId } as any, orderBy: { createdAt: 'desc' } });
  }

  async getPayoutRequest(requestId: string) {
    return this.db.payoutRequest.findUnique({ where: { id: requestId } });
  }

  async getSellerPayoutSummary(sellerId: string) {
    const requests = await this.db.payoutRequest.findMany({ where: { sellerId } as any });
    const total = requests.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
    const pending = requests.filter((r: any) => r.status === 'PENDING').length;
    const completed = requests.filter((r: any) => r.status === 'COMPLETED').length;
    return { sellerId, totalAmount: total, totalRequests: requests.length, pending, completed };
  }

  async createWeeklyBatch(data: any) {
    this.logger.log('Creating weekly payout batch');
    return { batchId: `batch_${Date.now()}`, status: 'CREATED', createdAt: new Date().toISOString() };
  }

  async getPayoutBatches() { return []; }

  async exportBatchToCSV(batchId: string) {
    return { batchId, csvUrl: `https://mock-storage.example.com/batches/${batchId}.csv` };
  }

  async updatePayoutStatus(requestId: string, status: string, notes?: string) {
    return this.db.payoutRequest.update({ where: { id: requestId }, data: { status, notes } as any });
  }

  async getPendingRequests() {
    return this.db.payoutRequest.findMany({ where: { status: 'PENDING' } as any, orderBy: { createdAt: 'asc' } });
  }

  async getPayoutStats() {
    const [total, pending, completed, rejected] = await Promise.all([
      this.db.payoutRequest.count(),
      this.db.payoutRequest.count({ where: { status: 'PENDING' } as any }),
      this.db.payoutRequest.count({ where: { status: 'COMPLETED' } as any }),
      this.db.payoutRequest.count({ where: { status: 'REJECTED' } as any }),
    ]);
    return { total, pending, completed, rejected };
  }

  async getPayoutSettings() { return { minPayoutAmount: 10, maxPayoutAmount: 50000, payoutSchedule: 'weekly', processingDays: 3 }; }
  async updatePayoutSetting(key: string, value: any) { return { key, value, updatedAt: new Date().toISOString() }; }
  async getPayoutAuditLog(requestId: string) { return []; }
}
