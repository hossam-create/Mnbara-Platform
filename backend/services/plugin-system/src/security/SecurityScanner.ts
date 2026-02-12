// ============================================================
// Security Scanner - Scans plugins for security issues
// ============================================================

import { Logger } from '../utils/logger';

export interface SecurityScanResult {
  passed: boolean;
  score: number; // 0-100
  issues: SecurityIssue[];
  warnings: string[];
}

export interface SecurityIssue {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  message: string;
  location?: string;
}

export class SecurityScanner {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Scan plugin code for security issues
   */
  async scanCode(code: string, manifest: any): Promise<SecurityScanResult> {
    const issues: SecurityIssue[] = [];
    const warnings: string[] = [];

    // Check for dangerous patterns
    const dangerousPatterns = [
      {
        pattern: /eval\s*\(/i,
        severity: 'CRITICAL' as const,
        type: 'EVAL_USAGE',
        message: 'Use of eval() is not allowed'
      },
      {
        pattern: /Function\s*\(/i,
        severity: 'CRITICAL' as const,
        type: 'FUNCTION_CONSTRUCTOR',
        message: 'Use of Function constructor is not allowed'
      },
      {
        pattern: /require\s*\(\s*['"]child_process['"]/i,
        severity: 'CRITICAL' as const,
        type: 'CHILD_PROCESS',
        message: 'Access to child_process is not allowed'
      },
      {
        pattern: /require\s*\(\s*['"]fs['"]/i,
        severity: 'HIGH' as const,
        type: 'FS_ACCESS',
        message: 'Direct file system access is not allowed'
      },
      {
        pattern: /process\.exit/i,
        severity: 'HIGH' as const,
        type: 'PROCESS_EXIT',
        message: 'process.exit() is not allowed'
      },
      {
        pattern: /process\.kill/i,
        severity: 'HIGH' as const,
        type: 'PROCESS_KILL',
        message: 'process.kill() is not allowed'
      },
      {
        pattern: /__dirname/i,
        severity: 'MEDIUM' as const,
        type: 'DIRNAME_USAGE',
        message: '__dirname usage may be restricted'
      },
      {
        pattern: /__filename/i,
        severity: 'MEDIUM' as const,
        type: 'FILENAME_USAGE',
        message: '__filename usage may be restricted'
      }
    ];

    for (const check of dangerousPatterns) {
      if (check.pattern.test(code)) {
        issues.push({
          severity: check.severity,
          type: check.type,
          message: check.message
        });
      }
    }

    // Check for network access (if not allowed)
    if (!manifest.permissions?.includes('network')) {
      const networkPatterns = [
        /require\s*\(\s*['"]https?['"]/i,
        /require\s*\(\s*['"]net['"]/i,
        /fetch\s*\(/i
      ];

      for (const pattern of networkPatterns) {
        if (pattern.test(code)) {
          issues.push({
            severity: 'MEDIUM',
            type: 'NETWORK_ACCESS',
            message: 'Network access requires permission'
          });
        }
      }
    }

    // Check for database access (if not allowed)
    if (!manifest.permissions?.includes('database')) {
      const dbPatterns = [
        /require\s*\(\s*['"]pg['"]/i,
        /require\s*\(\s*['"]mysql['"]/i,
        /require\s*\(\s*['"]mongodb['"]/i
      ];

      for (const pattern of dbPatterns) {
        if (pattern.test(code)) {
          issues.push({
            severity: 'HIGH',
            type: 'DATABASE_ACCESS',
            message: 'Database access requires permission'
          });
        }
      }
    }

    // Calculate score
    let score = 100;
    for (const issue of issues) {
      switch (issue.severity) {
        case 'CRITICAL':
          score -= 30;
          break;
        case 'HIGH':
          score -= 20;
          break;
        case 'MEDIUM':
          score -= 10;
          break;
        case 'LOW':
          score -= 5;
          break;
      }
    }
    score = Math.max(0, score);

    // Warnings
    if (code.length > 100000) {
      warnings.push('Plugin code is very large (>100KB)');
    }

    if (manifest.dependencies && Object.keys(manifest.dependencies).length > 20) {
      warnings.push('Plugin has many dependencies (>20)');
    }

    const passed = issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length === 0;

    return {
      passed,
      score,
      issues,
      warnings
    };
  }

  /**
   * Scan plugin package (ZIP file)
   */
  async scanPackage(packageData: Buffer): Promise<SecurityScanResult> {
    // In production, extract ZIP and scan all files
    // For now, just scan the buffer content
    const content = packageData.toString('utf-8', 0, Math.min(100000, packageData.length));
    return this.scanCode(content, {});
  }
}

