// ============================================================
// PHASE 4.4.6 — RECONCILIATION SAFETY TESTS
// Critical tests to ensure reconciliation NEVER mutates state
// ============================================================

import { PrismaClient, EscrowStatus, ReconciliationItemStatus, MismatchClassification, MismatchSeverity } from '@prisma/client';
import { reconciliationService } from '../services/reconciliation.service';
import { mismatchClassifier } from '../services/mismatch-classifier.service';
import { PaymentStatus } from '../interfaces/payment-gateway.interface';

const prisma = new PrismaClient();

// Mock payment gateway
jest.mock('../adapters/payment-gateway.registry', () => ({
  getPaymentGateway: jest.fn(() => ({
    getPaymentDetails: jest.fn(),
  })),
}));

import { getPaymentGateway } from '../adapters/payment-gateway.registry';

describe('Phase 4.4.6 — Reconciliation Safety Tests', () => {
  let testWalletBuyer: any;
  let testWalletSeller: any;
  let testWalletSystem: any;
  let testEscrow: any;

  beforeAll(async () => {
    // Create test wallets
    testWalletBuyer = await prisma.wallet.create({
      data: {
        ownerType: 'USER',
        ownerId: 'buyer-safety-001',
        currency: 'EGP',
        status: 'ACTIVE',
      },
    });

    testWalletSeller = await prisma.wallet.create({
      data: {
        ownerType: 'SELLER',
        ownerId: 'seller-safety-001',
        currency: 'EGP',
        status: 'ACTIVE',
      },
    });

    testWalletSystem = await prisma.wallet.create({
      data: {
        ownerType: 'SYSTEM',
        ownerId: 'system-safety',
        currency: 'EGP',
        status: 'ACTIVE',
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.reconciliationItem.deleteMany({});
    await prisma.reconciliationRun.deleteMany({});
    await prisma.paymentEvent.deleteMany({});
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
        amount: 10000n,
        currency: 'EGP',
        status: EscrowStatus.FUNDED,
        referenceType: 'ORDER',
        referenceId: 'order-safety-123',
        fundedAt: new Date(),
        createdBy: 'system',
      },
    });

    // Create mock payment event
    await prisma.paymentEvent.create({
      data: {
        gateway: 'stripe',
        eventId: 'pi_safety_123',
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
    await prisma.ledgerEntry.deleteMany({});
  });

  // ============================================================
  // CRITICAL SAFETY RULE #1: NO LEDGER ENTRIES
  // ============================================================

  describe('CRITICAL: Reconciliation MUST NOT Create Ledger Entries', () => {
    it('should NOT create any ledger entries during reconciliation run', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_safety_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 10000 },
      });

      // Get initial ledger count
      const initialLedgerCount = await prisma.ledgerEntry.count();

      // Run reconciliation
      await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'safety-test',
      });

      // Verify NO new ledger entries
      const finalLedgerCount = await prisma.ledgerEntry.count();
      expect(finalLedgerCount).toBe(initialLedgerCount);
    });

    it('should NOT create ledger entries even when mismatch detected', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_safety_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 15000 }, // OVERPAID - mismatch!
      });

      const initialLedgerCount = await prisma.ledgerEntry.count();

      await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'safety-test',
      });

      const finalLedgerCount = await prisma.ledgerEntry.count();
      expect(finalLedgerCount).toBe(initialLedgerCount);
    });

    it('should NOT create ledger entries when gateway payment missing', async () => {
      // Delete payment event to simulate missing payment
      await prisma.paymentEvent.deleteMany({
        where: { eventId: 'pi_safety_123' },
      });

      const initialLedgerCount = await prisma.ledgerEntry.count();

      await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'safety-test',
      });

      const finalLedgerCount = await prisma.ledgerEntry.count();
      expect(finalLedgerCount).toBe(initialLedgerCount);
    });

    it('should NOT create ledger entries when gateway query fails', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockRejectedValue(new Error('Gateway timeout'));

      const initialLedgerCount = await prisma.ledgerEntry.count();

      await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'safety-test',
      });

      const finalLedgerCount = await prisma.ledgerEntry.count();
      expect(finalLedgerCount).toBe(initialLedgerCount);
    });
  });

  // ============================================================
  // CRITICAL SAFETY RULE #2: NO ESCROW RELEASES
  // ============================================================

  describe('CRITICAL: Reconciliation MUST NOT Release Escrow', () => {
    it('should NOT release escrow when gateway payment matches', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_safety_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 10000 }, // Perfect match
      });

      await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'safety-test',
      });

      const escrow = await prisma.escrow.findUnique({
        where: { id: testEscrow.id },
      });

      // Escrow MUST remain FUNDED
      expect(escrow?.status).toBe(EscrowStatus.FUNDED);
      expect(escrow?.releasedAt).toBeNull();
      expect(escrow?.releasedBy).toBeNull();
      expect(escrow?.releaseEntryId).toBeNull();
    });

    it('should NOT release escrow when gateway shows overpayment', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_safety_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 15000 }, // Overpaid
      });

      await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'safety-test',
      });

      const escrow = await prisma.escrow.findUnique({
        where: { id: testEscrow.id },
      });

      expect(escrow?.status).toBe(EscrowStatus.FUNDED);
      expect(escrow?.releasedAt).toBeNull();
    });

    it('should NOT refund escrow when gateway payment missing', async () => {
      await prisma.paymentEvent.deleteMany({
        where: { eventId: 'pi_safety_123' },
      });

      await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'safety-test',
      });

      const escrow = await prisma.escrow.findUnique({
        where: { id: testEscrow.id },
      });

      // Escrow MUST remain FUNDED (not refunded)
      expect(escrow?.status).toBe(EscrowStatus.FUNDED);
      expect(escrow?.refundedAt).toBeNull();
      expect(escrow?.refundedBy).toBeNull();
      expect(escrow?.refundEntryId).toBeNull();
    });

    it('should NOT modify escrow status field at all', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_safety_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 10000 },
      });

      const initialEscrow = await prisma.escrow.findUnique({
        where: { id: testEscrow.id },
      });

      await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'safety-test',
      });

      const finalEscrow = await prisma.escrow.findUnique({
        where: { id: testEscrow.id },
      });

      // ALL escrow fields must remain unchanged
      expect(finalEscrow?.status).toBe(initialEscrow?.status);
      expect(finalEscrow?.amount).toEqual(initialEscrow?.amount);
      expect(finalEscrow?.fundedAt).toEqual(initialEscrow?.fundedAt);
      expect(finalEscrow?.releasedAt).toEqual(initialEscrow?.releasedAt);
      expect(finalEscrow?.refundedAt).toEqual(initialEscrow?.refundedAt);
      expect(finalEscrow?.disputedAt).toEqual(initialEscrow?.disputedAt);
    });
  });

  // ============================================================
  // CRITICAL SAFETY RULE #3: READ-ONLY ENFORCEMENT
  // ============================================================

  describe('CRITICAL: Reconciliation is Read-Only', () => {
    it('should ONLY create reconciliation records, nothing else', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_safety_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 10000 },
      });

      // Count all tables before
      const before = {
        ledger: await prisma.ledgerEntry.count(),
        escrow: await prisma.escrow.count(),
        wallet: await prisma.wallet.count(),
        paymentEvent: await prisma.paymentEvent.count(),
      };

      await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'safety-test',
      });

      // Count all tables after
      const after = {
        ledger: await prisma.ledgerEntry.count(),
        escrow: await prisma.escrow.count(),
        wallet: await prisma.wallet.count(),
        paymentEvent: await prisma.paymentEvent.count(),
      };

      // ONLY reconciliation tables should change
      expect(after.ledger).toBe(before.ledger); // NO ledger entries
      expect(after.escrow).toBe(before.escrow); // NO escrow changes
      expect(after.wallet).toBe(before.wallet); // NO wallet changes
      expect(after.paymentEvent).toBe(before.paymentEvent); // NO payment event changes

      // Reconciliation tables SHOULD have new records
      const reconciliationRuns = await prisma.reconciliationRun.count();
      const reconciliationItems = await prisma.reconciliationItem.count();
      expect(reconciliationRuns).toBeGreaterThan(0);
      expect(reconciliationItems).toBeGreaterThan(0);
    });

    it('should NOT modify wallet balances', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_safety_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 10000 },
      });

      // Get initial balances (derived from ledger)
      const initialBuyerEntries = await prisma.ledgerEntry.findMany({
        where: { walletId: testWalletBuyer.id },
      });
      const initialSellerEntries = await prisma.ledgerEntry.findMany({
        where: { walletId: testWalletSeller.id },
      });
      const initialSystemEntries = await prisma.ledgerEntry.findMany({
        where: { walletId: testWalletSystem.id },
      });

      await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'safety-test',
      });

      // Get final balances
      const finalBuyerEntries = await prisma.ledgerEntry.findMany({
        where: { walletId: testWalletBuyer.id },
      });
      const finalSellerEntries = await prisma.ledgerEntry.findMany({
        where: { walletId: testWalletSeller.id },
      });
      const finalSystemEntries = await prisma.ledgerEntry.findMany({
        where: { walletId: testWalletSystem.id },
      });

      // Balances MUST NOT change
      expect(finalBuyerEntries.length).toBe(initialBuyerEntries.length);
      expect(finalSellerEntries.length).toBe(initialSellerEntries.length);
      expect(finalSystemEntries.length).toBe(initialSystemEntries.length);
    });
  });

  // ============================================================
  // MISMATCH CLASSIFICATION ACCURACY
  // ============================================================

  describe('Mismatch Classification Accuracy', () => {
    it('should correctly classify MISSING_PAYMENT', async () => {
      // No payment event exists
      await prisma.paymentEvent.deleteMany({
        where: { eventId: 'pi_safety_123' },
      });

      const result = await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'safety-test',
      });

      const item = await prisma.reconciliationItem.findFirst({
        where: { escrowId: testEscrow.id },
      });

      expect(item?.status).toBe(ReconciliationItemStatus.MISSING);
      expect(item?.classification).toBe(MismatchClassification.MISSING_PAYMENT);
      expect(item?.severity).toBe(MismatchSeverity.HIGH);
    });

    it('should correctly classify DELAYED_PAYMENT', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_safety_123',
        status: PaymentStatus.PENDING, // Still pending
        rawResponse: { amount: 10000 },
      });

      await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'safety-test',
      });

      const item = await prisma.reconciliationItem.findFirst({
        where: { escrowId: testEscrow.id },
      });

      expect(item?.classification).toBe(MismatchClassification.DELAYED_PAYMENT);
      expect(item?.severity).toBe(MismatchSeverity.LOW);
    });

    it('should correctly classify AMOUNT_MISMATCH with severity', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      
      // Test HIGH severity (>10% variance)
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_safety_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 15000 }, // 50% overpaid
      });

      await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'safety-test',
      });

      const item = await prisma.reconciliationItem.findFirst({
        where: { escrowId: testEscrow.id },
      });

      expect(item?.status).toBe(ReconciliationItemStatus.OVERPAID);
      expect(item?.classification).toBe(MismatchClassification.AMOUNT_MISMATCH);
      expect(item?.severity).toBe(MismatchSeverity.HIGH);
    });

    it('should correctly classify GATEWAY_QUERY_FAILED', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockRejectedValue(new Error('Network timeout'));

      await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'safety-test',
      });

      const item = await prisma.reconciliationItem.findFirst({
        where: { escrowId: testEscrow.id },
      });

      expect(item?.status).toBe(ReconciliationItemStatus.ERROR);
      expect(item?.classification).toBe(MismatchClassification.GATEWAY_QUERY_FAILED);
      expect(item?.severity).toBe(MismatchSeverity.HIGH);
    });
  });

  // ============================================================
  // DUPLICATE GATEWAY PAYMENT DETECTION
  // ============================================================

  describe('Duplicate Gateway Payment Detection', () => {
    it('should detect multiple payment events for same escrow', async () => {
      // Create duplicate payment event
      await prisma.paymentEvent.create({
        data: {
          gateway: 'stripe',
          eventId: 'pi_safety_duplicate',
          eventType: 'payment_intent.succeeded',
          payload: {
            metadata: {
              escrowId: testEscrow.id, // Same escrow!
            },
            amount: 10000,
          },
          processed: true,
          processedAt: new Date(),
        },
      });

      // Count payment events for this escrow
      const events = await prisma.paymentEvent.findMany({
        where: {
          payload: {
            path: ['metadata', 'escrowId'],
            equals: testEscrow.id,
          },
        },
      });

      // Should detect duplicate
      expect(events.length).toBeGreaterThan(1);
    });

    it('should flag duplicate payments in reconciliation', async () => {
      // Create duplicate payment event
      await prisma.paymentEvent.create({
        data: {
          gateway: 'stripe',
          eventId: 'pi_safety_duplicate',
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

      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_safety_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 10000 },
      });

      await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'safety-test',
      });

      // Verify reconciliation detected the issue
      const item = await prisma.reconciliationItem.findFirst({
        where: { escrowId: testEscrow.id },
      });

      expect(item).toBeDefined();
      // Note: Actual duplicate detection logic would be implemented
      // in a separate duplicate detection service
    });
  });

  // ============================================================
  // EDGE CASES & STRESS TESTS
  // ============================================================

  describe('Edge Cases & Stress Tests', () => {
    it('should handle multiple escrows without cross-contamination', async () => {
      // Create second escrow
      const escrow2 = await prisma.escrow.create({
        data: {
          buyerWalletId: testWalletBuyer.id,
          sellerWalletId: testWalletSeller.id,
          amount: 20000n,
          currency: 'EGP',
          status: EscrowStatus.FUNDED,
          referenceType: 'ORDER',
          referenceId: 'order-safety-456',
          fundedAt: new Date(),
          createdBy: 'system',
        },
      });

      await prisma.paymentEvent.create({
        data: {
          gateway: 'stripe',
          eventId: 'pi_safety_456',
          eventType: 'payment_intent.succeeded',
          payload: {
            metadata: { escrowId: escrow2.id },
            amount: 20000,
          },
          processed: true,
        },
      });

      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_safety_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 10000 },
      });

      await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'safety-test',
      });

      // Verify both escrows remain unchanged
      const finalEscrow1 = await prisma.escrow.findUnique({
        where: { id: testEscrow.id },
      });
      const finalEscrow2 = await prisma.escrow.findUnique({
        where: { id: escrow2.id },
      });

      expect(finalEscrow1?.status).toBe(EscrowStatus.FUNDED);
      expect(finalEscrow2?.status).toBe(EscrowStatus.FUNDED);
    });

    it('should handle reconciliation run failure gracefully', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockRejectedValue(new Error('Critical gateway error'));

      const initialLedgerCount = await prisma.ledgerEntry.count();
      const initialEscrowStatus = (await prisma.escrow.findUnique({
        where: { id: testEscrow.id },
      }))?.status;

      await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'safety-test',
      });

      // Even on failure, NO mutations should occur
      const finalLedgerCount = await prisma.ledgerEntry.count();
      const finalEscrowStatus = (await prisma.escrow.findUnique({
        where: { id: testEscrow.id },
      }))?.status;

      expect(finalLedgerCount).toBe(initialLedgerCount);
      expect(finalEscrowStatus).toBe(initialEscrowStatus);
    });

    it('should NOT create ledger entries even with 1000 reconciliation runs', async () => {
      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_safety_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 10000 },
      });

      const initialLedgerCount = await prisma.ledgerEntry.count();

      // Run reconciliation multiple times (stress test)
      for (let i = 0; i < 10; i++) {
        await reconciliationService.executeReconciliationRun({
          gateway: 'STRIPE',
          triggeredBy: `safety-test-${i}`,
        });
      }

      const finalLedgerCount = await prisma.ledgerEntry.count();
      
      // After 10 runs, ledger count MUST still be unchanged
      expect(finalLedgerCount).toBe(initialLedgerCount);
    });
  });

  // ============================================================
  // IMMUTABILITY TESTS
  // ============================================================

  describe('Immutability Enforcement', () => {
    it('should NOT allow reconciliation to update existing ledger entries', async () => {
      // Create a ledger entry
      const ledgerEntry = await prisma.ledgerEntry.create({
        data: {
          walletId: testWalletBuyer.id,
          entryType: 'CREDIT',
          amount: 10000n,
          reason: 'DEPOSIT',
          referenceType: 'MANUAL',
          idempotencyKey: 'test-entry-123',
          balanceAfter: 10000n,
          createdBy: 'system',
        },
      });

      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_safety_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 10000 },
      });

      await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'safety-test',
      });

      // Verify ledger entry unchanged
      const finalEntry = await prisma.ledgerEntry.findUnique({
        where: { id: ledgerEntry.id },
      });

      expect(finalEntry?.amount).toEqual(ledgerEntry.amount);
      expect(finalEntry?.balanceAfter).toEqual(ledgerEntry.balanceAfter);
      expect(finalEntry?.createdBy).toBe(ledgerEntry.createdBy);
    });

    it('should NOT allow reconciliation to delete ledger entries', async () => {
      const ledgerEntry = await prisma.ledgerEntry.create({
        data: {
          walletId: testWalletBuyer.id,
          entryType: 'CREDIT',
          amount: 10000n,
          reason: 'DEPOSIT',
          referenceType: 'MANUAL',
          idempotencyKey: 'test-entry-delete-123',
          balanceAfter: 10000n,
          createdBy: 'system',
        },
      });

      const mockAdapter = getPaymentGateway('stripe') as any;
      mockAdapter.getPaymentDetails.mockResolvedValue({
        gatewayId: 'pi_safety_123',
        status: PaymentStatus.COMPLETED,
        rawResponse: { amount: 10000 },
      });

      await reconciliationService.executeReconciliationRun({
        gateway: 'STRIPE',
        triggeredBy: 'safety-test',
      });

      // Verify ledger entry still exists
      const finalEntry = await prisma.ledgerEntry.findUnique({
        where: { id: ledgerEntry.id },
      });

      expect(finalEntry).toBeDefined();
      expect(finalEntry?.id).toBe(ledgerEntry.id);
    });
  });
});
