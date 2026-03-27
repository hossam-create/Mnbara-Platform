import { Request, Response, NextFunction } from 'express';
import { OfferService } from '../services/offer.service';
import { OrderConversionService } from '../services/order-conversion.service';
import { 
    AICoreIntegrationService, 
    TrustLevel,
    DecisionRecommendationResult 
} from '../services/ai-core-integration.service';

const offerService = new OfferService();
const orderConversionService = new OrderConversionService();

export class OfferController {
    /**
     * Create offer with AI trust/risk assessment
     * Sprint 1: Traveler offer review pipeline integration
     */
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const travelerId = Number(req.body.travelerId || req.headers['x-user-id'] || 1);
            const { requestId, listedPrice, estimatedTax, estimatedShipping, platformFee, travelerProfit, counterNote } = req.body;
            if (!requestId || !listedPrice) {
                return res.status(400).json({ error: 'requestId and listedPrice are required' });
            }

            const offer = await offerService.createOffer({
                requestId: Number(requestId),
                travelerId,
                listedPrice: Number(listedPrice),
                estimatedTax: estimatedTax ? Number(estimatedTax) : 0,
                estimatedShipping: estimatedShipping ? Number(estimatedShipping) : 0,
                platformFee: platformFee ? Number(platformFee) : 0,
                travelerProfit: travelerProfit ? Number(travelerProfit) : 0,
                counterNote,
            });

            // AI Core: Trust scoring for traveler (advisory only)
            const aiCore = new AICoreIntegrationService();
            const travelerTrust = aiCore.computeTrustScore({
                userId: String(travelerId),
                role: 'TRAVELER',
                isEmailVerified: true, // TODO: fetch from user service
                isPhoneVerified: false,
                is2FAEnabled: false,
                totalTransactions: 0,
                successfulTransactions: 0,
                accountCreatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // placeholder
                averageRating: 0,
                totalRatings: 0,
                disputesRaised: 0,
                disputesLost: 0,
                responseRate: 0.8,
                kycLevel: 'basic',
                passportVerified: false,
                totalDeliveries: 0,
                successfulDeliveries: 0,
                onTimeDeliveries: 0,
            });

            res.status(201).json({
                data: offer,
                aiAdvisory: travelerTrust ? {
                    travelerTrust,
                    disclaimer: 'AI advisory output only - no actions executed',
                } : undefined,
            });
        } catch (err) {
            next(err);
        }
    }

    async buyerAction(req: Request, res: Response, next: NextFunction) {
        try {
            const buyerId = Number(req.body.buyerId || req.headers['x-user-id'] || 1);
            const { action, counterData } = req.body;
            const offerId = Number(req.params.id);
            const result = await offerService.buyerDecision({
                offerId,
                action,
                buyerId,
                counterData,
            });
            res.json({ data: result });
        } catch (err) {
            next(err);
        }
    }

    async travelerAction(req: Request, res: Response, next: NextFunction) {
        try {
            const travelerId = Number(req.body.travelerId || req.headers['x-user-id'] || 1);
            const { action, counterData } = req.body;
            const offerId = Number(req.params.id);
            const result = await offerService.travelerDecision({
                offerId,
                action,
                travelerId,
                counterData,
            });
            res.json({ data: result });
        } catch (err) {
            next(err);
        }
    }

    async submitTravel(req: Request, res: Response, next: NextFunction) {
        try {
            const travelerId = Number(req.body.travelerId || req.headers['x-user-id'] || 1);
            const offerId = Number(req.params.id);
            const { departureDate, arrivalDate } = req.body;
            const result = await offerService.submitTravelDetails({
                offerId,
                travelerId,
                departure: departureDate,
                arrival: arrivalDate,
            });
            res.json({ data: result });
        } catch (err) {
            next(err);
        }
    }

    async buyerTravelDecision(req: Request, res: Response, next: NextFunction) {
        try {
            const buyerId = Number(req.body.buyerId || req.headers['x-user-id'] || 1);
            const offerId = Number(req.params.id);
            const { approve } = req.body;
            const result = await offerService.buyerTravelDecision({
                offerId,
                buyerId,
                approve: Boolean(approve),
            });
            res.json({ data: result });
        } catch (err) {
            next(err);
        }
    }

    async convertToOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const offerId = Number(req.params.id);
            const link = await orderConversionService.convertToOrder({ offerId });
            res.status(201).json({ data: link });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get AI recommendation for offer comparison
     * Sprint 1: Buyer-facing recommendations (advisory only)
     * NO payments, NO escrow execution, NO auto-approval
     */
    async getAIRecommendation(req: Request, res: Response, next: NextFunction) {
        try {
            const offerId = Number(req.params.id);
            const buyerId = Number(req.query.buyerId || req.headers['x-user-id'] || 1);
            
            // Mock data - in production, fetch from database
            const requestId = String(offerId);
            const travelerId = '1';

            const aiCore = new AICoreIntegrationService();

            // Compute trust scores
            const buyerTrust = aiCore.computeTrustScore({
                userId: String(buyerId),
                role: 'BUYER',
                isEmailVerified: true,
                isPhoneVerified: true,
                is2FAEnabled: false,
                totalTransactions: 5,
                successfulTransactions: 5,
                accountCreatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
                averageRating: 4.5,
                totalRatings: 3,
                disputesRaised: 0,
                disputesLost: 0,
                responseRate: 0.9,
                kycLevel: 'basic',
            });

            const travelerTrust = aiCore.computeTrustScore({
                userId: travelerId,
                role: 'TRAVELER',
                isEmailVerified: true,
                isPhoneVerified: true,
                is2FAEnabled: true,
                totalTransactions: 10,
                successfulTransactions: 9,
                accountCreatedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                averageRating: 4.8,
                totalRatings: 8,
                disputesRaised: 1,
                disputesLost: 0,
                responseRate: 0.95,
                kycLevel: 'enhanced',
                passportVerified: true,
                totalDeliveries: 10,
                successfulDeliveries: 9,
                onTimeDeliveries: 8,
            });

            if (!buyerTrust || !travelerTrust) {
                return res.json({ data: null, message: 'AI features disabled' });
            }

            // Assess risk
            const riskAssessment = aiCore.assessRisk({
                requestId,
                itemValue: 250,
                currency: 'USD',
                buyerTrust,
                travelerTrust,
                originCountry: 'US',
                destinationCountry: 'EG',
                itemCategory: 'electronics',
                buyerAccountAgeDays: 60,
                travelerAccountAgeDays: 90,
            });

            if (!riskAssessment) {
                return res.json({ data: null, message: 'AI risk assessment disabled' });
            }

            // Generate recommendation
            const recommendation = aiCore.generateRecommendation({
                requestId,
                travelerId,
                buyerTrust,
                travelerTrust,
                riskAssessment,
            });

            res.json({
                data: {
                    offerId,
                    buyerTrust,
                    travelerTrust,
                    riskAssessment,
                    recommendation,
                },
                meta: {
                    advisory: true,
                    disclaimer: 'This is an advisory recommendation only. No actions have been executed.',
                },
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get audit logs for AI operations
     * Sprint 1: Full auditability requirement
     */
    async getAuditLogs(req: Request, res: Response, next: NextFunction) {
        try {
            const operation = req.query.operation as string | undefined;
            const limit = Number(req.query.limit) || 50;
            
            const logs = AICoreIntegrationService.getAuditLogs({ operation, limit });
            
            res.json({
                data: logs,
                meta: {
                    count: logs.length,
                    advisory: true,
                },
            });
        } catch (err) {
            next(err);
        }
    }
}

