import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateDropshipRequest = [
    body('supplierId').notEmpty().withMessage('Supplier ID is required'),
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('customerAddress.street').notEmpty().withMessage('Street address is required'),
    body('customerAddress.city').notEmpty().withMessage('City is required'),
    body('customerAddress.state').notEmpty().withMessage('State is required'),
    body('customerAddress.zipCode').notEmpty().withMessage('ZIP code is required'),
    body('customerAddress.country').notEmpty().withMessage('Country is required'),
    
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

export const validateTrackingUpdate = [
    body('trackingNumber').notEmpty().withMessage('Tracking number is required'),
    body('carrier').notEmpty().withMessage('Carrier is required'),
    
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];
