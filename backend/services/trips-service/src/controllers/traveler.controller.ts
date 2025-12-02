import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface LocationUpdate {
    travelerId: number;
    lat: number;
    lon: number;
    country?: string;
    city?: string;
    airportCode?: string;
}

export class TravelerController {
    
    /**
     * Update traveler's current location
     * POST /api/travelers/:travelerId/location
     */
    async updateLocation(req: Request, res: Response) {
        try {
            const travelerId = parseInt(req.params.travelerId);
            const { lat, lon, country, city, airportCode } = req.body;

            if (!lat || !lon) {
                return res.status(400).json({ 
                    error: 'Missing required fields: lat, lon' 
                });
            }

            // Use PostGIS to store location
            const locationPoint = `POINT(${lon} ${lat})`;

            // Upsert traveler location
            const location = await prisma.$executeRaw`
                INSERT INTO traveler_locations (traveler_id, location, country, city, airport_code, last_updated)
                VALUES (
                    ${travelerId},
                    ST_SetSRID(ST_GeomFromText(${locationPoint}), 4326)::geography,
                    ${country || null},
                    ${city || null},
                    ${airportCode || null},
                    NOW()
                )
                ON CONFLICT (traveler_id) 
                DO UPDATE SET
                    location = ST_SetSRID(ST_GeomFromText(${locationPoint}), 4326)::geography,
                    country = ${country || null},
                    city = ${city || null},
                    airport_code = ${airportCode || null},
                    last_updated = NOW()
            `;

            // Publish event to RabbitMQ (location updated)
            // TODO: Implement RabbitMQ publish
            await this.publishLocationEvent({
                travelerId,
                lat,
                lon,
                country,
                city,
                airportCode
            });

            return res.status(204).send();

        } catch (error: any) {
            console.error('Update location error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get traveler's current location
     * GET /api/travelers/:travelerId/location
     */
    async getLocation(req: Request, res: Response) {
        try {
            const travelerId = parseInt(req.params.travelerId);

            const result = await prisma.$queryRaw<any[]>`
                SELECT 
                    traveler_id,
                    ST_X(location::geometry) as lon,
                    ST_Y(location::geometry) as lat,
                    country,
                    city,
                    airport_code,
                    last_updated
                FROM traveler_locations
                WHERE traveler_id = ${travelerId}
            `;

            if (!result || result.length === 0) {
                return res.status(404).json({ error: 'Location not found' });
            }

            return res.json({
                success: true,
                data: result[0]
            });

        } catch (error: any) {
            console.error('Get location error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Publish location update event to RabbitMQ
     */
    private async publishLocationEvent(location: LocationUpdate) {
        // TODO: Implement actual RabbitMQ publish
        console.log('[RabbitMQ] Location updated:', location);
        
        // This will trigger:
        // 1. Recommendation service to check nearby requests
        // 2. Matching service to find suitable orders
        // 3. Notification service to alert about opportunities
    }
}
