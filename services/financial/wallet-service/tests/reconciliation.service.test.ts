// ============================================================
// PHASE 4.4 — RECONCILIATION SERVICE TESTS
// Validates that reconciliation ONLY detects mismatches
// NEVER modifies wallet ledger or escrow state
// ============================================================

import { PrismaClient, EscrowStatus, ReconciliationItemStatus, ReconciliationResolution } from '@prisma/client';
import { reconciliationService } from '../services/reconciliation.service';
import { PaymentStatus } from '../interfaces/payment-gateway.interface';

const prisma = new PrismaClient();

// Mock payment gateway
jest.mock('../adapters/payment-gateway.registry', () => ({
  getPaymentGateway: jest.fn(() => ({
    getPaymentDetails: jest.fn(),
  })),
}));

import { getPaymentGateway } from '../adapters/payment-gateway.registry';

describe('Reconciliation Service - Phase 4.4', () => {
  let testWalletBuyer: any;
  let testWalletSeller: any;
  let testWalletSystem: any;
  let testEscrow: any;

  beforeAll(async () => {
    // Create test wallets
    testWalletBuyer = await prisma.wallet.create({
      data: {
        ownerType: 'USER',
        ownerId: 'buyer-001',
        currency: 'EGP',
        status: 'ACTIVE',
      },
    });

    testWalletSeller = await prisma.wallet.create({
      data: {
        ownerType: 'SELLER',
        ownerId: 'seller-001',
        currency: 'EGP',
        status: 'ACTIVE',
      },
    });

    testWalletSystem = await prisma.wallet.create({
      data: {
        ownerType: 'SYSTEM',
        ownerId: 'system',
        currency: 'EGP',
        status: 'ACTIVE',
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.reconciliationItem.deleteMany({});
    await prisma.reconciliationRun.deleteMany({});
    await prisma.escrow.deleteMany({});
    await prisma.ledgerEntry.deleteMany({});
    await prisma.wallet.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create test escrow in FUNDED state
    testEscrow = await prisma.escrow.create({
      data: {
        buyerWalletId: testWalletBuyer.id,
        sellerWalletId: testWalletSeller.id,
        amount: 10000n, // 100.00 EGP
        currency: 'EGP',
        status: EscrowStatus.FUNDED,
        referenceType: 'ORDER',
        referenceId: 'order-123',
        fundedAt: new Date(),
        createdBy: 'system',
      },
    });

    // Create mock payment event
    await prisma.paymentEvent.create({
      data: {
        gateway: 'stripe',
        eventId: 'pi_test_123',
        eventType: 'payment_intent.succeeded',
        payload: {
          metadata: {
            escrowId: testEscrow.id,
          },
          amount: 10000,
        },
        processed: true,
        processedAt: new Date(),
      },
    });
  });

  afterEach(async () => {
    await prisma.reconciliationItem.deleteMany({});
    await prisma.reconciliationRun.deleteMany({});
    await prisma.paymentEvent.deleteMany({});
    await prisma.escrow.deleteMany({});
  });

  // ============================================================
  // CRITICAL RULE TESTS
  // ============================================================

  describe('Absolute Rules Enforcement', () => {
    it('MUST NOT modify wallet ledger during reconciliation', async () => {
      // Mock gateway response
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_test_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 10000 },
      });

      // Get initial ledger count
      const initialLedgerCount = await prisma.ledgerEntry.count();

      // Run reconciliation
      await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'admin-001',
      });

      // Verify ledger unchanged
      const finalLedgerCount = await prisma.ledgerEntry.count();
      expect(finalLedgerCount).toBe(initialLedgerCount);
    });

    it('MUST NOT modify escrow state during reconciliation', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_test_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 10000 },
      });

      // Get initial escrow state
      const initialEscrow = await prisma.escrow.findUnique({
        where: { id: testEscrow.id },
      });

      // Run reconciliation
      await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'admin-001',
      });

      // Verify escrow unchanged
      const finalEscrow = await prisma.escrow.findUnique({
        where: { id: testEscrow.id },
      });

      expect(finalEscrow?.status).toBe(initialEscrow?.status);
      expect(finalEscrow?.amount).toBe(initialEscrow?.amount);
      expect(finalEscrow?.releasedAt).toBe(initialEscrow?.releasedAt);
      expect(finalEscrow?.refundedAt).toBe(initialEscrow?.refundedAt);
    });

    it('MUST NOT auto-release escrow on gateway match', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_test_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 10000 },
      });

      await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'admin-001',
      });

      const escrow = await prisma.escrow.findUnique({
        where: { id: testEscrow.id },
      });

      // Escrow must remain FUNDED, not auto-released
      expect(escrow?.status).toBe(EscrowStatus.FUNDED);
      expect(escrow?.releasedAt).toBeNull();
      expect(escrow?.releasedBy).toBeNull();
    });
  });

  // ============================================================
  // COMPARISON LOGIC TESTS
  // ============================================================

  describe('compareEscrowWithGateway()', () => {
    it('should detect MATCH when amounts and status align', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_test_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 10000 },
      });

      const result = await reconciliationService.compareEscrowWithGateway(
        testEscrow.id,
        testWalletBuyer.id,
        10000n,
        'EGP',
        'stripe'
      );

      expect(result.status).toBe(ReconciliationItemStatus.MATCH);
      expect(result.expectedAmount).toBe(10000n);
      expect(result.gatewayAmount).toBe(10000n);
    });

    it('should detect OVERPAID when gateway shows more', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_test_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 15000 }, // More than expected
      });

      const result = await reconciliationService.compareEscrowWithGateway(
        testEscrow.id,
        testWalletBuyer.id,
        10000n,
        'EGP',
        'stripe'
      );

      expect(result.status).toBe(ReconciliationItemStatus.OVERPAID);
      expect(result.expectedAmount).toBe(10000n);
      expect(result.gatewayAmount).toBe(15000n);
    });

    it('should detect UNDERPAID when gateway shows less', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_test_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 5000 }, // Less than expected
      });

      const result = await reconciliationService.compareEscrowWithGateway(
        testEscrow.id,
        testWalletBuyer.id,
        10000n,
        'EGP',
        'stripe'
      );

      expect(result.status).toBe(ReconciliationItemStatus.UNDERPAID);
      expect(result.expectedAmount).toBe(10000n);
      expect(result.gatewayAmount).toBe(5000n);
    });

    it('should detect MISSING when no gateway record exists', async () => {
      // Delete payment event
      await prisma.paymentEvent.deleteMany({
        where: { eventId: 'pi_test_123' },
      });

      const result = await reconciliationService.compareEscrowWithGateway(
        testEscrow.id,
        testWalletBuyer.id,
        10000n,
        'EGP',
        'stripe'
      );

      expect(result.status).toBe(ReconciliationItemStatus.MISSING);
      expect(result.gatewayPaymentId).toBeNull();
    });

    it('should detect ERROR when gateway query fails', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockRejectedValue(new Error('Gateway timeout'));

      const result = await reconciliationService.compareEscrowWithGateway(
        testEscrow.id,
        testWalletBuyer.id,
        10000n,
        'EGP',
        'stripe'
      );

      expect(result.status).toBe(ReconciliationItemStatus.ERROR);
      expect(result.errorMessage).toContain('Gateway timeout');
    });
  });

  // ============================================================
  // RECONCILIATION RUN TESTS
  // ============================================================

  describe('executeReconciliationRun()', () => {
    it('should create reconciliation run record', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_test_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 10000 },
      });

      const result = await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'admin-001',
        notes: 'Daily reconciliation',
      });

      expect(result.runId).toBeDefined();
      expect(result.totalChecked).toBeGreaterThan(0);

      const run = await prisma.reconciliationRun.findUnique({
        where: { id: result.runId },
      });

      expect(run?.gateway).toBe('STRIPE');
      expect(run?.triggeredBy).toBe('admin-001');
      expect(run?.notes).toBe('Daily reconciliation');
    });

    it('should record all reconciliation items', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_test_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 10000 },
      });

      const result = await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'admin-001',
      });

      const items = await prisma.reconciliationItem.findMany({
        where: { runId: result.runId },
      });

      expect(items.length).toBe(result.totalChecked);
      expect(items[0].escrowId).toBe(testEscrow.id);
    });

    it('should calculate correct summary metrics', async () => {
      // Create multiple escrows with different states
      const escrow2 = await prisma.escrow.create({
        data: {
          buyerWalletId: testWalletBuyer.id,
          sellerWalletId: testWalletSeller.id,
          amount: 5000n,
          currency: 'EGP',
          status: EscrowStatus.FUNDED,
          referenceType: 'ORDER',
          referenceId: 'order-456',
          fundedAt: new Date(),
          createdBy: 'system',
        },
      });

      await prisma.paymentEvent.create({
        data: {
          gateway: 'stripe',
          eventId: 'pi_test_456',
          eventType: 'payment_intent.succeeded',
          payload: {
            metadata: { escrowId: escrow2.id },
            amount: 5000,
          },
          processed: true,
        },
      });

      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails
        .mockResolvedValueOnce({
          gatewayId: 'pi_test_123',
          status: PaymentStatus.COMPLETED,
          rawResponse: { amount: 10000 }, // Match
        })
        .mockResolvedValueOnce({
          gatewayId: 'pi_test_456',
          status: PaymentStatus.COMPLETED,
          rawResponse: { amount: 6000 }, // Overpaid
        });

      const result = await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'admin-001',
      });

      expect(result.totalChecked).toBe(2);
      expect(result.matchCount).toBe(1);
      expect(result.mismatchCount).toBe(1);
      expect(result.errorCount).toBe(0);
    });
  });

  // ============================================================
  // ADMIN OPERATIONS TESTS
  // ============================================================

  describe('Admin Operations', () => {
    it('should retrieve flagged items for manual review', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_test_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 15000 }, // Overpaid - will be flagged
      });

      await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'admin-001',
      });

      const flaggedItems = await reconciliationService.getFlaggedItems();
      
      expect(flaggedItems.length).toBeGreaterThan(0);
      expect(flaggedItems[0].resolution).toBe(ReconciliationResolution.FLAGGED);
    });

    it('should allow marking items as manually resolved', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_test_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 10000 },
      });

      const result = await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'admin-001',
      });

      const itemId = result.items[0].itemId;

      await reconciliationService.markAsResolved(
        itemId,
        'admin-002',
        'Verified with customer support'
      );

      const item = await prisma.reconciliationItem.findUnique({
        where: { id: itemId },
      });

      expect(item?.resolution).toBe(ReconciliationResolution.MANUAL_ACTION);
      expect(item?.resolvedBy).toBe('admin-002');
      expect(item?.notes).toBe('Verified with customer support');
      expect(item?.resolvedAt).toBeDefined();
    });

    it('should allow marking items as ignored', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_test_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 10000 },
      });

      const result = await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'admin-001',
      });

      const itemId = result.items[0].itemId;

      await reconciliationService.markAsIgnored(
        itemId,
        'admin-002',
        'Acceptable rounding difference'
      );

      const item = await prisma.reconciliationItem.findUnique({
        where: { id: itemId },
      });

      expect(item?.resolution).toBe(ReconciliationResolution.IGNORED);
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe('Edge Cases', () => {
    it('should handle escrows with no payment events gracefully', async () => {
      // Create escrow without payment event
      const orphanEscrow = await prisma.escrow.create({
        data: {
          buyerWalletId: testWalletBuyer.id,
          sellerWalletId: testWalletSeller.id,
          amount: 20000n,
          currency: 'EGP',
          status: EscrowStatus.FUNDED,
          referenceType: 'ORDER',
          referenceId: 'order-orphan',
          fundedAt: new Date(),
          createdBy: 'system',
        },
      });

      const result = await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'admin-001',
      });

      const orphanItem = result.items.find(i => i.escrowId === orphanEscrow.id);
      expect(orphanItem?.status).toBe(ReconciliationItemStatus.MISSING);
    });

    it('should handle gateway API failures gracefully', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockRejectedValue(new Error('Network error'));

      const result = await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'admin-001',
      });

      expect(result.errorCount).toBeGreaterThan(0);
      expect(result.status).toBe('PARTIAL'); // Some errors but not total failure
    });

    it('should only reconcile FUNDED escrows by default', async () => {
      // Create escrow in different state
      await prisma.escrow.create({
        data: {
          buyerWalletId: testWalletBuyer.id,
          sellerWalletId: testWalletSeller.id,
          amount: 30000n,
          currency: 'EGP',
          status: EscrowStatus.RELEASED, // Not FUNDED
          referenceType: 'ORDER',
          referenceId: 'order-released',
          fundedAt: new Date(),
          releasedAt: new Date(),
          createdBy: 'system',
        },
      });

      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_test_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 10000 },
      });

      const result = await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'admin-001',
      });

      // Should only check FUNDED escrow, not RELEASED
      const releasedEscrowChecked = result.items.some(
        i => i.escrowId !== testEscrow.id
      );
      expect(releasedEscrowChecked).toBe(false);
    });
  });
});
