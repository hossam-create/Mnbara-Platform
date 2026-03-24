
import { PrismaClient } from '@prisma/client';
import { ledgerService } from '../src/services/ledger.service';
import { payoutService } from '../src/services/payout.service';
import { BankAdapter, BankPayoutRequest, BankPayoutStatus } from '../src/interfaces/bank-adapter.interface';

const prisma = new PrismaClient();

// Mock Bank Adapter
const mockBankAdapter: BankAdapter = {
  sendPayout: async (req: BankPayoutRequest) => ({
    bankReference: `BANK_${Date.now()}_${Math.random()}`,
    status: BankPayoutStatus.PENDING,
  }),
  checkStatus: async (ref: string) => ({
    status: BankPayoutStatus.COMPLETED, // Auto-complete for test
  }),
};

describe('Ledger Safety & Concurrency', () => {
  let walletId: string;

  beforeAll(async () => {
    // Create test wallet
    const wallet = await prisma.wallet.create({
      data: {
        ownerType: 'USER',
        ownerId: `SAFETY_TEST_${Date.now()}`,
        currency: 'EGP',
        status: 'ACTIVE',
      },
    });
    walletId = wallet.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Concurrent payouts should NOT overdraft wallet', async () => {
    // 1. Credit wallet with 1000 EGP
    await ledgerService.creditWallet({
      walletId,
      amount: 100000n, // 1000.00
      reason: 'DEPOSIT' as any,
      referenceType: 'MANUAL' as any,
      createdBy: 'test',
    });

    const initialBalance = await ledgerService.getBalance(walletId);
    expect(initialBalance).toBe(100000n);

    // 2. Create Escrow to satisfy payout requirement (mocking the escrow check/release)
    // Actually payoutService checks for RELEASED escrow.
    // We need to create a dummy release escrow in DB to pass validity checks.
    const escrow = await prisma.escrow.create({
      data: {
        buyerWalletId: walletId, // Irrelevant for this test, but FK might be needed
        sellerWalletId: walletId,
        amount: 50000n,
        currency: 'EGP',
        status: 'RELEASED',
        referenceType: 'ORDER' as any,
        referenceId: 'REF_1',
        createdBy: 'test',
        fundedAt: new Date(),
        releasedAt: new Date(),
      },
    });

    // 3. Attempt 3 concurrent payouts of 500 EGP each (Total 1500 > 1000)
    // We need to bypass createPayout logic which checks balance strictly before tx?
    // createPayout checks balance: `if (balance < amount) throw`
    // If we run them concurrently, they might all pass the initial check if they read snapshot before write?
    // Let's test `createPayout` concurrency first.
    
    // However, `createPayout` ONLY creates instructions. It doesn't move money.
    // The money moves at `confirmPayout`.
    // So we can create 3 APPROVED payouts (Total 1500).
    // Then we try to CONFIRM them all concurrently.
    
    // We need 3 separate escrows/requests to be valid?
    // Re-use same escrow for simplicity if constraint allows (unique on refType/refId).
    
    // Create 3 payouts
    const createPromises = [1, 2, 3].map(async (i) => {
       // We create unique payouts
       return await prisma.payoutInstruction.create({
         data: {
           walletId,
           amount: 50000n, // 500.00
           currency: 'EGP',
           destinationType: 'BANK_ACCOUNT',
           destinationRef: `IBAN_${i}`,
           reason: 'SELLER_PAYOUT',
           escrowReleaseId: escrow.id, 
           status: 'SENT', // Simulate they are already at bank
           bankReference: `REF_${i}`,
           createdBy: 'test',
         }
       });
    });

    const payouts = await Promise.all(createPromises);

    // 4. Concurrently CONFIRM them
    // This triggers `confirmPayout` which does the atomic ledger write.
    // Logic:
    // Payout 1: 500 -> Balance 500
    // Payout 2: 500 -> Balance 0
    // Payout 3: 500 -> Balance -500 (SHOULD FAIL)

    const results = await Promise.allSettled(
      payouts.map(p => payoutService.confirmPayout(p.id, prisma)) // Passing prisma as 'tx' works if it supports it, or we wrap?
      // Wait, confirmPayout expects a transaction client OR client.
      // ledgerService.executeAtomicWrite handles it.
    );

    // 5. Verify results
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.filter(r => r.status === 'rejected').length;

    console.log(`Success: ${successCount}, Fail: ${failCount}`);
    
    // 6. Assertions
    expect(successCount).toBe(2);
    expect(failCount).toBe(1);

    // 7. Verify final balance
    const finalBalance = await ledgerService.getBalance(walletId);
    expect(finalBalance).toBe(0n);
  }, 30000);
});
