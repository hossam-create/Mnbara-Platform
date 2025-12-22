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

describe('DEL-001: Escrow Release After Delivery Confirmation', () => {
  let mockPrisma: any;
  let escrowService: EscrowService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
    escrowService = new EscrowService();
  });

  describe('Only escrows with status HELD can be released', () => {
    it('should allow release when escrow status is HELD', async () => {
      const escrowId = 1;
      const mockEscrow = {
        id: escrowId,
        orderId: 123,
        buyerId: 1,
        sellerId: 2,
        travelerId: 3,
        amount: 100.00,
        currency: 'USD',
        status: EscrowStatus.HELD,
        orderType: 'BUY_NOW',
      };

      const mockWallet = {
        id: 1,
        userId: 2,
        balance: 0,
        isLocked: false,
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          escrow: {
            findUnique: jest.fn().mockResolvedValue(mockEscrow),
            update: jest.fn().mockResolvedValue({ ...mockEscrow, status: EscrowStatus.RELEASED }),
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

      const result = await EscrowService.releaseFunds({
        escrowId,
        recipientUserId: 2,
        systemUserId: 1,
        reason: 'Delivery confirmed',
      });

      expect(result.escrow.status).toBe(EscrowStatus.RELEASED);
    });

    it('should reject release when escrow status is RELEASED', async () => {
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
        EscrowService.releaseFunds({
          escrowId,
          recipientUserId: 2,
          systemUserId: 1,
          reason: 'Delivery confirmed',
        })
      ).rejects.toThrow('Escrow can only be released when status is HELD');
    });

    it('should reject release when escrow status is REFUNDED', async () => {
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
        EscrowService.releaseFunds({
          escrowId,
          recipientUserId: 2,
          systemUserId: 1,
          reason: 'Delivery confirmed',
        })
      ).rejects.toThrow('Escrow can only be released when status is HELD');
    });
  });

  describe('Release must update escrow status to RELEASED', () => {
    it('should update escrow status to RELEASED on successful release', async () => {
      const escrowId = 1;
      const mockEscrow = {
        id: escrowId,
        orderId: 123,
        buyerId: 1,
        sellerId: 2,
        travelerId: 3,
        amount: 100.00,
        currency: 'USD',
        status: EscrowStatus.HELD,
        orderType: 'AUCTION',
      };

      const mockWallet = {
        id: 1,
        userId: 2,
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

      await EscrowService.releaseFunds({
        escrowId,
        recipientUserId: 2,
        systemUserId: 1,
        reason: 'Delivery confirmed',
      });

      expect(updatedEscrow.status).toBe(EscrowStatus.RELEASED);
      expect(updatedEscrow.releasedAt).toBeDefined();
    });
  });

  describe('Duplicate release attempts must be prevented', () => {
    it('should reject duplicate release attempt', async () => {
      const escrowId = 1;
      const mockEscrow = {
        id: escrowId,
        status: EscrowStatus.RELEASED,
        releasedAt: new Date('2025-01-01'),
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
        EscrowService.releaseFunds({
          escrowId,
          recipientUserId: 2,
          systemUserId: 1,
          reason: 'Delivery confirmed',
        })
      ).rejects.toThrow('has already been released');
    });
  });

  describe('Release must work for both BUY_NOW and AUCTION orders', () => {
    it('should release escrow for BUY_NOW order', async () => {
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
        userId: 2,
        balance: 0,
        isLocked: false,
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          escrow: {
            findUnique: jest.fn().mockResolvedValue(mockEscrow),
            update: jest.fn().mockResolvedValue({ ...mockEscrow, status: EscrowStatus.RELEASED }),
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

      const result = await EscrowService.releaseFunds({
        escrowId,
        recipientUserId: 2,
        systemUserId: 1,
        reason: 'BUY_NOW order delivery confirmed',
      });

      expect(result.escrow.orderType).toBe('BUY_NOW');
      expect(result.escrow.status).toBe(EscrowStatus.RELEASED);
    });

    it('should release escrow for AUCTION order', async () => {
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
        userId: 2,
        balance: 0,
        isLocked: false,
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          escrow: {
            findUnique: jest.fn().mockResolvedValue(mockEscrow),
            update: jest.fn().mockResolvedValue({ ...mockEscrow, status: EscrowStatus.RELEASED }),
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

      const result = await EscrowService.releaseFunds({
        escrowId,
        recipientUserId: 2,
        systemUserId: 1,
        reason: 'AUCTION order delivery confirmed',
      });

      expect(result.escrow.orderType).toBe('AUCTION');
      expect(result.escrow.status).toBe(EscrowStatus.RELEASED);
    });
  });

  describe('Release action must be auditable with timestamp and actor', () => {
    it('should log release with timestamp and actor', async () => {
      const escrowId = 1;
      const systemUserId = 1;
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
        userId: 2,
        balance: 0,
        isLocked: false,
      };

      let ledgerEntry: any = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          escrow: {
            findUnique: jest.fn().mockResolvedValue(mockEscrow),
            update: jest.fn().mockResolvedValue({ 
              ...mockEscrow, 
              status: EscrowStatus.RELEASED,
              releasedAt: new Date(),
            }),
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

      await EscrowService.releaseFunds({
        escrowId,
        recipientUserId: 2,
        systemUserId,
        reason: 'Delivery confirmed',
      });

      expect(ledgerEntry).toBeDefined();
      expect(ledgerEntry.performedBy).toBe(systemUserId);
      expect(ledgerEntry.metadata.releaseReason).toBe('Delivery confirmed');
    });
  });
});





