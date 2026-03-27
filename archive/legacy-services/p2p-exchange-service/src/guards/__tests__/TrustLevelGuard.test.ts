import { Decimal } from '@prisma/client/runtime/library';
import { TrustLevelGuard, TRUST_LEVELS } from '../TrustLevelGuard';
import { TrustLevelService } from '../../services/trust-level.service';
import { ExceedsTransactionLimitError } from '../../errors/ExchangeErrors';

// Mock the service
jest.mock('../../services/trust-level.service');

describe('TrustLevelGuard', () => {
  let guard: TrustLevelGuard;
  let mockService: jest.Mocked<TrustLevelService>;

  beforeEach(() => {
    mockService = new TrustLevelService(null as any) as jest.Mocked<TrustLevelService>;
    guard = new TrustLevelGuard(mockService);
    jest.clearAllMocks();
  });

  describe('validateTransactionAmount', () => {
    it('should pass validation when amount is within limit', async () => {
      const userId = 1;
      const amount = new Decimal(50);

      mockService.getTrustLevel = jest.fn().mockResolvedValue({
        userId,
        level: 1,
        maxTransactionAmount: new Decimal(100),
        successfulExchanges: 0,
        totalVolume: new Decimal(0),
        timeoutCount: 0,
      });

      await expect(guard.validateTransactionAmount(userId, amount)).resolves.not.toThrow();
    });

    it('should throw error when amount exceeds limit', async () => {
      const userId = 1;
      const amount = new Decimal(200);

      mockService.getTrustLevel = jest.fn().mockResolvedValue({
        userId,
        level: 1,
        maxTransactionAmount: new Decimal(100),
        successfulExchanges: 0,
        totalVolume: new Decimal(0),
        timeoutCount: 0,
      });

      await expect(guard.validateTransactionAmount(userId, amount)).rejects.toThrow(
        ExceedsTransactionLimitError
      );
    });

    it('should allow exact limit amount', async () => {
      const userId = 1;
      const amount = new Decimal(100);

      mockService.getTrustLevel = jest.fn().mockResolvedValue({
        userId,
        level: 1,
        maxTransactionAmount: new Decimal(100),
        successfulExchanges: 0,
        totalVolume: new Decimal(0),
        timeoutCount: 0,
      });

      await expect(guard.validateTransactionAmount(userId, amount)).resolves.not.toThrow();
    });
  });

  describe('updateAfterSuccess', () => {
    it('should update trust level after successful exchange', async () => {
      const userId = 1;
      const amount = new Decimal(100);

      mockService.updateAfterExchange = jest.fn().mockResolvedValue(undefined);
      mockService.getTrustLevel = jest.fn().mockResolvedValue({
        userId,
        level: 1,
        maxTransactionAmount: new Decimal(100),
        successfulExchanges: 3,
        totalVolume: new Decimal(300),
        timeoutCount: 0,
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await guard.updateAfterSuccess(userId, amount);

      expect(mockService.updateAfterExchange).toHaveBeenCalledWith(userId, amount);

      consoleSpy.mockRestore();
    });

    it('should log level up when requirements are met', async () => {
      const userId = 1;
      const amount = new Decimal(100);

      mockService.updateAfterExchange = jest.fn().mockResolvedValue(undefined);
      mockService.getTrustLevel = jest.fn().mockResolvedValue({
        userId,
        level: 1,
        maxTransactionAmount: new Decimal(100),
        successfulExchanges: 5, // Meets level 2 requirement
        totalVolume: new Decimal(500), // Meets level 2 requirement
        timeoutCount: 0,
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await guard.updateAfterSuccess(userId, amount);

      expect(consoleSpy).toHaveBeenCalledWith(
        'TRUST_LEVEL_UP',
        expect.objectContaining({
          userId,
          oldLevel: 1,
          newLevel: 2,
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('downgradeLevel', () => {
    it('should downgrade trust level and log event', async () => {
      const userId = 1;
      const reason: 'dispute' | 'timeout' = 'dispute';

      mockService.downgradeLevel = jest.fn().mockResolvedValue(undefined);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await guard.downgradeLevel(userId, reason);

      expect(mockService.downgradeLevel).toHaveBeenCalledWith(userId, reason);
      expect(consoleSpy).toHaveBeenCalledWith(
        'TRUST_LEVEL_DOWNGRADE',
        expect.objectContaining({
          userId,
          reason,
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getMaxTransactionAmount', () => {
    it('should return max transaction amount for user', async () => {
      const userId = 1;

      mockService.getTrustLevel = jest.fn().mockResolvedValue({
        userId,
        level: 2,
        maxTransactionAmount: new Decimal(500),
        successfulExchanges: 10,
        totalVolume: new Decimal(1000),
        timeoutCount: 0,
      });

      const maxAmount = await guard.getMaxTransactionAmount(userId);

      expect(maxAmount.toString()).toBe('500');
    });
  });

  describe('getNextLevelRequirements', () => {
    it('should return requirements for next level', async () => {
      const userId = 1;

      mockService.getTrustLevel = jest.fn().mockResolvedValue({
        userId,
        level: 1,
        maxTransactionAmount: new Decimal(100),
        successfulExchanges: 2,
        totalVolume: new Decimal(200),
        timeoutCount: 0,
      });

      const requirements = await guard.getNextLevelRequirements(userId);

      expect(requirements).toEqual({
        level: 2,
        exchangesNeeded: 3, // 5 required - 2 current
        volumeNeeded: new Decimal(300), // 500 required - 200 current
      });
    });

    it('should return null when at max level', async () => {
      const userId = 1;

      mockService.getTrustLevel = jest.fn().mockResolvedValue({
        userId,
        level: 5,
        maxTransactionAmount: new Decimal(50000),
        successfulExchanges: 500,
        totalVolume: new Decimal(500000),
        timeoutCount: 0,
      });

      const requirements = await guard.getNextLevelRequirements(userId);

      expect(requirements).toBeNull();
    });
  });

  describe('canPerformExchange', () => {
    it('should return true when exchange is allowed', async () => {
      const userId = 1;
      const amount = new Decimal(50);

      mockService.getTrustLevel = jest.fn().mockResolvedValue({
        userId,
        level: 1,
        maxTransactionAmount: new Decimal(100),
        successfulExchanges: 0,
        totalVolume: new Decimal(0),
        timeoutCount: 0,
      });

      const result = await guard.canPerformExchange(userId, amount);

      expect(result).toBe(true);
    });

    it('should return false when amount exceeds limit', async () => {
      const userId = 1;
      const amount = new Decimal(200);

      mockService.getTrustLevel = jest.fn().mockResolvedValue({
        userId,
        level: 1,
        maxTransactionAmount: new Decimal(100),
        successfulExchanges: 0,
        totalVolume: new Decimal(0),
        timeoutCount: 0,
      });

      const result = await guard.canPerformExchange(userId, amount);

      expect(result).toBe(false);
    });
  });

  describe('getTrustLevelConfig', () => {
    it('should return config for valid level', () => {
      const config = guard.getTrustLevelConfig(1);

      expect(config).toEqual(TRUST_LEVELS[1]);
    });

    it('should return null for invalid level', () => {
      const config = guard.getTrustLevelConfig(99);

      expect(config).toBeNull();
    });
  });

  describe('recordTimeout', () => {
    it('should record timeout and log event', async () => {
      const userId = 1;
      const stage = 'PAYMENT_INITIATION';

      mockService.getTrustLevel = jest.fn().mockResolvedValue({
        userId,
        level: 1,
        maxTransactionAmount: new Decimal(100),
        successfulExchanges: 0,
        totalVolume: new Decimal(0),
        timeoutCount: 1,
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await guard.recordTimeout(userId, stage);

      expect(consoleSpy).toHaveBeenCalledWith(
        'TIMEOUT_RECORDED',
        expect.objectContaining({
          userId,
          stage,
          timeoutCount: 1,
        })
      );

      consoleSpy.mockRestore();
    });

    it('should downgrade after 3 timeouts', async () => {
      const userId = 1;
      const stage = 'PAYMENT_INITIATION';

      mockService.getTrustLevel = jest.fn().mockResolvedValue({
        userId,
        level: 2,
        maxTransactionAmount: new Decimal(500),
        successfulExchanges: 10,
        totalVolume: new Decimal(1000),
        timeoutCount: 3,
      });
      mockService.downgradeLevel = jest.fn().mockResolvedValue(undefined);

      await guard.recordTimeout(userId, stage);

      expect(mockService.downgradeLevel).toHaveBeenCalledWith(userId, 'timeout');
    });
  });
});
