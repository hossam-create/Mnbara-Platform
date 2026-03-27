import { Request, Response } from 'express';
import { ShippingZoneManager, RateRequest } from '../services/ShippingZoneManager';

export class LogisticsController {
    
    private zoneManager: ShippingZoneManager;

    constructor() {
        this.zoneManager = new ShippingZoneManager();
    }

    /**
     * POST /logistics/rates
     * Calculate shipping rates for a potential shipment.
     */
    public async getRates(req: Request, res: Response) {
        try {
            const { originCountry, destinationCountry, weightKg, dimensions } = req.body;

            if (!originCountry || !destinationCountry || !weightKg) {
                return res.status(400).json({ error: 'Missing required fields: originCountry, destinationCountry, weightKg' });
            }

            const request: RateRequest = {
                originCountry,
                destinationCountry,
                weightKg: Number(weightKg),
                dimensions
            };

            const rates = this.zoneManager.calculateRates(request);

            return res.json({
                origin: originCountry,
                destination: destinationCountry,
                rates
            });

        } catch (error) {
            console.error('Error calculating rates:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    /**
     * POST /logistics/label
     * Mock label generation.
     */
    public async generateLabel(req: Request, res: Response) {
        const { shipmentId } = req.body;
        // Mock response
        return res.json({
            shipmentId,
            trackingNumber: `MNB-${Math.floor(Math.random() * 1000000)}`,
            labelUrl: `https://api.mnbara.com/labels/${shipmentId}.pdf`,
            status: 'CREATED'
        });
    }
}
