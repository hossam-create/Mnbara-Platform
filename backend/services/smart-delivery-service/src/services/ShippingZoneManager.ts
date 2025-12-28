
export interface ShippingZone {
    id: string;
    name: string;
    countries: string[]; // ISO codes
    baseRate: number;
    perKgRate: number;
    carriers: string[]; // Supported carriers
}

export interface RateRequest {
    originCountry: string;
    destinationCountry: string;
    weightKg: number;
    dimensions?: { l: number; w: number; h: number };
}

export interface ShippingRate {
    carrier: string;
    service: string;
    price: number;
    currency: string;
    estimatedDays: number;
}

export class ShippingZoneManager {
    
    private zones: ShippingZone[] = [
        {
            id: 'ZONE_MENA',
            name: 'Middle East & North Africa',
            countries: ['EG', 'SA', 'AE', 'KW', 'QA', 'BH', 'OM', 'JO'],
            baseRate: 15.00,
            perKgRate: 5.00,
            carriers: ['Mnbara Rush', 'Aramex', 'DHL Express']
        },
        {
            id: 'ZONE_EU',
            name: 'Europe',
            countries: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL'],
            baseRate: 25.00,
            perKgRate: 8.50,
            carriers: ['DHL Express', 'FedEx']
        },
        {
            id: 'ZONE_US',
            name: 'USA & Canada',
            countries: ['US', 'CA'],
            baseRate: 30.00,
            perKgRate: 12.00,
            carriers: ['FedEx', 'UPS']
        }
    ];

    public calculateRates(request: RateRequest): ShippingRate[] {
        const rates: ShippingRate[] = [];
        
        // Find zone
        const zone = this.zones.find(z => z.countries.includes(request.destinationCountry));
        
        if (!zone) {
            // Default "Rest of World" rates
            return [{
                carrier: 'DHL Global',
                service: 'Standard International',
                price: 50 + (request.weightKg * 20),
                currency: 'USD',
                estimatedDays: 10
            }];
        }

        // Generate rates for each carrier in the zone
        for (const carrier of zone.carriers) {
            let basePrice = zone.baseRate + (request.weightKg * zone.perKgRate);
            
            // Carrier adjustments
            if (carrier === 'DHL Express') basePrice *= 1.5;
            if (carrier === 'Mnbara Rush') basePrice *= 0.8; // Internal carrier discount

            rates.push({
                carrier,
                service: carrier === 'Mnbara Rush' ? 'Same-Day / Next-Day' : 'Express Worldwide',
                price: parseFloat(basePrice.toFixed(2)),
                currency: 'USD',
                estimatedDays: this.estimateDays(request.originCountry, request.destinationCountry, carrier)
            });
        }

        return rates;
    }

    private estimateDays(origin: string, dest: string, carrier: string): number {
        if (origin === dest) return 1;
        if (carrier === 'Mnbara Rush') return 2;
        if (carrier === 'DHL Express') return 3;
        return 5;
    }
}
