// ============================================================
// Security Deposit Service Tests
// Comprehensive tests for Layer 1: Anti-Scam
// ============================================================

import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { SecurityDepositService } from '../security-deposit.service';
import { DepositSource, DepositStatus } from '../../types/enums';
import {
  SecurityDepositNotFoundError,
  InsufficientSecurityDepositError,
} from '../../errors/ExchangeErrors';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    securityDeposit: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe('SecurityDepositService', () => {
  let service: SecurityDepositService;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
    service = new SecurityDepositService(mockPrisma);
  });

  // ============================================================
  // 1. GET DEPOSIT TESTS
  // ============================================================

  describe('getDeposit', () => {
    it('should return deposit when found', async () => {
      const mockDeposit = {
        id: 1,
        userId: 123,
        amount: new Decimal(100),
        currency: 'USD',
        source: DepositSource.WALLET,
        status: DepositStatus.ACTIVE,
        frozenAmount: new Decimal(0),
        frozenReason: null,
        frozenAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.securityDeposit.findUnique.mockResolvedValue(mockDeposit);

      const result = await service.getDeposit(123, 'USD');

      expect(result.userId).toBe(123);
      expect(result.amount.toString()).toBe('100');
      expect(result.currency).toBe('USD');
      expect(mockPrisma.securityDeposit.findUnique).toHaveBeenCalledWith({
        where: {
          userId_currency: {
            userId: 123,
            currency: 'USD',
          },
        },
      });
    });

    it('should throw SecurityDepositNotFoundError when not found', async () => {
      mockPrisma.securityDeposit.findUnique.mockResolvedValue(null);

      await expect(service.getDeposit(123, 'USD')).rejects.toThrow(
        SecurityDepositNotFoundError
      );
    });
  });

  // ============================================================
  // 2. CREATE DEPOSIT TESTS
  // ============================================================

  describe('createDeposit', () => {
    it('should create new deposit', async () => {
      mockPrisma.securityDeposit.findUnique.mockResolvedValue(null);

      const mockDeposit = {
        id: 1,
        userId: 123,
        amount: new Decimal(50),
        currency: 'USD',
        source: DepositSource.WALLET,
        status: DepositStatus.ACTIVE,
        frozenAmount: new Decimal(0),
        frozenReason: null,
        frozenAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.securityDeposit.create.mockResolvedValue(mockDeposit);

      const result = await service.createDeposit(
        123,
        new Decimal(50),
        DepositSource.WALLET
      );

      expect(result.userId).toBe(123);
      expect(result.amount.toString()).toBe('50');
      expect(result.source).toBe(DepositSource.WALLET);
      expect(mockPrisma.securityDeposit.create).toHaveBeenCalledWith({
        data: {
          userId: 123,
          amount: new Decimal(50),
          currency: 'USD',
          source: DepositSource.WALLET,
          status: DepositStatus.ACTIVE,
          frozenAmount: new Decimal(0),
        },
      });
    });

    it('should add to existing deposit if already exists', async () => {
      const mockExistingDeposit = {
        id: 1,
        userId: 123,
        amount: new Decimal(100),
        currency: 'USD',
        source: DepositSource.WALLET,
        status: DepositStatus.ACTIVE,
        frozenAmount: new Decimal(0),
        frozenReason: null,
        frozenAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.securityDeposit.findUnique.mockResolvedValue(mockExistingDeposit);
      mockPrisma.securityDeposit.update.mockResolvedValue({
        ...mockExistingDeposit,
        amount: new Decimal(150),
      });

      await service.createDeposit(123, new Decimal(50), DepositSource.CARD);

      expect(mockPrisma.securityDeposit.update).toHaveBeenCalled();
      expect(mockPrisma.securityDeposit.create).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // 3. ADD TO DEPOSIT TESTS
  // ============================================================

  describe('addToDeposit', () => {
    it('should add amount to existing deposit', async () => {
      mockPrisma.securityDeposit.update.mockResolvedValue({});

      await service.addToDeposit(123, new Decimal(50), DepositSource.BANK);

      expect(mockPrisma.securityDeposit.update).toHaveBeenCalledWith({
        where: {
          userId_currency: {
            userId: 123,
            currency: 'USD',
          },
        },
        data: {
          amount: {
            increment: new Decimal(50),
          },
          source: DepositSource.BANK,
        },
      });
    });
  });

  // ============================================================
  // 4. FREEZE DEPOSIT TESTS
  // ============================================================

  describe('freezeDeposit', () => {
    it('should freeze deposit amount', async () => {
      const mockDeposit = {
        id: 1,
        userId: 123,
        amount: new Decimal(100),
        currency: 'USD',
        source: DepositSource.WALLET,
        status: DepositStatus.ACTIVE,
        frozenAmount: new Decimal(0),
        frozenReason: null,
        frozenAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.securityDeposit.findUnique.mockResolvedValue(mockDeposit);
      mockPrisma.securityDeposit.update.mockResolvedValue({});

      await service.freezeDeposit(123, new Decimal(30), 'Active exchange');

      expect(mockPrisma.securityDeposit.update).toHaveBeenCalledWith({
        where: {
          userId_currency: {
            userId: 123,
            currency: 'USD',
          },
        },
        data: {
          frozenAmount: {
            increment: new Decimal(30),
          },
          frozenReason: 'Active exchange',
          frozenAt: expect.any(Date),
          status: DepositStatus.FROZEN,
        },
      });
    });

    it('should reject freeze when insufficient available amount', async () => {
      const mockDeposit = {
        id: 1,
        userId: 123,
        amount: new Decimal(100),
        currency: 'USD',
        source: DepositSource.WALLET,
        status: DepositStatus.ACTIVE,
        frozenAmount: new Decimal(80),
        frozenReason: 'Previous freeze',
        frozenAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.securityDeposit.findUnique.mockResolvedValue(mockDeposit);

      await expect(
        service.freezeDeposit(123, new Decimal(50), 'New exchange')
      ).rejects.toThrow(InsufficientSecurityDepositError);
    });

    it('should allow multiple freezes within available amount', async () => {
      const mockDeposit = {
        id: 1,
        userId: 123,
        amount: new Decimal(100),
        currency: 'USD',
        source: DepositSource.WALLET,
        status: DepositStatus.ACTIVE,
        frozenAmount: new Decimal(30),
        frozenReason: 'Previous freeze',
        frozenAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.securityDeposit.findUnique.mockResolvedValue(mockDeposit);
      mockPrisma.securityDeposit.update.mockResolvedValue({});

      await service.freezeDeposit(123, new Decimal(40), 'Second exchange');

      expect(mockPrisma.securityDeposit.update).toHaveBeenCalled();
    });
  });

  // ============================================================
  // 5. UNFREEZE DEPOSIT TESTS
  // ============================================================

  describe('unfreezeDeposit', () => {
    it('should unfreeze deposit amount', async () => {
      const mockDeposit = {
        id: 1,
        userId: 123,
        amount: new Decimal(100),
        currency: 'USD',
        source: DepositSource.WALLET,
        status: DepositStatus.FROZEN,
        frozenAmount: new Decimal(50),
        frozenReason: 'Active exchange',
        frozenAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.securityDeposit.findUnique.mockResolvedValue(mockDeposit);
      mockPrisma.securityDeposit.update.mockResolvedValue({});

      await service.unfreezeDeposit(123, new Decimal(30));

      expect(mockPrisma.securityDeposit.update).toHaveBeenCalledWith({
        where: {
          userId_currency: {
            userId: 123,
            currency: 'USD',
          },
        },
        data: {
          frozenAmount: new Decimal(20),
          status: DepositStatus.FROZEN,
          frozenReason: undefined,
          frozenAt: undefined,
        },
      });
    });

    it('should set status to ACTIVE when fully unfrozen', async () => {
      const mockDeposit = {
        id: 1,
        userId: 123,
        amount: new Decimal(100),
        currency: 'USD',
        source: DepositSource.WALLET,
        status: DepositStatus.FROZEN,
        frozenAmount: new Decimal(50),
        frozenReason: 'Active exchange',
        frozenAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.securityDeposit.findUnique.mockResolvedValue(mockDeposit);
      mockPrisma.securityDeposit.update.mockResolvedValue({});

      await service.unfreezeDeposit(123, new Decimal(50));

      expect(mockPrisma.securityDeposit.update).toHaveBeenCalledWith({
        where: {
          userId_currency: {
            userId: 123,
            currency: 'USD',
          },
        },
        data: {
          frozenAmount: new Decimal(0),
          status: DepositStatus.ACTIVE,
          frozenReason: null,
          frozenAt: null,
        },
      });
    });

    it('should reject unfreeze exceeding frozen amount', async () => {
      const mockDeposit = {
        id: 1,
        userId: 123,
        amount: new Decimal(100),
        currency: 'USD',
        source: DepositSource.WALLET,
        status: DepositStatus.FROZEN,
        frozenAmount: new Decimal(30),
        frozenReason: 'Active exchange',
        frozenAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.securityDeposit.findUnique.mockResolvedValue(mockDeposit);

      await expect(service.unfreezeDeposit(123, new Decimal(50))).rejects.toThrow(
        'Cannot unfreeze more than frozen amount'
      );
    });
  });

  // ============================================================
  // 6. DEDUCT DEPOSIT TESTS
  // ============================================================

  describe('deductDeposit', () => {
    it('should deduct amount from deposit', async () => {
      const mockDeposit = {
        id: 1,
        userId: 123,
        amount: new Decimal(100),
        currency: 'USD',
        source: DepositSource.WALLET,
        status: DepositStatus.ACTIVE,
        frozenAmount: new Decimal(0),
        frozenReason: null,
        frozenAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.securityDeposit.findUnique.mockResolvedValue(mockDeposit);
      mockPrisma.securityDeposit.update.mockResolvedValue({});

      await service.deductDeposit(123, new Decimal(30), 'Compensation for dispute');

      expect(mockPrisma.securityDeposit.update).toHaveBeenCalledWith({
        where: {
          userId_currency: {
            userId: 123,
            currency: 'USD',
          },
        },
        data: {
          amount: {
            decrement: new Decimal(30),
          },
          frozenAmount: undefined,
          status: DepositStatus.DEDUCTED,
        },
      });
    });

    it('should deduct from frozen amount if present', async () => {
      const mockDeposit = {
        id: 1,
        userId: 123,
        amount: new Decimal(100),
        currency: 'USD',
        source: DepositSource.WALLET,
        status: DepositStatus.FROZEN,
        frozenAmount: new Decimal(50),
        frozenReason: 'Active exchange',
        frozenAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.securityDeposit.findUnique.mockResolvedValue(mockDeposit);
      mockPrisma.securityDeposit.update.mockResolvedValue({});

      await service.deductDeposit(123, new Decimal(30), 'Penalty');

      expect(mockPrisma.securityDeposit.update).toHaveBeenCalledWith({
        where: {
          userId_currency: {
            userId: 123,
            currency: 'USD',
          },
        },
        data: {
          amount: {
            decrement: new Decimal(30),
          },
          frozenAmount: {
            decrement: new Decimal(30),
          },
          status: DepositStatus.DEDUCTED,
        },
      });
    });

    it('should reject deduction exceeding total amount', async () => {
      const mockDeposit = {
        id: 1,
        userId: 123,
        amount: new Decimal(50),
        currency: 'USD',
        source: DepositSource.WALLET,
        status: DepositStatus.ACTIVE,
        frozenAmount: new Decimal(0),
        frozenReason: null,
        frozenAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.securityDeposit.findUnique.mockResolvedValue(mockDeposit);

      await expect(
        service.deductDeposit(123, new Decimal(100), 'Penalty')
      ).rejects.toThrow(InsufficientSecurityDepositError);
    });
  });

  // ============================================================
  // 7. HAS SUFFICIENT DEPOSIT TESTS
  // ============================================================

  describe('hasSufficientDeposit', () => {
    it('should return true when sufficient available amount', async () => {
      const mockDeposit = {
        id: 1,
        userId: 123,
        amount: new Decimal(100),
        currency: 'USD',
        source: DepositSource.WALLET,
        status: DepositStatus.ACTIVE,
        frozenAmount: new Decimal(30),
        frozenReason: null,
        frozenAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.securityDeposit.findUnique.mockResolvedValue(mockDeposit);

      const result = await service.hasSufficientDeposit(123, new Decimal(50));

      expect(result).toBe(true);
    });

    it('should return false when insufficient available amount', async () => {
      const mockDeposit = {
        id: 1,
        userId: 123,
        amount: new Decimal(100),
        currency: 'USD',
        source: DepositSource.WALLET,
        status: DepositStatus.ACTIVE,
        frozenAmount: new Decimal(80),
        frozenReason: 'Active exchange',
        frozenAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.securityDeposit.findUnique.mockResolvedValue(mockDeposit);

      const result = await service.hasSufficientDeposit(123, new Decimal(50));

      expect(result).toBe(false);
    });

    it('should return false when deposit is frozen', async () => {
      const mockDeposit = {
        id: 1,
        userId: 123,
        amount: new Decimal(100),
        currency: 'USD',
        source: DepositSource.WALLET,
        status: DepositStatus.FROZEN,
        frozenAmount: new Decimal(100),
        frozenReason: 'Account review',
        frozenAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.securityDeposit.findUnique.mockResolvedValue(mockDeposit);

      const result = await service.hasSufficientDeposit(123, new Decimal(10));

      expect(result).toBe(false);
    });

    it('should return false when deposit not found', async () => {
      mockPrisma.securityDeposit.findUnique.mockResolvedValue(null);

      const result = await service.hasSufficientDeposit(123, new Decimal(50));

      expect(result).toBe(false);
    });

    it('should handle exact available amount', async () => {
      const mockDeposit = {
        id: 1,
        userId: 123,
        amount: new Decimal(100),
        currency: 'USD',
        source: DepositSource.WALLET,
        status: DepositStatus.ACTIVE,
        frozenAmount: new Decimal(50),
        frozenReason: null,
        frozenAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.securityDeposit.findUnique.mockResolvedValue(mockDeposit);

      const result = await service.hasSufficientDeposit(123, new Decimal(50));

      expect(result).toBe(true);
    });
  });
});
