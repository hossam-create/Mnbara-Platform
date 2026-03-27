import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEscrowDto } from './dto/create-escrow.dto';
import { ReleaseEscrowDto } from './dto/release-escrow.dto';
import { DisputeEscrowDto } from './dto/dispute-escrow.dto';

@Injectable()
export class EscrowService {
  constructor(private prisma: PrismaService) {}

  async createEscrow(createEscrowDto: CreateEscrowDto) {
    const { transactionId, buyerId, sellerId, amount, currency = 'USD', description, releaseConditions } = createEscrowDto;

    // Check if escrow already exists for this transaction
    const existing = await this.prisma.escrowAccount.findUnique({
      where: { transactionId },
    });

    if (existing) {
      throw new BadRequestException(`Escrow already exists for transaction ${transactionId}`);
    }

    // Create escrow account
    const escrow = await this.prisma.escrowAccount.create({
      data: {
        transactionId,
        buyerId,
        sellerId,
        amount,
        currency,
        description,
        releaseConditions,
        status: 'HELD',
      },
    });

    // Log timeline event
    await this.prisma.escrowTimeline.create({
      data: {
        escrowId: escrow.id,
        event: 'created',
        description: `Escrow created for transaction ${transactionId}`,
      },
    });

    return escrow;
  }

  async getEscrow(id: string) {
    const escrow = await this.prisma.escrowAccount.findUnique({
      where: { id },
      include: {
        timeline: true,
        disputes: true,
      },
    });

    if (!escrow) {
      throw new NotFoundException(`Escrow ${id} not found`);
    }

    return escrow;
  }

  async getEscrowByTransaction(transactionId: string) {
    const escrow = await this.prisma.escrowAccount.findUnique({
      where: { transactionId },
      include: {
        timeline: true,
        disputes: true,
      },
    });

    if (!escrow) {
      throw new NotFoundException(`Escrow for transaction ${transactionId} not found`);
    }

    return escrow;
  }

  async releaseEscrow(id: string, releaseEscrowDto: ReleaseEscrowDto) {
    const escrow = await this.getEscrow(id);

    if (escrow.status !== 'HELD') {
      throw new BadRequestException(`Cannot release escrow with status ${escrow.status}`);
    }

    // Update escrow status
    const updated = await this.prisma.escrowAccount.update({
      where: { id },
      data: {
        status: 'RELEASED',
        releasedAt: new Date(),
      },
    });

    // Log timeline event
    await this.prisma.escrowTimeline.create({
      data: {
        escrowId: id,
        event: 'released',
        description: releaseEscrowDto.reason,
      },
    });

    return updated;
  }

  async refundEscrow(id: string, reason: string) {
    const escrow = await this.getEscrow(id);

    if (escrow.status === 'REFUNDED' || escrow.status === 'RELEASED') {
      throw new BadRequestException(`Cannot refund escrow with status ${escrow.status}`);
    }

    // Update escrow status
    const updated = await this.prisma.escrowAccount.update({
      where: { id },
      data: {
        status: 'REFUNDED',
      },
    });

    // Log timeline event
    await this.prisma.escrowTimeline.create({
      data: {
        escrowId: id,
        event: 'refunded',
        description: reason,
      },
    });

    return updated;
  }

  async disputeEscrow(id: string, initiatedBy: string, disputeEscrowDto: DisputeEscrowDto) {
    const escrow = await this.getEscrow(id);

    if (escrow.status === 'DISPUTED') {
      throw new BadRequestException('Escrow is already disputed');
    }

    // Create dispute
    const dispute = await this.prisma.escrowDispute.create({
      data: {
        escrowId: id,
        initiatedBy,
        reason: disputeEscrowDto.reason,
        description: disputeEscrowDto.description,
        evidence: disputeEscrowDto.evidence,
        status: 'OPEN',
      },
    });

    // Update escrow status
    await this.prisma.escrowAccount.update({
      where: { id },
      data: {
        status: 'DISPUTED',
        disputedAt: new Date(),
      },
    });

    // Log timeline event
    await this.prisma.escrowTimeline.create({
      data: {
        escrowId: id,
        event: 'disputed',
        description: `Dispute initiated by ${initiatedBy}: ${disputeEscrowDto.reason}`,
      },
    });

    return dispute;
  }

  async resolveDispute(disputeId: string, resolution: string, resolutionAmount: number, resolvedBy: string) {
    const dispute = await this.prisma.escrowDispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute ${disputeId} not found`);
    }

    if (dispute.status !== 'OPEN') {
      throw new BadRequestException(`Cannot resolve dispute with status ${dispute.status}`);
    }

    // Update dispute
    const updated = await this.prisma.escrowDispute.update({
      where: { id: disputeId },
      data: {
        status: 'RESOLVED',
        resolution,
        resolutionAmount,
        resolvedBy,
        resolvedAt: new Date(),
      },
    });

    // Update escrow status based on resolution
    const escrow = await this.prisma.escrowAccount.findUnique({
      where: { id: dispute.escrowId },
    });

    if (resolutionAmount === 0) {
      await this.prisma.escrowAccount.update({
        where: { id: dispute.escrowId },
        data: { status: 'REFUNDED' },
      });
    } else if (resolutionAmount === escrow.amount) {
      await this.prisma.escrowAccount.update({
        where: { id: dispute.escrowId },
        data: { status: 'RELEASED' },
      });
    }

    // Log timeline event
    await this.prisma.escrowTimeline.create({
      data: {
        escrowId: dispute.escrowId,
        event: 'dispute_resolved',
        description: `Dispute resolved: ${resolution}`,
      },
    });

    return updated;
  }

  async listEscrows(buyerId?: string, sellerId?: string, status?: string) {
    const where: any = {};

    if (buyerId) where.buyerId = buyerId;
    if (sellerId) where.sellerId = sellerId;
    if (status) where.status = status;

    return this.prisma.escrowAccount.findMany({
      where,
      include: {
        timeline: true,
        disputes: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
