import { Router } from 'express';
import { MarketplaceController } from '../controllers/marketplace.controller';
import {
  browseMarketplaceValidator,
  acceptOfferValidator,
} from '../validators/marketplace.validator';

const router = Router();
const controller = new MarketplaceController();

/**
 * @route   GET /api/v1/exchange/marketplace
 * @desc    Browse open exchange requests
 * @access  Private
 */
router.get('/', browseMarketplaceValidator, controller.browseMarketplace);

/**
 * @route   POST /api/v1/exchange/marketplace/:requestId/accept
 * @desc    Accept an exchange offer
 * @access  Private
 */
router.post('/:requestId/accept', acceptOfferValidator, controller.acceptOffer);

export default router;
