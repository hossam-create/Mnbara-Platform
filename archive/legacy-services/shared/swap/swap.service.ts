import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  SwapStatus,
  SwapItemType,
  CreateSwapProposalInput,
  SwapItemInput,
  SwapResponse,
  SwapActionResult,
  SwapItemResponse
} from './swap.types';

// Type for Prisma transaction client
type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

// Retry configuration for deadlock handling
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
 * Execute operation with retry logic for deadlock handling
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
          `[Swap] Deadlock detected in ${operationName}, attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}, retrying in ${delay}ms`
        );
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * Generate unique swap number
 */
function generateSwapNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SWP-${timestamp}-${random}`;
}

/**
 * Swap Service
 * 
 * Implements peer-to-peer swap functionality including:
 * - Swap proposal creation
 * - Acceptance/rejection flow
 * - Counter-offer support
 * - Escrow integration for swap transactions
 */
export class SwapService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new swap proposal
   */
  async createProposal(input: CreateSwapProposalInput): Promise<SwapActionResult> {
    const {
      initiatorId,
      receiverId,
      initiatorItems,
      receiverItems,
      message,
      expiresInHours = 72
    } = input;

    // Validate initiator and receiver are different
    if (initiatorId === receiverId) {
      throw new Error('Cannot create swap with yourself');
    }

    // Validate at least one initiator item
    if (!initiatorItems || initiatorItems.length === 0) {
      throw new Error('At least one initiator item is required');
    }

    return executeWithRetry(async () => {
      return await this.prisma.$transaction(async (tx: TransactionClient) => {
        // Verify both users exist
        const [initiator, receiver] = await Promise.all([
          tx.user.findUnique({ where: { id: initiatorId } }),
          tx.user.findUnique({ where: { id: receiverId } })
        ]);

        if (!initiator) throw new Error(`Initiator user ${initiatorId} not found`);
        if (!receiver) throw new Error(`Receiver user ${receiverId} not found`);

        // Validate and lock listings
        await this.validateAndLockListings(tx, initiatorItems, initiatorId);
        if (receiverItems && receiverItems.length > 0) {
          await this.validateAndLockListings(tx, receiverItems, receiverId);
        }

        // Calculate expiration
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expiresInHours);

        // Create swap record
        const swap = await tx.swap.create({
          data: {
            swapNumber: generateSwapNumber(),
            initiatorId,
            receiverId,
            status: SwapStatus.PROPOSED,
            message,
            expiresAt,
            metadata: {
              createdVia: 'api',
              initiatorItemCount: initiatorItems.length,
              receiverItemCount: receiverItems?.length || 0
            }
          }
        });

        // Create swap items for initiator
        const createdInitiatorItems = await this.createSwapItems(
          tx, swap.id, initiatorId, initiatorItems
        );

        // Create swap items for receiver (if specified)
        let createdReceiverItems: any[] = [];
        if (receiverItems && receiverItems.length > 0) {
          createdReceiverItems = await this.createSwapItems(
            tx, swap.id, receiverId, receiverItems
          );
        }

        // Create history entry
        await tx.swapHistory.create({
          data: {
            swapId: swap.id,
            newStatus: SwapStatus.PROPOSED,
            action: 'PROPOSAL_CREATED',
            performedBy: initiatorId,
            metadata: { itemCount: initiatorItems.length + (receiverItems?.length || 0) }
          }
        });

        const response = this.formatSwapResponse(
          swap,
          [...createdInitiatorItems, ...createdReceiverItems]
        );

        return {
          success: true,
          swap: response,
          message: 'Swap proposal created successfully'
        };
      }, {
        isolationLevel: 'Serializable' as any,
        timeout: 15000
      });
    }, 'createProposal');
  }

  /**
   * Accept a swap proposal
   */
  async acceptProposal(swapId: number, userId: number): Promise<SwapActionResult> {
    return executeWithRetry(async () => {
      return await this.prisma.$transaction(async (tx: TransactionClient) => {
        const swap = await tx.swap.findUnique({
          where: { id: swapId },
          include: { items: true }
        });

        if (!swap) throw new Error(`Swap ${swapId} not found`);
        if (swap.receiverId !== userId) {
          throw new Error('Only the receiver can accept this swap');
        }
        if (swap.status !== SwapStatus.PROPOSED) {
          throw new Error(`Cannot accept swap in ${swap.status} status`);
        }
        if (swap.expiresAt && swap.expiresAt < new Date()) {
          throw new Error('Swap proposal has expired');
        }

        // Verify all listings are still available
        await this.verifyListingsAvailable(tx, swap.items);

        // Update swap status
        const updatedSwap = await tx.swap.update({
          where: { id: swapId },
          data: {
            status: SwapStatus.ACCEPTED,
            receiverConfirmed: true,
            receiverConfirmedAt: new Date()
          },
          include: { items: true }
        });

        // Create history entry
        await tx.swapHistory.create({
          data: {
            swapId: swap.id,
            previousStatus: SwapStatus.PROPOSED,
            newStatus: SwapStatus.ACCEPTED,
            action: 'PROPOSAL_ACCEPTED',
            performedBy: userId
          }
        });

        return {
          success: true,
          swap: this.formatSwapResponse(updatedSwap, updatedSwap.items),
          message: 'Swap proposal accepted. Proceed to escrow.'
        };
      }, {
        isolationLevel: 'Serializable' as any,
        timeout: 15000
      });
    }, 'acceptProposal');
  }

  /**
   * Reject a swap proposal
   */
  async rejectProposal(
    swapId: number,
    userId: number,
    reason?: string
  ): Promise<SwapActionResult> {
    return executeWithRetry(async () => {
      return await this.prisma.$transaction(async (tx: TransactionClient) => {
        const swap = await tx.swap.findUnique({
          where: { id: swapId },
          include: { items: true }
        });

        if (!swap) throw new Error(`Swap ${swapId} not found`);
        if (swap.receiverId !== userId && swap.initiatorId !== userId) {
          throw new Error('Only participants can reject this swap');
        }
        if (![SwapStatus.PROPOSED, SwapStatus.PENDING].includes(swap.status as SwapStatus)) {
          throw new Error(`Cannot reject swap in ${swap.status} status`);
        }

        // Update swap status
        const updatedSwap = await tx.swap.update({
          where: { id: swapId },
          data: {
            status: SwapStatus.REJECTED,
            cancelledAt: new Date(),
            cancelledBy: userId,
            cancellationReason: reason
          },
          include: { items: true }
        });

        // Release any locked listings
        await this.releaseListingLocks(tx, swap.items);

        // Create history entry
        await tx.swapHistory.create({
          data: {
            swapId: swap.id,
            previousStatus: swap.status as SwapStatus,
            newStatus: SwapStatus.REJECTED,
            action: 'PROPOSAL_REJECTED',
            performedBy: userId,
            reason
          }
        });

        return {
          success: true,
          swap: this.formatSwapResponse(updatedSwap, updatedSwap.items),
          message: 'Swap proposal rejected'
        };
      }, {
        isolationLevel: 'Serializable' as any,
        timeout: 15000
      });
    }, 'rejectProposal');
  }

  /**
   * Create counter-offer for a swap
   */
  async createCounterOffer(
    swapId: number,
    userId: number,
    newItems: SwapItemInput[],
    message?: string
  ): Promise<SwapActionResult> {
    return executeWithRetry(async () => {
      return await this.prisma.$transaction(async (tx: TransactionClient) => {
        const swap = await tx.swap.findUnique({
          where: { id: swapId },
          include: { items: true }
        });

        if (!swap) throw new Error(`Swap ${swapId} not found`);
        if (swap.receiverId !== userId) {
          throw new Error('Only the receiver can counter-offer');
        }
        if (swap.status !== SwapStatus.PROPOSED) {
          throw new Error(`Cannot counter-offer swap in ${swap.status} status`);
        }
        if (swap.counterOfferCount >= swap.maxCounterOffers) {
          throw new Error('Maximum counter-offers reached');
        }

        // Validate new items
        await this.validateAndLockListings(tx, newItems, userId);

        // Remove old receiver items
        await tx.swapItem.deleteMany({
          where: { swapId, ownerId: userId }
        });

        // Create new items
        const createdItems = await this.createSwapItems(tx, swapId, userId, newItems);

        // Update swap - swap initiator/receiver roles
        const updatedSwap = await tx.swap.update({
          where: { id: swapId },
          data: {
            initiatorId: swap.receiverId,
            receiverId: swap.initiatorId,
            counterOfferCount: swap.counterOfferCount + 1,
            message: message || swap.message,
            metadata: {
              ...(swap.metadata as object || {}),
              lastCounterOffer: new Date().toISOString(),
              counterOfferBy: userId
            }
          },
          include: { items: true }
        });

        // Create history entry
        await tx.swapHistory.create({
          data: {
            swapId: swap.id,
            previousStatus: swap.status as SwapStatus,
            newStatus: SwapStatus.PROPOSED,
            action: 'COUNTER_OFFER_CREATED',
            performedBy: userId,
            metadata: { counterOfferNumber: swap.counterOfferCount + 1 }
          }
        });

        return {
          success: true,
          swap: this.formatSwapResponse(updatedSwap, updatedSwap.items),
          message: 'Counter-offer created successfully'
        };
      }, {
        isolationLevel: 'Serializable' as any,
        timeout: 15000
      });
    }, 'createCounterOffer');
  }


  /**
   * Initiate escrow for an accepted swap
   * Creates escrow holds for both parties based on value difference
   */
  async initiateEscrow(swapId: number, systemUserId: number): Promise<SwapActionResult> {
    return executeWithRetry(async () => {
      return await this.prisma.$transaction(async (tx: TransactionClient) => {
        const swap = await tx.swap.findUnique({
          where: { id: swapId },
          include: { items: true }
        });

        if (!swap) throw new Error(`Swap ${swapId} not found`);
        if (swap.status !== SwapStatus.ACCEPTED) {
          throw new Error(`Cannot initiate escrow for swap in ${swap.status} status`);
        }

        // Calculate total values for each party
        const initiatorValue = this.calculateTotalValue(swap.items, swap.initiatorId);
        const receiverValue = this.calculateTotalValue(swap.items, swap.receiverId);
        const valueDifference = Math.abs(initiatorValue - receiverValue);

        let escrowInitiatorId: number | null = null;
        let escrowReceiverId: number | null = null;

        // If there's a value difference, the party with lower value pays the difference
        if (valueDifference > 0) {
          const payerId = initiatorValue < receiverValue ? swap.initiatorId : swap.receiverId;
          const recipientId = initiatorValue < receiverValue ? swap.receiverId : swap.initiatorId;

          // Get payer's wallet
          const payerWallet = await tx.wallet.findUnique({
            where: { userId: payerId }
          });

          if (!payerWallet) {
            throw new Error(`Wallet not found for user ${payerId}`);
          }

          if (payerWallet.balance.lessThan(new Decimal(valueDifference))) {
            throw new Error(
              `Insufficient balance. Required: ${valueDifference}, Available: ${payerWallet.balance}`
            );
          }

          // Create escrow for the value difference
          const escrow = await tx.escrow.create({
            data: {
              orderId: swapId, // Using swapId as orderId for escrow
              buyerId: payerId,
              sellerId: recipientId,
              amount: new Decimal(valueDifference),
              currency: 'USD',
              status: 'HELD',
              description: `Swap escrow for ${swap.swapNumber} - value difference`,
              metadata: {
                swapId,
                swapNumber: swap.swapNumber,
                initiatorValue,
                receiverValue,
                valueDifference,
                type: 'SWAP_VALUE_DIFFERENCE'
              }
            }
          });

          // Deduct from payer's wallet
          const balanceBefore = payerWallet.balance;
          const balanceAfter = balanceBefore.sub(new Decimal(valueDifference));

          await tx.wallet.update({
            where: { id: payerWallet.id },
            data: { balance: balanceAfter }
          });

          // Create ledger entry
          await tx.walletLedger.create({
            data: {
              walletId: payerWallet.id,
              amount: new Decimal(valueDifference).negated(),
              currency: 'USD',
              type: 'ESCROW_HOLD',
              balanceBefore,
              balanceAfter,
              orderId: swapId,
              escrowId: escrow.id,
              description: `Swap escrow hold for ${swap.swapNumber}`,
              performedBy: systemUserId,
              metadata: { swapId, type: 'SWAP_VALUE_DIFFERENCE' }
            }
          });

          if (payerId === swap.initiatorId) {
            escrowInitiatorId = escrow.id;
          } else {
            escrowReceiverId = escrow.id;
          }
        }

        // Update swap status to IN_ESCROW
        const updatedSwap = await tx.swap.update({
          where: { id: swapId },
          data: {
            status: SwapStatus.IN_ESCROW,
            escrowInitiatorId,
            escrowReceiverId,
            metadata: {
              ...(swap.metadata as object || {}),
              escrowInitiatedAt: new Date().toISOString(),
              initiatorValue,
              receiverValue,
              valueDifference
            }
          },
          include: { items: true }
        });

        // Create history entry
        await tx.swapHistory.create({
          data: {
            swapId: swap.id,
            previousStatus: SwapStatus.ACCEPTED,
            newStatus: SwapStatus.IN_ESCROW,
            action: 'ESCROW_INITIATED',
            performedBy: systemUserId,
            metadata: { valueDifference, escrowInitiatorId, escrowReceiverId }
          }
        });

        return {
          success: true,
          swap: this.formatSwapResponse(updatedSwap, updatedSwap.items),
          message: 'Escrow initiated successfully',
          escrowCreated: valueDifference > 0
        };
      }, {
        isolationLevel: 'Serializable' as any,
        timeout: 20000
      });
    }, 'initiateEscrow');
  }

  /**
   * Confirm swap completion by a party
   */
  async confirmCompletion(swapId: number, userId: number): Promise<SwapActionResult> {
    return executeWithRetry(async () => {
      return await this.prisma.$transaction(async (tx: TransactionClient) => {
        const swap = await tx.swap.findUnique({
          where: { id: swapId },
          include: { items: true }
        });

        if (!swap) throw new Error(`Swap ${swapId} not found`);
        if (swap.status !== SwapStatus.IN_ESCROW) {
          throw new Error(`Cannot confirm swap in ${swap.status} status`);
        }
        if (userId !== swap.initiatorId && userId !== swap.receiverId) {
          throw new Error('Only swap participants can confirm completion');
        }

        // Update confirmation status
        const isInitiator = userId === swap.initiatorId;
        const updateData: any = {};

        if (isInitiator) {
          if (swap.initiatorConfirmed) {
            throw new Error('Initiator has already confirmed');
          }
          updateData.initiatorConfirmed = true;
          updateData.initiatorConfirmedAt = new Date();
        } else {
          if (swap.receiverConfirmed) {
            throw new Error('Receiver has already confirmed');
          }
          updateData.receiverConfirmed = true;
          updateData.receiverConfirmedAt = new Date();
        }

        // Check if both parties have confirmed
        const bothConfirmed = 
          (isInitiator && swap.receiverConfirmed) ||
          (!isInitiator && swap.initiatorConfirmed);

        if (bothConfirmed) {
          updateData.status = SwapStatus.COMPLETED;
          updateData.completedAt = new Date();
        }

        const updatedSwap = await tx.swap.update({
          where: { id: swapId },
          data: updateData,
          include: { items: true }
        });

        // Create history entry
        await tx.swapHistory.create({
          data: {
            swapId: swap.id,
            previousStatus: swap.status as SwapStatus,
            newStatus: bothConfirmed ? SwapStatus.COMPLETED : SwapStatus.IN_ESCROW,
            action: bothConfirmed ? 'SWAP_COMPLETED' : 'CONFIRMATION_RECEIVED',
            performedBy: userId,
            metadata: { confirmedBy: isInitiator ? 'initiator' : 'receiver' }
          }
        });

        // If both confirmed, release escrow and transfer listings
        if (bothConfirmed) {
          await this.finalizeSwap(tx, updatedSwap);
        }

        return {
          success: true,
          swap: this.formatSwapResponse(updatedSwap, updatedSwap.items),
          message: bothConfirmed 
            ? 'Swap completed successfully' 
            : 'Confirmation recorded. Waiting for other party.'
        };
      }, {
        isolationLevel: 'Serializable' as any,
        timeout: 20000
      });
    }, 'confirmCompletion');
  }

  /**
   * Cancel a swap (before completion)
   */
  async cancelSwap(
    swapId: number,
    userId: number,
    reason: string
  ): Promise<SwapActionResult> {
    return executeWithRetry(async () => {
      return await this.prisma.$transaction(async (tx: TransactionClient) => {
        const swap = await tx.swap.findUnique({
          where: { id: swapId },
          include: { items: true }
        });

        if (!swap) throw new Error(`Swap ${swapId} not found`);
        if (userId !== swap.initiatorId && userId !== swap.receiverId) {
          throw new Error('Only swap participants can cancel');
        }
        if ([SwapStatus.COMPLETED, SwapStatus.CANCELLED].includes(swap.status as SwapStatus)) {
          throw new Error(`Cannot cancel swap in ${swap.status} status`);
        }

        // Refund any escrow
        if (swap.escrowInitiatorId || swap.escrowReceiverId) {
          await this.refundSwapEscrow(tx, swap, userId, reason);
        }

        // Release listing locks
        await this.releaseListingLocks(tx, swap.items);

        // Update swap status
        const updatedSwap = await tx.swap.update({
          where: { id: swapId },
          data: {
            status: SwapStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelledBy: userId,
            cancellationReason: reason
          },
          include: { items: true }
        });

        // Create history entry
        await tx.swapHistory.create({
          data: {
            swapId: swap.id,
            previousStatus: swap.status as SwapStatus,
            newStatus: SwapStatus.CANCELLED,
            action: 'SWAP_CANCELLED',
            performedBy: userId,
            reason
          }
        });

        return {
          success: true,
          swap: this.formatSwapResponse(updatedSwap, updatedSwap.items),
          message: 'Swap cancelled successfully'
        };
      }, {
        isolationLevel: 'Serializable' as any,
        timeout: 20000
      });
    }, 'cancelSwap');
  }

  /**
   * Raise a dispute for a swap
   */
  async raiseDispute(
    swapId: number,
    userId: number,
    reason: string
  ): Promise<SwapActionResult> {
    return executeWithRetry(async () => {
      return await this.prisma.$transaction(async (tx: TransactionClient) => {
        const swap = await tx.swap.findUnique({
          where: { id: swapId },
          include: { items: true }
        });

        if (!swap) throw new Error(`Swap ${swapId} not found`);
        if (userId !== swap.initiatorId && userId !== swap.receiverId) {
          throw new Error('Only swap participants can raise disputes');
        }
        if (swap.status !== SwapStatus.IN_ESCROW) {
          throw new Error(`Cannot dispute swap in ${swap.status} status`);
        }

        // Update swap status
        const updatedSwap = await tx.swap.update({
          where: { id: swapId },
          data: {
            status: SwapStatus.DISPUTED,
            metadata: {
              ...(swap.metadata as object || {}),
              disputeReason: reason,
              disputedAt: new Date().toISOString(),
              disputedBy: userId
            }
          },
          include: { items: true }
        });

        // Update escrow status to disputed if exists
        if (swap.escrowInitiatorId) {
          await tx.escrow.update({
            where: { id: swap.escrowInitiatorId },
            data: { status: 'DISPUTED' }
          });
        }
        if (swap.escrowReceiverId) {
          await tx.escrow.update({
            where: { id: swap.escrowReceiverId },
            data: { status: 'DISPUTED' }
          });
        }

        // Create history entry
        await tx.swapHistory.create({
          data: {
            swapId: swap.id,
            previousStatus: SwapStatus.IN_ESCROW,
            newStatus: SwapStatus.DISPUTED,
            action: 'DISPUTE_RAISED',
            performedBy: userId,
            reason
          }
        });

        return {
          success: true,
          swap: this.formatSwapResponse(updatedSwap, updatedSwap.items),
          message: 'Dispute raised successfully'
        };
      }, {
        isolationLevel: 'Serializable' as any,
        timeout: 15000
      });
    }, 'raiseDispute');
  }


  /**
   * Get swap by ID
   */
  async getSwapById(swapId: number): Promise<SwapResponse | null> {
    const swap = await this.prisma.swap.findUnique({
      where: { id: swapId },
      include: { items: true }
    });

    if (!swap) return null;
    return this.formatSwapResponse(swap, swap.items);
  }

  /**
   * Get swap by swap number
   */
  async getSwapByNumber(swapNumber: string): Promise<SwapResponse | null> {
    const swap = await this.prisma.swap.findUnique({
      where: { swapNumber },
      include: { items: true }
    });

    if (!swap) return null;
    return this.formatSwapResponse(swap, swap.items);
  }

  /**
   * Get swaps for a user
   */
  async getUserSwaps(
    userId: number,
    options: {
      status?: SwapStatus;
      role?: 'initiator' | 'receiver' | 'both';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ swaps: SwapResponse[]; total: number }> {
    const { status, role = 'both', limit = 20, offset = 0 } = options;

    const whereClause: any = {};

    if (role === 'initiator') {
      whereClause.initiatorId = userId;
    } else if (role === 'receiver') {
      whereClause.receiverId = userId;
    } else {
      whereClause.OR = [
        { initiatorId: userId },
        { receiverId: userId }
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    const [swaps, total] = await Promise.all([
      this.prisma.swap.findMany({
        where: whereClause,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      this.prisma.swap.count({ where: whereClause })
    ]);

    return {
      swaps: swaps.map(s => this.formatSwapResponse(s, s.items)),
      total
    };
  }

  /**
   * Get swap history
   */
  async getSwapHistory(swapId: number): Promise<any[]> {
    return await this.prisma.swapHistory.findMany({
      where: { swapId },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Expire old pending swaps (should be run by cron job)
   */
  async expireOldSwaps(): Promise<number> {
    const result = await this.prisma.swap.updateMany({
      where: {
        status: { in: [SwapStatus.PENDING, SwapStatus.PROPOSED] },
        expiresAt: { lt: new Date() }
      },
      data: {
        status: SwapStatus.EXPIRED,
        metadata: {
          expiredAt: new Date().toISOString(),
          expiredBy: 'system'
        }
      }
    });

    // Create history entries for expired swaps
    const expiredSwaps = await this.prisma.swap.findMany({
      where: { status: SwapStatus.EXPIRED },
      select: { id: true }
    });

    for (const swap of expiredSwaps) {
      await this.prisma.swapHistory.create({
        data: {
          swapId: swap.id,
          newStatus: SwapStatus.EXPIRED,
          action: 'SWAP_EXPIRED',
          isSystemAction: true,
          reason: 'Proposal expired'
        }
      });
    }

    return result.count;
  }

  // ============ Private Helper Methods ============

  /**
   * Validate listings and mark them as locked for swap
   */
  private async validateAndLockListings(
    tx: TransactionClient,
    items: SwapItemInput[],
    ownerId: number
  ): Promise<void> {
    for (const item of items) {
      if (item.itemType === SwapItemType.LISTING && item.listingId) {
        const listing = await tx.listing.findUnique({
          where: { id: item.listingId }
        });

        if (!listing) {
          throw new Error(`Listing ${item.listingId} not found`);
        }
        if (listing.sellerId !== ownerId) {
          throw new Error(`Listing ${item.listingId} does not belong to user ${ownerId}`);
        }
        if (!listing.isActive || listing.status !== 'ACTIVE') {
          throw new Error(`Listing ${item.listingId} is not available for swap`);
        }
        if (listing.isAuction) {
          throw new Error('Auction listings cannot be swapped');
        }

        // Mark listing as locked for swap
        await tx.listing.update({
          where: { id: item.listingId },
          data: {
            metadata: {
              ...(listing.metadata as object || {}),
              lockedForSwap: true,
              lockedAt: new Date().toISOString()
            }
          }
        });
      }
    }
  }

  /**
   * Verify all listings in swap are still available
   */
  private async verifyListingsAvailable(
    tx: TransactionClient,
    items: any[]
  ): Promise<void> {
    for (const item of items) {
      if (item.listingId) {
        const listing = await tx.listing.findUnique({
          where: { id: item.listingId }
        });

        if (!listing || !listing.isActive || listing.status !== 'ACTIVE') {
          throw new Error(`Listing ${item.listingId} is no longer available`);
        }
      }
    }
  }

  /**
   * Release listing locks
   */
  private async releaseListingLocks(
    tx: TransactionClient,
    items: any[]
  ): Promise<void> {
    for (const item of items) {
      if (item.listingId) {
        const listing = await tx.listing.findUnique({
          where: { id: item.listingId }
        });

        if (listing) {
          const metadata = listing.metadata as any || {};
          delete metadata.lockedForSwap;
          delete metadata.lockedAt;

          await tx.listing.update({
            where: { id: item.listingId },
            data: { metadata }
          });
        }
      }
    }
  }

  /**
   * Create swap items
   */
  private async createSwapItems(
    tx: TransactionClient,
    swapId: number,
    ownerId: number,
    items: SwapItemInput[]
  ): Promise<any[]> {
    const createdItems: any[] = [];

    for (const item of items) {
      const swapItem = await tx.swapItem.create({
        data: {
          swapId,
          ownerId,
          itemType: item.itemType,
          listingId: item.listingId,
          productName: item.productName,
          productDescription: item.productDescription,
          estimatedValue: new Decimal(item.estimatedValue),
          currency: item.currency || 'USD',
          quantity: item.quantity || 1,
          condition: item.condition,
          images: item.images || [],
          cashAmount: item.cashAmount ? new Decimal(item.cashAmount) : null,
          metadata: {}
        }
      });
      createdItems.push(swapItem);
    }

    return createdItems;
  }

  /**
   * Calculate total value for a party's items
   */
  private calculateTotalValue(items: any[], ownerId: number): number {
    return items
      .filter(item => item.ownerId === ownerId)
      .reduce((total, item) => {
        const itemValue = Number(item.estimatedValue) * (item.quantity || 1);
        const cashAmount = item.cashAmount ? Number(item.cashAmount) : 0;
        return total + itemValue + cashAmount;
      }, 0);
  }

  /**
   * Finalize swap - transfer listings and release escrow
   */
  private async finalizeSwap(tx: TransactionClient, swap: any): Promise<void> {
    // Transfer listing ownership
    for (const item of swap.items) {
      if (item.listingId) {
        const newOwnerId = item.ownerId === swap.initiatorId 
          ? swap.receiverId 
          : swap.initiatorId;

        await tx.listing.update({
          where: { id: item.listingId },
          data: {
            sellerId: newOwnerId,
            metadata: {
              previousOwnerId: item.ownerId,
              transferredViaSwap: swap.swapNumber,
              transferredAt: new Date().toISOString()
            }
          }
        });
      }
    }

    // Release escrow if exists
    if (swap.escrowInitiatorId) {
      await this.releaseSwapEscrow(tx, swap.escrowInitiatorId, swap.receiverId);
    }
    if (swap.escrowReceiverId) {
      await this.releaseSwapEscrow(tx, swap.escrowReceiverId, swap.initiatorId);
    }
  }

  /**
   * Release swap escrow
   */
  private async releaseSwapEscrow(
    tx: TransactionClient,
    escrowId: number,
    recipientId: number
  ): Promise<void> {
    const escrow = await tx.escrow.findUnique({
      where: { id: escrowId }
    });

    if (!escrow || escrow.status !== 'HELD') return;

    // Get recipient wallet
    const recipientWallet = await tx.wallet.findUnique({
      where: { userId: recipientId }
    });

    if (!recipientWallet) {
      throw new Error(`Wallet not found for user ${recipientId}`);
    }

    // Credit recipient
    const balanceBefore = recipientWallet.balance;
    const balanceAfter = balanceBefore.add(escrow.amount);

    await tx.wallet.update({
      where: { id: recipientWallet.id },
      data: { balance: balanceAfter }
    });

    // Create ledger entry
    await tx.walletLedger.create({
      data: {
        walletId: recipientWallet.id,
        amount: escrow.amount,
        currency: escrow.currency,
        type: 'ESCROW_RELEASE',
        balanceBefore,
        balanceAfter,
        orderId: escrow.orderId,
        escrowId: escrow.id,
        description: 'Swap escrow released',
        performedBy: recipientId,
        metadata: { swapId: escrow.orderId, type: 'SWAP_COMPLETION' }
      }
    });

    // Update escrow status
    await tx.escrow.update({
      where: { id: escrowId },
      data: {
        status: 'RELEASED',
        releasedAt: new Date()
      }
    });
  }

  /**
   * Refund swap escrow
   */
  private async refundSwapEscrow(
    tx: TransactionClient,
    swap: any,
    cancelledBy: number,
    reason: string
  ): Promise<void> {
    const escrowIds = [swap.escrowInitiatorId, swap.escrowReceiverId].filter(Boolean);

    for (const escrowId of escrowIds) {
      const escrow = await tx.escrow.findUnique({
        where: { id: escrowId }
      });

      if (!escrow || !['HELD', 'DISPUTED'].includes(escrow.status)) continue;

      // Get buyer wallet (original payer)
      const buyerWallet = await tx.wallet.findUnique({
        where: { userId: escrow.buyerId }
      });

      if (!buyerWallet) continue;

      // Refund to buyer
      const balanceBefore = buyerWallet.balance;
      const balanceAfter = balanceBefore.add(escrow.amount);

      await tx.wallet.update({
        where: { id: buyerWallet.id },
        data: { balance: balanceAfter }
      });

      // Create ledger entry
      await tx.walletLedger.create({
        data: {
          walletId: buyerWallet.id,
          amount: escrow.amount,
          currency: escrow.currency,
          type: 'ESCROW_REFUND',
          balanceBefore,
          balanceAfter,
          orderId: escrow.orderId,
          escrowId: escrow.id,
          description: `Swap escrow refunded: ${reason}`,
          performedBy: cancelledBy,
          metadata: { swapId: swap.id, reason, cancelledBy }
        }
      });

      // Update escrow status
      await tx.escrow.update({
        where: { id: escrowId },
        data: {
          status: 'REFUNDED',
          releasedAt: new Date(),
          metadata: {
            ...(escrow.metadata as object || {}),
            refundReason: reason,
            refundedAt: new Date().toISOString()
          }
        }
      });
    }
  }

  /**
   * Format swap response
   */
  private formatSwapResponse(swap: any, items: any[]): SwapResponse {
    return {
      id: swap.id,
      swapNumber: swap.swapNumber,
      status: swap.status as SwapStatus,
      initiatorId: swap.initiatorId,
      receiverId: swap.receiverId,
      items: items.map(item => this.formatSwapItemResponse(item)),
      matchScore: swap.matchScore ? Number(swap.matchScore) : undefined,
      message: swap.message,
      expiresAt: swap.expiresAt,
      createdAt: swap.createdAt
    };
  }

  /**
   * Format swap item response
   */
  private formatSwapItemResponse(item: any): SwapItemResponse {
    return {
      id: item.id,
      ownerId: item.ownerId,
      itemType: item.itemType as SwapItemType,
      listingId: item.listingId,
      productName: item.productName,
      estimatedValue: Number(item.estimatedValue),
      currency: item.currency,
      quantity: item.quantity,
      cashAmount: item.cashAmount ? Number(item.cashAmount) : undefined
    };
  }
}

export default SwapService;
