import { Router } from 'express';
import { body, query } from 'express-validator';
import { ListingController } from '../controllers/listing.controller';
import { ListingWebhookController } from '../controllers/listing-webhook.controller';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const listingController = new ListingController();
const webhookController = new ListingWebhookController();

// Create listing
router.post(
    '/',
    [
        body('title').notEmpty().withMessage('Title required').isLength({ max: 200 }),
        body('description').notEmpty().withMessage('Description required'),
        body('price').isFloat({ min: 0 }).withMessage('Valid price required'),
        body('categoryId').isInt().withMessage('Category ID required'),
        body('city').notEmpty().withMessage('City required'),
        body('country').notEmpty().withMessage('Country required'),
    ],
    validateRequest,
    listingController.createListing
);

// Get listings (search/filter)
router.get(
    '/',
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('categoryId').optional().isInt(),
        query('minPrice').optional().isFloat({ min: 0 }),
        query('maxPrice').optional().isFloat({ min: 0 }),
        query('search').optional().isString(),
    ],
    validateRequest,
    listingController.getListings
);

// Get single listing
router.get('/:id', listingController.getListing);

// Update listing
router.put(
    '/:id',
    [
        body('title').optional().isLength({ max: 200 }),
        body('price').optional().isFloat({ min: 0 }),
    ],
    validateRequest,
    listingController.updateListing
);

// Delete listing
router.delete('/:id', listingController.deleteListing);

// Upload images
router.post('/:id/images', listingController.uploadImages);

// Mark as sold
router.patch('/:id/sold', listingController.markAsSold);

// Featured listings
router.get('/featured/all', listingController.getFeaturedListings);

// Decision Authority Webhook Routes
router.post(
  '/webhooks/decisions',
  [
    body('decisionId').notEmpty().withMessage('Decision ID required'),
    body('assetId').notEmpty().withMessage('Asset ID required'),
    body('status').notEmpty().withMessage('Status required')
  ],
  validateRequest,
  webhookController.handleDecisionStatusUpdate
);

// Get listing decision status
router.get('/:id/decision', webhookController.getListingDecisionStatus);

export default router;
