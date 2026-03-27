import { Decimal } from '@prisma/client/runtime/library';
import { SecurityDepositService } from '../services/security-deposit.service';
import { InsufficientSecurityDepositError } from '../errors/ExchangeErrors';

/**
 * Security Deposit Guard - Layer 1 of Seven-Layer Anti-Scam Architecture
 * 
 * Validates security deposit requirements before allowing transactions.
 * Freezes deposits on suspicious activity and deducts for compensation.
 * 
 * Rules:
 * - Users must maintain 10% of transaction amount as security deposit
 * - Deposits can be frozen for suspicious activity
 * - Deposits can be deducted to compensate victims of scams
 */
export class SecurityDepositGuard {
  private readonly REQUIRED_DEPOSIT_PERCENTAGE = 0.1; // 10%

  constructor(private readonly securityDepositService: SecurityDepositService) {}

  /**
   * Validate that user has sufficient security deposit
   * 
   * @param userId - User ID
   * @param transactionAmount - Transaction amount
   * @param currency - Currency code
   * @throws InsufficientSecurityDepositError if deposit is insufficient
   */
  async validateDeposit(
    userId: number,
    transactionAmount: Decimal,
    currency: string = 'USD'
  ): Promise<void> {
    const deposit = await this.securityDepositService.getDeposit(userId, currency);

    // Calculate required deposit (10% of transaction)
    const requiredDeposit = transactionAmount.mul(this.REQUIRED_DEPOSIT_PERCENTAGE);

    // Check available deposit (total - frozen)
    const availableDeposit = deposit.amount.minus(deposit.frozenAmount);

    if (availableDeposit.lessThan(requiredDeposit)) {
      throw new InsufficientSecurityDepositError(
        userId,
        currency,
        requiredDeposit.toString(),
        availableDeposit.toString()
      );
    }
  }

  /**
   * Freeze security deposit on suspicious activity
   * 
   * @param userId - User ID
   * @param amount - Amount to freeze
   * @param reason - Reason for freezing
   * @param currency - Currency code
   */
  async freezeOnSuspicion(
    userId: number,
    amount: Decimal,
    reason: string,
    currency: string = 'USD'
  ): Promise<void> {
    await this.securityDepositService.freezeDeposit(userId, amount, reason);
    
    // Log event for audit trail
    console.log('SECURITY_DEPOSIT_FROZEN', {
      userId,
      amount: amount.toString(),
      currency,
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Deduct security deposit to compensate victim
   * 
   * @param scammerId - Scammer user ID
   * @param victimId - Victim user ID
   * @param amount - Compensation amount
   * @param currency - Currency code
   */
  async deductForCompensation(
    scammerId: number,
    victimId: number,
    amount: Decimal,
    currency: string = 'USD'
  ): Promise<void> {
    // Deduct from scammer's deposit
    await this.securityDepositService.deductDeposit(
      scammerId,
      amount,
      `Scam compensation for user ${victimId}`
    );

    // Credit victim (would integrate with wallet service in production)
    // await walletService.credit(victimId, amount, currency);

    // Log event for audit trail
    console.log('SECURITY_DEPOSIT_DEDUCTED', {
      scammerId,
      victimId,
      amount: amount.toString(),
      currency,
      reason: 'Scam compensation',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Unfreeze security deposit after resolution
   * 
   * @param userId - User ID
   * @param amount - Amount to unfreeze
   * @param currency - Currency code
   */
  async unfreezeDeposit(
    userId: number,
    amount: Decimal,
    currency: string = 'USD'
  ): Promise<void> {
    await this.securityDepositService.unfreezeDeposit(userId, amount);

    console.log('SECURITY_DEPOSIT_UNFROZEN', {
      userId,
      amount: amount.toString(),
      currency,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get required deposit amount for transaction
   * 
   * @param transactionAmount - Transaction amount
   * @returns Required deposit amount
   */
  getRequiredDeposit(transactionAmount: Decimal): Decimal {
    return transactionAmount.mul(this.REQUIRED_DEPOSIT_PERCENTAGE);
  }

  /**
   * Check if user has sufficient deposit without throwing
   * 
   * @param userId - User ID
   * @param transactionAmount - Transaction amount
   * @param currency - Currency code
   * @returns True if sufficient, false otherwise
   */
  async hasSufficientDeposit(
    userId: number,
    transactionAmount: Decimal,
    currency: string = 'USD'
  ): Promise<boolean> {
    try {
      await this.validateDeposit(userId, transactionAmount, currency);
      return true;
    } catch (error) {
      if (error instanceof InsufficientSecurityDepositError) {
        return false;
      }
      throw error;
    }
  }
}
