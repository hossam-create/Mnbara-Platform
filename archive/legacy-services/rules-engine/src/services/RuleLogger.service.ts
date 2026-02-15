import { RuleEvaluationResult, RuleEngineEvaluationSummary } from '../types/Rule.types';
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Append-only logging service for rule evaluations
 * 
 * ABSOLUTE REQUIREMENTS:
 * - Logging is append-only
 * - Logging failure must NOT break flow
 */

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  event: string;
  data: any;
  error?: string;
}

export class RuleLogger {
  private logFilePath: string;
  private maxLogFileSize: number; // bytes
  private currentLogSize: number;

  constructor(logDir: string = './logs', maxLogFileSize: number = 10 * 1024 * 1024) { // 10MB default
    this.maxLogFileSize = maxLogFileSize;
    this.currentLogSize = 0;
    
    // Ensure log directory exists
    if (!existsSync(logDir)) {
      try {
        mkdirSync(logDir, { recursive: true });
      } catch (error) {
        // If we can't create log directory, fall back to memory-only logging
        console.warn('Failed to create log directory, using memory-only logging:', error);
        this.logFilePath = '';
        return;
      }
    }
    
    // Create log file path with date
    const today = new Date().toISOString().split('T')[0];
    this.logFilePath = join(logDir, `rules-engine-${today}.log`);
    
    // Initialize current log size
    this.updateLogSize();
  }

  /**
   * Update current log file size
   */
  private updateLogSize(): void {
    if (this.logFilePath && existsSync(this.logFilePath)) {
      try {
        const stats = require('fs').statSync(this.logFilePath);
        this.currentLogSize = stats.size;
      } catch (error) {
        this.currentLogSize = 0;
      }
    }
  }

  /**
   * Rotate log file if it exceeds max size
   */
  private rotateLogIfNeeded(): void {
    if (!this.logFilePath || this.currentLogSize < this.maxLogFileSize) {
      return;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedPath = this.logFilePath.replace('.log', `-${timestamp}.log`);
      
      // Rename current log file
      if (existsSync(this.logFilePath)) {
        require('fs').renameSync(this.logFilePath, rotatedPath);
      }
      
      this.currentLogSize = 0;
    } catch (error) {
      // If rotation fails, continue with current file
      console.warn('Failed to rotate log file:', error);
    }
  }

  /**
   * Append log entry to file (append-only)
   * NEVER throws - logging failures must not break flow
   */
  private appendToFile(entry: LogEntry): void {
    if (!this.logFilePath) {
      // Fallback to console if file logging unavailable
      console.log(`[RuleLogger] ${JSON.stringify(entry)}`);
      return;
    }

    try {
      // Rotate if needed
      this.rotateLogIfNeeded();
      
      // Append-only operation
      const logLine = JSON.stringify(entry) + '\n';
      appendFileSync(this.logFilePath, logLine, 'utf8');
      this.currentLogSize += Buffer.byteLength(logLine, 'utf8');
    } catch (error) {
      // NEVER let logging failures break the flow
      console.warn('Failed to write to log file:', error);
      console.log(`[RuleLogger] ${JSON.stringify(entry)}`);
    }
  }

  /**
   * Log rule evaluation result
   */
  logRuleEvaluation(result: RuleEvaluationResult): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: result.result === 'DENY' ? 'WARN' : 'INFO',
      event: 'RULE_EVALUATION',
      data: {
        ruleId: result.ruleId,
        result: result.result,
        reason: result.reason,
        severity: result.severity,
        metadata: result.metadata,
        evaluatedAt: result.evaluatedAt
      }
    };

    this.appendToFile(entry);
  }

  /**
   * Log complete rules engine evaluation
   */
  logEngineEvaluation(summary: RuleEngineEvaluationSummary): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: summary.finalDecision === 'DENY' ? 'WARN' : 'INFO',
      event: 'ENGINE_EVALUATION',
      data: {
        context: {
          actorId: summary.context.actor.id,
          actorType: summary.context.actor.type,
          targetId: summary.context.target.id,
          targetType: summary.context.target.type,
          actionType: summary.context.action.type
        },
        summary: summary.summary,
        finalDecision: summary.finalDecision,
        evaluatedAt: summary.evaluatedAt,
        ruleCount: summary.results.length
      }
    };

    this.appendToFile(entry);
  }

  /**
   * Log integration point check
   */
  logIntegrationCheck(
    integrationPoint: string,
    context: any,
    result: any,
    decision: 'ALLOW' | 'DENY' | 'FLAG'
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: decision === 'DENY' ? 'WARN' : decision === 'FLAG' ? 'INFO' : 'INFO',
      event: 'INTEGRATION_CHECK',
      data: {
        integrationPoint,
        actorId: context.actor?.id,
        actionType: context.action?.type,
        decision,
        ruleResults: result.summary,
        finalDecision: result.finalDecision
      }
    };

    this.appendToFile(entry);
  }

  /**
   * Log errors (never throws)
   */
  logError(event: string, error: Error | string, context?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      event,
      data: context,
      error: error instanceof Error ? error.message : error
    };

    this.appendToFile(entry);
  }

  /**
   * Get current log statistics
   */
  getLogStats(): { logFilePath: string; currentSize: number; maxSize: number } {
    return {
      logFilePath: this.logFilePath || 'memory-only',
      currentSize: this.currentLogSize,
      maxSize: this.maxLogFileSize
    };
  }
}

// Singleton instance for the application
export const ruleLogger = new RuleLogger();
