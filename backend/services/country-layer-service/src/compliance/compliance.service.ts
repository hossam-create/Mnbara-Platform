import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAllRules(filters: { page?: number; limit?: number; countryCode?: string }) {
    const { page = 1, limit = 50, countryCode } = filters;
    const where: any = {};
    if (countryCode) where.countryCode = countryCode;
    return this.prisma.countryRule.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } } as any);
  }

  async getRuleById(ruleId: string) {
    const rule = await this.prisma.countryRule.findUnique({ where: { id: ruleId } } as any);
    if (!rule) throw new NotFoundException('Rule not found');
    return rule;
  }

  async createRule(data: any) {
    const rule = await this.prisma.countryRule.create({ data } as any);
    this.logger.log(`Rule created: ${rule.id}`);
    return rule;
  }

  async updateRule(ruleId: string, data: any) {
    const existing = await this.prisma.countryRule.findUnique({ where: { id: ruleId } } as any);
    if (!existing) return null;
    return this.prisma.countryRule.update({ where: { id: ruleId }, data } as any);
  }

  async deleteRule(ruleId: string) {
    const existing = await this.prisma.countryRule.findUnique({ where: { id: ruleId } } as any);
    if (!existing) return null;
    return this.prisma.countryRule.delete({ where: { id: ruleId } } as any);
  }

  async validateRoute(data: { originCountry: string; destinationCountry: string; productType?: string }) {
    const rules = await this.prisma.countryRule.findMany({
      where: {
        OR: [
          { countryCode: data.originCountry },
          { countryCode: data.destinationCountry },
        ],
        isActive: true,
      },
    } as any);

    const violations = (rules as any[]).filter((rule: any) => rule.ruleType === 'restriction' || rule.ruleType === 'embargo');
    return {
      allowed: violations.length === 0,
      originCountry: data.originCountry,
      destinationCountry: data.destinationCountry,
      rulesChecked: (rules as any[]).length,
      violations: violations.map((v: any) => ({ ruleId: v.id, ruleName: v.name, ruleType: v.ruleType, description: v.description })),
    };
  }

  async validateProductRoute(productId: string, destinationCountry: string) {
    const productCountries = await this.prisma.productCountry.findMany({ where: { productId } } as any);
    if (!productCountries || (productCountries as any[]).length === 0) {
      return { allowed: true, productId, destinationCountry, message: 'No country restrictions found for product' };
    }
    const originCountry = (productCountries as any[])[0]?.countryCode;
    if (originCountry) {
      return this.validateRoute({ originCountry, destinationCountry });
    }
    return { allowed: true, productId, destinationCountry, message: 'Product origin country not set' };
  }

  async getComplianceLogs(filters: { page?: number; limit?: number; productId?: string; countryCode?: string }) {
    const { page = 1, limit = 50, productId, countryCode } = filters;
    const where: any = {};
    if (productId) where.productId = productId;
    if (countryCode) where.countryCode = countryCode;
    return this.prisma.complianceLog.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } } as any);
  }

  async getComplianceLogById(logId: string) {
    const log = await this.prisma.complianceLog.findUnique({ where: { id: logId } } as any);
    if (!log) throw new NotFoundException('Compliance log not found');
    return log;
  }
}
