import { PrismaClient } from '@prisma/client';
import { WalletService } from './wallet.service';

const prisma = new PrismaClient();
const walletService = new WalletService();

export class WithdrawalProcessor {
  /**
   * Process all REQUESTED withdrawals up to a limit.
   * Idempotent: safe to call multiple times.
   */
  static async processPending(limit = 10, simulateFailure = false) {
    const pending = await prisma.withdrawalRequest.findMany({
      where: { status: 'REQUESTED' },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    for (const wr of pending) {
      try {
        await this.processOne(wr.id, simulateFailure);
      } catch (err) {
        console.error('[WithdrawalProcessor] Error processing withdrawal', wr.id, err);
      }
    }
  }

  /**
   * Process a single withdrawal:
   * REQUESTED -> PROCESSING -> COMPLETED or FAILED.
   * Idempotent: if already COMPLETED/FAILED, does nothing.
   */
  static async processOne(id: number, simulateFailure = false) {
    // Step 1: mark as PROCESSING if still REQUESTED
    const current = await prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!current) return;

    if (current.status === 'COMPLETED' || current.status === 'FAILED') {
      // Already processed
      return;
    }

    if (current.status === 'REQUESTED') {
      await prisma.withdrawalRequest.update({
        where: { id },
        data: { status: 'PROCESSING' },
      });
    }

    // Step 2: simulate external payout provider
    const succeed = !simulateFailure;

    if (succeed) {
      await walletService.markWithdrawalCompleted(id);
      console.log('[WithdrawalProcessor] Withdrawal completed', id);
    } else {
      await walletService.markWithdrawalFailed(id, 'Mock payout failure');
      console.warn('[WithdrawalProcessor] Withdrawal failed', id);
    }
  }
}






