import { PrismaClient } from '@prisma/client';
import { 
  TrustCaseCreate, 
  TrustCaseResponse, 
  TrustCaseQuery, 
  TrustCaseStats,
  TrustCaseSubjectType,
  TrustCaseStatus,
  TrustCaseSeverity,
  TrustCaseError,
  TrustCaseErrorCodes,
  ITrustCaseService
} from '../../models/trust_case.model';

const prisma = new PrismaClient();

interface RuleEvaluationLog {
  id: string;
  rule_id: string;
  subject_type: string;
  subject_id: string;
  evaluation_result: 'FLAGGED' | 'PASSED';
  severity: string;
  confidence: number;
  metadata: any;
  evaluated_at: Date;
  processed: boolean;
}

interface IngestionResult {
  processed: number;
  created: number;
  duplicates: number;
  errors: number;
  details: {
    cases: TrustCaseResponse[];
    errors: Array<{
      log_id: string;
      error: string;
    }>;
  };
}

export class TrustCaseIngestionService implements ITrustCaseService {
  private readonly BATCH_SIZE = 100;
  private readonly DUPLICATE_WINDOW_HOURS = 24;

  /**
   * Main ingestion pipeline - reads from rule_evaluation_log and creates TrustCases
   */
  async runIngestionPipeline(): Promise<IngestionResult> {
    console.log('🚀 Starting Trust Case ingestion pipeline...');
    
    try {
      // Get unprocessed rule evaluation logs
      const ruleLogs = await this.getUnprocessedRuleLogs();
      
      if (ruleLogs.length === 0) {
        console.log('✅ No new rule evaluations to process');
        return {
          processed: 0,
          created: 0,
          duplicates: 0,
          errors: 0,
          details: { cases: [], errors: [] }
        };
      }

      console.log(`📋 Processing ${ruleLogs.length} rule evaluation logs...`);

      // Group by rule and subject for idempotency check
      const groupedLogs = this.groupLogsByRuleAndSubject(ruleLogs);
      
      const result: IngestionResult = {
        processed: ruleLogs.length,
        created: 0,
        duplicates: 0,
        errors: 0,
        details: { cases: [], errors: [] }
      };

      // Process each group
      for (const [key, logs] of Object.entries(groupedLogs)) {
        try {
          const [ruleId, subjectType, subjectId] = key.split('|');
          
          // Check for existing cases (idempotency)
          const existingCase = await this.checkForExistingCase(
            ruleId, 
            subjectType as TrustCaseSubjectType, 
            subjectId
          );

          if (existingCase) {
            console.log(`⚠️  Duplicate case found for ${key} - skipping`);
            result.duplicates += logs.length;
            
            // Mark logs as processed
            await this.markLogsAsProcessed(logs);
            continue;
          }

          // Create new trust case from the most recent log
          const latestLog = logs.sort((a, b) => 
            new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime()
          )[0];

          const trustCase = await this.createTrustCaseFromLog(latestLog);
          result.created++;
          result.details.cases.push(trustCase);

          // Mark all logs in this group as processed
          await this.markLogsAsProcessed(logs);

        } catch (error) {
          console.error(`❌ Error processing group ${key}:`, error);
          result.errors++;
          result.details.errors.push({
            log_id: key,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      console.log(`✅ Ingestion complete: ${result.created} created, ${result.duplicates} duplicates, ${result.errors} errors`);
      return result;

    } catch (error) {
      console.error('❌ Trust Case ingestion pipeline failed:', error);
      throw error;
    }
  }

  /**
   * Get unprocessed rule evaluation logs
   */
  private async getUnprocessedRuleLogs(): Promise<RuleEvaluationLog[]> {
    // This would typically query your rule_evaluation_log table
    // For now, simulating with mock data
    const mockLogs: RuleEvaluationLog[] = [
      {
        id: 'log-001',
        rule_id: 'USER_SUSPICIOUS_ACTIVITY',
        subject_type: 'USER',
        subject_id: 'user-123',
        evaluation_result: 'FLAGGED',
        severity: 'HIGH',
        confidence: 0.85,
        metadata: { reason: 'unusual_login_pattern', location: 'US' },
        evaluated_at: new Date(),
        processed: false
      },
      {
        id: 'log-002',
        rule_id: 'SELLER_FRAUD_RISK',
        subject_type: 'SELLER',
        subject_id: 'seller-456',
        evaluation_result: 'FLAGGED',
        severity: 'CRITICAL',
        confidence: 0.92,
        metadata: { reason: 'rapid_listing_creation', risk_score: 0.92 },
        evaluated_at: new Date(),
        processed: false
      }
    ];

    return mockLogs.filter(log => !log.processed && log.evaluation_result === 'FLAGGED');
  }

  /**
   * Group logs by rule and subject for idempotency
   */
  private groupLogsByRuleAndSubject(logs: RuleEvaluationLog[]): Record<string, RuleEvaluationLog[]> {
    const grouped: Record<string, RuleEvaluationLog[]> = {};
    
    for (const log of logs) {
      const key = `${log.rule_id}|${log.subject_type}|${log.subject_id}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(log);
    }
    
    return grouped;
  }

  /**
   * Check for existing case within duplicate window
   */
  private async checkForExistingCase(
    ruleId: string, 
    subjectType: TrustCaseSubjectType, 
    subjectId: string
  ): Promise<TrustCaseResponse | null> {
    try {
      const existingCase = await prisma.trustCase.findFirst({
        where: {
          rule: {
            rule_id: ruleId
          },
          subject_type: subjectType,
          subject_id: subjectId,
          status: {
            in: ['OPEN', 'UNDER_REVIEW']
          },
          created_at: {
            gte: new Date(Date.now() - this.DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000)
          }
        },
        include: {
          rule: true
        }
      });

      return existingCase ? this.mapToTrustCaseResponse(existingCase) : null;
    } catch (error) {
      console.error('Error checking for existing case:', error);
      return null;
    }
  }

  /**
   * Create TrustCase from rule evaluation log
   */
  private async createTrustCaseFromLog(log: RuleEvaluationLog): Promise<TrustCaseResponse> {
    // Validate rule exists
    const rule = await prisma.trustRule.findUnique({
      where: { rule_id: log.rule_id }
    });

    if (!rule) {
      throw new TrustCaseError(
        `Trust rule ${log.rule_id} not found`,
        TrustCaseErrorCodes.RULE_NOT_FOUND
      );
    }

    // Create trust case
    const trustCase = await prisma.trustCase.create({
      data: {
        case_id: `TC-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
        subject_type: log.subject_type as TrustCaseSubjectType,
        subject_id: log.subject_id,
        rule_id: rule.id,
        severity: log.severity as TrustCaseSeverity,
        status: 'OPEN' as TrustCaseStatus,
        notes: `Rule flagged: ${log.metadata?.reason || 'Unknown reason'}. Confidence: ${log.confidence}`
      },
      include: {
        rule: true
      }
    });

    console.log(`✅ Created TrustCase ${trustCase.case_id} for ${log.subject_type} ${log.subject_id}`);
    return this.mapToTrustCaseResponse(trustCase);
  }

  /**
   * Mark rule evaluation logs as processed
   */
  private async markLogsAsProcessed(logs: RuleEvaluationLog[]): Promise<void> {
    // In a real implementation, this would update the rule_evaluation_log table
    console.log(`📝 Marked ${logs.length} logs as processed`);
  }

  /**
   * Map database record to TrustCaseResponse
   */
  private mapToTrustCaseResponse(record: any): TrustCaseResponse {
    return {
      case_id: record.case_id,
      subject_type: record.subject_type,
      subject_id: record.subject_id,
      rule_id: record.rule_id,
      severity: record.severity,
      status: record.status,
      created_at: record.created_at,
      updated_at: record.updated_at,
      resolved_at: record.resolved_at,
      resolved_by: record.resolved_by,
      notes: record.notes
    };
  }

  // ITrustCaseService Implementation

  async createTrustCase(data: TrustCaseCreate): Promise<TrustCaseResponse> {
    try {
      // Validate creation from rule
      if (!data.rule_id) {
        throw new TrustCaseError(
          'TrustCase must be created from a rule flag',
          TrustCaseErrorCodes.RULE_NOT_FOUND
        );
      }

      const trustCase = await prisma.trustCase.create({
        data: {
          ...data,
          case_id: `TC-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`
        },
        include: {
          rule: true
        }
      });

      return this.mapToTrustCaseResponse(trustCase);
    } catch (error) {
      if (error instanceof TrustCaseError) {
        throw error;
      }
      throw new TrustCaseError(
        'Failed to create trust case',
        TrustCaseErrorCodes.CASE_NOT_FOUND,
        500
      );
    }
  }

  async getTrustCase(case_id: string): Promise<TrustCaseResponse | null> {
    try {
      const trustCase = await prisma.trustCase.findUnique({
        where: { case_id },
        include: {
          rule: true
        }
      });

      return trustCase ? this.mapToTrustCaseResponse(trustCase) : null;
    } catch (error) {
      throw new TrustCaseError(
        'Failed to retrieve trust case',
        TrustCaseErrorCodes.CASE_NOT_FOUND,
        500
      );
    }
  }

  async updateTrustCase(case_id: string, data: any): Promise<TrustCaseResponse> {
    try {
      const trustCase = await prisma.trustCase.update({
        where: { case_id },
        data: {
          ...data,
          updated_at: new Date()
        },
        include: {
          rule: true
        }
      });

      return this.mapToTrustCaseResponse(trustCase);
    } catch (error) {
      throw new TrustCaseError(
        'Failed to update trust case',
        TrustCaseErrorCodes.CASE_NOT_FOUND,
        500
      );
    }
  }

  async resolveTrustCase(data: any): Promise<TrustCaseResponse> {
    try {
      // Validate human decision required
      if (!data.resolved_by) {
        throw new TrustCaseError(
          'Human decision required for TrustCase resolution',
          TrustCaseErrorCodes.HUMAN_DECISION_REQUIRED
        );
      }

      const trustCase = await prisma.trustCase.update({
        where: { case_id: data.case_id },
        data: {
          status: data.status,
          resolved_at: new Date(),
          resolved_by: data.resolved_by,
          notes: data.notes,
          updated_at: new Date()
        },
        include: {
          rule: true
        }
      });

      return this.mapToTrustCaseResponse(trustCase);
    } catch (error) {
      if (error instanceof TrustCaseError) {
        throw error;
      }
      throw new TrustCaseError(
        'Failed to resolve trust case',
        TrustCaseErrorCodes.CASE_NOT_FOUND,
        500
      );
    }
  }

  async queryTrustCases(query: TrustCaseQuery): Promise<TrustCaseResponse[]> {
    try {
      const trustCases = await prisma.trustCase.findMany({
        where: {
          ...(query.subject_type && { subject_type: query.subject_type }),
          ...(query.subject_id && { subject_id: query.subject_id }),
          ...(query.rule_id && { rule: { rule_id: query.rule_id } }),
          ...(query.severity && { severity: query.severity }),
          ...(query.status && { status: query.status }),
          ...(query.created_after && { created_at: { gte: query.created_after } }),
          ...(query.created_before && { created_at: { lte: query.created_before } })
        },
        include: {
          rule: true
        },
        orderBy: {
          created_at: 'desc'
        },
        skip: query.offset,
        take: query.limit
      });

      return trustCases.map(this.mapToTrustCaseResponse);
    } catch (error) {
      throw new TrustCaseError(
        'Failed to query trust cases',
        TrustCaseErrorCodes.CASE_NOT_FOUND,
        500
      );
    }
  }

  async getTrustCaseStats(filters?: any): Promise<TrustCaseStats> {
    try {
      const stats = await prisma.trustCase.aggregate({
        _count: {
          id: true
        },
        where: {
          ...(filters?.subject_type && { subject_type: filters.subject_type }),
          ...(filters?.subject_id && { subject_id: filters.subject_id }),
          ...(filters?.rule_id && { rule: { rule_id: filters.rule_id } }),
          ...(filters?.severity && { severity: filters.severity }),
          ...(filters?.status && { status: filters.status }),
          ...(filters?.date_range && {
            created_at: {
              gte: filters.date_range.start,
              lte: filters.date_range.end
            }
          })
        }
      });

      const statusStats = await prisma.trustCase.groupBy({
        by: ['status'],
        _count: {
          id: true
        },
        where: filters?.date_range ? {
          created_at: {
            gte: filters.date_range.start,
            lte: filters.date_range.end
          }
        } : undefined
      });

      const severityStats = await prisma.trustCase.groupBy({
        by: ['severity'],
        _count: {
          id: true
        },
        where: filters?.date_range ? {
          created_at: {
            gte: filters.date_range.start,
            lte: filters.date_range.end
          }
        } : undefined
      });

      const subjectTypeStats = await prisma.trustCase.groupBy({
        by: ['subject_type'],
        _count: {
          id: true
        },
        where: filters?.date_range ? {
          created_at: {
            gte: filters.date_range.start,
            lte: filters.date_range.end
          }
        } : undefined
      });

      const totalCases = stats._count.id || 0;
      const openCases = statusStats.find((s: any) => s.status === 'OPEN')?._count.id || 0;
      const underReviewCases = statusStats.find((s: any) => s.status === 'UNDER_REVIEW')?._count.id || 0;
      const resolvedCases = statusStats.find((s: any) => s.status === 'RESOLVED')?._count.id || 0;
      const dismissedCases = statusStats.find((s: any) => s.status === 'DISMISSED')?._count.id || 0;

      return {
        total_cases: totalCases,
        open_cases: openCases,
        under_review_cases: underReviewCases,
        resolved_cases: resolvedCases,
        dismissed_cases: dismissedCases,
        cases_by_severity: severityStats.reduce((acc: any, stat: any) => {
          acc[stat.severity] = stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        cases_by_subject_type: subjectTypeStats.reduce((acc: any, stat: any) => {
          acc[stat.subject_type] = stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        average_resolution_time: null, // Would need more complex query
        cases_created_today: 0, // Would need date filtering
        cases_created_this_week: 0, // Would need date filtering
        cases_created_this_month: 0 // Would need date filtering
      };
    } catch (error) {
      throw new TrustCaseError(
        'Failed to get trust case statistics',
        TrustCaseErrorCodes.CASE_NOT_FOUND,
        500
      );
    }
  }

  async getTrustCasesBySubject(subject_type: TrustCaseSubjectType, subject_id: string): Promise<TrustCaseResponse[]> {
    return this.queryTrustCases({ subject_type, subject_id, limit: 100, offset: 0 });
  }

  async getOpenTrustCases(): Promise<TrustCaseResponse[]> {
    return this.queryTrustCases({ status: 'OPEN' as TrustCaseStatus, limit: 100, offset: 0 });
  }

  async getTrustCasesByRule(rule_id: string): Promise<TrustCaseResponse[]> {
    return this.queryTrustCases({ rule_id, limit: 100, offset: 0 });
  }
}
