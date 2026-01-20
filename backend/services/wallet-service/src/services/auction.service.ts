import { PrismaClient, Prisma, AuctionStatus, BidStatus } from '@prisma/client';
import { ledgerService } from './ledger.service';
import { escrowService } from './escrow.service';
import { ReferenceType, LedgerReason, EntryType } from '../types';
import { ValidationError, InsufficientBalanceError } from '../errors/wallet.errors';

const prisma = new PrismaClient();

export const auctionService = {
  /**
   * Place a REAL MONEY bid
   * - Locks funds immediately (Escrow)
   * - Releases previous high bidder's funds
   * - Atomic transaction
   */
  async placeBid(auctionId: string, walletId: string, amount: bigint) {
    // 1. Validate inputs
    if (amount <= 0n) throw new ValidationError('Bid amount must be positive');

    return await prisma.$transaction(async (tx) => {
      // 2. Fetch Auction & Lock for Update
      // We lock the auction row to serialize bids and prevent race conditions
      // However, Prisma doesn't support "FOR UPDATE" on findUnique easily without raw query
      // For now, we rely on the serializable transaction isolation of the outer scope if passed,
      // or we can use a raw query to lock.
      // Let's use the wallet-service pattern: Strict Serializable Transaction.

      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
      });

      if (!auction) throw new ValidationError('Auction not found');
      if (auction.status !== AuctionStatus.OPEN) throw new ValidationError(`Auction is ${auction.status}`);
      if (new Date() > auction.endsAt) throw new ValidationError('Auction has ended');
      if (amount < auction.reservePrice) throw new ValidationError(`Bid must be at least reserve price`);
      
      // 3. Check against current highest bid
      const currentHighBid = await tx.auctionBid.findFirst({
        where: { auctionId, status: BidStatus.PLACED },
        orderBy: { amount: 'desc' },
      });

      if (currentHighBid) {
        if (amount <= currentHighBid.amount) {
          throw new ValidationError(`Bid must be higher than current highest bid (${currentHighBid.amount})`);
        }
      }

      // ============================================================
      // PHASE 5.1 — ANTI-SNIPING EXTENSION
      // ============================================================
      const now = new Date();
      const snipingStartTime = new Date(auction.endsAt.getTime() - (auction.snipingWindowSeconds * 1000));
      let shouldExtend = false;
      let newEndsAt = auction.endsAt;

      if (now >= snipingStartTime) {
          if (auction.extensionsUsed < auction.maxExtensions) {
              shouldExtend = true;
              newEndsAt = new Date(auction.endsAt.getTime() + (auction.extensionSeconds * 1000));
          }
      }

      // 4. Validate Wallet Balance (Available Funds)
      const balance = await ledgerService.getBalance(walletId);
      if (balance < amount) {
        throw new InsufficientBalanceError(balance, amount);
      }
      
      // Fetch System Wallet (Needed for both refund and hold)
      const systemWallet = await tx.wallet.findFirst({ where: { ownerType: 'SYSTEM', status: 'ACTIVE' } });
      if (!systemWallet) throw new Error('Critical: No Active System Wallet found for Escrow');

      // ============================================================
      // ATOMIC SWAP: Release Old -> Hold New
      // ============================================================

      // 5. Release Previous Bidder's Funds (if exists)
      if (currentHighBid) {
        // CRITICAL FIX: Use REFUNDS for outbid (System -> Buyer), NOT Release (System -> Seller)
        await escrowService.refundEscrow({
            escrowId: currentHighBid.escrowHoldId,
            systemWalletId: systemWallet.id, // Funds sit here
            triggeredBy: 'system_auction_engine',
            reason: `Outbid by ${walletId} (Amount: ${amount})`,
            requestId: `outbid_${currentHighBid.id}_${Date.now()}`
        });

        // Update old bid status
        await tx.auctionBid.update({
          where: { id: currentHighBid.id },
          data: { status: BidStatus.OUTBID }
        });
      }

      // 6. Hold New Bidder's Funds
      // We need the System Wallet ID to hold funds.
      // systemWallet is already fetched above.
      
      const newEscrow = await escrowService.createAndFundEscrow({
        buyerWalletId: walletId,
        sellerWalletId: auction.walletId, // Seller
        systemWalletId: systemWallet.id,
        amount: amount,
        currency: auction.currency,
        referenceType: ReferenceType.AUCTION as any, // Cast for new Enum
        referenceId: auctionId,
        description: `Bid on Auction ${auctionId}`,
        triggeredBy: walletId,
        createdBy: walletId,
        requestId: `bid_${auctionId}_${amount}_${Date.now()}` // Idempotency
      });

      // 7. Create Bid Record
      const newBid = await tx.auctionBid.create({
        data: {
          auctionId,
          bidderWalletId: walletId,
          amount,
          escrowHoldId: newEscrow.id,
          status: BidStatus.PLACED
        }
      });

      // 8. Apply Anti-Sniping Extension (If triggered)
      if (shouldExtend) {
          // Record Event
          await tx.auctionExtensionEvent.create({
              data: {
                  auctionId: auction.id,
                  triggeredByBidId: newBid.id,
                  oldEndsAt: auction.endsAt,
                  newEndsAt: newEndsAt
              }
          });

          // Update Auction
          await tx.auction.update({
              where: { id: auction.id },
              data: {
                  endsAt: newEndsAt,
                  extensionsUsed: { increment: 1 }
              }
          });
      }

      return newBid;

    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 10000
    });
  },

  /**
   * Settle Auction
   * - Releases winning funds to seller
   * - Marks auction SETTLED
   */
  async settleAuction(auctionId: string, triggeredBy: string) {
    return await prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findUnique({ where: { id: auctionId } });
      if (!auction) throw new ValidationError('Auction not found');
      if (auction.status !== AuctionStatus.OPEN && auction.status !== AuctionStatus.CLOSED) {
         throw new ValidationError('Auction already settled or cancelled');
      }

      // Find winner
      const winningBid = await tx.auctionBid.findFirst({
        where: { auctionId, status: BidStatus.PLACED },
        orderBy: { amount: 'desc' }
      });

      if (!winningBid) {
        // No bids? Just close it.
        return await tx.auction.update({
          where: { id: auctionId },
          data: { status: AuctionStatus.SETTLED, settledAt: new Date() }
        });
      }

      // 1. Release Escrow to Seller (Final Settlement)
      // Fetch system wallet again
      const systemWallet = await tx.wallet.findFirst({ where: { ownerType: 'SYSTEM' } });
      if (!systemWallet) throw new Error('Critical: No System Wallet for settlement');

      await escrowService.releaseEscrow({
        escrowId: winningBid.escrowHoldId,
        systemWalletId: systemWallet.id,
        triggeredBy,
        requestId: `settle_${auctionId}`
      });

      // 2. Update Bid Status
      await tx.auctionBid.update({
        where: { id: winningBid.id },
        data: { status: BidStatus.WON }
      });

      // 3. Update Auction Status
      return await tx.auction.update({
        where: { id: auctionId },
        data: { status: AuctionStatus.SETTLED, settledAt: new Date() }
      });

    }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });
  }
};
