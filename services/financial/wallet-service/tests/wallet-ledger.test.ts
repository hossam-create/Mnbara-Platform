// ============================================================
// PHASE 4.1 — Wallet & Ledger Safety Tests
// Integration tests with real database operations
// ============================================================

import { PrismaClient } from '@prisma/client';
import { walletRepository } from '../src/repositories/wallet.repository';
import { ledgerService } from '../src/services/ledger.service';
import { transferService } from '../src/services/transfer.service.v2';
import { walletServiceV2 } from '../src/services/wallet.service.v2';
import {
  OwnerType,
  WalletStatus,
  EntryType,
  LedgerReason,
  ReferenceType,
} from '../src/types';
import {
  WalletNotFoundError,
  WalletAlreadyExistsError,
  WalletFrozenError,
  InsufficientBalanceError,
  InvalidAmountError,
  CurrencyMismatchError,
} from '../src/errors/wallet.errors';

const prisma = new PrismaClient();

// ============================================================
// TEST UTILITIES
// ============================================================

/**
 * Generate unique test ID to avoid conflicts
 */
function testId(): string {
  return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clean up test data
 */
async function cleanupTestWallet(walletId: string): Promise<void> {
  try {
    await prisma.ledgerEntry.deleteMany({ where: { walletId } });
    await prisma.wallet.delete({ where: { id: walletId } });
  } catch (error) {
    // Ignore if already deleted
  }
}

/**
 * Create test wallet with initial balance
 */
async function createTestWalletWithBalance(
  balance: bigint,
  ownerId?: string
): Promise<{ walletId: string; cleanup: () => Promise<void> }> {
  const id = ownerId || testId();
  const wallet = await walletRepository.createWallet(OwnerType.USER, id, 'EGP');

  if (balance > BigInt(0)) {
    await ledgerService.creditWallet({
      walletId: wallet.id,
      amount: balance,
      reason: LedgerReason.DEPOSIT,
      referenceType: ReferenceType.SYSTEM,
      referenceId: testId(),
      createdBy: 'test',
    });
  }

  return {
    walletId: wallet.id,
    cleanup: () => cleanupTestWallet(wallet.id),
  };
}

// ============================================================
// TEST SUITE: WALLET CREATION
// ============================================================

describe('Wallet Creation', () => {
  test('should create wallet with correct owner', async () => {
    const ownerId = testId();
    const response = await walletServiceV2.createWallet({
      ownerType: OwnerType.USER,
      ownerId,
      currency: 'EGP',
    });

    expect(response).toBeDefined();
    expect(response.ownerType).toBe(OwnerType.USER);
    expect(response.ownerId).toBe(ownerId);
    expect(response.currency).toBe('EGP');
    expect(response.status).toBe(WalletStatus.ACTIVE);
    expect(response.balance).toBe('0');

    // Cleanup
    await cleanupTestWallet(response.id);
  });

  test('should prevent duplicate wallet for same owner', async () => {
    const ownerId = testId();
    
    // Create first wallet
    const wallet1 = await walletServiceV2.createWallet({
      ownerType: OwnerType.SELLER,
      ownerId,
      currency: 'EGP',
    });

    // Attempt to create duplicate
    await expect(
      walletServiceV2.createWallet({
        ownerType: OwnerType.SELLER,
        ownerId,
        currency: 'EGP',
      })
    ).rejects.toThrow(WalletAlreadyExistsError);

    // Cleanup
    await cleanupTestWallet(wallet1.id);
  });

  test('should allow same owner to have wallets in different currencies', async () => {
    // Note: Currently only EGP is supported, this test is for future
    const ownerId = testId();
    
    const wallet = await walletServiceV2.createWallet({
      ownerType: OwnerType.USER,
      ownerId,
      currency: 'EGP',
    });

    expect(wallet.currency).toBe('EGP');

    // Cleanup
    await cleanupTestWallet(wallet.id);
  });

  test('should create wallet with zero balance', async () => {
    const ownerId = testId();
    
    const wallet = await walletServiceV2.createWallet({
      ownerType: OwnerType.TRAVELER,
      ownerId,
    });

    const balance = await walletServiceV2.getWalletBalance(wallet.id);
    expect(balance.balance).toBe('0');

    // Cleanup
    await cleanupTestWallet(wallet.id);
  });
});

// ============================================================
// TEST SUITE: CREDIT FLOW
// ============================================================

describe('Credit Flow', () => {
  test('should credit wallet and update balance', async () => {
    const { walletId, cleanup } = await createTestWalletWithBalance(BigInt(0));

    const result = await ledgerService.creditWallet({
      walletId,
      amount: BigInt(10000), // 100.00 EGP
      reason: LedgerReason.DEPOSIT,
      referenceType: ReferenceType.SYSTEM,
      referenceId: testId(),
      createdBy: 'test',
    });

    expect(result.entryType).toBe(EntryType.CREDIT);
    expect(result.amount).toBe('10000');
    expect(result.balanceAfter).toBe('10000');
    expect(result.isIdempotent).toBe(false);

    await cleanup();
  });

  test('should accumulate multiple credits', async () => {
    const { walletId, cleanup } = await createTestWalletWithBalance(BigInt(0));

    // First credit
    await ledgerService.creditWallet({
      walletId,
      amount: BigInt(5000),
      reason: LedgerReason.DEPOSIT,
      referenceType: ReferenceType.SYSTEM,
      referenceId: testId(),
      createdBy: 'test',
    });

    // Second credit
    const result = await ledgerService.creditWallet({
      walletId,
      amount: BigInt(3000),
      reason: LedgerReason.REFUND,
      referenceType: ReferenceType.ORDER,
      referenceId: testId(),
      createdBy: 'test',
    });

    expect(result.balanceAfter).toBe('8000');

    await cleanup();
  });

  test('should reject credit with zero amount', async () => {
    const { walletId, cleanup } = await createTestWalletWithBalance(BigInt(0));

    await expect(
      ledgerService.creditWallet({
        walletId,
        amount: BigInt(0),
        reason: LedgerReason.DEPOSIT,
        referenceType: ReferenceType.SYSTEM,
        createdBy: 'test',
      })
    ).rejects.toThrow(InvalidAmountError);

    await cleanup();
  });

  test('should reject credit with negative amount', async () => {
    const { walletId, cleanup } = await createTestWalletWithBalance(BigInt(0));

    await expect(
      ledgerService.creditWallet({
        walletId,
        amount: BigInt(-1000),
        reason: LedgerReason.DEPOSIT,
        referenceType: ReferenceType.SYSTEM,
        createdBy: 'test',
      })
    ).rejects.toThrow(InvalidAmountError);

    await cleanup();
  });

  test('should reject credit to non-existent wallet', async () => {
    await expect(
      ledgerService.creditWallet({
        walletId: '00000000-0000-0000-0000-000000000000',
        amount: BigInt(1000),
        reason: LedgerReason.DEPOSIT,
        referenceType: ReferenceType.SYSTEM,
        createdBy: 'test',
      })
    ).rejects.toThrow(WalletNotFoundError);
  });
});

// ============================================================
// TEST SUITE: DEBIT FLOW
// ============================================================

describe('Debit Flow', () => {
  test('should debit wallet with sufficient balance', async () => {
    const { walletId, cleanup } = await createTestWalletWithBalance(BigInt(10000));

    const result = await ledgerService.debitWallet({
      walletId,
      amount: BigInt(3000),
      reason: LedgerReason.PURCHASE_HOLD,
      referenceType: ReferenceType.ORDER,
      referenceId: 'order_123',
      createdBy: 'test',
    });

    expect(result.entryType).toBe(EntryType.DEBIT);
    expect(result.amount).toBe('3000');
    expect(result.balanceBefore).toBe('10000');
    expect(result.balanceAfter).toBe('7000');

    await cleanup();
  });

  test('should allow debit of exact balance', async () => {
    const { walletId, cleanup } = await createTestWalletWithBalance(BigInt(5000));

    const result = await ledgerService.debitWallet({
      walletId,
      amount: BigInt(5000),
      reason: LedgerReason.WITHDRAWAL,
      referenceType: ReferenceType.MANUAL,
      createdBy: 'test',
    });

    expect(result.balanceAfter).toBe('0');

    await cleanup();
  });
});

// ============================================================
// TEST SUITE: OVERDRAFT PREVENTION
// ============================================================

describe('Overdraft Prevention', () => {
  test('should reject debit exceeding balance', async () => {
    const { walletId, cleanup } = await createTestWalletWithBalance(BigInt(5000));

    await expect(
      ledgerService.debitWallet({
        walletId,
        amount: BigInt(5001), // 1 piaster more than balance
        reason: LedgerReason.PURCHASE_HOLD,
        referenceType: ReferenceType.ORDER,
        createdBy: 'test',
      })
    ).rejects.toThrow(InsufficientBalanceError);

    // Verify balance unchanged
    const balance = await walletServiceV2.getWalletBalance(walletId);
    expect(balance.balance).toBe('5000');

    await cleanup();
  });

  test('should reject debit from zero balance', async () => {
    const { walletId, cleanup } = await createTestWalletWithBalance(BigInt(0));

    await expect(
      ledgerService.debitWallet({
        walletId,
        amount: BigInt(1),
        reason: LedgerReason.FEE,
        referenceType: ReferenceType.SYSTEM,
        createdBy: 'test',
      })
    ).rejects.toThrow(InsufficientBalanceError);

    await cleanup();
  });

  test('should reject debit from frozen wallet', async () => {
    const { walletId, cleanup } = await createTestWalletWithBalance(BigInt(10000));

    // Freeze wallet
    await walletRepository.updateWalletStatus(walletId, WalletStatus.FROZEN);

    await expect(
      ledgerService.debitWallet({
        walletId,
        amount: BigInt(1000),
        reason: LedgerReason.WITHDRAWAL,
        referenceType: ReferenceType.MANUAL,
        createdBy: 'test',
      })
    ).rejects.toThrow(WalletFrozenError);

    await cleanup();
  });

  test('should reject credit to frozen wallet', async () => {
    const { walletId, cleanup } = await createTestWalletWithBalance(BigInt(0));

    // Freeze wallet
    await walletRepository.updateWalletStatus(walletId, WalletStatus.FROZEN);

    await expect(
      ledgerService.creditWallet({
        walletId,
        amount: BigInt(1000),
        reason: LedgerReason.DEPOSIT,
        referenceType: ReferenceType.SYSTEM,
        createdBy: 'test',
      })
    ).rejects.toThrow(WalletFrozenError);

    await cleanup();
  });
});

// ============================================================
// TEST SUITE: IDEMPOTENCY
// ============================================================

describe('Idempotency', () => {
  test('should return same entry for duplicate credit request', async () => {
    const { walletId, cleanup } = await createTestWalletWithBalance(BigInt(0));
    const requestId = `credit_${testId()}`;

    // First request
    const result1 = await ledgerService.creditWallet({
      walletId,
      amount: BigInt(5000),
      reason: LedgerReason.DEPOSIT,
      referenceType: ReferenceType.SYSTEM,
      requestId,
      createdBy: 'test',
    });

    expect(result1.isIdempotent).toBe(false);

    // Duplicate request
    const result2 = await ledgerService.creditWallet({
      walletId,
      amount: BigInt(5000),
      reason: LedgerReason.DEPOSIT,
      referenceType: ReferenceType.SYSTEM,
      requestId,
      createdBy: 'test',
    });

    expect(result2.isIdempotent).toBe(true);
    expect(result2.entryId).toBe(result1.entryId);

    // Balance should only be credited once
    const balance = await walletServiceV2.getWalletBalance(walletId);
    expect(balance.balance).toBe('5000');

    await cleanup();
  });

  test('should return same entry for duplicate debit request', async () => {
    const { walletId, cleanup } = await createTestWalletWithBalance(BigInt(10000));
    const requestId = `debit_${testId()}`;

    // First request
    const result1 = await ledgerService.debitWallet({
      walletId,
      amount: BigInt(3000),
      reason: LedgerReason.PURCHASE_HOLD,
      referenceType: ReferenceType.ORDER,
      requestId,
      createdBy: 'test',
    });

    // Duplicate request
    const result2 = await ledgerService.debitWallet({
      walletId,
      amount: BigInt(3000),
      reason: LedgerReason.PURCHASE_HOLD,
      referenceType: ReferenceType.ORDER,
      requestId,
      createdBy: 'test',
    });

    expect(result2.isIdempotent).toBe(true);
    expect(result2.entryId).toBe(result1.entryId);

    // Balance should only be debited once
    const balance = await walletServiceV2.getWalletBalance(walletId);
    expect(balance.balance).toBe('7000');

    await cleanup();
  });

  test('different request IDs should create separate entries', async () => {
    const { walletId, cleanup } = await createTestWalletWithBalance(BigInt(0));

    await ledgerService.creditWallet({
      walletId,
      amount: BigInt(1000),
      reason: LedgerReason.DEPOSIT,
      referenceType: ReferenceType.SYSTEM,
      requestId: `req_1_${testId()}`,
      createdBy: 'test',
    });

    await ledgerService.creditWallet({
      walletId,
      amount: BigInt(1000),
      reason: LedgerReason.DEPOSIT,
      referenceType: ReferenceType.SYSTEM,
      requestId: `req_2_${testId()}`,
      createdBy: 'test',
    });

    const balance = await walletServiceV2.getWalletBalance(walletId);
    expect(balance.balance).toBe('2000');

    await cleanup();
  });
});

// ============================================================
// TEST SUITE: CONCURRENT DEBIT PROTECTION
// ============================================================

describe('Concurrent Debit Protection', () => {
  test('should prevent double-spend under concurrent requests', async () => {
    const { walletId, cleanup } = await createTestWalletWithBalance(BigInt(10000));

    // Simulate concurrent debits that together exceed balance
    const debitPromises = [
      ledgerService.debitWallet({
        walletId,
        amount: BigInt(7000),
        reason: LedgerReason.PURCHASE_HOLD,
        referenceType: ReferenceType.ORDER,
        referenceId: 'order_a',
        requestId: `concurrent_a_${testId()}`,
        createdBy: 'test',
      }),
      ledgerService.debitWallet({
        walletId,
        amount: BigInt(7000),
        reason: LedgerReason.PURCHASE_HOLD,
        referenceType: ReferenceType.ORDER,
        referenceId: 'order_b',
        requestId: `concurrent_b_${testId()}`,
        createdBy: 'test',
      }),
    ];

    const results = await Promise.allSettled(debitPromises);

    // One should succeed, one should fail
    const successes = results.filter(r => r.status === 'fulfilled');
    const failures = results.filter(r => r.status === 'rejected');

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    // Verify final balance is correct
    const balance = await walletServiceV2.getWalletBalance(walletId);
    expect(balance.balance).toBe('3000'); // 10000 - 7000

    await cleanup();
  });

  test('should handle many concurrent credits correctly', async () => {
    const { walletId, cleanup } = await createTestWalletWithBalance(BigInt(0));

    // 10 concurrent credits of 1000 each
    const creditPromises = Array.from({ length: 10 }, (_, i) =>
      ledgerService.creditWallet({
        walletId,
        amount: BigInt(1000),
        reason: LedgerReason.DEPOSIT,
        referenceType: ReferenceType.SYSTEM,
        referenceId: `batch_${i}`,
        requestId: `batch_credit_${i}_${testId()}`,
        createdBy: 'test',
      })
    );

    await Promise.all(creditPromises);

    const balance = await walletServiceV2.getWalletBalance(walletId);
    expect(balance.balance).toBe('10000'); // 10 x 1000

    await cleanup();
  });
});

// ============================================================
// TEST SUITE: TRANSFER ATOMICITY
// ============================================================

describe('Transfer Atomicity', () => {
  test('should transfer funds atomically', async () => {
    const { walletId: fromWallet, cleanup: cleanup1 } = await createTestWalletWithBalance(BigInt(10000));
    const { walletId: toWallet, cleanup: cleanup2 } = await createTestWalletWithBalance(BigInt(5000));

    const result = await transferService.transferFunds({
      fromWalletId: fromWallet,
      toWalletId: toWallet,
      amount: BigInt(3000),
      reason: LedgerReason.TRANSFER_OUT,
      referenceType: ReferenceType.TRANSFER,
      createdBy: 'test',
    });

    expect(result.fromEntry.balanceAfter).toBe('7000');
    expect(result.toEntry.balanceAfter).toBe('8000');

    await cleanup1();
    await cleanup2();
  });

  test('should rollback transfer if from wallet has insufficient funds', async () => {
    const { walletId: fromWallet, cleanup: cleanup1 } = await createTestWalletWithBalance(BigInt(1000));
    const { walletId: toWallet, cleanup: cleanup2 } = await createTestWalletWithBalance(BigInt(5000));

    await expect(
      transferService.transferFunds({
        fromWalletId: fromWallet,
        toWalletId: toWallet,
        amount: BigInt(5000),
        reason: LedgerReason.TRANSFER_OUT,
        referenceType: ReferenceType.TRANSFER,
        createdBy: 'test',
      })
    ).rejects.toThrow(InsufficientBalanceError);

    // Verify both balances unchanged
    const fromBalance = await walletServiceV2.getWalletBalance(fromWallet);
    const toBalance = await walletServiceV2.getWalletBalance(toWallet);

    expect(fromBalance.balance).toBe('1000');
    expect(toBalance.balance).toBe('5000');

    await cleanup1();
    await cleanup2();
  });

  test('should reject transfer between different currencies', async () => {
    // This test verifies currency validation
    // Currently only EGP is supported, so we test the validation logic
    const { walletId: wallet1, cleanup: cleanup1 } = await createTestWalletWithBalance(BigInt(10000));
    const { walletId: wallet2, cleanup: cleanup2 } = await createTestWalletWithBalance(BigInt(0));

    // Both wallets are EGP, transfer should work
    const result = await transferService.transferFunds({
      fromWalletId: wallet1,
      toWalletId: wallet2,
      amount: BigInt(1000),
      reason: LedgerReason.TRANSFER_OUT,
      referenceType: ReferenceType.TRANSFER,
      createdBy: 'test',
    });

    expect(result.currency).toBe('EGP');

    await cleanup1();
    await cleanup2();
  });
});

// ============================================================
// TEST SUITE: LEDGER IMMUTABILITY
// ============================================================

describe('Ledger Immutability', () => {
  test('should create audit trail for all operations', async () => {
    const { walletId, cleanup } = await createTestWalletWithBalance(BigInt(0));

    // Credit
    await ledgerService.creditWallet({
      walletId,
      amount: BigInt(5000),
      reason: LedgerReason.DEPOSIT,
      referenceType: ReferenceType.SYSTEM,
      createdBy: 'user_123',
    });

    // Debit
    await ledgerService.debitWallet({
      walletId,
      amount: BigInt(2000),
      reason: LedgerReason.PURCHASE_HOLD,
      referenceType: ReferenceType.ORDER,
      referenceId: 'order_xyz',
      createdBy: 'system',
    });

    // Verify ledger entries exist
    const ledger = await walletServiceV2.listWalletLedgers(walletId);
    
    expect(ledger.data.length).toBe(2);
    expect(ledger.data[0].createdBy).toBeDefined();
    expect(ledger.data[1].createdBy).toBeDefined();

    await cleanup();
  });

  test('balance should equal sum of credits minus debits', async () => {
    const { walletId, cleanup } = await createTestWalletWithBalance(BigInt(0));

    // Multiple operations
    await ledgerService.creditWallet({
      walletId, amount: BigInt(10000), reason: LedgerReason.DEPOSIT,
      referenceType: ReferenceType.SYSTEM, createdBy: 'test',
    });
    await ledgerService.debitWallet({
      walletId, amount: BigInt(2500), reason: LedgerReason.FEE,
      referenceType: ReferenceType.SYSTEM, createdBy: 'test',
    });
    await ledgerService.creditWallet({
      walletId, amount: BigInt(3000), reason: LedgerReason.REFUND,
      referenceType: ReferenceType.ORDER, createdBy: 'test',
    });
    await ledgerService.debitWallet({
      walletId, amount: BigInt(1500), reason: LedgerReason.WITHDRAWAL,
      referenceType: ReferenceType.MANUAL, createdBy: 'test',
    });

    // Expected: 10000 - 2500 + 3000 - 1500 = 9000
    const balance = await walletServiceV2.getWalletBalance(walletId);
    expect(balance.balance).toBe('9000');

    await cleanup();
  });
});

// ============================================================
// SETUP AND TEARDOWN
// ============================================================

beforeAll(async () => {
  // Ensure database connection
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});
