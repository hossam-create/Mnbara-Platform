// ============================================================
// Wallet Service Tests
// Comprehensive tests for all wallet operations
// ============================================================

import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { WalletService } from '../wallet.service';
import {
  InsufficientFundsError,
  WalletNotFoundError,
  InvalidAmountError,
  EscrowAlreadyExistsError,
  EscrowNotFoundError,
} from '../../errors/WalletErrors';
import { TransactionType, TransactionStatus } from '../../types/wallet.types';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    wallet: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    walletTransaction: {
      create: jest.fn(),
    },
    escrowHold: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe('WalletService', () => {
  let walletService: WalletService;
  let mockPrisma: any;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create new service instance
    walletService = new WalletService();

    // Get mock prisma instance
    mockPrisma = new PrismaClient();
  });

  // ============================================================
  // 1. GET WALLET TESTS
  // ============================================================

  describe('getWallet', () => {
    it('should return wallet when found', async () => {
      const mockWallet = {
        id: 1,
        userId: 123,
        currency: 'USD',
        availableBalance: new Decimal(100),
        lockedBalance: new Decimal(0),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);

      const result = await walletService.getWallet(123, 'USD');

      expect(result).toEqual(mockWallet);
      expect(mockPrisma.wallet.findUnique).toHaveBeenCalledWith({
        where: {
          userId_currency: {
            userId: 123,
            currency: 'USD',
          },
        },
      });
    });

    it('should throw WalletNotFoundError when wallet does not exist', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(null);

      await expect(walletService.getWallet(123, 'USD')).rejects.toThrow(
        WalletNotFoundError
      );
    });

    it('should use USD as default currency', async () => {
      const mockWallet = {
        id: 1,
        userId: 123,
        currency: 'USD',
        availableBalance: new Decimal(100),
        lockedBalance: new Decimal(0),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);

      await walletService.getWallet(123);

      expect(mockPrisma.wallet.findUnique).toHaveBeenCalledWith({
        where: {
          userId_currency: {
            userId: 123,
            currency: 'USD',
          },
        },
      });
    });
  });

  // ============================================================
  // 2. CREATE WALLET TESTS
  // ============================================================

  describe('createWallet', () => {
    it('should create wallet with default values', async () => {
      const mockWallet = {
        id: 1,
        userId: 123,
        currency: 'USD',
        availableBalance: new Decimal(0),
        lockedBalance: new Decimal(0),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.wallet.create.mockResolvedValue(mockWallet);

      const result = await walletService.createWallet({ userId: 123 });

      expect(result).toEqual(mockWallet);
      expect(mockPrisma.wallet.create).toHaveBeenCalledWith({
        data: {
          userId: 123,
          currency: 'USD',
          availableBalance: new Decimal(0),
          lockedBalance: new Decimal(0),
        },
      });
    });

    it('should create wallet with specified currency', async () => {
      const mockWallet = {
        id: 1,
        userId: 123,
        currency: 'EUR',
        availableBalance: new Decimal(0),
        lockedBalance: new Decimal(0),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.wallet.create.mockResolvedValue(mockWallet);

      const result = await walletService.createWallet({
        userId: 123,
        currency: 'EUR',
      });

      expect(result).toEqual(mockWallet);
      expect(mockPrisma.wallet.create).toHaveBeenCalledWith({
        data: {
          userId: 123,
          currency: 'EUR',
          availableBalance: new Decimal(0),
          lockedBalance: new Decimal(0),
        },
      });
    });

    it('should throw error when creation fails', async () => {
      mockPrisma.wallet.create.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        walletService.createWallet({ userId: 123 })
      ).rejects.toThrow('Database error');
    });
  });

  // ============================================================
  // 3. GET AVAILABLE BALANCE TESTS
  // ============================================================

  describe('getAvailableBalance', () => {
    it('should return available balance', async () => {
      const mockWallet = {
        id: 1,
        userId: 123,
        currency: 'USD',
        availableBalance: new Decimal(250.5),
        lockedBalance: new Decimal(50),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);

      const balance = await walletService.getAvailableBalance(123, 'USD');

      expect(balance).toEqual(new Decimal(250.5));
    });

    it('should throw WalletNotFoundError when wallet does not exist', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(null);

      await expect(
        walletService.getAvailableBalance(123, 'USD')
      ).rejects.toThrow(WalletNotFoundError);
    });
  });

  // ============================================================
  // 4. LOCK FUNDS TESTS
  // ============================================================

  describe('lockFunds', () => {
    it('should lock funds successfully', async () => {
      const mockWallet = {
        id: 1,
        userId: 123,
        currency: 'USD',
        availableBalance: new Decimal(100),
        lockedBalance: new Decimal(0),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedWallet = {
        ...mockWallet,
        availableBalance: new Decimal(50),
        lockedBalance: new Decimal(50),
      };

      mockPrisma.escrowHold.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          wallet: {
            findUnique: jest.fn().mockResolvedValue(mockWallet),
            update: jest.fn().mockResolvedValue(updatedWallet),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      const result = await walletService.lockFunds(
        123,
        new Decimal(50),
        456,
        'USD'
      );

      expect(result.availableBalance).toEqual(new Decimal(50));
      expect(result.lockedBalance).toEqual(new Decimal(50));
    });

    it('should throw InvalidAmountError for zero amount', async () => {
      await expect(
        walletService.lockFunds(123, new Decimal(0), 456, 'USD')
      ).rejects.toThrow(InvalidAmountError);
    });

    it('should throw InvalidAmountError for negative amount', async () => {
      await expect(
        walletService.lockFunds(123, new Decimal(-10), 456, 'USD')
      ).rejects.toThrow(InvalidAmountError);
    });

    it('should throw EscrowAlreadyExistsError when escrow exists', async () => {
      mockPrisma.escrowHold.findUnique.mockResolvedValue({
        id: 1,
        requestId: 456,
      });

      await expect(
        walletService.lockFunds(123, new Decimal(50), 456, 'USD')
      ).rejects.toThrow(EscrowAlreadyExistsError);
    });

    it('should throw InsufficientFundsError when balance is too low', async () => {
      const mockWallet = {
        id: 1,
        userId: 123,
        currency: 'USD',
        availableBalance: new Decimal(30),
        lockedBalance: new Decimal(0),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.escrowHold.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          wallet: {
            findUnique: jest.fn().mockResolvedValue(mockWallet),
          },
        };
        return callback(tx);
      });

      await expect(
        walletService.lockFunds(123, new Decimal(50), 456, 'USD')
      ).rejects.toThrow(InsufficientFundsError);
    });

    it('should throw WalletNotFoundError when wallet does not exist', async () => {
      mockPrisma.escrowHold.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          wallet: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(tx);
      });

      await expect(
        walletService.lockFunds(123, new Decimal(50), 456, 'USD')
      ).rejects.toThrow(WalletNotFoundError);
    });
  });

  // ============================================================
  // 5. RELEASE FUNDS TESTS
  // ============================================================

  describe('releaseFunds', () => {
    it('should release funds to seller successfully', async () => {
      const mockEscrow = {
        id: 1,
        requestId: 456,
        buyerWalletId: 1,
        sellerWalletId: 2,
        amount: new Decimal(50),
        platformFee: new Decimal(5),
        status: 'HELD',
      };

      const mockBuyerWallet = {
        id: 1,
        userId: 123,
        currency: 'USD',
        availableBalance: new Decimal(0),
        lockedBalance: new Decimal(55),
      };

      const mockSellerWallet = {
        id: 2,
        userId: 789,
        currency: 'USD',
        availableBalance: new Decimal(0),
        lockedBalance: new Decimal(0),
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          escrowHold: {
            findUnique: jest.fn().mockResolvedValue(mockEscrow),
            update: jest.fn().mockResolvedValue({}),
          },
          wallet: {
            findUnique: jest
              .fn()
              .mockResolvedValueOnce(mockBuyerWallet)
              .mockResolvedValueOnce(mockSellerWallet),
            update: jest.fn().mockResolvedValue({}),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      await walletService.releaseFunds(456, 789);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw EscrowNotFoundError when escrow does not exist', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          escrowHold: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(tx);
      });

      await expect(walletService.releaseFunds(456, 789)).rejects.toThrow(
        EscrowNotFoundError
      );
    });

    it('should throw error when escrow status is not HELD', async () => {
      const mockEscrow = {
        id: 1,
        requestId: 456,
        status: 'RELEASED',
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          escrowHold: {
            findUnique: jest.fn().mockResolvedValue(mockEscrow),
          },
        };
        return callback(tx);
      });

      await expect(walletService.releaseFunds(456, 789)).rejects.toThrow(
        'Escrow already processed: RELEASED'
      );
    });
  });

  // ============================================================
  // 6. REFUND FUNDS TESTS
  // ============================================================

  describe('refundFunds', () => {
    it('should refund funds to buyer successfully', async () => {
      const mockEscrow = {
        id: 1,
        requestId: 456,
        buyerWalletId: 1,
        sellerWalletId: 2,
        amount: new Decimal(50),
        platformFee: new Decimal(5),
        status: 'HELD',
      };

      const mockBuyerWallet = {
        id: 1,
        userId: 123,
        currency: 'USD',
        availableBalance: new Decimal(0),
        lockedBalance: new Decimal(55),
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          escrowHold: {
            findUnique: jest.fn().mockResolvedValue(mockEscrow),
            update: jest.fn().mockResolvedValue({}),
          },
          wallet: {
            findUnique: jest.fn().mockResolvedValue(mockBuyerWallet),
            update: jest.fn().mockResolvedValue({}),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      await walletService.refundFunds(456);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw EscrowNotFoundError when escrow does not exist', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          escrowHold: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(tx);
      });

      await expect(walletService.refundFunds(456)).rejects.toThrow(
        EscrowNotFoundError
      );
    });

    it('should throw error when escrow status is not HELD', async () => {
      const mockEscrow = {
        id: 1,
        requestId: 456,
        status: 'REFUNDED',
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          escrowHold: {
            findUnique: jest.fn().mockResolvedValue(mockEscrow),
          },
        };
        return callback(tx);
      });

      await expect(walletService.refundFunds(456)).rejects.toThrow(
        'Escrow already processed: REFUNDED'
      );
    });
  });

  // ============================================================
  // 7. DEDUCT FEE TESTS
  // ============================================================

  describe('deductFee', () => {
    it('should deduct fee successfully', async () => {
      const mockWallet = {
        id: 1,
        userId: 123,
        currency: 'USD',
        availableBalance: new Decimal(100),
        lockedBalance: new Decimal(0),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedWallet = {
        ...mockWallet,
        availableBalance: new Decimal(95),
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          wallet: {
            findUnique: jest.fn().mockResolvedValue(mockWallet),
            update: jest.fn().mockResolvedValue(updatedWallet),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      const result = await walletService.deductFee(
        123,
        new Decimal(5),
        456,
        'USD'
      );

      expect(result.availableBalance).toEqual(new Decimal(95));
    });

    it('should throw InvalidAmountError for zero amount', async () => {
      await expect(
        walletService.deductFee(123, new Decimal(0), 456, 'USD')
      ).rejects.toThrow(InvalidAmountError);
    });

    it('should throw InvalidAmountError for negative amount', async () => {
      await expect(
        walletService.deductFee(123, new Decimal(-5), 456, 'USD')
      ).rejects.toThrow(InvalidAmountError);
    });

    it('should throw InsufficientFundsError when balance is too low', async () => {
      const mockWallet = {
        id: 1,
        userId: 123,
        currency: 'USD',
        availableBalance: new Decimal(3),
        lockedBalance: new Decimal(0),
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          wallet: {
            findUnique: jest.fn().mockResolvedValue(mockWallet),
          },
        };
        return callback(tx);
      });

      await expect(
        walletService.deductFee(123, new Decimal(5), 456, 'USD')
      ).rejects.toThrow(InsufficientFundsError);
    });

    it('should throw WalletNotFoundError when wallet does not exist', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          wallet: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(tx);
      });

      await expect(
        walletService.deductFee(123, new Decimal(5), 456, 'USD')
      ).rejects.toThrow(WalletNotFoundError);
    });
  });

  // ============================================================
  // 8. RECORD TRANSACTION TESTS
  // ============================================================

  describe('recordTransaction', () => {
    it('should record transaction successfully', async () => {
      const mockTransaction = {
        id: 1,
        walletId: 1,
        transactionType: TransactionType.DEPOSIT,
        amount: new Decimal(100),
        referenceType: 'Request',
        referenceId: 456,
        status: TransactionStatus.PENDING,
        createdAt: new Date(),
      };

      mockPrisma.walletTransaction.create.mockResolvedValue(mockTransaction);

      const result = await walletService.recordTransaction(
        1,
        TransactionType.DEPOSIT,
        new Decimal(100),
        { type: 'Request', id: 456 }
      );

      expect(result).toEqual(mockTransaction);
      expect(mockPrisma.walletTransaction.create).toHaveBeenCalledWith({
        data: {
          walletId: 1,
          transactionType: TransactionType.DEPOSIT,
          amount: new Decimal(100),
          referenceType: 'Request',
          referenceId: 456,
          status: TransactionStatus.PENDING,
        },
      });
    });

    it('should record transaction without reference', async () => {
      const mockTransaction = {
        id: 1,
        walletId: 1,
        transactionType: TransactionType.DEPOSIT,
        amount: new Decimal(100),
        status: TransactionStatus.PENDING,
        createdAt: new Date(),
      };

      mockPrisma.walletTransaction.create.mockResolvedValue(mockTransaction);

      const result = await walletService.recordTransaction(
        1,
        TransactionType.DEPOSIT,
        new Decimal(100)
      );

      expect(result).toEqual(mockTransaction);
    });

    it('should throw InvalidAmountError for zero amount', async () => {
      await expect(
        walletService.recordTransaction(
          1,
          TransactionType.DEPOSIT,
          new Decimal(0)
        )
      ).rejects.toThrow(InvalidAmountError);
    });

    it('should throw InvalidAmountError for negative amount', async () => {
      await expect(
        walletService.recordTransaction(
          1,
          TransactionType.DEPOSIT,
          new Decimal(-100)
        )
      ).rejects.toThrow(InvalidAmountError);
    });

    it('should throw error when creation fails', async () => {
      mockPrisma.walletTransaction.create.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        walletService.recordTransaction(
          1,
          TransactionType.DEPOSIT,
          new Decimal(100)
        )
      ).rejects.toThrow('Database error');
    });
  });
});
