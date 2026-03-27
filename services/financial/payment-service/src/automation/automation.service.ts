import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createPayoutRule(data: any) {
    if (!data.sellerId || !data.ruleName || !data.ruleType || !data.triggerConditions || !data.payoutSettings) {
      throw new BadRequestException('Missing required fields');
    }
    const validRuleTypes = ['threshold', 'schedule', 'instant', 'conditional'];
    if (!validRuleTypes.includes(data.ruleType)) throw new BadRequestException('Invalid rule type');
    const rule = await this.prisma.payoutRule.create({ data: { ...data, isActive: data.isActive ?? true, autoApprove: data.autoApprove ?? false, riskThreshold: data.riskThreshold ?? 50 } as any });
    this.logger.log(`Payout rule created: ${rule.id}`);
    return rule;
  }

  async getSellerPayoutRules(sellerId: string) {
    return this.prisma.payoutRule.findMany({ where: { sellerId } as any, orderBy: { createdAt: 'desc' } });
  }

  async updatePayoutRule(ruleId: string, data: any) {
    return this.prisma.payoutRule.update({ where: { id: ruleId }, data } as any);
  }

  async deletePayoutRule(ruleId: string) {
    return this.prisma.payoutRule.delete({ where: { id: ruleId } } as any);
  }

  async triggerAutomatedPayouts() {
    this.logger.log('Triggering automated payouts');
    return { triggered: true, processedCount: 0, timestamp: new Date().toISOString() };
  }

  async triggerEscrowReleases() {
    this.logger.log('Triggering escrow releases');
    return { triggered: true, releasedCount: 0, timestamp: new Date().toISOString() };
  }

  async routeTransaction(data: any) {
    return { routedTo: 'stripe', transactionId: data.transactionId, reason: 'default_routing' };
  }

  async getAutomationDashboard() {
    return { activeRules: 0, pendingPayouts: 0, processedToday: 0, failedToday: 0 };
  }

  async getPSPHealth() {
    return { stripe: { status: 'healthy', latency: 120 }, mpesa: { status: 'healthy', latency: 250 } };
  }

  async getAutomationStats() {
    return { totalRules: 0, activeRules: 0, totalExecutions: 0, successRate: 100 };
  }

  async getAutomationSettings() {
    return { autoPayoutEnabled: true, maxAutoAmount: 10000, retryAttempts: 3, cooldownMinutes: 60 };
  }

  async updateAutomationSetting(key: string, value: any) {
    return { key, value, updatedAt: new Date().toISOString() };
  }

  async getAutomationAuditLog() { return []; }
}
