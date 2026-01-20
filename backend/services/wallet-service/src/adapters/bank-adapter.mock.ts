// ============================================================
// PHASE 4.5 — MOCK BANK ADAPTER
// Simulates bank API for testing
// NO REAL BANK INTEGRATION
// ============================================================

import {
  BankAdapter,
  BankPayoutRequest,
  BankPayoutResponse,
  BankStatusCheckResponse,
  BankPayoutStatus,
} from '../interfaces/bank-adapter.interface';

/**
 * Mock Bank Adapter
 * Simulates async bank behavior for testing
 * NO real money movement
 */
export class MockBankAdapter implements BankAdapter {
  private payouts: Map<string, {
    request: BankPayoutRequest;
    status: BankPayoutStatus;
    createdAt: Date;
    settledAt?: Date;
    failureReason?: string;
  }> = new Map();

  private successRate: number = 0.9; // 90% success rate
  private processingDelayMs: number = 1000; // Simulate async processing

  constructor(options?: {
    successRate?: number;
    processingDelayMs?: number;
  }) {
    if (options?.successRate !== undefined) {
      this.successRate = options.successRate;
    }
    if (options?.processingDelayMs !== undefined) {
      this.processingDelayMs = options.processingDelayMs;
    }
  }

  getName(): string {
    return 'MockBankAdapter';
  }

  /**
   * Send payout to mock bank
   * Simulates async bank processing
   */
  async sendPayout(request: BankPayoutRequest): Promise<BankPayoutResponse> {
    console.log(`[MockBank] Sending payout: ${request.reference}`);

    // Generate mock bank reference
    const bankReference = `BANK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Simulate validation
    if (!request.destinationIBAN || request.destinationIBAN.length < 15) {
      throw new Error('Invalid IBAN format');
    }

    if (request.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Store payout with initial PENDING status
    this.payouts.set(bankReference, {
      request,
      status: BankPayoutStatus.PENDING,
      createdAt: new Date(),
    });

    // Simulate async processing (will complete after delay)
    this.simulateAsyncProcessing(bankReference);

    return {
      bankReference,
      status: BankPayoutStatus.PENDING,
      estimatedSettlementDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24h
      fees: 0n, // No fees in mock
      message: 'Payout submitted successfully',
    };
  }

  /**
   * Check status of payout
   */
  async checkStatus(bankReference: string): Promise<BankStatusCheckResponse> {
    console.log(`[MockBank] Checking status: ${bankReference}`);

    const payout = this.payouts.get(bankReference);

    if (!payout) {
      return {
        bankReference,
        status: BankPayoutStatus.UNKNOWN,
        message: 'Payout not found',
      };
    }

    return {
      bankReference,
      status: payout.status,
      settledAt: payout.settledAt,
      failureReason: payout.failureReason,
      message: this.getStatusMessage(payout.status),
    };
  }

  /**
   * Simulate async bank processing
   * After delay, randomly succeed or fail based on successRate
   */
  private simulateAsyncProcessing(bankReference: string): void {
    setTimeout(() => {
      const payout = this.payouts.get(bankReference);
      if (!payout) return;

      // Update to PROCESSING
      payout.status = BankPayoutStatus.PROCESSING;

      // After another delay, complete or fail
      setTimeout(() => {
        const shouldSucceed = Math.random() < this.successRate;

        if (shouldSucceed) {
          payout.status = BankPayoutStatus.COMPLETED;
          payout.settledAt = new Date();
          console.log(`[MockBank] Payout ${bankReference} COMPLETED`);
        } else {
          payout.status = BankPayoutStatus.FAILED;
          payout.failureReason = 'Insufficient funds at destination bank';
          console.log(`[MockBank] Payout ${bankReference} FAILED`);
        }
      }, this.processingDelayMs);
    }, this.processingDelayMs / 2);
  }

  /**
   * Get human-readable status message
   */
  private getStatusMessage(status: BankPayoutStatus): string {
    switch (status) {
      case BankPayoutStatus.PENDING:
        return 'Payout is pending bank processing';
      case BankPayoutStatus.PROCESSING:
        return 'Payout is being processed by bank';
      case BankPayoutStatus.COMPLETED:
        return 'Payout completed successfully';
      case BankPayoutStatus.FAILED:
        return 'Payout failed';
      case BankPayoutStatus.UNKNOWN:
        return 'Payout status unknown';
      default:
        return 'Unknown status';
    }
  }

  /**
   * Force a payout to complete (for testing)
   */
  forceComplete(bankReference: string): void {
    const payout = this.payouts.get(bankReference);
    if (payout) {
      payout.status = BankPayoutStatus.COMPLETED;
      payout.settledAt = new Date();
    }
  }

  /**
   * Force a payout to fail (for testing)
   */
  forceFail(bankReference: string, reason: string): void {
    const payout = this.payouts.get(bankReference);
    if (payout) {
      payout.status = BankPayoutStatus.FAILED;
      payout.failureReason = reason;
    }
  }

  /**
   * Clear all payouts (for testing)
   */
  clear(): void {
    this.payouts.clear();
  }
}

// Singleton instance for testing
export const mockBankAdapter = new MockBankAdapter();
