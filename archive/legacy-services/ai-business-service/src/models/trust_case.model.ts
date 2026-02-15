import { z } from 'zod';

// Trust Case Subject Types
export const TrustCaseSubjectTypeSchema = z.enum(['USER', 'TRAVELER', 'SELLER', 'AUCTION']);
export type TrustCaseSubjectType = z.infer<typeof TrustCaseSubjectTypeSchema>;

// Trust Case Status
export const TrustCaseStatusSchema = z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED']);
export type TrustCaseStatus = z.infer<typeof TrustCaseStatusSchema>;

// Trust Case Severity
export const TrustCaseSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type TrustCaseSeverity = z.infer<typeof TrustCaseSeveritySchema>;

// Trust Case Create Schema
export const TrustCaseCreateSchema = z.object({
  subject_type: TrustCaseSubjectTypeSchema,
  subject_id: z.string().uuid(),
  rule_id: z.string().uuid(),
  severity: TrustCaseSeveritySchema,
  status: TrustCaseStatusSchema.default('OPEN'),
  created_at: z.date().default(new Date())
});

export type TrustCaseCreate = z.infer<typeof TrustCaseCreateSchema>;

// Trust Case Update Schema
export const TrustCaseUpdateSchema = z.object({
  status: TrustCaseStatusSchema.optional(),
  severity: TrustCaseSeveritySchema.optional(),
  updated_at: z.date().optional()
});

export type TrustCaseUpdate = z.infer<typeof TrustCaseUpdateSchema>;

// Trust Case Response Schema
export const TrustCaseResponseSchema = z.object({
  case_id: z.string().uuid(),
  subject_type: TrustCaseSubjectTypeSchema,
  subject_id: z.string().uuid(),
  rule_id: z.string().uuid(),
  severity: TrustCaseSeveritySchema,
  status: TrustCaseStatusSchema,
  created_at: z.date(),
  updated_at: z.date().nullable(),
  resolved_at: z.date().nullable(),
  resolved_by: z.string().uuid().nullable(),
  notes: z.string().nullable()
});

export type TrustCaseResponse = z.infer<typeof TrustCaseResponseSchema>;

// Trust Case Query Schema
export const TrustCaseQuerySchema = z.object({
  subject_type: TrustCaseSubjectTypeSchema.optional(),
  subject_id: z.string().uuid().optional(),
  rule_id: z.string().uuid().optional(),
  severity: TrustCaseSeveritySchema.optional(),
  status: TrustCaseStatusSchema.optional(),
  created_after: z.date().optional(),
  created_before: z.date().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
});

export type TrustCaseQuery = z.infer<typeof TrustCaseQuerySchema>;

// Trust Case Resolution Schema
export const TrustCaseResolutionSchema = z.object({
  case_id: z.string().uuid(),
  status: z.enum(['RESOLVED', 'DISMISSED']),
  notes: z.string().optional(),
  resolved_by: z.string().uuid()
});

export type TrustCaseResolution = z.infer<typeof TrustCaseResolutionSchema>;

// Trust Case Statistics Schema
export const TrustCaseStatsSchema = z.object({
  total_cases: z.number(),
  open_cases: z.number(),
  under_review_cases: z.number(),
  resolved_cases: z.number(),
  dismissed_cases: z.number(),
  cases_by_severity: z.record(z.number()),
  cases_by_subject_type: z.record(z.number()),
  average_resolution_time: z.number().nullable(),
  cases_created_today: z.number(),
  cases_created_this_week: z.number(),
  cases_created_this_month: z.number()
});

export type TrustCaseStats = z.infer<typeof TrustCaseStatsSchema>;

// Trust Case Filter Options
export interface TrustCaseFilterOptions {
  subject_type?: TrustCaseSubjectType;
  subject_id?: string;
  rule_id?: string;
  severity?: TrustCaseSeverity;
  status?: TrustCaseStatus;
  date_range?: {
    start: Date;
    end: Date;
  };
}

// Trust Case Service Interface
export interface ITrustCaseService {
  createTrustCase(data: TrustCaseCreate): Promise<TrustCaseResponse>;
  getTrustCase(case_id: string): Promise<TrustCaseResponse | null>;
  updateTrustCase(case_id: string, data: TrustCaseUpdate): Promise<TrustCaseResponse>;
  resolveTrustCase(data: TrustCaseResolution): Promise<TrustCaseResponse>;
  queryTrustCases(query: TrustCaseQuery): Promise<TrustCaseResponse[]>;
  getTrustCaseStats(filters?: TrustCaseFilterOptions): Promise<TrustCaseStats>;
  getTrustCasesBySubject(subject_type: TrustCaseSubjectType, subject_id: string): Promise<TrustCaseResponse[]>;
  getOpenTrustCases(): Promise<TrustCaseResponse[]>;
  getTrustCasesByRule(rule_id: string): Promise<TrustCaseResponse[]>;
}

// Trust Case Validation Rules
export const TrustCaseValidationRules = {
  // TrustCase can only be created from rule flags
  validateCreation: (data: TrustCaseCreate) => {
    if (!data.rule_id) {
      throw new Error('TrustCase must be created from a rule flag');
    }
    return true;
  },
  
  // TrustCase has zero financial authority
  validateFinancialAuthority: (case_id: string) => {
    // This should always return false - TrustCase has no financial authority
    return false;
  },
  
  // TrustCase has no wallet/escrow/ledger access
  validateFinancialAccess: (case_id: string, resource: string) => {
    // This should always return false - TrustCase cannot access financial resources
    return false;
  },
  
  // Human decision required for resolution
  validateHumanDecision: (case_id: string, resolved_by: string) => {
    if (!resolved_by) {
      throw new Error('Human decision required for TrustCase resolution');
    }
    return true;
  }
};

// Trust Case Error Types
export class TrustCaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'TrustCaseError';
  }
}

export const TrustCaseErrorCodes = {
  CASE_NOT_FOUND: 'CASE_NOT_FOUND',
  INVALID_SUBJECT_TYPE: 'INVALID_SUBJECT_TYPE',
  INVALID_STATUS: 'INVALID_STATUS',
  INVALID_SEVERITY: 'INVALID_SEVERITY',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  FINANCIAL_ACCESS_DENIED: 'FINANCIAL_ACCESS_DENIED',
  RULE_NOT_FOUND: 'RULE_NOT_FOUND',
  SUBJECT_NOT_FOUND: 'SUBJECT_NOT_FOUND',
  HUMAN_DECISION_REQUIRED: 'HUMAN_DECISION_REQUIRED',
  CASE_ALREADY_RESOLVED: 'CASE_ALREADY_RESOLVED'
} as const;

// Trust Case Events
export interface TrustCaseEvent {
  event_type: 'CASE_CREATED' | 'CASE_UPDATED' | 'CASE_RESOLVED' | 'CASE_DISMISSED';
  case_id: string;
  timestamp: Date;
  triggered_by: string;
  data: any;
}

// Trust Case Notification Types
export const TrustCaseNotificationTypes = {
  NEW_CASE_CREATED: 'NEW_CASE_CREATED',
  CASE_ASSIGNED: 'CASE_ASSIGNED',
  CASE_UPDATED: 'CASE_UPDATED',
  CASE_RESOLVED: 'CASE_RESOLVED',
  CASE_DISMISSED: 'CASE_DISMISSED',
  HIGH_SEVERITY_CASE: 'HIGH_SEVERITY_CASE',
  CRITICAL_CASE_CREATED: 'CRITICAL_CASE_CREATED'
} as const;
