import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { RabbitMQService } from '../../../shared/rabbitmq.service';

const prisma = new PrismaClient();

export class MatchingController {
    
    /**
     * Get nearby buyer requests based on traveler's location
     * GET /api/nearby-requests?lat=x&lon=y&radius_km=10
     */
    async getNearbyRequests(req: Request, res: Response) {
        try {
            const lat = parseFloat(req.query.lat as string);
            const lon = parseFloat(req.query.lon as string);
            const radiusKm = parseFloat(req.query.radius_km as string) || 10;

            if (!lat || !lon) {
                return res.status(400).json({ 
                    error: 'Missing required parameters: lat, lon' 
                });
            }

            // Convert km to meters for PostGIS
            const radiusMeters = radiusKm * 1000;

            // Query using PostGIS ST_DWithin for geo-spatial search
            const nearbyOrders = await prisma.$queryRaw<any[]>`
                SELECT 
                    o.id,
                    o.product_name,
                    o.product_price,
                    o.delivery_fee,
                    o.pickup_location,
                    o.delivery_location,
                    o.status,
                    ST_X(l.location::geometry) as lon,
                    ST_Y(l.location::geometry) as lat,
                    ST_Distance(
                        l.location,
                        ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography
                    ) / 1000 as distance_km,
                    u.first_name as buyer_name,
                    u.rating as buyer_rating
                FROM orders o
                LEFT JOIN listings l ON o.listing_id = l.id
                LEFT JOIN users u ON o.buyer_id = u.id
                WHERE o.status IN ('REQUESTED', 'MATCHED')
                AND l.location IS NOT NULL
                AND ST_DWithin(
                    l.location,
                    ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
                    ${radiusMeters}
                )
                ORDER BY distance_km ASC
                LIMIT 50
            `;

            return res.json({
                success: true,
                location: { lat, lon },
                radius_km: radiusKm,
                count: nearbyOrders.length,
                data: nearbyOrders
            });

        } catch (error: any) {
            console.error('Get nearby requests error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Match traveler with an order
     * POST /api/match
     */
    async matchTravelerWithOrder(req: Request, res: Response) {
        try {
            const { travelerId, orderId } = req.body;

            if (!travelerId || !orderId) {
                return res.status(400).json({ 
                    error: 'Missing required fields: travelerId, orderId' 
                });
            }

            // Update order status to MATCHED
            const order = await prisma.order.update({
                where: { id: orderId },
                data: {
                    travelerId,
                    status: 'MATCHED',
                    updatedAt: new Date()
                }
            });

            // Publish match event to RabbitMQ
            await this.publishMatchEvent({
                orderId,
                travelerId,
                matchedAt: new Date()
            });

            return res.json({
                success: true,
                message: 'Match successful',
                data: order
            });

        } catch (error: any) {
            console.error('Match error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Publish match event to RabbitMQ
     */
    private async publishMatchEvent(match: any) {
        try {
            await RabbitMQService.publishEvent('order.matched', match);
            console.log('[RabbitMQ] Order matched event published:', match);
        } catch (error) {
            console.error('Failed to publish match event:', error);
            // Non-blocking error, we don't want to fail the request if MQ is down
        }
    }
}
