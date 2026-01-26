import { param, body, query } from 'express-validator';

/**
 * Validation rules for getting all exchange requests (admin)
 */
export const getAdminRequestsValidator = [
  query('status')
    .optional()
    .isString()
    .trim()
    .withMessage('status must be a string'),
  
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
 * Validation rules for verifying proof (admin)
 */
export const verifyProofValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Proof ID must be a positive integer'),
  
  body('approved')
    .isBoolean()
    .withMessage('approved must be a boolean'),
  
  body('rejectionReason')
    .optional()
    .isString()
    .trim()
    .withMessage('rejectionReason must be a string'),
];

/**
 * Validation rules for retrying settlement (admin)
 */
export const retrySettlementValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Settlement ID must be a positive integer'),
];

/**
 * Validation rules for freezing security deposit (admin)
 */
export const freezeDepositValidator = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('amount must be a positive number'),
  
  body('reason')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('reason is required'),
];
