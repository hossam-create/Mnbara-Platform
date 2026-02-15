// ============================================================
// Payout Service Tests
// ============================================================

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PayoutService } from '../payout.service';
import { PayoutStatus, PayoutMethod } from '../../types/payout.types';
import { InsufficientBalanceError, PayoutError } from '../../errors/WalletErrors';

const prisma = new PrismaClient();
const payoutService = new PayoutService();

describe('PayoutService', () => {
  let testUserId: number;
  let testWalletId: number;

  beforeAll(async () => {
    // Create test user and wallet
    testUserId = 1;
    testWalletId = 1;

    // Ensure wallet exists with sufficient balance
    await prisma.wallet.upsert({
      where: { id: testWalletId },
      update: {
        availableBalance: 1000,
        lockedBalance: 0,
      },
      create: {
        id: testWalletId,
        userId: testUserId,
        currency: 'USD',
        availableBalance: 1000,
        lockedBalance: 0,
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.payoutRequest.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.walletTransaction.deleteMany({
      where: { walletId: testWalletId },
    });
    await prisma.$disconnect();
  });

  describe('createPayoutRequest', () => {
    it('should create a payout request and lock funds', async () => {
      const payoutData = {
        userId: testUserId,
        walletId: testWalletId,
        amount: 100,
        currency: 'USD',
        method: PayoutMethod.BANK_TRANSFER,
        accountDetails: {
          accountHolderName: 'Test User',
          bankName: 'Test Bank',
          accountNumber: '1234567890',
          routingNumber: '123456789',
        },
      };

      const request = await payoutService.createPayoutRequest(payoutData);

      expect(request).toBeDefined();
      expect(request.status).toBe(PayoutStatus.PENDING);
      expect(request.amount).toBe(100);
      expect(request.userId).toBe(testUserId);

      // Verify funds are locked
      const wallet = await prisma.wallet.findUnique({
        where: { id: testWalletId },
      });

      expect(wallet?.lockedBalance).toBeGreaterThanOrEqual(100);
    });

    it('should reject payout below minimum amount', async () => {
      const payoutData = {
        userId: testUserId,
        walletId: testWalletId,
        amount: 5, // Below $10 minimum
        currency: 'USD',
        method: PayoutMethod.BANK_TRANSFER,
        accountDetails: {
          accountHolderName: 'Test User',
          bankName: 'Test Bank',
          accountNumber: '1234567890',
        },
      };

      await expect(
        payoutService.createPayoutRequest(payoutData)
      ).rejects.toThrow(PayoutError);
    });

    it('should reject payout with insufficient balance', async () => {
      const payoutData = {
        userId: testUserId,
        walletId: testWalletId,
        amount: 10000, // More than available
        currency: 'USD',
        method: PayoutMethod.BANK_TRANSFER,
        accountDetails: {
          accountHolderName: 'Test User',
          bankName: 'Test Bank',
          accountNumber: '1234567890',
        },
      };

      await expect(
        payoutService.createPayoutRequest(payoutData)
      ).rejects.toThrow(InsufficientBalanceError);
    });
  });

  describe('getUserPayoutRequests', () => {
    it('should retrieve user payout requests', async () => {
      const requests = await payoutService.getUserPayoutRequests(testUserId);

      expect(Array.isArray(requests)).toBe(true);
      expect(requests.length).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      const requests = await payoutService.getUserPayoutRequests(testUserId, {
        status: PayoutStatus.PENDING,
      });

      expect(Array.isArray(requests)).toBe(true);
      requests.forEach((req) => {
        expect(req.status).toBe(PayoutStatus.PENDING);
      });
    });
  });

  describe('approvePayoutRequest', () => {
    it('should approve a pending payout request', async () => {
      // Create a payout request first
      const payoutData = {
        userId: testUserId,
        walletId: testWalletId,
        amount: 50,
        currency: 'USD',
        method: PayoutMethod.PAYPAL,
        accountDetails: {
          email: 'test@example.com',
        },
      };

      const request = await payoutService.createPayoutRequest(payoutData);
      const adminId = 999;

      const approved = await payoutService.approvePayoutRequest(
        request.id,
        adminId
      );

      expect(approved.status).toBe(PayoutStatus.APPROVED);
      expect(approved.approvedByAdminId).toBe(adminId);
      expect(approved.processedAt).toBeDefined();
    });

    it('should reject approval of non-pending request', async () => {
      // Create and approve a request
      const payoutData = {
        userId: testUserId,
        walletId: testWalletId,
        amount: 50,
        currency: 'USD',
        method: PayoutMethod.PAYPAL,
        accountDetails: {
          email: 'test@example.com',
        },
      };

      const request = await payoutService.createPayoutRequest(payoutData);
      await payoutService.approvePayoutRequest(request.id, 999);

      // Try to approve again
      await expect(
        payoutService.approvePayoutRequest(request.id, 999)
      ).rejects.toThrow(PayoutError);
    });
  });

  describe('rejectPayoutRequest', () => {
    it('should reject a pending payout and unlock funds', async () => {
      // Create a payout request
      const payoutData = {
        userId: testUserId,
        walletId: testWalletId,
        amount: 75,
        currency: 'USD',
        method: PayoutMethod.BANK_TRANSFER,
        accountDetails: {
          accountHolderName: 'Test User',
          bankName: 'Test Bank',
          accountNumber: '1234567890',
        },
      };

      const request = await payoutService.createPayoutRequest(payoutData);

      // Get wallet balance before rejection
      const walletBefore = await prisma.wallet.findUnique({
        where: { id: testWalletId },
      });

      const adminId = 999;
      const rejected = await payoutService.rejectPayoutRequest(
        request.id,
        adminId,
        'Insufficient documentation'
      );

      expect(rejected.status).toBe(PayoutStatus.REJECTED);
      expect(rejected.rejectedByAdminId).toBe(adminId);
      expect(rejected.rejectionReason).toBe('Insufficient documentation');

      // Verify funds are unlocked
      const walletAfter = await prisma.wallet.findUnique({
        where: { id: testWalletId },
      });

      const beforeAvailable = new Decimal(walletBefore?.availableBalance || 0);
      const afterAvailable = new Decimal(walletAfter?.availableBalance || 0);
      
      expect(afterAvailable.greaterThan(beforeAvailable)).toBe(true);
    });
  });

  describe('completePayoutRequest', () => {
    it('should complete a processing payout and deduct from locked balance', async () => {
      // Create, approve, and mark as processing
      const payoutData = {
        userId: testUserId,
        walletId: testWalletId,
        amount: 60,
        currency: 'USD',
        method: PayoutMethod.STRIPE_TRANSFER,
        accountDetails: {
          accountId: 'acct_test123',
        },
      };

      const request = await payoutService.createPayoutRequest(payoutData);
      await payoutService.approvePayoutRequest(request.id, 999);
      await payoutService.markPayoutAsProcessing(request.id, 999);

      // Get wallet balance before completion
      const walletBefore = await prisma.wallet.findUnique({
        where: { id: testWalletId },
      });

      const completed = await payoutService.completePayoutRequest(
        request.id,
        999,
        'Bank transfer completed'
      );

      expect(completed.status).toBe(PayoutStatus.COMPLETED);
      expect(completed.completedAt).toBeDefined();
      expect(completed.notes).toBe('Bank transfer completed');

      // Verify locked balance is reduced
      const walletAfter = await prisma.wallet.findUnique({
        where: { id: testWalletId },
      });

      const beforeLocked = new Decimal(walletBefore?.lockedBalance || 0);
      const afterLocked = new Decimal(walletAfter?.lockedBalance || 0);
      
      expect(afterLocked.lessThan(beforeLocked)).toBe(true);
    });
  });

  describe('getPayoutRequestById', () => {
    it('should retrieve payout request without decryption', async () => {
      const payoutData = {
        userId: testUserId,
        walletId: testWalletId,
        amount: 40,
        currency: 'USD',
        method: PayoutMethod.BANK_TRANSFER,
        accountDetails: {
          accountHolderName: 'Test User',
          bankName: 'Test Bank',
          accountNumber: '1234567890',
        },
      };

      const request = await payoutService.createPayoutRequest(payoutData);
      const retrieved = await payoutService.getPayoutRequestById(
        request.id,
        false
      );

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(request.id);
      expect(typeof retrieved.accountDetails).toBe('string'); // Encrypted
    });

    it('should retrieve payout request with decryption', async () => {
      const payoutData = {
        userId: testUserId,
        walletId: testWalletId,
        amount: 45,
        currency: 'USD',
        method: PayoutMethod.PAYPAL,
        accountDetails: {
          email: 'decrypt-test@example.com',
        },
      };

      const request = await payoutService.createPayoutRequest(payoutData);
      const retrieved = await payoutService.getPayoutRequestById(request.id, true);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(request.id);
      expect(typeof retrieved.accountDetails).toBe('object'); // Decrypted
      expect((retrieved.accountDetails as any).email).toBe(
        'decrypt-test@example.com'
      );
    });
  });
});
