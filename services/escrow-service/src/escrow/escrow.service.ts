import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletClientService } from '../clients/wallet-client.service';
import { EscrowStatus, DisputeStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateEscrowDto, AddSignatureDto, LockTransactionDto,
  InitiateDisputeDto, ResolveDisputeDto, EscrowTransaction, Signature,
} from '../types/escrow.types';

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletClient: WalletClientService,
  ) {}

  async createTransaction(data: CreateEscrowDto): Promise<EscrowTransaction> {
    this.logger.log(`Creating escrow transaction for buyer: ${data.buyerId}`);
    const transactionId = uuidv4();

    const escrow = await this.prisma.escrow.create({
      data: {
        transactionId,
        buyerId: data.buyerId,
        sellerId: data.sellerId,
        arbitratorId: data.arbitratorId,
        amount: data.amount,
        currency: data.currency || 'USD',
        status: EscrowStatus.CREATED,
        disputeStatus: DisputeStatus.NONE,
        signatures: [],
      },
    });

    await this.logEvent(escrow.id, 'TransactionCreated', {
      buyer: data.buyerId, seller: data.sellerId, amount: data.amount,
    }, data.buyerId);

    return this.mapToEscrowTransaction(escrow);
  }

  async addSignature(escrowId: string, signatureData: AddSignatureDto): Promise<void> {
    const escrow = await this.prisma.escrow.findUnique({ where: { id: escrowId } });
    if (!escrow) throw new NotFoundException('Escrow not found');

    if (escrow.status !== EscrowStatus.CREATED && escrow.status !== EscrowStatus.LOCKED) {
      throw new BadRequestException('Transaction status does not allow adding signatures');
    }

    const signatures = (escrow.signatures as any[]) || [];
    if (signatures.some((sig: any) => sig.userId === signatureData.userId)) {
      throw new BadRequestException('Signature already added');
    }

    const newSignature: Signature = {
      userId: signatureData.userId, role: signatureData.role,
      signature: signatureData.signature, timestamp: new Date(),
    };
    signatures.push(newSignature);

    await this.prisma.escrow.update({
      where: { id: escrowId },
      data: { signatures, status: signatures.length >= 2 ? EscrowStatus.SIGNED : escrow.status },
    });

    await this.logEvent(escrowId, 'SignatureAdded', {
      signer: signatureData.userId, role: signatureData.role,
    }, signatureData.userId);
  }

  async lockTransaction(escrowId: string, buyerId: string, lockData: LockTransactionDto): Promise<void> {
    const escrow = await this.prisma.escrow.findUnique({ where: { id: escrowId } });
    if (!escrow) throw new NotFoundException('Escrow not found');
    if (escrow.buyerId !== buyerId) throw new BadRequestException('Only the buyer can lock this transaction');
    if (escrow.status !== EscrowStatus.SIGNED) throw new BadRequestException('Transaction must be signed before locking');

    const signatures = (escrow.signatures as any[]) || [];
    if (!signatures.some((sig: any) => sig.userId === escrow.sellerId)) {
      throw new BadRequestException('Seller has not signed the transaction');
    }

    const amount = parseFloat(escrow.amount.toString());
    const hasBalance = await this.walletClient.checkBalance(escrow.buyerId, amount);
    if (!hasBalance) throw new BadRequestException('Insufficient balance to lock transaction');

    const holdResult = await this.holdFunds(escrow.buyerId, amount, escrowId);
    if (!holdResult) throw new BadRequestException('Failed to hold funds in wallet');

    const disputeDuration = lockData.disputeDuration || 7;
    const disputeDeadline = new Date();
    disputeDeadline.setDate(disputeDeadline.getDate() + disputeDuration);

    await this.prisma.escrow.update({
      where: { id: escrowId },
      data: { status: EscrowStatus.LOCKED, lockedAt: new Date(), disputeDeadline },
    });

    await this.logEvent(escrowId, 'TransactionLocked', { disputeDeadline, amount }, buyerId);
  }

  async releaseTransaction(escrowId: string, buyerId: string): Promise<void> {
    const escrow = await this.prisma.escrow.findUnique({ where: { id: escrowId } });
    if (!escrow) throw new NotFoundException('Escrow not found');
    if (escrow.buyerId !== buyerId) throw new BadRequestException('Only the buyer can release this transaction');
    if (escrow.status !== EscrowStatus.LOCKED) throw new BadRequestException('Transaction must be locked before releasing');

    const signatures = (escrow.signatures as any[]) || [];
    if (!signatures.some((sig: any) => sig.userId === escrow.sellerId)) {
      throw new BadRequestException('Seller has not signed the transaction');
    }

    const amount = parseFloat(escrow.amount.toString());
    const releaseResult = await this.transferFunds(escrowId, escrow.sellerId, amount);
    if (!releaseResult) throw new BadRequestException('Failed to release funds from wallet');

    await this.prisma.escrow.update({
      where: { id: escrowId },
      data: { status: EscrowStatus.RELEASED, releasedAt: new Date() },
    });

    await this.logEvent(escrowId, 'TransactionReleased', {
      seller: escrow.sellerId, amount: escrow.amount,
    }, buyerId);
  }

  async initiateDispute(escrowId: string, disputeData: InitiateDisputeDto): Promise<void> {
    const escrow = await this.prisma.escrow.findUnique({ where: { id: escrowId } });
    if (!escrow) throw new NotFoundException('Escrow not found');

    if (disputeData.userId !== escrow.buyerId && disputeData.userId !== escrow.sellerId) {
      throw new BadRequestException('Only buyer or seller can initiate dispute');
    }
    if (escrow.status !== EscrowStatus.LOCKED) {
      throw new BadRequestException('Can only dispute locked transactions');
    }

    if (escrow.arbitratorId) {
      const signatures = (escrow.signatures as any[]) || [];
      if (!signatures.some((sig: any) => sig.userId === escrow.arbitratorId)) {
        throw new BadRequestException('Arbitrator has not signed the transaction');
      }
    }

    await this.prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.DISPUTED, disputeStatus: DisputeStatus.INITIATED,
        disputeReason: disputeData.reason,
        disputeReasonIPFS: disputeData.evidence ? JSON.stringify(disputeData.evidence) : undefined,
      },
    });

    await this.logEvent(escrowId, 'TransactionDispute', {
      initiatedBy: disputeData.userId, reason: disputeData.reason,
    }, disputeData.userId);
  }

  async resolveDispute(escrowId: string, resolutionData: ResolveDisputeDto): Promise<void> {
    const escrow = await this.prisma.escrow.findUnique({ where: { id: escrowId } });
    if (!escrow) throw new NotFoundException('Escrow not found');
    if (escrow.arbitratorId !== resolutionData.arbitratorId) {
      throw new BadRequestException('Only the arbitrator can resolve this dispute');
    }
    if (escrow.status !== EscrowStatus.DISPUTED) {
      throw new BadRequestException('Escrow is not in dispute');
    }

    const amount = parseFloat(escrow.amount.toString());
    let fundResult: boolean;

    if (resolutionData.resolution === 'BUYER') {
      fundResult = await this.refundFunds(escrowId, escrow.buyerId, amount);
    } else {
      fundResult = await this.transferFunds(escrowId, escrow.sellerId, amount);
    }

    if (!fundResult) throw new BadRequestException('Failed to process funds during dispute resolution');

    await this.prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.RESOLVED, disputeStatus: DisputeStatus.RESOLVED,
        resolution: resolutionData.resolution, resolvedBy: resolutionData.arbitratorId,
        resolvedAt: new Date(),
      },
    });

    await this.logEvent(escrowId, 'TransactionResolved', {
      winner: resolutionData.resolution, arbitrator: resolutionData.arbitratorId,
    }, resolutionData.arbitratorId);
  }

  async getTransactionStatus(escrowId: string): Promise<EscrowStatus> {
    const escrow = await this.prisma.escrow.findUnique({ where: { id: escrowId }, select: { status: true } });
    if (!escrow) throw new NotFoundException('Escrow not found');
    return escrow.status;
  }

  async getEscrowById(escrowId: string): Promise<EscrowTransaction | null> {
    const escrow = await this.prisma.escrow.findUnique({ where: { id: escrowId } });
    if (!escrow) return null;
    return this.mapToEscrowTransaction(escrow);
  }

  private async holdFunds(userId: string, amount: number, escrowId: string): Promise<boolean> {
    const result = await this.walletClient.holdFunds({ userId, amount, escrowId, reason: 'ESCROW_HOLD', currency: 'EGP' });
    return result.success;
  }

  private async transferFunds(escrowId: string, toUserId: string, amount: number): Promise<boolean> {
    const result = await this.walletClient.releaseFunds({ escrowId, toUserId, amount, currency: 'EGP' });
    return result.success;
  }

  private async refundFunds(escrowId: string, toUserId: string, amount: number): Promise<boolean> {
    const result = await this.walletClient.refundFunds({ escrowId, toUserId, amount, currency: 'EGP' });
    return result.success;
  }

  private async logEvent(escrowId: string, eventType: string, eventData: any, triggeredBy: string): Promise<void> {
    await this.prisma.escrowEvent.create({ data: { escrowId, eventType, eventData, triggeredBy } });
  }

  private mapToEscrowTransaction(escrow: any): EscrowTransaction {
    return {
      id: escrow.id, transactionId: escrow.transactionId,
      buyerId: escrow.buyerId, sellerId: escrow.sellerId, arbitratorId: escrow.arbitratorId,
      amount: parseFloat(escrow.amount), currency: escrow.currency,
      status: escrow.status, disputeStatus: escrow.disputeStatus,
      signatures: escrow.signatures || [],
      disputeReason: escrow.disputeReason, disputeDeadline: escrow.disputeDeadline,
      disputeReasonIPFS: escrow.disputeReasonIPFS,
      resolution: escrow.resolution, resolvedBy: escrow.resolvedBy, resolvedAt: escrow.resolvedAt,
      createdAt: escrow.createdAt, updatedAt: escrow.updatedAt,
      lockedAt: escrow.lockedAt, releasedAt: escrow.releasedAt,
    };
  }
}
