import { body } from 'express-validator';

/**
 * Validation rules for adding to security deposit
 */
export const addDepositValidator = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('amount must be a positive number'),
  
  body('currency')
    .isString()
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage('currency must be a 3-letter code'),
];
