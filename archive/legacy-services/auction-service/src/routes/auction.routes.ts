import { Router } from 'express';
import { AuctionController } from '../controllers/auction.controller';

const router = Router();
const auctionController = new AuctionController();

// Create auction
router.post('/', auctionController.createAuction);

// Get all active auctions with filters
router.get('/', auctionController.getAuctions);

// Get single auction by ID
router.get('/:id', auctionController.getAuction);

// Start auction manually (change from SCHEDULED to ACTIVE)
router.post('/:id/start', auctionController.startAuction);

// End auction manually
router.post('/:id/end', auctionController.endAuction);

// Update auto-extend configuration
router.patch('/:id/auto-extend', auctionController.updateAutoExtendConfig);

// Get extension history for an auction
router.get('/:id/extensions', auctionController.getExtensionHistory);

export default router;
