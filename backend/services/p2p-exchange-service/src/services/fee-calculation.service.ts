// ============================================================
// Fee Calculation Service
// ============================================================

import { Decimal } from 'decimal.js';
import { TransactionClass } from '../types/enums';

export interface FeeCalculationResult {
  platformFee: Decimal;
  platformFeePercentage: Decimal;
  protectionFee: Decimal;
  urgentMatchingFee?: Decimal;
  totalFees: Decimal;
  transactionClass: TransactionClass;
}

export interface CalculateFeesInput {
  amount: Decimal;
  useExternalEscrow?: boolean;
  urgentMatching?: boolean;
}

export class FeeCalculationService {
  // Fee configuration
  private readonly PLATFORM_FEE_SMALL = new Decimal(0.015); // 1.5%
  private readonly PLATFORM_FEE_MEDIUM = new Decimal(0.01); // 1.0%
  private readonly PLATFORM_FEE_LARGE = new Decimal(0.005); // 0.5%

  private readonly PROTECTION_FEE_MIN = new Decimal(2);
  private readonly PROTECTION_FEE_MAX = new Decimal(5);

  private readonly URGENT_MATCHING_FEE_PERCENTAGE = new Decimal(0.005); // 0.5%

  private readonly SMALL_TRANSACTION_MAX = new Decimal(300);
  private readonly MEDIUM_TRANSACTION_MAX = new Decimal(1000);

  /**
   * Calculate all fees for a transaction
   */
  calculateFees(input: CalculateFeesInput): FeeCalculationResult {
    // Classify transaction
    const transactionClass = this.classifyTransaction(input.amount);

    // Calculate platform fee
    const platformFeePercentage = this.getPlatformFeePercentage(transactionClass);
    const platformFee = input.amount.mul(platformFeePercentage);

    // Calculate protection fee
    const protectionFee = input.useExternalEscrow
      ? this.getProtectionFee(input.amount)
      : new Decimal(0);

    // Calculate urgent matching fee
    const urgentMatchingFee = input.urgentMatching
      ? input.amount.mul(this.URGENT_MATCHING_FEE_PERCENTAGE)
      : undefined;

    // Calculate total
    const totalFees = platformFee
      .add(protectionFee)
      .add(urgentMatchingFee || new Decimal(0));

    return {
      platformFee,
      platformFeePercentage,
      protectionFee,
      urgentMatchingFee,
      totalFees,
      transactionClass,
    };
  }

  /**
   * Get platform fee percentage based on transaction class
   */
  getPlatformFeePercentage(transactionClass: TransactionClass): Decimal {
    switch (transactionClass) {
      case TransactionClass.SMALL:
        return this.PLATFORM_FEE_SMALL;
      case TransactionClass.MEDIUM:
        return this.PLATFORM_FEE_MEDIUM;
      case TransactionClass.LARGE:
        return this.PLATFORM_FEE_LARGE;
      default:
        return this.PLATFORM_FEE_SMALL;
    }
  }

  /**
   * Get protection fee (for external escrow)
   */
  getProtectionFee(amount: Decimal): Decimal {
    // Scale protection fee based on amount
    // $2 for small amounts, up to $5 for large amounts
    if (amount.lt(this.SMALL_TRANSACTION_MAX)) {
      return this.PROTECTION_FEE_MIN;
    } else if (amount.lt(this.MEDIUM_TRANSACTION_MAX)) {
      return new Decimal(3);
    } else {
      return this.PROTECTION_FEE_MAX;
    }
  }

  /**
   * Calculate external escrow provider fee
   */
  calculateExternalEscrowFee(
    amount: Decimal,
    providerFeePercentage: Decimal,
    providerFeeFixed?: Decimal
  ): Decimal {
    const percentageFee = amount.mul(providerFeePercentage);
    const fixedFee = providerFeeFixed || new Decimal(0);
    return percentageFee.add(fixedFee);
  }

  /**
   * Classify transaction by amount
   */
  classifyTransaction(amount: Decimal): TransactionClass {
    if (amount.lt(this.SMALL_TRANSACTION_MAX)) {
      return TransactionClass.SMALL;
    } else if (amount.lt(this.MEDIUM_TRANSACTION_MAX)) {
      return TransactionClass.MEDIUM;
    } else {
      return TransactionClass.LARGE;
    }
  }

  /**
   * Calculate total cost including fees
   */
  calculateTotalCost(amount: Decimal, fees: FeeCalculationResult): Decimal {
    return amount.add(fees.totalFees);
  }

  /**
   * Calculate net amount after fees
   */
  calculateNetAmount(amount: Decimal, fees: FeeCalculationResult): Decimal {
    return amount.sub(fees.totalFees);
  }

  /**
   * Compare with competitor rates
   */
  compareWithCompetitors(
    amount: Decimal,
    ourFees: FeeCalculationResult
  ): {
    wise: Decimal;
    westernUnion: Decimal;
    ourFees: Decimal;
    savings: Decimal;
  } {
    // Competitor fee estimates (simplified)
    const wiseFee = amount.mul(0.02); // ~2%
    const westernUnionFee = amount.mul(0.03); // ~3%

    const savings = Decimal.min(wiseFee, westernUnionFee).sub(ourFees.totalFees);

    return {
      wise: wiseFee,
      westernUnion: westernUnionFee,
      ourFees: ourFees.totalFees,
      savings,
    };
  }
}
