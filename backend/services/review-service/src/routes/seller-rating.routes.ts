import { Router } from 'express';
import { SellerRatingController } from '../controllers/seller-rating.controller';

const router = Router();
const sellerRatingController = new SellerRatingController();

// Seller rating routes
router.post('/', sellerRatingController.createRating.bind(sellerRatingController));
router.get('/seller/:sellerId', sellerRatingController.getSellerRatings.bind(sellerRatingController));
router.get('/seller/:sellerId/summary', sellerRatingController.getSellerRatingSummary.bind(sellerRatingController));
router.get('/seller/:sellerId/buyer', sellerRatingController.getBuyerRatingForSeller.bind(sellerRatingController));

export default router;
