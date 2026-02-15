import { logger } from './logger';

export enum AlertSeverity {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info'
}

export interface AlertSignal {
  severity: AlertSeverity;
  title: string;
  description: string;
  source: string;
  metadata?: Record<string, any>;
}

export class AlertSignalEmitter {
  emit(signal: AlertSignal): void {
    const logFields = {
      operation: 'alert_signal',
      alert_severity: signal.severity,
      alert_title: signal.title,
      alert_source: signal.source,
      ...signal.metadata
    };

    switch (signal.severity) {
      case AlertSeverity.CRITICAL:
        logger.error(signal.description, logFields);
        break;
      case AlertSeverity.WARNING:
        logger.warn(signal.description, logFields);
        break;
      case AlertSeverity.INFO:
        logger.info(signal.description, logFields);
        break;
    }
  }

  circuitBreakerOpened(source: string, failures: number): void {
    this.emit({
      severity: AlertSeverity.CRITICAL,
      title: 'Circuit Breaker Opened',
      description: `Circuit breaker opened for ${source} after ${failures} failures`,
      source,
      metadata: { failures }
    });
  }

  slaBreachAutoDisable(failureRate: number, timeoutRate: number): void {
    this.emit({
      severity: AlertSeverity.CRITICAL,
      title: 'SLA Breach - Auto Disable',
      description: `SLA breach detected. Failure rate: ${(failureRate * 100).toFixed(1)}%, Timeout rate: ${(timeoutRate * 100).toFixed(1)}%`,
      source: 'sla_monitor',
      metadata: { failureRate, timeoutRate }
    });
  }

  custodiiUnreachable(error: string): void {
    this.emit({
      severity: AlertSeverity.CRITICAL,
      title: 'Custodii Unreachable',
      description: `Unable to reach Custodii API: ${error}`,
      source: 'custodii_decision_source',
      metadata: { error }
    });
  }

  pollingBacklogSpike(currentSize: number, threshold: number): void {
    this.emit({
      severity: AlertSeverity.WARNING,
      title: 'Polling Backlog Spike',
      description: `Polling backlog size (${currentSize}) exceeded threshold (${threshold})`,
      source: 'decision_polling_service',
      metadata: { currentSize, threshold }
    });
  }

  repeatedDecisionExpiry(count: number, windowMinutes: number): void {
    this.emit({
      severity: AlertSeverity.WARNING,
      title: 'Repeated Decision Expiry',
      description: `${count} decisions expired in the last ${windowMinutes} minutes`,
      source: 'dead_decision_cleanup',
      metadata: { count, windowMinutes }
    });
  }
}

export const alertSignalEmitter = new AlertSignalEmitter();
