import { Decimal } from '@prisma/client/runtime/library';
import { SecurityDepositGuard } from '../SecurityDepositGuard';
import { SecurityDepositService } from '../../services/security-deposit.service';
import { InsufficientSecurityDepositError } from '../../errors/ExchangeErrors';

// Mock the service
jest.mock('../../services/security-deposit.service');

describe('SecurityDepositGuard', () => {
  let guard: SecurityDepositGuard;
  let mockService: jest.Mocked<SecurityDepositService>;

  beforeEach(() => {
    mockService = new SecurityDepositService(null as any) as jest.Mocked<SecurityDepositService>;
    guard = new SecurityDepositGuard(mockService);
    jest.clearAllMocks();
  });

  describe('validateDeposit', () => {
    it('should pass validation when deposit is sufficient', async () => {
      const userId = 1;
      const transactionAmount = new Decimal(1000);
      const currency = 'USD';

      mockService.getDeposit = jest.fn().mockResolvedValue({
        userId,
        currency,
        amount: new Decimal(200), // 20% deposit
        frozenAmount: new Decimal(0),
      });

      await expect(guard.validateDeposit(userId, transactionAmount, currency)).resolves.not.toThrow();
    });

    it('should throw error when deposit is insufficient', async () => {
      const userId = 1;
      const transactionAmount = new Decimal(1000);
      const currency = 'USD';

      mockService.getDeposit = jest.fn().mockResolvedValue({
        userId,
        currency,
        amount: new Decimal(50), // Only 5% deposit
        frozenAmount: new Decimal(0),
      });

      await expect(guard.validateDeposit(userId, transactionAmount, currency)).rejects.toThrow(
        InsufficientSecurityDepositError
      );
    });

    it('should account for frozen amounts', async () => {
      const userId = 1;
      const transactionAmount = new Decimal(1000);
      const currency = 'USD';

      mockService.getDeposit = jest.fn().mockResolvedValue({
        userId,
        currency,
        amount: new Decimal(200),
        frozenAmount: new Decimal(150), // Most is frozen
      });

      await expect(guard.validateDeposit(userId, transactionAmount, currency)).rejects.toThrow(
        InsufficientSecurityDepositError
      );
    });

    it('should use USD as default currency', async () => {
      const userId = 1;
      const transactionAmount = new Decimal(1000);

      mockService.getDeposit = jest.fn().mockResolvedValue({
        userId,
        currency: 'USD',
        amount: new Decimal(200),
        frozenAmount: new Decimal(0),
      });

      await guard.validateDeposit(userId, transactionAmount);

      expect(mockService.getDeposit).toHaveBeenCalledWith(userId, 'USD');
    });
  });

  describe('freezeOnSuspicion', () => {
    it('should freeze deposit and log event', async () => {
      const userId = 1;
      const amount = new Decimal(100);
      const reason = 'Suspicious activity detected';
      const currency = 'USD';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockService.freezeDeposit = jest.fn().mockResolvedValue(undefined);

      await guard.freezeOnSuspicion(userId, amount, reason, currency);

      expect(mockService.freezeDeposit).toHaveBeenCalledWith(userId, amount, reason);
      expect(consoleSpy).toHaveBeenCalledWith(
        'SECURITY_DEPOSIT_FROZEN',
        expect.objectContaining({
          userId,
          amount: amount.toString(),
          currency,
          reason,
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('deductForCompensation', () => {
    it('should deduct from scammer and log event', async () => {
      const scammerId = 1;
      const victimId = 2;
      const amount = new Decimal(100);
      const currency = 'USD';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockService.deductDeposit = jest.fn().mockResolvedValue(undefined);

      await guard.deductForCompensation(scammerId, victimId, amount, currency);

      expect(mockService.deductDeposit).toHaveBeenCalledWith(
        scammerId,
        amount,
        `Scam compensation for user ${victimId}`
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'SECURITY_DEPOSIT_DEDUCTED',
        expect.objectContaining({
          scammerId,
          victimId,
          amount: amount.toString(),
          currency,
          reason: 'Scam compensation',
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('unfreezeDeposit', () => {
    it('should unfreeze deposit and log event', async () => {
      const userId = 1;
      const amount = new Decimal(100);
      const currency = 'USD';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockService.unfreezeDeposit = jest.fn().mockResolvedValue(undefined);

      await guard.unfreezeDeposit(userId, amount, currency);

      expect(mockService.unfreezeDeposit).toHaveBeenCalledWith(userId, amount);
      expect(consoleSpy).toHaveBeenCalledWith(
        'SECURITY_DEPOSIT_UNFROZEN',
        expect.objectContaining({
          userId,
          amount: amount.toString(),
          currency,
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getRequiredDeposit', () => {
    it('should calculate 10% of transaction amount', () => {
      const transactionAmount = new Decimal(1000);
      const required = guard.getRequiredDeposit(transactionAmount);

      expect(required.toString()).toBe('100');
    });

    it('should handle decimal amounts correctly', () => {
      const transactionAmount = new Decimal(1234.56);
      const required = guard.getRequiredDeposit(transactionAmount);

      expect(required.toString()).toBe('123.456');
    });
  });

  describe('hasSufficientDeposit', () => {
    it('should return true when deposit is sufficient', async () => {
      const userId = 1;
      const transactionAmount = new Decimal(1000);

      mockService.getDeposit = jest.fn().mockResolvedValue({
        userId,
        currency: 'USD',
        amount: new Decimal(200),
        frozenAmount: new Decimal(0),
      });

      const result = await guard.hasSufficientDeposit(userId, transactionAmount);

      expect(result).toBe(true);
    });

    it('should return false when deposit is insufficient', async () => {
      const userId = 1;
      const transactionAmount = new Decimal(1000);

      mockService.getDeposit = jest.fn().mockResolvedValue({
        userId,
        currency: 'USD',
        amount: new Decimal(50),
        frozenAmount: new Decimal(0),
      });

      const result = await guard.hasSufficientDeposit(userId, transactionAmount);

      expect(result).toBe(false);
    });

    it('should rethrow non-InsufficientSecurityDepositError errors', async () => {
      const userId = 1;
      const transactionAmount = new Decimal(1000);

      mockService.getDeposit = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(guard.hasSufficientDeposit(userId, transactionAmount)).rejects.toThrow(
        'Database error'
      );
    });
  });
});
