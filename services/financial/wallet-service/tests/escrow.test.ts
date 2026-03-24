import { PrismaClient, EscrowStatus } from '@prisma/client';
import { escrowService } from '../src/services/escrow.service';
import { LedgerReason, ReferenceType, OwnerType, WalletStatus } from '../src/types';

const prisma = new PrismaClient();

describe('Escrow Service Safety Tests', () => {
  let systemWallet: any;
  let buyerWallet: any;
  let sellerWallet: any;

  // Cleanup helper
  const clearData = async () => {
    await prisma.ledgerEntry.deleteMany();
    await prisma.escrow.deleteMany();
    await prisma.wallet.deleteMany();
  };

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await clearData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await clearData();

    // Setup Wallets
    systemWallet = await prisma.wallet.create({
      data: {
        id: 'system-escrow-wallet',
        ownerType: OwnerType.SYSTEM,
        ownerId: 'SYSTEM',
        currency: 'USD',
        status: WalletStatus.ACTIVE,
      },
    });

    buyerWallet = await prisma.wallet.create({
      data: {
        id: crypto.randomUUID(),
        ownerType: OwnerType.USER,
        ownerId: 'BUYER_01',
        currency: 'USD',
        status: WalletStatus.ACTIVE,
      },
    });

    sellerWallet = await prisma.wallet.create({
      data: {
        id: crypto.randomUUID(),
        ownerType: OwnerType.USER,
        ownerId: 'SELLER_01',
        currency: 'USD',
        status: WalletStatus.ACTIVE,
      },
    });

    // Fund Buyer Wallet (Initial Deposit)
    // We cheat and manipulate ledger directly or use service if available.
    // For test purity, we'll insert a genesis entry.
    await prisma.ledgerEntry.create({
      data: {
        id: crypto.randomUUID(),
        walletId: buyerWallet.id,
        entryType: 'CREDIT',
        amount: 1000n, // $10.00
        balanceAfter: 1000n,
        reason: LedgerReason.DEPOSIT,
        referenceType: ReferenceType.MANUAL,
        referenceId: 'genesis',
        idempotencyKey: 'genesis_buyer',
        createdBy: 'test_setup',
      },
    });
  });

  test('SAFETY: createAndFundEscrow reduces buyer balance and funds system wallet', async () => {
    const amount = 500n;

    const escrow = await escrowService.createAndFundEscrow({
      buyerWalletId: buyerWallet.id,
      sellerWalletId: sellerWallet.id,
      systemWalletId: systemWallet.id,
      amount,
      currency: 'USD',
      referenceType: 'ORDER',
      referenceId: 'ORD_001',
      description: 'Test purchase',
      triggeredBy: 'test',
      requestId: 'req_001',
    });

    // Assert Escrow State
    expect(escrow.status).toBe(EscrowStatus.FUNDED);
    expect(escrow.holdEntryId).toBeDefined();

    // Assert Balances
    const buyerLedger = await prisma.ledgerEntry.findFirst({
      where: { walletId: buyerWallet.id },
      orderBy: { createdAt: 'desc' },
    });
    // Started with 1000, debited 500 -> 500
    expect(buyerLedger?.balanceAfter).toBe(500n);

    const systemLedger = await prisma.ledgerEntry.findFirst({
      where: { walletId: systemWallet.id },
      orderBy: { createdAt: 'desc' },
    });
    // Started with 0, credited 500 -> 500
    expect(systemLedger?.balanceAfter).toBe(500n);
  });

  test('SAFETY: releaseEscrow credits seller and debits system', async () => {
    const amount = 500n;
    // 1. Setup funded escrow
    const escrow = await escrowService.createAndFundEscrow({
      buyerWalletId: buyerWallet.id,
      sellerWalletId: sellerWallet.id,
      systemWalletId: systemWallet.id,
      amount,
      currency: 'USD',
      referenceType: 'ORDER',
      referenceId: 'ORD_002',
      triggeredBy: 'test',
      requestId: 'req_002',
    });

    // 2. Release
    const releasedEscrow = await escrowService.releaseEscrow({
      escrowId: escrow.id,
      systemWalletId: systemWallet.id,
      triggeredBy: 'admin',
      requestId: 'req_003',
    });

    // Assert State
    expect(releasedEscrow.status).toBe(EscrowStatus.RELEASED);

    // Assert Balances
    // System: 500 -> 0
    const systemLedger = await prisma.ledgerEntry.findFirst({
      where: { walletId: systemWallet.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(systemLedger?.balanceAfter).toBe(0n);

    // Seller: 0 -> 500
    const sellerLedger = await prisma.ledgerEntry.findFirst({
      where: { walletId: sellerWallet.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(sellerLedger?.balanceAfter).toBe(500n);
  });

  test('SAFETY: refundEscrow returns funds to buyer', async () => {
    const amount = 300n;
    // 1. Setup funded escrow (Buyer has 1000 - 300 = 700)
    const escrow = await escrowService.createAndFundEscrow({
      buyerWalletId: buyerWallet.id,
      sellerWalletId: sellerWallet.id,
      systemWalletId: systemWallet.id,
      amount,
      currency: 'USD',
      referenceType: 'ORDER',
      referenceId: 'ORD_003',
      triggeredBy: 'test',
      requestId: 'req_004',
    });

    // 2. Refund
    const refundedEscrow = await escrowService.refundEscrow({
      escrowId: escrow.id,
      systemWalletId: systemWallet.id,
      reason: 'Out of stock',
      triggeredBy: 'admin',
      requestId: 'req_005',
    });

    // Assert State
    expect(refundedEscrow.status).toBe(EscrowStatus.REFUNDED);

    // Assert Balances
    // System: 300 -> 0
    const systemLedger = await prisma.ledgerEntry.findFirst({
      where: { walletId: systemWallet.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(systemLedger?.balanceAfter).toBe(0n);

    // Buyer: 700 + 300 -> 1000
    const buyerLedger = await prisma.ledgerEntry.findFirst({
      where: { walletId: buyerWallet.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(buyerLedger?.balanceAfter).toBe(1000n);
  });

  test('SAFETY: Invalid state transitions are blocked', async () => {
    // Escrow is RELEASED
    const escrow = await escrowService.createAndFundEscrow({
      buyerWalletId: buyerWallet.id,
      sellerWalletId: sellerWallet.id,
      systemWalletId: systemWallet.id,
      amount: 100n,
      currency: 'USD',
      referenceType: 'ORDER',
      referenceId: 'ORD_004',
      triggeredBy: 'test',
    });

    await escrowService.releaseEscrow({
      escrowId: escrow.id,
      systemWalletId: systemWallet.id,
      triggeredBy: 'admin',
    });

    // Attempt Refund on RELEASED escrow
    await expect(
      escrowService.refundEscrow({
        escrowId: escrow.id,
        systemWalletId: systemWallet.id,
        reason: 'Too late',
        triggeredBy: 'admin',
      })
    ).rejects.toThrow(/Invalid transition/); // "Cannot refund from RELEASED"
  });

  test('SAFETY: Idempotency prevents double money movement', async () => {
    const escrow = await escrowService.createAndFundEscrow({
      buyerWalletId: buyerWallet.id,
      sellerWalletId: sellerWallet.id,
      systemWalletId: systemWallet.id,
      amount: 100n,
      currency: 'USD',
      referenceType: 'ORDER',
      referenceId: 'ORD_005',
      triggeredBy: 'test',
    });

    // 1st Release
    await escrowService.releaseEscrow({
      escrowId: escrow.id,
      systemWalletId: systemWallet.id,
      triggeredBy: 'admin',
      requestId: 'release_unique_1',
    });

    // 2nd Release (same or different ID, service logic handles status check)
    // Should return the already released escrow without moving money
    const result = await escrowService.releaseEscrow({
      escrowId: escrow.id,
      systemWalletId: systemWallet.id,
      triggeredBy: 'admin',
      requestId: 'release_unique_2', // Even with new ID, status check blocks it
    });

    expect(result.status).toBe(EscrowStatus.RELEASED);

    // Verify System Balance is 0 (moved 100 once, not 200)
    // If double spend, balance would be negative or error
    const systemEntries = await prisma.ledgerEntry.findMany({
      where: { walletId: systemWallet.id },
    });
    // 1 credit (fund), 1 debit (release)
    expect(systemEntries.filter(e => e.entryType === 'CREDIT').length).toBe(1);
    expect(systemEntries.filter(e => e.entryType === 'DEBIT').length).toBe(1);
    
    // Balance 0
    const last = systemEntries.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    expect(last.balanceAfter).toBe(0n);
  });
});
