import { param, body } from 'express-validator';

/**
 * Validation rules for getting settlement details
 */
export const getSettlementValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Settlement ID must be a positive integer'),
];

/**
 * Validation rules for PSP webhook
 */
export const pspWebhookValidator = [
  param('provider')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Provider is required'),
  
  body('transactionId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('transactionId is required'),
  
  body('status')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('status is required'),
  
  body('metadata')
    .optional()
    .isObject()
    .withMessage('metadata must be an object'),
];

/**
 * Validation rules for escrow webhook
 */
export const escrowWebhookValidator = [
  param('provider')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Provider is required'),
  
  body('escrowId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('escrowId is required'),
  
  body('status')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('status is required'),
  
  body('metadata')
    .optional()
    .isObject()
    .withMessage('metadata must be an object'),
];
