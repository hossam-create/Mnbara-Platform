import { PrismaClient, Prisma } from '@prisma/client';
import { WalletService } from '../wallet.service';

jest.mock('@prisma/client', () => {
  const mPrisma = {
    wallet: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    payoutMethod: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    withdrawalRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    $transaction: (fn: any) => fn(mPrisma),
  };
  return { PrismaClient: jest.fn(() => mPrisma), Prisma: { Decimal: jest.requireActual('decimal.js') } };
});

describe('WalletService withdrawals', () => {
  const prisma = new PrismaClient() as any;
  const service = new WalletService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests full withdrawal when balance available and no pending', async () => {
    const Decimal = (Prisma as any).Decimal || (global as any).Decimal;
    prisma.wallet.findUnique.mockResolvedValue({
      id: 1,
      userId: 5,
      balance: new Decimal(100),
      pendingBalance: new Decimal(0),
      currency: 'USD',
    });
    prisma.payoutMethod.findFirst
      .mockResolvedValueOnce({ id: 10 }) // default method lookup
      .mockResolvedValueOnce({ id: 10 });
    prisma.withdrawalRequest.create.mockResolvedValue({
      id: 20,
      userId: 5,
      walletId: 1,
      amount: new Decimal(100),
    });
    prisma.wallet.update.mockResolvedValue({
      id: 1,
      balance: new Decimal(0),
      pendingBalance: new Decimal(100),
      currency: 'USD',
    });

    const result = await service.requestFullWithdrawal(5);

    expect(result.withdrawal.id).toBe(20);
    expect(prisma.wallet.update).toHaveBeenCalled();
    expect(result.wallet.pendingBalance.toString()).toBe('100');
  });

  it('blocks withdrawal when no funds', async () => {
    const Decimal = (Prisma as any).Decimal || (global as any).Decimal;
    prisma.wallet.findUnique.mockResolvedValue({
      id: 1,
      userId: 5,
      balance: new Decimal(0),
      pendingBalance: new Decimal(0),
      currency: 'USD',
    });

    await expect(service.requestFullWithdrawal(5)).rejects.toThrow('No funds available for withdrawal');
  });

  it('blocks withdrawal when one already in progress', async () => {
    const Decimal = (Prisma as any).Decimal || (global as any).Decimal;
    prisma.wallet.findUnique.mockResolvedValue({
      id: 1,
      userId: 5,
      balance: new Decimal(50),
      pendingBalance: new Decimal(10),
      currency: 'USD',
    });

    await expect(service.requestFullWithdrawal(5)).rejects.toThrow('Withdrawal already in progress');
  });
});






