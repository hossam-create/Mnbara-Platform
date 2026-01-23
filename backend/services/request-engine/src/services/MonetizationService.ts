import { Request } from '../models/Request';

export interface FeeOptions {
  isUrgent: boolean;
  isInternational: boolean;
  deadlineHours: number;
}

export interface FeeCalculation {
  baseFee: number;
  urgentFee: number;
  internationalFee: number;
  highValueFee: number;
  totalFee: number;
  effectiveRate: number;
}

export interface RefundCalculation {
  itemRefund: number;
  feeRefund: number;
  processingFee: number;
  totalRefund: number;
  refundPercentage: number;
  reason: string;
}

export interface ReceiptData {
  requestId: string;
  itemCost: number;
  feeBreakdown: FeeCalculation;
  totalPaid: number;
  status: string;
  paymentMethod: string;
  travelerName?: string;
  route?: string;
  completedDate?: Date;
  rating?: number;
}

export class MonetizationService {
  private readonly MINIMUM_FEE = 3.00;
  private readonly MAXIMUM_FEE = 50.00;
  private readonly PROCESSING_FEE = 0.30;

  /**
   * Calculate service fee based on item value and options
   */
  calculateServiceFee(itemValue: number, options: FeeOptions): FeeCalculation {
    // Base fee calculation
    const baseFee = this.calculateBaseFee(itemValue);
    
    // Additional fees
    const urgentFee = options.isUrgent ? itemValue * 0.02 : 0;
    const internationalFee = options.isInternational ? itemValue * 0.01 : 0;
    const highValueFee = itemValue > 1000 ? itemValue * 0.005 : 0;
    
    // Calculate total before constraints
    let totalFee = baseFee + urgentFee + internationalFee + highValueFee;
    
    // Apply min/max constraints
    totalFee = Math.max(this.MINIMUM_FEE, Math.min(this.MAXIMUM_FEE, totalFee));
    
    const effectiveRate = (totalFee / itemValue) * 100;
    
    return {
      baseFee: this.calculateBaseFee(itemValue),
      urgentFee,
      internationalFee,
      highValueFee,
      totalFee,
      effectiveRate: Math.round(effectiveRate * 100) / 100
    };
  }

  /**
   * Calculate base fee using tiered structure
   */
  private calculateBaseFee(value: number): number {
    if (value <= 50) return value * 0.08;
    if (value <= 200) return value * 0.06;
    if (value <= 500) return value * 0.05;
    if (value <= 1000) return value * 0.04;
    return value * 0.03;
  }

  /**
   * Calculate refund amount based on cancellation timing and request status
   */
  calculateRefund(request: Request, cancellationTime: Date): RefundCalculation {
    const hoursSinceCreation = this.getHoursBetween(request.createdAt, cancellationTime);
    
    let refundPercentage = 0;
    let feeRefundable = true;
    let reason = '';

    // Determine refund percentage based on timing and status
    if (request.status === 'CREATED' || request.status === 'VISIBLE_TO_TRAVELERS') {
      if (hoursSinceCreation <= 1) {
        refundPercentage = 1.0;
        reason = 'Cancelled within 1 hour - Full refund';
      } else if (hoursSinceCreation <= 6) {
        refundPercentage = 0.9;
        reason = 'Cancelled within 6 hours - 90% refund';
      } else if (hoursSinceCreation <= 24) {
        refundPercentage = 0.75;
        reason = 'Cancelled within 24 hours - 75% refund';
      } else if (hoursSinceCreation <= 168) { // 7 days
        refundPercentage = 0.5;
        reason = 'Cancelled within 7 days - 50% refund';
      } else {
        refundPercentage = 0.25;
        feeRefundable = false;
        reason = 'Expired request - 25% refund';
      }
    } else if (request.status === 'ACCEPTED') {
      refundPercentage = 0.25;
      feeRefundable = false;
      reason = 'Cancelled after acceptance - 25% refund';
    } else if (request.status === 'IN_PROGRESS') {
      refundPercentage = 0;
      feeRefundable = false;
      reason = 'Cancelled during delivery - No refund';
    }

    // Calculate refund amounts
    const itemRefund = request.product.price * refundPercentage;
    const feeRefund = feeRefundable ? this.extractServiceFee(request) : 0;
    const processingFee = this.PROCESSING_FEE; // Always retained
    
    const totalRefund = Math.max(0, itemRefund + feeRefund - processingFee);

    return {
      itemRefund: Math.round(itemRefund * 100) / 100,
      feeRefund: Math.round(feeRefund * 100) / 100,
      processingFee,
      totalRefund: Math.round(totalRefund * 100) / 100,
      refundPercentage: Math.round(refundPercentage * 100),
      reason
    };
  }

  /**
   * Calculate refund for expired requests (no traveler found)
   */
  calculateExpirationRefund(request: Request): RefundCalculation {
    const totalPaid = request.product.price + this.extractServiceFee(request);
    
    return {
      itemRefund: request.product.price,
      feeRefund: this.extractServiceFee(request),
      processingFee: 0, // Waived for expiration
      totalRefund: totalPaid,
      refundPercentage: 100,
      reason: 'Request expired - No traveler found - Full refund'
    };
  }

  /**
   * Generate receipt data for display/email
   */
  generateReceipt(request: Request, paymentMethod: string): ReceiptData {
    const feeOptions = this.extractFeeOptions(request);
    const feeBreakdown = this.calculateServiceFee(request.product.price, feeOptions);
    
    return {
      requestId: request.id,
      itemCost: request.product.price,
      feeBreakdown,
      totalPaid: request.product.price + feeBreakdown.totalFee,
      status: request.status,
      paymentMethod,
      travelerName: request.travelerId ? 'Sarah T.' : undefined, // Would fetch from user service
      route: request.travelerId ? 
        `${request.delivery.origin.country} → ${request.delivery.destination.country}` : 
        undefined,
      completedDate: request.completedAt,
      rating: request.travelerId ? 5.0 : undefined // Would fetch from rating service
    };
  }

  /**
   * Generate cancellation receipt
   */
  generateCancellationReceipt(request: Request, cancellationTime: Date): ReceiptData {
    const refund = this.calculateRefund(request, cancellationTime);
    const feeOptions = this.extractFeeOptions(request);
    const feeBreakdown = this.calculateServiceFee(request.product.price, feeOptions);
    
    return {
      requestId: request.id,
      itemCost: request.product.price,
      feeBreakdown,
      totalPaid: request.product.price + feeBreakdown.totalFee,
      status: 'CANCELLED',
      paymentMethod: 'Refund to original payment method',
      // Refund-specific data would be added here
    };
  }

  /**
   * Extract fee options from request
   */
  private extractFeeOptions(request: Request): FeeOptions {
    const deadlineHours = this.getHoursBetween(new Date(), request.delivery.deadline);
    
    return {
      isUrgent: request.preferences.urgency === 'URGENT' || deadlineHours < 48,
      isInternational: request.delivery.origin.country !== request.delivery.destination.country,
      deadlineHours
    };
  }

  /**
   * Extract service fee from request (would be stored in request)
   */
  private extractServiceFee(request: Request): number {
    // In real implementation, this would be stored with the request
    const feeOptions = this.extractFeeOptions(request);
    const calculation = this.calculateServiceFee(request.product.price, feeOptions);
    return calculation.totalFee;
  }

  /**
   * Calculate hours between two dates
   */
  private getHoursBetween(startDate: Date, endDate: Date): number {
    return Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  }

  /**
   * Validate fee calculation
   */
  validateFeeCalculation(itemValue: number, fee: FeeCalculation): boolean {
    // Check if total fee is within bounds
    if (fee.totalFee < this.MINIMUM_FEE || fee.totalFee > this.MAXIMUM_FEE) {
      return false;
    }

    // Check if effective rate is reasonable
    if (fee.effectiveRate > 12 || fee.effectiveRate < 0.5) {
      return false;
    }

    // Check individual fee components
    if (fee.urgentFee > itemValue * 0.02) return false;
    if (fee.internationalFee > itemValue * 0.01) return false;
    if (fee.highValueFee > itemValue * 0.005) return false;

    return true;
  }

  /**
   * Get fee schedule for display
   */
  getFeeSchedule(): Array<{min: number; max: number; rate: string}> {
    return [
      { min: 0, max: 50, rate: '8%' },
      { min: 51, max: 200, rate: '6%' },
      { min: 201, max: 500, rate: '5%' },
      { min: 501, max: 1000, rate: '4%' },
      { min: 1001, max: Infinity, rate: '3%' }
    ];
  }

  /**
   * Calculate platform revenue for a period
   */
  calculateRevenue(requests: Request[], startDate: Date, endDate: Date): number {
    return requests
      .filter(req => req.createdAt >= startDate && req.createdAt <= endDate)
      .reduce((total, req) => {
        const feeOptions = this.extractFeeOptions(req);
        const fee = this.calculateServiceFee(req.product.price, feeOptions);
        return total + fee.totalFee;
      }, 0);
  }
}
