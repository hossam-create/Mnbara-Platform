// ============================================================
// PHASE 4.5 — PAYOUT SAFETY TESTS
// Critical tests to ensure payouts NEVER violate absolute rules
// ============================================================

import { PrismaClient, PayoutStatus, PayoutReason, PayoutDestinationType } from '@prisma/client';
import { payoutService } from '../services/payout.service';
import { MockBankAdapter } from '../adapters/bank-adapter.mock';
import { BankPayoutStatus } from '../interfaces/bank-adapter.interface';
import { ledgerService } from '../services/ledger.service';
import { escrowService } from '../services/escrow.service';

const prisma = new PrismaClient();

describe('Phase 4.5 — Payout Safety Tests', () => {
  let testWalletSeller: any;
  let testWalletBuyer: any;
  let testWalletSystem: any;
  let testEscrow: any;
  let mockBank: MockBankAdapter;

  beforeAll(async () => {
    // Create test wallets
    testWalletSeller = await prisma.wallet.create({
      data: {
        ownerType: 'SELLER',
        ownerId: 'seller-payout-001',
        currency: 'EGP',
        status: 'ACTIVE',
      },
    });

    testWalletBuyer = await prisma.wallet.create({
      data: {
        ownerType: 'USER',
        ownerId: 'buyer-payout-001',
        currency: 'EGP',
        status: 'ACTIVE',
      },
    });

    testWalletSystem = await prisma.wallet.create({
      data: {
        ownerType: 'SYSTEM',
        ownerId: 'system-payout',
        currency: 'EGP',
        status: 'ACTIVE',
      },
    });
  });

  afterAll(async () => {
    await prisma.payoutCommandLog.deleteMany({});
    await prisma.payoutInstruction.deleteMany({});
    await prisma.escrow.deleteMany({});
    await prisma.ledgerEntry.deleteMany({});
    await prisma.wallet.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    mockBank = new MockBankAdapter({ successRate: 1.0, processingDelayMs: 100 });

    // Create and fund escrow
    testEscrow = await prisma.escrow.create({
      data: {
        buyerWalletId: testWalletBuyer.id,
        sellerWalletId: testWalletSeller.id,
        amount: 10000n,
        currency: 'EGP',
        status: 'CREATED',
        referenceType: 'ORDER',
        referenceId: 'order-payout-123',
        createdBy: 'system',
      },
    });

    // Fund escrow (creates ledger entries)
    await escrowService.fundEscrow({
      escrowId: testEscrow.id,
      buyerWalletId: testWalletBuyer.id,
      systemWalletId: testWalletSystem.id,
      amount: 10000n,
      triggeredBy: 'system',
      requestId: 'fund-payout-test',
    });

    // Release escrow to seller
    await escrowService.releaseEscrow({
      escrowId: testEscrow.id,
      systemWalletId: testWalletSystem.id,
      triggeredBy: 'system',
      requestId: 'release-payout-test',
    });
  });

  afterEach(async () => {
    await prisma.payoutCommandLog.deleteMany({});
    await prisma.payoutInstruction.deleteMany({});
    await prisma.escrow.deleteMany({});
    await prisma.ledgerEntry.deleteMany({});
  });

  // ============================================================
  // CRITICAL SAFETY RULE #1: NO PAYOUT WITHOUT RELEASED ESCROW
  // ============================================================

  describe('CRITICAL: Cannot Payout Unreleased Escrow', () => {
    it('should REJECT payout if escrow not released', async () => {
      // Create unreleased escrow
      const unreleasedEscrow = await prisma.escrow.create({
        data: {
          buyerWalletId: testWalletBuyer.id,
          sellerWalletId: testWalletSeller.id,
          amount: 5000n,
          currency: 'EGP',
          status: 'FUNDED', // NOT RELEASED
          referenceType: 'ORDER',
          referenceId: 'order-unreleased',
          createdBy: 'system',
        },
      });

      await expect(
        payoutService.createPayout(
          {
            walletId: testWalletSeller.id,
            amount: 5000n,
            currency: 'EGP',
            destinationType: PayoutDestinationType.BANK_ACCOUNT,
            destinationRef: 'EG123456789012345678901',
            destinationDetails: { accountHolder: 'Test Seller' },
            reason: PayoutReason.SELLER_PAYOUT,
            escrowReleaseId: unreleasedEscrow.id, // FUNDED, not RELEASED
            createdBy: 'admin-001',
          },
          mockBank
        )
      ).rejects.toThrow('Escrow not found or not released');
    });

    it('should REJECT payout if escrow does not exist', async () => {
      await expect(
        payoutService.createPayout(
          {
            walletId: testWalletSeller.id,
            amount: 5000n,
            currency: 'EGP',
            destinationType: PayoutDestinationType.BANK_ACCOUNT,
            destinationRef: 'EG123456789012345678901',
            destinationDetails: { accountHolder: 'Test Seller' },
            reason: PayoutReason.SELLER_PAYOUT,
            escrowReleaseId: 'non-existent-escrow',
            createdBy: 'admin-001',
          },
          mockBank
        )
      ).rejects.toThrow('Escrow not found or not released');
    });

    it('should ALLOW payout only after escrow is released', async () => {
      const payout = await payoutService.createPayout(
        {
          walletId: testWalletSeller.id,
          amount: 10000n,
          currency: 'EGP',
          destinationType: PayoutDestinationType.BANK_ACCOUNT,
          destinationRef: 'EG123456789012345678901',
          destinationDetails: { accountHolder: 'Test Seller' },
          reason: PayoutReason.SELLER_PAYOUT,
          escrowReleaseId: testEscrow.id, // RELEASED
          createdBy: 'admin-001',
        },
        mockBank
      );

      expect(payout).toBeDefined();
      expect(payout.escrowReleaseId).toBe(testEscrow.id);
    });
  });

  // ============================================================
  // CRITICAL SAFETY RULE #2: NO LEDGER ENTRY BEFORE CONFIRMATION
  // ============================================================

  describe('CRITICAL: No Ledger Entry Before Bank Confirmation', () => {
    it('should NOT create ledger entry on payout creation', async () => {
      const initialLedgerCount = await prisma.ledgerEntry.count();

      await payoutService.createPayout(
        {
          walletId: testWalletSeller.id,
          amount: 10000n,
          currency: 'EGP',
          destinationType: PayoutDestinationType.BANK_ACCOUNT,
          destinationRef: 'EG123456789012345678901',
          destinationDetails: { accountHolder: 'Test Seller' },
          reason: PayoutReason.SELLER_PAYOUT,
          escrowReleaseId: testEscrow.id,
          createdBy: 'admin-001',
        },
        mockBank
      );

      const finalLedgerCount = await prisma.ledgerEntry.count();
      
      // Ledger count should NOT increase on creation
      expect(finalLedgerCount).toBe(initialLedgerCount);
    });

    it('should NOT create ledger entry on approval', async () => {
      const payout = await payoutService.createPayout(
        {
          walletId: testWalletSeller.id,
          amount: 10000n,
          currency: 'EGP',
          destinationType: PayoutDestinationType.BANK_ACCOUNT,
          destinationRef: 'EG123456789012345678901',
          destinationDetails: { accountHolder: 'Test Seller' },
          reason: PayoutReason.SELLER_PAYOUT,
          escrowReleaseId: testEscrow.id,
          createdBy: 'admin-001',
        },
        mockBank
      );

      const initialLedgerCount = await prisma.ledgerEntry.count();

      await payoutService.approvePayout(
        {
          payoutId: payout.id,
          approvedBy: 'admin-002', // Different admin
        },
        mockBank
      );

      const finalLedgerCount = await prisma.ledgerEntry.count();
      
      // Ledger count should NOT increase on approval
      expect(finalLedgerCount).toBe(initialLedgerCount);
    });

    it('should NOT create ledger entry when sent to bank', async () => {
      const payout = await payoutService.createPayout(
        {
          walletId: testWalletSeller.id,
          amount: 10000n,
          currency: 'EGP',
          destinationType: PayoutDestinationType.BANK_ACCOUNT,
          destinationRef: 'EG123456789012345678901',
          destinationDetails: { accountHolder: 'Test Seller' },
          reason: PayoutReason.SELLER_PAYOUT,
          escrowReleaseId: testEscrow.id,
          createdBy: 'admin-001',
        },
        mockBank
      );

      await payoutService.approvePayout(
        {
          payoutId: payout.id,
          approvedBy: 'admin-002',
        },
        mockBank
      );

      const initialLedgerCount = await prisma.ledgerEntry.count();

      const updatedPayout = await prisma.payoutInstruction.findUnique({
        where: { id: payout.id },
      });

      expect(updatedPayout?.status).toBe(PayoutStatus.SENT);

      const finalLedgerCount = await prisma.ledgerEntry.count();
      
      // Ledger count should NOT increase when sent to bank
      expect(finalLedgerCount).toBe(initialLedgerCount);
    });

    it('should ONLY create ledger entry on bank confirmation', async () => {
      const payout = await payoutService.createPayout(
        {
          walletId: testWalletSeller.id,
          amount: 10000n,
          currency: 'EGP',
          destinationType: PayoutDestinationType.BANK_ACCOUNT,
          destinationRef: 'EG123456789012345678901',
          destinationDetails: { accountHolder: 'Test Seller' },
          reason: PayoutReason.SELLER_PAYOUT,
          escrowReleaseId: testEscrow.id,
          createdBy: 'admin-001',
        },
        mockBank
      );

      await payoutService.approvePayout(
        {
          payoutId: payout.id,
          approvedBy: 'admin-002',
        },
        mockBank
      );

      const initialLedgerCount = await prisma.ledgerEntry.count();

      // Force bank to complete
      const updatedPayout = await prisma.payoutInstruction.findUnique({
        where: { id: payout.id },
      });
      mockBank.forceComplete(updatedPayout!.bankReference!);

      // Check status and confirm
      await payoutService.checkBankStatusAndConfirm(payout.id, mockBank);

      const finalLedgerCount = await prisma.ledgerEntry.count();
      
      // Ledger count SHOULD increase by 1 on confirmation
      expect(finalLedgerCount).toBe(initialLedgerCount + 1);

      // Verify ledger entry details
      const ledgerEntry = await prisma.ledgerEntry.findFirst({
        where: {
          referenceType: 'PAYOUT',
          referenceId: payout.id,
        },
      });

      expect(ledgerEntry).toBeDefined();
      expect(ledgerEntry?.entryType).toBe('DEBIT');
      expect(ledgerEntry?.amount).toEqual(10000n);
      expect(ledgerEntry?.reason).toBe('PAYOUT_EXECUTED');
    });
  });

  // ============================================================
  // CRITICAL SAFETY RULE #3: DUAL APPROVAL ENFORCEMENT
  // ============================================================

  describe('CRITICAL: Dual Approval Required', () => {
    it('should REJECT self-approval', async () => {
      const payout = await payoutService.createPayout(
        {
          walletId: testWalletSeller.id,
          amount: 10000n,
          currency: 'EGP',
          destinationType: PayoutDestinationType.BANK_ACCOUNT,
          destinationRef: 'EG123456789012345678901',
          destinationDetails: { accountHolder: 'Test Seller' },
          reason: PayoutReason.SELLER_PAYOUT,
          escrowReleaseId: testEscrow.id,
          createdBy: 'admin-001',
        },
        mockBank
      );

      await expect(
        payoutService.approvePayout(
          {
            payoutId: payout.id,
            approvedBy: 'admin-001', // SAME as creator
          },
          mockBank
        )
      ).rejects.toThrow('Cannot approve your own payout');
    });

    it('should REQUIRE different admin for approval', async () => {
      const payout = await payoutService.createPayout(
        {
          walletId: testWalletSeller.id,
          amount: 10000n,
          currency: 'EGP',
          destinationType: PayoutDestinationType.BANK_ACCOUNT,
          destinationRef: 'EG123456789012345678901',
          destinationDetails: { accountHolder: 'Test Seller' },
          reason: PayoutReason.SELLER_PAYOUT,
          escrowReleaseId: testEscrow.id,
          createdBy: 'admin-001',
        },
        mockBank
      );

      const approved = await payoutService.approvePayout(
        {
          payoutId: payout.id,
          approvedBy: 'admin-002', // DIFFERENT admin
        },
        mockBank
      );

      expect(approved.approvedBy).toBe('admin-002');
      expect(approved.createdBy).toBe('admin-001');
      expect(approved.approvedBy).not.toBe(approved.createdBy);
    });

    it('should track both creator and approver in audit log', async () => {
      const payout = await payoutService.createPayout(
        {
          walletId: testWalletSeller.id,
          amount: 10000n,
          currency: 'EGP',
          destinationType: PayoutDestinationType.BANK_ACCOUNT,
          destinationRef: 'EG123456789012345678901',
          destinationDetails: { accountHolder: 'Test Seller' },
          reason: PayoutReason.SELLER_PAYOUT,
          escrowReleaseId: testEscrow.id,
          createdBy: 'admin-001',
        },
        mockBank
      );

      await payoutService.approvePayout(
        {
          payoutId: payout.id,
          approvedBy: 'admin-002',
        },
        mockBank
      );

      const log = await payoutService.getCommandLog(payout.id);

      const createdEvent = log.find(e => e.eventType === 'PAYOUT_CREATED');
      const approvedEvent = log.find(e => e.eventType === 'PAYOUT_APPROVED');

      expect(createdEvent?.actor).toBe('admin-001');
      expect(approvedEvent?.actor).toBe('admin-002');
    });
  });

  // ============================================================
  // CRITICAL SAFETY RULE #4: IDEMPOTENT EXECUTION
  // ============================================================

  describe('CRITICAL: Idempotent Execution', () => {
    it('should NOT double-debit on retry', async () => {
      const payout = await payoutService.createPayout(
        {
          walletId: testWalletSeller.id,
          amount: 10000n,
          currency: 'EGP',
          destinationType: PayoutDestinationType.BANK_ACCOUNT,
          destinationRef: 'EG123456789012345678901',
          destinationDetails: { accountHolder: 'Test Seller' },
          reason: PayoutReason.SELLER_PAYOUT,
          escrowReleaseId: testEscrow.id,
          createdBy: 'admin-001',
        },
        mockBank
      );

      await payoutService.approvePayout(
        {
          payoutId: payout.id,
          approvedBy: 'admin-002',
        },
        mockBank
      );

      const updatedPayout = await prisma.payoutInstruction.findUnique({
        where: { id: payout.id },
      });
      mockBank.forceComplete(updatedPayout!.bankReference!);

      // Confirm once
      await payoutService.checkBankStatusAndConfirm(payout.id, mockBank);

      const ledgerCountAfterFirst = await prisma.ledgerEntry.count();

      // Try to confirm again (retry scenario)
      await payoutService.checkBankStatusAndConfirm(payout.id, mockBank);

      const ledgerCountAfterRetry = await prisma.ledgerEntry.count();

      // Ledger count should NOT increase on retry
      expect(ledgerCountAfterRetry).toBe(ledgerCountAfterFirst);
    });

    it('should use idempotency key for ledger entry', async () => {
      const payout = await payoutService.createPayout(
        {
          walletId: testWalletSeller.id,
          amount: 10000n,
          currency: 'EGP',
          destinationType: PayoutDestinationType.BANK_ACCOUNT,
          destinationRef: 'EG123456789012345678901',
          destinationDetails: { accountHolder: 'Test Seller' },
          reason: PayoutReason.SELLER_PAYOUT,
          escrowReleaseId: testEscrow.id,
          createdBy: 'admin-001',
        },
        mockBank
      );

      await payoutService.approvePayout(
        {
          payoutId: payout.id,
          approvedBy: 'admin-002',
        },
        mockBank
      );

      const updatedPayout = await prisma.payoutInstruction.findUnique({
        where: { id: payout.id },
      });
      mockBank.forceComplete(updatedPayout!.bankReference!);

      await payoutService.checkBankStatusAndConfirm(payout.id, mockBank);

      const ledgerEntry = await prisma.ledgerEntry.findFirst({
        where: {
          referenceType: 'PAYOUT',
          referenceId: payout.id,
        },
      });

      expect(ledgerEntry?.idempotencyKey).toBe(`payout_${payout.id}`);
    });
  });

  // ============================================================
  // AUDIT TRAIL
  // ============================================================

  describe('Audit Trail', () => {
    it('should log every step in command log', async () => {
      const payout = await payoutService.createPayout(
        {
          walletId: testWalletSeller.id,
          amount: 10000n,
          currency: 'EGP',
          destinationType: PayoutDestinationType.BANK_ACCOUNT,
          destinationRef: 'EG123456789012345678901',
          destinationDetails: { accountHolder: 'Test Seller' },
          reason: PayoutReason.SELLER_PAYOUT,
          escrowReleaseId: testEscrow.id,
          createdBy: 'admin-001',
        },
        mockBank
      );

      await payoutService.approvePayout(
        {
          payoutId: payout.id,
          approvedBy: 'admin-002',
        },
        mockBank
      );

      const updatedPayout = await prisma.payoutInstruction.findUnique({
        where: { id: payout.id },
      });
      mockBank.forceComplete(updatedPayout!.bankReference!);

      await payoutService.checkBankStatusAndConfirm(payout.id, mockBank);

      const log = await payoutService.getCommandLog(payout.id);

      // Verify all events logged
      const eventTypes = log.map(e => e.eventType);
      expect(eventTypes).toContain('PAYOUT_CREATED');
      expect(eventTypes).toContain('PAYOUT_APPROVED');
      expect(eventTypes).toContain('PAYOUT_SENT_TO_BANK');
      expect(eventTypes).toContain('PAYOUT_CONFIRMED');
      expect(eventTypes).toContain('LEDGER_DEBITED');
    });
  });

  // ============================================================
  // FAILURE HANDLING
  // ============================================================

  describe('Failure Handling', () => {
    it('should NOT create ledger entry if bank fails', async () => {
      const payout = await payoutService.createPayout(
        {
          walletId: testWalletSeller.id,
          amount: 10000n,
          currency: 'EGP',
          destinationType: PayoutDestinationType.BANK_ACCOUNT,
          destinationRef: 'EG123456789012345678901',
          destinationDetails: { accountHolder: 'Test Seller' },
          reason: PayoutReason.SELLER_PAYOUT,
          escrowReleaseId: testEscrow.id,
          createdBy: 'admin-001',
        },
        mockBank
      );

      await payoutService.approvePayout(
        {
          payoutId: payout.id,
          approvedBy: 'admin-002',
        },
        mockBank
      );

      const initialLedgerCount = await prisma.ledgerEntry.count();

      const updatedPayout = await prisma.payoutInstruction.findUnique({
        where: { id: payout.id },
      });
      mockBank.forceFail(updatedPayout!.bankReference!, 'Insufficient funds');

      await payoutService.checkBankStatusAndConfirm(payout.id, mockBank);

      const finalLedgerCount = await prisma.ledgerEntry.count();

      // Ledger count should NOT increase on failure
      expect(finalLedgerCount).toBe(initialLedgerCount);

      const failedPayout = await prisma.payoutInstruction.findUnique({
        where: { id: payout.id },
      });

      expect(failedPayout?.status).toBe(PayoutStatus.FAILED);
      expect(failedPayout?.failureReason).toContain('Insufficient funds');
    });
  });
});
