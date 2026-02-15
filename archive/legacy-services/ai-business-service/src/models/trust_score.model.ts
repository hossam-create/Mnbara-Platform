import { z } from 'zod';

// Trust Score Subject Types
export const TrustScoreSubjectTypeSchema = z.enum(['USER', 'TRAVELER', 'SELLER', 'AUCTION']);
export type TrustScoreSubjectType = z.infer<typeof TrustScoreSubjectTypeSchema>;

// Trust Score Categories
export const TrustScoreCategorySchema = z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL']);
export type TrustScoreCategory = z.infer<typeof TrustScoreCategorySchema>;

// Trust Score Storage Schema
export const TrustScoreStorageSchema = z.object({
  id: z.string().uuid(),
  score_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  subject_type: TrustScoreSubjectTypeSchema,
  trust_score: z.number().min(0).max(100),
  score_category: TrustScoreCategorySchema,
  score_breakdown: z.object({
    base_score: z.number(),
    severity_penalty: z.number(),
    appeal_adjustment: z.number(),
    time_decay_factor: z.number(),
    final_score: z.number()
  }),
  calculation_details: z.object({
    total_cases: z.number(),
    open_cases: z.number(),
    under_review_cases: z.number(),
    resolved_cases: z.number(),
    dismissed_cases: z.number(),
    appeals_count: z.number(),
    accepted_appeals: z.number(),
    rejected_appeals: z.number(),
    oldest_case_age_days: z.number(),
    newest_case_age_days: z.number(),
    calculation_date: z.date(),
    config_used: z.object({
      severityWeights: z.record(z.number()),
      appealImpactWeights: z.record(z.number()),
      timeDecayConfig: z.object({
        halfLife: z.number(),
        decayRate: z.number(),
        maxAge: z.number()
      }),
      scoreRanges: z.record(z.object({
        min: z.number(),
        max: z.number()
      }))
    })
  }),
  metadata: z.object({
    read_only: z.boolean(),
    non_binding: z.boolean(),
    not_used_in_payments: z.boolean(),
    last_updated: z.date()
  }),
  created_at: z.date(),
  updated_at: z.date().nullable()
});

export type TrustScoreStorage = z.infer<typeof TrustScoreStorageSchema>;

// Trust Score History Schema
export const TrustScoreHistorySchema = z.object({
  id: z.string().uuid(),
  score_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  subject_type: TrustScoreSubjectTypeSchema,
  trust_score: z.number().min(0).max(100),
  score_category: TrustScoreCategorySchema,
  score_change: z.number(), // Change from previous score
  change_reason: z.enum(['NEW_CASE', 'CASE_RESOLVED', 'APPEAL_OUTCOME', 'TIME_DECAY', 'CONFIG_CHANGE']),
  previous_score: z.number().nullable(),
  calculation_details: z.object({
    total_cases: z.number(),
    open_cases: z.number(),
    resolved_cases: z.number(),
    appeals_count: z.number(),
    accepted_appeals: z.number(),
    rejected_appeals: z.number(),
    calculation_date: z.date()
  }),
  created_at: z.date()
});

export type TrustScoreHistory = z.infer<typeof TrustScoreHistorySchema>;

// Trust Score Query Schema
export const TrustScoreQuerySchema = z.object({
  subject_id: z.string().uuid().optional(),
  subject_type: TrustScoreSubjectTypeSchema.optional(),
  score_category: TrustScoreCategorySchema.optional(),
  min_score: z.number().min(0).max(100).optional(),
  max_score: z.number().min(0).max(100).optional(),
  created_after: z.date().optional(),
  created_before: z.date().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
});

export type TrustScoreQuery = z.infer<typeof TrustScoreQuerySchema>;

// Trust Score Response Schema
export const TrustScoreResponseSchema = z.object({
  score_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  subject_type: TrustScoreSubjectTypeSchema,
  trust_score: z.number().min(0).max(100),
  score_category: TrustScoreCategorySchema,
  score_breakdown: z.object({
    base_score: z.number(),
    severity_penalty: z.number(),
    appeal_adjustment: z.number(),
    time_decay_factor: z.number(),
    final_score: z.number()
  }),
  calculation_details: z.object({
    total_cases: z.number(),
    open_cases: z.number(),
    resolved_cases: z.number(),
    dismissed_cases: z.number(),
    appeals_count: z.number(),
    accepted_appeals: z.number(),
    rejected_appeals: z.number(),
    oldest_case_age_days: z.number(),
    newest_case_age_days: z.number(),
    calculation_date: z.date()
  }),
  metadata: z.object({
    read_only: z.boolean(),
    non_binding: z.boolean(),
    not_used_in_payments: z.boolean(),
    last_updated: z.date()
  }),
  created_at: z.date(),
  updated_at: z.date().nullable()
});

export type TrustScoreResponse = z.infer<typeof TrustScoreResponseSchema>;

// Trust Score History Response Schema
export const TrustScoreHistoryResponseSchema = z.object({
  history_id: z.string().uuid(),
  score_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  subject_type: TrustScoreSubjectTypeSchema,
  trust_score: z.number().min(0).max(100),
  score_category: TrustScoreCategorySchema,
  score_change: z.number(),
  change_reason: z.enum(['NEW_CASE', 'CASE_RESOLVED', 'APPEAL_OUTCOME', 'TIME_DECAY', 'CONFIG_CHANGE']),
  previous_score: z.number().nullable(),
  calculation_details: z.object({
    total_cases: z.number(),
    open_cases: z.number(),
    resolved_cases: z.number(),
    appeals_count: z.number(),
    accepted_appeals: z.number(),
    rejected_appeals: z.number(),
    calculation_date: z.date()
  }),
  created_at: z.date()
});

export type TrustScoreHistoryResponse = z.infer<typeof TrustScoreHistoryResponseSchema>;

// Trust Score Statistics Schema
export const TrustScoreStatisticsSchema = z.object({
  total_subjects: z.number(),
  average_score: z.number(),
  median_score: z.number(),
  score_distribution: z.record(z.number()),
  subject_type_distribution: z.record(z.number()),
  recent_trends: z.object({
    daily_scores: z.array(z.object({
      date: z.date(),
      average_score: z.number(),
      subject_count: z.number()
    })),
    weekly_scores: z.array(z.object({
      week: z.string(),
      average_score: z.number(),
      subject_count: z.number()
    })),
    monthly_scores: z.array(z.object({
      month: z.string(),
      average_score: z.number(),
      subject_count: z.number()
    }))
  }),
  last_updated: z.date(),
  metadata: z.object({
    read_only: z.boolean(),
    non_binding: z.boolean(),
    not_used_in_payments: z.boolean()
  })
});

export type TrustScoreStatistics = z.infer<typeof TrustScoreStatisticsSchema>;

// Trust Score Service Interface
export interface ITrustScoreStorageService {
  storeTrustScore(score: TrustScoreStorage): Promise<TrustScoreStorage>;
  getTrustScore(subjectId: string, subjectType: TrustScoreSubjectType): Promise<TrustScoreStorage | null>;
  getTrustScoreHistory(subjectId: string, subjectType: TrustScoreSubjectType, limit?: number): Promise<TrustScoreHistory[]>;
  queryTrustScores(query: TrustScoreQuery): Promise<TrustScoreStorage[]>;
  updateTrustScore(scoreId: string, updates: Partial<TrustScoreStorage>): Promise<TrustScoreStorage>;
  deleteTrustScore(scoreId: string): Promise<boolean>;
  getTrustScoreStatistics(filters?: any): Promise<TrustScoreStatistics>;
}

// Trust Score Storage Rules
export const TrustScoreStorageRules = {
  // Score stored separately - no overwrite
  validateNoOverwrite: (existingScore: TrustScoreStorage | null, newScore: TrustScoreStorage) => {
    if (existingScore && existingScore.subject_id === newScore.subject_id && 
        existingScore.subject_type === newScore.subject_type) {
      // Allow update but preserve history
      return true;
    }
    return true;
  },

  // History preserved - never delete old records
  validateHistoryPreservation: (history: TrustScoreHistory[]) => {
    // History should never be deleted, only appended
    return true;
  },

  // Score is read only - no automatic actions
  validateReadOnly: (score: TrustScoreStorage) => {
    if (!score.metadata.read_only || !score.metadata.non_binding || !score.metadata.not_used_in_payments) {
      throw new Error('Trust score must be read-only, non-binding, and not used in payments');
    }
    return true;
  },

  // Score bounds validation
  validateScoreBounds: (score: number) => {
    if (score < 0 || score > 100) {
      throw new Error('Trust score must be between 0 and 100');
    }
    return true;
  },

  // Subject validation
  validateSubject: (subjectId: string, subjectType: TrustScoreSubjectType) => {
    if (!subjectId || !subjectType) {
      throw new Error('Subject ID and type are required');
    }
    return true;
  }
};

// Trust Score Error Types
export class TrustScoreStorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'TrustScoreStorageError';
  }
}

export const TrustScoreStorageErrorCodes = {
  SCORE_NOT_FOUND: 'SCORE_NOT_FOUND',
  INVALID_SUBJECT: 'INVALID_SUBJECT',
  INVALID_SCORE_BOUNDS: 'INVALID_SCORE_BOUNDS',
  STORAGE_ERROR: 'STORAGE_ERROR',
  HISTORY_NOT_FOUND: 'HISTORY_NOT_FOUND',
  QUERY_ERROR: 'QUERY_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  OVERWRITE_ATTEMPTED: 'OVERWRITE_ATTEMPTED',
  HISTORY_DELETION_ATTEMPTED: 'HISTORY_DELETION_ATTEMPTED'
} as const;

// Trust Score Change Reasons
export const TrustScoreChangeReasons = {
  NEW_CASE: 'NEW_CASE',
  CASE_RESOLVED: 'CASE_RESOLVED',
  APPEAL_OUTCOME: 'APPEAL_OUTCOME',
  TIME_DECAY: 'TIME_DECAY',
  CONFIG_CHANGE: 'CONFIG_CHANGE',
  MANUAL_RECALCULATION: 'MANUAL_RECALCULATION'
} as const;

// Trust Score Category Descriptions
export const TrustScoreCategoryDescriptions = {
  EXCELLENT: 'Excellent trust score - subject has outstanding trust record',
  GOOD: 'Good trust score - subject has strong trust record',
  FAIR: 'Fair trust score - subject has moderate trust record',
  POOR: 'Poor trust score - subject has concerning trust record',
  CRITICAL: 'Critical trust score - subject has serious trust issues'
} as const;

// Trust Score Display Configuration
export const TrustScoreDisplayConfig = {
  // User profile display settings
  userProfile: {
    showScore: true,
    showCategory: true,
    showBreakdown: false, // Simplified view for users
    showHistory: true,
    maxHistoryItems: 10,
    readOnly: true
  },

  // Admin dashboard display settings
  adminDashboard: {
    showScore: true,
    showCategory: true,
    showBreakdown: true, // Detailed view for admins
    showHistory: true,
    maxHistoryItems: 50,
    showStatistics: true,
    showTrends: true,
    readOnly: true
  }
} as const;

// Trust Score Export Formats
export const TrustScoreExportFormats = {
  JSON: 'application/json',
  CSV: 'text/csv',
  PDF: 'application/pdf',
  EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
} as const;

// Trust Score Notification Types
export const TrustScoreNotificationTypes = {
  SCORE_CHANGED: 'SCORE_CHANGED',
  CATEGORY_CHANGED: 'CATEGORY_CHANGED',
  SCORE_THRESHOLD_REACHED: 'SCORE_THRESHOLD_REACHED',
  SCORE_HISTORY_AVAILABLE: 'SCORE_HISTORY_AVAILABLE'
} as const;

// Trust Score Audit Events
export interface TrustScoreAuditEvent {
  event_type: 'SCORE_STORED' | 'SCORE_UPDATED' | 'SCORE_ACCESSED' | 'HISTORY_ACCESSED';
  score_id: string;
  subject_id: string;
  subject_type: TrustScoreSubjectType;
  timestamp: Date;
  triggered_by: string;
  data: any;
}

// Trust Score Cache Configuration
export const TrustScoreCacheConfig = {
  ttl: 3600, // 1 hour cache TTL
  maxSize: 10000, // Maximum 10,000 cached scores
  keyPrefix: 'trust_score:',
  historyTtl: 7200, // 2 hours for history
  statisticsTtl: 1800 // 30 minutes for statistics
} as const;
