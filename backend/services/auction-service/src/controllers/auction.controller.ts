import { Request, Response, NextFunction } from 'express';
import { AuctionService } from '../services/auction.service';

export class AuctionController {
    private auctionService: AuctionService;

    constructor() {
        this.auctionService = new AuctionService();
    }

    // Create Auction
    createAuction = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // TODO: Get userId from JWT
            const sellerId = 1;

            const auctionData = {
                ...req.body,
                sellerId,
                price: parseFloat(req.body.startingBid), // Base price
                startingBid: parseFloat(req.body.startingBid),
                reservePrice: req.body.reservePrice ? parseFloat(req.body.reservePrice) : null,
                buyNowPrice: req.body.buyNowPrice ? parseFloat(req.body.buyNowPrice) : null,
                auctionEndsAt: new Date(req.body.auctionEndsAt),
            };

            const result = await this.auctionService.createAuction(auctionData);

            res.status(201).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    // Get Auction
    getAuction = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const result = await this.auctionService.getAuction(parseInt(id));

            if (!result) {
                return res.status(404).json({ success: false, message: 'Auction not found' });
            }

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    // Get Active Auctions
    getActiveAuctions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // TODO: Implement filtering in service
            res.json({
                success: true,
                data: [],
                message: 'To be implemented with filters',
            });
        } catch (error) {
            next(error);
        }
    };
}
