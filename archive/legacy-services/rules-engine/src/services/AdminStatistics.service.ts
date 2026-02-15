import { RuleEvaluationResult } from '../types/Rule.types';
import { RuleEvaluationStats, RuleStatistics } from '../types/Admin.types';

/**
 * Admin Statistics Service
 * READ ONLY - Provides visibility into rule evaluations
 * No editing or control capabilities
 */
export class AdminStatistics {
  private ruleStats: Map<string, RuleStatistics> = new Map();

  /**
   * Update statistics when a rule is evaluated
   * Called by RulesEngine after each evaluation
   */
  updateRuleStats(result: RuleEvaluationResult): void {
    const ruleId = result.ruleId;
    const current = this.ruleStats.get(ruleId) || {
      ruleId,
      allowCount: 0,
      denyCount: 0,
      flagCount: 0,
      totalCount: 0,
      lastTriggeredAt: null
    };

    // Update counts based on result
    switch (result.result) {
      case 'ALLOW':
        current.allowCount++;
        break;
      case 'DENY':
        current.denyCount++;
        break;
      case 'FLAG':
        current.flagCount++;
        break;
    }

    current.totalCount++;
    current.lastTriggeredAt = result.evaluatedAt;

    this.ruleStats.set(ruleId, current);
  }

  /**
   * Get statistics for all rules
   */
  getAllRuleStats(): RuleStatistics[] {
    return Array.from(this.ruleStats.values());
  }

  /**
   * Get statistics for a specific rule
   */
  getRuleStats(ruleId: string): RuleStatistics | null {
    return this.ruleStats.get(ruleId) || null;
  }

  /**
   * Get formatted admin response with rule descriptions
   */
  getAdminEvaluationsResponse(ruleDescriptions: Map<string, { description: string; severity?: string }>): any {
    const evaluations: RuleEvaluationStats[] = Array.from(this.ruleStats.values()).map(stats => {
      const ruleInfo = ruleDescriptions.get(stats.ruleId) || { description: 'Unknown Rule' };
      
      return {
        ruleId: stats.ruleId,
        ruleDescription: ruleInfo.description,
        counts: {
          allow: stats.allowCount,
          deny: stats.denyCount,
          flag: stats.flagCount,
          total: stats.totalCount
        },
        lastTriggeredAt: stats.lastTriggeredAt,
        severity: ruleInfo.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined
      };
    });

    const totalEvaluations = evaluations.reduce((sum, evaluation) => sum + evaluation.counts.total, 0);

    return {
      evaluations,
      summary: {
        totalRules: evaluations.length,
        totalEvaluations,
        lastUpdated: new Date()
      },
      generatedAt: new Date()
    };
  }

  /**
   * Reset all statistics (for testing purposes only)
   */
  resetStats(): void {
    this.ruleStats.clear();
  }

  /**
   * Get summary statistics
   */
  getSummaryStats(): {
    totalRules: number;
    totalEvaluations: number;
    totalAllows: number;
    totalDenies: number;
    totalFlags: number;
  } {
    const stats = Array.from(this.ruleStats.values());
    
    return {
      totalRules: stats.length,
      totalEvaluations: stats.reduce((sum, s) => sum + s.totalCount, 0),
      totalAllows: stats.reduce((sum, s) => sum + s.allowCount, 0),
      totalDenies: stats.reduce((sum, s) => sum + s.denyCount, 0),
      totalFlags: stats.reduce((sum, s) => sum + s.flagCount, 0)
    };
  }
}

// Singleton instance for the application
export const adminStatistics = new AdminStatistics();
