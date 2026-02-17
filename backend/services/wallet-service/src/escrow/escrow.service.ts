import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { TransferService } from '../transfer/transfer.service';
import { generateIdempotencyKey } from '../utils/money';
import { LedgerReason, ReferenceType } from '../types';
import crypto from 'crypto';
import {
  CreateEscrowRequestDto,
  CreateAndFundEscrowRequestDto,
  FundEscrowRequestDto,
  ReleaseEscrowRequestDto,
  RefundEscrowRequestDto,
  DisputeEscrowRequestDto,
  EscrowResponseDto,
  EscrowTransferResponseDto,
  EscrowStatus,
  EscrowReferenceType,
} from '../dto/escrow.dto';

export interface CreateEscrowRequest {
  buyerWalletId: string;
  sellerWalletId: string;
  amount: bigint;
  currency: string;
  referenceType: EscrowReferenceType;
  referenceId: string;
  description?: string;
  systemWalletId: string;
}

export interface CreateAndFundEscrowRequest extends CreateEscrowRequest {
  reason?: LedgerReason;
  createdBy: string;
}

export interface FundEscrowRequest {
  escrowId: string;
  userId: string;
  reason?: LedgerReason;
  description?: string;
}

export interface ReleaseEscrowRequest {
  escrowId: string;
  userId: string;
  reason?: LedgerReason;
  description?: string;
}

export interface RefundEscrowRequest {
  escrowId: string;
  userId: string;
  reason?: LedgerReason;
  description?: string;
}

export interface DisputeEscrowRequest {
  escrowId: string;
  userId: string;
  disputeReason: string;
  description?: string;
}

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transferService: TransferService,
  ) {}

  // ============================================================
  // CREATE ESCROW
  // ============================================================

  async createEscrow(request: CreateEscrowRequestDto): Promise<EscrowResponseDto> {
    this.logger.log(`Creating escrow for buyer ${request.buyerWalletId} and seller ${request.sellerWalletId}`);

    // Validate wallets exist and are not the same
    if (request.buyerWalletId === request.sellerWalletId) {
      throw new BadRequestException('Buyer and seller wallets cannot be the same');
    }

    const escrowId = crypto.randomUUID();
    const now = new Date();

    try {
      const escrow = await this.prisma.escrow.create({
        data: {
          id: escrowId,
          buyerWalletId: request.buyerWalletId,
          sellerWalletId: request.sellerWalletId,
          systemWalletId: request.systemWalletId,
          amount: request.amount.toString(),
          currency: request.currency,
          status: EscrowStatus.CREATED,
          referenceType: request.referenceType as any,
          referenceId: request.referenceId,
          description: request.description,
          createdAt: now,
          updatedAt: now,
        },
      });

      this.logger.log(`Escrow created: ${escrowId}`);
      return this.mapToEscrowResponse(escrow);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Escrow with this reference already exists');
      }
      throw error;
    }
  }

  // ============================================================
  // CREATE AND FUND ESCROW (Atomic)
  // ============================================================

  async createAndFundEscrow(request: CreateAndFundEscrowRequestDto): Promise<EscrowTransferResponseDto> {
    this.logger.log(`Creating and funding escrow for buyer ${request.buyerWalletId}`);

    return await this.prisma.$transaction(async (tx) => {
      // Step 1: Create escrow
      const escrow = await tx.escrow.create({
        data: {
          id: crypto.randomUUID(),
          buyerWalletId: request.buyerWalletId,
          sellerWalletId: request.sellerWalletId,
          systemWalletId: request.systemWalletId,
          amount: request.amount.toString(),
          currency: request.currency,
          status: EscrowStatus.CREATED,
          referenceType: request.referenceType as any,
          referenceId: request.referenceId,
          description: request.description,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Step 2: Fund the escrow (buyer -> system)
      const idempotencyKey = generateIdempotencyKey(
        'escrow_fund',
        escrow.id,
        BigInt(request.amount)
      );

      const transferResult = await this.transferService.executeAtomicTransfer({
        fromWalletId: request.buyerWalletId,
        toWalletId: request.systemWalletId,
        amount: BigInt(request.amount),
        reason: request.reason || LedgerReason.ESCROW_FUND,
        referenceType: ReferenceType.ESCROW,
        referenceId: escrow.id,
        description: `Funding escrow ${escrow.id}`,
        idempotencyKey,
        createdBy: request.createdBy,
        transferId: crypto.randomUUID(),
      }, tx);

      // Step 3: Update escrow status to FUNDED
      await tx.escrow.update({
        where: { id: escrow.id },
        data: { 
          status: EscrowStatus.FUNDED,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Escrow created and funded: ${escrow.id}`);
      
      return {
        transferId: transferResult.transferId,
        fromEntry: transferResult.fromEntry,
        toEntry: transferResult.toEntry,
        amount: transferResult.amount,
        currency: transferResult.currency,
        reason: transferResult.reason,
        referenceType: transferResult.referenceType,
        referenceId: transferResult.referenceId,
        idempotencyKey: transferResult.idempotencyKey,
        createdAt: transferResult.createdAt,
        isIdempotent: transferResult.isIdempotent,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 15000,
    });
  }

  // ============================================================
  // FUND ESCROW
  // ============================================================

  async fundEscrow(request: FundEscrowRequestDto): Promise<EscrowTransferResponseDto> {
    this.logger.log(`Funding escrow: ${request.escrowId}`);

    return await this.prisma.$transaction(async (tx) => {
      // Step 1: Get escrow and validate
      const escrow = await tx.escrow.findUnique({
        where: { id: request.escrowId },
      });

      if (!escrow) {
        throw new NotFoundException(`Escrow ${request.escrowId} not found`);
      }

      if (escrow.status !== EscrowStatus.CREATED) {
        throw new BadRequestException(`Escrow ${request.escrowId} is not in CREATED status`);
      }

      // Step 2: Execute transfer (buyer -> system)
      const idempotencyKey = generateIdempotencyKey(
        'escrow_fund',
        escrow.id,
        BigInt(escrow.amount)
      );

      const transferResult = await this.transferService.executeAtomicTransfer({
        fromWalletId: escrow.buyerWalletId,
        toWalletId: escrow.systemWalletId,
        amount: BigInt(escrow.amount),
        reason: request.reason || LedgerReason.ESCROW_FUND,
        referenceType: ReferenceType.ESCROW,
        referenceId: escrow.id,
        description: request.description || `Funding escrow ${escrow.id}`,
        idempotencyKey,
        createdBy: request.userId,
        transferId: crypto.randomUUID(),
      }, tx);

      // Step 3: Update escrow status
      await tx.escrow.update({
        where: { id: escrow.id },
        data: { 
          status: EscrowStatus.FUNDED,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Escrow funded: ${escrow.id}`);
      return {
        transferId: transferResult.transferId,
        fromEntry: transferResult.fromEntry,
        toEntry: transferResult.toEntry,
        amount: transferResult.amount,
        currency: transferResult.currency,
        reason: transferResult.reason,
        referenceType: transferResult.referenceType,
        referenceId: transferResult.referenceId,
        idempotencyKey: transferResult.idempotencyKey,
        createdAt: transferResult.createdAt,
        isIdempotent: transferResult.isIdempotent,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 15000,
    });
  }

  // ============================================================
  // RELEASE ESCROW
  // ============================================================

  async releaseEscrow(request: ReleaseEscrowRequestDto): Promise<EscrowTransferResponseDto> {
    this.logger.log(`Releasing escrow: ${request.escrowId}`);

    return await this.prisma.$transaction(async (tx) => {
      // Step 1: Get escrow and validate
      const escrow = await tx.escrow.findUnique({
        where: { id: request.escrowId },
      });

      if (!escrow) {
        throw new NotFoundException(`Escrow ${request.escrowId} not found`);
      }

      if (escrow.status !== EscrowStatus.FUNDED) {
        throw new BadRequestException(`Escrow ${request.escrowId} is not in FUNDED status`);
      }

      // Step 2: Execute transfer (system -> seller)
      const idempotencyKey = generateIdempotencyKey(
        'escrow_release',
        escrow.id,
        BigInt(escrow.amount)
      );

      const transferResult = await this.transferService.executeAtomicTransfer({
        fromWalletId: escrow.systemWalletId,
        toWalletId: escrow.sellerWalletId,
        amount: BigInt(escrow.amount),
        reason: request.reason || LedgerReason.ESCROW_RELEASE,
        referenceType: ReferenceType.ESCROW,
        referenceId: escrow.id,
        description: request.description || `Releasing escrow ${escrow.id}`,
        idempotencyKey,
        createdBy: request.userId,
        transferId: crypto.randomUUID(),
      }, tx);

      // Step 3: Update escrow status
      await tx.escrow.update({
        where: { id: escrow.id },
        data: { 
          status: EscrowStatus.RELEASED,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Escrow released: ${escrow.id}`);
      return {
        transferId: transferResult.transferId,
        fromEntry: transferResult.fromEntry,
        toEntry: transferResult.toEntry,
        amount: transferResult.amount,
        currency: transferResult.currency,
        reason: transferResult.reason,
        referenceType: transferResult.referenceType,
        referenceId: transferResult.referenceId,
        idempotencyKey: transferResult.idempotencyKey,
        createdAt: transferResult.createdAt,
        isIdempotent: transferResult.isIdempotent,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 15000,
    });
  }

  // ============================================================
  // REFUND ESCROW
  // ============================================================

  async refundEscrow(request: RefundEscrowRequestDto): Promise<EscrowTransferResponseDto> {
    this.logger.log(`Refunding escrow: ${request.escrowId}`);

    return await this.prisma.$transaction(async (tx) => {
      // Step 1: Get escrow and validate
      const escrow = await tx.escrow.findUnique({
        where: { id: request.escrowId },
      });

      if (!escrow) {
        throw new NotFoundException(`Escrow ${request.escrowId} not found`);
      }

      if (escrow.status !== EscrowStatus.FUNDED) {
        throw new BadRequestException(`Escrow ${request.escrowId} is not in FUNDED status`);
      }

      // Step 2: Execute transfer (system -> buyer)
      const idempotencyKey = generateIdempotencyKey(
        'escrow_refund',
        escrow.id,
        BigInt(escrow.amount)
      );

      const transferResult = await this.transferService.executeAtomicTransfer({
        fromWalletId: escrow.systemWalletId,
        toWalletId: escrow.buyerWalletId,
        amount: BigInt(escrow.amount),
        reason: request.reason || LedgerReason.ESCROW_REFUND,
        referenceType: ReferenceType.ESCROW,
        referenceId: escrow.id,
        description: request.description || `Refunding escrow ${escrow.id}`,
        idempotencyKey,
        createdBy: request.userId,
        transferId: crypto.randomUUID(),
      }, tx);

      // Step 3: Update escrow status
      await tx.escrow.update({
        where: { id: escrow.id },
        data: { 
          status: EscrowStatus.REFUNDED,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Escrow refunded: ${escrow.id}`);
      return {
        transferId: transferResult.transferId,
        fromEntry: transferResult.fromEntry,
        toEntry: transferResult.toEntry,
        amount: transferResult.amount,
        currency: transferResult.currency,
        reason: transferResult.reason,
        referenceType: transferResult.referenceType,
        referenceId: transferResult.referenceId,
        idempotencyKey: transferResult.idempotencyKey,
        createdAt: transferResult.createdAt,
        isIdempotent: transferResult.isIdempotent,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 15000,
    });
  }

  // ============================================================
  // DISPUTE ESCROW
  // ============================================================

  async disputeEscrow(request: DisputeEscrowRequestDto): Promise<EscrowResponseDto> {
    this.logger.log(`Disputing escrow: ${request.escrowId}`);

    // Get escrow and validate
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: request.escrowId },
    });

    if (!escrow) {
      throw new NotFoundException(`Escrow ${request.escrowId} not found`);
    }

    if (escrow.status !== EscrowStatus.FUNDED) {
      throw new BadRequestException(`Escrow ${request.escrowId} must be FUNDED to dispute`);
    }

    // Update escrow with dispute information
    const updatedEscrow = await this.prisma.escrow.update({
      where: { id: escrow.id },
      data: {
        status: EscrowStatus.DISPUTED,
        disputeReason: request.disputeReason,
        disputeDetails: request.description,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Escrow disputed: ${escrow.id}`);
    return this.mapToEscrowResponse(updatedEscrow);
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private mapToEscrowResponse(escrow: any): EscrowResponseDto {
    return {
      escrowId: escrow.id,
      buyerWalletId: escrow.buyerWalletId,
      sellerWalletId: escrow.sellerWalletId,
      systemWalletId: escrow.systemWalletId,
      amount: escrow.amount,
      currency: escrow.currency,
      status: escrow.status as EscrowStatus,
      referenceType: escrow.referenceType as EscrowReferenceType,
      referenceId: escrow.referenceId,
      description: escrow.description || undefined,
      createdAt: escrow.createdAt,
      updatedAt: escrow.updatedAt,
      disputeReason: escrow.disputeReason || undefined,
      disputeDetails: escrow.disputeDetails || undefined,
    };
  }

  // ============================================================
  // QUERY METHODS
  // ============================================================

  async getEscrow(escrowId: string): Promise<EscrowResponseDto | null> {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId },
    });

    return escrow ? this.mapToEscrowResponse(escrow) : null;
  }

  async getEscrowsByUser(walletId: string): Promise<EscrowResponseDto[]> {
    const escrows = await this.prisma.escrow.findMany({
      where: {
        OR: [
          { buyerWalletId: walletId },
          { sellerWalletId: walletId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return escrows.map(this.mapToEscrowResponse);
  }

  async getEscrowsByReference(referenceType: EscrowReferenceType, referenceId: string): Promise<EscrowResponseDto[]> {
    const escrows = await this.prisma.escrow.findMany({
      where: {
        referenceType: referenceType as any,
        referenceId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return escrows.map(this.mapToEscrowResponse);
  }
}