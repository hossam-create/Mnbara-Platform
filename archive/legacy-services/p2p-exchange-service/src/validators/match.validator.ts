import { param, body } from 'express-validator';

/**
 * Validation rules for getting match details
 */
export const getMatchValidator = [
  param('id')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Match ID is required'),
];

/**
 * Validation rules for initiating payment
 */
export const initiatePaymentValidator = [
  param('id')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Match ID is required'),
  
  body('paymentMethod')
    .optional()
    .isString()
    .trim()
    .withMessage('paymentMethod must be a string'),
  
  body('paymentDetails')
    .optional()
    .isObject()
    .withMessage('paymentDetails must be an object'),
];

/**
 * Validation rules for uploading proof
 */
export const uploadProofValidator = [
  param('id')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Match ID is required'),
  
  body('proofType')
    .isIn(['SCREENSHOT', 'RECEIPT', 'TRANSACTION_ID', 'OTHER'])
    .withMessage('proofType must be SCREENSHOT, RECEIPT, TRANSACTION_ID, or OTHER'),
  
  body('proofUrl')
    .isString()
    .trim()
    .isURL()
    .withMessage('proofUrl must be a valid URL'),
  
  body('description')
    .optional()
    .isString()
    .trim()
    .withMessage('description must be a string'),
];

/**
 * Validation rules for confirming receipt
 */
export const confirmReceiptValidator = [
  param('id')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Match ID is required'),
  
  body('confirmed')
    .isBoolean()
    .withMessage('confirmed must be a boolean'),
  
  body('notes')
    .optional()
    .isString()
    .trim()
    .withMessage('notes must be a string'),
];
