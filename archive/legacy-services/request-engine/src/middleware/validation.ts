import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';

// Validation middleware factory
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
    return;
  }
  next();
};

// Request validation rules
export const validateRequest = {
  createRequest: [
    body('productId')
      .isUUID()
      .withMessage('Valid product ID is required'),
    body('delivery.origin.country')
      .isLength({ min: 2, max: 100 })
      .withMessage('Origin country must be between 2 and 100 characters'),
    body('delivery.destination.country')
      .isLength({ min: 2, max: 100 })
      .withMessage('Destination country must be between 2 and 100 characters'),
    body('delivery.deadline')
      .isISO8601()
      .withMessage('Valid deadline date is required')
      .custom((value) => {
        if (new Date(value) <= new Date()) {
          throw new Error('Deadline must be in the future');
        }
        return true;
      }),
    body('delivery.instructions')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Delivery instructions must not exceed 1000 characters'),
    body('preferences.packaging')
      .optional()
      .isIn(['STANDARD', 'FRAGILE', 'ELECTRONICS'])
      .withMessage('Invalid packaging type'),
    body('preferences.insurance')
      .optional()
      .isBoolean()
      .withMessage('Insurance must be a boolean'),
    body('preferences.tracking')
      .optional()
      .isBoolean()
      .withMessage('Tracking must be a boolean'),
    body('preferences.urgency')
      .optional()
      .isIn(['STANDARD', 'EXPRESS', 'URGENT'])
      .withMessage('Invalid urgency level'),
    handleValidationErrors
  ],

  updateRequest: [
    body('delivery.origin.country')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Origin country must be between 2 and 100 characters'),
    body('delivery.destination.country')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Destination country must be between 2 and 100 characters'),
    body('delivery.deadline')
      .optional()
      .isISO8601()
      .withMessage('Valid deadline date is required')
      .custom((value) => {
        if (new Date(value) <= new Date()) {
          throw new Error('Deadline must be in the future');
        }
        return true;
      }),
    body('delivery.instructions')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Delivery instructions must not exceed 1000 characters'),
    body('preferences.packaging')
      .optional()
      .isIn(['STANDARD', 'FRAGILE', 'ELECTRONICS'])
      .withMessage('Invalid packaging type'),
    body('preferences.insurance')
      .optional()
      .isBoolean()
      .withMessage('Insurance must be a boolean'),
    body('preferences.tracking')
      .optional()
      .isBoolean()
      .withMessage('Tracking must be a boolean'),
    body('preferences.urgency')
      .optional()
      .isIn(['STANDARD', 'EXPRESS', 'URGENT'])
      .withMessage('Invalid urgency level'),
    handleValidationErrors
  ],

  acceptRequest: [
    body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Reason must not exceed 500 characters'),
    handleValidationErrors
  ],

  updateStatus: [
    body('status')
      .isIn(['IN_PROGRESS', 'DELIVERED'])
      .withMessage('Invalid status transition'),
    body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Reason must not exceed 500 characters'),
    handleValidationErrors
  ]
};

// Product validation rules
export const validateProduct = {
  extractUrl: [
    body('url')
      .isURL()
      .withMessage('Valid URL is required')
      .custom((value) => {
        // Check if URL is from supported e-commerce sites
        const supportedSites = ['amazon', 'ebay', 'shopify', 'woocommerce', 'magento'];
        const isSupported = supportedSites.some(site => value.includes(site));
        if (!isSupported) {
          throw new Error('URL must be from a supported e-commerce site');
        }
        return true;
      }),
    handleValidationErrors
  ]
};

// Common validation rules
export const validateId = [
  param('id')
    .isUUID()
    .withMessage('Valid ID is required'),
  handleValidationErrors
];

// Query parameter validation
export const validateQuery = {
  pagination: [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer'),
    handleValidationErrors
  ],

  dateRange: [
    query('deadlineFrom')
      .optional()
      .isISO8601()
      .withMessage('Valid start date is required'),
    query('deadlineTo')
      .optional()
      .isISO8601()
      .withMessage('Valid end date is required'),
    handleValidationErrors
  ],

  priceRange: [
    query('priceMin')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum price must be a non-negative number'),
    query('priceMax')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum price must be a non-negative number'),
    handleValidationErrors
  ]
};
