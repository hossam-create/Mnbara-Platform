import { alertSignalEmitter, AlertSeverity } from '../alerts';

jest.mock('../logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

import { logger } from '../logger';

describe('AlertSignalEmitter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('emit', () => {
    it('should emit critical alert as error log', () => {
      alertSignalEmitter.emit({
        severity: AlertSeverity.CRITICAL,
        title: 'Test Critical',
        description: 'Critical issue detected',
        source: 'test_source',
        metadata: { key: 'value' }
      });

      expect(logger.error).toHaveBeenCalledWith(
        'Critical issue detected',
        expect.objectContaining({
          operation: 'alert_signal',
          alert_severity: 'critical',
          alert_title: 'Test Critical',
          alert_source: 'test_source',
          key: 'value'
        })
      );
    });

    it('should emit warning alert as warn log', () => {
      alertSignalEmitter.emit({
        severity: AlertSeverity.WARNING,
        title: 'Test Warning',
        description: 'Warning detected',
        source: 'test_source'
      });

      expect(logger.warn).toHaveBeenCalledWith(
        'Warning detected',
        expect.objectContaining({
          operation: 'alert_signal',
          alert_severity: 'warning',
          alert_title: 'Test Warning',
          alert_source: 'test_source'
        })
      );
    });

    it('should emit info alert as info log', () => {
      alertSignalEmitter.emit({
        severity: AlertSeverity.INFO,
        title: 'Test Info',
        description: 'Info message',
        source: 'test_source'
      });

      expect(logger.info).toHaveBeenCalledWith(
        'Info message',
        expect.objectContaining({
          operation: 'alert_signal',
          alert_severity: 'info',
          alert_title: 'Test Info',
          alert_source: 'test_source'
        })
      );
    });
  });

  describe('circuitBreakerOpened', () => {
    it('should emit critical alert with failure count', () => {
      alertSignalEmitter.circuitBreakerOpened('EXTERNAL', 5);

      expect(logger.error).toHaveBeenCalledWith(
        'Circuit breaker opened for EXTERNAL after 5 failures',
        expect.objectContaining({
          alert_severity: 'critical',
          alert_title: 'Circuit Breaker Opened',
          failures: 5
        })
      );
    });
  });

  describe('slaBreachAutoDisable', () => {
    it('should emit critical alert with rates', () => {
      alertSignalEmitter.slaBreachAutoDisable(0.6, 0.4);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failure rate: 60.0%'),
        expect.objectContaining({
          alert_severity: 'critical',
          alert_title: 'SLA Breach - Auto Disable',
          failureRate: 0.6,
          timeoutRate: 0.4
        })
      );
    });
  });

  describe('custodiiUnreachable', () => {
    it('should emit critical alert with error', () => {
      alertSignalEmitter.custodiiUnreachable('Connection timeout');

      expect(logger.error).toHaveBeenCalledWith(
        'Unable to reach Custodii API: Connection timeout',
        expect.objectContaining({
          alert_severity: 'critical',
          alert_title: 'Custodii Unreachable',
          error: 'Connection timeout'
        })
      );
    });
  });

  describe('pollingBacklogSpike', () => {
    it('should emit warning alert with backlog size', () => {
      alertSignalEmitter.pollingBacklogSpike(150, 100);

      expect(logger.warn).toHaveBeenCalledWith(
        'Polling backlog size (150) exceeded threshold (100)',
        expect.objectContaining({
          alert_severity: 'warning',
          alert_title: 'Polling Backlog Spike',
          currentSize: 150,
          threshold: 100
        })
      );
    });
  });

  describe('repeatedDecisionExpiry', () => {
    it('should emit warning alert with expiry count', () => {
      alertSignalEmitter.repeatedDecisionExpiry(25, 10);

      expect(logger.warn).toHaveBeenCalledWith(
        '25 decisions expired in the last 10 minutes',
        expect.objectContaining({
          alert_severity: 'warning',
          alert_title: 'Repeated Decision Expiry',
          count: 25,
          windowMinutes: 10
        })
      );
    });
  });
});
