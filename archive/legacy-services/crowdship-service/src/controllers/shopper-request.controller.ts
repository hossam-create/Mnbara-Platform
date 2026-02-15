import { Request, Response, NextFunction } from 'express';
import { ShopperRequestService } from '../services/shopper-request.service';
import { AICoreIntegrationService } from '../services/ai-core-integration.service';

const shopperService = new ShopperRequestService();

export class ShopperRequestController {
    /**
     * Create shopper request with AI intent classification
     * Sprint 1: AI Core integration for intent + constraints (read-only)
     */
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const buyerId = Number(req.body.buyerId || req.headers['x-user-id'] || 1);
            const { productUrl, price, currency, sourceCountry, destinationCountry } = req.body;
            if (!productUrl) {
                return res.status(400).json({ error: 'productUrl is required' });
            }

            // AI Core: Intent Classification (advisory only)
            const aiCore = new AICoreIntegrationService();
            const intentResult = aiCore.classifyIntent({
                pageContext: '/request/create',
                action: 'submit_request',
                userRole: 'buyer',
            });

            const request = await shopperService.createRequest({
                buyerId,
                productUrl,
                price: price ? Number(price) : undefined,
                currency,
                sourceCountry,
                destinationCountry,
            });

            res.status(201).json({
                data: request,
                aiAdvisory: intentResult ? {
                    intent: intentResult,
                    disclaimer: 'AI advisory output only - no actions executed',
                } : undefined,
            });
        } catch (err) {
            next(err);
        }
    }

    async listForTraveler(req: Request, res: Response, next: NextFunction) {
        try {
            const travelerCountry = (req.query.country as string) || undefined;
            const items = await shopperService.listAvailableForTraveler(travelerCountry);
            res.json({ data: items });
        } catch (err) {
            next(err);
        }
    }
}

