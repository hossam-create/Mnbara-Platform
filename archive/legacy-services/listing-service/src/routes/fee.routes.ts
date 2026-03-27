import { Router } from 'express';
import { body } from 'express-validator';
import { FeeController } from '../controllers/fee.controller';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const feeController = new FeeController();

/**
 * @route   POST /api/v1/fees/calculate
 * @desc    Calculate fees for listing preview
 * @access  Public
 */
router.post(
    '/calculate',
    [
        body('price')
            .notEmpty()
            .withMessage('Price is required')
            .isFloat({ min: 0.01 })
            .withMessage('Price must be a positive number'),
        body('categoryId')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Category ID must be a positive integer'),
        body('listingType')
            .optional()
            .isIn(['buy_now', 'auction'])
            .withMessage('Listing type must be either "buy_now" or "auction"'),
        body('currency')
            .optional()
            .isString()
            .isLength({ min: 3, max: 3 })
            .withMessage('Currency must be a 3-letter code (e.g., USD)'),
    ],
    validateRequest,
    feeController.calculateFees.bind(feeController)
);

/**
 * @route   POST /api/v1/fees/calculate-checkout
 * @desc    Calculate fees for checkout preview
 * @access  Public
 */
router.post(
    '/calculate-checkout',
    [
        body('price')
            .notEmpty()
            .withMessage('Price is required')
            .isFloat({ min: 0.01 })
            .withMessage('Price must be a positive number'),
        body('categoryId')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Category ID must be a positive integer'),
        body('listingType')
            .optional()
            .isIn(['buy_now', 'auction'])
            .withMessage('Listing type must be either "buy_now" or "auction"'),
        body('currency')
            .optional()
            .isString()
            .isLength({ min: 3, max: 3 })
            .withMessage('Currency must be a 3-letter code (e.g., USD)'),
    ],
    validateRequest,
    feeController.calculateCheckoutFees.bind(feeController)
);

export default router;





