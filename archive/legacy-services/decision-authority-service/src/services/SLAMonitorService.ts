import { PrismaClient } from '@prisma/client';
import { AuditLogService } from './AuditLogService';
import config, { DecisionAuthorityMode } from '../config/config';

interface SLAMetrics {
  totalRequests: number;
  failures: number;
  timeouts: number;
  windowStart: number;
}

export class SLAMonitorService {
  private prisma: PrismaClient;
  private auditLogService: AuditLogService;
  private metrics: SLAMetrics = {
    totalRequests: 0,
    failures: 0,
    timeouts: 0,
    windowStart: Date.now()
  };
  private isDisabled: boolean = false;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.auditLogService = new AuditLogService(prisma);
  }

  recordRequest(): void {
    this.resetWindowIfNeeded();
    this.metrics.totalRequests++;
  }

  recordFailure(): void {
    this.resetWindowIfNeeded();
    this.metrics.failures++;
    this.checkSLABreach();
  }

  recordTimeout(): void {
    this.resetWindowIfNeeded();
    this.metrics.timeouts++;
    this.checkSLABreach();
  }

  private resetWindowIfNeeded(): void {
    const now = Date.now();
    const windowAge = now - this.metrics.windowStart;

    if (windowAge >= config.sla.windowMs) {
      this.metrics = {
        totalRequests: 0,
        failures: 0,
        timeouts: 0,
        windowStart: now
      };
    }
  }

  private checkSLABreach(): void {
    if (this.isDisabled || this.metrics.totalRequests < 10) {
      return;
    }

    const failureRate = this.metrics.failures / this.metrics.totalRequests;
    const timeoutRate = this.metrics.timeouts / this.metrics.totalRequests;

    if (failureRate > config.sla.maxFailureRate) {
      this.handleSLABreach('FAILURE_RATE', failureRate);
    } else if (timeoutRate > config.sla.maxTimeoutRate) {
      this.handleSLABreach('TIMEOUT_RATE', timeoutRate);
    }
  }

  private async handleSLABreach(type: string, rate: number): Promise<void> {
    if (this.isDisabled) {
      return;
    }

    this.isDisabled = true;

    console.error(`[SLAMonitor] SLA BREACH DETECTED: ${type} = ${(rate * 100).toFixed(2)}%`);
    console.error(`[SLAMonitor] Auto-disabling EXTERNAL mode, falling back to INTERNAL`);

    try {
      await this.auditLogService.logSystemEvent(
        'SLA_BREACH_AUTO_DISABLE',
        'SYSTEM',
        'sla-monitor',
        {
          breachType: type,
          rate: rate,
          threshold: type === 'FAILURE_RATE' ? config.sla.maxFailureRate : config.sla.maxTimeoutRate,
          metrics: this.metrics,
          action: 'AUTO_DISABLE_EXTERNAL_MODE'
        }
      );
    } catch (error) {
      console.error('[SLAMonitor] Failed to log SLA breach', error);
    }
  }

  getMetrics(): Readonly<SLAMetrics> {
    this.resetWindowIfNeeded();
    return { ...this.metrics };
  }

  isExternalDisabled(): boolean {
    return this.isDisabled;
  }

  reset(): void {
    this.metrics = {
      totalRequests: 0,
      failures: 0,
      timeouts: 0,
      windowStart: Date.now()
    };
    this.isDisabled = false;
  }
}
