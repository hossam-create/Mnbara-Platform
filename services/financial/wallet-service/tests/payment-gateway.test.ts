import { PrismaClient } from '@prisma/client';
import { paymentProcessingService } from '../src/services/payment-processing.service';
import { OwnerType, WalletStatus } from '../src/types';

// Mock Registry
// We must mock this before importing specialized services if they depend on it at top level, 
// but here they import lazily or inside functions usually. 
// However, Jest mocks are hoisted.
jest.mock('../src/adapters/payment-gateway.registry', () => ({
  getPaymentGateway: (name: string) => ({
    verifyWebhook: jest.fn().mockImplementation((req) => {
      // Mock Signature Verification
      if (req.headers && req.headers['x-bad-signature']) {
        return Promise.resolve({ verified: false });
      }
      const body = req.body;
      return Promise.resolve({
        verified: true,
        gatewayReferenceId: body.id,
        eventType: body.type,
        internalReferenceId: null, // or mock
        metadata: body.metadata,
        amount: body.amount ? BigInt(body.amount) : undefined,
      });
    }),
    getPaymentDetails: jest.fn(),
  })
}));

const prisma = new PrismaClient();

describe('Payment Gateway Safety Tests', () => {
  let userWallet: any;

  const clearData = async () => {
     // Use try-catch to avoid breaking if tables don't exist yet (though setup should handle it)
     try {
       await prisma.ledgerEntry.deleteMany();
       await prisma.paymentEvent.deleteMany(); 
       await prisma.wallet.deleteMany();
     } catch (e) {
       console.log('Cleanup warning', e);
     }
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
    
    // Create User Wallet
    userWallet = await prisma.wallet.create({
      data: {
        id: crypto.randomUUID(),
        ownerType: OwnerType.USER,
        ownerId: 'USER_PAY_TEST',
        currency: 'EGP',
        status: WalletStatus.ACTIVE,
      },
    });
  });

  test('SAFETY: Valid webhook credits wallet atomically', async () => {
    const payload = {
      id: 'evt_valid_1',
      type: 'PAYMENT_SUCCESS',
      amount: 5000, // 50.00 EGP
      metadata: { walletId: userWallet.id }
    };

    const result = await paymentProcessingService.processWebhook('stripe', { body: payload });
    
    expect(result.status).toBe('processed');

    // Verify Ledger
    const entry = await prisma.ledgerEntry.findFirst({
      where: { walletId: userWallet.id }
    });
    expect(entry).not.toBeNull();
    expect(entry?.amount).toBe(5000n);
    expect(entry?.balanceAfter).toBe(5000n);

    // Verify Event Marked Processed
    const event = await prisma.paymentEvent.findFirst();
    expect(event?.processed).toBe(true);
  });

  test('SAFETY: Duplicate webhook is idempotent (No Double Credit)', async () => {
    const payload = {
      id: 'evt_dup_1',
      type: 'PAYMENT_SUCCESS',
      amount: 1000, 
      metadata: { walletId: userWallet.id }
    };

    // 1st Call
    await paymentProcessingService.processWebhook('stripe', { body: payload });
    
    // 2nd Call
    const result2 = await paymentProcessingService.processWebhook('stripe', { body: payload });
    
    expect(result2.status).toBe('already_processed');

    // Verify Ledger Count
    const count = await prisma.ledgerEntry.count({
      where: { walletId: userWallet.id }
    });
    expect(count).toBe(1);

    // Verify Balance (Still 1000)
    const entry = await prisma.ledgerEntry.findFirst({ orderBy: { createdAt: 'desc' }} );
    expect(entry?.balanceAfter).toBe(1000n);
  });

  test('SAFETY: Invalid signature is rejected immediately', async () => {
     const payload = { id: 'evt_bad_sig' };
     const req = { 
        body: payload, 
        headers: { 'x-bad-signature': 'true' } 
     };

     await expect(
       paymentProcessingService.processWebhook('stripe', req)
     ).rejects.toThrow('Invalid Webhook Signature');

     // Verify No Event Created
     const event = await prisma.paymentEvent.findFirst();
     expect(event).toBeNull();
  });
});
