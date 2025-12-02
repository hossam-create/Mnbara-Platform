/**
 * Pricing Service - Calculate delivery costs dynamically
 * Based on: Weight, Distance, Urgency, Item Type
 */

interface PricingParams {
    weight: number;        // in kg
    distance: number;      // in km
    urgency: 'standard' | 'express' | 'same_day';
    itemType: 'electronics' | 'clothing' | 'food' | 'fragile' | 'other';
    insuranceValue?: number; // Optional insurance
}

export class PricingService {
    // Base rates (USD)
    private readonly BASE_FEE = 5.0;
    private readonly PER_KG_RATE = 2.0;
    private readonly PER_KM_RATE = 0.5;

    // Urgency multipliers
    private readonly URGENCY_MULTIPLIERS = {
        standard: 1.0,
        express: 1.5,
        same_day: 2.0
    };

    // Item type fees (fragile items need extra care)
    private readonly ITEM_TYPE_FEES = {
        electronics: 3.0,
        clothing: 0.0,
        food: 2.0,
        fragile: 5.0,
        other: 1.0
    };

    /**
     * Calculate total delivery cost
     */
    calculatePrice(params: PricingParams): number {
        const { weight, distance, urgency, itemType, insuranceValue } = params;

        // 1. Base calculation
        let totalCost = this.BASE_FEE;

        // 2. Weight cost
        totalCost += weight * this.PER_KG_RATE;

        // 3. Distance cost
        totalCost += distance * this.PER_KM_RATE;

        // 4. Item type fee
        totalCost += this.ITEM_TYPE_FEES[itemType] || 0;

        // 5. Apply urgency multiplier
        totalCost *= this.URGENCY_MULTIPLIERS[urgency];

        // 6. Insurance (1% of item value)
        if (insuranceValue && insuranceValue > 0) {
            totalCost += insuranceValue * 0.01;
        }

        // Round to 2 decimal places
        return Math.round(totalCost * 100) / 100;
    }

    /**
     * Calculate platform commission (15% of delivery cost)
     */
    calculateCommission(deliveryCost: number): number {
        return Math.round(deliveryCost * 0.15 * 100) / 100;
    }

    /**
     * Calculate traveler earnings (85% of delivery cost)
     */
    calculateTravelerEarnings(deliveryCost: number): number {
        return Math.round(deliveryCost * 0.85 * 100) / 100;
    }
}
