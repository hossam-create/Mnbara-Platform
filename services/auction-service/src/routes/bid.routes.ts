import { Router } from 'express';
import { BidController } from '../controllers/bid.controller';

const router = Router();
const bidController = new BidController();

// Place a bid
router.post('/', bidController.placeBid);

// Get bids for an auction
router.get('/:auctionId', bidController.getBids);

export default router;
