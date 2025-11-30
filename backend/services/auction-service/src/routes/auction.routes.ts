import { Router } from 'express';
import { AuctionController } from '../controllers/auction.controller';

const router = Router();
const auctionController = new AuctionController();

// Create auction
router.post('/', auctionController.createAuction);

// Get all auctions
router.get('/', auctionController.getAuctions);

// Get single auction
router.get('/:id', auctionController.getAuction);

// Start auction manually
router.post('/:id/start', auctionController.startAuction);

// End auction manually
router.post('/:id/end', auctionController.endAuction);

export default router;
