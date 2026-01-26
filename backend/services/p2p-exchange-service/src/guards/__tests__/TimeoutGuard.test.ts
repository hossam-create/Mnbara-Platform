import { TimeoutGuard } from '../TimeoutGuard';

describe('TimeoutGuard', () => {
  let guard: TimeoutGuard;

  beforeEach(() => {
    guard = new TimeoutGuard();
    jest.clearAllMocks();
  });

  describe('getTimeout', () => {
    it('should return correct timeout for PAYMENT_INITIATION', () => {
      const timeout = guard.getTimeout('PAYMENT_INITIATION');
      expect(timeout).toBe(30 * 60 * 1000); // 30 minutes
    });

    it('should return correct timeout for PROOF_UPLOAD', () => {
      const timeout = guard.getTimeout('PROOF_UPLOAD');
      expect(timeout).toBe(30 * 60 * 1000); // 30 minutes
    });

    it('should return correct timeout for ADMIN_REVIEW', () => {
      const timeout = guard.getTimeout('ADMIN_REVIEW');
      expect(timeout).toBe(60 * 60 * 1000); // 60 minutes
    });

    it('should return correct timeout for CONFIRMATION', () => {
      const timeout = guard.getTimeout('CONFIRMATION');
      expect(timeout).toBe(60 * 60 * 1000); // 60 minutes
    });

    it('should return correct timeout for DISPUTE_RESPONSE', () => {
      const timeout = guard.getTimeout('DISPUTE_RESPONSE');
      expect(timeout).toBe(48 * 60 * 60 * 1000); // 48 hours
    });
  });

  describe('calculateDeadline', () => {
    it('should calculate deadline correctly', () => {
      const now = Date.now();
      const deadline = guard.calculateDeadline('PAYMENT_INITIATION');
      const expected = now + 30 * 60 * 1000;

      // Allow 1 second tolerance for test execution time
      expect(deadline.getTime()).toBeGreaterThanOrEqual(expected - 1000);
      expect(deadline.getTime()).toBeLessThanOrEqual(expected + 1000);
    });
  });

  describe('isExpired', () => {
    it('should return false for future deadline', () => {
      const deadline = new Date(Date.now() + 10000); // 10 seconds in future
      expect(guard.isExpired(deadline)).toBe(false);
    });

    it('should return true for past deadline', () => {
      const deadline = new Date(Date.now() - 10000); // 10 seconds in past
      expect(guard.isExpired(deadline)).toBe(true);
    });

    it('should return true for current time', () => {
      const deadline = new Date();
      // Small delay to ensure deadline is in the past
      setTimeout(() => {
        expect(guard.isExpired(deadline)).toBe(true);
      }, 10);
    });
  });

  describe('getRemainingTime', () => {
    it('should return remaining time for future deadline', () => {
      const deadline = new Date(Date.now() + 10000); // 10 seconds in future
      const remaining = guard.getRemainingTime(deadline);

      expect(remaining).toBeGreaterThan(9000);
      expect(remaining).toBeLessThanOrEqual(10000);
    });

    it('should return 0 for past deadline', () => {
      const deadline = new Date(Date.now() - 10000); // 10 seconds in past
      const remaining = guard.getRemainingTime(deadline);

      expect(remaining).toBe(0);
    });
  });

  describe('formatRemainingTime', () => {
    it('should format expired deadline', () => {
      const deadline = new Date(Date.now() - 10000);
      const formatted = guard.formatRemainingTime(deadline);

      expect(formatted).toBe('Expired');
    });

    it('should format minutes', () => {
      const deadline = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      const formatted = guard.formatRemainingTime(deadline);

      expect(formatted).toMatch(/14m|15m/); // Allow for test execution time
    });

    it('should format hours and minutes', () => {
      const deadline = new Date(Date.now() + 90 * 60 * 1000); // 90 minutes
      const formatted = guard.formatRemainingTime(deadline);

      expect(formatted).toMatch(/1h \d+m/);
    });

    it('should format days and hours', () => {
      const deadline = new Date(Date.now() + 36 * 60 * 60 * 1000); // 36 hours
      const formatted = guard.formatRemainingTime(deadline);

      expect(formatted).toMatch(/1d \d+h/);
    });
  });

  describe('handleTimeout', () => {
    it('should log timeout event', async () => {
      const matchId = 1;
      const stage = 'PAYMENT_INITIATION';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await guard.handleTimeout(matchId, stage);

      expect(consoleSpy).toHaveBeenCalledWith(
        'TIMEOUT_TRIGGERED',
        expect.objectContaining({
          matchId,
          stage,
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('scheduleTimeout', () => {
    it('should schedule timeout callback', (done) => {
      const matchId = 1;
      const stage = 'PAYMENT_INITIATION';
      let callbackCalled = false;

      const callback = jest.fn(async () => {
        callbackCalled = true;
      });

      // Use a very short timeout for testing
      jest.spyOn(guard, 'getTimeout').mockReturnValue(100); // 100ms

      const timeoutId = guard.scheduleTimeout(matchId, stage, callback);

      setTimeout(() => {
        expect(callbackCalled).toBe(true);
        clearTimeout(timeoutId);
        done();
      }, 200);
    });

    it('should return timeout ID', () => {
      const matchId = 1;
      const stage = 'PAYMENT_INITIATION';
      const callback = jest.fn();

      const timeoutId = guard.scheduleTimeout(matchId, stage, callback);

      expect(timeoutId).toBeDefined();
      clearTimeout(timeoutId);
    });
  });

  describe('cancelTimeout', () => {
    it('should cancel scheduled timeout', (done) => {
      const matchId = 1;
      const stage = 'PAYMENT_INITIATION';
      let callbackCalled = false;

      const callback = jest.fn(async () => {
        callbackCalled = true;
      });

      jest.spyOn(guard, 'getTimeout').mockReturnValue(100); // 100ms

      const timeoutId = guard.scheduleTimeout(matchId, stage, callback);
      guard.cancelTimeout(timeoutId);

      setTimeout(() => {
        expect(callbackCalled).toBe(false);
        done();
      }, 200);
    });
  });
});
