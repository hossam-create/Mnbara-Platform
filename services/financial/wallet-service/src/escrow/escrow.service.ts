import { 
  Injectable, 
  Logger, 
  NotFoundException, 
  BadRequestException, 
  ConflictException 
} from '@nestjs/common';
import { Escrow, EscrowStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { TransferService } from '../transfer/transfer.service';
import { 
  CreateEscrowRequestDto, 
  CreateAndFundEscrowRequestDto, 
  FundEscrowRequestDto, 
  ReleaseEscrowRequestDto, 
  RefundEscrowRequestDto, 
  DisputeEscrowRequestDto 
} from '../dto/escrow.dto';
import { LedgerReason, ReferenceType } from '../types';

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transferService: TransferService,
  ) {}

  // ============================================================
  // CREATE ESCROW
  // State: -> CREATED
  // ============================================================
  async createEscrow(data: CreateEscrowRequestDto, createdBy: string): Promise<Escrow> {
    const { buyerWalletId, sellerWalletId, amount, currency, referenceType, referenceId, description } = data;

    // 1. Validate amount
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // 2. Validate wallets exist
    const [buyer, seller] = await Promise.all([
      this.prisma.wallet.findUnique({ where: { id: buyerWalletId } }),
      this.prisma.wallet.findUnique({ where: { id: sellerWalletId } }),
    ]);

    if (!buyer) throw new NotFoundException(`Buyer wallet ${buyerWalletId} not found`);
    if (!seller) throw new NotFoundException(`Seller wallet ${sellerWalletId} not found`);

    // 3. Validate currency match
    if (buyer.primaryCurrency !== currency || seller.primaryCurrency !== currency) {
      throw new BadRequestException('Wallets must match escrow currency');
    }

    // 4. Create Escrow Record (CREATED state)
    // Note: No money moves yet
    // Convert amount to BigInt for Prisma
    const amountBigInt = BigInt(amount); // Assuming amount is technically "minor units" or consistent with BigInt storage

    return await this.prisma.escrow.create({
      data: {
        buyerWalletId,
        sellerWalletId,
        amount: amountBigInt,
        currency,
        referenceType,
        referenceId,
        description,
        status: EscrowStatus.CREATED,
        createdBy, // Assuming createdBy is a User UUID
      },
    });
  }

  // ============================================================
  // CREATE & FUND ESCROW (Atomic "Buy Now")
  // State: -> FUNDED
  // ============================================================
  async createAndFundEscrow(data: CreateAndFundEscrowRequestDto): Promise<Escrow> {
    const { 
      buyerWalletId, sellerWalletId, systemWalletId, 
      amount, currency, referenceType, referenceId, 
      description, createdBy, reason, requestId 
    } = data;

    // 1. Validate amount
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // 2. Validate currency & wallets
    const [buyer, seller, system] = await Promise.all([
      this.prisma.wallet.findUnique({ where: { id: buyerWalletId } }),
      this.prisma.wallet.findUnique({ where: { id: sellerWalletId } }),
      this.prisma.wallet.findUnique({ where: { id: systemWalletId } }),
    ]);

    if (!buyer) throw new NotFoundException(`Buyer wallet ${buyerWalletId} not found`);
    if (!seller) throw new NotFoundException(`Seller wallet ${sellerWalletId} not found`);
    if (!system) throw new NotFoundException(`System wallet ${systemWalletId} not found`);

    if (buyer.primaryCurrency !== currency || seller.primaryCurrency !== currency || system.primaryCurrency !== currency) {
      throw new BadRequestException('Wallets must match escrow currency');
    }

    const amountBigInt = BigInt(amount);

    return await this.prisma.$transaction(async (tx) => {
      // 3. Create Escrow Record (Initially FUNDED because we are about to fund it)
      const escrow = await tx.escrow.create({
        data: {
          buyerWalletId,
          sellerWalletId,
          amount: amountBigInt,
          currency,
          referenceType,
          referenceId,
          description,
          status: EscrowStatus.FUNDED, // Direct to FUNDED
          fundedAt: new Date(),
          createdBy: createdBy, // User ID
        },
      });

      // Determine Ledger Reason
      const ledgerReason = reason || LedgerReason.PURCHASE_HOLD;

      // 4. Execute Atomic Transfer (Buyer -> System)
      const transfer = await this.transferService.executeAtomicTransfer({
        fromWalletId: buyerWalletId,
        toWalletId: systemWalletId,
        amount: amountBigInt,
        reason: ledgerReason,
        referenceType: ReferenceType.ESCROW,
        referenceId: escrow.id, // Link to this escrow
        description: `Escrow Hold for ${referenceType} #${referenceId}`,
        transferId: crypto.randomUUID(),
        idempotencyKey: requestId || `fund_${escrow.id}`,
        createdBy: createdBy, // Triggered by creator
      }, tx); // Pass the transaction client!

      // 5. Update Escrow with Ledger Entry ID
      // This links the specific credit entry on the system wallet as the "hold" proof
      const updatedEscrow = await tx.escrow.update({
        where: { id: escrow.id },
        data: {
          holdEntryId: transfer.toEntry.entryId,
        },
      });

      return updatedEscrow;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 10000,
    });
  }

  // ============================================================
  // FUND ESCROW (Buyer -> System)
  // State: CREATED -> FUNDED
  // ============================================================
  async fundEscrow(data: FundEscrowRequestDto): Promise<Escrow> {
    const { escrowId, buyerWalletId, systemWalletId, userId, reason } = data;

    // 1. Fetch Escrow
    const escrow = await this.prisma.escrow.findUnique({ where: { id: escrowId } });
    if (!escrow) throw new NotFoundException('Escrow not found');

    // 2. Validate State
    if (escrow.status === EscrowStatus.FUNDED) {
      // Idempotency check: If already funded, just return.
      return escrow;
    }
    if (escrow.status !== EscrowStatus.CREATED) {
      throw new BadRequestException(`Invalid transition: Cannot fund from ${escrow.status}`);
    }

    // 3. Validate Parties
    if (escrow.buyerWalletId !== buyerWalletId) {
      throw new BadRequestException('Buyer wallet mismatch');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 4. Execute Atomic Transfer (Buyer -> System)
      const transfer = await this.transferService.executeAtomicTransfer({
        fromWalletId: buyerWalletId,
        toWalletId: systemWalletId,
        amount: escrow.amount,
        reason: reason || LedgerReason.PURCHASE_HOLD,
        referenceType: ReferenceType.ESCROW,
        referenceId: escrow.id,
        description: `Escrow Hold for ${escrow.referenceType} #${escrow.referenceId}`,
        idempotencyKey: `fund_${escrow.id}`, // Idempotency
        createdBy: userId,
      }, tx);

      // 5. Update Escrow State
      const updatedEscrow = await tx.escrow.update({
        where: { id: escrowId },
        data: {
          status: EscrowStatus.FUNDED,
          fundedAt: new Date(),
          holdEntryId: transfer.toEntry.entryId, // Link to the credit on system wallet
        },
      });

      return updatedEscrow;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  // ============================================================
  // RELEASE ESCROW (System -> Seller)
  // State: FUNDED/DISPUTED -> RELEASED
  // ============================================================
  async releaseEscrow(data: ReleaseEscrowRequestDto): Promise<Escrow> {
    const { escrowId, systemWalletId, userId, reason } = data;

    const escrow = await this.prisma.escrow.findUnique({ where: { id: escrowId } });
    if (!escrow) throw new NotFoundException('Escrow not found');

    // Idempotency check
    if (escrow.status === EscrowStatus.RELEASED) return escrow;
    
    // Status Guard
    if (escrow.status !== EscrowStatus.FUNDED && escrow.status !== EscrowStatus.DISPUTED) {
      throw new BadRequestException(`Invalid transition: Cannot release from ${escrow.status}`);
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Execute Atomic Transfer (System -> Seller)
      const transfer = await this.transferService.executeAtomicTransfer({
        fromWalletId: systemWalletId, // Funds sit here
        toWalletId: escrow.sellerWalletId,
        amount: escrow.amount,
        reason: reason || LedgerReason.PURCHASE_RELEASE,
        referenceType: ReferenceType.ESCROW,
        referenceId: escrow.id,
        description: `Escrow Release for ${escrow.referenceType} #${escrow.referenceId}`,
        transferId: crypto.randomUUID(),
        idempotencyKey: `release_${escrow.id}`,
        createdBy: userId,
      }, tx);

      // 2. Update Escrow State
      const updatedEscrow = await tx.escrow.update({
        where: { id: escrowId },
        data: {
          status: EscrowStatus.RELEASED,
          releasedAt: new Date(),
          releasedBy: userId,
          releaseEntryId: transfer.fromEntry.entryId, // Debit from System
        },
      });

      return updatedEscrow;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  // ============================================================
  // REFUND ESCROW (System -> Buyer)
  // State: FUNDED/DISPUTED -> REFUNDED
  // ============================================================
  async refundEscrow(data: RefundEscrowRequestDto): Promise<Escrow> {
    const { escrowId, systemWalletId,  userId, reason } = data;

    const escrow = await this.prisma.escrow.findUnique({ where: { id: escrowId } });
    if (!escrow) throw new NotFoundException('Escrow not found');

    // Idempotency check
    if (escrow.status === EscrowStatus.REFUNDED) return escrow;

    // Status Guard
    if (escrow.status !== EscrowStatus.FUNDED && escrow.status !== EscrowStatus.DISPUTED) {
      throw new BadRequestException(`Invalid transition: Cannot refund from ${escrow.status}`);
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Execute Atomic Transfer (System -> Buyer)
      const transfer = await this.transferService.executeAtomicTransfer({
        fromWalletId: systemWalletId, // Funds returned from System
        toWalletId: escrow.buyerWalletId,
        amount: escrow.amount,
        reason: reason || LedgerReason.REFUND,
        referenceType: ReferenceType.ESCROW,
        referenceId: escrow.id,
        description: `Refund: ${reason}`,
        transferId: crypto.randomUUID(),
        idempotencyKey: `refund_${escrow.id}`,
        createdBy: userId,
      }, tx);

      // 2. Update Escrow State
      const updatedEscrow = await tx.escrow.update({
        where: { id: escrowId },
        data: {
          status: EscrowStatus.REFUNDED,
          refundedAt: new Date(),
          refundedBy: userId,
          refundEntryId: transfer.fromEntry.entryId, // Debit from System
          resolutionNote: reason ? String(reason) : undefined,
        },
      });

      return updatedEscrow;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  // ============================================================
  // DISPUTE ESCROW
  // State: FUNDED -> DISPUTED
  // ============================================================
  async disputeEscrow(data: DisputeEscrowRequestDto): Promise<Escrow> {
    const { escrowId, disputeReason, userId } = data;

    const escrow = await this.prisma.escrow.findUnique({ where: { id: escrowId } });
    if (!escrow) throw new NotFoundException('Escrow not found');

    if (escrow.status !== EscrowStatus.FUNDED) {
      throw new BadRequestException(`Invalid transition: Cannot dispute from ${escrow.status}`);
    }

    // No money moves, just state update
    return await this.prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.DISPUTED,
        disputedAt: new Date(),
        disputeReason: disputeReason,
      },
    });
  }

  // ============================================================
  // READ OPERATIONS
  // ============================================================
  async getEscrow(id: string): Promise<Escrow> {
    const escrow = await this.prisma.escrow.findUnique({ where: { id } });
    if (!escrow) throw new NotFoundException('Escrow not found');
    return escrow;
  }
}