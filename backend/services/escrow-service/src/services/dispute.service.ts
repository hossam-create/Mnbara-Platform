import { PrismaClient, DisputeReason, DisputeRole, DisputeStatus, DisputeResolution } from '@prisma/client';

const prisma = new PrismaClient();

export const disputeService = {
  // فتح نزاع - Open dispute
  async openDispute(data: {
    escrowId: string;
    initiatedBy: string;
    initiatorRole: DisputeRole;
    reason: DisputeReason;
    description: string;
    evidence?: any[];
  }) {
    const { escrowId, initiatedBy, initiatorRole, reason, description, evidence = [] } = data;

    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (['RELEASED', 'REFUNDED', 'CANCELLED'].includes(escrow.status)) {
      throw new Error('Cannot dispute this transaction');
    }

    // Create dispute
    const dispute = await prisma.escrowDispute.create({
      data: {
        initiatedBy,
        initiatorRole,
        reason,
        description,
        evidence,
        messages: {
          create: {
            senderId: initiatedBy,
            senderRole: initiatorRole,
            message: description,
            attachments: evidence.map((e: any) => e.url || e)
          }
        }
      }
    });

    // Update escrow status
    await prisma.escrowTransaction.update({
      where: { id: escrowId },
      data: {
        status: 'DISPUTED',
        disputeId: dispute.id,
        timeline: {
          create: {
            event: 'DISPUTE_OPENED',
            description: `Dispute opened: ${reason}`,
            descriptionAr: `تم فتح نزاع: ${reason}`,
            actor: initiatedBy,
            actorRole: initiatorRole.toLowerCase()
          }
        }
      }
    });

    return dispute;
  },

  // الحصول على نزاع - Get dispute
  async getDispute(disputeId: string) {
    const dispute = await prisma.escrowDispute.findUnique({
      where: { id: disputeId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        escrows: true
      }
    });

    if (!dispute) {
      throw new Error('Dispute not found');
    }

    return dispute;
  },

  // إضافة رسالة للنزاع - Add message to dispute
  async addMessage(data: {
    disputeId: string;
    senderId: string;
    senderRole: DisputeRole;
    message: string;
    attachments?: string[];
    isInternal?: boolean;
  }) {
    const { disputeId, senderId, senderRole, message, attachments = [], isInternal = false } = data;

    const dispute = await prisma.escrowDispute.findUnique({
      where: { id: disputeId }
    });

    if (!dispute) {
      throw new Error('Dispute not found');
    }

    if (dispute.status === 'CLOSED' || dispute.status === 'RESOLVED') {
      throw new Error('Cannot add message to closed dispute');
    }

    const newMessage = await prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId,
        senderRole,
        message,
        attachments,
        isInternal
      }
    });

    // Update dispute status if awaiting response
    if (dispute.status === 'AWAITING_RESPONSE') {
      await prisma.escrowDispute.update({
        where: { id: disputeId },
        data: { status: 'UNDER_REVIEW' }
      });
    }

    return newMessage;
  },

  // إضافة دليل - Add evidence
  async addEvidence(disputeId: string, evidence: any) {
    const dispute = await prisma.escrowDispute.findUnique({
      where: { id: disputeId }
    });

    if (!dispute) {
      throw new Error('Dispute not found');
    }

    const currentEvidence = dispute.evidence as any[];
    
    const updated = await prisma.escrowDispute.update({
      where: { id: disputeId },
      data: {
        evidence: [...currentEvidence, evidence]
      }
    });

    return updated;
  },

  // تصعيد النزاع - Escalate dispute
  async escalateDispute(disputeId: string, reason: string) {
    const dispute = await prisma.escrowDispute.findUnique({
      where: { id: disputeId }
    });

    if (!dispute) {
      throw new Error('Dispute not found');
    }

    const updated = await prisma.escrowDispute.update({
      where: { id: disputeId },
      data: {
        status: 'ESCALATED',
        messages: {
          create: {
            senderId: 'system',
            senderRole: 'SYSTEM',
            message: `Dispute escalated: ${reason}`,
            isInternal: true
          }
        }
      }
    });

    return updated;
  },

  // حل النزاع - Resolve dispute
  async resolveDispute(data: {
    disputeId: string;
    resolution: DisputeResolution;
    resolvedBy: string;
    resolutionNote: string;
    buyerRefund?: number;
    sellerPayout?: number;
  }) {
    const { disputeId, resolution, resolvedBy, resolutionNote, buyerRefund, sellerPayout } = data;

    const dispute = await prisma.escrowDispute.findUnique({
      where: { id: disputeId },
      include: { escrows: true }
    });

    if (!dispute) {
      throw new Error('Dispute not found');
    }

    // Update dispute
    const updated = await prisma.escrowDispute.update({
      where: { id: disputeId },
      data: {
        status: 'RESOLVED',
        resolution,
        resolvedBy,
        resolutionNote,
        buyerRefund,
        sellerPayout,
        resolvedAt: new Date(),
        messages: {
          create: {
            senderId: resolvedBy,
            senderRole: 'ADMIN',
            message: `Dispute resolved: ${resolution}. ${resolutionNote}`,
            isInternal: false
          }
        }
      }
    });

    // Update related escrow transactions
    for (const escrow of dispute.escrows) {
      let newStatus: any;
      
      switch (resolution) {
        case 'FULL_REFUND_BUYER':
          newStatus = 'REFUNDED';
          break;
        case 'RELEASE_TO_SELLER':
          newStatus = 'RELEASED';
          break;
        case 'PARTIAL_REFUND_BUYER':
        case 'SPLIT_FUNDS':
          newStatus = 'RELEASED'; // Partial handling
          break;
        default:
          newStatus = 'CANCELLED';
      }

      await prisma.escrowTransaction.update({
        where: { id: escrow.id },
        data: {
          status: newStatus,
          timeline: {
            create: {
              event: 'DISPUTE_RESOLVED',
              description: `Dispute resolved: ${resolution}`,
              descriptionAr: `تم حل النزاع: ${resolution}`,
              actor: resolvedBy,
              actorRole: 'admin',
              metadata: { resolution, buyerRefund, sellerPayout }
            }
          }
        }
      });
    }

    return updated;
  },

  // الحصول على نزاعات المستخدم - Get user disputes
  async getUserDisputes(userId: string, options: {
    status?: DisputeStatus;
    limit?: number;
    offset?: number;
  } = {}) {
    const { status, limit = 20, offset = 0 } = options;

    const disputes = await prisma.escrowDispute.findMany({
      where: {
        ...(status && { status }),
        escrows: {
          some: {
            OR: [
              { buyerId: userId },
              { sellerId: userId }
            ]
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        escrows: {
          select: {
            id: true,
            orderId: true,
            amount: true,
            currency: true
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    const total = await prisma.escrowDispute.count({
      where: {
        ...(status && { status }),
        escrows: {
          some: {
            OR: [
              { buyerId: userId },
              { sellerId: userId }
            ]
          }
        }
      }
    });

    return {
      disputes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }
};
