import { PrismaClient } from '@prisma/client';
import { DisputeService } from '../dispute.service';
import { EscrowService } from '../escrow.service';

jest.mock('@prisma/client', () => {
  const mPrisma = {
    dispute: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    escrow: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      update: jest.fn(),
    },
    $transaction: (fn: any) => fn(mPrisma),
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

jest.mock('../escrow.service');

describe('DisputeService', () => {
  const prisma = new PrismaClient() as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens a dispute when none exists', async () => {
    prisma.escrow.findUnique.mockResolvedValue({ id: 2, orderId: 1, travelerId: 9 });
    prisma.dispute.findFirst.mockResolvedValue(null);
    prisma.dispute.create.mockResolvedValue({ id: 5, orderId: 1, escrowId: 2 });

    const dispute = await DisputeService.openDispute({
      orderId: 1,
      escrowId: 2,
      buyerId: 7,
      travelerId: 9,
      reason: 'WRONG_ITEM' as any,
    });

    expect(dispute.id).toBe(5);
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: 'DISPUTED' },
    });
  });

  it('blocks second dispute for same order while active', async () => {
    prisma.escrow.findUnique.mockResolvedValue({ id: 2, orderId: 1, travelerId: 9 });
    prisma.dispute.findFirst.mockResolvedValue({ id: 5, status: 'OPEN' });

    await expect(
      DisputeService.openDispute({
        orderId: 1,
        escrowId: 2,
        buyerId: 7,
        travelerId: 9,
        reason: 'WRONG_ITEM' as any,
      }),
    ).rejects.toThrow('A dispute is already active for this order');
  });

  it('resolves for buyer triggers escrow refund', async () => {
    prisma.dispute.findUnique.mockResolvedValue({
      id: 5,
      orderId: 1,
      escrowId: 2,
      status: 'OPEN',
    });
    (EscrowService.refundFunds as any).mockResolvedValue({});
    prisma.dispute.update.mockResolvedValue({ id: 5, status: 'RESOLVED_BUYER' });

    const dispute = await DisputeService.resolveForBuyer({ disputeId: 5, adminId: 99 });

    expect(dispute.status).toBe('RESOLVED_BUYER');
    expect(EscrowService.refundFunds).toHaveBeenCalledWith(
      expect.objectContaining({ escrowId: 2, systemUserId: 99 }),
    );
  });
});






