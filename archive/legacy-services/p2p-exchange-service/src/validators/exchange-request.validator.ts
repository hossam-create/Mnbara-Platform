import { body, param, query } from 'express-validator';

/**
 * Validation rules for creating an exchange request
 */
export const createRequestValidator = [
  body('fromCurrency')
    .isString()
    .trim()
    .isLength({ min: 3, max: 3 })
    .toUpperCase()
    .withMessage('fromCurrency must be a 3-letter currency code'),
  
  body('toCurrency')
    .isString()
    .trim()
    .isLength({ min: 3, max: 3 })
    .toUpperCase()
    .withMessage('toCurrency must be a 3-letter currency code'),
  
  body('fromAmount')
    .isFloat({ min: 0.01 })
    .withMessage('fromAmount must be a positive number'),
  
  body('toAmount')
    .isFloat({ min: 0.01 })
    .withMessage('toAmount must be a positive number'),
  
  body('rate')
    .isFloat({ min: 0.0001 })
    .withMessage('rate must be a positive number'),
  
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('expiresAt must be a valid ISO 8601 date'),
  
  body('preferredSettlement')
    .optional()
    .isIn(['INTERNAL', 'EXTERNAL_ESCROW'])
    .withMessage('preferredSettlement must be INTERNAL or EXTERNAL_ESCROW'),
];

/**
 * Validation rules for getting a single request
 */
export const getRequestValidator = [
  param('id')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Request ID is required'),
];

/**
 * Validation rules for getting user requests
 */
export const getUserRequestsValidator = [
  query('status')
    .optional()
    .isIn(['OPEN', 'MATCHED', 'COMPLETED', 'CANCELLED', 'EXPIRED'])
    .withMessage('Invalid status'),
  
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
 * Validation rules for cancelling a request
 */
export const cancelRequestValidator = [
  param('id')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Request ID is required'),
];
