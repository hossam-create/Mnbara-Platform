import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';

const router = Router();
const reviewController = new ReviewController();

// Review routes
router.post('/', reviewController.createReview.bind(reviewController));
router.get('/', reviewController.getReviews.bind(reviewController));
router.get('/:id', reviewController.getReview.bind(reviewController));
router.put('/:id', reviewController.updateReview.bind(reviewController));
router.delete('/:id', reviewController.deleteReview.bind(reviewController));

// Vote routes
router.post('/:id/vote', reviewController.voteHelpful.bind(reviewController));

// Report routes
router.post('/:id/report', reviewController.reportReview.bind(reviewController));

// Product rating summary
router.get('/product/:productId/summary', reviewController.getProductRatingSummary.bind(reviewController));

// User's review for product
router.get('/product/:productId/user', reviewController.getUserReviewForProduct.bind(reviewController));

export default router;
