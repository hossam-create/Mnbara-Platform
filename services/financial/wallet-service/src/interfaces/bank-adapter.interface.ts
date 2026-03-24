// ============================================================
// PHASE 4.5 — BANK ADAPTER INTERFACE
// Defines contract for bank integration
// MOCK ONLY - No real bank APIs
// ============================================================

export interface BankPayoutRequest {
  amount: bigint; // Minor units
  currency: string;
  destinationIBAN: string;
  destinationAccountHolder: string;
  destinationBankName?: string;
  reference: string; // Our payout instruction ID
  reason: string;
}

export interface BankPayoutResponse {
  bankReference: string; // Bank's transaction ID
  status: BankPayoutStatus;
  estimatedSettlementDate?: Date;
  fees?: bigint;
  message?: string;
}

export interface BankStatusCheckResponse {
  bankReference: string;
  status: BankPayoutStatus;
  settledAt?: Date;
  failureReason?: string;
  message?: string;
}

export enum BankPayoutStatus {
  PENDING = 'PENDING',       // Submitted, awaiting processing
  PROCESSING = 'PROCESSING', // Bank is processing
  COMPLETED = 'COMPLETED',   // Successfully settled
  FAILED = 'FAILED',         // Bank rejected or failed
  UNKNOWN = 'UNKNOWN',       // Cannot determine status
}

/**
 * Bank Adapter Interface
 * Defines contract for bank payout integration
 */
export interface BankAdapter {
  /**
   * Send payout instruction to bank
   * @param request - Payout request details
   * @returns Bank response with reference
   */
  sendPayout(request: BankPayoutRequest): Promise<BankPayoutResponse>;

  /**
   * Check status of existing payout
   * @param bankReference - Bank's transaction ID
   * @returns Current status from bank
   */
  checkStatus(bankReference: string): Promise<BankStatusCheckResponse>;

  /**
   * Get adapter name for logging
   */
  getName(): string;
}
