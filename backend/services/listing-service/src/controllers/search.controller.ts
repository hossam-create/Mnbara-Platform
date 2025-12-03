import { Request, Response } from 'express';
import { SearchService } from '../services/search.service';

const searchService = new SearchService();

export class SearchController {
    
    /**
     * Search listings
     * GET /api/search
     */
    async search(req: Request, res: Response) {
        try {
            const { q, category, minPrice, maxPrice, lat, lon, distance, status } = req.query;

            const filters = {
                categoryId: category ? Number(category) : undefined,
                minPrice: minPrice ? Number(minPrice) : undefined,
                maxPrice: maxPrice ? Number(maxPrice) : undefined,
                lat: lat ? Number(lat) : undefined,
                lon: lon ? Number(lon) : undefined,
                distance: distance ? String(distance) : undefined,
                status: status as string
            };

            const results = await searchService.search(q as string, filters);

            return res.json({
                success: true,
                count: results.length,
                data: results
            });
        } catch (error: any) {
            console.error('Search error:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}
