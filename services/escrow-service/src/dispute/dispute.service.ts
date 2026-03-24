import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DisputeReason, DisputeRole, DisputeStatus, DisputeResolution } from '@prisma/client';

@Injectable()
export class DisputeService {
  private readonly logger = new Logger(DisputeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async openDispute(data: {
    escrowId: string; initiatedBy: string; initiatorRole: DisputeRole;
    reason: DisputeReason; description: string; evidence?: any[];
  }) {
    const { escrowId, initiatedBy, initiatorRole, reason, description, evidence = [] } = data;

    const escrow = await this.prisma.escrowTransaction.findUnique({ where: { id: escrowId } });
    if (!escrow) throw new NotFoundException('Escrow not found');

    if (['RELEASED', 'REFUNDED', 'CANCELLED'].includes(escrow.status)) {
      throw new BadRequestException('Cannot dispute this transaction');
    }

    const dispute = await this.prisma.escrowDispute.create({
      data: {
        initiatedBy, initiatorRole, reason, description, evidence,
        messages: {
          create: {
            senderId: initiatedBy, senderRole: initiatorRole,
            message: description,
            attachments: evidence.map((e: any) => e.url || e),
          },
        },
      },
    });

    await this.prisma.escrowTransaction.update({
      where: { id: escrowId },
      data: {
        status: 'DISPUTED', disputeId: dispute.id,
        timeline: {
          create: {
            event: 'DISPUTE_OPENED',
            description: `Dispute opened: ${reason}`,
            descriptionAr: `تم فتح نزاع: ${reason}`,
            actor: initiatedBy, actorRole: initiatorRole.toLowerCase(),
          },
        },
      },
    });

    return dispute;
  }

  async getDispute(disputeId: string) {
    const dispute = await this.prisma.escrowDispute.findUnique({
      where: { id: disputeId },
      include: { messages: { orderBy: { createdAt: 'asc' } }, escrows: true },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');
    return dispute;
  }

  async addMessage(data: {
    disputeId: string; senderId: string; senderRole: DisputeRole;
    message: string; attachments?: string[]; isInternal?: boolean;
  }) {
    const { disputeId, senderId, senderRole, message, attachments = [], isInternal = false } = data;

    const dispute = await this.prisma.escrowDispute.findUnique({ where: { id: disputeId } });
    if (!dispute) throw new NotFoundException('Dispute not found');

    if (dispute.status === 'CLOSED' || dispute.status === 'RESOLVED') {
      throw new BadRequestException('Cannot add message to closed dispute');
    }

    const newMessage = await this.prisma.disputeMessage.create({
      data: { disputeId, senderId, senderRole, message, attachments, isInternal },
    });

    if (dispute.status === 'AWAITING_RESPONSE') {
      await this.prisma.escrowDispute.update({
        where: { id: disputeId }, data: { status: 'UNDER_REVIEW' },
      });
    }

    return newMessage;
  }

  async addEvidence(disputeId: string, evidence: any) {
    const dispute = await this.prisma.escrowDispute.findUnique({ where: { id: disputeId } });
    if (!dispute) throw new NotFoundException('Dispute not found');

    const currentEvidence = dispute.evidence as any[];
    return this.prisma.escrowDispute.update({
      where: { id: disputeId },
      data: { evidence: [...currentEvidence, evidence] },
    });
  }

  async escalateDispute(disputeId: string, reason: string) {
    const dispute = await this.prisma.escrowDispute.findUnique({ where: { id: disputeId } });
    if (!dispute) throw new NotFoundException('Dispute not found');

    return this.prisma.escrowDispute.update({
      where: { id: disputeId },
      data: {
        status: 'ESCALATED',
        messages: {
          create: { senderId: 'system', senderRole: 'SYSTEM', message: `Dispute escalated: ${reason}`, isInternal: true },
        },
      },
    });
  }

  async resolveDispute(data: {
    disputeId: string; resolution: DisputeResolution; resolvedBy: string;
    resolutionNote: string; buyerRefund?: number; sellerPayout?: number;
  }) {
    const { disputeId, resolution, resolvedBy, resolutionNote, buyerRefund, sellerPayout } = data;

    const dispute = await this.prisma.escrowDispute.findUnique({
      where: { id: disputeId }, include: { escrows: true },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');

    const updated = await this.prisma.escrowDispute.update({
      where: { id: disputeId },
      data: {
        status: 'RESOLVED', resolution, resolvedBy, resolutionNote,
        buyerRefund, sellerPayout, resolvedAt: new Date(),
        messages: {
          create: {
            senderId: resolvedBy, senderRole: 'ADMIN',
            message: `Dispute resolved: ${resolution}. ${resolutionNote}`, isInternal: false,
          },
        },
      },
    });

    for (const escrow of dispute.escrows) {
      let newStatus: any;
      switch (resolution) {
        case 'FULL_REFUND_BUYER': newStatus = 'REFUNDED'; break;
        case 'RELEASE_TO_SELLER': newStatus = 'RELEASED'; break;
        case 'PARTIAL_REFUND_BUYER':
        case 'SPLIT_FUNDS': newStatus = 'RELEASED'; break;
        default: newStatus = 'CANCELLED';
      }

      await this.prisma.escrowTransaction.update({
        where: { id: escrow.id },
        data: {
          status: newStatus,
          timeline: {
            create: {
              event: 'DISPUTE_RESOLVED',
              description: `Dispute resolved: ${resolution}`,
              descriptionAr: `تم حل النزاع: ${resolution}`,
              actor: resolvedBy, actorRole: 'admin',
              metadata: { resolution, buyerRefund, sellerPayout },
            },
          },
        },
      });
    }

    return updated;
  }

  async getUserDisputes(userId: string, options: { status?: DisputeStatus; limit?: number; offset?: number } = {}) {
    const { status, limit = 20, offset = 0 } = options;

    const where: any = {
      ...(status && { status }),
      escrows: { some: { OR: [{ buyerId: userId }, { sellerId: userId }] } },
    };

    const [disputes, total] = await Promise.all([
      this.prisma.escrowDispute.findMany({
        where, orderBy: { createdAt: 'desc' }, take: limit, skip: offset,
        include: {
          escrows: { select: { id: true, orderId: true, amount: true, currency: true } },
          messages: { take: 1, orderBy: { createdAt: 'desc' } },
        },
      }),
      this.prisma.escrowDispute.count({ where }),
    ]);

    return { disputes, pagination: { total, limit, offset, hasMore: offset + limit < total } };
  }
}
