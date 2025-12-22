/**
 * Payment Execution Service - STUB
 * ⛔ FORBIDDEN PRE-LICENSE ⛔
 *
 * This is a STUB file that throws errors for all execution methods.
 * IMPLEMENTATION IS FORBIDDEN until:
 * - Banking license approved, OR
 * - Regulated payment partner agreement signed
 *
 * All methods throw ExecutionNotLicensedError.
 */

import {
  ExecutionRequest,
  ExecutionResult,
  EscrowRecord,
  EscrowState,
  ConfirmationToken,
  ReconciliationReport,
  KillSwitchActivation,
  getExecutionDisclaimer,
} from '../types/execution.types';

// ===========================================
// Custom Error
// ===========================================

export class ExecutionNotLicensedError extends Error {
  public readonly code = 'EXECUTION_NOT_LICENSED';
  public readonly disclaimer = getExecutionDisclaimer();

  constructor(operation: string) {
    super(
      `${operation}: Payment execution is FORBIDDEN. ` +
      'Requires banking license or regulated partner agreement. ' +
      'Current mode: ADVISORY-ONLY.'
    );
    this.name = 'ExecutionNotLicensedError';
  }
}

// ===========================================
// Payment Execution Service (STUB)
// ===========================================

export class PaymentExecutionService {
  /**
   * ⛔ FORBIDDEN PRE-LICENSE
   * Execute a payment
   */
  async execute(_request: ExecutionRequest): Promise<ExecutionResult> {
    throw new ExecutionNotLicensedError('PaymentExecutionService.execute');
  }

  /**
   * ⛔ FORBIDDEN PRE-LICENSE
   * Get execution status
   */
  async getStatus(_executionId: string): Promise<ExecutionResult> {
    throw new ExecutionNotLicensedError('PaymentExecutionService.getStatus');
  }

  /**
   * ⛔ FORBIDDEN PRE-LICENSE
   * Cancel execution
   */
  async cancel(_executionId: string, _reason: string): Promise<ExecutionResult> {
    throw new ExecutionNotLicensedError('PaymentExecutionService.cancel');
  }

  /**
   * ⛔ FORBIDDEN PRE-LICENSE
   * Refund execution
   */
  async refund(_executionId: string, _amount?: number): Promise<ExecutionResult> {
    throw new ExecutionNotLicensedError('PaymentExecutionService.refund');
  }
}

// ===========================================
// Escrow Execution Service (STUB)
// ===========================================

export class EscrowExecutionService {
  /**
   * ⛔ FORBIDDEN PRE-LICENSE
   * Create escrow
   */
  async create(_executionId: string, _amount: number, _currency: string): Promise<EscrowRecord> {
    throw new ExecutionNotLicensedError('EscrowExecutionService.create');
  }

  /**
   * ⛔ FORBIDDEN PRE-LICENSE
   * Fund escrow
   */
  async fund(_escrowId: string): Promise<EscrowRecord> {
    throw new ExecutionNotLicensedError('EscrowExecutionService.fund');
  }

  /**
   * ⛔ FORBIDDEN PRE-LICENSE
   * Lock escrow
   */
  async lock(_escrowId: string): Promise<EscrowRecord> {
    throw new ExecutionNotLicensedError('EscrowExecutionService.lock');
  }

  /**
   * ⛔ FORBIDDEN PRE-LICENSE
   * Release escrow
   */
  async release(_escrowId: string, _approvedBy?: string): Promise<EscrowRecord> {
    throw new ExecutionNotLicensedError('EscrowExecutionService.release');
  }

  /**
   * ⛔ FORBIDDEN PRE-LICENSE
   * Refund escrow
   */
  async refund(_escrowId: string, _reason: string): Promise<EscrowRecord> {
    throw new ExecutionNotLicensedError('EscrowExecutionService.refund');
  }

  /**
   * ⛔ FORBIDDEN PRE-LICENSE
   * Get escrow status
   */
  async getStatus(_escrowId: string): Promise<EscrowRecord> {
    throw new ExecutionNotLicensedError('EscrowExecutionService.getStatus');
  }

  /**
   * ⛔ FORBIDDEN PRE-LICENSE
   * Transition escrow state
   */
  async transition(_escrowId: string, _toState: EscrowState, _reason: string): Promise<EscrowRecord> {
    throw new ExecutionNotLicensedError('EscrowExecutionService.transition');
  }
}

// ===========================================
// Confirmation Service (STUB)
// ===========================================

export class ConfirmationService {
  /**
   * ⛔ FORBIDDEN PRE-LICENSE
   * Generate confirmation token
   */
  async generateToken(_advisoryId: string, _userId: string): Promise<ConfirmationToken> {
    throw new ExecutionNotLicensedError('ConfirmationService.generateToken');
  }

  /**
   * ⛔ FORBIDDEN PRE-LICENSE
   * Validate confirmation token
   */
  async validateToken(_token: string): Promise<boolean> {
    throw new ExecutionNotLicensedError('ConfirmationService.validateToken');
  }

  /**
   * ⛔ FORBIDDEN PRE-LICENSE
   * Consume confirmation token
   */
  async consumeToken(_token: string): Promise<void> {
    throw new ExecutionNotLicensedError('ConfirmationService.consumeToken');
  }
}

// ===========================================
// PSP Connector Service (STUB)
// ===========================================

export class PSPConnectorService {
  /**
   * ⛔ FORBIDDEN PRE-LICENSE
   * Create payment intent
   */
  async createPaymentIntent(_provider: string, _request: unknown): Promise<unknown> {
    throw new ExecutionNotLicensedError('PSPConnectorService.createPaymentIntent');
  }

  /**
   * ⛔ FORBIDDEN PRE-LICENSE
   * Capture payment
   */
  async capturePayment(_provider: string, _intentId: string): Promise<unknown> {
    throw new ExecutionNotLicensedError('PSPConnectorService.capturePayment');
  }

  /**
   * ⛔ FORBIDDEN PRE-LICENSE
   * Refund payment
   */
  async refundPayment(_provider: string, _paymentId: string, _amount: number): Promise<unknown> {
    throw new ExecutionNotLicensedError('PSPConnectorService.refundPayment');
  }

  /**
   * ⛔ FORBIDDEN PRE-LICENSE
   * Get payment status
   */
  async getPaymentStatus(_provider: string, _paymentId: string): Promise<unknown> {
    throw new ExecutionNotLicensedError('PSPConnectorService.getPaymentStatus');
  }
}

// ===========================================
// Reconciliation Service (STUB)
// ===========================================

export class ReconciliationService {
  /**
   * ⛔ FORBIDDEN PRE-LICENSE
   * Run daily reconciliation
   */
  async runDailyReconciliation(_date: string): Promise<ReconciliationReport> {
    throw new ExecutionNotLicensedError('ReconciliationService.runDailyReconciliation');
  }

  /**
   * ⛔ FORBIDDEN PRE-LICENSE
   * Get reconciliation report
   */
  async getReport(_reportId: string): Promise<ReconciliationReport> {
    throw new ExecutionNotLicensedError('ReconciliationService.getReport');
  }

  /**
   * ⛔ FORBIDDEN PRE-LICENSE
   * Resolve discrepancy
   */
  async resolveDiscrepancy(_discrepancyId: string, _resolution: string): Promise<void> {
    throw new ExecutionNotLicensedError('ReconciliationService.resolveDiscrepancy');
  }
}

// ===========================================
// Kill Switch Service (ALLOWED - Safety Critical)
// ===========================================

export class KillSwitchService {
  private switches: Map<string, boolean> = new Map([
    ['EMERGENCY_DISABLE_ALL', false],
    ['EXECUTION_FREEZE', false],
    ['ESCROW_RELEASE_HALT', false],
  ]);

  private activations: KillSwitchActivation[] = [];

  /**
   * ✅ ALLOWED - Safety critical
   * Check if any kill switch is active
   */
  isAnyActive(): boolean {
    for (const [, value] of this.switches) {
      if (value) return true;
    }
    return false;
  }

  /**
   * ✅ ALLOWED - Safety critical
   * Check specific kill switch
   */
  isActive(switchName: string): boolean {
    return this.switches.get(switchName) || false;
  }

  /**
   * ✅ ALLOWED - Safety critical
   * Activate kill switch
   */
  activate(switchName: string, reason: string, activatedBy: string): void {
    this.switches.set(switchName, true);
    this.activations.push({
      switch: switchName as any,
      reason,
      activatedBy,
      timestamp: new Date().toISOString(),
    });
    console.error(`[KILL SWITCH] ${switchName} ACTIVATED by ${activatedBy}: ${reason}`);
  }

  /**
   * ✅ ALLOWED - Safety critical
   * Deactivate kill switch (requires reason)
   */
  deactivate(switchName: string, reason: string, deactivatedBy: string): void {
    this.switches.set(switchName, false);
    this.activations.push({
      switch: switchName as any,
      reason: `DEACTIVATED: ${reason}`,
      activatedBy: deactivatedBy,
      timestamp: new Date().toISOString(),
    });
    console.log(`[KILL SWITCH] ${switchName} DEACTIVATED by ${deactivatedBy}: ${reason}`);
  }

  /**
   * ✅ ALLOWED - Safety critical
   * Get all switch states
   */
  getAllStates(): Record<string, boolean> {
    const states: Record<string, boolean> = {};
    for (const [key, value] of this.switches) {
      states[key] = value;
    }
    return states;
  }

  /**
   * ✅ ALLOWED - Safety critical
   * Get activation history
   */
  getActivationHistory(): KillSwitchActivation[] {
    return [...this.activations];
  }
}

// ===========================================
// Singleton Instances
// ===========================================

export const paymentExecutionService = new PaymentExecutionService();
export const escrowExecutionService = new EscrowExecutionService();
export const confirmationService = new ConfirmationService();
export const pspConnectorService = new PSPConnectorService();
export const reconciliationService = new ReconciliationService();
export const killSwitchService = new KillSwitchService();

// ===========================================
// License Check Helper
// ===========================================

/**
 * Check if execution is licensed
 * ALWAYS returns false until license approved
 */
export function isExecutionLicensed(): boolean {
  // ⛔ FORBIDDEN: Do not change this to true without legal approval
  const LICENSE_VERIFIED = false;
  const PARTNER_AGREEMENT_ACTIVE = false;

  return LICENSE_VERIFIED && PARTNER_AGREEMENT_ACTIVE;
}

/**
 * Get execution status
 */
export function getExecutionStatus(): {
  licensed: boolean;
  mode: 'ADVISORY_ONLY' | 'EXECUTION_ENABLED';
  disclaimer: string;
} {
  return {
    licensed: isExecutionLicensed(),
    mode: 'ADVISORY_ONLY',
    disclaimer: getExecutionDisclaimer().text,
  };
}
