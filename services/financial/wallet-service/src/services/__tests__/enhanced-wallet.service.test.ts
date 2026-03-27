/**
 * Enhanced Wallet Service Tests
 * Comprehensive unit tests for wallet operations
 */

import { PrismaClient } from '@prisma/client';
import { EnhancedWalletService, Currency } from '../enhanced-wallet.service';

// Mock Prisma
jest.mock('@prisma/client');

describe('EnhancedWalletService', () => {
  let service: EnhancedWalletService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    service = new EnhancedWalletService();
    (service as any).prisma = mockPrisma;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWallet', () => {
    it('should create a new wallet with default USD currency', async () => {
      const userId = 'user-123';
      const mockWallet = {
        id: 'wallet-123',
        userId,
        primaryCurrency: 'USD',
        balances: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.wallet.findUnique = jest.fn().mockResolvedValue(null);
      mockPrisma.wallet.create = jest.fn().mockResolvedValue(mockWallet);

      const result = await service.createWallet(userId);

      expect(mockPrisma.wallet.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(mockPrisma.wallet.create).toHaveBeenCalled();
      expect(result).toEqual(mockWallet);
    });

    it('should throw error if wallet already exists', async () => {
      const userId = 'user-123';
      const existingWallet = { id: 'wallet-123', userId };

      mockPrisma.wallet.findUnique = jest.fn().mockResolvedValue(existingWallet);

      await expect(service.createWallet(userId)).rejects.toThrow(
        'Wallet already exists for this user'
      );
    });

    it('should create wallet with custom primary currency', async () => {
      const userId = 'user-123';
      const currency: Currency = 'EUR';
      const mockWallet = {
        id: 'wallet-123',
        userId,
        primaryCurrency: currency,
        balances: [],
      };

      mockPrisma.wallet.findUnique = jest.fn().mockResolvedValue(null);
      mockPrisma.wallet.create = jest.fn().mockResolvedValue(mockWallet);

      const result = await service.createWallet(userId, currency);

      expect(result.primaryCurrency).toBe(currency);
    });
  });

  describe('getWalletBalance', () => {
    it('should return wallet with all currency balances', async () => {
      const userId = 'user-123';
      const mockWallet = {
        id: 'wallet-123',
        userId,
        primaryCurrency: 'USD',
        balances: [
          {
            currency: 'USD',
            balance: 1000,
            availableBalance: 900,
            pendingBalance: 100,
          },
          {
            currency: 'EUR',
            balance: 500,
            availableBalance: 500,
            pendingBalance: 0,
          },
        ],
      };

      mockPrisma.wallet.findUnique = jest.fn().mockResolvedValue(mockWallet);

      const result = await service.getWalletBalance(userId);

      expect(mockPrisma.wallet.findUnique).toHaveBeenCalledWith({
        where: { userId },
        include: { balances: true },
      });
      expect(result).toEqual(mockWallet);
    });

    it('should throw error if wallet not found', async () => {
      const userId = 'user-123';

      mockPrisma.wallet.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.getWalletBalance(userId)).rejects.toThrow(
        'Wallet not found'
      );
    });
  });

  describe('deposit', () => {
    it('should successfully deposit funds', async () => {
      const userId = 'user-123';
      const amount = 100;
      const currency: Currency = 'USD';

      const mockWallet = {
        id: 'wallet-123',
        userId,
        balances: [
          {
            id: 'balance-123',
            currency,
            balance: 1000,
            availableBalance: 1000,
          },
        ],
      };

      const mockUpdatedBalance = {
        ...mockWallet.balances[0],
        balance: 1100,
        availableBalance: 1100,
      };

      mockPrisma.wallet.findUnique = jest.fn().mockResolvedValue(mockWallet);
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });
      mockPrisma.walletBalance.update = jest.fn().mockResolvedValue(mockUpdatedBalance);
      mockPrisma.ledgerEntry.create = jest.fn().mockResolvedValue({});

      const result = await service.deposit(userId, amount, currency);

      expect(result.balance).toBe(1100);
      expect(result.availableBalance).toBe(1100);
    });

    it('should throw error for negative deposit amount', async () => {
      const userId = 'user-123';
      const amount = -100;
      const currency: Currency = 'USD';

      await expect(service.deposit(userId, amount, currency)).rejects.toThrow(
        'Amount must be positive'
      );
    });

    it('should throw error for zero deposit amount', async () => {
      const userId = 'user-123';
      const amount = 0;
      const currency: Currency = 'USD';

      await expect(service.deposit(userId, amount, currency)).rejects.toThrow(
        'Amount must be positive'
      );
    });
  });

  describe('withdraw', () => {
    it('should successfully withdraw funds', async () => {
      const userId = 'user-123';
      const amount = 100;
      const currency: Currency = 'USD';

      const mockWallet = {
        id: 'wallet-123',
        userId,
        balances: [
          {
            id: 'balance-123',
            currency,
            balance: 1000,
            availableBalance: 1000,
          },
        ],
      };

      const mockUpdatedBalance = {
        ...mockWallet.balances[0],
        balance: 900,
        availableBalance: 900,
      };

      mockPrisma.wallet.findUnique = jest.fn().mockResolvedValue(mockWallet);
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });
      mockPrisma.walletBalance.update = jest.fn().mockResolvedValue(mockUpdatedBalance);
      mockPrisma.ledgerEntry.create = jest.fn().mockResolvedValue({});

      const result = await service.withdraw(userId, amount, currency);

      expect(result.balance).toBe(900);
      expect(result.availableBalance).toBe(900);
    });

    it('should throw error for insufficient balance', async () => {
      const userId = 'user-123';
      const amount = 2000;
      const currency: Currency = 'USD';

      const mockWallet = {
        id: 'wallet-123',
        userId,
        balances: [
          {
            id: 'balance-123',
            currency,
            balance: 1000,
            availableBalance: 1000,
          },
        ],
      };

      mockPrisma.wallet.findUnique = jest.fn().mockResolvedValue(mockWallet);

      await expect(service.withdraw(userId, amount, currency)).rejects.toThrow(
        'Insufficient balance'
      );
    });

    it('should throw error for negative withdrawal amount', async () => {
      const userId = 'user-123';
      const amount = -100;
      const currency: Currency = 'USD';

      await expect(service.withdraw(userId, amount, currency)).rejects.toThrow(
        'Amount must be positive'
      );
    });
  });

  describe('transfer', () => {
    it('should successfully transfer funds between users', async () => {
      const fromUserId = 'user-123';
      const toUserId = 'user-456';
      const amount = 100;
      const currency: Currency = 'USD';

      const mockFromWallet = {
        id: 'wallet-123',
        userId: fromUserId,
        balances: [
          {
            id: 'balance-123',
            currency,
            balance: 1000,
            availableBalance: 1000,
          },
        ],
      };

      const mockToWallet = {
        id: 'wallet-456',
        userId: toUserId,
        balances: [
          {
            id: 'balance-456',
            currency,
            balance: 500,
            availableBalance: 500,
          },
        ],
      };

      mockPrisma.wallet.findUnique = jest
        .fn()
        .mockResolvedValueOnce(mockFromWallet)
        .mockResolvedValueOnce(mockToWallet);
      
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });
      
      mockPrisma.walletBalance.update = jest.fn()
        .mockResolvedValueOnce({ ...mockFromWallet.balances[0], balance: 900 })
        .mockResolvedValueOnce({ ...mockToWallet.balances[0], balance: 600 });
      
      mockPrisma.ledgerEntry.createMany = jest.fn().mockResolvedValue({});

      const result = await service.transfer(fromUserId, toUserId, amount, currency);

      expect(result.success).toBe(true);
      expect(mockPrisma.walletBalance.update).toHaveBeenCalledTimes(2);
    });

    it('should throw error when transferring to self', async () => {
      const userId = 'user-123';
      const amount = 100;
      const currency: Currency = 'USD';

      await expect(service.transfer(userId, userId, amount, currency)).rejects.toThrow(
        'Cannot transfer to self'
      );
    });

    it('should throw error for insufficient balance in transfer', async () => {
      const fromUserId = 'user-123';
      const toUserId = 'user-456';
      const amount = 2000;
      const currency: Currency = 'USD';

      const mockFromWallet = {
        id: 'wallet-123',
        userId: fromUserId,
        balances: [
          {
            id: 'balance-123',
            currency,
            balance: 1000,
            availableBalance: 1000,
          },
        ],
      };

      mockPrisma.wallet.findUnique = jest.fn().mockResolvedValue(mockFromWallet);

      await expect(service.transfer(fromUserId, toUserId, amount, currency)).rejects.toThrow(
        'Insufficient balance'
      );
    });
  });

  describe('holdFunds (Escrow)', () => {
    it('should successfully hold funds for escrow', async () => {
      const userId = 'user-123';
      const amount = 100;
      const escrowId = 'escrow-123';
      const currency: Currency = 'USD';

      const mockWallet = {
        id: 'wallet-123',
        userId,
        balances: [
          {
            id: 'balance-123',
            currency,
            balance: 1000,
            availableBalance: 1000,
            pendingBalance: 0,
          },
        ],
      };

      mockPrisma.wallet.findUnique = jest.fn().mockResolvedValue(mockWallet);
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });
      mockPrisma.walletBalance.update = jest.fn().mockResolvedValue({
        ...mockWallet.balances[0],
        availableBalance: 900,
        pendingBalance: 100,
      });
      mockPrisma.escrowHold.create = jest.fn().mockResolvedValue({
        id: 'hold-123',
        escrowId,
        amount,
      });

      const result = await service.holdFunds(userId, amount, escrowId, currency);

      expect(result.success).toBe(true);
      expect(mockPrisma.escrowHold.create).toHaveBeenCalled();
    });

    it('should throw error for insufficient available balance', async () => {
      const userId = 'user-123';
      const amount = 2000;
      const escrowId = 'escrow-123';
      const currency: Currency = 'USD';

      const mockWallet = {
        id: 'wallet-123',
        userId,
        balances: [
          {
            id: 'balance-123',
            currency,
            balance: 1000,
            availableBalance: 1000,
          },
        ],
      };

      mockPrisma.wallet.findUnique = jest.fn().mockResolvedValue(mockWallet);

      await expect(service.holdFunds(userId, amount, escrowId, currency)).rejects.toThrow(
        'Insufficient available balance'
      );
    });
  });

  describe('releaseFunds (Escrow)', () => {
    it('should successfully release held funds', async () => {
      const escrowId = 'escrow-123';
      const toUserId = 'user-456';
      const amount = 100;
      const currency: Currency = 'USD';

      const mockHold = {
        id: 'hold-123',
        escrowId,
        walletId: 'wallet-123',
        amount,
        currency,
        status: 'HELD',
      };

      const mockFromWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        balances: [
          {
            id: 'balance-123',
            currency,
            pendingBalance: 100,
          },
        ],
      };

      const mockToWallet = {
        id: 'wallet-456',
        userId: toUserId,
        balances: [
          {
            id: 'balance-456',
            currency,
            balance: 500,
          },
        ],
      };

      mockPrisma.escrowHold.findUnique = jest.fn().mockResolvedValue(mockHold);
      mockPrisma.wallet.findUnique = jest
        .fn()
        .mockResolvedValueOnce(mockFromWallet)
        .mockResolvedValueOnce(mockToWallet);
      
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });
      
      mockPrisma.escrowHold.update = jest.fn().mockResolvedValue({
        ...mockHold,
        status: 'RELEASED',
      });
      
      mockPrisma.walletBalance.update = jest.fn().mockResolvedValue({});

      const result = await service.releaseFunds(escrowId, toUserId, currency);

      expect(result.success).toBe(true);
      expect(mockPrisma.escrowHold.update).toHaveBeenCalled();
    });

    it('should throw error if escrow hold not found', async () => {
      const escrowId = 'escrow-123';
      const toUserId = 'user-456';
      const currency: Currency = 'USD';

      mockPrisma.escrowHold.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.releaseFunds(escrowId, toUserId, currency)).rejects.toThrow(
        'Escrow hold not found'
      );
    });

    it('should throw error if escrow already released', async () => {
      const escrowId = 'escrow-123';
      const toUserId = 'user-456';
      const currency: Currency = 'USD';

      const mockHold = {
        id: 'hold-123',
        escrowId,
        status: 'RELEASED',
      };

      mockPrisma.escrowHold.findUnique = jest.fn().mockResolvedValue(mockHold);

      await expect(service.releaseFunds(escrowId, toUserId, currency)).rejects.toThrow(
        'Escrow already released or refunded'
      );
    });
  });

  describe('refundFunds (Escrow)', () => {
    it('should successfully refund held funds', async () => {
      const escrowId = 'escrow-123';
      const amount = 100;
      const currency: Currency = 'USD';

      const mockHold = {
        id: 'hold-123',
        escrowId,
        walletId: 'wallet-123',
        amount,
        currency,
        status: 'HELD',
      };

      const mockWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        balances: [
          {
            id: 'balance-123',
            currency,
            availableBalance: 900,
            pendingBalance: 100,
          },
        ],
      };

      mockPrisma.escrowHold.findUnique = jest.fn().mockResolvedValue(mockHold);
      mockPrisma.wallet.findUnique = jest.fn().mockResolvedValue(mockWallet);
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });
      mockPrisma.escrowHold.update = jest.fn().mockResolvedValue({
        ...mockHold,
        status: 'REFUNDED',
      });
      mockPrisma.walletBalance.update = jest.fn().mockResolvedValue({
        ...mockWallet.balances[0],
        availableBalance: 1000,
        pendingBalance: 0,
      });

      const result = await service.refundFunds(escrowId, currency);

      expect(result.success).toBe(true);
      expect(mockPrisma.escrowHold.update).toHaveBeenCalledWith({
        where: { id: mockHold.id },
        data: { status: 'REFUNDED' },
      });
    });

    it('should throw error if escrow hold not found for refund', async () => {
      const escrowId = 'escrow-123';
      const currency: Currency = 'USD';

      mockPrisma.escrowHold.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.refundFunds(escrowId, currency)).rejects.toThrow(
        'Escrow hold not found'
      );
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history with filters', async () => {
      const userId = 'user-123';
      const mockTransactions = [
        {
          id: 'tx-1',
          type: 'DEPOSIT',
          amount: 100,
          currency: 'USD',
          createdAt: new Date(),
        },
        {
          id: 'tx-2',
          type: 'WITHDRAWAL',
          amount: 50,
          currency: 'USD',
          createdAt: new Date(),
        },
      ];

      const mockWallet = { id: 'wallet-123', userId };

      mockPrisma.wallet.findUnique = jest.fn().mockResolvedValue(mockWallet);
      mockPrisma.ledgerEntry.findMany = jest.fn().mockResolvedValue(mockTransactions);

      const result = await service.getTransactionHistory(userId, {
        currency: 'USD',
        limit: 10,
      });

      expect(result).toEqual(mockTransactions);
      expect(mockPrisma.ledgerEntry.findMany).toHaveBeenCalled();
    });

    it('should apply date filters to transaction history', async () => {
      const userId = 'user-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const mockWallet = { id: 'wallet-123', userId };

      mockPrisma.wallet.findUnique = jest.fn().mockResolvedValue(mockWallet);
      mockPrisma.ledgerEntry.findMany = jest.fn().mockResolvedValue([]);

      await service.getTransactionHistory(userId, {
        startDate,
        endDate,
      });

      expect(mockPrisma.ledgerEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      );
    });
  });
});
