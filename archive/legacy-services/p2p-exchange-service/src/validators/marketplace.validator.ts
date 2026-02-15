import { query, param } from 'express-validator';

/**
 * Validation rules for browsing marketplace
 */
export const browseMarketplaceValidator = [
  query('fromCurrency')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 3 })
    .toUpperCase()
    .withMessage('fromCurrency must be a 3-letter currency code'),
  
  query('toCurrency')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 3 })
    .toUpperCase()
    .withMessage('toCurrency must be a 3-letter currency code'),
  
  query('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('minAmount must be a positive number'),
  
  query('maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('maxAmount must be a positive number'),
  
  query('minTrustLevel')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('minTrustLevel must be between 1 and 5'),
  
  query('sortBy')
    .optional()
    .isIn(['rate', 'amount', 'reputation', 'createdAt'])
    .withMessage('sortBy must be one of: rate, amount, reputation, createdAt'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be asc or desc'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),
];

/**
 * Validation rules for accepting an offer
 */
export const acceptOfferValidator = [
  param('requestId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Request ID is required'),
];
