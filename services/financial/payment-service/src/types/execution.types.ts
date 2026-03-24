/**
 * Payment Execution Types
 * ⛔ FORBIDDEN PRE-LICENSE ⛔
 *
 * These types define the execution architecture.
 * IMPLEMENTATION IS FORBIDDEN until:
 * - Banking license approved, OR
 * - Regulated payment partner agreement signed
 *
 * Types can exist for planning purposes only.
 */

// ===========================================
// License Gate Types
// ===========================================

export interface LicenseGate {
  LICENSE_VERIFIED: boolean;           // DEFAULT: false
  PARTNER_AGREEMENT_ACTIVE: boolean;   // DEFAULT: false
  REGULATORY_APPROVAL_DATE: string | null;
  APPROVED_CORRIDORS: string[];
  APPROVED_CURRENCIES: string[];
  MAX_TRANSACTION_LIMIT: number;       // DEFAULT: 0
}

// ===========================================
// Kill Switch Types
// ===========================================

export interface KillSwitches {
  EMERGENCY_DISABLE_ALL: boolean;
  EXECUTION_FREEZE: boolean;
  ESCROW_RELEASE_HALT: boolean;
  CORRIDOR_SUSPEND: Record<string, boolean>;
  PSP_DISCONNECT: Record<string, boolean>;
}

export interface KillSwitchActivation {
  switch: keyof KillSwitches;
  reason: string;
  activatedBy: string;
  timestamp: string;
  autoDeactivateAt?: string;
}

// ===========================================
// Confirmation Types
// ===========================================

export interface ConfirmationRequirements {
  userReviewedAdvisory: boolean;
  userConfirmedDetails: boolean;
  twoFactorVerified: boolean;
  confirmationTokenValid: boolean;
  finalButtonClicked: boolean;
  tokenExpiresAt: string;
  confirmedAmount: number;
  confirmedCurrency: string;
  confirmedRecipient: string;
  confirmedFees: number;
}

export interface ConfirmationToken {
  token: string;
  advisoryId: string;
  userId: string;
  amount: number;
  currency: string;
  recipientId: string;
  fees: number;
  createdAt: string;
  expiresAt: string;
  used: boolean;
}

// ===========================================
// Execution Types
// ===========================================

export interface ExecutionRequest {
  advisoryId: string;
  confirmationToken: string;
  userId: string;
  amount: number;
  currency: string;
  recipientId: string;
  paymentMethod: PaymentMethod;
  metadata?: Record<string, unknown>;
}

export type PaymentMethod = 'ESCROW' | 'CARD' | 'WALLET' | 'BANK_TRANSFER';

export interface ExecutionResult {
  executionId: string;
  status: ExecutionStatus;
  escrowId?: string;
  pspReference?: string;
  auditHash: string;
  timestamp: string;
  error?: ExecutionError;
}

export type ExecutionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface ExecutionError {
  code: string;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

// ===========================================
// Escrow Types
// ===========================================

export type EscrowState =
  | 'CREATED'
  | 'FUNDED'
  | 'LOCKED'
  | 'RELEASED'
  | 'SETTLED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'DISPUTED'
  | 'PARTIAL'
  | 'COMPLETED';

export interface EscrowRecord {
  escrowId: string;
  executionId: string;
  state: EscrowState;
  amount: number;
  currency: string;
  buyerId: string;
  sellerId: string;
  travelerId?: string;
  createdAt: string;
  fundedAt?: string;
  lockedAt?: string;
  releasedAt?: string;
  settledAt?: string;
  coolingPeriodEndsAt?: string;
  releaseConditions: EscrowReleaseConditions;
  stateHistory: EscrowStateChange[];
}

export interface EscrowReleaseConditions {
  deliveryConfirmedByBuyer: boolean;
  noActiveDisputes: boolean;
  coolingPeriodElapsed: boolean;
  humanApprovalIfHighValue: boolean;
  killSwitchesInactive: boolean;
  recipientKYCVerified: boolean;
  noFraudSignals: boolean;
  withinDailyLimits: boolean;
}

export interface EscrowStateChange {
  fromState: EscrowState;
  toState: EscrowState;
  timestamp: string;
  reason: string;
  triggeredBy: string;
  auditHash: string;
}

// ===========================================
// PSP Types
// ===========================================

export type PSPProvider = 'STRIPE' | 'PAYMOB' | 'PAYPAL' | 'BANK_API';

export interface PSPConfig {
  provider: PSPProvider;
  enabled: boolean;
  corridors: string[];
  currencies: string[];
  maxTransactionLimit: number;
}

export interface PSPPaymentRequest {
  amount: number;
  currency: string;
  customerId: string;
  paymentMethodId: string;
  metadata: Record<string, string>;
  idempotencyKey: string;
}

export interface PSPPaymentResult {
  pspReference: string;
  status: 'SUCCEEDED' | 'PENDING' | 'FAILED';
  amount: number;
  currency: string;
  fees: number;
  timestamp: string;
  rawResponse?: unknown;
}

// ===========================================
// Reconciliation Types
// ===========================================

export interface ReconciliationReport {
  reportId: string;
  date: string;
  internalTransactions: number;
  pspTransactions: number;
  matchedCount: number;
  discrepancyCount: number;
  totalDiscrepancyAmount: number;
  discrepancies: ReconciliationDiscrepancy[];
  status: 'CLEAN' | 'DISCREPANCIES_FOUND' | 'EXECUTION_PAUSED';
  reviewedBy?: string;
  resolvedAt?: string;
}

export interface ReconciliationDiscrepancy {
  discrepancyId: string;
  internalId: string;
  pspReference: string;
  internalAmount: number;
  pspAmount: number;
  difference: number;
  type: 'AMOUNT_MISMATCH' | 'MISSING_INTERNAL' | 'MISSING_PSP' | 'STATUS_MISMATCH';
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  resolution?: string;
}

// ===========================================
// Audit Types
// ===========================================

export interface ExecutionAuditEntry {
  auditId: string;
  executionId: string;
  action: ExecutionAuditAction;
  timestamp: string;
  userId?: string;
  systemId?: string;
  previousState?: string;
  newState?: string;
  metadata?: Record<string, unknown>;
  hash: string;
  previousHash: string;
}

export type ExecutionAuditAction =
  | 'EXECUTION_REQUESTED'
  | 'CONFIRMATION_VALIDATED'
  | 'ESCROW_CREATED'
  | 'ESCROW_FUNDED'
  | 'ESCROW_LOCKED'
  | 'ESCROW_RELEASED'
  | 'ESCROW_SETTLED'
  | 'ESCROW_REFUNDED'
  | 'ESCROW_DISPUTED'
  | 'PSP_SUBMITTED'
  | 'PSP_CONFIRMED'
  | 'PSP_FAILED'
  | 'KILL_SWITCH_ACTIVATED'
  | 'KILL_SWITCH_DEACTIVATED'
  | 'RECONCILIATION_RUN'
  | 'DISCREPANCY_FOUND'
  | 'DISCREPANCY_RESOLVED';

// ===========================================
// Feature Flag Types (Execution)
// ===========================================

export interface ExecutionFeatureFlags {
  // Master switches - ALL DEFAULT FALSE
  PAYMENT_EXECUTION_ENABLED: boolean;
  ESCROW_EXECUTION_ENABLED: boolean;
  PSP_INTEGRATION_ENABLED: boolean;

  // Per-PSP controls - ALL DEFAULT FALSE
  STRIPE_ENABLED: boolean;
  PAYMOB_ENABLED: boolean;
  PAYPAL_ENABLED: boolean;
  BANK_API_ENABLED: boolean;

  // Limits - ALL DEFAULT ZERO
  MAX_SINGLE_TRANSACTION: number;
  MAX_DAILY_VOLUME: number;
  MAX_ESCROW_HOLD_DAYS: number;
}

// ===========================================
// Cooling Period Configuration
// ===========================================

export const COOLING_PERIODS = {
  UNDER_100: 24 * 60 * 60 * 1000,    // 24 hours
  UNDER_500: 48 * 60 * 60 * 1000,    // 48 hours
  OVER_500: 72 * 60 * 60 * 1000,     // 72 hours + human approval
} as const;

// ===========================================
// Disclaimer
// ===========================================

export interface ExecutionDisclaimer {
  type: 'EXECUTION_FORBIDDEN';
  text: string;
  requiresLicense: true;
  requiresPartnerAgreement: true;
  timestamp: string;
}

export function getExecutionDisclaimer(): ExecutionDisclaimer {
  return {
    type: 'EXECUTION_FORBIDDEN',
    text: 'Payment execution is forbidden until banking license or regulated partner agreement is approved. This system operates in advisory-only mode.',
    requiresLicense: true,
    requiresPartnerAgreement: true,
    timestamp: new Date().toISOString(),
  };
}
