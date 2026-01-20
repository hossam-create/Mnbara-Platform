/**
 * Wallet Summary Controller
 * READ-ONLY wallet visibility for escrow-aware UX
 * Shows balances without money movement controls
 */

import { Request, Response } from 'express';
import { PrismaClient, Decimal } from '@prisma/client';

const prisma = new PrismaClient();

export class WalletSummaryController {
  /**
   * Get wallet summary with escrow awareness
   * GET /api/v1/wallet/summary
   */
  async getWalletSummary(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get user's wallet
      const wallet = await prisma.wallet.findUnique({
        where: { userId: parseInt(userId) }
      });

      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      // Get escrow holds for this user
      const escrowHolds = await prisma.escrow.findMany({
        where: {
          OR: [
            { buyerId: parseInt(userId) },
            { sellerId: parseInt(userId) },
            { travelerId: parseInt(userId) }
          ]
        },
        include: {
          order: {
            select: {
              id: true,
              status: true,
              createdAt: true
            }
          }
        }
      });

      // Calculate escrow breakdown by role
      const escrowBreakdown = {
        asBuyer: escrowHolds
          .filter(e => e.buyerId === parseInt(userId))
          .map(e => ({
            orderId: e.orderId,
            amount: e.amount,
            currency: e.currency,
            status: e.status,
            createdAt: e.createdAt
          })),
        asSeller: escrowHolds
          .filter(e => e.sellerId === parseInt(userId))
          .map(e => ({
            orderId: e.orderId,
            amount: e.amount,
            currency: e.currency,
            status: e.status,
            createdAt: e.createdAt
          })),
        asTraveler: escrowHolds
          .filter(e => e.travelerId === parseInt(userId))
          .map(e => ({
            orderId: e.orderId,
            amount: e.amount,
            currency: e.currency,
            status: e.status,
            createdAt: e.createdAt
          }))
      };

      // Calculate balances
      const availableBalance = wallet.balance;
      const totalEscrowHeld = escrowHolds
        .filter(e => e.status === 'HELD')
        .reduce((sum, e) => sum.add(e.amount), new Decimal(0));
      
      const totalPendingRefunds = escrowHolds
        .filter(e => e.status === 'REFUNDED')
        .reduce((sum, e) => sum.add(e.amount), new Decimal(0));

      const totalReleasedEarnings = escrowHolds
        .filter(e => e.status === 'RELEASED' && e.sellerId === parseInt(userId))
        .reduce((sum, e) => sum.add(e.amount), new Decimal(0));

      // Determine user role for wallet type
      const hasBuyerEscrows = escrowBreakdown.asBuyer.length > 0;
      const hasSellerEscrows = escrowBreakdown.asSeller.length > 0;
      const hasTravelerEscrows = escrowBreakdown.asTraveler.length > 0;

      let walletType = 'buyer';
      if (hasSellerEscrows) walletType = 'seller';
      if (hasTravelerEscrows) walletType = 'traveler';

      const summary = {
        walletType,
        balances: {
          available: availableBalance,
          totalEscrowHeld: totalEscrowHeld,
          pendingRefunds: totalPendingRefunds,
          releasedEarnings: totalReleasedEarnings,
          totalValue: availableBalance.add(totalEscrowHeld).add(totalPendingRefunds).add(totalReleasedEarnings)
        },
        escrowBreakdown,
        currency: wallet.currency || 'USD',
        lastUpdated: wallet.updatedAt,
        isReadOnly: true // Explicitly mark as read-only
      };

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('Get wallet summary error:', error);
      res.status(500).json({ 
        error: 'Failed to get wallet summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get wallet transaction history
   * GET /api/v1/wallet/transactions
   */
  async getTransactionHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { page = 1, limit = 50, type } = req.query;

      // Get wallet ledger entries
      const transactions = await prisma.walletLedger.findMany({
        where: {
          wallet: {
            userId: parseInt(userId)
          },
          ...(type && { type: type as string })
        },
        include: {
          order: {
            select: {
              id: true,
              status: true
            }
          },
          escrow: {
            select: {
              id: true,
              status: true,
              buyerId: true,
              sellerId: true,
              travelerId: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      });

      // Get total count for pagination
      const totalCount = await prisma.walletLedger.count({
        where: {
          wallet: {
            userId: parseInt(userId)
          },
          ...(type && { type: type as string })
        }
      });

      const formattedTransactions = transactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        balanceBefore: tx.balanceBefore,
        balanceAfter: tx.balanceAfter,
        currency: tx.currency,
        description: tx.description,
        orderId: tx.orderId,
        escrowId: tx.escrowId,
        orderStatus: tx.order?.status,
        escrowStatus: tx.escrow?.status,
        performedBy: tx.performedBy,
        metadata: tx.metadata,
        createdAt: tx.createdAt,
        // Add human-readable labels
        label: this.getTransactionLabel(tx.type, tx.escrow?.status, tx.order?.status),
        isSystemGenerated: true
      }));

      res.json({
        success: true,
        data: {
          transactions: formattedTransactions,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            totalCount,
            totalPages: Math.ceil(totalCount / parseInt(limit as string))
          }
        }
      });

    } catch (error) {
      console.error('Get transaction history error:', error);
      res.status(500).json({ 
        error: 'Failed to get transaction history',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get escrow holds for user
   * GET /api/v1/escrow/holds
   */
  async getEscrowHolds(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { status, page = 1, limit = 20 } = req.query;

      const escrows = await prisma.escrow.findMany({
        where: {
          OR: [
            { buyerId: parseInt(userId) },
            { sellerId: parseInt(userId) },
            { travelerId: parseInt(userId) }
          ],
          ...(status && { status: status as string })
        },
        include: {
          order: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              items: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      });

      // Get total count for pagination
      const totalCount = await prisma.escrow.count({
        where: {
          OR: [
            { buyerId: parseInt(userId) },
            { sellerId: parseInt(userId) },
            { travelerId: parseInt(userId) }
          ],
          ...(status && { status: status as string })
        }
      });

      const formattedEscrows = escrows.map(escrow => {
        let userRole = 'buyer';
        if (escrow.sellerId === parseInt(userId)) userRole = 'seller';
        if (escrow.travelerId === parseInt(userId)) userRole = 'traveler';

        return {
          id: escrow.id,
          orderId: escrow.orderId,
          amount: escrow.amount,
          currency: escrow.currency,
          status: escrow.status,
          userRole,
          buyerId: escrow.buyerId,
          sellerId: escrow.sellerId,
          travelerId: escrow.travelerId,
          description: escrow.description,
          createdAt: escrow.createdAt,
          expiresAt: escrow.expiresAt,
          releasedAt: escrow.releasedAt,
          order: escrow.order,
          // Add human-readable status
          statusLabel: this.getEscrowStatusLabel(escrow.status, userRole),
          // Add action context (read-only)
          actionContext: this.getActionContext(escrow.status, userRole),
          metadata: escrow.metadata
        };
      });

      res.json({
        success: true,
        data: {
          escrows: formattedEscrows,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            totalCount,
            totalPages: Math.ceil(totalCount / parseInt(limit as string))
          }
        }
      });

    } catch (error) {
      console.error('Get escrow holds error:', error);
      res.status(500).json({ 
        error: 'Failed to get escrow holds',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get human-readable transaction label
   */
  private getTransactionLabel(type: string, escrowStatus?: string, orderStatus?: string): string {
    const labels: Record<string, string> = {
      'ESCROW_HOLD': 'Funds Held in Escrow',
      'ESCROW_RELEASE': 'Escrow Released',
      'ESCROW_REFUND': 'Refund Processed',
      'DEPOSIT': 'Deposit',
      'WITHDRAWAL': 'Withdrawal',
      'TRANSFER_IN': 'Transfer Received',
      'TRANSFER_OUT': 'Transfer Sent',
      'CONVERSION': 'Currency Conversion',
      'ADJUSTMENT': 'Balance Adjustment'
    };

    let label = labels[type] || 'Transaction';

    // Add context for escrow transactions
    if (type.startsWith('ESCROW_') && escrowStatus) {
      switch (escrowStatus) {
        case 'HELD':
          label = 'Funds Held Securely';
          break;
        case 'RELEASED':
          label = 'Funds Released';
          break;
        case 'REFUNDED':
          label = 'Refund Completed';
          break;
        case 'DISPUTED':
          label = 'Dispute - Funds Frozen';
          break;
      }
    }

    return label;
  }

  /**
   * Get human-readable escrow status label
   */
  private getEscrowStatusLabel(status: string, userRole: string): string {
    const statusLabels: Record<string, Record<string, string>> = {
      'HELD': {
        'buyer': 'Payment Held in Escrow',
        'seller': 'Payment Held in Escrow',
        'traveler': 'Payment Held in Escrow'
      },
      'RELEASED': {
        'buyer': 'Order Completed',
        'seller': 'Payment Released',
        'traveler': 'Mission Completed'
      },
      'REFUNDED': {
        'buyer': 'Refund Processed',
        'seller': 'Refund Processed',
        'traveler': 'Refund Processed'
      },
      'DISPUTED': {
        'buyer': 'Dispute in Progress',
        'seller': 'Dispute in Progress',
        'traveler': 'Dispute in Progress'
      }
    };

    return statusLabels[status]?.[userRole] || status;
  }

  /**
   * Get action context for escrow (read-only)
   */
  private getActionContext(status: string, userRole: string): string {
    const contexts: Record<string, Record<string, string>> = {
      'HELD': {
        'buyer': 'Funds secured until order completion',
        'seller': 'Payment secured, awaiting completion',
        'traveler': 'Payment secured, awaiting mission completion'
      },
      'RELEASED': {
        'buyer': 'Order completed successfully',
        'seller': 'Payment released to your wallet',
        'traveler': 'Mission completed, payment released'
      },
      'REFUNDED': {
        'buyer': 'Refund processed to your wallet',
        'seller': 'Refund processed to buyer',
        'traveler': 'Refund processed to buyer'
      },
      'DISPUTED': {
        'buyer': 'Dispute opened, funds frozen',
        'seller': 'Dispute opened, funds frozen',
        'traveler': 'Dispute opened, funds frozen'
      }
    };

    return contexts[status]?.[userRole] || 'Processing';
  }
}

export const walletSummaryController = new WalletSummaryController();
