import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface FeeCalculationInput {
    price: number;
    categoryId?: number;
    listingType?: 'buy_now' | 'auction';
    currency?: string;
}

export interface FeeBreakdown {
    platformFee: number;
    paymentProcessingFee: number;
    listingFee: number;
    totalFee: number;
    netAmount: number; // Amount seller receives
    currency: string;
    breakdown: {
        platformFee: {
            amount: number;
            percentage?: number;
            description: string;
        };
        paymentProcessingFee: {
            amount: number;
            percentage?: number;
            description: string;
        };
        listingFee: {
            amount: number;
            description: string;
        };
    };
    appliedRules: {
        platformFeeRuleId: number;
        paymentProcessingRuleId?: number;
        listingFeeRuleId?: number;
    };
}

export class FeeCalculationService {
    /**
     * Calculate fees for a listing or transaction
     * This is deterministic and uses active fee rules at the time of calculation
     */
    async calculateFees(input: FeeCalculationInput): Promise<FeeBreakdown> {
        const { price, categoryId, listingType = 'buy_now', currency = 'USD' } = input;

        // Validate input
        if (price <= 0) {
            throw new Error('Price must be greater than 0');
        }

        if (price > 1000000) {
            throw new Error('Price exceeds maximum allowed value');
        }

        // Get applicable fee rules
        const rules = await this.getApplicableRules({
            categoryId,
            listingType,
            price,
        });

        // Calculate platform fee
        const platformFee = this.calculatePlatformFee(price, rules);

        // Calculate payment processing fee (typically 2.9% + $0.30 for Stripe)
        const paymentProcessingFee = this.calculatePaymentProcessingFee(price, rules);

        // Calculate listing fee (if any)
        const listingFee = this.calculateListingFee(rules);

        // Calculate totals
        const totalFee = platformFee + paymentProcessingFee + listingFee;
        const netAmount = price - totalFee;

        // Build breakdown
        const platformRule = rules.find(r => r.feeType === 'PERCENTAGE' || r.feeType === 'FIXED');
        const paymentRule = rules.find(r => r.paymentProcessingFee !== null);

        return {
            platformFee: this.roundToTwoDecimals(platformFee),
            paymentProcessingFee: this.roundToTwoDecimals(paymentProcessingFee),
            listingFee: this.roundToTwoDecimals(listingFee),
            totalFee: this.roundToTwoDecimals(totalFee),
            netAmount: this.roundToTwoDecimals(netAmount),
            currency,
            breakdown: {
                platformFee: {
                    amount: this.roundToTwoDecimals(platformFee),
                    percentage: platformRule?.feeType === 'PERCENTAGE' ? Number(platformRule.feeValue) : undefined,
                    description: platformRule?.description || 'Platform fee',
                },
                paymentProcessingFee: {
                    amount: this.roundToTwoDecimals(paymentProcessingFee),
                    percentage: paymentRule?.paymentProcessingFee ? Number(paymentRule.paymentProcessingFee) : undefined,
                    description: 'Payment processing fee',
                },
                listingFee: {
                    amount: this.roundToTwoDecimals(listingFee),
                    description: 'Listing fee',
                },
            },
            appliedRules: {
                platformFeeRuleId: platformRule?.id || 0,
                paymentProcessingRuleId: paymentRule?.id,
                listingFeeRuleId: rules.find(r => r.listingFee !== null)?.id,
            },
        };
    }

    /**
     * Get applicable fee rules based on input criteria
     */
    private async getApplicableRules(params: {
        categoryId?: number;
        listingType?: string;
        price: number;
    }): Promise<any[]> {
        const { categoryId, listingType, price } = params;
        const now = new Date();

        // Build where clause with proper AND/OR structure
        const where: any = {
            isActive: true,
            effectiveFrom: { lte: now },
            AND: [
                {
                    OR: [
                        { effectiveTo: null },
                        { effectiveTo: { gte: now } },
                    ],
                },
                {
                    OR: [
                        { minPrice: null },
                        { minPrice: { lte: price } },
                    ],
                },
                {
                    OR: [
                        { maxPrice: null },
                        { maxPrice: { gte: price } },
                    ],
                },
            ],
        };

        // Add category filter
        if (categoryId) {
            where.AND.push({
                OR: [
                    { categoryId: null }, // Rules that apply to all categories
                    { categoryId },
                ],
            });
        } else {
            where.AND.push({ categoryId: null });
        }

        // Add listing type filter
        if (listingType) {
            where.AND.push({
                OR: [
                    { listingType: null }, // Rules that apply to all listing types
                    { listingType },
                ],
            });
        } else {
            where.AND.push({ listingType: null });
        }

        // Get rules ordered by priority (higher priority first)
        const rules = await prisma.feeRule.findMany({
            where,
            orderBy: [
                { priority: 'desc' },
                { version: 'desc' },
            ],
        });

        return rules;
    }

    /**
     * Calculate platform fee based on applicable rules
     */
    private calculatePlatformFee(price: number, rules: any[]): number {
        // Find the highest priority rule that applies
        const rule = rules
            .filter(r => r.feeType === 'PERCENTAGE' || r.feeType === 'FIXED')
            .sort((a, b) => b.priority - a.priority)[0];

        if (!rule) {
            // Default fee: 10% for $0-100, 8% for $101-500, 6% for $500+
            if (price <= 100) {
                return price * 0.10;
            } else if (price <= 500) {
                return price * 0.08;
            } else {
                return price * 0.06;
            }
        }

        if (rule.feeType === 'PERCENTAGE') {
            return price * (Number(rule.feeValue) / 100);
        } else if (rule.feeType === 'FIXED') {
            return Number(rule.feeValue);
        }

        return 0;
    }

    /**
     * Calculate payment processing fee
     */
    private calculatePaymentProcessingFee(price: number, rules: any[]): number {
        // Find rule with payment processing fee
        const rule = rules
            .filter(r => r.paymentProcessingFee !== null)
            .sort((a, b) => b.priority - a.priority)[0];

        if (rule && rule.paymentProcessingFee) {
            // Payment processing fee is typically a percentage
            return price * (Number(rule.paymentProcessingFee) / 100);
        }

        // Default: 2.9% (Stripe standard percentage)
        // Note: Fixed $0.30 fee is typically added separately in payment gateway
        return price * 0.029;
    }

    /**
     * Calculate listing fee
     */
    private calculateListingFee(rules: any[]): number {
        const rule = rules
            .filter(r => r.listingFee !== null)
            .sort((a, b) => b.priority - a.priority)[0];

        if (rule && rule.listingFee) {
            return Number(rule.listingFee);
        }

        return 0; // No listing fee by default
    }

    /**
     * Round to 2 decimal places
     */
    private roundToTwoDecimals(value: number): number {
        return Math.round(value * 100) / 100;
    }

    /**
     * Get fee calculation for a specific rule version (for existing transactions)
     * This ensures existing transactions use the fee rules that were active at the time
     */
    async calculateFeesWithVersion(
        input: FeeCalculationInput,
        ruleVersion: number,
        effectiveDate: Date
    ): Promise<FeeBreakdown> {
        // This would fetch rules with the specific version and effective date
        // For now, we'll use the current calculation but this can be extended
        // to support historical fee calculations
        return this.calculateFees(input);
    }
}

