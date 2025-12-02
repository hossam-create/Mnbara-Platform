import { Request, Response } from 'express';
import { PricingService } from '../services/pricing.service';
import { TrackingService } from '../services/tracking.service';

const pricingService = new PricingService();
const trackingService = new TrackingService();

export class DeliveryController {
    
    /**
     * Calculate delivery price
     * POST /api/delivery/calculate-price
     */
    async calculatePrice(req: Request, res: Response) {
        try {
            const { weight, distance, urgency, itemType, insuranceValue } = req.body;

            if (!weight || !distance || !urgency || !itemType) {
                return res.status(400).json({ 
                    error: 'Missing required fields: weight, distance, urgency, itemType' 
                });
            }

            const deliveryCost = pricingService.calculatePrice({
                weight,
                distance,
                urgency,
                itemType,
                insuranceValue
            });

            const commission = pricingService.calculateCommission(deliveryCost);
            const travelerEarnings = pricingService.calculateTravelerEarnings(deliveryCost);

            return res.json({
                success: true,
                pricing: {
                    deliveryCost,
                    platformCommission: commission,
                    travelerEarnings,
                    breakdown: {
                        weight: `${weight} kg`,
                        distance: `${distance} km`,
                        urgency,
                        itemType,
                        insurance: insuranceValue ? `$${insuranceValue}` : 'None'
                    }
                }
            });

        } catch (error: any) {
            console.error('Calculate price error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Update shipment tracking
     * POST /api/delivery/tracking/update
     */
    async updateTracking(req: Request, res: Response) {
        try {
            const { shipmentId, status, location, notes } = req.body;

            if (!shipmentId || !status) {
                return res.status(400).json({ 
                    error: 'Missing required fields: shipmentId, status' 
                });
            }

            const result = await trackingService.updateStatus({
                shipmentId,
                status,
                location,
                notes
            });

            return res.json({
                success: true,
                data: result
            });

        } catch (error: any) {
            console.error('Update tracking error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get tracking history
     * GET /api/delivery/tracking/:shipmentId
     */
    async getTracking(req: Request, res: Response) {
        try {
            const shipmentId = parseInt(req.params.shipmentId);

            if (!shipmentId) {
                return res.status(400).json({ error: 'Invalid shipment ID' });
            }

            const tracking = await trackingService.getTrackingHistory(shipmentId);

            if (!tracking) {
                return res.status(404).json({ error: 'Shipment not found' });
            }

            return res.json({
                success: true,
                data: tracking
            });

        } catch (error: any) {
            console.error('Get tracking error:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}
