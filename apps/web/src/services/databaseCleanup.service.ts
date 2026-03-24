/**
 * 🔒 SECURITY-COMPLIANT DATABASE CLEANUP & MAINTENANCE
 * ACCESS CONTROL & AUTHORITY POLICY IMPLEMENTATION
 * 
 * CRITICAL SECURITY NOTICE:
 * - Database cleanup is SECURITY-CRITICAL for performance and security
 * - Backend validates ALL cleanup operations independently
 * - Cleanup jobs prevent data accumulation and security risks
 * - Log retention follows compliance and security requirements
 * - Temporary data cleanup prevents information disclosure
 * 
 * VIOLATION OF DATABASE CLEANUP POLICY COMPROMISES SYSTEM SECURITY
 */

import { 
  useSecurityEventLogging, 
  EventCategory, 
  EventType, 
  TargetType 
} from '@/hooks/useSecurityEventLogging';

/**
 * ⚠️ SECURITY: Database Cleanup Configuration
 * Backend validates ALL cleanup operations
 */
export const DATABASE_CLEANUP_CONFIG = {
  // Log retention policies
  LOG_RETENTION_DAYS: 30,
  SECURITY_LOG_RETENTION_DAYS: 90,
  FAILED_LOGIN_RETENTION_DAYS: 30,
  
  // Session cleanup policies
  SESSION_CLEANUP_HOURS: 24,
  INACTIVE_SESSION_HOURS: 12,
  EXPIRED_SESSION_HOURS: 6,
  
  // Temporary data cleanup
  TEMP_DATA_RETENTION_HOURS: 24,
  UPLOAD_TEMP_RETENTION_HOURS: 6,
  CACHE_RETENTION_HOURS: 48,
  
  // User data cleanup
  INACTIVE_USER_DAYS: 365,
  UNVERIFIED_USER_DAYS: 7,
  DELETED_USER_RETENTION_DAYS: 30,
  
  // Financial data cleanup
  ESCROW_TEMP_RETENTION_DAYS: 7,
  PAYMENT_TEMP_RETENTION_DAYS: 1,
  DISPUTE_TEMP_RETENTION_DAYS: 30,
  
  // Performance thresholds
  MAX_LOG_ENTRIES: 1000000,
  MAX_SESSION_ENTRIES: 100000,
  MAX_TEMP_ENTRIES: 50000,
  
  // Cleanup scheduling
  CLEANUP_INTERVAL_HOURS: 6,
  FULL_CLEANUP_INTERVAL_DAYS: 1,
  ARCHIVE_INTERVAL_DAYS: 7
} as const;

/**
 * ⚠️ SECURITY: Cleanup Job Types
 * Backend validates ALL cleanup operations
 */
export enum CleanupJobType {
  LOG_CLEANUP = 'LOG_CLEANUP',
  SESSION_CLEANUP = 'SESSION_CLEANUP',
  TEMP_DATA_CLEANUP = 'TEMP_DATA_CLEANUP',
  USER_DATA_CLEANUP = 'USER_DATA_CLEANUP',
  FINANCIAL_DATA_CLEANUP = 'FINANCIAL_DATA_CLEANUP',
  ARCHIVE_OLD_DATA = 'ARCHIVE_OLD_DATA',
  ANALYZE_TABLES = 'ANALYZE_TABLES',
  OPTIMIZE_TABLES = 'OPTIMIZE_TABLES',
  FULL_DATABASE_CLEANUP = 'FULL_DATABASE_CLEANUP'
}

/**
 * 🔒 SECURITY-CRITICAL: Cleanup Result
 * Backend validates ALL cleanup results
 */
export interface DatabaseCleanupResult {
  jobId: string;
  jobType: CleanupJobType;
  startTime: string;
  endTime: string;
  duration: number;
  success: boolean;
  recordsDeleted: number;
  recordsArchived: number;
  spaceReclaimed: number;
  errors: string[];
  warnings: string[];
  securityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  complianceVerified: boolean;
}

/**
 * 🔒 SECURITY: Database Cleanup Service
 * Backend validates ALL cleanup operations
 */
export class DatabaseCleanupService {
  private static instance: DatabaseCleanupService;
  private isRunning = false;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private { createSecurityEvent } = useSecurityEventLogging();
  
  private constructor() {
    // SECURITY: Initialize cleanup scheduler
    this.startCleanupScheduler();
  }
  
  /**
   * ⚠️ SECURITY: Singleton pattern ensures centralized cleanup
   * Backend validates ALL cleanup operations
   */
  public static getInstance(): DatabaseCleanupService {
    if (!DatabaseCleanupService.instance) {
      DatabaseCleanupService.instance = new DatabaseCleanupService();
    }
    return DatabaseCleanupService.instance;
  }
  
  /**
   * ⚠️ SECURITY: Execute database cleanup - Backend validates ALL operations
   * Frontend cleanup is INFORMATIONAL ONLY - Backend validates independently
   */
  async executeCleanup(jobType: CleanupJobType): Promise<DatabaseCleanupResult> {
    const jobId = `CLEANUP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date().toISOString();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[SECURITY AUDIT] Executing database cleanup:', {
        job_id: jobId,
        job_type: jobType,
        warning: 'Frontend cleanup is INFORMATIONAL ONLY',
        security: 'Backend validates ALL cleanup operations',
        authority: 'Frontend has ZERO authority over database operations'
      });
    }
    
    try {
      // SECURITY: Log cleanup start
      await this.createSecurityEvent(
        EventCategory.SYSTEM,
        EventType.SYSTEM_STARTUP,
        TargetType.SYSTEM,
        `cleanup-start-${jobId}`,
        {
          metadata: {
            job_type: jobType,
            security_level: 'HIGH'
          }
        },
        'DatabaseCleanupService'
      );
      
      // SECURITY: Execute cleanup via backend API
      const result = await this.executeBackendCleanup(jobType, jobId);
      
      // SECURITY: Log cleanup completion
      await this.createSecurityEvent(
        EventCategory.SYSTEM,
        EventType.SYSTEM_STARTUP,
        TargetType.SYSTEM,
        `cleanup-complete-${jobId}`,
        {
          metadata: {
            job_type: jobType,
            records_deleted: result.recordsDeleted,
            space_reclaimed: result.spaceReclaimed,
            success: result.success
          }
        },
        'DatabaseCleanupService'
      );
      
      return result;
      
    } catch (error: any) {
      console.error('[SECURITY CRITICAL] Database cleanup failed:', error);
      
      // SECURITY: Log cleanup failure
      await this.createSecurityEvent(
        EventCategory.ERROR,
        EventType.SYSTEM_ERROR,
        TargetType.SYSTEM,
        `cleanup-error-${jobId}`,
        {
          metadata: {
            job_type: jobType,
            error: error.message,
            security_level: 'CRITICAL'
          }
        },
        'DatabaseCleanupService'
      );
      
      return {
        jobId,
        jobType,
        startTime,
        endTime: new Date().toISOString(),
        duration: Date.now() - new Date(startTime).getTime(),
        success: false,
        recordsDeleted: 0,
        recordsArchived: 0,
        spaceReclaimed: 0,
        errors: [error.message],
        warnings: [],
        securityLevel: 'CRITICAL',
        complianceVerified: false
      };
    }
  }
  
  /**
   * ⚠️ SECURITY: Execute backend cleanup - Backend validates ALL operations
   */
  private async executeBackendCleanup(
    jobType: CleanupJobType,
    jobId: string
  ): Promise<DatabaseCleanupResult> {
    try {
      const response = await fetch('/api/v1/admin/database/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'X-Cleanup-Job-Id': jobId,
          'X-Cleanup-Security-Level': 'HIGH'
        },
        body: JSON.stringify({
          job_type: jobType,
          retention_config: DATABASE_CLEANUP_CONFIG,
          security_validation: true,
          compliance_check: true
        })
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Database cleanup unauthorized - insufficient permissions');
        }
        
        if (response.status === 429) {
          throw new Error('Cleanup rate limited - too many requests');
        }
        
        throw new Error(`Database cleanup failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result as DatabaseCleanupResult;
      
    } catch (error: any) {
      throw new Error(`Backend cleanup failed: ${error.message}`);
    }
  }
  
  /**
   * ⚠️ SECURITY: Get authentication token
   */
  private getAuthToken(): string {
    // SECURITY: Get token from secure storage
    const state = (window as any).store?.getState?.();
    return state?.auth?.token || '';
  }
  
  /**
   * ⚠️ SECURITY: Start cleanup scheduler
   */
  private startCleanupScheduler(): void {
    // SECURITY: Schedule regular cleanup
    this.cleanupInterval = setInterval(() => {
      this.scheduledCleanup();
    }, DATABASE_CLEANUP_CONFIG.CLEANUP_INTERVAL_HOURS * 60 * 60 * 1000);
    
    // SECURITY: Schedule full cleanup daily
    setInterval(() => {
      this.fullDatabaseCleanup();
    }, DATABASE_CLEANUP_CONFIG.FULL_CLEANUP_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
  }
  
  /**
   * ⚠️ SECURITY: Scheduled cleanup routine
   */
  private async scheduledCleanup(): Promise<void> {
    if (this.isRunning) {
      return; // Prevent concurrent cleanup
    }
    
    this.isRunning = true;
    
    try {
      // SECURITY: Execute high-priority cleanup jobs
      const jobs = [
        CleanupJobType.LOG_CLEANUP,
        CleanupJobType.SESSION_CLEANUP,
        CleanupJobType.TEMP_DATA_CLEANUP
      ];
      
      for (const jobType of jobs) {
        await this.executeCleanup(jobType);
      }
      
    } catch (error) {
      console.error('[SECURITY CRITICAL] Scheduled cleanup failed:', error);
    } finally {
      this.isRunning = false;
    }
  }
  
  /**
   * ⚠️ SECURITY: Full database cleanup
   */
  async fullDatabaseCleanup(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SECURITY AUDIT] Starting full database cleanup:', {
        warning: 'Frontend cleanup is INFORMATIONAL ONLY',
        security: 'Backend validates ALL cleanup operations'
      });
    }
    
    try {
      const result = await this.executeCleanup(CleanupJobType.FULL_DATABASE_CLEANUP);
      
      if (result.success) {
        console.log('[SECURITY AUDIT] Full database cleanup completed successfully:', {
          records_deleted: result.recordsDeleted,
          space_reclaimed: result.spaceReclaimed
        });
      } else {
        console.error('[SECURITY CRITICAL] Full database cleanup failed:', result.errors);
      }
      
    } catch (error) {
      console.error('[SECURITY CRITICAL] Full database cleanup error:', error);
    }
  }
  
  /**
   * ⚠️ SECURITY: Archive old data
   */
  async archiveOldData(): Promise<void> {
    try {
      const result = await this.executeCleanup(CleanupJobType.ARCHIVE_OLD_DATA);
      
      if (result.success) {
        console.log('[SECURITY AUDIT] Data archival completed:', {
          records_archived: result.recordsArchived
        });
      }
      
    } catch (error) {
      console.error('[SECURITY CRITICAL] Data archival failed:', error);
    }
  }
  
  /**
   * ⚠️ SECURITY: Cleanup specific data types
   */
  async cleanupLogs(retentionDays: number = DATABASE_CLEANUP_CONFIG.LOG_RETENTION_DAYS): Promise<void> {
    await this.executeCleanup(CleanupJobType.LOG_CLEANUP);
  }
  
  async cleanupSessions(): Promise<void> {
    await this.executeCleanup(CleanupJobType.SESSION_CLEANUP);
  }
  
  async cleanupTempData(): Promise<void> {
    await this.executeCleanup(CleanupJobType.TEMP_DATA_CLEANUP);
  }
  
  async cleanupUserData(): Promise<void> {
    await this.executeCleanup(CleanupJobType.USER_DATA_CLEANUP);
  }
  
  async cleanupFinancialData(): Promise<void> {
    await this.executeCleanup(CleanupJobType.FINANCIAL_DATA_CLEANUP);
  }
  
  /**
   * ⚠️ SECURITY: Stop cleanup scheduler
   */
  stopCleanupScheduler(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
  
  /**
   * ⚠️ SECURITY: Get cleanup statistics
   */
  async getCleanupStatistics(): Promise<{
    lastCleanup: string | null;
    totalRecordsCleaned: number;
    totalSpaceReclaimed: number;
    nextScheduledCleanup: string;
    activeJobs: number;
  }> {
    try {
      const response = await fetch('/api/v1/admin/database/cleanup/statistics', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get cleanup statistics');
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('[SECURITY CRITICAL] Failed to get cleanup statistics:', error);
      return {
        lastCleanup: null,
        totalRecordsCleaned: 0,
        totalSpaceReclaimed: 0,
        nextScheduledCleanup: new Date(Date.now() + DATABASE_CLEANUP_CONFIG.CLEANUP_INTERVAL_HOURS * 60 * 60 * 1000).toISOString(),
        activeJobs: 0
      };
    }
  }
}

/**
 * ⚠️ SECURITY: Convenience functions for database cleanup
 * Backend validates ALL cleanup operations
 */

/**
 * ⚠️ SECURITY: Initialize database cleanup service
 */
export function initializeDatabaseCleanup(): DatabaseCleanupService {
  return DatabaseCleanupService.getInstance();
}

/**
 * ⚠️ SECURITY: Execute immediate cleanup
 */
export async function executeImmediateCleanup(jobType: CleanupJobType): Promise<DatabaseCleanupResult> {
  const service = DatabaseCleanupService.getInstance();
  return await service.executeCleanup(jobType);
}

/**
 * ⚠️ SECURITY: Schedule cleanup for specific time
 */
export function scheduleCleanup(
  jobType: CleanupJobType,
  scheduledTime: Date
): void {
  const delay = scheduledTime.getTime() - Date.now();
  
  if (delay > 0) {
    setTimeout(async () => {
      const service = DatabaseCleanupService.getInstance();
      await service.executeCleanup(jobType);
    }, delay);
  }
}

/**
 * ⚠️ SECURITY: Export singleton instance
 */
export const databaseCleanupService = DatabaseCleanupService.getInstance();