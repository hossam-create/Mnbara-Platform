import { logger } from '../utils/logger';

export interface FeeBreakdown {
  subtotal: number;
  platformFee: number;
  paymentProcessingFee: number;
  shippingFee: number;
  tax: number;
  total: number;
  breakdown: {
    label: string;
    amount: number;
    percentage?: number;
  }[];
}

export interface FeeCalculationRequest {
  itemPrice: number;
  quantity: number;
  shippingCost?: number;
  taxRate?: number;
  userType?: 'buyer' | 'seller';
  paymentMethod?: 'card' | 'paypal' | 'wallet';
}

/**
 * Fee Calculator Service
 * Requirements: TRN-001, TRN-002
 */
export class FeeCalculatorService {
  // Fee configuration
  private readonly PLATFORM_FEE_PERCENTAGE = 0.08; // 8%
  private readonly PAYMENT_PROCESSING_FEE_PERCENTAGE = 0.029; // 2.9%
  private readonly PAYMENT_PROCESSING_FEE_FIXED = 0.30; // $0.30
  private readonly DEFAULT_TAX_RATE = 0.08; // 8%

  /**
   * Calculate complete fee breakdown
   * Requirements: TRN-002
   */
  calculateFees(request: FeeCalculationRequest): FeeBreakdown {
    try {
      logger.info(`Calculating fees for item price: ${request.itemPrice}`);

      const subtotal = request.itemPrice * (request.quantity || 1);
      const shippingFee = request.shippingCost || 0;
      const taxRate = request.taxRate || this.DEFAULT_TAX_RATE;

      // Calculate platform fee (on subtotal)
      const platformFee = this.calculatePlatformFee(subtotal);

      // Calculate payment processing fee
      const paymentProcessingFee = this.calculatePaymentProcessingFee(
        subtotal + platformFee + shippingFee,
        request.paymentMethod
      );

      // Calculate tax (on subtotal + fees)
      const taxableAmount = subtotal + platformFee + paymentProcessingFee + shippingFee;
      const tax = Math.round(taxableAmount * taxRate * 100) / 100;

      const total = subtotal + platformFee + paymentProcessingFee + shippingFee + tax;

      const breakdown = [
        {
          label: 'Item Price',
          amount: subtotal,
          percentage: 100,
        },
        {
          label: 'Platform Fee',
          amount: platformFee,
          percentage: (platformFee / subtotal) * 100,
        },
        {
          label: 'Payment Processing',
          amount: paymentProcessingFee,
          percentage: (paymentProcessingFee / subtotal) * 100,
        },
      ];

      if (shippingFee > 0) {
        breakdown.push({
          label: 'Shipping',
          amount: shippingFee,
        });
      }

      if (tax > 0) {
        breakdown.push({
          label: 'Tax',
          amount: tax,
          percentage: (tax / taxableAmount) * 100,
        });
      }

      return {
        subtotal,
        platformFee,
        paymentProcessingFee,
        shippingFee,
        tax,
        total: Math.round(total * 100) / 100,
        breakdown,
      };
    } catch (error) {
      logger.error(`Failed to calculate fees: ${error}`);
      throw error;
    }
  }

  /**
   * Calculate platform fee
   * Requirements: TRN-002
   */
  private calculatePlatformFee(amount: number): number {
    return Math.round(amount * this.PLATFORM_FEE_PERCENTAGE * 100) / 100;
  }

  /**
   * Calculate payment processing fee
   * Requirements: TRN-002
   */
  private calculatePaymentProcessingFee(amount: number, paymentMethod?: string): number {
    let percentage = this.PAYMENT_PROCESSING_FEE_PERCENTAGE;

    // Adjust for payment method
    if (paymentMethod === 'paypal') {
      percentage = 0.034; // 3.4% for PayPal
    } else if (paymentMethod === 'wallet') {
      percentage = 0; // No fee for wallet
    }

    const percentageFee = Math.round(amount * percentage * 100) / 100;
    const fixedFee = paymentMethod === 'wallet' ? 0 : this.PAYMENT_PROCESSING_FEE_FIXED;

    return percentageFee + fixedFee;
  }

  /**
   * Get fee breakdown for display
   * Requirements: TRN-001
   */
  getFeeBreakdown(request: FeeCalculationRequest): FeeBreakdown {
    return this.calculateFees(request);
  }

  /**
   * Calculate seller earnings (after fees)
   * Requirements: TRN-002
   */
  calculateSellerEarnings(itemPrice: number, quantity: number = 1): number {
    const subtotal = itemPrice * quantity;
    const platformFee = this.calculatePlatformFee(subtotal);
    const paymentProcessingFee = this.calculatePaymentProcessingFee(subtotal);

    return Math.round((subtotal - platformFee - paymentProcessingFee) * 100) / 100;
  }

  /**
   * Get fee summary for quick display
   * Requirements: TRN-001
   */
  getFeeSummary(request: FeeCalculationRequest): {
    itemPrice: number;
    totalFees: number;
    total: number;
    feePercentage: number;
  } {
    const breakdown = this.calculateFees(request);

    const totalFees =
      breakdown.platformFee +
      breakdown.paymentProcessingFee +
      breakdown.shippingFee +
      breakdown.tax;

    return {
      itemPrice: breakdown.subtotal,
      totalFees: Math.round(totalFees * 100) / 100,
      total: breakdown.total,
      feePercentage: (totalFees / breakdown.subtotal) * 100,
    };
  }
}

export const feeCalculatorService = new FeeCalculatorService();
