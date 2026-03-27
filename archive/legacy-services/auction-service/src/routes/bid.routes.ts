import { Router } from 'express';
import { BidController } from '../controllers/bid.controller';

const router = Router();
const bidController = new BidController();

// Place a bid on an auction
router.post('/:auctionId', bidController.placeBid);

// Get bids for an auction
router.get('/:auctionId', bidController.getBids);

// Setup proxy bid (automatic bidding)
router.post('/:auctionId/proxy', bidController.setupProxyBid);

export default router;
