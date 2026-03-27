import { Request, Response, NextFunction } from 'express';
import { ResaleService } from '../services/resale.service';

const resaleService = new ResaleService();

export class ResaleController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const sellerId = Number(req.body.sellerId || req.headers['x-user-id'] || 1); // placeholder auth
            const { orderId, price, currency, categoryId, city, country, description } = req.body;

            if (!orderId || !categoryId || !city || !country) {
                return res.status(400).json({ error: 'orderId, categoryId, city, and country are required' });
            }

            const listing = await resaleService.createResaleListing({
                sellerId,
                orderId: Number(orderId),
                price: price ? Number(price) : undefined,
                currency,
                categoryId: Number(categoryId),
                city,
                country,
                description,
            });

            res.status(201).json({ data: listing });
        } catch (err) {
            next(err);
        }
    }
}





