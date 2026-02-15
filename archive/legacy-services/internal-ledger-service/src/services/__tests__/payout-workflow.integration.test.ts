// ============================================================
// Payout Workflow Integration Tests
// Tests the complete payout lifecycle from request to completion
// ============================================================

import { PrismaClient } from '@prisma/client';
import { PayoutService } from '../payout.service';
import { PayoutStatus, PayoutMethod } from '../../types/payout.types';

const prisma = new PrismaClient();
const payoutService = new PayoutService();

describe('Payout Workflow Integration', () => {
  let testUserId: number;
  let testWalletId: number;
  const adminId = 999;

  beforeAll(async () => {
    testUserId = 2;
    testWalletId = 2;

    // Create test wallet with balance
    await prisma.wallet.upsert({
      where: { id: testWalletId },
      update: {
        availableBalance: 2000,
        lockedBalance: 0,
      },
      create: {
        id: testWalletId,
        userId: testUserId,
        currency: 'USD',
        availableBalance: 2000,
        lockedBalance: 0,
      },
    });
  });

  afterAll(async () => {
    await prisma.payoutRequest.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.walletTransaction.deleteMany({
      where: { walletId: testWalletId },
    });
    await prisma.$disconnect();
  });

  describe('Complete Payout Workflow - Success Path', () => {
    it('should complete full payout lifecycle: request → approve → process → complete', async () => {
      const initialWallet = await prisma.wallet.findUnique({
        where: { id: testWalletId },
      });

      const initialAvailable = initialWallet?.availableBalance || 0;
      const initialLocked = initialWallet?.lockedBalance || 0;
      const payoutAmount = 200;

      // Step 1: User creates payout request
      const payoutData = {
        userId: testUserId,
        walletId: testWalletId,
        amount: payoutAmount,
        currency: 'USD',
        method: PayoutMethod.BANK_TRANSFER,
        accountDetails: {
          accountHolderName: 'Integration Test User',
          bankName: 'Test Bank',
          accountNumber: '9876543210',
          routingNumber: '987654321',
        },
      };

      const request = await payoutService.createPayoutRequest(payoutData);

      expect(request.status).toBe(PayoutStatus.PENDING);
      expect(request.amount).toBe(payoutAmount);

      // Verify funds are locked
      const walletAfterRequest = await prisma.wallet.findUnique({
        where: { id: testWalletId },
      });

      expect(walletAfterRequest?.availableBalance).toBe(
        initialAvailable - payoutAmount
      );
      expect(walletAfterRequest?.lockedBalance).toBe(
        initialLocked + payoutAmount
      );

      // Step 2: Admin approves payout
      const approved = await payoutService.approvePayoutRequest(
        request.id,
        adminId
      );

      expect(approved.status).toBe(PayoutStatus.APPROVED);
      expect(approved.approvedByAdminId).toBe(adminId);

      // Step 3: Admin marks as processing (manual bank transfer initiated)
      const processing = await payoutService.markPayoutAsProcessing(
        request.id,
        adminId
      );

      expect(processing.status).toBe(PayoutStatus.PROCESSING);
      expect(processing.processedByAdminId).toBe(adminId);

      // Step 4: Admin completes payout (bank transfer confirmed)
      const completed = await payoutService.completePayoutRequest(
        request.id,
        adminId,
        'Bank transfer completed successfully'
      );

      expect(completed.status).toBe(PayoutStatus.COMPLETED);
      expect(completed.completedAt).toBeDefined();
      expect(completed.notes).toBe('Bank transfer completed successfully');

      // Verify final wallet state
      const finalWallet = await prisma.wallet.findUnique({
        where: { id: testWalletId },
      });

      expect(finalWallet?.availableBalance).toBe(
        initialAvailable - payoutAmount
      );
      expect(finalWallet?.lockedBalance).toBe(initialLocked);

      // Verify transaction history
      const transactions = await prisma.walletTransaction.findMany({
        where: {
          referenceType: 'PayoutRequest',
          referenceId: request.id,
        },
      });

      expect(transactions.length).toBeGreaterThan(0);
      expect(transactions[0].status).toBe('COMPLETED');
    });
  });

  describe('Complete Payout Workflow - Rejection Path', () => {
    it('should handle rejection and unlock funds: request → reject', async () => {
      const initialWallet = await prisma.wallet.findUnique({
        where: { id: testWalletId },
      });

      const initialAvailable = initialWallet?.availableBalance || 0;
      const initialLocked = initialWallet?.lockedBalance || 0;
      const payoutAmount = 150;

      // Step 1: User creates payout request
      const payoutData = {
        userId: testUserId,
        walletId: testWalletId,
        amount: payoutAmount,
        currency: 'USD',
        method: PayoutMethod.PAYPAL,
        accountDetails: {
          email: 'rejection-test@example.com',
        },
      };

      const request = await payoutService.createPayoutRequest(payoutData);

      expect(request.status).toBe(PayoutStatus.PENDING);

      // Verify funds are locked
      const walletAfterRequest = await prisma.wallet.findUnique({
        where: { id: testWalletId },
      });

      expect(walletAfterRequest?.availableBalance).toBe(
        initialAvailable - payoutAmount
      );
      expect(walletAfterRequest?.lockedBalance).toBe(
        initialLocked + payoutAmount
      );

      // Step 2: Admin rejects payout
      const rejected = await payoutService.rejectPayoutRequest(
        request.id,
        adminId,
        'Invalid bank account details'
      );

      expect(rejected.status).toBe(PayoutStatus.REJECTED);
      expect(rejected.rejectedByAdminId).toBe(adminId);
      expect(rejected.rejectionReason).toBe('Invalid bank account details');

      // Verify funds are unlocked
      const finalWallet = await prisma.wallet.findUnique({
        where: { id: testWalletId },
      });

      expect(finalWallet?.availableBalance).toBe(initialAvailable);
      expect(finalWallet?.lockedBalance).toBe(initialLocked);

      // Verify transaction status
      const transactions = await prisma.walletTransaction.findMany({
        where: {
          referenceType: 'PayoutRequest',
          referenceId: request.id,
        },
      });

      expect(transactions[0].status).toBe('FAILED');
    });
  });

  describe('Multiple Concurrent Payouts', () => {
    it('should handle multiple payout requests correctly', async () => {
      const initialWallet = await prisma.wallet.findUnique({
        where: { id: testWalletId },
      });

      const initialAvailable = initialWallet?.availableBalance || 0;

      // Create multiple payout requests
      const payout1 = await payoutService.createPayoutRequest({
        userId: testUserId,
        walletId: testWalletId,
        amount: 50,
        currency: 'USD',
        method: PayoutMethod.BANK_TRANSFER,
        accountDetails: {
          accountHolderName: 'Test User',
          bankName: 'Bank 1',
          accountNumber: '1111111111',
        },
      });

      const payout2 = await payoutService.createPayoutRequest({
        userId: testUserId,
        walletId: testWalletId,
        amount: 75,
        currency: 'USD',
        method: PayoutMethod.PAYPAL,
        accountDetails: {
          email: 'multi-test@example.com',
        },
      });

      // Verify both are pending
      expect(payout1.status).toBe(PayoutStatus.PENDING);
      expect(payout2.status).toBe(PayoutStatus.PENDING);

      // Verify total locked amount
      const walletAfterRequests = await prisma.wallet.findUnique({
        where: { id: testWalletId },
      });

      expect(walletAfterRequests?.availableBalance).toBe(
        initialAvailable - 125
      );

      // Approve and complete first payout
      await payoutService.approvePayoutRequest(payout1.id, adminId);
      await payoutService.markPayoutAsProcessing(payout1.id, adminId);
      await payoutService.completePayoutRequest(payout1.id, adminId);

      // Reject second payout
      await payoutService.rejectPayoutRequest(
        payout2.id,
        adminId,
        'Duplicate request'
      );

      // Verify final state
      const finalWallet = await prisma.wallet.findUnique({
        where: { id: testWalletId },
      });

      // Available should be initial - 50 (completed payout)
      // Locked should be back to 0
      expect(finalWallet?.availableBalance).toBe(initialAvailable - 50);
      expect(finalWallet?.lockedBalance).toBe(0);
    });
  });

  describe('Admin Workflow', () => {
    it('should retrieve and filter pending payouts', async () => {
      // Create several payout requests
      await payoutService.createPayoutRequest({
        userId: testUserId,
        walletId: testWalletId,
        amount: 100,
        currency: 'USD',
        method: PayoutMethod.BANK_TRANSFER,
        accountDetails: {
          accountHolderName: 'Test User',
          bankName: 'Test Bank',
          accountNumber: '1234567890',
        },
      });

      await payoutService.createPayoutRequest({
        userId: testUserId,
        walletId: testWalletId,
        amount: 250,
        currency: 'USD',
        method: PayoutMethod.STRIPE_TRANSFER,
        accountDetails: {
          accountId: 'acct_test456',
        },
      });

      // Get all pending payouts
      const allPending = await payoutService.getPendingPayoutRequests();
      expect(allPending.length).toBeGreaterThan(0);

      // Filter by amount
      const highValuePayouts = await payoutService.getPendingPayoutRequests({
        minAmount: 200,
      });

      highValuePayouts.forEach((payout) => {
        expect(payout.amount).toBeGreaterThanOrEqual(200);
      });
    });
  });
});
