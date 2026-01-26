import { ArbitrationGuard } from '../ArbitrationGuard';

describe('ArbitrationGuard', () => {
  let guard: ArbitrationGuard;

  beforeEach(() => {
    guard = new ArbitrationGuard();
    jest.clearAllMocks();
  });

  describe('createDispute', () => {
    it('should create dispute with valid input', async () => {
      const matchId = 1;
      const filedBy = 1;
      const reason = 'Payment not received after 24 hours';
      const evidence = ['https://example.com/proof1.jpg'];

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const disputeId = await guard.createDispute(matchId, filedBy, reason, evidence);

      expect(disputeId).toBeDefined();
      expect(typeof disputeId).toBe('number');
      expect(consoleSpy).toHaveBeenCalledWith(
        'DISPUTE_CREATED',
        expect.objectContaining({
          matchId,
          filedBy,
          reason,
          evidence,
        })
      );

      consoleSpy.mockRestore();
    });

    it('should throw error when reason is too short', async () => {
      const matchId = 1;
      const filedBy = 1;
      const reason = 'Too short';

      await expect(guard.createDispute(matchId, filedBy, reason)).rejects.toThrow(
        'Dispute reason must be at least 20 characters'
      );
    });

    it('should throw error when reason is empty', async () => {
      const matchId = 1;
      const filedBy = 1;
      const reason = '';

      await expect(guard.createDispute(matchId, filedBy, reason)).rejects.toThrow(
        'Dispute reason must be at least 20 characters'
      );
    });

    it('should freeze deposits on dispute creation', async () => {
      const matchId = 1;
      const filedBy = 1;
      const reason = 'Payment not received after 24 hours';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await guard.createDispute(matchId, filedBy, reason);

      expect(consoleSpy).toHaveBeenCalledWith(
        'DEPOSITS_FROZEN_FOR_DISPUTE',
        expect.objectContaining({
          matchId,
        })
      );

      consoleSpy.mockRestore();
    });

    it('should notify admins on dispute creation', async () => {
      const matchId = 1;
      const filedBy = 1;
      const reason = 'Payment not received after 24 hours';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await guard.createDispute(matchId, filedBy, reason);

      expect(consoleSpy).toHaveBeenCalledWith(
        'ADMIN_NOTIFICATION_SENT',
        expect.objectContaining({
          type: 'DISPUTE_CREATED',
          matchId,
          reason,
          priority: 'HIGH',
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('resolveDispute', () => {
    it('should resolve dispute and enforce resolution', async () => {
      const disputeId = 1;
      const winnerId = 1;
      const loserId = 2;
      const resolution = 'Winner provided valid proof of payment';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await guard.resolveDispute(disputeId, winnerId, loserId, resolution);

      expect(consoleSpy).toHaveBeenCalledWith(
        'DISPUTE_RESOLVED',
        expect.objectContaining({
          disputeId,
          winnerId,
          loserId,
          resolution,
        })
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'RESOLUTION_ENFORCED',
        expect.objectContaining({
          disputeId,
          winnerId,
          loserId,
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('freezeDepositsOnDispute', () => {
    it('should freeze deposits and log event', async () => {
      const matchId = 1;

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await guard.freezeDepositsOnDispute(matchId);

      expect(consoleSpy).toHaveBeenCalledWith(
        'DEPOSITS_FROZEN_FOR_DISPUTE',
        expect.objectContaining({
          matchId,
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('notifyAdmins', () => {
    it('should send admin notification', async () => {
      const disputeId = 1;
      const matchId = 1;
      const reason = 'Payment not received';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await guard.notifyAdmins(disputeId, matchId, reason);

      expect(consoleSpy).toHaveBeenCalledWith(
        'ADMIN_NOTIFICATION_SENT',
        expect.objectContaining({
          type: 'DISPUTE_CREATED',
          disputeId,
          matchId,
          reason,
          priority: 'HIGH',
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('enforceResolution', () => {
    it('should enforce resolution and log event', async () => {
      const disputeId = 1;
      const winnerId = 1;
      const loserId = 2;

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await guard.enforceResolution(disputeId, winnerId, loserId);

      expect(consoleSpy).toHaveBeenCalledWith(
        'RESOLUTION_ENFORCED',
        expect.objectContaining({
          disputeId,
          winnerId,
          loserId,
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('calculateSLA', () => {
    it('should calculate SLA deadline 48 hours in future', () => {
      const now = Date.now();
      const sla = guard.calculateSLA();
      const expected = now + 48 * 60 * 60 * 1000;

      // Allow 1 second tolerance
      expect(sla.getTime()).toBeGreaterThanOrEqual(expected - 1000);
      expect(sla.getTime()).toBeLessThanOrEqual(expected + 1000);
    });
  });

  describe('isOverdue', () => {
    it('should return false for recent dispute', () => {
      const createdAt = new Date();
      const result = guard.isOverdue(createdAt);

      expect(result).toBe(false);
    });

    it('should return true for old dispute', () => {
      const createdAt = new Date(Date.now() - 50 * 60 * 60 * 1000); // 50 hours ago
      const result = guard.isOverdue(createdAt);

      expect(result).toBe(true);
    });

    it('should return false for dispute at exactly 48 hours', () => {
      const createdAt = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const result = guard.isOverdue(createdAt);

      // Should be false or very close to boundary
      expect(result).toBe(false);
    });
  });

  describe('getRemainingTime', () => {
    it('should return remaining time for recent dispute', () => {
      const createdAt = new Date();
      const remaining = guard.getRemainingTime(createdAt);

      // Should be close to 48 hours
      expect(remaining).toBeGreaterThan(47 * 60 * 60 * 1000);
      expect(remaining).toBeLessThanOrEqual(48 * 60 * 60 * 1000);
    });

    it('should return 0 for overdue dispute', () => {
      const createdAt = new Date(Date.now() - 50 * 60 * 60 * 1000);
      const remaining = guard.getRemainingTime(createdAt);

      expect(remaining).toBe(0);
    });
  });

  describe('escalateDispute', () => {
    it('should escalate dispute and log event', async () => {
      const disputeId = 1;

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await guard.escalateDispute(disputeId);

      expect(consoleSpy).toHaveBeenCalledWith(
        'DISPUTE_ESCALATED',
        expect.objectContaining({
          disputeId,
          reason: 'SLA exceeded',
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('autoResolve', () => {
    it('should auto-resolve dispute and log event', async () => {
      const disputeId = 1;
      const winnerId = 1;
      const reason = 'Communication policy violation';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await guard.autoResolve(disputeId, winnerId, reason);

      expect(consoleSpy).toHaveBeenCalledWith(
        'DISPUTE_AUTO_RESOLVED',
        expect.objectContaining({
          disputeId,
          winnerId,
          reason,
        })
      );

      consoleSpy.mockRestore();
    });
  });
});
