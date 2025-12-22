import { PrismaClient } from '@prisma/client';
import { WithdrawalProcessor } from '../withdrawal-processor.service';
import { WalletService } from '../wallet.service';

jest.mock('@prisma/client', () => {
  const mPrisma = {
    withdrawalRequest: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

jest.mock('../wallet.service');

describe('WithdrawalProcessor', () => {
  const prisma = new PrismaClient() as any;
  const walletServiceMock = WalletService as jest.MockedClass<typeof WalletService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('processes a REQUESTED withdrawal and marks it completed', async () => {
    prisma.withdrawalRequest.findUnique.mockResolvedValue({
      id: 1,
      status: 'REQUESTED',
    });
    const instance = new WalletService() as any;
    (walletServiceMock.prototype.markWithdrawalCompleted as any).mockResolvedValue({});

    await WithdrawalProcessor.processOne(1);

    expect(prisma.withdrawalRequest.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: 'PROCESSING' },
    });
    expect(walletServiceMock.prototype.markWithdrawalCompleted).toHaveBeenCalledWith(1);
  });

  it('is idempotent when already COMPLETED', async () => {
    prisma.withdrawalRequest.findUnique.mockResolvedValue({
      id: 1,
      status: 'COMPLETED',
    });

    await WithdrawalProcessor.processOne(1);

    expect(prisma.withdrawalRequest.update).not.toHaveBeenCalled();
    expect(walletServiceMock.prototype.markWithdrawalCompleted).not.toHaveBeenCalled();
  });
});






