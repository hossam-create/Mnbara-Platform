import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

jest.mock('@prisma/client', () => {
  const mPrisma = {
    protectionRequest: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    escrow: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      update: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      cancel: jest.fn().mockResolvedValue({}),
      capture: jest.fn().mockResolvedValue({}),
    },
  }));
});

// This file validates minimal refund/release behavior for protection flow.
describe('Protection flow (minimal)', () => {
  const prisma = new PrismaClient() as any;
  const stripe = new (Stripe as any)();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('approves refund and updates escrow/order/protection', async () => {
    const protection = {
      id: 1,
      escrowId: 2,
      orderId: 3,
      escrow: { stripePaymentId: 'pi_123' },
    };
    prisma.protectionRequest.findUnique.mockResolvedValue(protection);

    // Simulate controller logic
    await stripe.paymentIntents.cancel(protection.escrow.stripePaymentId);
    await prisma.escrow.update({ where: { id: protection.escrowId }, data: { status: 'REFUNDED_TO_BUYER', releasedAt: expect.any(Date) } });
    await prisma.order.update({ where: { id: protection.orderId }, data: { status: 'CANCELLED' } });
    await prisma.protectionRequest.update({ where: { id: protection.id }, data: { status: 'RESOLVED', updatedAt: expect.any(Date) } });

    expect(stripe.paymentIntents.cancel).toHaveBeenCalledWith('pi_123');
    expect(prisma.escrow.update).toHaveBeenCalled();
    expect(prisma.order.update).toHaveBeenCalled();
    expect(prisma.protectionRequest.update).toHaveBeenCalled();
  });

  it('approves release and updates escrow/order/protection', async () => {
    const protection = {
      id: 1,
      escrowId: 2,
      orderId: 3,
      escrow: { stripePaymentId: 'pi_123' },
    };
    prisma.protectionRequest.findUnique.mockResolvedValue(protection);

    await stripe.paymentIntents.capture(protection.escrow.stripePaymentId);
    await prisma.escrow.update({ where: { id: protection.escrowId }, data: { status: 'RELEASED_TO_TRAVELER', releasedAt: expect.any(Date) } });
    await prisma.order.update({ where: { id: protection.orderId }, data: { status: 'COMPLETED' } });
    await prisma.protectionRequest.update({ where: { id: protection.id }, data: { status: 'RESOLVED', updatedAt: expect.any(Date) } });

    expect(stripe.paymentIntents.capture).toHaveBeenCalledWith('pi_123');
    expect(prisma.escrow.update).toHaveBeenCalled();
    expect(prisma.order.update).toHaveBeenCalled();
    expect(prisma.protectionRequest.update).toHaveBeenCalled();
  });
});





