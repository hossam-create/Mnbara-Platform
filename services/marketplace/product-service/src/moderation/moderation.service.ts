import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationStatus } from '@prisma/client';

interface ModerationCheckResult { blocked: boolean; flagged: boolean; reason?: string; }

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkContent(title: string, description: string): Promise<ModerationCheckResult> {
    const combined = `${title} ${description}`.toLowerCase();
    const blockedKeywords = await this.getBlockedKeywords();
    for (const keyword of blockedKeywords) {
      if (combined.includes(keyword.toLowerCase())) {
        return { blocked: true, flagged: true, reason: `Contains restricted keyword: ${keyword}` };
      }
    }
    const suspiciousPatterns = this.getSuspiciousPatterns();
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(combined)) {
        return { blocked: false, flagged: true, reason: 'Content flagged for review due to suspicious patterns' };
      }
    }
    return { blocked: false, flagged: false };
  }

  async checkRestrictedKeywords(text: string): Promise<ModerationCheckResult> {
    const lowerText = text.toLowerCase();
    const restricted = await this.prisma.restrictedProduct.findMany({ where: { isActive: true } });
    for (const item of restricted) {
      if (lowerText.includes(item.keyword.toLowerCase())) {
        if (item.severity === 'BLOCK') return { blocked: true, flagged: true, reason: `Blocked keyword: ${item.keyword}` };
        if (item.severity === 'FLAG_FOR_REVIEW') return { blocked: false, flagged: true, reason: `Flagged keyword: ${item.keyword}` };
      }
    }
    return { blocked: false, flagged: false };
  }

  private async getBlockedKeywords(): Promise<string[]> {
    const restricted = await this.prisma.restrictedProduct.findMany({
      where: { isActive: true, severity: { in: ['BLOCK', 'FLAG_FOR_REVIEW'] } }, select: { keyword: true },
    });
    return restricted.map((r: any) => r.keyword);
  }

  private getSuspiciousPatterns(): RegExp[] {
    return [
      /\b(cheap|fake|replica)\s+(brand|watch|bag|shoe)/i,
      /\b(\$|USD)\s*0*[1-9]\d*/i,
      /\b(call\s*me|whatsapp|email)\s*(now|immediately)/i,
    ];
  }

  async logAction(params: { productId: string; action: string; previousStatus?: any; newStatus: any; reason?: string; moderatorId?: string }) {
    await this.prisma.moderationLog.create({ data: params as any });
    this.logger.log('Moderation action logged', params);
  }

  async approveProduct(productId: string, moderatorId: string) {
    await this.prisma.$transaction([
      this.prisma.product.update({ where: { id: productId }, data: { moderationStatus: ModerationStatus.APPROVED, status: 'DRAFT', restrictedFlag: false } }),
      this.prisma.moderationLog.create({ data: { productId, action: 'APPROVED', newStatus: ModerationStatus.APPROVED, moderatorId } }),
    ]);
    this.logger.log(`Product approved: ${productId}`);
  }

  async rejectProduct(productId: string, reason: string, moderatorId: string) {
    await this.prisma.$transaction([
      this.prisma.product.update({ where: { id: productId }, data: { moderationStatus: ModerationStatus.REJECTED, status: 'REJECTED', moderationNote: reason } }),
      this.prisma.moderationLog.create({ data: { productId, action: 'REJECTED', newStatus: ModerationStatus.REJECTED, reason, moderatorId } }),
    ]);
    this.logger.log(`Product rejected: ${productId}`);
  }

  async flagProduct(productId: string, reason: string) {
    await this.prisma.$transaction([
      this.prisma.product.update({ where: { id: productId }, data: { moderationStatus: ModerationStatus.FLAGGED, restrictedFlag: true, restrictedReason: reason } }),
      this.prisma.moderationLog.create({ data: { productId, action: 'FLAGGED', newStatus: ModerationStatus.FLAGGED, reason } }),
    ]);
    this.logger.log(`Product flagged: ${productId}`);
  }

  async getModerationStats() {
    const [pending, approved, rejected, flagged] = await Promise.all([
      this.prisma.product.count({ where: { moderationStatus: ModerationStatus.PENDING } }),
      this.prisma.product.count({ where: { moderationStatus: ModerationStatus.APPROVED } }),
      this.prisma.product.count({ where: { moderationStatus: ModerationStatus.REJECTED } }),
      this.prisma.product.count({ where: { moderationStatus: ModerationStatus.FLAGGED } }),
    ]);
    return { pending, approved, rejected, flagged };
  }

  async getPendingProducts(page = 1, limit = 20) {
    return this.prisma.product.findMany({
      where: { moderationStatus: ModerationStatus.PENDING },
      include: { images: { take: 1 }, category: { select: { nameEn: true, nameAr: true } }, seller: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' }, skip: (page - 1) * limit, take: limit,
    });
  }

  async addRestrictedKeyword(keyword: string, severity: string, messageEn: string, messageAr: string, category?: string) {
    await this.prisma.restrictedProduct.create({ data: { keyword, severity, messageEn, messageAr, category, isActive: true } as any });
  }

  async getProductLogs(productId: string) {
    return this.prisma.moderationLog.findMany({ where: { productId }, orderBy: { createdAt: 'desc' } });
  }
}
