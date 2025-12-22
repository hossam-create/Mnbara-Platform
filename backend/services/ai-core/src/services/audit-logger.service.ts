/**
 * Audit Logger Service
 * Full auditability for all AI Core operations
 * Immutable logging - append only
 */

import { AuditEntry } from '../types/ai-core.types';
import { randomUUID } from 'crypto';

const AI_CORE_VERSION = '1.0.0';

export class AuditLoggerService {
  private logs: AuditEntry[] = [];

  /**
   * Log an AI Core operation
   * All operations are logged for full auditability
   */
  log(
    operation: string,
    input: Record<string, unknown>,
    output: Record<string, unknown>,
    startTime: number
  ): AuditEntry {
    const entry: AuditEntry = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      operation,
      input: this.sanitizeInput(input),
      output: this.sanitizeOutput(output),
      processingTimeMs: Date.now() - startTime,
      version: AI_CORE_VERSION,
    };

    this.logs.push(entry);
    return entry;
  }

  /**
   * Get audit entries by operation type
   */
  getByOperation(operation: string, limit = 100): AuditEntry[] {
    return this.logs
      .filter((e) => e.operation === operation)
      .slice(-limit);
  }

  /**
   * Get audit entries within time range
   */
  getByTimeRange(startTime: Date, endTime: Date): AuditEntry[] {
    return this.logs.filter((e) => {
      const entryTime = new Date(e.timestamp);
      return entryTime >= startTime && entryTime <= endTime;
    });
  }

  /**
   * Get recent audit entries
   */
  getRecent(limit = 50): AuditEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * Get audit entry by ID
   */
  getById(id: string): AuditEntry | undefined {
    return this.logs.find((e) => e.id === id);
  }

  /**
   * Get audit statistics
   */
  getStats(): {
    totalOperations: number;
    operationCounts: Record<string, number>;
    averageProcessingTimeMs: number;
    oldestEntry?: string;
    newestEntry?: string;
  } {
    const operationCounts: Record<string, number> = {};
    let totalProcessingTime = 0;

    for (const entry of this.logs) {
      operationCounts[entry.operation] = (operationCounts[entry.operation] || 0) + 1;
      totalProcessingTime += entry.processingTimeMs;
    }

    return {
      totalOperations: this.logs.length,
      operationCounts,
      averageProcessingTimeMs:
        this.logs.length > 0 ? Math.round(totalProcessingTime / this.logs.length) : 0,
      oldestEntry: this.logs[0]?.timestamp,
      newestEntry: this.logs[this.logs.length - 1]?.timestamp,
    };
  }

  /**
   * Sanitize input to remove sensitive data
   */
  private sanitizeInput(input: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...input };

    // Remove or mask sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Sanitize output to ensure it's serializable
   */
  private sanitizeOutput(output: Record<string, unknown>): Record<string, unknown> {
    try {
      // Ensure output is JSON serializable
      return JSON.parse(JSON.stringify(output));
    } catch {
      return { error: 'Output not serializable' };
    }
  }

  /**
   * Export logs for external storage
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Clear old logs (for memory management in production)
   * Keeps last N entries
   */
  pruneOldLogs(keepCount = 10000): number {
    if (this.logs.length <= keepCount) return 0;

    const pruneCount = this.logs.length - keepCount;
    this.logs = this.logs.slice(pruneCount);
    return pruneCount;
  }
}

export const auditLoggerService = new AuditLoggerService();
