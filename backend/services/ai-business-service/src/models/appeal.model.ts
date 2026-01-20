import { z } from 'zod';

// Appeal Status
export const AppealStatusSchema = z.enum(['OPEN', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED']);
export type AppealStatus = z.infer<typeof AppealStatusSchema>;

// Appeal Actor Type
export const AppealActorTypeSchema = z.enum(['USER', 'TRAVELER', 'SELLER', 'AUCTION']);
export type AppealActorType = z.infer<typeof AppealActorTypeSchema>;

// Appeal Create Schema
export const AppealCreateSchema = z.object({
  trust_case_id: z.string().uuid(),
  actor_id: z.string().uuid(),
  actor_type: AppealActorTypeSchema,
  message: z.string().min(1, 'Appeal message is required').max(5000, 'Appeal message cannot exceed 5000 characters'),
  status: AppealStatusSchema.default('OPEN'),
  created_at: z.date().default(new Date())
});

export type AppealCreate = z.infer<typeof AppealCreateSchema>;

// Appeal Update Schema
export const AppealUpdateSchema = z.object({
  status: AppealStatusSchema.optional(),
  admin_notes: z.string().optional(),
  reviewed_by: z.string().uuid().optional(),
  reviewed_at: z.date().optional()
});

export type AppealUpdate = z.infer<typeof AppealUpdateSchema>;

// Appeal Response Schema
export const AppealResponseSchema = z.object({
  appeal_id: z.string().uuid(),
  trust_case_id: z.string().uuid(),
  actor_id: z.string().uuid(),
  actor_type: AppealActorTypeSchema,
  message: z.string(),
  status: AppealStatusSchema,
  admin_notes: z.string().nullable(),
  reviewed_by: z.string().uuid().nullable(),
  reviewed_at: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date().nullable()
});

export type AppealResponse = z.infer<typeof AppealResponseSchema>;

// Appeal Query Schema
export const AppealQuerySchema = z.object({
  trust_case_id: z.string().uuid().optional(),
  actor_id: z.string().uuid().optional(),
  actor_type: AppealActorTypeSchema.optional(),
  status: AppealStatusSchema.optional(),
  created_after: z.date().optional(),
  created_before: z.date().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
});

export type AppealQuery = z.infer<typeof AppealQuerySchema>;

// Appeal Resolution Schema
export const AppealResolutionSchema = z.object({
  appeal_id: z.string().uuid(),
  status: z.enum(['ACCEPTED', 'REJECTED']),
  admin_notes: z.string().optional(),
  reviewed_by: z.string().uuid()
});

export type AppealResolution = z.infer<typeof AppealResolutionSchema>;

// Appeal Statistics Schema
export const AppealStatsSchema = z.object({
  total_appeals: z.number(),
  open_appeals: z.number(),
  under_review_appeals: z.number(),
  accepted_appeals: z.number(),
  rejected_appeals: z.number(),
  appeals_by_status: z.record(z.number()),
  appeals_by_actor_type: z.record(z.number()),
  average_review_time: z.number().nullable(),
  appeals_created_today: z.number(),
  appeals_created_this_week: z.number(),
  appeals_created_this_month: z.number()
});

export type AppealStats = z.infer<typeof AppealStatsSchema>;

// Appeal Filter Options
export interface AppealFilterOptions {
  trust_case_id?: string;
  actor_id?: string;
  actor_type?: AppealActorType;
  status?: AppealStatus;
  date_range?: {
    start: Date;
    end: Date;
  };
}

// Appeal Service Interface
export interface IAppealService {
  createAppeal(data: AppealCreate): Promise<AppealResponse>;
  getAppeal(appeal_id: string): Promise<AppealResponse | null>;
  updateAppeal(appeal_id: string, data: AppealUpdate): Promise<AppealResponse>;
  resolveAppeal(data: AppealResolution): Promise<AppealResponse>;
  queryAppeals(query: AppealQuery): Promise<AppealResponse[]>;
  getAppealsByTrustCase(trust_case_id: string): Promise<AppealResponse[]>;
  getAppealsByActor(actor_id: string, actor_type: AppealActorType): Promise<AppealResponse[]>;
  getOpenAppeals(): Promise<AppealResponse[]>;
  getAppealStats(filters?: AppealFilterOptions): Promise<AppealStats>;
}

// Appeal Validation Rules
export const AppealValidationRules = {
  // Appeal does NOT reverse any action automatically
  validateNoAutoReversal: (appeal_id: string) => {
    // This should always return false - Appeal has no automatic reversal capability
    return false;
  },

  // Appeal is informational only
  validateInformationalOnly: (appeal_id: string) => {
    // This should always return true - Appeal is purely informational
    return true;
  },

  // Appeal must be linked to a valid trust case
  validateTrustCaseLink: (trust_case_id: string) => {
    if (!trust_case_id) {
      throw new Error('Appeal must be linked to a valid trust case');
    }
    return true;
  },

  // Appeal message validation
  validateMessage: (message: string) => {
    if (!message || message.trim().length === 0) {
      throw new Error('Appeal message cannot be empty');
    }
    if (message.length > 5000) {
      throw new Error('Appeal message cannot exceed 5000 characters');
    }
    return true;
  },

  // Appeal status transition validation
  validateStatusTransition: (current_status: AppealStatus, new_status: AppealStatus) => {
    const validTransitions: Record<AppealStatus, AppealStatus[]> = {
      'OPEN': ['UNDER_REVIEW', 'REJECTED'],
      'UNDER_REVIEW': ['ACCEPTED', 'REJECTED'],
      'ACCEPTED': [], // Final state
      'REJECTED': [] // Final state
    };

    if (!validTransitions[current_status].includes(new_status)) {
      throw new Error(`Invalid status transition from ${current_status} to ${new_status}`);
    }
    return true;
  }
};

// Appeal Error Types
export class AppealError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppealError';
  }
}

export const AppealErrorCodes = {
  APPEAL_NOT_FOUND: 'APPEAL_NOT_FOUND',
  INVALID_ACTOR_TYPE: 'INVALID_ACTOR_TYPE',
  INVALID_STATUS: 'INVALID_STATUS',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  TRUST_CASE_NOT_FOUND: 'TRUST_CASE_NOT_FOUND',
  ACTOR_NOT_FOUND: 'ACTOR_NOT_FOUND',
  APPEAL_ALREADY_RESOLVED: 'APPEAL_ALREADY_RESOLVED',
  MESSAGE_TOO_LONG: 'MESSAGE_TOO_LONG',
  MESSAGE_EMPTY: 'MESSAGE_EMPTY',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  DUPLICATE_APPEAL: 'DUPLICATE_APPEAL'
} as const;

// Appeal Events
export interface AppealEvent {
  event_type: 'APPEAL_CREATED' | 'APPEAL_UPDATED' | 'APPEAL_ACCEPTED' | 'APPEAL_REJECTED';
  appeal_id: string;
  trust_case_id: string;
  actor_id: string;
  timestamp: Date;
  triggered_by: string;
  data: any;
}

// Appeal Notification Types
export const AppealNotificationTypes = {
  NEW_APPEAL_CREATED: 'NEW_APPEAL_CREATED',
  APPEAL_UNDER_REVIEW: 'APPEAL_UNDER_REVIEW',
  APPEAL_ACCEPTED: 'APPEAL_ACCEPTED',
  APPEAL_REJECTED: 'APPEAL_REJECTED',
  APPEAL_ASSIGNED: 'APPEAL_ASSIGNED'
} as const;

// Appeal Workflow States
export const AppealWorkflowStates = {
  // Initial state when appeal is submitted
  SUBMITTED: 'SUBMITTED',
  
  // Appeal is being reviewed by admin
  IN_REVIEW: 'IN_REVIEW',
  
  // Appeal has been accepted (informational only)
  ACCEPTED: 'ACCEPTED',
  
  // Appeal has been rejected
  REJECTED: 'REJECTED'
} as const;

// Appeal Business Rules
export const AppealBusinessRules = {
  // Appeals are purely informational - no automatic reversals
  NO_AUTO_REVERSAL: true,
  
  // Appeals require admin review for resolution
  ADMIN_REVIEW_REQUIRED: true,
  
  // Appeals can be submitted by any actor type
  ALL_ACTORS_CAN_APPEAL: true,
  
  // Appeals are linked to trust cases
  REQUIRES_TRUST_CASE: true,
  
  // Appeals have message limits
  MESSAGE_LIMIT: 5000,
  
  // Appeals have status transition rules
  STATUS_TRANSITION_ENFORCED: true,
  
  // Appeals are audited
  AUDIT_REQUIRED: true
} as const;
