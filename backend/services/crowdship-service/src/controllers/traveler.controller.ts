import { Request, Response, NextFunction } from 'express';
import { TravelerService } from '../services/traveler.service';

const travelerService = new TravelerService();

export class TravelerController {
    // Update traveler location (GPS tracking)
    async updateLocation(req: Request, res: Response, next: NextFunction) {
        try {
            const { travelerId } = req.params;
            const { latitude, longitude, country, airportCode } = req.body;

            await travelerService.updateLocation(parseInt(travelerId), {
                latitude,
                longitude,
                country,
                airportCode
            });

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    // Get traveler location
    async getLocation(req: Request, res: Response, next: NextFunction) {
        try {
            const { travelerId } = req.params;
            const location = await travelerService.getLocation(parseInt(travelerId));
            
            if (!location) {
                res.status(404).json({ message: 'Location not found' });
                return;
            }

            res.json(location);
        } catch (error) {
            next(error);
        }
    }

    // Create traveler availability (travel schedule)
    async createAvailability(req: Request, res: Response, next: NextFunction) {
        try {
            const { travelerId } = req.params;
            const availability = await travelerService.addAvailability(parseInt(travelerId), req.body);
            res.status(201).json(availability);
        } catch (error) {
            next(error);
        }
    }

    // Get traveler availability
    async getAvailability(req: Request, res: Response, next: NextFunction) {
        try {
            const { travelerId } = req.params;
            const trips = await travelerService.getTravelerTrips(parseInt(travelerId));
            res.json(trips);
        } catch(error) {
            next(error);
        }
    }

    // Update availability functionality would go here
    async updateAvailability(req: Request, res: Response, next: NextFunction) {
        // Implementation delegated to service update method if exists, or simple strict CRUD
        // For now, keeping as placeholder for route compliance, or removing if not used.
        // Routes defined it, so we need it.
        try {
             res.status(501).json({ message: 'Not implemented' });
        } catch (error) {
            next(error);
        }
    }

    async deleteAvailability(req: Request, res: Response, next: NextFunction) {
        try {
            // Placeholder
            res.status(501).json({ message: 'Not implemented' });
        } catch (error) {
            next(error);
        }
    }

    async getRecommendations(req: Request, res: Response, next: NextFunction) {
        try {
             res.json([]); // Empty array fallback
        } catch (error) {
            next(error);
        }
    }

    async getNearbyRequests(req: Request, res: Response, next: NextFunction) {
        try {
            // const { lat, lon, radius } = req.query;
            // Placeholder: Service integration for nearby requests pending PostGIS
             res.json([]);
        } catch (error) {
            next(error);
        }
    }
}
