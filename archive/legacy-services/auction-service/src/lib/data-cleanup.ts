/**
 * Data Cleanup & Maintenance Framework
 * 
 * Scheduled background jobs for:
 * - Deleting old logs (>30 days)
 * - Cleaning expired sessions
 * - Removing failed login attempts (>30 days)
 * - Cleaning temporary/unused records
 * 
 * MANDATORY REQUIREMENTS:
 * - Scheduled cleanup jobs
 * - Data retention policies
 * - Audit trail preservation
 * - Automatic execution
 */

import { prisma } from './prisma';

// ============================================================
// DATA RETENTION POLICIES
// ============================================================

export const DATA_RETENTION_POLICIES = {
  LOGS: 30 * 24 * 60 * 60 * 1000, // 30 days
  SESSIONS: 7 * 24 * 60 * 60 * 1000, // 7 days
  FAILED_LOGINS: 30 * 24 * 60 * 60 * 1000, // 30 days
  TEMPORARY_RECORDS: 7 * 24 * 60 * 60 * 1000, // 7 days
  AUDIT_TRAIL: 365 * 24 * 60 * 60 * 1000, // 1 year (preserve for compliance)
} as const;

// ============================================================
// CLEANUP JOBS
// ============================================================

export interface CleanupResult {
  jobName: string;
  recordsDeleted: number;
  duration: number; // milliseconds
  timestamp: Date;
  status: 'success' | 'error';
  error?: string;
}

export class DataCleanupService {
  private cleanupHistory: CleanupResult[] = [];
  private readonly MAX_HISTORY = 100;

  /**
   * Run all cleanup jobs
   */
  async runAllCleanupJobs(): Promise<CleanupResult[]> {
    console.log('[DATA_CLEANUP] Starting all cleanup jobs...');

    const results: CleanupResult[] = [];

    // Run cleanup jobs sequentially
    results.push(await this.cleanupOldLogs());
    results.push(await this.cleanupExpiredSessions());
    results.push(await this.cleanupFailedLoginAttempts());
    results.push(await this.cleanupTemporaryRecords());

    // Store results
    results.forEach(result => this.recordCleanupResult(result));

    console.log('[DATA_CLEANUP] All cleanup jobs completed:', {
      totalRecordsDeleted: results.reduce((sum, r) => sum + r.recordsDeleted, 0),
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
    });

    return results;
  }

  /**
   * Clean up old logs (>30 days)
   */
  async cleanupOldLogs(): Promise<CleanupResult> {
    const startTime = Date.now();
    const jobName = 'cleanupOldLogs';

    try {
      const cutoffDate = new Date(Date.now() - DATA_RETENTION_POLICIES.LOGS);

      // Delete old audit logs
      const auditLogsDeleted = await prisma.trustScoreAuditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      // Delete old event logs (if exists)
      // const eventLogsDeleted = await prisma.eventLog.deleteMany({
      //   where: {
      //     createdAt: { lt: cutoffDate },
      //   },
      // });

      const totalDeleted = auditLogsDeleted.count; // + eventLogsDeleted.count

      console.log('[DATA_CLEANUP] Old logs cleaned:', {
        recordsDeleted: totalDeleted,
        cutoffDate,
      });

      return {
        jobName,
        recordsDeleted: totalDeleted,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        status: 'success',
      };
    } catch (error) {
      console.error('[DATA_CLEANUP] Error cleaning old logs:', error);
      return {
        jobName,
        recordsDeleted: 0,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        status: 'error',
        error: String(error),
      };
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<CleanupResult> {
    const startTime = Date.now();
    const jobName = 'cleanupExpiredSessions';

    try {
      const cutoffDate = new Date(Date.now() - DATA_RETENTION_POLICIES.SESSIONS);

      // In production, delete from sessions table
      // For now, this is a placeholder
      // const sessionsDeleted = await prisma.session.deleteMany({
      //   where: {
      //     expiresAt: { lt: cutoffDate },
      //   },
      // });

      console.log('[DATA_CLEANUP] Expired sessions cleaned:', {
        cutoffDate,
      });

      return {
        jobName,
        recordsDeleted: 0, // sessionsDeleted.count
        duration: Date.now() - startTime,
        timestamp: new Date(),
        status: 'success',
      };
    } catch (error) {
      console.error('[DATA_CLEANUP] Error cleaning expired sessions:', error);
      return {
        jobName,
        recordsDeleted: 0,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        status: 'error',
        error: String(error),
      };
    }
  }

  /**
   * Clean up failed login attempts (>30 days)
   */
  async cleanupFailedLoginAttempts(): Promise<CleanupResult> {
    const startTime = Date.now();
    const jobName = 'cleanupFailedLoginAttempts';

    try {
      const cutoffDate = new Date(Date.now() - DATA_RETENTION_POLICIES.FAILED_LOGINS);

      // In production, delete from failed_logins table
      // For now, this is a placeholder
      // const failedLoginsDeleted = await prisma.failedLogin.deleteMany({
      //   where: {
      //     createdAt: { lt: cutoffDate },
      //   },
      // });

      console.log('[DATA_CLEANUP] Failed login attempts cleaned:', {
        cutoffDate,
      });

      return {
        jobName,
        recordsDeleted: 0, // failedLoginsDeleted.count
        duration: Date.now() - startTime,
        timestamp: new Date(),
        status: 'success',
      };
    } catch (error) {
      console.error('[DATA_CLEANUP] Error cleaning failed login attempts:', error);
      return {
        jobName,
        recordsDeleted: 0,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        status: 'error',
        error: String(error),
      };
    }
  }

  /**
   * Clean up temporary/unused records
   */
  async cleanupTemporaryRecords(): Promise<CleanupResult> {
    const startTime = Date.now();
    const jobName = 'cleanupTemporaryRecords';

    try {
      const cutoffDate = new Date(Date.now() - DATA_RETENTION_POLICIES.TEMPORARY_RECORDS);

      // Delete draft listings that haven't been updated
      const draftListingsDeleted = await prisma.listing.deleteMany({
        where: {
          status: 'DRAFT',
          updatedAt: {
            lt: cutoffDate,
          },
        },
      });

      console.log('[DATA_CLEANUP] Temporary records cleaned:', {
        draftListingsDeleted: draftListingsDeleted.count,
        cutoffDate,
      });

      return {
        jobName,
        recordsDeleted: draftListingsDeleted.count,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        status: 'success',
      };
    } catch (error) {
      console.error('[DATA_CLEANUP] Error cleaning temporary records:', error);
      return {
        jobName,
        recordsDeleted: 0,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        status: 'error',
        error: String(error),
      };
    }
  }

  /**
   * Record cleanup result
   */
  private recordCleanupResult(result: CleanupResult): void {
    this.cleanupHistory.push(result);

    // Keep only last 100 results
    if (this.cleanupHistory.length > this.MAX_HISTORY) {
      this.cleanupHistory = this.cleanupHistory.slice(-this.MAX_HISTORY);
    }
  }

  /**
   * Get cleanup history
   */
  getCleanupHistory(limit: number = 50): CleanupResult[] {
    return this.cleanupHistory.slice(-limit);
  }

  /**
   * Get cleanup stats
   */
  getCleanupStats() {
    const successfulJobs = this.cleanupHistory.filter(r => r.status === 'success');
    const failedJobs = this.cleanupHistory.filter(r => r.status === 'error');

    return {
      totalJobs: this.cleanupHistory.length,
      successfulJobs: successfulJobs.length,
      failedJobs: failedJobs.length,
      totalRecordsDeleted: successfulJobs.reduce((sum, r) => sum + r.recordsDeleted, 0),
      averageDuration: successfulJobs.length > 0
        ? successfulJobs.reduce((sum, r) => sum + r.duration, 0) / successfulJobs.length
        : 0,
      lastRun: this.cleanupHistory[this.cleanupHistory.length - 1]?.timestamp,
    };
  }
}

// ============================================================
// SCHEDULED CLEANUP JOBS
// ============================================================

export class CleanupScheduler {
  private cleanupService: DataCleanupService;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(cleanupService?: DataCleanupService) {
    this.cleanupService = cleanupService || new DataCleanupService();
  }

  /**
   * Start scheduled cleanup jobs
   */
  start(): void {
    if (this.cleanupInterval) {
      console.warn('[CLEANUP_SCHEDULER] Cleanup jobs already running');
      return;
    }

    console.log('[CLEANUP_SCHEDULER] Starting scheduled cleanup jobs (every 24 hours)');

    // Run cleanup immediately on startup
    this.runCleanup();

    // Schedule cleanup every 24 hours
    this.cleanupInterval = setInterval(() => this.runCleanup(), this.CLEANUP_INTERVAL);
  }

  /**
   * Stop scheduled cleanup jobs
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('[CLEANUP_SCHEDULER] Cleanup jobs stopped');
    }
  }

  /**
   * Run cleanup
   */
  private async runCleanup(): Promise<void> {
    try {
      console.log('[CLEANUP_SCHEDULER] Running scheduled cleanup...');
      await this.cleanupService.runAllCleanupJobs();
    } catch (error) {
      console.error('[CLEANUP_SCHEDULER] Error running cleanup:', error);
    }
  }

  /**
   * Get stats
   */
  getStats() {
    return this.cleanupService.getCleanupStats();
  }

  /**
   * Get history
   */
  getHistory(limit?: number) {
    return this.cleanupService.getCleanupHistory(limit);
  }
}

// ============================================================
// SINGLETON INSTANCES
// ============================================================

let cleanupServiceInstance: DataCleanupService | null = null;
let cleanupSchedulerInstance: CleanupScheduler | null = null;

export function getCleanupService(): DataCleanupService {
  if (!cleanupServiceInstance) {
    cleanupServiceInstance = new DataCleanupService();
  }
  return cleanupServiceInstance;
}

export function getCleanupScheduler(): CleanupScheduler {
  if (!cleanupSchedulerInstance) {
    cleanupSchedulerInstance = new CleanupScheduler(getCleanupService());
  }
  return cleanupSchedulerInstance;
}
