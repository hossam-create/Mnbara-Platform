/**
 * Admin visibility types for Rules Engine
 * READ ONLY - No editing or control capabilities
 */

export interface RuleEvaluationStats {
  ruleId: string;
  ruleDescription: string;
  counts: {
    allow: number;
    deny: number;
    flag: number;
    total: number;
  };
  lastTriggeredAt: Date | null;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined;
}

export interface AdminEvaluationsResponse {
  evaluations: RuleEvaluationStats[];
  summary: {
    totalRules: number;
    totalEvaluations: number;
    lastUpdated: Date;
  };
  generatedAt: Date;
}

export interface RuleStatistics {
  ruleId: string;
  allowCount: number;
  denyCount: number;
  flagCount: number;
  totalCount: number;
  lastTriggeredAt: Date | null;
}
