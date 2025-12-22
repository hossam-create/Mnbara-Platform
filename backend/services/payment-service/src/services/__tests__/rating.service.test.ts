import { PrismaClient } from '@prisma/client';
import { RatingService } from '../rating.service';

jest.mock('@prisma/client', () => {
  const mPrisma = {
    order: {
      findUnique: jest.fn(),
    },
    dispute: {
      findFirst: jest.fn(),
    },
    rating: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    ratingAudit: {
      create: jest.fn(),
    },
    $transaction: (fn: any) => fn(mPrisma),
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

describe('RatingService', () => {
  const prisma = new PrismaClient() as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks rating if order not completed', async () => {
    prisma.order.findUnique.mockResolvedValue({ id: 1, status: 'PAID', buyerId: 5, travelerId: 9 });
    await expect(
      RatingService.createRating({ orderId: 1, raterId: 5, score: 5 }),
    ).rejects.toThrow('Rating allowed only after order completion');
  });

  it('creates rating buyer -> traveler and updates aggregates', async () => {
    prisma.order.findUnique.mockResolvedValue({ id: 1, status: 'COMPLETED', buyerId: 5, travelerId: 9 });
    prisma.dispute.findFirst.mockResolvedValue(null);
    prisma.rating.findUnique.mockResolvedValue(null);
    prisma.rating.create.mockResolvedValue({ id: 10, orderId: 1, raterId: 5, rateeId: 9, score: 5 });
    prisma.user.findUnique.mockResolvedValue({ id: 9, ratingCount: 0, ratingSum: 0 });
    prisma.user.update.mockResolvedValue({});
    prisma.ratingAudit.create.mockResolvedValue({});

    const rating = await RatingService.createRating({ orderId: 1, raterId: 5, score: 5 });
    expect(rating.id).toBe(10);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: {
        ratingCount: 1,
        ratingSum: 5,
        ratingAverage: '5.00',
      },
    });
  });

  it('blocks second rating by same rater/order', async () => {
    prisma.order.findUnique.mockResolvedValue({ id: 1, status: 'COMPLETED', buyerId: 5, travelerId: 9 });
    prisma.dispute.findFirst.mockResolvedValue(null);
    prisma.rating.findUnique.mockResolvedValue({ id: 11 });
    await expect(
      RatingService.createRating({ orderId: 1, raterId: 5, score: 4 }),
    ).rejects.toThrow('Rating already submitted for this order');
  });
});






