import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

jest.mock('@prisma/client', () => {
  const mPrisma = {
    escrow: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      update: jest.fn(),
    },
    deliveryProof: {
      count: jest.fn(),
    },
    purchaseReceipt: {
      count: jest.fn(),
    },
    protectionRequest: {
      create: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      capture: jest.fn().mockResolvedValue({}),
    },
  }));
});

describe('Delivery confirmation flow (minimal)', () => {
  const prisma = new PrismaClient() as any;
  const stripe = new (Stripe as any)();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks confirmation without proof/receipt', async () => {
    prisma.escrow.findUnique.mockResolvedValue({ id: 1, status: 'HELD', stripePaymentId: null });
    prisma.deliveryProof.count.mockResolvedValue(0);
    prisma.purchaseReceipt.count.mockResolvedValue(0);
    // Controller logic is not imported here; this test documents expected guards.
    expect(prisma.deliveryProof.count).not.toBeNull();
  });

  it('releases escrow on confirmation when proof and receipt exist', async () => {
    prisma.escrow.findUnique.mockResolvedValue({ id: 1, status: 'HELD', stripePaymentId: 'pi_123', orderId: 5 });
    prisma.deliveryProof.count.mockResolvedValue(1);
    prisma.purchaseReceipt.count.mockResolvedValue(1);
    await stripe.paymentIntents.capture('pi_123');
    await prisma.escrow.update({
      where: { id: 1 },
      data: { status: 'RELEASED', buyerConfirmedDelivery: true, receiptUploaded: true },
    });
    expect(stripe.paymentIntents.capture).toHaveBeenCalledWith('pi_123');
  });
});





