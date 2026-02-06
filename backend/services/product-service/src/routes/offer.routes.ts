/**
 * Offer Routes - Make Offer System
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// POST /offers - Create offer
router.post('/', asyncHandler(async (req: Request, res: Response) => {
    const { productId, offerPrice, message } = req.body;
    const buyerId = req.headers['x-buyer-id'] as string || 'test-buyer';

    res.json({
        success: true,
        data: {
            id: 'mock-offer-id',
            productId,
            buyerId,
            offerPrice,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
        }
    });
}));

// GET /offers/received - Get received offers (seller)
router.get('/received', asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['x-seller-id'] as string || 'test-seller';

    res.json({
        success: true,
        data: []
    });
}));

// GET /offers/sent - Get sent offers (buyer)
router.get('/sent', asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['x-buyer-id'] as string || 'test-buyer';

    res.json({
        success: true,
        data: []
    });
}));

// POST /offers/:offerId/accept - Accept offer
router.post('/:offerId/accept', asyncHandler(async (req: Request, res: Response) => {
    const { offerId } = req.params;
    const sellerId = req.headers['x-seller-id'] as string || 'test-seller';

    res.json({
        success: true,
        message: 'Offer accepted',
        data: { offerId, sellerId }
    });
}));

// POST /offers/:offerId/decline - Decline offer
router.post('/:offerId/decline', asyncHandler(async (req: Request, res: Response) => {
    const { offerId } = req.params;
    const sellerId = req.headers['x-seller-id'] as string || 'test-seller';

    res.json({
        success: true,
        message: 'Offer declined',
        data: { offerId, sellerId }
    });
}));

// POST /offers/:offerId/counter - Counter offer
router.post('/:offerId/counter', asyncHandler(async (req: Request, res: Response) => {
    const { offerId } = req.params;
    const { counterPrice, message } = req.body;
    const sellerId = req.headers['x-seller-id'] as string || 'test-seller';

    res.json({
        success: true,
        message: 'Counter offer sent',
        data: { offerId, sellerId, counterPrice }
    });
}));

// POST /offers/:offerId/respond - Respond to counter
router.post('/:offerId/respond', asyncHandler(async (req: Request, res: Response) => {
    const { offerId } = req.params;
    const { accept } = req.body;
    const buyerId = req.headers['x-buyer-id'] as string || 'test-buyer';

    res.json({
        success: true,
        message: accept ? 'Counter offer accepted' : 'Counter offer declined',
        data: { offerId, buyerId, accept }
    });
}));

// POST /offers/:offerId/withdraw - Withdraw offer
router.post('/:offerId/withdraw', asyncHandler(async (req: Request, res: Response) => {
    const { offerId } = req.params;
    const userId = req.headers['x-user-id'] as string || 'test-user';

    res.json({
        success: true,
        message: 'Offer withdrawn',
        data: { offerId, userId }
    });
}));

export { router as offerRoutes };
