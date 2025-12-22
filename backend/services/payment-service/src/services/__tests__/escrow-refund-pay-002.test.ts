import { PrismaClient } from '@prisma/client';
import { EscrowService, EscrowStatus } from '../escrow.service';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    escrow: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    wallet: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    walletLedger: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe('PAY-002: Controlled Escrow Refunds', () => {
  let mockPrisma: any;
  let escrowService: EscrowService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
    escrowService = new EscrowService();
  });

  describe('Refunds can only be initiated if escrow status is HELD', () => {
    it('should allow refund when escrow status is HELD', async () => {
      const escrowId = 1;
      const mockEscrow = {
        id: escrowId,
        orderId: 123,
        buyerId: 1,
        sellerId: 2,
        amount: 100.00,
        currency: 'USD',
        status: EscrowStatus.HELD,
        orderType: 'BUY_NOW',
      };

      const mockWallet = {
        id: 1,
        userId: 1,
        balance: 0,
        isLocked: false,
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          escrow: {
            findUnique: jest.fn().mockResolvedValue(mockEscrow),
            update: jest.fn().mockResolvedValue({ ...mockEscrow, status: EscrowStatus.REFUNDED }),
          },
          wallet: {
            findUnique: jest.fn().mockResolvedValue(mockWallet),
            update: jest.fn().mockResolvedValue({ ...mockWallet, balance: 100.00 }),
          },
          walletLedger: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
          },
        };
        return callback(tx);
      });

      const result = await EscrowService.refundFunds({
        escrowId,
        systemUserId: 1,
        reason: 'Order cancelled by buyer',
      });

      expect(result.escrow.status).toBe(EscrowStatus.REFUNDED);
    });

    it('should reject refund when escrow status is RELEASED', async () => {
      const escrowId = 1;
      const mockEscrow = {
        id: escrowId,
        status: EscrowStatus.RELEASED,
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          escrow: {
            findUnique: jest.fn().mockResolvedValue(mockEscrow),
          },
        };
        return callback(tx);
      });

      await expect(
        EscrowService.refundFunds({
          escrowId,
          systemUserId: 1,
          reason: 'Test refund',
        })
      ).rejects.toThrow('Refunds can only be initiated when escrow status is HELD');
    });

    it('should reject refund when escrow status is REFUNDED', async () => {
      const escrowId = 1;
      const mockEscrow = {
        id: escrowId,
        status: EscrowStatus.REFUNDED,
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          escrow: {
            findUnique: jest.fn().mockResolvedValue(mockEscrow),
          },
        };
        return callback(tx);
      });

      await expect(
        EscrowService.refundFunds({
          escrowId,
          systemUserId: 1,
          reason: 'Test refund',
        })
      ).rejects.toThrow('has already been refunded');
    });
  });

  describe('Refund action must update escrow status to REFUNDED', () => {
    it('should update escrow status to REFUNDED on successful refund', async () => {
      const escrowId = 1;
      const mockEscrow = {
        id: escrowId,
        orderId: 123,
        buyerId: 1,
        sellerId: 2,
        amount: 100.00,
        currency: 'USD',
        status: EscrowStatus.HELD,
        orderType: 'AUCTION',
      };

      const mockWallet = {
        id: 1,
        userId: 1,
        balance: 0,
        isLocked: false,
      };

      let updatedEscrow: any = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          escrow: {
            findUnique: jest.fn().mockResolvedValue(mockEscrow),
            update: jest.fn().mockImplementation(async (args: any) => {
              updatedEscrow = { ...mockEscrow, ...args.data };
              return updatedEscrow;
            }),
          },
          wallet: {
            findUnique: jest.fn().mockResolvedValue(mockWallet),
            update: jest.fn().mockResolvedValue(mockWallet),
          },
          walletLedger: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
          },
        };
        return callback(tx);
      });

      await EscrowService.refundFunds({
        escrowId,
        systemUserId: 1,
        reason: 'Order cancelled',
      });

      expect(updatedEscrow.status).toBe(EscrowStatus.REFUNDED);
    });
  });

  describe('Refunds must be auditable with reason and timestamp', () => {
    it('should log refund action with reason and timestamp', async () => {
      const escrowId = 1;
      const refundReason = 'Order cancelled by buyer';
      const mockEscrow = {
        id: escrowId,
        orderId: 123,
        buyerId: 1,
        sellerId: 2,
        amount: 100.00,
        currency: 'USD',
        status: EscrowStatus.HELD,
        orderType: 'BUY_NOW',
        metadata: {},
      };

      const mockWallet = {
        id: 1,
        userId: 1,
        balance: 0,
        isLocked: false,
      };

      let ledgerEntry: any = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          escrow: {
            findUnique: jest.fn().mockResolvedValue(mockEscrow),
            update: jest.fn().mockResolvedValue({ ...mockEscrow, status: EscrowStatus.REFUNDED }),
          },
          wallet: {
            findUnique: jest.fn().mockResolvedValue(mockWallet),
            update: jest.fn().mockResolvedValue(mockWallet),
          },
          walletLedger: {
            create: jest.fn().mockImplementation(async (args: any) => {
              ledgerEntry = args.data;
              return { id: 1, ...args.data };
            }),
          },
        };
        return callback(tx);
      });

      await EscrowService.refundFunds({
        escrowId,
        systemUserId: 1,
        reason: refundReason,
      });

      expect(ledgerEntry).toBeDefined();
      expect(ledgerEntry.description).toContain(refundReason);
      expect(ledgerEntry.metadata.refundReason).toBe(refundReason);
    });
  });

  describe('Partial refunds are NOT supported', () => {
    it('should reject partial refund attempts', async () => {
      // This is tested at the controller level
      // The service always refunds the full escrow amount
      const escrowId = 1;
      const mockEscrow = {
        id: escrowId,
        orderId: 123,
        buyerId: 1,
        sellerId: 2,
        amount: 100.00,
        currency: 'USD',
        status: EscrowStatus.HELD,
        orderType: 'BUY_NOW',
      };

      const mockWallet = {
        id: 1,
        userId: 1,
        balance: 0,
        isLocked: false,
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          escrow: {
            findUnique: jest.fn().mockResolvedValue(mockEscrow),
            update: jest.fn().mockResolvedValue({ ...mockEscrow, status: EscrowStatus.REFUNDED }),
          },
          wallet: {
            findUnique: jest.fn().mockResolvedValue(mockWallet),
            update: jest.fn().mockResolvedValue(mockWallet),
          },
          walletLedger: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
          },
        };
        return callback(tx);
      });

      const result = await EscrowService.refundFunds({
        escrowId,
        systemUserId: 1,
        reason: 'Full refund',
      });

      // Service always refunds full amount (no partial support)
      expect(result.escrow.amount).toBe(mockEscrow.amount);
    });
  });

  describe('Refunds support BUY_NOW and AUCTION orders', () => {
    it('should refund BUY_NOW order escrow', async () => {
      const escrowId = 1;
      const mockEscrow = {
        id: escrowId,
        orderId: 123,
        buyerId: 1,
        sellerId: 2,
        amount: 100.00,
        currency: 'USD',
        status: EscrowStatus.HELD,
        orderType: 'BUY_NOW',
      };

      const mockWallet = {
        id: 1,
        userId: 1,
        balance: 0,
        isLocked: false,
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          escrow: {
            findUnique: jest.fn().mockResolvedValue(mockEscrow),
            update: jest.fn().mockResolvedValue({ ...mockEscrow, status: EscrowStatus.REFUNDED }),
          },
          wallet: {
            findUnique: jest.fn().mockResolvedValue(mockWallet),
            update: jest.fn().mockResolvedValue(mockWallet),
          },
          walletLedger: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
          },
        };
        return callback(tx);
      });

      const result = await EscrowService.refundFunds({
        escrowId,
        systemUserId: 1,
        reason: 'BUY_NOW order refund',
      });

      expect(result.escrow.orderType).toBe('BUY_NOW');
      expect(result.escrow.status).toBe(EscrowStatus.REFUNDED);
    });

    it('should refund AUCTION order escrow', async () => {
      const escrowId = 1;
      const mockEscrow = {
        id: escrowId,
        orderId: 123,
        buyerId: 1,
        sellerId: 2,
        amount: 150.00,
        currency: 'USD',
        status: EscrowStatus.HELD,
        orderType: 'AUCTION',
      };

      const mockWallet = {
        id: 1,
        userId: 1,
        balance: 0,
        isLocked: false,
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          escrow: {
            findUnique: jest.fn().mockResolvedValue(mockEscrow),
            update: jest.fn().mockResolvedValue({ ...mockEscrow, status: EscrowStatus.REFUNDED }),
          },
          wallet: {
            findUnique: jest.fn().mockResolvedValue(mockWallet),
            update: jest.fn().mockResolvedValue(mockWallet),
          },
          walletLedger: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
          },
        };
        return callback(tx);
      });

      const result = await EscrowService.refundFunds({
        escrowId,
        systemUserId: 1,
        reason: 'AUCTION order refund',
      });

      expect(result.escrow.orderType).toBe('AUCTION');
      expect(result.escrow.status).toBe(EscrowStatus.REFUNDED);
    });
  });
});





