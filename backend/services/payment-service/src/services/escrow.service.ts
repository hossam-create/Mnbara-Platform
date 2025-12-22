import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Type for Prisma transaction client
type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

// Type for escrow where input
type EscrowWhereInput = {
  buyerId?: number;
  sellerId?: number;
  status?: string;
  createdAt?: { gte?: Date; lte?: Date };
};

// Escrow status enum (matching schema)
export enum EscrowStatus {
  HELD = 'HELD',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export interface CreateEscrowParams {
  orderId: number;
  buyerId: number;
  sellerId: number;
  travelerId?: number;
  amount: Decimal | number;
  currency?: string;
  expiresAt?: Date;
  description?: string;
  metadata?: Record<string, any>;
}

export interface ReleaseEscrowParams {
  escrowId: number;
  recipientUserId: number;
  systemUserId: number;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface RefundEscrowParams {
  escrowId: number;
  systemUserId: number;
  reason: string;
  metadata?: Record<string, any>;
}

// Transaction retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 2000,
};

// Deadlock error codes
const DEADLOCK_ERROR_CODES = ['40P01', '40001', 'P2034'];

/**
 * Check if error is a deadlock/serialization error
 */
function isDeadlockError(error: any): boolean {
  if (error?.code && DEADLOCK_ERROR_CODES.includes(error.code)) {
    return true;
  }
  if (error?.message?.toLowerCase().includes('deadlock')) {
    return true;
  }
  if (error?.message?.toLowerCase().includes('could not serialize')) {
    return true;
  }
  return false;
}

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoffDelay(attempt: number): number {
  const exponentialDelay = Math.min(
    RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt),
    RETRY_CONFIG.maxDelayMs
  );
  // Add jitter (±25%)
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(exponentialDelay + jitter);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a transaction with retry logic for deadlock handling
 */
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      if (isDeadlockError(error) && attempt < RETRY_CONFIG.maxRetries) {
        const delay = calculateBackoffDelay(attempt);
        console.warn(
          `[Escrow] Deadlock detected in ${operationName}, attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}, retrying in ${delay}ms`
        );
        await sleep(delay);
        continue;
      }

      // Non-retryable error or max retries exceeded
      throw error;
    }
  }

  throw lastError;
}

export class EscrowService {
  /**
   * Hold funds in escrow with atomic transaction
   * Uses SERIALIZABLE isolation level for maximum consistency
   * Implements deadlock prevention with retry logic
   */
  static async holdFunds(params: CreateEscrowParams) {
    const {
      orderId,
      buyerId,
      sellerId,
      travelerId,
      amount,
      currency = 'USD',
      expiresAt,
      description,
      metadata
    } = params;

    const amountDecimal = amount instanceof Decimal ? amount : new Decimal(amount);

    return executeWithRetry(async () => {
      return await prisma.$transaction(async (tx: TransactionClient) => {
        // 1. Acquire lock on buyer's wallet first (consistent ordering prevents deadlocks)
        const buyerWallet = await tx.wallet.findUnique({
          where: { userId: buyerId }
        });

        if (!buyerWallet) {
          throw new Error(`Wallet not found for buyer ${buyerId}`);
        }

        if (buyerWallet.isLocked) {
          throw new Error(`Buyer wallet ${buyerWallet.id} is locked`);
        }

        // 2. Validate sufficient balance
        if (buyerWallet.balance.lessThan(amountDecimal)) {
          throw new Error(
            `Insufficient balance. Available: ${buyerWallet.balance}, Required: ${amountDecimal}`
          );
        }

        // 3. Check if escrow already exists for this order (idempotency check)
        const existingEscrow = await tx.escrow.findUnique({
          where: { orderId }
        });

        if (existingEscrow) {
          // Return existing escrow if already created (idempotent)
          if (existingEscrow.status === EscrowStatus.HELD) {
            console.log(`[Escrow] Escrow already exists for order ${orderId}, returning existing`);
            return {
              escrow: existingEscrow,
              isExisting: true,
              balanceBefore: buyerWallet.balance,
              balanceAfter: buyerWallet.balance
            };
          }
          throw new Error(`Escrow already exists for order ${orderId} with status ${existingEscrow.status}`);
        }

        // 4. Deduct from buyer's wallet
        const balanceBefore = buyerWallet.balance;
        const balanceAfter = balanceBefore.sub(amountDecimal);

        await tx.wallet.update({
          where: { id: buyerWallet.id },
          data: { balance: balanceAfter }
        });

        // 5. Create escrow record
        const escrow = await tx.escrow.create({
          data: {
            orderId,
            buyerId,
            sellerId,
            travelerId,
            amount: amountDecimal,
            currency,
            status: EscrowStatus.HELD,
            expiresAt,
            description: description || `Escrow for order #${orderId}`,
            metadata: metadata || {}
          }
        });

        // 6. Create wallet ledger entry for audit trail
        await tx.walletLedger.create({
          data: {
            walletId: buyerWallet.id,
            amount: amountDecimal.negated(),
            currency,
            type: 'ESCROW_HOLD',
            balanceBefore,
            balanceAfter,
            orderId,
            escrowId: escrow.id,
            description: `Escrow hold for order #${orderId}`,
            performedBy: buyerId,
            metadata: { escrowId: escrow.id, orderId }
          }
        });

        return {
          escrow,
          isExisting: false,
          balanceBefore,
          balanceAfter
        };
      }, {
        isolationLevel: 'Serializable' as any,
        timeout: 15000, // 15 second timeout
      });
    }, 'holdFunds');
  }


  /**
   * Release escrow funds to recipient (seller or traveler) with atomic transaction
   * Implements proper rollback on failure
   */
  static async releaseFunds(params: ReleaseEscrowParams) {
    const { escrowId, recipientUserId, systemUserId, reason, metadata } = params;

    return executeWithRetry(async () => {
      return await prisma.$transaction(async (tx: TransactionClient) => {
        // 1. Get escrow record with lock
        const escrow = await tx.escrow.findUnique({
          where: { id: escrowId }
        });

        if (!escrow) {
          throw new Error(`Escrow ${escrowId} not found`);
        }

        // 2. DEL-001: Validate escrow status (only HELD can be released)
        if (escrow.status !== EscrowStatus.HELD) {
          throw new Error(
            `Cannot release escrow ${escrowId}. Escrow can only be released when status is HELD. Current status: ${escrow.status}`
          );
        }

        // DEL-001: Duplicate release attempts must be prevented
        if (escrow.status === EscrowStatus.RELEASED) {
          throw new Error(
            `Escrow ${escrowId} has already been released`
          );
        }

        // 3. Validate recipient is authorized
        if (recipientUserId !== escrow.sellerId && recipientUserId !== escrow.travelerId) {
          throw new Error(
            `User ${recipientUserId} is not authorized to receive funds from escrow ${escrowId}`
          );
        }

        // 4. Get recipient's wallet (acquire lock in consistent order by userId)
        const recipientWallet = await tx.wallet.findUnique({
          where: { userId: recipientUserId }
        });

        if (!recipientWallet) {
          throw new Error(`Wallet not found for user ${recipientUserId}`);
        }

        if (recipientWallet.isLocked) {
          throw new Error(`Recipient wallet ${recipientWallet.id} is locked`);
        }

        // 5. Credit recipient's wallet
        const balanceBefore = recipientWallet.balance;
        const balanceAfter = balanceBefore.add(escrow.amount);

        await tx.wallet.update({
          where: { id: recipientWallet.id },
          data: { balance: balanceAfter }
        });

        // 6. Create wallet ledger entry
        const ledgerEntry = await tx.walletLedger.create({
          data: {
            walletId: recipientWallet.id,
            amount: escrow.amount,
            currency: escrow.currency,
            type: 'ESCROW_RELEASE',
            balanceBefore,
            balanceAfter,
            orderId: escrow.orderId,
            escrowId: escrow.id,
            description: `Escrow released for order #${escrow.orderId}`,
            performedBy: systemUserId,
            metadata: {
              releaseReason: reason || 'Delivery confirmed',
              releasedTo: recipientUserId,
              ...metadata
            }
          }
        });

        // 7. Update escrow status
        const updatedEscrow = await tx.escrow.update({
          where: { id: escrow.id },
          data: {
            status: EscrowStatus.RELEASED,
            releasedAt: new Date(),
            releaseLedgerId: ledgerEntry.id,
            metadata: {
              ...(escrow.metadata as object || {}),
              releaseReason: reason || 'Delivery confirmed',
              releasedTo: recipientUserId,
              releasedBy: systemUserId,
              ...metadata
            }
          }
        });

        return {
          escrow: updatedEscrow,
          ledgerEntry,
          balanceBefore,
          balanceAfter
        };
      }, {
        isolationLevel: 'Serializable' as any,
        timeout: 15000,
      });
    }, 'releaseFunds');
  }

  /**
   * Refund escrow funds to buyer with atomic transaction
   * Implements proper rollback on failure
   */
  static async refundFunds(params: RefundEscrowParams) {
    const { escrowId, systemUserId, reason, metadata } = params;

    return executeWithRetry(async () => {
      return await prisma.$transaction(async (tx: TransactionClient) => {
        // 1. Get escrow record
        const escrow = await tx.escrow.findUnique({
          where: { id: escrowId }
        });

        if (!escrow) {
          throw new Error(`Escrow ${escrowId} not found`);
        }

        // 2. PAY-002: Validate escrow status (refunds can only be initiated if status is HELD)
        if (escrow.status !== EscrowStatus.HELD) {
          throw new Error(
            `Cannot refund escrow ${escrowId}. Refunds can only be initiated when escrow status is HELD. Current status: ${escrow.status}`
          );
        }

        // PAY-002: Duplicate refund attempts must be prevented
        if (escrow.status === EscrowStatus.REFUNDED) {
          throw new Error(
            `Escrow ${escrowId} has already been refunded`
          );
        }

        // 3. Get buyer's wallet
        const buyerWallet = await tx.wallet.findUnique({
          where: { userId: escrow.buyerId }
        });

        if (!buyerWallet) {
          throw new Error(`Wallet not found for buyer ${escrow.buyerId}`);
        }

        if (buyerWallet.isLocked) {
          throw new Error(`Buyer wallet ${buyerWallet.id} is locked`);
        }

        // 4. Credit buyer's wallet (refund)
        const balanceBefore = buyerWallet.balance;
        const balanceAfter = balanceBefore.add(escrow.amount);

        await tx.wallet.update({
          where: { id: buyerWallet.id },
          data: { balance: balanceAfter }
        });

        // 5. Create wallet ledger entry
        const ledgerEntry = await tx.walletLedger.create({
          data: {
            walletId: buyerWallet.id,
            amount: escrow.amount,
            currency: escrow.currency,
            type: 'ESCROW_REFUND',
            balanceBefore,
            balanceAfter,
            orderId: escrow.orderId,
            escrowId: escrow.id,
            description: `Escrow refunded for order #${escrow.orderId}: ${reason}`,
            performedBy: systemUserId,
            metadata: {
              refundReason: reason,
              ...metadata
            }
          }
        });

        // 6. Update escrow status
        const updatedEscrow = await tx.escrow.update({
          where: { id: escrow.id },
          data: {
            status: EscrowStatus.REFUNDED,
            releasedAt: new Date(),
            releaseLedgerId: ledgerEntry.id,
            metadata: {
              ...(escrow.metadata as object || {}),
              refundReason: reason,
              refundedBy: systemUserId,
              ...metadata
            }
          }
        });

        return {
          escrow: updatedEscrow,
          ledgerEntry,
          balanceBefore,
          balanceAfter
        };
      }, {
        isolationLevel: 'Serializable' as any,
        timeout: 15000,
      });
    }, 'refundFunds');
  }

  /**
   * Dispute an escrow (freeze funds pending resolution)
   */
  static async disputeEscrow(
    escrowId: number,
    disputeReason: string,
    raisedBy: number,
    metadata?: Record<string, any>
  ) {
    return executeWithRetry(async () => {
      return await prisma.$transaction(async (tx: TransactionClient) => {
        const escrow = await tx.escrow.findUnique({
          where: { id: escrowId }
        });

        if (!escrow) {
          throw new Error(`Escrow ${escrowId} not found`);
        }

        if (escrow.status !== EscrowStatus.HELD) {
          throw new Error(
            `Cannot dispute escrow ${escrowId}. Current status: ${escrow.status}`
          );
        }

        return await tx.escrow.update({
          where: { id: escrow.id },
          data: {
            status: EscrowStatus.DISPUTED,
            metadata: {
              ...(escrow.metadata as object || {}),
              disputeReason,
              disputedAt: new Date().toISOString(),
              disputeRaisedBy: raisedBy,
              ...metadata
            }
          }
        });
      }, {
        isolationLevel: 'Serializable' as any,
        timeout: 10000,
      });
    }, 'disputeEscrow');
  }

  /**
   * Partial release - release portion of escrow to recipient
   * Useful for split payments (e.g., seller + traveler commission)
   */
  static async partialRelease(
    escrowId: number,
    releases: Array<{
      recipientUserId: number;
      amount: Decimal | number;
      description?: string;
    }>,
    systemUserId: number
  ) {
    return executeWithRetry(async () => {
      return await prisma.$transaction(async (tx: TransactionClient) => {
        const escrow = await tx.escrow.findUnique({
          where: { id: escrowId }
        });

        if (!escrow) {
          throw new Error(`Escrow ${escrowId} not found`);
        }

        if (escrow.status !== EscrowStatus.HELD) {
          throw new Error(`Cannot release escrow ${escrowId}. Status: ${escrow.status}`);
        }

        // Calculate total release amount
        const totalRelease = releases.reduce(
          (sum, r) => sum.add(r.amount instanceof Decimal ? r.amount : new Decimal(r.amount)),
          new Decimal(0)
        );

        if (totalRelease.greaterThan(escrow.amount)) {
          throw new Error(
            `Total release amount (${totalRelease}) exceeds escrow amount (${escrow.amount})`
          );
        }

        const results = [];

        // Process each release in order (sorted by userId for deadlock prevention)
        const sortedReleases = [...releases].sort((a, b) => a.recipientUserId - b.recipientUserId);

        for (const release of sortedReleases) {
          const releaseAmount = release.amount instanceof Decimal 
            ? release.amount 
            : new Decimal(release.amount);

          const recipientWallet = await tx.wallet.findUnique({
            where: { userId: release.recipientUserId }
          });

          if (!recipientWallet) {
            throw new Error(`Wallet not found for user ${release.recipientUserId}`);
          }

          if (recipientWallet.isLocked) {
            throw new Error(`Wallet ${recipientWallet.id} is locked`);
          }

          const balanceBefore = recipientWallet.balance;
          const balanceAfter = balanceBefore.add(releaseAmount);

          await tx.wallet.update({
            where: { id: recipientWallet.id },
            data: { balance: balanceAfter }
          });

          const ledgerEntry = await tx.walletLedger.create({
            data: {
              walletId: recipientWallet.id,
              amount: releaseAmount,
              currency: escrow.currency,
              type: 'ESCROW_RELEASE',
              balanceBefore,
              balanceAfter,
              orderId: escrow.orderId,
              escrowId: escrow.id,
              description: release.description || `Partial escrow release for order #${escrow.orderId}`,
              performedBy: systemUserId,
              metadata: {
                partialRelease: true,
                totalEscrowAmount: escrow.amount.toString(),
                releaseAmount: releaseAmount.toString()
              }
            }
          });

          results.push({
            recipientUserId: release.recipientUserId,
            amount: releaseAmount,
            ledgerEntry,
            balanceBefore,
            balanceAfter
          });
        }

        // Update escrow status
        const remainingAmount = escrow.amount.sub(totalRelease);
        const isFullyReleased = remainingAmount.equals(0);

        const updatedEscrow = await tx.escrow.update({
          where: { id: escrow.id },
          data: {
            status: isFullyReleased ? EscrowStatus.RELEASED : EscrowStatus.HELD,
            releasedAt: isFullyReleased ? new Date() : undefined,
            amount: remainingAmount,
            metadata: {
              ...(escrow.metadata as object || {}),
              partialReleases: [
                ...((escrow.metadata as any)?.partialReleases || []),
                {
                  timestamp: new Date().toISOString(),
                  releases: releases.map(r => ({
                    recipientUserId: r.recipientUserId,
                    amount: r.amount.toString()
                  })),
                  releasedBy: systemUserId
                }
              ]
            }
          }
        });

        return {
          escrow: updatedEscrow,
          releases: results,
          remainingAmount,
          isFullyReleased
        };
      }, {
        isolationLevel: 'Serializable' as any,
        timeout: 20000,
      });
    }, 'partialRelease');
  }


  /**
   * Get escrow by order ID
   */
  static async getEscrowByOrderId(orderId: number) {
    return await prisma.escrow.findUnique({
      where: { orderId }
    });
  }

  /**
   * Get escrow by ID
   */
  static async getEscrowById(escrowId: number) {
    return await prisma.escrow.findUnique({
      where: { id: escrowId }
    });
  }

  /**
   * Get all escrows for a buyer
   */
  static async getEscrowsByBuyer(buyerId: number, status?: EscrowStatus) {
    return await prisma.escrow.findMany({
      where: {
        buyerId,
        ...(status && { status })
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get all escrows for a seller
   */
  static async getEscrowsBySeller(sellerId: number, status?: EscrowStatus) {
    return await prisma.escrow.findMany({
      where: {
        sellerId,
        ...(status && { status })
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get expired escrows that need auto-release
   */
  static async getExpiredEscrows() {
    return await prisma.escrow.findMany({
      where: {
        status: EscrowStatus.HELD,
        expiresAt: {
          lte: new Date()
        }
      }
    });
  }

  /**
   * Auto-release expired escrows (should be run by a cron job)
   * Processes each escrow independently to prevent one failure from blocking others
   */
  static async autoReleaseExpiredEscrows(systemUserId: number) {
    const expiredEscrows = await this.getExpiredEscrows();
    const results: Array<{
      success: boolean;
      escrowId: number;
      result?: any;
      error?: string;
    }> = [];

    for (const escrow of expiredEscrows) {
      try {
        const result = await this.releaseFunds({
          escrowId: escrow.id,
          recipientUserId: escrow.sellerId,
          systemUserId,
          reason: 'Auto-released after expiration',
          metadata: { autoReleased: true, expiredAt: escrow.expiresAt }
        });
        results.push({ success: true, escrowId: escrow.id, result });
      } catch (error) {
        results.push({
          success: false,
          escrowId: escrow.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`[Escrow] Failed to auto-release escrow ${escrow.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Cancel escrow (only if still in HELD status)
   * This is a convenience method that wraps refundFunds
   */
  static async cancelEscrow(escrowId: number, systemUserId: number, reason: string) {
    return await this.refundFunds({
      escrowId,
      systemUserId,
      reason: `Cancelled: ${reason}`,
      metadata: { cancelled: true }
    });
  }

  /**
   * Transfer escrow between orders (for order modifications)
   * Atomic operation that cancels one escrow and creates another
   */
  static async transferEscrow(
    fromOrderId: number,
    toOrderId: number,
    newAmount: Decimal | number,
    systemUserId: number
  ) {
    const newAmountDecimal = newAmount instanceof Decimal ? newAmount : new Decimal(newAmount);

    return executeWithRetry(async () => {
      return await prisma.$transaction(async (tx: TransactionClient) => {
        // 1. Get source escrow
        const sourceEscrow = await tx.escrow.findUnique({
          where: { orderId: fromOrderId }
        });

        if (!sourceEscrow) {
          throw new Error(`Source escrow for order ${fromOrderId} not found`);
        }

        if (sourceEscrow.status !== EscrowStatus.HELD) {
          throw new Error(`Source escrow is not in HELD status: ${sourceEscrow.status}`);
        }

        // 2. Check if target escrow already exists
        const existingTargetEscrow = await tx.escrow.findUnique({
          where: { orderId: toOrderId }
        });

        if (existingTargetEscrow) {
          throw new Error(`Escrow already exists for target order ${toOrderId}`);
        }

        // 3. Calculate difference
        const difference = newAmountDecimal.sub(sourceEscrow.amount);

        // 4. Get buyer's wallet for potential adjustment
        const buyerWallet = await tx.wallet.findUnique({
          where: { userId: sourceEscrow.buyerId }
        });

        if (!buyerWallet) {
          throw new Error(`Wallet not found for buyer ${sourceEscrow.buyerId}`);
        }

        let walletAdjustment: any = null;

        // 5. Handle amount difference
        if (!difference.equals(0)) {
          const balanceBefore = buyerWallet.balance;
          let balanceAfter: Decimal;

          if (difference.isPositive()) {
            // Need to charge more - check balance
            if (buyerWallet.balance.lessThan(difference)) {
              throw new Error(
                `Insufficient balance for escrow transfer. Need: ${difference}, Available: ${buyerWallet.balance}`
              );
            }
            balanceAfter = balanceBefore.sub(difference);
          } else {
            // Refund the difference
            balanceAfter = balanceBefore.add(difference.abs());
          }

          await tx.wallet.update({
            where: { id: buyerWallet.id },
            data: { balance: balanceAfter }
          });

          walletAdjustment = await tx.walletLedger.create({
            data: {
              walletId: buyerWallet.id,
              amount: difference.negated(),
              currency: sourceEscrow.currency,
              type: 'ADJUSTMENT',
              balanceBefore,
              balanceAfter,
              orderId: toOrderId,
              description: `Escrow transfer adjustment from order #${fromOrderId} to #${toOrderId}`,
              performedBy: systemUserId,
              metadata: {
                fromOrderId,
                toOrderId,
                originalAmount: sourceEscrow.amount.toString(),
                newAmount: newAmountDecimal.toString(),
                difference: difference.toString()
              }
            }
          });
        }

        // 6. Cancel source escrow
        await tx.escrow.update({
          where: { id: sourceEscrow.id },
          data: {
            status: EscrowStatus.CANCELLED,
            releasedAt: new Date(),
            metadata: {
              ...(sourceEscrow.metadata as object || {}),
              transferredTo: toOrderId,
              transferredAt: new Date().toISOString(),
              transferredBy: systemUserId
            }
          }
        });

        // 7. Create new escrow for target order
        const newEscrow = await tx.escrow.create({
          data: {
            orderId: toOrderId,
            buyerId: sourceEscrow.buyerId,
            sellerId: sourceEscrow.sellerId,
            travelerId: sourceEscrow.travelerId,
            amount: newAmountDecimal,
            currency: sourceEscrow.currency,
            status: EscrowStatus.HELD,
            expiresAt: sourceEscrow.expiresAt,
            description: `Transferred from order #${fromOrderId}`,
            metadata: {
              transferredFrom: fromOrderId,
              originalEscrowId: sourceEscrow.id,
              transferredAt: new Date().toISOString(),
              transferredBy: systemUserId
            }
          }
        });

        return {
          sourceEscrow,
          newEscrow,
          walletAdjustment,
          difference
        };
      }, {
        isolationLevel: 'Serializable' as any,
        timeout: 20000,
      });
    }, 'transferEscrow');
  }

  /**
   * Get escrow statistics for reporting
   */
  static async getEscrowStats(startDate?: Date, endDate?: Date) {
    const where: EscrowWhereInput = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [total, byStatus, totalAmount] = await Promise.all([
      prisma.escrow.count({ where }),
      prisma.escrow.groupBy({
        by: ['status'],
        where,
        _count: true,
        _sum: { amount: true }
      }),
      prisma.escrow.aggregate({
        where,
        _sum: { amount: true }
      })
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc: Record<string, { count: number; totalAmount: Decimal | null }>, item: any) => {
        acc[item.status] = {
          count: item._count,
          totalAmount: item._sum.amount
        };
        return acc;
      }, {} as Record<string, { count: number; totalAmount: Decimal | null }>),
      totalAmount: totalAmount._sum.amount
    };
  }
}

export default EscrowService;
