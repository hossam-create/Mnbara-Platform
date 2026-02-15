import { TransactionController } from '../controllers/transaction.controller';
import { Response } from 'express';
import { Decimal } from 'decimal.js';
import { AuthRequest } from '../middleware/auth';

// Mock all dependencies
jest.mock('../index', () => ({
  prisma: {
    transaction: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    wallet: {
      findFirst: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-123' }),
    },
    $transaction: jest.fn(async (callback: any) => {
      const mockTx = {
        transaction: {
          update: jest.fn(),
        },
      };
      return await callback(mockTx);
    }),
  },
}));

jest.mock('../utils/walletLimits', () => ({
  checkWalletLimits: jest.fn(),
}));

jest.mock('../utils/walletBalance', () => ({
  updateWalletBalance: jest.fn(),
}));

jest.mock('../utils/journalEntries', () => ({
  createJournalEntries: jest.fn(),
}));

// Import the mocked modules
import { prisma } from '../index';
import { checkWalletLimits } from '../utils/walletLimits';
import { updateWalletBalance } from '../utils/walletBalance';
import { createJournalEntries } from '../utils/journalEntries';

describe('TransactionController', () => {
  let controller: TransactionController;
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    controller = new TransactionController();
    
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();
    
    mockReq = {
      user: { id: 'user123', email: 'test@example.com', role: 'USER' },
      body: {},
      params: {},
      query: {},
    };
    
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createDeposit', () => {
    it('should create a deposit successfully', async () => {
      const mockUser = { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com', role: 'USER' };
      const mockWallet = { id: '223e4567-e89b-12d3-a456-426614174000', userId: '123e4567-e89b-12d3-a456-426614174000', currency: 'USD', isFrozen: false, availableBalance: new Decimal(1000) };
      const mockTransaction = { 
        id: '323e4567-e89b-12d3-a456-426614174000', 
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'DEPOSIT',
        amount: new Decimal(100), 
        currency: 'USD', 
        status: 'PENDING',
        fee: new Decimal(0),
        netAmount: new Decimal(100),
        description: 'Test deposit',
        referenceId: 'REF123',
        processedAt: new Date(),
        createdAt: new Date(),
        wallet: {
          id: '223e4567-e89b-12d3-a456-426614174000',
          currency: 'USD',
          balance: new Decimal(1100),
          availableBalance: new Decimal(1100)
        }
      };

      mockReq = {
        user: mockUser,
        body: {
          walletId: '223e4567-e89b-12d3-a456-426614174000',
          amount: 100,
          currency: 'USD',
          referenceId: 'REF123',
        },
        get: jest.fn((header: string) => header === 'set-cookie' ? undefined : 'Mozilla/5.0') as any,
        ip: '127.0.0.1',
      };

      (prisma.wallet.findFirst as jest.Mock).mockResolvedValue(mockWallet);
      (checkWalletLimits as jest.Mock).mockResolvedValue({ allowed: true, message: 'Within limits' });
      (prisma.transaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (prisma.transaction.findUnique as jest.Mock).mockResolvedValue(mockTransaction);
      (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(mockTransaction);
      (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(mockTransaction);
      (createJournalEntries as jest.Mock).mockResolvedValue(true);

      await controller.createDeposit(mockReq as AuthRequest, mockRes as Response);

      const expectedTransaction = {
        id: mockTransaction.id,
        type: mockTransaction.type,
        status: mockTransaction.status,
        amount: mockTransaction.amount.toString(),
        currency: mockTransaction.currency,
        fee: mockTransaction.fee.toString(),
        netAmount: mockTransaction.netAmount.toString(),
        description: mockTransaction.description,
        referenceId: mockTransaction.referenceId,
        processedAt: mockTransaction.processedAt,
        createdAt: mockTransaction.createdAt,
        wallet: {
          id: mockTransaction.wallet.id,
          currency: mockTransaction.wallet.currency,
          balance: mockTransaction.wallet.balance.toString(),
          availableBalance: mockTransaction.wallet.availableBalance.toString(),
        },
      };

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expectedTransaction,
      });
    });

    it('should return 400 for invalid input', async () => {
      mockReq = {
        user: { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com', role: 'USER' },
        body: {
          walletId: '223e4567-e89b-12d3-a456-426614174000',
          amount: -100, // Invalid amount
          currency: 'USD',
        },
      };

      await controller.createDeposit(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
        })
      );
    });

    it('should return 401 when user is not authenticated', async () => {
      mockReq = {
        user: undefined as any,
        body: {
          walletId: '223e4567-e89b-12d3-a456-426614174000',
          amount: 100,
          currency: 'USD',
        },
      };

      await controller.createDeposit(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized',
        })
      );
    });

    it('should return 404 when wallet is not found', async () => {
      mockReq = {
        user: { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com', role: 'USER' },
        body: {
          walletId: '223e4567-e89b-12d3-a456-426614174000',
          amount: 100,
          currency: 'USD',
        },
      };

      (prisma.wallet.findFirst as jest.Mock).mockResolvedValue(null);

      await controller.createDeposit(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Not found',
        })
      );
    });

    it('should return 400 when wallet limits are exceeded', async () => {
      const mockUser = { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com', role: 'USER' };
      const mockWallet = { id: '223e4567-e89b-12d3-a456-426614174000', userId: '123e4567-e89b-12d3-a456-426614174000', currency: 'USD', isFrozen: false, availableBalance: new Decimal(1000) };

      mockReq = {
        user: mockUser,
        body: {
          walletId: '223e4567-e89b-12d3-a456-426614174000',
          amount: 100,
          currency: 'USD',
        },
      };

      (prisma.wallet.findFirst as jest.Mock).mockResolvedValue(mockWallet);
      (checkWalletLimits as jest.Mock).mockResolvedValue({ allowed: false, message: 'Daily deposit limit exceeded' });

      await controller.createDeposit(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Limit exceeded',
          message: 'Daily deposit limit exceeded',
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      const mockUser = { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com', role: 'USER' };

      mockReq = {
        user: mockUser,
        body: {
          walletId: '223e4567-e89b-12d3-a456-426614174000',
          amount: 100,
          currency: 'USD',
        },
      };

      (prisma.wallet.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      await controller.createDeposit(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error',
        })
      );
    });
  });

  describe('createWithdrawal', () => {
    it('should create a withdrawal successfully', async () => {
      const mockUser = { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com', role: 'USER' };
      const mockWallet = { id: '223e4567-e89b-12d3-a456-426614174000', userId: '123e4567-e89b-12d3-a456-426614174000', currency: 'USD', isFrozen: false, availableBalance: new Decimal(1000) };
      const mockTransaction = { 
        id: '323e4567-e89b-12d3-a456-426614174000', 
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'WITHDRAWAL',
        amount: new Decimal(50), 
        currency: 'USD', 
        status: 'PENDING',
        fee: new Decimal(0),
        netAmount: new Decimal(50),
        description: 'Test withdrawal',
        referenceId: 'REF456',
        processedAt: new Date(),
        createdAt: new Date(),
        wallet: {
          id: '223e4567-e89b-12d3-a456-426614174000',
          currency: 'USD',
          balance: new Decimal(950),
          availableBalance: new Decimal(950)
        }
      };

      mockReq = {
        user: mockUser,
        body: {
          walletId: '223e4567-e89b-12d3-a456-426614174000',
          amount: 50,
          currency: 'USD',
          referenceId: 'REF456',
        },
        get: jest.fn((header: string) => header === 'set-cookie' ? undefined : 'Mozilla/5.0') as any,
        ip: '127.0.0.1',
      };

      (prisma.wallet.findFirst as jest.Mock).mockResolvedValue(mockWallet);
      (checkWalletLimits as jest.Mock).mockResolvedValue({ allowed: true, message: 'Within limits' });
      (prisma.transaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (prisma.transaction.findUnique as jest.Mock).mockResolvedValue(mockTransaction);
      (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(mockTransaction);
      (updateWalletBalance as jest.Mock).mockResolvedValue(true);
      (createJournalEntries as jest.Mock).mockResolvedValue(true);

      await controller.createWithdrawal(mockReq as AuthRequest, mockRes as Response);

      const expectedTransaction = {
        id: mockTransaction.id,
        type: mockTransaction.type,
        status: mockTransaction.status,
        amount: mockTransaction.amount.toString(),
        currency: mockTransaction.currency,
        fee: mockTransaction.fee.toString(),
        netAmount: mockTransaction.netAmount.toString(),
        description: mockTransaction.description,
        referenceId: mockTransaction.referenceId,
        processedAt: mockTransaction.processedAt,
        createdAt: mockTransaction.createdAt,
        wallet: {
          id: mockTransaction.wallet.id,
          currency: mockTransaction.wallet.currency,
          balance: mockTransaction.wallet.balance.toString(),
          availableBalance: mockTransaction.wallet.availableBalance.toString(),
        },
      };

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expectedTransaction,
      });
    });

    it('should return 400 for insufficient balance', async () => {
      const mockUser = { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com', role: 'USER' };
      const mockWallet = { id: '223e4567-e89b-12d3-a456-426614174000', userId: '123e4567-e89b-12d3-a456-426614174000', currency: 'USD', isFrozen: false, availableBalance: new Decimal(1000) };

      mockReq = {
        user: mockUser,
        body: {
          walletId: '223e4567-e89b-12d3-a456-426614174000',
          amount: 1000,
          currency: 'USD',
        },
      };

      (prisma.wallet.findFirst as jest.Mock).mockResolvedValue(mockWallet);
      // Mock wallet with insufficient balance
      const mockWalletWithLowBalance = { 
        id: '223e4567-e89b-12d3-a456-426614174000', 
        userId: '123e4567-e89b-12d3-a456-426614174000', 
        currency: 'USD', 
        isFrozen: false, 
        availableBalance: new Decimal(50) // Less than withdrawal amount
      };
      (prisma.wallet.findFirst as jest.Mock).mockResolvedValue(mockWalletWithLowBalance);
      (checkWalletLimits as jest.Mock).mockResolvedValue({ allowed: true, message: 'Within limits' });

      await controller.createWithdrawal(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Insufficient balance',
          message: 'Available balance is insufficient for this withdrawal',
        })
      );
    });
  });

  describe('createTransfer', () => {
    it('should create a transfer successfully', async () => {
      const mockUser = { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com', role: 'USER' };
      const mockSourceWallet = { id: '223e4567-e89b-12d3-a456-426614174000', userId: '123e4567-e89b-12d3-a456-426614174000', currency: 'USD', isFrozen: false, availableBalance: new Decimal(1000) };
      const mockTargetWallet = { id: '323e4567-e89b-12d3-a456-426614174000', userId: '423e4567-e89b-12d3-a456-426614174000', currency: 'USD', isFrozen: false, availableBalance: new Decimal(500) };
      const mockTransaction = { 
        id: '523e4567-e89b-12d3-a456-426614174000', 
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'TRANSFER',
        amount: new Decimal(30), 
        currency: 'USD', 
        status: 'PENDING',
        fee: new Decimal(0),
        netAmount: new Decimal(30),
        description: 'Test transfer',
        referenceId: 'REF789',
        sourceWalletId: '223e4567-e89b-12d3-a456-426614174000',
        destinationWalletId: '323e4567-e89b-12d3-a456-426614174000',
        processedAt: new Date(),
        createdAt: new Date(),
        sourceWallet: {
          id: '223e4567-e89b-12d3-a456-426614174000',
          currency: 'USD',
          balance: new Decimal(970),
          availableBalance: new Decimal(970)
        },
        destinationWallet: {
          id: '323e4567-e89b-12d3-a456-426614174000',
          currency: 'USD',
          balance: new Decimal(530),
          availableBalance: new Decimal(530)
        }
      };

      mockReq = {
        user: mockUser,
        body: {
          sourceWalletId: '223e4567-e89b-12d3-a456-426614174000',
          destinationWalletId: '323e4567-e89b-12d3-a456-426614174000',
          amount: 30,
          currency: 'USD',
          referenceId: 'REF789',
        },
        get: jest.fn((header: string) => header === 'set-cookie' ? undefined : 'Mozilla/5.0') as any,
        ip: '127.0.0.1',
      };

      (prisma.wallet.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockSourceWallet)
        .mockResolvedValueOnce(mockTargetWallet);
      (checkWalletLimits as jest.Mock).mockResolvedValue({ allowed: true, message: 'Within limits' });
      (prisma.transaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (prisma.transaction.findUnique as jest.Mock).mockResolvedValue(mockTransaction);
      (updateWalletBalance as jest.Mock).mockResolvedValue(true);
      (createJournalEntries as jest.Mock).mockResolvedValue(true);

      await controller.createTransfer(mockReq as AuthRequest, mockRes as Response);

      const expectedTransaction = {
        id: mockTransaction.id,
        type: mockTransaction.type,
        status: mockTransaction.status,
        amount: mockTransaction.amount.toString(),
        currency: mockTransaction.currency,
        fee: mockTransaction.fee.toString(),
        netAmount: mockTransaction.netAmount.toString(),
        description: mockTransaction.description,
        referenceId: mockTransaction.referenceId,
        processedAt: mockTransaction.processedAt,
        createdAt: mockTransaction.createdAt,
        sourceWallet: mockTransaction.sourceWallet ? {
          id: mockTransaction.sourceWallet.id,
          currency: mockTransaction.sourceWallet.currency,
          balance: mockTransaction.sourceWallet.balance.toString(),
          availableBalance: mockTransaction.sourceWallet.availableBalance.toString(),
        } : null,
        destinationWallet: mockTransaction.destinationWallet ? {
          id: mockTransaction.destinationWallet.id,
          currency: mockTransaction.destinationWallet.currency,
          balance: mockTransaction.destinationWallet.balance.toString(),
          availableBalance: mockTransaction.destinationWallet.availableBalance.toString(),
        } : null,
      };

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expectedTransaction,
      });
    });

    it('should return 400 for invalid target wallet', async () => {
      const mockUser = { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com', role: 'USER' };
      const mockSourceWallet = { id: '223e4567-e89b-12d3-a456-426614174000', userId: '123e4567-e89b-12d3-a456-426614174000', currency: 'USD', isFrozen: false, availableBalance: new Decimal(1000) };

      mockReq = {
        user: mockUser,
        body: {
          sourceWalletId: '223e4567-e89b-12d3-a456-426614174000',
          destinationWalletId: '323e4567-e89b-12d3-a456-426614174000',
          amount: 30,
          currency: 'USD',
        },
      };

      (prisma.wallet.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockSourceWallet)
        .mockResolvedValueOnce(null);

      await controller.createTransfer(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Not found',
          message: 'One or both wallets not found or access denied',
        })
      );
    });
  });

  describe('getTransaction', () => {
    it('should return transaction details successfully', async () => {
      const mockUser = { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com', role: 'USER' };
      const mockTransaction = { 
        id: '323e4567-e89b-12d3-a456-426614174000', 
        userId: '123e4567-e89b-12d3-a456-426614174000', 
        amount: new Decimal(100), 
        currency: 'USD', 
        status: 'COMPLETED',
        fee: new Decimal(0),
        netAmount: new Decimal(100),
        description: 'Test transaction',
        referenceId: 'REF123',
        processedAt: new Date(),
        failedAt: null,
        failureReason: null,
        createdAt: new Date(),
        type: 'DEPOSIT',
        sourceWalletId: null,
        destinationWalletId: '223e4567-e89b-12d3-a456-426614174000',
        wallet: {
          id: '223e4567-e89b-12d3-a456-426614174000',
          currency: 'USD',
          type: 'USER'
        }
      };

      mockReq = {
        user: mockUser,
        params: { transactionId: '323e4567-e89b-12d3-a456-426614174000' },
      };

      (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(mockTransaction);

      await controller.getTransaction(mockReq as AuthRequest, mockRes as Response);

      const expectedTransaction = {
        id: mockTransaction.id,
        type: mockTransaction.type,
        status: mockTransaction.status,
        amount: mockTransaction.amount.toString(),
        currency: mockTransaction.currency,
        fee: mockTransaction.fee.toString(),
        netAmount: mockTransaction.netAmount.toString(),
        description: mockTransaction.description,
        referenceId: mockTransaction.referenceId,
        sourceWalletId: mockTransaction.sourceWalletId,
        destinationWalletId: mockTransaction.destinationWalletId,
        processedAt: mockTransaction.processedAt,
        failedAt: mockTransaction.failedAt,
        failureReason: mockTransaction.failureReason,
        createdAt: mockTransaction.createdAt,
        wallet: mockTransaction.wallet,
      };

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expectedTransaction,
      });
    });

    it('should return 404 when transaction is not found', async () => {
      const mockUser = { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com', role: 'USER' };

      mockReq = {
        user: mockUser,
        params: { transactionId: '323e4567-e89b-12d3-a456-426614174000' },
      };

      (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(null);

      await controller.getTransaction(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Not found',
          message: 'Transaction not found or access denied',
        })
      );
    });

    it('should return 404 when transaction belongs to different user', async () => {
      const mockUser = { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com', role: 'USER' };
      
      // The controller filters by userId, so it will return null for a different user's transaction
      mockReq = {
        user: mockUser,
        params: { transactionId: '323e4567-e89b-12d3-a456-426614174000' },
      };

      (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(null);

      await controller.getTransaction(mockReq as AuthRequest, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Not found',
        message: 'Transaction not found or access denied',
      });
    });
  });

  describe('getTransactions', () => {
    it('should return paginated transactions successfully', async () => {
      const mockUser = { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com', role: 'USER' };
      const mockTransactions = [
        { 
          id: '323e4567-e89b-12d3-a456-426614174001', 
          userId: '123e4567-e89b-12d3-a456-426614174000', 
          amount: new Decimal(100), 
          currency: 'USD', 
          status: 'COMPLETED',
          fee: new Decimal(0),
          netAmount: new Decimal(100),
          description: 'Transaction 1',
          referenceId: 'REF001',
          processedAt: new Date(),
          failedAt: null,
          failureReason: null,
          createdAt: new Date(),
          type: 'DEPOSIT',
          sourceWalletId: null,
          destinationWalletId: '223e4567-e89b-12d3-a456-426614174000',
          wallet: {
            id: '223e4567-e89b-12d3-a456-426614174000',
            currency: 'USD',
            type: 'USER'
          }
        },
        { 
          id: '323e4567-e89b-12d3-a456-426614174002', 
          userId: '123e4567-e89b-12d3-a456-426614174000', 
          amount: new Decimal(50), 
          currency: 'USD', 
          status: 'COMPLETED',
          fee: new Decimal(0),
          netAmount: new Decimal(50),
          description: 'Transaction 2',
          referenceId: 'REF002',
          processedAt: new Date(),
          failedAt: null,
          failureReason: null,
          createdAt: new Date(),
          type: 'WITHDRAWAL',
          sourceWalletId: '223e4567-e89b-12d3-a456-426614174000',
          destinationWalletId: null,
          wallet: {
            id: '223e4567-e89b-12d3-a456-426614174000',
            currency: 'USD',
            type: 'USER'
          }
        },
      ];
      const mockTotal = 2;

      mockReq = {
        user: mockUser,
        query: {
          page: '1',
          limit: '10',
          status: 'COMPLETED',
          type: 'DEPOSIT',
        },
      };

      (prisma.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);
      (prisma.transaction.count as jest.Mock).mockResolvedValue(mockTotal);

      await controller.getTransactions(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          transactions: mockTransactions.map((t: any) => ({
            id: t.id,
            type: t.type,
            status: t.status,
            amount: t.amount.toString(),
            currency: t.currency,
            fee: t.fee.toString(),
            netAmount: t.netAmount.toString(),
            description: t.description,
            referenceId: t.referenceId,
            sourceWalletId: t.sourceWalletId,
            destinationWalletId: t.destinationWalletId,
            processedAt: t.processedAt,
            failedAt: t.failedAt,
            failureReason: t.failureReason,
            createdAt: t.createdAt,
            wallet: t.wallet,
            sourceWallet: t.sourceWallet,
            destinationWallet: t.destinationWallet,
          })),
          pagination: {
            page: 1,
            limit: 10,
            total: mockTotal,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        },
      });
    });

    it('should return empty array when no transactions found', async () => {
      const mockUser = { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com', role: 'USER' };

      mockReq = {
        user: mockUser,
        query: {
          page: '1',
          limit: '10',
        },
      };

      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.transaction.count as jest.Mock).mockResolvedValue(0);

      await controller.getTransactions(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          transactions: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com', role: 'USER' };

      mockReq = {
        user: mockUser,
        query: {
          page: '1',
          limit: '10',
        },
      };

      (prisma.transaction.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await controller.getTransactions(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error',
        })
      );
    });
  });
});